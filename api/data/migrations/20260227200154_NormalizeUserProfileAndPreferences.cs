using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace api.data.migrations
{
    /// <inheritdoc />
    public partial class NormalizeUserProfileAndPreferences : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "UserAccountId",
                table: "user-profiles",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "UserAccountId",
                table: "user-preferences",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.Sql(
                """
                INSERT INTO [user-accounts] ([Id], [FirstName], [LastName], [Email], [PasswordHash], [IsEmailVerified], [EmailVerifiedAt], [CreatedAt], [UpdatedAt], [LastLoginAt])
                SELECT NEWID(),
                       N'Legacy',
                       N'Profile',
                       src.Email,
                       N'legacy-migrated-account',
                       0,
                       NULL,
                       SYSUTCDATETIME(),
                       SYSUTCDATETIME(),
                       NULL
                FROM (
                    SELECT DISTINCT LOWER(COALESCE(NULLIF([UserReference], ''), NULLIF([Email], ''), CONCAT('legacy-profile-', CONVERT(varchar(36), [Id]), '@local.invalid'))) AS Email
                    FROM [user-profiles]
                ) src
                LEFT JOIN [user-accounts] ua ON ua.[Email] = src.Email
                WHERE ua.[Id] IS NULL;
                """);

            migrationBuilder.Sql(
                """
                INSERT INTO [user-accounts] ([Id], [FirstName], [LastName], [Email], [PasswordHash], [IsEmailVerified], [EmailVerifiedAt], [CreatedAt], [UpdatedAt], [LastLoginAt])
                SELECT NEWID(),
                       N'Legacy',
                       N'Preference',
                       src.Email,
                       N'legacy-migrated-account',
                       0,
                       NULL,
                       SYSUTCDATETIME(),
                       SYSUTCDATETIME(),
                       NULL
                FROM (
                    SELECT DISTINCT LOWER(COALESCE(NULLIF([UserReference], ''), CONCAT('legacy-preference-', CONVERT(varchar(36), [Id]), '@local.invalid'))) AS Email
                    FROM [user-preferences]
                ) src
                LEFT JOIN [user-accounts] ua ON ua.[Email] = src.Email
                WHERE ua.[Id] IS NULL;
                """);

            migrationBuilder.Sql(
                """
                UPDATE up
                SET [UserAccountId] = ua.[Id]
                FROM [user-profiles] up
                INNER JOIN [user-accounts] ua
                  ON ua.[Email] = LOWER(COALESCE(NULLIF(up.[UserReference], ''), NULLIF(up.[Email], ''), CONCAT('legacy-profile-', CONVERT(varchar(36), up.[Id]), '@local.invalid')));
                """);

            migrationBuilder.Sql(
                """
                UPDATE pref
                SET [UserAccountId] = ua.[Id]
                FROM [user-preferences] pref
                INNER JOIN [user-accounts] ua
                  ON ua.[Email] = LOWER(COALESCE(NULLIF(pref.[UserReference], ''), CONCAT('legacy-preference-', CONVERT(varchar(36), pref.[Id]), '@local.invalid')));
                """);

            migrationBuilder.DropIndex(
                name: "IX_user-profiles_UserReference",
                table: "user-profiles");

            migrationBuilder.DropIndex(
                name: "IX_user-preferences_UserReference",
                table: "user-preferences");

            migrationBuilder.AlterColumn<Guid>(
                name: "UserAccountId",
                table: "user-profiles",
                type: "uniqueidentifier",
                nullable: false,
                oldClrType: typeof(Guid),
                oldType: "uniqueidentifier",
                oldNullable: true);

            migrationBuilder.AlterColumn<Guid>(
                name: "UserAccountId",
                table: "user-preferences",
                type: "uniqueidentifier",
                nullable: false,
                oldClrType: typeof(Guid),
                oldType: "uniqueidentifier",
                oldNullable: true);

            migrationBuilder.DropColumn(
                name: "Email",
                table: "user-profiles");

            migrationBuilder.DropColumn(
                name: "UserReference",
                table: "user-profiles");

            migrationBuilder.DropColumn(
                name: "UserReference",
                table: "user-preferences");

            migrationBuilder.CreateIndex(
                name: "IX_user-profiles_UserAccountId",
                table: "user-profiles",
                column: "UserAccountId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_user-preferences_UserAccountId",
                table: "user-preferences",
                column: "UserAccountId",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_user-preferences_user-accounts_UserAccountId",
                table: "user-preferences",
                column: "UserAccountId",
                principalTable: "user-accounts",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_user-profiles_user-accounts_UserAccountId",
                table: "user-profiles",
                column: "UserAccountId",
                principalTable: "user-accounts",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_user-preferences_user-accounts_UserAccountId",
                table: "user-preferences");

            migrationBuilder.DropForeignKey(
                name: "FK_user-profiles_user-accounts_UserAccountId",
                table: "user-profiles");

            migrationBuilder.DropIndex(
                name: "IX_user-profiles_UserAccountId",
                table: "user-profiles");

            migrationBuilder.DropIndex(
                name: "IX_user-preferences_UserAccountId",
                table: "user-preferences");

            migrationBuilder.AddColumn<string>(
                name: "Email",
                table: "user-profiles",
                type: "nvarchar(160)",
                maxLength: 160,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "UserReference",
                table: "user-profiles",
                type: "nvarchar(160)",
                maxLength: 160,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "UserReference",
                table: "user-preferences",
                type: "nvarchar(160)",
                maxLength: 160,
                nullable: false,
                defaultValue: "");

            migrationBuilder.Sql(
                """
                UPDATE up
                SET up.[Email] = ua.[Email],
                    up.[UserReference] = ua.[Email]
                FROM [user-profiles] up
                INNER JOIN [user-accounts] ua ON ua.[Id] = up.[UserAccountId];
                """);

            migrationBuilder.Sql(
                """
                UPDATE pref
                SET pref.[UserReference] = ua.[Email]
                FROM [user-preferences] pref
                INNER JOIN [user-accounts] ua ON ua.[Id] = pref.[UserAccountId];
                """);

            migrationBuilder.DropColumn(
                name: "UserAccountId",
                table: "user-profiles");

            migrationBuilder.DropColumn(
                name: "UserAccountId",
                table: "user-preferences");

            migrationBuilder.CreateIndex(
                name: "IX_user-profiles_UserReference",
                table: "user-profiles",
                column: "UserReference",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_user-preferences_UserReference",
                table: "user-preferences",
                column: "UserReference",
                unique: true);
        }
    }
}
