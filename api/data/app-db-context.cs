using Microsoft.EntityFrameworkCore;
using api.models;

namespace api.data;

public sealed class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Medication> Medications => Set<Medication>();
    public DbSet<MedicineCatalogItem> MedicineCatalogItems => Set<MedicineCatalogItem>();
    public DbSet<MedicationSchedule> MedicationSchedules => Set<MedicationSchedule>();
    public DbSet<DoseEvent> DoseEvents => Set<DoseEvent>();
    public DbSet<InventoryRecord> InventoryRecords => Set<InventoryRecord>();
    public DbSet<PrescriptionReminder> PrescriptionReminders => Set<PrescriptionReminder>();
    public DbSet<SyncEvent> SyncEvents => Set<SyncEvent>();
    public DbSet<HealthEvent> HealthEvents => Set<HealthEvent>();
    public DbSet<NotificationDelivery> NotificationDeliveries => Set<NotificationDelivery>();
    public DbSet<NotificationAction> NotificationActions => Set<NotificationAction>();
    public DbSet<SystemErrorReport> SystemErrorReports => Set<SystemErrorReport>();
    public DbSet<FeedbackRecord> FeedbackRecords => Set<FeedbackRecord>();
    public DbSet<EmailVerificationToken> EmailVerificationTokens => Set<EmailVerificationToken>();
    public DbSet<ConsentRecord> ConsentRecords => Set<ConsentRecord>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<CaregiverInvite> CaregiverInvites => Set<CaregiverInvite>();
    public DbSet<CaregiverPermission> CaregiverPermissions => Set<CaregiverPermission>();
    public DbSet<EmergencyShareToken> EmergencyShareTokens => Set<EmergencyShareToken>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Medication>(entity =>
        {
            entity.ToTable("medications");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Name).HasMaxLength(120).IsRequired();
            entity.Property(x => x.Dosage).HasMaxLength(60).IsRequired();
            entity.Property(x => x.UsageType).HasMaxLength(60);
            entity.Property(x => x.UpdatedAt).IsRequired();
        });

        modelBuilder.Entity<MedicineCatalogItem>(entity =>
        {
            entity.ToTable("medicine-catalog");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.MedicineName).HasMaxLength(180).IsRequired();
            entity.Property(x => x.Barcode).HasMaxLength(40);
            entity.Property(x => x.Origin).HasMaxLength(80);
            entity.Property(x => x.Unit).HasMaxLength(80);
            entity.Property(x => x.PackingAmount).HasMaxLength(40);
            entity.Property(x => x.ActiveIngredient).HasMaxLength(180);
            entity.Property(x => x.TherapeuticClass).HasMaxLength(180);
            entity.Property(x => x.Manufacturer).HasMaxLength(180);
            entity.Property(x => x.SourceUrl).HasMaxLength(500);
            entity.Property(x => x.UpdatedAt).IsRequired();
            entity.HasIndex(x => x.MedicineName);
            entity.HasIndex(x => x.Barcode);
        });

        modelBuilder.Entity<MedicationSchedule>(entity =>
        {
            entity.ToTable("medication-schedules");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.RepeatType).HasMaxLength(20).IsRequired();
            entity.Property(x => x.DaysOfWeek).HasMaxLength(40);
            entity.Property(x => x.UpdatedAt).IsRequired();
            entity.HasIndex(x => new { x.MedicationId, x.ReminderTime }).IsUnique();

            entity
                .HasOne(x => x.Medication)
                .WithMany(x => x.Schedules)
                .HasForeignKey(x => x.MedicationId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<DoseEvent>(entity =>
        {
            entity.ToTable("dose-events");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.ActionType).HasMaxLength(20).IsRequired();
            entity.Property(x => x.ActionAt).IsRequired();
            entity.Property(x => x.CreatedAt).IsRequired();

            entity
                .HasOne(x => x.Medication)
                .WithMany(x => x.DoseEvents)
                .HasForeignKey(x => x.MedicationId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<InventoryRecord>(entity =>
        {
            entity.ToTable("inventory-records");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.CurrentStock).IsRequired();
            entity.Property(x => x.Threshold).IsRequired();
            entity.Property(x => x.UpdatedAt).IsRequired();
            entity.HasIndex(x => x.MedicationId).IsUnique();

            entity
                .HasOne(x => x.Medication)
                .WithOne(x => x.Inventory)
                .HasForeignKey<InventoryRecord>(x => x.MedicationId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<PrescriptionReminder>(entity =>
        {
            entity.ToTable("prescription-reminders");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.OffsetsCsv).HasMaxLength(120).IsRequired();
            entity.Property(x => x.UpdatedAt).IsRequired();
            entity.HasIndex(x => x.MedicationId).IsUnique();

            entity
                .HasOne(x => x.Medication)
                .WithMany(x => x.PrescriptionReminders)
                .HasForeignKey(x => x.MedicationId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<SyncEvent>(entity =>
        {
            entity.ToTable("sync-events");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.EventId).HasMaxLength(80).IsRequired();
            entity.Property(x => x.EventType).HasMaxLength(60).IsRequired();
            entity.Property(x => x.PayloadJson).HasMaxLength(4000).IsRequired();
            entity.Property(x => x.ClientUpdatedAt).IsRequired();
            entity.Property(x => x.ReceivedAt).IsRequired();
            entity.HasIndex(x => x.EventId).IsUnique();
        });

        modelBuilder.Entity<HealthEvent>(entity =>
        {
            entity.ToTable("health-events");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.EventType).HasMaxLength(30).IsRequired();
            entity.Property(x => x.Note).HasMaxLength(500);
            entity.Property(x => x.ReminderOffsetsCsv).HasMaxLength(60).IsRequired();
            entity.Property(x => x.EventAt).IsRequired();
            entity.Property(x => x.UpdatedAt).IsRequired();
            entity.HasIndex(x => new { x.MedicationId, x.EventAt });
        });

        modelBuilder.Entity<NotificationDelivery>(entity =>
        {
            entity.ToTable("notification-deliveries");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.UserReference).HasMaxLength(120).IsRequired();
            entity.Property(x => x.Channel).HasMaxLength(30).IsRequired();
            entity.Property(x => x.Status).HasMaxLength(20).IsRequired();
            entity.Property(x => x.ProviderMessageId).HasMaxLength(120);
            entity.Property(x => x.ErrorCode).HasMaxLength(80);
            entity.Property(x => x.ErrorMessage).HasMaxLength(500);
            entity.Property(x => x.CreatedAt).IsRequired();
            entity.HasIndex(x => new { x.UserReference, x.ScheduledAt });
            entity.HasIndex(x => new { x.Status, x.SentAt });
        });

        modelBuilder.Entity<NotificationAction>(entity =>
        {
            entity.ToTable("notification-actions");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.UserReference).HasMaxLength(120).IsRequired();
            entity.Property(x => x.ActionType).HasMaxLength(30).IsRequired();
            entity.Property(x => x.ClientPlatform).HasMaxLength(30).IsRequired();
            entity.Property(x => x.AppVersion).HasMaxLength(40).IsRequired();
            entity.Property(x => x.MetadataJson).HasMaxLength(2000);
            entity.Property(x => x.CreatedAt).IsRequired();
            entity.HasIndex(x => new { x.UserReference, x.ActionAt });

            entity
                .HasOne(x => x.Delivery)
                .WithMany(x => x.Actions)
                .HasForeignKey(x => x.DeliveryId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<SystemErrorReport>(entity =>
        {
            entity.ToTable("system-error-reports");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.UserReference).HasMaxLength(120);
            entity.Property(x => x.AppVersion).HasMaxLength(40).IsRequired();
            entity.Property(x => x.Platform).HasMaxLength(30).IsRequired();
            entity.Property(x => x.Device).HasMaxLength(120);
            entity.Property(x => x.Locale).HasMaxLength(20);
            entity.Property(x => x.ErrorType).HasMaxLength(80).IsRequired();
            entity.Property(x => x.Message).HasMaxLength(1000).IsRequired();
            entity.Property(x => x.StackTrace).HasMaxLength(4000);
            entity.Property(x => x.CorrelationId).HasMaxLength(120);
            entity.Property(x => x.CreatedAt).IsRequired();
            entity.HasIndex(x => new { x.AppVersion, x.Platform, x.OccurredAt });
        });

        modelBuilder.Entity<FeedbackRecord>(entity =>
        {
            entity.ToTable("feedback");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.UserId).HasMaxLength(100);
            entity.Property(x => x.Category).HasMaxLength(50).IsRequired();
            entity.Property(x => x.Message).HasMaxLength(2000).IsRequired();
            entity.Property(x => x.AppVersion).HasMaxLength(20);
            entity.Property(x => x.OsVersion).HasMaxLength(50);
            entity.Property(x => x.DeviceModel).HasMaxLength(100);
            entity.Property(x => x.Status).HasMaxLength(20).IsRequired();
            entity.Property(x => x.CreatedAt).IsRequired();
            entity.HasIndex(x => x.CreatedAt);
            entity.HasIndex(x => x.Status);
        });

        modelBuilder.Entity<EmailVerificationToken>(entity =>
        {
            entity.ToTable("email-verification-tokens");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Email).HasMaxLength(160).IsRequired();
            entity.Property(x => x.CodeHash).HasMaxLength(128).IsRequired();
            entity.Property(x => x.ExpiresAt).IsRequired();
            entity.Property(x => x.AttemptCount).IsRequired();
            entity.Property(x => x.LastSentAt).IsRequired();
            entity.Property(x => x.CreatedAt).IsRequired();
            entity.Property(x => x.UpdatedAt).IsRequired();
            entity.HasIndex(x => new { x.Email, x.CreatedAt });
            entity.HasIndex(x => new { x.Email, x.VerifiedAt });
        });

        modelBuilder.Entity<ConsentRecord>(entity =>
        {
            entity.ToTable("consent-records");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.UserReference).HasMaxLength(120).IsRequired();
            entity.Property(x => x.PrivacyVersion).HasMaxLength(40).IsRequired();
            entity.Property(x => x.AcceptedAt).IsRequired();
            entity.HasIndex(x => new { x.UserReference, x.PrivacyVersion }).IsUnique();
        });

        modelBuilder.Entity<AuditLog>(entity =>
        {
            entity.ToTable("audit-logs");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.EventType).HasMaxLength(80).IsRequired();
            entity.Property(x => x.PayloadMasked).HasMaxLength(2000).IsRequired();
            entity.Property(x => x.CreatedAt).IsRequired();
            entity.HasIndex(x => x.CreatedAt);
        });

        modelBuilder.Entity<CaregiverInvite>(entity =>
        {
            entity.ToTable("caregiver-invites");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.CaregiverReference).HasMaxLength(120).IsRequired();
            entity.Property(x => x.InviteToken).HasMaxLength(120).IsRequired();
            entity.Property(x => x.IsActive).IsRequired();
            entity.Property(x => x.CreatedAt).IsRequired();
            entity.HasIndex(x => x.InviteToken).IsUnique();
        });

        modelBuilder.Entity<CaregiverPermission>(entity =>
        {
            entity.ToTable("caregiver-permissions");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.AllowedModulesCsv).HasMaxLength(240).IsRequired();
            entity.Property(x => x.UpdatedAt).IsRequired();
            entity.HasIndex(x => x.CaregiverInviteId).IsUnique();
        });

        modelBuilder.Entity<EmergencyShareToken>(entity =>
        {
            entity.ToTable("emergency-share-tokens");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Token).HasMaxLength(120).IsRequired();
            entity.Property(x => x.AllowedFieldsCsv).HasMaxLength(240).IsRequired();
            entity.Property(x => x.MedicationIdsCsv).HasMaxLength(1000).IsRequired();
            entity.Property(x => x.CreatedAt).IsRequired();
            entity.Property(x => x.ExpiresAt).IsRequired();
            entity.HasIndex(x => x.Token).IsUnique();
        });
    }
}
