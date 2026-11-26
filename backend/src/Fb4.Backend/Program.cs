using System.Reflection;
using Fb4.Backend.Endpoints;
using Fb4.Backend.Infrastructure;
using Fb4.Backend.Infrastructure.Audit;
using Fb4.Backend.Infrastructure.Auth;
using Fb4.Backend.Infrastructure.Mensa;
using Fb4.Backend.Infrastructure.Raumplan;
using Microsoft.EntityFrameworkCore;

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
builder.Services.AddSingleton(TimeProvider.System);
builder.Services.AddMemoryCache();

// Mensa-Schnittstelle INT-020 (mensa.fb4.it): Zielsystem ausschliesslich aus der
// Konfiguration (MensaQuelleOptions), eigener User-Agent (Bot-Filter vorgelagerter
// Proxys) und Standard-Resilienz (Timeout, Retry mit Backoff, Circuit Breaker —
// API-N-120, ADR 0015). Der AntwortGueltigkeitHandler beachtet die
// Gueltigkeitsdauer, die die Quelle selbst setzt; ein eigener Bestand entsteht
// nicht (Capability `backend-and-api`).
builder.Services.AddTransient<AntwortGueltigkeitHandler>();
builder.Services.AddHttpClient<FsrMensaClient>(c =>
{
    c.BaseAddress = MensaQuelleOptions.BasisadresseAus(builder.Configuration);
    c.DefaultRequestHeaders.UserAgent.ParseAdd(MensaQuelleOptions.UserAgent);
})
    .AddHttpMessageHandler<AntwortGueltigkeitHandler>()
    .AddStandardResilienceHandler();

// Raumplan INT-009 (FBWS): Zielsystem aus der Konfiguration, nur https,
// Standard-Resilienz wie bei der Mensa (API-N-120). Der Abruf-Job legt den
// Bestand im eigenen Zwischenspeicher ab (Requirement „Raumtermine über
// Platzhalter-Aufruf beziehen").
builder.Services.AddHttpClient<FbwsRaumplanClient>(c =>
{
    c.BaseAddress = RaumplanQuelleOptions.BasisadresseAus(builder.Configuration);
    c.DefaultRequestHeaders.UserAgent.ParseAdd(RaumplanQuelleOptions.UserAgent);
})
    .AddStandardResilienceHandler();

// PostgreSQL über EF Core (ADR 0011, backend-and-api.md Abschnitt 8).
// Ohne Verbindungszeichenfolge bleibt der Context nicht konfiguriert — das
// Gerüst startet trotzdem, damit /health auch ohne Datenbank antwortet.
var connectionString = builder.Configuration.GetConnectionString("Fb4");
if (!string.IsNullOrWhiteSpace(connectionString))
{
    builder.Services.AddDbContext<Fb4DbContext>(o => o.UseNpgsql(connectionString));
    builder.Services.AddScoped<StammdatenStore>();
    builder.Services.AddScoped<AuditLog>();
    builder.Services.AddScoped<MensaQuelle>();
    builder.Services.AddScoped<RaumplanAbruf>();
    builder.Services.AddScoped<PruefungsbestandAbruf>();

    // Reihenfolge zählt: der Host wartet StartAsync des DbInitializers vollständig
    // ab (Migration + Seed), bevor die periodischen Jobs ihren ersten Durchlauf beginnen.
    builder.Services.AddHostedService<DbInitializer>();
    builder.Services.AddHostedService<VerwaltungsprotokollAufraeumJob>();
    builder.Services.AddHostedService<RaumplanAbrufJob>();
    builder.Services.AddHostedService<PruefungsbestandAbrufJob>();
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
v1.MapMensaEndpoints();
v1.MapRaumplanEndpoints();
v1.MapPruefungsplanEndpoints();
v1.MapVerwaltungEndpoints();

// Web-Export der Verwaltungsoberfläche unter /admin (ADR 0018).
app.MapVerwaltungsoberflaeche();

app.Run();

/// <summary>Einstiegspunkt sichtbar für die Test-WebApplicationFactory.</summary>
public partial class Program;
