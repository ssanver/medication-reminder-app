using api.Controllers;
using api.contracts;
using api.data;
using api.services.medication_persistence;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

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
            UserReference = "user@example.com",
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
    public async Task Delete_ShouldRemoveDependentRecords_WhenEntityHasRelations()
    {
        await using var dbContext = CreateInMemoryContext();
        var controller = CreateController(dbContext);
        var medicationId = Guid.NewGuid();

        dbContext.Medications.Add(new api.models.Medication
        {
            Id = medicationId,
            UserReference = "user@example.com",
            Name = "Aferin",
            Dosage = "200mg",
            IsBeforeMeal = false,
            StartDate = new DateOnly(2026, 2, 20),
        });

        dbContext.MedicationSchedules.Add(new api.models.MedicationSchedule
        {
            Id = Guid.NewGuid(),
            MedicationId = medicationId,
            RepeatType = "daily",
            ReminderTime = new TimeOnly(8, 0),
        });

        dbContext.DoseEvents.Add(new api.models.DoseEvent
        {
            Id = Guid.NewGuid(),
            MedicationId = medicationId,
            ActionType = "taken",
            DateKey = "2026-02-20",
            ScheduledTime = "08:00",
            ActionAt = DateTimeOffset.UtcNow,
            CreatedAt = DateTimeOffset.UtcNow,
        });

        dbContext.InventoryRecords.Add(new api.models.InventoryRecord
        {
            Id = Guid.NewGuid(),
            MedicationId = medicationId,
            CurrentStock = 10,
            Threshold = 2,
            UpdatedAt = DateTimeOffset.UtcNow,
        });

        dbContext.PrescriptionReminders.Add(new api.models.PrescriptionReminder
        {
            Id = Guid.NewGuid(),
            MedicationId = medicationId,
            OffsetsCsv = "3,1",
            UpdatedAt = DateTimeOffset.UtcNow,
        });

        dbContext.HealthEvents.Add(new api.models.HealthEvent
        {
            Id = Guid.NewGuid(),
            MedicationId = medicationId,
            EventType = "doctor-visit",
            EventAt = DateTimeOffset.UtcNow,
            ReminderOffsetsCsv = "3,1",
            UpdatedAt = DateTimeOffset.UtcNow,
        });

        dbContext.NotificationDeliveries.Add(new api.models.NotificationDelivery
        {
            Id = Guid.NewGuid(),
            UserReference = "user@example.com",
            MedicationId = medicationId,
            ScheduledAt = DateTimeOffset.UtcNow,
            SentAt = DateTimeOffset.UtcNow,
            Channel = "ios-local",
            Status = "sent",
            CreatedAt = DateTimeOffset.UtcNow,
        });

        var metadataDeliveryId = Guid.NewGuid();
        dbContext.NotificationDeliveries.Add(new api.models.NotificationDelivery
        {
            Id = metadataDeliveryId,
            UserReference = "user@example.com",
            MedicationId = null,
            ScheduledAt = DateTimeOffset.UtcNow,
            SentAt = DateTimeOffset.UtcNow,
            Channel = "ios-local",
            Status = "sent",
            CreatedAt = DateTimeOffset.UtcNow,
        });
        dbContext.NotificationActions.Add(new api.models.NotificationAction
        {
            Id = Guid.NewGuid(),
            DeliveryId = metadataDeliveryId,
            UserReference = "user@example.com",
            ActionType = "open",
            ActionAt = DateTimeOffset.UtcNow,
            ClientPlatform = "ios",
            AppVersion = "1.0.0",
            MetadataJson = $"{{\"medicationId\":\"{medicationId}\",\"dateKey\":\"2026-02-20\",\"scheduledTime\":\"08:00\"}}",
            CreatedAt = DateTimeOffset.UtcNow,
        });

        await dbContext.SaveChangesAsync();

        var result = await controller.Delete(medicationId);

        Assert.IsType<NoContentResult>(result);
        Assert.Equal(0, await dbContext.Medications.CountAsync());
        Assert.Equal(0, await dbContext.MedicationSchedules.CountAsync());
        Assert.Equal(0, await dbContext.DoseEvents.CountAsync());
        Assert.Equal(0, await dbContext.InventoryRecords.CountAsync());
        Assert.Equal(0, await dbContext.PrescriptionReminders.CountAsync());
        Assert.Equal(0, await dbContext.HealthEvents.CountAsync());
        Assert.Equal(0, await dbContext.NotificationDeliveries.CountAsync());
        Assert.Equal(0, await dbContext.NotificationActions.CountAsync());
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
            UserReference = "user@example.com",
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
            UserReference = "user@example.com",
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
        var controller = new MedicationsController(
            new api_application.medication_application.MedicationApplicationService(
                new EfMedicationRepository(dbContext)));
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(
                    new ClaimsIdentity(
                        [new Claim(ClaimTypes.Email, "user@example.com")],
                        "TestAuth")),
            },
        };

        return controller;
    }
}
