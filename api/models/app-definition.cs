namespace api.models;

public sealed class AppDefinition
{
    public Guid Id { get; set; }
    public required string DefinitionKey { get; set; }
    public required string JsonValue { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
}
