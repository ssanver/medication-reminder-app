namespace api.models;

public static class UserRole
{
    public const string Visitor = "visitor";
    public const string Member = "member";
    public const string Vip = "vip";

    public static bool IsValid(string value)
    {
        return value is Visitor or Member or Vip;
    }
}
