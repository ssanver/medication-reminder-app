namespace api.models;

public sealed class HealthEvent
{
    public Guid Id { get; set; }
    public required Guid MedicationId { get; set; }
    public required string EventType { get; set; }
    public DateTimeOffset EventAt { get; set; }
    public string? Note { get; set; }
    public required string ReminderOffsetsCsv { get; set; }
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
}
