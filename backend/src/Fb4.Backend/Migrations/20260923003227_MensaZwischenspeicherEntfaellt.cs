using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Fb4.Backend.Migrations
{
    /// <summary>
    /// Baut den Mensa-Speiseplan-Zwischenspeicher ab (Capability
    /// <c>backend-and-api</c>, REMOVED „Mensa-Speiseplaene aus Zwischenspeicher
    /// ausliefern"). Die Daten kommen seither je Anfrage aus INT-020.
    ///
    /// Kein Datenverlust: alle drei Tabellen waren ein reiner Lesecache von
    /// INT-015 und trugen keine selbst erhobenen Daten. <c>Down</c> legt sie
    /// wieder an — leer, wie sie ein Abruflauf ohnehin neu gefuellt haette.
    /// </summary>
    public partial class MensaZwischenspeicherEntfaellt : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "MensaStand");

            migrationBuilder.DropTable(
                name: "MensaVerzeichnis");

            migrationBuilder.DropTable(
                name: "Speiseplaene");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "MensaStand",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    QuelleErreichbar = table.Column<bool>(type: "boolean", nullable: false),
                    VerzeichnisseAbgerufenAm = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MensaStand", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "MensaVerzeichnis",
                columns: table => new
                {
                    Art = table.Column<string>(type: "text", nullable: false),
                    QuelleId = table.Column<string>(type: "text", nullable: false),
                    BezeichnungDe = table.Column<string>(type: "text", nullable: false),
                    BezeichnungEn = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MensaVerzeichnis", x => new { x.Art, x.QuelleId });
                });

            migrationBuilder.CreateTable(
                name: "Speiseplaene",
                columns: table => new
                {
                    MensaId = table.Column<string>(type: "text", nullable: false),
                    Datum = table.Column<DateOnly>(type: "date", nullable: false),
                    AbgerufenAm = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    AnzahlGerichte = table.Column<int>(type: "integer", nullable: false),
                    GerichteJson = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Speiseplaene", x => new { x.MensaId, x.Datum });
                });
        }
    }
}
