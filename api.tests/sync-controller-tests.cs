using api.Controllers;
using api.contracts;
using api.data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace api.tests;

public sealed class SyncControllerTests
{
    [Fact]
    public async Task Push_ShouldBeIdempotent_ByEventId()
    {
        await using var dbContext = CreateInMemoryContext();
        var controller = new SyncController(dbContext);

        var first = await controller.Push(new SyncPushRequest
        {
            Items =
            [
                new SyncItemRequest
                {
                    EventId = "evt-1",
                    EventType = "dose-action",
                    PayloadJson = "{}",
                    ClientUpdatedAt = DateTimeOffset.UtcNow,
                },
            ],
        });

        var second = await controller.Push(new SyncPushRequest
        {
            Items =
            [
                new SyncItemRequest
                {
                    EventId = "evt-1",
                    EventType = "dose-action",
                    PayloadJson = "{}",
                    ClientUpdatedAt = DateTimeOffset.UtcNow,
                },
            ],
        });

        var firstOk = Assert.IsType<OkObjectResult>(first.Result);
        var firstPayload = Assert.IsType<SyncPushResponse>(firstOk.Value);
        var secondOk = Assert.IsType<OkObjectResult>(second.Result);
        var secondPayload = Assert.IsType<SyncPushResponse>(secondOk.Value);

        Assert.Equal(1, firstPayload.AcceptedCount);
        Assert.Equal(1, secondPayload.DuplicateCount);
    }

    [Fact]
    public async Task Pull_ShouldReturnItems_AfterSinceTimestamp()
    {
        await using var dbContext = CreateInMemoryContext();
        var controller = new SyncController(dbContext);

        var firstTime = DateTimeOffset.UtcNow.AddMinutes(-10);
        var secondTime = DateTimeOffset.UtcNow;

        await controller.Push(new SyncPushRequest
        {
            Items =
            [
                new SyncItemRequest
                {
                    EventId = "evt-a",
                    EventType = "dose-action",
                    PayloadJson = "{}",
                    ClientUpdatedAt = firstTime,
                },
                new SyncItemRequest
                {
                    EventId = "evt-b",
                    EventType = "dose-action",
                    PayloadJson = "{}",
                    ClientUpdatedAt = secondTime,
                },
            ],
        });

        var result = await controller.Pull(firstTime.AddMinutes(1));

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var payload = Assert.IsType<SyncPullResponse>(ok.Value);
        Assert.NotEmpty(payload.Items);
    }

    private static AppDbContext CreateInMemoryContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase($"pbi009-tests-{Guid.NewGuid()}")
            .Options;

        return new AppDbContext(options);
    }
}
