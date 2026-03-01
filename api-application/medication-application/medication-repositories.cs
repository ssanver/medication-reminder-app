namespace api_application.medication_application;

public sealed record MedicationScheduleRecord(
    Guid Id,
    string RepeatType,
    int IntervalCount,
    TimeOnly ReminderTime,
    string? DaysOfWeek,
    DateTimeOffset UpdatedAt);

public sealed record MedicationRecord(
    Guid Id,
    string Name,
    string Dosage,
    string? UsageType,
    bool IsBeforeMeal,
    DateOnly StartDate,
    DateOnly? EndDate,
    bool IsActive,
    DateTimeOffset UpdatedAt,
    IReadOnlyCollection<MedicationScheduleRecord> Schedules);

public sealed record SaveMedicationCommand(
    string Name,
    string Dosage,
    string? UsageType,
    bool IsBeforeMeal,
    DateOnly StartDate,
    DateOnly? EndDate,
    IReadOnlyCollection<MedicationScheduleInput> Schedules);

public sealed record MedicationScheduleInput(
    string RepeatType,
    int IntervalCount,
    TimeOnly ReminderTime,
    string? DaysOfWeek);

public interface IMedicationRepository
{
    Task<IReadOnlyCollection<MedicationRecord>> ListAsync(string userReference, CancellationToken cancellationToken = default);
    Task<MedicationRecord?> GetByIdAsync(Guid id, string userReference, CancellationToken cancellationToken = default);
    Task<MedicationRecord> CreateAsync(string userReference, SaveMedicationCommand command, CancellationToken cancellationToken = default);
    Task<MedicationRecord?> UpdateAsync(Guid id, string userReference, SaveMedicationCommand command, CancellationToken cancellationToken = default);
    Task<MedicationRecord?> AddScheduleAsync(Guid id, string userReference, MedicationScheduleInput schedule, CancellationToken cancellationToken = default);
    Task<bool> DeleteAsync(Guid id, string userReference, CancellationToken cancellationToken = default);
}
