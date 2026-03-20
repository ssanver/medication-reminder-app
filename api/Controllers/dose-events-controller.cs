using api.contracts;
using api.data;
using api.models;
using api.services;
using api.services.security;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Globalization;
using System.Security.Claims;

namespace api.Controllers;

[ApiController]
[Route("api/dose-events")]
public sealed class DoseEventsController(AppDbContext dbContext, IAuditLogger auditLogger) : ControllerBase
{
    private static readonly HashSet<string> AllowedActions = new(StringComparer.OrdinalIgnoreCase)
    {
        "taken",
        "missed",
        "snooze",
        "clear",
    };

    [HttpPost("action")]
    public async Task<ActionResult<DoseActionResultResponse>> Action([FromBody] DoseActionRequest request)
    {
        var userReference = ResolveUserReference(out var errorResult);
        if (errorResult is not null)
        {
            return errorResult;
        }

        if (!AllowedActions.Contains(request.ActionType))
        {
            return BadRequest("Action type must be one of: taken, missed, snooze, clear.");
        }

        var medicationExists = string.IsNullOrWhiteSpace(userReference)
            ? await dbContext.Medications.AnyAsync(x => x.Id == request.MedicationId)
            : await dbContext.Medications.AnyAsync(x => x.Id == request.MedicationId && x.UserReference == userReference);
        if (!medicationExists)
        {
            await auditLogger.LogAsync(
                "unauthorized-attempt",
                $"medication-not-found medicationId={request.MedicationId} userReference={userReference} actionType={request.ActionType}");
            return NotFound("Medication not found.");
        }

        var normalizedActionType = request.ActionType.Trim().ToLowerInvariant();
        var normalizedDateKey = NormalizeDateKey(request.DateKey);
        var normalizedScheduledTime = NormalizeScheduledTime(request.ScheduledTime);

        if (normalizedActionType.Equals("snooze", StringComparison.OrdinalIgnoreCase)
            && request.SnoozeMinutes is not (5 or 10 or 15))
        {
            return BadRequest("Snooze minutes must be one of: 5, 10, 15.");
        }

        var existing = await dbContext.DoseEvents.FirstOrDefaultAsync(x =>
            x.MedicationId == request.MedicationId
            && x.DateKey == normalizedDateKey
            && x.ScheduledTime == normalizedScheduledTime);
        var previousActionType = existing?.ActionType?.Trim().ToLowerInvariant();

        if (normalizedActionType == "clear")
        {
            await ApplyInventoryDeltaAsync(request.MedicationId, previousActionType, null);
            if (existing is not null)
            {
                dbContext.DoseEvents.Remove(existing);
                await dbContext.SaveChangesAsync();
            }

            var response = new DoseEventResponse
            {
                Id = existing?.Id ?? Guid.Empty,
                MedicationId = request.MedicationId,
                ActionType = "clear",
                DateKey = normalizedDateKey,
                ScheduledTime = normalizedScheduledTime,
                ActionAt = DateTimeOffset.UtcNow,
                SnoozeMinutes = null,
            };

            var scheduledDoses = await BuildScheduledDosesAsync(userReference, DateOnly.ParseExact(normalizedDateKey, "yyyy-MM-dd", CultureInfo.InvariantCulture));
            return Ok(new DoseActionResultResponse
            {
                Event = response,
                ScheduledDoses = scheduledDoses,
            });
        }

        var doseEvent = existing ?? new DoseEvent
        {
            Id = Guid.NewGuid(),
            MedicationId = request.MedicationId,
            ActionType = normalizedActionType,
            DateKey = normalizedDateKey,
            ScheduledTime = normalizedScheduledTime,
            CreatedAt = DateTimeOffset.UtcNow,
        };

        doseEvent.ActionType = normalizedActionType;
        doseEvent.DateKey = normalizedDateKey;
        doseEvent.ScheduledTime = normalizedScheduledTime;
        doseEvent.ActionAt = DateTimeOffset.UtcNow;
        doseEvent.SnoozeMinutes = request.SnoozeMinutes;

        if (existing is null)
        {
            dbContext.DoseEvents.Add(doseEvent);
        }

        await ApplyInventoryDeltaAsync(request.MedicationId, previousActionType, normalizedActionType);

        await dbContext.SaveChangesAsync();

        var actionResponse = ToResponse(doseEvent);
        var refreshedDoses = await BuildScheduledDosesAsync(userReference, DateOnly.ParseExact(normalizedDateKey, "yyyy-MM-dd", CultureInfo.InvariantCulture));
        return Ok(new DoseActionResultResponse
        {
            Event = actionResponse,
            ScheduledDoses = refreshedDoses,
        });
    }

    [HttpGet("history")]
    public async Task<ActionResult<IReadOnlyCollection<DoseEventResponse>>> GetHistory([FromQuery] DoseHistoryQuery query)
    {
        var userReference = ResolveUserReference(out var errorResult);
        if (errorResult is not null)
        {
            return errorResult;
        }

        var ownedMedicationIdsQuery = dbContext.Medications.AsNoTracking();
        if (!string.IsNullOrWhiteSpace(userReference))
        {
            ownedMedicationIdsQuery = ownedMedicationIdsQuery.Where(x => x.UserReference == userReference);
        }

        var ownedMedicationIds = ownedMedicationIdsQuery.Select(x => x.Id);

        var eventsQuery = dbContext.DoseEvents
            .AsNoTracking()
            .Where(x => ownedMedicationIds.Contains(x.MedicationId));

        if (query.MedicationId.HasValue)
        {
            eventsQuery = eventsQuery.Where(x => x.MedicationId == query.MedicationId.Value);
        }

        if (!string.IsNullOrWhiteSpace(query.ActionType))
        {
            var normalized = query.ActionType.Trim().ToLowerInvariant();
            if (!AllowedActions.Contains(normalized))
            {
                return BadRequest("ActionType filter must be one of: taken, missed, snooze, clear.");
            }

            eventsQuery = eventsQuery.Where(x => x.ActionType == normalized);
        }

        if (query.FromDate.HasValue)
        {
            var fromDateTime = query.FromDate.Value.ToDateTime(TimeOnly.MinValue);
            eventsQuery = eventsQuery.Where(x => x.ActionAt >= fromDateTime);
        }

        if (query.ToDate.HasValue)
        {
            var toDateTime = query.ToDate.Value.ToDateTime(TimeOnly.MaxValue);
            eventsQuery = eventsQuery.Where(x => x.ActionAt <= toDateTime);
        }

        var result = await eventsQuery.OrderByDescending(x => x.ActionAt).Take(400).ToListAsync();

        return Ok(result.Select(ToResponse).ToArray());
    }

    [HttpGet("summary")]
    public async Task<ActionResult<DoseSummaryResponse>> GetSummary([FromQuery] DateOnly fromDate, [FromQuery] DateOnly toDate)
    {
        var userReference = ResolveUserReference(out var errorResult);
        if (errorResult is not null)
        {
            return errorResult;
        }

        if (toDate < fromDate)
        {
            return BadRequest("toDate cannot be earlier than fromDate.");
        }

        var ownedMedicationIdsQuery = dbContext.Medications.AsNoTracking();
        if (!string.IsNullOrWhiteSpace(userReference))
        {
            ownedMedicationIdsQuery = ownedMedicationIdsQuery.Where(x => x.UserReference == userReference);
        }

        var ownedMedicationIds = ownedMedicationIdsQuery.Select(x => x.Id);

        var events = await dbContext
            .DoseEvents
            .AsNoTracking()
            .Where(x => ownedMedicationIds.Contains(x.MedicationId))
            .Where(x => x.ActionAt >= fromDate.ToDateTime(TimeOnly.MinValue) && x.ActionAt <= toDate.ToDateTime(TimeOnly.MaxValue))
            .ToListAsync();

        var medicationsQuery = dbContext
            .Medications
            .Include(x => x.Schedules)
            .Where(x => x.IsActive);
        if (!string.IsNullOrWhiteSpace(userReference))
        {
            medicationsQuery = medicationsQuery.Where(x => x.UserReference == userReference);
        }

        var medications = await medicationsQuery.ToListAsync();

        var dayCount = (toDate.DayNumber - fromDate.DayNumber) + 1;
        var plannedCount = medications
            .Sum(medication => SchedulePlanner.BuildOccurrences(
                medication.Schedules.ToArray(),
                medication.StartDate,
                fromDate,
                dayCount,
                medication.EndDate).Count);

        var takenCount = events.Count(x => x.ActionType == "taken");
        var missedCount = events.Count(x => x.ActionType == "missed");
        var snoozedCount = events.Count(x => x.ActionType == "snooze");

        var adherenceRate = plannedCount == 0
            ? 0
            : Math.Round((decimal)takenCount / plannedCount, 4, MidpointRounding.AwayFromZero);

        return Ok(new DoseSummaryResponse
        {
            FromDate = fromDate,
            ToDate = toDate,
            PlannedCount = plannedCount,
            TakenCount = takenCount,
            MissedCount = missedCount,
            SnoozedCount = snoozedCount,
            AdherenceRate = adherenceRate,
        });
    }

    [HttpGet("scheduled-doses")]
    public async Task<ActionResult<IReadOnlyCollection<ScheduledDoseResponse>>> GetScheduledDoses(
        [FromQuery] DateOnly? date = null)
    {
        var userReference = ResolveUserReference(out var errorResult);
        if (errorResult is not null)
        {
            return errorResult;
        }

        var targetDate = date ?? DateOnly.FromDateTime(DateTime.UtcNow.Date);
        var doses = await BuildScheduledDosesAsync(userReference, targetDate);
        return Ok(doses);
    }

    [HttpGet("scheduled-doses-window")]
    public async Task<ActionResult<ScheduledDosesWindowResponse>> GetScheduledDosesWindow(
        [FromQuery] DateOnly fromDate,
        [FromQuery] DateOnly toDate)
    {
        var userReference = ResolveUserReference(out var errorResult);
        if (errorResult is not null)
        {
            return errorResult;
        }

        if (toDate < fromDate)
        {
            return BadRequest("toDate cannot be earlier than fromDate.");
        }

        if ((toDate.DayNumber - fromDate.DayNumber) > 31)
        {
            return BadRequest("Date window cannot exceed 32 days.");
        }

        var doses = await BuildScheduledDosesRangeAsync(userReference, fromDate, toDate);
        return Ok(new ScheduledDosesWindowResponse
        {
            FromDate = fromDate,
            ToDate = toDate,
            Doses = doses,
        });
    }

    private async Task<ScheduledDoseResponse[]> BuildScheduledDosesAsync(string? userReference, DateOnly targetDate)
    {
        return await BuildScheduledDosesRangeAsync(userReference, targetDate, targetDate);
    }

    private async Task<ScheduledDoseResponse[]> BuildScheduledDosesRangeAsync(string? userReference, DateOnly fromDate, DateOnly toDate)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow.Date);
        var medicationsQuery = dbContext
            .Medications
            .AsNoTracking()
            .Where(x => x.IsActive);
        if (!string.IsNullOrWhiteSpace(userReference))
        {
            medicationsQuery = medicationsQuery.Where(x => x.UserReference == userReference);
        }

        var medications = await medicationsQuery
            .OrderBy(x => x.Name)
            .Select(x => new ScheduledMedicationProjection(
                x.Id,
                x.Name,
                x.Dosage,
                x.UsageType,
                x.IsBeforeMeal,
                x.StartDate,
                x.EndDate,
                x.Schedules
                    .OrderBy(schedule => schedule.ReminderTime)
                    .Select(schedule => new ScheduledMedicationScheduleProjection(
                        schedule.RepeatType,
                        schedule.IntervalCount,
                        schedule.ReminderTime,
                        schedule.DaysOfWeek))
                    .ToArray()))
            .ToListAsync();

        var medicationIds = medications.Select(x => x.Id).ToArray();
        if (medicationIds.Length == 0)
        {
            return [];
        }

        var fromDateKey = fromDate.ToString("yyyy-MM-dd");
        var toDateKey = toDate.ToString("yyyy-MM-dd");
        var events = await dbContext
            .DoseEvents
            .AsNoTracking()
            .Where(x => medicationIds.Contains(x.MedicationId))
            .Where(x => x.DateKey.CompareTo(fromDateKey) >= 0 && x.DateKey.CompareTo(toDateKey) <= 0)
            .Select(x => new ScheduledDoseEventProjection(x.MedicationId, x.DateKey, x.ScheduledTime, x.ActionType, x.ActionAt))
            .ToListAsync();

        var eventByDoseKey = events
            .GroupBy(x => $"{x.MedicationId}:{x.DateKey}:{x.ScheduledTime}")
            .ToDictionary(group => group.Key, group => group.OrderByDescending(x => x.ActionAt).First().ActionType, StringComparer.OrdinalIgnoreCase);

        var doses = new List<ScheduledDoseResponse>();
        for (var date = fromDate; date <= toDate; date = date.AddDays(1))
        {
            var targetDateKey = date.ToString("yyyy-MM-dd");
            foreach (var medication in medications)
            {
                foreach (var schedule in medication.Schedules)
                {
                    foreach (var scheduledTime in GetScheduledTimesForDate(schedule, medication.StartDate, date, medication.EndDate))
                    {
                        var formattedScheduledTime = scheduledTime.ToString("HH:mm");
                        var key = $"{medication.Id}:{targetDateKey}:{formattedScheduledTime}";
                        var status = eventByDoseKey.TryGetValue(key, out var actionType)
                            ? NormalizeDoseStatus(actionType)
                            : date < today
                                ? "missed"
                                : "pending";

                        doses.Add(new ScheduledDoseResponse
                        {
                            Id = $"{medication.Id}-{targetDateKey}-{formattedScheduledTime}",
                            MedicationId = medication.Id,
                            ScheduledTime = formattedScheduledTime,
                            DateKey = targetDateKey,
                            Name = medication.Name,
                            Dosage = medication.Dosage,
                            UsageType = medication.UsageType,
                            IsBeforeMeal = medication.IsBeforeMeal,
                            FrequencyLabel = BuildFrequencyLabel(new MedicationSchedule
                            {
                                RepeatType = schedule.RepeatType,
                                IntervalCount = schedule.IntervalCount,
                                ReminderTime = schedule.ReminderTime,
                                DaysOfWeek = schedule.DaysOfWeek,
                            }),
                            Status = status,
                        });
                    }
                }
            }
        }

        return doses
            .OrderBy(x => x.DateKey, StringComparer.Ordinal)
            .ThenBy(x => x.ScheduledTime, StringComparer.Ordinal)
            .ThenBy(x => x.Name, StringComparer.OrdinalIgnoreCase)
            .ToArray();
    }

    private static IReadOnlyCollection<TimeOnly> GetScheduledTimesForDate(
        ScheduledMedicationScheduleProjection schedule,
        DateOnly medicationStartDate,
        DateOnly targetDate,
        DateOnly? medicationEndDate)
    {
        if (targetDate < medicationStartDate)
        {
            return [];
        }

        if (medicationEndDate.HasValue && targetDate > medicationEndDate.Value)
        {
            return [];
        }

        if (schedule.RepeatType.Equals("hourly", StringComparison.OrdinalIgnoreCase))
        {
            return BuildHourlyTimesForDate(schedule, medicationStartDate, targetDate, medicationEndDate);
        }

        if (!ShouldIncludeDate(schedule, targetDate, medicationStartDate))
        {
            return [];
        }

        return [schedule.ReminderTime];
    }

    private static TimeOnly[] BuildHourlyTimesForDate(
        ScheduledMedicationScheduleProjection schedule,
        DateOnly medicationStartDate,
        DateOnly targetDate,
        DateOnly? medicationEndDate)
    {
        var intervalHours = Math.Max(1, schedule.IntervalCount);
        var rangeStart = targetDate.ToDateTime(TimeOnly.MinValue);
        var rangeEnd = targetDate.ToDateTime(TimeOnly.MaxValue);
        var medicationStart = medicationStartDate.ToDateTime(schedule.ReminderTime);
        var medicationEnd = medicationEndDate?.ToDateTime(TimeOnly.MaxValue);

        var cursor = medicationStart;
        if (cursor < rangeStart)
        {
            var diffHours = (rangeStart - cursor).TotalHours;
            var steps = (int)Math.Ceiling(diffHours / intervalHours);
            cursor = cursor.AddHours(steps * intervalHours);
        }

        var times = new List<TimeOnly>();
        while (cursor <= rangeEnd)
        {
            if ((!medicationEnd.HasValue || cursor <= medicationEnd.Value) && cursor >= rangeStart)
            {
                times.Add(TimeOnly.FromDateTime(cursor));
            }

            cursor = cursor.AddHours(intervalHours);
        }

        return times.ToArray();
    }

    private static bool ShouldIncludeDate(
        ScheduledMedicationScheduleProjection schedule,
        DateOnly targetDate,
        DateOnly medicationStartDate)
    {
        var dayDiffFromStart = targetDate.DayNumber - medicationStartDate.DayNumber;
        if (dayDiffFromStart < 0)
        {
            return false;
        }

        var normalizedIntervalCount = Math.Max(1, schedule.IntervalCount);
        if (schedule.RepeatType.Equals("daily", StringComparison.OrdinalIgnoreCase))
        {
            return dayDiffFromStart % normalizedIntervalCount == 0;
        }

        if (schedule.RepeatType.Equals("cycle", StringComparison.OrdinalIgnoreCase))
        {
            var offDays = ParseCycleOffDays(schedule.DaysOfWeek);
            var cycleLength = normalizedIntervalCount + offDays;
            if (cycleLength <= 0)
            {
                return false;
            }

            var cycleIndex = dayDiffFromStart % cycleLength;
            return cycleIndex < normalizedIntervalCount;
        }

        if (schedule.RepeatType.Equals("as-needed", StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        if (!schedule.RepeatType.Equals("weekly", StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        if (string.IsNullOrWhiteSpace(schedule.DaysOfWeek))
        {
            return false;
        }

        var shortDayName = targetDate.DayOfWeek switch
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

        if (!selectedDays.Contains(shortDayName))
        {
            return false;
        }

        var weekDiffFromStart = dayDiffFromStart / 7;
        return weekDiffFromStart % normalizedIntervalCount == 0;
    }

    private async Task ApplyInventoryDeltaAsync(Guid medicationId, string? previousActionType, string? nextActionType)
    {
        var inventory = await dbContext.InventoryRecords.FirstOrDefaultAsync(x => x.MedicationId == medicationId);
        if (inventory is null)
        {
            return;
        }

        var previousTaken = string.Equals(previousActionType, "taken", StringComparison.Ordinal);
        var nextTaken = string.Equals(nextActionType, "taken", StringComparison.Ordinal);
        if (previousTaken == nextTaken)
        {
            return;
        }

        if (!previousTaken && nextTaken)
        {
            inventory.CurrentStock = Math.Max(0, inventory.CurrentStock - 1);
        }
        else if (previousTaken && !nextTaken)
        {
            inventory.CurrentStock += 1;
        }

        inventory.UpdatedAt = DateTimeOffset.UtcNow;
        if (inventory.CurrentStock <= inventory.Threshold)
        {
            inventory.LastAlertAt = DateTimeOffset.UtcNow;
        }
    }

    [HttpGet("report")]
    public async Task<ActionResult<DoseReportResponse>> GetReport(
        [FromQuery] DateOnly? fromDate = null,
        [FromQuery] DateOnly? toDate = null,
        [FromQuery] string locale = "en")
    {
        var userReference = ResolveUserReference(out var errorResult);
        if (errorResult is not null)
        {
            return errorResult;
        }

        var resolvedToDate = toDate ?? DateOnly.FromDateTime(DateTime.UtcNow.Date);
        var resolvedFromDate = fromDate ?? resolvedToDate.AddDays(-6);
        if (resolvedToDate < resolvedFromDate)
        {
            return BadRequest("toDate cannot be earlier than fromDate.");
        }

        var medicationsQuery = dbContext
            .Medications
            .AsNoTracking()
            .Include(x => x.Schedules)
            .Where(x => x.IsActive);
        if (!string.IsNullOrWhiteSpace(userReference))
        {
            medicationsQuery = medicationsQuery.Where(x => x.UserReference == userReference);
        }

        var medications = await medicationsQuery
            .OrderBy(x => x.Name)
            .ToListAsync();

        var medicationIds = medications.Select(x => x.Id).ToArray();
        var eventRows = await dbContext
            .DoseEvents
            .AsNoTracking()
            .Where(x => medicationIds.Contains(x.MedicationId))
            .Where(x =>
                x.ActionAt >= resolvedFromDate.ToDateTime(TimeOnly.MinValue) &&
                x.ActionAt <= resolvedToDate.ToDateTime(TimeOnly.MaxValue))
            .ToListAsync();
        var eventByDoseKey = eventRows
            .Where(x => x.ActionType == "taken" || x.ActionType == "missed")
            .GroupBy(x => $"{x.MedicationId}:{x.DateKey}:{x.ScheduledTime}")
            .ToDictionary(group => group.Key, group => group.OrderByDescending(x => x.ActionAt).First().ActionType, StringComparer.OrdinalIgnoreCase);

        var today = DateOnly.FromDateTime(DateTime.UtcNow.Date);
        var summaryPlanned = 0;
        var summaryTaken = 0;
        var summaryMissed = 0;
        var summarySnoozed = eventRows.Count(x => x.ActionType == "snooze");
        var medicationRows = medications.ToDictionary(
            key => key.Id,
            value => new DoseMedicationReportRowResponse
            {
                Medication = value.Name,
                Taken = 0,
                Missed = 0,
            });
        var weeklyTrend = new List<DoseTrendPointResponse>();
        var culture = ResolveCulture(locale);

        for (var date = resolvedFromDate; date <= resolvedToDate; date = date.AddDays(1))
        {
            var dayKey = date.ToString("yyyy-MM-dd");
            var dayDateTime = date.ToDateTime(TimeOnly.MinValue);
            var dayPlanned = 0;
            var dayTaken = 0;

            foreach (var medication in medications)
            {
                var planned = SchedulePlanner.BuildOccurrences(
                    medication.Schedules.ToArray(),
                    medication.StartDate,
                    date,
                    totalDays: 1,
                    medication.EndDate);

                foreach (var occurrence in planned)
                {
                    dayPlanned += 1;
                    summaryPlanned += 1;

                    var scheduledTime = TimeOnly.FromDateTime(occurrence.UtcDateTime).ToString("HH:mm");
                    var doseKey = $"{medication.Id}:{dayKey}:{scheduledTime}";
                    var status = eventByDoseKey.TryGetValue(doseKey, out var actionType)
                        ? NormalizeDoseStatus(actionType)
                        : date < today
                            ? "missed"
                            : "pending";

                    if (status == "taken")
                    {
                        dayTaken += 1;
                        summaryTaken += 1;
                        medicationRows[medication.Id].Taken += 1;
                    }
                    else if (status == "missed")
                    {
                        summaryMissed += 1;
                        medicationRows[medication.Id].Missed += 1;
                    }
                }
            }

            var dayAdherence = dayPlanned == 0 ? 0 : (int)Math.Round((decimal)dayTaken * 100 / dayPlanned, MidpointRounding.AwayFromZero);
            weeklyTrend.Add(new DoseTrendPointResponse
            {
                Label = dayDateTime.ToString("ddd", culture).Replace(".", string.Empty),
                Value = dayAdherence,
            });
        }

        var adherenceRate = summaryPlanned == 0
            ? 0
            : Math.Round((decimal)summaryTaken / summaryPlanned, 4, MidpointRounding.AwayFromZero);

        return Ok(new DoseReportResponse
        {
            Summary = new DoseSummaryResponse
            {
                FromDate = resolvedFromDate,
                ToDate = resolvedToDate,
                PlannedCount = summaryPlanned,
                TakenCount = summaryTaken,
                MissedCount = summaryMissed,
                SnoozedCount = summarySnoozed,
                AdherenceRate = adherenceRate,
            },
            WeeklyTrend = weeklyTrend,
            MedicationRows = medicationRows.Values
                .Where(x => x.Taken > 0 || x.Missed > 0)
                .OrderBy(x => x.Medication)
                .ToArray(),
        });
    }

    private static DoseEventResponse ToResponse(DoseEvent doseEvent)
    {
        return new DoseEventResponse
        {
            Id = doseEvent.Id,
            MedicationId = doseEvent.MedicationId,
            ActionType = doseEvent.ActionType,
            DateKey = doseEvent.DateKey,
            ScheduledTime = doseEvent.ScheduledTime,
            ActionAt = doseEvent.ActionAt,
            SnoozeMinutes = doseEvent.SnoozeMinutes,
        };
    }

    private static string NormalizeDateKey(string? value)
    {
        var text = (value ?? string.Empty).Trim();
        if (DateOnly.TryParse(text, out var date))
        {
            return date.ToString("yyyy-MM-dd");
        }

        return DateOnly.FromDateTime(DateTime.UtcNow).ToString("yyyy-MM-dd");
    }

    private static string NormalizeScheduledTime(string? value)
    {
        var text = (value ?? string.Empty).Trim();
        if (TimeOnly.TryParse(text, out var time))
        {
            return time.ToString("HH:mm");
        }

        return "00:00";
    }

    private static string NormalizeDoseStatus(string? actionType)
    {
        var value = (actionType ?? string.Empty).Trim().ToLowerInvariant();
        return value switch
        {
            "taken" => "taken",
            "missed" => "missed",
            _ => "pending",
        };
    }

    private static CultureInfo ResolveCulture(string? locale)
    {
        var normalized = (locale ?? "en").Trim().ToLowerInvariant();
        if (normalized.StartsWith("tr"))
        {
            return CultureInfo.GetCultureInfo("tr-TR");
        }

        return CultureInfo.GetCultureInfo("en-US");
    }

    private static string BuildFrequencyLabel(MedicationSchedule schedule)
    {
        var intervalCount = Math.Max(1, schedule.IntervalCount);
        if (schedule.RepeatType.Equals("as-needed", StringComparison.OrdinalIgnoreCase))
        {
            return "As Needed";
        }

        if (schedule.RepeatType.Equals("hourly", StringComparison.OrdinalIgnoreCase))
        {
            return intervalCount == 1 ? "Every 1 Hour" : $"Every {intervalCount} Hours";
        }

        if (schedule.RepeatType.Equals("cycle", StringComparison.OrdinalIgnoreCase))
        {
            var offDays = ParseCycleOffDays(schedule.DaysOfWeek);
            return $"Cycle {intervalCount}/{offDays}";
        }

        if (schedule.RepeatType.Equals("weekly", StringComparison.OrdinalIgnoreCase))
        {
            return intervalCount == 1 ? "Every Week" : $"Every {intervalCount} Weeks";
        }

        return intervalCount == 1 ? "Every 1 Day" : $"Every {intervalCount} Days";
    }

    private static int ParseCycleOffDays(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw))
        {
            return 0;
        }

        var value = raw.Trim();
        if (!value.StartsWith("off:", StringComparison.OrdinalIgnoreCase))
        {
            return 0;
        }

        var numberText = value[4..];
        return int.TryParse(numberText, out var parsed) ? Math.Max(0, parsed) : 0;
    }

    private string? ResolveUserReference(out ActionResult? errorResult)
    {
        var principal = HttpContext?.User;
        var claimedEmail =
            principal?.FindFirstValue(ClaimTypes.Email)
            ?? principal?.FindFirstValue("email");

        if (string.IsNullOrWhiteSpace(claimedEmail))
        {
            errorResult = null;
            return null;
        }

        errorResult = null;
        return claimedEmail.Trim().ToLowerInvariant();
    }

    private sealed record ScheduledMedicationProjection(
        Guid Id,
        string Name,
        string Dosage,
        string? UsageType,
        bool IsBeforeMeal,
        DateOnly StartDate,
        DateOnly? EndDate,
        ScheduledMedicationScheduleProjection[] Schedules);

    private sealed record ScheduledMedicationScheduleProjection(
        string RepeatType,
        int IntervalCount,
        TimeOnly ReminderTime,
        string? DaysOfWeek);

    private sealed record ScheduledDoseEventProjection(
        Guid MedicationId,
        string DateKey,
        string ScheduledTime,
        string ActionType,
        DateTimeOffset ActionAt);
}
