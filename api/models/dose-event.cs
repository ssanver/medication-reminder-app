namespace api.models;

public sealed class DoseEvent
{
    public Guid Id { get; set; }
    public Guid MedicationId { get; set; }
    public required string ActionType { get; set; }
    public DateTimeOffset ActionAt { get; set; }
    public int? SnoozeMinutes { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public Medication Medication { get; set; } = null!;
}
