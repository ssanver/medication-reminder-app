using api.Controllers;
using api.contracts;
using api.data;
using api.models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace api.tests;

public sealed class NotificationActionsControllerTests
{
    [Fact]
    public async Task Create_ShouldPersistAction_WhenRequestIsValid()
    {
        await using var dbContext = CreateInMemoryContext();
        var delivery = await AddDelivery(dbContext);
        var controller = new NotificationActionsController(dbContext);

        var result = await controller.Create(new CreateNotificationActionRequest
        {
            DeliveryId = delivery.Id,
            UserReference = delivery.UserReference,
            ActionType = "take-now",
            ActionAt = DateTimeOffset.UtcNow,
            ClientPlatform = "ios",
            AppVersion = "1.0.0",
        });

        var created = Assert.IsType<CreatedAtActionResult>(result.Result);
        var payload = Assert.IsType<NotificationActionResponse>(created.Value);
        Assert.Equal("take-now", payload.ActionType);
        Assert.Equal(1, await dbContext.NotificationActions.CountAsync());
    }

    [Fact]
    public async Task Create_ShouldReturnBadRequest_WhenActionTypeIsInvalid()
    {
        await using var dbContext = CreateInMemoryContext();
        var delivery = await AddDelivery(dbContext);
        var controller = new NotificationActionsController(dbContext);

        var result = await controller.Create(new CreateNotificationActionRequest
        {
            DeliveryId = delivery.Id,
            UserReference = delivery.UserReference,
            ActionType = "dismiss",
            ActionAt = DateTimeOffset.UtcNow,
            ClientPlatform = "ios",
            AppVersion = "1.0.0",
        });

        var badRequest = Assert.IsType<BadRequestObjectResult>(result.Result);
        Assert.Equal("Action type must be one of: take-now, skip, snooze-5min, open.", badRequest.Value);
    }

    [Fact]
    public async Task Create_ShouldReturnNotFound_WhenDeliveryIsMissing()
    {
        await using var dbContext = CreateInMemoryContext();
        var controller = new NotificationActionsController(dbContext);

        var result = await controller.Create(new CreateNotificationActionRequest
        {
            DeliveryId = Guid.NewGuid(),
            UserReference = "user-1",
            ActionType = "skip",
            ActionAt = DateTimeOffset.UtcNow,
            ClientPlatform = "ios",
            AppVersion = "1.0.0",
        });

        var notFound = Assert.IsType<NotFoundObjectResult>(result.Result);
        Assert.Equal("Notification delivery was not found.", notFound.Value);
    }

    private static async Task<NotificationDelivery> AddDelivery(AppDbContext dbContext)
    {
        var delivery = new NotificationDelivery
        {
            Id = Guid.NewGuid(),
            UserReference = "user-1",
            ScheduledAt = DateTimeOffset.UtcNow,
            Channel = "ios-local",
            Status = "scheduled",
        };

        dbContext.NotificationDeliveries.Add(delivery);
        await dbContext.SaveChangesAsync();
        return delivery;
    }

    private static AppDbContext CreateInMemoryContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase($"pbi046-tests-{Guid.NewGuid()}")
            .Options;

        return new AppDbContext(options);
    }
}
