using api.contracts;
using Microsoft.AspNetCore.Mvc;

namespace api.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class AuthController : ControllerBase
{
    [HttpPost("social-login")]
    public ActionResult<SocialLoginResponse> SocialLogin([FromBody] SocialLoginRequest request)
    {
        var provider = request.Provider.Trim().ToLowerInvariant();

        if (provider is not ("apple" or "google"))
        {
            return BadRequest("Provider must be 'apple' or 'google'.");
        }

        if (string.IsNullOrWhiteSpace(request.ProviderToken))
        {
            return BadRequest("Provider token is required.");
        }

        var now = DateTimeOffset.UtcNow;
        var providerName = provider == "apple" ? "Apple" : "Google";

        return Ok(new SocialLoginResponse
        {
            Provider = providerName,
            AccessToken = $"{provider}-at-{Guid.NewGuid():N}",
            RefreshToken = $"{provider}-rt-{Guid.NewGuid():N}",
            ExpiresAt = now.AddHours(1),
            DisplayName = providerName == "Apple" ? "Apple User" : "Google User",
            Email = providerName == "Apple" ? "apple.user@pillmind.app" : "google.user@pillmind.app",
        });
    }
}
