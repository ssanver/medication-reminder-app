namespace api.contracts;

public sealed class InventoryUpdateRequest
{
    public required Guid MedicationId { get; set; }
    public int CurrentStock { get; set; }
    public int Threshold { get; set; }
}

public sealed class InventoryResponse
{
    public required Guid MedicationId { get; set; }
    public int CurrentStock { get; set; }
    public int Threshold { get; set; }
    public bool IsBelowThreshold { get; set; }
    public DateTimeOffset? LastAlertAt { get; set; }
}
