namespace api.models;

public sealed class NotificationDelivery
{
    public Guid Id { get; set; }
    public required string UserReference { get; set; }
    public Guid? MedicationId { get; set; }
    public DateTimeOffset ScheduledAt { get; set; }
    public DateTimeOffset? SentAt { get; set; }
    public required string Channel { get; set; }
    public required string Status { get; set; }
    public string? ProviderMessageId { get; set; }
    public string? ErrorCode { get; set; }
    public string? ErrorMessage { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public ICollection<NotificationAction> Actions { get; set; } = [];
}
