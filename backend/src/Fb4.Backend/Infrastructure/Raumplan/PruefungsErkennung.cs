using System.Text;
using System.Text.RegularExpressions;

namespace Fb4.Backend.Infrastructure.Raumplan;

/// <summary>Ergebnis der Erkennung eines Prüfungseintrags.</summary>
/// <param name="Modulnummer">Null, wenn das Namensmuster keine Modulnummer hergibt.</param>
/// <param name="Bezeichnung">Text nach der Modulnummer, sonst nach dem Leitwort.</param>
public sealed record ErkanntePruefung(string? Modulnummer, string Bezeichnung);

/// <summary>
/// Erkennt Prüfungen im Raumplan (INT-009) am Namen — Requirement „Ableitung des
/// Prüfungsbestands aus dem Raumplan" (Capability <c>backend-and-api</c>). Das
/// Muster liegt bewusst an dieser einen Stelle im Backend, nicht in jeder
/// ausgelieferten App-Version. <c>eventType</c> wird nicht geprüft: Eine Umbenennung
/// dort ließe sonst jede Prüfung still verschwinden.
/// </summary>
public static partial class PruefungsErkennung
{
    // Leitwort „Prüfung" oder „Prüfungen", danach Leerraum oder Ende —
    // „Prüfungsvorbereitung" ist keine Prüfung.
    [GeneratedRegex(@"^Prüfung(?:en)?(?=\s|$)")]
    private static partial Regex Leitwort();

    // Fünf- oder sechsstellige Modulnummer (Spike 2026-09-07, Curricula: z. B. 411031).
    [GeneratedRegex(@"^Prüfung\s+(\d{5,6})\s+(\S.*)$")]
    private static partial Regex MitModulnummer();

    /// <summary>Name in NFC, getrimmt — ein zerlegtes „u + ¨" träfe sonst nicht.</summary>
    public static string Normalisiert(string? name) =>
        (name ?? "").Normalize(NormalizationForm.FormC).Trim();

    /// <summary>Die Prüfung, wenn der Name eine ist, sonst null.</summary>
    public static ErkanntePruefung? Erkenne(string? name)
    {
        var n = Normalisiert(name);
        var leitwort = Leitwort().Match(n);
        if (!leitwort.Success) return null;

        var muster = MitModulnummer().Match(n);
        if (muster.Success)
            return new ErkanntePruefung(muster.Groups[1].Value, muster.Groups[2].Value.Trim());

        var rest = n[leitwort.Length..].Trim();
        return new ErkanntePruefung(null, rest.Length > 0 ? rest : n);
    }
}
