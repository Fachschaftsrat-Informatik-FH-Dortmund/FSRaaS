using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Fb4.Backend.Migrations
{
    /// <inheritdoc />
    public partial class StammdatenUndVerwaltung : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Laufwege",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    VonRoomId = table.Column<string>(type: "text", nullable: false),
                    NachRoomId = table.Column<string>(type: "text", nullable: false),
                    Gewicht = table.Column<decimal>(type: "numeric", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Laufwege", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Links",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Bezeichnung = table.Column<string>(type: "text", nullable: false),
                    Url = table.Column<string>(type: "text", nullable: false),
                    Gruppe = table.Column<string>(type: "text", nullable: true),
                    Reihenfolge = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Links", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Mensen",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    QuelleId = table.Column<string>(type: "text", nullable: true),
                    StandardAuswahl = table.Column<bool>(type: "boolean", nullable: false),
                    Reihenfolge = table.Column<int>(type: "integer", nullable: false),
                    SpeiseplanUrl = table.Column<string>(type: "text", nullable: true),
                    Oeffnungszeiten = table.Column<List<string>>(type: "text[]", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Mensen", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Raeume",
                columns: table => new
                {
                    RoomId = table.Column<string>(type: "text", nullable: false),
                    Groesse = table.Column<string>(type: "text", nullable: false),
                    EkeyZugaenglich = table.Column<bool>(type: "boolean", nullable: false),
                    Schliesszeit = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Raeume", x => x.RoomId);
                });

            migrationBuilder.CreateTable(
                name: "Revisionen",
                columns: table => new
                {
                    Bereich = table.Column<string>(type: "text", nullable: false),
                    Version = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Revisionen", x => x.Bereich);
                });

            migrationBuilder.CreateTable(
                name: "SemesterKalender",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    SemesterBeginn = table.Column<DateOnly>(type: "date", nullable: true),
                    SemesterEnde = table.Column<DateOnly>(type: "date", nullable: true),
                    NaechsterWinterSemesterBeginn = table.Column<DateOnly>(type: "date", nullable: true),
                    NaechsterSommerSemesterBeginn = table.Column<DateOnly>(type: "date", nullable: true),
                    TicketLinks = table.Column<int>(type: "integer", nullable: false),
                    TicketOben = table.Column<int>(type: "integer", nullable: false),
                    TicketRechts = table.Column<int>(type: "integer", nullable: false),
                    TicketUnten = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SemesterKalender", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "StudiengangRueckfall",
                columns: table => new
                {
                    Kurzname = table.Column<string>(type: "text", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Fachsemester = table.Column<List<int>>(type: "integer[]", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StudiengangRueckfall", x => x.Kurzname);
                });

            migrationBuilder.CreateTable(
                name: "Verwaltungsprotokolle",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ZeitpunktUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    KontoId = table.Column<string>(type: "text", nullable: false),
                    KontoAnzeigename = table.Column<string>(type: "text", nullable: true),
                    Handlung = table.Column<string>(type: "text", nullable: false),
                    DatensatzReferenz = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Verwaltungsprotokolle", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Verwaltungsprotokolle_ZeitpunktUtc",
                table: "Verwaltungsprotokolle",
                column: "ZeitpunktUtc");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Laufwege");

            migrationBuilder.DropTable(
                name: "Links");

            migrationBuilder.DropTable(
                name: "Mensen");

            migrationBuilder.DropTable(
                name: "Raeume");

            migrationBuilder.DropTable(
                name: "Revisionen");

            migrationBuilder.DropTable(
                name: "SemesterKalender");

            migrationBuilder.DropTable(
                name: "StudiengangRueckfall");

            migrationBuilder.DropTable(
                name: "Verwaltungsprotokolle");
        }
    }
}
