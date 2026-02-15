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
                    ReminderTime = new TimeOnly(8, 0),
                },
            };

        var planned = SchedulePlanner.BuildOccurrences(schedules, new DateOnly(2026, 2, 1), 30);

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
                    DaysOfWeek = "mon,wed",
                    ReminderTime = new TimeOnly(9, 15),
                },
            };

        var planned = SchedulePlanner.BuildOccurrences(schedules, new DateOnly(2026, 2, 2), 7);

        Assert.Equal(2, planned.Count);
        Assert.All(planned, item => Assert.True(item.DayOfWeek is DayOfWeek.Monday or DayOfWeek.Wednesday));
    }
}
