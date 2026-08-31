using System.Reflection;
using Fb4.Backend.Infrastructure;
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

// PostgreSQL über EF Core (ADR 0011, backend-and-api.md Abschnitt 8).
// Ohne Verbindungszeichenfolge bleibt der Context nicht konfiguriert — das
// Gerüst startet trotzdem, damit /health auch ohne Datenbank antwortet.
var connectionString = builder.Configuration.GetConnectionString("Fb4");
if (!string.IsNullOrWhiteSpace(connectionString))
{
    builder.Services.AddDbContext<Fb4DbContext>(o => o.UseNpgsql(connectionString));
}

builder.Services.AddSingleton<JobStatusRegistry>();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseStatusCodePages();
app.UseExceptionHandler();

// Betriebszustand des Backends (API-N-090). Nennt je periodischem
// Hintergrund-Job Zeitpunkt und Ergebnis des letzten Durchlaufs (API-F-260).
app.MapGet("/health", (JobStatusRegistry jobs) => Results.Ok(new
{
    status = "ok",
    version = appVersion,
    jobs = jobs.Snapshot(),
}));

app.Run();

/// <summary>Einstiegspunkt sichtbar für die Test-WebApplicationFactory.</summary>
public partial class Program;
