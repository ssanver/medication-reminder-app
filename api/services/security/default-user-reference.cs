namespace api.services.security;

public static class DefaultUserReference
{
    public const string ConfigurationKey = "Defaults:UserReference";

    public static string Resolve(IConfiguration configuration)
    {
        var configured = configuration[ConfigurationKey];
        if (string.IsNullOrWhiteSpace(configured))
        {
            throw new InvalidOperationException($"{ConfigurationKey} must be configured.");
        }

        return configured.Trim();
    }
}
