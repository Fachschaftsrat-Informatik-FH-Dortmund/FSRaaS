using System.Net.Http.Json;
using Fb4.Backend.Contract.Generated;
using Fb4.Backend.Domain;
using Fb4.Backend.Infrastructure;
using Fb4.Backend.Infrastructure.Audit;
using Fb4.Backend.Tests.Infrastruktur;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace Fb4.Backend.Tests;

public class VerwaltungsprotokollTests(TestAppFactory factory) : IClassFixture<TestAppFactory>
{
    [Fact]
    public async Task ADMIN_F_110_jede_veraendernde_Handlung_wird_mit_Zeitpunkt_und_Konto_protokolliert()
    {
        var client = factory.CreateClientAls(Rolle.FsrRedaktion);
        var get = await client.GetAsync("/v1/verwaltung/stammdaten");
        var etag = get.Headers.ETag!.Tag;
        var daten = await get.Content.ReadFromJsonAsync<Stammdaten>();

        var put = new HttpRequestMessage(HttpMethod.Put, "/v1/verwaltung/stammdaten") { Content = JsonContent.Create(daten) };
        put.Headers.TryAddWithoutValidation("If-Match", etag);
        (await client.SendAsync(put)).EnsureSuccessStatusCode();

        using var scope = factory.NewScope();
        var db = scope.ServiceProvider.GetRequiredService<Fb4DbContext>();
        var eintrag = await db.Verwaltungsprotokolle.OrderByDescending(p => p.ZeitpunktUtc).FirstAsync();

        Assert.Equal("stammdaten.ersetzt", eintrag.Handlung);
        Assert.Equal("stammdaten", eintrag.DatensatzReferenz);
        Assert.Equal("konto-test", eintrag.KontoId);
        Assert.NotEqual(default, eintrag.ZeitpunktUtc);
    }

    [Fact]
    public async Task ADMIN_N_020_Eintraege_juenger_als_zwoelf_Monate_bleiben_erhalten_aeltere_werden_entfernt()
    {
        using var scope = factory.NewScope();
        var db = scope.ServiceProvider.GetRequiredService<Fb4DbContext>();
        var jetzt = DateTimeOffset.UtcNow;

        db.Verwaltungsprotokolle.Add(new Verwaltungsprotokoll
        {
            ZeitpunktUtc = jetzt.AddMonths(-6), KontoId = "a", Handlung = "x", DatensatzReferenz = "y",
        });
        db.Verwaltungsprotokolle.Add(new Verwaltungsprotokoll
        {
            ZeitpunktUtc = jetzt.AddMonths(-18), KontoId = "b", Handlung = "x", DatensatzReferenz = "y",
        });
        await db.SaveChangesAsync();

        var entfernt = await VerwaltungsprotokollAufbewahrung.EntferneAelterAlsAsync(db, jetzt);

        Assert.Equal(1, entfernt);
        Assert.Single(await db.Verwaltungsprotokolle.Where(p => p.KontoId == "a").ToListAsync());
        Assert.Empty(await db.Verwaltungsprotokolle.Where(p => p.KontoId == "b").ToListAsync());
    }
}
