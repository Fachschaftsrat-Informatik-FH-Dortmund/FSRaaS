using System.Collections.Generic;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Fb4.Backend.Migrations
{
    /// <inheritdoc />
    public partial class MensaOeffnungszeitenEntfallen : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Oeffnungszeiten",
                table: "Mensen");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<List<string>>(
                name: "Oeffnungszeiten",
                table: "Mensen",
                type: "text[]",
                nullable: false);
        }
    }
}
