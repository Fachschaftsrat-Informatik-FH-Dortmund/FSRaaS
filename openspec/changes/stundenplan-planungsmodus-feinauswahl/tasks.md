# Aufgaben

## 1. Abhängigkeiten prüfen und aufnehmen

- [ ] 1.1 `@react-native-community/datetimepicker` und `@react-native-picker/picker` auf Lizenz und transitive Abhängigkeiten prüfen; Ergebnis als datiertes Prüfprotokoll ablegen, das die Vereinbarkeit mit den F-Droid-Auflagen der Capability `non-functional` belegt
- [ ] 1.2 Beide Pakete aufnehmen und `npx expo prebuild` erfolgreich durchlaufen lassen; der Android-Build entsteht weiterhin ohne Firebase

## 2. Planungsstand als Fachlogik

- [ ] 2.1 Modul `planungsstand.ts` nach `design.md` Entscheidung 2: reine Funktion von gewählten Modulen, Auswahlbestand und Plan auf den Stand je (Modul, Veranstaltungsart)
- [ ] 2.2 Test `describe('Vorbelegung eindeutiger Veranstaltungen', …)` für beide Szenarien — genau ein Slot vorbelegt, mehrere Slots nicht vorbelegt trotz passender Gruppenkennung
- [ ] 2.3 Test `describe('Kennzeichnung des Planungsstands je Veranstaltung', …)` für alle drei Szenarien, einschließlich des Zählers bei mehreren gewählten Slots
- [ ] 2.4 Kollisionsprüfung eines einzelnen Kandidaten gegen die festen Termine des Plans ergänzen; Test belegt, dass vorgemerkte Termine dabei keinen Konflikthinweis erzeugen (bestehendes Requirement „Kein Konflikthinweis bei vorgemerkten Terminen")
- [ ] 2.5 Test mit dem realen Bestand `INPBPI`/`grade=*` und Kennung `C8`: von dreizehn Kombinationen sind sieben vorbelegt, zwei stehen offen — der Fall aus `design.md`

## 3. Planungsmodus-Bildschirm

- [ ] 3.1 Route und Bildschirm mit Wochentags-Tabs und chronologischer Liste je Tag; Test `describe('Planungsmodus mit Wochentagsgliederung', …)` für beide Szenarien, darunter der erneute Aufruf bei bestehendem Plan
- [ ] 3.2 Hervorhebung der eigenen Gruppe mit zusätzlichem Text oder Symbol; Test `describe('Hervorhebung der eigenen Gruppe im Planungsmodus', …)` prüft beide Szenarien und ausdrücklich, dass kein Termin ausgeblendet wird
- [ ] 3.3 Kennzeichnungen je Zeile aus `planungsstand.ts` anbinden — kürzere Beschriftungen als in der Wochenansicht, da die Zeile bereits Zeit, Titel, Art, Gruppe und Raum trägt
- [ ] 3.4 Leiste am unteren Rand mit den Namen des Ausstehenden; Test `describe('Leiste der ausstehenden Veranstaltungen', …)` für beide Szenarien, einschließlich des Sprungs auf den betreffenden Wochentag
- [ ] 3.5 Rückweg zur Modulauswahl aus dem Planungsmodus heraus sicherstellen (Risiko aus `design.md`)

## 4. Statusvergabe

- [ ] 4.1 Status „fest"/„vorgemerkt" im Planungsmodus vergeben statt nach Auswahlreihenfolge; die bisherige Zuweisung in der Kursauswahl entfällt mit dem vorangehenden Change
- [ ] 4.2 Tests `describe('Status „fest" oder „vorgemerkt"', …)` für alle drei Szenarien
- [ ] 4.3 Test belegt, dass bereits gespeicherte Planeinträge ihren Status behalten und nicht nachträglich umgeschrieben werden
- [ ] 4.4 Test `describe('Mehrere Gruppen-Slots übernehmen', …)` für beide Szenarien, einschließlich der ausgewiesenen Anzahl

## 5. Bisher unumgesetzte Planungs-Requirements

- [ ] 5.1 `describe('Konfliktprüfung paralleler Termine', …)` umsetzen und prüfen
- [ ] 5.2 `describe('Hinweis bei fehlender konfliktfreier Option', …)` umsetzen — die Mitteilung ist ausdrücklich verlangt, ein Ausblenden ausgeschlossen
- [ ] 5.3 `describe('Bewusste Übernahme trotz Konflikt', …)` umsetzen, einschließlich der dauerhaften Kennzeichnung als angenommener Konflikt
- [ ] 5.4 `describe('Auswahl beim Anlegen des offiziellen Stundenplans', …)` auf das MODIFIED-Szenario umstellen
- [ ] 5.5 Prüfen, dass der stille Fehlschlag der bisherigen Kursauswahl nicht wiederkehrt: Eine Veranstaltungsart ohne passenden Slot muss sichtbar als offen erscheinen, nicht wortlos unverändert bleiben

## 6. Eigene Termine

- [ ] 6.1 Bedienweg „eigenen Termin anlegen" in den Planungsmodus verlegen; Test `describe('Zweckbestimmung eigener Termine', …)`
- [ ] 6.2 Zeit- und Datumsauswahl auf die systemeigenen Auswahlräder umstellen, Wochentag als Auswahlfeld; Tests `describe('Erfassung von Uhrzeit und Datum über systemeigene Auswahl', …)` für beide Szenarien
- [ ] 6.3 `parseUhrzeit` und `parseDatum` samt ihrer Tests nur so weit zurückbauen, wie sie nicht mehr gebraucht werden — das Lesen gespeicherter Bestände bleibt nötig
- [ ] 6.4 Die Wahl „wiederkehrend oder einmalig" bleibt unverändert; Test belegt, dass ein als Prüfung gekennzeichneter einmaliger Termin weiterhin anlegbar ist

## 7. Abschluss

- [ ] 7.1 Prüfprotokoll zur Bedienbarkeit des Planungsmodus anlegen (Datum, Gerät, Beobachtungen), einschließlich der Lesbarkeit der Kennzeichnungen bei aktivierter Systemschriftvergrößerung
- [ ] 7.2 `node tools/spec-check/src/cli.js` läuft ohne Befund
- [ ] 7.3 `openspec validate stundenplan-planungsmodus-feinauswahl --strict` läuft ohne Befund
- [ ] 7.4 Vollständige Testsuite der App grün
