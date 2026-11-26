## Why

`https://api.fb4.it/admin` zeigt nur eine weiße Seite (Issue #73). Belegt am
2026-11-26 im Browser: `index.html` kommt an, das darin referenzierte
Skriptbündel `/admin/_expo/static/js/web/entry-<hash>.js` aber ebenfalls als
`index.html` mit `Content-Type: text/html`. Der Browser verweigert die
Ausführung („MIME type ('text/html') is not executable"), die App startet nie.
Jede Datei unter `/admin/…` — auch `favicon.ico` — liefert dieselben 1187 Byte.

Ursache im Backend: Der SPA-Rückfall `MapFallback("/admin/{*path}")` trifft
jeden Pfad unter `/admin`, auch die Bündel. `WebApplication` setzt das Routing
an den Anfang der Pipeline, also vor `UseStaticFiles`; die
Static-File-Middleware überspringt jede Anfrage, für die schon ein Endpunkt
gewählt ist. Die Bündel liegen auf dem Server, werden aber nie ausgeliefert.
`experiments.baseUrl`, der Deploy-Workflow und der nginx-Proxy sind in Ordnung.

Die Auslieferung des Web-Exports stand bislang nur in ADR 0018 und im
Umsetzungsstand der Capability `admin`, nicht als Requirement. Deshalb fiel der
Fehler keinem Test auf.

## What Changes

- Neues Requirement „Auslieferung der Weboberfläche unter /admin" in der
  Capability `admin`: Dateien des Exports mit ihrem Inhaltstyp, Seitenpfade
  ohne Dateiendung auf `index.html`, fehlende Dateien als 404 statt als
  `index.html`.
- Backend: Rückfall nur noch für Pfade ohne Dateiendung
  (`{*path:nonfile}`); die Auslieferung zieht aus `Program.cs` nach
  `Infrastructure/Verwaltungsoberflaeche.cs`, der Export-Ordner ist für Tests
  über `Verwaltungsoberflaeche:Pfad` überschreibbar.

## Capabilities

### New Capabilities

Keine.

### Modified Capabilities

- `admin`: ein Requirement kommt hinzu.

## Impact

- `backend/src/Fb4.Backend/Program.cs`, `backend/src/Fb4.Backend/Infrastructure/Verwaltungsoberflaeche.cs`
- Test `backend/tests/Fb4.Backend.Tests/VerwaltungsoberflaecheAuslieferungTests.cs`
- Keine Änderung an App, Vertrag, Deploy-Workflow oder nginx. Wirksam erst mit
  dem nächsten Deploy.
