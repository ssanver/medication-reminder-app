using api.contracts;
using api.services.security;
using api_application.notification_application;
using Microsoft.AspNetCore.Mvc;

namespace api.Controllers;

[ApiController]
[Route("api/notification-deliveries")]
public sealed class NotificationDeliveriesController(
    NotificationDeliveryApplicationService applicationService,
    ILogger<NotificationDeliveriesController> logger) : ControllerBase
{
    [HttpPost]
    public async Task<ActionResult<NotificationDeliveryResponse>> Create([FromBody] CreateNotificationDeliveryRequest request)
    {
        try
        {
            var created = await applicationService.CreateAsync(new CreateNotificationDeliveryCommand(
                request.UserReference,
                request.MedicationId,
                request.ScheduledAt,
                request.SentAt,
                request.Channel,
                request.Status,
                request.ProviderMessageId,
                request.ErrorCode,
                request.ErrorMessage));

            logger.LogInformation(
                "reminder-scheduled deliveryId={DeliveryId} user={UserRefMasked} status={Status} channel={Channel}",
                created.Id,
                LogMasker.Mask(created.UserReference),
                created.Status,
                created.Channel);

            return CreatedAtAction(nameof(GetById), new { id = created.Id }, ToResponse(created));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<NotificationDeliveryResponse>> GetById(Guid id)
    {
        var entity = await applicationService.GetByIdAsync(id);
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
        try
        {
            var items = await applicationService.ListAsync(new ListNotificationDeliveriesQuery(userReference, status, take));
            logger.LogInformation(
                "delivery-list-requested userFilter={UserRefMasked} statusFilter={Status} count={Count}",
                LogMasker.Mask(userReference),
                status,
                items.Count);
            return Ok(items.Select(ToResponse).ToArray());
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    private static NotificationDeliveryResponse ToResponse(NotificationDeliveryRecord entity)
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
