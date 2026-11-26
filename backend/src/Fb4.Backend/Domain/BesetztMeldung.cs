namespace Fb4.Backend.Domain;

/// <summary>
/// Eine kontofreie Besetzt-Meldung der Raumsuche (Capability <c>room-finder</c>,
/// Requirement „Raum als besetzt melden"; Capability <c>backend-and-api</c>,
/// Requirement „Raumbesetzt-Meldungen ohne Personenbezug"). Trägt bewusst
/// keine Netzadresse, keine Geräte- und keine Kontokennung: <see cref="Id"/> ist
/// der vom Gerät je Meldung zufällig erzeugte Idempotenz-Schlüssel und zugleich
/// die Kennung zum Zurückziehen (Requirement „Besetzt-Meldung zurückziehen").
/// </summary>
public class BesetztMeldung
{
    /// <summary>
    /// Wie lange eine Meldung ab ihrem Auslösezeitpunkt zählt (Requirement
    /// „Gültigkeitsdauer einer Besetzt-Meldung", Arbeitsziel 90 Minuten).
    /// </summary>
    public static readonly TimeSpan Gueltigkeit = TimeSpan.FromMinutes(90);

    /// <summary>Idempotenz-Schlüssel der meldenden Anfrage.</summary>
    public Guid Id { get; set; }

    public string RoomId { get; set; } = "";

    /// <summary>Auslösezeitpunkt auf dem Gerät, gekappt auf den Eingangszeitpunkt.</summary>
    public DateTimeOffset GemeldetAm { get; set; }

    /// <summary>Gesetzt, sobald die meldende Person die Meldung zurückgezogen hat.</summary>
    public DateTimeOffset? ZurueckgezogenAm { get; set; }

    public DateTimeOffset GueltigBis => GemeldetAm + Gueltigkeit;

    /// <summary>Zählt die Meldung zum Bezugszeitpunkt <paramref name="t"/>?</summary>
    public static bool GueltigZu(DateTimeOffset gemeldetAm, DateTimeOffset? zurueckgezogenAm, DateTimeOffset t) =>
        zurueckgezogenAm is null && gemeldetAm <= t && gemeldetAm > t - Gueltigkeit;
}
