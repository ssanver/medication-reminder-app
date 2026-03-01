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
        var controller = new DoseEventsController(dbContext, new TestAuditLogger(dbContext));

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
        var controller = new DoseEventsController(dbContext, new TestAuditLogger(dbContext));

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
            DateKey = "2026-02-20",
            ScheduledTime = "08:00",
            ActionAt = DateTimeOffset.UtcNow,
            CreatedAt = DateTimeOffset.UtcNow,
        });
        await dbContext.SaveChangesAsync();

        var controller = new DoseEventsController(dbContext, new TestAuditLogger(dbContext));
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
                DateKey = "2026-02-20",
                ScheduledTime = "08:00",
                ActionAt = DateTimeOffset.UtcNow,
                CreatedAt = DateTimeOffset.UtcNow,
            },
            new DoseEvent
            {
                Id = Guid.NewGuid(),
                MedicationId = medication.Id,
                ActionType = "missed",
                DateKey = "2026-02-20",
                ScheduledTime = "21:00",
                ActionAt = DateTimeOffset.UtcNow,
                CreatedAt = DateTimeOffset.UtcNow,
            });
        await dbContext.SaveChangesAsync();

        var controller = new DoseEventsController(dbContext, new TestAuditLogger(dbContext));
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
            UserReference = "user@example.com",
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
            DateKey = "2026-02-20",
            ScheduledTime = "08:00",
            ActionAt = new DateTimeOffset(new DateTime(2026, 2, 20, 8, 0, 0), TimeSpan.Zero),
            CreatedAt = DateTimeOffset.UtcNow,
        });
        await dbContext.SaveChangesAsync();

        var controller = new DoseEventsController(dbContext, new TestAuditLogger(dbContext));
        var result = await controller.GetSummary(new DateOnly(2026, 2, 20), new DateOnly(2026, 2, 22));

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var payload = Assert.IsType<DoseSummaryResponse>(okResult.Value);
        Assert.Equal(3, payload.PlannedCount);
        Assert.Equal(1, payload.TakenCount);
        Assert.Equal(0.3333m, payload.AdherenceRate);
    }

    [Fact]
    public async Task Action_ShouldDecreaseInventory_WhenTakenActionIsSent()
    {
        await using var dbContext = CreateInMemoryContext();
        var medication = await AddMedication(dbContext);
        dbContext.InventoryRecords.Add(new InventoryRecord
        {
            Id = Guid.NewGuid(),
            MedicationId = medication.Id,
            CurrentStock = 2,
            Threshold = 1,
        });
        await dbContext.SaveChangesAsync();

        var controller = new DoseEventsController(dbContext, new TestAuditLogger(dbContext));
        await controller.Action(new DoseActionRequest
        {
            MedicationId = medication.Id,
            ActionType = "taken",
        });

        var stock = await dbContext.InventoryRecords.Where(x => x.MedicationId == medication.Id).Select(x => x.CurrentStock).SingleAsync();
        Assert.Equal(1, stock);
    }

    [Fact]
    public async Task Action_ShouldWriteAuditLog_WhenMedicationIsMissing()
    {
        await using var dbContext = CreateInMemoryContext();
        var controller = new DoseEventsController(dbContext, new TestAuditLogger(dbContext));

        var result = await controller.Action(new DoseActionRequest
        {
            MedicationId = Guid.NewGuid(),
            ActionType = "taken",
        });

        Assert.IsType<NotFoundObjectResult>(result.Result);
        var logCount = await dbContext.AuditLogs.CountAsync(x => x.EventType == "unauthorized-attempt");
        Assert.Equal(1, logCount);
    }

    [Fact]
    public async Task GetScheduledDoses_ShouldReturnServerCalculatedDoseStatuses()
    {
        await using var dbContext = CreateInMemoryContext();
        var targetDate = DateOnly.FromDateTime(DateTime.UtcNow.Date).AddDays(1);
        var targetDateKey = targetDate.ToString("yyyy-MM-dd");
        var medication = new Medication
        {
            Id = Guid.NewGuid(),
            UserReference = "user@example.com",
            Name = "Parol",
            Dosage = "500mg",
            StartDate = targetDate,
            IsBeforeMeal = false,
            Schedules =
            [
                new MedicationSchedule
                {
                    Id = Guid.NewGuid(),
                    RepeatType = "daily",
                    IntervalCount = 1,
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
            DateKey = targetDateKey,
            ScheduledTime = "08:00",
            ActionAt = DateTimeOffset.UtcNow,
            CreatedAt = DateTimeOffset.UtcNow,
        });
        await dbContext.SaveChangesAsync();

        var controller = new DoseEventsController(dbContext, new TestAuditLogger(dbContext));
        var result = await controller.GetScheduledDoses(targetDate);

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var payload = Assert.IsType<ScheduledDoseResponse[]>(okResult.Value);
        Assert.Single(payload);
        Assert.Equal("taken", payload[0].Status);
        Assert.Equal("08:00", payload[0].ScheduledTime);
    }

    [Fact]
    public async Task GetReport_ShouldReturnSummaryTrendAndMedicationRows()
    {
        await using var dbContext = CreateInMemoryContext();
        var fromDate = new DateOnly(2026, 2, 20);
        var toDate = new DateOnly(2026, 2, 22);
        var medication = new Medication
        {
            Id = Guid.NewGuid(),
            UserReference = "user@example.com",
            Name = "Parol",
            Dosage = "500mg",
            StartDate = fromDate,
            IsBeforeMeal = false,
            Schedules =
            [
                new MedicationSchedule
                {
                    Id = Guid.NewGuid(),
                    RepeatType = "daily",
                    IntervalCount = 1,
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
            DateKey = "2026-02-20",
            ScheduledTime = "08:00",
            ActionAt = new DateTimeOffset(new DateTime(2026, 2, 20, 8, 0, 0), TimeSpan.Zero),
            CreatedAt = DateTimeOffset.UtcNow,
        });
        await dbContext.SaveChangesAsync();

        var controller = new DoseEventsController(dbContext, new TestAuditLogger(dbContext));
        var result = await controller.GetReport(fromDate, toDate, "en");

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var payload = Assert.IsType<DoseReportResponse>(okResult.Value);
        Assert.Equal(3, payload.Summary.PlannedCount);
        Assert.Equal(1, payload.Summary.TakenCount);
        Assert.Equal(3, payload.WeeklyTrend.Count);
        Assert.Single(payload.MedicationRows);
        Assert.Equal("Parol", payload.MedicationRows.First().Medication);
    }

    private static async Task<Medication> AddMedication(AppDbContext dbContext)
    {
        var medication = new Medication
        {
            Id = Guid.NewGuid(),
            UserReference = "user@example.com",
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

    private sealed class TestAuditLogger(AppDbContext dbContext) : api.services.security.IAuditLogger
    {
        public async Task LogAsync(string eventType, string payload)
        {
            dbContext.AuditLogs.Add(new AuditLog
            {
                Id = Guid.NewGuid(),
                EventType = eventType,
                PayloadMasked = payload,
                CreatedAt = DateTimeOffset.UtcNow,
            });
            await dbContext.SaveChangesAsync();
        }
    }
}
