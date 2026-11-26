using Fb4.Backend.Domain;
using Microsoft.EntityFrameworkCore;

namespace Fb4.Backend.Infrastructure.Raumplan;

/// <summary>
/// Leitet den Prüfungsbestand aus dem Raumplan (INT-009) ab — Requirements
/// „Ableitung des Prüfungsbestands aus dem Raumplan" und „Allgemeine
/// Aktualisierungsmeldung bei geändertem Prüfungsplan" (Capability
/// <c>backend-and-api</c>). Eigener Abruf über 183 Tage statt des 28-Tage-
/// Zwischenspeichers: Prüfungen stehen im Median 55 Tage vorher im Raumplan, die
/// Anmeldefrist endet rund sieben Wochen vorher (INT-009-Spike, 2026-09-07).
/// Für die Antwort gelten dieselben Ersatzregeln wie für den Zwischenspeicher.
/// </summary>
public class PruefungsbestandAbruf(
    Fb4DbContext db,
    FbwsRaumplanClient quelle,
    TimeProvider zeit,
    ILogger<PruefungsbestandAbruf> logger)
{
    public static readonly TimeSpan Zeitraum = TimeSpan.FromDays(183);

    /// <summary>
    /// Zuletzt gemessene Abdeckung des offiziellen Prüfungsplans durch den Raumplan:
    /// 64 von 91 Modulen, SoSe 2026 (INT-009-Spike, 2026-09-07). Bewusst eine
    /// Konstante mit Quelle statt einer Konfiguration, die niemand nachpflegt —
    /// eine Nachmessung ist eine Codeänderung mit Spec-Bezug.
    /// </summary>
    public const decimal AbdeckungAnteil = 0.70m;

    public static readonly DateOnly AbdeckungGemessenAm = new(2026, 9, 7);

    public async Task AusfuehrenAsync(CancellationToken ct)
    {
        var jetzt = zeit.GetUtcNow();
        var (von, bis) = RaumplanAbruf.ZeitraumAb(jetzt, Zeitraum);
        var stand = await db.PruefungsbestandStand.FindAsync([PruefungsbestandStand.EinzigeId], ct);
        if (stand is null)
        {
            stand = new PruefungsbestandStand();
            db.PruefungsbestandStand.Add(stand);
        }
        stand.LetzterVersuchAm = jetzt;
        stand.LetzterVersuchErfolgreich = false;

        try
        {
            var termine = await quelle.AlleTermineAsync(von, bis, ct);
            var gueltig = MitZeitangabe(termine, von, bis);
            var alt = await db.Pruefungstermine.ToListAsync(ct);
            PruefeAbdeckung(gueltig, alt.Count > 0, von, bis);

            var neu = Ableiten(gueltig);

            if (alt.Count > 0 && neu.Count == 0)
                // Formal korrekt nach dem Prüfungszeitraum, aber auch das Bild einer
                // Namensänderung beim Fachbereich — nicht still übernehmen (SEC-F-060).
                logger.LogWarning(
                    "Prüfungsbestand fällt von {Alt} auf 0 Prüfungen, obwohl INT-009 {Termine} Termine lieferte — " +
                    "Namensmuster „Prüfung …\" prüfen, falls der Prüfungszeitraum nicht gerade vorüber ist.",
                    alt.Count, gueltig.Count);

            if (stand.AbgerufenAm is null || Weicht(alt, neu, von))
            {
                stand.GeaendertAm = jetzt;
                logger.LogInformation("Prüfungsbestand geändert: {Anzahl} Prüfungen", neu.Count);
            }

            db.Pruefungstermine.RemoveRange(alt);
            db.Pruefungstermine.AddRange(neu);
            stand.AbgerufenAm = jetzt;
            stand.Von = von;
            stand.Bis = bis;
            stand.LetzterVersuchErfolgreich = true;
            await db.SaveChangesAsync(ct);
            logger.LogInformation(
                "Prüfungsbestand abgeleitet: {Pruefungen} Prüfungen aus {Termine} Raumplan-Terminen ({Von:o} bis {Bis:o})",
                neu.Count, termine.Count, von, bis);
        }
        catch
        {
            // Bestand bleibt unverändert; nur der gescheiterte Versuch wird vermerkt.
            // Die Ausnahme selbst protokolliert der PeriodicJobService (SEC-F-060).
            foreach (var e in db.ChangeTracker.Entries().ToList())
                if (e.Entity is not PruefungsbestandStand) e.State = EntityState.Detached;
            await db.SaveChangesAsync(CancellationToken.None);
            throw;
        }
    }

    List<(FbwsTermin Termin, DateTimeOffset Beginn, DateTimeOffset Ende)> MitZeitangabe(
        IReadOnlyList<FbwsTermin> termine, DateTimeOffset von, DateTimeOffset bis)
    {
        var liste = new List<(FbwsTermin, DateTimeOffset, DateTimeOffset)>();
        foreach (var t in termine)
        {
            if (t.TimestampBegin is not > 0 || t.TimestampEnd is not > 0 || t.TimestampEnd <= t.TimestampBegin)
            {
                logger.LogWarning(
                    "Raumplan-Termin ohne auswertbare Zeitangabe übersprungen (Prüfungsabruf): Id {Id}, Raum {Raum}, Beginn {Beginn}, Ende {Ende}",
                    t.Id, t.RoomId, t.TimestampBegin, t.TimestampEnd);
                continue;
            }
            var beginn = DateTimeOffset.FromUnixTimeSeconds(t.TimestampBegin.Value);
            var ende = DateTimeOffset.FromUnixTimeSeconds(t.TimestampEnd!.Value);
            if (ende <= von || beginn >= bis)
            {
                logger.LogWarning("Raumplan-Termin außerhalb des angeforderten Zeitraums verworfen (Prüfungsabruf): Id {Id}, Beginn {Beginn:o}", t.Id, beginn);
                continue;
            }
            liste.Add((t, beginn, ende));
        }
        return liste;
    }

    static void PruefeAbdeckung(
        List<(FbwsTermin Termin, DateTimeOffset Beginn, DateTimeOffset Ende)> termine,
        bool bestandGefuellt, DateTimeOffset von, DateTimeOffset bis)
    {
        if (termine.Count == 0)
        {
            if (bestandGefuellt)
                throw new InvalidDataException(
                    "INT-009 lieferte keinen Termin, der Prüfungsbestand führt aber Prüfungen; der bisherige Bestand bleibt.");
            return;
        }
        if (RaumplanAbruf.NurStandardfenster(termine.Select(t => t.Beginn).ToList(), von, bis) is { } meldung)
            throw new InvalidDataException(meldung);
    }

    /// <summary>
    /// Erkennt Prüfungen und führt Einträge mit gleichem Namen, Beginn und Ende zu
    /// einem Termin mit allen Räumen zusammen. Nicht auflösbare Namen bleiben als
    /// Prüfung ohne Modulbezug und werden je Abruf in einer Warnung gesammelt.
    /// </summary>
    List<PruefungsterminEintrag> Ableiten(List<(FbwsTermin Termin, DateTimeOffset Beginn, DateTimeOffset Ende)> termine)
    {
        var jeSchluessel = new Dictionary<(string, DateTimeOffset, DateTimeOffset), PruefungsterminEintrag>();
        var ohneModulbezug = new SortedSet<string>(StringComparer.Ordinal);

        foreach (var (t, beginn, ende) in termine)
        {
            if (PruefungsErkennung.Erkenne(t.Name) is not { } erkannt) continue;
            var name = PruefungsErkennung.Normalisiert(t.Name);
            if (erkannt.Modulnummer is null) ohneModulbezug.Add(name);

            var schluessel = (name, beginn, ende);
            if (!jeSchluessel.TryGetValue(schluessel, out var eintrag))
            {
                eintrag = new PruefungsterminEintrag
                {
                    Name = name,
                    Modulnummer = erkannt.Modulnummer,
                    Bezeichnung = erkannt.Bezeichnung,
                    Beginn = beginn,
                    Ende = ende,
                };
                jeSchluessel.Add(schluessel, eintrag);
            }
            foreach (var raum in RaumAufloesung.RaeumeFuer(t.RoomId, t.Name))
                if (raum != RaumAufloesung.Pseudoraum && !eintrag.Raeume.Contains(raum))
                    eintrag.Raeume.Add(raum);
        }

        if (ohneModulbezug.Count > 0)
            logger.LogWarning(
                "{Anzahl} Prüfungseinträge ohne auflösbare Modulnummer, als Prüfung ohne Modulbezug geführt: {Namen}",
                ohneModulbezug.Count, string.Join(" | ", ohneModulbezug));

        foreach (var e in jeSchluessel.Values) e.Raeume.Sort(StringComparer.Ordinal);
        return jeSchluessel.Values.OrderBy(e => e.Beginn).ThenBy(e => e.Name, StringComparer.Ordinal).ToList();
    }

    /// <summary>
    /// Weicht der neue Bestand vom alten ab? Prüfungen, die vor Beginn des neuen
    /// Zeitraums endeten, fallen nur durch Zeitablauf heraus und zählen nicht.
    /// </summary>
    static bool Weicht(List<PruefungsterminEintrag> alt, List<PruefungsterminEintrag> neu, DateTimeOffset von)
    {
        var altRelevant = alt.Where(e => e.Ende > von).Select(Fingerabdruck).ToHashSet(StringComparer.Ordinal);
        var neuSet = neu.Select(Fingerabdruck).ToHashSet(StringComparer.Ordinal);
        return !altRelevant.SetEquals(neuSet);
    }

    static string Fingerabdruck(PruefungsterminEintrag e) => string.Join('\u001f',
        e.Modulnummer ?? "", e.Bezeichnung, e.Beginn.ToUnixTimeSeconds(), e.Ende.ToUnixTimeSeconds(),
        string.Join(',', e.Raeume.Order(StringComparer.Ordinal)));
}

/// <summary>
/// Ableitung des Prüfungsbestands alle sechs Stunden. Kapselung und Fehler-Isolation
/// über <see cref="PeriodicJobService"/> (API-N-110), Ergebnis im Health-Check (API-F-260).
/// </summary>
public sealed class PruefungsbestandAbrufJob(
    IServiceScopeFactory scopes,
    JobStatusRegistry registry,
    ILogger<PruefungsbestandAbrufJob> logger)
    : PeriodicJobService(JobName, TimeSpan.FromHours(6), registry, logger)
{
    public const string JobName = "pruefungsbestand-abruf";

    protected override async Task RunOnceAsync(CancellationToken cancellationToken)
    {
        using var scope = scopes.CreateScope();
        await scope.ServiceProvider.GetRequiredService<PruefungsbestandAbruf>().AusfuehrenAsync(cancellationToken);
    }
}
