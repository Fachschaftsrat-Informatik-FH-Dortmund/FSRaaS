using System.Globalization;
using System.Text.Json;

namespace Fb4.Backend.Infrastructure.Raumplan;

/// <summary>Ein Einzeltermin aus <c>Room/*/AllEvents</c>, auf die verwendeten Felder reduziert.</summary>
public sealed record FbwsTermin(
    string? Id,
    string Name,
    string RoomId,
    string EventType,
    long? TimestampBegin,
    long? TimestampEnd,
    string Weekday,
    string? TimeBegin,
    string? TimeEnd,
    string? StudentSet,
    string? CourseOfStudy,
    string? LecturerId,
    string? Note);

/// <summary>
/// Liest INT-009. Der Dienst liefert Zahlen mal als Zahl, mal als Zeichenkette
/// (<c>timeBegin</c>, <c>interval</c>); deshalb wird elementweise gelesen statt
/// über ein starres DTO. Ein Antwortrumpf, der keine JSON-Liste ist, endet als
/// Ausnahme — nie als leerer Bestand (SEC-F-060).
/// </summary>
public class FbwsRaumplanClient(HttpClient http)
{
    public async Task<IReadOnlyList<string>> RaeumeAsync(CancellationToken ct)
    {
        using var doc = await LadenAsync("Room/?Accept=application/json", ct);
        return doc.RootElement.EnumerateArray()
            .Select(e => e.ValueKind == JsonValueKind.String ? e.GetString() : Text(e, "roomId") ?? Text(e, "id"))
            .Where(r => !string.IsNullOrWhiteSpace(r))
            .Select(r => r!.Trim())
            .ToList();
    }

    /// <summary>
    /// Alle Einzeltermine im Zeitraum. <c>From</c>/<c>To</c> werden ausdrücklich
    /// gesetzt (groß geschrieben, Unix-Sekunden) — ohne sie liefert der Dienst nur
    /// sieben Tage ab dem Folgetag (INT-009).
    /// </summary>
    public async Task<IReadOnlyList<FbwsTermin>> AlleTermineAsync(DateTimeOffset von, DateTimeOffset bis, CancellationToken ct)
    {
        var pfad = $"Room/*/AllEvents?Accept=application/json&From={von.ToUnixTimeSeconds()}&To={bis.ToUnixTimeSeconds()}";
        using var doc = await LadenAsync(pfad, ct);
        return doc.RootElement.EnumerateArray().Select(e => new FbwsTermin(
            Id: Text(e, "id"),
            Name: Text(e, "name") ?? "",
            RoomId: Text(e, "roomId") ?? "",
            EventType: Text(e, "eventType") ?? "",
            TimestampBegin: Zahl(e, "timestampBegin"),
            TimestampEnd: Zahl(e, "timestampEnd"),
            Weekday: Text(e, "weekday") ?? "",
            TimeBegin: Text(e, "timeBegin"),
            TimeEnd: Text(e, "timeEnd"),
            StudentSet: Text(e, "studentSet"),
            CourseOfStudy: Text(e, "courseOfStudy"),
            LecturerId: Text(e, "lecturerId"),
            Note: Text(e, "note"))).ToList();
    }

    async Task<JsonDocument> LadenAsync(string pfad, CancellationToken ct)
    {
        using var antwort = await http.GetAsync(pfad, ct);
        antwort.EnsureSuccessStatusCode();
        await using var strom = await antwort.Content.ReadAsStreamAsync(ct);
        var doc = await JsonDocument.ParseAsync(strom, cancellationToken: ct);
        if (doc.RootElement.ValueKind != JsonValueKind.Array)
        {
            doc.Dispose();
            throw new InvalidDataException($"INT-009 {pfad.Split('?')[0]}: Antwort ist keine JSON-Liste.");
        }
        return doc;
    }

    static string? Text(JsonElement e, string feld)
    {
        if (e.ValueKind != JsonValueKind.Object || !e.TryGetProperty(feld, out var w)) return null;
        var s = w.ValueKind switch
        {
            JsonValueKind.String => w.GetString(),
            JsonValueKind.Number => w.GetRawText(),
            _ => null,
        };
        return string.IsNullOrWhiteSpace(s) ? null : s;
    }

    static long? Zahl(JsonElement e, string feld)
    {
        var s = Text(e, feld);
        return long.TryParse(s, NumberStyles.Integer, CultureInfo.InvariantCulture, out var n) ? n : null;
    }
}
