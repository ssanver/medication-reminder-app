namespace api_application.notification_application;

public sealed record NotificationDeliveryRecord(
    Guid Id,
    string UserReference,
    Guid? MedicationId,
    DateTimeOffset ScheduledAt,
    DateTimeOffset? SentAt,
    string Channel,
    string Status,
    string? ProviderMessageId,
    string? ErrorCode,
    string? ErrorMessage,
    DateTimeOffset CreatedAt);

public sealed record NotificationActionRecord(
    Guid Id,
    Guid DeliveryId,
    string UserReference,
    string ActionType,
    DateTimeOffset ActionAt,
    string ClientPlatform,
    string AppVersion,
    string? MetadataJson,
    DateTimeOffset CreatedAt);

public sealed record CreateNotificationDeliveryCommand(
    string UserReference,
    Guid? MedicationId,
    DateTimeOffset ScheduledAt,
    DateTimeOffset? SentAt,
    string Channel,
    string Status,
    string? ProviderMessageId,
    string? ErrorCode,
    string? ErrorMessage);

public sealed record ListNotificationDeliveriesQuery(
    string? UserReference,
    string? Status,
    int Take);

public sealed record CreateNotificationActionCommand(
    Guid DeliveryId,
    string UserReference,
    string ActionType,
    DateTimeOffset ActionAt,
    string ClientPlatform,
    string AppVersion,
    string? MetadataJson);

public sealed record ListNotificationActionsQuery(
    string? UserReference,
    string? ActionType,
    int Take);
