using api.data;
using api.models;
using api_application.medication_application;
using Microsoft.EntityFrameworkCore;

namespace api.services.medication_persistence;

public sealed class EfMedicationRepository(AppDbContext dbContext) : IMedicationRepository
{
    public async Task<IReadOnlyCollection<MedicationRecord>> ListAsync(CancellationToken cancellationToken = default)
    {
        var items = await dbContext
            .Medications
            .AsNoTracking()
            .Include(medication => medication.Schedules)
            .OrderByDescending(medication => medication.UpdatedAt)
            .ToListAsync(cancellationToken);

        return items.Select(ToRecord).ToArray();
    }

    public async Task<MedicationRecord?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var entity = await dbContext
            .Medications
            .AsNoTracking()
            .Include(medication => medication.Schedules)
            .FirstOrDefaultAsync(medication => medication.Id == id, cancellationToken);

        return entity is null ? null : ToRecord(entity);
    }

    public async Task<MedicationRecord> CreateAsync(SaveMedicationCommand command, CancellationToken cancellationToken = default)
    {
        var entity = new Medication
        {
            Id = Guid.NewGuid(),
            Name = command.Name,
            Dosage = command.Dosage,
            UsageType = command.UsageType,
            IsBeforeMeal = command.IsBeforeMeal,
            StartDate = command.StartDate,
            EndDate = command.EndDate,
            UpdatedAt = DateTimeOffset.UtcNow,
            Schedules = command.Schedules
                .Select(schedule => new MedicationSchedule
                {
                    Id = Guid.NewGuid(),
                    RepeatType = schedule.RepeatType,
                    ReminderTime = schedule.ReminderTime,
                    DaysOfWeek = schedule.DaysOfWeek,
                    UpdatedAt = DateTimeOffset.UtcNow,
                })
                .ToList(),
        };

        dbContext.Medications.Add(entity);
        await dbContext.SaveChangesAsync(cancellationToken);
        return ToRecord(entity);
    }

    public async Task<MedicationRecord?> UpdateAsync(Guid id, SaveMedicationCommand command, CancellationToken cancellationToken = default)
    {
        var entity = await dbContext.Medications.Include(x => x.Schedules).FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (entity is null)
        {
            return null;
        }

        entity.Name = command.Name;
        entity.Dosage = command.Dosage;
        entity.UsageType = command.UsageType;
        entity.IsBeforeMeal = command.IsBeforeMeal;
        entity.StartDate = command.StartDate;
        entity.EndDate = command.EndDate;
        entity.UpdatedAt = DateTimeOffset.UtcNow;

        dbContext.MedicationSchedules.RemoveRange(entity.Schedules);
        entity.Schedules = command.Schedules
            .Select(schedule => new MedicationSchedule
            {
                Id = Guid.NewGuid(),
                MedicationId = entity.Id,
                RepeatType = schedule.RepeatType,
                ReminderTime = schedule.ReminderTime,
                DaysOfWeek = schedule.DaysOfWeek,
                UpdatedAt = DateTimeOffset.UtcNow,
            })
            .ToList();

        await dbContext.SaveChangesAsync(cancellationToken);
        return ToRecord(entity);
    }

    public async Task<MedicationRecord?> AddScheduleAsync(Guid id, MedicationScheduleInput schedule, CancellationToken cancellationToken = default)
    {
        var medication = await dbContext.Medications.Include(x => x.Schedules).FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (medication is null)
        {
            return null;
        }

        var reminderTimeAlreadyExists = medication.Schedules.Any(x => x.ReminderTime == schedule.ReminderTime);
        if (reminderTimeAlreadyExists)
        {
            throw new ArgumentException("Duplicate reminder times are not allowed for the same medication.");
        }

        var newSchedule = new MedicationSchedule
        {
            Id = Guid.NewGuid(),
            MedicationId = medication.Id,
            RepeatType = schedule.RepeatType,
            ReminderTime = schedule.ReminderTime,
            DaysOfWeek = schedule.DaysOfWeek,
            UpdatedAt = DateTimeOffset.UtcNow,
        };

        dbContext.MedicationSchedules.Add(newSchedule);
        medication.UpdatedAt = DateTimeOffset.UtcNow;
        await dbContext.SaveChangesAsync(cancellationToken);

        return ToRecord(medication);
    }

    public async Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var medication = await dbContext.Medications.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (medication is null)
        {
            return false;
        }

        dbContext.Medications.Remove(medication);
        await dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }

    private static MedicationRecord ToRecord(Medication medication)
    {
        return new MedicationRecord(
            medication.Id,
            medication.Name,
            medication.Dosage,
            medication.UsageType,
            medication.IsBeforeMeal,
            medication.StartDate,
            medication.EndDate,
            medication.IsActive,
            medication.UpdatedAt,
            medication.Schedules
                .OrderBy(schedule => schedule.ReminderTime)
                .Select(schedule => new MedicationScheduleRecord(
                    schedule.Id,
                    schedule.RepeatType,
                    schedule.ReminderTime,
                    schedule.DaysOfWeek,
                    schedule.UpdatedAt))
                .ToArray());
    }
}
