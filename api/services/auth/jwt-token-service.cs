using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using api.models;
using Microsoft.IdentityModel.Tokens;

namespace api.services.auth;

public interface IJwtTokenService
{
    string CreateAccessToken(UserAccount user, DateTimeOffset now);
    string CreateAccessToken(string subject, string email, string displayName, DateTimeOffset now, IReadOnlyCollection<Claim>? additionalClaims = null);
    DateTimeOffset GetAccessTokenExpiry(DateTimeOffset now);
}

public sealed class JwtTokenService(IConfiguration configuration) : IJwtTokenService
{
    private const int DefaultAccessTokenMinutes = 60;

    public string CreateAccessToken(UserAccount user, DateTimeOffset now)
    {
        var role = user.Role;
        if (!UserRole.IsValid(role))
        {
            role = UserRole.Member;
        }

        return CreateAccessToken(
            user.Id.ToString(),
            user.Email,
            user.FullName,
            now,
            [
                new Claim(ClaimTypes.Role, role),
                new Claim("role", role),
            ]);
    }

    public string CreateAccessToken(string subject, string email, string displayName, DateTimeOffset now, IReadOnlyCollection<Claim>? additionalClaims = null)
    {
        var jwtConfig = ReadJwtConfig(configuration);
        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, subject),
            new(JwtRegisteredClaimNames.Email, email),
            new(ClaimTypes.NameIdentifier, subject),
            new(ClaimTypes.Name, displayName),
            new(ClaimTypes.Email, email),
        };
        if (additionalClaims is not null && additionalClaims.Count > 0)
        {
            claims.AddRange(additionalClaims);
        }

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtConfig.SecretKey));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var expiresAt = GetAccessTokenExpiry(now);
        var token = new JwtSecurityToken(
            issuer: jwtConfig.Issuer,
            audience: jwtConfig.Audience,
            claims: claims,
            notBefore: now.UtcDateTime,
            expires: expiresAt.UtcDateTime,
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public DateTimeOffset GetAccessTokenExpiry(DateTimeOffset now)
    {
        var jwtConfig = ReadJwtConfig(configuration);
        return now.AddMinutes(jwtConfig.AccessTokenMinutes);
    }

    public static JwtConfig ReadJwtConfig(IConfiguration configuration)
    {
        var secret =
            Environment.GetEnvironmentVariable("AUTH_JWT_SECRET")
            ?? configuration["Authentication:Jwt:SecretKey"];
        var issuer =
            Environment.GetEnvironmentVariable("AUTH_JWT_ISSUER")
            ?? configuration["Authentication:Jwt:Issuer"]
            ?? "pillmind-api";
        var audience =
            Environment.GetEnvironmentVariable("AUTH_JWT_AUDIENCE")
            ?? configuration["Authentication:Jwt:Audience"]
            ?? "pillmind-mobile";

        var accessTokenMinutesRaw =
            Environment.GetEnvironmentVariable("AUTH_JWT_ACCESS_TOKEN_MINUTES")
            ?? configuration["Authentication:Jwt:AccessTokenMinutes"];
        var accessTokenMinutes = int.TryParse(accessTokenMinutesRaw, out var parsedMinutes)
            ? parsedMinutes
            : DefaultAccessTokenMinutes;

        if (string.IsNullOrWhiteSpace(secret) || secret.Trim().Length < 32)
        {
            throw new InvalidOperationException("JWT secret must be configured and at least 32 characters.");
        }

        return new JwtConfig(
            secret.Trim(),
            issuer.Trim(),
            audience.Trim(),
            Math.Max(5, accessTokenMinutes));
    }

    public readonly record struct JwtConfig(string SecretKey, string Issuer, string Audience, int AccessTokenMinutes);
}
