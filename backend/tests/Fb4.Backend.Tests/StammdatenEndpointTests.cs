using System.Net;
using System.Net.Http.Json;
using Fb4.Backend.Contract.Generated;
using Fb4.Backend.Tests.Infrastruktur;
using Xunit;

namespace Fb4.Backend.Tests;

public class StammdatenEndpointTests(TestAppFactory factory) : IClassFixture<TestAppFactory>
{
    [Fact]
    public async Task API_F_230_liefert_Stammdaten_kontofrei_in_einem_Aufruf()
    {
        var client = factory.CreateClient();

        var response = await client.GetAsync("/v1/stammdaten");
        response.EnsureSuccessStatusCode();
        var daten = await response.Content.ReadFromJsonAsync<Stammdaten>();

        Assert.NotNull(daten);
        Assert.NotEmpty(daten!.Mensen);
        Assert.NotEmpty(daten.Raeume);
        Assert.NotNull(daten.Semestertermine);
    }

    [Fact]
    public async Task API_F_230_Mensa_Liste_traegt_den_Ausgangsbestand()
    {
        var client = factory.CreateClient();

        var mensen = await client.GetFromJsonAsync<List<Mensa>>("/v1/mensen");

        Assert.NotNull(mensen);
        Assert.Contains(mensen!, m => m.Id == "Mensa" && m.StandardAuswahl);
        Assert.Equal(mensen!.OrderBy(m => m.Reihenfolge).Select(m => m.Id), mensen.Select(m => m.Id));
    }

    [Fact]
    public async Task API_F_240_Studiengang_Rueckfallliste_ist_abrufbar()
    {
        var client = factory.CreateClient();

        var response = await client.GetAsync("/v1/stundenplan/studiengaenge");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var liste = await response.Content.ReadFromJsonAsync<List<Studiengang>>();
        Assert.NotNull(liste);
    }
}
