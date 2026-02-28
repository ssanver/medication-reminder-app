using api.contracts;
using api.data;
using api.models;
using api.services.security;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace api.Controllers;

[ApiController]
[Route("api/user-profile")]
public sealed class UserProfileController(AppDbContext dbContext, IConfiguration configuration) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<UserProfileResponse>> Get([FromQuery] string? userReference)
    {
        var resolvedUserReference = ResolveUserReference(userReference);
        var userAccount = await dbContext.UserAccounts.AsNoTracking().FirstOrDefaultAsync(x => x.Email == resolvedUserReference);
        if (userAccount is null)
        {
            return Ok(new UserProfileResponse
            {
                FullName = string.Empty,
                Email = resolvedUserReference,
                BirthDate = string.Empty,
                Gender = string.Empty,
                PhotoUri = string.Empty,
                UpdatedAt = DateTimeOffset.UtcNow,
            });
        }
        return Ok(ToResponse(userAccount));
    }

    [HttpPut]
    public async Task<ActionResult<UserProfileResponse>> Upsert([FromBody] UpsertUserProfileRequest request, [FromQuery] string? userReference)
    {
        var resolvedUserReference = ResolveUserReference(userReference);
        var userAccount = await dbContext.UserAccounts.FirstOrDefaultAsync(x => x.Email == resolvedUserReference);
        var isDefaultGuest = IsDefaultGuestReference(resolvedUserReference);
        if (userAccount is null)
        {
            if (isDefaultGuest)
            {
                var fallbackResponse = new UserProfileResponse
                {
                    FullName = request.FullName?.Trim() ?? string.Empty,
                    Email = resolvedUserReference,
                    BirthDate = request.BirthDate?.Trim() ?? string.Empty,
                    Gender = request.Gender?.Trim() ?? string.Empty,
                    PhotoUri = request.PhotoUri?.Trim() ?? string.Empty,
                    UpdatedAt = DateTimeOffset.UtcNow,
                };
                return Ok(fallbackResponse);
            }

            userAccount = new UserAccount
            {
                Id = Guid.NewGuid(),
                FirstName = "User",
                LastName = "Profile",
                Email = resolvedUserReference,
                PasswordHash = "profile-only-account",
                FullName = "User Profile",
                BirthDate = string.Empty,
                Gender = string.Empty,
                PhotoUri = string.Empty,
                IsEmailVerified = false,
                CreatedAt = DateTimeOffset.UtcNow,
                UpdatedAt = DateTimeOffset.UtcNow,
            };
            dbContext.UserAccounts.Add(userAccount);
        }

        if (request.FullName is not null)
        {
            userAccount.FullName = request.FullName.Trim();
        }

        if (request.Email is not null)
        {
            var normalizedEmail = ResolveUserReference(request.Email);
            var isUsedByAnother = await dbContext.UserAccounts.AnyAsync(x => x.Email == normalizedEmail && x.Id != userAccount.Id);
            if (isUsedByAnother)
            {
                return Conflict("Email is already used by another account.");
            }

            userAccount.Email = normalizedEmail;
            userAccount.UpdatedAt = DateTimeOffset.UtcNow;
        }

        if (request.BirthDate is not null)
        {
            userAccount.BirthDate = request.BirthDate.Trim();
        }

        if (request.Gender is not null)
        {
            userAccount.Gender = request.Gender.Trim();
        }

        if (request.PhotoUri is not null)
        {
            userAccount.PhotoUri = request.PhotoUri.Trim();
        }

        userAccount.FullName = string.IsNullOrWhiteSpace(userAccount.FullName)
            ? BuildFallbackFullName(userAccount)
            : userAccount.FullName.Trim();
        userAccount.UpdatedAt = DateTimeOffset.UtcNow;
        await dbContext.SaveChangesAsync();

        return Ok(ToResponse(userAccount));
    }

    [HttpDelete]
    public async Task<IActionResult> Delete([FromQuery] string? userReference)
    {
        var resolvedUserReference = ResolveUserReference(userReference);
        var userAccount = await dbContext.UserAccounts.AsNoTracking().FirstOrDefaultAsync(x => x.Email == resolvedUserReference);
        if (userAccount is null)
        {
            return NoContent();
        }
        var item = await dbContext.UserAccounts.FirstOrDefaultAsync(x => x.Id == userAccount.Id);
        if (item is null)
        {
            return NoContent();
        }
        item.FullName = BuildFallbackFullName(item);
        item.BirthDate = string.Empty;
        item.Gender = string.Empty;
        item.PhotoUri = string.Empty;
        item.UpdatedAt = DateTimeOffset.UtcNow;
        await dbContext.SaveChangesAsync();

        return NoContent();
    }

    private string ResolveUserReference(string? userReference)
    {
        return string.IsNullOrWhiteSpace(userReference)
            ? DefaultUserReference.Resolve(configuration)
            : userReference.Trim().ToLowerInvariant();
    }

    private bool IsDefaultGuestReference(string userReference)
    {
        var fallback = DefaultUserReference.Resolve(configuration);
        return userReference.Equals(fallback, StringComparison.OrdinalIgnoreCase);
    }

    private static UserProfileResponse ToResponse(UserAccount userAccount)
    {
        var fullName = string.IsNullOrWhiteSpace(userAccount.FullName)
            ? BuildFallbackFullName(userAccount)
            : userAccount.FullName.Trim();

        return new UserProfileResponse
        {
            FullName = fullName,
            Email = userAccount.Email,
            BirthDate = userAccount.BirthDate,
            Gender = userAccount.Gender,
            PhotoUri = userAccount.PhotoUri,
            UpdatedAt = userAccount.UpdatedAt,
        };
    }

    private static string BuildFallbackFullName(UserAccount userAccount)
    {
        var firstName = userAccount.FirstName?.Trim() ?? string.Empty;
        var lastName = userAccount.LastName?.Trim() ?? string.Empty;
        var fullName = $"{firstName} {lastName}".Trim();
        return string.IsNullOrWhiteSpace(fullName) ? "User" : fullName;
    }
}
