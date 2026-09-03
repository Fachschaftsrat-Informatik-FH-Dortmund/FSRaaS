using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Fb4.Backend.Contract.Generated;
using Fb4.Backend.Domain;
using Fb4.Backend.Infrastructure;
using Fb4.Backend.Tests.Infrastruktur;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace Fb4.Backend.Tests;

/// <summary>
/// MENSA-F-010/030/035/040/048/060 und API-F-070/F-075: der Speiseplan-Endpunkt
/// liefert ausschliesslich aus dem eigenen Zwischenspeicher. Die Tests seeden den
/// Zwischenspeicher direkt (der INT-015-Abruf-Job läuft im Test nicht).
/// </summary>
public class MensaSpeiseplanTests(TestAppFactory factory) : IClassFixture<TestAppFactory>
{
    static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web);
    static readonly DateOnly Tag = new(2026, 9, 3);

    void Seed()
    {
        using var scope = factory.NewScope();
        var db = scope.ServiceProvider.GetRequiredService<Fb4DbContext>();

        db.Speiseplaene.RemoveRange(db.Speiseplaene.ToList());
        db.MensaVerzeichnis.RemoveRange(db.MensaVerzeichnis.ToList());

        var gerichte = new List<GerichtCache>
        {
            new()
            {
                Schluessel = "bolognese", KategorieDe = "Menü 1", KategorieEn = "Menu 1",
                BezeichnungDe = "Bolognese", BezeichnungEn = "sauce bolognese",
                PreisStudierende = 3.30m, PreisMitarbeitende = 5.40m, PreisGaeste = 6.50m,
                Zusatzstoffe = ["2", "20a"], Kennzeichnungen = ["R"], Position = 0,
            },
            new()
            {
                Schluessel = "pommes", KategorieDe = "Beilagen", KategorieEn = "Side dishes",
                BezeichnungDe = "Pommes", BezeichnungEn = "fries",
                PreisStudierende = 1.00m, Kennzeichnungen = ["N"], Position = 9,
            },
        };

        db.Speiseplaene.Add(new SpeiseplanTag
        {
            MensaId = "Mensa", Datum = Tag,
            GerichteJson = JsonSerializer.Serialize(gerichte, Json),
            AbgerufenAm = DateTimeOffset.UtcNow,
        });
        db.MensaVerzeichnis.AddRange(
            new MensaVerzeichnisEintrag { Art = "zusatzstoff", QuelleId = "2", BezeichnungDe = "mit Konservierungsstoffen", BezeichnungEn = "with preservatives" },
            new MensaVerzeichnisEintrag { Art = "zusatzstoff", QuelleId = "20a", BezeichnungDe = "Weizen", BezeichnungEn = "wheat" },
            new MensaVerzeichnisEintrag { Art = "kennzeichnung", QuelleId = "N", BezeichnungDe = "Vegan", BezeichnungEn = "Vegan" },
            new MensaVerzeichnisEintrag { Art = "kennzeichnung", QuelleId = "R", BezeichnungDe = "Rind", BezeichnungEn = "beef" },
            new MensaVerzeichnisEintrag { Art = "kategorie", QuelleId = "Menü 1", BezeichnungDe = "Menü 1", BezeichnungEn = "Menu 1" });
        db.SaveChanges();
    }

    sealed record SpeiseplanAntwort(List<Gericht> Gerichte, StandAlter StandAlter);

    [Fact]
    public async Task MENSA_F_010_liefert_die_Gerichte_des_Tages_aus_dem_Zwischenspeicher()
    {
        Seed();
        var client = factory.CreateClient();

        var antwort = await client.GetFromJsonAsync<SpeiseplanAntwort>($"/v1/mensen/Mensa/speiseplan/{Tag:yyyy-MM-dd}");

        Assert.NotNull(antwort);
        Assert.Equal(2, antwort!.Gerichte.Count);
        Assert.Equal("Bolognese", antwort.Gerichte[0].Bezeichnung);
        Assert.Equal(3.30m, antwort.Gerichte[0].PreisStudierende);
        Assert.Equal(5.40m, antwort.Gerichte[0].PreisMitarbeitende);
        Assert.Equal(6.50m, antwort.Gerichte[0].PreisGaeste);
    }

    [Fact]
    public async Task MENSA_F_040_Beilagen_bleiben_als_eigene_Kategorie_erkennbar()
    {
        Seed();
        var client = factory.CreateClient();

        var antwort = await client.GetFromJsonAsync<SpeiseplanAntwort>($"/v1/mensen/Mensa/speiseplan/{Tag:yyyy-MM-dd}");

        Assert.Contains(antwort!.Gerichte, g => g.Kategorie == "Beilagen");
    }

    [Fact]
    public async Task MENSA_F_030_und_F_035_loesen_Zusatzstoffe_und_Kennzeichnungen_auf()
    {
        Seed();
        var client = factory.CreateClient();

        var antwort = await client.GetFromJsonAsync<SpeiseplanAntwort>($"/v1/mensen/Mensa/speiseplan/{Tag:yyyy-MM-dd}");
        var bolo = antwort!.Gerichte[0];

        Assert.Equal(new[] { "mit Konservierungsstoffen", "Weizen" }, bolo.Zusatzstoffe);
        Assert.Equal(new[] { "Rind" }, bolo.Kennzeichnungen);
    }

    [Fact]
    public async Task MENSA_F_048_Accept_Language_en_schaltet_Bezeichnungen_um()
    {
        Seed();
        var client = factory.CreateClient();
        var req = new HttpRequestMessage(HttpMethod.Get, $"/v1/mensen/Mensa/speiseplan/{Tag:yyyy-MM-dd}");
        req.Headers.Add("Accept-Language", "en");

        var antwort = await (await client.SendAsync(req)).Content.ReadFromJsonAsync<SpeiseplanAntwort>();

        Assert.Equal("sauce bolognese", antwort!.Gerichte[0].Bezeichnung);
        Assert.Equal("Menu 1", antwort.Gerichte[0].Kategorie);
        Assert.Equal(new[] { "with preservatives", "wheat" }, antwort.Gerichte[0].Zusatzstoffe);
    }

    [Fact]
    public async Task MENSA_F_060_Tag_ohne_Angebot_ist_kein_Fehler_sondern_leere_Liste()
    {
        Seed();
        var client = factory.CreateClient();

        var response = await client.GetAsync("/v1/mensen/Mensa/speiseplan/2099-01-01");
        response.EnsureSuccessStatusCode();
        var antwort = await response.Content.ReadFromJsonAsync<SpeiseplanAntwort>();

        Assert.Empty(antwort!.Gerichte);
    }

    [Fact]
    public async Task MENSA_F_010_unbekannte_Mensa_liefert_404()
    {
        Seed();
        var client = factory.CreateClient();

        var response = await client.GetAsync($"/v1/mensen/GibtEsNicht/speiseplan/{Tag:yyyy-MM-dd}");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task API_F_075_Verzeichnisse_liefern_Kategorien_Zusatzstoffe_und_Kennzeichnungen()
    {
        Seed();
        var client = factory.CreateClient();

        var body = await client.GetFromJsonAsync<JsonElement>("/v1/mensen/verzeichnisse");

        Assert.NotEmpty(body.GetProperty("kategorien").EnumerateArray());
        Assert.Contains(body.GetProperty("zusatzstoffe").EnumerateArray(),
            e => e.GetProperty("id").GetString() == "2");
        Assert.Contains(body.GetProperty("kennzeichnungen").EnumerateArray(),
            e => e.GetProperty("id").GetString() == "N");
    }
}
