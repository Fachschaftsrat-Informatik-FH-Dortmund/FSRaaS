using Fb4.Backend.Domain;
using Microsoft.EntityFrameworkCore;

namespace Fb4.Backend.Infrastructure.Raumplan;

/// <summary>
/// Ein Abruf des Raumplans (INT-009) in den Zwischenspeicher — Requirement
/// „Raumtermine über Platzhalter-Aufruf beziehen" (Capability <c>backend-and-api</c>).
/// Zeitraum: Beginn des laufenden Tages (Europe/Berlin) bis 28 Tage danach, stets
/// ausdrücklich über <c>From</c>/<c>To</c>. Eine verdächtige Antwort ersetzt den
/// Bestand nicht, sondern endet als Ausnahme, die der Job protokolliert und im
/// Health-Check ausweist (SEC-F-060, API-F-260).
/// </summary>
public class RaumplanAbruf(
    Fb4DbContext db,
    FbwsRaumplanClient quelle,
    TimeProvider zeit,
    ILogger<RaumplanAbruf> logger)
{
    public static readonly TimeSpan Zeitraum = TimeSpan.FromDays(28);
    static readonly TimeSpan Standardfenster = TimeSpan.FromDays(7);
    static readonly TimeZoneInfo Ortszeit = TimeZoneInfo.FindSystemTimeZoneById("Europe/Berlin");

    /// <summary>Beginn des laufenden Tages in Ortszeit und 28 Tage danach.</summary>
    public static (DateTimeOffset Von, DateTimeOffset Bis) ZeitraumAb(DateTimeOffset jetzt)
    {
        var ortsJetzt = TimeZoneInfo.ConvertTime(jetzt, Ortszeit);
        var tagesbeginn = ortsJetzt.Date;
        var von = new DateTimeOffset(tagesbeginn, Ortszeit.GetUtcOffset(tagesbeginn));
        return (von, von + Zeitraum);
    }

    public async Task AusfuehrenAsync(CancellationToken ct)
    {
        var jetzt = zeit.GetUtcNow();
        var (von, bis) = ZeitraumAb(jetzt);
        var stand = await db.RaumplanStand.FindAsync([RaumplanStand.EinzigeId], ct);
        if (stand is null)
        {
            stand = new RaumplanStand();
            db.RaumplanStand.Add(stand);
        }
        stand.LetzterVersuchAm = jetzt;
        stand.LetzterVersuchErfolgreich = false;

        try
        {
            var raeume = await quelle.RaeumeAsync(ct);
            var termine = await quelle.AlleTermineAsync(von, bis, ct);
            var eintraege = Eintraege(termine, von, bis);
            await PruefeAbdeckungAsync(eintraege, von, bis, ct);

            db.RaumplanTermine.RemoveRange(await db.RaumplanTermine.ToListAsync(ct));
            db.RaumplanRaeume.RemoveRange(await db.RaumplanRaeume.ToListAsync(ct));
            db.RaumplanTermine.AddRange(eintraege);
            db.RaumplanRaeume.AddRange(raeume
                .Where(r => r != RaumAufloesung.Pseudoraum)
                .Distinct(StringComparer.Ordinal)
                .Select(r => new RaumplanRaum { RoomId = r }));

            stand.AbgerufenAm = jetzt;
            stand.Von = von;
            stand.Bis = bis;
            stand.LetzterVersuchErfolgreich = true;
            await db.SaveChangesAsync(ct);
            logger.LogInformation(
                "Raumplan abgerufen: {Termine} Quelltermine, {Eintraege} Raumeinträge, {Raeume} Räume ({Von:o} bis {Bis:o})",
                termine.Count, eintraege.Count, raeume.Count, von, bis);
        }
        catch
        {
            // Bestand bleibt unverändert; nur der gescheiterte Versuch wird vermerkt.
            // Die Ausnahme selbst protokolliert der PeriodicJobService (SEC-F-060).
            foreach (var e in db.ChangeTracker.Entries().ToList())
                if (e.Entity is not RaumplanStand) e.State = EntityState.Detached;
            await db.SaveChangesAsync(CancellationToken.None);
            throw;
        }
    }

    List<RaumplanTerminEintrag> Eintraege(IReadOnlyList<FbwsTermin> termine, DateTimeOffset von, DateTimeOffset bis)
    {
        var liste = new List<RaumplanTerminEintrag>();
        foreach (var t in termine)
        {
            if (t.TimestampBegin is not > 0 || t.TimestampEnd is not > 0 || t.TimestampEnd <= t.TimestampBegin)
            {
                // Termin ohne auswertbare Zeitangabe: überspringen, nicht still (SEC-F-060).
                logger.LogWarning(
                    "Raumplan-Termin ohne auswertbare Zeitangabe übersprungen: Id {Id}, Raum {Raum}, Beginn {Beginn}, Ende {Ende}",
                    t.Id, t.RoomId, t.TimestampBegin, t.TimestampEnd);
                continue;
            }

            var beginn = DateTimeOffset.FromUnixTimeSeconds(t.TimestampBegin.Value);
            var ende = DateTimeOffset.FromUnixTimeSeconds(t.TimestampEnd!.Value);
            if (ende <= von || beginn >= bis)
            {
                logger.LogWarning("Raumplan-Termin außerhalb des angeforderten Zeitraums verworfen: Id {Id}, Beginn {Beginn:o}", t.Id, beginn);
                continue;
            }

            foreach (var raum in RaumAufloesung.RaeumeFuer(t.RoomId, t.Name))
            {
                liste.Add(new RaumplanTerminEintrag
                {
                    RoomId = raum,
                    RoomIdQuelle = t.RoomId,
                    QuellId = t.Id,
                    Name = t.Name,
                    EventType = t.EventType,
                    Beginn = beginn,
                    Ende = ende,
                    Weekday = t.Weekday,
                    TimeBegin = RaumAufloesung.Uhrzeit(t.TimeBegin),
                    TimeEnd = RaumAufloesung.Uhrzeit(t.TimeEnd),
                    StudentSet = t.StudentSet,
                    CourseOfStudy = t.CourseOfStudy,
                    LecturerId = t.LecturerId,
                    Note = t.Note,
                });
            }
        }
        return liste;
    }

    /// <summary>
    /// Erkennt ein ignoriertes <c>From</c>/<c>To</c>: Liegen alle Termine im
    /// Standardfenster (Folgetag bis sieben Tage danach), obwohl ein längerer,
    /// heute beginnender Zeitraum angefordert war, hat der Dienst die Parameter
    /// nicht ausgewertet. Eine leere Antwort ersetzt keinen gefüllten Bestand.
    /// </summary>
    async Task PruefeAbdeckungAsync(List<RaumplanTerminEintrag> eintraege, DateTimeOffset von, DateTimeOffset bis, CancellationToken ct)
    {
        if (eintraege.Count == 0)
        {
            if (await db.RaumplanTermine.AnyAsync(ct))
                throw new InvalidDataException(
                    "INT-009 lieferte keinen Termin, der Zwischenspeicher führt aber Termine; der bisherige Bestand bleibt.");
            return;
        }

        var folgetag = von.AddDays(1);
        var standardEnde = folgetag + Standardfenster;
        if (bis > standardEnde && eintraege.All(e => e.Beginn >= folgetag && e.Beginn < standardEnde))
            throw new InvalidDataException(
                $"INT-009 lieferte nur Termine im Sieben-Tage-Standardfenster ({folgetag:yyyy-MM-dd} bis {standardEnde:yyyy-MM-dd}) " +
                $"statt des angeforderten Zeitraums {von:yyyy-MM-dd} bis {bis:yyyy-MM-dd} — From/To vermutlich ignoriert; der bisherige Bestand bleibt.");
    }
}

/// <summary>
/// Stündlicher Abruf des Raumplans (INT-009). Kapselung und Fehler-Isolation über
/// <see cref="PeriodicJobService"/> (API-N-110), Ergebnis im Health-Check (API-F-260).
/// </summary>
public sealed class RaumplanAbrufJob(
    IServiceScopeFactory scopes,
    JobStatusRegistry registry,
    ILogger<RaumplanAbrufJob> logger)
    : PeriodicJobService(JobName, TimeSpan.FromHours(1), registry, logger)
{
    public const string JobName = "raumplan-abruf";

    protected override async Task RunOnceAsync(CancellationToken cancellationToken)
    {
        using var scope = scopes.CreateScope();
        await scope.ServiceProvider.GetRequiredService<RaumplanAbruf>().AusfuehrenAsync(cancellationToken);
    }
}
