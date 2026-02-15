namespace api.contracts;

public sealed class CreateEmergencyShareTokenRequest
{
    public IReadOnlyCollection<Guid> MedicationIds { get; set; } = [];
    public IReadOnlyCollection<string> AllowedFields { get; set; } = [];
    public int ExpiresInMinutes { get; set; } = 60;
}

public sealed class EmergencyShareTokenResponse
{
    public required string Token { get; set; }
    public DateTimeOffset ExpiresAt { get; set; }
    public required IReadOnlyCollection<string> AllowedFields { get; set; }
}

public sealed class ShareAuditRequest
{
    public required string Token { get; set; }
    public required string Channel { get; set; }
}
