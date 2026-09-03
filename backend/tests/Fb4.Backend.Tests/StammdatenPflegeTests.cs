using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using Fb4.Backend.Contract.Generated;
using Fb4.Backend.Tests.Infrastruktur;
using Xunit;

namespace Fb4.Backend.Tests;

public class StammdatenPflegeTests(TestAppFactory factory) : IClassFixture<TestAppFactory>
{
    async Task<(Stammdaten daten, string etag)> Laden(HttpClient client)
    {
        var response = await client.GetAsync("/v1/verwaltung/stammdaten");
        response.EnsureSuccessStatusCode();
        var daten = await response.Content.ReadFromJsonAsync<Stammdaten>();
        return (daten!, response.Headers.ETag!.Tag);
    }

    static HttpRequestMessage Put(string etag, Stammdaten daten)
    {
        var req = new HttpRequestMessage(HttpMethod.Put, "/v1/verwaltung/stammdaten")
        {
            Content = JsonContent.Create(daten),
        };
        req.Headers.TryAddWithoutValidation("If-Match", etag);
        return req;
    }

    [Fact]
    public async Task ADMIN_F_180_Mensa_Liste_laesst_sich_ersetzen()
    {
        var client = factory.CreateClientAls(Rolle.FsrRedaktion);
        var (daten, etag) = await Laden(client);

        var neu = daten with
        {
            Mensen = [new Mensa { Id = "Neu", Name = "Testmensa", StandardAuswahl = true, Reihenfolge = 5 }],
        };
        var response = await client.SendAsync(Put(etag, neu));
        response.EnsureSuccessStatusCode();

        var mensen = await client.GetFromJsonAsync<List<Mensa>>("/v1/mensen");
        Assert.Single(mensen!);
        Assert.Equal("Testmensa", mensen![0].Name);
    }

    [Fact]
    public async Task ADMIN_F_190_Semestertermine_und_Ticket_Bildausschnitt_lassen_sich_aendern()
    {
        var client = factory.CreateClientAls(Rolle.FsrRedaktion);
        var (daten, etag) = await Laden(client);

        var neu = daten with
        {
            Semestertermine = new Semestertermine { SemesterBeginn = new DateOnly(2026, 9, 22) },
            TicketBildausschnitt = new Bildausschnitt { Links = 161, Oben = 148, Rechts = 555, Unten = 350 },
        };
        (await client.SendAsync(Put(etag, neu))).EnsureSuccessStatusCode();

        var frisch = await client.GetFromJsonAsync<Stammdaten>("/v1/stammdaten");
        Assert.Equal(new DateOnly(2026, 9, 22), frisch!.Semestertermine.SemesterBeginn);
        Assert.Equal(555, frisch.TicketBildausschnitt!.Rechts);
    }

    [Fact]
    public async Task ADMIN_F_200_veralteter_Stand_wird_beim_Speichern_abgelehnt()
    {
        var client = factory.CreateClientAls(Rolle.FsrRedaktion);
        var (daten, etag) = await Laden(client);

        // Erste Speicherung mit gültigem Stand.
        (await client.SendAsync(Put(etag, daten))).EnsureSuccessStatusCode();

        // Zweite Speicherung mit dem inzwischen veralteten Stand.
        var response = await client.SendAsync(Put(etag, daten));

        Assert.Equal(HttpStatusCode.PreconditionFailed, response.StatusCode);
    }
}
