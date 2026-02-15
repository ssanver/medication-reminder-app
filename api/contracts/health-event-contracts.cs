namespace api.contracts;

public sealed class SaveHealthEventRequest
{
    public required Guid MedicationId { get; set; }
    public required string EventType { get; set; }
    public DateTimeOffset EventAt { get; set; }
    public string? Note { get; set; }
    public IReadOnlyCollection<int> ReminderOffsets { get; set; } = [1440, 60];
}

public sealed class HealthEventResponse
{
    public required Guid Id { get; set; }
    public required Guid MedicationId { get; set; }
    public required string EventType { get; set; }
    public DateTimeOffset EventAt { get; set; }
    public string? Note { get; set; }
    public required IReadOnlyCollection<int> ReminderOffsets { get; set; }
}
