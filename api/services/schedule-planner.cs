using api.models;

namespace api.services;

public static class SchedulePlanner
{
    public static IReadOnlyCollection<DateTimeOffset> BuildOccurrences(
        IReadOnlyCollection<MedicationSchedule> schedules,
        DateOnly fromDate,
        int totalDays = 30)
    {
        var result = new List<DateTimeOffset>();
        var startDate = fromDate;
        var endDate = fromDate.AddDays(Math.Max(totalDays - 1, 0));

        foreach (var schedule in schedules)
        {
            for (var date = startDate; date <= endDate; date = date.AddDays(1))
            {
                if (!ShouldIncludeDate(schedule, date.DayOfWeek))
                {
                    continue;
                }

                var dateTime = date.ToDateTime(schedule.ReminderTime);
                result.Add(new DateTimeOffset(dateTime, TimeSpan.Zero));
            }
        }

        return result.OrderBy(x => x).ToArray();
    }

    private static bool ShouldIncludeDate(MedicationSchedule schedule, DayOfWeek dayOfWeek)
    {
        if (schedule.RepeatType.Equals("daily", StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        if (!schedule.RepeatType.Equals("weekly", StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        if (string.IsNullOrWhiteSpace(schedule.DaysOfWeek))
        {
            return false;
        }

        var shortDayName = dayOfWeek switch
        {
            DayOfWeek.Monday => "mon",
            DayOfWeek.Tuesday => "tue",
            DayOfWeek.Wednesday => "wed",
            DayOfWeek.Thursday => "thu",
            DayOfWeek.Friday => "fri",
            DayOfWeek.Saturday => "sat",
            DayOfWeek.Sunday => "sun",
            _ => string.Empty,
        };

        var selectedDays = schedule
            .DaysOfWeek
            .Split(',', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries)
            .Select(value => value.ToLowerInvariant())
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        return selectedDays.Contains(shortDayName);
    }
}
