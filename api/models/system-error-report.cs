namespace api.models;

public sealed class SystemErrorReport
{
    public Guid Id { get; set; }
    public string? UserReference { get; set; }
    public required string AppVersion { get; set; }
    public required string Platform { get; set; }
    public string? Device { get; set; }
    public string? Locale { get; set; }
    public required string ErrorType { get; set; }
    public required string Message { get; set; }
    public string? StackTrace { get; set; }
    public string? CorrelationId { get; set; }
    public DateTimeOffset OccurredAt { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}
