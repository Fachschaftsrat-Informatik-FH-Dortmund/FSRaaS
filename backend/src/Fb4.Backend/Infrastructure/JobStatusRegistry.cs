using System.Collections.Concurrent;

namespace Fb4.Backend.Infrastructure;

/// <summary>Ergebnis des letzten Durchlaufs eines periodischen Hintergrund-Jobs.</summary>
public record JobRun(string Job, DateTimeOffset RanAt, bool Succeeded, string? Error);

/// <summary>
/// Hält je periodischem Hintergrund-Job Zeitpunkt und Ergebnis des letzten
/// Durchlaufs vor, damit der Health-Check-Endpunkt sie ausweisen kann
/// (API-F-260). Threadsicher; von <see cref="PeriodicJobService"/> beschrieben.
/// </summary>
public class JobStatusRegistry
{
    private readonly ConcurrentDictionary<string, JobRun> _runs = new();

    public void Record(JobRun run) => _runs[run.Job] = run;

    public IReadOnlyCollection<JobRun> Snapshot() => _runs.Values.ToArray();
}
