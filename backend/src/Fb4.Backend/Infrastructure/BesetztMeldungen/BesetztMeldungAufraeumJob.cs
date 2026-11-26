using Fb4.Backend.Domain;
using Microsoft.EntityFrameworkCore;

namespace Fb4.Backend.Infrastructure.BesetztMeldungen;

/// <summary>
/// Entfernt alle 15 Minuten Besetzt-Meldungen jenseits ihrer Gültigkeit,
/// zurückgezogene eingeschlossen (Datensparsamkeit; Requirement „Gültigkeitsdauer
/// einer Besetzt-Meldung"). Fehler-Isolation und Health-Check über
/// <see cref="PeriodicJobService"/>.
/// </summary>
public sealed class BesetztMeldungAufraeumJob(
    IServiceScopeFactory scopes,
    TimeProvider zeit,
    JobStatusRegistry registry,
    ILogger<BesetztMeldungAufraeumJob> logger)
    : PeriodicJobService("besetzt-meldungen-aufraeumen", TimeSpan.FromMinutes(15), registry, logger)
{
    protected override async Task RunOnceAsync(CancellationToken cancellationToken)
    {
        using var scope = scopes.CreateScope();
        var db = scope.ServiceProvider.GetService<Fb4DbContext>();
        if (db is null) return;
        await EntferneAbgelaufeneAsync(db, zeit.GetUtcNow(), cancellationToken);
    }

    /// <summary>Löscht jede Meldung, die zu <paramref name="jetzt"/> nicht mehr gilt; liefert die Anzahl.</summary>
    public static async Task<int> EntferneAbgelaufeneAsync(Fb4DbContext db, DateTimeOffset jetzt, CancellationToken ct)
    {
        var grenze = jetzt - BesetztMeldung.Gueltigkeit;
        var abgelaufen = await db.BesetztMeldungen.Where(m => m.GemeldetAm <= grenze).ToListAsync(ct);
        db.BesetztMeldungen.RemoveRange(abgelaufen);
        await db.SaveChangesAsync(ct);
        return abgelaufen.Count;
    }
}
