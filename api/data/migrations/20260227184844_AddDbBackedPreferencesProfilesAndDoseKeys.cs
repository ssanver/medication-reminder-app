using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace api.data.migrations
{
    /// <inheritdoc />
    public partial class AddDbBackedPreferencesProfilesAndDoseKeys : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_dose-events_MedicationId",
                table: "dose-events");

            migrationBuilder.AddColumn<decimal>(
                name: "FontScale",
                table: "user-preferences",
                type: "decimal(4,2)",
                precision: 4,
                scale: 2,
                nullable: false,
                defaultValue: 1.0m);

            migrationBuilder.AddColumn<string>(
                name: "Locale",
                table: "user-preferences",
                type: "nvarchar(8)",
                maxLength: 8,
                nullable: false,
                defaultValue: "tr");

            migrationBuilder.AddColumn<bool>(
                name: "MedicationRemindersEnabled",
                table: "user-preferences",
                type: "bit",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<bool>(
                name: "NotificationsEnabled",
                table: "user-preferences",
                type: "bit",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<int>(
                name: "SnoozeMinutes",
                table: "user-preferences",
                type: "int",
                nullable: false,
                defaultValue: 10);

            migrationBuilder.AddColumn<string>(
                name: "DateKey",
                table: "dose-events",
                type: "nvarchar(10)",
                maxLength: 10,
                nullable: false,
                defaultValue: "2000-01-01");

            migrationBuilder.AddColumn<string>(
                name: "ScheduledTime",
                table: "dose-events",
                type: "nvarchar(5)",
                maxLength: 5,
                nullable: false,
                defaultValue: "00:00");

            migrationBuilder.Sql(
                """
                UPDATE [dose-events]
                SET [DateKey] = CONVERT(varchar(10), CAST([ActionAt] AS date), 23),
                    [ScheduledTime] = LEFT(CONVERT(varchar(8), CAST([ActionAt] AS time), 108), 5)
                WHERE [DateKey] = '2000-01-01' OR [ScheduledTime] = '00:00';
                """);

            migrationBuilder.CreateTable(
                name: "user-profiles",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserReference = table.Column<string>(type: "nvarchar(160)", maxLength: 160, nullable: false),
                    FullName = table.Column<string>(type: "nvarchar(120)", maxLength: 120, nullable: false),
                    Email = table.Column<string>(type: "nvarchar(160)", maxLength: 160, nullable: false),
                    BirthDate = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: false),
                    Gender = table.Column<string>(type: "nvarchar(40)", maxLength: 40, nullable: false),
                    PhotoUri = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_user-profiles", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_dose-events_MedicationId_DateKey_ScheduledTime",
                table: "dose-events",
                columns: new[] { "MedicationId", "DateKey", "ScheduledTime" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_user-profiles_UserReference",
                table: "user-profiles",
                column: "UserReference",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "user-profiles");

            migrationBuilder.DropIndex(
                name: "IX_dose-events_MedicationId_DateKey_ScheduledTime",
                table: "dose-events");

            migrationBuilder.DropColumn(
                name: "FontScale",
                table: "user-preferences");

            migrationBuilder.DropColumn(
                name: "Locale",
                table: "user-preferences");

            migrationBuilder.DropColumn(
                name: "MedicationRemindersEnabled",
                table: "user-preferences");

            migrationBuilder.DropColumn(
                name: "NotificationsEnabled",
                table: "user-preferences");

            migrationBuilder.DropColumn(
                name: "SnoozeMinutes",
                table: "user-preferences");

            migrationBuilder.DropColumn(
                name: "DateKey",
                table: "dose-events");

            migrationBuilder.DropColumn(
                name: "ScheduledTime",
                table: "dose-events");

            migrationBuilder.CreateIndex(
                name: "IX_dose-events_MedicationId",
                table: "dose-events",
                column: "MedicationId");
        }
    }
}
