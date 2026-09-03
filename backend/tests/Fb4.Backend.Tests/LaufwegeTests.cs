using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Fb4.Backend.Contract.Generated;
using Fb4.Backend.Tests.Infrastruktur;
using Xunit;

namespace Fb4.Backend.Tests;

public class LaufwegeTests(TestAppFactory factory) : IClassFixture<TestAppFactory>
{
    async Task<(List<Laufweg> wege, string etag)> Laden(HttpClient c)
    {
        var r = await c.GetAsync("/v1/verwaltung/laufwege");
        r.EnsureSuccessStatusCode();
        return ((await r.Content.ReadFromJsonAsync<List<Laufweg>>())!, r.Headers.ETag!.Tag);
    }

    HttpRequestMessage Put(string etag, object body)
    {
        var req = new HttpRequestMessage(HttpMethod.Put, "/v1/verwaltung/laufwege") { Content = JsonContent.Create(body) };
        req.Headers.TryAddWithoutValidation("If-Match", etag);
        return req;
    }

    [Fact]
    public async Task ADMIN_F_090_Laufwege_lassen_sich_anlegen_und_wieder_abrufen()
    {
        var client = factory.CreateClientAls(Rolle.FsrRedaktion);
        var (_, etag) = await Laden(client);

        var response = await client.SendAsync(Put(etag, new[]
        {
            new Laufweg { VonRoomId = "A.E.01", NachRoomId = "A.E.02", Gewicht = 1.5m },
        }));
        response.EnsureSuccessStatusCode();

        var (wege, _) = await Laden(client);
        Assert.Single(wege);
        Assert.Equal(1.5m, wege[0].Gewicht);
    }

    [Fact]
    public async Task ADMIN_F_100_unbekannte_Raumkennung_wird_benannt_aber_gespeichert()
    {
        var client = factory.CreateClientAls(Rolle.FsrRedaktion);
        var (_, etag) = await Laden(client);

        var response = await client.SendAsync(Put(etag, new[]
        {
            new Laufweg { VonRoomId = "A.E.01", NachRoomId = "TREPPE.1", Gewicht = 2m },
        }));
        response.EnsureSuccessStatusCode();

        var rumpf = await response.Content.ReadFromJsonAsync<JsonElement>();
        var unbekannt = rumpf.GetProperty("unbekannteRaeume").EnumerateArray().Select(e => e.GetString()).ToList();
        Assert.Contains("TREPPE.1", unbekannt);
        Assert.Single(rumpf.GetProperty("laufwege").EnumerateArray());
    }

    [Fact]
    public async Task ADMIN_F_090_Laufweg_auf_dieselbe_Raumkennung_wird_abgelehnt()
    {
        var client = factory.CreateClientAls(Rolle.FsrRedaktion);
        var (_, etag) = await Laden(client);

        var response = await client.SendAsync(Put(etag, new[]
        {
            new Laufweg { VonRoomId = "A.E.01", NachRoomId = "A.E.01", Gewicht = 0m },
        }));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }
}
