using System.Net;
using System.Text;
using Fb4.Backend.Contract.Generated;
using Fb4.Backend.Infrastructure;
using Fb4.Backend.Infrastructure.Auth;
using Microsoft.Extensions.Options;
using Xunit;

namespace Fb4.Backend.Tests;

/// <summary>
/// Vertragstest für die Authentik-Verwaltungs-API (INT-012), QA-N-070: die
/// Auswertung der Antwortstruktur muss bei struktureller Abweichung sichtbar
/// fehlschlagen, statt sie stillschweigend weiterzuverarbeiten. Solange keine
/// Instanz mit Schreibtoken bereitsteht, ist dies der einzige Nachweis für
/// ADMIN-F-070 (siehe Prüfprotokoll 2026-09-02).
/// </summary>
public class AuthentikDirectoryContractTests
{
    static AuthentikDirectory Mit(Func<HttpRequestMessage, HttpResponseMessage> antwort)
    {
        var http = new HttpClient(new StubHandler(antwort)) { BaseAddress = new Uri("https://auth.test/api/v3/") };
        var options = Options.Create(new AuthentikOptions
        {
            ManagementApiBaseUrl = "https://auth.test/api/v3/",
            ManagementApiToken = "token",
            RedaktionGruppe = "FSR-Redaktion",
            ModerationGruppe = "Moderation",
        });
        return new AuthentikDirectory(http, options);
    }

    [Fact]
    public async Task QA_N_070_dokumentierte_Antwortstruktur_wird_zu_Rollenzuweisungen_ausgewertet()
    {
        var dir = Mit(req =>
        {
            var url = req.RequestUri!.ToString();
            string body = url switch
            {
                var u when u.Contains("groups/?name=FSR-Redaktion") =>
                    """{"results":[{"pk":"grp-red","name":"FSR-Redaktion"}]}""",
                var u when u.Contains("groups/?name=Moderation") =>
                    """{"results":[{"pk":"grp-mod","name":"Moderation"}]}""",
                var u when u.Contains("groups/grp-red/") =>
                    """{"pk":"grp-red","name":"FSR-Redaktion","users_obj":[{"pk":1,"username":"alice","name":"Alice A."}]}""",
                var u when u.Contains("groups/grp-mod/") =>
                    """{"pk":"grp-mod","name":"Moderation","users_obj":[]}""",
                _ => "{}",
            };
            return Json(body);
        });

        var zuweisungen = await dir.ListeRollenzuweisungenAsync(default);

        var alice = Assert.Single(zuweisungen);
        Assert.Equal("1", alice.KontoId);
        Assert.Equal("Alice A.", alice.Anzeigename);
        Assert.Contains(Rolle.FsrRedaktion, alice.Rollen);
    }

    [Fact]
    public async Task ADMIN_F_070_Benutzername_wird_zur_stabilen_Konto_Id_aufgeloest()
    {
        var dir = Mit(req => req.RequestUri!.ToString().Contains("core/users/?username=tobi")
            ? Json("""{"results":[{"pk":42,"username":"tobi","name":"Tobi B."}]}""")
            : Json("""{"results":[]}"""));

        Assert.Equal("42", await dir.KontoIdAufloesenAsync("tobi", default));
    }

    [Fact]
    public async Task ADMIN_F_070_bereits_numerische_Kennung_wird_ohne_Netzaufruf_uebernommen()
    {
        var dir = Mit(_ => throw new InvalidOperationException("Für eine numerische Kennung darf kein Aufruf erfolgen."));

        Assert.Equal("42", await dir.KontoIdAufloesenAsync("42", default));
    }

    [Fact]
    public async Task ADMIN_F_070_unbekannter_Benutzername_wird_als_404_gemeldet()
    {
        var dir = Mit(_ => Json("""{"results":[]}"""));

        var fehler = await Assert.ThrowsAsync<ApiException>(() => dir.KontoIdAufloesenAsync("niemand", default));
        Assert.Equal(404, fehler.Status);
        Assert.Equal("konto_unbekannt", fehler.Code);
    }

    [Fact]
    public async Task QA_N_070_strukturelle_Abweichung_schlaegt_sichtbar_fehl()
    {
        var dir = Mit(req =>
        {
            var url = req.RequestUri!.ToString();
            if (url.Contains("groups/?name="))
                return Json("""{"results":[{"pk":"g","name":"FSR-Redaktion"}]}""");
            // Abweichung: Mitgliederabruf liefert einen Serverfehler statt der Gruppe.
            return new HttpResponseMessage(HttpStatusCode.InternalServerError);
        });

        var fehler = await Assert.ThrowsAsync<ApiException>(() => dir.SetzeRollenAsync("u1", [Rolle.FsrRedaktion], default));
        Assert.Equal("authentik_strukturbruch", fehler.Code);
    }

    [Fact]
    public async Task ADMIN_F_070_ohne_konfigurierte_Verwaltungs_API_wird_der_Zustand_als_nicht_verfuegbar_gemeldet()
    {
        IAuthentikDirectory dir = new NichtKonfigurierteAuthentikDirectory();

        var fehler = await Assert.ThrowsAsync<ApiException>(() => dir.ListeRollenzuweisungenAsync(default));
        Assert.Equal(503, fehler.Status);
        Assert.Equal("authentik_nicht_verfuegbar", fehler.Code);
    }

    static HttpResponseMessage Json(string body) => new(HttpStatusCode.OK)
    {
        Content = new StringContent(body, Encoding.UTF8, "application/json"),
    };

    sealed class StubHandler(Func<HttpRequestMessage, HttpResponseMessage> antwort) : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
            => Task.FromResult(antwort(request));
    }
}
