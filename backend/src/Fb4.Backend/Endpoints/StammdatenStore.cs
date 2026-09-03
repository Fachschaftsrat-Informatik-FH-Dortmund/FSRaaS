using Fb4.Backend.Contract.Generated;
using Fb4.Backend.Domain;
using Fb4.Backend.Infrastructure;
using Microsoft.EntityFrameworkCore;

namespace Fb4.Backend.Endpoints;

/// <summary>
/// Liest und ersetzt die als Ganzes gepflegten Sammlungen (Stammdaten, Laufwege)
/// und führt deren Stand-Kennung für die optimistische Nebenläufigkeitskontrolle
/// (ADMIN-F-200). Die schreibenden Methoden merken die Änderung nur im
/// Change-Tracker vor — festgeschrieben wird sie vom Endpunkt gemeinsam mit dem
/// Protokolleintrag (ADMIN-F-110).
/// </summary>
public sealed class StammdatenStore(Fb4DbContext db)
{
    public async Task<(Stammdaten daten, string etag)> LadenAsync(CancellationToken ct)
    {
        var mensen = await db.Mensen.AsNoTracking().OrderBy(m => m.Reihenfolge).ToListAsync(ct);
        var raeume = await db.Raeume.AsNoTracking().OrderBy(r => r.RoomId).ToListAsync(ct);
        var links = await db.Links.AsNoTracking().OrderBy(l => l.Reihenfolge).ToListAsync(ct);
        var kalender = await db.SemesterKalender.AsNoTracking().FirstOrDefaultAsync(ct) ?? new SemesterKalender();

        var daten = Zusammensetzen(mensen, raeume, links, kalender);
        return (daten, await ETagAsync(SammlungsRevision.Stammdaten, ct));
    }

    public async Task<(Stammdaten daten, string etag)> ErsetzenAsync(Stammdaten neu, string? ifMatch, CancellationToken ct)
    {
        PruefeEingabe(neu);
        var revision = await StandPruefenAsync(SammlungsRevision.Stammdaten, ifMatch, ct);

        db.Mensen.RemoveRange(await db.Mensen.ToListAsync(ct));
        db.Raeume.RemoveRange(await db.Raeume.ToListAsync(ct));
        db.Links.RemoveRange(await db.Links.ToListAsync(ct));

        var mensen = neu.Mensen.Select(m => m.ToEntity()).ToList();
        var raeume = neu.Raeume.Select(r => r.ToEntity()).ToList();
        var links = neu.Links.Select(l => l.ToEntity()).ToList();
        db.Mensen.AddRange(mensen);
        db.Raeume.AddRange(raeume);
        db.Links.AddRange(links);

        var kalender = await db.SemesterKalender.FirstOrDefaultAsync(ct);
        if (kalender is null) { kalender = new SemesterKalender { Id = 1 }; db.SemesterKalender.Add(kalender); }
        kalender.Uebernehmen(neu.Semestertermine, neu.TicketBildausschnitt);

        revision.Version = Guid.NewGuid();
        return (Zusammensetzen(mensen, raeume, links, kalender), ETag.Von(revision.Version));
    }

    /// <summary>
    /// ADMIN Abschnitt 9 / API-N-040: strukturell fehlerhafte Eingaben werden als
    /// 400 abgewiesen, nicht erst beim Speichern als 500 (Datensparsamkeit der
    /// Fehlermeldung inklusive — kein Inhalt, nur die betroffene Kennung).
    /// </summary>
    static void PruefeEingabe(Stammdaten neu)
    {
        if (neu.Mensen is null || neu.Raeume is null || neu.Links is null)
            throw ApiException.BadRequest("stammdaten_unvollstaendig",
                "Mensa-, Raum- und Links-Liste müssen angegeben sein (auch leer).");

        if (neu.Mensen.Any(m => string.IsNullOrWhiteSpace(m.Id)))
            throw ApiException.BadRequest("mensa_id_leer", "Jeder Mensa-Eintrag braucht eine Kennung.");
        var doppelteMensa = ErsteDoppelte(neu.Mensen.Select(m => m.Id));
        if (doppelteMensa is not null)
            throw ApiException.BadRequest("mensa_id_doppelt", $"Die Mensa-Kennung „{doppelteMensa}“ kommt mehrfach vor.");

        if (neu.Raeume.Any(r => string.IsNullOrWhiteSpace(r.RoomId)))
            throw ApiException.BadRequest("raum_id_leer", "Jeder Raum-Eintrag braucht eine Kennung.");
        var doppelterRaum = ErsteDoppelte(neu.Raeume.Select(r => r.RoomId));
        if (doppelterRaum is not null)
            throw ApiException.BadRequest("raum_id_doppelt", $"Die Raumkennung „{doppelterRaum}“ kommt mehrfach vor.");
    }

    static string? ErsteDoppelte(IEnumerable<string> werte) => werte
        .GroupBy(w => w, StringComparer.OrdinalIgnoreCase)
        .FirstOrDefault(g => g.Count() > 1)?.Key;

    public async Task<(IReadOnlyList<Laufweg> wege, string etag)> LaufwegeAsync(CancellationToken ct)
    {
        var wege = await db.Laufwege.AsNoTracking()
            .OrderBy(l => l.VonRoomId).ThenBy(l => l.NachRoomId).ToListAsync(ct);
        return (wege.Select(w => w.ToDto()).ToList(), await ETagAsync(SammlungsRevision.Laufwege, ct));
    }

    public async Task<(IReadOnlyList<Laufweg> wege, IReadOnlyList<string> unbekannt, string etag)>
        LaufwegeErsetzenAsync(IReadOnlyList<Laufweg> neu, string? ifMatch, CancellationToken ct)
    {
        // ADMIN Abschnitt 9: ein Weg von einem Raum zu sich selbst wird abgelehnt.
        if (neu.Any(w => string.Equals(w.VonRoomId, w.NachRoomId, StringComparison.OrdinalIgnoreCase)))
            throw ApiException.BadRequest("laufweg_selbstbezug", "Ein Laufweg darf nicht auf dieselbe Raumkennung verweisen.");
        if (neu.Any(w => string.IsNullOrWhiteSpace(w.VonRoomId) || string.IsNullOrWhiteSpace(w.NachRoomId)))
            throw ApiException.BadRequest("laufweg_unvollstaendig", "Jeder Laufweg braucht zwei Raumkennungen.");

        var revision = await StandPruefenAsync(SammlungsRevision.Laufwege, ifMatch, ct);

        var bekannt = (await db.Raeume.Select(r => r.RoomId).ToListAsync(ct))
            .ToHashSet(StringComparer.OrdinalIgnoreCase);
        var unbekannt = neu
            .SelectMany(w => new[] { w.VonRoomId, w.NachRoomId })
            .Where(id => !bekannt.Contains(id))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        db.Laufwege.RemoveRange(await db.Laufwege.ToListAsync(ct));
        db.Laufwege.AddRange(neu.Select(w => w.ToEntity()));

        revision.Version = Guid.NewGuid();
        return (neu.ToList(), unbekannt, ETag.Von(revision.Version));
    }

    static Stammdaten Zusammensetzen(
        List<MensaEintrag> mensen, List<RaumEintrag> raeume, List<LinkEintrag> links, SemesterKalender kalender) => new()
    {
        Mensen = mensen.OrderBy(m => m.Reihenfolge).Select(m => m.ToDto()).ToList(),
        Raeume = raeume.OrderBy(r => r.RoomId).Select(r => r.ToDto()).ToList(),
        Links = links.OrderBy(l => l.Reihenfolge).Select(l => l.ToDto()).ToList(),
        Semestertermine = kalender.ToTermineDto(),
        TicketBildausschnitt = kalender.ToAusschnittDto(),
    };

    /// <summary>Lesepfad: nur die Stand-Kennung, ohne den Change-Tracker zu berühren.</summary>
    async Task<string> ETagAsync(string bereich, CancellationToken ct)
    {
        var r = await db.Revisionen.AsNoTracking().FirstOrDefaultAsync(x => x.Bereich == bereich, ct);
        return ETag.Von(r?.Version ?? Guid.Empty);
    }

    /// <summary>
    /// Schreibpfad: lädt die Revision verfolgt (der Aufrufer setzt danach eine neue
    /// <see cref="SammlungsRevision.Version"/>), legt sie bei Bedarf an und weist einen
    /// veralteten <c>If-Match</c> als 412 ab (ADMIN-F-200).
    /// </summary>
    async Task<SammlungsRevision> StandPruefenAsync(string bereich, string? ifMatch, CancellationToken ct)
    {
        var r = await db.Revisionen.FirstOrDefaultAsync(x => x.Bereich == bereich, ct);
        if (r is null) { r = new SammlungsRevision { Bereich = bereich }; db.Revisionen.Add(r); }

        if (!ETag.Passt(ifMatch, ETag.Von(r.Version)))
            throw ApiException.PreconditionFailed(
                "stand_veraltet",
                "Die Liste wurde zwischenzeitlich geändert. Bitte den neueren Stand laden und erneut speichern.");
        return r;
    }
}

/// <summary>Hilfsfunktionen für <c>ETag</c>/<c>If-Match</c>.</summary>
public static class ETag
{
    public static string Von(Guid version) => $"\"{version:N}\"";

    public static bool Passt(string? ifMatch, string aktuell)
    {
        if (string.IsNullOrWhiteSpace(ifMatch)) return false;
        var soll = aktuell.Trim('"');
        return ifMatch
            .Split(',')
            .Select(t => t.Trim())
            .Select(t => t.StartsWith("W/", StringComparison.Ordinal) ? t[2..] : t)
            .Select(t => t.Trim().Trim('"'))
            .Any(t => t == "*" || t == soll);
    }
}
