using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace api.data.migrations
{
    /// <inheritdoc />
    public partial class AddSecurityCompliance : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "audit-logs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    EventType = table.Column<string>(type: "nvarchar(80)", maxLength: 80, nullable: false),
                    PayloadMasked = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_audit-logs", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "consent-records",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserReference = table.Column<string>(type: "nvarchar(120)", maxLength: 120, nullable: false),
                    PrivacyVersion = table.Column<string>(type: "nvarchar(40)", maxLength: 40, nullable: false),
                    AcceptedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_consent-records", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_audit-logs_CreatedAt",
                table: "audit-logs",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_consent-records_UserReference_PrivacyVersion",
                table: "consent-records",
                columns: new[] { "UserReference", "PrivacyVersion" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "audit-logs");

            migrationBuilder.DropTable(
                name: "consent-records");
        }
    }
}
