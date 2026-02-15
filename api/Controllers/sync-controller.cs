using api.contracts;
using api.data;
using api.models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace api.Controllers;

[ApiController]
[Route("api/sync")]
public sealed class SyncController(AppDbContext dbContext) : ControllerBase
{
    [HttpPost("push")]
    public async Task<ActionResult<SyncPushResponse>> Push([FromBody] SyncPushRequest request)
    {
        var existingEventIds = await dbContext.SyncEvents
            .AsNoTracking()
            .Where(x => request.Items.Select(item => item.EventId).Contains(x.EventId))
            .Select(x => x.EventId)
            .ToListAsync();

        var existingSet = existingEventIds.ToHashSet(StringComparer.Ordinal);
        var toInsert = request.Items.Where(item => !existingSet.Contains(item.EventId)).ToArray();

        dbContext.SyncEvents.AddRange(
            toInsert.Select(item => new SyncEvent
            {
                Id = Guid.NewGuid(),
                EventId = item.EventId,
                EventType = item.EventType,
                PayloadJson = item.PayloadJson,
                ClientUpdatedAt = item.ClientUpdatedAt,
                ReceivedAt = DateTimeOffset.UtcNow,
            }));

        await dbContext.SaveChangesAsync();

        return Ok(new SyncPushResponse
        {
            AcceptedCount = toInsert.Length,
            DuplicateCount = request.Items.Count - toInsert.Length,
        });
    }

    [HttpPost("pull")]
    public async Task<ActionResult<SyncPullResponse>> Pull([FromQuery] DateTimeOffset? since = null)
    {
        var query = dbContext.SyncEvents.AsNoTracking();
        if (since.HasValue)
        {
            query = query.Where(x => x.ReceivedAt > since.Value);
        }

        var events = await query
            .OrderBy(x => x.ReceivedAt)
            .Take(500)
            .Select(x => new SyncItemRequest
            {
                EventId = x.EventId,
                EventType = x.EventType,
                PayloadJson = x.PayloadJson,
                ClientUpdatedAt = x.ClientUpdatedAt,
            })
            .ToListAsync();

        return Ok(new SyncPullResponse { Items = events });
    }
}
