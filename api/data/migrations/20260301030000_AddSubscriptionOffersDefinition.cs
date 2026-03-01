using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace api.data.migrations
{
    public partial class AddSubscriptionOffersDefinition : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                MERGE [app-definitions] AS target
                USING (
                    SELECT N'subscriptionOffers' AS [DefinitionKey], N'[
                      {"id":"monthly","localized":{"tr":{"title":"Aylık","priceLabel":"₺99,99 / ay"},"en":{"title":"Monthly","priceLabel":"₺99.99 / month"}}},
                      {"id":"yearly","localized":{"tr":{"title":"Yıllık","priceLabel":"₺799,99 / yıl"},"en":{"title":"Yearly","priceLabel":"₺799.99 / year"}}},
                      {"id":"lifetime","localized":{"tr":{"title":"Ömür boyu","priceLabel":"₺2499,99 tek sefer"},"en":{"title":"Lifetime","priceLabel":"₺2499.99 one-time"}}}
                    ]' AS [JsonValue]
                ) AS source
                ON target.[DefinitionKey] = source.[DefinitionKey]
                WHEN MATCHED THEN
                    UPDATE SET [JsonValue] = source.[JsonValue], [UpdatedAt] = SYSUTCDATETIME()
                WHEN NOT MATCHED THEN
                    INSERT ([Id], [DefinitionKey], [JsonValue], [UpdatedAt])
                    VALUES (NEWID(), source.[DefinitionKey], source.[JsonValue], SYSUTCDATETIME());
                """);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("DELETE FROM [app-definitions] WHERE [DefinitionKey] = N'subscriptionOffers';");
        }
    }
}
