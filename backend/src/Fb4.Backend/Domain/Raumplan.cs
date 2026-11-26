namespace Fb4.Backend.Domain;

/// <summary>
/// Ein zwischengespeicherter Einzeltermin aus INT-009 (<c>Room/*/AllEvents</c>),
/// je aufgelöstem Raum ein Eintrag. Ein Termin mit Pseudo-Raumkennung <c>*</c>,
/// dessen Name mehrere Räume nennt, ergibt mehrere Einträge. <c>description</c>
/// wird bewusst nicht übernommen: Es kann Klarnamen tragen (INT-009).
/// </summary>
public class RaumplanTerminEintrag
{
    public Guid Id { get; set; } = Guid.NewGuid();

    /// <summary>Aufgelöster Raum; <c>*</c>, wenn auch das Namensfeld keinen nennt.</summary>
    public string RoomId { get; set; } = "";

    /// <summary>Raumkennung, wie die Quelle sie liefert (ggf. <c>*</c>).</summary>
    public string RoomIdQuelle { get; set; } = "";

    public string? QuellId { get; set; }
    public string Name { get; set; } = "";
    public string EventType { get; set; } = "";
    public DateTimeOffset Beginn { get; set; }
    public DateTimeOffset Ende { get; set; }
    public string Weekday { get; set; } = "";

    /// <summary>HHmm, linksseitig auf vier Stellen aufgefüllt.</summary>
    public string TimeBegin { get; set; } = "";

    /// <summary>HHmm, linksseitig auf vier Stellen aufgefüllt.</summary>
    public string TimeEnd { get; set; } = "";

    public string? StudentSet { get; set; }
    public string? CourseOfStudy { get; set; }
    public string? LecturerId { get; set; }
    public string? Note { get; set; }
}

/// <summary>Ein Raum aus der Raumliste von INT-009 (<c>Room/</c>), ohne Pseudoraum.</summary>
public class RaumplanRaum
{
    public string RoomId { get; set; } = "";
}

/// <summary>
/// Stand des Raumplan-Zwischenspeichers (genau eine Zeile, <see cref="Id"/> = 1).
/// Speist <c>standAlter</c> der Raum-Endpunkte.
/// </summary>
public class RaumplanStand
{
    public const int EinzigeId = 1;

    public int Id { get; set; } = EinzigeId;

    /// <summary>Zeitpunkt des letzten erfolgreichen Abrufs — das Alter des Bestands.</summary>
    public DateTimeOffset? AbgerufenAm { get; set; }

    public DateTimeOffset? Von { get; set; }
    public DateTimeOffset? Bis { get; set; }

    public DateTimeOffset? LetzterVersuchAm { get; set; }
    public bool LetzterVersuchErfolgreich { get; set; }
}

/// <summary>
/// Ein aus dem Raumplan abgeleiteter Prüfungstermin (Requirement „Ableitung des
/// Prüfungsbestands aus dem Raumplan"). Einträge derselben Prüfung in mehreren
/// Räumen sind zusammengeführt; <see cref="Raeume"/> ist leer, wenn der Raumplan
/// keinen Raum nennt.
/// </summary>
public class PruefungsterminEintrag
{
    public Guid Id { get; set; } = Guid.NewGuid();

    /// <summary>Name, wie die Quelle ihn liefert (NFC, getrimmt); Schlüssel der Zusammenführung.</summary>
    public string Name { get; set; } = "";

    /// <summary>Null, wenn das Namensmuster keine Modulnummer hergab.</summary>
    public string? Modulnummer { get; set; }

    public string Bezeichnung { get; set; } = "";
    public DateTimeOffset Beginn { get; set; }
    public DateTimeOffset Ende { get; set; }
    public List<string> Raeume { get; set; } = [];
}

/// <summary>
/// Stand des Prüfungsbestands (genau eine Zeile, <see cref="Id"/> = 1). Speist
/// <c>standAlter</c> und den Änderungszeitpunkt.
/// </summary>
public class PruefungsbestandStand
{
    public const int EinzigeId = 1;

    public int Id { get; set; } = EinzigeId;

    /// <summary>Zeitpunkt des letzten erfolgreichen Abrufs — das Alter des Bestands.</summary>
    public DateTimeOffset? AbgerufenAm { get; set; }

    /// <summary>Zeitpunkt, zu dem der abgeleitete Bestand zuletzt vom vorigen abwich.</summary>
    public DateTimeOffset? GeaendertAm { get; set; }

    public DateTimeOffset? Von { get; set; }
    public DateTimeOffset? Bis { get; set; }

    public DateTimeOffset? LetzterVersuchAm { get; set; }
    public bool LetzterVersuchErfolgreich { get; set; }
}
