using api.Controllers;
using api.contracts;
using api.data;
using api.models;
using api.services.medicine_catalog_persistence;
using api_application.medicine_catalog_application;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace api.tests;

public sealed class MedicineCatalogControllerTests
{
    [Fact]
    public async Task Search_ShouldReturnItems_WhenQueryMatches()
    {
        await using var dbContext = CreateInMemoryContext();
        dbContext.MedicineCatalogItems.AddRange(
            new MedicineCatalogItem
            {
                Id = Guid.NewGuid(),
                MedicineName = "Metformin 500 MG 60 TB",
                UpdatedAt = DateTimeOffset.UtcNow,
            },
            new MedicineCatalogItem
            {
                Id = Guid.NewGuid(),
                MedicineName = "Captopril 25 MG 30 TB",
                UpdatedAt = DateTimeOffset.UtcNow,
            });
        await dbContext.SaveChangesAsync();

        var controller = CreateController(dbContext);
        var result = await controller.Search("met", 10);

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var payload = Assert.IsAssignableFrom<IReadOnlyCollection<MedicineCatalogSearchResponse>>(ok.Value);
        Assert.Single(payload);
        Assert.Equal("Metformin 500 MG 60 TB", payload.First().MedicineName);
    }

    [Fact]
    public async Task Search_ShouldReturnBadRequest_WhenTakeIsInvalid()
    {
        await using var dbContext = CreateInMemoryContext();
        var controller = CreateController(dbContext);

        var result = await controller.Search("met", 0);

        var badRequest = Assert.IsType<BadRequestObjectResult>(result.Result);
        Assert.Equal("Take must be between 1 and 100.", badRequest.Value);
    }

    private static AppDbContext CreateInMemoryContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase($"medicine-catalog-tests-{Guid.NewGuid()}")
            .Options;

        return new AppDbContext(options);
    }

    private static MedicineCatalogController CreateController(AppDbContext dbContext)
    {
        return new MedicineCatalogController(
            new MedicineCatalogApplicationService(
                new EfMedicineCatalogRepository(dbContext)));
    }
}
