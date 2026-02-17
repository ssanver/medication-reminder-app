using api.Controllers;
using api.contracts;
using api.data;
using api.services.medication_persistence;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace api.tests;

public sealed class MedicationsControllerTests
{
    [Fact]
    public async Task Create_ShouldReturnBadRequest_WhenNoScheduleProvided()
    {
        await using var dbContext = CreateInMemoryContext();
        var controller = CreateController(dbContext);

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
        var controller = CreateController(dbContext);

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
        var controller = CreateController(dbContext);

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
        var controller = CreateController(dbContext);

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
        var controller = CreateController(dbContext);

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

    [Fact]
    public async Task AddSchedule_ShouldAppendSchedule_WhenRequestIsValid()
    {
        await using var dbContext = CreateInMemoryContext();
        var controller = CreateController(dbContext);
        var medicationId = Guid.NewGuid();

        var medication = new api.models.Medication
        {
            Id = medicationId,
            Name = "Aferin",
            Dosage = "200mg",
            IsBeforeMeal = false,
            StartDate = new DateOnly(2026, 2, 20),
            Schedules =
            [
                new api.models.MedicationSchedule
                {
                    Id = Guid.NewGuid(),
                    MedicationId = medicationId,
                    RepeatType = "daily",
                    ReminderTime = new TimeOnly(8, 0),
                },
            ],
        };

        dbContext.Medications.Add(medication);
        await dbContext.SaveChangesAsync();

        var result = await controller.AddSchedule(medication.Id, new MedicationScheduleInput
        {
            RepeatType = "weekly",
            ReminderTime = new TimeOnly(20, 0),
            DaysOfWeek = "mon,fri",
        });

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var response = Assert.IsType<MedicationResponse>(okResult.Value);

        Assert.Equal(2, response.Schedules.Count);
        Assert.Equal(2, await dbContext.MedicationSchedules.CountAsync());
    }

    [Fact]
    public async Task AddSchedule_ShouldReturnBadRequest_WhenReminderTimeAlreadyExists()
    {
        await using var dbContext = CreateInMemoryContext();
        var controller = CreateController(dbContext);
        var medicationId = Guid.NewGuid();

        var medication = new api.models.Medication
        {
            Id = medicationId,
            Name = "Aferin",
            Dosage = "200mg",
            IsBeforeMeal = false,
            StartDate = new DateOnly(2026, 2, 20),
            Schedules =
            [
                new api.models.MedicationSchedule
                {
                    Id = Guid.NewGuid(),
                    MedicationId = medicationId,
                    RepeatType = "daily",
                    ReminderTime = new TimeOnly(8, 0),
                },
            ],
        };

        dbContext.Medications.Add(medication);
        await dbContext.SaveChangesAsync();

        var result = await controller.AddSchedule(medication.Id, new MedicationScheduleInput
        {
            RepeatType = "weekly",
            ReminderTime = new TimeOnly(8, 0),
            DaysOfWeek = "mon",
        });

        var badRequest = Assert.IsType<BadRequestObjectResult>(result.Result);
        Assert.Equal("Duplicate reminder times are not allowed for the same medication.", badRequest.Value);
    }

    [Fact]
    public async Task Create_ShouldReturnBadRequest_WhenRepeatTypeIsInvalid()
    {
        await using var dbContext = CreateInMemoryContext();
        var controller = CreateController(dbContext);

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
                    RepeatType = "monthly",
                    ReminderTime = new TimeOnly(8, 30),
                },
            ],
        });

        var badRequest = Assert.IsType<BadRequestObjectResult>(result.Result);
        Assert.Equal("Repeat type must be one of: daily, weekly.", badRequest.Value);
    }

    private static AppDbContext CreateInMemoryContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase($"pbi003-tests-{Guid.NewGuid()}")
            .Options;

        return new AppDbContext(options);
    }

    private static MedicationsController CreateController(AppDbContext dbContext)
    {
        return new MedicationsController(
            new api_application.medication_application.MedicationApplicationService(
                new EfMedicationRepository(dbContext)));
    }
}
