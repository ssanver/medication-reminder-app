using api.Controllers;
using api.contracts;
using api.data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;

namespace api.tests;

public sealed class AuthControllerTests
{
    [Theory]
    [InlineData("apple")]
    [InlineData("google")]
    public void SocialLogin_ShouldReturnOk_WhenProviderIsSupported(string provider)
    {
        using var dbContext = CreateInMemoryContext();
        var controller = CreateController(dbContext);

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
        using var dbContext = CreateInMemoryContext();
        var controller = CreateController(dbContext);

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
        using var dbContext = CreateInMemoryContext();
        var controller = CreateController(dbContext);

        var result = controller.SocialLogin(new SocialLoginRequest
        {
            Provider = "google",
            ProviderToken = "",
        });

        var badRequest = Assert.IsType<BadRequestObjectResult>(result.Result);
        Assert.Equal("Provider token is required.", badRequest.Value);
    }

    [Fact]
    public async Task RequestVerificationCode_ShouldCreateToken()
    {
        await using var dbContext = CreateInMemoryContext();
        var controller = CreateController(dbContext);

        var result = await controller.RequestVerificationCode(new EmailVerificationRequest
        {
            Email = "test@example.com",
        });

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var payload = Assert.IsType<EmailVerificationRequestResponse>(ok.Value);

        Assert.True(payload.Sent);
        Assert.NotNull(payload.DebugCode);
        Assert.Equal(1, await dbContext.EmailVerificationTokens.CountAsync());
    }

    [Fact]
    public async Task VerifyCode_ShouldReturnBadRequest_WhenInvalidCode()
    {
        await using var dbContext = CreateInMemoryContext();
        var controller = CreateController(dbContext);

        var requestResult = await controller.RequestVerificationCode(new EmailVerificationRequest
        {
            Email = "test@example.com",
        });
        var requestOk = Assert.IsType<OkObjectResult>(requestResult.Result);
        var requestPayload = Assert.IsType<EmailVerificationRequestResponse>(requestOk.Value);

        var result = await controller.VerifyCode(new VerifyEmailCodeRequest
        {
            Email = "test@example.com",
            Code = "000000",
        });

        var badRequest = Assert.IsType<BadRequestObjectResult>(result.Result);
        Assert.Equal("Verification code is invalid.", badRequest.Value);
        Assert.NotEqual("000000", requestPayload.DebugCode);
    }

    [Fact]
    public async Task VerifyCode_ShouldVerify_WhenCodeMatches()
    {
        await using var dbContext = CreateInMemoryContext();
        var controller = CreateController(dbContext);

        var requestResult = await controller.RequestVerificationCode(new EmailVerificationRequest
        {
            Email = "test@example.com",
        });
        var requestOk = Assert.IsType<OkObjectResult>(requestResult.Result);
        var requestPayload = Assert.IsType<EmailVerificationRequestResponse>(requestOk.Value);

        var result = await controller.VerifyCode(new VerifyEmailCodeRequest
        {
            Email = "test@example.com",
            Code = requestPayload.DebugCode!,
        });

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var payload = Assert.IsType<VerifyEmailCodeResponse>(ok.Value);
        Assert.True(payload.IsVerified);
    }

    private static AppDbContext CreateInMemoryContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase($"auth-tests-{Guid.NewGuid()}")
            .Options;

        return new AppDbContext(options);
    }

    private static AuthController CreateController(AppDbContext dbContext)
    {
        return new AuthController(dbContext, new FakeHostEnvironment());
    }

    private sealed class FakeHostEnvironment : IWebHostEnvironment
    {
        public string EnvironmentName { get; set; } = "Development";
        public string ApplicationName { get; set; } = "api.tests";
        public string WebRootPath { get; set; } = string.Empty;
        public IFileProvider WebRootFileProvider { get; set; } = new NullFileProvider();
        public string ContentRootPath { get; set; } = string.Empty;
        public IFileProvider ContentRootFileProvider { get; set; } = new NullFileProvider();
    }
}
