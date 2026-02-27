namespace api.contracts;

public sealed class UserPreferenceResponse
{
    public required string Locale { get; set; }
    public decimal FontScale { get; set; }
    public bool NotificationsEnabled { get; set; }
    public bool MedicationRemindersEnabled { get; set; }
    public int SnoozeMinutes { get; set; }
    public required string WeekStartsOn { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
}

public sealed class UpdateUserPreferenceRequest
{
    public string? Locale { get; set; }
    public decimal? FontScale { get; set; }
    public bool? NotificationsEnabled { get; set; }
    public bool? MedicationRemindersEnabled { get; set; }
    public int? SnoozeMinutes { get; set; }
    public string? WeekStartsOn { get; set; }
}
