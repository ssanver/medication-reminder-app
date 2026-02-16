namespace api.contracts;

public sealed class CreateNotificationActionRequest
{
    public Guid DeliveryId { get; set; }
    public required string UserReference { get; set; }
    public required string ActionType { get; set; }
    public DateTimeOffset ActionAt { get; set; }
    public required string ClientPlatform { get; set; }
    public required string AppVersion { get; set; }
    public string? MetadataJson { get; set; }
}

public sealed class NotificationActionResponse
{
    public Guid Id { get; set; }
    public Guid DeliveryId { get; set; }
    public required string UserReference { get; set; }
    public required string ActionType { get; set; }
    public DateTimeOffset ActionAt { get; set; }
    public required string ClientPlatform { get; set; }
    public required string AppVersion { get; set; }
    public string? MetadataJson { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
}
