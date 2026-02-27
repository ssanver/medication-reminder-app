namespace api.contracts;

public sealed class UserPreferenceResponse
{
    public required string UserReference { get; set; }
    public required string WeekStartsOn { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
}

public sealed class UpdateUserPreferenceRequest
{
    public string? UserReference { get; set; }
    public required string WeekStartsOn { get; set; }
}
