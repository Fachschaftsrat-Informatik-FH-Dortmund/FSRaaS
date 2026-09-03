using System.Reflection;
using Fb4.Backend.Endpoints;
using Fb4.Backend.Infrastructure;
using Fb4.Backend.Infrastructure.Audit;
using Fb4.Backend.Infrastructure.Auth;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;

var appVersion = Assembly.GetExecutingAssembly()
    .GetCustomAttribute<AssemblyInformationalVersionAttribute>()?.InformationalVersion
    ?? "0.0.0-dev";

var builder = WebApplication.CreateBuilder(args);

// Einheitliches Fehlerformat nach RFC 9457 mit maschinenlesbarem `code` (API-N-040).
builder.Services.AddProblemDetails(options =>
    options.CustomizeProblemDetails = ctx => ProblemHandling.AddCode(ctx.ProblemDetails, ctx.HttpContext));
builder.Services.AddExceptionHandler<ApiExceptionHandler>();
builder.Services.AddOpenApi();
builder.Services.AddHttpContextAccessor();

builder.Services.AddSingleton<JobStatusRegistry>();

// PostgreSQL über EF Core (ADR 0011, backend-and-api.md Abschnitt 8).
// Ohne Verbindungszeichenfolge bleibt der Context nicht konfiguriert — das
// Gerüst startet trotzdem, damit /health auch ohne Datenbank antwortet.
var connectionString = builder.Configuration.GetConnectionString("Fb4");
if (!string.IsNullOrWhiteSpace(connectionString))
{
    builder.Services.AddDbContext<Fb4DbContext>(o => o.UseNpgsql(connectionString));
    builder.Services.AddScoped<StammdatenStore>();
    builder.Services.AddScoped<AuditLog>();
    // Reihenfolge zählt: der Host wartet StartAsync des DbInitializers vollständig
    // ab (Migration + Seed), bevor der Aufräum-Job seinen ersten Durchlauf beginnt.
    builder.Services.AddHostedService<DbInitializer>();
    builder.Services.AddHostedService<VerwaltungsprotokollAufraeumJob>();
}
else
{
    // Ohne Datenbank trotzdem gestartet (nur /health). Der DbInitializer meldet das.
    builder.Services.AddHostedService<DbInitializer>();
}

// Anmeldung gegen Authentik (INT-012, ADR 0010) und Rollen-Richtlinien.
builder.Services.AddFb4Authentication(builder.Configuration);

// Rollenzuweisung wirkt auf Authentik-Gruppen (ADMIN-F-070). Ohne konfigurierte
// Verwaltungs-API meldet der Ersatz den Zustand als nicht verfügbar (503).
var authOptions = builder.Configuration.GetSection(AuthentikOptions.Section).Get<AuthentikOptions>() ?? new();
if (authOptions.ManagementApiKonfiguriert)
{
    builder.Services.AddHttpClient<IAuthentikDirectory, AuthentikDirectory>();
}
else
{
    builder.Services.AddSingleton<IAuthentikDirectory, NichtKonfigurierteAuthentikDirectory>();
}

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseStatusCodePages();
app.UseExceptionHandler();

app.UseAuthentication();
app.UseAuthorization();

// Betriebszustand des Backends (API-N-090). Nennt je periodischem
// Hintergrund-Job Zeitpunkt und Ergebnis des letzten Durchlaufs (API-F-260).
app.MapGet("/health", (JobStatusRegistry jobs) => Results.Ok(new
{
    status = "ok",
    version = appVersion,
    jobs = jobs.Snapshot(),
}));

// Alle Vertrags-Endpunkte liegen hinter dem Wire-Versionssegment /v1
// (api-contract.yaml servers-URL, API-N-030/N-130). /health bleibt versionsfrei.
var v1 = app.MapGroup("/v1");
v1.MapStammdatenEndpoints();
v1.MapVerwaltungEndpoints();

// Web-Export der Verwaltungsoberfläche (ADR 0018, Entscheidung 2026-09-02):
// vom Backend mitausgeliefert unter /admin. Der Expo-Web-Export wird von der CI
// nach wwwroot/admin gelegt; fehlt er, bleibt der Pfad einfach unbelegt.
var adminRoot = Path.Combine(app.Environment.ContentRootPath, "wwwroot", "admin");
if (Directory.Exists(adminRoot))
{
    var provider = new PhysicalFileProvider(adminRoot);
    app.UseDefaultFiles(new DefaultFilesOptions { FileProvider = provider, RequestPath = "/admin" });
    app.UseStaticFiles(new StaticFileOptions { FileProvider = provider, RequestPath = "/admin" });
    app.MapFallback("/admin/{*path}", () => Results.File(
        Path.Combine(adminRoot, "index.html"), "text/html"));
}

app.Run();

/// <summary>Einstiegspunkt sichtbar für die Test-WebApplicationFactory.</summary>
public partial class Program;
