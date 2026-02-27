namespace api.contracts;

public sealed class UserProfileResponse
{
    public required string UserReference { get; set; }
    public required string FullName { get; set; }
    public required string Email { get; set; }
    public required string BirthDate { get; set; }
    public required string Gender { get; set; }
    public required string PhotoUri { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
}

public sealed class UpsertUserProfileRequest
{
    public string? UserReference { get; set; }
    public string? FullName { get; set; }
    public string? Email { get; set; }
    public string? BirthDate { get; set; }
    public string? Gender { get; set; }
    public string? PhotoUri { get; set; }
}
