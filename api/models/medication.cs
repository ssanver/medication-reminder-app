namespace api.models;

public sealed class Medication
{
    public Guid Id { get; set; }
    public required string Name { get; set; }
    public required string Dosage { get; set; }
    public string? UsageType { get; set; }
    public bool IsBeforeMeal { get; set; }
    public DateOnly StartDate { get; set; }
    public DateOnly? EndDate { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;

    public ICollection<MedicationSchedule> Schedules { get; set; } = [];
    public ICollection<DoseEvent> DoseEvents { get; set; } = [];
    public ICollection<PrescriptionReminder> PrescriptionReminders { get; set; } = [];
    public InventoryRecord? Inventory { get; set; }
}
