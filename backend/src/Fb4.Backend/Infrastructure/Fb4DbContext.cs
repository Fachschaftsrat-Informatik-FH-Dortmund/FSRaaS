using Microsoft.EntityFrameworkCore;

namespace Fb4.Backend.Infrastructure;

/// <summary>
/// EF-Core-Context des Backends. Noch ohne Entitäten — die fachlichen Ressourcen
/// (backend-and-api.md Abschnitt 5) entstehen mit den jeweiligen Feature-Schnitten.
/// </summary>
public class Fb4DbContext(DbContextOptions<Fb4DbContext> options) : DbContext(options)
{
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
    }
}
