using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Fb4.Backend.Contract.Generated;
using Fb4.Backend.Infrastructure;
using Fb4.Backend.Tests.Infrastruktur;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace Fb4.Backend.Tests;

/// <summary>
/// MENSA-F-010/030/035/040/048/060 und API-F-070/F-075: der Speiseplan-Endpunkt
/// reicht je Anfrage aus INT-020 durch und haelt keinen eigenen Bestand
/// (Capability <c>backend-and-api</c>). Die Tests legen die Antworten der Quelle
/// fest; die eigene Datenbank traegt allein die gepflegte Mensa-Liste.
/// </summary>
public class MensaSpeiseplanTests(TestAppFactory factory) : IClassFixture<TestAppFactory>
{
    static readonly DateOnly Tag = new(2026, 9, 23);
    const string Pfad = "canteens/341/menu/2026-09-23";
    const string OeffnungPfad = "canteens/341/hours";

    const string TagMitGerichten = """
    {"canteen":{"id":341,"name":"Hauptmensa"},"date":"2026-09-23","categories":[
      {"id":101,"name":"Menü 1","meals":[
        {"id":1,"name":"Bolognese","nameEn":"sauce bolognese",
         "lines":["Bolognese","Spaghetti"],"linesEn":["sauce bolognese","spaghetti"],
         "prices":{"student":3.30,"staff":5.40,"guest":6.50},
         "tags":["beef"],"additives":["2","20a"],"co2Class":"C"}]},
      {"id":102,"name":"Beilagen","meals":[
        {"id":2,"name":"Pommes","nameEn":"fries","lines":["Pommes"],"linesEn":["fries"],
         "prices":{"student":1.00,"staff":1.50,"guest":2.00},
         "tags":["vegan"],"additives":[]}]}]}
    """;

    const string TagOhneGerichte = """
    {"canteen":{"id":341,"name":"Hauptmensa"},"date":"2026-09-23","categories":[]}
    """;

    const string OeffnungMitWiedereroeffnung = """
    {"canteen":{"id":341,"name":"Hauptmensa"},
     "today":{"date":"2026-09-23","isOpen":false,"reason":"Restaurant-Schließtag: Betriebsferien"},
     "forecast":[
       {"date":"2026-09-23","weekday":"wednesday","isOpen":false,"closedReason":"Betriebsferien"},
       {"date":"2026-09-24","weekday":"thursday","isOpen":false},
       {"date":"2026-09-25","weekday":"friday","isOpen":true,"open":"11:30","close":"14:45"}],
     "week":[{"weekday":"friday","isOpen":true,"open":"11:30","close":"14:45"}],
     "closures":[{"label":"Betriebsferien","from":"2026-09-20","to":"2026-09-24","isHoliday":false,"scope":"canteen"}]}
    """;

    const string OeffnungOhneWiedereroeffnung = """
    {"canteen":{"id":341,"name":"Hauptmensa"},
     "today":{"date":"2026-09-23","isOpen":false,"reason":"Restaurant-Schließtag: Betriebsferien"},
     "forecast":[{"date":"2026-09-24","weekday":"thursday","isOpen":false}],
     "week":[],
     "closures":[{"label":"Betriebsferien","from":"2026-09-01","to":"2026-12-31","isHoliday":false,"scope":"canteen"}]}
    """;

    sealed record SpeiseplanAntwort(List<Gericht> Gerichte, StandAlter StandAlter, DateOnly? NaechsteOeffnung);

    void QuelleLiefert(string tagesplan, string? oeffnung = null)
    {
        factory.Quelle.Zuruecksetzen();
        factory.Quelle.Antwortet(Pfad, tagesplan);
        if (oeffnung is not null) factory.Quelle.Antwortet(OeffnungPfad, oeffnung);
    }

    async Task<SpeiseplanAntwort?> AbrufenAsync(string mensaId = "Mensa", string? sprache = null)
    {
        var client = factory.CreateClient();
        var anfrage = new HttpRequestMessage(HttpMethod.Get, $"/v1/mensen/{mensaId}/speiseplan/{Tag:yyyy-MM-dd}");
        if (sprache is not null) anfrage.Headers.Add("Accept-Language", sprache);

        var antwort = await client.SendAsync(anfrage);
        antwort.EnsureSuccessStatusCode();
        return await antwort.Content.ReadFromJsonAsync<SpeiseplanAntwort>();
    }

    // --------------------------------------------------------- Gerichtsangaben

    [Fact]
    public async Task MENSA_F_010_liefert_die_Gerichte_des_Tages_aus_der_Quelle()
    {
        QuelleLiefert(TagMitGerichten);

        var antwort = await AbrufenAsync();

        Assert.NotNull(antwort);
        Assert.Equal(2, antwort!.Gerichte.Count);
        Assert.Equal("Bolognese | Spaghetti", antwort.Gerichte[0].Bezeichnung);
        Assert.Equal(3.30m, antwort.Gerichte[0].PreisStudierende);
        Assert.Equal(5.40m, antwort.Gerichte[0].PreisMitarbeitende);
        Assert.Equal(6.50m, antwort.Gerichte[0].PreisGaeste);
    }

    [Fact]
    public async Task MENSA_F_040_Beilagen_bleiben_als_eigene_Kategorie_erkennbar()
    {
        QuelleLiefert(TagMitGerichten);

        var antwort = await AbrufenAsync();

        Assert.Contains(antwort!.Gerichte, g => g.Kategorie == "Beilagen");
    }

    /// <summary>
    /// Requirement „Gerichtsangaben — Kategorie, Bezeichnung, Preise, Zusatzstoffe":
    /// Allergene und Zusatzstoffe sind unterscheidbar. <c>zusatzstoffe</c> behaelt
    /// seine bisherige Bedeutung (beides), <c>allergene</c> kommt additiv daneben
    /// (ADR 0016).
    /// </summary>
    [Fact]
    public async Task MENSA_F_030_und_F_035_loesen_Zusatzstoffe_Allergene_und_Kennzeichnungen_auf()
    {
        QuelleLiefert(TagMitGerichten);

        var antwort = await AbrufenAsync();
        var bolo = antwort!.Gerichte[0];

        Assert.Equal(["mit Konservierungsstoff", "Weizen"], bolo.Zusatzstoffe);
        Assert.Equal(["Weizen"], bolo.Allergene);
        Assert.Equal(["Rind"], bolo.Kennzeichnungen);
    }

    /// <summary>
    /// Requirement „Gerichtsbezeichnung nach Komponenten gegliedert": die Quelle
    /// liefert die Bezeichnung zerlegt; das Backend reicht sie zerlegt weiter.
    /// </summary>
    [Fact]
    public async Task Gerichtsbezeichnung_wird_nach_Komponenten_gegliedert_weitergereicht()
    {
        QuelleLiefert(TagMitGerichten);

        var antwort = await AbrufenAsync();

        Assert.Equal(["Bolognese", "Spaghetti"], antwort!.Gerichte[0].Komponenten);
        Assert.Equal(["Pommes"], antwort.Gerichte[1].Komponenten);
    }

    /// <summary>Requirement „Anzeige der CO₂-Klasse am Gericht".</summary>
    [Fact]
    public async Task Anzeige_der_CO2_Klasse_am_Gericht()
    {
        QuelleLiefert(TagMitGerichten);

        var antwort = await AbrufenAsync();

        Assert.Equal("C", antwort!.Gerichte[0].Co2Klasse);
        Assert.Null(antwort.Gerichte[1].Co2Klasse);
    }

    [Fact]
    public async Task MENSA_F_048_Accept_Language_en_schaltet_die_Bezeichnung_um()
    {
        QuelleLiefert(TagMitGerichten);

        var antwort = await AbrufenAsync(sprache: "en");

        Assert.Equal("sauce bolognese | spaghetti", antwort!.Gerichte[0].Bezeichnung);
    }

    /// <summary>
    /// Requirement „Gerichtskategorien und Zusatzstoffhinweise in
    /// Oberflaechensprache": die Klartexte der Legende kommen seit der Erweiterung
    /// der Quelle vom 2026-09-24 zweisprachig (INT-020 <c>label</c>/<c>labelEn</c>).
    /// Die App uebersetzt sie nicht selbst (design.md, „Die englische Legende kommt
    /// aus der Quelle, nicht aus der App").
    /// </summary>
    [Fact]
    public async Task Gerichtskategorien_und_Zusatzstoffhinweise_in_Oberflaechensprache()
    {
        QuelleLiefert(TagMitGerichten);

        var antwort = await AbrufenAsync(sprache: "en");

        // `2` = Konservierungsstoff, `20a` = Weizen — beide am ersten Gericht.
        Assert.Contains("with preservative", antwort!.Gerichte[0].Zusatzstoffe!);
        Assert.Contains("Wheat", antwort.Gerichte[0].Allergene!);
        Assert.Contains("Beef", antwort.Gerichte[0].Kennzeichnungen!);

        var deutsch = await AbrufenAsync();
        Assert.Contains("mit Konservierungsstoff", deutsch!.Gerichte[0].Zusatzstoffe!);
        Assert.Contains("Weizen", deutsch.Gerichte[0].Allergene!);
        Assert.Contains("Rind", deutsch.Gerichte[0].Kennzeichnungen!);
    }

    /// <summary>
    /// Sprachrueckfall der Legende: fehlt <c>labelEn</c> zu einem Code, tritt die
    /// deutsche Fassung ein, statt den Klartext leer zu lassen (SEC-F-060, keine
    /// stillen Fehler). Im Stub traegt `20c` bewusst kein <c>labelEn</c>.
    /// </summary>
    [Fact]
    public async Task Legende_ohne_englische_Fassung_faellt_auf_die_deutsche_zurueck()
    {
        factory.Quelle.Zuruecksetzen();
        var client = factory.CreateClient();
        var anfrage = new HttpRequestMessage(HttpMethod.Get, "/v1/mensen/verzeichnisse");
        anfrage.Headers.Add("Accept-Language", "en");

        var rumpf = await (await client.SendAsync(anfrage)).Content.ReadFromJsonAsync<JsonElement>();

        Assert.Contains(rumpf.GetProperty("allergene").EnumerateArray(),
            e => e.GetProperty("id").GetString() == "20a"
                 && e.GetProperty("bezeichnung").GetString() == "Wheat");
        Assert.Contains(rumpf.GetProperty("allergene").EnumerateArray(),
            e => e.GetProperty("id").GetString() == "20c"
                 && e.GetProperty("bezeichnung").GetString() == "Gerste");
    }

    [Fact]
    public async Task MENSA_F_060_Tag_ohne_Angebot_ist_kein_Fehler_sondern_leere_Liste()
    {
        QuelleLiefert(TagOhneGerichte, OeffnungOhneWiedereroeffnung);
        var client = factory.CreateClient();

        var antwort = await client.GetAsync($"/v1/mensen/Mensa/speiseplan/{Tag:yyyy-MM-dd}");

        antwort.EnsureSuccessStatusCode();
        var rumpf = await antwort.Content.ReadFromJsonAsync<SpeiseplanAntwort>();
        Assert.Empty(rumpf!.Gerichte);
    }

    [Fact]
    public async Task MENSA_F_010_unbekannte_Mensa_liefert_404()
    {
        QuelleLiefert(TagMitGerichten);
        var client = factory.CreateClient();

        var antwort = await client.GetAsync($"/v1/mensen/GibtEsNicht/speiseplan/{Tag:yyyy-MM-dd}");

        Assert.Equal(HttpStatusCode.NotFound, antwort.StatusCode);
    }

    // ------------------------------------------------------ Wiedereroeffnung

    /// <summary>
    /// Requirement „Wiedereröffnungshinweis an der geschlossenen Mensa", Scenario
    /// „Geschlossene Mensa mit späterem Öffnungstag": die Angabe kommt aus
    /// Öffnungsvorschau und Schließtagen, nicht mehr aus einem Speiseplan-Bestand.
    /// </summary>
    [Fact]
    public async Task Wiedereroeffnungshinweis_an_der_geschlossenen_Mensa()
    {
        QuelleLiefert(TagOhneGerichte, OeffnungMitWiedereroeffnung);

        var antwort = await AbrufenAsync();

        Assert.Empty(antwort!.Gerichte);
        Assert.Equal(new DateOnly(2026, 9, 25), antwort.NaechsteOeffnung);
    }

    /// <summary>
    /// Requirement „Wiedereröffnungshinweis an der geschlossenen Mensa", Scenario
    /// „Keine Öffnungszeit in den folgenden sieben Tagen": reicht der Vorausblick
    /// nicht bis zu einem Öffnungstag, entfällt der Zusatz.
    /// </summary>
    [Fact]
    public async Task Wiedereroeffnungshinweis_entfaellt_ohne_Oeffnungstag_im_Vorausblick()
    {
        QuelleLiefert(TagOhneGerichte, OeffnungOhneWiedereroeffnung);

        var antwort = await AbrufenAsync();

        Assert.Empty(antwort!.Gerichte);
        Assert.Null(antwort.NaechsteOeffnung);
    }

    // --------------------------------------------------- Durchreichen (2.5)

    /// <summary>
    /// Requirement „Mensa-Daten durchreichen statt zwischenspeichern": jede Anfrage
    /// bezieht die Daten aus der Schnittstelle, und es entsteht keine Ablage. Zwei
    /// Anfragen innerhalb der von der Quelle gesetzten Gültigkeitsdauer lösen genau
    /// einen Abruf aus — das Backend tut, was die Quelle anweist, und hält nichts
    /// darüber hinaus.
    /// </summary>
    [Fact]
    public async Task Mensa_Daten_durchreichen_statt_zwischenspeichern()
    {
        QuelleLiefert(TagMitGerichten);
        factory.Quelle.CacheControl = "public, max-age=300";

        await AbrufenAsync();
        await AbrufenAsync();

        Assert.Equal(1, factory.Quelle.AufrufeFuer(Pfad));

        // Keine Ablage: der Bestand der eigenen Datenbank bleibt unberührt — es gibt
        // weder eine Speiseplan- noch eine Verzeichnistabelle mehr (Abschnitt 3).
        using var scope = factory.NewScope();
        var db = scope.ServiceProvider.GetRequiredService<Fb4DbContext>();
        Assert.DoesNotContain(db.Model.GetEntityTypes(),
            e => e.ClrType.Name is "SpeiseplanTag" or "GerichtCache"
                or "MensaVerzeichnisEintrag" or "MensaZwischenspeicherStand");
    }

    /// <summary>
    /// Ohne Gültigkeitszusage der Quelle wird nichts festgehalten: jede Anfrage
    /// schlägt durch. Eine eigene Aufbewahrung entsteht nie.
    /// </summary>
    [Fact]
    public async Task Ohne_Gueltigkeitsangabe_der_Quelle_schlaegt_jede_Anfrage_durch()
    {
        QuelleLiefert(TagMitGerichten);

        await AbrufenAsync();
        await AbrufenAsync();

        Assert.Equal(2, factory.Quelle.AufrufeFuer(Pfad));
    }

    // --------------------------------------------------------- Datenalter (2.6)

    /// <summary>
    /// Requirement „Weitergabe des Datenalters der Mensa-Schnittstelle": der von der
    /// Quelle gemeldete Stand geht an die App weiter. Er steht allein in
    /// <c>GET /health</c> — die Speiseplanantwort selbst führt kein <c>updated</c>.
    /// </summary>
    [Fact]
    public async Task Weitergabe_des_Datenalters_der_Mensa_Schnittstelle()
    {
        QuelleLiefert(TagMitGerichten);

        var antwort = await AbrufenAsync();

        Assert.Equal(
            new DateTimeOffset(2026, 9, 23, 6, 0, 0, TimeSpan.Zero),
            antwort!.StandAlter.QuelleStand);
        Assert.True(antwort.StandAlter.QuelleErreichbar);
    }

    /// <summary>
    /// Meldet die Quelle einen überalterten Stand, geht genau dieser weiter — ihr
    /// Zustand meldet die Überalterung nicht (2026-09-22: <c>ok</c> bei 6,7 Tage
    /// alten Speiseplänen).
    /// </summary>
    [Fact]
    public async Task Ueberalterter_Stand_der_Quelle_wird_unveraendert_weitergegeben()
    {
        QuelleLiefert(TagMitGerichten);
        factory.Quelle.Antwortet("health", """
        {"status":"ok","canteens":15,"meals":73,
         "cache":{"menus":{"updated":"2026-09-16T08:00:00Z","ageSeconds":576000},
                  "hours":{"canteens":15,"oldestAgeSeconds":120}}}
        """);

        var antwort = await AbrufenAsync();

        Assert.Equal(
            new DateTimeOffset(2026, 9, 16, 8, 0, 0, TimeSpan.Zero),
            antwort!.StandAlter.QuelleStand);
    }

    // ------------------------------------------------ Fehler bleibt Fehler (2.7)

    /// <summary>
    /// Requirement „Sichtbarer Fehler bei nicht erreichbarer Mensa-Schnittstelle":
    /// ohne eigenen Bestand hat das Backend keinen letzten guten Stand mehr. Der
    /// Fehler muss als Fehler ankommen, damit die App auf ihren gerätelokalen
    /// Bestand zurückfällt.
    /// </summary>
    [Fact]
    public async Task Sichtbarer_Fehler_bei_nicht_erreichbarer_Mensa_Schnittstelle()
    {
        factory.Quelle.Zuruecksetzen();
        factory.Quelle.NichtErreichbar = true;
        var client = factory.CreateClient();

        var antwort = await client.GetAsync($"/v1/mensen/Mensa/speiseplan/{Tag:yyyy-MM-dd}");

        Assert.Equal(HttpStatusCode.BadGateway, antwort.StatusCode);
        var rumpf = await antwort.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("int020_nicht_erreichbar", rumpf.GetProperty("code").GetString());
    }

    /// <summary>
    /// Eine Störung der Quelle wird nie zu einer leeren Gerichtsliste mit Status 200
    /// — sonst bliebe sie für die App von „kein Angebot" ununterscheidbar.
    /// </summary>
    [Fact]
    public async Task Stoerung_der_Quelle_wird_nie_als_leere_Gerichtsliste_ausgeliefert()
    {
        factory.Quelle.Zuruecksetzen();
        factory.Quelle.Antwortet(Pfad, """{"error":"kaputt"}""", HttpStatusCode.InternalServerError);
        var client = factory.CreateClient();

        var antwort = await client.GetAsync($"/v1/mensen/Mensa/speiseplan/{Tag:yyyy-MM-dd}");

        Assert.NotEqual(HttpStatusCode.OK, antwort.StatusCode);
    }

    // ------------------------------------------------------------ Verzeichnisse

    [Fact]
    public async Task API_F_075_Verzeichnisse_kommen_aus_der_Legende_der_Quelle()
    {
        factory.Quelle.Zuruecksetzen();
        var client = factory.CreateClient();

        var rumpf = await client.GetFromJsonAsync<JsonElement>("/v1/mensen/verzeichnisse");

        Assert.Contains(rumpf.GetProperty("zusatzstoffe").EnumerateArray(),
            e => e.GetProperty("id").GetString() == "2");
        // Allergene stehen zusätzlich getrennt, bleiben aber Teilmenge der Zusatzstoffe.
        Assert.Contains(rumpf.GetProperty("allergene").EnumerateArray(),
            e => e.GetProperty("id").GetString() == "20a");
        Assert.Contains(rumpf.GetProperty("zusatzstoffe").EnumerateArray(),
            e => e.GetProperty("id").GetString() == "20a");
        Assert.DoesNotContain(rumpf.GetProperty("allergene").EnumerateArray(),
            e => e.GetProperty("id").GetString() == "2");
        Assert.Contains(rumpf.GetProperty("kennzeichnungen").EnumerateArray(),
            e => e.GetProperty("id").GetString() == "vegan");
        // CO₂-Klassen kommen ebenfalls aus der Legende (`climate`), damit das
        // Filtermenü sie anbieten kann, ohne sie im App-Code aufzuzählen
        // (Requirement „Ausschluss nach Kennzeichnung“).
        var co2 = Assert.Single(rumpf.GetProperty("co2Klassen").EnumerateArray());
        Assert.Equal("A", co2.GetProperty("id").GetString());
        Assert.Equal("sehr gut", co2.GetProperty("bezeichnung").GetString());
    }

    /// <summary>
    /// Die Klartexte der CO₂-Klassen folgen demselben <c>Accept-Language</c> wie die
    /// übrige Legende (Requirement „Gerichtskategorien und Zusatzstoffhinweise in
    /// Oberflächensprache“).
    /// </summary>
    [Fact]
    public async Task CO2_Klassen_folgen_der_Oberflaechensprache()
    {
        factory.Quelle.Zuruecksetzen();
        var client = factory.CreateClient();
        var anfrage = new HttpRequestMessage(HttpMethod.Get, "/v1/mensen/verzeichnisse");
        anfrage.Headers.Add("Accept-Language", "en");

        var antwort = await client.SendAsync(anfrage);
        var rumpf = await antwort.Content.ReadFromJsonAsync<JsonElement>();

        var co2 = Assert.Single(rumpf.GetProperty("co2Klassen").EnumerateArray());
        Assert.Equal("very good", co2.GetProperty("bezeichnung").GetString());
    }

    // --------------------------------------------------------- Öffnungsangaben

    /// <summary>
    /// Requirement „Öffnungszeiten je Mensa und Wochentag": die Öffnungsangaben
    /// kommen aus der Schnittstelle, nicht mehr aus gepflegten Stammdaten.
    /// </summary>
    [Fact]
    public async Task Oeffnungsangaben_kommen_aus_der_Mensa_Schnittstelle()
    {
        factory.Quelle.Zuruecksetzen();
        factory.Quelle.Antwortet(OeffnungPfad, OeffnungMitWiedereroeffnung);
        var client = factory.CreateClient();

        var angaben = await client.GetFromJsonAsync<Oeffnungsangaben>("/v1/mensen/Mensa/oeffnungszeiten");

        Assert.NotNull(angaben);
        Assert.False(angaben!.Heute.Geoeffnet);
        Assert.Equal("Restaurant-Schließtag: Betriebsferien", angaben.Heute.Grund);
        Assert.Equal(new DateOnly(2026, 9, 23), angaben.Heute.Datum);
        Assert.Single(angaben.Schliesstage);
        Assert.Equal(Schliessbereich.Mensa, angaben.Schliesstage[0].Geltungsbereich);
        Assert.Equal(new DateOnly(2026, 9, 24), angaben.Schliesstage[0].Bis);
    }

    /// <summary>
    /// Requirement „Ausweis der Ausgabezeit bei abweichender Öffnungszeit": die
    /// Quelle liefert <c>servingOpen</c> nur bei Abweichung; das Backend reicht
    /// beides getrennt weiter.
    /// </summary>
    [Fact]
    public async Task Ausweis_der_Ausgabezeit_bei_abweichender_Oeffnungszeit()
    {
        factory.Quelle.Zuruecksetzen();
        factory.Quelle.Antwortet(OeffnungPfad, """
        {"canteen":{"id":453,"name":"Max-Ophüls-Platz"},
         "today":{"date":"2026-09-23","isOpen":true,"reason":"Regulärer Wochenplan"},
         "forecast":[{"date":"2026-09-23","weekday":"wednesday","isOpen":true,
                      "open":"08:00","close":"14:15","servingOpen":"11:30"}],
         "week":[{"weekday":"wednesday","isOpen":true,"open":"08:00","close":"14:15","servingOpen":"11:30"},
                 {"weekday":"thursday","isOpen":true,"open":"11:30","close":"14:45"}],
         "closures":[]}
        """);
        var client = factory.CreateClient();

        var angaben = await client.GetFromJsonAsync<Oeffnungsangaben>("/v1/mensen/Mensa/oeffnungszeiten");

        Assert.Equal("08:00", angaben!.Heute.Oeffnet);
        Assert.Equal("11:30", angaben.Heute.AusgabeBeginn);
        // Wo die Quelle keine abweichende Ausgabezeit führt, bleibt das Feld leer.
        var donnerstag = angaben.Wochenplan.Single(t => t.Wochentag == 4);
        Assert.Equal("11:30", donnerstag.Oeffnet);
        Assert.Null(donnerstag.AusgabeBeginn);
    }

    [Fact]
    public async Task Oeffnungsangaben_einer_unbekannten_Mensa_liefern_404()
    {
        factory.Quelle.Zuruecksetzen();
        var client = factory.CreateClient();

        var antwort = await client.GetAsync("/v1/mensen/GibtEsNicht/oeffnungszeiten");

        Assert.Equal(HttpStatusCode.NotFound, antwort.StatusCode);
    }
}
