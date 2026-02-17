using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace api.data.migrations
{
    /// <inheritdoc />
    public partial class AddMedicineCatalog : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "medicine-catalog",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    MedicineName = table.Column<string>(type: "nvarchar(180)", maxLength: 180, nullable: false),
                    Barcode = table.Column<string>(type: "nvarchar(40)", maxLength: 40, nullable: true),
                    Origin = table.Column<string>(type: "nvarchar(80)", maxLength: 80, nullable: true),
                    Unit = table.Column<string>(type: "nvarchar(80)", maxLength: 80, nullable: true),
                    PackingAmount = table.Column<string>(type: "nvarchar(40)", maxLength: 40, nullable: true),
                    ActiveIngredient = table.Column<string>(type: "nvarchar(180)", maxLength: 180, nullable: true),
                    TherapeuticClass = table.Column<string>(type: "nvarchar(180)", maxLength: 180, nullable: true),
                    Manufacturer = table.Column<string>(type: "nvarchar(180)", maxLength: 180, nullable: true),
                    SourcePage = table.Column<int>(type: "int", nullable: true),
                    SourceUrl = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_medicine-catalog", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_medicine-catalog_Barcode",
                table: "medicine-catalog",
                column: "Barcode");

            migrationBuilder.CreateIndex(
                name: "IX_medicine-catalog_MedicineName",
                table: "medicine-catalog",
                column: "MedicineName");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "medicine-catalog");
        }
    }
}
