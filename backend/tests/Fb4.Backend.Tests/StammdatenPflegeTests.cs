using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
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

    /// <summary>
    /// Requirement „Pflege der Stammdaten-Listen", Scenario „Mensa-Eintrag
    /// bearbeiten": Anzeigereihenfolge und Standardauswahl bleiben pflegbar, die
    /// Öffnungszeiten nicht mehr — sie kommen seit der Ablösung von INT-015 aus
    /// der Schnittstelle (Capability `admin`, entfallenes Pflegerecht). Ein
    /// mitgeschicktes Öffnungszeitenfeld nimmt der Vertrag nicht mehr an; es wird
    /// verworfen, statt einen Bestand aufzubauen, den niemand mehr pflegt.
    /// </summary>
    [Fact]
    public async Task Pflege_der_Stammdaten_Listen_nimmt_kein_Oeffnungszeitenfeld_mehr_an()
    {
        var client = factory.CreateClientAls(Rolle.FsrRedaktion);
        var (daten, etag) = await Laden(client);

        // Der erzeugte Vertragstyp führt das Feld nicht mehr — schon der
        // Übersetzungslauf schlüge sonst fehl.
        Assert.DoesNotContain(typeof(Mensa).GetProperties(),
            eigenschaft => eigenschaft.Name.Contains("Oeffnungszeit", StringComparison.Ordinal));

        // Und ein von Hand mitgeschicktes Feld landet nirgends.
        var neu = daten with
        {
            Mensen = [new Mensa { Id = "Neu", Name = "Testmensa", StandardAuswahl = true, Reihenfolge = 5 }],
        };
        var anfrage = Put(etag, neu);
        var response = await client.SendAsync(anfrage);
        response.EnsureSuccessStatusCode();

        var rumpf = await client.GetFromJsonAsync<JsonElement>("/v1/mensen");
        var eintrag = rumpf.EnumerateArray().Single();
        Assert.False(eintrag.TryGetProperty("oeffnungszeiten", out _));
        // Reihenfolge und Standardauswahl bleiben unberührt.
        Assert.Equal(5, eintrag.GetProperty("reihenfolge").GetInt32());
        Assert.True(eintrag.GetProperty("standardAuswahl").GetBoolean());
    }

    [Fact]
    public async Task ADMIN_F_180_Raumliste_laesst_sich_ersetzen()
    {
        var client = factory.CreateClientAls(Rolle.FsrRedaktion);
        var (daten, etag) = await Laden(client);

        var neu = daten with
        {
            Raeume = [new Raum { RoomId = "X.Y.99", Groesse = Raumgroesse.Klein, EkeyZugaenglich = true }],
        };
        (await client.SendAsync(Put(etag, neu))).EnsureSuccessStatusCode();

        var raeume = await client.GetFromJsonAsync<List<Raum>>("/v1/raeume");
        Assert.Single(raeume!);
        Assert.Equal("X.Y.99", raeume![0].RoomId);
    }

    [Fact]
    public async Task ADMIN_F_180_doppelte_Mensa_Kennung_wird_als_400_abgelehnt()
    {
        var client = factory.CreateClientAls(Rolle.FsrRedaktion);
        var (daten, etag) = await Laden(client);

        var neu = daten with
        {
            Mensen =
            [
                new Mensa { Id = "Doppelt", Name = "A", Reihenfolge = 1 },
                new Mensa { Id = "Doppelt", Name = "B", Reihenfolge = 2 },
            ],
        };
        var response = await client.SendAsync(Put(etag, neu));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task ADMIN_F_190_Semestertermine_und_Ticket_Bildausschnitt_lassen_sich_aendern()
    {
        var client = factory.CreateClientAls(Rolle.FsrRedaktion);
        var (daten, etag) = await Laden(client);

        var neu = daten with
        {
            Semestertermine = new Semestertermine
            {
                SemesterBeginn = new DateOnly(2026, 9, 22),
                NaechsterWinterSemesterBeginn = new DateOnly(2027, 3, 15),
            },
            TicketBildausschnitt = new Bildausschnitt { Links = 161, Oben = 148, Rechts = 555, Unten = 350 },
        };
        (await client.SendAsync(Put(etag, neu))).EnsureSuccessStatusCode();

        var frisch = await client.GetFromJsonAsync<Stammdaten>("/v1/stammdaten");
        Assert.Equal(new DateOnly(2026, 9, 22), frisch!.Semestertermine.SemesterBeginn);
        Assert.Equal(new DateOnly(2027, 3, 15), frisch.Semestertermine.NaechsterWinterSemesterBeginn);
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
