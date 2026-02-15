using api.contracts;
using api.data;
using api.models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace api.Controllers;

[ApiController]
[Route("api/caregivers")]
public sealed class CaregiversController(AppDbContext dbContext) : ControllerBase
{
    private static readonly string[] DefaultModules = ["today", "my-meds", "inventory", "history", "settings"];

    [HttpPost("invite")]
    public async Task<ActionResult<CaregiverInviteResponse>> Invite([FromBody] CreateCaregiverInviteRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.CaregiverReference))
        {
            return BadRequest("CaregiverReference is required.");
        }

        var invite = new CaregiverInvite
        {
            Id = Guid.NewGuid(),
            CaregiverReference = request.CaregiverReference.Trim(),
            InviteToken = $"cg-{Guid.NewGuid():N}",
            IsActive = true,
            CreatedAt = DateTimeOffset.UtcNow,
        };

        var permission = new CaregiverPermission
        {
            Id = Guid.NewGuid(),
            CaregiverInviteId = invite.Id,
            AllowedModulesCsv = string.Join(',', DefaultModules),
            UpdatedAt = DateTimeOffset.UtcNow,
        };

        dbContext.CaregiverInvites.Add(invite);
        dbContext.CaregiverPermissions.Add(permission);
        await dbContext.SaveChangesAsync();

        return Ok(ToResponse(invite, permission));
    }

    [HttpPut("{id:guid}/permissions")]
    public async Task<ActionResult<CaregiverInviteResponse>> UpdatePermissions(
        [FromRoute] Guid id,
        [FromBody] UpdateCaregiverPermissionsRequest request)
    {
        var invite = await dbContext.CaregiverInvites.FirstOrDefaultAsync(x => x.Id == id);
        if (invite is null)
        {
            return NotFound();
        }

        var permission = await dbContext.CaregiverPermissions.FirstOrDefaultAsync(x => x.CaregiverInviteId == id);
        if (permission is null)
        {
            permission = new CaregiverPermission
            {
                Id = Guid.NewGuid(),
                CaregiverInviteId = id,
                AllowedModulesCsv = string.Join(',', DefaultModules),
                UpdatedAt = DateTimeOffset.UtcNow,
            };
            dbContext.CaregiverPermissions.Add(permission);
        }

        var normalizedModules = request.AllowedModules
            .Select(module => module.Trim().ToLowerInvariant())
            .Where(module => module.Length > 0)
            .Distinct()
            .ToArray();

        if (normalizedModules.Length == 0)
        {
            return BadRequest("At least one module is required.");
        }

        permission.AllowedModulesCsv = string.Join(',', normalizedModules);
        permission.UpdatedAt = DateTimeOffset.UtcNow;

        await dbContext.SaveChangesAsync();

        return Ok(ToResponse(invite, permission));
    }

    private static CaregiverInviteResponse ToResponse(CaregiverInvite invite, CaregiverPermission permission)
    {
        var modules = permission.AllowedModulesCsv
            .Split(',', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries)
            .Select(x => x.ToLowerInvariant())
            .Distinct()
            .ToArray();

        return new CaregiverInviteResponse
        {
            Id = invite.Id,
            InviteToken = invite.InviteToken,
            AllowedModules = modules,
            IsActive = invite.IsActive,
        };
    }
}
