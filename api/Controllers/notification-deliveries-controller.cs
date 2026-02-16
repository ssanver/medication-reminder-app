using api.contracts;
using api.data;
using api.models;
using api.services.security;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace api.Controllers;

[ApiController]
[Route("api/notification-deliveries")]
public sealed class NotificationDeliveriesController(AppDbContext dbContext, ILogger<NotificationDeliveriesController> logger) : ControllerBase
{
    private static readonly HashSet<string> ValidStatuses = new(StringComparer.OrdinalIgnoreCase)
    {
        "scheduled",
        "sent",
        "failed",
    };

    private static readonly HashSet<string> ValidChannels = new(StringComparer.OrdinalIgnoreCase)
    {
        "ios-local",
        "android-local",
        "ios-remote",
        "android-remote",
    };

    [HttpPost]
    public async Task<ActionResult<NotificationDeliveryResponse>> Create([FromBody] CreateNotificationDeliveryRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.UserReference))
        {
            return BadRequest("User reference is required.");
        }

        if (!ValidStatuses.Contains(request.Status))
        {
            return BadRequest("Status must be one of: scheduled, sent, failed.");
        }

        if (!ValidChannels.Contains(request.Channel))
        {
            return BadRequest("Channel must be one of: ios-local, android-local, ios-remote, android-remote.");
        }

        var entity = new NotificationDelivery
        {
            Id = Guid.NewGuid(),
            UserReference = request.UserReference.Trim(),
            MedicationId = request.MedicationId,
            ScheduledAt = request.ScheduledAt,
            SentAt = request.SentAt,
            Channel = request.Channel.Trim().ToLowerInvariant(),
            Status = request.Status.Trim().ToLowerInvariant(),
            ProviderMessageId = request.ProviderMessageId?.Trim(),
            ErrorCode = request.ErrorCode?.Trim(),
            ErrorMessage = request.ErrorMessage?.Trim(),
            CreatedAt = DateTimeOffset.UtcNow,
        };

        dbContext.NotificationDeliveries.Add(entity);
        await dbContext.SaveChangesAsync();

        logger.LogInformation(
            "reminder-scheduled deliveryId={DeliveryId} user={UserRefMasked} status={Status} channel={Channel}",
            entity.Id,
            LogMasker.Mask(entity.UserReference),
            entity.Status,
            entity.Channel);

        return CreatedAtAction(nameof(GetById), new { id = entity.Id }, ToResponse(entity));
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<NotificationDeliveryResponse>> GetById(Guid id)
    {
        var entity = await dbContext.NotificationDeliveries.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id);
        if (entity is null)
        {
            return NotFound();
        }

        return Ok(ToResponse(entity));
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyCollection<NotificationDeliveryResponse>>> List(
        [FromQuery] string? userReference,
        [FromQuery] string? status,
        [FromQuery] int take = 100)
    {
        if (take <= 0 || take > 500)
        {
            return BadRequest("Take must be between 1 and 500.");
        }

        var query = dbContext.NotificationDeliveries.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(userReference))
        {
            var normalizedUser = userReference.Trim();
            query = query.Where(x => x.UserReference == normalizedUser);
        }

        if (!string.IsNullOrWhiteSpace(status))
        {
            var normalizedStatus = status.Trim().ToLowerInvariant();
            if (!ValidStatuses.Contains(normalizedStatus))
            {
                return BadRequest("Status must be one of: scheduled, sent, failed.");
            }

            query = query.Where(x => x.Status == normalizedStatus);
        }

        var items = await query
            .OrderByDescending(x => x.ScheduledAt)
            .Take(take)
            .Select(x => ToResponse(x))
            .ToArrayAsync();

        logger.LogInformation(
            "delivery-list-requested userFilter={UserRefMasked} statusFilter={Status} count={Count}",
            LogMasker.Mask(userReference),
            status,
            items.Length);

        return Ok(items);
    }

    private static NotificationDeliveryResponse ToResponse(NotificationDelivery entity)
    {
        return new NotificationDeliveryResponse
        {
            Id = entity.Id,
            UserReference = entity.UserReference,
            MedicationId = entity.MedicationId,
            ScheduledAt = entity.ScheduledAt,
            SentAt = entity.SentAt,
            Channel = entity.Channel,
            Status = entity.Status,
            ProviderMessageId = entity.ProviderMessageId,
            ErrorCode = entity.ErrorCode,
            ErrorMessage = entity.ErrorMessage,
            CreatedAt = entity.CreatedAt,
        };
    }
}
