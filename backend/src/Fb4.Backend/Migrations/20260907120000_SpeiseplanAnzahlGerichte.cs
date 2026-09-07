using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Fb4.Backend.Migrations
{
    /// <inheritdoc />
    public partial class SpeiseplanAnzahlGerichte : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "AnzahlGerichte",
                table: "Speiseplaene",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            // Rückwirkende Befüllung bestehender Zeilen aus der Länge des in GerichteJson
            // gespeicherten JSON-Arrays (design.md Migration Plan Schritt 1). Ab dem
            // nächsten Lauf von SpeiseplanAktualisierungJob wird die Spalte ohnehin neu
            // gesetzt, da der Job alle Zeilen einer Mensa vor dem Neuschreiben löscht.
            migrationBuilder.Sql(
                """UPDATE "Speiseplaene" SET "AnzahlGerichte" = json_array_length("GerichteJson"::json);""");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AnzahlGerichte",
                table: "Speiseplaene");
        }
    }
}
