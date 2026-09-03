using Fb4.Backend.Infrastructure;
using Microsoft.EntityFrameworkCore;

namespace Fb4.Backend.Endpoints;

/// <summary>
/// Kontofreie Auslieferung der ferngepflegten Stammdaten an die App (API-F-230).
/// Die App hält das Ergebnis lokal vor und fällt bei Nichterreichbarkeit auf den
/// im Anwendungspaket mitgelieferten Ausgangsbestand zurück (API-F-235).
/// </summary>
public static class PublicEndpoints
{
    public static IEndpointRouteBuilder MapStammdatenEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/stammdaten", async (StammdatenStore store, CancellationToken ct) =>
        {
            var (daten, _) = await store.LadenAsync(ct);
            return Results.Ok(daten);
        }).AllowAnonymous().WithTags("stammdaten");

        app.MapGet("/mensen", async (Fb4DbContext db, CancellationToken ct) =>
        {
            var mensen = await db.Mensen.AsNoTracking().OrderBy(m => m.Reihenfolge).ToListAsync(ct);
            return Results.Ok(mensen.Select(m => m.ToDto()).ToList());
        }).AllowAnonymous().WithTags("mensa");

        app.MapGet("/raeume", async (Fb4DbContext db, CancellationToken ct) =>
        {
            var raeume = await db.Raeume.AsNoTracking().OrderBy(r => r.RoomId).ToListAsync(ct);
            return Results.Ok(raeume.Select(r => r.ToDto()).ToList());
        }).AllowAnonymous().WithTags("raum");

        // API-F-240: Rückfallliste der Studiengänge; im Regelfall spricht die App
        // INT-001 unmittelbar an (ARCH-F-020).
        app.MapGet("/stundenplan/studiengaenge", async (Fb4DbContext db, CancellationToken ct) =>
        {
            var liste = await db.StudiengangRueckfall.AsNoTracking().OrderBy(s => s.Kurzname).ToListAsync(ct);
            return Results.Ok(liste.Select(s => s.ToDto()).ToList());
        }).AllowAnonymous().WithTags("stundenplan");

        return app;
    }
}
