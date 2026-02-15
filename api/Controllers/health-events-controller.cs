using api.contracts;
using api.data;
using api.models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace api.Controllers;

[ApiController]
[Route("api/health-events")]
public sealed class HealthEventsController(AppDbContext dbContext) : ControllerBase
{
    [HttpPost]
    public async Task<ActionResult<HealthEventResponse>> Save([FromBody] SaveHealthEventRequest request)
    {
        var normalizedType = request.EventType.Trim().ToLowerInvariant();
        if (normalizedType is not ("appointment" or "lab"))
        {
            return BadRequest("EventType must be appointment or lab.");
        }

        var medicationExists = await dbContext.Medications.AnyAsync(x => x.Id == request.MedicationId);
        if (!medicationExists)
        {
            return NotFound("Medication not found.");
        }

        var offsets = request.ReminderOffsets.Where(x => x >= 0).Distinct().OrderByDescending(x => x).ToArray();
        if (offsets.Length == 0)
        {
            return BadRequest("At least one valid reminder offset is required.");
        }

        var healthEvent = new HealthEvent
        {
            Id = Guid.NewGuid(),
            MedicationId = request.MedicationId,
            EventType = normalizedType,
            EventAt = request.EventAt,
            Note = request.Note,
            ReminderOffsetsCsv = string.Join(',', offsets),
            UpdatedAt = DateTimeOffset.UtcNow,
        };

        dbContext.HealthEvents.Add(healthEvent);
        await dbContext.SaveChangesAsync();

        return Ok(ToResponse(healthEvent));
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyCollection<HealthEventResponse>>> Get([FromQuery] DateOnly? fromDate = null, [FromQuery] DateOnly? toDate = null)
    {
        var query = dbContext.HealthEvents.AsNoTracking();

        if (fromDate.HasValue)
        {
            query = query.Where(x => x.EventAt >= fromDate.Value.ToDateTime(TimeOnly.MinValue));
        }

        if (toDate.HasValue)
        {
            query = query.Where(x => x.EventAt <= toDate.Value.ToDateTime(TimeOnly.MaxValue));
        }

        var result = await query.OrderBy(x => x.EventAt).Take(300).ToListAsync();
        return Ok(result.Select(ToResponse).ToArray());
    }

    private static HealthEventResponse ToResponse(HealthEvent healthEvent)
    {
        var offsets = healthEvent.ReminderOffsetsCsv
            .Split(',', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries)
            .Select(int.Parse)
            .OrderByDescending(x => x)
            .ToArray();

        return new HealthEventResponse
        {
            Id = healthEvent.Id,
            MedicationId = healthEvent.MedicationId,
            EventType = healthEvent.EventType,
            EventAt = healthEvent.EventAt,
            Note = healthEvent.Note,
            ReminderOffsets = offsets,
        };
    }
}
