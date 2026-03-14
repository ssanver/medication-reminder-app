using api.contracts;
using api_application.monetization_application;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace api.Controllers;

[ApiController]
[Route("api/app-definitions")]
public sealed class AppDefinitionsController(MonetizationApplicationService monetizationApplicationService) : ControllerBase
{
    [AllowAnonymous]
    [HttpGet]
    public async Task<ActionResult<AppDefinitionsResponse>> Get()
    {
        try
        {
            var snapshot = await monetizationApplicationService.GetDefinitionsAsync();
            return Ok(new AppDefinitionsResponse
            {
                Definitions = snapshot.Definitions.ToDictionary(x => x.Key, x => x.Value, StringComparer.OrdinalIgnoreCase),
                UpdatedAt = snapshot.UpdatedAt,
            });
        }
        catch (InvalidOperationException error)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, error.Message);
        }
    }
}
