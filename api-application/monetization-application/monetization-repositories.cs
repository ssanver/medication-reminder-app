namespace api_application.monetization_application;

public interface IMonetizationUserRepository
{
    Task<MonetizationStatusRecord?> GetStatusByEmailAsync(string email, CancellationToken cancellationToken = default);
    Task<MonetizationStatusRecord?> ActivatePlanAsync(ActivateMonetizationPlanCommand command, CancellationToken cancellationToken = default);
}

public interface IAppDefinitionsRepository
{
    Task<IReadOnlyCollection<AppDefinitionRecord>> ListAsync(CancellationToken cancellationToken = default);
}
