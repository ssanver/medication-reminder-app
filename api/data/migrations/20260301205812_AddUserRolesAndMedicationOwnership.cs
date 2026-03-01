using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace api.data.migrations
{
    /// <inheritdoc />
    public partial class AddUserRolesAndMedicationOwnership : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Role",
                table: "user-accounts",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "member");

            migrationBuilder.AddColumn<string>(
                name: "UserReference",
                table: "medications",
                type: "nvarchar(160)",
                maxLength: 160,
                nullable: false,
                defaultValue: "guest@pillmind.local");

            migrationBuilder.Sql("""
                UPDATE [user-accounts]
                SET [Role] = 'visitor'
                WHERE [Email] LIKE 'guest-%@pillmind.local';
                """);

            migrationBuilder.CreateIndex(
                name: "IX_medications_UserReference_UpdatedAt",
                table: "medications",
                columns: new[] { "UserReference", "UpdatedAt" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_medications_UserReference_UpdatedAt",
                table: "medications");

            migrationBuilder.DropColumn(
                name: "Role",
                table: "user-accounts");

            migrationBuilder.DropColumn(
                name: "UserReference",
                table: "medications");
        }
    }
}
