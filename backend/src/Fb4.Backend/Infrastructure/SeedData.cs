using Fb4.Backend.Contract.Generated;
using Fb4.Backend.Domain;
using Microsoft.EntityFrameworkCore;

namespace Fb4.Backend.Infrastructure;

/// <summary>
/// Ausgangsbestand der Stammdaten. Entspricht den im Anwendungspaket der
/// Android-Alt-App mitgelieferten Listen (<c>assets/canteens.json</c>,
/// <c>assets/rooms.json</c>) und dient als Startpunkt für die Pflege über die
/// Verwaltungsoberfläche (ADMIN-F-180). Wird nur eingefügt, solange die jeweilige
/// Tabelle leer ist — eine spätere FSR-Pflege wird nie überschrieben.
/// </summary>
public static class SeedData
{
    public static async Task EnsureSeededAsync(Fb4DbContext db, CancellationToken ct = default)
    {
        if (!await db.Revisionen.AnyAsync(r => r.Bereich == SammlungsRevision.Stammdaten, ct))
            db.Revisionen.Add(new SammlungsRevision { Bereich = SammlungsRevision.Stammdaten });
        if (!await db.Revisionen.AnyAsync(r => r.Bereich == SammlungsRevision.Laufwege, ct))
            db.Revisionen.Add(new SammlungsRevision { Bereich = SammlungsRevision.Laufwege });

        if (!await db.SemesterKalender.AnyAsync(ct))
            db.SemesterKalender.Add(new SemesterKalender { Id = 1 });

        if (!await db.Mensen.AnyAsync(ct))
            db.Mensen.AddRange(Mensen());

        if (!await db.Raeume.AnyAsync(ct))
            db.Raeume.AddRange(Raeume());

        await db.SaveChangesAsync(ct);
    }

    static IEnumerable<MensaEintrag> Mensen()
    {
        // Öffnungszeiten stehen hier nicht mehr: sie werden seit der Ablösung von
        // INT-015 nicht gepflegt, sondern je Anfrage aus INT-020 bezogen
        // (Capability `admin`, entfallenes Pflegerecht).
        (string id, string name, string quelleId, int order, bool std)[] rows =
        [
            ("Mensa", "Hauptmensa", "341", 10, true),
            ("Kostbar", "Kostbar", "456", 20, false),
            ("Sonnen", "Mensa Sonnenstrasse", "455", 40, false),
            ("Sued", "Mensa Sued", "342", 50, false),
            ("Max", "Max-Ophuels-Platz", "453", 60, false),
            ("Arch", "Archeteria Campus Sued", "452", 80, false),
            ("Soest", "Mensaforum Soest", "451", 90, false),
            ("Foodfakultaet", "Food Fakultaet", "474", 100, false),
            ("Galerie", "Galerie", "451", 120, false),
        ];
        return rows.Select(r => new MensaEintrag
        {
            Id = r.id,
            Name = r.name,
            QuelleId = r.quelleId,
            StandardAuswahl = r.std,
            Reihenfolge = r.order,
            SpeiseplanUrl = $"https://www.stwdo.de/speiseplan/speiseplan/naechste-2-wochen?verbrauchsortnr={r.quelleId}&limit=100",
        });
    }

    static IEnumerable<RaumEintrag> Raeume()
    {
        (string id, Raumgroesse groesse, bool ekey)[] rows =
        [
            ("A.E.01", Raumgroesse.Gross, true), ("A.E.02", Raumgroesse.Gross, true),
            ("A.E.03", Raumgroesse.Mittel, true), ("C.E.40", Raumgroesse.Klein, true),
            ("C.E.41", Raumgroesse.Klein, true), ("C.E.42", Raumgroesse.Klein, true),
            ("B.1.20", Raumgroesse.Mittel, true), ("A.1.02", Raumgroesse.Mittel, true),
            ("A.1.03", Raumgroesse.Gross, true), ("A.2.02", Raumgroesse.Gross, true),
            ("A.2.03", Raumgroesse.Mittel, true), ("A.3.03", Raumgroesse.Mittel, true),
            ("C.3.32", Raumgroesse.Mittel, true), ("C.3.34", Raumgroesse.Mittel, true),
            ("C.1.30", Raumgroesse.Mittel, false), ("C.1.31", Raumgroesse.Mittel, false),
            ("C.2.30", Raumgroesse.Mittel, false), ("C.2.32", Raumgroesse.Klein, false),
            ("B.2.21", Raumgroesse.Mittel, false),
        ];
        return rows.Select(r => new RaumEintrag { RoomId = r.id, Groesse = r.groesse, EkeyZugaenglich = r.ekey });
    }
}
