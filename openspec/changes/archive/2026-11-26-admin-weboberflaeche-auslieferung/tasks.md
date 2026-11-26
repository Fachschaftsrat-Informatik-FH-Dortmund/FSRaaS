## 1. Backend

- [x] 1.1 Auslieferung aus `Program.cs` nach `Infrastructure/Verwaltungsoberflaeche.cs` ziehen, Export-Ordner über `Verwaltungsoberflaeche:Pfad` überschreibbar. Verifikation: Backend-Build übersetzt, Verhalten zunächst unverändert.
- [x] 1.2 Test `Auslieferung der Weboberfläche unter /admin` mit den vier Scenarios. Verifikation: vor der Behebung schlagen „Skriptbündel" (`text/html` statt `text/javascript`) und „Fehlende Datei" (`200` statt `404`) fehl — dasselbe Bild wie live.
- [x] 1.3 Rückfall auf `{*path:nonfile}` beschränken. Verifikation: alle vier Tests grün, die gesamte Backend-Testsuite grün.

## 2. Abschluss

- [x] 2.1 Umsetzungsstand der Capability `admin` nachtragen und Change archivieren.
