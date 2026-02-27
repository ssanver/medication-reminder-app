using api.contracts;
using api.data;
using api.models;
using api.services.security;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace api.Controllers;

[ApiController]
[Route("api/user-preferences")]
public sealed class UserPreferencesController(AppDbContext dbContext, IConfiguration configuration) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<UserPreferenceResponse>> Get([FromQuery] string? userReference)
    {
        var resolvedUserReference = ResolveUserReference(userReference);
        var userAccount = await dbContext.UserAccounts.AsNoTracking().FirstOrDefaultAsync(x => x.Email == resolvedUserReference);
        if (userAccount is null)
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
        var resolvedUserReference = ResolveUserReference(userReference);
        var userAccount = await dbContext.UserAccounts.FirstOrDefaultAsync(x => x.Email == resolvedUserReference);
        if (userAccount is null)
        {
            userAccount = new UserAccount
            {
                Id = Guid.NewGuid(),
                FirstName = "User",
                LastName = "Preference",
                Email = resolvedUserReference,
                PasswordHash = "preference-only-account",
                FullName = "User Preference",
                BirthDate = string.Empty,
                Gender = string.Empty,
                PhotoUri = string.Empty,
                IsEmailVerified = false,
                CreatedAt = DateTimeOffset.UtcNow,
                UpdatedAt = DateTimeOffset.UtcNow,
            };
            dbContext.UserAccounts.Add(userAccount);
        }

        var item = await dbContext
            .UserPreferences
            .Include(x => x.UserAccount)
            .FirstOrDefaultAsync(x => x.UserAccountId == userAccount.Id);
        if (item is null)
        {
            item = new UserPreference
            {
                Id = Guid.NewGuid(),
                UserAccountId = userAccount.Id,
                UserAccount = userAccount,
                Locale = "tr",
                FontScale = 1.0m,
                NotificationsEnabled = true,
                MedicationRemindersEnabled = true,
                SnoozeMinutes = 10,
                WeekStartsOn = "monday",
                CreatedAt = DateTimeOffset.UtcNow,
                UpdatedAt = DateTimeOffset.UtcNow,
            };
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

    private string ResolveUserReference(string? userReference)
    {
        return string.IsNullOrWhiteSpace(userReference)
            ? DefaultUserReference.Resolve(configuration)
            : userReference.Trim().ToLowerInvariant();
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
}
