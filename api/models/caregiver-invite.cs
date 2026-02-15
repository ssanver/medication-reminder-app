namespace api.models;

public sealed class CaregiverInvite
{
    public Guid Id { get; set; }
    public required string CaregiverReference { get; set; }
    public required string InviteToken { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}
