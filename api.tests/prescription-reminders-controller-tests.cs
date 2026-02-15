using api.Controllers;
using api.contracts;
using api.data;
using api.models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace api.tests;

public sealed class PrescriptionRemindersControllerTests
{
    [Fact]
    public async Task Save_ShouldMergeAndDeduplicateOffsets()
    {
        await using var dbContext = CreateInMemoryContext();
        var medication = await AddMedication(dbContext);
        var controller = new PrescriptionRemindersController(dbContext);

        var result = await controller.Save(new SavePrescriptionReminderRequest
        {
            MedicationId = medication.Id,
            RenewalDate = new DateOnly(2026, 4, 20),
            TemplateOffsets = [7, 3, 1],
            CustomOffsets = [5, 3],
        });

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var payload = Assert.IsType<PrescriptionReminderResponse>(ok.Value);

        Assert.Equal([7, 5, 3, 1], payload.Offsets);
    }

    [Fact]
    public async Task GetUpcoming_ShouldReturnMatchingReminderDate()
    {
        await using var dbContext = CreateInMemoryContext();
        var medication = await AddMedication(dbContext);
        dbContext.PrescriptionReminders.Add(new PrescriptionReminder
        {
            Id = Guid.NewGuid(),
            MedicationId = medication.Id,
            RenewalDate = new DateOnly(2026, 4, 20),
            OffsetsCsv = "7,3,1",
        });
        await dbContext.SaveChangesAsync();

        var controller = new PrescriptionRemindersController(dbContext);
        var result = await controller.GetUpcoming(new DateOnly(2026, 4, 13));

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var payload = Assert.IsType<PrescriptionReminderResponse[]>(ok.Value);
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
            .UseInMemoryDatabase($"pbi008-tests-{Guid.NewGuid()}")
            .Options;

        return new AppDbContext(options);
    }
}
