using api.contracts;
using api.data;
using api.models;
using api.services;
using api.services.security;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace api.Controllers;

[ApiController]
[Route("api/dose-events")]
public sealed class DoseEventsController(AppDbContext dbContext, IAuditLogger auditLogger) : ControllerBase
{
    private static readonly HashSet<string> AllowedActions = new(StringComparer.OrdinalIgnoreCase)
    {
        "taken",
        "missed",
        "snooze",
        "clear",
    };

    [HttpPost("action")]
    public async Task<ActionResult<DoseEventResponse>> Action([FromBody] DoseActionRequest request)
    {
        if (!AllowedActions.Contains(request.ActionType))
        {
            return BadRequest("Action type must be one of: taken, missed, snooze, clear.");
        }

        var medicationExists = await dbContext.Medications.AnyAsync(x => x.Id == request.MedicationId);
        if (!medicationExists)
        {
            await auditLogger.LogAsync(
                "unauthorized-attempt",
                $"medication-not-found medicationId={request.MedicationId} actionType={request.ActionType}");
            return NotFound("Medication not found.");
        }

        var normalizedActionType = request.ActionType.Trim().ToLowerInvariant();
        var normalizedDateKey = NormalizeDateKey(request.DateKey);
        var normalizedScheduledTime = NormalizeScheduledTime(request.ScheduledTime);

        if (normalizedActionType.Equals("snooze", StringComparison.OrdinalIgnoreCase)
            && request.SnoozeMinutes is not (5 or 10 or 15))
        {
            return BadRequest("Snooze minutes must be one of: 5, 10, 15.");
        }

        var existing = await dbContext.DoseEvents.FirstOrDefaultAsync(x =>
            x.MedicationId == request.MedicationId
            && x.DateKey == normalizedDateKey
            && x.ScheduledTime == normalizedScheduledTime);

        if (normalizedActionType == "clear")
        {
            if (existing is not null)
            {
                dbContext.DoseEvents.Remove(existing);
                await dbContext.SaveChangesAsync();
            }

            return Ok(new DoseEventResponse
            {
                Id = existing?.Id ?? Guid.Empty,
                MedicationId = request.MedicationId,
                ActionType = "clear",
                DateKey = normalizedDateKey,
                ScheduledTime = normalizedScheduledTime,
                ActionAt = DateTimeOffset.UtcNow,
                SnoozeMinutes = null,
            });
        }

        var doseEvent = existing ?? new DoseEvent
        {
            Id = Guid.NewGuid(),
            MedicationId = request.MedicationId,
            ActionType = normalizedActionType,
            DateKey = normalizedDateKey,
            ScheduledTime = normalizedScheduledTime,
            CreatedAt = DateTimeOffset.UtcNow,
        };

        doseEvent.ActionType = normalizedActionType;
        doseEvent.DateKey = normalizedDateKey;
        doseEvent.ScheduledTime = normalizedScheduledTime;
        doseEvent.ActionAt = DateTimeOffset.UtcNow;
        doseEvent.SnoozeMinutes = request.SnoozeMinutes;

        if (existing is null)
        {
            dbContext.DoseEvents.Add(doseEvent);
        }

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
                return BadRequest("ActionType filter must be one of: taken, missed, snooze, clear.");
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
            DateKey = doseEvent.DateKey,
            ScheduledTime = doseEvent.ScheduledTime,
            ActionAt = doseEvent.ActionAt,
            SnoozeMinutes = doseEvent.SnoozeMinutes,
        };
    }

    private static string NormalizeDateKey(string? value)
    {
        var text = (value ?? string.Empty).Trim();
        if (DateOnly.TryParse(text, out var date))
        {
            return date.ToString("yyyy-MM-dd");
        }

        return DateOnly.FromDateTime(DateTime.UtcNow).ToString("yyyy-MM-dd");
    }

    private static string NormalizeScheduledTime(string? value)
    {
        var text = (value ?? string.Empty).Trim();
        if (TimeOnly.TryParse(text, out var time))
        {
            return time.ToString("HH:mm");
        }

        return "00:00";
    }
}
