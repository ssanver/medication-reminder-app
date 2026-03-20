using api.contracts;
using api.services;
using Microsoft.Extensions.Caching.Memory;

namespace api.tests;

public sealed class ScheduledDoseCacheTests
{
    [Fact]
    public async Task GetOrCreateAsync_ShouldReuseCachedValue_UntilInvalidated()
    {
        var cache = new ScheduledDoseCache(new MemoryCache(new MemoryCacheOptions()));
        var callCount = 0;

        Task<ScheduledDoseResponse[]> Factory()
        {
            callCount += 1;
            return Task.FromResult(new[]
            {
                new ScheduledDoseResponse
                {
                    Id = $"dose-{callCount}",
                    MedicationId = Guid.NewGuid(),
                    ScheduledTime = "08:00",
                    DateKey = "2026-03-20",
                    Name = "Parol",
                    Dosage = "500mg",
                    FrequencyLabel = "Every 1 Day",
                    Status = "pending",
                },
            });
        }

        var first = await cache.GetOrCreateAsync("user@example.com", new DateOnly(2026, 3, 20), new DateOnly(2026, 3, 20), Factory);
        var second = await cache.GetOrCreateAsync("user@example.com", new DateOnly(2026, 3, 20), new DateOnly(2026, 3, 20), Factory);

        Assert.Equal(1, callCount);
        Assert.Equal(first[0].Id, second[0].Id);

        cache.InvalidateUser("user@example.com");

        var third = await cache.GetOrCreateAsync("user@example.com", new DateOnly(2026, 3, 20), new DateOnly(2026, 3, 20), Factory);
        Assert.Equal(2, callCount);
        Assert.NotEqual(first[0].Id, third[0].Id);
    }
}
