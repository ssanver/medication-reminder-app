using api.contracts;
using api_application.guest_simulation_application;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace api.Controllers;

[ApiController]
[Route("api/guest-simulation")]
[AllowAnonymous]
public sealed class GuestSimulationController(GuestSimulationApplicationService applicationService) : ControllerBase
{
    [HttpPost("scheduled-doses")]
    public ActionResult<IReadOnlyCollection<GuestScheduledDoseResponse>> GetScheduledDoses([FromBody] GuestScheduledDosesRequest request)
    {
        try
        {
            var records = applicationService.BuildScheduledDoses(
                request.DateKey,
                request.Medications.Select(ToMedicationRecord).ToArray(),
                request.Events.Select(ToDoseEventRecord).ToArray());

            return Ok(records.Select(ToScheduledDoseResponse).ToArray());
        }
        catch (FormatException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPost("report")]
    public ActionResult<GuestDoseReportResponse> GetReport([FromBody] GuestDoseReportRequest request)
    {
        try
        {
            var record = applicationService.BuildDoseReport(
                request.ReferenceDate,
                request.Medications.Select(ToMedicationRecord).ToArray(),
                request.Events.Select(ToDoseEventRecord).ToArray());

            return Ok(new GuestDoseReportResponse
            {
                Summary = new GuestDoseReportSummaryResponse
                {
                    PlannedCount = record.Summary.PlannedCount,
                    TakenCount = record.Summary.TakenCount,
                    MissedCount = record.Summary.MissedCount,
                    AdherenceRate = record.Summary.AdherenceRate,
                },
                WeeklyTrend = record.WeeklyTrend.Select(x => new GuestDoseTrendPointResponse
                {
                    Label = x.Label,
                    Value = x.Value,
                }).ToArray(),
                MedicationRows = record.MedicationRows.Select(x => new GuestDoseMedicationReportRowResponse
                {
                    Medication = x.Medication,
                    Taken = x.Taken,
                    Missed = x.Missed,
                }).ToArray(),
            });
        }
        catch (FormatException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    private static GuestMedicationRecord ToMedicationRecord(GuestMedicationInput input)
    {
        return new GuestMedicationRecord(
            Id: input.Id,
            Name: input.Name,
            Dosage: input.Dosage,
            UsageType: input.Form,
            IsBeforeMeal: input.IsBeforeMeal,
            FrequencyLabel: input.FrequencyLabel,
            IntervalUnit: input.IntervalUnit,
            IntervalCount: Math.Max(1, input.IntervalCount),
            CycleOffDays: Math.Max(0, input.CycleOffDays ?? 0),
            StartDate: input.StartDate,
            EndDate: string.IsNullOrWhiteSpace(input.EndDate) ? null : input.EndDate,
            Time: input.Time,
            Times: input.Times?.ToArray() ?? [],
            WeeklyDays: input.WeeklyDays?.ToArray() ?? [],
            Active: input.Active);
    }

    private static GuestDoseEventRecord ToDoseEventRecord(GuestDoseEventInput input)
    {
        return new GuestDoseEventRecord(
            MedicationId: input.MedicationId,
            DateKey: input.DateKey,
            ScheduledTime: input.ScheduledTime,
            Status: input.Status);
    }

    private static GuestScheduledDoseResponse ToScheduledDoseResponse(GuestScheduledDoseRecord record)
    {
        return new GuestScheduledDoseResponse
        {
            Id = record.Id,
            MedicationId = record.MedicationId,
            ScheduledTime = record.ScheduledTime,
            DateKey = record.DateKey,
            Name = record.Name,
            Dosage = record.Dosage,
            UsageType = record.UsageType,
            IsBeforeMeal = record.IsBeforeMeal,
            FrequencyLabel = record.FrequencyLabel,
            Status = record.Status,
        };
    }
}
