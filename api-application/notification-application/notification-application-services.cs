using api_domain.notification_domain;

namespace api_application.notification_application;

public sealed class NotificationDeliveryApplicationService(INotificationDeliveryRepository repository)
{
    public async Task<NotificationDeliveryRecord> CreateAsync(CreateNotificationDeliveryCommand command, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(command.UserReference))
        {
            throw new ArgumentException("User reference is required.");
        }

        if (!NotificationDeliveryStatuses.All.Contains(command.Status))
        {
            throw new ArgumentException("Status must be one of: scheduled, sent, failed.");
        }

        if (!NotificationChannels.All.Contains(command.Channel))
        {
            throw new ArgumentException("Channel must be one of: ios-local, android-local, ios-remote, android-remote.");
        }

        return await repository.CreateAsync(command, cancellationToken);
    }

    public Task<NotificationDeliveryRecord?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return repository.GetByIdAsync(id, cancellationToken);
    }

    public async Task<IReadOnlyCollection<NotificationDeliveryRecord>> ListAsync(ListNotificationDeliveriesQuery query, CancellationToken cancellationToken = default)
    {
        if (query.Take <= 0 || query.Take > 500)
        {
            throw new ArgumentException("Take must be between 1 and 500.");
        }

        if (!string.IsNullOrWhiteSpace(query.Status) && !NotificationDeliveryStatuses.All.Contains(query.Status))
        {
            throw new ArgumentException("Status must be one of: scheduled, sent, failed.");
        }

        return await repository.ListAsync(query, cancellationToken);
    }
}

public sealed class NotificationActionApplicationService(INotificationActionRepository actionRepository, INotificationDeliveryRepository deliveryRepository)
{
    public async Task<NotificationActionRecord> CreateAsync(CreateNotificationActionCommand command, CancellationToken cancellationToken = default)
    {
        if (!NotificationActionTypes.All.Contains(command.ActionType))
        {
            throw new ArgumentException("Action type must be one of: take-now, skip, snooze-5min, open.");
        }

        if (string.IsNullOrWhiteSpace(command.UserReference))
        {
            throw new ArgumentException("User reference is required.");
        }

        if (string.IsNullOrWhiteSpace(command.ClientPlatform))
        {
            throw new ArgumentException("Client platform is required.");
        }

        if (string.IsNullOrWhiteSpace(command.AppVersion))
        {
            throw new ArgumentException("App version is required.");
        }

        var deliveryExists = await deliveryRepository.ExistsAsync(command.DeliveryId, cancellationToken);
        if (!deliveryExists)
        {
            throw new KeyNotFoundException("Notification delivery was not found.");
        }

        return await actionRepository.CreateAsync(command, cancellationToken);
    }

    public Task<NotificationActionRecord?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return actionRepository.GetByIdAsync(id, cancellationToken);
    }

    public async Task<IReadOnlyCollection<NotificationActionRecord>> ListAsync(ListNotificationActionsQuery query, CancellationToken cancellationToken = default)
    {
        if (query.Take <= 0 || query.Take > 500)
        {
            throw new ArgumentException("Take must be between 1 and 500.");
        }

        if (!string.IsNullOrWhiteSpace(query.ActionType) && !NotificationActionTypes.All.Contains(query.ActionType))
        {
            throw new ArgumentException("Action type must be one of: take-now, skip, snooze-5min, open.");
        }

        return await actionRepository.ListAsync(query, cancellationToken);
    }
}
