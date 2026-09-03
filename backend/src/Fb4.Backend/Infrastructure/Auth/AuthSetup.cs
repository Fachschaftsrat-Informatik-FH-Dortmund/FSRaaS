using System.Security.Claims;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;

namespace Fb4.Backend.Infrastructure.Auth;

/// <summary>
/// Registriert die Anmeldung gegen Authentik (INT-012, ADR 0010) und die
/// Rollen-Richtlinien. Rollen kommen als Gruppen-Claim aus dem Token; das
/// Backend führt keine eigene Rollentabelle (API-F-250, IDENT-F-045).
/// </summary>
public static class AuthSetup
{
    /// <summary>Richtlinie: Rolle FSR-Redaktion erforderlich (ADMIN-F-010).</summary>
    public const string RedaktionPolicy = "fsr-redaktion";

    /// <summary>Richtlinie: Rolle Moderation erforderlich.</summary>
    public const string ModerationPolicy = "moderation";

    public static IServiceCollection AddFb4Authentication(this IServiceCollection services, IConfiguration config)
    {
        var section = config.GetSection(AuthentikOptions.Section);
        services.Configure<AuthentikOptions>(section);
        var options = section.Get<AuthentikOptions>() ?? new AuthentikOptions();

        services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(jwt =>
            {
                jwt.RequireHttpsMetadata = options.RequireHttpsMetadata;
                jwt.MapInboundClaims = false;
                jwt.TokenValidationParameters.RoleClaimType = ClaimTypes.Role;
                jwt.TokenValidationParameters.NameClaimType = "preferred_username";

                if (!string.IsNullOrWhiteSpace(options.Authority))
                {
                    jwt.Authority = options.Authority;
                    jwt.TokenValidationParameters.ValidateAudience = !string.IsNullOrWhiteSpace(options.Audience);
                    jwt.TokenValidationParameters.ValidAudience = options.Audience;
                    // Discovery/JWKS-Abruf: eindeutiger User-Agent, falls die
                    // Authentik-Instanz hinter einem Reverse Proxy / CDN mit
                    // Bot-Filter liegt (weist Anfragen ohne UA sonst ab). Der
                    // Backchannel lebt für die Prozesslaufzeit (Standardmuster für
                    // JwtBearer); PooledConnectionLifetime lässt DNS-Wechsel greifen.
                    var backchannel = new HttpClient(new SocketsHttpHandler
                    {
                        PooledConnectionLifetime = TimeSpan.FromMinutes(15),
                    });
                    backchannel.DefaultRequestHeaders.UserAgent.ParseAdd("fb4-backend");
                    backchannel.Timeout = TimeSpan.FromSeconds(30);
                    jwt.Backchannel = backchannel;
                }
                else
                {
                    // Kein Identitätsanbieter konfiguriert: jedes Token wird
                    // abgelehnt. Kein stiller Durchlass (SEC-F-060).
                    jwt.TokenValidationParameters.ValidateIssuer = false;
                    jwt.TokenValidationParameters.ValidateAudience = false;
                    jwt.TokenValidationParameters.SignatureValidator = (_, _) =>
                        throw new SecurityTokenInvalidSignatureException(
                            "Kein Identitätsanbieter konfiguriert (Authentik:Authority fehlt).");
                }

                jwt.Events = new JwtBearerEvents
                {
                    OnTokenValidated = ctx =>
                    {
                        MapGroupsToRoles(ctx.Principal, options);
                        return Task.CompletedTask;
                    },
                };
            });

        services.AddAuthorizationBuilder()
            .AddPolicy(RedaktionPolicy, p => p.RequireRole(RedaktionPolicy))
            .AddPolicy(ModerationPolicy, p => p.RequireRole(ModerationPolicy));

        return services;
    }

    /// <summary>
    /// Bildet die Authentik-Gruppen des Tokens auf Rollen-Claims ab, gegen die
    /// die Richtlinien prüfen.
    /// </summary>
    public static void MapGroupsToRoles(ClaimsPrincipal? principal, AuthentikOptions options)
    {
        if (principal?.Identity is not ClaimsIdentity identity) return;

        var groups = identity.FindAll(options.GroupsClaim).Select(c => c.Value).ToHashSet(StringComparer.Ordinal);

        if (groups.Contains(options.RedaktionGruppe) && !identity.HasClaim(ClaimTypes.Role, RedaktionPolicy))
            identity.AddClaim(new Claim(ClaimTypes.Role, RedaktionPolicy));

        if (groups.Contains(options.ModerationGruppe) && !identity.HasClaim(ClaimTypes.Role, ModerationPolicy))
            identity.AddClaim(new Claim(ClaimTypes.Role, ModerationPolicy));
    }
}
