using api.Controllers;
using api.contracts;
using api.data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace api.tests;

public sealed class MedicationsControllerTests
{
    [Fact]
    public async Task Create_ShouldReturnBadRequest_WhenNoScheduleProvided()
    {
        await using var dbContext = CreateInMemoryContext();
        var controller = new MedicationsController(dbContext);

        var result = await controller.Create(new SaveMedicationRequest
        {
            Name = "Parol",
            Dosage = "500mg",
            IsBeforeMeal = false,
            StartDate = DateOnly.FromDateTime(DateTime.UtcNow.Date),
            Schedules = [],
        });

        var badRequest = Assert.IsType<BadRequestObjectResult>(result.Result);
        Assert.Equal("At least one reminder time is required.", badRequest.Value);
    }

    [Fact]
    public async Task Create_ShouldReturnBadRequest_WhenEndDateIsEarlierThanStartDate()
    {
        await using var dbContext = CreateInMemoryContext();
        var controller = new MedicationsController(dbContext);

        var result = await controller.Create(new SaveMedicationRequest
        {
            Name = "Parol",
            Dosage = "500mg",
            IsBeforeMeal = false,
            StartDate = new DateOnly(2026, 2, 20),
            EndDate = new DateOnly(2026, 2, 19),
            Schedules =
            [
                new MedicationScheduleInput
                {
                    RepeatType = "daily",
                    ReminderTime = new TimeOnly(8, 30),
                },
            ],
        });

        var badRequest = Assert.IsType<BadRequestObjectResult>(result.Result);
        Assert.Equal("End date cannot be earlier than start date.", badRequest.Value);
    }

    [Fact]
    public async Task Create_ShouldCreateMedication_WhenRequestIsValid()
    {
        await using var dbContext = CreateInMemoryContext();
        var controller = new MedicationsController(dbContext);

        var result = await controller.Create(new SaveMedicationRequest
        {
            Name = "Parol",
            Dosage = "500mg",
            IsBeforeMeal = true,
            StartDate = new DateOnly(2026, 2, 20),
            Schedules =
            [
                new MedicationScheduleInput
                {
                    RepeatType = "daily",
                    ReminderTime = new TimeOnly(8, 30),
                },
            ],
        });

        var createdResult = Assert.IsType<CreatedAtActionResult>(result.Result);
        var createdPayload = Assert.IsType<MedicationResponse>(createdResult.Value);

        Assert.Equal("Parol", createdPayload.Name);
        Assert.Single(createdPayload.Schedules);
        Assert.Equal(1, await dbContext.Medications.CountAsync());
    }

    [Fact]
    public async Task Create_ShouldReturnBadRequest_WhenWeeklyRuleDoesNotContainDay()
    {
        await using var dbContext = CreateInMemoryContext();
        var controller = new MedicationsController(dbContext);

        var result = await controller.Create(new SaveMedicationRequest
        {
            Name = "Parol",
            Dosage = "500mg",
            IsBeforeMeal = false,
            StartDate = new DateOnly(2026, 2, 20),
            Schedules =
            [
                new MedicationScheduleInput
                {
                    RepeatType = "weekly",
                    ReminderTime = new TimeOnly(8, 30),
                },
            ],
        });

        var badRequest = Assert.IsType<BadRequestObjectResult>(result.Result);
        Assert.Equal("At least one weekday is required for weekly repeat type.", badRequest.Value);
    }

    [Fact]
    public async Task Delete_ShouldReturnNoContent_WhenEntityExists()
    {
        await using var dbContext = CreateInMemoryContext();
        var controller = new MedicationsController(dbContext);

        var medication = new api.models.Medication
        {
            Id = Guid.NewGuid(),
            Name = "Aferin",
            Dosage = "200mg",
            IsBeforeMeal = false,
            StartDate = new DateOnly(2026, 2, 20),
        };

        dbContext.Medications.Add(medication);
        await dbContext.SaveChangesAsync();

        var result = await controller.Delete(medication.Id);

        Assert.IsType<NoContentResult>(result);
        Assert.Equal(0, await dbContext.Medications.CountAsync());
    }

    private static AppDbContext CreateInMemoryContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase($"pbi003-tests-{Guid.NewGuid()}")
            .Options;

        return new AppDbContext(options);
    }
}
