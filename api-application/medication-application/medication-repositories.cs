namespace api_application.medication_application;

public sealed record MedicationScheduleRecord(
    Guid Id,
    string RepeatType,
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
    TimeOnly ReminderTime,
    string? DaysOfWeek);

public interface IMedicationRepository
{
    Task<IReadOnlyCollection<MedicationRecord>> ListAsync(CancellationToken cancellationToken = default);
    Task<MedicationRecord?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<MedicationRecord> CreateAsync(SaveMedicationCommand command, CancellationToken cancellationToken = default);
    Task<MedicationRecord?> UpdateAsync(Guid id, SaveMedicationCommand command, CancellationToken cancellationToken = default);
    Task<MedicationRecord?> AddScheduleAsync(Guid id, MedicationScheduleInput schedule, CancellationToken cancellationToken = default);
    Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default);
}
