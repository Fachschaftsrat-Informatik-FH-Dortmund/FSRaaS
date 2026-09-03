using Fb4.Backend.Contract.Generated;
using Fb4.Backend.Domain;

namespace Fb4.Backend.Endpoints;

/// <summary>Abbildung zwischen Persistenzmodell (Domain) und Vertrags-DTOs.</summary>
internal static class StammdatenMapping
{
    public static Mensa ToDto(this MensaEintrag e) => new()
    {
        Id = e.Id,
        Name = e.Name,
        QuelleId = e.QuelleId,
        StandardAuswahl = e.StandardAuswahl,
        Reihenfolge = e.Reihenfolge,
        SpeiseplanUrl = e.SpeiseplanUrl,
        Oeffnungszeiten = e.Oeffnungszeiten.ToList(),
    };

    public static MensaEintrag ToEntity(this Mensa d) => new()
    {
        Id = d.Id,
        Name = d.Name,
        QuelleId = d.QuelleId,
        StandardAuswahl = d.StandardAuswahl,
        Reihenfolge = d.Reihenfolge,
        SpeiseplanUrl = d.SpeiseplanUrl,
        Oeffnungszeiten = (d.Oeffnungszeiten ?? []).ToList(),
    };

    public static Raum ToDto(this RaumEintrag e) => new()
    {
        RoomId = e.RoomId,
        Groesse = e.Groesse,
        EkeyZugaenglich = e.EkeyZugaenglich,
        Schliesszeit = e.Schliesszeit,
    };

    public static RaumEintrag ToEntity(this Raum d) => new()
    {
        RoomId = d.RoomId,
        Groesse = d.Groesse,
        EkeyZugaenglich = d.EkeyZugaenglich,
        Schliesszeit = d.Schliesszeit,
    };

    public static Link ToDto(this LinkEintrag e) => new()
    {
        Bezeichnung = e.Bezeichnung,
        Url = e.Url,
        Gruppe = e.Gruppe,
        Reihenfolge = e.Reihenfolge,
    };

    public static LinkEintrag ToEntity(this Link d) => new()
    {
        Bezeichnung = d.Bezeichnung,
        Url = d.Url,
        Gruppe = d.Gruppe,
        Reihenfolge = d.Reihenfolge ?? 0,
    };

    public static Semestertermine ToTermineDto(this SemesterKalender e) => new()
    {
        SemesterBeginn = e.SemesterBeginn,
        SemesterEnde = e.SemesterEnde,
        NaechsterWinterSemesterBeginn = e.NaechsterWinterSemesterBeginn,
        NaechsterSommerSemesterBeginn = e.NaechsterSommerSemesterBeginn,
    };

    public static Bildausschnitt ToAusschnittDto(this SemesterKalender e) => new()
    {
        Links = e.TicketLinks,
        Oben = e.TicketOben,
        Rechts = e.TicketRechts,
        Unten = e.TicketUnten,
    };

    public static void Uebernehmen(this SemesterKalender e, Semestertermine? termine, Bildausschnitt? ausschnitt)
    {
        e.SemesterBeginn = termine?.SemesterBeginn;
        e.SemesterEnde = termine?.SemesterEnde;
        e.NaechsterWinterSemesterBeginn = termine?.NaechsterWinterSemesterBeginn;
        e.NaechsterSommerSemesterBeginn = termine?.NaechsterSommerSemesterBeginn;
        e.TicketLinks = ausschnitt?.Links ?? 0;
        e.TicketOben = ausschnitt?.Oben ?? 0;
        e.TicketRechts = ausschnitt?.Rechts ?? 0;
        e.TicketUnten = ausschnitt?.Unten ?? 0;
    }

    public static Studiengang ToDto(this StudiengangRueckfall e) => new()
    {
        Kurzname = e.Kurzname,
        Name = e.Name,
        Fachsemester = e.Fachsemester.ToList(),
    };

    public static Laufweg ToDto(this LaufwegEintrag e) => new()
    {
        VonRoomId = e.VonRoomId,
        NachRoomId = e.NachRoomId,
        Gewicht = e.Gewicht,
    };

    public static LaufwegEintrag ToEntity(this Laufweg d) => new()
    {
        VonRoomId = d.VonRoomId,
        NachRoomId = d.NachRoomId,
        Gewicht = d.Gewicht,
    };
}
