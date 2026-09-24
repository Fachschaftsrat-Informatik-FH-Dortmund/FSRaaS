using System.Globalization;
using Fb4.Backend.Infrastructure;
using Fb4.Backend.Infrastructure.Mensa;
using Microsoft.AspNetCore.Mvc;

namespace Fb4.Backend.Endpoints;

/// <summary>
/// Kontofreie Auslieferung des Mensa-Speiseplans und der Öffnungsangaben (MENSA,
/// API-F-070/F-075). Alle Antworten werden je Anfrage aus INT-020 durchgereicht;
/// das Backend hält keinen eigenen Bestand (Capability <c>backend-and-api</c>,
/// Requirement „Mensa-Daten durchreichen statt zwischenspeichern"). Fällt die
/// Quelle aus, endet die Anfrage als Fehler — nie als leere Gerichtsliste.
/// </summary>
public static class MensaEndpoints
{
    public static IEndpointRouteBuilder MapMensaEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/mensen/{mensaId}/speiseplan/{datum}", async (
            string mensaId, string datum,
            [FromHeader(Name = "Accept-Language")] string? sprache,
            MensaQuelle quelle, CancellationToken ct) =>
        {
            if (!DateOnly.TryParse(datum, CultureInfo.InvariantCulture, out var tag))
                throw ApiException.BadRequest("datum_ungueltig", "Das Datum muss im Format JJJJ-MM-TT angegeben sein.");

            if (!await quelle.MensaBekanntAsync(mensaId, ct))
                throw ApiException.NotFound("mensa_unbekannt", $"Keine Mensa mit der Kennung „{mensaId}“.");

            var (gerichte, stand, naechsteOeffnung) = await quelle.TagAsync(mensaId, tag, Sprache(sprache), ct);
            return Results.Ok(new { gerichte, standAlter = stand, naechsteOeffnung });
        }).AllowAnonymous().WithTags("mensa");

        app.MapGet("/mensen/{mensaId}/oeffnungszeiten", async (
            string mensaId, MensaQuelle quelle, CancellationToken ct) =>
        {
            if (!await quelle.MensaBekanntAsync(mensaId, ct))
                throw ApiException.NotFound("mensa_unbekannt", $"Keine Mensa mit der Kennung „{mensaId}“.");

            return Results.Ok(await quelle.OeffnungsangabenAsync(mensaId, ct));
        }).AllowAnonymous().WithTags("mensa");

        app.MapGet("/mensen/verzeichnisse", async (
            [FromHeader(Name = "Accept-Language")] string? sprache,
            MensaQuelle quelle, CancellationToken ct) =>
        {
            var (kategorien, zusatzstoffe, allergene, kennzeichnungen, co2Klassen) =
                await quelle.VerzeichnisseAsync(Sprache(sprache), ct);
            return Results.Ok(new { kategorien, zusatzstoffe, allergene, kennzeichnungen, co2Klassen });
        }).AllowAnonymous().WithTags("mensa");

        return app;
    }

    /// <summary>
    /// Vertrag: Accept-Language mit Enum de/en, Standard de. Wirkt auf die
    /// Gerichtsbezeichnung (INT-020 <c>linesEn</c>) und auf die Klartexte der
    /// Legende (INT-020 <c>labelEn</c>, seit der Erweiterung der Quelle vom
    /// 2026-09-24). Fehlt die englische Fassung, tritt die deutsche ein.
    /// </summary>
    static string Sprache(string? header) =>
        header?.TrimStart().StartsWith("en", StringComparison.OrdinalIgnoreCase) == true ? "en" : "de";
}
