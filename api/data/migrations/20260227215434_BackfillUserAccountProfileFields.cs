using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace api.data.migrations
{
    /// <inheritdoc />
    public partial class BackfillUserAccountProfileFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                UPDATE [user-accounts]
                SET [FullName] = LTRIM(RTRIM(COALESCE([FirstName], '') + ' ' + COALESCE([LastName], '')))
                WHERE LTRIM(RTRIM(COALESCE([FullName], ''))) = '';
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {

        }
    }
}
