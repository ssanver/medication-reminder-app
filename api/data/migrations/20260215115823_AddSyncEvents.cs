using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace api.data.migrations
{
    /// <inheritdoc />
    public partial class AddSyncEvents : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "sync-events",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    EventId = table.Column<string>(type: "nvarchar(80)", maxLength: 80, nullable: false),
                    EventType = table.Column<string>(type: "nvarchar(60)", maxLength: 60, nullable: false),
                    PayloadJson = table.Column<string>(type: "nvarchar(4000)", maxLength: 4000, nullable: false),
                    ClientUpdatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    ReceivedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_sync-events", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_sync-events_EventId",
                table: "sync-events",
                column: "EventId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "sync-events");
        }
    }
}
