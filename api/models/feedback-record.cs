namespace api.models;

public sealed class FeedbackRecord
{
    public Guid Id { get; set; }
    public string? UserId { get; set; }
    public required string Category { get; set; }
    public required string Message { get; set; }
    public string? AppVersion { get; set; }
    public string? OsVersion { get; set; }
    public string? DeviceModel { get; set; }
    public bool? NotificationPermission { get; set; }
    public required string Status { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}
