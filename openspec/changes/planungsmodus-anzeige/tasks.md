## 1. Planungsstand je Zeile

- [ ] 1.1 `zeilenStand` in `planungsstand.ts` (eingeplant / mehrfach / anderweitig / offen, mit Anzahl), Test `describe('Kennzeichnung des Planungsstands je Veranstaltungsreihe')`
- [ ] 1.2 `TerminZeile`: immer vorhandene Kennzeichnung aus Symbol und Text statt „Gewählt"/„Noch nicht eingeplant"/„Bereits zugewiesen"; Rahmen konstant 2 dp (Issue #123)

## 2. Gruppenkennungen und Namen

- [ ] 2.1 `TerminZeile`: `studentSet` als Plakette, eigene Kennung fett und umrandet, „Eigene Gruppe" entfällt; Test `describe('Anzeige der zugewiesenen Gruppenkennungen im Planungsmodus')`
- [ ] 2.2 `TerminZeile`: `termin.name` statt `modul.name`; Test `describe('Unveränderte Modulnamen im Planungsmodus')`

## 3. Einstellbare Hervorhebung

- [ ] 3.1 `ansichtEinstellungen.ts`: drei Felder mit Vorgaben und Bereinigung, Umschalter
- [ ] 3.2 Schalterzeile unter der Wochentagsleiste, Farbwirkung je Schalter; Test `describe('Einstellbare farbliche Hervorhebung im Planungsmodus')`

## 4. Rückweg, Beschriftung, Prüfungen

- [ ] 4.1 `router.dismissTo('/')` nach dem Sichern; Test `describe('Kein Rückweg in den Planungsmodus nach dem Sichern')`
- [ ] 4.2 Textkatalog: „Konflikt" statt „Angenommener Konflikt" (de/en), Schlüssel umbenannt; Test unter `describe('Bewusste Übernahme trotz Konflikt')`
- [ ] 4.3 `istPruefung` aus Typ, `planStore`-Validierung, Termineditor, Detailansicht, Wochenansicht und Testdaten entfernen; Textschlüssel `terminPruefungLabel`, `planungGewaehlt`, `planungEigeneGruppe` entfernen

## 5. Prüfung und Abschluss

- [ ] 5.1 `npx jest`, `npx tsc --noEmit`, `npm run lint`, `node tools/spec-check/src/cli.js` grün
- [ ] 5.2 Kontextabschnitt der Capability: Nutzergeschichte „eigene Prüfung" und Halbsatz „einschließlich eigener Prüfungstermine" streichen (beim Archivieren)
- [ ] 5.3 Geräteabnahme Android: Sichern ohne Absturz und ohne Zurück-Pfeil, Zeilen verrutschen beim Wählen nicht, Hervorhebungsschalter wirken — Prüfprotokoll unter `specs/pruefprotokolle/`
