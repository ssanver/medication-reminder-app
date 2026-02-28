using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace api.data.migrations
{
    /// <inheritdoc />
    public partial class FixAppDefinitionsUnicodeJson : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                UPDATE [app-definitions]
                SET [JsonValue] = N'["💊","🧴","💉","🫙","🩹","🌿","🟡","🔵"]',
                    [UpdatedAt] = SYSUTCDATETIME()
                WHERE [DefinitionKey] = N'medicationIconOptions';

                UPDATE [app-definitions]
                SET [JsonValue] = N'[{"key":"Capsule","emoji":"💊"},{"key":"Pill","emoji":"💊"},{"key":"Drop","emoji":"🫙"},{"key":"Syrup","emoji":"🧴"},{"key":"Injection","emoji":"💉"},{"key":"Other","emoji":"•••"}]',
                    [UpdatedAt] = SYSUTCDATETIME()
                WHERE [DefinitionKey] = N'formOptions';
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                UPDATE [app-definitions]
                SET [JsonValue] = N'["??","??","??","??","??","??","??","??"]',
                    [UpdatedAt] = SYSUTCDATETIME()
                WHERE [DefinitionKey] = N'medicationIconOptions';

                UPDATE [app-definitions]
                SET [JsonValue] = N'[{"key":"Capsule","emoji":"??"},{"key":"Pill","emoji":"??"},{"key":"Drop","emoji":"??"},{"key":"Syrup","emoji":"??"},{"key":"Injection","emoji":"??"},{"key":"Other","emoji":"•••"}]',
                    [UpdatedAt] = SYSUTCDATETIME()
                WHERE [DefinitionKey] = N'formOptions';
                """);
        }
    }
}
