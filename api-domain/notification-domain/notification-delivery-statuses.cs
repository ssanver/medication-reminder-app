namespace api_domain.notification_domain;

public static class NotificationDeliveryStatuses
{
    public const string Scheduled = "scheduled";
    public const string Sent = "sent";
    public const string Failed = "failed";

    public static readonly IReadOnlySet<string> All = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
    {
        Scheduled,
        Sent,
        Failed,
    };
}
