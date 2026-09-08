# Aufgaben

## 1. Vertrag und Fremdsystem

- [ ] 1.1 `fbwsClient.holeStudiengaenge` um das Feld `po` erweitern, `null` und die Zeichenkette `"NULL"` gleich behandeln; Test `describe('INT-001 — FBWS Studiengänge', …)` prüft beide Gestalten und dass ein Eintrag ohne `grades` weiterhin verworfen wird
- [ ] 1.2 Vertragstest gegen den echten INT-001-Bestand: schlägt sichtbar fehl, wenn `po` verschwindet oder ein Pflichtfeld die Gestalt wechselt (Capability `quality-and-testing`)
- [ ] 1.3 `holeTermine` für den Abruf mit `grade=*` je Endpunkt anpassen; Test belegt anhand eines Bachelor-Endpunkts, dass Termine mehrerer Fachsemester zurückkommen und jeder sein eigenes `grade` trägt
- [ ] 1.4 `normalize.ts` auf die `courseType`-Werte `PR` und `S` prüfen — keine abgeschlossene Werteliste voraussetzen; Test mit je einem Termin beider Arten

## 2. Endpunktgruppierung als Fachlogik

- [ ] 2.1 Modul `endpunkte.ts` mit den Ableitungsregeln aus `design.md` Entscheidung 1; reine Funktionen ohne React
- [ ] 2.2 Test `describe('Gruppierung der Endpunkte in der Auswahl', …)` prüft die Zuordnung aller 21 verwertbaren Endpunkte des Bestands vom 2026-09-08, einschließlich `FemINF` mit `po: "NULL"` und der Trennung dualer Studiengänge
- [ ] 2.3 Test `describe('Auffangkorb für nicht zuzuordnende Endpunkte', …)`: ein erfundener Endpunkt ohne passendes Merkmal erscheint im Auffangkorb, nicht im Nichts
- [ ] 2.4 Prüfungsordnung aus `name` ableiten, wenn `po` fehlt; Test mit einem Datensatz in der Gestalt der Rückfallliste des eigenen Backends (ohne `po`)

## 3. Einrichtungsstand und Migration

- [ ] 3.1 `Einrichtung` von `sname`/`grade`/`zusatzFachsemester` auf `endpunkte: string[]` umstellen
- [ ] 3.2 Migration in `bereinige()` nach `design.md` Entscheidung 4; Test lädt einen gespeicherten Stand alter Gestalt und belegt, dass Endpunkt und Gruppenkennung erhalten bleiben
- [ ] 3.3 `useTermine`/`useQueries` auf einen Abruf je gewähltem Endpunkt umstellen; Test `describe('Terminabruf nach Auswahl', …)` prüft die Zahl der Abrufe bei drei gewählten Endpunkten und die Vereinigung der Ergebnisse
- [ ] 3.4 `semesterwechsel.ts` auf den Vergleich von Endpunktmengen umstellen; Tests `describe('Hinweis bei Semesterwechsel', …)` für beide Szenarien — neu erschienener Endpunkt und entfallener gewählter Endpunkt — samt Nachweis, dass keine Auswahl selbsttätig geändert wird

## 4. Einrichtungs-Bildschirm

- [ ] 4.1 Gruppenkennung als einzelnes Textfeld mit Großschreibung und ohne Autokorrektur; Tests `describe('Gruppenkennung ohne Matrikelnummer', …)` für die drei Szenarien, darunter die Eingabe `c8`
- [ ] 4.2 Matrikelnummer-Weg und manuelles Feld untereinander statt hinter einem Umschalter; der Test zum Szenario „Voreingestellter Weg" prüft die Reihenfolge im Baum, nicht mehr einen aktiven Tab
- [ ] 4.3 Endpunktliste mit Gruppenüberschriften und Mehrfachauswahl; Tests `describe('Auswahl der Endpunkte des Lehrangebots', …)` für alle drei Szenarien, darunter der Nachweis, dass die Abwahl eines Endpunkts keine Planeinträge entfernt
- [ ] 4.4 Freitextsuche über Klar- und Kurzname; Test `describe('Freitextsuche in der Endpunktauswahl', …)`
- [ ] 4.5 Fachsemester-Abschnitt und Zusatz-Fachsemester-Schalter aus dem Bildschirm entfernen; bestehende Tests dazu entfallen mit dem REMOVED-Delta

## 5. Zugang zur Einrichtung

- [ ] 5.1 Kopfzeilen-Element im Stundenplan-Stack, das die Einrichtung jederzeit öffnet; Test `describe('Dauerhafter Zugang zur Einrichtung', …)` bei gefülltem Plan
- [ ] 5.2 Prüfen, dass Leerzustände und Semesterwechsel-Hinweis weiterhin dorthin führen — kein Bedienweg geht verloren

## 6. Modulauswahl

- [ ] 6.1 `AnkerListe` von `areas/canteen/ui/` nach `ui/` verschieben, Mensa-Ansichten auf den neuen Pfad ziehen; die bestehenden Mensa-Tests müssen unverändert grün bleiben
- [ ] 6.2 `kursbaum.ts` auf Module statt auf den dreistufigen Baum umstellen, Abschnitte nach Fachsemester bzw. Endpunktname; Tests `describe('Gliederung der Modulauswahl nach Fachsemester', …)` für beide Szenarien
- [ ] 6.3 `CourseSelectionScreen` auf die reine Ankreuzliste reduzieren — Veranstaltungsart-Schalter, Slot-Zeilen und der Übernehmen-Pfad in den Plan entfallen; Test `describe('Modulauswahl ohne Veranstaltungsart und Gruppen-Slot', …)`
- [ ] 6.4 Freitextsuche und Fachsemester-Filter der bisherigen Kursauswahl auf die Modulebene ziehen; die bestehenden Tests zu `describe('Freitextsuche im Auswahlbestand', …)` entsprechend nachziehen
- [ ] 6.5 Test `describe('Gliederung des Auswahlbestands', …)` auf die zwei Szenarien des MODIFIED-Deltas umstellen

## 7. Abschluss

- [ ] 7.1 Prüfprotokoll zur Bedienbarkeit der Endpunktliste anlegen (Datum, Gerät, Beobachtungen) — Gestaltung und Barrierefreiheit sind nach Capability `quality-and-testing` protokollpflichtig statt testpflichtig
- [ ] 7.2 `node tools/spec-check/src/cli.js` läuft ohne Befund
- [ ] 7.3 `openspec validate stundenplan-einrichtung-endpunkte --strict` läuft ohne Befund
- [ ] 7.4 Vollständige Testsuite der App grün
