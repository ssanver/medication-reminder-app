namespace api_application.guest_simulation_application;

public sealed record GuestMedicationRecord(
    string Id,
    string Name,
    string Dosage,
    string? UsageType,
    bool IsBeforeMeal,
    string FrequencyLabel,
    string IntervalUnit,
    int IntervalCount,
    int CycleOffDays,
    string StartDate,
    string? EndDate,
    string? Time,
    IReadOnlyCollection<string> Times,
    IReadOnlyCollection<int> WeeklyDays,
    bool Active);

public sealed record GuestDoseEventRecord(
    string MedicationId,
    string DateKey,
    string ScheduledTime,
    string Status);

public sealed record GuestScheduledDoseRecord(
    string Id,
    string MedicationId,
    string ScheduledTime,
    string DateKey,
    string Name,
    string Dosage,
    string? UsageType,
    bool IsBeforeMeal,
    string FrequencyLabel,
    string Status);

public sealed record GuestDoseTrendPointRecord(string Label, int Value);

public sealed record GuestDoseMedicationRowRecord(string Medication, int Taken, int Missed);

public sealed record GuestDoseReportSummaryRecord(int PlannedCount, int TakenCount, int MissedCount, decimal AdherenceRate);

public sealed record GuestDoseReportRecord(
    GuestDoseReportSummaryRecord Summary,
    IReadOnlyCollection<GuestDoseTrendPointRecord> WeeklyTrend,
    IReadOnlyCollection<GuestDoseMedicationRowRecord> MedicationRows);
