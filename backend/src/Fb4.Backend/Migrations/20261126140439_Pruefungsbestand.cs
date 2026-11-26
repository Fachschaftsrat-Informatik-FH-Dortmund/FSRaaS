using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Fb4.Backend.Migrations
{
    /// <inheritdoc />
    public partial class Pruefungsbestand : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "PruefungsbestandStand",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false),
                    AbgerufenAm = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    GeaendertAm = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    Von = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    Bis = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    LetzterVersuchAm = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    LetzterVersuchErfolgreich = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PruefungsbestandStand", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Pruefungstermine",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Modulnummer = table.Column<string>(type: "text", nullable: true),
                    Bezeichnung = table.Column<string>(type: "text", nullable: false),
                    Beginn = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    Ende = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    Raeume = table.Column<List<string>>(type: "text[]", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Pruefungstermine", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Pruefungstermine_Beginn",
                table: "Pruefungstermine",
                column: "Beginn");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PruefungsbestandStand");

            migrationBuilder.DropTable(
                name: "Pruefungstermine");
        }
    }
}
