using api.Controllers;
using api.contracts;
using api.data;
using api.models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace api.tests;

public sealed class UserProfileControllerTests
{
    [Fact]
    public async Task Get_ShouldReturnUnprocessableEntity_WhenFullNameIsMissing()
    {
        await using var dbContext = CreateInMemoryContext();
        dbContext.UserAccounts.Add(new UserAccount
        {
            Id = Guid.NewGuid(),
            FirstName = "Suleyman",
            LastName = "Sanver",
            Email = "suleyman@example.com",
            PasswordHash = "hash",
            FullName = "",
            BirthDate = "",
            Gender = "",
            PhotoUri = "",
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow,
        });
        await dbContext.SaveChangesAsync();

        var controller = new UserProfileController(dbContext);
        var result = await controller.Get("suleyman@example.com");

        var unprocessable = Assert.IsType<UnprocessableEntityObjectResult>(result.Result);
        Assert.Equal("User profile full name is missing.", unprocessable.Value);
    }

    [Fact]
    public async Task Upsert_ShouldPersistOnUserAccount_WhenProfileIsUpdated()
    {
        await using var dbContext = CreateInMemoryContext();
        var userId = Guid.NewGuid();
        dbContext.UserAccounts.Add(new UserAccount
        {
            Id = userId,
            FirstName = "Suleyman",
            LastName = "Sanver",
            Email = "suleyman@example.com",
            PasswordHash = "hash",
            FullName = "",
            BirthDate = "",
            Gender = "",
            PhotoUri = "",
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow,
        });
        await dbContext.SaveChangesAsync();

        var controller = new UserProfileController(dbContext);
        var result = await controller.Upsert(new UpsertUserProfileRequest
        {
            FullName = "Suleyman Sanver",
            BirthDate = "1990-01-01",
            Gender = "male",
            PhotoUri = "https://example.com/me.jpg",
        }, "suleyman@example.com");

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var payload = Assert.IsType<UserProfileResponse>(ok.Value);
        Assert.Equal("Suleyman Sanver", payload.FullName);

        var account = await dbContext.UserAccounts.AsNoTracking().SingleAsync(x => x.Id == userId);
        Assert.Equal("Suleyman Sanver", account.FullName);
        Assert.Equal("1990-01-01", account.BirthDate);
        Assert.Equal("male", account.Gender);
        Assert.Equal("https://example.com/me.jpg", account.PhotoUri);
    }

    [Fact]
    public async Task Upsert_ShouldReturnNotFound_WhenAccountDoesNotExist()
    {
        await using var dbContext = CreateInMemoryContext();
        var controller = new UserProfileController(dbContext);

        var result = await controller.Upsert(new UpsertUserProfileRequest
        {
            FullName = "Guest User",
            BirthDate = "1990-01-01",
            Gender = "unknown",
            PhotoUri = "https://example.com/guest.jpg",
        }, "missing@example.com");

        var notFound = Assert.IsType<NotFoundObjectResult>(result.Result);
        Assert.Equal("User account not found.", notFound.Value);
        Assert.Equal(0, await dbContext.UserAccounts.CountAsync());
    }

    private static AppDbContext CreateInMemoryContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase($"user-profile-tests-{Guid.NewGuid()}")
            .Options;

        return new AppDbContext(options);
    }
}
