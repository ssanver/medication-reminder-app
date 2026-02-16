namespace api_application.notification_application;

public interface INotificationDeliveryRepository
{
    Task<NotificationDeliveryRecord> CreateAsync(CreateNotificationDeliveryCommand command, CancellationToken cancellationToken = default);
    Task<NotificationDeliveryRecord?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IReadOnlyCollection<NotificationDeliveryRecord>> ListAsync(ListNotificationDeliveriesQuery query, CancellationToken cancellationToken = default);
    Task<bool> ExistsAsync(Guid id, CancellationToken cancellationToken = default);
}

public interface INotificationActionRepository
{
    Task<NotificationActionRecord> CreateAsync(CreateNotificationActionCommand command, CancellationToken cancellationToken = default);
    Task<NotificationActionRecord?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IReadOnlyCollection<NotificationActionRecord>> ListAsync(ListNotificationActionsQuery query, CancellationToken cancellationToken = default);
}
