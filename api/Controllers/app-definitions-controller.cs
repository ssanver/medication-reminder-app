using api.contracts;
using api.data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace api.Controllers;

[ApiController]
[Route("api/app-definitions")]
public sealed class AppDefinitionsController(AppDbContext dbContext) : ControllerBase
{
    [AllowAnonymous]
    [HttpGet]
    public async Task<ActionResult<AppDefinitionsResponse>> Get()
    {
        var rows = await dbContext
            .AppDefinitions
            .AsNoTracking()
            .OrderBy(x => x.DefinitionKey)
            .ToArrayAsync();

        var updatedAt = rows.Length > 0
            ? rows.Max(x => x.UpdatedAt)
            : DateTimeOffset.UtcNow;

        var definitions = rows.ToDictionary(x => x.DefinitionKey, x => x.JsonValue, StringComparer.OrdinalIgnoreCase);
        var requiredKeys = new[] { "formOptions", "medicationIconOptions" };
        foreach (var key in requiredKeys)
        {
            if (!definitions.TryGetValue(key, out var value) || string.IsNullOrWhiteSpace(value))
            {
                return StatusCode(StatusCodes.Status500InternalServerError, $"Missing required app definition: {key}");
            }
        }

        return Ok(new AppDefinitionsResponse
        {
            Definitions = definitions,
            UpdatedAt = updatedAt,
        });
    }
}
