using api.Controllers;
using api.contracts;
using api.data;
using api.models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace api.tests;

public sealed class NotificationDeliveriesControllerTests
{
    [Fact]
    public async Task Create_ShouldPersistDelivery_WhenRequestIsValid()
    {
        await using var dbContext = CreateInMemoryContext();
        var controller = new NotificationDeliveriesController(dbContext);

        var result = await controller.Create(new CreateNotificationDeliveryRequest
        {
            UserReference = "user-1",
            MedicationId = Guid.NewGuid(),
            ScheduledAt = DateTimeOffset.UtcNow.AddMinutes(5),
            SentAt = DateTimeOffset.UtcNow,
            Channel = "ios-local",
            Status = "sent",
        });

        var created = Assert.IsType<CreatedAtActionResult>(result.Result);
        var payload = Assert.IsType<NotificationDeliveryResponse>(created.Value);
        Assert.Equal("user-1", payload.UserReference);
        Assert.Equal("sent", payload.Status);
        Assert.Equal(1, await dbContext.NotificationDeliveries.CountAsync());
    }

    [Fact]
    public async Task Create_ShouldReturnBadRequest_WhenStatusIsInvalid()
    {
        await using var dbContext = CreateInMemoryContext();
        var controller = new NotificationDeliveriesController(dbContext);

        var result = await controller.Create(new CreateNotificationDeliveryRequest
        {
            UserReference = "user-1",
            ScheduledAt = DateTimeOffset.UtcNow,
            Channel = "ios-local",
            Status = "delivered",
        });

        var badRequest = Assert.IsType<BadRequestObjectResult>(result.Result);
        Assert.Equal("Status must be one of: scheduled, sent, failed.", badRequest.Value);
    }

    [Fact]
    public async Task List_ShouldFilterByUserReference()
    {
        await using var dbContext = CreateInMemoryContext();
        dbContext.NotificationDeliveries.AddRange(
            new NotificationDelivery
            {
                Id = Guid.NewGuid(),
                UserReference = "u-1",
                ScheduledAt = DateTimeOffset.UtcNow.AddMinutes(2),
                Channel = "ios-local",
                Status = "scheduled",
            },
            new NotificationDelivery
            {
                Id = Guid.NewGuid(),
                UserReference = "u-2",
                ScheduledAt = DateTimeOffset.UtcNow.AddMinutes(3),
                Channel = "android-local",
                Status = "scheduled",
            });
        await dbContext.SaveChangesAsync();

        var controller = new NotificationDeliveriesController(dbContext);
        var result = await controller.List("u-1", null, 100);

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var payload = Assert.IsType<NotificationDeliveryResponse[]>(ok.Value);
        Assert.Single(payload);
        Assert.Equal("u-1", payload[0].UserReference);
    }

    private static AppDbContext CreateInMemoryContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase($"pbi047-tests-{Guid.NewGuid()}")
            .Options;

        return new AppDbContext(options);
    }
}
