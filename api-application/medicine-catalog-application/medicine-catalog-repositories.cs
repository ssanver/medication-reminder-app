namespace api_application.medicine_catalog_application;

public sealed record MedicineCatalogSearchItem(
    Guid Id,
    string MedicineName,
    string? Unit,
    string? Manufacturer,
    string? ActiveIngredient);

public sealed record MedicineCatalogSearchQuery(
    string Query,
    int Take);

public interface IMedicineCatalogRepository
{
    Task<IReadOnlyCollection<MedicineCatalogSearchItem>> SearchAsync(MedicineCatalogSearchQuery query, CancellationToken cancellationToken = default);
}
