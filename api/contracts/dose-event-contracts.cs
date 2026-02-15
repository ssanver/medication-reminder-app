namespace api.contracts;

public sealed class DoseActionRequest
{
    public required Guid MedicationId { get; set; }
    public required string ActionType { get; set; }
    public int? SnoozeMinutes { get; set; }
}

public sealed class DoseEventResponse
{
    public required Guid Id { get; set; }
    public required Guid MedicationId { get; set; }
    public required string ActionType { get; set; }
    public DateTimeOffset ActionAt { get; set; }
    public int? SnoozeMinutes { get; set; }
}
