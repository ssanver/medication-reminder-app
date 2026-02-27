using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace api.data.migrations
{
    /// <inheritdoc />
    public partial class MergeUserProfileIntoUserAccount : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "BirthDate",
                table: "user-accounts",
                type: "nvarchar(10)",
                maxLength: 10,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "FullName",
                table: "user-accounts",
                type: "nvarchar(120)",
                maxLength: 120,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Gender",
                table: "user-accounts",
                type: "nvarchar(40)",
                maxLength: 40,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "PhotoUri",
                table: "user-accounts",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: false,
                defaultValue: "");

            migrationBuilder.Sql(
                """
                UPDATE ua
                SET
                    ua.[FullName] = CASE WHEN LTRIM(RTRIM(COALESCE(up.[FullName], ''))) = '' THEN ua.[FirstName] + ' ' + ua.[LastName] ELSE up.[FullName] END,
                    ua.[BirthDate] = COALESCE(up.[BirthDate], ''),
                    ua.[Gender] = COALESCE(up.[Gender], ''),
                    ua.[PhotoUri] = COALESCE(up.[PhotoUri], '')
                FROM [user-accounts] ua
                LEFT JOIN [user-profiles] up ON up.[UserAccountId] = ua.[Id];
                """);

            migrationBuilder.Sql(
                """
                UPDATE [user-accounts]
                SET [FullName] = LTRIM(RTRIM(COALESCE([FirstName], '') + ' ' + COALESCE([LastName], '')))
                WHERE LTRIM(RTRIM(COALESCE([FullName], ''))) = '';
                """);

            migrationBuilder.DropTable(
                name: "user-profiles");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "user-profiles",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserAccountId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    BirthDate = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    FullName = table.Column<string>(type: "nvarchar(120)", maxLength: 120, nullable: false),
                    Gender = table.Column<string>(type: "nvarchar(40)", maxLength: 40, nullable: false),
                    PhotoUri = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_user-profiles", x => x.Id);
                    table.ForeignKey(
                        name: "FK_user-profiles_user-accounts_UserAccountId",
                        column: x => x.UserAccountId,
                        principalTable: "user-accounts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_user-profiles_UserAccountId",
                table: "user-profiles",
                column: "UserAccountId",
                unique: true);

            migrationBuilder.Sql(
                """
                INSERT INTO [user-profiles] ([Id], [UserAccountId], [FullName], [BirthDate], [Gender], [PhotoUri], [CreatedAt], [UpdatedAt])
                SELECT NEWID(), ua.[Id], COALESCE(NULLIF(ua.[FullName], ''), LTRIM(RTRIM(COALESCE(ua.[FirstName], '') + ' ' + COALESCE(ua.[LastName], ''))), 'User'),
                       COALESCE(ua.[BirthDate], ''), COALESCE(ua.[Gender], ''), COALESCE(ua.[PhotoUri], ''), ua.[CreatedAt], ua.[UpdatedAt]
                FROM [user-accounts] ua;
                """);

            migrationBuilder.DropColumn(
                name: "BirthDate",
                table: "user-accounts");

            migrationBuilder.DropColumn(
                name: "FullName",
                table: "user-accounts");

            migrationBuilder.DropColumn(
                name: "Gender",
                table: "user-accounts");

            migrationBuilder.DropColumn(
                name: "PhotoUri",
                table: "user-accounts");
        }
    }
}
