using api.Controllers;
using api.contracts;
using api.data;
using api.services.security;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace api.tests;

public sealed class SecurityControllerTests
{
    [Fact]
    public async Task SaveConsent_ShouldPersistConsentAndAuditLog()
    {
        await using var dbContext = CreateInMemoryContext();
        var controller = new SecurityController(dbContext, new AuditLogger(dbContext));

        var result = await controller.SaveConsent(new SaveConsentRequest
        {
            UserReference = "user123@example.com",
            PrivacyVersion = "kvkk-v1",
        });

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var payload = Assert.IsType<ConsentResponse>(ok.Value);

        Assert.Equal("kvkk-v1", payload.PrivacyVersion);
        Assert.Equal(1, await dbContext.ConsentRecords.CountAsync());
        Assert.Equal(1, await dbContext.AuditLogs.CountAsync(x => x.EventType == "consent-accepted"));
    }

    [Fact]
    public void LogMasker_ShouldMaskEmailAndLongDigits()
    {
        var masked = LogMasker.Mask("mail=user123@example.com tc=12345678901");

        Assert.DoesNotContain("example.com", masked);
        Assert.DoesNotContain("12345678901", masked);
        Assert.Contains("01", masked);
    }

    private static AppDbContext CreateInMemoryContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase($"pbi011-tests-{Guid.NewGuid()}")
            .Options;

        return new AppDbContext(options);
    }
}
