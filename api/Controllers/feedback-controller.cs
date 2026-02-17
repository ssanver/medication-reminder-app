using api.contracts;
using api.data;
using api.models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace api.Controllers;

[ApiController]
[Route("api/feedback")]
public sealed class FeedbackController(AppDbContext dbContext, ILogger<FeedbackController> logger) : ControllerBase
{
    private static readonly HashSet<string> ValidCategories = new(StringComparer.OrdinalIgnoreCase)
    {
        "notification-problem",
        "add-medication-problem",
        "suggestion",
        "other",
    };

    [HttpPost]
    public async Task<ActionResult<FeedbackResponse>> Create([FromBody] CreateFeedbackRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Category) || !ValidCategories.Contains(request.Category))
        {
            return BadRequest("Category is required and must be valid.");
        }

        if (string.IsNullOrWhiteSpace(request.Message) || request.Message.Trim().Length < 10)
        {
            return BadRequest("Message must be at least 10 characters.");
        }

        var entity = new FeedbackRecord
        {
            Id = Guid.NewGuid(),
            UserId = request.UserId?.Trim(),
            Category = request.Category.Trim().ToLowerInvariant(),
            Message = request.Message.Trim(),
            AppVersion = request.AppVersion?.Trim(),
            OsVersion = request.OsVersion?.Trim(),
            DeviceModel = request.DeviceModel?.Trim(),
            NotificationPermission = request.NotificationPermission,
            Status = "open",
            CreatedAt = DateTimeOffset.UtcNow,
        };

        dbContext.FeedbackRecords.Add(entity);
        await dbContext.SaveChangesAsync();

        logger.LogInformation("feedback-submitted feedbackId={FeedbackId} category={Category}", entity.Id, entity.Category);
        return Ok(ToResponse(entity));
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyCollection<FeedbackResponse>>> List([FromQuery] int take = 100)
    {
        if (take <= 0 || take > 500)
        {
            return BadRequest("Take must be between 1 and 500.");
        }

        var items = await dbContext.FeedbackRecords.AsNoTracking()
            .OrderByDescending(x => x.CreatedAt)
            .Take(take)
            .Select(x => ToResponse(x))
            .ToArrayAsync();

        return Ok(items);
    }

    private static FeedbackResponse ToResponse(FeedbackRecord entity)
    {
        return new FeedbackResponse
        {
            Id = entity.Id,
            UserId = entity.UserId,
            Category = entity.Category,
            Message = entity.Message,
            AppVersion = entity.AppVersion,
            OsVersion = entity.OsVersion,
            DeviceModel = entity.DeviceModel,
            NotificationPermission = entity.NotificationPermission,
            Status = entity.Status,
            CreatedAt = entity.CreatedAt,
        };
    }
}
