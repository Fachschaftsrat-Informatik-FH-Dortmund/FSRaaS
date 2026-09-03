namespace Fb4.Backend.Infrastructure.Audit;

/// <summary>
/// Täglicher Job: entfernt Protokolleinträge jenseits der Aufbewahrungsfrist
/// (ADMIN-N-020 — mindestens zwölf Monate). Kapselung und Fehler-Isolation über
/// <see cref="PeriodicJobService"/> (API-N-110); Ergebnis im Health-Check
/// (API-F-260).
/// </summary>
public sealed class VerwaltungsprotokollAufraeumJob(
    IServiceScopeFactory scopes,
    JobStatusRegistry registry,
    ILogger<VerwaltungsprotokollAufraeumJob> logger)
    : PeriodicJobService("verwaltungsprotokoll-aufraeumen", TimeSpan.FromHours(24), registry, logger)
{
    protected override async Task RunOnceAsync(CancellationToken cancellationToken)
    {
        using var scope = scopes.CreateScope();
        var db = scope.ServiceProvider.GetService<Fb4DbContext>();
        if (db is null) return;
        await VerwaltungsprotokollAufbewahrung.EntferneAelterAlsAsync(db, DateTimeOffset.UtcNow, cancellationToken);
    }
}
