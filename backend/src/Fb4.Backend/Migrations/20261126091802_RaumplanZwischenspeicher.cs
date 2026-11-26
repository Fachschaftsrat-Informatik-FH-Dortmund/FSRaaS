using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Fb4.Backend.Migrations
{
    /// <inheritdoc />
    public partial class RaumplanZwischenspeicher : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "RaumplanRaeume",
                columns: table => new
                {
                    RoomId = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RaumplanRaeume", x => x.RoomId);
                });

            migrationBuilder.CreateTable(
                name: "RaumplanStand",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false),
                    AbgerufenAm = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    Von = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    Bis = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    LetzterVersuchAm = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    LetzterVersuchErfolgreich = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RaumplanStand", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "RaumplanTermine",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    RoomId = table.Column<string>(type: "text", nullable: false),
                    RoomIdQuelle = table.Column<string>(type: "text", nullable: false),
                    QuellId = table.Column<string>(type: "text", nullable: true),
                    Name = table.Column<string>(type: "text", nullable: false),
                    EventType = table.Column<string>(type: "text", nullable: false),
                    Beginn = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    Ende = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    Weekday = table.Column<string>(type: "text", nullable: false),
                    TimeBegin = table.Column<string>(type: "text", nullable: false),
                    TimeEnd = table.Column<string>(type: "text", nullable: false),
                    StudentSet = table.Column<string>(type: "text", nullable: true),
                    CourseOfStudy = table.Column<string>(type: "text", nullable: true),
                    LecturerId = table.Column<string>(type: "text", nullable: true),
                    Note = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RaumplanTermine", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_RaumplanTermine_RoomId_Beginn",
                table: "RaumplanTermine",
                columns: new[] { "RoomId", "Beginn" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "RaumplanRaeume");

            migrationBuilder.DropTable(
                name: "RaumplanStand");

            migrationBuilder.DropTable(
                name: "RaumplanTermine");
        }
    }
}
