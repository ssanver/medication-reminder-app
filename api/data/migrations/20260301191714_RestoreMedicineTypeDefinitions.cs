using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace api.data.migrations
{
    /// <inheritdoc />
    public partial class RestoreMedicineTypeDefinitions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                MERGE [app-definitions] AS target
                USING (SELECT N'medicationIconOptions' AS [DefinitionKey]) AS source
                ON target.[DefinitionKey] = source.[DefinitionKey]
                WHEN MATCHED THEN
                    UPDATE SET
                        [JsonValue] = N'["💊","🧴","💉","🫙","🩹","🌿","🟡","🔵"]',
                        [UpdatedAt] = SYSUTCDATETIME()
                WHEN NOT MATCHED THEN
                    INSERT ([Id], [DefinitionKey], [JsonValue], [UpdatedAt])
                    VALUES (NEWID(), N'medicationIconOptions', N'["💊","🧴","💉","🫙","🩹","🌿","🟡","🔵"]', SYSUTCDATETIME());

                MERGE [app-definitions] AS target
                USING (SELECT N'formOptions' AS [DefinitionKey]) AS source
                ON target.[DefinitionKey] = source.[DefinitionKey]
                WHEN MATCHED THEN
                    UPDATE SET
                        [JsonValue] = N'[{"key":"Capsule","emoji":"💊"},{"key":"Pill","emoji":"💊"},{"key":"Drop","emoji":"🫙"},{"key":"Syrup","emoji":"🧴"},{"key":"Injection","emoji":"💉"},{"key":"Other","emoji":"🧩"}]',
                        [UpdatedAt] = SYSUTCDATETIME()
                WHEN NOT MATCHED THEN
                    INSERT ([Id], [DefinitionKey], [JsonValue], [UpdatedAt])
                    VALUES (NEWID(), N'formOptions', N'[{"key":"Capsule","emoji":"💊"},{"key":"Pill","emoji":"💊"},{"key":"Drop","emoji":"🫙"},{"key":"Syrup","emoji":"🧴"},{"key":"Injection","emoji":"💉"},{"key":"Other","emoji":"🧩"}]', SYSUTCDATETIME());
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                DELETE FROM [app-definitions]
                WHERE [DefinitionKey] IN (N'medicationIconOptions', N'formOptions');
                """);
        }
    }
}
