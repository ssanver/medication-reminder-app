using api.contracts;
using api.data;
using api.models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace api.Controllers;

[ApiController]
[Route("api/inventory")]
public sealed class InventoryController(AppDbContext dbContext) : ControllerBase
{
    [HttpPost("update")]
    public async Task<ActionResult<InventoryResponse>> Update([FromBody] InventoryUpdateRequest request)
    {
        if (request.CurrentStock < 0)
        {
            return BadRequest("Current stock cannot be negative.");
        }

        if (request.Threshold < 0)
        {
            return BadRequest("Threshold cannot be negative.");
        }

        var medicationExists = await dbContext.Medications.AnyAsync(x => x.Id == request.MedicationId);
        if (!medicationExists)
        {
            return NotFound("Medication not found.");
        }

        var inventory = await dbContext.InventoryRecords.FirstOrDefaultAsync(x => x.MedicationId == request.MedicationId);
        if (inventory is null)
        {
            inventory = new InventoryRecord
            {
                Id = Guid.NewGuid(),
                MedicationId = request.MedicationId,
            };
            dbContext.InventoryRecords.Add(inventory);
        }

        inventory.CurrentStock = request.CurrentStock;
        inventory.Threshold = request.Threshold;
        inventory.UpdatedAt = DateTimeOffset.UtcNow;

        if (inventory.CurrentStock <= inventory.Threshold)
        {
            inventory.LastAlertAt = DateTimeOffset.UtcNow;
        }

        await dbContext.SaveChangesAsync();

        return Ok(ToResponse(inventory));
    }

    [HttpGet("alerts")]
    public async Task<ActionResult<IReadOnlyCollection<InventoryResponse>>> GetAlerts()
    {
        var records = await dbContext
            .InventoryRecords
            .AsNoTracking()
            .Where(x => x.CurrentStock <= x.Threshold)
            .OrderBy(x => x.CurrentStock)
            .ToListAsync();

        return Ok(records.Select(ToResponse).ToArray());
    }

    private static InventoryResponse ToResponse(InventoryRecord inventory)
    {
        return new InventoryResponse
        {
            MedicationId = inventory.MedicationId,
            CurrentStock = inventory.CurrentStock,
            Threshold = inventory.Threshold,
            IsBelowThreshold = inventory.CurrentStock <= inventory.Threshold,
            LastAlertAt = inventory.LastAlertAt,
        };
    }
}
