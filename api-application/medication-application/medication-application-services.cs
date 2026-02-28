namespace api_application.medication_application;

public sealed class MedicationApplicationService(IMedicationRepository repository)
{
    private static readonly HashSet<string> AllowedRepeatTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "daily",
        "weekly",
        "hourly",
        "cycle",
        "as-needed",
    };

    public Task<IReadOnlyCollection<MedicationRecord>> ListAsync(CancellationToken cancellationToken = default)
    {
        return repository.ListAsync(cancellationToken);
    }

    public Task<MedicationRecord?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return repository.GetByIdAsync(id, cancellationToken);
    }

    public async Task<MedicationRecord> CreateAsync(SaveMedicationCommand command, CancellationToken cancellationToken = default)
    {
        ValidateSaveCommand(command);
        return await repository.CreateAsync(NormalizeSaveCommand(command), cancellationToken);
    }

    public async Task<MedicationRecord> UpdateAsync(Guid id, SaveMedicationCommand command, CancellationToken cancellationToken = default)
    {
        ValidateSaveCommand(command);
        var updated = await repository.UpdateAsync(id, NormalizeSaveCommand(command), cancellationToken);
        if (updated is null)
        {
            throw new KeyNotFoundException("Medication not found.");
        }

        return updated;
    }

    public async Task<MedicationRecord> AddScheduleAsync(Guid id, MedicationScheduleInput schedule, CancellationToken cancellationToken = default)
    {
        ValidateScheduleInput(schedule);
        var updated = await repository.AddScheduleAsync(id, NormalizeSchedule(schedule), cancellationToken);
        if (updated is null)
        {
            throw new KeyNotFoundException("Medication not found.");
        }

        return updated;
    }

    public async Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var deleted = await repository.DeleteAsync(id, cancellationToken);
        if (!deleted)
        {
            throw new KeyNotFoundException("Medication not found.");
        }
    }

    private static void ValidateSaveCommand(SaveMedicationCommand command)
    {
        if (string.IsNullOrWhiteSpace(command.Name))
        {
            throw new ArgumentException("Medication name is required.");
        }

        if (string.IsNullOrWhiteSpace(command.Dosage))
        {
            throw new ArgumentException("Dosage is required.");
        }

        if (command.Schedules.Count == 0)
        {
            throw new ArgumentException("At least one reminder time is required.");
        }

        if (command.EndDate.HasValue && command.EndDate.Value < command.StartDate)
        {
            throw new ArgumentException("End date cannot be earlier than start date.");
        }

        foreach (var schedule in command.Schedules)
        {
            ValidateScheduleInput(schedule);
        }

        var duplicatedReminderTimes = command.Schedules.GroupBy(x => x.ReminderTime).Any(group => group.Count() > 1);
        if (duplicatedReminderTimes)
        {
            throw new ArgumentException("Duplicate reminder times are not allowed for the same medication.");
        }
    }

    private static void ValidateScheduleInput(MedicationScheduleInput schedule)
    {
        if (string.IsNullOrWhiteSpace(schedule.RepeatType))
        {
            throw new ArgumentException("Repeat type is required.");
        }

        if (!AllowedRepeatTypes.Contains(schedule.RepeatType.Trim()))
        {
            throw new ArgumentException("Repeat type must be one of: daily, weekly.");
        }

        if (schedule.IntervalCount < 1)
        {
            throw new ArgumentException("Interval count must be greater than zero.");
        }

        if (schedule.RepeatType.Equals("weekly", StringComparison.OrdinalIgnoreCase) && string.IsNullOrWhiteSpace(schedule.DaysOfWeek))
        {
            throw new ArgumentException("At least one weekday is required for weekly repeat type.");
        }

        if (schedule.RepeatType.Equals("daily", StringComparison.OrdinalIgnoreCase) && !string.IsNullOrWhiteSpace(schedule.DaysOfWeek))
        {
            throw new ArgumentException("DaysOfWeek is only supported for weekly repeat type.");
        }

        if (schedule.RepeatType.Equals("hourly", StringComparison.OrdinalIgnoreCase) && !string.IsNullOrWhiteSpace(schedule.DaysOfWeek))
        {
            throw new ArgumentException("DaysOfWeek is not supported for hourly repeat type.");
        }

        if (schedule.RepeatType.Equals("as-needed", StringComparison.OrdinalIgnoreCase) && !string.IsNullOrWhiteSpace(schedule.DaysOfWeek))
        {
            throw new ArgumentException("DaysOfWeek is not supported for as-needed repeat type.");
        }

        if (schedule.RepeatType.Equals("cycle", StringComparison.OrdinalIgnoreCase))
        {
            if (string.IsNullOrWhiteSpace(schedule.DaysOfWeek) || !schedule.DaysOfWeek.Trim().StartsWith("off:", StringComparison.OrdinalIgnoreCase))
            {
                throw new ArgumentException("Cycle repeat type requires DaysOfWeek format off:<number>.");
            }
        }
    }

    private static SaveMedicationCommand NormalizeSaveCommand(SaveMedicationCommand command)
    {
        return command with
        {
            Name = command.Name.Trim(),
            Dosage = command.Dosage.Trim(),
            UsageType = command.UsageType?.Trim(),
            Schedules = command.Schedules.Select(NormalizeSchedule).ToArray(),
        };
    }

    private static MedicationScheduleInput NormalizeSchedule(MedicationScheduleInput schedule)
    {
        return schedule with
        {
            RepeatType = schedule.RepeatType.Trim().ToLowerInvariant(),
            IntervalCount = Math.Max(1, schedule.IntervalCount),
            DaysOfWeek = NormalizeDaysOfWeek(schedule.RepeatType, schedule.DaysOfWeek),
        };
    }

    private static string? NormalizeDaysOfWeek(string repeatType, string? daysOfWeek)
    {
        if (string.IsNullOrWhiteSpace(daysOfWeek))
        {
            return null;
        }

        if (repeatType.Trim().Equals("cycle", StringComparison.OrdinalIgnoreCase))
        {
            var raw = daysOfWeek.Trim();
            if (!raw.StartsWith("off:", StringComparison.OrdinalIgnoreCase))
            {
                return null;
            }

            var numberText = raw[4..];
            return int.TryParse(numberText, out var value) ? $"off:{Math.Max(0, value)}" : "off:0";
        }

        return string.Join(
            ",",
            daysOfWeek
                .Split(',', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries)
                .Select(value => value.ToLowerInvariant()));
    }
}
