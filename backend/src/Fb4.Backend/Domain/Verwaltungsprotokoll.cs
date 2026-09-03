namespace Fb4.Backend.Domain;

/// <summary>
/// Ein Eintrag des Verwaltungsprotokolls (ADMIN-F-110): Zeitpunkt, handelndes
/// Konto und betroffener Datensatz jeder verändernden Verwaltungshandlung.
/// Ausdrücklich <b>kein</b> Inhalt nutzergenerierter Beiträge (SEC-N-120,
/// API-N-080). Aufbewahrung mindestens zwölf Monate (ADMIN-N-020).
/// </summary>
public class Verwaltungsprotokoll
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public DateTimeOffset ZeitpunktUtc { get; set; }
    public string KontoId { get; set; } = "";
    public string? KontoAnzeigename { get; set; }
    /// <summary>Art der Handlung, z. B. <c>stammdaten.ersetzt</c>.</summary>
    public string Handlung { get; set; } = "";
    /// <summary>Referenz auf den betroffenen Datensatz, ohne dessen Inhalt.</summary>
    public string DatensatzReferenz { get; set; } = "";
}
