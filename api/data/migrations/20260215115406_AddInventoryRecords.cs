using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace api.data.migrations
{
    /// <inheritdoc />
    public partial class AddInventoryRecords : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "inventory-records",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    MedicationId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CurrentStock = table.Column<int>(type: "int", nullable: false),
                    Threshold = table.Column<int>(type: "int", nullable: false),
                    LastAlertAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_inventory-records", x => x.Id);
                    table.ForeignKey(
                        name: "FK_inventory-records_medications_MedicationId",
                        column: x => x.MedicationId,
                        principalTable: "medications",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_inventory-records_MedicationId",
                table: "inventory-records",
                column: "MedicationId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "inventory-records");
        }
    }
}
