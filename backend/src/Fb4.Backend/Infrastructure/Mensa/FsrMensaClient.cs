using System.Globalization;
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using Fb4.Backend.Contract.Generated;

namespace Fb4.Backend.Infrastructure.Mensa;

/// <summary>
/// HTTP-Anbindung an die Mensa-API des FSR (INT-020, <c>mensa.fb4.it</c>). Loest
/// <c>ItmcMensaClient</c> (INT-015) ab. Endpunkt- und Feldnamen stehen
/// ausschliesslich im Schnittstellenregister (<c>openspec/specs/integrations/spec.md</c>
/// INT-020); hier stehen sie nur als Abbildung der tatsaechlich ausgewerteten
/// Felder. Strukturelle Abweichung schlaegt sichtbar fehl (Capability
/// <c>quality-and-testing</c>), statt still weiterverarbeitet zu werden
/// (SEC-F-060). Timeout/Retry/Circuit-Breaker liefert der
/// <c>AddStandardResilienceHandler</c> (API-N-120, ADR 0015); die von der Quelle
/// gesetzte Gueltigkeitsdauer beachtet der <see cref="AntwortGueltigkeitHandler"/>.
/// </summary>
public sealed class FsrMensaClient(HttpClient http)
{
    // ---------------------------------------------------------------- Rohschema (INT-020)
    // Nullbar abgebildet, damit ein fehlendes Pflichtfeld nicht als Standardwert
    // durchrutscht, sondern in Pruefen() sichtbar fehlschlaegt.

    public sealed record PreiseDto(
        [property: JsonPropertyName("student")] decimal? Student,
        [property: JsonPropertyName("staff")] decimal? Staff,
        [property: JsonPropertyName("guest")] decimal? Guest);

    public sealed record GerichtDto(
        [property: JsonPropertyName("id")] int? Id,
        [property: JsonPropertyName("name")] string? Name,
        [property: JsonPropertyName("nameEn")] string? NameEn,
        [property: JsonPropertyName("lines")] IReadOnlyList<string>? Lines,
        [property: JsonPropertyName("linesEn")] IReadOnlyList<string>? LinesEn,
        [property: JsonPropertyName("prices")] PreiseDto? Prices,
        [property: JsonPropertyName("tags")] IReadOnlyList<string>? Tags,
        [property: JsonPropertyName("additives")] IReadOnlyList<string>? Additives,
        [property: JsonPropertyName("co2Class")] string? Co2Class);

    public sealed record KategorieDto(
        [property: JsonPropertyName("id")] int? Id,
        [property: JsonPropertyName("name")] string? Name,
        [property: JsonPropertyName("meals")] IReadOnlyList<GerichtDto>? Meals);

    /// <summary>Antwort von <c>GET /canteens/{id}/menu/{date}</c>.</summary>
    public sealed record TagesplanDto(
        [property: JsonPropertyName("date")] string? Date,
        [property: JsonPropertyName("categories")] IReadOnlyList<KategorieDto>? Categories);

    public sealed record OeffnungstagDto(
        [property: JsonPropertyName("date")] string? Date,
        [property: JsonPropertyName("weekday")] string? Weekday,
        [property: JsonPropertyName("isOpen")] bool? IsOpen,
        [property: JsonPropertyName("open")] string? Open,
        [property: JsonPropertyName("close")] string? Close,
        [property: JsonPropertyName("servingOpen")] string? ServingOpen,
        [property: JsonPropertyName("servingClose")] string? ServingClose,
        [property: JsonPropertyName("closedReason")] string? ClosedReason);

    public sealed record HeuteDto(
        [property: JsonPropertyName("date")] string? Date,
        [property: JsonPropertyName("isOpen")] bool? IsOpen,
        [property: JsonPropertyName("reason")] string? Reason);

    public sealed record SchliesstagDto(
        [property: JsonPropertyName("label")] string? Label,
        [property: JsonPropertyName("date")] string? Date,
        [property: JsonPropertyName("from")] string? From,
        [property: JsonPropertyName("to")] string? To,
        [property: JsonPropertyName("isHoliday")] bool? IsHoliday,
        [property: JsonPropertyName("scope")] string? Scope);

    /// <summary>Antwort von <c>GET /canteens/{id}/hours</c>.</summary>
    public sealed record OeffnungszeitenDto(
        [property: JsonPropertyName("today")] HeuteDto? Today,
        [property: JsonPropertyName("forecast")] IReadOnlyList<OeffnungstagDto>? Forecast,
        [property: JsonPropertyName("week")] IReadOnlyList<OeffnungstagDto>? Week,
        [property: JsonPropertyName("closures")] IReadOnlyList<SchliesstagDto>? Closures);

    /// <summary>
    /// Eintrag der Legende. <c>labelEn</c> ist seit der Erweiterung der Quelle vom
    /// 2026-09-24 vorhanden und traegt die englische Fassung; massgeblich bleibt
    /// <c>label</c>. Fehlt <c>labelEn</c>, tritt <c>label</c> an seine Stelle
    /// (INT-020, Register).
    /// </summary>
    public sealed record LegendeEintragDto(
        [property: JsonPropertyName("code")] string? Code,
        [property: JsonPropertyName("label")] string? Label,
        [property: JsonPropertyName("labelEn")] string? LabelEn);

    /// <summary>Antwort von <c>GET /legend</c>.</summary>
    public sealed record LegendeDto(
        [property: JsonPropertyName("tags")] IReadOnlyList<LegendeEintragDto>? Tags,
        [property: JsonPropertyName("additives")] IReadOnlyList<LegendeEintragDto>? Additives,
        [property: JsonPropertyName("allergens")] IReadOnlyList<LegendeEintragDto>? Allergens,
        [property: JsonPropertyName("climate")] IReadOnlyList<LegendeEintragDto>? Climate);

    public sealed record CacheGruppeDto(
        [property: JsonPropertyName("updated")] DateTimeOffset? Updated,
        [property: JsonPropertyName("ageSeconds")] long? AgeSeconds);

    public sealed record CacheDto(
        [property: JsonPropertyName("canteens")] CacheGruppeDto? Canteens,
        [property: JsonPropertyName("menus")] CacheGruppeDto? Menus);

    /// <summary>
    /// Antwort von <c>GET /health</c>. Traegt als einzige den gemeldeten Stand der
    /// Speiseplan-Daten: Speiseplan- und Oeffnungsantworten selbst fuehren kein
    /// <c>updated</c> (OpenAPI 0.2.0, geprueft 2026-09-23).
    /// </summary>
    public sealed record ZustandDto(
        [property: JsonPropertyName("status")] string? Status,
        [property: JsonPropertyName("cache")] CacheDto? Cache);

    // ---------------------------------------------------------------- Aufrufe
    public Task<TagesplanDto> TagAsync(string quelleId, DateOnly datum, CancellationToken ct) =>
        HolenAsync<TagesplanDto>(
            $"canteens/{quelleId}/menu/{datum.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture)}", ct);

    public Task<OeffnungszeitenDto> OeffnungszeitenAsync(string quelleId, CancellationToken ct) =>
        HolenAsync<OeffnungszeitenDto>($"canteens/{quelleId}/hours", ct);

    public Task<LegendeDto> LegendeAsync(CancellationToken ct) =>
        HolenAsync<LegendeDto>("legend", ct);

    public Task<ZustandDto> ZustandAsync(CancellationToken ct) =>
        HolenAsync<ZustandDto>("health", ct);

    /// <summary>
    /// Ein Abruf gegen INT-020. Jeder Fehlausgang endet als sichtbarer Fehler
    /// (Requirement „Sichtbarer Fehler bei nicht erreichbarer Mensa-Schnittstelle"):
    /// nie eine Leerantwort als gueltiges Ergebnis. Allein 404 wird durchgereicht,
    /// damit eine unbekannte Kennung nicht als Stoerung der Quelle erscheint.
    /// </summary>
    async Task<T> HolenAsync<T>(string pfad, CancellationToken ct)
    {
        HttpResponseMessage antwort;
        try
        {
            antwort = await http.GetAsync(pfad, ct);
        }
        catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException && !ct.IsCancellationRequested)
        {
            throw NichtErreichbar($"{pfad}: {ex.Message}");
        }

        using (antwort)
        {
            if (antwort.StatusCode == HttpStatusCode.NotFound)
                throw ApiException.NotFound("mensa_unbekannt", "Die Mensa-Schnittstelle kennt diese Kennung nicht.");

            if (!antwort.IsSuccessStatusCode)
                throw NichtErreichbar($"{pfad}: HTTP {(int)antwort.StatusCode}");

            try
            {
                return await antwort.Content.ReadFromJsonAsync<T>(ct)
                       ?? throw Strukturbruch($"{pfad}: leerer Rumpf");
            }
            catch (JsonException ex)
            {
                throw Strukturbruch($"{pfad}: {ex.Message}");
            }
        }
    }

    // ------------------------------------------------------- Strukturpruefung
    // Capability `quality-and-testing`: fehlt ein Pflichtfeld aus Meal, Day oder
    // Hours oder wechselt es seinen Typ, schlaegt der Abruf fehl, statt mit einem
    // Standardwert weiterzulaufen. Typwechsel faengt bereits die Deserialisierung
    // (JsonException -> Strukturbruch); Fehlen faengt diese Pruefung.

    /// <summary>Pflichtfelder von <c>Day</c>/<c>DayResponse</c> und der darin enthaltenen <c>Meal</c>.</summary>
    public static TagesplanDto Pruefen(TagesplanDto d)
    {
        if (string.IsNullOrWhiteSpace(d.Date)) throw Strukturbruch("Tagesplan ohne date");
        if (d.Categories is null) throw Strukturbruch("Tagesplan ohne categories");
        foreach (var k in d.Categories)
        {
            if (k.Name is null) throw Strukturbruch("Kategorie ohne name");
            if (k.Meals is null) throw Strukturbruch("Kategorie ohne meals");
            foreach (var g in k.Meals) Pruefen(g);
        }
        return d;
    }

    /// <summary>Pflichtfelder von <c>Meal</c>: id, name, lines, prices, tags, additives.</summary>
    public static GerichtDto Pruefen(GerichtDto g)
    {
        if (g.Id is null) throw Strukturbruch("Gericht ohne id");
        if (string.IsNullOrWhiteSpace(g.Name)) throw Strukturbruch("Gericht ohne name");
        if (g.Lines is null) throw Strukturbruch("Gericht ohne lines");
        if (g.Prices is null) throw Strukturbruch("Gericht ohne prices");
        if (g.Tags is null) throw Strukturbruch("Gericht ohne tags");
        if (g.Additives is null) throw Strukturbruch("Gericht ohne additives");
        return g;
    }

    /// <summary>Pflichtfelder von <c>Hours</c>: today mit date und isOpen.</summary>
    public static OeffnungszeitenDto Pruefen(OeffnungszeitenDto h)
    {
        if (h.Today is null) throw Strukturbruch("Öffnungsangaben ohne today");
        if (string.IsNullOrWhiteSpace(h.Today.Date)) throw Strukturbruch("today ohne date");
        if (h.Today.IsOpen is null) throw Strukturbruch("today ohne isOpen");
        foreach (var t in h.Forecast ?? []) PruefenTag(t, "forecast", datumPflicht: true);
        foreach (var t in h.Week ?? []) PruefenTag(t, "week", datumPflicht: false);
        foreach (var s in h.Closures ?? [])
        {
            if (string.IsNullOrWhiteSpace(s.Label)) throw Strukturbruch("Schließtag ohne label");
            if (s.IsHoliday is null) throw Strukturbruch("Schließtag ohne isHoliday");
            if (string.IsNullOrWhiteSpace(s.Scope)) throw Strukturbruch("Schließtag ohne scope");
        }
        return h;
    }

    static void PruefenTag(OeffnungstagDto t, string wo, bool datumPflicht)
    {
        if (t.IsOpen is null) throw Strukturbruch($"{wo}-Eintrag ohne isOpen");
        if (string.IsNullOrWhiteSpace(t.Weekday)) throw Strukturbruch($"{wo}-Eintrag ohne weekday");
        if (datumPflicht && string.IsNullOrWhiteSpace(t.Date)) throw Strukturbruch($"{wo}-Eintrag ohne date");
    }

    // ---------------------------------------------------------------- Abbildung
    /// <summary>
    /// Bildet ein INT-020-Gericht auf die Vertragsform ab. Der Schluessel entsteht
    /// aus den mit <c> | </c> zusammengefuegten Komponenten und ist damit
    /// zeichengleich mit dem Schluessel aus dem INT-015-Rohtitel — bestehende
    /// Bewertungen, Lieblingsgerichte und Fotos bleiben verbunden (Capability
    /// <c>canteen-ratings</c>). Das Feld <c>name</c> allein waere untauglich: es
    /// traegt nur die erste Komponente.
    /// </summary>
    public static Gericht Abbilden(GerichtDto roh, string kategorie, string sprache)
    {
        var g = Pruefen(roh);

        // Sprachrueckfall: fehlt die englische Fassung, tritt die deutsche ein,
        // statt die Bezeichnung leer zu lassen (SEC-F-060, keine stillen Fehler).
        // Am 2026-09-22 fehlte nameEn/linesEn bei 10 von 73 Gerichten.
        var zeilen = sprache == "en" && g.LinesEn is { Count: > 0 } ? g.LinesEn : g.Lines!;

        // Code-Bereinigung bleibt, obwohl die Quelle sie zusagt: am 2026-09-22 trugen
        // 5 von 73 englischen Komponentenzeilen noch Klammern, darunter den in der
        // Legende nicht vorhandenen Code `281` (design.md).
        var komponenten = zeilen
            .Select(GerichtNormalisierung.OhneZusatzstoffKlammern)
            .Where(z => !string.IsNullOrEmpty(z))
            .ToList();

        return new Gericht
        {
            Schluessel = GerichtNormalisierung.Normalisieren(Zusammenfuegen(g.Lines!)),
            Kategorie = kategorie,
            Bezeichnung = string.Join(" | ", komponenten),
            Komponenten = komponenten,
            PreisStudierende = g.Prices!.Student,
            PreisMitarbeitende = g.Prices.Staff,
            PreisGaeste = g.Prices.Guest,
            Zusatzstoffe = g.Additives!,
            Allergene = [],
            Co2Klasse = string.IsNullOrWhiteSpace(g.Co2Class) ? null : g.Co2Class,
            Kennzeichnungen = g.Tags!,
        };
    }

    /// <summary>
    /// Komponenten zum Rohtitel der abgeloesten Quelle zusammenfuegen — Eingang der
    /// unveraenderten <see cref="GerichtNormalisierung"/>.
    /// </summary>
    public static string Zusammenfuegen(IEnumerable<string> zeilen) => string.Join(" | ", zeilen);

    internal static ApiException Strukturbruch(string detail) => new(
        502, "int020_strukturbruch",
        "Unerwartete Antwortstruktur der Mensa-Schnittstelle (INT-020).", detail);

    internal static ApiException NichtErreichbar(string detail) => new(
        502, "int020_nicht_erreichbar",
        "Die Mensa-Schnittstelle (INT-020) ist nicht erreichbar.", detail);
}
