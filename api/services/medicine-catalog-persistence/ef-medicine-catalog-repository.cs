using api.data;
using api_application.medicine_catalog_application;
using Microsoft.EntityFrameworkCore;

namespace api.services.medicine_catalog_persistence;

public sealed class EfMedicineCatalogRepository(AppDbContext dbContext) : IMedicineCatalogRepository
{
    public async Task<IReadOnlyCollection<MedicineCatalogSearchItem>> SearchAsync(
        MedicineCatalogSearchQuery query,
        CancellationToken cancellationToken = default)
    {
        var normalizedQuery = query.Query.ToLowerInvariant();

        return await dbContext.MedicineCatalogItems
            .AsNoTracking()
            .Where(item => item.MedicineName.ToLower().Contains(normalizedQuery))
            .OrderBy(item => item.MedicineName)
            .Take(query.Take)
            .Select(item => new MedicineCatalogSearchItem(
                item.Id,
                item.MedicineName,
                item.Unit,
                item.Manufacturer,
                item.ActiveIngredient))
            .ToArrayAsync(cancellationToken);
    }
}
