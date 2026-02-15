using System.Text.RegularExpressions;

namespace api.services.security;

public static partial class LogMasker
{
    private static readonly Regex EmailRegex = BuildEmailRegex();
    private static readonly Regex DigitsRegex = BuildDigitsRegex();

    public static string Mask(string? input)
    {
        if (string.IsNullOrWhiteSpace(input))
        {
            return string.Empty;
        }

        var maskedEmail = EmailRegex.Replace(input, "***@***");
        var maskedDigits = DigitsRegex.Replace(maskedEmail, match =>
        {
            var value = match.Value;
            if (value.Length <= 2)
            {
                return "**";
            }

            return new string('*', value.Length - 2) + value[^2..];
        });

        return maskedDigits;
    }

    [GeneratedRegex("[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}")]
    private static partial Regex BuildEmailRegex();

    [GeneratedRegex("\\d{3,}")]
    private static partial Regex BuildDigitsRegex();
}
