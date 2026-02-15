namespace api.models;

public sealed class InventoryRecord
{
    public Guid Id { get; set; }
    public Guid MedicationId { get; set; }
    public int CurrentStock { get; set; }
    public int Threshold { get; set; }
    public DateTimeOffset? LastAlertAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;

    public Medication Medication { get; set; } = null!;
}
