namespace api.models;

public sealed class UserPreference
{
    public Guid Id { get; set; }
    public required string UserReference { get; set; }
    public string WeekStartsOn { get; set; } = "monday";
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
}
