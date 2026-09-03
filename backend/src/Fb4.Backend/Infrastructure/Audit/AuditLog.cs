using System.Security.Claims;
using Fb4.Backend.Domain;
using Microsoft.EntityFrameworkCore;

namespace Fb4.Backend.Infrastructure.Audit;

/// <summary>
/// Schreibt je verändernder Verwaltungshandlung einen Protokolleintrag
/// (ADMIN-F-110): Zeitpunkt, handelndes Konto, betroffener Datensatz — kein
/// Inhalt (SEC-N-120). Der Eintrag wird gemeinsam mit der Handlung im selben
/// <see cref="Fb4DbContext.SaveChangesAsync(CancellationToken)"/> festgeschrieben.
/// </summary>
public sealed class AuditLog(Fb4DbContext db, IHttpContextAccessor httpContext)
{
    public void Vormerken(string handlung, string datensatzReferenz)
    {
        var nutzer = httpContext.HttpContext?.User;
        db.Verwaltungsprotokolle.Add(new Verwaltungsprotokoll
        {
            ZeitpunktUtc = DateTimeOffset.UtcNow,
            KontoId = nutzer?.FindFirstValue("sub")
                      ?? nutzer?.Identity?.Name
                      ?? "unbekannt",
            KontoAnzeigename = nutzer?.FindFirstValue("preferred_username")
                               ?? nutzer?.Identity?.Name,
            Handlung = handlung,
            DatensatzReferenz = datensatzReferenz,
        });
    }
}

/// <summary>
/// Entfernt Protokolleinträge, die älter als die Aufbewahrungsfrist sind
/// (ADMIN-N-020: mindestens zwölf Monate). Reine Funktion, UI- und
/// zeitgeberfrei testbar; der Hintergrund-Job ruft sie täglich auf.
/// </summary>
public static class VerwaltungsprotokollAufbewahrung
{
    /// <summary>
    /// ADMIN-N-020: mindestens zwölf Monate. 366 Tage, damit auch über ein
    /// Schaltjahr hinweg kein Eintrag vor Ablauf von zwölf Monaten entfernt wird.
    /// </summary>
    public static readonly TimeSpan Frist = TimeSpan.FromDays(366);

    public static async Task<int> EntferneAelterAlsAsync(Fb4DbContext db, DateTimeOffset jetzt, CancellationToken ct = default)
    {
        var grenze = jetzt - Frist;
        var veraltet = await db.Verwaltungsprotokolle.Where(p => p.ZeitpunktUtc < grenze).ToListAsync(ct);
        if (veraltet.Count == 0) return 0;
        db.Verwaltungsprotokolle.RemoveRange(veraltet);
        await db.SaveChangesAsync(ct);
        return veraltet.Count;
    }
}
