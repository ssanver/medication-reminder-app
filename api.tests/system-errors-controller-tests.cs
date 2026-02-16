using api.Controllers;
using api.contracts;
using api.data;
using api.models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;

namespace api.tests;

public sealed class SystemErrorsControllerTests
{
    [Fact]
    public async Task Create_ShouldPersist_WhenPayloadIsValid()
    {
        await using var dbContext = CreateInMemoryContext();
        var controller = new SystemErrorsController(dbContext, NullLogger<SystemErrorsController>.Instance);

        var result = await controller.Create(new CreateSystemErrorRequest
        {
            UserReference = "user-1",
            AppVersion = "1.0.3",
            Platform = "ios",
            Device = "iPhone",
            Locale = "tr-TR",
            ErrorType = "js-unhandled",
            Message = "Unhandled exception",
            OccurredAt = DateTimeOffset.UtcNow,
        });

        var created = Assert.IsType<CreatedAtActionResult>(result.Result);
        var payload = Assert.IsType<SystemErrorResponse>(created.Value);
        Assert.Equal("1.0.3", payload.AppVersion);
        Assert.Equal(1, await dbContext.SystemErrorReports.CountAsync());
    }

    [Fact]
    public async Task Create_ShouldReturnBadRequest_WhenAppVersionMissing()
    {
        await using var dbContext = CreateInMemoryContext();
        var controller = new SystemErrorsController(dbContext, NullLogger<SystemErrorsController>.Instance);

        var result = await controller.Create(new CreateSystemErrorRequest
        {
            Platform = "ios",
            ErrorType = "js-unhandled",
            Message = "Unhandled exception",
            AppVersion = " ",
        });

        var badRequest = Assert.IsType<BadRequestObjectResult>(result.Result);
        Assert.Equal("App version is required.", badRequest.Value);
    }

    [Fact]
    public async Task List_ShouldFilterByVersion()
    {
        await using var dbContext = CreateInMemoryContext();
        dbContext.SystemErrorReports.AddRange(
            new SystemErrorReport
            {
                Id = Guid.NewGuid(),
                AppVersion = "1.0.3",
                Platform = "ios",
                ErrorType = "js",
                Message = "m1",
                OccurredAt = DateTimeOffset.UtcNow.AddMinutes(-2),
            },
            new SystemErrorReport
            {
                Id = Guid.NewGuid(),
                AppVersion = "1.0.4",
                Platform = "ios",
                ErrorType = "js",
                Message = "m2",
                OccurredAt = DateTimeOffset.UtcNow.AddMinutes(-1),
            });
        await dbContext.SaveChangesAsync();

        var controller = new SystemErrorsController(dbContext, NullLogger<SystemErrorsController>.Instance);
        var result = await controller.List("1.0.3", "ios", 50);

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var payload = Assert.IsType<SystemErrorResponse[]>(ok.Value);
        Assert.Single(payload);
        Assert.Equal("1.0.3", payload[0].AppVersion);
    }

    private static AppDbContext CreateInMemoryContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase($"pbi050-tests-{Guid.NewGuid()}")
            .Options;

        return new AppDbContext(options);
    }
}
