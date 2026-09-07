using System.Text.Json;
using Fb4.Backend.Contract.Generated;
using Fb4.Backend.Domain;
using Microsoft.EntityFrameworkCore;

namespace Fb4.Backend.Infrastructure.Mensa;

/// <summary>
/// Lesepfad des Mensa-Speiseplan-Zwischenspeichers (API-F-070/F-075). Liefert
/// ausschliesslich aus der eigenen Datenbank — nie synchron aus INT-015; das
/// Befuellen ist Sache von <see cref="SpeiseplanAktualisierungJob"/>.
/// </summary>
public sealed class SpeiseplanStore(Fb4DbContext db)
{
    static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web);

    public async Task<bool> MensaBekanntAsync(string mensaId, CancellationToken ct) =>
        await db.Mensen.AsNoTracking().AnyAsync(m => m.Id == mensaId, ct);

    /// <summary>
    /// Gerichte eines Tages in der gewaehlten Sprache, nach Position sortiert.
    /// Leere Liste = „kein Angebot" (kein Fehler, MENSA Abschnitt 9). Führt der Tag
    /// kein Angebot, wird zusätzlich der nächste Tag mit Angebot dieser Mensa ermittelt
    /// (Requirement „Wiedereröffnungshinweis an der geschlossenen Mensa"), ohne
    /// künstliche Tagesgrenze — die Suche reicht so weit wie der Zwischenspeicher.
    /// </summary>
    public async Task<(IReadOnlyList<Gericht> gerichte, StandAlter stand, DateOnly? naechsteOeffnung)> TagAsync(
        string mensaId, DateOnly datum, string sprache, CancellationToken ct)
    {
        var tag = await db.Speiseplaene.AsNoTracking()
            .FirstOrDefaultAsync(t => t.MensaId == mensaId && t.Datum == datum, ct);

        var verzeichnis = await VerzeichnisNachschlagAsync(sprache, ct);
        var stand = await StandAsync(tag?.AbgerufenAm, ct);

        if (tag is null)
            return ([], stand, await NaechsteOeffnungAsync(mensaId, datum, ct));

        var cache = JsonSerializer.Deserialize<List<GerichtCache>>(tag.GerichteJson, Json) ?? [];
        var gerichte = cache
            .OrderBy(g => g.Position)
            .Select(g => Projizieren(g, sprache, verzeichnis))
            .ToList();

        if (gerichte.Count > 0) return (gerichte, stand, null);
        return (gerichte, stand, await NaechsteOeffnungAsync(mensaId, datum, ct));
    }

    /// <summary>
    /// Nächster Tag nach <paramref name="datum"/>, für den der Zwischenspeicher dieser
    /// Mensa ein Angebot führt — oder <c>null</c>, wenn keiner im bekannten
    /// Zeithorizont liegt (design.md D2).
    /// </summary>
    async Task<DateOnly?> NaechsteOeffnungAsync(string mensaId, DateOnly datum, CancellationToken ct) =>
        await db.Speiseplaene.AsNoTracking()
            .Where(t => t.MensaId == mensaId && t.Datum > datum && t.AnzahlGerichte > 0)
            .OrderBy(t => t.Datum)
            .Select(t => (DateOnly?)t.Datum)
            .FirstOrDefaultAsync(ct);

    public async Task<(IReadOnlyList<Schluesselwert> kategorien,
        IReadOnlyList<Schluesselwert> zusatzstoffe,
        IReadOnlyList<Schluesselwert> kennzeichnungen)> VerzeichnisseAsync(string sprache, CancellationToken ct)
    {
        var alle = await db.MensaVerzeichnis.AsNoTracking().ToListAsync(ct);
        List<Schluesselwert> Fuer(string art) => alle
            .Where(e => e.Art == art)
            .OrderBy(e => e.QuelleId, StringComparer.Ordinal)
            .Select(e => new Schluesselwert { Id = e.QuelleId, Bezeichnung = Label(e, sprache) })
            .ToList();

        return (Fuer(MensaVerzeichnisEintrag.Kategorie),
                Fuer(MensaVerzeichnisEintrag.Zusatzstoff),
                Fuer(MensaVerzeichnisEintrag.Kennzeichnung));
    }

    async Task<Dictionary<(string art, string id), string>> VerzeichnisNachschlagAsync(string sprache, CancellationToken ct) =>
        (await db.MensaVerzeichnis.AsNoTracking().ToListAsync(ct))
        .ToDictionary(e => (e.Art, e.QuelleId), e => Label(e, sprache));

    async Task<StandAlter> StandAsync(DateTimeOffset? tagAbgerufenAm, CancellationToken ct)
    {
        var stand = await db.MensaStand.AsNoTracking().FirstOrDefaultAsync(ct);
        return new StandAlter
        {
            AbgerufenAm = tagAbgerufenAm ?? stand?.VerzeichnisseAbgerufenAm ?? DateTimeOffset.UnixEpoch,
            QuelleErreichbar = stand?.QuelleErreichbar ?? true,
        };
    }

    static string Label(MensaVerzeichnisEintrag e, string sprache) =>
        sprache == "en" ? e.BezeichnungEn : e.BezeichnungDe;

    static Gericht Projizieren(GerichtCache g, string sprache, Dictionary<(string, string), string> verzeichnis)
    {
        string Auf(string art, string id) => verzeichnis.TryGetValue((art, id), out var l) ? l : id;
        return new Gericht
        {
            Schluessel = g.Schluessel,
            Kategorie = sprache == "en" ? g.KategorieEn : g.KategorieDe,
            Bezeichnung = sprache == "en" ? g.BezeichnungEn : g.BezeichnungDe,
            PreisStudierende = g.PreisStudierende,
            PreisMitarbeitende = g.PreisMitarbeitende,
            PreisGaeste = g.PreisGaeste,
            Zusatzstoffe = g.Zusatzstoffe.Select(id => Auf(MensaVerzeichnisEintrag.Zusatzstoff, id)).ToList(),
            Kennzeichnungen = g.Kennzeichnungen.Select(id => Auf(MensaVerzeichnisEintrag.Kennzeichnung, id)).ToList(),
        };
    }
}
