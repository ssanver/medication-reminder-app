using api.Controllers;
using api.contracts;
using api.data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace api.tests;

public sealed class CaregiversControllerTests
{
    [Fact]
    public async Task Invite_ShouldCreateDefaultPermissions()
    {
        await using var dbContext = CreateInMemoryContext();
        var controller = new CaregiversController(dbContext);

        var result = await controller.Invite(new CreateCaregiverInviteRequest
        {
            CaregiverReference = "caregiver-1",
        });

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var payload = Assert.IsType<CaregiverInviteResponse>(ok.Value);

        Assert.Contains("today", payload.AllowedModules);
        Assert.True(payload.IsActive);
    }

    [Fact]
    public async Task UpdatePermissions_ShouldPersistNewModules()
    {
        await using var dbContext = CreateInMemoryContext();
        var controller = new CaregiversController(dbContext);

        var inviteResult = await controller.Invite(new CreateCaregiverInviteRequest { CaregiverReference = "cg" });
        var invitePayload = Assert.IsType<CaregiverInviteResponse>(Assert.IsType<OkObjectResult>(inviteResult.Result).Value);

        var updateResult = await controller.UpdatePermissions(invitePayload.Id, new UpdateCaregiverPermissionsRequest
        {
            AllowedModules = ["today", "history"],
        });

        var ok = Assert.IsType<OkObjectResult>(updateResult.Result);
        var payload = Assert.IsType<CaregiverInviteResponse>(ok.Value);

        Assert.Equal(2, payload.AllowedModules.Count);
        Assert.Contains("history", payload.AllowedModules);
        Assert.Equal(1, await dbContext.CaregiverPermissions.CountAsync());
    }

    private static AppDbContext CreateInMemoryContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase($"pbi013-tests-{Guid.NewGuid()}")
            .Options;

        return new AppDbContext(options);
    }
}
