namespace api_domain.notification_domain;

public static class NotificationChannels
{
    public const string IosLocal = "ios-local";
    public const string AndroidLocal = "android-local";
    public const string IosRemote = "ios-remote";
    public const string AndroidRemote = "android-remote";

    public static readonly IReadOnlySet<string> All = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
    {
        IosLocal,
        AndroidLocal,
        IosRemote,
        AndroidRemote,
    };
}
