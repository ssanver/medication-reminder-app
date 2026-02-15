namespace api.models;

public sealed class CaregiverPermission
{
    public Guid Id { get; set; }
    public Guid CaregiverInviteId { get; set; }
    public required string AllowedModulesCsv { get; set; }
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
}
