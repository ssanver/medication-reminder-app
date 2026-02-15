namespace api.contracts;

public sealed class SaveConsentRequest
{
    public required string UserReference { get; set; }
    public required string PrivacyVersion { get; set; }
}

public sealed class ConsentResponse
{
    public required string UserReference { get; set; }
    public required string PrivacyVersion { get; set; }
    public DateTimeOffset AcceptedAt { get; set; }
}

public sealed class AuditLogResponse
{
    public required string EventType { get; set; }
    public required string PayloadMasked { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
}
