using api.contracts;
using api.data;
using api.models;
using api.services.security;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace api.Controllers;

[ApiController]
[Route("api/security")]
public sealed class SecurityController(AppDbContext dbContext, IAuditLogger auditLogger) : ControllerBase
{
    [HttpPost("consent")]
    public async Task<ActionResult<ConsentResponse>> SaveConsent([FromBody] SaveConsentRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.UserReference) || string.IsNullOrWhiteSpace(request.PrivacyVersion))
        {
            return BadRequest("UserReference and PrivacyVersion are required.");
        }

        var consent = await dbContext.ConsentRecords.FirstOrDefaultAsync(
            x => x.UserReference == request.UserReference && x.PrivacyVersion == request.PrivacyVersion);

        if (consent is null)
        {
            consent = new ConsentRecord
            {
                Id = Guid.NewGuid(),
                UserReference = request.UserReference.Trim(),
                PrivacyVersion = request.PrivacyVersion.Trim(),
                AcceptedAt = DateTimeOffset.UtcNow,
            };
            dbContext.ConsentRecords.Add(consent);
            await dbContext.SaveChangesAsync();
        }

        await auditLogger.LogAsync("consent-accepted", $"user={request.UserReference},version={request.PrivacyVersion}");

        return Ok(new ConsentResponse
        {
            UserReference = consent.UserReference,
            PrivacyVersion = consent.PrivacyVersion,
            AcceptedAt = consent.AcceptedAt,
        });
    }

    [HttpGet("audit-logs")]
    public async Task<ActionResult<IReadOnlyCollection<AuditLogResponse>>> GetAuditLogs()
    {
        var logs = await dbContext.AuditLogs
            .AsNoTracking()
            .OrderByDescending(x => x.CreatedAt)
            .Take(200)
            .Select(x => new AuditLogResponse
            {
                EventType = x.EventType,
                PayloadMasked = x.PayloadMasked,
                CreatedAt = x.CreatedAt,
            })
            .ToListAsync();

        return Ok(logs);
    }
}
