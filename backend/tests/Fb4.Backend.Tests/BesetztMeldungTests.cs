using System.Net;
using System.Net.Http.Json;
using Fb4.Backend.Contract.Generated;
using Fb4.Backend.Domain;
using Fb4.Backend.Infrastructure;
using Fb4.Backend.Infrastructure.BesetztMeldungen;
using Fb4.Backend.Tests.Infrastruktur;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace Fb4.Backend.Tests;

/// <summary>
/// Gemeinsamer Aufbau der Besetzt-Meldungs-Tests (Change <c>besetzt-meldungen</c>):
/// Backend mit In-Memory-Datenbank, stellbarer Uhr und befülltem
/// Raumplan-Bestand (A.E.01 und B.1.01, beide offiziell frei).
/// </summary>
public sealed class BesetztMeldungUmgebung : IDisposable
{
    public static readonly DateTimeOffset Start = new(2026, 6, 10, 8, 0, 0, TimeSpan.Zero);

    public sealed class Uhr(DateTimeOffset jetzt) : TimeProvider
    {
        public DateTimeOffset Jetzt { get; set; } = jetzt;
        public override DateTimeOffset GetUtcNow() => Jetzt;
    }

    readonly TestAppFactory _basis = new();
    public Uhr Zeit { get; } = new(Start);
    public WebApplicationFactory<Program> Factory { get; }
    public HttpClient Client { get; }

    public BesetztMeldungUmgebung(int? ratenAnzahl = null, bool mitBestand = true)
    {
        Factory = _basis.WithWebHostBuilder(b =>
        {
            if (ratenAnzahl is { } anzahl)
                b.UseSetting($"{Ratenbegrenzung.Abschnitt}:Anzahl", anzahl.ToString());
            b.ConfigureTestServices(s => s.AddSingleton<TimeProvider>(Zeit));
        });
        Client = Factory.CreateClient();
        if (mitBestand) Befuellen();
    }

    void Befuellen()
    {
        using var scope = Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<Fb4DbContext>();
        db.RaumplanStand.Add(new RaumplanStand
        {
            AbgerufenAm = Start.AddMinutes(-30),
            LetzterVersuchAm = Start.AddMinutes(-30),
            LetzterVersuchErfolgreich = true,
        });
        db.RaumplanRaeume.AddRange(new RaumplanRaum { RoomId = "A.E.01" }, new RaumplanRaum { RoomId = "B.1.01" });
        db.SaveChanges();
    }

    public Task<HttpResponseMessage> Melden(string roomId, Guid? schluessel = null, DateTimeOffset? gemeldetAm = null)
    {
        var anfrage = new HttpRequestMessage(HttpMethod.Post, $"/v1/raeume/{roomId}/besetzt-meldungen")
        {
            Content = JsonContent.Create(new { gemeldetAm = gemeldetAm ?? Zeit.Jetzt }),
        };
        anfrage.Headers.Add("Idempotency-Key", (schluessel ?? Guid.NewGuid()).ToString());
        return Client.SendAsync(anfrage);
    }

    public Task<HttpResponseMessage> Zurueckziehen(string roomId, Guid meldungId) =>
        Client.DeleteAsync($"/v1/raeume/{roomId}/besetzt-meldungen/{meldungId}");

    sealed record Uebersicht(List<RaumStatus> Raeume, StandAlter StandAlter);

    public async Task<RaumStatus> Status(string roomId)
    {
        var antwort = await Client.GetFromJsonAsync<Uebersicht>("/v1/raeume/uebersicht");
        return antwort!.Raeume.Single(r => r.RoomId == roomId);
    }

    public List<BesetztMeldung> Gespeichert()
    {
        using var scope = Factory.Services.CreateScope();
        return scope.ServiceProvider.GetRequiredService<Fb4DbContext>().BesetztMeldungen.AsNoTracking().ToList();
    }

    public void Dispose()
    {
        Client.Dispose();
        Factory.Dispose();
        _basis.Dispose();
    }
}

/// <summary>Requirement „Raum als besetzt melden" (Capability <c>room-finder</c>).</summary>
public class RaumAlsBesetztMelden
{
    [Fact]
    public async Task Meldung_wird_angenommen_und_quittiert()
    {
        using var u = new BesetztMeldungUmgebung();
        var schluessel = Guid.NewGuid();

        var antwort = await u.Melden("A.E.01", schluessel);

        Assert.Equal(HttpStatusCode.Accepted, antwort.StatusCode);
        var quittung = await antwort.Content.ReadFromJsonAsync<BesetztMeldungQuittung>();
        Assert.Equal(schluessel, quittung!.MeldungId);
        Assert.Equal(BesetztMeldungUmgebung.Start.AddMinutes(90), quittung.GueltigBis);
    }

    [Fact]
    public async Task Unabhaengig_vom_offiziellen_Belegungszustand()
    {
        using var u = new BesetztMeldungUmgebung();

        await u.Melden("A.E.01");

        var status = await u.Status("A.E.01");
        Assert.Equal("frei", status.Zustand);
        Assert.Equal(1, status.BesetztMeldungen);
    }

    [Fact]
    public async Task Unbekannter_Raum()
    {
        using var u = new BesetztMeldungUmgebung();

        var antwort = await u.Melden("X.9.99");

        Assert.Equal(HttpStatusCode.NotFound, antwort.StatusCode);
        Assert.Contains("raum_unbekannt", await antwort.Content.ReadAsStringAsync());
    }

    [Fact]
    public async Task Ohne_Idempotenz_Schluessel()
    {
        using var u = new BesetztMeldungUmgebung();

        var antwort = await u.Client.PostAsJsonAsync("/v1/raeume/A.E.01/besetzt-meldungen",
            new { gemeldetAm = BesetztMeldungUmgebung.Start });

        Assert.Equal(HttpStatusCode.BadRequest, antwort.StatusCode);
        Assert.Contains("idempotenz_schluessel_ungueltig", await antwort.Content.ReadAsStringAsync());
    }

    [Fact]
    public async Task Ohne_Ausloesezeitpunkt()
    {
        using var u = new BesetztMeldungUmgebung();
        var anfrage = new HttpRequestMessage(HttpMethod.Post, "/v1/raeume/A.E.01/besetzt-meldungen")
        {
            Content = JsonContent.Create(new { }),
        };
        anfrage.Headers.Add("Idempotency-Key", Guid.NewGuid().ToString());

        var antwort = await u.Client.SendAsync(anfrage);

        Assert.Equal(HttpStatusCode.BadRequest, antwort.StatusCode);
        Assert.Contains("gemeldet_am_fehlt", await antwort.Content.ReadAsStringAsync());
    }

    [Fact]
    public async Task Vor_dem_ersten_Raumplan_Abruf()
    {
        using var u = new BesetztMeldungUmgebung(mitBestand: false);

        var antwort = await u.Melden("A.E.01");

        Assert.Equal(HttpStatusCode.ServiceUnavailable, antwort.StatusCode);
        Assert.Contains("raumplan_nicht_verfuegbar", await antwort.Content.ReadAsStringAsync());
    }
}

/// <summary>Requirement „Raumbesetzt-Meldungen ohne Personenbezug" (Capability <c>backend-and-api</c>).</summary>
public class RaumbesetztMeldungenOhnePersonenbezug
{
    [Fact]
    public async Task Besetzt_Meldung_senden()
    {
        using var u = new BesetztMeldungUmgebung();
        var anfrage = new HttpRequestMessage(HttpMethod.Post, "/v1/raeume/A.E.01/besetzt-meldungen")
        {
            Content = JsonContent.Create(new { gemeldetAm = BesetztMeldungUmgebung.Start }),
        };
        var schluessel = Guid.NewGuid();
        anfrage.Headers.Add("Idempotency-Key", schluessel.ToString());
        anfrage.Headers.Add("X-Forwarded-For", "203.0.113.7");
        anfrage.Headers.UserAgent.ParseAdd("FB4-App/1.0");

        Assert.Equal(HttpStatusCode.Accepted, (await u.Client.SendAsync(anfrage)).StatusCode);

        var gespeichert = Assert.Single(u.Gespeichert());
        Assert.Equal(schluessel, gespeichert.Id);
        Assert.Equal("A.E.01", gespeichert.RoomId);
        Assert.Equal(BesetztMeldungUmgebung.Start, gespeichert.GemeldetAm);
    }

    [Fact]
    public void Datenmodell_kennt_weder_Konto_noch_Quelle()
    {
        // Gegen schleichende Erweiterung: Jede neue Spalte muss hier bewusst
        // ergänzt und gegen das Requirement abgewogen werden.
        using var u = new BesetztMeldungUmgebung(mitBestand: false);
        using var scope = u.Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<Fb4DbContext>();

        var spalten = db.Model.FindEntityType(typeof(BesetztMeldung))!.GetProperties().Select(p => p.Name).Order();

        Assert.Equal(["GemeldetAm", "Id", "RoomId", "ZurueckgezogenAm"], spalten);
    }
}

/// <summary>Requirement „Anzahl der Besetzt-Meldungen anzeigen" (Capability <c>room-finder</c>).</summary>
public class AnzahlDerBesetztMeldungenAnzeigen
{
    [Fact]
    public async Task Besetzt_Meldung_erhoeht_die_Anzeige()
    {
        using var u = new BesetztMeldungUmgebung();
        Assert.Equal(0, (await u.Status("A.E.01")).BesetztMeldungen);

        await u.Melden("A.E.01");
        Assert.Equal(1, (await u.Status("A.E.01")).BesetztMeldungen);

        await u.Melden("A.E.01");
        Assert.Equal(2, (await u.Status("A.E.01")).BesetztMeldungen);
        Assert.Equal(0, (await u.Status("B.1.01")).BesetztMeldungen);
    }
}

/// <summary>Requirement „Besetzt-Meldung zurückziehen" (Capability <c>room-finder</c>).</summary>
public class BesetztMeldungZurueckziehen
{
    [Fact]
    public async Task Eigene_Meldung_zurueckziehen()
    {
        using var u = new BesetztMeldungUmgebung();
        var schluessel = Guid.NewGuid();
        await u.Melden("A.E.01", schluessel);

        var antwort = await u.Zurueckziehen("A.E.01", schluessel);

        Assert.Equal(HttpStatusCode.NoContent, antwort.StatusCode);
        Assert.Equal(0, (await u.Status("A.E.01")).BesetztMeldungen);
    }

    [Fact]
    public async Task Unbekannte_Kennung_verraet_nichts()
    {
        using var u = new BesetztMeldungUmgebung();

        var antwort = await u.Zurueckziehen("A.E.01", Guid.NewGuid());

        Assert.Equal(HttpStatusCode.NoContent, antwort.StatusCode);
    }

    [Fact]
    public async Task Kennung_mit_falschem_Raum_zieht_nichts_zurueck()
    {
        using var u = new BesetztMeldungUmgebung();
        var schluessel = Guid.NewGuid();
        await u.Melden("A.E.01", schluessel);

        var antwort = await u.Zurueckziehen("B.1.01", schluessel);

        Assert.Equal(HttpStatusCode.NoContent, antwort.StatusCode);
        Assert.Equal(1, (await u.Status("A.E.01")).BesetztMeldungen);
    }
}

/// <summary>Requirement „Gültigkeitsdauer einer Besetzt-Meldung" (Capability <c>room-finder</c>).</summary>
public class GueltigkeitsdauerEinerBesetztMeldung
{
    [Fact]
    public async Task Meldung_nach_Ablauf()
    {
        using var u = new BesetztMeldungUmgebung();
        await u.Melden("A.E.01");

        u.Zeit.Jetzt = BesetztMeldungUmgebung.Start.AddMinutes(89);
        Assert.Equal(1, (await u.Status("A.E.01")).BesetztMeldungen);

        u.Zeit.Jetzt = BesetztMeldungUmgebung.Start.AddMinutes(91);
        Assert.Equal(0, (await u.Status("A.E.01")).BesetztMeldungen);
    }

    [Fact]
    public async Task Verspaetet_uebertragene_Meldung()
    {
        using var u = new BesetztMeldungUmgebung();

        var antwort = await u.Melden("A.E.01", gemeldetAm: BesetztMeldungUmgebung.Start.AddMinutes(-100));

        Assert.Equal(HttpStatusCode.Accepted, antwort.StatusCode);
        var quittung = await antwort.Content.ReadFromJsonAsync<BesetztMeldungQuittung>();
        Assert.True(quittung!.GueltigBis < BesetztMeldungUmgebung.Start);
        Assert.Equal(0, (await u.Status("A.E.01")).BesetztMeldungen);
        Assert.Empty(u.Gespeichert());
    }

    [Fact]
    public async Task Offline_ausgeloeste_Meldung_zaehlt_ab_Ausloesung()
    {
        using var u = new BesetztMeldungUmgebung();

        await u.Melden("A.E.01", gemeldetAm: BesetztMeldungUmgebung.Start.AddMinutes(-60));

        Assert.Equal(1, (await u.Status("A.E.01")).BesetztMeldungen);
        u.Zeit.Jetzt = BesetztMeldungUmgebung.Start.AddMinutes(31);
        Assert.Equal(0, (await u.Status("A.E.01")).BesetztMeldungen);
    }

    [Fact]
    public async Task Ausloesezeitpunkt_in_der_Zukunft_gilt_als_Eingang()
    {
        using var u = new BesetztMeldungUmgebung();

        var antwort = await u.Melden("A.E.01", gemeldetAm: BesetztMeldungUmgebung.Start.AddHours(5));

        var quittung = await antwort.Content.ReadFromJsonAsync<BesetztMeldungQuittung>();
        Assert.Equal(BesetztMeldungUmgebung.Start.AddMinutes(90), quittung!.GueltigBis);
        Assert.Equal(1, (await u.Status("A.E.01")).BesetztMeldungen);
    }

    [Fact]
    public async Task Aufraeumen_entfernt_abgelaufene_Meldungen()
    {
        using var u = new BesetztMeldungUmgebung();
        await u.Melden("A.E.01", gemeldetAm: BesetztMeldungUmgebung.Start.AddMinutes(-80));
        var zurueck = Guid.NewGuid();
        await u.Melden("B.1.01", zurueck, BesetztMeldungUmgebung.Start.AddMinutes(-85));
        await u.Zurueckziehen("B.1.01", zurueck);
        await u.Melden("A.E.01");

        using var scope = u.Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<Fb4DbContext>();
        var entfernt = await BesetztMeldungAufraeumJob.EntferneAbgelaufeneAsync(
            db, BesetztMeldungUmgebung.Start.AddMinutes(10), CancellationToken.None);

        Assert.Equal(2, entfernt);
        Assert.Single(u.Gespeichert());
    }
}

/// <summary>Requirement „Idempotente Besetzt-Meldung" (Capability <c>backend-and-api</c>).</summary>
public class IdempotenteBesetztMeldung
{
    [Fact]
    public async Task Erneute_Uebertragung_einer_Besetzt_Meldung()
    {
        using var u = new BesetztMeldungUmgebung();
        var schluessel = Guid.NewGuid();

        var erste = await u.Melden("A.E.01", schluessel);
        var zweite = await u.Melden("A.E.01", schluessel);

        Assert.Equal(HttpStatusCode.Accepted, zweite.StatusCode);
        Assert.Equal(
            await erste.Content.ReadFromJsonAsync<BesetztMeldungQuittung>(),
            await zweite.Content.ReadFromJsonAsync<BesetztMeldungQuittung>());
        Assert.Equal(1, (await u.Status("A.E.01")).BesetztMeldungen);
    }

    [Fact]
    public async Task Zurueckgezogene_Meldung_bleibt_zurueckgezogen()
    {
        using var u = new BesetztMeldungUmgebung();
        var schluessel = Guid.NewGuid();
        await u.Melden("A.E.01", schluessel);
        await u.Zurueckziehen("A.E.01", schluessel);

        var wiederholt = await u.Melden("A.E.01", schluessel);

        Assert.Equal(HttpStatusCode.Accepted, wiederholt.StatusCode);
        Assert.Equal(0, (await u.Status("A.E.01")).BesetztMeldungen);
    }

    [Fact]
    public async Task Kennung_fuer_einen_anderen_Raum_wiederverwendet()
    {
        using var u = new BesetztMeldungUmgebung();
        var schluessel = Guid.NewGuid();
        await u.Melden("A.E.01", schluessel);

        var antwort = await u.Melden("B.1.01", schluessel);

        Assert.Equal(HttpStatusCode.Conflict, antwort.StatusCode);
        Assert.Contains("idempotenz_konflikt", await antwort.Content.ReadAsStringAsync());
        Assert.Equal(0, (await u.Status("B.1.01")).BesetztMeldungen);
    }
}

/// <summary>Requirement „Ratenbegrenzung kontofreier Schreibpfade" (Capability <c>backend-and-api</c>).</summary>
public class RatenbegrenzungKontofreierSchreibpfade
{
    [Fact]
    public async Task Zu_viele_Besetzt_Meldungen_von_einer_Quelle()
    {
        using var u = new BesetztMeldungUmgebung(ratenAnzahl: 2);

        Assert.Equal(HttpStatusCode.Accepted, (await u.Melden("A.E.01")).StatusCode);
        Assert.Equal(HttpStatusCode.NoContent, (await u.Zurueckziehen("A.E.01", Guid.NewGuid())).StatusCode);
        var abgewiesen = await u.Melden("B.1.01");

        Assert.Equal(HttpStatusCode.TooManyRequests, abgewiesen.StatusCode);
        Assert.Equal(1, (await u.Status("B.1.01")).BesetztMeldungen + (await u.Status("A.E.01")).BesetztMeldungen);
    }

    [Fact]
    public async Task Antwort_bei_greifender_Begrenzung()
    {
        using var u = new BesetztMeldungUmgebung(ratenAnzahl: 1);
        await u.Melden("A.E.01");

        var abgewiesen = await u.Melden("A.E.01");

        Assert.Equal(HttpStatusCode.TooManyRequests, abgewiesen.StatusCode);
        Assert.Equal("application/problem+json", abgewiesen.Content.Headers.ContentType?.MediaType);
        Assert.Contains("zu_viele_anfragen", await abgewiesen.Content.ReadAsStringAsync());
        Assert.True(abgewiesen.Headers.RetryAfter?.Delta > TimeSpan.Zero);
    }

    [Fact]
    public async Task Lesepfade_zaehlen_nicht_mit()
    {
        using var u = new BesetztMeldungUmgebung(ratenAnzahl: 1);
        for (var i = 0; i < 3; i++) await u.Status("A.E.01");

        Assert.Equal(HttpStatusCode.Accepted, (await u.Melden("A.E.01")).StatusCode);
    }

    [Theory]
    [InlineData("203.0.113.7", "203.0.113.7")]
    [InlineData("::ffff:203.0.113.7", "203.0.113.7")]
    [InlineData("2001:db8:1:2:aaaa:bbbb:cccc:dddd", "2001:db8:1:2::/64")]
    [InlineData("2001:db8:1:2::1", "2001:db8:1:2::/64")]
    public void Quelle_ist_die_Netzadresse_bei_IPv6_das_Praefix(string adresse, string quelle)
    {
        Assert.Equal(quelle, Ratenbegrenzung.Quelle(IPAddress.Parse(adresse)));
    }

    [Fact]
    public async Task Quelle_wird_nicht_gespeichert()
    {
        // Das Datenmodell trägt keine Quellenspalte (siehe
        // „Raumbesetzt-Meldungen ohne Personenbezug"); hier zusätzlich der Wert.
        using var u = new BesetztMeldungUmgebung();
        await u.Melden("A.E.01");

        var gespeichert = Assert.Single(u.Gespeichert());
        Assert.DoesNotContain("unbekannt", System.Text.Json.JsonSerializer.Serialize(gespeichert));
    }
}
