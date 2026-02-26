using api.data;
using Microsoft.EntityFrameworkCore;

namespace api.services.security;

public sealed class DatabaseBaselineResetHostedService(
    IServiceProvider serviceProvider,
    IConfiguration configuration,
    ILogger<DatabaseBaselineResetHostedService> logger) : IHostedService
{
    private const string ResetFlagKey = "Defaults:ResetDataOnStartup";

    public async Task StartAsync(CancellationToken cancellationToken)
    {
        if (!configuration.GetValue<bool>(ResetFlagKey))
        {
            return;
        }

        try
        {
            var defaultUserReference = DefaultUserReference.Resolve(configuration);

            await using var scope = serviceProvider.CreateAsyncScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            await using var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);

            // Child tables first for FK safety.
            var deletedNotificationActions = await dbContext.NotificationActions.ExecuteDeleteAsync(cancellationToken);
            var deletedDoseEvents = await dbContext.DoseEvents.ExecuteDeleteAsync(cancellationToken);
            var deletedHealthEvents = await dbContext.HealthEvents.ExecuteDeleteAsync(cancellationToken);
            var deletedMedicationSchedules = await dbContext.MedicationSchedules.ExecuteDeleteAsync(cancellationToken);
            var deletedInventoryRecords = await dbContext.InventoryRecords.ExecuteDeleteAsync(cancellationToken);
            var deletedPrescriptionReminders = await dbContext.PrescriptionReminders.ExecuteDeleteAsync(cancellationToken);
            var deletedEmergencyShareTokens = await dbContext.EmergencyShareTokens.ExecuteDeleteAsync(cancellationToken);
            var deletedSyncEvents = await dbContext.SyncEvents.ExecuteDeleteAsync(cancellationToken);
            var deletedSystemErrors = await dbContext.SystemErrorReports.ExecuteDeleteAsync(cancellationToken);
            var deletedFeedback = await dbContext.FeedbackRecords.ExecuteDeleteAsync(cancellationToken);
            var deletedAuditLogs = await dbContext.AuditLogs.ExecuteDeleteAsync(cancellationToken);
            var deletedCaregiverPermissions = await dbContext.CaregiverPermissions.ExecuteDeleteAsync(cancellationToken);
            var deletedCaregiverInvites = await dbContext.CaregiverInvites.ExecuteDeleteAsync(cancellationToken);

            // Core business records: keep empty so tester can add manually.
            var deletedMedications = await dbContext.Medications.ExecuteDeleteAsync(cancellationToken);

            // Keep only default user's records where a user reference exists.
            var deletedNotificationDeliveries = await dbContext.NotificationDeliveries
                .Where(x => x.UserReference != defaultUserReference)
                .ExecuteDeleteAsync(cancellationToken);
            var deletedConsentRecords = await dbContext.ConsentRecords
                .Where(x => x.UserReference != defaultUserReference)
                .ExecuteDeleteAsync(cancellationToken);
            var deletedVerificationTokens = await dbContext.EmailVerificationTokens
                .Where(x => x.Email != defaultUserReference)
                .ExecuteDeleteAsync(cancellationToken);

            await transaction.CommitAsync(cancellationToken);

            logger.LogInformation(
                "database-baseline-reset-completed defaultUser={DefaultUser} deletedMedications={DeletedMedications} deletedSchedules={DeletedSchedules} deletedDoseEvents={DeletedDoseEvents} deletedNotificationActions={DeletedNotificationActions} deletedNotificationDeliveries={DeletedNotificationDeliveries} deletedConsentRecords={DeletedConsentRecords} deletedVerificationTokens={DeletedVerificationTokens}",
                defaultUserReference,
                deletedMedications,
                deletedMedicationSchedules,
                deletedDoseEvents,
                deletedNotificationActions,
                deletedNotificationDeliveries,
                deletedConsentRecords,
                deletedVerificationTokens);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "database-baseline-reset-skipped reason=connection-or-schema-unavailable");
        }
    }

    public Task StopAsync(CancellationToken cancellationToken)
    {
        return Task.CompletedTask;
    }
}
