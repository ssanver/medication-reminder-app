using api_application.medication_application;

namespace api.tests;

public sealed class MedicationApplicationServiceTests
{
    private const string UserReference = "user@example.com";

    [Fact]
    public async Task Create_ShouldThrow_WhenNoScheduleProvided()
    {
        var service = new MedicationApplicationService(new InMemoryMedicationRepository());

        var act = async () => await service.CreateAsync(
            UserReference,
            "member",
            new SaveMedicationCommand(
                "Parol",
                "500mg",
                null,
                false,
                new DateOnly(2026, 2, 20),
                null,
                true,
                []));

        var error = await Assert.ThrowsAsync<ArgumentException>(act);
        Assert.Equal("At least one reminder time is required.", error.Message);
    }

    [Fact]
    public async Task Create_ShouldThrow_WhenFreeUserExceedsMedicationLimit()
    {
        var repository = new InMemoryMedicationRepository();
        repository.Seed(
            CreateMedication("Parol 1"),
            CreateMedication("Parol 2"),
            CreateMedication("Parol 3"));
        var service = new MedicationApplicationService(repository);

        var act = async () => await service.CreateAsync(
            UserReference,
            "member",
            new SaveMedicationCommand(
                "Parol 4",
                "500mg",
                null,
                false,
                new DateOnly(2026, 2, 20),
                null,
                true,
                [new MedicationScheduleInput("daily", 1, new TimeOnly(9, 0), null)]));

        var error = await Assert.ThrowsAsync<MedicationLimitExceededException>(act);
        Assert.Equal("Premium plan required to add more than 3 medications.", error.Message);
    }

    [Fact]
    public async Task Create_ShouldAllowVipUserBeyondFreeLimit()
    {
        var repository = new InMemoryMedicationRepository();
        repository.Seed(
            CreateMedication("Parol 1"),
            CreateMedication("Parol 2"),
            CreateMedication("Parol 3"));
        var service = new MedicationApplicationService(repository);

        var created = await service.CreateAsync(
            UserReference,
            "vip",
            new SaveMedicationCommand(
                "Parol 4",
                "500mg",
                null,
                false,
                new DateOnly(2026, 2, 20),
                null,
                true,
                [new MedicationScheduleInput("daily", 1, new TimeOnly(9, 0), null)]));

        Assert.Equal("Parol 4", created.Name);
    }

    [Fact]
    public async Task AddSchedule_ShouldThrow_WhenDaysOfWeekProvidedForDaily()
    {
        var repository = new InMemoryMedicationRepository();
        var service = new MedicationApplicationService(repository);

        var created = await service.CreateAsync(
            UserReference,
            "member",
            new SaveMedicationCommand(
                "Parol",
                "500mg",
                null,
                false,
                new DateOnly(2026, 2, 20),
                null,
                true,
                [new MedicationScheduleInput("daily", 1, new TimeOnly(9, 0), null)]));

        var act = async () => await service.AddScheduleAsync(
            created.Id,
            UserReference,
            new MedicationScheduleInput("daily", 1, new TimeOnly(12, 0), "mon"));

        var error = await Assert.ThrowsAsync<ArgumentException>(act);
        Assert.Equal("DaysOfWeek is only supported for weekly repeat type.", error.Message);
    }

    [Fact]
    public async Task Update_ShouldThrow_WhenMedicationMissing()
    {
        var service = new MedicationApplicationService(new InMemoryMedicationRepository());

        var act = async () => await service.UpdateAsync(
            Guid.NewGuid(),
            UserReference,
            new SaveMedicationCommand(
                "Parol",
                "500mg",
                null,
                false,
                new DateOnly(2026, 2, 20),
                null,
                true,
                [new MedicationScheduleInput("daily", 1, new TimeOnly(9, 0), null)]));

        var error = await Assert.ThrowsAsync<KeyNotFoundException>(act);
        Assert.Equal("Medication not found.", error.Message);
    }

    [Fact]
    public async Task AddSchedule_ShouldThrow_WhenCycleOffDaysFormatIsMissing()
    {
        var repository = new InMemoryMedicationRepository();
        var service = new MedicationApplicationService(repository);

        var created = await service.CreateAsync(
            UserReference,
            "member",
            new SaveMedicationCommand(
                "Parol",
                "500mg",
                null,
                false,
                new DateOnly(2026, 2, 20),
                null,
                true,
                [new MedicationScheduleInput("daily", 1, new TimeOnly(9, 0), null)]));

        var act = async () => await service.AddScheduleAsync(
            created.Id,
            UserReference,
            new MedicationScheduleInput("cycle", 21, new TimeOnly(8, 0), null));

        var error = await Assert.ThrowsAsync<ArgumentException>(act);
        Assert.Equal("Cycle repeat type requires DaysOfWeek format off:<number>.", error.Message);
    }

    [Fact]
    public async Task Update_ShouldPersistInactiveState()
    {
        var repository = new InMemoryMedicationRepository();
        var service = new MedicationApplicationService(repository);

        var created = await service.CreateAsync(
            UserReference,
            "member",
            new SaveMedicationCommand(
                "Parol",
                "500mg",
                null,
                false,
                new DateOnly(2026, 2, 20),
                null,
                true,
                [new MedicationScheduleInput("daily", 1, new TimeOnly(9, 0), null)]));

        var updated = await service.UpdateAsync(
            created.Id,
            UserReference,
            new SaveMedicationCommand(
                "Parol",
                "500mg",
                null,
                false,
                new DateOnly(2026, 2, 20),
                null,
                false,
                [new MedicationScheduleInput("daily", 1, new TimeOnly(9, 0), null)]));

        Assert.False(updated.IsActive);
    }

    private sealed class InMemoryMedicationRepository : IMedicationRepository
    {
        private readonly Dictionary<Guid, MedicationRecord> _store = [];

        public Task<IReadOnlyCollection<MedicationRecord>> ListAsync(string userReference, CancellationToken cancellationToken = default)
        {
            return Task.FromResult((IReadOnlyCollection<MedicationRecord>)_store.Values.ToArray());
        }

        public Task<MedicationRecord?> GetByIdAsync(Guid id, string userReference, CancellationToken cancellationToken = default)
        {
            _store.TryGetValue(id, out var value);
            return Task.FromResult(value);
        }

        public Task<int> CountAsync(string userReference, CancellationToken cancellationToken = default)
        {
            return Task.FromResult(_store.Count);
        }

        public Task<MedicationRecord> CreateAsync(string userReference, SaveMedicationCommand command, CancellationToken cancellationToken = default)
        {
            var record = new MedicationRecord(
                Guid.NewGuid(),
                command.Name,
                command.Dosage,
                command.UsageType,
                command.IsBeforeMeal,
                command.StartDate,
                command.EndDate,
                command.IsActive,
                DateTimeOffset.UtcNow,
                command.Schedules.Select(ToSchedule).ToArray());
            _store[record.Id] = record;
            return Task.FromResult(record);
        }

        public Task<MedicationRecord?> UpdateAsync(Guid id, string userReference, SaveMedicationCommand command, CancellationToken cancellationToken = default)
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
                command.IsActive,
                DateTimeOffset.UtcNow,
                command.Schedules.Select(ToSchedule).ToArray());
            _store[id] = updated;
            return Task.FromResult<MedicationRecord?>(updated);
        }

        public Task<MedicationRecord?> AddScheduleAsync(Guid id, string userReference, MedicationScheduleInput schedule, CancellationToken cancellationToken = default)
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

        public Task<bool> DeleteAsync(Guid id, string userReference, CancellationToken cancellationToken = default)
        {
            return Task.FromResult(_store.Remove(id));
        }

        public void Seed(params MedicationRecord[] records)
        {
            foreach (var record in records)
            {
                _store[record.Id] = record;
            }
        }

        private static MedicationScheduleRecord ToSchedule(MedicationScheduleInput input)
        {
            return new MedicationScheduleRecord(Guid.NewGuid(), input.RepeatType, input.IntervalCount, input.ReminderTime, input.DaysOfWeek, DateTimeOffset.UtcNow);
        }
    }

    private static MedicationRecord CreateMedication(string name)
    {
        return new MedicationRecord(
            Guid.NewGuid(),
            name,
            "500mg",
            null,
            false,
            new DateOnly(2026, 2, 20),
            null,
            true,
            DateTimeOffset.UtcNow,
            [new MedicationScheduleRecord(Guid.NewGuid(), "daily", 1, new TimeOnly(9, 0), null, DateTimeOffset.UtcNow)]);
    }
}
