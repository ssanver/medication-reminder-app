using api.contracts;
using api_application.monetization_application;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using System.Security.Claims;

namespace api.Controllers;

[ApiController]
[Route("api/subscriptions")]
public sealed class SubscriptionsController(MonetizationApplicationService monetizationApplicationService, IConfiguration configuration) : ControllerBase
{
    [HttpGet("status")]
    public async Task<ActionResult<SubscriptionStatusResponse>> GetStatus()
    {
        var resolvedEmail = ResolveUserEmail(out var errorResult);
        if (errorResult is not null)
        {
            return errorResult;
        }

        try
        {
            var status = await monetizationApplicationService.GetStatusAsync(resolvedEmail);
            return Ok(ToResponse(status));
        }
        catch (KeyNotFoundException error)
        {
            return NotFound(error.Message);
        }
        catch (UnauthorizedAccessException error)
        {
            return Unauthorized(error.Message);
        }
    }

    [HttpPost("activate")]
    public async Task<ActionResult<SubscriptionStatusResponse>> Activate([FromBody] ActivateSubscriptionRequest request)
    {
        var resolvedEmail = ResolveUserEmail(out var errorResult);
        if (errorResult is not null)
        {
            return errorResult;
        }

        try
        {
            var status = await monetizationApplicationService.ActivatePlanAsync(
                new ActivateMonetizationPlanCommand(
                    resolvedEmail,
                    request.PlanId,
                    configuration.GetValue<bool>("AllowUnsafeDirectSubscriptionActivation")));

            if (string.Equals(status.Role, "visitor", StringComparison.Ordinal))
            {
                return BadRequest("Guest accounts cannot activate subscriptions. Please sign up first.");
            }

            return Ok(ToResponse(status));
        }
        catch (ArgumentException error)
        {
            return BadRequest(error.Message);
        }
        catch (NotSupportedException error)
        {
            return StatusCode(StatusCodes.Status501NotImplemented, error.Message);
        }
        catch (KeyNotFoundException error)
        {
            return NotFound(error.Message);
        }
        catch (InvalidOperationException error)
        {
            return BadRequest(error.Message);
        }
        catch (UnauthorizedAccessException error)
        {
            return Unauthorized(error.Message);
        }
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

    private static SubscriptionStatusResponse ToResponse(MonetizationStatusRecord status)
    {
        return new SubscriptionStatusResponse
        {
            Role = status.Role,
            AdsEnabled = status.AdsEnabled,
            ActivePlanId = status.ActivePlanId,
            UpdatedAt = status.UpdatedAt,
        };
    }
}
