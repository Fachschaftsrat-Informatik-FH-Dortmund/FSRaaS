using Microsoft.Extensions.Configuration;

namespace Fb4.Backend.Infrastructure.Mensa;

/// <summary>
/// Anbindungsangaben der Mensa-Schnittstelle (INT-020). Das Zielsystem steht
/// ausschliesslich in der Konfiguration (<c>Mensa:BaseUrl</c>, in
/// <c>appsettings.json</c> vorbelegt) — nicht im Quellcode, damit ein Wechsel des
/// Betriebs ohne Codeaenderung moeglich bleibt und eine Testinstanz nicht
/// versehentlich gegen den Livebetrieb laeuft (SEC-F-050 sinngemaess).
/// </summary>
public static class MensaQuelleOptions
{
    public const string BasisadresseSchluessel = "Mensa:BaseUrl";

    /// <summary>
    /// Eigener User-Agent, damit vorgelagerte Bot-Filter den Aufrufer erkennen.
    /// Keine Zieladresse — deshalb hier und nicht in der Konfiguration.
    /// </summary>
    public const string UserAgent = "fb4-backend";

    /// <summary>
    /// Basisadresse aus der Konfiguration. Fehlt sie, startet das Backend nicht mit
    /// einer stillen Ersatzadresse weiter (SEC-F-060: keine stillen Fehler). Nur
    /// <c>https</c> ist zugelassen (SEC-N-030 — ausnahmslos TLS).
    /// </summary>
    public static Uri BasisadresseAus(IConfiguration konfiguration)
    {
        var roh = konfiguration[BasisadresseSchluessel];
        if (string.IsNullOrWhiteSpace(roh))
            throw new InvalidOperationException(
                $"Die Mensa-Schnittstelle (INT-020) braucht „{BasisadresseSchluessel}“ in der Konfiguration.");

        if (!Uri.TryCreate(roh, UriKind.Absolute, out var adresse))
            throw new InvalidOperationException(
                $"„{BasisadresseSchluessel}“ ist keine gültige absolute Adresse: {roh}");

        if (!string.Equals(adresse.Scheme, Uri.UriSchemeHttps, StringComparison.Ordinal))
            throw new InvalidOperationException(
                $"„{BasisadresseSchluessel}“ muss über https laufen (SEC-N-030), nicht {adresse.Scheme}: {roh}");

        // Ohne abschliessenden Schraegstrich verschluckt Uri-Verkettung das letzte
        // Pfadsegment der Basisadresse.
        return adresse.AbsolutePath.EndsWith('/') ? adresse : new Uri(adresse + "/");
    }
}
