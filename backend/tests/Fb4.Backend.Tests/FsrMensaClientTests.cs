using System.Net;
using System.Text;
using Fb4.Backend.Infrastructure;
using Fb4.Backend.Infrastructure.Mensa;
using Microsoft.Extensions.Configuration;
using Xunit;

namespace Fb4.Backend.Tests;

/// <summary>
/// Vertragstest gegen INT-020 (Capability <c>quality-and-testing</c>):
/// aufgezeichnete Live-Antworten von <c>mensa.fb4.it</c> (Fassung 0.2.0,
/// abgerufen 2026-09-23). Faellt ein Pflichtfeld aus <c>Meal</c>, <c>Day</c> oder
/// <c>Hours</c> weg oder wechselt es seinen Typ, schlaegt der Abruf sichtbar fehl,
/// statt still weiterverarbeitet zu werden.
/// </summary>
public class FsrMensaClientTests
{
    // Aufgezeichnet: GET /canteens/341/menu/2026-09-23 (gekuerzt auf zwei Gerichte).
    const string TagJson = """
    {"canteen":{"id":341,"name":"Hauptmensa"},"date":"2026-09-23","categories":[
      {"id":101,"name":"Menü 1 Mensa","meals":[
        {"id":2889800,"name":"Linsen-Bolognese mit Gemüse","nameEn":"Lentil bolognese with vegetables",
         "lines":["Linsen-Bolognese mit Gemüse","Spaghetti","Salat","Vinaigrette"],
         "linesEn":["Lentil bolognese with vegetables","spaghetti","salad","vinaigrette"],
         "prices":{"student":2.8,"staff":4.9,"guest":6},
         "tags":["vegan","climate-plate"],"additives":["2","20a","28"],"co2Class":"A"}]},
      {"id":102,"name":"Beilagen","meals":[
        {"id":2889805,"name":"Gebackene Kartoffelecken","lines":["Gebackene Kartoffelecken","Kräutermayonaise"],
         "linesEn":["baked potato wedges","herbal mayonnaise (20c,26,281,4)"],
         "prices":{"student":1.0,"staff":1.5,"guest":2.0},
         "tags":[],"additives":["20c","26","4"]}]}]}
    """;

    // Aufgezeichnet: GET /canteens/455/hours.
    const string OeffnungJson = """
    {"canteen":{"id":455,"name":"Mensa Sonnenstraße"},
     "today":{"date":"2026-09-22","isOpen":true,"reason":"Regulärer Wochenplan"},
     "forecast":[
       {"date":"2026-09-22","weekday":"tuesday","isOpen":true,"open":"07:30","close":"14:30","servingOpen":"11:30","servingClose":"14:00"},
       {"date":"2026-09-26","weekday":"saturday","isOpen":false},
       {"date":"2026-09-28","weekday":"monday","isOpen":true,"open":"07:30","close":"14:30","servingOpen":"11:30","servingClose":"14:00"}],
     "week":[
       {"weekday":"monday","isOpen":true,"open":"07:30","close":"14:30"},
       {"weekday":"saturday","isOpen":false},{"weekday":"sunday","isOpen":false}],
     "closures":[{"label":"Tag der Deutschen Einheit","date":"2026-10-03","isHoliday":true,"scope":"global"}]}
    """;

    static FsrMensaClient ClientMit(string rumpf, HttpStatusCode status = HttpStatusCode.OK)
    {
        var http = new HttpClient(new StubHandler(rumpf, status))
        {
            BaseAddress = new Uri("https://mensa.test.invalid/"),
        };
        return new FsrMensaClient(http);
    }

    static FsrMensaClient.GerichtDto ErstesGericht(FsrMensaClient.TagesplanDto tag) =>
        tag.Categories![0].Meals![0];

    // ------------------------------------------------- Zielsystem aus der Konfiguration

    /// <summary>
    /// Requirement INT-020 / Task 2.1: das Zielsystem steht in der Konfiguration,
    /// nicht im Quellcode.
    /// </summary>
    [Fact]
    public void Basisadresse_der_Mensa_Schnittstelle_stammt_aus_der_Konfiguration()
    {
        var konfiguration = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
        {
            [MensaQuelleOptions.BasisadresseSchluessel] = "https://mensa.beispiel.invalid/api",
        }).Build();

        var adresse = MensaQuelleOptions.BasisadresseAus(konfiguration);

        Assert.Equal("https://mensa.beispiel.invalid/api/", adresse.AbsoluteUri);
    }

    /// <summary>
    /// Ohne Konfiguration tritt keine im Quellcode hinterlegte Ersatzadresse ein —
    /// sonst liefe eine Testinstanz unbemerkt gegen den Livebetrieb (SEC-F-060).
    /// </summary>
    [Fact]
    public void Ohne_konfigurierte_Basisadresse_tritt_keine_Adresse_aus_dem_Quellcode_ein()
    {
        var leer = new ConfigurationBuilder().Build();

        var ex = Assert.Throws<InvalidOperationException>(() => MensaQuelleOptions.BasisadresseAus(leer));

        Assert.Contains(MensaQuelleOptions.BasisadresseSchluessel, ex.Message, StringComparison.Ordinal);
    }

    /// <summary>SEC-N-030: ausnahmslos TLS.</summary>
    [Fact]
    public void Basisadresse_ohne_TLS_wird_abgewiesen()
    {
        var konfiguration = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
        {
            [MensaQuelleOptions.BasisadresseSchluessel] = "http://mensa.beispiel.invalid/",
        }).Build();

        Assert.Throws<InvalidOperationException>(() => MensaQuelleOptions.BasisadresseAus(konfiguration));
    }

    // --------------------------------------------------------- Schluesselbildung

    /// <summary>
    /// Requirement „Normalisierung von Gerichtsbezeichnungen vor der Verknüpfung",
    /// Scenario „Mehrteiliges Gericht aus Komponenten": der Schluessel entsteht aus
    /// den zusammengefuegten Komponenten und bleibt damit zeichengleich mit dem
    /// Schluessel aus dem Rohtitel der abgeloesten Quelle INT-015.
    /// </summary>
    [Fact]
    public async Task Normalisierung_von_Gerichtsbezeichnungen_vor_der_Verknuepfung()
    {
        var client = ClientMit(TagJson);
        var tag = FsrMensaClient.Pruefen(await client.TagAsync("341", new DateOnly(2026, 9, 23), CancellationToken.None));

        var kartoffelecken = FsrMensaClient.Abbilden(tag.Categories![1].Meals![0], "Beilagen", "de");

        var frueherAusItmcRohtitel = GerichtNormalisierung.Normalisieren(
            "Gebackene Kartoffelecken | Kräutermayonaise (20c,26,28,4)");
        Assert.Equal(frueherAusItmcRohtitel, kartoffelecken.Schluessel);
        Assert.Equal("gebackene kartoffelecken | kräutermayonaise", kartoffelecken.Schluessel);
    }

    /// <summary>
    /// Dasselbe Gericht, dessen erste Komponente allein: <c>name</c> waere als
    /// Schluessel untauglich und haette bestehende Bewertungen abgehaengt.
    /// </summary>
    [Fact]
    public async Task Schluessel_aus_der_ersten_Komponente_allein_waere_abweichend()
    {
        var client = ClientMit(TagJson);
        var tag = FsrMensaClient.Pruefen(await client.TagAsync("341", new DateOnly(2026, 9, 23), CancellationToken.None));
        var roh = tag.Categories![1].Meals![0];

        var ausKomponenten = FsrMensaClient.Abbilden(roh, "Beilagen", "de").Schluessel;
        var ausNameAllein = GerichtNormalisierung.Normalisieren(roh.Name);

        Assert.NotEqual(ausNameAllein, ausKomponenten);
    }

    /// <summary>
    /// Requirement „Normalisierung von Gerichtsbezeichnungen vor der Verknüpfung",
    /// Scenario „Restliche Code-Klammern in der Quelle": am 2026-09-22 trugen 5 von
    /// 73 englischen Komponentenzeilen noch Klammern, darunter den in der Legende
    /// nicht vorhandenen Code <c>281</c>.
    /// </summary>
    [Fact]
    public async Task Restliche_Code_Klammern_in_der_Quelle_werden_entfernt()
    {
        var client = ClientMit(TagJson);
        var tag = FsrMensaClient.Pruefen(await client.TagAsync("341", new DateOnly(2026, 9, 23), CancellationToken.None));

        var englisch = FsrMensaClient.Abbilden(tag.Categories![1].Meals![0], "Beilagen", "en");

        Assert.Equal(["baked potato wedges", "herbal mayonnaise"], englisch.Komponenten);
        Assert.DoesNotContain("281", englisch.Bezeichnung, StringComparison.Ordinal);
    }

    /// <summary>
    /// Sprachrueckfall: fehlt <c>nameEn</c>/<c>linesEn</c> — am 2026-09-22 bei 10 von
    /// 73 Gerichten —, tritt die deutsche Fassung ein, statt die Bezeichnung leer zu
    /// lassen (SEC-F-060, keine stillen Fehler).
    /// </summary>
    [Fact]
    public async Task Fehlende_englische_Fassung_faellt_auf_die_deutsche_zurueck()
    {
        const string ohneEnglisch = """
        {"date":"2026-09-23","categories":[{"id":1,"name":"Menü 1","meals":[
          {"id":1,"name":"Grünkohl","lines":["Grünkohl","Mettendchen"],
           "prices":{"student":3.0,"staff":4.0,"guest":5.0},"tags":["pork"],"additives":[]}]}]}
        """;
        var client = ClientMit(ohneEnglisch);
        var tag = FsrMensaClient.Pruefen(await client.TagAsync("341", new DateOnly(2026, 9, 23), CancellationToken.None));

        var englisch = FsrMensaClient.Abbilden(ErstesGericht(tag), "Menü 1", "en");

        Assert.Equal(["Grünkohl", "Mettendchen"], englisch.Komponenten);
        Assert.Equal("Grünkohl | Mettendchen", englisch.Bezeichnung);
    }

    // --------------------------------------------------------- Gerichtsangaben

    [Fact]
    public async Task Gerichtsangaben_kommen_vollstaendig_aus_der_Quelle()
    {
        var client = ClientMit(TagJson);
        var tag = FsrMensaClient.Pruefen(await client.TagAsync("341", new DateOnly(2026, 9, 23), CancellationToken.None));

        var g = FsrMensaClient.Abbilden(ErstesGericht(tag), tag.Categories![0].Name!, "de");

        Assert.Equal("Menü 1 Mensa", g.Kategorie);
        Assert.Equal(["Linsen-Bolognese mit Gemüse", "Spaghetti", "Salat", "Vinaigrette"], g.Komponenten);
        // Preise kommen als Zahl, nicht als zu parsender String wie bei INT-015.
        Assert.Equal(2.8m, g.PreisStudierende);
        Assert.Equal(4.9m, g.PreisMitarbeitende);
        Assert.Equal(6m, g.PreisGaeste);
        Assert.Equal("A", g.Co2Klasse);
        Assert.Equal(["vegan", "climate-plate"], g.Kennzeichnungen);
    }

    // ------------------------------------------------------- Strukturbruch (2.4)

    [Theory]
    [InlineData("id", """{"date":"2026-09-23","categories":[{"id":1,"name":"M","meals":[{"name":"X","lines":["X"],"prices":{"student":1,"staff":1,"guest":1},"tags":[],"additives":[]}]}]}""")]
    [InlineData("name", """{"date":"2026-09-23","categories":[{"id":1,"name":"M","meals":[{"id":1,"lines":["X"],"prices":{"student":1,"staff":1,"guest":1},"tags":[],"additives":[]}]}]}""")]
    [InlineData("lines", """{"date":"2026-09-23","categories":[{"id":1,"name":"M","meals":[{"id":1,"name":"X","prices":{"student":1,"staff":1,"guest":1},"tags":[],"additives":[]}]}]}""")]
    [InlineData("prices", """{"date":"2026-09-23","categories":[{"id":1,"name":"M","meals":[{"id":1,"name":"X","lines":["X"],"tags":[],"additives":[]}]}]}""")]
    [InlineData("tags", """{"date":"2026-09-23","categories":[{"id":1,"name":"M","meals":[{"id":1,"name":"X","lines":["X"],"prices":{"student":1,"staff":1,"guest":1},"additives":[]}]}]}""")]
    [InlineData("additives", """{"date":"2026-09-23","categories":[{"id":1,"name":"M","meals":[{"id":1,"name":"X","lines":["X"],"prices":{"student":1,"staff":1,"guest":1},"tags":[]}]}]}""")]
    public async Task Fehlendes_Pflichtfeld_aus_Meal_schlaegt_als_Strukturbruch_fehl(string feld, string rumpf)
    {
        var client = ClientMit(rumpf);
        var tag = await client.TagAsync("341", new DateOnly(2026, 9, 23), CancellationToken.None);

        var ex = Assert.Throws<ApiException>(() => FsrMensaClient.Pruefen(tag));

        Assert.Equal(502, ex.Status);
        Assert.Equal("int020_strukturbruch", ex.Code);
        Assert.Contains(feld, ex.Detail!, StringComparison.Ordinal);
    }

    [Theory]
    [InlineData("date", """{"categories":[]}""")]
    [InlineData("categories", """{"date":"2026-09-23"}""")]
    public async Task Fehlendes_Pflichtfeld_aus_Day_schlaegt_als_Strukturbruch_fehl(string feld, string rumpf)
    {
        var client = ClientMit(rumpf);
        var tag = await client.TagAsync("341", new DateOnly(2026, 9, 23), CancellationToken.None);

        var ex = Assert.Throws<ApiException>(() => FsrMensaClient.Pruefen(tag));

        Assert.Contains(feld, ex.Detail!, StringComparison.Ordinal);
    }

    [Theory]
    [InlineData("today", """{"forecast":[],"week":[],"closures":[]}""")]
    [InlineData("isOpen", """{"today":{"date":"2026-09-22"},"forecast":[],"week":[],"closures":[]}""")]
    [InlineData("date", """{"today":{"isOpen":true},"forecast":[],"week":[],"closures":[]}""")]
    [InlineData("weekday", """{"today":{"date":"2026-09-22","isOpen":true},"week":[{"isOpen":true}]}""")]
    public async Task Fehlendes_Pflichtfeld_aus_Hours_schlaegt_als_Strukturbruch_fehl(string feld, string rumpf)
    {
        var client = ClientMit(rumpf);
        var roh = await client.OeffnungszeitenAsync("455", CancellationToken.None);

        var ex = Assert.Throws<ApiException>(() => FsrMensaClient.Pruefen(roh));

        Assert.Equal("int020_strukturbruch", ex.Code);
        Assert.Contains(feld, ex.Detail!, StringComparison.Ordinal);
    }

    [Fact]
    public async Task Geaenderter_Feldtyp_schlaegt_als_Strukturbruch_fehl()
    {
        // prices als Zahl statt Objekt {student,staff,guest} — wie bei INT-015.
        var client = ClientMit(
            """{"date":"2026-09-23","categories":[{"id":1,"name":"M","meals":[{"id":1,"name":"X","lines":["X"],"prices":3.3,"tags":[],"additives":[]}]}]}""");

        var ex = await Assert.ThrowsAsync<ApiException>(
            () => client.TagAsync("341", new DateOnly(2026, 9, 23), CancellationToken.None));

        Assert.Equal("int020_strukturbruch", ex.Code);
    }

    [Fact]
    public async Task Oeffnungsangaben_werden_gegen_die_dokumentierte_Struktur_deserialisiert()
    {
        var client = ClientMit(OeffnungJson);

        var roh = FsrMensaClient.Pruefen(await client.OeffnungszeitenAsync("455", CancellationToken.None));

        Assert.True(roh.Today!.IsOpen);
        Assert.Equal("Regulärer Wochenplan", roh.Today.Reason);
        Assert.Equal(3, roh.Forecast!.Count);
        Assert.Equal("11:30", roh.Forecast[0].ServingOpen);
        Assert.Single(roh.Closures!);
        Assert.Equal("global", roh.Closures![0].Scope);
    }

    // --------------------------------------------- Fehler bleibt Fehler (2.7)

    /// <summary>
    /// Requirement „Sichtbarer Fehler bei nicht erreichbarer Mensa-Schnittstelle":
    /// eine Stoerung der Quelle wird nie zu einer gueltigen Leerantwort.
    /// </summary>
    [Fact]
    public async Task Sichtbarer_Fehler_bei_nicht_erreichbarer_Mensa_Schnittstelle()
    {
        var client = ClientMit("""{"error":"kaputt"}""", HttpStatusCode.InternalServerError);

        var ex = await Assert.ThrowsAsync<ApiException>(
            () => client.TagAsync("341", new DateOnly(2026, 9, 23), CancellationToken.None));

        Assert.Equal(502, ex.Status);
        Assert.Equal("int020_nicht_erreichbar", ex.Code);
    }

    [Fact]
    public async Task Unbekannte_Kennung_der_Quelle_wird_als_404_durchgereicht()
    {
        var client = ClientMit("""{"error":"unbekannt"}""", HttpStatusCode.NotFound);

        var ex = await Assert.ThrowsAsync<ApiException>(
            () => client.TagAsync("999", new DateOnly(2026, 9, 23), CancellationToken.None));

        Assert.Equal(404, ex.Status);
    }

    sealed class StubHandler(string rumpf, HttpStatusCode status) : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage anfrage, CancellationToken ct) =>
            Task.FromResult(new HttpResponseMessage(status)
            {
                Content = new StringContent(rumpf, Encoding.UTF8, "application/json"),
            });
    }
}
