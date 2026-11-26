namespace Fb4.Backend.Infrastructure.Raumplan;

/// <summary>
/// Anbindungsangaben des FBWS-Raumplans (INT-009). Das Zielsystem steht
/// ausschließlich in der Konfiguration (<c>Raumplan:BaseUrl</c>), analog
/// <see cref="Mensa.MensaQuelleOptions"/>; nur https (SEC-N-030).
/// </summary>
public static class RaumplanQuelleOptions
{
    public const string BasisadresseSchluessel = "Raumplan:BaseUrl";
    public const string UserAgent = "fb4-backend";

    public static Uri BasisadresseAus(IConfiguration konfiguration)
    {
        var roh = konfiguration[BasisadresseSchluessel];
        if (string.IsNullOrWhiteSpace(roh))
            throw new InvalidOperationException(
                $"Der Raumplan (INT-009) braucht „{BasisadresseSchluessel}“ in der Konfiguration.");

        if (!Uri.TryCreate(roh, UriKind.Absolute, out var adresse))
            throw new InvalidOperationException(
                $"„{BasisadresseSchluessel}“ ist keine gültige absolute Adresse: {roh}");

        if (!string.Equals(adresse.Scheme, Uri.UriSchemeHttps, StringComparison.Ordinal))
            throw new InvalidOperationException(
                $"„{BasisadresseSchluessel}“ muss über https laufen (SEC-N-030), nicht {adresse.Scheme}: {roh}");

        return adresse.AbsolutePath.EndsWith('/') ? adresse : new Uri(adresse + "/");
    }
}
