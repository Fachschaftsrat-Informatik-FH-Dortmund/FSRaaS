using Fb4.Backend.Domain;
using Microsoft.EntityFrameworkCore;

namespace Fb4.Backend.Infrastructure;

/// <summary>
/// EF-Core-Context des Backends. Trägt ab Roadmap-Schritt 3 die Stammdaten ohne
/// externes Quellsystem (API-F-230), die Laufwege (ADMIN-F-090) und das
/// Verwaltungsprotokoll (ADMIN-F-110). Weitere Ressourcen (backend-and-api.md
/// Abschnitt 5) entstehen mit den jeweiligen Feature-Schnitten.
/// </summary>
public class Fb4DbContext(DbContextOptions<Fb4DbContext> options) : DbContext(options)
{
    public DbSet<MensaEintrag> Mensen => Set<MensaEintrag>();
    public DbSet<RaumEintrag> Raeume => Set<RaumEintrag>();
    public DbSet<LinkEintrag> Links => Set<LinkEintrag>();
    public DbSet<SemesterKalender> SemesterKalender => Set<SemesterKalender>();
    public DbSet<StudiengangRueckfall> StudiengangRueckfall => Set<StudiengangRueckfall>();
    public DbSet<LaufwegEintrag> Laufwege => Set<LaufwegEintrag>();
    public DbSet<SammlungsRevision> Revisionen => Set<SammlungsRevision>();
    public DbSet<Verwaltungsprotokoll> Verwaltungsprotokolle => Set<Verwaltungsprotokoll>();
    public DbSet<RaumplanTerminEintrag> RaumplanTermine => Set<RaumplanTerminEintrag>();
    public DbSet<RaumplanRaum> RaumplanRaeume => Set<RaumplanRaum>();
    public DbSet<RaumplanStand> RaumplanStand => Set<RaumplanStand>();


    protected override void OnModelCreating(ModelBuilder b)
    {
        base.OnModelCreating(b);

        b.Entity<MensaEintrag>().HasKey(x => x.Id);
        b.Entity<RaumEintrag>(e =>
        {
            e.HasKey(x => x.RoomId);
            e.Property(x => x.Groesse).HasConversion<string>();
        });
        b.Entity<LinkEintrag>().HasKey(x => x.Id);
        b.Entity<SemesterKalender>().HasKey(x => x.Id);
        b.Entity<StudiengangRueckfall>().HasKey(x => x.Kurzname);
        b.Entity<LaufwegEintrag>().HasKey(x => x.Id);
        b.Entity<SammlungsRevision>(e =>
        {
            e.HasKey(x => x.Bereich);
            // Optimistische Nebenläufigkeitskontrolle auf Datenbankebene (ADMIN-F-200):
            // Der If-Match-Vergleich im StammdatenStore prüft vor der Änderung, dieser
            // Token schließt das Zeitfenster bis zum SaveChanges. Bei echtem Rennen
            // wirft EF eine DbUpdateConcurrencyException → 412 (ApiExceptionHandler).
            e.Property(x => x.Version).IsConcurrencyToken();
        });
        b.Entity<Verwaltungsprotokoll>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => x.ZeitpunktUtc);
        });

        // Raumplan-Zwischenspeicher (INT-009): wird je Abruf vollständig ersetzt.
        b.Entity<RaumplanTerminEintrag>(e =>
        {
            e.ToTable("RaumplanTermine");
            e.HasKey(x => x.Id);
            e.HasIndex(x => new { x.RoomId, x.Beginn });
        });
        b.Entity<RaumplanRaum>(e =>
        {
            e.ToTable("RaumplanRaeume");
            e.HasKey(x => x.RoomId);
        });
        b.Entity<RaumplanStand>(e =>
        {
            e.ToTable("RaumplanStand");
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).ValueGeneratedNever();
        });
    }
}
