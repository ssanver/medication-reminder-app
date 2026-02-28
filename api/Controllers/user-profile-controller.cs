using api.contracts;
using api.data;
using api.models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace api.Controllers;

[ApiController]
[Route("api/user-profile")]
public sealed class UserProfileController(AppDbContext dbContext) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<UserProfileResponse>> Get([FromQuery] string? userReference)
    {
        var resolvedUserReference = ResolveUserReference(userReference, out var errorResult);
        if (errorResult is not null)
        {
            return errorResult;
        }

        var userAccount = await dbContext.UserAccounts.AsNoTracking().FirstOrDefaultAsync(x => x.Email == resolvedUserReference);
        if (userAccount is null)
        {
            return NotFound("User account not found.");
        }

        if (string.IsNullOrWhiteSpace(userAccount.FullName))
        {
            return UnprocessableEntity("User profile full name is missing.");
        }

        return Ok(ToResponse(userAccount));
    }

    [HttpPut]
    public async Task<ActionResult<UserProfileResponse>> Upsert([FromBody] UpsertUserProfileRequest request, [FromQuery] string? userReference)
    {
        var resolvedUserReference = ResolveUserReference(userReference, out var errorResult);
        if (errorResult is not null)
        {
            return errorResult;
        }

        var userAccount = await dbContext.UserAccounts.FirstOrDefaultAsync(x => x.Email == resolvedUserReference);
        if (userAccount is null)
        {
            return NotFound("User account not found.");
        }

        if (request.FullName is not null)
        {
            userAccount.FullName = request.FullName.Trim();
        }

        if (request.Email is not null)
        {
            var normalizedEmail = NormalizeUserReference(request.Email);
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

        if (string.IsNullOrWhiteSpace(userAccount.FullName))
        {
            return UnprocessableEntity("User profile full name is missing.");
        }

        userAccount.FullName = userAccount.FullName.Trim();
        userAccount.UpdatedAt = DateTimeOffset.UtcNow;
        await dbContext.SaveChangesAsync();

        return Ok(ToResponse(userAccount));
    }

    [HttpDelete]
    public async Task<IActionResult> Delete([FromQuery] string? userReference)
    {
        var resolvedUserReference = ResolveUserReference(userReference, out var errorResult);
        if (errorResult is not null)
        {
            return errorResult;
        }

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
        item.BirthDate = string.Empty;
        item.Gender = string.Empty;
        item.PhotoUri = string.Empty;
        item.UpdatedAt = DateTimeOffset.UtcNow;
        await dbContext.SaveChangesAsync();

        return NoContent();
    }

    private string ResolveUserReference(string? userReference, out ActionResult? errorResult)
    {
        var principal = HttpContext?.User;
        var claimedEmail =
            principal?.FindFirstValue(ClaimTypes.Email)
            ?? principal?.FindFirstValue("email");

        if (!string.IsNullOrWhiteSpace(claimedEmail))
        {
            var normalizedClaimedEmail = NormalizeUserReference(claimedEmail);
            if (!string.IsNullOrWhiteSpace(userReference))
            {
                var normalizedQueryEmail = NormalizeUserReference(userReference);
                if (!string.Equals(normalizedClaimedEmail, normalizedQueryEmail, StringComparison.Ordinal))
                {
                    errorResult = Forbid();
                    return string.Empty;
                }
            }

            errorResult = null;
            return normalizedClaimedEmail;
        }

        if (string.IsNullOrWhiteSpace(userReference))
        {
            errorResult = BadRequest("userReference query parameter is required.");
            return string.Empty;
        }

        errorResult = null;
        return NormalizeUserReference(userReference);
    }

    private static string NormalizeUserReference(string userReference)
    {
        return userReference.Trim().ToLowerInvariant();
    }

    private static UserProfileResponse ToResponse(UserAccount userAccount)
    {
        return new UserProfileResponse
        {
            FullName = userAccount.FullName.Trim(),
            Email = userAccount.Email,
            BirthDate = userAccount.BirthDate,
            Gender = userAccount.Gender,
            PhotoUri = userAccount.PhotoUri,
            UpdatedAt = userAccount.UpdatedAt,
        };
    }
}
