namespace Fb4.Backend.Infrastructure;

/// <summary>
/// Basis für periodische Hintergrund-Jobs (Zwischenspeicher-Auffrischung, Importe).
/// Kapselt jeden Durchlauf so, dass eine unbehandelte Ausnahme protokolliert wird
/// und ausschließlich diesen Durchlauf abbricht, nicht den Backend-Prozess
/// (API-N-110). Zeitpunkt und Ergebnis landen im <see cref="JobStatusRegistry"/>
/// (API-F-260).
///
/// Der Standard-Zeitplan ist ein festes Grundintervall zwischen den Läufen. Jobs
/// mit einem an Nutzungsspitzen ausgerichteten Zeitplan (API-F-076) überschreiben
/// <see cref="BisZumNaechstenLauf"/> mit einer Ortszeit-Berechnung; das
/// Grundintervall bleibt dann die Obergrenze für die Lücke zwischen zwei Läufen.
///
/// Konkrete Jobs entstehen mit den Feature-Schnitten (MENSA, NEWS, RAUM, EVENT).
/// </summary>
public abstract class PeriodicJobService(
    string jobName,
    TimeSpan interval,
    JobStatusRegistry registry,
    ILogger logger) : BackgroundService
{
    /// <summary>Fuer abgeleitete Jobs, die einzelne Teilschritte protokollieren.</summary>
    protected ILogger Logger => logger;

    /// <summary>Festes Grundintervall (Vorgabe und Obergrenze der Lücke zwischen Läufen).</summary>
    protected TimeSpan Grundintervall => interval;

    protected abstract Task RunOnceAsync(CancellationToken cancellationToken);

    /// <summary>Nur für Tests (InternalsVisibleTo): ein einzelner Durchlauf ohne Zeitgeber.</summary>
    internal Task RunOnceForTestAsync(CancellationToken cancellationToken = default) => RunOnceAsync(cancellationToken);

    /// <summary>
    /// Wartezeit ab <paramref name="jetzt"/> bis zum nächsten Lauf. Standard: das
    /// feste Grundintervall. Zeitgesteuerte Jobs überschreiben dies.
    /// </summary>
    protected virtual TimeSpan BisZumNaechstenLauf(DateTimeOffset jetzt) => interval;

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await RunOnceAsync(stoppingToken);
                registry.Record(new JobRun(jobName, DateTimeOffset.UtcNow, true, null));
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                throw;
            }
            catch (Exception ex)
            {
                // Fehler nie stillschweigend verschlucken (SEC-F-060).
                logger.LogError(ex, "Hintergrund-Job {Job} fehlgeschlagen", jobName);
                registry.Record(new JobRun(jobName, DateTimeOffset.UtcNow, false, ex.Message));
            }

            var warten = BisZumNaechstenLauf(DateTimeOffset.UtcNow);
            if (warten < TimeSpan.FromSeconds(1)) warten = TimeSpan.FromSeconds(1);
            try
            {
                await Task.Delay(warten, stoppingToken);
            }
            catch (OperationCanceledException)
            {
                break;
            }
        }
    }
}
