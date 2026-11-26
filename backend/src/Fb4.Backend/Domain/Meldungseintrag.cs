namespace Fb4.Backend.Domain;

/// <summary>
/// Eine Meldung im Sinne der Capability <c>news</c>, vom Entwurf bis zum
/// Rückzug in einem Datensatz (Change <c>news-redaktion</c>, design.md D1).
/// Wer angelegt, geändert, veröffentlicht oder zurückgezogen hat, steht im
/// Verwaltungsprotokoll, nicht hier (Datensparsamkeit, API-N-080).
/// </summary>
public class Meldungseintrag
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Titel { get; set; } = "";
    public string Text { get; set; } = "";

    /// <summary><c>entwurf</c>, <c>veroeffentlicht</c> oder <c>zurueckgezogen</c>.</summary>
    public string Zustand { get; set; } = MeldungsZustaende.Entwurf;

    /// <summary>Vertragswert der Klassifizierung, z. B. <c>fsr-news</c> (NEWS-F-080).</summary>
    public string Klassifizierung { get; set; } = MeldungsKlassifizierungen.FsrNews;

    /// <summary>Quelle/Verteiler der Meldung.</summary>
    public string Quelle { get; set; } = "";

    /// <summary>Zeitpunkt der (letzten) Veröffentlichung; null, solange nie veröffentlicht.</summary>
    public DateTimeOffset? VeroeffentlichtAm { get; set; }

    public DateTimeOffset AngelegtAm { get; set; }
    public DateTimeOffset GeaendertAm { get; set; }

    /// <summary>Stand-Kennung für <c>ETag</c>/<c>If-Match</c> und Concurrency-Token.</summary>
    public Guid Version { get; set; } = Guid.NewGuid();
}

public static class MeldungsZustaende
{
    public const string Entwurf = "entwurf";
    public const string Veroeffentlicht = "veroeffentlicht";
    public const string Zurueckgezogen = "zurueckgezogen";
}

public static class MeldungsKlassifizierungen
{
    public const string FsrNews = "fsr-news";
    public const string FbAktuelles = "fb-aktuelles";
    public const string EventErinnerung = "event-erinnerung";
}
