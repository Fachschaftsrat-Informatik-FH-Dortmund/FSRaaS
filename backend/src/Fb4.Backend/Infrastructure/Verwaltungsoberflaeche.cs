using Microsoft.Extensions.FileProviders;

namespace Fb4.Backend.Infrastructure;

/// <summary>
/// Web-Export der Verwaltungsoberfläche (ADR 0018, Entscheidung 2026-09-02):
/// vom Backend mitausgeliefert unter <c>/admin</c>. Der Expo-Web-Export wird vom
/// Deploy-Workflow nach <c>wwwroot/admin</c> gelegt; fehlt er, bleibt der Pfad
/// unbelegt.
/// </summary>
public static class Verwaltungsoberflaeche
{
    /// <summary>Überschreibt den Export-Ordner (Tests); ohne Wert gilt <c>wwwroot/admin</c>.</summary>
    public const string PfadSchluessel = "Verwaltungsoberflaeche:Pfad";

    const string Praefix = "/admin";

    public static void MapVerwaltungsoberflaeche(this WebApplication app)
    {
        var root = app.Configuration[PfadSchluessel];
        if (string.IsNullOrWhiteSpace(root))
            root = Path.Combine(app.Environment.ContentRootPath, "wwwroot", "admin");
        if (!Directory.Exists(root)) return;

        var provider = new PhysicalFileProvider(root);
        app.UseDefaultFiles(new DefaultFilesOptions { FileProvider = provider, RequestPath = Praefix });
        app.UseStaticFiles(new StaticFileOptions { FileProvider = provider, RequestPath = Praefix });
        // SPA-Rückfall auf index.html nur für Seitenpfade ohne Dateiendung.
        // Ohne die nonfile-Einschränkung trifft der Rückfall auch die Skriptbündel:
        // Das Routing läuft in WebApplication vor UseStaticFiles, und die
        // Static-File-Middleware überspringt jede Anfrage, für die bereits ein
        // Endpunkt gewählt ist. Folge war index.html als text/html statt des
        // JavaScript-Bündels — der Browser verweigert die Ausführung, die Seite
        // bleibt weiß (Issue #73). Eine fehlende Datei ergibt so ein 404.
        app.MapFallback(Praefix + "/{*path:nonfile}", () => Results.File(
            Path.Combine(root, "index.html"), "text/html"));
    }
}
