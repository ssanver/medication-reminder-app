namespace api_application.monetization_application;

public sealed record MonetizationStatusRecord(
    string Role,
    bool AdsEnabled,
    string? ActivePlanId,
    DateTimeOffset UpdatedAt);

public sealed record ActivateMonetizationPlanCommand(
    string Email,
    string PlanId,
    bool AllowUnsafeDirectActivation);

public sealed record SyncStoreSubscriptionCommand(
    string Email,
    string Platform,
    string? PlanId,
    string? StoreToken,
    string? TransactionId,
    bool IsActive,
    IReadOnlyCollection<string> AllowedPlanIds);

public sealed record AppDefinitionRecord(
    string DefinitionKey,
    string JsonValue,
    DateTimeOffset UpdatedAt);

public sealed record AppDefinitionsSnapshot(
    IReadOnlyDictionary<string, string> Definitions,
    DateTimeOffset UpdatedAt);
