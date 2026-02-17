using api.contracts;
using api.models;
using api.services;
using api_application.medication_application;
using Microsoft.AspNetCore.Mvc;
using AppMedicationScheduleInput = api_application.medication_application.MedicationScheduleInput;

namespace api.Controllers;

[ApiController]
[Route("api/medications")]
public sealed class MedicationsController(MedicationApplicationService applicationService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyCollection<MedicationResponse>>> GetAll()
    {
        var medications = await applicationService.ListAsync();
        return Ok(medications.Select(ToResponse).ToArray());
    }

    [HttpPost]
    public async Task<ActionResult<MedicationResponse>> Create([FromBody] SaveMedicationRequest request)
    {
        try
        {
            var created = await applicationService.CreateAsync(ToSaveCommand(request));
            return CreatedAtAction(nameof(GetAll), new { id = created.Id }, ToResponse(created));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<MedicationResponse>> Update([FromRoute] Guid id, [FromBody] SaveMedicationRequest request)
    {
        try
        {
            var updated = await applicationService.UpdateAsync(id, ToSaveCommand(request));
            return Ok(ToResponse(updated));
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPost("{id:guid}/schedules")]
    public async Task<ActionResult<MedicationResponse>> AddSchedule([FromRoute] Guid id, [FromBody] api.contracts.MedicationScheduleInput request)
    {
        try
        {
            var updated = await applicationService.AddScheduleAsync(id, ToScheduleInput(request));
            return Ok(ToResponse(updated));
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpGet("{id:guid}/schedule-preview")]
    public async Task<ActionResult<SchedulePreviewResponse>> GetSchedulePreview([FromRoute] Guid id, [FromQuery] int days = 30)
    {
        var medication = await applicationService.GetByIdAsync(id);
        if (medication is null)
        {
            return NotFound();
        }

        var planned = SchedulePlanner.BuildOccurrences(
            medication.Schedules.Select(ToModelSchedule).ToArray(),
            DateOnly.FromDateTime(DateTime.UtcNow.Date),
            days);

        return Ok(new SchedulePreviewResponse { PlannedDoseTimes = planned });
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete([FromRoute] Guid id)
    {
        try
        {
            await applicationService.DeleteAsync(id);
            return NoContent();
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    private static SaveMedicationCommand ToSaveCommand(SaveMedicationRequest request)
    {
        return new SaveMedicationCommand(
            request.Name,
            request.Dosage,
            request.UsageType,
            request.IsBeforeMeal,
            request.StartDate,
            request.EndDate,
            request.Schedules.Select(ToScheduleInput).ToArray());
    }

    private static AppMedicationScheduleInput ToScheduleInput(api.contracts.MedicationScheduleInput input)
    {
        return new AppMedicationScheduleInput(
            input.RepeatType,
            input.ReminderTime,
            input.DaysOfWeek);
    }

    private static MedicationResponse ToResponse(MedicationRecord medication)
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
            Schedules = medication.Schedules
                .OrderBy(schedule => schedule.ReminderTime)
                .Select(schedule => new api.contracts.MedicationScheduleInput
                {
                    RepeatType = schedule.RepeatType,
                    ReminderTime = schedule.ReminderTime,
                    DaysOfWeek = schedule.DaysOfWeek,
                })
                .ToArray(),
        };
    }

    private static MedicationSchedule ToModelSchedule(MedicationScheduleRecord schedule)
    {
        return new MedicationSchedule
        {
            Id = schedule.Id,
            RepeatType = schedule.RepeatType,
            ReminderTime = schedule.ReminderTime,
            DaysOfWeek = schedule.DaysOfWeek,
            UpdatedAt = schedule.UpdatedAt,
        };
    }
}
