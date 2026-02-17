namespace api.models;

public sealed class MedicineCatalogItem
{
    public Guid Id { get; set; }
    public required string MedicineName { get; set; }
    public string? Barcode { get; set; }
    public string? Origin { get; set; }
    public string? Unit { get; set; }
    public string? PackingAmount { get; set; }
    public string? ActiveIngredient { get; set; }
    public string? TherapeuticClass { get; set; }
    public string? Manufacturer { get; set; }
    public int? SourcePage { get; set; }
    public string? SourceUrl { get; set; }
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
}
