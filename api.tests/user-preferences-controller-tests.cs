using api.Controllers;
using api.contracts;
using api.data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace api.tests;

public sealed class UserPreferencesControllerTests
{
    [Fact]
    public async Task Update_ShouldNotCreateUserAccount_WhenUsingDefaultGuestReference()
    {
        await using var dbContext = CreateInMemoryContext();
        var controller = new UserPreferencesController(dbContext, CreateConfiguration());

        var result = await controller.Update(new UpdateUserPreferenceRequest
        {
            Locale = "tr",
            FontScale = 1.1m,
            NotificationsEnabled = false,
            MedicationRemindersEnabled = false,
            SnoozeMinutes = 10,
            WeekStartsOn = "sunday",
        }, null);

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var payload = Assert.IsType<UserPreferenceResponse>(ok.Value);
        Assert.Equal("tr", payload.Locale);
        Assert.Equal(1.1m, payload.FontScale);
        Assert.False(payload.NotificationsEnabled);
        Assert.False(payload.MedicationRemindersEnabled);
        Assert.Equal(10, payload.SnoozeMinutes);
        Assert.Equal("sunday", payload.WeekStartsOn);
        Assert.Equal(0, await dbContext.UserAccounts.CountAsync());
        Assert.Equal(0, await dbContext.UserPreferences.CountAsync());
    }

    private static AppDbContext CreateInMemoryContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase($"user-preferences-tests-{Guid.NewGuid()}")
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
