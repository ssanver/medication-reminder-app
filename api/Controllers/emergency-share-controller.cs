using api.contracts;
using api.data;
using api.models;
using api.services.security;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace api.Controllers;

[ApiController]
[Route("api/emergency-share")]
public sealed class EmergencyShareController(AppDbContext dbContext, IAuditLogger auditLogger) : ControllerBase
{
    [HttpPost("token")]
    public async Task<ActionResult<EmergencyShareTokenResponse>> CreateToken([FromBody] CreateEmergencyShareTokenRequest request)
    {
        var allowedFields = request.AllowedFields
            .Select(x => x.Trim().ToLowerInvariant())
            .Where(x => x.Length > 0)
            .Distinct()
            .ToArray();

        if (allowedFields.Length == 0)
        {
            return BadRequest("At least one allowed field is required.");
        }

        var tokenValue = $"esh-{Guid.NewGuid():N}";
        var expiresAt = DateTimeOffset.UtcNow.AddMinutes(Math.Clamp(request.ExpiresInMinutes, 5, 1440));

        var token = new EmergencyShareToken
        {
            Id = Guid.NewGuid(),
            Token = tokenValue,
            AllowedFieldsCsv = string.Join(',', allowedFields),
            MedicationIdsCsv = string.Join(',', request.MedicationIds.Distinct()),
            CreatedAt = DateTimeOffset.UtcNow,
            ExpiresAt = expiresAt,
        };

        dbContext.EmergencyShareTokens.Add(token);
        await dbContext.SaveChangesAsync();

        await auditLogger.LogAsync("emergency-share-token-created", $"token={tokenValue},fields={token.AllowedFieldsCsv}");

        return Ok(new EmergencyShareTokenResponse
        {
            Token = token.Token,
            ExpiresAt = token.ExpiresAt,
            AllowedFields = allowedFields,
        });
    }

    [HttpPost("audit")]
    public async Task<IActionResult> WriteShareAudit([FromBody] ShareAuditRequest request)
    {
        var token = await dbContext.EmergencyShareTokens.AsNoTracking().FirstOrDefaultAsync(x => x.Token == request.Token);
        if (token is null)
        {
            return NotFound("Token not found.");
        }

        await auditLogger.LogAsync(
            "emergency-share-sent",
            $"token={request.Token},channel={request.Channel},time={DateTimeOffset.UtcNow:O}");

        return Ok();
    }
}
