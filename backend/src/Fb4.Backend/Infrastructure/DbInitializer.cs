using Microsoft.EntityFrameworkCore;

namespace Fb4.Backend.Infrastructure;

/// <summary>
/// Wendet beim Start ausstehende Migrationen an (nur bei relationaler Datenbank)
/// und stellt den Ausgangsbestand der Stammdaten sicher (<see cref="SeedData"/>).
/// Ohne konfigurierte Verbindungszeichenfolge ist kein <see cref="Fb4DbContext"/>
/// registriert — dann bleibt dieser Dienst wirkungslos und das Gerüst startet
/// trotzdem (analog Program.cs).
/// </summary>
public sealed class DbInitializer(IServiceProvider services, ILogger<DbInitializer> logger) : IHostedService
{
    public async Task StartAsync(CancellationToken cancellationToken)
    {
        using var scope = services.CreateScope();
        var db = scope.ServiceProvider.GetService<Fb4DbContext>();
        if (db is null)
        {
            logger.LogInformation("Kein Fb4DbContext registriert — Datenbank-Initialisierung übersprungen.");
            return;
        }

        if (db.Database.IsRelational())
            await db.Database.MigrateAsync(cancellationToken);
        else
            await db.Database.EnsureCreatedAsync(cancellationToken);

        await SeedData.EnsureSeededAsync(db, cancellationToken);
    }

    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;
}
