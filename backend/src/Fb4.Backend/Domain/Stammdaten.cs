using Fb4.Backend.Contract.Generated;

namespace Fb4.Backend.Domain;

// Persistenzmodell der Stammdaten ohne externes Quellsystem (API-F-230,
// ADMIN-F-180/190). Getrennt von den Vertrags-DTOs (Contract.Generated), die nur
// die Auslieferungsform beschreiben.

/// <summary>Ein Eintrag der vom FSR gepflegten Mensa-Liste.</summary>
public class MensaEintrag
{
    public string Id { get; set; } = "";
    public string Name { get; set; } = "";
    /// <summary>Kennung im Quellsystem INT-015 (ITMC).</summary>
    public string? QuelleId { get; set; }
    public bool StandardAuswahl { get; set; }
    public int Reihenfolge { get; set; }
    public string? SpeiseplanUrl { get; set; }
    /// <summary>Ein Eintrag je Wochentag, Montag zuerst (MENSA-F-047).</summary>
    public List<string?> Oeffnungszeiten { get; set; } = [];
}

/// <summary>Ein Eintrag der vom FSR gepflegten Raumliste.</summary>
public class RaumEintrag
{
    public string RoomId { get; set; } = "";
    public Raumgroesse Groesse { get; set; }
    public bool EkeyZugaenglich { get; set; }
    public string? Schliesszeit { get; set; }
}

/// <summary>Ein Eintrag der Links-/Downloads-Liste.</summary>
public class LinkEintrag
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Bezeichnung { get; set; } = "";
    public string Url { get; set; } = "";
    public string? Gruppe { get; set; }
    public int Reihenfolge { get; set; }
}

/// <summary>Semestertermine und Ticket-Bildausschnitt (Einzelzeile, Id = 1).</summary>
public class SemesterKalender
{
    public int Id { get; set; } = 1;
    public DateOnly? SemesterBeginn { get; set; }
    public DateOnly? SemesterEnde { get; set; }
    public DateOnly? NaechsterWinterSemesterBeginn { get; set; }
    public DateOnly? NaechsterSommerSemesterBeginn { get; set; }
    public int TicketLinks { get; set; }
    public int TicketOben { get; set; }
    public int TicketRechts { get; set; }
    public int TicketUnten { get; set; }
}

/// <summary>Rückfallliste der Studiengänge, falls INT-001 nicht erreichbar ist (API-F-240).</summary>
public class StudiengangRueckfall
{
    public string Kurzname { get; set; } = "";
    public string Name { get; set; } = "";
    public List<int> Fachsemester { get; set; } = [];
}

/// <summary>
/// Stand-Kennung einer als Ganzes ersetzbaren Sammlung (Stammdaten, Laufwege).
/// Grundlage für die optimistische Nebenläufigkeitskontrolle über <c>If-Match</c>
/// (ADMIN-F-200). <see cref="Bereich"/> ist der Primärschlüssel.
/// </summary>
public class SammlungsRevision
{
    public string Bereich { get; set; } = "";
    public Guid Version { get; set; } = Guid.NewGuid();

    public const string Stammdaten = "stammdaten";
    public const string Laufwege = "laufwege";
}
