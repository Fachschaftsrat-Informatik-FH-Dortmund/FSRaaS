using Fb4.Backend.Contract.Generated;
using Fb4.Backend.Infrastructure;
using Fb4.Backend.Infrastructure.Audit;
using Fb4.Backend.Infrastructure.Auth;
using Microsoft.AspNetCore.Mvc;

namespace Fb4.Backend.Endpoints;

/// <summary>
/// Meldungen (Capability <c>news</c>) und ihre Redaktion (ADMIN-F-040 bis F-060).
/// Der Lesepfad ist kontofrei; die Redaktion erfordert die Rolle FSR-Redaktion
/// (ADMIN-F-010), jede verändernde Handlung wird protokolliert (ADMIN-F-110).
/// </summary>
public static class MeldungenEndpoints
{
    public static IEndpointRouteBuilder MapMeldungenEndpoints(this IEndpointRouteBuilder app)
    {
        // Requirements „Laden und Anzeige aktueller Meldungen", „Nachladen älterer Meldungen".
        app.MapGet("/meldungen", async (
            string? klassifizierung, string? cursor, int? limit,
            MeldungenStore store, CancellationToken ct) =>
            Results.Ok(await store.SeiteAsync(cursor, limit, klassifizierung, ct)))
            .AllowAnonymous()
            .WithTags("news");

        var g = app.MapGroup("/meldungen/entwuerfe")
            .RequireAuthorization(AuthSetup.RedaktionPolicy)
            .WithTags("news");

        g.MapGet("/", async (MeldungenStore store, CancellationToken ct) =>
            Results.Ok(await store.AlleAsync(ct)));

        g.MapGet("/{entwurfId:guid}", async (Guid entwurfId, MeldungenStore store, HttpResponse res, CancellationToken ct) =>
        {
            var m = await store.EinzelnAsync(entwurfId, ct);
            res.Headers.ETag = m.Etag;
            return Results.Ok(m);
        });

        g.MapPost("/", async (
            MeldungsentwurfEingabe eingabe,
            MeldungenStore store, AuditLog audit, Fb4DbContext db, HttpResponse res, CancellationToken ct) =>
        {
            var m = store.Anlegen(eingabe);
            audit.Vormerken("meldung.angelegt", $"meldung:{m.Id}");
            await db.SaveChangesAsync(ct);
            var dto = MeldungenStore.ZuEntwurf(m);
            res.Headers.ETag = dto.Etag;
            return Results.Created($"/v1/meldungen/entwuerfe/{m.Id}", dto);
        });

        g.MapPut("/{entwurfId:guid}", async (
            Guid entwurfId, MeldungsentwurfEingabe eingabe,
            [FromHeader(Name = "If-Match")] string? ifMatch,
            MeldungenStore store, AuditLog audit, Fb4DbContext db, HttpResponse res, CancellationToken ct) =>
        {
            var m = await store.AendernAsync(entwurfId, eingabe, ifMatch, ct);
            audit.Vormerken("meldung.geaendert", $"meldung:{m.Id}");
            await db.SaveChangesAsync(ct);
            var dto = MeldungenStore.ZuEntwurf(m);
            res.Headers.ETag = dto.Etag;
            return Results.Ok(dto);
        });

        g.MapPut("/{entwurfId:guid}/veroeffentlichung", async (
            Guid entwurfId,
            [FromHeader(Name = "If-Match")] string? ifMatch,
            MeldungenStore store, AuditLog audit, Fb4DbContext db, HttpResponse res, CancellationToken ct) =>
        {
            var (m, geaendert) = await store.VeroeffentlichenAsync(entwurfId, ifMatch, ct);
            if (geaendert)
            {
                audit.Vormerken("meldung.veroeffentlicht", $"meldung:{m.Id}");
                await db.SaveChangesAsync(ct);
            }
            var dto = MeldungenStore.ZuEntwurf(m);
            res.Headers.ETag = dto.Etag;
            return Results.Ok(dto);
        });

        g.MapDelete("/{entwurfId:guid}/veroeffentlichung", async (
            Guid entwurfId, MeldungenStore store, AuditLog audit, Fb4DbContext db, CancellationToken ct) =>
        {
            if (await store.ZurueckziehenAsync(entwurfId, ct))
            {
                audit.Vormerken("meldung.zurueckgezogen", $"meldung:{entwurfId}");
                await db.SaveChangesAsync(ct);
            }
            return Results.NoContent();
        });

        return app;
    }
}
