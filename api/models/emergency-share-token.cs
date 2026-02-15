namespace api.models;

public sealed class EmergencyShareToken
{
    public Guid Id { get; set; }
    public required string Token { get; set; }
    public required string AllowedFieldsCsv { get; set; }
    public string MedicationIdsCsv { get; set; } = string.Empty;
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset ExpiresAt { get; set; }
}
