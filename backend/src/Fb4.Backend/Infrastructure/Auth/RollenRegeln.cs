using Fb4.Backend.Contract.Generated;

namespace Fb4.Backend.Infrastructure.Auth;

/// <summary>Reine Regeln der Rollenzuweisung, UI-frei testbar (ARCH-F-070).</summary>
public static class RollenRegeln
{
    /// <summary>
    /// ADMIN-F-080: Würde das Setzen von <paramref name="neueRollen"/> für
    /// <paramref name="kontoId"/> die letzte verbleibende Zuweisung der Rolle
    /// FSR-Redaktion entziehen?
    /// </summary>
    public static bool WuerdeLetzteRedaktionsRolleEntziehen(
        IReadOnlyList<Rollenzuweisung> aktuellerBestand,
        string kontoId,
        IReadOnlyList<Rolle> neueRollen)
    {
        var hatBisher = aktuellerBestand
            .Any(z => z.KontoId == kontoId && z.Rollen.Contains(Rolle.FsrRedaktion));
        if (!hatBisher || neueRollen.Contains(Rolle.FsrRedaktion))
            return false;

        var andereMitRedaktion = aktuellerBestand
            .Count(z => z.KontoId != kontoId && z.Rollen.Contains(Rolle.FsrRedaktion));
        return andereMitRedaktion == 0;
    }
}
