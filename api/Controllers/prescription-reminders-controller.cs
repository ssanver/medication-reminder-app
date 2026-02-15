using api.contracts;
using api.data;
using api.models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace api.Controllers;

[ApiController]
[Route("api/prescription-reminders")]
public sealed class PrescriptionRemindersController(AppDbContext dbContext) : ControllerBase
{
    [HttpPost]
    public async Task<ActionResult<PrescriptionReminderResponse>> Save([FromBody] SavePrescriptionReminderRequest request)
    {
        var medicationExists = await dbContext.Medications.AnyAsync(x => x.Id == request.MedicationId);
        if (!medicationExists)
        {
            return NotFound("Medication not found.");
        }

        var offsets = request
            .TemplateOffsets
            .Concat(request.CustomOffsets)
            .Where(x => x >= 0)
            .Distinct()
            .OrderByDescending(x => x)
            .ToArray();

        if (offsets.Length == 0)
        {
            return BadRequest("At least one valid offset is required.");
        }

        var csv = string.Join(',', offsets);

        var reminder = await dbContext.PrescriptionReminders.FirstOrDefaultAsync(x => x.MedicationId == request.MedicationId);
        if (reminder is null)
        {
            reminder = new PrescriptionReminder
            {
                Id = Guid.NewGuid(),
                MedicationId = request.MedicationId,
                OffsetsCsv = "1",
            };

            dbContext.PrescriptionReminders.Add(reminder);
        }

        reminder.RenewalDate = request.RenewalDate;
        reminder.OffsetsCsv = csv;
        reminder.UpdatedAt = DateTimeOffset.UtcNow;

        await dbContext.SaveChangesAsync();

        return Ok(ToResponse(reminder));
    }

    [HttpGet("upcoming")]
    public async Task<ActionResult<IReadOnlyCollection<PrescriptionReminderResponse>>> GetUpcoming([FromQuery] DateOnly date)
    {
        var reminders = await dbContext.PrescriptionReminders.AsNoTracking().ToListAsync();
        var result = reminders
            .Select(ToResponse)
            .Where(response => response.ReminderDates.Contains(date))
            .ToArray();

        return Ok(result);
    }

    private static PrescriptionReminderResponse ToResponse(PrescriptionReminder reminder)
    {
        var offsets = reminder
            .OffsetsCsv
            .Split(',', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries)
            .Select(int.Parse)
            .Distinct()
            .OrderByDescending(x => x)
            .ToArray();

        var dates = offsets.Select(offset => reminder.RenewalDate.AddDays(-offset)).ToArray();

        return new PrescriptionReminderResponse
        {
            MedicationId = reminder.MedicationId,
            RenewalDate = reminder.RenewalDate,
            Offsets = offsets,
            ReminderDates = dates,
        };
    }
}
