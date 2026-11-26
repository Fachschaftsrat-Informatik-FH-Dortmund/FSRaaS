using System.Net;
using Fb4.Backend.Infrastructure;
using Fb4.Backend.Tests.Infrastruktur;
using Microsoft.AspNetCore.Hosting;
using Xunit;

namespace Fb4.Backend.Tests;

/// <summary>
/// Auslieferung des Expo-Web-Exports unter /admin (ADR 0018). Der Export wird
/// hier durch einen Ordner mit derselben Struktur ersetzt, wie
/// <c>npx expo export --platform web</c> sie mit <c>experiments.baseUrl='/admin'</c>
/// erzeugt: <c>index.html</c> plus Bundles unter <c>_expo/static/js/web/</c>.
/// </summary>
public class VerwaltungsoberflaecheAuslieferungTests : IClassFixture<TestAppFactory>, IDisposable
{
    const string IndexHtml =
        "<html><body><div id=\"root\"></div>" +
        "<script src=\"/admin/_expo/static/js/web/entry-abc123.js\" defer></script></body></html>";
    const string EntryJs = "console.log('verwaltung');";

    readonly string _exportOrdner;
    readonly HttpClient _client;

    public VerwaltungsoberflaecheAuslieferungTests(TestAppFactory factory)
    {
        _exportOrdner = Path.Combine(Path.GetTempPath(), "fb4-admin-export-" + Guid.NewGuid().ToString("N"));
        var jsOrdner = Path.Combine(_exportOrdner, "_expo", "static", "js", "web");
        Directory.CreateDirectory(jsOrdner);
        File.WriteAllText(Path.Combine(_exportOrdner, "index.html"), IndexHtml);
        File.WriteAllText(Path.Combine(jsOrdner, "entry-abc123.js"), EntryJs);

        _client = factory
            .WithWebHostBuilder(b => b.UseSetting(Verwaltungsoberflaeche.PfadSchluessel, _exportOrdner))
            .CreateClient();
    }

    public void Dispose() => Directory.Delete(_exportOrdner, recursive: true);

    [Fact]
    public async Task Auslieferung_der_Weboberflaeche_unter_admin_Skriptbuendel_mit_JavaScript_Typ()
    {
        var response = await _client.GetAsync("/admin/_expo/static/js/web/entry-abc123.js");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("text/javascript", response.Content.Headers.ContentType?.MediaType);
        Assert.Equal(EntryJs, await response.Content.ReadAsStringAsync());
    }

    [Fact]
    public async Task Auslieferung_der_Weboberflaeche_unter_admin_Einstiegsseite()
    {
        var response = await _client.GetAsync("/admin/");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("text/html", response.Content.Headers.ContentType?.MediaType);
        Assert.Equal(IndexHtml, await response.Content.ReadAsStringAsync());
    }

    [Fact]
    public async Task Auslieferung_der_Weboberflaeche_unter_admin_Unterroute_liefert_Einstiegsseite()
    {
        var response = await _client.GetAsync("/admin/verwaltung/rollen");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("text/html", response.Content.Headers.ContentType?.MediaType);
        Assert.Equal(IndexHtml, await response.Content.ReadAsStringAsync());
    }

    [Fact]
    public async Task Auslieferung_der_Weboberflaeche_unter_admin_fehlende_Datei_ergibt_404()
    {
        var response = await _client.GetAsync("/admin/_expo/static/js/web/entry-gibtesnicht.js");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }
}
