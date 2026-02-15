using api.Controllers;
using api.contracts;
using api.data;
using api.models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace api.tests;

public sealed class DoseEventsControllerTests
{
    [Fact]
    public async Task Action_ShouldCreateDoseEvent_WhenRequestIsValid()
    {
        await using var dbContext = CreateInMemoryContext();
        var medication = await AddMedication(dbContext);
        var controller = new DoseEventsController(dbContext);

        var result = await controller.Action(new DoseActionRequest
        {
            MedicationId = medication.Id,
            ActionType = "taken",
        });

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var payload = Assert.IsType<DoseEventResponse>(okResult.Value);
        Assert.Equal("taken", payload.ActionType);
        Assert.Equal(1, await dbContext.DoseEvents.CountAsync());
    }

    [Fact]
    public async Task Action_ShouldReturnBadRequest_ForInvalidSnoozeMinutes()
    {
        await using var dbContext = CreateInMemoryContext();
        var medication = await AddMedication(dbContext);
        var controller = new DoseEventsController(dbContext);

        var result = await controller.Action(new DoseActionRequest
        {
            MedicationId = medication.Id,
            ActionType = "snooze",
            SnoozeMinutes = 7,
        });

        var badRequest = Assert.IsType<BadRequestObjectResult>(result.Result);
        Assert.Equal("Snooze minutes must be one of: 5, 10, 15.", badRequest.Value);
    }

    [Fact]
    public async Task GetHistory_ShouldReturnExistingEvents()
    {
        await using var dbContext = CreateInMemoryContext();
        var medication = await AddMedication(dbContext);
        dbContext.DoseEvents.Add(new DoseEvent
        {
            Id = Guid.NewGuid(),
            MedicationId = medication.Id,
            ActionType = "taken",
            ActionAt = DateTimeOffset.UtcNow,
            CreatedAt = DateTimeOffset.UtcNow,
        });
        await dbContext.SaveChangesAsync();

        var controller = new DoseEventsController(dbContext);
        var result = await controller.GetHistory(medication.Id);

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var payload = Assert.IsType<DoseEventResponse[]>(okResult.Value);
        Assert.Single(payload);
    }

    private static async Task<Medication> AddMedication(AppDbContext dbContext)
    {
        var medication = new Medication
        {
            Id = Guid.NewGuid(),
            Name = "Parol",
            Dosage = "500mg",
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
            .UseInMemoryDatabase($"pbi005-tests-{Guid.NewGuid()}")
            .Options;

        return new AppDbContext(options);
    }
}
