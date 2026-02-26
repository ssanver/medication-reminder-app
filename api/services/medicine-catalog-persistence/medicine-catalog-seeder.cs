using api.data;
using api.models;
using Microsoft.EntityFrameworkCore;

namespace api.services.medicine_catalog_persistence;

public sealed class MedicineCatalogSeeder(
    IServiceProvider serviceProvider,
    ILogger<MedicineCatalogSeeder> logger,
    IHostEnvironment hostEnvironment) : IHostedService
{
    private const string CsvFileName = "pharmananda-medicine-database.csv";

    public async Task StartAsync(CancellationToken cancellationToken)
    {
        await using var scope = serviceProvider.CreateAsyncScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        try
        {
            _ = await dbContext.MedicineCatalogItems.CountAsync(cancellationToken);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "medicine-catalog-seed-skipped reason=table-not-ready");
            return;
        }

        var csvPath = ResolveCsvPath();
        if (csvPath is null)
        {
            logger.LogWarning("medicine-catalog-seed-skipped reason=csv-not-found");
            return;
        }

        var lines = await File.ReadAllLinesAsync(csvPath, cancellationToken);
        if (lines.Length <= 1)
        {
            logger.LogWarning("medicine-catalog-seed-skipped reason=csv-empty path={Path}", csvPath);
            return;
        }

        var records = new List<MedicineCatalogItem>(capacity: Math.Max(0, lines.Length - 1));
        foreach (var line in lines.Skip(1))
        {
            var values = ParseCsvLine(line);
            if (values.Count < 10)
            {
                continue;
            }

            var medicineName = values[0].Trim();
            if (string.IsNullOrWhiteSpace(medicineName))
            {
                continue;
            }

            records.Add(new MedicineCatalogItem
            {
                Id = Guid.NewGuid(),
                MedicineName = medicineName,
                Barcode = NullIfEmpty(values[1]),
                Origin = NullIfEmpty(values[2]),
                Unit = NullIfEmpty(values[3]),
                PackingAmount = NullIfEmpty(values[4]),
                ActiveIngredient = NullIfEmpty(values[5]),
                TherapeuticClass = NullIfEmpty(values[6]),
                Manufacturer = NullIfEmpty(values[7]),
                SourcePage = ParseNullableInt(values[8]),
                SourceUrl = NullIfEmpty(values[9]),
                UpdatedAt = DateTimeOffset.UtcNow,
            });
        }

        if (records.Count == 0)
        {
            logger.LogWarning("medicine-catalog-seed-skipped reason=no-valid-record");
            return;
        }

        var sourceMap = records
            .GroupBy(BuildKey, StringComparer.OrdinalIgnoreCase)
            .ToDictionary(group => group.Key, group => group.First(), StringComparer.OrdinalIgnoreCase);

        var existing = await dbContext.MedicineCatalogItems.ToListAsync(cancellationToken);
        var existingMap = existing
            .GroupBy(BuildKey, StringComparer.OrdinalIgnoreCase)
            .ToDictionary(group => group.Key, group => group.First(), StringComparer.OrdinalIgnoreCase);

        var deleted = 0;
        var updated = 0;
        var inserted = 0;

        foreach (var item in existing)
        {
            var key = BuildKey(item);
            if (!sourceMap.ContainsKey(key))
            {
                dbContext.MedicineCatalogItems.Remove(item);
                deleted += 1;
                continue;
            }

            var source = sourceMap[key];
            item.MedicineName = source.MedicineName;
            item.Barcode = source.Barcode;
            item.Origin = source.Origin;
            item.Unit = source.Unit;
            item.PackingAmount = source.PackingAmount;
            item.ActiveIngredient = source.ActiveIngredient;
            item.TherapeuticClass = source.TherapeuticClass;
            item.Manufacturer = source.Manufacturer;
            item.SourcePage = source.SourcePage;
            item.SourceUrl = source.SourceUrl;
            item.UpdatedAt = DateTimeOffset.UtcNow;
            updated += 1;
        }

        foreach (var entry in sourceMap)
        {
            if (existingMap.ContainsKey(entry.Key))
            {
                continue;
            }

            dbContext.MedicineCatalogItems.Add(entry.Value);
            inserted += 1;
        }

        await dbContext.SaveChangesAsync(cancellationToken);

        logger.LogInformation(
            "medicine-catalog-synced sourceCount={SourceCount} inserted={Inserted} updated={Updated} deleted={Deleted} path={Path}",
            sourceMap.Count,
            inserted,
            updated,
            deleted,
            csvPath);
    }

    public Task StopAsync(CancellationToken cancellationToken)
    {
        return Task.CompletedTask;
    }

    private string? ResolveCsvPath()
    {
        var candidates = new[]
        {
            Path.Combine(hostEnvironment.ContentRootPath, "..", "docs", CsvFileName),
            Path.Combine(hostEnvironment.ContentRootPath, "docs", CsvFileName),
            Path.Combine(Directory.GetCurrentDirectory(), "docs", CsvFileName),
        };

        return candidates.Select(Path.GetFullPath).FirstOrDefault(File.Exists);
    }

    private static string? NullIfEmpty(string value)
    {
        var trimmed = value.Trim();
        return trimmed.Length == 0 ? null : trimmed;
    }

    private static int? ParseNullableInt(string value)
    {
        return int.TryParse(value.Trim(), out var number) ? number : null;
    }

    private static string BuildKey(MedicineCatalogItem item)
    {
        return string.Join(
            "|",
            item.MedicineName.Trim().ToUpperInvariant(),
            (item.Barcode ?? string.Empty).Trim().ToUpperInvariant(),
            (item.SourcePage?.ToString() ?? string.Empty).Trim(),
            (item.SourceUrl ?? string.Empty).Trim().ToUpperInvariant());
    }

    private static List<string> ParseCsvLine(string line)
    {
        var fields = new List<string>();
        var current = new System.Text.StringBuilder();
        var inQuotes = false;

        for (var i = 0; i < line.Length; i += 1)
        {
            var ch = line[i];

            if (ch == '"')
            {
                if (inQuotes && i + 1 < line.Length && line[i + 1] == '"')
                {
                    current.Append('"');
                    i += 1;
                    continue;
                }

                inQuotes = !inQuotes;
                continue;
            }

            if (ch == ',' && !inQuotes)
            {
                fields.Add(current.ToString());
                current.Clear();
                continue;
            }

            current.Append(ch);
        }

        fields.Add(current.ToString());
        return fields;
    }
}
