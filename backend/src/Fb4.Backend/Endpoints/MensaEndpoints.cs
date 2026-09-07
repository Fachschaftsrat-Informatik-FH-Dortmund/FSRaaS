using System.Globalization;
using Fb4.Backend.Infrastructure;
using Fb4.Backend.Infrastructure.Mensa;
using Microsoft.AspNetCore.Mvc;

namespace Fb4.Backend.Endpoints;

/// <summary>
/// Kontofreie Auslieferung des Mensa-Speiseplans (MENSA, API-F-070/F-075). Alle
/// Antworten kommen aus dem eigenen Zwischenspeicher; INT-015 wird nie synchron
/// aufgerufen (das erledigt <see cref="SpeiseplanAktualisierungJob"/>).
/// </summary>
public static class MensaEndpoints
{
    public static IEndpointRouteBuilder MapMensaEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/mensen/{mensaId}/speiseplan/{datum}", async (
            string mensaId, string datum,
            [FromHeader(Name = "Accept-Language")] string? sprache,
            SpeiseplanStore store, CancellationToken ct) =>
        {
            if (!DateOnly.TryParse(datum, CultureInfo.InvariantCulture, out var tag))
                throw ApiException.BadRequest("datum_ungueltig", "Das Datum muss im Format JJJJ-MM-TT angegeben sein.");

            if (!await store.MensaBekanntAsync(mensaId, ct))
                throw ApiException.NotFound("mensa_unbekannt", $"Keine Mensa mit der Kennung „{mensaId}“.");

            var (gerichte, stand, naechsteOeffnung) = await store.TagAsync(mensaId, tag, Sprache(sprache), ct);
            return Results.Ok(new { gerichte, standAlter = stand, naechsteOeffnung });
        }).AllowAnonymous().WithTags("mensa");

        app.MapGet("/mensen/verzeichnisse", async (
            [FromHeader(Name = "Accept-Language")] string? sprache,
            SpeiseplanStore store, CancellationToken ct) =>
        {
            var (kategorien, zusatzstoffe, kennzeichnungen) = await store.VerzeichnisseAsync(Sprache(sprache), ct);
            return Results.Ok(new { kategorien, zusatzstoffe, kennzeichnungen });
        }).AllowAnonymous().WithTags("mensa");

        return app;
    }

    /// <summary>Vertrag: Accept-Language mit Enum de/en, Standard de.</summary>
    static string Sprache(string? header) =>
        header?.TrimStart().StartsWith("en", StringComparison.OrdinalIgnoreCase) == true ? "en" : "de";
}
