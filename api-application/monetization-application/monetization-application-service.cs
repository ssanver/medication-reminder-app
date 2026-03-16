namespace api_application.monetization_application;

public sealed class MonetizationApplicationService(IMonetizationUserRepository userRepository, IAppDefinitionsRepository definitionsRepository)
{
    private static readonly string[] RequiredDefinitionKeys = ["formOptions", "medicationIconOptions", "snoozeOptions"];
    private const string VisitorRole = "visitor";

    public async Task<MonetizationStatusRecord> GetStatusAsync(string email, CancellationToken cancellationToken = default)
    {
        var normalizedEmail = NormalizeEmail(email);
        var status = await userRepository.GetStatusByEmailAsync(normalizedEmail, cancellationToken);
        if (status is null)
        {
            throw new KeyNotFoundException("User account not found.");
        }

        return status;
    }

    public async Task<MonetizationStatusRecord> ActivatePlanAsync(ActivateMonetizationPlanCommand command, CancellationToken cancellationToken = default)
    {
        var normalizedEmail = NormalizeEmail(command.Email);
        var normalizedPlanId = command.PlanId?.Trim().ToLowerInvariant();

        if (string.IsNullOrWhiteSpace(normalizedPlanId))
        {
            throw new ArgumentException("PlanId is required.");
        }

        var currentStatus = await userRepository.GetStatusByEmailAsync(normalizedEmail, cancellationToken);
        if (currentStatus is null)
        {
            throw new KeyNotFoundException("User account not found.");
        }

        if (string.Equals(currentStatus.Role, VisitorRole, StringComparison.Ordinal))
        {
            throw new InvalidOperationException("Guest accounts cannot activate subscriptions. Please sign up first.");
        }

        if (!command.AllowUnsafeDirectActivation)
        {
            throw new NotSupportedException("Store purchase validation is not implemented yet.");
        }

        var status = await userRepository.ActivatePlanAsync(
            command with
            {
                Email = normalizedEmail,
                PlanId = normalizedPlanId,
            },
            cancellationToken);

        if (status is null)
        {
            throw new KeyNotFoundException("User account not found.");
        }

        return status;
    }

    public async Task<MonetizationStatusRecord> SyncStoreSubscriptionAsync(SyncStoreSubscriptionCommand command, CancellationToken cancellationToken = default)
    {
        var normalizedEmail = NormalizeEmail(command.Email);
        var normalizedPlatform = command.Platform?.Trim().ToLowerInvariant();
        var normalizedPlanId = command.PlanId?.Trim().ToLowerInvariant();
        var normalizedAllowedPlanIds = command.AllowedPlanIds
            .Where(value => !string.IsNullOrWhiteSpace(value))
            .Select(value => value.Trim().ToLowerInvariant())
            .Distinct(StringComparer.Ordinal)
            .ToArray();

        if (string.IsNullOrWhiteSpace(normalizedPlatform) || (normalizedPlatform != "ios" && normalizedPlatform != "android"))
        {
            throw new ArgumentException("Platform must be ios or android.");
        }

        var currentStatus = await userRepository.GetStatusByEmailAsync(normalizedEmail, cancellationToken);
        if (currentStatus is null)
        {
            throw new KeyNotFoundException("User account not found.");
        }

        if (string.Equals(currentStatus.Role, VisitorRole, StringComparison.Ordinal))
        {
            throw new InvalidOperationException("Guest accounts cannot activate subscriptions. Please sign up first.");
        }

        if (command.IsActive)
        {
            if (normalizedAllowedPlanIds.Length == 0)
            {
                throw new NotSupportedException("Store product configuration is not complete.");
            }

            if (string.IsNullOrWhiteSpace(normalizedPlanId))
            {
                throw new ArgumentException("PlanId is required for active store subscriptions.");
            }

            if (!normalizedAllowedPlanIds.Contains(normalizedPlanId, StringComparer.Ordinal))
            {
                throw new ArgumentException("PlanId is not a configured store subscription product.");
            }

            if (string.IsNullOrWhiteSpace(command.StoreToken) && string.IsNullOrWhiteSpace(command.TransactionId))
            {
                throw new ArgumentException("StoreToken or TransactionId is required for active store subscriptions.");
            }
        }

        var status = await userRepository.SyncStoreStatusAsync(
            command with
            {
                Email = normalizedEmail,
                Platform = normalizedPlatform,
                PlanId = normalizedPlanId,
                AllowedPlanIds = normalizedAllowedPlanIds,
            },
            cancellationToken);

        if (status is null)
        {
            throw new KeyNotFoundException("User account not found.");
        }

        return status;
    }

    public async Task<AppDefinitionsSnapshot> GetDefinitionsAsync(CancellationToken cancellationToken = default)
    {
        var rows = await definitionsRepository.ListAsync(cancellationToken);
        var updatedAt = rows.Count > 0 ? rows.Max(x => x.UpdatedAt) : DateTimeOffset.UtcNow;
        var definitions = rows.ToDictionary(x => x.DefinitionKey, x => x.JsonValue, StringComparer.OrdinalIgnoreCase);

        foreach (var key in RequiredDefinitionKeys)
        {
            if (!definitions.TryGetValue(key, out var value) || string.IsNullOrWhiteSpace(value))
            {
                throw new InvalidOperationException($"Missing required app definition: {key}");
            }
        }

        return new AppDefinitionsSnapshot(definitions, updatedAt);
    }

    private static string NormalizeEmail(string email)
    {
        if (string.IsNullOrWhiteSpace(email))
        {
            throw new UnauthorizedAccessException("User email claim is missing.");
        }

        return email.Trim().ToLowerInvariant();
    }
}
