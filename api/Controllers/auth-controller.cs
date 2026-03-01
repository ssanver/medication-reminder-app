using System.Security.Cryptography;
using System.Security.Claims;
using System.Text;
using api.contracts;
using api.data;
using api.models;
using api.services.auth;
using api.services.security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace api.Controllers;

[ApiController]
[AllowAnonymous]
[Route("api/[controller]")]
public sealed class AuthController(
    AppDbContext dbContext,
    IWebHostEnvironment hostEnvironment,
    IConfiguration configuration,
    IEmailDispatchService emailDispatchService,
    IJwtTokenService jwtTokenService,
    ILogger<AuthController> logger) : ControllerBase
{
    private const int ResendCooldownSeconds = 60;
    private const int MinPasswordLength = 6;
    private const int PasswordIterationCount = 100_000;
    private const int PasswordSaltLength = 16;
    private const int PasswordHashLength = 32;
    private static readonly TimeSpan VerificationValidity = TimeSpan.FromDays(3);
    private static readonly TimeSpan LockoutDuration = TimeSpan.FromMinutes(15);
    private const int MaxAttempts = 5;

    [HttpPost("social-login")]
    public async Task<ActionResult<SocialLoginResponse>> SocialLogin([FromBody] SocialLoginRequest request)
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
        var defaultUserEmail = DefaultUserReference.Resolve(configuration);
        var user = await dbContext.UserAccounts.FirstOrDefaultAsync(x => x.Email == defaultUserEmail);
        if (user is null)
        {
            user = new UserAccount
            {
                Id = Guid.NewGuid(),
                FirstName = providerName,
                LastName = "User",
                Email = defaultUserEmail,
                PasswordHash = $"social-{provider}",
                FullName = $"{providerName} User",
                BirthDate = string.Empty,
                Gender = string.Empty,
                PhotoUri = string.Empty,
                IsEmailVerified = true,
                EmailVerifiedAt = now,
                CreatedAt = now,
                UpdatedAt = now,
                LastLoginAt = now,
                Role = UserRole.Member,
            };

            dbContext.UserAccounts.Add(user);
            await dbContext.SaveChangesAsync();
        }
        else
        {
            user.LastLoginAt = now;
            user.UpdatedAt = now;
            await dbContext.SaveChangesAsync();
        }

        return Ok(new SocialLoginResponse
        {
            Provider = providerName,
            AccessToken = jwtTokenService.CreateAccessToken(user, now),
            RefreshToken = $"{provider}-rt-{Guid.NewGuid():N}",
            ExpiresAt = jwtTokenService.GetAccessTokenExpiry(now),
            DisplayName = providerName == "Apple" ? "Apple User" : "Google User",
            Email = user.Email,
        });
    }

    [HttpPost("guest/session")]
    public async Task<ActionResult<EmailAuthResponse>> CreateGuestSession([FromBody] GuestSessionRequest? request = null)
    {
        var now = DateTimeOffset.UtcNow;
        var headerDeviceId = HttpContext?.Request?.Headers["X-Device-Id"].FirstOrDefault();
        var deviceId = NormalizeDeviceId(request?.DeviceId ?? headerDeviceId);
        var guestId = BuildGuestIdFromDevice(deviceId);
        var guestEmail = BuildGuestEmailFromDevice(deviceId);
        var guestUser = await dbContext.UserAccounts.FirstOrDefaultAsync(x => x.Email == guestEmail);
        if (guestUser is null)
        {
            guestUser = new UserAccount
            {
                Id = guestId,
                FirstName = "Guest",
                LastName = "User",
                Email = guestEmail,
                PasswordHash = "guest-session-only-account",
                FullName = "Guest User",
                BirthDate = string.Empty,
                Gender = string.Empty,
                PhotoUri = string.Empty,
                IsEmailVerified = true,
                EmailVerifiedAt = now,
                CreatedAt = now,
                UpdatedAt = now,
                LastLoginAt = now,
                Role = UserRole.Visitor,
            };
            dbContext.UserAccounts.Add(guestUser);
        }
        else
        {
            guestUser.FirstName = "Guest";
            guestUser.LastName = "User";
            guestUser.FullName = "Guest User";
            guestUser.IsEmailVerified = true;
            guestUser.EmailVerifiedAt = now;
            guestUser.LastLoginAt = now;
            guestUser.UpdatedAt = now;
            guestUser.Role = UserRole.Visitor;
        }

        await dbContext.SaveChangesAsync();
        var accessToken = jwtTokenService.CreateAccessToken(
            subject: guestId.ToString(),
            email: guestEmail,
            displayName: "Guest User",
            now: now,
            additionalClaims: new[]
            {
                new Claim("is_guest", "true"),
                new Claim("device_id", deviceId),
                new Claim(ClaimTypes.Role, UserRole.Visitor),
                new Claim("role", UserRole.Visitor),
            });

        return Ok(new EmailAuthResponse
        {
            UserId = guestId,
            FirstName = "Guest",
            LastName = "User",
            Email = guestEmail,
            IsEmailVerified = true,
            AccessToken = accessToken,
            RefreshToken = $"guest-rt-{Guid.NewGuid():N}",
            ExpiresAt = jwtTokenService.GetAccessTokenExpiry(now),
        });
    }

    private static string NormalizeDeviceId(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return "unknown-device";
        }

        var normalized = value.Trim().ToLowerInvariant();
        if (normalized.Length > 128)
        {
            normalized = normalized[..128];
        }

        return normalized;
    }

    private static Guid BuildGuestIdFromDevice(string deviceId)
    {
        var hash = SHA256.HashData(Encoding.UTF8.GetBytes(deviceId));
        Span<byte> guidBytes = stackalloc byte[16];
        hash.AsSpan(0, 16).CopyTo(guidBytes);
        return new Guid(guidBytes);
    }

    private static string BuildGuestEmailFromDevice(string deviceId)
    {
        var hash = SHA256.HashData(Encoding.UTF8.GetBytes(deviceId));
        var prefix = Convert.ToHexString(hash.AsSpan(0, 10)).ToLowerInvariant();
        return $"guest-{prefix}@pillmind.local";
    }

    [HttpPost("email/sign-up")]
    public async Task<ActionResult<EmailAuthResponse>> SignUpWithEmail([FromBody] EmailSignUpRequest request)
    {
        var firstName = NormalizeName(request.FirstName);
        var lastName = NormalizeName(request.LastName);
        var normalizedEmail = NormalizeEmail(request.Email);
        if (firstName is null || lastName is null || normalizedEmail is null)
        {
            return BadRequest("First name, last name and email are required.");
        }

        if (!IsValidPassword(request.Password))
        {
            return BadRequest($"Password must be at least {MinPasswordLength} characters.");
        }

        var existing = await dbContext.UserAccounts.FirstOrDefaultAsync(x => x.Email == normalizedEmail);
        if (existing is not null)
        {
            return Conflict("User already exists.");
        }

        var now = DateTimeOffset.UtcNow;
        var deviceId = NormalizeDeviceId(request.DeviceId ?? HttpContext?.Request?.Headers["X-Device-Id"].FirstOrDefault());
        var guestEmail = BuildGuestEmailFromDevice(deviceId);
        var user = new UserAccount
        {
            Id = Guid.NewGuid(),
            FirstName = firstName,
            LastName = lastName,
            Email = normalizedEmail,
            PasswordHash = HashPassword(request.Password),
            FullName = $"{firstName} {lastName}".Trim(),
            BirthDate = string.Empty,
            Gender = string.Empty,
            PhotoUri = string.Empty,
            IsEmailVerified = false,
            EmailVerifiedAt = null,
            CreatedAt = now,
            UpdatedAt = now,
            LastLoginAt = now,
            Role = UserRole.Member,
        };

        dbContext.UserAccounts.Add(user);
        await MigrateGuestDataToUserAsync(guestEmail, normalizedEmail, now);
        await dbContext.SaveChangesAsync();

        return Ok(CreateEmailAuthResponse(user, now, false, jwtTokenService));
    }

    [HttpPost("email/sign-in")]
    public async Task<ActionResult<EmailAuthResponse>> SignInWithEmail([FromBody] EmailSignInRequest request)
    {
        var normalizedEmail = NormalizeEmail(request.Email);
        if (normalizedEmail is null || string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest("Email and password are required.");
        }

        var user = await dbContext.UserAccounts.FirstOrDefaultAsync(x => x.Email == normalizedEmail);
        if (user is null || !VerifyPassword(request.Password, user.PasswordHash))
        {
            return Unauthorized("Email or password is invalid.");
        }

        var now = DateTimeOffset.UtcNow;
        var deviceId = NormalizeDeviceId(request.DeviceId ?? HttpContext?.Request?.Headers["X-Device-Id"].FirstOrDefault());
        var guestEmail = BuildGuestEmailFromDevice(deviceId);
        await MigrateGuestDataToUserAsync(guestEmail, normalizedEmail, now);
        if (!string.Equals(user.Role, UserRole.Vip, StringComparison.Ordinal))
        {
            user.Role = UserRole.Member;
        }
        user.LastLoginAt = now;
        user.UpdatedAt = now;
        await dbContext.SaveChangesAsync();

        return Ok(CreateEmailAuthResponse(user, now, user.IsEmailVerified, jwtTokenService));
    }

    [HttpPost("email/change-password")]
    public async Task<ActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
    {
        var normalizedEmail = NormalizeEmail(request.Email);
        if (normalizedEmail is null || string.IsNullOrWhiteSpace(request.CurrentPassword) || string.IsNullOrWhiteSpace(request.NewPassword))
        {
            return BadRequest("Email, current password and new password are required.");
        }

        if (!IsValidPassword(request.NewPassword))
        {
            return BadRequest($"New password must be at least {MinPasswordLength} characters.");
        }

        var user = await dbContext.UserAccounts.FirstOrDefaultAsync(x => x.Email == normalizedEmail);
        if (user is null || !VerifyPassword(request.CurrentPassword, user.PasswordHash))
        {
            return Unauthorized("Current password is invalid.");
        }

        user.PasswordHash = HashPassword(request.NewPassword);
        user.UpdatedAt = DateTimeOffset.UtcNow;
        await dbContext.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("email/cancel-account")]
    public async Task<ActionResult> CancelAccount([FromBody] CancelAccountRequest request)
    {
        var normalizedEmail = NormalizeEmail(request.Email);
        if (normalizedEmail is null || string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest("Email and password are required.");
        }

        var user = await dbContext.UserAccounts.FirstOrDefaultAsync(x => x.Email == normalizedEmail);
        if (user is null || !VerifyPassword(request.Password, user.PasswordHash))
        {
            return Unauthorized("Email or password is invalid.");
        }

        dbContext.UserAccounts.Remove(user);
        var verificationTokens = dbContext.EmailVerificationTokens.Where(x => x.Email == normalizedEmail);
        dbContext.EmailVerificationTokens.RemoveRange(verificationTokens);

        var deliveries = await dbContext.NotificationDeliveries.Where(x => x.UserReference == normalizedEmail).ToListAsync();
        if (deliveries.Count > 0)
        {
            var deliveryIds = deliveries.Select(x => x.Id).ToArray();
            var actions = dbContext.NotificationActions.Where(x => deliveryIds.Contains(x.DeliveryId));
            dbContext.NotificationActions.RemoveRange(actions);
            dbContext.NotificationDeliveries.RemoveRange(deliveries);
        }

        var standaloneActions = dbContext.NotificationActions.Where(x => x.UserReference == normalizedEmail);
        dbContext.NotificationActions.RemoveRange(standaloneActions);

        var medications = await dbContext.Medications.Where(x => x.UserReference == normalizedEmail).ToListAsync();
        if (medications.Count > 0)
        {
            var medicationIds = medications.Select(x => x.Id).ToArray();
            var schedules = await dbContext.MedicationSchedules.Where(x => medicationIds.Contains(x.MedicationId)).ToListAsync();
            var doseEvents = await dbContext.DoseEvents.Where(x => medicationIds.Contains(x.MedicationId)).ToListAsync();
            var inventoryRecords = await dbContext.InventoryRecords.Where(x => medicationIds.Contains(x.MedicationId)).ToListAsync();
            var prescriptionReminders = await dbContext.PrescriptionReminders.Where(x => medicationIds.Contains(x.MedicationId)).ToListAsync();
            var healthEvents = await dbContext.HealthEvents.Where(x => medicationIds.Contains(x.MedicationId)).ToListAsync();

            if (schedules.Count > 0)
            {
                dbContext.MedicationSchedules.RemoveRange(schedules);
            }

            if (doseEvents.Count > 0)
            {
                dbContext.DoseEvents.RemoveRange(doseEvents);
            }

            if (inventoryRecords.Count > 0)
            {
                dbContext.InventoryRecords.RemoveRange(inventoryRecords);
            }

            if (prescriptionReminders.Count > 0)
            {
                dbContext.PrescriptionReminders.RemoveRange(prescriptionReminders);
            }

            if (healthEvents.Count > 0)
            {
                dbContext.HealthEvents.RemoveRange(healthEvents);
            }

            dbContext.Medications.RemoveRange(medications);
        }

        var consentRecords = await dbContext.ConsentRecords.Where(x => x.UserReference == normalizedEmail).ToListAsync();
        if (consentRecords.Count > 0)
        {
            dbContext.ConsentRecords.RemoveRange(consentRecords);
        }

        await dbContext.SaveChangesAsync();
        return NoContent();
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
        var user = await dbContext.UserAccounts.FirstOrDefaultAsync(x => x.Email == normalizedEmail);
        if (user?.IsEmailVerified == true)
        {
            return Ok(new EmailVerificationRequestResponse
            {
                Email = normalizedEmail,
                Sent = false,
                ExpiresAt = user.EmailVerifiedAt ?? now,
            });
        }

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
        try
        {
            await emailDispatchService.SendVerificationCodeAsync(normalizedEmail, code);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "email-verification-dispatch-failed email={Email}", normalizedEmail);
            return StatusCode(StatusCodes.Status502BadGateway, new EmailVerificationRequestResponse
            {
                Email = normalizedEmail,
                Sent = false,
                ExpiresAt = now.Add(VerificationValidity),
            });
        }

        var token = new EmailVerificationToken
        {
            Id = Guid.NewGuid(),
            Email = normalizedEmail,
            CodeHash = HashVerificationCode(code),
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
        var user = await dbContext.UserAccounts.FirstOrDefaultAsync(x => x.Email == normalizedEmail);
        if (user?.IsEmailVerified == true)
        {
            return Ok(new EmailVerificationStatusResponse
            {
                Email = normalizedEmail,
                IsVerified = true,
                ExpiresAt = user.EmailVerifiedAt,
            });
        }

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

        if (!SecureEquals(token.CodeHash, HashVerificationCode(code)))
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
        var user = await dbContext.UserAccounts.FirstOrDefaultAsync(x => x.Email == normalizedEmail);
        if (user is not null)
        {
            user.IsEmailVerified = true;
            user.EmailVerifiedAt = now;
            user.UpdatedAt = now;
        }
        await dbContext.SaveChangesAsync();

        return Ok(new VerifyEmailCodeResponse
        {
            Email = normalizedEmail,
            IsVerified = true,
        });
    }

    private async Task MigrateGuestDataToUserAsync(string guestEmail, string userEmail, DateTimeOffset now)
    {
        if (string.Equals(guestEmail, userEmail, StringComparison.Ordinal))
        {
            return;
        }

        var medications = await dbContext.Medications.Where(x => x.UserReference == guestEmail).ToListAsync();
        foreach (var medication in medications)
        {
            medication.UserReference = userEmail;
            medication.UpdatedAt = now;
        }

        var deliveries = await dbContext.NotificationDeliveries.Where(x => x.UserReference == guestEmail).ToListAsync();
        foreach (var delivery in deliveries)
        {
            delivery.UserReference = userEmail;
        }

        var actions = await dbContext.NotificationActions.Where(x => x.UserReference == guestEmail).ToListAsync();
        foreach (var action in actions)
        {
            action.UserReference = userEmail;
        }

        var consents = await dbContext.ConsentRecords.Where(x => x.UserReference == guestEmail).ToListAsync();
        foreach (var consent in consents)
        {
            consent.UserReference = userEmail;
        }

        var guestAccount = await dbContext.UserAccounts.FirstOrDefaultAsync(x => x.Email == guestEmail);
        if (guestAccount is null)
        {
            return;
        }

        var userAccount =
            await dbContext.UserAccounts.FirstOrDefaultAsync(x => x.Email == userEmail)
            ?? dbContext.UserAccounts.Local.FirstOrDefault(x => x.Email == userEmail);
        if (userAccount is not null)
        {
            var guestPreference = await dbContext.UserPreferences.FirstOrDefaultAsync(x => x.UserAccountId == guestAccount.Id);
            if (guestPreference is not null)
            {
                var userPreference = await dbContext.UserPreferences.FirstOrDefaultAsync(x => x.UserAccountId == userAccount.Id);
                if (userPreference is null)
                {
                    dbContext.UserPreferences.Add(new UserPreference
                    {
                        Id = Guid.NewGuid(),
                        UserAccountId = userAccount.Id,
                        Locale = guestPreference.Locale,
                        FontScale = guestPreference.FontScale,
                        NotificationsEnabled = guestPreference.NotificationsEnabled,
                        MedicationRemindersEnabled = guestPreference.MedicationRemindersEnabled,
                        SnoozeMinutes = guestPreference.SnoozeMinutes,
                        WeekStartsOn = guestPreference.WeekStartsOn,
                        CreatedAt = now,
                        UpdatedAt = now,
                    });
                }

                dbContext.UserPreferences.Remove(guestPreference);
            }
        }

        dbContext.UserAccounts.Remove(guestAccount);
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

    private static string HashVerificationCode(string code)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(code));
        return Convert.ToHexString(bytes);
    }

    private static bool IsValidPassword(string password)
    {
        return password.Trim().Length >= MinPasswordLength;
    }

    private static string? NormalizeName(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        return value.Trim();
    }

    private static string HashPassword(string password)
    {
        var salt = RandomNumberGenerator.GetBytes(PasswordSaltLength);
        var hash = Rfc2898DeriveBytes.Pbkdf2(
            Encoding.UTF8.GetBytes(password),
            salt,
            PasswordIterationCount,
            HashAlgorithmName.SHA256,
            PasswordHashLength);

        return $"PBKDF2${PasswordIterationCount}${Convert.ToBase64String(salt)}${Convert.ToBase64String(hash)}";
    }

    private static bool VerifyPassword(string password, string encodedHash)
    {
        var parts = encodedHash.Split('$');
        if (parts.Length != 4 || parts[0] != "PBKDF2" || !int.TryParse(parts[1], out var iterations))
        {
            return false;
        }

        byte[] salt;
        byte[] expectedHash;
        try
        {
            salt = Convert.FromBase64String(parts[2]);
            expectedHash = Convert.FromBase64String(parts[3]);
        }
        catch (FormatException)
        {
            return false;
        }

        var actualHash = Rfc2898DeriveBytes.Pbkdf2(
            Encoding.UTF8.GetBytes(password),
            salt,
            iterations,
            HashAlgorithmName.SHA256,
            expectedHash.Length);

        return CryptographicOperations.FixedTimeEquals(actualHash, expectedHash);
    }

    private static EmailAuthResponse CreateEmailAuthResponse(UserAccount user, DateTimeOffset now, bool isEmailVerified, IJwtTokenService jwtTokenService)
    {
        return new EmailAuthResponse
        {
            UserId = user.Id,
            FirstName = user.FirstName,
            LastName = user.LastName,
            Email = user.Email,
            IsEmailVerified = isEmailVerified,
            AccessToken = jwtTokenService.CreateAccessToken(user, now),
            RefreshToken = $"email-rt-{Guid.NewGuid():N}",
            ExpiresAt = jwtTokenService.GetAccessTokenExpiry(now),
        };
    }

    private static bool SecureEquals(string a, string b)
    {
        var left = Encoding.UTF8.GetBytes(a);
        var right = Encoding.UTF8.GetBytes(b);
        return CryptographicOperations.FixedTimeEquals(left, right);
    }
}
