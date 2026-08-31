namespace Fb4.Backend.Infrastructure;

/// <summary>
/// Basis für periodische Hintergrund-Jobs (Zwischenspeicher-Auffrischung, Importe).
/// Kapselt jeden Durchlauf so, dass eine unbehandelte Ausnahme protokolliert wird
/// und ausschließlich diesen Durchlauf abbricht, nicht den Backend-Prozess
/// (API-N-110). Zeitpunkt und Ergebnis landen im <see cref="JobStatusRegistry"/>
/// (API-F-260).
///
/// Konkrete Jobs entstehen mit den Feature-Schnitten (MENSA, NEWS, RAUM, EVENT).
/// </summary>
public abstract class PeriodicJobService(
    string jobName,
    TimeSpan interval,
    JobStatusRegistry registry,
    ILogger logger) : BackgroundService
{
    protected abstract Task RunOnceAsync(CancellationToken cancellationToken);

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(interval);
        do
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
        }
        while (await timer.WaitForNextTickAsync(stoppingToken));
    }
}
