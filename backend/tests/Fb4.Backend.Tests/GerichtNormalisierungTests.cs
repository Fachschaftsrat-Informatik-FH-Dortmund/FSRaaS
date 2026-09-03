using Fb4.Backend.Infrastructure.Mensa;
using Xunit;

namespace Fb4.Backend.Tests;

/// <summary>
/// RATE-F-050 / QA-F-060 / RATE-N-010: Normalisierung der Gerichtsbezeichnungen.
/// In Roadmap-Schritt 4 vorgezogen, weil MENSA-F-090 (Lieblingsgerichte) denselben
/// stabilen Schlüssel als Bindeglied braucht.
/// </summary>
public class GerichtNormalisierungTests
{
    [Theory]
    [InlineData("Spaghetti Bolognese", "spaghetti bolognese")]
    [InlineData("  Spaghetti   Bolognese  ", "spaghetti bolognese")]
    [InlineData("SPAGHETTI Bolognese", "spaghetti bolognese")]
    [InlineData("1. Spaghetti Bolognese", "spaghetti bolognese")]
    [InlineData("12.  Currywurst", "currywurst")]
    public void RATE_F_050_Kernregel_vereinheitlicht_Schreibvarianten(string roh, string erwartet)
        => Assert.Equal(erwartet, GerichtNormalisierung.Normalisieren(roh));

    [Fact]
    public void RATE_F_050_entfernt_inline_stehende_Zusatzstoff_Klammern_aus_INT_015_Titeln()
    {
        // Dasselbe Gericht an zwei Tagen mit unterschiedlichen Zusatzstoff-Listen.
        var tag1 = GerichtNormalisierung.Normalisieren("Bolognese (20a,28) | Spaghetti (20a) | Reibkäse (2,22,26)");
        var tag2 = GerichtNormalisierung.Normalisieren("Bolognese (20a) | Spaghetti | Reibkäse (2,26)");

        Assert.Equal("bolognese | spaghetti | reibkäse", tag1);
        Assert.Equal(tag1, tag2);
    }

    [Fact]
    public void RATE_F_050_laesst_Klammern_mit_anderem_Inhalt_unberuehrt()
    {
        Assert.Equal("pommes (scharf)", GerichtNormalisierung.Normalisieren("Pommes (scharf)"));
        Assert.Equal("pizza (1 stück)", GerichtNormalisierung.Normalisieren("Pizza (1 Stück)"));
    }

    [Fact]
    public void RATE_F_050_OhneZusatzstoffKlammern_behaelt_Schreibweise_und_Trenner_fuer_die_Anzeige()
    {
        Assert.Equal(
            "Bolognese | Spaghetti | Reibkäse",
            GerichtNormalisierung.OhneZusatzstoffKlammern("Bolognese (20a,28) | Spaghetti (20a) | Reibkäse (2,22,26)"));
    }
}
