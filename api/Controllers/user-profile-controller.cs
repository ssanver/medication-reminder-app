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
        var item = await dbContext.UserProfiles.AsNoTracking().FirstOrDefaultAsync(x => x.UserReference == resolvedUserReference);

        if (item is null)
        {
            return Ok(new UserProfileResponse
            {
                UserReference = resolvedUserReference,
                FullName = string.Empty,
                Email = resolvedUserReference,
                BirthDate = string.Empty,
                Gender = string.Empty,
                PhotoUri = string.Empty,
                UpdatedAt = DateTimeOffset.UtcNow,
            });
        }

        return Ok(ToResponse(item));
    }

    [HttpPut]
    public async Task<ActionResult<UserProfileResponse>> Upsert([FromBody] UpsertUserProfileRequest request)
    {
        var resolvedUserReference = ResolveUserReference(request.UserReference);
        var item = await dbContext.UserProfiles.FirstOrDefaultAsync(x => x.UserReference == resolvedUserReference);

        if (item is null)
        {
            item = new UserProfile
            {
                Id = Guid.NewGuid(),
                UserReference = resolvedUserReference,
                FullName = string.Empty,
                Email = resolvedUserReference,
                BirthDate = string.Empty,
                Gender = string.Empty,
                PhotoUri = string.Empty,
                CreatedAt = DateTimeOffset.UtcNow,
                UpdatedAt = DateTimeOffset.UtcNow,
            };
            dbContext.UserProfiles.Add(item);
        }

        if (request.FullName is not null)
        {
            item.FullName = request.FullName.Trim();
        }

        if (request.Email is not null)
        {
            item.Email = request.Email.Trim();
        }

        if (request.BirthDate is not null)
        {
            item.BirthDate = request.BirthDate.Trim();
        }

        if (request.Gender is not null)
        {
            item.Gender = request.Gender.Trim();
        }

        if (request.PhotoUri is not null)
        {
            item.PhotoUri = request.PhotoUri.Trim();
        }

        item.UpdatedAt = DateTimeOffset.UtcNow;
        await dbContext.SaveChangesAsync();

        return Ok(ToResponse(item));
    }

    [HttpDelete]
    public async Task<IActionResult> Delete([FromQuery] string? userReference)
    {
        var resolvedUserReference = ResolveUserReference(userReference);
        var item = await dbContext.UserProfiles.FirstOrDefaultAsync(x => x.UserReference == resolvedUserReference);

        if (item is null)
        {
            return NoContent();
        }

        dbContext.UserProfiles.Remove(item);
        await dbContext.SaveChangesAsync();

        return NoContent();
    }

    private string ResolveUserReference(string? userReference)
    {
        return string.IsNullOrWhiteSpace(userReference)
            ? DefaultUserReference.Resolve(configuration)
            : userReference.Trim().ToLowerInvariant();
    }

    private static UserProfileResponse ToResponse(UserProfile item)
    {
        return new UserProfileResponse
        {
            UserReference = item.UserReference,
            FullName = item.FullName,
            Email = item.Email,
            BirthDate = item.BirthDate,
            Gender = item.Gender,
            PhotoUri = item.PhotoUri,
            UpdatedAt = item.UpdatedAt,
        };
    }
}
