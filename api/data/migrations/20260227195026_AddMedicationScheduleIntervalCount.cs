using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace api.data.migrations
{
    /// <inheritdoc />
    public partial class AddMedicationScheduleIntervalCount : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                IF COL_LENGTH('medication-schedules', 'IntervalCount') IS NULL
                BEGIN
                    ALTER TABLE [medication-schedules] ADD [IntervalCount] int NOT NULL DEFAULT 1;
                END
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                IF COL_LENGTH('medication-schedules', 'IntervalCount') IS NOT NULL
                BEGIN
                    ALTER TABLE [medication-schedules] DROP COLUMN [IntervalCount];
                END
                """);
        }
    }
}
