using System.Globalization;
using System.Text.Json;
using Fb4.Backend.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace Fb4.Backend.Infrastructure.Mensa;

/// <summary>
/// Periodischer Abruf der Speiseplaene aus INT-015 in den eigenen Zwischenspeicher
/// (API-F-070/F-075). Die App liest ausschliesslich diesen Zwischenspeicher.
/// Fehler-Isolation und Health-Status ueber <see cref="PeriodicJobService"/>
/// (API-N-110, API-F-260); je Mensa gekapselt, damit eine einzelne fehlerhafte
/// Mensa die uebrigen nicht blockiert.
///
/// Der Zeitplan folgt <see cref="SpeiseplanAbrufZeitplan"/>: Ortszeit-Laeufe vor
/// den studentischen Nutzungsspitzen und nach Mensaschluss statt eines starren
/// Intervalls ab Prozessstart (API-F-076, MENSA-N-020).
/// </summary>
public sealed class SpeiseplanAktualisierungJob(
    IServiceScopeFactory scopes,
    JobStatusRegistry registry,
    IConfiguration konfiguration,
    ILogger<SpeiseplanAktualisierungJob> logger)
    : PeriodicJobService("mensa-speiseplan", SpeiseplanAbrufZeitplan.StandardGrundintervall, registry, logger)
{
    static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web);

    readonly SpeiseplanAbrufZeitplan zeitplan = SpeiseplanAbrufZeitplan.AusKonfiguration(konfiguration, logger);

    protected override TimeSpan BisZumNaechstenLauf(DateTimeOffset jetzt) => zeitplan.BisZumNaechstenLauf(jetzt);

    protected override async Task RunOnceAsync(CancellationToken ct)
    {
        using var scope = scopes.CreateScope();
        var db = scope.ServiceProvider.GetService<Fb4DbContext>();
        if (db is null) return;
        var client = scope.ServiceProvider.GetRequiredService<ItmcMensaClient>();

        await VerzeichnisseAktualisierenAsync(db, client, ct);

        var mensen = await db.Mensen.AsNoTracking()
            .Where(m => m.QuelleId != null && m.QuelleId != "")
            .ToListAsync(ct);

        var kategorien = new Dictionary<string, MensaVerzeichnisEintrag>(StringComparer.Ordinal);
        int erfolgreich = 0;
        foreach (var mensa in mensen)
        {
            try
            {
                await MensaAktualisierenAsync(db, client, mensa, kategorien, ct);
                erfolgreich++;
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                Logger.LogWarning(ex, "Speiseplan-Abruf fuer Mensa {Mensa} fehlgeschlagen", mensa.Id);
            }
        }

        // Aus den Gerichten gesammelte Ausgabestellen als Kategorie-Verzeichnis.
        db.MensaVerzeichnis.RemoveRange(
            await db.MensaVerzeichnis.Where(e => e.Art == MensaVerzeichnisEintrag.Kategorie).ToListAsync(ct));
        db.MensaVerzeichnis.AddRange(kategorien.Values);

        var stand = await db.MensaStand.FirstOrDefaultAsync(ct);
        if (stand is null) { stand = new MensaZwischenspeicherStand { Id = 1 }; db.MensaStand.Add(stand); }
        stand.VerzeichnisseAbgerufenAm = DateTimeOffset.UtcNow;
        stand.QuelleErreichbar = mensen.Count == 0 || erfolgreich > 0;

        await db.SaveChangesAsync(ct);

        if (mensen.Count > 0 && erfolgreich == 0)
            throw new InvalidOperationException("Kein einziger Mensa-Speiseplan konnte abgerufen werden.");
    }

    async Task MensaAktualisierenAsync(
        Fb4DbContext db, ItmcMensaClient client, MensaEintrag mensa,
        Dictionary<string, MensaVerzeichnisEintrag> kategorien, CancellationToken ct)
    {
        var tage = await client.AlleTageAsync(mensa.QuelleId!, ct);
        var jetzt = DateTimeOffset.UtcNow;

        db.Speiseplaene.RemoveRange(
            await db.Speiseplaene.Where(t => t.MensaId == mensa.Id).ToListAsync(ct));

        foreach (var (datumRoh, gerichteRoh) in tage)
        {
            if (!DateOnly.TryParse(datumRoh, CultureInfo.InvariantCulture, out var datum))
                continue;

            var cache = gerichteRoh.Select(ItmcMensaClient.Abbilden).ToList();
            foreach (var g in cache)
            {
                var schluessel = string.IsNullOrEmpty(g.KategorieDe) ? g.KategorieEn : g.KategorieDe;
                if (!string.IsNullOrEmpty(schluessel) && !kategorien.ContainsKey(schluessel))
                    kategorien[schluessel] = new MensaVerzeichnisEintrag
                    {
                        Art = MensaVerzeichnisEintrag.Kategorie,
                        QuelleId = schluessel,
                        BezeichnungDe = string.IsNullOrEmpty(g.KategorieDe) ? schluessel : g.KategorieDe,
                        BezeichnungEn = string.IsNullOrEmpty(g.KategorieEn) ? schluessel : g.KategorieEn,
                    };
            }

            db.Speiseplaene.Add(new SpeiseplanTag
            {
                MensaId = mensa.Id,
                Datum = datum,
                GerichteJson = JsonSerializer.Serialize(cache, Json),
                AnzahlGerichte = cache.Count,
                AbgerufenAm = jetzt,
            });
        }
    }

    static async Task VerzeichnisseAktualisierenAsync(Fb4DbContext db, ItmcMensaClient client, CancellationToken ct)
    {
        var zusatz = ItmcMensaClient.VerzeichnisAbbilden(
            MensaVerzeichnisEintrag.Zusatzstoff, await client.AdditiveAsync(ct));
        var kennz = ItmcMensaClient.VerzeichnisAbbilden(
            MensaVerzeichnisEintrag.Kennzeichnung, await client.TypenAsync(ct));

        db.MensaVerzeichnis.RemoveRange(await db.MensaVerzeichnis
            .Where(e => e.Art == MensaVerzeichnisEintrag.Zusatzstoff || e.Art == MensaVerzeichnisEintrag.Kennzeichnung)
            .ToListAsync(ct));
        db.MensaVerzeichnis.AddRange(zusatz);
        db.MensaVerzeichnis.AddRange(kennz);
    }
}
