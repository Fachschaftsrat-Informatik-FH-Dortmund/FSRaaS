using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Fb4.Backend.Contract.Generated;
using Fb4.Backend.Endpoints;
using Fb4.Backend.Infrastructure;
using Fb4.Backend.Infrastructure.Audit;
using Fb4.Backend.Infrastructure.Auth;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;

namespace Fb4.Backend.Tests.Infrastruktur;

/// <summary>
/// Startet das Backend mit einer In-Memory-Datenbank und einem lokal signierten
/// Prüf-Token statt einer echten Authentik-Instanz. Die Rollen-Abbildung
/// (Gruppen-Claim → Rolle) bleibt der Produktionspfad (<see cref="AuthSetup"/>).
/// </summary>
public sealed class TestAppFactory : WebApplicationFactory<Program>
{
    public const string Issuer = "https://test.local/";
    public const string Audience = "fb4-app";
    static readonly SymmetricSecurityKey SigningKey =
        new(System.Text.Encoding.UTF8.GetBytes("test-signing-key-fuer-fb4-backend-tests-0123456789"));

    readonly string _dbName = "fb4-tests-" + Guid.NewGuid().ToString("N");

    public IServiceScope NewScope() => Services.CreateScope();

    public HttpClient CreateClientAls(params Rolle[] rollen) => CreateClientMitGruppen(
        rollen.Select(r => r == Rolle.FsrRedaktion ? "FSR-Redaktion" : "Moderation").ToArray());

    public HttpClient CreateClientMitGruppen(params string[] gruppen)
    {
        var client = CreateClient();
        client.DefaultRequestHeaders.Authorization =
            new("Bearer", TokenMit(gruppen));
        return client;
    }

    public string TokenMit(params string[] gruppen)
    {
        var claims = new List<Claim>
        {
            new("sub", "konto-test"),
            new("preferred_username", "Testkonto"),
        };
        claims.AddRange(gruppen.Select(g => new Claim("groups", g)));

        var token = new JwtSecurityToken(
            issuer: Issuer,
            audience: Audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(10),
            signingCredentials: new SigningCredentials(SigningKey, SecurityAlgorithms.HmacSha256));
        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        // Nicht „Development": sonst überlagert die lokale appsettings.Development.json
        // (echte Verbindungszeichenfolge) die Testkonfiguration und es kämen zwei
        // EF-Provider zusammen.
        builder.UseEnvironment("Testing");
        builder.UseSetting("ConnectionStrings:Fb4", "");
        builder.UseSetting("Authentik:Authority", "https://auth.example.invalid/");
        builder.UseSetting("Authentik:Audience", Audience);
        builder.UseSetting("Authentik:ManagementApiBaseUrl", "");
        builder.UseSetting("Authentik:ManagementApiToken", "");

        builder.ConfigureTestServices(services =>
        {
            var descriptor = services.SingleOrDefault(d => d.ServiceType == typeof(DbContextOptions<Fb4DbContext>));
            if (descriptor is not null) services.Remove(descriptor);
            services.AddDbContext<Fb4DbContext>(o => o.UseInMemoryDatabase(_dbName));
            // Feature-Dienste hängen produktiv an der Verbindungszeichenfolge
            // (Program.cs); im Test kommt die Datenbank von hier.
            services.AddScoped<StammdatenStore>();
            services.AddScoped<AuditLog>();

            services.Configure<JwtBearerOptions>(JwtBearerDefaults.AuthenticationScheme, o =>
            {
                o.Authority = null;
                o.RequireHttpsMetadata = false;
                o.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidIssuer = Issuer,
                    ValidateAudience = true,
                    ValidAudience = Audience,
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = SigningKey,
                    RoleClaimType = ClaimTypes.Role,
                    NameClaimType = "preferred_username",
                };
            });
        });
    }
}
