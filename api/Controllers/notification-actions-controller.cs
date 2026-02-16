using api.contracts;
using api.services.security;
using api_application.notification_application;
using Microsoft.AspNetCore.Mvc;

namespace api.Controllers;

[ApiController]
[Route("api/notification-actions")]
public sealed class NotificationActionsController(
    NotificationActionApplicationService applicationService,
    ILogger<NotificationActionsController> logger) : ControllerBase
{
    [HttpPost]
    public async Task<ActionResult<NotificationActionResponse>> Create([FromBody] CreateNotificationActionRequest request)
    {
        try
        {
            var created = await applicationService.CreateAsync(new CreateNotificationActionCommand(
                request.DeliveryId,
                request.UserReference,
                request.ActionType,
                request.ActionAt,
                request.ClientPlatform,
                request.AppVersion,
                request.MetadataJson));

            logger.LogInformation(
                "action-received actionId={ActionId} deliveryId={DeliveryId} actionType={ActionType} user={UserRefMasked} platform={Platform}",
                created.Id,
                created.DeliveryId,
                created.ActionType,
                LogMasker.Mask(created.UserReference),
                created.ClientPlatform);

            return CreatedAtAction(nameof(GetById), new { id = created.Id }, ToResponse(created));
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ex.Message);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<NotificationActionResponse>> GetById(Guid id)
    {
        var entity = await applicationService.GetByIdAsync(id);
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
        try
        {
            var items = await applicationService.ListAsync(new ListNotificationActionsQuery(userReference, actionType, take));
            logger.LogInformation(
                "action-list-requested userFilter={UserRefMasked} actionType={ActionType} count={Count}",
                LogMasker.Mask(userReference),
                actionType,
                items.Count);
            return Ok(items.Select(ToResponse).ToArray());
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    private static NotificationActionResponse ToResponse(NotificationActionRecord entity)
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
