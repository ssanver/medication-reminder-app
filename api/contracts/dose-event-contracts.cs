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

public sealed class DoseHistoryQuery
{
    public Guid? MedicationId { get; set; }
    public string? ActionType { get; set; }
    public DateOnly? FromDate { get; set; }
    public DateOnly? ToDate { get; set; }
}

public sealed class DoseSummaryResponse
{
    public DateOnly FromDate { get; set; }
    public DateOnly ToDate { get; set; }
    public int PlannedCount { get; set; }
    public int TakenCount { get; set; }
    public int MissedCount { get; set; }
    public int SnoozedCount { get; set; }
    public decimal AdherenceRate { get; set; }
}
