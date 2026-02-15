namespace api.models;

public sealed class AuditLog
{
    public Guid Id { get; set; }
    public required string EventType { get; set; }
    public required string PayloadMasked { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}
