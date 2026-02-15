using api.data;
using api.models;

namespace api.services.security;

public interface IAuditLogger
{
    Task LogAsync(string eventType, string payload);
}

public sealed class AuditLogger(AppDbContext dbContext) : IAuditLogger
{
    public async Task LogAsync(string eventType, string payload)
    {
        dbContext.AuditLogs.Add(new AuditLog
        {
            Id = Guid.NewGuid(),
            EventType = eventType,
            PayloadMasked = LogMasker.Mask(payload),
            CreatedAt = DateTimeOffset.UtcNow,
        });

        await dbContext.SaveChangesAsync();
    }
}
