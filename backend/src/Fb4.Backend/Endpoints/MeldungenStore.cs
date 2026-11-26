using System.Buffers.Text;
using System.Globalization;
using System.Text;
using Fb4.Backend.Contract.Generated;
using Fb4.Backend.Domain;
using Fb4.Backend.Infrastructure;
using Microsoft.EntityFrameworkCore;

namespace Fb4.Backend.Endpoints;

/// <summary>Pflichtangaben einer Meldung (Requirement „Meldungsredaktion für FSR-News", design.md D2).</summary>
public static class MeldungsRegeln
{
    public const int TitelMaxLaenge = 200;
    public const int TextMaxLaenge = 20_000;
    public const int StandardSeite = 25;
    public const int MaxSeite = 100;

    /// <summary>Quelle/Verteiler der redaktionell gepflegten FSR-News.</summary>
    public const string QuelleFsr = "FSR FB4";

    public static void Pruefe(MeldungsentwurfEingabe eingabe)
    {
        var titel = eingabe.Titel?.Trim() ?? "";
        var text = eingabe.Text?.Trim() ?? "";
        if (titel.Length == 0) throw ApiException.BadRequest("titel_leer", "Der Titel darf nicht leer sein.");
        if (titel.Length > TitelMaxLaenge)
            throw ApiException.BadRequest("titel_zu_lang", $"Der Titel darf höchstens {TitelMaxLaenge} Zeichen haben.");
        if (text.Length == 0) throw ApiException.BadRequest("text_leer", "Der Text darf nicht leer sein.");
        if (text.Length > TextMaxLaenge)
            throw ApiException.BadRequest("text_zu_lang", $"Der Text darf höchstens {TextMaxLaenge} Zeichen haben.");
    }
}

/// <summary>
/// Liest und schreibt Meldungen (Capability <c>news</c>, Redaktion nach
/// ADMIN-F-040 bis F-060). Wie beim <see cref="StammdatenStore"/> merken die
/// schreibenden Methoden die Änderung nur im Change-Tracker vor; der Endpunkt
/// schreibt sie gemeinsam mit dem Protokolleintrag fest (ADMIN-F-110).
/// </summary>
public sealed class MeldungenStore(Fb4DbContext db, TimeProvider zeit)
{
    // ------------------------------------------------------------- Lesepfad

    /// <summary>
    /// Eine Seite veröffentlichter Meldungen, absteigend nach Zeitpunkt, Gleichstand
    /// absteigend nach Kennung (als Text, damit Datenbank und Cursor dieselbe Ordnung
    /// sehen). Dazu die Kennungen aller zurückgezogenen Meldungen (design.md D3).
    /// </summary>
    public async Task<Meldungsseite> SeiteAsync(
        string? cursor, int? limit, string? klassifizierung, CancellationToken ct)
    {
        var groesse = limit ?? MeldungsRegeln.StandardSeite;
        if (groesse < 1 || groesse > MeldungsRegeln.MaxSeite)
            throw ApiException.BadRequest("limit_ungueltig",
                $"Die Seitengröße muss zwischen 1 und {MeldungsRegeln.MaxSeite} liegen.");

        (DateTimeOffset zeitpunkt, string id)? nach = string.IsNullOrEmpty(cursor) ? null : CursorLesen(cursor);
        var treffer = await SeitenAbfrage(db.Meldungen.AsNoTracking(), klassifizierung, nach)
            .Take(groesse + 1)
            .ToListAsync(ct);

        var seite = treffer.Take(groesse).ToList();
        string? naechster = treffer.Count > groesse ? CursorSchreiben(seite[^1]) : null;

        var zurueckgezogen = await db.Meldungen.AsNoTracking()
            .Where(m => m.Zustand == MeldungsZustaende.Zurueckgezogen)
            .Select(m => m.Id)
            .ToListAsync(ct);

        return new Meldungsseite
        {
            Meldungen = seite.Select(ZuMeldung).ToList(),
            NaechsterCursor = naechster,
            Zurueckgezogen = zurueckgezogen,
            // Eigener Bestand, keine Fremdquelle: immer aktuell (design.md D3).
            StandAlter = new StandAlter { AbgerufenAm = zeit.GetUtcNow(), QuelleErreichbar = true },
        };
    }

    /// <summary>
    /// Filter und Ordnung einer Seite, ohne Seitengröße. Öffentlich, damit ein Test
    /// die Übersetzung nach SQL gegen den Npgsql-Anbieter prüfen kann — der
    /// In-Memory-Anbieter der übrigen Tests wertet die Abfrage in .NET aus.
    /// </summary>
    public static IQueryable<Meldungseintrag> SeitenAbfrage(
        IQueryable<Meldungseintrag> quelle, string? klassifizierung, (DateTimeOffset zeitpunkt, string id)? nach)
    {
        var q = quelle.Where(m => m.Zustand == MeldungsZustaende.Veroeffentlicht && m.VeroeffentlichtAm != null);

        if (!string.IsNullOrEmpty(klassifizierung))
        {
            if (klassifizierung is not (MeldungsKlassifizierungen.FsrNews
                or MeldungsKlassifizierungen.FbAktuelles or MeldungsKlassifizierungen.EventErinnerung))
                throw ApiException.BadRequest("klassifizierung_ungueltig", "Unbekannte Klassifizierung.");
            q = q.Where(m => m.Klassifizierung == klassifizierung);
        }

        if (nach is var (zeitpunkt, id))
        {
            q = q.Where(m => m.VeroeffentlichtAm < zeitpunkt
                || (m.VeroeffentlichtAm == zeitpunkt && string.Compare(m.Id.ToString(), id) < 0));
        }

        return q.OrderByDescending(m => m.VeroeffentlichtAm).ThenByDescending(m => m.Id.ToString());
    }

    // --------------------------------------------------------- Redaktion

    public async Task<IReadOnlyList<Meldungsentwurf>> AlleAsync(CancellationToken ct)
    {
        var alle = await db.Meldungen.AsNoTracking().OrderByDescending(m => m.GeaendertAm).ToListAsync(ct);
        return alle.Select(ZuEntwurf).ToList();
    }

    public async Task<Meldungsentwurf> EinzelnAsync(Guid id, CancellationToken ct)
    {
        var m = await db.Meldungen.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id, ct) ?? throw Unbekannt();
        return ZuEntwurf(m);
    }

    public Meldungseintrag Anlegen(MeldungsentwurfEingabe eingabe)
    {
        MeldungsRegeln.Pruefe(eingabe);
        var jetzt = zeit.GetUtcNow();
        var m = new Meldungseintrag
        {
            Titel = eingabe.Titel.Trim(),
            Text = eingabe.Text.Trim(),
            Zustand = MeldungsZustaende.Entwurf,
            Klassifizierung = MeldungsKlassifizierungen.FsrNews,
            Quelle = MeldungsRegeln.QuelleFsr,
            AngelegtAm = jetzt,
            GeaendertAm = jetzt,
        };
        db.Meldungen.Add(m);
        return m;
    }

    /// <summary>In jedem Zustand zulässig; der Veröffentlichungszeitpunkt bleibt (design.md D2).</summary>
    public async Task<Meldungseintrag> AendernAsync(Guid id, MeldungsentwurfEingabe eingabe, string? ifMatch, CancellationToken ct)
    {
        MeldungsRegeln.Pruefe(eingabe);
        var m = await LadenFuerAenderungAsync(id, ifMatch, ct);
        m.Titel = eingabe.Titel.Trim();
        m.Text = eingabe.Text.Trim();
        m.GeaendertAm = zeit.GetUtcNow();
        m.Version = Guid.NewGuid();
        return m;
    }

    /// <summary>
    /// Aus <c>entwurf</c> oder <c>zurueckgezogen</c>; liefert <c>false</c>, wenn die
    /// Meldung schon veröffentlicht war (idempotent, keine neue Zeit).
    /// </summary>
    public async Task<(Meldungseintrag meldung, bool geaendert)> VeroeffentlichenAsync(Guid id, string? ifMatch, CancellationToken ct)
    {
        var m = await LadenFuerAenderungAsync(id, ifMatch, ct);
        if (m.Zustand == MeldungsZustaende.Veroeffentlicht) return (m, false);

        var jetzt = zeit.GetUtcNow();
        m.Zustand = MeldungsZustaende.Veroeffentlicht;
        m.VeroeffentlichtAm = jetzt;
        m.GeaendertAm = jetzt;
        m.Version = Guid.NewGuid();
        return (m, true);
    }

    /// <summary>
    /// Aus <c>veroeffentlicht</c>; liefert <c>false</c>, wenn die Meldung bereits
    /// zurückgezogen war. Ein nie veröffentlichter Entwurf ergibt 409.
    /// </summary>
    public async Task<bool> ZurueckziehenAsync(Guid id, CancellationToken ct)
    {
        var m = await db.Meldungen.FirstOrDefaultAsync(x => x.Id == id, ct) ?? throw Unbekannt();
        if (m.Zustand == MeldungsZustaende.Zurueckgezogen) return false;
        if (m.Zustand == MeldungsZustaende.Entwurf)
            throw ApiException.Conflict("nicht_veroeffentlicht",
                "Ein nie veröffentlichter Entwurf kann nicht zurückgezogen werden.");

        m.Zustand = MeldungsZustaende.Zurueckgezogen;
        m.GeaendertAm = zeit.GetUtcNow();
        m.Version = Guid.NewGuid();
        return true;
    }

    async Task<Meldungseintrag> LadenFuerAenderungAsync(Guid id, string? ifMatch, CancellationToken ct)
    {
        var m = await db.Meldungen.FirstOrDefaultAsync(x => x.Id == id, ct) ?? throw Unbekannt();
        // Requirement „Ablehnung bei gleichzeitiger Änderung einer Meldung": erste
        // Stufe hier, zweite über den Concurrency-Token beim SaveChanges.
        if (!ETag.Passt(ifMatch, ETag.Von(m.Version)))
            throw ApiException.PreconditionFailed("stand_veraltet",
                "Die Meldung wurde zwischenzeitlich geändert. Bitte den neueren Stand laden.");
        return m;
    }

    static ApiException Unbekannt() =>
        ApiException.NotFound("meldung_unbekannt", "Eine Meldung mit dieser Kennung gibt es nicht.");

    // ------------------------------------------------------------ Abbildung

    public static Meldungsentwurf ZuEntwurf(Meldungseintrag m) => new()
    {
        Id = m.Id,
        Titel = m.Titel,
        Text = m.Text,
        Zustand = m.Zustand switch
        {
            MeldungsZustaende.Veroeffentlicht => Meldungszustand.Veroeffentlicht,
            MeldungsZustaende.Zurueckgezogen => Meldungszustand.Zurueckgezogen,
            _ => Meldungszustand.Entwurf,
        },
        Klassifizierung = KlassifizierungAus(m.Klassifizierung),
        Quelle = m.Quelle,
        VeroeffentlichtAm = m.VeroeffentlichtAm,
        GeaendertAm = m.GeaendertAm,
        Etag = ETag.Von(m.Version),
    };

    static Meldung ZuMeldung(Meldungseintrag m) => new()
    {
        Id = m.Id,
        Titel = m.Titel,
        Text = m.Text,
        VeroeffentlichtAm = m.VeroeffentlichtAm,
        Klassifizierung = KlassifizierungAus(m.Klassifizierung),
        Quelle = m.Quelle,
    };

    static Klassifizierung KlassifizierungAus(string wert) => wert switch
    {
        MeldungsKlassifizierungen.FbAktuelles => Klassifizierung.FbAktuelles,
        MeldungsKlassifizierungen.EventErinnerung => Klassifizierung.EventErinnerung,
        MeldungsKlassifizierungen.FsrNews => Klassifizierung.FsrNews,
        // Kein stilles Umdeuten eines unbekannten Werts (SEC-F-060).
        _ => throw new InvalidOperationException($"Unbekannte Klassifizierung „{wert}“ im Meldungsbestand."),
    };

    // ---------------------------------------------------------------- Cursor

    /// <summary>Opaker Cursor aus Zeitpunkt (Ticks, UTC) und Kennung der letzten Meldung.</summary>
    static string CursorSchreiben(Meldungseintrag m)
    {
        var roh = $"{m.VeroeffentlichtAm!.Value.UtcTicks.ToString(CultureInfo.InvariantCulture)}_{m.Id}";
        return Base64Url.EncodeToString(Encoding.UTF8.GetBytes(roh));
    }

    static (DateTimeOffset zeitpunkt, string id) CursorLesen(string cursor)
    {
        try
        {
            var roh = Encoding.UTF8.GetString(Base64Url.DecodeFromChars(cursor));
            var teile = roh.Split('_');
            if (teile.Length == 2
                && long.TryParse(teile[0], NumberStyles.None, CultureInfo.InvariantCulture, out var ticks)
                && ticks >= DateTimeOffset.MinValue.UtcTicks && ticks <= DateTimeOffset.MaxValue.UtcTicks
                && Guid.TryParse(teile[1], out var id))
            {
                return (new DateTimeOffset(ticks, TimeSpan.Zero), id.ToString());
            }
        }
        catch (FormatException)
        {
            // Fällt unten in die einheitliche Ablehnung; kein stilles Weiterblättern.
        }
        throw ApiException.BadRequest("cursor_ungueltig", "Der Cursor ist nicht lesbar.");
    }
}
