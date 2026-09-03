using System.Net;
using System.Net.Http.Json;
using Fb4.Backend.Contract.Generated;
using Fb4.Backend.Tests.Infrastruktur;
using Xunit;

namespace Fb4.Backend.Tests;

public class VerwaltungZugriffTests(TestAppFactory factory) : IClassFixture<TestAppFactory>
{
    [Fact]
    public async Task ADMIN_F_010_ohne_Anmeldung_wird_der_Zugriff_serverseitig_abgelehnt()
    {
        var client = factory.CreateClient();

        var response = await client.GetAsync("/v1/verwaltung/stammdaten");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task ADMIN_F_010_angemeldet_ohne_Verwaltungsrolle_wird_abgelehnt()
    {
        var client = factory.CreateClientMitGruppen("Studierende");

        var response = await client.GetAsync("/v1/verwaltung/stammdaten");

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task API_F_250_Rolle_aus_dem_Gruppen_Claim_oeffnet_den_Verwaltungsbereich()
    {
        var client = factory.CreateClientMitGruppen("FSR-Redaktion");

        var response = await client.GetAsync("/v1/verwaltung/stammdaten");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.True(response.Headers.TryGetValues("ETag", out _));
    }

    [Fact]
    public async Task ADMIN_F_010_Moderation_allein_genuegt_fuer_Redaktionsfunktionen_nicht()
    {
        var client = factory.CreateClientAls(Rolle.Moderation);

        var response = await client.GetAsync("/v1/verwaltung/laufwege");

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }
}
