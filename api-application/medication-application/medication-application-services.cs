namespace api_application.medication_application;

public sealed class MedicationApplicationService(IMedicationRepository repository)
{
    private const int FreeMedicationLimit = 3;
    private const string VipRole = "vip";
    private static readonly HashSet<string> AllowedRepeatTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "daily",
        "weekly",
        "hourly",
        "cycle",
        "as-needed",
    };

    public Task<IReadOnlyCollection<MedicationRecord>> ListAsync(string userReference, CancellationToken cancellationToken = default)
    {
        return repository.ListAsync(userReference, cancellationToken);
    }

    public Task<MedicationRecord?> GetByIdAsync(Guid id, string userReference, CancellationToken cancellationToken = default)
    {
        return repository.GetByIdAsync(id, userReference, cancellationToken);
    }

    public async Task<MedicationRecord> CreateAsync(
        string userReference,
        string userRole,
        SaveMedicationCommand command,
        CancellationToken cancellationToken = default)
    {
        ValidateSaveCommand(command);
        await ValidateMedicationCreationAccessAsync(userReference, userRole, cancellationToken);
        return await repository.CreateAsync(userReference, NormalizeSaveCommand(command), cancellationToken);
    }

    public async Task<MedicationRecord> UpdateAsync(Guid id, string userReference, SaveMedicationCommand command, CancellationToken cancellationToken = default)
    {
        ValidateSaveCommand(command);
        var updated = await repository.UpdateAsync(id, userReference, NormalizeSaveCommand(command), cancellationToken);
        if (updated is null)
        {
            throw new KeyNotFoundException("Medication not found.");
        }

        return updated;
    }

    public async Task<MedicationRecord> AddScheduleAsync(Guid id, string userReference, MedicationScheduleInput schedule, CancellationToken cancellationToken = default)
    {
        ValidateScheduleInput(schedule);
        var updated = await repository.AddScheduleAsync(id, userReference, NormalizeSchedule(schedule), cancellationToken);
        if (updated is null)
        {
            throw new KeyNotFoundException("Medication not found.");
        }

        return updated;
    }

    public async Task DeleteAsync(Guid id, string userReference, CancellationToken cancellationToken = default)
    {
        var deleted = await repository.DeleteAsync(id, userReference, cancellationToken);
        if (!deleted)
        {
            throw new KeyNotFoundException("Medication not found.");
        }
    }

    private async Task ValidateMedicationCreationAccessAsync(string userReference, string userRole, CancellationToken cancellationToken)
    {
        var normalizedRole = NormalizeRole(userRole);
        if (string.Equals(normalizedRole, VipRole, StringComparison.Ordinal))
        {
            return;
        }

        var medicationCount = await repository.CountAsync(userReference, cancellationToken);
        if (medicationCount >= FreeMedicationLimit)
        {
            throw new MedicationLimitExceededException(FreeMedicationLimit);
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

    private static string NormalizeRole(string? value)
    {
        var normalized = value?.Trim().ToLowerInvariant();
        return normalized switch
        {
            "visitor" => "visitor",
            "vip" => VipRole,
            _ => "member",
        };
    }
}

public sealed class MedicationLimitExceededException(int limit)
    : InvalidOperationException($"Premium plan required to add more than {limit} medications.")
{
    public int Limit { get; } = limit;
}
