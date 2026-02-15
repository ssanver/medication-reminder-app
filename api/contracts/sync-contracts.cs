namespace api.contracts;

public sealed class SyncItemRequest
{
    public required string EventId { get; set; }
    public required string EventType { get; set; }
    public required string PayloadJson { get; set; }
    public DateTimeOffset ClientUpdatedAt { get; set; }
}

public sealed class SyncPushRequest
{
    public IReadOnlyCollection<SyncItemRequest> Items { get; set; } = [];
}

public sealed class SyncPushResponse
{
    public int AcceptedCount { get; set; }
    public int DuplicateCount { get; set; }
}

public sealed class SyncPullResponse
{
    public IReadOnlyCollection<SyncItemRequest> Items { get; set; } = [];
}
