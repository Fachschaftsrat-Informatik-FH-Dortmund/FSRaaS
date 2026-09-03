using System.Text.RegularExpressions;

namespace Fb4.Backend.Infrastructure.Mensa;

/// <summary>
/// Normalisierung der Gerichtsbezeichnungen (RATE-F-050, in Roadmap-Schritt 4
/// vorgezogen für MENSA-F-090). Erzeugt aus einem INT-015-Rohtitel einen über
/// Zubereitungstage stabilen Schlüssel — Bindeglied zwischen Lieblingsgerichten
/// und Bewertungen. Regeln: <c>features/canteen-ratings/spec.md</c> RATE-F-050.
/// </summary>
public static partial class GerichtNormalisierung
{
    // Inline stehende Zusatzstoff-/Allergen-Code-Klammern aus INT-015-Titeln, z. B.
    // „(20a,28)", „(2,22,26)". Erstes Zeichen eine Ziffer, danach nur
    // Ziffern/Kleinbuchstaben/Kommata/Leerzeichen. „(scharf)", „(1 Stück)" bleiben.
    [GeneratedRegex(@"\(\s*\d[0-9a-z,\s]*\)")]
    private static partial Regex ZusatzstoffKlammern();

    [GeneratedRegex(@"\s+")]
    private static partial Regex MehrfachWhitespace();

    [GeneratedRegex(@"^\d+\.\s*")]
    private static partial Regex FuehrendeTagesnummer();

    /// <summary>
    /// Entfernt die inline stehenden Zusatzstoff-Code-Klammern und vereinheitlicht
    /// Whitespace. Groß-/Kleinschreibung und die ` | `-Komponententrenner bleiben —
    /// für die Anzeige der Bezeichnung (Vertrag <c>Gericht.bezeichnung</c>).
    /// </summary>
    public static string OhneZusatzstoffKlammern(string? roh)
    {
        var s = ZusatzstoffKlammern().Replace(roh ?? "", "");
        return MehrfachWhitespace().Replace(s, " ").Trim();
    }

    /// <summary>RATE-F-050: normalisierter Gerichtsschlüssel, stabil über Zubereitungstage.</summary>
    public static string Normalisieren(string? roh)
    {
        var s = OhneZusatzstoffKlammern(roh).ToLowerInvariant();
        s = FuehrendeTagesnummer().Replace(s, "");
        s = MehrfachWhitespace().Replace(s, " ").Trim();
        return s;
    }
}
