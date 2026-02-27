namespace api.models;

public sealed class UserProfile
{
    public Guid Id { get; set; }
    public Guid UserAccountId { get; set; }
    public required string FullName { get; set; }
    public string BirthDate { get; set; } = "";
    public string Gender { get; set; } = "";
    public string PhotoUri { get; set; } = "";
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
    public UserAccount UserAccount { get; set; } = null!;
}
