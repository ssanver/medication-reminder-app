using api.Controllers;
using api.contracts;
using api.data;
using api.models;
using api.services.monetization_persistence;
using api_application.monetization_application;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using System.Security.Claims;

namespace api.tests;

public sealed class SubscriptionsControllerTests
{
    [Fact]
    public async Task GetStatus_ShouldReturnVip_WhenUserIsVip()
    {
        await using var dbContext = CreateInMemoryContext();
        dbContext.UserAccounts.Add(new UserAccount
        {
            Id = Guid.NewGuid(),
            FirstName = "Suleyman",
            LastName = "Sanver",
            Email = "suleyman@example.com",
            PasswordHash = "PBKDF2$100000$abc$def",
            FullName = "Suleyman Sanver",
            BirthDate = string.Empty,
            Gender = string.Empty,
            PhotoUri = string.Empty,
            IsEmailVerified = true,
            Role = UserRole.Vip,
            SubscriptionPlanId = "premium-yearly",
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow,
        });
        await dbContext.SaveChangesAsync();

        var controller = CreateController(dbContext, "suleyman@example.com");
        var result = await controller.GetStatus();
        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var payload = Assert.IsType<SubscriptionStatusResponse>(ok.Value);
        Assert.Equal(UserRole.Vip, payload.Role);
        Assert.False(payload.AdsEnabled);
    }

    [Fact]
    public async Task Activate_ShouldReturnBadRequest_WhenGuestRole()
    {
        await using var dbContext = CreateInMemoryContext();
        dbContext.UserAccounts.Add(new UserAccount
        {
            Id = Guid.NewGuid(),
            FirstName = "Guest",
            LastName = "User",
            Email = "guest-user@example.com",
            PasswordHash = "guest",
            FullName = "Guest User",
            BirthDate = string.Empty,
            Gender = string.Empty,
            PhotoUri = string.Empty,
            IsEmailVerified = true,
            Role = UserRole.Visitor,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow,
        });
        await dbContext.SaveChangesAsync();

        var controller = CreateController(dbContext, "guest-user@example.com");
        var result = await controller.Activate(new ActivateSubscriptionRequest
        {
            PlanId = "premium-monthly",
        });
        var badRequest = Assert.IsType<BadRequestObjectResult>(result.Result);
        Assert.Equal("Guest accounts cannot activate subscriptions. Please sign up first.", badRequest.Value);
    }

    [Fact]
    public async Task Activate_ShouldPromoteMemberToVip_WhenPremiumPlanSelected()
    {
        await using var dbContext = CreateInMemoryContext();
        dbContext.UserAccounts.Add(new UserAccount
        {
            Id = Guid.NewGuid(),
            FirstName = "Suleyman",
            LastName = "Sanver",
            Email = "suleyman@example.com",
            PasswordHash = "PBKDF2$100000$abc$def",
            FullName = "Suleyman Sanver",
            BirthDate = string.Empty,
            Gender = string.Empty,
            PhotoUri = string.Empty,
            IsEmailVerified = true,
            Role = UserRole.Member,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow,
        });
        await dbContext.SaveChangesAsync();

        var controller = CreateController(dbContext, "suleyman@example.com", allowUnsafeDirectActivation: true);
        var result = await controller.Activate(new ActivateSubscriptionRequest
        {
            PlanId = "premium-monthly",
        });
        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var payload = Assert.IsType<SubscriptionStatusResponse>(ok.Value);
        Assert.Equal(UserRole.Vip, payload.Role);
        Assert.False(payload.AdsEnabled);
        Assert.Equal("premium-monthly", payload.ActivePlanId);
    }

    [Fact]
    public async Task Activate_ShouldReturnNotImplemented_WhenUnsafeActivationDisabled()
    {
        await using var dbContext = CreateInMemoryContext();
        dbContext.UserAccounts.Add(new UserAccount
        {
            Id = Guid.NewGuid(),
            FirstName = "Suleyman",
            LastName = "Sanver",
            Email = "suleyman@example.com",
            PasswordHash = "PBKDF2$100000$abc$def",
            FullName = "Suleyman Sanver",
            BirthDate = string.Empty,
            Gender = string.Empty,
            PhotoUri = string.Empty,
            IsEmailVerified = true,
            Role = UserRole.Member,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow,
        });
        await dbContext.SaveChangesAsync();

        var controller = CreateController(dbContext, "suleyman@example.com");
        var result = await controller.Activate(new ActivateSubscriptionRequest
        {
            PlanId = "premium-monthly",
        });
        var notImplemented = Assert.IsType<ObjectResult>(result.Result);
        Assert.Equal(StatusCodes.Status501NotImplemented, notImplemented.StatusCode);
        Assert.Equal("Store purchase validation is not implemented yet.", notImplemented.Value);
    }

    private static SubscriptionsController CreateController(AppDbContext dbContext, string email, bool allowUnsafeDirectActivation = false)
    {
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["AllowUnsafeDirectSubscriptionActivation"] = allowUnsafeDirectActivation.ToString(),
            })
            .Build();

        var service = new MonetizationApplicationService(new EfMonetizationUserRepository(dbContext), new EfAppDefinitionsRepository(dbContext));
        var controller = new SubscriptionsController(service, configuration);
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(new ClaimsIdentity([new Claim(ClaimTypes.Email, email)], "TestAuth")),
            },
        };
        return controller;
    }

    private static AppDbContext CreateInMemoryContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase($"subscriptions-tests-{Guid.NewGuid()}")
            .Options;

        return new AppDbContext(options);
    }
}
