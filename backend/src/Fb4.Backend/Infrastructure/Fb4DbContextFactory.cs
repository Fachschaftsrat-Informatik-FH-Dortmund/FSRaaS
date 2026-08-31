using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace Fb4.Backend.Infrastructure;

/// <summary>
/// Nur für EF-Core-Werkzeuge (Migrationen) zur Entwurfszeit. Der Laufzeit-Context
/// wird in Program.cs über die Verbindungszeichenfolge konfiguriert.
/// </summary>
public class Fb4DbContextFactory : IDesignTimeDbContextFactory<Fb4DbContext>
{
    public Fb4DbContext CreateDbContext(string[] args)
    {
        var connectionString = Environment.GetEnvironmentVariable("FB4_CONNECTION")
            ?? "Host=localhost;Database=fb4;Username=fb4;Password=fb4";

        var options = new DbContextOptionsBuilder<Fb4DbContext>()
            .UseNpgsql(connectionString)
            .Options;

        return new Fb4DbContext(options);
    }
}
