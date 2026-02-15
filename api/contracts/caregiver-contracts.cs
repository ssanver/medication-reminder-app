namespace api.contracts;

public sealed class CreateCaregiverInviteRequest
{
    public required string CaregiverReference { get; set; }
}

public sealed class UpdateCaregiverPermissionsRequest
{
    public IReadOnlyCollection<string> AllowedModules { get; set; } = [];
}

public sealed class CaregiverInviteResponse
{
    public Guid Id { get; set; }
    public required string InviteToken { get; set; }
    public required IReadOnlyCollection<string> AllowedModules { get; set; }
    public bool IsActive { get; set; }
}
