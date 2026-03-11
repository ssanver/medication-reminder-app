using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace api.data.migrations
{
    /// <inheritdoc />
    public partial class EnsureSnoozeOptionsDefinition : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                MERGE [app-definitions] AS target
                USING (SELECT N'snoozeOptions' AS [DefinitionKey]) AS source
                ON target.[DefinitionKey] = source.[DefinitionKey]
                WHEN MATCHED THEN
                    UPDATE SET
                        [JsonValue] = N'[5,10,15,30,60]',
                        [UpdatedAt] = SYSUTCDATETIME()
                WHEN NOT MATCHED THEN
                    INSERT ([Id], [DefinitionKey], [JsonValue], [UpdatedAt])
                    VALUES (NEWID(), N'snoozeOptions', N'[5,10,15,30,60]', SYSUTCDATETIME());
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                DELETE FROM [app-definitions]
                WHERE [DefinitionKey] = N'snoozeOptions';
                """);
        }
    }
}
