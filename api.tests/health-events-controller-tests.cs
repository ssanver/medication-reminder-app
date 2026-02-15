using api.Controllers;
using api.contracts;
using api.data;
using api.models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace api.tests;

public sealed class HealthEventsControllerTests
{
    [Fact]
    public async Task Save_ShouldCreateHealthEvent_WhenRequestIsValid()
    {
        await using var dbContext = CreateInMemoryContext();
        var medication = await AddMedication(dbContext);
        var controller = new HealthEventsController(dbContext);

        var result = await controller.Save(new SaveHealthEventRequest
        {
            MedicationId = medication.Id,
            EventType = "appointment",
            EventAt = new DateTimeOffset(new DateTime(2026, 6, 1, 10, 0, 0), TimeSpan.Zero),
            Note = "Doktor kontrolu",
            ReminderOffsets = [1440, 60],
        });

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var payload = Assert.IsType<HealthEventResponse>(ok.Value);
        Assert.Equal("appointment", payload.EventType);
        Assert.Equal(2, payload.ReminderOffsets.Count);
    }

    [Fact]
    public async Task Get_ShouldReturnEvents_InDateRange()
    {
        await using var dbContext = CreateInMemoryContext();
        var medication = await AddMedication(dbContext);
        dbContext.HealthEvents.Add(new HealthEvent
        {
            Id = Guid.NewGuid(),
            MedicationId = medication.Id,
            EventType = "lab",
            EventAt = new DateTimeOffset(new DateTime(2026, 6, 10, 9, 0, 0), TimeSpan.Zero),
            ReminderOffsetsCsv = "1440,60",
        });
        await dbContext.SaveChangesAsync();

        var controller = new HealthEventsController(dbContext);
        var result = await controller.Get(new DateOnly(2026, 6, 1), new DateOnly(2026, 6, 30));

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var payload = Assert.IsType<HealthEventResponse[]>(ok.Value);
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
            .UseInMemoryDatabase($"pbi010-tests-{Guid.NewGuid()}")
            .Options;

        return new AppDbContext(options);
    }
}
