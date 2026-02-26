using System.Net;
using System.Net.Mail;

namespace api.services.auth;

public interface IEmailDispatchService
{
    Task SendVerificationCodeAsync(string recipientEmail, string verificationCode, CancellationToken cancellationToken = default);
}

public sealed class SmtpEmailDispatchService(IConfiguration configuration) : IEmailDispatchService
{
    public async Task SendVerificationCodeAsync(string recipientEmail, string verificationCode, CancellationToken cancellationToken = default)
    {
        var host = Resolve("SMTP_HOST", "Email:SmtpHost");
        var portRaw = Resolve("SMTP_PORT", "Email:SmtpPort");
        var username = Resolve("SMTP_USERNAME", "Email:SmtpUsername");
        var password = Resolve("SMTP_PASSWORD", "Email:SmtpPassword");
        var fromAddress = Resolve("SMTP_FROM_ADDRESS", "Email:FromAddress");
        var fromName = Resolve("SMTP_FROM_NAME", "Email:FromName") ?? "Pill Mind";
        var enableSslRaw = Resolve("SMTP_ENABLE_SSL", "Email:EnableSsl");

        if (string.IsNullOrWhiteSpace(host) ||
            string.IsNullOrWhiteSpace(portRaw) ||
            string.IsNullOrWhiteSpace(username) ||
            string.IsNullOrWhiteSpace(password) ||
            string.IsNullOrWhiteSpace(fromAddress))
        {
            throw new InvalidOperationException("SMTP configuration is incomplete.");
        }

        if (!int.TryParse(portRaw, out var port))
        {
            throw new InvalidOperationException("SMTP port is invalid.");
        }

        var enableSsl = !string.IsNullOrWhiteSpace(enableSslRaw) && bool.TryParse(enableSslRaw, out var parsedSsl) ? parsedSsl : true;
        var subject = "Pill Mind Email Verification Code";
        var body =
$"""
Your verification code is: {verificationCode}

This code will expire in 3 days.
If you did not request this code, you can ignore this email.
""";

        using var message = new MailMessage
        {
            From = new MailAddress(fromAddress, fromName),
            Subject = subject,
            Body = body,
            IsBodyHtml = false,
        };
        message.To.Add(recipientEmail);

        using var client = new SmtpClient(host, port)
        {
            EnableSsl = enableSsl,
            DeliveryMethod = SmtpDeliveryMethod.Network,
            UseDefaultCredentials = false,
            Credentials = new NetworkCredential(username, password),
        };

        cancellationToken.ThrowIfCancellationRequested();
        await client.SendMailAsync(message, cancellationToken);
    }

    private string? Resolve(string envKey, string configKey)
    {
        return Environment.GetEnvironmentVariable(envKey) ?? configuration[configKey];
    }
}
