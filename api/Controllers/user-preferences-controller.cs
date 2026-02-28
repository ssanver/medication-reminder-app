using api.contracts;
using api.data;
using api.models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace api.Controllers;

[ApiController]
[Route("api/user-preferences")]
public sealed class UserPreferencesController(AppDbContext dbContext) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<UserPreferenceResponse>> Get([FromQuery] string? userReference)
    {
        var resolvedUserReference = ResolveUserReference(userReference, out var errorResult);
        if (errorResult is not null)
        {
            return errorResult;
        }

        var userAccount = await dbContext.UserAccounts.AsNoTracking().FirstOrDefaultAsync(x => x.Email == resolvedUserReference);
        if (userAccount is null)
        {
            return NotFound("User account not found.");
        }

        var item = await dbContext
            .UserPreferences
            .AsNoTracking()
            .Include(x => x.UserAccount)
            .FirstOrDefaultAsync(x => x.UserAccountId == userAccount.Id);

        if (item is null)
        {
            return Ok(new UserPreferenceResponse
            {
                Locale = "tr",
                FontScale = 1.0m,
                NotificationsEnabled = true,
                MedicationRemindersEnabled = true,
                SnoozeMinutes = 10,
                WeekStartsOn = "monday",
                UpdatedAt = DateTimeOffset.UtcNow,
            });
        }

        return Ok(ToResponse(item));
    }

    [HttpPut]
    public async Task<ActionResult<UserPreferenceResponse>> Update([FromBody] UpdateUserPreferenceRequest request, [FromQuery] string? userReference)
    {
        var resolvedUserReference = ResolveUserReference(userReference, out var errorResult);
        if (errorResult is not null)
        {
            return errorResult;
        }

        var userAccount = await dbContext.UserAccounts.FirstOrDefaultAsync(x => x.Email == resolvedUserReference);
        if (userAccount is null)
        {
            return NotFound("User account not found.");
        }

        var item = await dbContext
            .UserPreferences
            .Include(x => x.UserAccount)
            .FirstOrDefaultAsync(x => x.UserAccountId == userAccount.Id);

        if (item is null)
        {
            item = CreateDefaultPreference();
            item.UserAccountId = userAccount.Id;
            item.UserAccount = userAccount;
            dbContext.UserPreferences.Add(item);
        }

        if (!string.IsNullOrWhiteSpace(request.Locale))
        {
            try
            {
                item.Locale = NormalizeLocale(request.Locale);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        if (request.FontScale.HasValue)
        {
            if (request.FontScale.Value is < 0.8m or > 1.6m)
            {
                return BadRequest("FontScale must be between 0.8 and 1.6.");
            }
            item.FontScale = Math.Round(request.FontScale.Value, 2, MidpointRounding.AwayFromZero);
        }

        if (request.NotificationsEnabled.HasValue)
        {
            item.NotificationsEnabled = request.NotificationsEnabled.Value;
        }

        if (request.MedicationRemindersEnabled.HasValue)
        {
            item.MedicationRemindersEnabled = request.MedicationRemindersEnabled.Value;
        }

        if (request.SnoozeMinutes.HasValue)
        {
            if (request.SnoozeMinutes.Value is not (5 or 10 or 15))
            {
                return BadRequest("SnoozeMinutes must be one of: 5, 10, 15.");
            }
            item.SnoozeMinutes = request.SnoozeMinutes.Value;
        }

        if (!string.IsNullOrWhiteSpace(request.WeekStartsOn))
        {
            try
            {
                item.WeekStartsOn = NormalizeWeekStartsOn(request.WeekStartsOn);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        item.UpdatedAt = DateTimeOffset.UtcNow;
        await dbContext.SaveChangesAsync();

        return Ok(ToResponse(item));
    }

    private string ResolveUserReference(string? userReference, out ActionResult? errorResult)
    {
        var principal = HttpContext?.User;
        var claimedEmail =
            principal?.FindFirstValue(ClaimTypes.Email)
            ?? principal?.FindFirstValue("email");

        if (!string.IsNullOrWhiteSpace(claimedEmail))
        {
            var normalizedClaimedEmail = NormalizeEmail(claimedEmail);
            if (!string.IsNullOrWhiteSpace(userReference))
            {
                var normalizedQueryEmail = NormalizeEmail(userReference);
                if (!string.Equals(normalizedClaimedEmail, normalizedQueryEmail, StringComparison.Ordinal))
                {
                    errorResult = Forbid();
                    return string.Empty;
                }
            }

            errorResult = null;
            return normalizedClaimedEmail;
        }

        if (string.IsNullOrWhiteSpace(userReference))
        {
            errorResult = BadRequest("userReference query parameter is required.");
            return string.Empty;
        }

        errorResult = null;
        return NormalizeEmail(userReference);
    }

    private static string NormalizeEmail(string value)
    {
        return value.Trim().ToLowerInvariant();
    }

    private static string NormalizeWeekStartsOn(string value)
    {
        var normalized = value.Trim().ToLowerInvariant();
        if (normalized is not ("monday" or "sunday"))
        {
            throw new ArgumentException("WeekStartsOn must be either 'monday' or 'sunday'.");
        }

        return normalized;
    }

    private static string NormalizeLocale(string value)
    {
        var normalized = value.Trim().ToLowerInvariant();
        if (normalized is not ("tr" or "en"))
        {
            throw new ArgumentException("Locale must be either 'tr' or 'en'.");
        }

        return normalized;
    }

    private static UserPreferenceResponse ToResponse(UserPreference item)
    {
        return new UserPreferenceResponse
        {
            Locale = item.Locale,
            FontScale = item.FontScale,
            NotificationsEnabled = item.NotificationsEnabled,
            MedicationRemindersEnabled = item.MedicationRemindersEnabled,
            SnoozeMinutes = item.SnoozeMinutes,
            WeekStartsOn = item.WeekStartsOn,
            UpdatedAt = item.UpdatedAt,
        };
    }

    private static UserPreference CreateDefaultPreference()
    {
        return new UserPreference
        {
            Id = Guid.NewGuid(),
            Locale = "tr",
            FontScale = 1.0m,
            NotificationsEnabled = true,
            MedicationRemindersEnabled = true,
            SnoozeMinutes = 10,
            WeekStartsOn = "monday",
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow,
        };
    }
}
