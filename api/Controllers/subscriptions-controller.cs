using api.contracts;
using api.data;
using api.models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using System.Security.Claims;

namespace api.Controllers;

[ApiController]
[Route("api/subscriptions")]
public sealed class SubscriptionsController(AppDbContext dbContext, IConfiguration configuration) : ControllerBase
{
    [HttpGet("status")]
    public async Task<ActionResult<SubscriptionStatusResponse>> GetStatus()
    {
        var resolvedEmail = ResolveUserEmail(out var errorResult);
        if (errorResult is not null)
        {
            return errorResult;
        }

        var user = await dbContext.UserAccounts.AsNoTracking().FirstOrDefaultAsync(x => x.Email == resolvedEmail);
        if (user is null)
        {
            return NotFound("User account not found.");
        }

        return Ok(ToResponse(user));
    }

    [HttpPost("activate")]
    public async Task<ActionResult<SubscriptionStatusResponse>> Activate([FromBody] ActivateSubscriptionRequest request)
    {
        var resolvedEmail = ResolveUserEmail(out var errorResult);
        if (errorResult is not null)
        {
            return errorResult;
        }

        var normalizedPlanId = request.PlanId?.Trim().ToLowerInvariant();
        if (string.IsNullOrWhiteSpace(normalizedPlanId))
        {
            return BadRequest("PlanId is required.");
        }

        var user = await dbContext.UserAccounts.FirstOrDefaultAsync(x => x.Email == resolvedEmail);
        if (user is null)
        {
            return NotFound("User account not found.");
        }

        if (string.Equals(user.Role, UserRole.Visitor, StringComparison.Ordinal))
        {
            return BadRequest("Guest accounts cannot activate subscriptions. Please sign up first.");
        }

        if (!configuration.GetValue<bool>("AllowUnsafeDirectSubscriptionActivation"))
        {
            return StatusCode(StatusCodes.Status501NotImplemented, "Store purchase validation is not implemented yet.");
        }

        user.SubscriptionPlanId = normalizedPlanId;
        user.Role = IsPremiumPlan(normalizedPlanId) ? UserRole.Vip : UserRole.Member;
        user.UpdatedAt = DateTimeOffset.UtcNow;
        await dbContext.SaveChangesAsync();

        return Ok(ToResponse(user));
    }

    private string ResolveUserEmail(out ActionResult? errorResult)
    {
        var principal = HttpContext?.User;
        var claimedEmail =
            principal?.FindFirstValue(ClaimTypes.Email)
            ?? principal?.FindFirstValue("email");

        if (string.IsNullOrWhiteSpace(claimedEmail))
        {
            errorResult = Unauthorized("User email claim is missing.");
            return string.Empty;
        }

        errorResult = null;
        return claimedEmail.Trim().ToLowerInvariant();
    }

    private static SubscriptionStatusResponse ToResponse(UserAccount user)
    {
        var role = UserRole.IsValid(user.Role) ? user.Role : UserRole.Member;
        return new SubscriptionStatusResponse
        {
            Role = role,
            AdsEnabled = !string.Equals(role, UserRole.Vip, StringComparison.Ordinal),
            ActivePlanId = user.SubscriptionPlanId,
            UpdatedAt = user.UpdatedAt,
        };
    }

    private static bool IsPremiumPlan(string normalizedPlanId)
    {
        return normalizedPlanId.Contains("premium", StringComparison.Ordinal)
            || normalizedPlanId.Contains("vip", StringComparison.Ordinal)
            || normalizedPlanId.Contains("pro", StringComparison.Ordinal);
    }
}
