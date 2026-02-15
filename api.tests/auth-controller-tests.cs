using api.Controllers;
using api.contracts;
using Microsoft.AspNetCore.Mvc;

namespace api.tests;

public sealed class AuthControllerTests
{
    [Theory]
    [InlineData("apple")]
    [InlineData("google")]
    public void SocialLogin_ShouldReturnOk_WhenProviderIsSupported(string provider)
    {
        var controller = new AuthController();

        var result = controller.SocialLogin(new SocialLoginRequest
        {
            Provider = provider,
            ProviderToken = "provider-token",
        });

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var payload = Assert.IsType<SocialLoginResponse>(ok.Value);

        Assert.Equal(provider == "apple" ? "Apple" : "Google", payload.Provider);
        Assert.NotEmpty(payload.AccessToken);
        Assert.NotEmpty(payload.RefreshToken);
        Assert.True(payload.ExpiresAt > DateTimeOffset.UtcNow);
    }

    [Fact]
    public void SocialLogin_ShouldReturnBadRequest_WhenProviderIsUnsupported()
    {
        var controller = new AuthController();

        var result = controller.SocialLogin(new SocialLoginRequest
        {
            Provider = "facebook",
            ProviderToken = "provider-token",
        });

        var badRequest = Assert.IsType<BadRequestObjectResult>(result.Result);
        Assert.Equal("Provider must be 'apple' or 'google'.", badRequest.Value);
    }

    [Fact]
    public void SocialLogin_ShouldReturnBadRequest_WhenProviderTokenIsMissing()
    {
        var controller = new AuthController();

        var result = controller.SocialLogin(new SocialLoginRequest
        {
            Provider = "google",
            ProviderToken = "",
        });

        var badRequest = Assert.IsType<BadRequestObjectResult>(result.Result);
        Assert.Equal("Provider token is required.", badRequest.Value);
    }
}
