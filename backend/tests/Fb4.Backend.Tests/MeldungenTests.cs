using System.Net;
using System.Net.Http.Json;
using Fb4.Backend.Contract.Generated;
using Fb4.Backend.Domain;
using Fb4.Backend.Infrastructure;
using Fb4.Backend.Tests.Infrastruktur;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace Fb4.Backend.Tests;

// Change `news-redaktion`: Lesepfad der Capability `news` und Redaktion nach
// Capability `admin`. Klassennamen tragen den Requirement-Titel, Methodennamen
// das Scenario.

static class Redaktion
{
    public static async Task<Meldungsentwurf> Anlegen(HttpClient c, string titel = "Titel", string text = "Text")
    {
        var r = await c.PostAsJsonAsync("/v1/meldungen/entwuerfe", new MeldungsentwurfEingabe { Titel = titel, Text = text });
        Assert.Equal(HttpStatusCode.Created, r.StatusCode);
        return (await r.Content.ReadFromJsonAsync<Meldungsentwurf>())!;
    }

    public static Task<HttpResponseMessage> Aendern(HttpClient c, Guid id, string etag, string titel, string text)
    {
        var req = new HttpRequestMessage(HttpMethod.Put, $"/v1/meldungen/entwuerfe/{id}")
        {
            Content = JsonContent.Create(new MeldungsentwurfEingabe { Titel = titel, Text = text }),
        };
        req.Headers.TryAddWithoutValidation("If-Match", etag);
        return c.SendAsync(req);
    }

    public static Task<HttpResponseMessage> Veroeffentlichen(HttpClient c, Guid id, string etag)
    {
        var req = new HttpRequestMessage(HttpMethod.Put, $"/v1/meldungen/entwuerfe/{id}/veroeffentlichung");
        req.Headers.TryAddWithoutValidation("If-Match", etag);
        return c.SendAsync(req);
    }

    public static async Task<Meldungsentwurf> AnlegenUndVeroeffentlichen(HttpClient c, string titel = "Titel", string text = "Text")
    {
        var e = await Anlegen(c, titel, text);
        var r = await Veroeffentlichen(c, e.Id, e.Etag);
        r.EnsureSuccessStatusCode();
        return (await r.Content.ReadFromJsonAsync<Meldungsentwurf>())!;
    }

    public static Task<HttpResponseMessage> Zurueckziehen(HttpClient c, Guid id) =>
        c.DeleteAsync($"/v1/meldungen/entwuerfe/{id}/veroeffentlichung");

    public static async Task<Meldungsseite> Seite(HttpClient c, string query = "")
    {
        var r = await c.GetAsync($"/v1/meldungen{query}");
        r.EnsureSuccessStatusCode();
        return (await r.Content.ReadFromJsonAsync<Meldungsseite>())!;
    }
}

public class LadenUndAnzeigeAktuellerMeldungen(TestAppFactory factory) : IClassFixture<TestAppFactory>
{
    [Fact]
    public async Task Meldungen_laden_ohne_Konto_absteigend_chronologisch()
    {
        var redaktion = factory.CreateClientAls(Rolle.FsrRedaktion);
        var aelter = await Redaktion.AnlegenUndVeroeffentlichen(redaktion, "Ältere");
        await Task.Delay(5);
        var neuer = await Redaktion.AnlegenUndVeroeffentlichen(redaktion, "Neuere");

        var seite = await Redaktion.Seite(factory.CreateClient());

        var ids = seite.Meldungen.Select(m => m.Id).ToList();
        Assert.True(ids.IndexOf(neuer.Id) < ids.IndexOf(aelter.Id));
        var m = seite.Meldungen.Single(x => x.Id == neuer.Id);
        Assert.Equal(Klassifizierung.FsrNews, m.Klassifizierung);
        Assert.Equal("FSR FB4", m.Quelle);
        Assert.NotNull(m.VeroeffentlichtAm);
        Assert.True(seite.StandAlter.AbgerufenAm > DateTimeOffset.UtcNow.AddMinutes(-1));
    }

    [Fact]
    public async Task Unbekannte_Klassifizierung_wird_abgewiesen()
    {
        var r = await factory.CreateClient().GetAsync("/v1/meldungen?klassifizierung=gibtsnicht");
        Assert.Equal(HttpStatusCode.BadRequest, r.StatusCode);
        Assert.Contains("klassifizierung_ungueltig", await r.Content.ReadAsStringAsync());
    }
}

public class NachladenAeltererMeldungen(TestAppFactory factory) : IClassFixture<TestAppFactory>
{
    [Fact]
    public async Task Ans_Ende_der_Liste_blaettern_liefert_jede_Meldung_genau_einmal()
    {
        // Sieben Meldungen, darunter drei mit identischem Zeitpunkt: der Cursor
        // muss den Gleichstand über die Kennung auflösen (design.md D3).
        var basis = new DateTimeOffset(2026, 11, 1, 12, 0, 0, TimeSpan.Zero);
        using (var scope = factory.NewScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<Fb4DbContext>();
            for (var i = 0; i < 7; i++)
            {
                db.Meldungen.Add(new Meldungseintrag
                {
                    Titel = $"M{i}",
                    Text = "x",
                    Zustand = MeldungsZustaende.Veroeffentlicht,
                    Quelle = "FSR FB4",
                    VeroeffentlichtAm = i < 3 ? basis : basis.AddHours(-i),
                    AngelegtAm = basis,
                    GeaendertAm = basis,
                });
            }
            await db.SaveChangesAsync();
        }

        var client = factory.CreateClient();
        var gesehen = new List<Meldung>();
        string? cursor = null;
        var seiten = 0;
        do
        {
            var query = "?limit=2" + (cursor is null ? "" : $"&cursor={Uri.EscapeDataString(cursor)}");
            var seite = await Redaktion.Seite(client, query);
            Assert.True(seite.Meldungen.Count <= 2);
            gesehen.AddRange(seite.Meldungen);
            cursor = seite.NaechsterCursor;
            seiten++;
        } while (cursor is not null && seiten < 10);

        Assert.Equal(7, gesehen.Count);
        Assert.Equal(7, gesehen.Select(m => m.Id).Distinct().Count());
        Assert.Equal(gesehen.OrderByDescending(m => m.VeroeffentlichtAm).Select(m => m.VeroeffentlichtAm),
            gesehen.Select(m => m.VeroeffentlichtAm));
        Assert.Equal(4, seiten);
    }

    [Theory]
    [InlineData("?cursor=kaputt", "cursor_ungueltig")]
    [InlineData("?limit=0", "limit_ungueltig")]
    [InlineData("?limit=101", "limit_ungueltig")]
    public async Task Ungueltiger_Cursor_oder_Seitengroesse_wird_abgewiesen(string query, string code)
    {
        var r = await factory.CreateClient().GetAsync($"/v1/meldungen{query}");
        Assert.Equal(HttpStatusCode.BadRequest, r.StatusCode);
        Assert.Contains(code, await r.Content.ReadAsStringAsync());
    }
}

public class MeldungsredaktionFuerFsrNews(TestAppFactory factory) : IClassFixture<TestAppFactory>
{
    [Fact]
    public async Task Meldung_anlegen_und_veroeffentlichen()
    {
        var redaktion = factory.CreateClientAls(Rolle.FsrRedaktion);
        var e = await Redaktion.Anlegen(redaktion, "Sommerfest", "Am Freitag im Innenhof.");
        Assert.Equal(Meldungszustand.Entwurf, e.Zustand);
        Assert.Null(e.VeroeffentlichtAm);

        var r = await Redaktion.Veroeffentlichen(redaktion, e.Id, e.Etag);
        r.EnsureSuccessStatusCode();
        var v = (await r.Content.ReadFromJsonAsync<Meldungsentwurf>())!;
        Assert.Equal(Meldungszustand.Veroeffentlicht, v.Zustand);
        Assert.NotNull(v.VeroeffentlichtAm);

        var seite = await Redaktion.Seite(factory.CreateClient());
        var m = Assert.Single(seite.Meldungen, x => x.Id == e.Id);
        Assert.Equal("Sommerfest", m.Titel);
        Assert.Equal(Klassifizierung.FsrNews, m.Klassifizierung);
    }

    [Fact]
    public async Task Entwurf_bleibt_unsichtbar()
    {
        var redaktion = factory.CreateClientAls(Rolle.FsrRedaktion);
        var e = await Redaktion.Anlegen(redaktion, "Geheim");

        var seite = await Redaktion.Seite(factory.CreateClient());
        Assert.DoesNotContain(seite.Meldungen, m => m.Id == e.Id);

        var alle = await redaktion.GetFromJsonAsync<List<Meldungsentwurf>>("/v1/meldungen/entwuerfe");
        Assert.Contains(alle!, x => x.Id == e.Id && x.Zustand == Meldungszustand.Entwurf);
    }

    [Fact]
    public async Task Veroeffentlichte_Meldung_korrigieren()
    {
        var redaktion = factory.CreateClientAls(Rolle.FsrRedaktion);
        var v = await Redaktion.AnlegenUndVeroeffentlichen(redaktion, "Titel", "Tippfeler");

        var r = await Redaktion.Aendern(redaktion, v.Id, v.Etag, "Titel", "Tippfehler");
        r.EnsureSuccessStatusCode();
        var g = (await r.Content.ReadFromJsonAsync<Meldungsentwurf>())!;
        Assert.Equal(Meldungszustand.Veroeffentlicht, g.Zustand);
        Assert.Equal(v.VeroeffentlichtAm, g.VeroeffentlichtAm);
        Assert.NotEqual(v.Etag, g.Etag);

        var m = (await Redaktion.Seite(factory.CreateClient())).Meldungen.Single(x => x.Id == v.Id);
        Assert.Equal("Tippfehler", m.Text);
        Assert.Equal(v.VeroeffentlichtAm, m.VeroeffentlichtAm);
    }

    [Theory]
    [InlineData("", "Text", "titel_leer")]
    [InlineData("   ", "Text", "titel_leer")]
    [InlineData("Titel", "", "text_leer")]
    public async Task Leerer_Titel_oder_Text_wird_abgewiesen(string titel, string text, string code)
    {
        var redaktion = factory.CreateClientAls(Rolle.FsrRedaktion);
        var r = await redaktion.PostAsJsonAsync("/v1/meldungen/entwuerfe", new MeldungsentwurfEingabe { Titel = titel, Text = text });
        Assert.Equal(HttpStatusCode.BadRequest, r.StatusCode);
        Assert.Contains(code, await r.Content.ReadAsStringAsync());
    }

    [Fact]
    public async Task Zu_langer_Titel_wird_abgewiesen()
    {
        var redaktion = factory.CreateClientAls(Rolle.FsrRedaktion);
        var r = await redaktion.PostAsJsonAsync("/v1/meldungen/entwuerfe",
            new MeldungsentwurfEingabe { Titel = new string('x', 201), Text = "Text" });
        Assert.Equal(HttpStatusCode.BadRequest, r.StatusCode);
        Assert.Contains("titel_zu_lang", await r.Content.ReadAsStringAsync());
    }

    [Fact]
    public async Task Zurueckgezogene_Meldung_erneut_veroeffentlichen()
    {
        var redaktion = factory.CreateClientAls(Rolle.FsrRedaktion);
        var v = await Redaktion.AnlegenUndVeroeffentlichen(redaktion);
        (await Redaktion.Zurueckziehen(redaktion, v.Id)).EnsureSuccessStatusCode();
        await Task.Delay(5);

        var aktuell = (await redaktion.GetFromJsonAsync<Meldungsentwurf>($"/v1/meldungen/entwuerfe/{v.Id}"))!;
        Assert.Equal(Meldungszustand.Zurueckgezogen, aktuell.Zustand);
        var r = await Redaktion.Veroeffentlichen(redaktion, v.Id, aktuell.Etag);
        r.EnsureSuccessStatusCode();
        var erneut = (await r.Content.ReadFromJsonAsync<Meldungsentwurf>())!;
        Assert.True(erneut.VeroeffentlichtAm > v.VeroeffentlichtAm);

        var seite = await Redaktion.Seite(factory.CreateClient());
        Assert.Contains(seite.Meldungen, m => m.Id == v.Id);
        Assert.DoesNotContain(v.Id, seite.Zurueckgezogen);
    }

    [Fact]
    public async Task Erneutes_Veroeffentlichen_einer_veroeffentlichten_Meldung_aendert_nichts()
    {
        var redaktion = factory.CreateClientAls(Rolle.FsrRedaktion);
        var v = await Redaktion.AnlegenUndVeroeffentlichen(redaktion);
        var r = await Redaktion.Veroeffentlichen(redaktion, v.Id, v.Etag);
        r.EnsureSuccessStatusCode();
        var nochmal = (await r.Content.ReadFromJsonAsync<Meldungsentwurf>())!;
        Assert.Equal(v.VeroeffentlichtAm, nochmal.VeroeffentlichtAm);
        Assert.Equal(v.Etag, nochmal.Etag);
    }

    [Fact]
    public async Task Entwurf_kann_nicht_zurueckgezogen_werden()
    {
        var redaktion = factory.CreateClientAls(Rolle.FsrRedaktion);
        var e = await Redaktion.Anlegen(redaktion);
        var r = await Redaktion.Zurueckziehen(redaktion, e.Id);
        Assert.Equal(HttpStatusCode.Conflict, r.StatusCode);
        Assert.Contains("nicht_veroeffentlicht", await r.Content.ReadAsStringAsync());
    }

    [Fact]
    public async Task Unbekannte_Meldung_ergibt_404()
    {
        var redaktion = factory.CreateClientAls(Rolle.FsrRedaktion);
        var r = await redaktion.GetAsync($"/v1/meldungen/entwuerfe/{Guid.NewGuid()}");
        Assert.Equal(HttpStatusCode.NotFound, r.StatusCode);
        Assert.Contains("meldung_unbekannt", await r.Content.ReadAsStringAsync());
    }
}

public class EntfernenZurueckgezogenerMeldungenAusDerListe(TestAppFactory factory) : IClassFixture<TestAppFactory>
{
    [Fact]
    public async Task Angepinnte_Meldung_wird_zurueckgezogen()
    {
        var redaktion = factory.CreateClientAls(Rolle.FsrRedaktion);
        var v = await Redaktion.AnlegenUndVeroeffentlichen(redaktion, "Wird zurückgezogen");

        var r = await Redaktion.Zurueckziehen(redaktion, v.Id);
        Assert.Equal(HttpStatusCode.NoContent, r.StatusCode);

        // Aus der Liste entfernt, Kennung zum Abgleich angepinnter Verweise geliefert.
        var seite = await Redaktion.Seite(factory.CreateClient());
        Assert.DoesNotContain(seite.Meldungen, m => m.Id == v.Id);
        Assert.Contains(v.Id, seite.Zurueckgezogen);

        // Zweites Zurückziehen ist ohne Wirkung.
        Assert.Equal(HttpStatusCode.NoContent, (await Redaktion.Zurueckziehen(redaktion, v.Id)).StatusCode);
    }
}

public class AblehnungBeiGleichzeitigerAenderungEinerMeldung(TestAppFactory factory) : IClassFixture<TestAppFactory>
{
    [Fact]
    public async Task Zweiter_Speichervorgang()
    {
        var redaktion = factory.CreateClientAls(Rolle.FsrRedaktion);
        var e = await Redaktion.Anlegen(redaktion, "Stand A");

        // Person 1 speichert mit dem geladenen Stand, Person 2 danach mit demselben.
        (await Redaktion.Aendern(redaktion, e.Id, e.Etag, "Stand B", "Text")).EnsureSuccessStatusCode();
        var r = await Redaktion.Aendern(redaktion, e.Id, e.Etag, "Stand C", "Text");
        Assert.Equal(HttpStatusCode.PreconditionFailed, r.StatusCode);
        Assert.Contains("stand_veraltet", await r.Content.ReadAsStringAsync());

        // Der neuere Stand ist abrufbar und unverändert.
        var neuer = await redaktion.GetAsync($"/v1/meldungen/entwuerfe/{e.Id}");
        var m = (await neuer.Content.ReadFromJsonAsync<Meldungsentwurf>())!;
        Assert.Equal("Stand B", m.Titel);
        Assert.Equal(m.Etag, neuer.Headers.ETag!.Tag);
    }

    [Fact]
    public async Task Veroeffentlichen_eines_ueberholten_Stands()
    {
        var redaktion = factory.CreateClientAls(Rolle.FsrRedaktion);
        var e = await Redaktion.Anlegen(redaktion, "Vorschau-Stand");
        (await Redaktion.Aendern(redaktion, e.Id, e.Etag, "Anderer Stand", "Text")).EnsureSuccessStatusCode();

        var r = await Redaktion.Veroeffentlichen(redaktion, e.Id, e.Etag);
        Assert.Equal(HttpStatusCode.PreconditionFailed, r.StatusCode);
        var seite = await Redaktion.Seite(factory.CreateClient());
        Assert.DoesNotContain(seite.Meldungen, m => m.Id == e.Id);
    }

    [Fact]
    public async Task Fehlendes_If_Match_wird_abgewiesen()
    {
        var redaktion = factory.CreateClientAls(Rolle.FsrRedaktion);
        var e = await Redaktion.Anlegen(redaktion);
        var r = await redaktion.PutAsJsonAsync($"/v1/meldungen/entwuerfe/{e.Id}",
            new MeldungsentwurfEingabe { Titel = "x", Text = "y" });
        Assert.Equal(HttpStatusCode.PreconditionFailed, r.StatusCode);
    }
}

public class MeldungsredaktionAblehnungDesZugriffsOhneVerwaltungsrolle(TestAppFactory factory) : IClassFixture<TestAppFactory>
{
    // Requirement „Ablehnung des Zugriffs ohne Verwaltungsrolle" für die Meldungsredaktion.
    [Theory]
    [InlineData("GET", "/v1/meldungen/entwuerfe")]
    [InlineData("POST", "/v1/meldungen/entwuerfe")]
    [InlineData("PUT", "/v1/meldungen/entwuerfe/00000000-0000-0000-0000-000000000001")]
    [InlineData("PUT", "/v1/meldungen/entwuerfe/00000000-0000-0000-0000-000000000001/veroeffentlichung")]
    [InlineData("DELETE", "/v1/meldungen/entwuerfe/00000000-0000-0000-0000-000000000001/veroeffentlichung")]
    public async Task Ohne_Anmeldung_401_mit_Moderation_403(string methode, string pfad)
    {
        HttpRequestMessage Anfrage() => new(new HttpMethod(methode), pfad)
        {
            Content = methode is "POST" or "PUT"
                ? JsonContent.Create(new MeldungsentwurfEingabe { Titel = "x", Text = "y" })
                : null,
        };

        var anonym = await factory.CreateClient().SendAsync(Anfrage());
        Assert.Equal(HttpStatusCode.Unauthorized, anonym.StatusCode);

        var moderation = await factory.CreateClientAls(Rolle.Moderation).SendAsync(Anfrage());
        Assert.Equal(HttpStatusCode.Forbidden, moderation.StatusCode);
    }
}

public class MeldungsredaktionProtokollierungVeraendernderVerwaltungshandlungen(TestAppFactory factory) : IClassFixture<TestAppFactory>
{
    // Requirement „Protokollierung verändernder Verwaltungshandlungen": Zeitpunkt,
    // Konto und Datensatz je Handlung, kein Inhalt der Meldung.
    [Fact]
    public async Task Jede_Redaktionshandlung_wird_ohne_Inhalt_protokolliert()
    {
        var redaktion = factory.CreateClientAls(Rolle.FsrRedaktion);
        var e = await Redaktion.Anlegen(redaktion, "Protokolltitel", "Protokolltext");
        var r = await Redaktion.Aendern(redaktion, e.Id, e.Etag, "Protokolltitel 2", "Protokolltext 2");
        var g = (await r.Content.ReadFromJsonAsync<Meldungsentwurf>())!;
        (await Redaktion.Veroeffentlichen(redaktion, e.Id, g.Etag)).EnsureSuccessStatusCode();
        (await Redaktion.Zurueckziehen(redaktion, e.Id)).EnsureSuccessStatusCode();

        using var scope = factory.NewScope();
        var db = scope.ServiceProvider.GetRequiredService<Fb4DbContext>();
        var eintraege = await db.Verwaltungsprotokolle
            .Where(p => p.DatensatzReferenz == $"meldung:{e.Id}")
            .OrderBy(p => p.ZeitpunktUtc)
            .ToListAsync();

        Assert.Equal(
            ["meldung.angelegt", "meldung.geaendert", "meldung.veroeffentlicht", "meldung.zurueckgezogen"],
            eintraege.Select(p => p.Handlung).ToArray());
        Assert.All(eintraege, p =>
        {
            Assert.Equal("konto-test", p.KontoId);
            Assert.DoesNotContain("Protokoll", p.Handlung + p.DatensatzReferenz);
        });
    }
}

public class NachladenAeltererMeldungenGegenPostgreSql
{
    // Die übrigen Tests laufen auf dem In-Memory-Anbieter, der die Abfrage in .NET
    // auswertet. Hier wird dieselbe Seitenabfrage mit dem Npgsql-Anbieter nach SQL
    // übersetzt (ohne Verbindung): Scheitert die Übersetzung von Cursor-Vergleich
    // oder Ordnung, fällt das hier auf statt erst im Betrieb.
    [Fact]
    public void Cursor_Abfrage_ist_nach_SQL_uebersetzbar()
    {
        var options = new DbContextOptionsBuilder<Fb4DbContext>()
            .UseNpgsql("Host=localhost;Database=nicht-verbunden")
            .Options;
        using var db = new Fb4DbContext(options);

        var sql = Fb4.Backend.Endpoints.MeldungenStore.SeitenAbfrage(
                db.Meldungen, "fsr-news", (DateTimeOffset.UtcNow, Guid.NewGuid().ToString()))
            .Take(26)
            .ToQueryString();

        Assert.Contains("\"VeroeffentlichtAm\" <", sql);
        Assert.Contains("ORDER BY", sql);
        Assert.Contains("::text", sql);
    }
}
