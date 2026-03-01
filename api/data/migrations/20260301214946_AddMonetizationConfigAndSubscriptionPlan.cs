using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace api.data.migrations
{
    /// <inheritdoc />
    public partial class AddMonetizationConfigAndSubscriptionPlan : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "SubscriptionPlanId",
                table: "user-accounts",
                type: "nvarchar(80)",
                maxLength: 80,
                nullable: true);

            migrationBuilder.Sql(
                """
                MERGE [app-definitions] AS target
                USING (
                    SELECT N'donationCampaign' AS [DefinitionKey], N'{"id":"donation-default","ctaUrl":"https://buymeacoffee.com/pillmind","localized":{"tr":{"title":"Pill Mind''e destek ol","body":"Reklamları düşük seviyede tutup uygulamayı geliştirmeye devam etmemize katkı sağlayın.","ctaLabel":"Bağış yap"},"en":{"title":"Support Pill Mind","body":"Help us keep ads minimal and continue improving the app.","ctaLabel":"Donate now"}}}' AS [JsonValue]
                ) AS source
                ON target.[DefinitionKey] = source.[DefinitionKey]
                WHEN MATCHED THEN
                    UPDATE SET [JsonValue] = source.[JsonValue], [UpdatedAt] = SYSUTCDATETIME()
                WHEN NOT MATCHED THEN
                    INSERT ([Id], [DefinitionKey], [JsonValue], [UpdatedAt])
                    VALUES (NEWID(), source.[DefinitionKey], source.[JsonValue], SYSUTCDATETIME());
                """);

            migrationBuilder.Sql(
                """
                MERGE [app-definitions] AS target
                USING (
                    SELECT N'sponsoredAd' AS [DefinitionKey], N'{"id":"sponsor-001","ctaUrl":"https://example.com/ad/pill-box","placements":["today","my-meds"],"localized":{"tr":{"title":"Sponsorlu","body":"Günlük sağlık takibi için akıllı ilaç kutusu kampanyası.","ctaLabel":"Daha fazla"},"en":{"title":"Sponsored","body":"Smart pillbox promotion for daily health tracking.","ctaLabel":"Learn more"}}}' AS [JsonValue]
                ) AS source
                ON target.[DefinitionKey] = source.[DefinitionKey]
                WHEN MATCHED THEN
                    UPDATE SET [JsonValue] = source.[JsonValue], [UpdatedAt] = SYSUTCDATETIME()
                WHEN NOT MATCHED THEN
                    INSERT ([Id], [DefinitionKey], [JsonValue], [UpdatedAt])
                    VALUES (NEWID(), source.[DefinitionKey], source.[JsonValue], SYSUTCDATETIME());
                """);

            migrationBuilder.Sql(
                """
                MERGE [app-definitions] AS target
                USING (
                    SELECT N'subscriptionOffers' AS [DefinitionKey], N'[
                      {"id":"monthly","localized":{"tr":{"title":"Aylık Premium","priceLabel":"₺99,99 / ay","description":"Reklamsız deneyim ve öncelikli destek.","badge":"En esnek plan","ctaLabel":"Aylığa geç"},"en":{"title":"Monthly Premium","priceLabel":"₺99.99 / month","description":"Ad-free usage and priority support.","badge":"Most flexible plan","ctaLabel":"Go monthly"}}},
                      {"id":"yearly","localized":{"tr":{"title":"Yıllık Premium","priceLabel":"₺799,99 / yıl","description":"Aylık plana göre daha avantajlı fiyat.","badge":"En çok tercih edilen","ctaLabel":"Yıllığa geç"},"en":{"title":"Yearly Premium","priceLabel":"₺799.99 / year","description":"Best value compared to monthly.","badge":"Most popular","ctaLabel":"Go yearly"}}},
                      {"id":"lifetime","localized":{"tr":{"title":"Ömür boyu Premium","priceLabel":"₺2499,99 tek sefer","description":"Tek ödeme ile kalıcı reklamsız kullanım.","badge":"Tek sefer ödeme","ctaLabel":"Ömür boyu al"},"en":{"title":"Lifetime Premium","priceLabel":"₺2499.99 one-time","description":"One-time payment for permanent ad-free use.","badge":"One-time payment","ctaLabel":"Get lifetime"}}}
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

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("DELETE FROM [app-definitions] WHERE [DefinitionKey] = N'donationCampaign';");

            migrationBuilder.DropColumn(
                name: "SubscriptionPlanId",
                table: "user-accounts");
        }
    }
}
