using System.Net;
using System.Text;
using Fb4.Backend.Infrastructure;
using Fb4.Backend.Infrastructure.Mensa;
using Xunit;

namespace Fb4.Backend.Tests;

/// <summary>
/// QA-N-070: Vertrags-/Schemaänderungs-Erkennung für INT-015. Aufgezeichnete
/// Live-Antworten vom 2026-09-03 (siehe `platform/integrations.md` INT-015);
/// strukturelle Abweichung schlägt sichtbar fehl.
/// </summary>
public class ItmcMensaClientTests
{
    // Aufgezeichnete Antwort von GET /canteens/341/{date} (gekürzt auf zwei Gerichte).
    const string TagJson = """
    [
      {"title":{"de":"Bolognese (20a,28) | Spaghetti (20a) | Reibkäse (2,22,26)","en":"sauce bolognese (20a,28) | spaghetti (20a) | grated cheese (2,22,26)"},
       "type":["R","A"],"additives":["2","20a","22","28"],"category":"1",
       "price":{"student":"3,30 €","staff":"5,40 €","guest":"6,50 €"},
       "dispoId":"2889729","counter":"Menü 1","position":0,"counterNames":{"de":"Menü 1","en":"Menu 1"}},
      {"title":{"de":"Pommes","en":"fries"},"type":["N"],"additives":[],"category":"9",
       "price":{"student":"1,00 €","staff":"1,50 €","guest":"2,00 €"},
       "dispoId":"2889740","counter":"Beilagen","position":9,"counterNames":{"de":"Beilagen","en":"Side dishes"}}
    ]
    """;

    // Aufgezeichnete Antwort von GET /canteens/474/{date} (Food Fakultaet, gekuerzt),
    // Pruefung 2026-09-04: kein `counter`, `counterNames` null, nur numerischer
    // `category`-Code (integrations.md INT-015).
    const string FoodFakultaetJson = """
    [
      {"title":{"de":"Pasta Pesto Basilico: Basilikumpesto (2,20a,22,26)","en":"Pasta Pesto Basilico: Basil pesto (2,20a,22,26)"},
       "type":["V","B"],"additives":["2","20a","22","26"],"category":"20",
       "price":{"student":"4,50 €","staff":"6,60 €","guest":"7,70 €"},
       "dispoId":"2897335","position":0,"counterNames":null},
      {"title":{"de":"Pizza Margherita: Fruchtige Tomatensauce | Gouda (20a,20c,25,26)","en":"Pizza Margherita: Fruity tomato sauce | gouda (20a,20c,25,26)"},
       "type":["V"],"additives":["20a","20c","25","26"],"category":"21",
       "price":{"student":"4,00 €","staff":"6,10 €","guest":"7,20 €"},
       "dispoId":"2897331","position":1,"counterNames":null}
    ]
    """;

    const string TypesJson = """
    [{"id":"A","name":{"de":"Fleisch aus artgerechter Haltung","en":"Meat from appropriate care"}},
     {"id":"N","name":{"de":"Vegan","en":"Vegan"}}]
    """;

    static ItmcMensaClient ClientMit(string body, HttpStatusCode status = HttpStatusCode.OK)
    {
        var handler = new StubHandler(body, status);
        var http = new HttpClient(handler) { BaseAddress = new Uri("https://mobil.itmc.tu-dortmund.de/canteen-menu/v3/") };
        return new ItmcMensaClient(http);
    }

    [Fact]
    public async Task QA_N_070_Tagesantwort_wird_gegen_die_dokumentierte_Struktur_deserialisiert()
    {
        var client = ClientMit(TagJson);

        var roh = await client.TagAsync("341", new DateOnly(2026, 9, 3), CancellationToken.None);
        var gerichte = roh.Select(ItmcMensaClient.Abbilden).ToList();

        Assert.Equal(2, gerichte.Count);
        Assert.Equal("bolognese | spaghetti | reibkäse", gerichte[0].Schluessel);
        Assert.Equal("Menü 1", gerichte[0].KategorieDe);
        Assert.Equal("Menu 1", gerichte[0].KategorieEn);
        Assert.Equal(3.30m, gerichte[0].PreisStudierende);
        Assert.Equal(6.50m, gerichte[0].PreisGaeste);
        Assert.Equal(new[] { "R", "A" }, gerichte[0].Kennzeichnungen);
        Assert.Equal("Beilagen", gerichte[1].KategorieDe);
    }

    [Fact]
    public async Task MENSA_F_160_Gericht_ohne_Ausgabestelle_wird_ohne_Kategorie_abgebildet_und_faellt_nicht_weg()
    {
        var client = ClientMit(FoodFakultaetJson);

        var roh = await client.TagAsync("474", new DateOnly(2026, 9, 4), CancellationToken.None);
        var gerichte = roh.Select(ItmcMensaClient.Abbilden).ToList();

        // Alle Gerichte kommen an — die Daten fehlen nicht, nur die Kategorie.
        Assert.Equal(2, gerichte.Count);
        Assert.All(gerichte, g =>
        {
            Assert.Equal("", g.KategorieDe);
            Assert.Equal("", g.KategorieEn);
        });
        // Der numerische category-Code („20"/„21") taucht nirgends als Kategorie auf.
        Assert.DoesNotContain(gerichte, g => g.KategorieDe is "20" or "21");
        Assert.Equal("pasta pesto basilico: basilikumpesto", gerichte[0].Schluessel);
        Assert.Equal(4.50m, gerichte[0].PreisStudierende);
    }

    [Fact]
    public async Task QA_N_070_fehlendes_Pflichtfeld_title_schlaegt_als_Strukturbruch_fehl()
    {
        var client = ClientMit("""[{"type":["N"],"counter":"Menü 1","position":0}]""");

        var roh = await client.TagAsync("341", new DateOnly(2026, 9, 3), CancellationToken.None);

        var ex = Assert.Throws<ApiException>(() => ItmcMensaClient.Abbilden(roh[0]));
        Assert.Equal(502, ex.Status);
        Assert.Equal("int015_strukturbruch", ex.Code);
    }

    [Fact]
    public async Task QA_N_070_geaenderter_Feldtyp_schlaegt_als_Strukturbruch_fehl()
    {
        // price als Zahl statt Objekt {student,staff,guest}.
        var client = ClientMit("""[{"title":{"de":"X"},"price":3.3,"counter":"a","position":0}]""");

        var ex = await Assert.ThrowsAsync<ApiException>(
            () => client.TagAsync("341", new DateOnly(2026, 9, 3), CancellationToken.None));
        Assert.Equal("int015_strukturbruch", ex.Code);
    }

    [Fact]
    public async Task QA_N_070_Kennzeichnungs_Verzeichnis_wird_abgebildet()
    {
        var client = ClientMit(TypesJson);
        var roh = await client.TypenAsync(CancellationToken.None);

        var eintraege = ItmcMensaClient.VerzeichnisAbbilden("kennzeichnung", roh);

        Assert.Contains(eintraege, e => e.QuelleId == "N" && e.BezeichnungDe == "Vegan");
    }

    [Theory]
    [InlineData("3,30 €", 3.30)]
    [InlineData("1,00 €", 1.00)]
    [InlineData("12,50 €", 12.50)]
    [InlineData("", null)]
    [InlineData("k. A.", null)]
    public void Preis_String_der_Quelle_wird_geparst(string roh, double? erwartet)
        => Assert.Equal(erwartet is null ? (decimal?)null : (decimal)erwartet.Value, ItmcMensaClient.PreisParsen(roh));

    sealed class StubHandler(string body, HttpStatusCode status) : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken ct) =>
            Task.FromResult(new HttpResponseMessage(status)
            {
                Content = new StringContent(body, Encoding.UTF8, "application/json"),
            });
    }
}
