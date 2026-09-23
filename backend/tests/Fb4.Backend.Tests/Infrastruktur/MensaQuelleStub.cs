using System.Net;
using System.Text;

namespace Fb4.Backend.Tests.Infrastruktur;

/// <summary>
/// Steht im Test an der Stelle der Mensa-Schnittstelle INT-020. Zaehlt die Abrufe
/// je Pfad — daran haengt der Nachweis, dass das Backend je Anfrage durchreicht
/// und die von der Quelle gesetzte Gueltigkeitsdauer beachtet.
///
/// <c>Cache-Control</c> ist standardmaessig <c>null</c>: ohne diese Kopfzeile haelt
/// der <c>AntwortGueltigkeitHandler</c> nichts fest, und die Tests beeinflussen
/// einander nicht. Der Test zur Gueltigkeitsdauer setzt sie ausdruecklich.
/// </summary>
public sealed class MensaQuelleStub : HttpMessageHandler
{
    readonly Dictionary<string, (HttpStatusCode Status, string Rumpf)> antworten = new(StringComparer.Ordinal);

    /// <summary>Abrufe je Pfad, seit dem letzten <see cref="Zuruecksetzen"/>.</summary>
    public Dictionary<string, int> Aufrufe { get; } = new(StringComparer.Ordinal);

    /// <summary>Gueltigkeitsdauer, die die Quelle auf ihre Antworten setzt.</summary>
    public string? CacheControl { get; set; }

    /// <summary>Wirft bei jedem Abruf — die Quelle ist nicht erreichbar.</summary>
    public bool NichtErreichbar { get; set; }

    public const string LegendeStandard = """
    {"tags":[{"code":"vegan","label":"Vegan"},{"code":"beef","label":"Rind"},
              {"code":"animal-welfare","label":"Artgerecht"},{"code":"climate-plate","label":"Klimateller"}],
     "additives":[{"code":"2","label":"mit Konservierungsstoff"},{"code":"4","label":"geschwärzt"}],
     "allergens":[{"code":"20a","label":"Weizen"},{"code":"20c","label":"Gerste"},
                  {"code":"26","label":"Sellerie"},{"code":"28","label":"Milch"}],
     "climate":[{"code":"A","label":"sehr gut"}]}
    """;

    public const string ZustandStandard = """
    {"status":"ok","canteens":15,"meals":73,
     "cache":{"canteens":{"updated":"2026-09-23T06:00:00Z","ageSeconds":120},
              "menus":{"updated":"2026-09-23T06:00:00Z","ageSeconds":120},
              "hours":{"canteens":15,"oldestAgeSeconds":120}}}
    """;

    public void Zuruecksetzen()
    {
        antworten.Clear();
        Aufrufe.Clear();
        CacheControl = null;
        NichtErreichbar = false;
        Antwortet("legend", LegendeStandard);
        Antwortet("health", ZustandStandard);
    }

    public void Antwortet(string pfad, string rumpf, HttpStatusCode status = HttpStatusCode.OK) =>
        antworten[pfad] = (status, rumpf);

    public int AufrufeFuer(string pfad) => Aufrufe.GetValueOrDefault(pfad);

    protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage anfrage, CancellationToken ct)
    {
        var pfad = anfrage.RequestUri!.AbsolutePath.TrimStart('/');
        Aufrufe[pfad] = Aufrufe.GetValueOrDefault(pfad) + 1;

        if (NichtErreichbar)
            throw new HttpRequestException($"Stub: {pfad} nicht erreichbar");

        var (status, rumpf) = antworten.TryGetValue(pfad, out var treffer)
            ? treffer
            : (HttpStatusCode.NotFound, """{"error":"unbekannte Kennung"}""");

        var antwort = new HttpResponseMessage(status)
        {
            Content = new StringContent(rumpf, Encoding.UTF8, "application/json"),
        };
        if (CacheControl is not null)
            antwort.Headers.TryAddWithoutValidation("Cache-Control", CacheControl);

        return Task.FromResult(antwort);
    }
}
