IF OBJECT_ID(N'[__EFMigrationsHistory]') IS NULL
BEGIN
    CREATE TABLE [__EFMigrationsHistory] (
        [MigrationId] nvarchar(150) NOT NULL,
        [ProductVersion] nvarchar(32) NOT NULL,
        CONSTRAINT [PK___EFMigrationsHistory] PRIMARY KEY ([MigrationId])
    );
END;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260215113531_InitialCreate'
)
BEGIN
    CREATE TABLE [medications] (
        [Id] uniqueidentifier NOT NULL,
        [Name] nvarchar(120) NOT NULL,
        [Dosage] nvarchar(60) NOT NULL,
        [UsageType] nvarchar(60) NULL,
        [IsBeforeMeal] bit NOT NULL,
        [StartDate] date NOT NULL,
        [EndDate] date NULL,
        [IsActive] bit NOT NULL,
        [UpdatedAt] datetimeoffset NOT NULL,
        CONSTRAINT [PK_medications] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260215113531_InitialCreate'
)
BEGIN
    CREATE TABLE [medication-schedules] (
        [Id] uniqueidentifier NOT NULL,
        [MedicationId] uniqueidentifier NOT NULL,
        [RepeatType] nvarchar(20) NOT NULL,
        [ReminderTime] time NOT NULL,
        [DaysOfWeek] nvarchar(40) NULL,
        [UpdatedAt] datetimeoffset NOT NULL,
        CONSTRAINT [PK_medication-schedules] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_medication-schedules_medications_MedicationId] FOREIGN KEY ([MedicationId]) REFERENCES [medications] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260215113531_InitialCreate'
)
BEGIN
    CREATE UNIQUE INDEX [IX_medication-schedules_MedicationId_ReminderTime] ON [medication-schedules] ([MedicationId], [ReminderTime]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260215113531_InitialCreate'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260215113531_InitialCreate', N'8.0.12');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260215114450_AddDoseEvents'
)
BEGIN
    CREATE TABLE [dose-events] (
        [Id] uniqueidentifier NOT NULL,
        [MedicationId] uniqueidentifier NOT NULL,
        [ActionType] nvarchar(20) NOT NULL,
        [ActionAt] datetimeoffset NOT NULL,
        [SnoozeMinutes] int NULL,
        [CreatedAt] datetimeoffset NOT NULL,
        CONSTRAINT [PK_dose-events] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_dose-events_medications_MedicationId] FOREIGN KEY ([MedicationId]) REFERENCES [medications] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260215114450_AddDoseEvents'
)
BEGIN
    CREATE INDEX [IX_dose-events_MedicationId] ON [dose-events] ([MedicationId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260215114450_AddDoseEvents'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260215114450_AddDoseEvents', N'8.0.12');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260215115406_AddInventoryRecords'
)
BEGIN
    CREATE TABLE [inventory-records] (
        [Id] uniqueidentifier NOT NULL,
        [MedicationId] uniqueidentifier NOT NULL,
        [CurrentStock] int NOT NULL,
        [Threshold] int NOT NULL,
        [LastAlertAt] datetimeoffset NULL,
        [UpdatedAt] datetimeoffset NOT NULL,
        CONSTRAINT [PK_inventory-records] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_inventory-records_medications_MedicationId] FOREIGN KEY ([MedicationId]) REFERENCES [medications] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260215115406_AddInventoryRecords'
)
BEGIN
    CREATE UNIQUE INDEX [IX_inventory-records_MedicationId] ON [inventory-records] ([MedicationId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260215115406_AddInventoryRecords'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260215115406_AddInventoryRecords', N'8.0.12');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260215115620_AddPrescriptionReminders'
)
BEGIN
    CREATE TABLE [prescription-reminders] (
        [Id] uniqueidentifier NOT NULL,
        [MedicationId] uniqueidentifier NOT NULL,
        [RenewalDate] date NOT NULL,
        [OffsetsCsv] nvarchar(120) NOT NULL,
        [UpdatedAt] datetimeoffset NOT NULL,
        CONSTRAINT [PK_prescription-reminders] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_prescription-reminders_medications_MedicationId] FOREIGN KEY ([MedicationId]) REFERENCES [medications] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260215115620_AddPrescriptionReminders'
)
BEGIN
    CREATE UNIQUE INDEX [IX_prescription-reminders_MedicationId] ON [prescription-reminders] ([MedicationId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260215115620_AddPrescriptionReminders'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260215115620_AddPrescriptionReminders', N'8.0.12');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260215115823_AddSyncEvents'
)
BEGIN
    CREATE TABLE [sync-events] (
        [Id] uniqueidentifier NOT NULL,
        [EventId] nvarchar(80) NOT NULL,
        [EventType] nvarchar(60) NOT NULL,
        [PayloadJson] nvarchar(4000) NOT NULL,
        [ClientUpdatedAt] datetimeoffset NOT NULL,
        [ReceivedAt] datetimeoffset NOT NULL,
        CONSTRAINT [PK_sync-events] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260215115823_AddSyncEvents'
)
BEGIN
    CREATE UNIQUE INDEX [IX_sync-events_EventId] ON [sync-events] ([EventId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260215115823_AddSyncEvents'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260215115823_AddSyncEvents', N'8.0.12');
END;
GO

COMMIT;
GO

