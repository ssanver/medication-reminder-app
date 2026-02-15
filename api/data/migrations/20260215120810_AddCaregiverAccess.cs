using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace api.data.migrations
{
    /// <inheritdoc />
    public partial class AddCaregiverAccess : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "caregiver-invites",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CaregiverReference = table.Column<string>(type: "nvarchar(120)", maxLength: 120, nullable: false),
                    InviteToken = table.Column<string>(type: "nvarchar(120)", maxLength: 120, nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_caregiver-invites", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "caregiver-permissions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CaregiverInviteId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    AllowedModulesCsv = table.Column<string>(type: "nvarchar(240)", maxLength: 240, nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_caregiver-permissions", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_caregiver-invites_InviteToken",
                table: "caregiver-invites",
                column: "InviteToken",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_caregiver-permissions_CaregiverInviteId",
                table: "caregiver-permissions",
                column: "CaregiverInviteId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "caregiver-invites");

            migrationBuilder.DropTable(
                name: "caregiver-permissions");
        }
    }
}
