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
        var item = await dbContext.UserPreferences.AsNoTracking().FirstOrDefaultAsync(x => x.UserReference == resolvedUserReference);

        if (item is null)
        {
            return Ok(new UserPreferenceResponse
            {
                UserReference = resolvedUserReference,
                WeekStartsOn = "monday",
                UpdatedAt = DateTimeOffset.UtcNow,
            });
        }

        return Ok(ToResponse(item));
    }

    [HttpPut]
    public async Task<ActionResult<UserPreferenceResponse>> Update([FromBody] UpdateUserPreferenceRequest request)
    {
        var resolvedUserReference = ResolveUserReference(request.UserReference);
        string normalizedWeekStartsOn;
        try
        {
            normalizedWeekStartsOn = NormalizeWeekStartsOn(request.WeekStartsOn);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }

        var item = await dbContext.UserPreferences.FirstOrDefaultAsync(x => x.UserReference == resolvedUserReference);
        if (item is null)
        {
            item = new UserPreference
            {
                Id = Guid.NewGuid(),
                UserReference = resolvedUserReference,
                WeekStartsOn = normalizedWeekStartsOn,
                CreatedAt = DateTimeOffset.UtcNow,
                UpdatedAt = DateTimeOffset.UtcNow,
            };
            dbContext.UserPreferences.Add(item);
        }
        else
        {
            item.WeekStartsOn = normalizedWeekStartsOn;
            item.UpdatedAt = DateTimeOffset.UtcNow;
        }

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

    private static UserPreferenceResponse ToResponse(UserPreference item)
    {
        return new UserPreferenceResponse
        {
            UserReference = item.UserReference,
            WeekStartsOn = item.WeekStartsOn,
            UpdatedAt = item.UpdatedAt,
        };
    }
}
