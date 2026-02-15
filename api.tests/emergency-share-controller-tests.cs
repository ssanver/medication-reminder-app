using api.Controllers;
using api.contracts;
using api.data;
using api.services.security;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace api.tests;

public sealed class EmergencyShareControllerTests
{
    [Fact]
    public async Task CreateToken_ShouldPersistAllowedFields_AndWriteAudit()
    {
        await using var dbContext = CreateInMemoryContext();
        var controller = new EmergencyShareController(dbContext, new AuditLogger(dbContext));

        var result = await controller.CreateToken(new CreateEmergencyShareTokenRequest
        {
            AllowedFields = ["name", "dosage", "frequency"],
            ExpiresInMinutes = 90,
        });

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var payload = Assert.IsType<EmergencyShareTokenResponse>(ok.Value);

        Assert.Equal(3, payload.AllowedFields.Count);
        Assert.Equal(1, await dbContext.EmergencyShareTokens.CountAsync());
        Assert.Equal(1, await dbContext.AuditLogs.CountAsync(x => x.EventType == "emergency-share-token-created"));
    }

    [Fact]
    public async Task WriteShareAudit_ShouldLogChannelAndTime()
    {
        await using var dbContext = CreateInMemoryContext();
        var controller = new EmergencyShareController(dbContext, new AuditLogger(dbContext));

        var created = await controller.CreateToken(new CreateEmergencyShareTokenRequest
        {
            AllowedFields = ["name", "dosage"],
            ExpiresInMinutes = 30,
        });
        var token = Assert.IsType<EmergencyShareTokenResponse>(Assert.IsType<OkObjectResult>(created.Result).Value).Token;

        var result = await controller.WriteShareAudit(new ShareAuditRequest
        {
            Token = token,
            Channel = "whatsapp",
        });

        Assert.IsType<OkResult>(result);
        Assert.Equal(1, await dbContext.AuditLogs.CountAsync(x => x.EventType == "emergency-share-sent"));
    }

    private static AppDbContext CreateInMemoryContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase($"pbi014-tests-{Guid.NewGuid()}")
            .Options;

        return new AppDbContext(options);
    }
}
