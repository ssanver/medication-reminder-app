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

    private sealed class StubMonetizationUserRepository : IMonetizationUserRepository
    {
        public Task<MonetizationStatusRecord?> ActivatePlanAsync(ActivateMonetizationPlanCommand command, CancellationToken cancellationToken = default)
        {
            return Task.FromResult<MonetizationStatusRecord?>(null);
        }

        public Task<MonetizationStatusRecord?> GetStatusByEmailAsync(string email, CancellationToken cancellationToken = default)
        {
            return Task.FromResult<MonetizationStatusRecord?>(null);
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
