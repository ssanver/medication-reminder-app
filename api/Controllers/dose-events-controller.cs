using api.contracts;
using api.data;
using api.models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace api.Controllers;

[ApiController]
[Route("api/dose-events")]
public sealed class DoseEventsController(AppDbContext dbContext) : ControllerBase
{
    private static readonly HashSet<string> AllowedActions = new(StringComparer.OrdinalIgnoreCase)
    {
        "taken",
        "missed",
        "snooze",
    };

    [HttpPost("action")]
    public async Task<ActionResult<DoseEventResponse>> Action([FromBody] DoseActionRequest request)
    {
        if (!AllowedActions.Contains(request.ActionType))
        {
            return BadRequest("Action type must be one of: taken, missed, snooze.");
        }

        var medicationExists = await dbContext.Medications.AnyAsync(x => x.Id == request.MedicationId);
        if (!medicationExists)
        {
            return NotFound("Medication not found.");
        }

        if (request.ActionType.Equals("snooze", StringComparison.OrdinalIgnoreCase)
            && request.SnoozeMinutes is not (5 or 10 or 15))
        {
            return BadRequest("Snooze minutes must be one of: 5, 10, 15.");
        }

        var doseEvent = new DoseEvent
        {
            Id = Guid.NewGuid(),
            MedicationId = request.MedicationId,
            ActionType = request.ActionType.ToLowerInvariant(),
            ActionAt = DateTimeOffset.UtcNow,
            SnoozeMinutes = request.SnoozeMinutes,
            CreatedAt = DateTimeOffset.UtcNow,
        };

        dbContext.DoseEvents.Add(doseEvent);
        await dbContext.SaveChangesAsync();

        return Ok(ToResponse(doseEvent));
    }

    [HttpGet("history")]
    public async Task<ActionResult<IReadOnlyCollection<DoseEventResponse>>> GetHistory([FromQuery] Guid? medicationId = null)
    {
        var query = dbContext.DoseEvents.AsNoTracking();

        if (medicationId.HasValue)
        {
            query = query.Where(x => x.MedicationId == medicationId.Value);
        }

        var result = await query.OrderByDescending(x => x.ActionAt).Take(200).ToListAsync();

        return Ok(result.Select(ToResponse).ToArray());
    }

    private static DoseEventResponse ToResponse(DoseEvent doseEvent)
    {
        return new DoseEventResponse
        {
            Id = doseEvent.Id,
            MedicationId = doseEvent.MedicationId,
            ActionType = doseEvent.ActionType,
            ActionAt = doseEvent.ActionAt,
            SnoozeMinutes = doseEvent.SnoozeMinutes,
        };
    }
}
