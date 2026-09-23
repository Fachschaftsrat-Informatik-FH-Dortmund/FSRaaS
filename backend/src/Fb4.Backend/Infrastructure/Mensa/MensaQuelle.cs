using System.Globalization;
using Fb4.Backend.Contract.Generated;
using Microsoft.EntityFrameworkCore;

namespace Fb4.Backend.Infrastructure.Mensa;

/// <summary>
/// Lesepfad der Mensa-Daten: reicht je Anfrage aus INT-020 durch und haelt keinen
/// eigenen Bestand (Capability <c>backend-and-api</c>, Requirement „Mensa-Daten
/// durchreichen statt zwischenspeichern"). Aus der eigenen Datenbank kommt allein
/// die gepflegte Mensa-Liste (Anzeigename, Reihenfolge, Standardauswahl,
/// <c>quelleId</c>) — sie hat keine externe Quelle (INT-008).
///
/// Die Gueltigkeitsdauer, die die Quelle selbst setzt, beachtet der
/// <see cref="AntwortGueltigkeitHandler"/> im HTTP-Weg; hier entsteht keine
/// Ablage und keine Auffrischungslogik.
/// </summary>
public sealed class MensaQuelle(Fb4DbContext db, FsrMensaClient quelle, TimeProvider zeit)
{
    /// <summary>Reichweite der Schliesstage von INT-020 (30 Tage laut Register).</summary>
    const int SchliesstageHorizontTage = 30;

    public async Task<bool> MensaBekanntAsync(string mensaId, CancellationToken ct) =>
        await db.Mensen.AsNoTracking().AnyAsync(m => m.Id == mensaId, ct);

    /// <summary>
    /// Kennung der Mensa im Quellsystem. INT-015 und INT-020 verwenden dieselbe
    /// Verbrauchsortnummer des Studierendenwerks — deshalb bleibt <c>quelleId</c>
    /// unveraendert und keine gespeicherte Auswahl muss umgeschluesselt werden.
    /// </summary>
    async Task<string> QuelleIdAsync(string mensaId, CancellationToken ct)
    {
        var eintrag = await db.Mensen.AsNoTracking()
            .Where(m => m.Id == mensaId)
            .Select(m => new { m.QuelleId })
            .FirstOrDefaultAsync(ct)
            ?? throw ApiException.NotFound("mensa_unbekannt", $"Keine Mensa mit der Kennung „{mensaId}“.");

        if (string.IsNullOrWhiteSpace(eintrag.QuelleId))
            throw new ApiException(502, "mensa_ohne_quellkennung",
                $"Für die Mensa „{mensaId}“ ist keine Kennung im Quellsystem gepflegt.");

        return eintrag.QuelleId;
    }

    /// <summary>
    /// Gerichte eines Tages in der gewaehlten Sprache. Leere Liste = „kein Angebot"
    /// (kein Fehler). Fuehrt der Tag kein Angebot, kommt zusaetzlich der naechste
    /// Tag, an dem die Quelle diese Mensa als geoeffnet fuehrt (Requirement
    /// „Wiedereroeffnungshinweis an der geschlossenen Mensa") — aus Oeffnungsvorschau
    /// und Schliesstagen, nicht mehr aus einem Speiseplan-Bestand.
    /// </summary>
    public async Task<(IReadOnlyList<Gericht> gerichte, StandAlter stand, DateOnly? naechsteOeffnung)> TagAsync(
        string mensaId, DateOnly datum, string sprache, CancellationToken ct)
    {
        var quelleId = await QuelleIdAsync(mensaId, ct);

        var tag = FsrMensaClient.Pruefen(await quelle.TagAsync(quelleId, datum, ct));
        var legende = await LegendeAsync(sprache, ct);

        var gerichte = (tag.Categories ?? [])
            .SelectMany(k => (k.Meals ?? []).Select(m => Legende.Anreichern(
                FsrMensaClient.Abbilden(m, k.Name ?? "", sprache), legende)))
            .ToList();

        var stand = await StandAsync(ct);
        if (gerichte.Count > 0) return (gerichte, stand, null);

        var oeffnung = FsrMensaClient.Pruefen(await quelle.OeffnungszeitenAsync(quelleId, ct));
        return (gerichte, stand, NaechsteOeffnung(datum, oeffnung));
    }

    /// <summary>
    /// Oeffnungs- und Schliessangaben einer Mensa, durchgereicht aus INT-020.
    /// Maßgeblich fuer „geoeffnet oder geschlossen" — das Fehlen von Gerichten ist
    /// es nicht (Capability <c>canteen</c>).
    /// </summary>
    public async Task<Oeffnungsangaben> OeffnungsangabenAsync(string mensaId, CancellationToken ct)
    {
        var quelleId = await QuelleIdAsync(mensaId, ct);
        var roh = FsrMensaClient.Pruefen(await quelle.OeffnungszeitenAsync(quelleId, ct));

        var vorausschau = (roh.Forecast ?? []).Select(AbbildenTag).ToList();
        var heuteDatum = DatumVon(roh.Today!.Date);

        // `today` traegt selbst keine Uhrzeiten (INT-020 `Today`: date, isOpen,
        // reason). Die Zeiten desselben Tages stehen in der Vorausschau.
        var heuteZeiten = vorausschau.FirstOrDefault(t => t.Datum == heuteDatum);

        var heute = new Oeffnungstag
        {
            Datum = heuteDatum,
            Wochentag = heuteZeiten?.Wochentag ?? (heuteDatum is { } d ? IsoWochentag(d.DayOfWeek) : null),
            Geoeffnet = roh.Today.IsOpen!.Value,
            Oeffnet = heuteZeiten?.Oeffnet,
            Schliesst = heuteZeiten?.Schliesst,
            AusgabeBeginn = heuteZeiten?.AusgabeBeginn,
            AusgabeEnde = heuteZeiten?.AusgabeEnde,
            // Die Quelle liefert den Grund im Klartext; er wird wiedergegeben, wie
            // sie ihn liefert, und nicht in eine eigene Formulierung uebersetzt.
            Grund = Leer(roh.Today.Reason) ?? heuteZeiten?.Grund,
        };

        return new Oeffnungsangaben
        {
            MensaId = mensaId,
            Heute = heute,
            Wochenplan = (roh.Week ?? []).Select(AbbildenTag).OrderBy(t => t.Wochentag ?? 8).ToList(),
            Vorausschau = vorausschau,
            Schliesstage = (roh.Closures ?? []).Select(AbbildenSchliesstag).ToList(),
            StandAlter = await StandAsync(ct),
        };
    }

    /// <summary>
    /// Schluesselverzeichnisse aus <c>GET /legend</c>. <c>kategorien</c> bleibt leer:
    /// INT-020 fuehrt kein Kategorieverzeichnis — die Anzeigekategorie steht am
    /// Speiseplan selbst (<c>categories[].name</c>).
    /// </summary>
    public async Task<(IReadOnlyList<Schluesselwert> kategorien,
        IReadOnlyList<Schluesselwert> zusatzstoffe,
        IReadOnlyList<Schluesselwert> allergene,
        IReadOnlyList<Schluesselwert> kennzeichnungen)> VerzeichnisseAsync(string sprache, CancellationToken ct)
    {
        var legende = await LegendeAsync(sprache, ct);
        return ([], legende.Zusatzstoffe, legende.Allergene, legende.Kennzeichnungen);
    }

    // ------------------------------------------------------------------ Stand
    /// <summary>
    /// Stand der ausgelieferten Daten. <c>abgerufenAm</c> ist beim Durchreichen der
    /// Zeitpunkt der Anfrage; <c>quelleStand</c> ist der von der Quelle selbst
    /// gemeldete Stand (Requirement „Weitergabe des Datenalters der
    /// Mensa-Schnittstelle"). Er steht allein in <c>GET /health</c>
    /// (<c>cache.menus.updated</c>) — die Speiseplan- und Oeffnungsantworten fuehren
    /// kein eigenes <c>updated</c> (OpenAPI 0.2.0, geprueft 2026-09-23). Faellt
    /// dieser Abruf aus, bleibt der gemeldete Stand offen; eine brauchbare
    /// Speiseplanantwort wird davon nicht zum Fehler.
    /// </summary>
    async Task<StandAlter> StandAsync(CancellationToken ct)
    {
        DateTimeOffset? gemeldet = null;
        var erreichbar = true;
        try
        {
            var zustand = await quelle.ZustandAsync(ct);
            gemeldet = zustand.Cache?.Menus?.Updated;
            // `status` meldet Ueberalterung nicht (2026-09-22: `ok` bei 6,7 Tage
            // alten Speiseplaenen) — deshalb zaehlt hier allein der Abrufzustand.
            erreichbar = zustand.Status is not "cold";
        }
        catch (ApiException)
        {
            erreichbar = false;
        }

        return new StandAlter
        {
            AbgerufenAm = zeit.GetUtcNow(),
            QuelleErreichbar = erreichbar,
            QuelleStand = gemeldet,
        };
    }

    // --------------------------------------------------------------- Legende
    async Task<Legende> LegendeAsync(string sprache, CancellationToken ct) =>
        Legende.Aus(await quelle.LegendeAsync(ct), sprache);

    /// <summary>
    /// Aufgeloeste Legende von INT-020. Die Quelle fuehrt Allergene getrennt von den
    /// Zusatzstoffen; im Gericht stehen beide gemeinsam unter <c>additives</c> und
    /// werden erst hier zugeordnet. Die Klartexte kommen in der angefragten Sprache
    /// aus der Quelle selbst (<c>label</c>/<c>labelEn</c>) — die App uebersetzt sie
    /// nicht (Requirement „Gerichtskategorien und Zusatzstoffhinweise in
    /// Oberflaechensprache", design.md).
    /// </summary>
    internal sealed record Legende(
        IReadOnlyList<Schluesselwert> Zusatzstoffe,
        IReadOnlyList<Schluesselwert> Allergene,
        IReadOnlyList<Schluesselwert> Kennzeichnungen,
        IReadOnlyDictionary<string, string> Klartext,
        IReadOnlySet<string> AllergenCodes)
    {
        public static Legende Aus(FsrMensaClient.LegendeDto roh, string sprache)
        {
            // Die Quelle fuehrt je Eintrag `label` (deutsch, massgeblich) und seit dem
            // 2026-09-24 `labelEn`. Fehlt die englische Fassung, tritt die deutsche an
            // ihre Stelle, statt die Bezeichnung leer zu lassen (SEC-F-060, keine
            // stillen Fehler) — derselbe Sprachrueckfall wie bei `linesEn`.
            string Klar(FsrMensaClient.LegendeEintragDto x) => sprache == "en"
                ? Leer(x.LabelEn) ?? Leer(x.Label) ?? x.Code!
                : Leer(x.Label) ?? x.Code!;

            List<Schluesselwert> Werte(IReadOnlyList<FsrMensaClient.LegendeEintragDto>? e) => (e ?? [])
                .Where(x => !string.IsNullOrWhiteSpace(x.Code))
                .Select(x => new Schluesselwert { Id = x.Code!, Bezeichnung = Klar(x) })
                .ToList();

            var zusatzstoffe = Werte(roh.Additives);
            var allergene = Werte(roh.Allergens);
            var kennzeichnungen = Werte(roh.Tags);

            // `zusatzstoffe` behaelt seine bisherige Bedeutung (Zusatzstoffe UND
            // Allergene), damit eine aeltere App sich nicht anders verhaelt (ADR 0016).
            var gemeinsam = zusatzstoffe.Concat(allergene).ToList();

            var klartext = gemeinsam.Concat(kennzeichnungen)
                .GroupBy(w => w.Id, StringComparer.Ordinal)
                .ToDictionary(g => g.Key, g => g.First().Bezeichnung, StringComparer.Ordinal);

            return new Legende(
                gemeinsam.OrderBy(w => w.Id, StringComparer.Ordinal).ToList(),
                allergene,
                kennzeichnungen,
                klartext,
                allergene.Select(a => a.Id).ToHashSet(StringComparer.Ordinal));
        }

        /// <summary>
        /// Loest die Codes eines Gerichts in Klartext auf. Ein Code, den die Legende
        /// nicht kennt, wird unveraendert angezeigt statt verschluckt (design.md,
        /// Risiko „statische Tabelle der Quelle").
        /// </summary>
        public string Auf(string code) => Klartext.TryGetValue(code, out var l) ? l : code;

        public static Gericht Anreichern(Gericht g, Legende legende) => g with
        {
            Zusatzstoffe = (g.Zusatzstoffe ?? []).Select(legende.Auf).ToList(),
            Allergene = (g.Zusatzstoffe ?? [])
                .Where(legende.AllergenCodes.Contains)
                .Select(legende.Auf)
                .ToList(),
            Kennzeichnungen = (g.Kennzeichnungen ?? []).Select(legende.Auf).ToList(),
        };
    }

    // -------------------------------------------------------- Oeffnungsangaben
    static Oeffnungstag AbbildenTag(FsrMensaClient.OeffnungstagDto t) => new()
    {
        Datum = DatumVon(t.Date),
        Wochentag = IsoWochentag(t.Weekday),
        Geoeffnet = t.IsOpen!.Value,
        Oeffnet = Leer(t.Open),
        Schliesst = Leer(t.Close),
        AusgabeBeginn = Leer(t.ServingOpen),
        AusgabeEnde = Leer(t.ServingClose),
        Grund = Leer(t.ClosedReason),
    };

    static Schliesstag AbbildenSchliesstag(FsrMensaClient.SchliesstagDto s) => new()
    {
        Bezeichnung = s.Label!,
        Datum = DatumVon(s.Date),
        Von = DatumVon(s.From),
        Bis = DatumVon(s.To),
        Feiertag = s.IsHoliday!.Value,
        // INT-020 kennt `global` (alle Haeuser) und `canteen` (nur diese Mensa).
        Geltungsbereich = s.Scope == "global" ? Schliessbereich.Global : Schliessbereich.Mensa,
    };

    /// <summary>
    /// Naechster Tag nach <paramref name="angezeigt"/>, an dem die Quelle diese
    /// Mensa als geoeffnet fuehrt. Zuerst aus der Oeffnungsvorschau (sieben Tage);
    /// reicht sie nicht, wird ueber den Wochenplan bis ans Ende des
    /// Schliesstage-Horizonts weitergesucht, wobei Schliesstage uebersprungen
    /// werden. Traegt keiner dieser Tage eine Oeffnung, entfaellt der Zusatz
    /// (<c>null</c>) — derselbe Ausgang, den die Anforderung fuer den unbekannten
    /// Fall vorsieht.
    /// </summary>
    internal static DateOnly? NaechsteOeffnung(DateOnly angezeigt, FsrMensaClient.OeffnungszeitenDto roh)
    {
        var vorausschau = (roh.Forecast ?? [])
            .Where(t => t.IsOpen == true && DatumVon(t.Date) is { } d && d > angezeigt)
            .Select(t => DatumVon(t.Date)!.Value)
            .ToList();
        if (vorausschau.Count > 0) return vorausschau.Min();

        var bekannt = (roh.Forecast ?? [])
            .Select(t => DatumVon(t.Date))
            .Where(d => d is not null)
            .Select(d => d!.Value)
            .ToHashSet();

        var wochenplan = (roh.Week ?? [])
            .Where(t => IsoWochentag(t.Weekday) is not null)
            .GroupBy(t => IsoWochentag(t.Weekday)!.Value)
            .ToDictionary(g => g.Key, g => g.First().IsOpen == true);

        var schliesstage = (roh.Closures ?? []).Select(AbbildenSchliesstag).ToList();

        for (var i = 1; i <= SchliesstageHorizontTage; i++)
        {
            var kandidat = angezeigt.AddDays(i);
            // Die Vorausschau hat diesen Tag bereits als geschlossen ausgewiesen.
            if (bekannt.Contains(kandidat)) continue;
            if (schliesstage.Any(s => Deckt(s, kandidat))) continue;
            if (wochenplan.TryGetValue(IsoWochentag(kandidat.DayOfWeek), out var offen) && offen)
                return kandidat;
        }

        return null;
    }

    static bool Deckt(Schliesstag s, DateOnly tag) =>
        s.Datum == tag || (s.Von is { } von && s.Bis is { } bis && tag >= von && tag <= bis);

    // ------------------------------------------------------------- Hilfsmittel
    static string? Leer(string? wert) => string.IsNullOrWhiteSpace(wert) ? null : wert;

    static DateOnly? DatumVon(string? roh) =>
        DateOnly.TryParseExact(roh, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var d)
            ? d
            : null;

    /// <summary>Wochentagsname der Quelle (<c>monday</c>…<c>sunday</c>) → ISO 8601 (1 = Montag).</summary>
    static int? IsoWochentag(string? name) => name?.ToLowerInvariant() switch
    {
        "monday" => 1,
        "tuesday" => 2,
        "wednesday" => 3,
        "thursday" => 4,
        "friday" => 5,
        "saturday" => 6,
        "sunday" => 7,
        _ => null,
    };

    static int IsoWochentag(DayOfWeek tag) => tag == DayOfWeek.Sunday ? 7 : (int)tag;
}
