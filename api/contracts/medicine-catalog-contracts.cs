namespace api.contracts;

public sealed class MedicineCatalogSearchResponse
{
    public Guid Id { get; set; }
    public required string MedicineName { get; set; }
    public string? Unit { get; set; }
    public string? Manufacturer { get; set; }
    public string? ActiveIngredient { get; set; }
}
