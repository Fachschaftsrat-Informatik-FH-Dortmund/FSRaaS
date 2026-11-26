using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Fb4.Backend.Migrations
{
    /// <inheritdoc />
    public partial class BesetztMeldungen : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "BesetztMeldungen",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    RoomId = table.Column<string>(type: "text", nullable: false),
                    GemeldetAm = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    ZurueckgezogenAm = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BesetztMeldungen", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_BesetztMeldungen_RoomId_GemeldetAm",
                table: "BesetztMeldungen",
                columns: new[] { "RoomId", "GemeldetAm" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "BesetztMeldungen");
        }
    }
}
