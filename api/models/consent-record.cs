namespace api.models;

public sealed class ConsentRecord
{
    public Guid Id { get; set; }
    public required string UserReference { get; set; }
    public required string PrivacyVersion { get; set; }
    public DateTimeOffset AcceptedAt { get; set; } = DateTimeOffset.UtcNow;
}
