using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace api.data.migrations
{
    /// <inheritdoc />
    public partial class AddNotificationActions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "notification-actions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    DeliveryId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserReference = table.Column<string>(type: "nvarchar(120)", maxLength: 120, nullable: false),
                    ActionType = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    ActionAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    ClientPlatform = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    AppVersion = table.Column<string>(type: "nvarchar(40)", maxLength: 40, nullable: false),
                    MetadataJson = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_notification-actions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_notification-actions_notification-deliveries_DeliveryId",
                        column: x => x.DeliveryId,
                        principalTable: "notification-deliveries",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_notification-actions_DeliveryId",
                table: "notification-actions",
                column: "DeliveryId");

            migrationBuilder.CreateIndex(
                name: "IX_notification-actions_UserReference_ActionAt",
                table: "notification-actions",
                columns: new[] { "UserReference", "ActionAt" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "notification-actions");
        }
    }
}
