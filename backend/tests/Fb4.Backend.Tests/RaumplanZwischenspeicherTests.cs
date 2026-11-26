using System.Net;
using System.Net.Http.Json;
using System.Text;
using Fb4.Backend.Contract.Generated;
using Fb4.Backend.Domain;
using Fb4.Backend.Infrastructure;
using Fb4.Backend.Infrastructure.Raumplan;
using Fb4.Backend.Tests.Infrastruktur;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;

namespace Fb4.Backend.Tests;

/// <summary>
/// Requirement „Raumtermine über Platzhalter-Aufruf beziehen" (Capability
/// <c>backend-and-api</c>) und Requirement „Raum als belegt kennzeichnen"
/// (Capability <c>room-finder</c>, Pseudoraum).
/// </summary>
public class RaumtermineUeberPlatzhalterAufrufBeziehen
{
    // Mittwoch, 2026-06-10, 10:00 Ortszeit (08:00 UTC).
    static readonly DateTimeOffset Jetzt = new(2026, 6, 10, 8, 0, 0, TimeSpan.Zero);

    static long Unix(int tag, int stunde, int minute = 0) =>
        new DateTimeOffset(2026, 6, tag, stunde, minute, 0, TimeSpan.FromHours(2)).ToUnixTimeSeconds();

    static string Termin(string roomId, string name, long beginn, long ende, string eventType = "Course",
        string weekday = "Wed", string timeBegin = "1000", string timeEnd = "1130", string courseOfStudy = "INF") =>
        $$"""
        {"id":{{beginn % 100000}},"name":"{{name}}","roomId":"{{roomId}}","eventType":"{{eventType}}",
         "timestampBegin":{{beginn}},"timestampEnd":{{ende}},"weekday":"{{weekday}}",
         "timeBegin":{{timeBegin}},"timeEnd":"{{timeEnd}}","studentSet":"*","courseOfStudy":"{{courseOfStudy}}",
         "lecturerId":"abc","note":"","description":"gebucht von Erika Mustermann"}
        """;

    static string Liste(params string[] termine) => "[" + string.Join(",", termine) + "]";

    // Ein Termin heute und einer in drei Wochen: deckt mehr als das Standardfenster ab.
    static readonly string Gueltig = Liste(
        Termin("A.E.01", "Datenbanken", Unix(10, 10), Unix(10, 11, 30)),
        Termin("*", "Fortgeschrittenes Projektmanagement [StgPO: WIM-18] (in Raum C.E.44)", Unix(10, 9), Unix(10, 12)),
        Termin("B.1.01", "Mathematik", Unix(30, 8), Unix(30, 10), weekday: "Tue", timeBegin: "800", timeEnd: "1000"));

    sealed class Stub(string raeume, string termine) : HttpMessageHandler
    {
        public List<Uri> Anfragen { get; } = [];
        public string Termine { get; set; } = termine;
        public bool Fehler { get; set; }

        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage r, CancellationToken ct)
        {
            Anfragen.Add(r.RequestUri!);
            if (Fehler) throw new HttpRequestException("Stub: nicht erreichbar");
            var rumpf = r.RequestUri!.AbsolutePath.Contains("AllEvents") ? Termine : raeume;
            return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(rumpf, Encoding.UTF8, "application/json"),
            });
        }
    }

    sealed class FesteZeit(DateTimeOffset jetzt) : TimeProvider
    {
        public override DateTimeOffset GetUtcNow() => jetzt;
    }

    static (Fb4DbContext Db, Stub Quelle, RaumplanAbruf Abruf) Aufbau(string? termine = null)
    {
        var db = new Fb4DbContext(new DbContextOptionsBuilder<Fb4DbContext>()
            .UseInMemoryDatabase("raumplan-" + Guid.NewGuid().ToString("N")).Options);
        var quelle = new Stub("""["A.E.01","B.1.01","C.E.44","Online","*"]""", termine ?? Gueltig);
        var client = new FbwsRaumplanClient(new HttpClient(quelle) { BaseAddress = new Uri("https://fbws.test.invalid/rest/") });
        return (db, quelle, new RaumplanAbruf(db, client, new FesteZeit(Jetzt), NullLogger<RaumplanAbruf>.Instance));
    }

    [Fact]
    public async Task Periodischer_Abruf_setzt_From_und_To_ausdruecklich()
    {
        var (db, quelle, abruf) = Aufbau();

        await abruf.AusfuehrenAsync(default);

        var anfrage = Assert.Single(quelle.Anfragen, u => u.AbsolutePath.Contains("AllEvents"));
        Assert.Contains("Room/*/AllEvents", Uri.UnescapeDataString(anfrage.AbsolutePath));
        var (von, bis) = RaumplanAbruf.ZeitraumAb(Jetzt);
        Assert.Contains($"From={von.ToUnixTimeSeconds()}", anfrage.Query);
        Assert.Contains($"To={bis.ToUnixTimeSeconds()}", anfrage.Query);
        Assert.Equal(new DateTimeOffset(2026, 6, 10, 0, 0, 0, TimeSpan.FromHours(2)), von);
        Assert.Equal(TimeSpan.FromDays(28), bis - von);
        Assert.Equal(4, await db.RaumplanRaeume.CountAsync());
        Assert.Equal(3, await db.RaumplanTermine.CountAsync());
        Assert.Equal(Jetzt, (await db.RaumplanStand.SingleAsync()).AbgerufenAm);
    }

    [Fact]
    public async Task Raum_aus_dem_Namensfeld()
    {
        var (db, _, abruf) = Aufbau();

        await abruf.AusfuehrenAsync(default);

        var eintrag = await db.RaumplanTermine.SingleAsync(x => x.RoomIdQuelle == "*");
        Assert.Equal("C.E.44", eintrag.RoomId);
    }

    [Theory]
    [InlineData("IT-Landschaft – Planung und Umsetzung (von 09:00-16:30 Uhr, in den Räumen C.3.34 und C.3.32)", new[] { "C.3.34", "C.3.32" })]
    [InlineData("IT-Recht (in Raum A.2.02, 9:15-16:15 Uhr) [StgPO: INF-DS-19]", new[] { "A.2.02" })]
    [InlineData("Fortgeschrittenes Projektmanagement [StgPO: WIM-18] (in Raum C.E.44)", new[] { "C.E.44" })]
    [InlineData("Sprechstunde 43053 ohne Raumangabe 9:15", new[] { "*" })]
    public void Mehrere_Raeume_im_Namensfeld(string name, string[] erwartet)
    {
        Assert.Equal(erwartet, RaumAufloesung.RaeumeFuer("*", name));
    }

    [Fact]
    public void Echte_Raumkennung_hat_Vorrang_vor_dem_Namensfeld()
    {
        Assert.Equal(["A.E.01"], RaumAufloesung.RaeumeFuer("A.E.01", "Übung (in Raum C.E.44)"));
    }

    [Fact]
    public async Task Antwort_deckt_den_Zeitraum_nicht_ab()
    {
        var (db, quelle, abruf) = Aufbau();
        await abruf.AusfuehrenAsync(default);

        // Ignoriertes From/To: nur Termine zwischen Folgetag und +7 Tagen.
        quelle.Termine = Liste(Termin("A.E.01", "Datenbanken", Unix(12, 10), Unix(12, 12)));
        await Assert.ThrowsAsync<InvalidDataException>(() => abruf.AusfuehrenAsync(default));

        Assert.Equal(3, await db.RaumplanTermine.CountAsync());
        var stand = await db.RaumplanStand.SingleAsync();
        Assert.False(stand.LetzterVersuchErfolgreich);
        Assert.Equal(Jetzt, stand.AbgerufenAm);
    }

    [Fact]
    public async Task Leere_Antwort_bei_gefuelltem_Zwischenspeicher()
    {
        var (db, quelle, abruf) = Aufbau();
        await abruf.AusfuehrenAsync(default);

        quelle.Termine = "[]";
        await Assert.ThrowsAsync<InvalidDataException>(() => abruf.AusfuehrenAsync(default));

        Assert.Equal(3, await db.RaumplanTermine.CountAsync());
    }

    [Fact]
    public async Task Termin_ohne_auswertbare_Zeitangabe()
    {
        var kaputt = Termin("A.E.01", "Ohne Zeit", 0, 0);
        var (db, _, abruf) = Aufbau(Gueltig.TrimEnd(']') + "," + kaputt + "]");

        await abruf.AusfuehrenAsync(default);

        Assert.Equal(3, await db.RaumplanTermine.CountAsync());
        Assert.DoesNotContain(await db.RaumplanTermine.ToListAsync(), x => x.Name == "Ohne Zeit");
    }

    [Fact]
    public async Task Quelle_nicht_erreichbar_behaelt_den_Bestand()
    {
        var (db, quelle, abruf) = Aufbau();
        await abruf.AusfuehrenAsync(default);

        quelle.Fehler = true;
        await Assert.ThrowsAsync<HttpRequestException>(() => abruf.AusfuehrenAsync(default));

        Assert.Equal(3, await db.RaumplanTermine.CountAsync());
        Assert.False((await db.RaumplanStand.SingleAsync()).LetzterVersuchErfolgreich);
    }

    [Fact]
    public async Task Buchungsvermerk_wird_nicht_gespeichert()
    {
        var (db, _, abruf) = Aufbau();
        await abruf.AusfuehrenAsync(default);

        Assert.DoesNotContain(await db.RaumplanTermine.ToListAsync(),
            x => (x.Note ?? "").Contains("Mustermann") || x.Name.Contains("Mustermann"));
    }

    [Fact]
    public void Uhrzeiten_werden_auf_vier_Stellen_aufgefuellt()
    {
        Assert.Equal("0800", RaumAufloesung.Uhrzeit("800"));
        Assert.Equal("1130", RaumAufloesung.Uhrzeit("1130"));
    }
}

/// <summary>
/// Requirement „Übersicht aller Räume im Raumplan-Zwischenspeicher" und
/// „Raumplan-Termine für lokalen Stundenplan-Abgleich" (Capability
/// <c>backend-and-api</c>); trägt „Übersicht aller Räume mit Belegungszustand"
/// (Capability <c>room-finder</c>).
/// </summary>
public class UebersichtAllerRaeumeImRaumplanZwischenspeicher
{
    static readonly DateTimeOffset Abruf = new(2026, 6, 10, 7, 30, 0, TimeSpan.Zero);
    static readonly DateTimeOffset T = new(2026, 6, 10, 8, 15, 0, TimeSpan.Zero);

    static async Task Befuellen(TestAppFactory factory, bool letzterVersuchErfolgreich = true)
    {
        using var scope = factory.NewScope();
        var db = scope.ServiceProvider.GetRequiredService<Fb4DbContext>();
        db.RaumplanStand.Add(new RaumplanStand
        {
            AbgerufenAm = Abruf,
            LetzterVersuchAm = Abruf,
            LetzterVersuchErfolgreich = letzterVersuchErfolgreich,
        });
        db.RaumplanRaeume.AddRange(
            new RaumplanRaum { RoomId = "A.E.01" },
            new RaumplanRaum { RoomId = "Z.9.99" });
        db.RaumplanTermine.AddRange(
            new RaumplanTerminEintrag
            {
                RoomId = "A.E.01", RoomIdQuelle = "A.E.01", Name = "Datenbanken", EventType = "Course",
                Beginn = T.AddMinutes(-15), Ende = T.AddMinutes(75), Weekday = "Wed",
                TimeBegin = "1000", TimeEnd = "1130", CourseOfStudy = "INF", Note = "Bitte Laptop mitbringen",
            },
            new RaumplanTerminEintrag
            {
                RoomId = "C.E.44", RoomIdQuelle = "*", Name = "Prüfung 42012 Programmieren", EventType = "Event",
                Beginn = T.AddMinutes(-30), Ende = T.AddMinutes(60), Weekday = "Wed",
                TimeBegin = "0945", TimeEnd = "1115",
            },
            new RaumplanTerminEintrag
            {
                RoomId = "Z.9.99", RoomIdQuelle = "Z.9.99", Name = "Später", EventType = "Course",
                Beginn = T.AddHours(3), Ende = T.AddHours(4), Weekday = "Wed",
                TimeBegin = "1315", TimeEnd = "1415", CourseOfStudy = "WI",
            },
            new RaumplanTerminEintrag
            {
                RoomId = "*", RoomIdQuelle = "*", Name = "Ohne Raum", EventType = "Course",
                Beginn = T.AddMinutes(-10), Ende = T.AddMinutes(10), Weekday = "Wed",
                TimeBegin = "1000", TimeEnd = "1020",
            });
        await db.SaveChangesAsync();
    }

    sealed record Uebersicht(List<RaumStatus> Raeume, StandAlter StandAlter);
    sealed record TermineAntwort(List<RaumplanTermin> Termine, StandAlter StandAlter);

    static string Zeitpunkt => Uri.EscapeDataString(T.ToString("o"));

    [Fact]
    public async Task Raumuebersicht_abrufen()
    {
        using var factory = new TestAppFactory();
        await Befuellen(factory);

        var antwort = await factory.CreateClient().GetFromJsonAsync<Uebersicht>($"/v1/raeume/uebersicht?zeitpunkt={Zeitpunkt}");

        Assert.NotNull(antwort);
        Assert.Equal(["A.E.01", "C.E.44", "Z.9.99"], antwort!.Raeume.Select(r => r.RoomId));
        var a = antwort.Raeume.Single(r => r.RoomId == "A.E.01");
        Assert.Equal("belegt", a.Zustand);
        Assert.Equal("Datenbanken", a.AktuellerTermin!.Bezeichnung);
        Assert.Equal("lehrveranstaltung", a.AktuellerTermin.Art);
        Assert.Equal("Bitte Laptop mitbringen", a.AktuellerTermin.Note);
        Assert.Equal(Raumgroesse.Gross, a.Groesse);
        Assert.NotNull(a.EkeyZugaenglich);
        Assert.Equal(Abruf, antwort.StandAlter.AbgerufenAm);
        Assert.True(antwort.StandAlter.QuelleErreichbar);
    }

    [Fact]
    public async Task Raum_nur_im_Namensfeld_genannt_gilt_als_belegt()
    {
        using var factory = new TestAppFactory();
        await Befuellen(factory);

        var antwort = await factory.CreateClient().GetFromJsonAsync<Uebersicht>($"/v1/raeume/uebersicht?zeitpunkt={Zeitpunkt}");

        var c = antwort!.Raeume.Single(r => r.RoomId == "C.E.44");
        Assert.Equal("belegt", c.Zustand);
        Assert.Equal("pruefung", c.AktuellerTermin!.Art);
        Assert.Null(c.Groesse);
        Assert.Null(c.EkeyZugaenglich);
    }

    [Fact]
    public async Task Freier_Raum_nennt_den_naechsten_Termin()
    {
        using var factory = new TestAppFactory();
        await Befuellen(factory);

        var antwort = await factory.CreateClient().GetFromJsonAsync<Uebersicht>($"/v1/raeume/uebersicht?zeitpunkt={Zeitpunkt}");

        var z = antwort!.Raeume.Single(r => r.RoomId == "Z.9.99");
        Assert.Equal("frei", z.Zustand);
        Assert.Null(z.AktuellerTermin);
        Assert.Equal("Später", z.NaechsterTermin!.Bezeichnung);
        Assert.Equal(0, z.BesetztMeldungen);
    }

    [Fact]
    public async Task Noch_kein_Bestand()
    {
        using var factory = new TestAppFactory();
        var client = factory.CreateClient();

        var uebersicht = await client.GetAsync("/v1/raeume/uebersicht");
        var termine = await client.GetAsync("/v1/raumplan/termine");

        Assert.Equal(HttpStatusCode.ServiceUnavailable, uebersicht.StatusCode);
        Assert.Equal("application/problem+json", uebersicht.Content.Headers.ContentType?.MediaType);
        Assert.Contains("raumplan_nicht_verfuegbar", await uebersicht.Content.ReadAsStringAsync());
        Assert.Equal(HttpStatusCode.ServiceUnavailable, termine.StatusCode);
    }

    [Fact]
    public async Task Letzter_Abruf_fehlgeschlagen()
    {
        using var factory = new TestAppFactory();
        await Befuellen(factory, letzterVersuchErfolgreich: false);

        var antwort = await factory.CreateClient().GetFromJsonAsync<Uebersicht>($"/v1/raeume/uebersicht?zeitpunkt={Zeitpunkt}");

        Assert.Equal(Abruf, antwort!.StandAlter.AbgerufenAm);
        Assert.False(antwort.StandAlter.QuelleErreichbar);
        Assert.NotEmpty(antwort.Raeume);
    }

    [Fact]
    public async Task Raumplan_Termine_fuer_lokalen_Stundenplan_Abgleich()
    {
        using var factory = new TestAppFactory();
        await Befuellen(factory);
        var client = factory.CreateClient();

        var alle = await client.GetFromJsonAsync<TermineAntwort>("/v1/raumplan/termine");
        var nurInf = await client.GetFromJsonAsync<TermineAntwort>("/v1/raumplan/termine?studiengang=INF");

        Assert.Equal(["A.E.01", "C.E.44", "Z.9.99"], alle!.Termine.Select(t => t.RoomId));
        Assert.All(alle.Termine, t => Assert.Equal(4, t.Beginn.Length));
        Assert.Equal("A.E.01", Assert.Single(nurInf!.Termine).RoomId);
        Assert.Equal(Abruf, alle.StandAlter.AbgerufenAm);
    }
}
