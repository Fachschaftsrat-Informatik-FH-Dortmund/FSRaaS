using Fb4.Backend.Contract.Generated;
using Fb4.Backend.Domain;
using Fb4.Backend.Infrastructure;
using Fb4.Backend.Infrastructure.Raumplan;
using Microsoft.EntityFrameworkCore;

namespace Fb4.Backend.Endpoints;

/// <summary>
/// Kontofreie Lese-Endpunkte auf dem aus dem Raumplan abgeleiteten
/// Prüfungsbestand: Requirements „Abruf des Prüfungsbestands" und „Abfrage-Endpunkt
/// für den Prüfungsplan-Änderungszeitpunkt" (Capability <c>backend-and-api</c>).
/// Keiner kennt die Auswahl einer Nutzerin (API-F-100).
/// </summary>
public static class PruefungsplanEndpoints
{
    public static IEndpointRouteBuilder MapPruefungsplanEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/stundenplan/pruefungsplan", async (Fb4DbContext db, CancellationToken ct) =>
        {
            var stand = await db.PruefungsbestandStand.AsNoTracking()
                .FirstOrDefaultAsync(s => s.Id == PruefungsbestandStand.EinzigeId, ct);
            // Vor dem ersten erfolgreichen Abruf kein Bestand: 503 statt einer leeren
            // Liste, die sich von „derzeit keine Prüfung" nicht unterscheiden ließe (SEC-F-060).
            if (stand?.AbgerufenAm is not { } abgerufenAm)
                throw new ApiException(503, "pruefungsbestand_nicht_verfuegbar",
                    "Der Prüfungsbestand wurde noch nicht abgeleitet; bitte später erneut versuchen.");

            var pruefungen = (await db.Pruefungstermine.AsNoTracking().ToListAsync(ct))
                .OrderBy(x => x.Beginn)
                .ThenBy(x => x.Name, StringComparer.Ordinal)
                .Select(x => new Pruefungstermin
                {
                    Modulnummer = x.Modulnummer,
                    Bezeichnung = x.Bezeichnung,
                    Raeume = x.Raeume,
                    Beginn = x.Beginn,
                    Ende = x.Ende,
                })
                .ToList();

            return Results.Ok(new
            {
                pruefungen,
                // Unvollständigkeit hängt an jeder Antwort, auch an einer leeren
                // (Entscheidung 2026-09-10: hinnehmen und ausweisen).
                vollstaendigkeit = new Pruefungsbestandsvollstaendigkeit
                {
                    Quelle = "raumplan",
                    Vollstaendig = false,
                    AbdeckungAnteil = PruefungsbestandAbruf.AbdeckungAnteil,
                    AbdeckungGemessenAm = PruefungsbestandAbruf.AbdeckungGemessenAm,
                },
                standAlter = new StandAlter
                {
                    AbgerufenAm = abgerufenAm,
                    QuelleErreichbar = stand.LetzterVersuchErfolgreich,
                    QuelleStand = null,
                },
            });
        }).AllowAnonymous().WithTags("stundenplan");

        app.MapGet("/stundenplan/pruefungsplan/stand", async (Fb4DbContext db, CancellationToken ct) =>
        {
            var geaendertAm = await db.PruefungsbestandStand.AsNoTracking()
                .Where(s => s.Id == PruefungsbestandStand.EinzigeId)
                .Select(s => s.GeaendertAm)
                .FirstOrDefaultAsync(ct);
            return Results.Ok(new { geaendertAm });
        }).AllowAnonymous().WithTags("stundenplan");

        return app;
    }
}
