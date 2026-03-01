namespace api.contracts;

public sealed class GuestDoseEventInput
{
    public required string MedicationId { get; set; }
    public required string DateKey { get; set; }
    public required string ScheduledTime { get; set; }
    public required string Status { get; set; }
}

public sealed class GuestMedicationInput
{
    public required string Id { get; set; }
    public required string Name { get; set; }
    public required string Dosage { get; set; }
    public string? Form { get; set; }
    public required string FrequencyLabel { get; set; }
    public required string IntervalUnit { get; set; }
    public int IntervalCount { get; set; }
    public int? CycleOffDays { get; set; }
    public required string StartDate { get; set; }
    public string? EndDate { get; set; }
    public string? Time { get; set; }
    public IReadOnlyCollection<string>? Times { get; set; }
    public IReadOnlyCollection<int>? WeeklyDays { get; set; }
    public bool IsBeforeMeal { get; set; }
    public bool Active { get; set; }
}

public sealed class GuestScheduledDosesRequest
{
    public required string DateKey { get; set; }
    public string? Locale { get; set; }
    public required IReadOnlyCollection<GuestMedicationInput> Medications { get; set; }
    public required IReadOnlyCollection<GuestDoseEventInput> Events { get; set; }
}

public sealed class GuestDoseReportRequest
{
    public required string ReferenceDate { get; set; }
    public string? Locale { get; set; }
    public required IReadOnlyCollection<GuestMedicationInput> Medications { get; set; }
    public required IReadOnlyCollection<GuestDoseEventInput> Events { get; set; }
}

public sealed class GuestScheduledDoseResponse
{
    public required string Id { get; set; }
    public required string MedicationId { get; set; }
    public required string ScheduledTime { get; set; }
    public required string DateKey { get; set; }
    public required string Name { get; set; }
    public required string Dosage { get; set; }
    public string? UsageType { get; set; }
    public bool IsBeforeMeal { get; set; }
    public required string FrequencyLabel { get; set; }
    public required string Status { get; set; }
}

public sealed class GuestDoseReportSummaryResponse
{
    public int PlannedCount { get; set; }
    public int TakenCount { get; set; }
    public int MissedCount { get; set; }
    public decimal AdherenceRate { get; set; }
}

public sealed class GuestDoseTrendPointResponse
{
    public required string Label { get; set; }
    public int Value { get; set; }
}

public sealed class GuestDoseMedicationReportRowResponse
{
    public required string Medication { get; set; }
    public int Taken { get; set; }
    public int Missed { get; set; }
}

public sealed class GuestDoseReportResponse
{
    public required GuestDoseReportSummaryResponse Summary { get; set; }
    public required IReadOnlyCollection<GuestDoseTrendPointResponse> WeeklyTrend { get; set; }
    public required IReadOnlyCollection<GuestDoseMedicationReportRowResponse> MedicationRows { get; set; }
}
