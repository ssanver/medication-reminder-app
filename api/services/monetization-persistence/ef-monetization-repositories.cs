using api.data;
using api.models;
using api_application.monetization_application;
using Microsoft.EntityFrameworkCore;

namespace api.services.monetization_persistence;

public sealed class EfMonetizationUserRepository(AppDbContext dbContext) : IMonetizationUserRepository
{
    public async Task<MonetizationStatusRecord?> GetStatusByEmailAsync(string email, CancellationToken cancellationToken = default)
    {
        var user = await dbContext.UserAccounts.AsNoTracking().FirstOrDefaultAsync(x => x.Email == email, cancellationToken);
        return user is null ? null : ToRecord(user);
    }

    public async Task<MonetizationStatusRecord?> ActivatePlanAsync(ActivateMonetizationPlanCommand command, CancellationToken cancellationToken = default)
    {
        var user = await dbContext.UserAccounts.FirstOrDefaultAsync(x => x.Email == command.Email, cancellationToken);
        if (user is null)
        {
            return null;
        }

        if (string.Equals(user.Role, UserRole.Visitor, StringComparison.Ordinal))
        {
            return ToRecord(user);
        }

        user.SubscriptionPlanId = command.PlanId;
        user.Role = IsPremiumPlan(command.PlanId) ? UserRole.Vip : UserRole.Member;
        user.UpdatedAt = DateTimeOffset.UtcNow;
        await dbContext.SaveChangesAsync(cancellationToken);

        return ToRecord(user);
    }

    private static MonetizationStatusRecord ToRecord(UserAccount user)
    {
        var role = UserRole.IsValid(user.Role) ? user.Role : UserRole.Member;
        return new MonetizationStatusRecord(
            role,
            !string.Equals(role, UserRole.Vip, StringComparison.Ordinal),
            user.SubscriptionPlanId,
            user.UpdatedAt);
    }

    private static bool IsPremiumPlan(string normalizedPlanId)
    {
        return normalizedPlanId.Contains("premium", StringComparison.Ordinal)
            || normalizedPlanId.Contains("vip", StringComparison.Ordinal)
            || normalizedPlanId.Contains("pro", StringComparison.Ordinal);
    }
}

public sealed class EfAppDefinitionsRepository(AppDbContext dbContext) : IAppDefinitionsRepository
{
    public async Task<IReadOnlyCollection<AppDefinitionRecord>> ListAsync(CancellationToken cancellationToken = default)
    {
        return await dbContext
            .AppDefinitions
            .AsNoTracking()
            .OrderBy(x => x.DefinitionKey)
            .Select(x => new AppDefinitionRecord(x.DefinitionKey, x.JsonValue, x.UpdatedAt))
            .ToArrayAsync(cancellationToken);
    }
}
