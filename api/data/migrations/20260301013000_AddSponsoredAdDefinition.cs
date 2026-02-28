using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace api.data.migrations;

public partial class AddSponsoredAdDefinition : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql(
            """
            MERGE [app-definitions] AS target
            USING (
                SELECT
                    CAST(N'sponsoredAd' AS nvarchar(120)) AS [DefinitionKey],
                    CAST(N'{"id":"sponsor-001","ctaUrl":"https://example.com/ad/pill-box","localized":{"tr":{"title":"Sponsorlu","body":"Günlük sağlık takibi için akıllı ilaç kutusu kampanyası.","ctaLabel":"Daha fazla"},"en":{"title":"Sponsored","body":"Smart pillbox promotion for daily health tracking.","ctaLabel":"Learn more"}}}' AS nvarchar(max)) AS [JsonValue]
            ) AS source
            ON target.[DefinitionKey] = source.[DefinitionKey]
            WHEN MATCHED THEN
                UPDATE SET target.[JsonValue] = source.[JsonValue], target.[UpdatedAt] = SYSUTCDATETIME()
            WHEN NOT MATCHED THEN
                INSERT ([Id], [DefinitionKey], [JsonValue], [UpdatedAt])
                VALUES (NEWID(), source.[DefinitionKey], source.[JsonValue], SYSUTCDATETIME());
            """);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql(
            """
            DELETE FROM [app-definitions] WHERE [DefinitionKey] = N'sponsoredAd';
            """);
    }
}
