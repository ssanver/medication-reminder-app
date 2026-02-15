using Microsoft.EntityFrameworkCore;
using api.models;

namespace api.data;

public sealed class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Medication> Medications => Set<Medication>();
    public DbSet<MedicationSchedule> MedicationSchedules => Set<MedicationSchedule>();
    public DbSet<DoseEvent> DoseEvents => Set<DoseEvent>();
    public DbSet<InventoryRecord> InventoryRecords => Set<InventoryRecord>();
    public DbSet<PrescriptionReminder> PrescriptionReminders => Set<PrescriptionReminder>();
    public DbSet<SyncEvent> SyncEvents => Set<SyncEvent>();
    public DbSet<HealthEvent> HealthEvents => Set<HealthEvent>();

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
    }
}
