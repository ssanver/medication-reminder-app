using api.contracts;
using api.models;
using api.services;
using api_application.medication_application;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using AppMedicationScheduleInput = api_application.medication_application.MedicationScheduleInput;

namespace api.Controllers;

[ApiController]
[Route("api/medications")]
public sealed class MedicationsController(MedicationApplicationService applicationService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyCollection<MedicationResponse>>> GetAll([FromQuery] string? userReference = null)
    {
        var resolvedUserReference = ResolveUserReference(userReference, out var errorResult);
        if (errorResult is not null)
        {
            return errorResult;
        }

        var medications = await applicationService.ListAsync(resolvedUserReference);
        return Ok(medications.Select(ToResponse).ToArray());
    }

    [HttpPost]
    public async Task<ActionResult<MedicationResponse>> Create([FromBody] SaveMedicationRequest request, [FromQuery] string? userReference = null)
    {
        var resolvedUserReference = ResolveUserReference(userReference, out var errorResult);
        if (errorResult is not null)
        {
            return errorResult;
        }

        try
        {
            var created = await applicationService.CreateAsync(resolvedUserReference, ToSaveCommand(request));
            return CreatedAtAction(nameof(GetAll), new { id = created.Id }, ToResponse(created));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<MedicationResponse>> Update([FromRoute] Guid id, [FromBody] SaveMedicationRequest request, [FromQuery] string? userReference = null)
    {
        var resolvedUserReference = ResolveUserReference(userReference, out var errorResult);
        if (errorResult is not null)
        {
            return errorResult;
        }

        try
        {
            var updated = await applicationService.UpdateAsync(id, resolvedUserReference, ToSaveCommand(request));
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
    public async Task<ActionResult<MedicationResponse>> AddSchedule([FromRoute] Guid id, [FromBody] api.contracts.MedicationScheduleInput request, [FromQuery] string? userReference = null)
    {
        var resolvedUserReference = ResolveUserReference(userReference, out var errorResult);
        if (errorResult is not null)
        {
            return errorResult;
        }

        try
        {
            var updated = await applicationService.AddScheduleAsync(id, resolvedUserReference, ToScheduleInput(request));
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
    public async Task<ActionResult<SchedulePreviewResponse>> GetSchedulePreview([FromRoute] Guid id, [FromQuery] int days = 30, [FromQuery] string? userReference = null)
    {
        var resolvedUserReference = ResolveUserReference(userReference, out var errorResult);
        if (errorResult is not null)
        {
            return errorResult;
        }

        var medication = await applicationService.GetByIdAsync(id, resolvedUserReference);
        if (medication is null)
        {
            return NotFound();
        }

        var planned = SchedulePlanner.BuildOccurrences(
            medication.Schedules.Select(ToModelSchedule).ToArray(),
            medication.StartDate,
            DateOnly.FromDateTime(DateTime.UtcNow.Date),
            days,
            medication.EndDate);

        return Ok(new SchedulePreviewResponse { PlannedDoseTimes = planned });
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete([FromRoute] Guid id, [FromQuery] string? userReference = null)
    {
        var resolvedUserReference = ResolveUserReference(userReference, out var errorResult);
        if (errorResult is not null)
        {
            return errorResult;
        }

        try
        {
            await applicationService.DeleteAsync(id, resolvedUserReference);
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
            Math.Max(1, input.IntervalCount),
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
                    IntervalCount = schedule.IntervalCount,
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
            IntervalCount = schedule.IntervalCount,
            ReminderTime = schedule.ReminderTime,
            DaysOfWeek = schedule.DaysOfWeek,
            UpdatedAt = schedule.UpdatedAt,
        };
    }

    private string ResolveUserReference(string? userReference, out ActionResult? errorResult)
    {
        var principal = HttpContext?.User;
        var claimedEmail =
            principal?.FindFirstValue(ClaimTypes.Email)
            ?? principal?.FindFirstValue("email");

        if (!string.IsNullOrWhiteSpace(claimedEmail))
        {
            var normalizedClaimedEmail = NormalizeUserReference(claimedEmail);
            if (!string.IsNullOrWhiteSpace(userReference))
            {
                var normalizedQueryEmail = NormalizeUserReference(userReference);
                if (!string.Equals(normalizedClaimedEmail, normalizedQueryEmail, StringComparison.Ordinal))
                {
                    errorResult = Forbid();
                    return string.Empty;
                }
            }

            errorResult = null;
            return normalizedClaimedEmail;
        }

        if (string.IsNullOrWhiteSpace(userReference))
        {
            errorResult = BadRequest("userReference query parameter is required.");
            return string.Empty;
        }

        errorResult = null;
        return NormalizeUserReference(userReference);
    }

    private static string NormalizeUserReference(string value)
    {
        return value.Trim().ToLowerInvariant();
    }
}
