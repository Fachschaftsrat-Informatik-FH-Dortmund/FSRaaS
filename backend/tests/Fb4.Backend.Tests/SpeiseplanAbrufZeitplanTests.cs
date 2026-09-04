using Fb4.Backend.Infrastructure.Mensa;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;

namespace Fb4.Backend.Tests;

/// <summary>
/// API-F-076 / MENSA-N-020: Der Speiseplan-Abruf folgt festen Ortszeit-Läufen
/// (vor Morgen- und Mittagsspitze, nach Mensaschluss) statt einem starren
/// Intervall ab Prozessstart; ein Grundintervall deckelt die Lücke.
/// </summary>
public class SpeiseplanAbrufZeitplanTests
{
    // Standardzeitplan: 05:30, 10:00, 15:30 Europe/Berlin, 6-h-Grundintervall.
    static SpeiseplanAbrufZeitplan Standard() => new(
        SpeiseplanAbrufZeitplan.StandardLaeufe,
        TimeZoneInfo.FindSystemTimeZoneById(SpeiseplanAbrufZeitplan.StandardZeitzone),
        SpeiseplanAbrufZeitplan.StandardGrundintervall);

    // 2026-01-15 liegt in der Winterzeit (Europe/Berlin = UTC+1).
    static DateTimeOffset Utc(int stunde, int minute) =>
        new(2026, 1, 15, stunde, minute, 0, TimeSpan.Zero);

    [Fact]
    public void API_F_076_naechster_Lauf_faellt_vor_die_Morgenspitze()
    {
        // 04:00 Ortszeit → nächster Lauf 05:30 Ortszeit (04:30 UTC).
        Assert.Equal(TimeSpan.FromMinutes(90), Standard().BisZumNaechstenLauf(Utc(3, 0)));
    }

    [Fact]
    public void API_F_076_naechster_Lauf_faellt_vor_die_Mittagsspitze()
    {
        // 07:00 Ortszeit → nächster Lauf 10:00 Ortszeit (09:00 UTC).
        Assert.Equal(TimeSpan.FromHours(3), Standard().BisZumNaechstenLauf(Utc(6, 0)));
    }

    [Fact]
    public void API_F_076_Lauf_faellt_nach_Mensaschluss_fuer_Folgetagsdaten()
    {
        // 12:00 Ortszeit → nächster Lauf 15:30 Ortszeit (14:30 UTC), nach Betriebsschluss.
        Assert.Equal(TimeSpan.FromMinutes(210), Standard().BisZumNaechstenLauf(Utc(11, 0)));
    }

    [Fact]
    public void API_F_076_Grundintervall_deckelt_die_Luecke()
    {
        // 21:00 Ortszeit: bis zum ersten Lauf am Folgetag (05:30) wären es 8,5 h —
        // das 6-h-Grundintervall greift und lässt dazwischen einen Lauf zu.
        Assert.Equal(TimeSpan.FromHours(6), Standard().BisZumNaechstenLauf(Utc(20, 0)));
    }

    [Fact]
    public void API_F_076_direkt_vor_einem_Lauf_wird_der_naechste_Slot_gewaehlt()
    {
        // 04:30 UTC = 05:30 Ortszeit exakt → dieser Slot ist nicht mehr „später",
        // also 10:00 Ortszeit (09:00 UTC), 4,5 h.
        Assert.Equal(TimeSpan.FromMinutes(270), Standard().BisZumNaechstenLauf(Utc(4, 30)));
    }

    [Fact]
    public void API_F_076_Zeitplan_kommt_aus_der_Konfiguration_mit_Rueckfall_auf_Vorgaben()
    {
        var konfiguration = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["Mensa:AbrufZeiten:0"] = "07:15",
            ["Mensa:AbrufZeiten:1"] = "unsinn",
            ["Mensa:Zeitzone"] = "Europe/Berlin",
        }).Build();

        var zeitplan = SpeiseplanAbrufZeitplan.AusKonfiguration(konfiguration, NullLogger.Instance);

        // 06:00 Ortszeit → einziger gültiger konfigurierter Lauf 07:15 Ortszeit (06:15 UTC).
        Assert.Equal(TimeSpan.FromMinutes(75), zeitplan.BisZumNaechstenLauf(Utc(5, 0)));
    }

    [Fact]
    public void API_F_076_ohne_Konfiguration_gelten_die_drei_Standardlaeufe()
    {
        var leer = new ConfigurationBuilder().Build();
        var zeitplan = SpeiseplanAbrufZeitplan.AusKonfiguration(leer, NullLogger.Instance);

        Assert.Equal(TimeSpan.FromMinutes(90), zeitplan.BisZumNaechstenLauf(Utc(3, 0)));
        Assert.Equal(TimeSpan.FromHours(3), zeitplan.BisZumNaechstenLauf(Utc(6, 0)));
        Assert.Equal(TimeSpan.FromMinutes(210), zeitplan.BisZumNaechstenLauf(Utc(11, 0)));
    }
}
