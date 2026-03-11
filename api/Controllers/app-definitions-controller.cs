using api.contracts;
using api.data;
using api.models;
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
        var requiredDefinitions = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            ["formOptions"] = """[{"key":"Capsule","emoji":"💊"},{"key":"Pill","emoji":"💊"},{"key":"Drop","emoji":"🫙"},{"key":"Syrup","emoji":"🧴"},{"key":"Injection","emoji":"💉"},{"key":"Other","emoji":"🧩"}]""",
            ["medicationIconOptions"] = """["💊","🧴","💉","🫙","🩹","🌿","🟡","🔵"]""",
            ["snoozeOptions"] = "[5,10,15,30,60]",
        };
        var hasDbBackfill = false;
        var now = DateTimeOffset.UtcNow;
        foreach (var (key, defaultValue) in requiredDefinitions)
        {
            if (!definitions.TryGetValue(key, out var value) || string.IsNullOrWhiteSpace(value))
            {
                dbContext.AppDefinitions.Add(new AppDefinition
                {
                    Id = Guid.NewGuid(),
                    DefinitionKey = key,
                    JsonValue = defaultValue,
                    UpdatedAt = now,
                });
                definitions[key] = defaultValue;
                hasDbBackfill = true;
            }
        }
        if (hasDbBackfill)
        {
            await dbContext.SaveChangesAsync();
            updatedAt = now;
        }

        return Ok(new AppDefinitionsResponse
        {
            Definitions = definitions,
            UpdatedAt = updatedAt,
        });
    }
}
