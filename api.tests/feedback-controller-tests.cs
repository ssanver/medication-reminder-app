using api.Controllers;
using api.contracts;
using api.data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;

namespace api.tests;

public sealed class FeedbackControllerTests
{
    [Fact]
    public async Task Create_ShouldPersistFeedback_WhenPayloadIsValid()
    {
        await using var dbContext = CreateInMemoryContext();
        var controller = new FeedbackController(dbContext, NullLogger<FeedbackController>.Instance);

        var result = await controller.Create(new CreateFeedbackRequest
        {
            Category = "suggestion",
            Message = "Bildirim kartı daha görünür olabilir.",
            UserId = "user-1",
            AppVersion = "1.0.0",
        });

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var payload = Assert.IsType<FeedbackResponse>(ok.Value);
        Assert.Equal("open", payload.Status);
        Assert.Equal(1, await dbContext.FeedbackRecords.CountAsync());
    }

    [Fact]
    public async Task Create_ShouldReturnBadRequest_WhenMessageTooShort()
    {
        await using var dbContext = CreateInMemoryContext();
        var controller = new FeedbackController(dbContext, NullLogger<FeedbackController>.Instance);

        var result = await controller.Create(new CreateFeedbackRequest
        {
            Category = "suggestion",
            Message = "kısa",
        });

        var badRequest = Assert.IsType<BadRequestObjectResult>(result.Result);
        Assert.Equal("Message must be at least 10 characters.", badRequest.Value);
    }

    private static AppDbContext CreateInMemoryContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase($"pbi053-tests-{Guid.NewGuid()}")
            .Options;

        return new AppDbContext(options);
    }
}
