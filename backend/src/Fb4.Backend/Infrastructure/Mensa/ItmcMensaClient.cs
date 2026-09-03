using System.Globalization;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using Fb4.Backend.Domain;

namespace Fb4.Backend.Infrastructure.Mensa;

/// <summary>
/// HTTP-Anbindung an die Mensa-API des ITMC (INT-015). Endpunkt- und Feldnamen
/// stehen ausschliesslich im Schnittstellenregister (<c>platform/integrations.md</c>
/// INT-015). Nur die tatsaechlich ausgewerteten Felder werden abgebildet —
/// strukturelle Abweichung schlaegt sichtbar fehl (QA-N-070), statt still
/// weiterverarbeitet zu werden (SEC-F-060). Timeout/Retry/Circuit-Breaker liefert
/// der <c>AddStandardResilienceHandler</c> (API-N-120, ADR 0015).
/// </summary>
public sealed class ItmcMensaClient(HttpClient http)
{
    // ---------------------------------------------------------------- Rohschema (INT-015)
    public sealed record ZweiSprachig(
        [property: JsonPropertyName("de")] string? De,
        [property: JsonPropertyName("en")] string? En);

    public sealed record PreisDto(
        [property: JsonPropertyName("student")] string? Student,
        [property: JsonPropertyName("staff")] string? Staff,
        [property: JsonPropertyName("guest")] string? Guest);

    public sealed record GerichtDto(
        [property: JsonPropertyName("title")] ZweiSprachig? Title,
        [property: JsonPropertyName("type")] IReadOnlyList<string>? Type,
        [property: JsonPropertyName("additives")] IReadOnlyList<string>? Additives,
        [property: JsonPropertyName("price")] PreisDto? Price,
        [property: JsonPropertyName("counter")] string? Counter,
        [property: JsonPropertyName("counterNames")] ZweiSprachig? CounterNames,
        [property: JsonPropertyName("position")] int Position);

    public sealed record VerzeichnisDto(
        [property: JsonPropertyName("id")] string? Id,
        [property: JsonPropertyName("name")] ZweiSprachig? Name);

    // ---------------------------------------------------------------- Aufrufe
    public Task<IReadOnlyList<GerichtDto>> TagAsync(string quelleId, DateOnly datum, CancellationToken ct) =>
        HolenAsync<IReadOnlyList<GerichtDto>>($"canteens/{quelleId}/{datum:yyyy-MM-dd}", ct);

    /// <summary>Alle vorliegenden Tage einer Mensa: Abbildung Datum → Gerichtsliste.</summary>
    public Task<IReadOnlyDictionary<string, List<GerichtDto>>> AlleTageAsync(string quelleId, CancellationToken ct) =>
        HolenAsync<IReadOnlyDictionary<string, List<GerichtDto>>>($"canteens/{quelleId}", ct);

    public Task<IReadOnlyList<VerzeichnisDto>> TypenAsync(CancellationToken ct) =>
        HolenAsync<IReadOnlyList<VerzeichnisDto>>("types", ct);

    public Task<IReadOnlyList<VerzeichnisDto>> AdditiveAsync(CancellationToken ct) =>
        HolenAsync<IReadOnlyList<VerzeichnisDto>>("additives", ct);

    async Task<T> HolenAsync<T>(string pfad, CancellationToken ct)
    {
        try
        {
            return await http.GetFromJsonAsync<T>(pfad, ct)
                   ?? throw Strukturbruch($"{pfad}: leerer Rumpf");
        }
        catch (JsonException ex)
        {
            throw Strukturbruch($"{pfad}: {ex.Message}");
        }
    }

    // ---------------------------------------------------------------- Abbildung
    /// <summary>Preis-String der Quelle → Dezimalzahl in Euro. Nicht parsebar → null (Vertrag laesst null zu).</summary>
    public static decimal? PreisParsen(string? roh)
    {
        if (string.IsNullOrWhiteSpace(roh)) return null;
        // Alles bis auf Ziffern, Komma, Punkt, Minus entfernen (Waehrungszeichen,
        // geschuetztes/reguläres Leerzeichen).
        var s = new string(roh.Where(c => char.IsDigit(c) || c is ',' or '.' or '-').ToArray());
        return decimal.TryParse(s, NumberStyles.Number, CultureInfo.GetCultureInfo("de-DE"), out var v)
            ? v
            : null;
    }

    /// <summary>
    /// Bildet ein INT-015-Gericht auf den Zwischenspeicher ab. Ein Gericht ohne
    /// deutschsprachigen Titel gilt als struktureller Bruch (QA-N-070).
    /// </summary>
    public static GerichtCache Abbilden(GerichtDto d)
    {
        var titelDe = d.Title?.De?.Trim();
        if (string.IsNullOrEmpty(titelDe))
            throw Strukturbruch("Gericht ohne title.de");

        var titelEn = d.Title?.En?.Trim();
        return new GerichtCache
        {
            Schluessel = GerichtNormalisierung.Normalisieren(titelDe),
            KategorieDe = d.CounterNames?.De?.Trim() ?? d.Counter?.Trim() ?? "",
            KategorieEn = d.CounterNames?.En?.Trim() ?? d.Counter?.Trim() ?? "",
            BezeichnungDe = GerichtNormalisierung.OhneZusatzstoffKlammern(titelDe),
            BezeichnungEn = GerichtNormalisierung.OhneZusatzstoffKlammern(
                string.IsNullOrEmpty(titelEn) ? titelDe : titelEn),
            PreisStudierende = PreisParsen(d.Price?.Student),
            PreisMitarbeitende = PreisParsen(d.Price?.Staff),
            PreisGaeste = PreisParsen(d.Price?.Guest),
            Zusatzstoffe = d.Additives ?? [],
            Kennzeichnungen = d.Type ?? [],
            Position = d.Position,
        };
    }

    public static IReadOnlyList<MensaVerzeichnisEintrag> VerzeichnisAbbilden(
        string art, IReadOnlyList<VerzeichnisDto> roh) => roh
        .Where(e => !string.IsNullOrEmpty(e.Id))
        .Select(e => new MensaVerzeichnisEintrag
        {
            Art = art,
            QuelleId = e.Id!,
            BezeichnungDe = e.Name?.De?.Trim() ?? e.Id!,
            BezeichnungEn = e.Name?.En?.Trim() ?? e.Name?.De?.Trim() ?? e.Id!,
        })
        .ToList();

    internal static ApiException Strukturbruch(string detail) => new(
        502, "int015_strukturbruch",
        "Unerwartete Antwortstruktur der Mensa-API (INT-015).", detail);
}
