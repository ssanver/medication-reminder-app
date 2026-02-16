namespace api_domain.notification_domain;

public static class NotificationActionTypes
{
    public const string TakeNow = "take-now";
    public const string Skip = "skip";
    public const string Snooze5Min = "snooze-5min";
    public const string Open = "open";

    public static readonly IReadOnlySet<string> All = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
    {
        TakeNow,
        Skip,
        Snooze5Min,
        Open,
    };
}
