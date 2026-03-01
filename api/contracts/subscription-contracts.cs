namespace api.contracts;

public sealed class SubscriptionStatusResponse
{
    public required string Role { get; set; }
    public required bool AdsEnabled { get; set; }
    public string? ActivePlanId { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
}

public sealed class ActivateSubscriptionRequest
{
    public required string PlanId { get; set; }
    public string? Platform { get; set; }
    public string? StoreToken { get; set; }
}
