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
        await PruefeStandAsync(SammlungsRevision.Stammdaten, ifMatch, ct);

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

        var etag = await NeueVersionAsync(SammlungsRevision.Stammdaten, ct);
        return (Zusammensetzen(mensen, raeume, links, kalender), etag);
    }

    public async Task<(IReadOnlyList<Laufweg> wege, string etag)> LaufwegeAsync(CancellationToken ct)
    {
        var wege = await db.Laufwege.AsNoTracking()
            .OrderBy(l => l.VonRoomId).ThenBy(l => l.NachRoomId).ToListAsync(ct);
        return (wege.Select(w => w.ToDto()).ToList(), await ETagAsync(SammlungsRevision.Laufwege, ct));
    }

    public async Task<(IReadOnlyList<Laufweg> wege, IReadOnlyList<string> unbekannt, string etag)>
        LaufwegeErsetzenAsync(IReadOnlyList<Laufweg> neu, string? ifMatch, CancellationToken ct)
    {
        await PruefeStandAsync(SammlungsRevision.Laufwege, ifMatch, ct);

        // ADMIN Abschnitt 9: ein Weg von einem Raum zu sich selbst wird abgelehnt.
        if (neu.Any(w => string.Equals(w.VonRoomId, w.NachRoomId, StringComparison.OrdinalIgnoreCase)))
            throw ApiException.BadRequest("laufweg_selbstbezug", "Ein Laufweg darf nicht auf dieselbe Raumkennung verweisen.");

        var bekannt = (await db.Raeume.Select(r => r.RoomId).ToListAsync(ct))
            .ToHashSet(StringComparer.OrdinalIgnoreCase);
        var unbekannt = neu
            .SelectMany(w => new[] { w.VonRoomId, w.NachRoomId })
            .Where(id => !bekannt.Contains(id))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        db.Laufwege.RemoveRange(await db.Laufwege.ToListAsync(ct));
        db.Laufwege.AddRange(neu.Select(w => w.ToEntity()));
        var etag = await NeueVersionAsync(SammlungsRevision.Laufwege, ct);

        return (neu.ToList(), unbekannt, etag);
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

    async Task<SammlungsRevision> RevisionAsync(string bereich, CancellationToken ct)
    {
        var r = await db.Revisionen.FirstOrDefaultAsync(x => x.Bereich == bereich, ct);
        if (r is null) { r = new SammlungsRevision { Bereich = bereich }; db.Revisionen.Add(r); }
        return r;
    }

    async Task<string> ETagAsync(string bereich, CancellationToken ct)
        => ETag.Von((await RevisionAsync(bereich, ct)).Version);

    async Task<string> NeueVersionAsync(string bereich, CancellationToken ct)
    {
        var r = await RevisionAsync(bereich, ct);
        r.Version = Guid.NewGuid();
        return ETag.Von(r.Version);
    }

    async Task PruefeStandAsync(string bereich, string? ifMatch, CancellationToken ct)
    {
        var aktuell = ETag.Von((await RevisionAsync(bereich, ct)).Version);
        if (!ETag.Passt(ifMatch, aktuell))
            throw ApiException.PreconditionFailed(
                "stand_veraltet",
                "Die Liste wurde zwischenzeitlich geändert. Bitte den neueren Stand laden und erneut speichern.");
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
