using api.contracts;
using api.data;
using api.models;
using api.services.security;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace api.Controllers;

[ApiController]
[Route("api/security")]
public sealed class SecurityController(AppDbContext dbContext, IAuditLogger auditLogger, IConfiguration configuration) : ControllerBase
{
    [HttpPost("consent")]
    public async Task<ActionResult<ConsentResponse>> SaveConsent([FromBody] SaveConsentRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.PrivacyVersion))
        {
            return BadRequest("PrivacyVersion is required.");
        }

        var userReference = string.IsNullOrWhiteSpace(request.UserReference)
            ? DefaultUserReference.Resolve(configuration)
            : request.UserReference.Trim();

        var consent = await dbContext.ConsentRecords.FirstOrDefaultAsync(
            x => x.UserReference == userReference && x.PrivacyVersion == request.PrivacyVersion);

        if (consent is null)
        {
            consent = new ConsentRecord
            {
                Id = Guid.NewGuid(),
                UserReference = userReference,
                PrivacyVersion = request.PrivacyVersion.Trim(),
                AcceptedAt = DateTimeOffset.UtcNow,
            };
            dbContext.ConsentRecords.Add(consent);
            await dbContext.SaveChangesAsync();
        }

        await auditLogger.LogAsync("consent-accepted", $"user={userReference},version={request.PrivacyVersion}");

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
