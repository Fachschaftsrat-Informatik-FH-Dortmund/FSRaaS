using System.Net;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
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

/// <summary>Gemeinsamer Aufbau: INT-009-Stub, verstellbare Uhr, In-Memory-Datenbank.</summary>
static class PruefungsabrufAufbau
{
    // Mittwoch, 2026-06-10, 10:00 Ortszeit (08:00 UTC).
    public static readonly DateTimeOffset Jetzt = new(2026, 6, 10, 8, 0, 0, TimeSpan.Zero);

    public static long Unix(DateTimeOffset t) => t.ToUnixTimeSeconds();

    /// <summary>Ortszeit (MESZ) am Tag <paramref name="tageAbJetzt"/> nach dem 10.06.2026.</summary>
    public static DateTimeOffset Am(int tageAbJetzt, int stunde, int minute = 0) =>
        new DateTimeOffset(2026, 6, 10, stunde, minute, 0, TimeSpan.FromHours(2)).AddDays(tageAbJetzt);

    public static string Termin(string roomId, string name, DateTimeOffset beginn, DateTimeOffset ende, string eventType = "Event") =>
        $$"""
        {"id":{{Unix(beginn) % 100000}},"name":{{JsonSerializer.Serialize(name)}},"roomId":"{{roomId}}","eventType":"{{eventType}}",
         "timestampBegin":{{Unix(beginn)}},"timestampEnd":{{Unix(ende)}},"weekday":"Wed",
         "timeBegin":"0900","timeEnd":"1100","studentSet":"","courseId":"","courseOfStudy":"",
         "lecturerId":"","note":"","description":"gebucht von Erika Mustermann"}
        """;

    public static string Liste(params string[] termine) => "[" + string.Join(",", termine) + "]";

    // Eine Vorlesung heute (deckt mehr als das Standardfenster ab) und eine Prüfung
    // in 60 Tagen — außerhalb des 28-Tage-Zwischenspeichers.
    public static string Grundbestand(params string[] weitere) => Liste([
        Termin("A.E.01", "Datenbanken", Am(0, 10), Am(0, 11, 30), eventType: "Course"),
        Termin("A.E.01", "Prüfung 42012 Algorithmen und Datenstrukturen", Am(60, 9), Am(60, 11)),
        .. weitere]);

    public sealed class Stub(string termine) : HttpMessageHandler
    {
        public List<Uri> Anfragen { get; } = [];
        public string Termine { get; set; } = termine;

        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage r, CancellationToken ct)
        {
            Anfragen.Add(r.RequestUri!);
            return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(Termine, Encoding.UTF8, "application/json"),
            });
        }
    }

    public sealed class Uhr(DateTimeOffset jetzt) : TimeProvider
    {
        public DateTimeOffset Jetzt { get; set; } = jetzt;
        public override DateTimeOffset GetUtcNow() => Jetzt;
    }

    public static (Fb4DbContext Db, Stub Quelle, Uhr Uhr, PruefungsbestandAbruf Abruf) Aufbau(string termine)
    {
        var db = new Fb4DbContext(new DbContextOptionsBuilder<Fb4DbContext>()
            .UseInMemoryDatabase("pruefungen-" + Guid.NewGuid().ToString("N")).Options);
        var quelle = new Stub(termine);
        var uhr = new Uhr(Jetzt);
        var client = new FbwsRaumplanClient(new HttpClient(quelle) { BaseAddress = new Uri("https://fbws.test.invalid/rest/") });
        return (db, quelle, uhr, new PruefungsbestandAbruf(db, client, uhr, NullLogger<PruefungsbestandAbruf>.Instance));
    }
}

/// <summary>
/// Requirement „Ableitung des Prüfungsbestands aus dem Raumplan" (Capability
/// <c>backend-and-api</c>).
/// </summary>
public class AbleitungDesPruefungsbestandsAusDemRaumplan
{
    static readonly DateTimeOffset Jetzt = PruefungsabrufAufbau.Jetzt;
    static string Termin(string roomId, string name, DateTimeOffset beginn, DateTimeOffset ende, string eventType = "Event") =>
        PruefungsabrufAufbau.Termin(roomId, name, beginn, ende, eventType);
    static DateTimeOffset Am(int tage, int stunde, int minute = 0) => PruefungsabrufAufbau.Am(tage, stunde, minute);

    [Fact]
    public async Task Pruefungseintrag_im_Raumplan()
    {
        var (db, _, _, abruf) = PruefungsabrufAufbau.Aufbau(PruefungsabrufAufbau.Grundbestand());

        await abruf.AusfuehrenAsync(default);

        var p = await db.Pruefungstermine.SingleAsync();
        Assert.Equal("42012", p.Modulnummer);
        Assert.Equal("Algorithmen und Datenstrukturen", p.Bezeichnung);
        Assert.Equal(["A.E.01"], p.Raeume);
        Assert.Equal(Am(60, 9), p.Beginn);
        Assert.Equal(Am(60, 11), p.Ende);
    }

    [Fact]
    public async Task Pruefung_mit_Vorlauf()
    {
        var (db, quelle, _, abruf) = PruefungsabrufAufbau.Aufbau(PruefungsabrufAufbau.Grundbestand());

        await abruf.AusfuehrenAsync(default);

        // Ausdrücklicher Zeitraum über 183 Tage ab Tagesbeginn, nicht die 28 Tage des Zwischenspeichers.
        var anfrage = Assert.Single(quelle.Anfragen);
        Assert.Contains("Room/*/AllEvents", Uri.UnescapeDataString(anfrage.AbsolutePath));
        var von = new DateTimeOffset(2026, 6, 10, 0, 0, 0, TimeSpan.FromHours(2));
        Assert.Contains($"From={von.ToUnixTimeSeconds()}", anfrage.Query);
        Assert.Contains($"To={von.AddDays(183).ToUnixTimeSeconds()}", anfrage.Query);
        // Die Prüfung in 60 Tagen liegt jenseits des 28-Tage-Zwischenspeichers.
        Assert.True(Am(60, 9) > RaumplanAbruf.ZeitraumAb(Jetzt).Bis);
        Assert.Single(await db.Pruefungstermine.ToListAsync());
    }

    [Fact]
    public async Task Nur_Pruefungen_werden_uebernommen()
    {
        var (db, _, _, abruf) = PruefungsabrufAufbau.Aufbau(PruefungsabrufAufbau.Grundbestand(
            Termin("B.1.01", "Prüfungsvorbereitung Mathematik", Am(40, 9), Am(40, 11)),
            Termin("B.1.01", "Klausureinsicht 42012", Am(41, 9), Am(41, 11))));

        await abruf.AusfuehrenAsync(default);

        Assert.Equal(["Prüfung 42012 Algorithmen und Datenstrukturen"],
            await db.Pruefungstermine.Select(p => p.Name).ToListAsync());
    }

    [Theory]
    [InlineData("Prüfung 42012 Algorithmen und Datenstrukturen", "42012", "Algorithmen und Datenstrukturen")]
    [InlineData("Prüfung 411031 Lern- und Arbeitstechniken", "411031", "Lern- und Arbeitstechniken")]
    [InlineData("  Prüfung   43053   IT-Infrastruktur  ", "43053", "IT-Infrastruktur")]
    [InlineData("Prüfung Softwaretechnik 2", null, "Softwaretechnik 2")]
    [InlineData("Prüfungen 41065 Mathematik für Informatik 1 / 43076 Mathematik für Informatik 4 (Data Science)", null,
        "41065 Mathematik für Informatik 1 / 43076 Mathematik für Informatik 4 (Data Science)")]
    [InlineData("Prüfung", null, "Prüfung")]
    public void Nicht_aufloesbares_Namensmuster_bleibt_als_Pruefung_ohne_Modulbezug(string name, string? modulnummer, string bezeichnung)
    {
        var erkannt = PruefungsErkennung.Erkenne(name);

        Assert.NotNull(erkannt);
        Assert.Equal(modulnummer, erkannt!.Modulnummer);
        Assert.Equal(bezeichnung, erkannt.Bezeichnung);
    }

    [Theory]
    [InlineData("Prüfungsvorbereitung Mathematik")]
    [InlineData("Datenbanken")]
    [InlineData("Klausur 42012 Programmieren")]
    [InlineData("")]
    public void Keine_Pruefung(string name)
    {
        Assert.Null(PruefungsErkennung.Erkenne(name));
    }

    [Fact]
    public void Zerlegter_Umlaut_wird_erkannt()
    {
        var zerlegt = "Prüfung 42012 Algorithmen und Datenstrukturen";

        var erkannt = PruefungsErkennung.Erkenne(zerlegt);

        Assert.Equal("42012", erkannt?.Modulnummer);
    }

    [Fact]
    public async Task Nicht_aufloesbares_Namensmuster()
    {
        var (db, _, _, abruf) = PruefungsabrufAufbau.Aufbau(PruefungsabrufAufbau.Grundbestand(
            Termin("C.E.44", "Prüfung Softwaretechnik 2", Am(50, 9), Am(50, 11)),
            Termin("A.E.02", "Prüfungen 41065 Mathematik für Informatik 1 / 43076 Mathematik für Informatik 4 (Data Science)",
                Am(51, 9), Am(51, 11))));

        await abruf.AusfuehrenAsync(default);

        var ohne = await db.Pruefungstermine.Where(p => p.Modulnummer == null).OrderBy(p => p.Beginn).ToListAsync();
        Assert.Equal(2, ohne.Count);
        Assert.Equal("Softwaretechnik 2", ohne[0].Bezeichnung);
        Assert.Contains("41065", ohne[1].Bezeichnung);
        Assert.Contains("43076", ohne[1].Bezeichnung);
    }

    [Fact]
    public async Task Pruefung_in_mehreren_Raeumen()
    {
        var name = "Prüfung 42022 Betriebssysteme";
        var (db, _, _, abruf) = PruefungsabrufAufbau.Aufbau(PruefungsabrufAufbau.Grundbestand(
            Termin("A.E.02", name, Am(45, 9), Am(45, 11)),
            Termin("A.E.01", name, Am(45, 9), Am(45, 11)),
            Termin("*", "Prüfung 42032 Rechnernetze (in den Räumen C.3.34 und C.3.32)", Am(46, 9), Am(46, 11)),
            // Gleicher Name, andere Zeit: eine zweite Prüfung, nicht zusammengeführt.
            Termin("A.E.01", name, Am(80, 9), Am(80, 11))));

        await abruf.AusfuehrenAsync(default);

        var bs = await db.Pruefungstermine.Where(p => p.Modulnummer == "42022").OrderBy(p => p.Beginn).ToListAsync();
        Assert.Equal(2, bs.Count);
        Assert.Equal(["A.E.01", "A.E.02"], bs[0].Raeume);
        Assert.Equal(["A.E.01"], bs[1].Raeume);
        var rn = await db.Pruefungstermine.SingleAsync(p => p.Modulnummer == "42032");
        Assert.Equal(["C.3.32", "C.3.34"], rn.Raeume);
    }

    [Fact]
    public async Task Pruefung_ohne_Raumangabe()
    {
        var (db, _, _, abruf) = PruefungsabrufAufbau.Aufbau(PruefungsabrufAufbau.Grundbestand(
            Termin("*", "Prüfung 46854 Fortgeschrittenes Web-Engineering", Am(70, 14), Am(70, 16))));

        await abruf.AusfuehrenAsync(default);

        var p = await db.Pruefungstermine.SingleAsync(x => x.Modulnummer == "46854");
        Assert.Empty(p.Raeume);
    }

    [Fact]
    public async Task Verdaechtige_Antwort_beim_Pruefungsabruf()
    {
        var (db, quelle, uhr, abruf) = PruefungsabrufAufbau.Aufbau(PruefungsabrufAufbau.Grundbestand());
        await abruf.AusfuehrenAsync(default);

        // Ignoriertes From/To: nur Termine zwischen Folgetag und +7 Tagen.
        uhr.Jetzt = Jetzt.AddHours(6);
        quelle.Termine = PruefungsabrufAufbau.Liste(Termin("A.E.01", "Prüfung 42012 Algorithmen und Datenstrukturen", Am(2, 9), Am(2, 11)));
        await Assert.ThrowsAsync<InvalidDataException>(() => abruf.AusfuehrenAsync(default));

        // Leere Antwort bei gefülltem Bestand.
        quelle.Termine = "[]";
        await Assert.ThrowsAsync<InvalidDataException>(() => abruf.AusfuehrenAsync(default));

        var p = await db.Pruefungstermine.SingleAsync();
        Assert.Equal(Am(60, 9), p.Beginn);
        var stand = await db.PruefungsbestandStand.SingleAsync();
        Assert.False(stand.LetzterVersuchErfolgreich);
        Assert.Equal(Jetzt, stand.AbgerufenAm);
    }

    [Fact]
    public async Task Strukturell_abweichende_Antwort_schlaegt_sichtbar_fehl()
    {
        var (db, quelle, _, abruf) = PruefungsabrufAufbau.Aufbau(PruefungsabrufAufbau.Grundbestand());
        await abruf.AusfuehrenAsync(default);

        quelle.Termine = """{"events":[]}""";
        await Assert.ThrowsAsync<InvalidDataException>(() => abruf.AusfuehrenAsync(default));

        Assert.Single(await db.Pruefungstermine.ToListAsync());
    }

    [Fact]
    public async Task Rueckgang_auf_null_Pruefungen_wird_uebernommen()
    {
        var (db, quelle, uhr, abruf) = PruefungsabrufAufbau.Aufbau(PruefungsabrufAufbau.Grundbestand());
        await abruf.AusfuehrenAsync(default);

        // Nach dem Prüfungszeitraum ist „keine Prüfung" ein legitimer Zustand.
        uhr.Jetzt = Jetzt.AddDays(1);
        quelle.Termine = PruefungsabrufAufbau.Liste(
            Termin("A.E.01", "Datenbanken", Am(1, 10), Am(1, 11, 30), eventType: "Course"),
            Termin("A.E.01", "Datenbanken", Am(15, 10), Am(15, 11, 30), eventType: "Course"));
        await abruf.AusfuehrenAsync(default);

        Assert.Empty(await db.Pruefungstermine.ToListAsync());
    }

    [Fact]
    public async Task Buchungsvermerk_wird_nicht_gespeichert()
    {
        var (db, _, _, abruf) = PruefungsabrufAufbau.Aufbau(PruefungsabrufAufbau.Grundbestand());

        await abruf.AusfuehrenAsync(default);

        Assert.DoesNotContain(await db.Pruefungstermine.ToListAsync(),
            p => p.Name.Contains("Mustermann") || p.Bezeichnung.Contains("Mustermann"));
    }

    sealed record Antwort(List<Pruefungstermin> Pruefungen, Pruefungsbestandsvollstaendigkeit Vollstaendigkeit, StandAlter StandAlter);

    [Fact]
    public async Task Unvollstaendigkeit_ist_Teil_des_Bestands()
    {
        using var factory = new TestAppFactory();
        using (var scope = factory.NewScope())
        {
            // Auch ein leerer Bestand trägt den Hinweis.
            var db = scope.ServiceProvider.GetRequiredService<Fb4DbContext>();
            db.PruefungsbestandStand.Add(new PruefungsbestandStand
            {
                AbgerufenAm = Jetzt, GeaendertAm = Jetzt, LetzterVersuchAm = Jetzt, LetzterVersuchErfolgreich = true,
            });
            await db.SaveChangesAsync();
        }

        var roh = await factory.CreateClient().GetStringAsync("/v1/stundenplan/pruefungsplan");
        var antwort = JsonSerializer.Deserialize<Antwort>(roh, JsonSerializerOptions.Web)!;

        Assert.Empty(antwort.Pruefungen);
        Assert.Equal("raumplan", antwort.Vollstaendigkeit.Quelle);
        Assert.False(antwort.Vollstaendigkeit.Vollstaendig);
        Assert.Equal(0.70m, antwort.Vollstaendigkeit.AbdeckungAnteil);
        Assert.Equal(new DateOnly(2026, 9, 7), antwort.Vollstaendigkeit.AbdeckungGemessenAm);
        Assert.Contains("\"abdeckungGemessenAm\":\"2026-09-07\"", roh);
    }
}

/// <summary>
/// Requirement „Abruf des Prüfungsbestands" (Capability <c>backend-and-api</c>).
/// </summary>
public class AbrufDesPruefungsbestands
{
    static readonly DateTimeOffset Abruf = new(2026, 6, 10, 8, 0, 0, TimeSpan.Zero);

    sealed record Antwort(List<Pruefungstermin> Pruefungen, Pruefungsbestandsvollstaendigkeit Vollstaendigkeit, StandAlter StandAlter);

    [Fact]
    public async Task Pruefungsbestand_abrufen()
    {
        using var factory = new TestAppFactory();
        using (var scope = factory.NewScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<Fb4DbContext>();
            db.PruefungsbestandStand.Add(new PruefungsbestandStand
            {
                AbgerufenAm = Abruf, GeaendertAm = Abruf, LetzterVersuchAm = Abruf.AddHours(6), LetzterVersuchErfolgreich = false,
            });
            db.Pruefungstermine.AddRange(
                new PruefungsterminEintrag
                {
                    Name = "Prüfung 42022 Betriebssysteme", Modulnummer = "42022", Bezeichnung = "Betriebssysteme",
                    Beginn = Abruf.AddDays(50), Ende = Abruf.AddDays(50).AddHours(2), Raeume = ["A.E.01", "A.E.02"],
                },
                new PruefungsterminEintrag
                {
                    Name = "Prüfung Softwaretechnik 2", Modulnummer = null, Bezeichnung = "Softwaretechnik 2",
                    Beginn = Abruf.AddDays(40), Ende = Abruf.AddDays(40).AddHours(2), Raeume = [],
                });
            await db.SaveChangesAsync();
        }

        // Ohne Anmeldung.
        var antwort = await factory.CreateClient().GetFromJsonAsync<Antwort>("/v1/stundenplan/pruefungsplan");

        Assert.NotNull(antwort);
        Assert.Equal(["Softwaretechnik 2", "Betriebssysteme"], antwort!.Pruefungen.Select(p => p.Bezeichnung));
        Assert.Null(antwort.Pruefungen[0].Modulnummer);
        Assert.Empty(antwort.Pruefungen[0].Raeume);
        Assert.Equal(["A.E.01", "A.E.02"], antwort.Pruefungen[1].Raeume);
        Assert.False(antwort.Vollstaendigkeit.Vollstaendig);
        Assert.Equal(Abruf, antwort.StandAlter.AbgerufenAm);
        Assert.False(antwort.StandAlter.QuelleErreichbar);
    }

    [Fact]
    public async Task Noch_kein_Pruefungsbestand()
    {
        using var factory = new TestAppFactory();

        var antwort = await factory.CreateClient().GetAsync("/v1/stundenplan/pruefungsplan");

        Assert.Equal(HttpStatusCode.ServiceUnavailable, antwort.StatusCode);
        Assert.Equal("application/problem+json", antwort.Content.Headers.ContentType?.MediaType);
        Assert.Contains("pruefungsbestand_nicht_verfuegbar", await antwort.Content.ReadAsStringAsync());
    }
}

/// <summary>
/// Requirement „Allgemeine Aktualisierungsmeldung bei geändertem Prüfungsplan"
/// (Capability <c>backend-and-api</c>).
/// </summary>
public class AllgemeineAktualisierungsmeldungBeiGeaendertemPruefungsplan
{
    static readonly DateTimeOffset Jetzt = PruefungsabrufAufbau.Jetzt;
    static string Termin(string roomId, string name, DateTimeOffset beginn, DateTimeOffset ende, string eventType = "Event") =>
        PruefungsabrufAufbau.Termin(roomId, name, beginn, ende, eventType);
    static DateTimeOffset Am(int tage, int stunde, int minute = 0) => PruefungsabrufAufbau.Am(tage, stunde, minute);

    [Fact]
    public async Task Erste_Ableitung_gilt_als_Aenderung()
    {
        var (db, _, _, abruf) = PruefungsabrufAufbau.Aufbau(PruefungsabrufAufbau.Grundbestand());

        await abruf.AusfuehrenAsync(default);

        Assert.Equal(Jetzt, (await db.PruefungsbestandStand.SingleAsync()).GeaendertAm);
    }

    [Fact]
    public async Task Unveraenderter_Bestand_loest_nichts_aus()
    {
        var (db, _, uhr, abruf) = PruefungsabrufAufbau.Aufbau(PruefungsabrufAufbau.Grundbestand());
        await abruf.AusfuehrenAsync(default);

        uhr.Jetzt = Jetzt.AddHours(6);
        await abruf.AusfuehrenAsync(default);

        var stand = await db.PruefungsbestandStand.SingleAsync();
        Assert.Equal(Jetzt, stand.GeaendertAm);
        Assert.Equal(Jetzt.AddHours(6), stand.AbgerufenAm);
    }

    [Fact]
    public async Task Pruefungsplan_Aenderung_erkannt()
    {
        var (db, quelle, uhr, abruf) = PruefungsabrufAufbau.Aufbau(PruefungsabrufAufbau.Grundbestand());
        await abruf.AusfuehrenAsync(default);

        // Dieselbe Prüfung, um einen Tag verschoben.
        uhr.Jetzt = Jetzt.AddHours(6);
        quelle.Termine = PruefungsabrufAufbau.Liste(
            Termin("A.E.01", "Datenbanken", Am(0, 10), Am(0, 11, 30), eventType: "Course"),
            Termin("A.E.01", "Prüfung 42012 Algorithmen und Datenstrukturen", Am(61, 9), Am(61, 11)));
        await abruf.AusfuehrenAsync(default);

        Assert.Equal(Jetzt.AddHours(6), (await db.PruefungsbestandStand.SingleAsync()).GeaendertAm);
    }

    [Fact]
    public async Task Raumwechsel_gilt_als_Aenderung()
    {
        var (db, quelle, uhr, abruf) = PruefungsabrufAufbau.Aufbau(PruefungsabrufAufbau.Grundbestand());
        await abruf.AusfuehrenAsync(default);

        uhr.Jetzt = Jetzt.AddHours(6);
        quelle.Termine = PruefungsabrufAufbau.Liste(
            Termin("A.E.01", "Datenbanken", Am(0, 10), Am(0, 11, 30), eventType: "Course"),
            Termin("B.1.01", "Prüfung 42012 Algorithmen und Datenstrukturen", Am(60, 9), Am(60, 11)));
        await abruf.AusfuehrenAsync(default);

        Assert.Equal(Jetzt.AddHours(6), (await db.PruefungsbestandStand.SingleAsync()).GeaendertAm);
    }

    [Fact]
    public async Task Vergangene_Pruefung_faellt_heraus()
    {
        var gestern = "Prüfung 41065 Mathematik für Informatik 1";
        var (db, quelle, uhr, abruf) = PruefungsabrufAufbau.Aufbau(PruefungsabrufAufbau.Grundbestand(
            Termin("A.E.01", gestern, Am(0, 12), Am(0, 14))));
        await abruf.AusfuehrenAsync(default);
        Assert.Equal(2, await db.Pruefungstermine.CountAsync());

        // Am Folgetag steht die Prüfung von heute nicht mehr im angeforderten Zeitraum.
        uhr.Jetzt = Jetzt.AddDays(1);
        quelle.Termine = PruefungsabrufAufbau.Liste(
            Termin("A.E.01", "Datenbanken", Am(1, 10), Am(1, 11, 30), eventType: "Course"),
            Termin("A.E.01", "Prüfung 42012 Algorithmen und Datenstrukturen", Am(60, 9), Am(60, 11)));
        await abruf.AusfuehrenAsync(default);

        Assert.Equal(1, await db.Pruefungstermine.CountAsync());
        var stand = await db.PruefungsbestandStand.SingleAsync();
        Assert.Equal(Jetzt, stand.GeaendertAm);
        Assert.Equal(Jetzt.AddDays(1), stand.AbgerufenAm);
    }
}

/// <summary>
/// Requirement „Abfrage-Endpunkt für den Prüfungsplan-Änderungszeitpunkt"
/// (Capability <c>backend-and-api</c>).
/// </summary>
public class AbfrageEndpunktFuerDenPruefungsplanAenderungszeitpunkt
{
    sealed record Stand(DateTimeOffset? GeaendertAm);

    [Fact]
    public async Task App_fragt_Aenderungszeitpunkt_ab()
    {
        var geaendert = new DateTimeOffset(2026, 6, 9, 14, 0, 0, TimeSpan.Zero);
        using var factory = new TestAppFactory();
        using (var scope = factory.NewScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<Fb4DbContext>();
            db.PruefungsbestandStand.Add(new PruefungsbestandStand
            {
                AbgerufenAm = geaendert.AddDays(1), GeaendertAm = geaendert, LetzterVersuchErfolgreich = true,
            });
            await db.SaveChangesAsync();
        }

        var antwort = await factory.CreateClient().GetFromJsonAsync<Stand>("/v1/stundenplan/pruefungsplan/stand");

        Assert.Equal(geaendert, antwort!.GeaendertAm);
    }

    [Fact]
    public async Task Noch_keine_Ableitung_erfolgt()
    {
        using var factory = new TestAppFactory();

        var antwort = await factory.CreateClient().GetAsync("/v1/stundenplan/pruefungsplan/stand");

        Assert.Equal(HttpStatusCode.OK, antwort.StatusCode);
        Assert.Contains("\"geaendertAm\":null", await antwort.Content.ReadAsStringAsync());
    }
}
