using api_application.monetization_application;

namespace api.tests;

public sealed class MonetizationApplicationServiceTests
{
    [Fact]
    public async Task GetDefinitionsAsync_ShouldReturnSnapshot_WhenRequiredKeysExist()
    {
        var service = new MonetizationApplicationService(
            new StubMonetizationUserRepository(),
            new StubAppDefinitionsRepository(
            [
                new AppDefinitionRecord("formOptions", "[]", DateTimeOffset.UtcNow.AddMinutes(-3)),
                new AppDefinitionRecord("medicationIconOptions", "[]", DateTimeOffset.UtcNow.AddMinutes(-2)),
                new AppDefinitionRecord("snoozeOptions", "[5,10]", DateTimeOffset.UtcNow.AddMinutes(-1)),
                new AppDefinitionRecord("subscriptionOffers", "[]", DateTimeOffset.UtcNow),
            ]));

        var snapshot = await service.GetDefinitionsAsync();

        Assert.Equal("[]", snapshot.Definitions["formOptions"]);
        Assert.Equal("[5,10]", snapshot.Definitions["snoozeOptions"]);
    }

    [Fact]
    public async Task GetDefinitionsAsync_ShouldThrow_WhenRequiredKeyMissing()
    {
        var service = new MonetizationApplicationService(
            new StubMonetizationUserRepository(),
            new StubAppDefinitionsRepository(
            [
                new AppDefinitionRecord("formOptions", "[]", DateTimeOffset.UtcNow),
                new AppDefinitionRecord("medicationIconOptions", "[]", DateTimeOffset.UtcNow),
            ]));

        var error = await Assert.ThrowsAsync<InvalidOperationException>(() => service.GetDefinitionsAsync());

        Assert.Equal("Missing required app definition: snoozeOptions", error.Message);
    }

    [Fact]
    public async Task SyncStoreSubscriptionAsync_ShouldRejectUnknownPlanId()
    {
        var repository = new StubMonetizationUserRepository
        {
            Status = new MonetizationStatusRecord("member", true, null, DateTimeOffset.UtcNow),
        };
        var service = new MonetizationApplicationService(repository, new StubAppDefinitionsRepository([]));

        var error = await Assert.ThrowsAsync<ArgumentException>(() => service.SyncStoreSubscriptionAsync(
            new SyncStoreSubscriptionCommand(
                "member@example.com",
                "ios",
                "other-plan",
                "token-1",
                "txn-1",
                true,
                ["premium-monthly", "premium-yearly"])));

        Assert.Equal("PlanId is not a configured store subscription product.", error.Message);
    }

    [Fact]
    public async Task SyncStoreSubscriptionAsync_ShouldClearPlan_WhenStoreReportsInactive()
    {
        var repository = new StubMonetizationUserRepository
        {
            Status = new MonetizationStatusRecord("vip", false, "premium-monthly", DateTimeOffset.UtcNow),
            SyncStoreResult = new MonetizationStatusRecord("member", true, null, DateTimeOffset.UtcNow),
        };
        var service = new MonetizationApplicationService(repository, new StubAppDefinitionsRepository([]));

        var result = await service.SyncStoreSubscriptionAsync(
            new SyncStoreSubscriptionCommand(
                "member@example.com",
                "ios",
                null,
                null,
                null,
                false,
                ["premium-monthly", "premium-yearly"]));

        Assert.Equal("member", result.Role);
        Assert.Null(result.ActivePlanId);
    }

    private sealed class StubMonetizationUserRepository : IMonetizationUserRepository
    {
        public MonetizationStatusRecord? Status { get; init; }
        public MonetizationStatusRecord? SyncStoreResult { get; init; }

        public Task<MonetizationStatusRecord?> ActivatePlanAsync(ActivateMonetizationPlanCommand command, CancellationToken cancellationToken = default)
        {
            return Task.FromResult<MonetizationStatusRecord?>(null);
        }

        public Task<MonetizationStatusRecord?> GetStatusByEmailAsync(string email, CancellationToken cancellationToken = default)
        {
            return Task.FromResult(Status);
        }

        public Task<MonetizationStatusRecord?> SyncStoreStatusAsync(SyncStoreSubscriptionCommand command, CancellationToken cancellationToken = default)
        {
            return Task.FromResult(SyncStoreResult);
        }
    }

    private sealed class StubAppDefinitionsRepository(IReadOnlyCollection<AppDefinitionRecord> rows) : IAppDefinitionsRepository
    {
        public Task<IReadOnlyCollection<AppDefinitionRecord>> ListAsync(CancellationToken cancellationToken = default)
        {
            return Task.FromResult(rows);
        }
    }
}
