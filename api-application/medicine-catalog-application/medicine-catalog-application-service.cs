namespace api_application.medicine_catalog_application;

public sealed class MedicineCatalogApplicationService(IMedicineCatalogRepository repository)
{
    public async Task<IReadOnlyCollection<MedicineCatalogSearchItem>> SearchAsync(
        MedicineCatalogSearchQuery query,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(query.Query))
        {
            return [];
        }

        if (query.Take <= 0 || query.Take > 100)
        {
            throw new ArgumentException("Take must be between 1 and 100.");
        }

        var normalized = query with
        {
            Query = query.Query.Trim(),
        };

        return await repository.SearchAsync(normalized, cancellationToken);
    }
}
