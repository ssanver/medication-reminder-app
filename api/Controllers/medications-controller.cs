using api.contracts;
using api.data;
using api.models;
using api.services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace api.Controllers;

[ApiController]
[Route("api/medications")]
public sealed class MedicationsController(AppDbContext dbContext) : ControllerBase
{
    private static readonly HashSet<string> AllowedRepeatTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "daily",
        "weekly",
    };

    [HttpGet]
    public async Task<ActionResult<IReadOnlyCollection<MedicationResponse>>> GetAll()
    {
        var medications = await dbContext
            .Medications
            .AsNoTracking()
            .Include(medication => medication.Schedules)
            .OrderByDescending(medication => medication.UpdatedAt)
            .ToListAsync();

        return Ok(medications.Select(ToResponse).ToArray());
    }

    [HttpPost]
    public async Task<ActionResult<MedicationResponse>> Create([FromBody] SaveMedicationRequest request)
    {
        var validationError = ValidateRequest(request);
        if (validationError is not null)
        {
            return BadRequest(validationError);
        }

        var medication = new Medication
        {
            Id = Guid.NewGuid(),
            Name = request.Name.Trim(),
            Dosage = request.Dosage.Trim(),
            UsageType = request.UsageType?.Trim(),
            IsBeforeMeal = request.IsBeforeMeal,
            StartDate = request.StartDate,
            EndDate = request.EndDate,
            UpdatedAt = DateTimeOffset.UtcNow,
            Schedules = request
                .Schedules
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

        dbContext.Medications.Add(medication);
        await dbContext.SaveChangesAsync();

        return CreatedAtAction(nameof(GetAll), new { id = medication.Id }, ToResponse(medication));
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<MedicationResponse>> Update([FromRoute] Guid id, [FromBody] SaveMedicationRequest request)
    {
        var validationError = ValidateRequest(request);
        if (validationError is not null)
        {
            return BadRequest(validationError);
        }

        var medication = await dbContext.Medications.Include(x => x.Schedules).FirstOrDefaultAsync(x => x.Id == id);
        if (medication is null)
        {
            return NotFound();
        }

        medication.Name = request.Name.Trim();
        medication.Dosage = request.Dosage.Trim();
        medication.UsageType = request.UsageType?.Trim();
        medication.IsBeforeMeal = request.IsBeforeMeal;
        medication.StartDate = request.StartDate;
        medication.EndDate = request.EndDate;
        medication.UpdatedAt = DateTimeOffset.UtcNow;

        dbContext.MedicationSchedules.RemoveRange(medication.Schedules);
        medication.Schedules = request
            .Schedules
            .Select(schedule => new MedicationSchedule
            {
                Id = Guid.NewGuid(),
                MedicationId = medication.Id,
                RepeatType = schedule.RepeatType,
                ReminderTime = schedule.ReminderTime,
                DaysOfWeek = schedule.DaysOfWeek,
                UpdatedAt = DateTimeOffset.UtcNow,
            })
            .ToList();

        await dbContext.SaveChangesAsync();

        return Ok(ToResponse(medication));
    }

    [HttpPost("{id:guid}/schedules")]
    public async Task<ActionResult<MedicationResponse>> AddSchedule(
        [FromRoute] Guid id,
        [FromBody] MedicationScheduleInput request)
    {
        var scheduleValidationError = ValidateScheduleInput(request);
        if (scheduleValidationError is not null)
        {
            return BadRequest(scheduleValidationError);
        }

        var medication = await dbContext.Medications.Include(x => x.Schedules).FirstOrDefaultAsync(x => x.Id == id);
        if (medication is null)
        {
            return NotFound();
        }

        var reminderTimeAlreadyExists = medication
            .Schedules
            .Any(x => x.ReminderTime == request.ReminderTime);

        if (reminderTimeAlreadyExists)
        {
            return BadRequest("Duplicate reminder times are not allowed for the same medication.");
        }

        var newSchedule = new MedicationSchedule
        {
            Id = Guid.NewGuid(),
            MedicationId = medication.Id,
            RepeatType = request.RepeatType.Trim().ToLowerInvariant(),
            ReminderTime = request.ReminderTime,
            DaysOfWeek = NormalizeDaysOfWeek(request.DaysOfWeek),
            UpdatedAt = DateTimeOffset.UtcNow,
        };
        dbContext.MedicationSchedules.Add(newSchedule);

        await dbContext.SaveChangesAsync();

        return Ok(ToResponse(medication));
    }

    [HttpGet("{id:guid}/schedule-preview")]
    public async Task<ActionResult<SchedulePreviewResponse>> GetSchedulePreview([FromRoute] Guid id, [FromQuery] int days = 30)
    {
        var medication = await dbContext.Medications.Include(x => x.Schedules).FirstOrDefaultAsync(x => x.Id == id);
        if (medication is null)
        {
            return NotFound();
        }

        var planned = SchedulePlanner.BuildOccurrences(
            medication.Schedules.ToArray(),
            DateOnly.FromDateTime(DateTime.UtcNow.Date),
            days);

        return Ok(new SchedulePreviewResponse { PlannedDoseTimes = planned });
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete([FromRoute] Guid id)
    {
        var medication = await dbContext.Medications.FirstOrDefaultAsync(x => x.Id == id);
        if (medication is null)
        {
            return NotFound();
        }

        dbContext.Medications.Remove(medication);
        await dbContext.SaveChangesAsync();

        return NoContent();
    }

    private static string? ValidateRequest(SaveMedicationRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
        {
            return "Medication name is required.";
        }

        if (string.IsNullOrWhiteSpace(request.Dosage))
        {
            return "Dosage is required.";
        }

        if (request.Schedules.Count == 0)
        {
            return "At least one reminder time is required.";
        }

        if (request.EndDate.HasValue && request.EndDate.Value < request.StartDate)
        {
            return "End date cannot be earlier than start date.";
        }

        var invalidScheduleError = request.Schedules.Select(ValidateScheduleInput).FirstOrDefault(x => x is not null);
        if (invalidScheduleError is not null)
        {
            return invalidScheduleError;
        }

        var duplicatedReminderTimes = request.Schedules.GroupBy(x => x.ReminderTime).Any(group => group.Count() > 1);
        if (duplicatedReminderTimes)
        {
            return "Duplicate reminder times are not allowed for the same medication.";
        }

        return null;
    }

    private static string? ValidateScheduleInput(MedicationScheduleInput schedule)
    {
        if (string.IsNullOrWhiteSpace(schedule.RepeatType))
        {
            return "Repeat type is required.";
        }

        if (!AllowedRepeatTypes.Contains(schedule.RepeatType.Trim()))
        {
            return "Repeat type must be one of: daily, weekly.";
        }

        if (schedule.RepeatType.Equals("weekly", StringComparison.OrdinalIgnoreCase) && string.IsNullOrWhiteSpace(schedule.DaysOfWeek))
        {
            return "At least one weekday is required for weekly repeat type.";
        }

        if (schedule.RepeatType.Equals("daily", StringComparison.OrdinalIgnoreCase) && !string.IsNullOrWhiteSpace(schedule.DaysOfWeek))
        {
            return "DaysOfWeek is only supported for weekly repeat type.";
        }

        return null;
    }

    private static string? NormalizeDaysOfWeek(string? daysOfWeek)
    {
        if (string.IsNullOrWhiteSpace(daysOfWeek))
        {
            return null;
        }

        return string.Join(
            ",",
            daysOfWeek
                .Split(',', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries)
                .Select(x => x.ToLowerInvariant()));
    }

    private static MedicationResponse ToResponse(Medication medication)
    {
        return new MedicationResponse
        {
            Id = medication.Id,
            Name = medication.Name,
            Dosage = medication.Dosage,
            UsageType = medication.UsageType,
            IsBeforeMeal = medication.IsBeforeMeal,
            StartDate = medication.StartDate,
            EndDate = medication.EndDate,
            IsActive = medication.IsActive,
            Schedules = medication
                .Schedules
                .OrderBy(x => x.ReminderTime)
                .Select(schedule => new MedicationScheduleInput
                {
                    RepeatType = schedule.RepeatType,
                    ReminderTime = schedule.ReminderTime,
                    DaysOfWeek = schedule.DaysOfWeek,
                })
                .ToArray(),
        };
    }
}
