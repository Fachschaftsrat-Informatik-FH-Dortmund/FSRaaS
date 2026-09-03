using System.Net;
using Fb4.Backend.Contract.Generated;
using Fb4.Backend.Tests.Infrastruktur;
using Xunit;

namespace Fb4.Backend.Tests;

public class RollenEndpointTests(TestAppFactory factory) : IClassFixture<TestAppFactory>
{
    [Fact]
    public async Task ADMIN_F_070_Rollenliste_erfordert_die_Rolle_FSR_Redaktion()
    {
        var client = factory.CreateClientMitGruppen("Studierende");

        var response = await client.GetAsync("/v1/verwaltung/rollen");

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task ADMIN_F_070_ohne_Authentik_Verwaltungs_API_meldet_der_Endpunkt_nicht_verfuegbar()
    {
        var client = factory.CreateClientAls(Rolle.FsrRedaktion);

        var response = await client.GetAsync("/v1/verwaltung/rollen");

        Assert.Equal(HttpStatusCode.ServiceUnavailable, response.StatusCode);
    }
}
