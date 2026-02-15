namespace api.contracts;

public sealed class SavePrescriptionReminderRequest
{
    public required Guid MedicationId { get; set; }
    public DateOnly RenewalDate { get; set; }
    public IReadOnlyCollection<int> TemplateOffsets { get; set; } = [];
    public IReadOnlyCollection<int> CustomOffsets { get; set; } = [];
}

public sealed class PrescriptionReminderResponse
{
    public required Guid MedicationId { get; set; }
    public DateOnly RenewalDate { get; set; }
    public required IReadOnlyCollection<int> Offsets { get; set; }
    public required IReadOnlyCollection<DateOnly> ReminderDates { get; set; }
}
