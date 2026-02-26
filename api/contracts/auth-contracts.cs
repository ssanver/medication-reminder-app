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

public sealed class EmailVerificationRequest
{
    public required string Email { get; set; }
}

public sealed class VerifyEmailCodeRequest
{
    public required string Email { get; set; }
    public required string Code { get; set; }
}

public sealed class EmailVerificationStatusResponse
{
    public required string Email { get; set; }
    public required bool IsVerified { get; set; }
    public int? ResendAvailableInSeconds { get; set; }
    public DateTimeOffset? LockedUntil { get; set; }
    public DateTimeOffset? ExpiresAt { get; set; }
}

public sealed class EmailVerificationRequestResponse
{
    public required string Email { get; set; }
    public required bool Sent { get; set; }
    public int? ResendAvailableInSeconds { get; set; }
    public DateTimeOffset ExpiresAt { get; set; }
    public string? DebugCode { get; set; }
}

public sealed class VerifyEmailCodeResponse
{
    public required string Email { get; set; }
    public required bool IsVerified { get; set; }
}

public sealed class EmailSignUpRequest
{
    public required string FirstName { get; set; }
    public required string LastName { get; set; }
    public required string Email { get; set; }
    public required string Password { get; set; }
}

public sealed class EmailSignInRequest
{
    public required string Email { get; set; }
    public required string Password { get; set; }
}

public sealed class ChangePasswordRequest
{
    public required string Email { get; set; }
    public required string CurrentPassword { get; set; }
    public required string NewPassword { get; set; }
}

public sealed class CancelAccountRequest
{
    public required string Email { get; set; }
    public required string Password { get; set; }
}

public sealed class EmailAuthResponse
{
    public required Guid UserId { get; set; }
    public required string FirstName { get; set; }
    public required string LastName { get; set; }
    public required string Email { get; set; }
    public required bool IsEmailVerified { get; set; }
    public required string AccessToken { get; set; }
    public required string RefreshToken { get; set; }
    public required DateTimeOffset ExpiresAt { get; set; }
}
