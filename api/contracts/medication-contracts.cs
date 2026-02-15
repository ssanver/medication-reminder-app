namespace api.contracts;

public sealed class MedicationScheduleInput
{
    public required string RepeatType { get; set; }
    public required TimeOnly ReminderTime { get; set; }
    public string? DaysOfWeek { get; set; }
}

public sealed class SaveMedicationRequest
{
    public required string Name { get; set; }
    public required string Dosage { get; set; }
    public string? UsageType { get; set; }
    public bool IsBeforeMeal { get; set; }
    public DateOnly StartDate { get; set; }
    public DateOnly? EndDate { get; set; }
    public required IReadOnlyCollection<MedicationScheduleInput> Schedules { get; set; }
}

public sealed class MedicationResponse
{
    public required Guid Id { get; set; }
    public required string Name { get; set; }
    public required string Dosage { get; set; }
    public string? UsageType { get; set; }
    public bool IsBeforeMeal { get; set; }
    public DateOnly StartDate { get; set; }
    public DateOnly? EndDate { get; set; }
    public bool IsActive { get; set; }
    public required IReadOnlyCollection<MedicationScheduleInput> Schedules { get; set; }
}
