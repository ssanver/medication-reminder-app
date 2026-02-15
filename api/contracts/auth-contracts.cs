namespace api.contracts;

public sealed class SocialLoginRequest
{
    public required string Provider { get; set; }
    public string? ProviderToken { get; set; }
}

public sealed class SocialLoginResponse
{
    public required string Provider { get; set; }
    public required string AccessToken { get; set; }
    public required string RefreshToken { get; set; }
    public required DateTimeOffset ExpiresAt { get; set; }
    public required string DisplayName { get; set; }
    public required string Email { get; set; }
}
