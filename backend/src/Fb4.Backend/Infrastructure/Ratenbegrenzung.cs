using System.Globalization;
using System.Net;
using System.Net.Sockets;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace Fb4.Backend.Infrastructure;

/// <summary>
/// Ratenbegrenzung kontofreier Schreibpfade (Capability <c>backend-and-api</c>,
/// Requirement „Ratenbegrenzung kontofreier Schreibpfade"). Quelle ist die
/// Netzadresse (IPv6: /64-Präfix). Die Zählung lebt ausschließlich im
/// Arbeitsspeicher dieses Prozesses und verfällt mit ihrem Zeitfenster; keine
/// Adresse wird gespeichert oder protokolliert.
/// </summary>
public static class Ratenbegrenzung
{
    public const string KontofreiSchreiben = "kontofrei-schreiben";
    public const string Abschnitt = "Ratenbegrenzung:KontofreiSchreiben";

    /// <summary>Arbeitswerte: großzügig, weil sich im Hochschulnetz viele Geräte eine Adresse teilen.</summary>
    public const int StandardAnzahl = 30;
    public const int StandardFensterSekunden = 600;

    public static IServiceCollection AddFb4Ratenbegrenzung(this IServiceCollection services, IConfiguration config)
    {
        services.AddRateLimiter(o =>
        {
            o.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
            o.AddPolicy(KontofreiSchreiben, http =>
            {
                // Bei jeder Partition neu gelesen, damit Tests den Schwellwert über
                // die Konfiguration setzen können; die Partition selbst bleibt bestehen.
                var anzahl = config.GetValue($"{Abschnitt}:Anzahl", StandardAnzahl);
                var fenster = Fenster(config);
                return RateLimitPartition.GetFixedWindowLimiter(
                    Quelle(http.Connection.RemoteIpAddress),
                    _ => new FixedWindowRateLimiterOptions
                    {
                        PermitLimit = anzahl,
                        Window = fenster,
                        QueueLimit = 0,
                        AutoReplenishment = true,
                    });
            });
            o.OnRejected = async (ctx, ct) =>
            {
                var http = ctx.HttpContext;
                var sekunden = ctx.Lease.TryGetMetadata(MetadataName.RetryAfter, out var nach)
                    ? (int)Math.Ceiling(nach.TotalSeconds)
                    : (int)Math.Ceiling(Fenster(config).TotalSeconds);
                http.Response.Headers.RetryAfter = Math.Max(1, sekunden).ToString(CultureInfo.InvariantCulture);

                // Signal für Häufungen (Mustererkennung IDENT-F-065 bleibt offen) —
                // ohne Adresse (SEC-N-120).
                var muster = (http.GetEndpoint() as RouteEndpoint)?.RoutePattern.RawText ?? "unbekannt";
                http.RequestServices.GetRequiredService<ILoggerFactory>()
                    .CreateLogger(typeof(Ratenbegrenzung).FullName!)
                    .LogWarning("Ratenbegrenzung kontofreier Schreibpfade gegriffen: {Methode} {Endpunkt}",
                        http.Request.Method, muster);

                await http.RequestServices.GetRequiredService<IProblemDetailsService>().WriteAsync(new ProblemDetailsContext
                {
                    HttpContext = http,
                    ProblemDetails = new ProblemDetails
                    {
                        Status = StatusCodes.Status429TooManyRequests,
                        Title = "Zu viele Anfragen von dieser Adresse; bitte später erneut versuchen.",
                        Extensions = { ["code"] = "zu_viele_anfragen" },
                    },
                });
            };
        });
        return services;
    }

    static TimeSpan Fenster(IConfiguration config) =>
        TimeSpan.FromSeconds(config.GetValue($"{Abschnitt}:FensterSekunden", StandardFensterSekunden));

    /// <summary>
    /// Partitionsschlüssel der Quelle. IPv6 wird auf das /64-Präfix gekürzt, weil
    /// ein Anschluss sonst durch Adresswechsel beliebig viele Partitionen erzeugt.
    /// </summary>
    public static string Quelle(IPAddress? adresse)
    {
        if (adresse is null) return "unbekannt";
        if (adresse.IsIPv4MappedToIPv6) adresse = adresse.MapToIPv4();
        if (adresse.AddressFamily != AddressFamily.InterNetworkV6) return adresse.ToString();
        var bytes = adresse.GetAddressBytes();
        Array.Clear(bytes, 8, 8);
        return new IPAddress(bytes) + "/64";
    }
}
