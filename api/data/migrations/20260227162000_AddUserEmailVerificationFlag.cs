using System;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace api.data.migrations
{
    /// <inheritdoc />
    [DbContext(typeof(AppDbContext))]
    [Migration("20260227162000_AddUserEmailVerificationFlag")]
    public partial class AddUserEmailVerificationFlag : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "EmailVerifiedAt",
                table: "user-accounts",
                type: "datetimeoffset",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsEmailVerified",
                table: "user-accounts",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.Sql(
                """
                UPDATE ua
                SET
                    ua.IsEmailVerified = 1,
                    ua.EmailVerifiedAt = evt.VerifiedAt
                FROM [user-accounts] ua
                INNER JOIN (
                    SELECT
                        Email,
                        MAX(VerifiedAt) AS VerifiedAt
                    FROM [email-verification-tokens]
                    WHERE VerifiedAt IS NOT NULL
                    GROUP BY Email
                ) evt ON ua.Email = evt.Email
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "EmailVerifiedAt",
                table: "user-accounts");

            migrationBuilder.DropColumn(
                name: "IsEmailVerified",
                table: "user-accounts");
        }
    }
}
