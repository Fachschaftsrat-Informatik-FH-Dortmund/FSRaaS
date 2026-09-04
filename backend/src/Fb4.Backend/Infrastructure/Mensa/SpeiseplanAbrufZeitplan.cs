using Microsoft.Extensions.Configuration;

namespace Fb4.Backend.Infrastructure.Mensa;

/// <summary>
/// Zeitplan für die Auffrischung des Speiseplan-Zwischenspeichers (API-F-076,
/// MENSA-N-020). Statt eines starren Intervalls ab Prozessstart liegen die Läufe
/// an festen Ortszeit-Punkten: vor der morgendlichen und vor der mittäglichen
/// studentischen Nutzungsspitze sowie zeitnah nach dem Ende des Mensabetriebs
/// (damit eine kurzfristig hinterlegte Folgetagsänderung am selben Abend fließt).
/// Ein Grundintervall deckelt zusätzlich die Lücke zwischen zwei Läufen.
///
/// Uhrzeiten und Zeitzone sind über <c>Mensa:AbrufZeiten</c> / <c>Mensa:Zeitzone</c>
/// konfigurierbar (SEC-F-050 sinngemäß — nicht fest verdrahtet); die Vorgaben hier
/// gelten, wenn nichts konfiguriert ist.
/// </summary>
public sealed class SpeiseplanAbrufZeitplan
{
    /// <summary>Vorgabe: kurz vor der Morgenspitze, kurz vor der Mittagsspitze, kurz nach Mensaschluss.</summary>
    public static readonly IReadOnlyList<TimeOnly> StandardLaeufe =
        [new(5, 30), new(10, 0), new(15, 30)];

    public static readonly TimeSpan StandardGrundintervall = TimeSpan.FromHours(6);
    public const string StandardZeitzone = "Europe/Berlin";

    readonly IReadOnlyList<TimeOnly> laeufe;
    readonly TimeZoneInfo zone;
    readonly TimeSpan grundintervall;

    public SpeiseplanAbrufZeitplan(IEnumerable<TimeOnly> laeufe, TimeZoneInfo zone, TimeSpan grundintervall)
    {
        var sortiert = laeufe.Distinct().OrderBy(t => t).ToList();
        this.laeufe = sortiert.Count > 0 ? sortiert : StandardLaeufe;
        this.zone = zone;
        this.grundintervall = grundintervall > TimeSpan.Zero ? grundintervall : StandardGrundintervall;
    }

    /// <summary>Baut den Zeitplan aus der Konfiguration; fehlende/ungültige Werte fallen auf die Vorgaben zurück.</summary>
    public static SpeiseplanAbrufZeitplan AusKonfiguration(IConfiguration konfiguration, ILogger logger)
    {
        var zeiten = konfiguration.GetSection("Mensa:AbrufZeiten").Get<string[]>() ?? [];
        var geparst = new List<TimeOnly>();
        foreach (var roh in zeiten)
        {
            if (TimeOnly.TryParse(roh, out var t)) geparst.Add(t);
            else logger.LogWarning("Ungültige Mensa:AbrufZeiten-Angabe {Wert} — wird übergangen", roh);
        }

        var zonenId = konfiguration["Mensa:Zeitzone"];
        var zone = ZeitzoneAufloesen(string.IsNullOrWhiteSpace(zonenId) ? StandardZeitzone : zonenId, logger);

        return new SpeiseplanAbrufZeitplan(
            geparst.Count > 0 ? geparst : StandardLaeufe, zone, StandardGrundintervall);
    }

    static TimeZoneInfo ZeitzoneAufloesen(string id, ILogger logger)
    {
        try
        {
            return TimeZoneInfo.FindSystemTimeZoneById(id);
        }
        catch (Exception ex) when (ex is TimeZoneNotFoundException or InvalidTimeZoneException)
        {
            logger.LogWarning(ex,
                "Zeitzone {Zone} nicht auflösbar — Speiseplan-Zeitplan nutzt die lokale Systemzeitzone", id);
            return TimeZoneInfo.Local;
        }
    }

    /// <summary>
    /// Wartezeit ab <paramref name="jetztUtc"/> bis zum nächsten geplanten Lauf,
    /// gedeckelt durch das Grundintervall. Reiner Rechenweg ohne Seiteneffekt.
    /// </summary>
    public TimeSpan BisZumNaechstenLauf(DateTimeOffset jetztUtc)
    {
        var lokalJetzt = TimeZoneInfo.ConvertTime(jetztUtc, zone).DateTime;
        var heute = DateOnly.FromDateTime(lokalJetzt);

        foreach (var tag in new[] { heute, heute.AddDays(1) })
        {
            foreach (var zeit in laeufe)
            {
                var kandidatLokal = DateTime.SpecifyKind(tag.ToDateTime(zeit), DateTimeKind.Unspecified);
                if (kandidatLokal <= lokalJetzt) continue;

                var kandidatUtc = TimeZoneInfo.ConvertTimeToUtc(kandidatLokal, zone);
                var bis = kandidatUtc - jetztUtc.UtcDateTime;
                return bis > TimeSpan.Zero && bis < grundintervall ? bis : grundintervall;
            }
        }

        return grundintervall;
    }
}
