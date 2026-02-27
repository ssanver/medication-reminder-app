using api.Controllers;
using api.contracts;
using api.data;
using api.models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace api.tests;

public sealed class UserProfileControllerTests
{
    [Fact]
    public async Task Get_ShouldFallbackToAccountName_WhenProfileDoesNotExist()
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

        var controller = new UserProfileController(dbContext, CreateConfiguration());
        var result = await controller.Get("suleyman@example.com");

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var payload = Assert.IsType<UserProfileResponse>(ok.Value);
        Assert.Equal("Suleyman Sanver", payload.FullName);
        Assert.Equal("suleyman@example.com", payload.Email);
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

        var controller = new UserProfileController(dbContext, CreateConfiguration());
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

    private static AppDbContext CreateInMemoryContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase($"user-profile-tests-{Guid.NewGuid()}")
            .Options;

        return new AppDbContext(options);
    }

    private static IConfiguration CreateConfiguration()
    {
        return new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Defaults:UserReference"] = "guest@pillmind.local",
            })
            .Build();
    }
}
