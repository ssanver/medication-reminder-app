namespace api.models;

public sealed class UserPreference
{
    public Guid Id { get; set; }
    public required string UserReference { get; set; }
    public string Locale { get; set; } = "tr";
    public decimal FontScale { get; set; } = 1.0m;
    public bool NotificationsEnabled { get; set; } = true;
    public bool MedicationRemindersEnabled { get; set; } = true;
    public int SnoozeMinutes { get; set; } = 10;
    public string WeekStartsOn { get; set; } = "monday";
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
}
