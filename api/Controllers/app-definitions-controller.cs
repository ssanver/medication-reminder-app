using api.contracts;
using api.data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace api.Controllers;

[ApiController]
[Route("api/app-definitions")]
public sealed class AppDefinitionsController(AppDbContext dbContext) : ControllerBase
{
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

        return Ok(new AppDefinitionsResponse
        {
            Definitions = rows.ToDictionary(x => x.DefinitionKey, x => x.JsonValue),
            UpdatedAt = updatedAt,
        });
    }
}
