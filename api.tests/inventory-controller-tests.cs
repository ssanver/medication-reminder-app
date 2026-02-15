using api.Controllers;
using api.contracts;
using api.data;
using api.models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace api.tests;

public sealed class InventoryControllerTests
{
    [Fact]
    public async Task Update_ShouldSaveInventory_WhenRequestIsValid()
    {
        await using var dbContext = CreateInMemoryContext();
        var medication = await AddMedication(dbContext);
        var controller = new InventoryController(dbContext);

        var result = await controller.Update(new InventoryUpdateRequest
        {
            MedicationId = medication.Id,
            CurrentStock = 10,
            Threshold = 3,
        });

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var payload = Assert.IsType<InventoryResponse>(ok.Value);
        Assert.Equal(10, payload.CurrentStock);
        Assert.False(payload.IsBelowThreshold);
    }

    [Fact]
    public async Task Update_ShouldReturnBadRequest_WhenStockIsNegative()
    {
        await using var dbContext = CreateInMemoryContext();
        var medication = await AddMedication(dbContext);
        var controller = new InventoryController(dbContext);

        var result = await controller.Update(new InventoryUpdateRequest
        {
            MedicationId = medication.Id,
            CurrentStock = -1,
            Threshold = 3,
        });

        var badRequest = Assert.IsType<BadRequestObjectResult>(result.Result);
        Assert.Equal("Current stock cannot be negative.", badRequest.Value);
    }

    [Fact]
    public async Task GetAlerts_ShouldReturnRecords_BelowThreshold()
    {
        await using var dbContext = CreateInMemoryContext();
        var medication = await AddMedication(dbContext);
        dbContext.InventoryRecords.Add(new InventoryRecord
        {
            Id = Guid.NewGuid(),
            MedicationId = medication.Id,
            CurrentStock = 2,
            Threshold = 3,
        });
        await dbContext.SaveChangesAsync();

        var controller = new InventoryController(dbContext);
        var result = await controller.GetAlerts();

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var payload = Assert.IsType<InventoryResponse[]>(ok.Value);
        Assert.Single(payload);
        Assert.True(payload[0].IsBelowThreshold);
    }

    private static async Task<Medication> AddMedication(AppDbContext dbContext)
    {
        var medication = new Medication
        {
            Id = Guid.NewGuid(),
            Name = "Aferin",
            Dosage = "200mg",
            StartDate = new DateOnly(2026, 2, 20),
            IsBeforeMeal = false,
        };

        dbContext.Medications.Add(medication);
        await dbContext.SaveChangesAsync();
        return medication;
    }

    private static AppDbContext CreateInMemoryContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase($"pbi007-tests-{Guid.NewGuid()}")
            .Options;

        return new AppDbContext(options);
    }
}
