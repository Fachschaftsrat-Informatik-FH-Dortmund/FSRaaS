using Fb4.Backend.Contract.Generated;
using Fb4.Backend.Domain;
using Fb4.Backend.Infrastructure;
using Microsoft.EntityFrameworkCore;

namespace Fb4.Backend.Endpoints;

/// <summary>
/// Kontofreie Schreibpfade der Besetzt-Meldungen (Change <c>besetzt-meldungen</c>):
/// Melden (Requirements „Raum als besetzt melden", „Raumbesetzt-Meldungen ohne
/// Personenbezug", „Idempotente Besetzt-Meldung", „Gültigkeitsdauer einer
/// Besetzt-Meldung") und Zurückziehen (Requirement „Besetzt-Meldung
/// zurückziehen"). Beide hängen an der Ratenbegrenzung kontofreier Schreibpfade.
/// </summary>
public static class BesetztMeldungEndpoints
{
    const string IdempotenzKopf = "Idempotency-Key";

    public static IEndpointRouteBuilder MapBesetztMeldungEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapPost("/raeume/{roomId}/besetzt-meldungen", async (
            string roomId, BesetztMeldungEingabe? eingabe, HttpRequest anfrage,
            Fb4DbContext db, TimeProvider zeit, CancellationToken ct) =>
        {
            if (!Guid.TryParse(anfrage.Headers[IdempotenzKopf].ToString(), out var id) || id == Guid.Empty)
                throw ApiException.BadRequest("idempotenz_schluessel_ungueltig",
                    "Der Kopf Idempotency-Key fehlt oder ist keine UUID.");
            if (eingabe is null || eingabe.GemeldetAm == default)
                throw ApiException.BadRequest("gemeldet_am_fehlt",
                    "Der Auslösezeitpunkt gemeldetAm fehlt.");

            // Ohne Raumplan-Bestand lässt sich die Kennung nicht prüfen: 503 wie
            // bei den Lese-Endpunkten, die Warteschlange der App wiederholt.
            await RaumplanEndpoints.StandAlterAsync(db, ct);
            await RaumplanEndpoints.PruefeRaumBekanntAsync(db, roomId, ct);

            var vorhanden = await db.BesetztMeldungen.AsNoTracking().FirstOrDefaultAsync(m => m.Id == id, ct);
            if (vorhanden is not null) return Bereits(vorhanden, roomId);

            var jetzt = zeit.GetUtcNow();
            // Maßgeblich ist die Auslösung auf dem Gerät; eine vorgehende Geräteuhr
            // kann die Meldung nicht über den Eingang hinaus verlängern.
            var gemeldetAm = eingabe.GemeldetAm > jetzt ? jetzt : eingabe.GemeldetAm;
            var meldung = new BesetztMeldung { Id = id, RoomId = roomId, GemeldetAm = gemeldetAm };

            // Beim Eingang schon abgelaufen (lange in der Offline-Warteschlange):
            // nichts zu zählen, also nichts zu speichern.
            if (meldung.GueltigBis <= jetzt) return Quittung(meldung);

            db.BesetztMeldungen.Add(meldung);
            try
            {
                await db.SaveChangesAsync(ct);
            }
            catch (DbUpdateException)
            {
                // Gleichzeitige Wiederholung mit demselben Schlüssel: Die andere
                // Anfrage hat gespeichert. Sonst ist es ein echter Fehler.
                db.ChangeTracker.Clear();
                var gleichzeitig = await db.BesetztMeldungen.AsNoTracking().FirstOrDefaultAsync(m => m.Id == id, ct);
                if (gleichzeitig is null) throw;
                return Bereits(gleichzeitig, roomId);
            }
            return Quittung(meldung);
        })
            .AllowAnonymous()
            .RequireRateLimiting(Ratenbegrenzung.KontofreiSchreiben)
            .WithTags("raum");

        app.MapDelete("/raeume/{roomId}/besetzt-meldungen/{meldungId:guid}", async (
            string roomId, Guid meldungId, Fb4DbContext db, TimeProvider zeit, CancellationToken ct) =>
        {
            // Immer 204: Der Zielzustand „nicht aktiv" ist erreicht, und die Antwort
            // verrät nicht, ob eine Kennung existiert.
            var meldung = await db.BesetztMeldungen.FirstOrDefaultAsync(m => m.Id == meldungId && m.RoomId == roomId, ct);
            if (meldung is { ZurueckgezogenAm: null })
            {
                meldung.ZurueckgezogenAm = zeit.GetUtcNow();
                await db.SaveChangesAsync(ct);
            }
            return Results.NoContent();
        })
            .AllowAnonymous()
            .RequireRateLimiting(Ratenbegrenzung.KontofreiSchreiben)
            .WithTags("raum");

        return app;
    }

    static IResult Bereits(BesetztMeldung vorhanden, string roomId) =>
        vorhanden.RoomId == roomId
            ? Quittung(vorhanden)
            : throw ApiException.Conflict("idempotenz_konflikt",
                "Dieser Idempotenz-Schlüssel wurde bereits für einen anderen Raum verwendet.");

    static IResult Quittung(BesetztMeldung m) =>
        Results.Accepted(value: new BesetztMeldungQuittung { MeldungId = m.Id, GueltigBis = m.GueltigBis });
}
