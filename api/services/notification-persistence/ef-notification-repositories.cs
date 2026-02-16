using api.data;
using api.models;
using api_application.notification_application;
using Microsoft.EntityFrameworkCore;

namespace api.services.notification_persistence;

public sealed class EfNotificationDeliveryRepository(AppDbContext dbContext) : INotificationDeliveryRepository
{
    public async Task<NotificationDeliveryRecord> CreateAsync(CreateNotificationDeliveryCommand command, CancellationToken cancellationToken = default)
    {
        var entity = new NotificationDelivery
        {
            Id = Guid.NewGuid(),
            UserReference = command.UserReference.Trim(),
            MedicationId = command.MedicationId,
            ScheduledAt = command.ScheduledAt,
            SentAt = command.SentAt,
            Channel = command.Channel.Trim().ToLowerInvariant(),
            Status = command.Status.Trim().ToLowerInvariant(),
            ProviderMessageId = command.ProviderMessageId?.Trim(),
            ErrorCode = command.ErrorCode?.Trim(),
            ErrorMessage = command.ErrorMessage?.Trim(),
            CreatedAt = DateTimeOffset.UtcNow,
        };

        dbContext.NotificationDeliveries.Add(entity);
        await dbContext.SaveChangesAsync(cancellationToken);
        return ToRecord(entity);
    }

    public async Task<NotificationDeliveryRecord?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var entity = await dbContext.NotificationDeliveries.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        return entity is null ? null : ToRecord(entity);
    }

    public async Task<IReadOnlyCollection<NotificationDeliveryRecord>> ListAsync(ListNotificationDeliveriesQuery query, CancellationToken cancellationToken = default)
    {
        var source = dbContext.NotificationDeliveries.AsNoTracking().AsQueryable();
        if (!string.IsNullOrWhiteSpace(query.UserReference))
        {
            var normalizedUser = query.UserReference.Trim();
            source = source.Where(x => x.UserReference == normalizedUser);
        }

        if (!string.IsNullOrWhiteSpace(query.Status))
        {
            var normalizedStatus = query.Status.Trim().ToLowerInvariant();
            source = source.Where(x => x.Status == normalizedStatus);
        }

        return await source
            .OrderByDescending(x => x.ScheduledAt)
            .Take(query.Take)
            .Select(x => ToRecord(x))
            .ToArrayAsync(cancellationToken);
    }

    public Task<bool> ExistsAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return dbContext.NotificationDeliveries.AnyAsync(x => x.Id == id, cancellationToken);
    }

    private static NotificationDeliveryRecord ToRecord(NotificationDelivery entity)
    {
        return new NotificationDeliveryRecord(
            entity.Id,
            entity.UserReference,
            entity.MedicationId,
            entity.ScheduledAt,
            entity.SentAt,
            entity.Channel,
            entity.Status,
            entity.ProviderMessageId,
            entity.ErrorCode,
            entity.ErrorMessage,
            entity.CreatedAt);
    }
}

public sealed class EfNotificationActionRepository(AppDbContext dbContext) : INotificationActionRepository
{
    public async Task<NotificationActionRecord> CreateAsync(CreateNotificationActionCommand command, CancellationToken cancellationToken = default)
    {
        var entity = new NotificationAction
        {
            Id = Guid.NewGuid(),
            DeliveryId = command.DeliveryId,
            UserReference = command.UserReference.Trim(),
            ActionType = command.ActionType.Trim().ToLowerInvariant(),
            ActionAt = command.ActionAt == default ? DateTimeOffset.UtcNow : command.ActionAt,
            ClientPlatform = command.ClientPlatform.Trim(),
            AppVersion = command.AppVersion.Trim(),
            MetadataJson = command.MetadataJson,
            CreatedAt = DateTimeOffset.UtcNow,
        };

        dbContext.NotificationActions.Add(entity);
        await dbContext.SaveChangesAsync(cancellationToken);
        return ToRecord(entity);
    }

    public async Task<NotificationActionRecord?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var entity = await dbContext.NotificationActions.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        return entity is null ? null : ToRecord(entity);
    }

    public async Task<IReadOnlyCollection<NotificationActionRecord>> ListAsync(ListNotificationActionsQuery query, CancellationToken cancellationToken = default)
    {
        var source = dbContext.NotificationActions.AsNoTracking().AsQueryable();
        if (!string.IsNullOrWhiteSpace(query.UserReference))
        {
            var normalizedUser = query.UserReference.Trim();
            source = source.Where(x => x.UserReference == normalizedUser);
        }

        if (!string.IsNullOrWhiteSpace(query.ActionType))
        {
            var normalizedActionType = query.ActionType.Trim().ToLowerInvariant();
            source = source.Where(x => x.ActionType == normalizedActionType);
        }

        return await source
            .OrderByDescending(x => x.ActionAt)
            .Take(query.Take)
            .Select(x => ToRecord(x))
            .ToArrayAsync(cancellationToken);
    }

    private static NotificationActionRecord ToRecord(NotificationAction entity)
    {
        return new NotificationActionRecord(
            entity.Id,
            entity.DeliveryId,
            entity.UserReference,
            entity.ActionType,
            entity.ActionAt,
            entity.ClientPlatform,
            entity.AppVersion,
            entity.MetadataJson,
            entity.CreatedAt);
    }
}
