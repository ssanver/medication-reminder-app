using api.data;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace api.tests;

public sealed class HealthAndConfigurationTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;

    public HealthAndConfigurationTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task HealthEndpoint_ShouldReturn401_WhenTokenMissing()
    {
        using var client = _factory.CreateClient();

        var response = await client.GetAsync("/health");

        Assert.Equal(System.Net.HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task HealthEndpoint_ShouldReturn200_WhenTokenProvided()
    {
        using var client = _factory.CreateClient();
        var email = $"health-{Guid.NewGuid():N}@pillmind.local";
        var signUpResponse = await client.PostAsJsonAsync("/api/auth/email/sign-up", new
        {
            firstName = "Health",
            lastName = "Tester",
            email,
            password = "Sth280711!",
        });
        signUpResponse.EnsureSuccessStatusCode();

        var payload = await signUpResponse.Content.ReadFromJsonAsync<EmailAuthTokenPayload>();
        Assert.NotNull(payload);
        Assert.False(string.IsNullOrWhiteSpace(payload!.AccessToken));

        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", payload.AccessToken);
        var response = await client.GetAsync("/health");
        Assert.True(response.IsSuccessStatusCode);
    }

    [Fact]
    public void AppDbContext_ShouldBeRegisteredWithSqlServerProvider()
    {
        using var scope = _factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        Assert.NotNull(dbContext);
        Assert.Equal("Microsoft.EntityFrameworkCore.SqlServer", dbContext.Database.ProviderName);
    }
}

public sealed class EmailAuthTokenPayload
{
    public string AccessToken { get; set; } = string.Empty;
}
