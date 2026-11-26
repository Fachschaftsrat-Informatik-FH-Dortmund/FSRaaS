using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Fb4.Backend.Migrations
{
    /// <inheritdoc />
    public partial class NewsRedaktion : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Meldungen",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Titel = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Text = table.Column<string>(type: "character varying(20000)", maxLength: 20000, nullable: false),
                    Zustand = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Klassifizierung = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Quelle = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    VeroeffentlichtAm = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    AngelegtAm = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    GeaendertAm = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    Version = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Meldungen", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Meldungen_Zustand_VeroeffentlichtAm",
                table: "Meldungen",
                columns: new[] { "Zustand", "VeroeffentlichtAm" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Meldungen");
        }
    }
}
