using api.contracts;
using api.data;
using api.models;
using api.services.security;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace api.Controllers;

[ApiController]
[Route("api/notification-actions")]
public sealed class NotificationActionsController(AppDbContext dbContext, ILogger<NotificationActionsController> logger) : ControllerBase
{
    private static readonly HashSet<string> ValidActions = new(StringComparer.OrdinalIgnoreCase)
    {
        "take-now",
        "skip",
        "snooze-5min",
        "open",
    };

    [HttpPost]
    public async Task<ActionResult<NotificationActionResponse>> Create([FromBody] CreateNotificationActionRequest request)
    {
        if (!ValidActions.Contains(request.ActionType))
        {
            return BadRequest("Action type must be one of: take-now, skip, snooze-5min, open.");
        }

        if (string.IsNullOrWhiteSpace(request.UserReference))
        {
            return BadRequest("User reference is required.");
        }

        if (string.IsNullOrWhiteSpace(request.ClientPlatform))
        {
            return BadRequest("Client platform is required.");
        }

        if (string.IsNullOrWhiteSpace(request.AppVersion))
        {
            return BadRequest("App version is required.");
        }

        var deliveryExists = await dbContext.NotificationDeliveries.AnyAsync(x => x.Id == request.DeliveryId);
        if (!deliveryExists)
        {
            return NotFound("Notification delivery was not found.");
        }

        var entity = new NotificationAction
        {
            Id = Guid.NewGuid(),
            DeliveryId = request.DeliveryId,
            UserReference = request.UserReference.Trim(),
            ActionType = request.ActionType.Trim().ToLowerInvariant(),
            ActionAt = request.ActionAt == default ? DateTimeOffset.UtcNow : request.ActionAt,
            ClientPlatform = request.ClientPlatform.Trim(),
            AppVersion = request.AppVersion.Trim(),
            MetadataJson = request.MetadataJson,
            CreatedAt = DateTimeOffset.UtcNow,
        };

        dbContext.NotificationActions.Add(entity);
        await dbContext.SaveChangesAsync();

        logger.LogInformation(
            "action-received actionId={ActionId} deliveryId={DeliveryId} actionType={ActionType} user={UserRefMasked} platform={Platform}",
            entity.Id,
            entity.DeliveryId,
            entity.ActionType,
            LogMasker.Mask(entity.UserReference),
            entity.ClientPlatform);

        return CreatedAtAction(nameof(GetById), new { id = entity.Id }, ToResponse(entity));
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<NotificationActionResponse>> GetById(Guid id)
    {
        var entity = await dbContext.NotificationActions.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id);
        if (entity is null)
        {
            return NotFound();
        }

        return Ok(ToResponse(entity));
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyCollection<NotificationActionResponse>>> List(
        [FromQuery] string? userReference,
        [FromQuery] string? actionType,
        [FromQuery] int take = 100)
    {
        if (take <= 0 || take > 500)
        {
            return BadRequest("Take must be between 1 and 500.");
        }

        var query = dbContext.NotificationActions.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(userReference))
        {
            var normalizedUser = userReference.Trim();
            query = query.Where(x => x.UserReference == normalizedUser);
        }

        if (!string.IsNullOrWhiteSpace(actionType))
        {
            var normalizedActionType = actionType.Trim().ToLowerInvariant();
            if (!ValidActions.Contains(normalizedActionType))
            {
                return BadRequest("Action type must be one of: take-now, skip, snooze-5min, open.");
            }

            query = query.Where(x => x.ActionType == normalizedActionType);
        }

        var items = await query
            .OrderByDescending(x => x.ActionAt)
            .Take(take)
            .Select(x => ToResponse(x))
            .ToArrayAsync();

        logger.LogInformation(
            "action-list-requested userFilter={UserRefMasked} actionType={ActionType} count={Count}",
            LogMasker.Mask(userReference),
            actionType,
            items.Length);

        return Ok(items);
    }

    private static NotificationActionResponse ToResponse(NotificationAction entity)
    {
        return new NotificationActionResponse
        {
            Id = entity.Id,
            DeliveryId = entity.DeliveryId,
            UserReference = entity.UserReference,
            ActionType = entity.ActionType,
            ActionAt = entity.ActionAt,
            ClientPlatform = entity.ClientPlatform,
            AppVersion = entity.AppVersion,
            MetadataJson = entity.MetadataJson,
            CreatedAt = entity.CreatedAt,
        };
    }
}
