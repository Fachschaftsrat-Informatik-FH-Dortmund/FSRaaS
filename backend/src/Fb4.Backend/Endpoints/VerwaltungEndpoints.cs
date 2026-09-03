using Fb4.Backend.Contract.Generated;
using Fb4.Backend.Infrastructure;
using Fb4.Backend.Infrastructure.Audit;
using Fb4.Backend.Infrastructure.Auth;
using Microsoft.AspNetCore.Mvc;

namespace Fb4.Backend.Endpoints;

/// <summary>
/// Verändernde Verwaltungsfunktionen. Alle erfordern die Rolle FSR-Redaktion
/// (ADMIN-F-010, serverseitige Ablehnung), jede verändernde Handlung wird
/// protokolliert (ADMIN-F-110).
/// </summary>
public static class VerwaltungEndpoints
{
    public static IEndpointRouteBuilder MapVerwaltungEndpoints(this IEndpointRouteBuilder app)
    {
        var g = app.MapGroup("/verwaltung")
            .RequireAuthorization(AuthSetup.RedaktionPolicy)
            .WithTags("verwaltung");

        // ---------------------------------------------------------- Stammdaten
        g.MapGet("/stammdaten", async (StammdatenStore store, HttpResponse res, CancellationToken ct) =>
        {
            var (daten, etag) = await store.LadenAsync(ct);
            res.Headers.ETag = etag;
            return Results.Ok(daten);
        });

        g.MapPut("/stammdaten", async (
            Stammdaten eingabe,
            [FromHeader(Name = "If-Match")] string? ifMatch,
            StammdatenStore store, AuditLog audit, Fb4DbContext db, HttpResponse res, CancellationToken ct) =>
        {
            var (daten, etag) = await store.ErsetzenAsync(eingabe, ifMatch, ct);
            audit.Vormerken("stammdaten.ersetzt", "stammdaten");
            await db.SaveChangesAsync(ct);
            res.Headers.ETag = etag;
            return Results.Ok(daten);
        });

        // ------------------------------------------------------------ Laufwege
        g.MapGet("/laufwege", async (StammdatenStore store, HttpResponse res, CancellationToken ct) =>
        {
            var (wege, etag) = await store.LaufwegeAsync(ct);
            res.Headers.ETag = etag;
            return Results.Ok(wege);
        });

        g.MapPut("/laufwege", async (
            List<Laufweg> eingabe,
            [FromHeader(Name = "If-Match")] string? ifMatch,
            StammdatenStore store, AuditLog audit, Fb4DbContext db, HttpResponse res, CancellationToken ct) =>
        {
            var (wege, unbekannt, etag) = await store.LaufwegeErsetzenAsync(eingabe, ifMatch, ct);
            audit.Vormerken("laufwege.ersetzt", "laufwege");
            await db.SaveChangesAsync(ct);
            res.Headers.ETag = etag;
            return Results.Ok(new { laufwege = wege, unbekannteRaeume = unbekannt });
        });

        // -------------------------------------------------------------- Rollen
        g.MapGet("/rollen", async (IAuthentikDirectory dir, CancellationToken ct) =>
            Results.Ok(await dir.ListeRollenzuweisungenAsync(ct)));

        g.MapPut("/rollen", async (
            Rollenzuweisung eingabe,
            IAuthentikDirectory dir, AuditLog audit, Fb4DbContext db, CancellationToken ct) =>
        {
            // Die App darf einen Benutzernamen senden; die Aussperr-Regel und das
            // Protokoll brauchen die stabile Konto-Id (ADMIN-F-070/F-080/F-110).
            var kontoId = await dir.KontoIdAufloesenAsync(eingabe.KontoId, ct);
            var bestand = await dir.ListeRollenzuweisungenAsync(ct);
            if (RollenRegeln.WuerdeLetzteRedaktionsRolleEntziehen(bestand, kontoId, eingabe.Rollen))
                throw ApiException.Conflict(
                    "letzte_redaktion",
                    "Die letzte verbleibende Zuweisung der Rolle FSR-Redaktion kann nicht entzogen werden.");

            await dir.SetzeRollenAsync(kontoId, eingabe.Rollen, ct);
            audit.Vormerken("rollen.gesetzt", $"konto:{kontoId}");
            await db.SaveChangesAsync(ct);
            return Results.Ok(eingabe with { KontoId = kontoId });
        });

        return app;
    }
}
