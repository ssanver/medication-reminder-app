using System.Security.Cryptography;
using System.Text;
using api.contracts;
using api.data;
using api.models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace api.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class AuthController(AppDbContext dbContext, IWebHostEnvironment hostEnvironment) : ControllerBase
{
    private const int ResendCooldownSeconds = 60;
    private static readonly TimeSpan VerificationValidity = TimeSpan.FromDays(3);
    private static readonly TimeSpan LockoutDuration = TimeSpan.FromMinutes(15);
    private const int MaxAttempts = 5;

    [HttpPost("social-login")]
    public ActionResult<SocialLoginResponse> SocialLogin([FromBody] SocialLoginRequest request)
    {
        var provider = request.Provider.Trim().ToLowerInvariant();

        if (provider is not ("apple" or "google"))
        {
            return BadRequest("Provider must be 'apple' or 'google'.");
        }

        if (string.IsNullOrWhiteSpace(request.ProviderToken))
        {
            return BadRequest("Provider token is required.");
        }

        var now = DateTimeOffset.UtcNow;
        var providerName = provider == "apple" ? "Apple" : "Google";

        return Ok(new SocialLoginResponse
        {
            Provider = providerName,
            AccessToken = $"{provider}-at-{Guid.NewGuid():N}",
            RefreshToken = $"{provider}-rt-{Guid.NewGuid():N}",
            ExpiresAt = now.AddHours(1),
            DisplayName = providerName == "Apple" ? "Apple User" : "Google User",
            Email = providerName == "Apple" ? "apple.user@pillmind.app" : "google.user@pillmind.app",
        });
    }

    [HttpPost("email/request-verification")]
    public async Task<ActionResult<EmailVerificationRequestResponse>> RequestVerificationCode([FromBody] EmailVerificationRequest request)
    {
        var normalizedEmail = NormalizeEmail(request.Email);
        if (normalizedEmail is null)
        {
            return BadRequest("Email is required.");
        }

        var now = DateTimeOffset.UtcNow;
        var active = await GetLatestToken(normalizedEmail);
        if (active is not null && active.VerifiedAt.HasValue)
        {
            return Ok(new EmailVerificationRequestResponse
            {
                Email = normalizedEmail,
                Sent = false,
                ExpiresAt = active.ExpiresAt,
            });
        }

        if (active is not null)
        {
            var seconds = GetCooldownSeconds(active.LastSentAt, now);
            if (seconds > 0)
            {
                return StatusCode(StatusCodes.Status429TooManyRequests, new EmailVerificationRequestResponse
                {
                    Email = normalizedEmail,
                    Sent = false,
                    ResendAvailableInSeconds = seconds,
                    ExpiresAt = active.ExpiresAt,
                });
            }
        }

        var code = GenerateCode();
        var token = new EmailVerificationToken
        {
            Id = Guid.NewGuid(),
            Email = normalizedEmail,
            CodeHash = HashCode(code),
            ExpiresAt = now.Add(VerificationValidity),
            AttemptCount = 0,
            LastSentAt = now,
            CreatedAt = now,
            UpdatedAt = now,
        };

        dbContext.EmailVerificationTokens.Add(token);
        await dbContext.SaveChangesAsync();

        return Ok(new EmailVerificationRequestResponse
        {
            Email = normalizedEmail,
            Sent = true,
            ExpiresAt = token.ExpiresAt,
            DebugCode = hostEnvironment.IsDevelopment() ? code : null,
        });
    }

    [HttpPost("email/resend-verification")]
    public async Task<ActionResult<EmailVerificationRequestResponse>> ResendVerificationCode([FromBody] EmailVerificationRequest request)
    {
        return await RequestVerificationCode(request);
    }

    [HttpGet("email/verification-status")]
    public async Task<ActionResult<EmailVerificationStatusResponse>> GetVerificationStatus([FromQuery] string email)
    {
        var normalizedEmail = NormalizeEmail(email);
        if (normalizedEmail is null)
        {
            return BadRequest("Email is required.");
        }

        var now = DateTimeOffset.UtcNow;
        var latest = await GetLatestToken(normalizedEmail);
        if (latest is null)
        {
            return Ok(new EmailVerificationStatusResponse
            {
                Email = normalizedEmail,
                IsVerified = false,
            });
        }

        return Ok(new EmailVerificationStatusResponse
        {
            Email = normalizedEmail,
            IsVerified = latest.VerifiedAt.HasValue,
            ResendAvailableInSeconds = latest.VerifiedAt.HasValue ? null : GetCooldownSeconds(latest.LastSentAt, now),
            LockedUntil = latest.LockedUntil,
            ExpiresAt = latest.ExpiresAt,
        });
    }

    [HttpPost("email/verify-code")]
    public async Task<ActionResult<VerifyEmailCodeResponse>> VerifyCode([FromBody] VerifyEmailCodeRequest request)
    {
        var normalizedEmail = NormalizeEmail(request.Email);
        if (normalizedEmail is null)
        {
            return BadRequest("Email is required.");
        }

        var code = request.Code?.Trim();
        if (string.IsNullOrWhiteSpace(code) || code.Length != 6 || !code.All(char.IsDigit))
        {
            return BadRequest("Code must be a 6-digit number.");
        }

        var now = DateTimeOffset.UtcNow;
        var token = await GetLatestToken(normalizedEmail);
        if (token is null)
        {
            return NotFound("Verification request not found.");
        }

        if (token.VerifiedAt.HasValue)
        {
            return Ok(new VerifyEmailCodeResponse
            {
                Email = normalizedEmail,
                IsVerified = true,
            });
        }

        if (token.ExpiresAt < now)
        {
            return BadRequest("Verification code is expired.");
        }

        if (token.LockedUntil.HasValue && token.LockedUntil.Value > now)
        {
            return BadRequest($"Verification is temporarily locked until {token.LockedUntil.Value:O}.");
        }

        if (!SecureEquals(token.CodeHash, HashCode(code)))
        {
            token.AttemptCount += 1;
            token.UpdatedAt = now;
            if (token.AttemptCount >= MaxAttempts)
            {
                token.LockedUntil = now.Add(LockoutDuration);
                token.AttemptCount = 0;
            }

            await dbContext.SaveChangesAsync();
            return BadRequest("Verification code is invalid.");
        }

        token.VerifiedAt = now;
        token.LockedUntil = null;
        token.AttemptCount = 0;
        token.UpdatedAt = now;
        await dbContext.SaveChangesAsync();

        return Ok(new VerifyEmailCodeResponse
        {
            Email = normalizedEmail,
            IsVerified = true,
        });
    }

    private async Task<EmailVerificationToken?> GetLatestToken(string normalizedEmail)
    {
        return await dbContext.EmailVerificationTokens
            .OrderByDescending(item => item.CreatedAt)
            .FirstOrDefaultAsync(item => item.Email == normalizedEmail);
    }

    private static int GetCooldownSeconds(DateTimeOffset lastSentAt, DateTimeOffset now)
    {
        var diff = ResendCooldownSeconds - (int)Math.Floor((now - lastSentAt).TotalSeconds);
        return Math.Max(diff, 0);
    }

    private static string? NormalizeEmail(string? email)
    {
        if (string.IsNullOrWhiteSpace(email))
        {
            return null;
        }

        return email.Trim().ToLowerInvariant();
    }

    private static string GenerateCode()
    {
        var number = RandomNumberGenerator.GetInt32(0, 1_000_000);
        return $"{number:D6}";
    }

    private static string HashCode(string code)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(code));
        return Convert.ToHexString(bytes);
    }

    private static bool SecureEquals(string a, string b)
    {
        var left = Encoding.UTF8.GetBytes(a);
        var right = Encoding.UTF8.GetBytes(b);
        return CryptographicOperations.FixedTimeEquals(left, right);
    }
}
