using api.models;
using api.services;

namespace api.tests;

public sealed class SchedulePlannerTests
{
    [Fact]
    public void BuildOccurrences_ShouldGenerateThirtyDayPlan_ForDailySchedule()
    {
        var schedules =
            new[]
            {
                new MedicationSchedule
                {
                    Id = Guid.NewGuid(),
                    MedicationId = Guid.NewGuid(),
                    RepeatType = "daily",
                    IntervalCount = 1,
                    ReminderTime = new TimeOnly(8, 0),
                },
            };

        var planned = SchedulePlanner.BuildOccurrences(schedules, new DateOnly(2026, 2, 1), new DateOnly(2026, 2, 1), 30);

        Assert.Equal(30, planned.Count);
        Assert.Equal(new DateTimeOffset(new DateTime(2026, 2, 1, 8, 0, 0), TimeSpan.Zero), planned.First());
    }

    [Fact]
    public void BuildOccurrences_ShouldFilterBySelectedWeekdays_ForWeeklySchedule()
    {
        var schedules =
            new[]
            {
                new MedicationSchedule
                {
                    Id = Guid.NewGuid(),
                    MedicationId = Guid.NewGuid(),
                    RepeatType = "weekly",
                    IntervalCount = 1,
                    DaysOfWeek = "mon,wed",
                    ReminderTime = new TimeOnly(9, 15),
                },
            };

        var planned = SchedulePlanner.BuildOccurrences(schedules, new DateOnly(2026, 2, 2), new DateOnly(2026, 2, 2), 7);

        Assert.Equal(2, planned.Count);
        Assert.All(planned, item => Assert.True(item.DayOfWeek is DayOfWeek.Monday or DayOfWeek.Wednesday));
    }

    [Fact]
    public void BuildOccurrences_ShouldGenerateHourlyPlan_ForHourlySchedule()
    {
        var schedules =
            new[]
            {
                new MedicationSchedule
                {
                    Id = Guid.NewGuid(),
                    MedicationId = Guid.NewGuid(),
                    RepeatType = "hourly",
                    IntervalCount = 6,
                    ReminderTime = new TimeOnly(6, 0),
                },
            };

        var planned = SchedulePlanner.BuildOccurrences(schedules, new DateOnly(2026, 2, 2), new DateOnly(2026, 2, 2), 1);

        Assert.Equal(3, planned.Count);
        Assert.Equal(new DateTimeOffset(new DateTime(2026, 2, 2, 6, 0, 0), TimeSpan.Zero), planned.First());
        Assert.Equal(new DateTimeOffset(new DateTime(2026, 2, 2, 18, 0, 0), TimeSpan.Zero), planned.Last());
    }

    [Fact]
    public void BuildOccurrences_ShouldApplyCyclePattern_ForCycleSchedule()
    {
        var schedules =
            new[]
            {
                new MedicationSchedule
                {
                    Id = Guid.NewGuid(),
                    MedicationId = Guid.NewGuid(),
                    RepeatType = "cycle",
                    IntervalCount = 2,
                    DaysOfWeek = "off:1",
                    ReminderTime = new TimeOnly(9, 0),
                },
            };

        var planned = SchedulePlanner.BuildOccurrences(schedules, new DateOnly(2026, 2, 1), new DateOnly(2026, 2, 1), 6);
        var planList = planned.ToList();

        Assert.Equal(4, planList.Count);
        Assert.Equal(new DateTimeOffset(new DateTime(2026, 2, 1, 9, 0, 0), TimeSpan.Zero), planList[0]);
        Assert.Equal(new DateTimeOffset(new DateTime(2026, 2, 2, 9, 0, 0), TimeSpan.Zero), planList[1]);
        Assert.Equal(new DateTimeOffset(new DateTime(2026, 2, 4, 9, 0, 0), TimeSpan.Zero), planList[2]);
        Assert.Equal(new DateTimeOffset(new DateTime(2026, 2, 5, 9, 0, 0), TimeSpan.Zero), planList[3]);
    }
}
