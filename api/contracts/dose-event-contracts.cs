namespace api.contracts;

public sealed class DoseActionRequest
{
    public required Guid MedicationId { get; set; }
    public required string ActionType { get; set; }
    public string? DateKey { get; set; }
    public string? ScheduledTime { get; set; }
    public int? SnoozeMinutes { get; set; }
}

public sealed class DoseEventResponse
{
    public required Guid Id { get; set; }
    public required Guid MedicationId { get; set; }
    public required string ActionType { get; set; }
    public required string DateKey { get; set; }
    public required string ScheduledTime { get; set; }
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

public sealed class ScheduledDoseResponse
{
    public required string Id { get; set; }
    public required Guid MedicationId { get; set; }
    public required string ScheduledTime { get; set; }
    public required string DateKey { get; set; }
    public required string Name { get; set; }
    public required string Dosage { get; set; }
    public string? UsageType { get; set; }
    public bool IsBeforeMeal { get; set; }
    public required string FrequencyLabel { get; set; }
    public required string Status { get; set; }
}

public sealed class DoseTrendPointResponse
{
    public required string Label { get; set; }
    public int Value { get; set; }
}

public sealed class DoseMedicationReportRowResponse
{
    public required string Medication { get; set; }
    public int Taken { get; set; }
    public int Missed { get; set; }
}

public sealed class DoseReportResponse
{
    public required DoseSummaryResponse Summary { get; set; }
    public required IReadOnlyCollection<DoseTrendPointResponse> WeeklyTrend { get; set; }
    public required IReadOnlyCollection<DoseMedicationReportRowResponse> MedicationRows { get; set; }
}
