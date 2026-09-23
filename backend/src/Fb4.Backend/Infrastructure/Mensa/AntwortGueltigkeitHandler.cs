using System.Net;
using System.Net.Http.Headers;
using Microsoft.Extensions.Caching.Memory;

namespace Fb4.Backend.Infrastructure.Mensa;

/// <summary>
/// Beachtet die Gueltigkeitsdauer, die INT-020 auf ihre Antworten setzt
/// (<c>Cache-Control: public, max-age=300</c>), und beantwortet einen erneuten
/// Abruf derselben Adresse innerhalb dieser Frist aus der bereits erhaltenen
/// Antwort.
///
/// Das ist ausdruecklich <b>kein</b> eigener Zwischenspeicher im Sinne des
/// Requirements „Mensa-Daten durchreichen statt zwischenspeichern": es entsteht
/// kein Datenbestand, keine Auffrischungslogik und keine Aufbewahrung ueber die
/// von der Quelle gesetzte Frist hinaus — das Backend tut allein, was die Quelle
/// anweist. Ohne das erzeugte jeder Tagwechsel in der App volle Last auf der
/// Quelle (design.md, „Die Gueltigkeitsdauer der Quelle beachten").
///
/// Nur <c>GET</c> und nur erfolgreiche Antworten; eine Fehlerantwort wird nie
/// festgehalten, damit eine Stoerung nicht ueber ihre Dauer hinaus nachwirkt.
/// </summary>
public sealed class AntwortGueltigkeitHandler(IMemoryCache ablage, TimeProvider zeit) : DelegatingHandler
{
    sealed record Festgehalten(
        HttpStatusCode Status,
        byte[] Rumpf,
        IReadOnlyList<KeyValuePair<string, IEnumerable<string>>> Kopfzeilen,
        DateTimeOffset GueltigBis);

    protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage anfrage, CancellationToken ct)
    {
        if (anfrage.Method != HttpMethod.Get || anfrage.RequestUri is null)
            return await base.SendAsync(anfrage, ct);

        var schluessel = Schluessel(anfrage.RequestUri);
        if (ablage.TryGetValue(schluessel, out Festgehalten? vorhanden)
            && vorhanden is not null
            && vorhanden.GueltigBis > zeit.GetUtcNow())
        {
            return Nachbauen(vorhanden, anfrage);
        }

        var antwort = await base.SendAsync(anfrage, ct);
        var dauer = Gueltigkeitsdauer(antwort);
        if (!antwort.IsSuccessStatusCode || dauer <= TimeSpan.Zero) return antwort;

        var rumpf = await antwort.Content.ReadAsByteArrayAsync(ct);
        var eintrag = new Festgehalten(
            antwort.StatusCode,
            rumpf,
            [.. antwort.Content.Headers],
            zeit.GetUtcNow() + dauer);
        ablage.Set(schluessel, eintrag, dauer);

        return Nachbauen(eintrag, anfrage);
    }

    static string Schluessel(Uri adresse) => "int020:" + adresse.AbsoluteUri;

    /// <summary>
    /// Frist aus <c>Cache-Control: max-age</c>. <c>no-store</c>/<c>no-cache</c>
    /// heben sie auf; fehlt die Angabe, wird nichts festgehalten — es wird nie
    /// laenger aufbewahrt, als die Quelle zusagt.
    /// </summary>
    static TimeSpan Gueltigkeitsdauer(HttpResponseMessage antwort)
    {
        var steuerung = antwort.Headers.CacheControl;
        if (steuerung is null || steuerung.NoStore || steuerung.NoCache) return TimeSpan.Zero;
        return steuerung.MaxAge ?? TimeSpan.Zero;
    }

    static HttpResponseMessage Nachbauen(Festgehalten eintrag, HttpRequestMessage anfrage)
    {
        var antwort = new HttpResponseMessage(eintrag.Status)
        {
            RequestMessage = anfrage,
            Content = new ByteArrayContent(eintrag.Rumpf),
        };
        antwort.Content.Headers.Clear();
        foreach (var (name, werte) in eintrag.Kopfzeilen)
            antwort.Content.Headers.TryAddWithoutValidation(name, werte);
        antwort.Headers.CacheControl = new CacheControlHeaderValue
        {
            Public = true,
            MaxAge = eintrag.GueltigBis - DateTimeOffset.UtcNow,
        };
        return antwort;
    }
}
