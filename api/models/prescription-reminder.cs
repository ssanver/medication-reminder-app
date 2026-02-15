namespace api.models;

public sealed class PrescriptionReminder
{
    public Guid Id { get; set; }
    public Guid MedicationId { get; set; }
    public DateOnly RenewalDate { get; set; }
    public required string OffsetsCsv { get; set; }
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;

    public Medication Medication { get; set; } = null!;
}
