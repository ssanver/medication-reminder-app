namespace api.contracts;

public sealed class AppDefinitionsResponse
{
    public required Dictionary<string, string> Definitions { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
}
