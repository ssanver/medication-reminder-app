namespace api.models;

public sealed class MedicationSchedule
{
    public Guid Id { get; set; }
    public Guid MedicationId { get; set; }
    public required string RepeatType { get; set; }
    public int IntervalCount { get; set; } = 1;
    public required TimeOnly ReminderTime { get; set; }
    public string? DaysOfWeek { get; set; }
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;

    public Medication Medication { get; set; } = null!;
}
