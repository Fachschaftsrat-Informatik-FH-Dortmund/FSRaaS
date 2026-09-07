namespace Fb4.Backend.Domain;

// Persistenzmodell des Mensa-Speiseplan-Zwischenspeichers (API-F-070/F-075, INT-015).
// Reiner Lesecache: die Gerichte eines Tages liegen als JSON-Blob, da nie einzeln
// abgefragt, sondern immer als Tagesliste ausgeliefert. Getrennt von den
// Vertrags-DTOs (Contract.Generated), die nur die einsprachige Auslieferungsform
// beschreiben.

/// <summary>Ein zwischengespeicherter Tages-Speiseplan einer Mensa.</summary>
public class SpeiseplanTag
{
    /// <summary>FSR-Mensakennung (<see cref="MensaEintrag.Id"/>), nicht die ITMC-Kennung.</summary>
    public string MensaId { get; set; } = "";
    public DateOnly Datum { get; set; }

    /// <summary>Gerichte als JSON-Liste von <see cref="GerichtCache"/> — zweisprachig, mit vorab berechnetem Schlüssel.</summary>
    public string GerichteJson { get; set; } = "[]";

    /// <summary>
    /// Anzahl der Einträge in <see cref="GerichteJson"/>, beim Schreiben gesetzt (nicht
    /// aus dem JSON abgeleitet). Erlaubt die Suche nach dem nächsten Tag mit Angebot per
    /// SQL (<c>WHERE "AnzahlGerichte" > 0</c>), ohne bei jeder Abfrage jede Kandidatenzeile
    /// zu deserialisieren.
    /// </summary>
    public int AnzahlGerichte { get; set; }

    public DateTimeOffset AbgerufenAm { get; set; }
}

/// <summary>
/// Ein Gericht im Zwischenspeicher. Hält beide Sprachfassungen; der Endpunkt
/// projiziert auf die über <c>Accept-Language</c> gewählte Sprache (MENSA-F-048).
/// </summary>
public sealed record GerichtCache
{
    public string Schluessel { get; init; } = "";
    public string KategorieDe { get; init; } = "";
    public string KategorieEn { get; init; } = "";
    public string BezeichnungDe { get; init; } = "";
    public string BezeichnungEn { get; init; } = "";
    public decimal? PreisStudierende { get; init; }
    public decimal? PreisMitarbeitende { get; init; }
    public decimal? PreisGaeste { get; init; }
    public IReadOnlyList<string> Zusatzstoffe { get; init; } = [];
    public IReadOnlyList<string> Kennzeichnungen { get; init; } = [];
    public int Position { get; init; }
}

/// <summary>
/// Ein Eintrag eines INT-015-Schlüsselverzeichnisses. <see cref="Art"/> ist
/// <c>kategorie</c>, <c>zusatzstoff</c> oder <c>kennzeichnung</c>.
/// </summary>
public class MensaVerzeichnisEintrag
{
    public string Art { get; set; } = "";
    public string QuelleId { get; set; } = "";
    public string BezeichnungDe { get; set; } = "";
    public string BezeichnungEn { get; set; } = "";

    public const string Kategorie = "kategorie";
    public const string Zusatzstoff = "zusatzstoff";
    public const string Kennzeichnung = "kennzeichnung";
}

/// <summary>Stand des Mensa-Zwischenspeichers für den Altershinweis (DATA-F-090, Schema <c>StandAlter</c>).</summary>
public class MensaZwischenspeicherStand
{
    public int Id { get; set; } = 1;
    public DateTimeOffset? VerzeichnisseAbgerufenAm { get; set; }
    public bool QuelleErreichbar { get; set; } = true;
}
