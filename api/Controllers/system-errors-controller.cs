using api.contracts;
using api.data;
using api.models;
using api.services.security;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace api.Controllers;

[ApiController]
[Route("api/system-errors")]
public sealed class SystemErrorsController(AppDbContext dbContext, ILogger<SystemErrorsController> logger) : ControllerBase
{
    [HttpPost]
    public async Task<ActionResult<SystemErrorResponse>> Create([FromBody] CreateSystemErrorRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.AppVersion))
        {
            return BadRequest("App version is required.");
        }

        if (string.IsNullOrWhiteSpace(request.Platform))
        {
            return BadRequest("Platform is required.");
        }

        if (string.IsNullOrWhiteSpace(request.ErrorType))
        {
            return BadRequest("Error type is required.");
        }

        if (string.IsNullOrWhiteSpace(request.Message))
        {
            return BadRequest("Message is required.");
        }

        var entity = new SystemErrorReport
        {
            Id = Guid.NewGuid(),
            UserReference = request.UserReference?.Trim(),
            AppVersion = request.AppVersion.Trim(),
            Platform = request.Platform.Trim(),
            Device = request.Device?.Trim(),
            Locale = request.Locale?.Trim(),
            ErrorType = request.ErrorType.Trim(),
            Message = request.Message.Trim(),
            StackTrace = request.StackTrace,
            CorrelationId = request.CorrelationId,
            OccurredAt = request.OccurredAt == default ? DateTimeOffset.UtcNow : request.OccurredAt,
            CreatedAt = DateTimeOffset.UtcNow,
        };

        dbContext.SystemErrorReports.Add(entity);
        await dbContext.SaveChangesAsync();

        logger.LogError(
            "system-error-captured id={ErrorId} version={Version} platform={Platform} user={UserRefMasked} type={ErrorType} correlation={CorrelationId}",
            entity.Id,
            entity.AppVersion,
            entity.Platform,
            LogMasker.Mask(entity.UserReference),
            entity.ErrorType,
            entity.CorrelationId);

        return CreatedAtAction(nameof(GetById), new { id = entity.Id }, ToResponse(entity));
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<SystemErrorResponse>> GetById(Guid id)
    {
        var item = await dbContext.SystemErrorReports.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id);
        if (item is null)
        {
            return NotFound();
        }

        return Ok(ToResponse(item));
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyCollection<SystemErrorResponse>>> List(
        [FromQuery] string? appVersion,
        [FromQuery] string? platform,
        [FromQuery] int take = 100)
    {
        if (take <= 0 || take > 500)
        {
            return BadRequest("Take must be between 1 and 500.");
        }

        var query = dbContext.SystemErrorReports.AsNoTracking().AsQueryable();
        if (!string.IsNullOrWhiteSpace(appVersion))
        {
            var normalizedVersion = appVersion.Trim();
            query = query.Where(x => x.AppVersion == normalizedVersion);
        }

        if (!string.IsNullOrWhiteSpace(platform))
        {
            var normalizedPlatform = platform.Trim();
            query = query.Where(x => x.Platform == normalizedPlatform);
        }

        var items = await query
            .OrderByDescending(x => x.OccurredAt)
            .Take(take)
            .Select(x => ToResponse(x))
            .ToArrayAsync();

        return Ok(items);
    }

    private static SystemErrorResponse ToResponse(SystemErrorReport entity)
    {
        return new SystemErrorResponse
        {
            Id = entity.Id,
            UserReference = entity.UserReference,
            AppVersion = entity.AppVersion,
            Platform = entity.Platform,
            Device = entity.Device,
            Locale = entity.Locale,
            ErrorType = entity.ErrorType,
            Message = entity.Message,
            StackTrace = entity.StackTrace,
            CorrelationId = entity.CorrelationId,
            OccurredAt = entity.OccurredAt,
            CreatedAt = entity.CreatedAt,
        };
    }
}
