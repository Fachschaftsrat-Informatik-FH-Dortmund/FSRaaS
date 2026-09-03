using System.Net;
using System.Text;
using Fb4.Backend.Domain;
using Fb4.Backend.Infrastructure;
using Fb4.Backend.Infrastructure.Mensa;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;

namespace Fb4.Backend.Tests;

/// <summary>
/// API-F-070/F-075 und API-F-260: der periodische Job füllt den Zwischenspeicher
/// aus INT-015 (Stub) und meldet das Ergebnis an die Job-Statusregistrierung.
/// </summary>
public class SpeiseplanAktualisierungJobTests
{
    // Router-Stub: liefert je Pfadsegment eine aufgezeichnete Antwort.
    sealed class RouterHandler : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken ct)
        {
            var pfad = request.RequestUri!.AbsolutePath;
            string body = pfad switch
            {
                var p when p.EndsWith("/types") => """[{"id":"N","name":{"de":"Vegan","en":"Vegan"}}]""",
                var p when p.EndsWith("/additives") => """[{"id":"2","name":{"de":"mit Konservierungsstoffen","en":"with preservatives"}}]""",
                var p when p.EndsWith("/canteens/341") => """
                    {"2026-09-03":[
                      {"title":{"de":"Bolognese (2)","en":"bolognese (2)"},"type":["N"],"additives":["2"],
                       "price":{"student":"3,30 €","staff":"5,40 €","guest":"6,50 €"},
                       "counter":"Menü 1","counterNames":{"de":"Menü 1","en":"Menu 1"},"position":0}]}
                    """,
                _ => "[]",
            };
            return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(body, Encoding.UTF8, "application/json"),
            });
        }
    }

    static ServiceProvider Provider(out string dbName)
    {
        dbName = "job-" + Guid.NewGuid().ToString("N");
        var name = dbName;
        var services = new ServiceCollection();
        services.AddDbContext<Fb4DbContext>(o => o.UseInMemoryDatabase(name));
        services.AddSingleton<JobStatusRegistry>();
        services.AddScoped(_ =>
        {
            var http = new HttpClient(new RouterHandler())
            {
                BaseAddress = new Uri("https://mobil.itmc.tu-dortmund.de/canteen-menu/v3/"),
            };
            return new ItmcMensaClient(http);
        });
        return services.BuildServiceProvider();
    }

    [Fact]
    public async Task API_F_070_Job_fuellt_den_Zwischenspeicher_mit_normalisiertem_Schluessel()
    {
        var provider = Provider(out _);
        using (var scope = provider.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<Fb4DbContext>();
            db.Mensen.Add(new MensaEintrag { Id = "Mensa", Name = "Hauptmensa", QuelleId = "341", Reihenfolge = 10 });
            await db.SaveChangesAsync();
        }

        var job = new SpeiseplanAktualisierungJob(
            provider.GetRequiredService<IServiceScopeFactory>(),
            provider.GetRequiredService<JobStatusRegistry>(),
            NullLogger<SpeiseplanAktualisierungJob>.Instance);
        await job.RunOnceForTestAsync();

        using var pruef = provider.CreateScope();
        var db2 = pruef.ServiceProvider.GetRequiredService<Fb4DbContext>();
        var tag = await db2.Speiseplaene.SingleAsync();
        Assert.Equal("Mensa", tag.MensaId);
        Assert.Contains("bolognese", tag.GerichteJson);
        Assert.Contains("\"schluessel\":\"bolognese\"", tag.GerichteJson);
        Assert.True(await db2.MensaVerzeichnis.AnyAsync(e => e.Art == "kennzeichnung" && e.QuelleId == "N"));
        Assert.True(await db2.MensaVerzeichnis.AnyAsync(e => e.Art == "kategorie"));
        Assert.True((await db2.MensaStand.SingleAsync()).QuelleErreichbar);
    }

    [Fact]
    public async Task API_F_070_leerer_Mensa_Bestand_laeuft_ohne_Fehler_durch()
    {
        var provider = Provider(out _);
        var job = new SpeiseplanAktualisierungJob(
            provider.GetRequiredService<IServiceScopeFactory>(),
            provider.GetRequiredService<JobStatusRegistry>(),
            NullLogger<SpeiseplanAktualisierungJob>.Instance);

        await job.RunOnceForTestAsync();

        using var scope = provider.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<Fb4DbContext>();
        Assert.Empty(await db.Speiseplaene.ToListAsync());
        // Verzeichnisse werden auch ohne Mensen abgerufen.
        Assert.True(await db.MensaVerzeichnis.AnyAsync(e => e.Art == "zusatzstoff"));
    }
}
