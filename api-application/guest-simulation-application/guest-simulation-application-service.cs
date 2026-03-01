using System.Globalization;

namespace api_application.guest_simulation_application;

public sealed class GuestSimulationApplicationService
{
    public IReadOnlyCollection<GuestScheduledDoseRecord> BuildScheduledDoses(
        string dateKey,
        IReadOnlyCollection<GuestMedicationRecord> medications,
        IReadOnlyCollection<GuestDoseEventRecord> events)
    {
        var targetDate = ParseDate(dateKey);
        var today = DateOnly.FromDateTime(DateTime.UtcNow.Date);
        var eventByDoseKey = BuildEventMap(events);

        var items = medications
            .Where(x => x.Active)
            .SelectMany(medication => ResolveTimes(medication).Select(time => new { medication, time }))
            .Where(x => MatchesScheduleForDate(x.medication, targetDate))
            .Select(x =>
            {
                var doseKey = ComposeDoseKey(x.medication.Id, dateKey, x.time);
                var status = eventByDoseKey.TryGetValue(doseKey, out var eventStatus)
                    ? NormalizeStatus(eventStatus)
                    : targetDate < today ? "missed" : "pending";

                return new GuestScheduledDoseRecord(
                    Id: $"{x.medication.Id}-{dateKey}-{x.time}",
                    MedicationId: x.medication.Id,
                    ScheduledTime: x.time,
                    DateKey: dateKey,
                    Name: x.medication.Name,
                    Dosage: x.medication.Dosage,
                    UsageType: x.medication.UsageType,
                    IsBeforeMeal: x.medication.IsBeforeMeal,
                    FrequencyLabel: x.medication.FrequencyLabel,
                    Status: status);
            })
            .OrderBy(x => x.ScheduledTime, StringComparer.Ordinal)
            .ThenBy(x => x.Name, StringComparer.OrdinalIgnoreCase)
            .ToArray();

        return items;
    }

    public GuestDoseReportRecord BuildDoseReport(
        string referenceDateKey,
        IReadOnlyCollection<GuestMedicationRecord> medications,
        IReadOnlyCollection<GuestDoseEventRecord> events)
    {
        var referenceDate = ParseDate(referenceDateKey);
        var firstDate = referenceDate.AddDays(-6);

        var dayKeys = Enumerable.Range(0, 7)
            .Select(offset => firstDate.AddDays(offset).ToString("yyyy-MM-dd", CultureInfo.InvariantCulture))
            .ToArray();

        var plannedDoseByDay = dayKeys.Select(dayKey => BuildScheduledDoses(dayKey, medications, events)).ToArray();
        var allPlanned = plannedDoseByDay.SelectMany(x => x).ToArray();

        var plannedCount = allPlanned.Length;
        var takenCount = allPlanned.Count(x => x.Status == "taken");
        var missedCount = allPlanned.Count(x => x.Status == "missed");
        var adherenceRate = plannedCount == 0
            ? 0m
            : Math.Round((decimal)takenCount / plannedCount, 4, MidpointRounding.AwayFromZero);

        var trend = plannedDoseByDay
            .Select((doses, idx) => new GuestDoseTrendPointRecord(
                Label: dayKeys[idx][5..],
                Value: doses.Count(x => x.Status == "taken")))
            .ToArray();

        var rows = medications
            .Where(x => x.Active)
            .Select(medication =>
            {
                var doses = allPlanned.Where(x => x.MedicationId == medication.Id);
                return new GuestDoseMedicationRowRecord(
                    Medication: medication.Name,
                    Taken: doses.Count(x => x.Status == "taken"),
                    Missed: doses.Count(x => x.Status == "missed"));
            })
            .ToArray();

        return new GuestDoseReportRecord(
            Summary: new GuestDoseReportSummaryRecord(plannedCount, takenCount, missedCount, adherenceRate),
            WeeklyTrend: trend,
            MedicationRows: rows);
    }

    private static Dictionary<string, string> BuildEventMap(IReadOnlyCollection<GuestDoseEventRecord> events)
    {
        return events
            .GroupBy(x => ComposeDoseKey(x.MedicationId, x.DateKey, NormalizeTime(x.ScheduledTime)), StringComparer.OrdinalIgnoreCase)
            .ToDictionary(
                group => group.Key,
                group => NormalizeStatus(group.Last().Status),
                StringComparer.OrdinalIgnoreCase);
    }

    private static bool MatchesScheduleForDate(GuestMedicationRecord medication, DateOnly date)
    {
        var startDate = ParseDate(medication.StartDate);
        if (date < startDate)
        {
            return false;
        }

        if (!string.IsNullOrWhiteSpace(medication.EndDate))
        {
            var endDate = ParseDate(medication.EndDate!);
            if (date > endDate)
            {
                return false;
            }
        }

        var diff = date.DayNumber - startDate.DayNumber;
        var intervalUnit = medication.IntervalUnit.Trim().ToLowerInvariant();
        var intervalCount = Math.Max(1, medication.IntervalCount);

        return intervalUnit switch
        {
            "week" => ResolveWeeklyDays(medication, startDate).Contains(ToWeekdayNumber(date.DayOfWeek)),
            "hour" => true,
            "cycle" => MatchCycle(diff, intervalCount, Math.Max(0, medication.CycleOffDays)),
            _ => diff % intervalCount == 0,
        };
    }

    private static bool MatchCycle(int diff, int onDays, int offDays)
    {
        var cycleLength = onDays + offDays;
        if (cycleLength <= 0)
        {
            return true;
        }

        var dayIndex = diff % cycleLength;
        return dayIndex < onDays;
    }

    private static IReadOnlyCollection<int> ResolveWeeklyDays(GuestMedicationRecord medication, DateOnly startDate)
    {
        var unique = medication.WeeklyDays
            .Where(day => day >= 0 && day <= 6)
            .Distinct()
            .ToArray();

        if (unique.Length > 0)
        {
            return unique;
        }

        return [ToWeekdayNumber(startDate.DayOfWeek)];
    }

    private static int ToWeekdayNumber(DayOfWeek dayOfWeek)
    {
        return dayOfWeek switch
        {
            DayOfWeek.Sunday => 0,
            DayOfWeek.Monday => 1,
            DayOfWeek.Tuesday => 2,
            DayOfWeek.Wednesday => 3,
            DayOfWeek.Thursday => 4,
            DayOfWeek.Friday => 5,
            DayOfWeek.Saturday => 6,
            _ => 0,
        };
    }

    private static IReadOnlyCollection<string> ResolveTimes(GuestMedicationRecord medication)
    {
        var items = medication.Times
            .Append(medication.Time ?? string.Empty)
            .Select(NormalizeTime)
            .Where(x => !string.IsNullOrWhiteSpace(x))
            .Distinct(StringComparer.Ordinal)
            .OrderBy(x => x, StringComparer.Ordinal)
            .ToArray();

        return items.Length > 0 ? items : ["09:00"];
    }

    private static string ComposeDoseKey(string medicationId, string dateKey, string scheduledTime)
    {
        return $"{medicationId}:{dateKey}:{scheduledTime}";
    }

    private static DateOnly ParseDate(string value)
    {
        return DateOnly.ParseExact(value, "yyyy-MM-dd", CultureInfo.InvariantCulture);
    }

    private static string NormalizeStatus(string value)
    {
        var normalized = value.Trim().ToLowerInvariant();
        return normalized is "taken" or "missed" ? normalized : "pending";
    }

    private static string NormalizeTime(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return string.Empty;
        }

        var parts = value.Trim().Split(':');
        if (parts.Length < 2)
        {
            return string.Empty;
        }

        if (!int.TryParse(parts[0], out var hour) || !int.TryParse(parts[1], out var minute))
        {
            return string.Empty;
        }

        hour = Math.Clamp(hour, 0, 23);
        minute = Math.Clamp(minute, 0, 59);
        return $"{hour:D2}:{minute:D2}";
    }
}
