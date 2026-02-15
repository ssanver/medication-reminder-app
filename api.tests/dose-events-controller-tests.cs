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
        var result = await controller.GetHistory(new DoseHistoryQuery { MedicationId = medication.Id });

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var payload = Assert.IsType<DoseEventResponse[]>(okResult.Value);
        Assert.Single(payload);
    }

    [Fact]
    public async Task GetHistory_ShouldFilterByActionType()
    {
        await using var dbContext = CreateInMemoryContext();
        var medication = await AddMedication(dbContext);
        dbContext.DoseEvents.AddRange(
            new DoseEvent
            {
                Id = Guid.NewGuid(),
                MedicationId = medication.Id,
                ActionType = "taken",
                ActionAt = DateTimeOffset.UtcNow,
                CreatedAt = DateTimeOffset.UtcNow,
            },
            new DoseEvent
            {
                Id = Guid.NewGuid(),
                MedicationId = medication.Id,
                ActionType = "missed",
                ActionAt = DateTimeOffset.UtcNow,
                CreatedAt = DateTimeOffset.UtcNow,
            });
        await dbContext.SaveChangesAsync();

        var controller = new DoseEventsController(dbContext);
        var result = await controller.GetHistory(new DoseHistoryQuery { ActionType = "missed" });

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var payload = Assert.IsType<DoseEventResponse[]>(okResult.Value);
        Assert.Single(payload);
        Assert.Equal("missed", payload[0].ActionType);
    }

    [Fact]
    public async Task GetSummary_ShouldReturnPlannedAndTakenCounts()
    {
        await using var dbContext = CreateInMemoryContext();
        var medication = new Medication
        {
            Id = Guid.NewGuid(),
            Name = "Parol",
            Dosage = "500mg",
            StartDate = new DateOnly(2026, 2, 20),
            IsBeforeMeal = false,
            Schedules =
            [
                new MedicationSchedule
                {
                    Id = Guid.NewGuid(),
                    RepeatType = "daily",
                    ReminderTime = new TimeOnly(8, 0),
                },
            ],
        };

        dbContext.Medications.Add(medication);
        dbContext.DoseEvents.Add(new DoseEvent
        {
            Id = Guid.NewGuid(),
            MedicationId = medication.Id,
            ActionType = "taken",
            ActionAt = new DateTimeOffset(new DateTime(2026, 2, 20, 8, 0, 0), TimeSpan.Zero),
            CreatedAt = DateTimeOffset.UtcNow,
        });
        await dbContext.SaveChangesAsync();

        var controller = new DoseEventsController(dbContext);
        var result = await controller.GetSummary(new DateOnly(2026, 2, 20), new DateOnly(2026, 2, 22));

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var payload = Assert.IsType<DoseSummaryResponse>(okResult.Value);
        Assert.Equal(3, payload.PlannedCount);
        Assert.Equal(1, payload.TakenCount);
        Assert.Equal(0.3333m, payload.AdherenceRate);
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
            .UseInMemoryDatabase($"pbi006-tests-{Guid.NewGuid()}")
            .Options;

        return new AppDbContext(options);
    }
}
