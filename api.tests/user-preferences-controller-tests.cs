using api.Controllers;
using api.contracts;
using api.data;
using api.models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace api.tests;

public sealed class UserPreferencesControllerTests
{
    [Fact]
    public async Task Update_ShouldReturnNotFound_WhenAccountDoesNotExist()
    {
        await using var dbContext = CreateInMemoryContext();
        var controller = new UserPreferencesController(dbContext);

        var result = await controller.Update(new UpdateUserPreferenceRequest
        {
            Locale = "tr",
            FontScale = 1.1m,
            NotificationsEnabled = false,
            MedicationRemindersEnabled = false,
            SnoozeMinutes = 10,
            WeekStartsOn = "sunday",
        }, "missing@example.com");

        var notFound = Assert.IsType<NotFoundObjectResult>(result.Result);
        Assert.Equal("User account not found.", notFound.Value);
        Assert.Equal(0, await dbContext.UserAccounts.CountAsync());
        Assert.Equal(0, await dbContext.UserPreferences.CountAsync());
    }

    [Fact]
    public async Task Update_ShouldCreatePreferenceForExistingUser_WhenPreferenceIsMissing()
    {
        await using var dbContext = CreateInMemoryContext();
        dbContext.UserAccounts.Add(new UserAccount
        {
            Id = Guid.NewGuid(),
            FirstName = "Suleyman",
            LastName = "Sanver",
            FullName = "Suleyman Sanver",
            Email = "suleyman@example.com",
            PasswordHash = "hash",
            BirthDate = "",
            Gender = "",
            PhotoUri = "",
            IsEmailVerified = true,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow,
        });
        await dbContext.SaveChangesAsync();

        var controller = new UserPreferencesController(dbContext);
        var result = await controller.Update(new UpdateUserPreferenceRequest
        {
            Locale = "tr",
            FontScale = 1.1m,
            NotificationsEnabled = false,
            MedicationRemindersEnabled = false,
            SnoozeMinutes = 10,
            WeekStartsOn = "sunday",
        }, "suleyman@example.com");

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var payload = Assert.IsType<UserPreferenceResponse>(ok.Value);
        Assert.Equal("tr", payload.Locale);
        Assert.Equal(1.1m, payload.FontScale);
        Assert.False(payload.NotificationsEnabled);
        Assert.False(payload.MedicationRemindersEnabled);
        Assert.Equal(10, payload.SnoozeMinutes);
        Assert.Equal("sunday", payload.WeekStartsOn);
        Assert.Equal(1, await dbContext.UserPreferences.CountAsync());
    }

    private static AppDbContext CreateInMemoryContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase($"user-preferences-tests-{Guid.NewGuid()}")
            .Options;

        return new AppDbContext(options);
    }
}
