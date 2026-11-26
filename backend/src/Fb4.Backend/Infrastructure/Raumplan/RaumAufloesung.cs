using System.Text.RegularExpressions;

namespace Fb4.Backend.Infrastructure.Raumplan;

/// <summary>
/// Ermittelt die Räume eines Raumplan-Termins. Trägt er die Pseudo-Raumkennung
/// <c>*</c>, steht der Raum im Namensfeld als Freitext — etwa
/// <c>… (in Raum C.E.44)</c> oder <c>… in den Räumen C.3.34 und C.3.32</c>
/// (INT-009, Befund 2026-09-07). Wird das übersehen, meldet die Raumsuche rund ein
/// Drittel der Belegung als frei.
/// </summary>
public static partial class RaumAufloesung
{
    public const string Pseudoraum = "*";

    // Gebäude (ein Großbuchstabe) . Etage (E, U oder Ziffern) . Raumnummer.
    // Begrenzt, damit Uhrzeiten („9:15") und Modulnummern nicht als Raum gelten.
    [GeneratedRegex(@"(?<![\w.])([A-Z])\.(E|U|\d{1,2})\.(\d{1,3}[a-z]?)(?![\w.])")]
    private static partial Regex RaumMuster();

    /// <summary>
    /// Räume des Termins: die echte <paramref name="roomId"/>, sonst alle im Namen
    /// genannten. Nennt auch der Name keinen, bleibt es beim Pseudoraum.
    /// </summary>
    public static IReadOnlyList<string> RaeumeFuer(string roomId, string name)
    {
        if (!string.IsNullOrWhiteSpace(roomId) && roomId.Trim() != Pseudoraum)
            return [roomId.Trim()];

        var ausName = RaumMuster().Matches(name ?? "")
            .Select(m => m.Value)
            .Distinct(StringComparer.Ordinal)
            .ToList();
        return ausName.Count > 0 ? ausName : [Pseudoraum];
    }

    /// <summary>Auffüllregel aus INT-002: <c>800</c> wird <c>0800</c>.</summary>
    public static string Uhrzeit(string? hhmm) =>
        string.IsNullOrWhiteSpace(hhmm) ? "" : hhmm.Trim().PadLeft(4, '0');
}
