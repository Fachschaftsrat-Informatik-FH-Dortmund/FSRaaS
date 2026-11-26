using System.Globalization;
using Fb4.Backend.Contract.Generated;
using Fb4.Backend.Domain;
using Fb4.Backend.Infrastructure;
using Fb4.Backend.Infrastructure.Raumplan;
using Microsoft.EntityFrameworkCore;

namespace Fb4.Backend.Endpoints;

/// <summary>
/// Kontofreie Lese-Endpunkte auf dem Raumplan-Zwischenspeicher (INT-009):
/// Raumübersicht (Requirement „Übersicht aller Räume im Raumplan-Zwischenspeicher"),
/// Tagesbelegung eines Raums (Requirement „Tagesbelegung eines Raums aus dem
/// Raumplan-Zwischenspeicher") und Raumplan-Termine (Requirement „Raumplan-Termine
/// für lokalen Stundenplan-Abgleich"). Alle lesen ausschließlich den eigenen Bestand.
/// </summary>
public static class RaumplanEndpoints
{
    static readonly string[] Werktage = ["Mon", "Tue", "Wed", "Thu", "Fri"];
    static readonly TimeZoneInfo Ortszeit = TimeZoneInfo.FindSystemTimeZoneById("Europe/Berlin");

    public static IEndpointRouteBuilder MapRaumplanEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/raeume/uebersicht", async (
            string? zeitpunkt, Fb4DbContext db, TimeProvider zeit, CancellationToken ct) =>
        {
            var t = zeit.GetUtcNow();
            if (!string.IsNullOrWhiteSpace(zeitpunkt) &&
                !DateTimeOffset.TryParse(zeitpunkt, CultureInfo.InvariantCulture, DateTimeStyles.AssumeUniversal, out t))
                throw ApiException.BadRequest("zeitpunkt_ungueltig", "Der Zeitpunkt muss als ISO-8601-Zeitangabe angegeben sein.");

            var standAlter = await StandAlterAsync(db, ct);

            var termine = await db.RaumplanTermine.AsNoTracking()
                .Where(x => x.RoomId != RaumAufloesung.Pseudoraum && x.Ende > t)
                .ToListAsync(ct);
            var raeume = (await db.RaumplanRaeume.AsNoTracking().Select(r => r.RoomId).ToListAsync(ct))
                .Concat(await db.RaumplanTermine.AsNoTracking()
                    .Where(x => x.RoomId != RaumAufloesung.Pseudoraum)
                    .Select(x => x.RoomId).Distinct().ToListAsync(ct))
                .Distinct(StringComparer.Ordinal)
                .OrderBy(r => r, StringComparer.Ordinal);
            var kuratiert = await db.Raeume.AsNoTracking().ToDictionaryAsync(r => r.RoomId, ct);
            var jeRaum = termine.ToLookup(x => x.RoomId, StringComparer.Ordinal);

            var status = raeume.Select(roomId =>
            {
                var eigene = jeRaum[roomId];
                var laufend = eigene.Where(x => x.Beginn <= t && x.Ende > t)
                    .OrderByDescending(x => x.Ende).FirstOrDefault();
                var naechster = laufend is null
                    ? eigene.Where(x => x.Beginn > t).OrderBy(x => x.Beginn).FirstOrDefault()
                    : null;
                kuratiert.TryGetValue(roomId, out var k);
                return new RaumStatus
                {
                    RoomId = roomId,
                    Zustand = laufend is null ? "frei" : "belegt",
                    Groesse = k?.Groesse,
                    EkeyZugaenglich = k?.EkeyZugaenglich,
                    AktuellerTermin = laufend is null ? null : Raumtermin(laufend),
                    NaechsterTermin = naechster is null ? null : Raumtermin(naechster),
                    BesetztMeldungen = 0,
                };
            }).ToList();

            return Results.Ok(new { raeume = status, standAlter });
        }).AllowAnonymous().WithTags("raum");

        app.MapGet("/raeume/{roomId}/belegung", async (
            string roomId, string? datum, Fb4DbContext db, TimeProvider zeit, CancellationToken ct) =>
        {
            DateOnly tag;
            if (string.IsNullOrWhiteSpace(datum))
                tag = DateOnly.FromDateTime(TimeZoneInfo.ConvertTime(zeit.GetUtcNow(), Ortszeit).DateTime);
            else if (!DateOnly.TryParseExact(datum, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out tag))
                throw ApiException.BadRequest("datum_ungueltig", "Das Datum muss im Format JJJJ-MM-TT angegeben sein.");

            var standAlter = await StandAlterAsync(db, ct);

            var bekannt = roomId != RaumAufloesung.Pseudoraum && (
                await db.RaumplanRaeume.AsNoTracking().AnyAsync(r => r.RoomId == roomId, ct)
                || await db.RaumplanTermine.AsNoTracking().AnyAsync(x => x.RoomId == roomId, ct)
                || await db.Raeume.AsNoTracking().AnyAsync(r => r.RoomId == roomId, ct));
            if (!bekannt)
                throw ApiException.NotFound("raum_unbekannt",
                    "Dieser Raum ist weder im Raumplan noch in der gepflegten Raumliste bekannt.");

            var (von, bis) = Ortstag(tag);
            var termine = (await db.RaumplanTermine.AsNoTracking()
                    .Where(x => x.RoomId == roomId && x.Beginn < bis && x.Ende > von)
                    .ToListAsync(ct))
                .OrderBy(x => x.Beginn).ThenBy(x => x.Ende)
                .Select(Raumtermin)
                .ToList();

            return Results.Ok(new { termine, standAlter });
        }).AllowAnonymous().WithTags("raum");

        app.MapGet("/raumplan/termine", async (
            string? studiengang, Fb4DbContext db, CancellationToken ct) =>
        {
            var standAlter = await StandAlterAsync(db, ct);

            var abfrage = db.RaumplanTermine.AsNoTracking()
                .Where(x => x.RoomId != RaumAufloesung.Pseudoraum && Werktage.Contains(x.Weekday));
            if (!string.IsNullOrWhiteSpace(studiengang))
                abfrage = abfrage.Where(x => x.CourseOfStudy == studiengang);

            var termine = (await abfrage.ToListAsync(ct))
                .Select(x => new RaumplanTermin
                {
                    RoomId = x.RoomId,
                    Wochentag = x.Weekday,
                    Beginn = x.TimeBegin,
                    Ende = x.TimeEnd,
                    Bezeichnung = x.Name,
                    StudentSet = x.StudentSet,
                    LecturerId = x.LecturerId,
                    Note = x.Note,
                })
                .Distinct()
                .OrderBy(x => x.RoomId, StringComparer.Ordinal)
                .ThenBy(x => Array.IndexOf(Werktage, x.Wochentag))
                .ThenBy(x => x.Beginn, StringComparer.Ordinal)
                .ToList();

            return Results.Ok(new { termine, standAlter });
        }).AllowAnonymous().WithTags("raum");

        return app;
    }

    /// <summary>
    /// Alter des Bestands. Vor dem ersten erfolgreichen Abruf gibt es keinen Bestand —
    /// dann 503 statt einer leeren Liste, die sich von „kein Raum bekannt" nicht
    /// unterscheiden ließe (SEC-F-060).
    /// </summary>
    static async Task<StandAlter> StandAlterAsync(Fb4DbContext db, CancellationToken ct)
    {
        var stand = await db.RaumplanStand.AsNoTracking()
            .FirstOrDefaultAsync(s => s.Id == RaumplanStand.EinzigeId, ct);
        if (stand?.AbgerufenAm is not { } abgerufenAm)
            throw new ApiException(503, "raumplan_nicht_verfuegbar",
                "Der Raumplan wurde noch nicht abgerufen; bitte später erneut versuchen.");

        return new StandAlter
        {
            AbgerufenAm = abgerufenAm,
            QuelleErreichbar = stand.LetzterVersuchErfolgreich,
            QuelleStand = null,
        };
    }

    /// <summary>Beginn und Ende eines Kalendertags in Ortszeit Europe/Berlin, als UTC-Zeitpunkte.</summary>
    static (DateTimeOffset Von, DateTimeOffset Bis) Ortstag(DateOnly tag)
    {
        DateTimeOffset Mitternacht(DateOnly d)
        {
            var lokal = d.ToDateTime(TimeOnly.MinValue, DateTimeKind.Unspecified);
            return new DateTimeOffset(lokal, Ortszeit.GetUtcOffset(lokal));
        }
        return (Mitternacht(tag), Mitternacht(tag.AddDays(1)));
    }

    static Raumtermin Raumtermin(RaumplanTerminEintrag x) => new()
    {
        RoomId = x.RoomId,
        Beginn = x.Beginn,
        Ende = x.Ende,
        Bezeichnung = x.Name,
        Art = x.Name.StartsWith("Prüfung", StringComparison.Ordinal) ? "pruefung"
            : x.EventType == "Course" ? "lehrveranstaltung"
            : "sonstiges",
        Note = x.Note,
    };
}
