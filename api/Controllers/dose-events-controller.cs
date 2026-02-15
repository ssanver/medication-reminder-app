using api.contracts;
using api.data;
using api.models;
using api.services;
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

        if (doseEvent.ActionType == "taken")
        {
            var inventory = await dbContext.InventoryRecords.FirstOrDefaultAsync(x => x.MedicationId == request.MedicationId);
            if (inventory is not null)
            {
                inventory.CurrentStock = Math.Max(0, inventory.CurrentStock - 1);
                inventory.UpdatedAt = DateTimeOffset.UtcNow;
                if (inventory.CurrentStock <= inventory.Threshold)
                {
                    inventory.LastAlertAt = DateTimeOffset.UtcNow;
                }
            }
        }

        await dbContext.SaveChangesAsync();

        return Ok(ToResponse(doseEvent));
    }

    [HttpGet("history")]
    public async Task<ActionResult<IReadOnlyCollection<DoseEventResponse>>> GetHistory([FromQuery] DoseHistoryQuery query)
    {
        var eventsQuery = dbContext.DoseEvents.AsNoTracking();

        if (query.MedicationId.HasValue)
        {
            eventsQuery = eventsQuery.Where(x => x.MedicationId == query.MedicationId.Value);
        }

        if (!string.IsNullOrWhiteSpace(query.ActionType))
        {
            var normalized = query.ActionType.Trim().ToLowerInvariant();
            if (!AllowedActions.Contains(normalized))
            {
                return BadRequest("ActionType filter must be one of: taken, missed, snooze.");
            }

            eventsQuery = eventsQuery.Where(x => x.ActionType == normalized);
        }

        if (query.FromDate.HasValue)
        {
            var fromDateTime = query.FromDate.Value.ToDateTime(TimeOnly.MinValue);
            eventsQuery = eventsQuery.Where(x => x.ActionAt >= fromDateTime);
        }

        if (query.ToDate.HasValue)
        {
            var toDateTime = query.ToDate.Value.ToDateTime(TimeOnly.MaxValue);
            eventsQuery = eventsQuery.Where(x => x.ActionAt <= toDateTime);
        }

        var result = await eventsQuery.OrderByDescending(x => x.ActionAt).Take(400).ToListAsync();

        return Ok(result.Select(ToResponse).ToArray());
    }

    [HttpGet("summary")]
    public async Task<ActionResult<DoseSummaryResponse>> GetSummary([FromQuery] DateOnly fromDate, [FromQuery] DateOnly toDate)
    {
        if (toDate < fromDate)
        {
            return BadRequest("toDate cannot be earlier than fromDate.");
        }

        var events = await dbContext
            .DoseEvents
            .AsNoTracking()
            .Where(x => x.ActionAt >= fromDate.ToDateTime(TimeOnly.MinValue) && x.ActionAt <= toDate.ToDateTime(TimeOnly.MaxValue))
            .ToListAsync();

        var medications = await dbContext
            .Medications
            .AsNoTracking()
            .Include(x => x.Schedules)
            .Where(x => x.IsActive)
            .ToListAsync();

        var dayCount = (toDate.DayNumber - fromDate.DayNumber) + 1;
        var plannedCount = medications
            .Sum(medication => SchedulePlanner.BuildOccurrences(medication.Schedules.ToArray(), fromDate, dayCount).Count);

        var takenCount = events.Count(x => x.ActionType == "taken");
        var missedCount = events.Count(x => x.ActionType == "missed");
        var snoozedCount = events.Count(x => x.ActionType == "snooze");

        var adherenceRate = plannedCount == 0
            ? 0
            : Math.Round((decimal)takenCount / plannedCount, 4, MidpointRounding.AwayFromZero);

        return Ok(new DoseSummaryResponse
        {
            FromDate = fromDate,
            ToDate = toDate,
            PlannedCount = plannedCount,
            TakenCount = takenCount,
            MissedCount = missedCount,
            SnoozedCount = snoozedCount,
            AdherenceRate = adherenceRate,
        });
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
