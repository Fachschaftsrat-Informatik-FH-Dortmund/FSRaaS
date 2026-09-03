namespace Fb4.Backend.Infrastructure.Auth;

/// <summary>
/// Konfiguration der Anbindung an den Identitätsanbieter Authentik (INT-012).
/// Alle Werte kommen ausschließlich aus der Konfiguration, nie fest aus dem
/// Quellcode (SEC-F-050, SEC-N-110). Ohne <see cref="Authority"/> ist kein
/// Anbieter konfiguriert: geschützte Endpunkte antworten dann mit 401,
/// kontofreie Lesepfade bleiben nutzbar.
/// </summary>
public sealed class AuthentikOptions
{
    public const string Section = "Authentik";

    /// <summary>OIDC-Issuer / Discovery-Basis (z. B. https://auth.fsrfb4.de/application/o/fb4-app/).</summary>
    public string? Authority { get; set; }

    /// <summary>Erwartete Audience des Zugriffstokens; leer = keine Audience-Prüfung.</summary>
    public string? Audience { get; set; }

    /// <summary>Discovery nur über TLS laden (SEC-N-030). Nur für lokale Tests abschaltbar.</summary>
    public bool RequireHttpsMetadata { get; set; } = true;

    /// <summary>Claim-Name, unter dem Authentik die Gruppenzugehörigkeit liefert.</summary>
    public string GroupsClaim { get; set; } = "groups";

    /// <summary>Name der Authentik-Gruppe für die Rolle FSR-Redaktion.</summary>
    public string RedaktionGruppe { get; set; } = "FSR-Redaktion";

    /// <summary>Name der Authentik-Gruppe für die Rolle Moderation.</summary>
    public string ModerationGruppe { get; set; } = "Moderation";

    /// <summary>Basis-URL der Authentik-Verwaltungs-API (INT-012), für ADMIN-F-070.</summary>
    public string? ManagementApiBaseUrl { get; set; }

    /// <summary>Token mit Gruppen-Schreibzugriff für die Verwaltungs-API. Aus einem Secret-Mechanismus, nie aus dem Repo (SEC-N-110).</summary>
    public string? ManagementApiToken { get; set; }

    public bool ManagementApiKonfiguriert =>
        !string.IsNullOrWhiteSpace(ManagementApiBaseUrl) && !string.IsNullOrWhiteSpace(ManagementApiToken);
}
