using api.contracts;
using Microsoft.Extensions.Caching.Memory;

namespace api.services;

public interface IScheduledDoseCache
{
    Task<ScheduledDoseResponse[]> GetOrCreateAsync(
        string? userReference,
        DateOnly fromDate,
        DateOnly toDate,
        Func<Task<ScheduledDoseResponse[]>> factory);

    void InvalidateUser(string? userReference);
}

public sealed class ScheduledDoseCache(IMemoryCache memoryCache) : IScheduledDoseCache
{
    private static readonly TimeSpan CacheDuration = TimeSpan.FromSeconds(20);
    private readonly object cacheIndexLock = new();
    private readonly Dictionary<string, HashSet<string>> cacheKeysByUser = new(StringComparer.Ordinal);

    public async Task<ScheduledDoseResponse[]> GetOrCreateAsync(
        string? userReference,
        DateOnly fromDate,
        DateOnly toDate,
        Func<Task<ScheduledDoseResponse[]>> factory)
    {
        var normalizedUserReference = NormalizeUserReference(userReference);
        var cacheKey = $"scheduled-doses:{normalizedUserReference}:{fromDate:yyyy-MM-dd}:{toDate:yyyy-MM-dd}";

        if (memoryCache.TryGetValue(cacheKey, out ScheduledDoseResponse[]? cached) && cached is not null)
        {
            return cached;
        }

        var created = await factory();
        memoryCache.Set(cacheKey, created, CacheDuration);
        TrackUserKey(normalizedUserReference, cacheKey);
        return created;
    }

    public void InvalidateUser(string? userReference)
    {
        var normalizedUserReference = NormalizeUserReference(userReference);
        string[] keysToRemove;

        lock (cacheIndexLock)
        {
            if (!cacheKeysByUser.TryGetValue(normalizedUserReference, out var keys))
            {
                return;
            }

            keysToRemove = keys.ToArray();
            cacheKeysByUser.Remove(normalizedUserReference);
        }

        foreach (var key in keysToRemove)
        {
            memoryCache.Remove(key);
        }
    }

    private void TrackUserKey(string normalizedUserReference, string cacheKey)
    {
        lock (cacheIndexLock)
        {
            if (!cacheKeysByUser.TryGetValue(normalizedUserReference, out var keys))
            {
                keys = new HashSet<string>(StringComparer.Ordinal);
                cacheKeysByUser[normalizedUserReference] = keys;
            }

            keys.Add(cacheKey);
        }
    }

    private static string NormalizeUserReference(string? userReference)
    {
        return string.IsNullOrWhiteSpace(userReference)
            ? "anonymous"
            : userReference.Trim().ToLowerInvariant();
    }
}
