using Fb4.Backend.Contract.Generated;
using Fb4.Backend.Infrastructure.Auth;
using Xunit;

namespace Fb4.Backend.Tests;

public class RollenRegelnTests
{
    static Rollenzuweisung Z(string konto, params Rolle[] rollen) =>
        new() { KontoId = konto, Rollen = rollen };

    [Fact]
    public void ADMIN_F_080_Entzug_der_letzten_FSR_Redaktionsrolle_wird_erkannt()
    {
        var bestand = new[] { Z("a", Rolle.FsrRedaktion) };

        Assert.True(RollenRegeln.WuerdeLetzteRedaktionsRolleEntziehen(bestand, "a", [Rolle.Moderation]));
    }

    [Fact]
    public void ADMIN_F_080_Entzug_ist_zulaessig_solange_eine_weitere_Person_die_Rolle_haelt()
    {
        var bestand = new[] { Z("a", Rolle.FsrRedaktion), Z("b", Rolle.FsrRedaktion) };

        Assert.False(RollenRegeln.WuerdeLetzteRedaktionsRolleEntziehen(bestand, "a", []));
    }

    [Fact]
    public void ADMIN_F_080_wer_die_Rolle_behaelt_loest_die_Regel_nicht_aus()
    {
        var bestand = new[] { Z("a", Rolle.FsrRedaktion) };

        Assert.False(RollenRegeln.WuerdeLetzteRedaktionsRolleEntziehen(bestand, "a", [Rolle.FsrRedaktion, Rolle.Moderation]));
    }

    [Fact]
    public void ADMIN_F_080_Aenderung_an_einem_anderen_Konto_ohne_Redaktionsrolle_ist_unkritisch()
    {
        var bestand = new[] { Z("a", Rolle.FsrRedaktion), Z("b", Rolle.Moderation) };

        Assert.False(RollenRegeln.WuerdeLetzteRedaktionsRolleEntziehen(bestand, "b", []));
    }
}
