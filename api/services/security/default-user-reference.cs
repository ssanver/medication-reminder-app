namespace api.services.security;

public static class DefaultUserReference
{
    public const string ConfigurationKey = "Defaults:UserReference";
    public const string Fallback = "guest@pillmind.local";

    public static string Resolve(IConfiguration configuration)
    {
        var configured = configuration[ConfigurationKey];
        return string.IsNullOrWhiteSpace(configured) ? Fallback : configured.Trim();
    }
}
