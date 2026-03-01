using api_application.guest_simulation_application;

namespace api.tests;

public sealed class GuestSimulationApplicationServiceTests
{
    private readonly GuestSimulationApplicationService service = new();

    [Fact]
    public void BuildScheduledDoses_ShouldResolveStatusFromEvents()
    {
        var medications = new[]
        {
            new GuestMedicationRecord(
                Id: "med-1",
                Name: "ABILIFY",
                Dosage: "0.5",
                UsageType: "Capsule",
                IsBeforeMeal: false,
                FrequencyLabel: "Every 1 Day",
                IntervalUnit: "day",
                IntervalCount: 1,
                CycleOffDays: 0,
                StartDate: "2025-01-01",
                EndDate: null,
                Time: "08:00",
                Times: ["08:00"],
                WeeklyDays: [],
                Active: true),
        };

        var events = new[]
        {
            new GuestDoseEventRecord("med-1", "2025-01-03", "08:00", "taken"),
        };

        var doses = service.BuildScheduledDoses("2025-01-03", medications, events);

        Assert.Single(doses);
        Assert.Equal("taken", doses.First().Status);
        Assert.Equal("08:00", doses.First().ScheduledTime);
    }

    [Fact]
    public void BuildDoseReport_ShouldCalculateSummaryAndRows()
    {
        var medications = new[]
        {
            new GuestMedicationRecord(
                Id: "med-1",
                Name: "ABILIFY",
                Dosage: "0.5",
                UsageType: "Capsule",
                IsBeforeMeal: false,
                FrequencyLabel: "Every 1 Day",
                IntervalUnit: "day",
                IntervalCount: 1,
                CycleOffDays: 0,
                StartDate: "2025-01-01",
                EndDate: null,
                Time: "08:00",
                Times: ["08:00"],
                WeeklyDays: [],
                Active: true),
        };

        var events = new[]
        {
            new GuestDoseEventRecord("med-1", "2025-01-01", "08:00", "taken"),
            new GuestDoseEventRecord("med-1", "2025-01-02", "08:00", "taken"),
            new GuestDoseEventRecord("med-1", "2025-01-03", "08:00", "missed"),
        };

        var report = service.BuildDoseReport("2025-01-07", medications, events);

        Assert.Equal(7, report.Summary.PlannedCount);
        Assert.Equal(2, report.Summary.TakenCount);
        Assert.Equal(5, report.Summary.MissedCount);
        Assert.Single(report.MedicationRows);
        Assert.Equal("ABILIFY", report.MedicationRows.First().Medication);
        Assert.Equal(2, report.MedicationRows.First().Taken);
        Assert.Equal(5, report.MedicationRows.First().Missed);
    }
}
