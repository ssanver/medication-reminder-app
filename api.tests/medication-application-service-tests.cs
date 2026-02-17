using api_application.medication_application;

namespace api.tests;

public sealed class MedicationApplicationServiceTests
{
    [Fact]
    public async Task Create_ShouldThrow_WhenNoScheduleProvided()
    {
        var service = new MedicationApplicationService(new InMemoryMedicationRepository());

        var act = async () => await service.CreateAsync(new SaveMedicationCommand(
            "Parol",
            "500mg",
            null,
            false,
            new DateOnly(2026, 2, 20),
            null,
            []));

        var error = await Assert.ThrowsAsync<ArgumentException>(act);
        Assert.Equal("At least one reminder time is required.", error.Message);
    }

    [Fact]
    public async Task AddSchedule_ShouldThrow_WhenDaysOfWeekProvidedForDaily()
    {
        var repository = new InMemoryMedicationRepository();
        var service = new MedicationApplicationService(repository);

        var created = await service.CreateAsync(new SaveMedicationCommand(
            "Parol",
            "500mg",
            null,
            false,
            new DateOnly(2026, 2, 20),
            null,
            [new MedicationScheduleInput("daily", new TimeOnly(9, 0), null)]));

        var act = async () => await service.AddScheduleAsync(
            created.Id,
            new MedicationScheduleInput("daily", new TimeOnly(12, 0), "mon"));

        var error = await Assert.ThrowsAsync<ArgumentException>(act);
        Assert.Equal("DaysOfWeek is only supported for weekly repeat type.", error.Message);
    }

    [Fact]
    public async Task Update_ShouldThrow_WhenMedicationMissing()
    {
        var service = new MedicationApplicationService(new InMemoryMedicationRepository());

        var act = async () => await service.UpdateAsync(
            Guid.NewGuid(),
            new SaveMedicationCommand(
                "Parol",
                "500mg",
                null,
                false,
                new DateOnly(2026, 2, 20),
                null,
                [new MedicationScheduleInput("daily", new TimeOnly(9, 0), null)]));

        var error = await Assert.ThrowsAsync<KeyNotFoundException>(act);
        Assert.Equal("Medication not found.", error.Message);
    }

    private sealed class InMemoryMedicationRepository : IMedicationRepository
    {
        private readonly Dictionary<Guid, MedicationRecord> _store = [];

        public Task<IReadOnlyCollection<MedicationRecord>> ListAsync(CancellationToken cancellationToken = default)
        {
            return Task.FromResult((IReadOnlyCollection<MedicationRecord>)_store.Values.ToArray());
        }

        public Task<MedicationRecord?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
        {
            _store.TryGetValue(id, out var value);
            return Task.FromResult(value);
        }

        public Task<MedicationRecord> CreateAsync(SaveMedicationCommand command, CancellationToken cancellationToken = default)
        {
            var record = new MedicationRecord(
                Guid.NewGuid(),
                command.Name,
                command.Dosage,
                command.UsageType,
                command.IsBeforeMeal,
                command.StartDate,
                command.EndDate,
                true,
                DateTimeOffset.UtcNow,
                command.Schedules.Select(ToSchedule).ToArray());
            _store[record.Id] = record;
            return Task.FromResult(record);
        }

        public Task<MedicationRecord?> UpdateAsync(Guid id, SaveMedicationCommand command, CancellationToken cancellationToken = default)
        {
            if (!_store.ContainsKey(id))
            {
                return Task.FromResult<MedicationRecord?>(null);
            }

            var updated = new MedicationRecord(
                id,
                command.Name,
                command.Dosage,
                command.UsageType,
                command.IsBeforeMeal,
                command.StartDate,
                command.EndDate,
                true,
                DateTimeOffset.UtcNow,
                command.Schedules.Select(ToSchedule).ToArray());
            _store[id] = updated;
            return Task.FromResult<MedicationRecord?>(updated);
        }

        public Task<MedicationRecord?> AddScheduleAsync(Guid id, MedicationScheduleInput schedule, CancellationToken cancellationToken = default)
        {
            if (!_store.TryGetValue(id, out var existing))
            {
                return Task.FromResult<MedicationRecord?>(null);
            }

            if (existing.Schedules.Any(item => item.ReminderTime == schedule.ReminderTime))
            {
                throw new ArgumentException("Duplicate reminder times are not allowed for the same medication.");
            }

            var nextSchedules = existing.Schedules.Append(ToSchedule(schedule)).ToArray();
            var updated = existing with { Schedules = nextSchedules };
            _store[id] = updated;
            return Task.FromResult<MedicationRecord?>(updated);
        }

        public Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default)
        {
            return Task.FromResult(_store.Remove(id));
        }

        private static MedicationScheduleRecord ToSchedule(MedicationScheduleInput input)
        {
            return new MedicationScheduleRecord(Guid.NewGuid(), input.RepeatType, input.ReminderTime, input.DaysOfWeek, DateTimeOffset.UtcNow);
        }
    }
}
