namespace Fb4.Backend.Domain;

/// <summary>
/// Laufweg zwischen zwei Raumkennungen mit Distanzmaß (ADMIN-F-090, API-F-220);
/// Grundlage für RAUM-F-060. Eine unbekannte Raumkennung ist zulässig und wird
/// beim Speichern nur benannt, nicht abgelehnt (ADMIN-F-100).
/// </summary>
public class LaufwegEintrag
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string VonRoomId { get; set; } = "";
    public string NachRoomId { get; set; } = "";
    /// <summary>Fußweg in Minuten (RAUM, Abschnitt 13).</summary>
    public decimal Gewicht { get; set; }
}
