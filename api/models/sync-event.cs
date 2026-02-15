namespace api.models;

public sealed class SyncEvent
{
    public Guid Id { get; set; }
    public required string EventId { get; set; }
    public required string EventType { get; set; }
    public required string PayloadJson { get; set; }
    public DateTimeOffset ClientUpdatedAt { get; set; }
    public DateTimeOffset ReceivedAt { get; set; } = DateTimeOffset.UtcNow;
}
