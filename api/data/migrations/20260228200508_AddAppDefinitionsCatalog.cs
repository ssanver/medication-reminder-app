using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace api.data.migrations
{
    /// <inheritdoc />
    public partial class AddAppDefinitionsCatalog : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "app-definitions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    DefinitionKey = table.Column<string>(type: "nvarchar(120)", maxLength: 120, nullable: false),
                    JsonValue = table.Column<string>(type: "nvarchar(max)", maxLength: 8000, nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_app-definitions", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_app-definitions_DefinitionKey",
                table: "app-definitions",
                column: "DefinitionKey",
                unique: true);

            migrationBuilder.Sql(
                """
                INSERT INTO [app-definitions] ([Id], [DefinitionKey], [JsonValue], [UpdatedAt])
                VALUES
                  (NEWID(), N'defaultDoseTimes', N'["08:00","12:00","16:00","20:00","22:00","23:00"]', SYSUTCDATETIME()),
                  (NEWID(), N'dayIntervalOptions', N'[1,2,3,5,7,14,21]', SYSUTCDATETIME()),
                  (NEWID(), N'weekIntervalOptions', N'[1,2]', SYSUTCDATETIME()),
                  (NEWID(), N'hourIntervalOptions', N'[1,2,3,4,6,8,12]', SYSUTCDATETIME()),
                  (NEWID(), N'cycleOnDayOptions', N'[7,14,21,28]', SYSUTCDATETIME()),
                  (NEWID(), N'cycleOffDayOptions', N'[3,5,7,14]', SYSUTCDATETIME()),
                  (NEWID(), N'dosesPerDayOptions', N'[1,2,3,4,5,6]', SYSUTCDATETIME()),
                  (NEWID(), N'weekdayOptions', N'[1,2,3,4,5,6,0]', SYSUTCDATETIME()),
                  (NEWID(), N'hourOptions', N'["00","01","02","03","04","05","06","07","08","09","10","11","12","13","14","15","16","17","18","19","20","21","22","23"]', SYSUTCDATETIME()),
                  (NEWID(), N'minuteOptions', N'["00","01","02","03","04","05","06","07","08","09","10","11","12","13","14","15","16","17","18","19","20","21","22","23","24","25","26","27","28","29","30","31","32","33","34","35","36","37","38","39","40","41","42","43","44","45","46","47","48","49","50","51","52","53","54","55","56","57","58","59"]', SYSUTCDATETIME()),
                  (NEWID(), N'medicationIconOptions', N'["💊","🧴","💉","🫙","🩹","🌿","🟡","🔵"]', SYSUTCDATETIME()),
                  (NEWID(), N'formOptions', N'[{"key":"Capsule","emoji":"💊"},{"key":"Pill","emoji":"💊"},{"key":"Drop","emoji":"🫙"},{"key":"Syrup","emoji":"🧴"},{"key":"Injection","emoji":"💉"},{"key":"Other","emoji":"•••"}]', SYSUTCDATETIME()),
                  (NEWID(), N'snoozeOptions', N'[5,10,15,30,60]', SYSUTCDATETIME());
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "app-definitions");
        }
    }
}
