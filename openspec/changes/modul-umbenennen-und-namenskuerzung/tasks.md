## 1. Logikschicht

- [x] 1.1 `app/src/areas/schedule/namenskuerzung.ts` mit `teileEndzahl(name)` anlegen (design.md, Entscheidung 3). Verifikation: `namenskuerzung.test.ts` mit `describe('Kürzung langer Veranstaltungsnamen unter Erhalt einer Endzahl', …)` deckt Name mit Endzahl, ohne Endzahl, Zahl in der Mitte, reinen Zahlnamen und Endzahl ohne Leerzeichen ab und läuft grün.
- [x] 1.2 `app/src/areas/schedule/modulnamen.ts` anlegen: reaktiver Speicher `scheduleModuleNames` mit `useModulnamen()` (`setzen`, `entfernen`), `modulSchluesselVon(entry)` und `kachelTitel(entry, namen)`; ungültige gespeicherte Einträge einzeln verwerfen (design.md, Entscheidungen 1, 2 und 4). Verifikation: `modulnamen.test.ts` mit `describe('Eigener Name je Modul', …)` belegt Setzen, Entfernen, Geltung für alle Veranstaltungsarten eines Moduls, Geltung für einen später hinzukommenden Termin, keine Geltung für eigene Termine und das einzelne Verwerfen defekter Einträge; läuft grün.

## 2. Wochenansicht

- [ ] 2.1 `TerminKachel` in `ScheduleScreen.tsx` zeigt `kachelTitel` statt `titelVon`, ungekürzt im `accessibilityLabel`; Jetzt-Anzeige und Übernahme-Blatt bleiben bei der offiziellen Bezeichnung (design.md, Entscheidung 4). Verifikation: `ScheduleScreen.test.tsx` mit `describe('Geltungsbereich des eigenen Namens', …)` findet den eigenen Namen in der Kachel und die offizielle Bezeichnung in der Jetzt-Anzeige; läuft grün.
- [ ] 2.2 Kachel stellt einen Namen mit Endzahl als Stamm (`flexShrink`, `numberOfLines={2}`, `ellipsizeMode="tail"`) und nicht schrumpfende Endzahl dar, sonst als einzelnen `Text` (design.md, Entscheidung 3). Verifikation: `ScheduleScreen.test.tsx` mit `describe('Kürzung langer Veranstaltungsnamen unter Erhalt einer Endzahl', …)` belegt die Aufteilung für offizielle Bezeichnung und eigenen Namen sowie den unveränderten Einzeltext ohne Endzahl; läuft grün.

## 3. Termindetail

- [ ] 3.1 Abschnitt „Eigener Name in der Wochenansicht" unter der Angabe „Bezeichnung" eines offiziellen Termins: Textfeld, „Übernehmen", „Eigenen Namen entfernen" mit Rückfrage über `ConfirmDialog`; Kopf und Angabe bleiben bei der offiziellen Bezeichnung; i18n de/en (design.md, Entscheidung 5). Verifikation: `TerminDetailScreen.test.tsx` mit `describe('Geltungsbereich des eigenen Namens', …)` und `describe('Eigener Name je Modul', …)` belegt Bedienweg, offizielle Bezeichnung trotz eigenem Namen, Entfernen erst nach Bestätigung, Abbruch lässt den Namen stehen, kein Abschnitt bei eigenen Terminen; i18n-Paritätstest grün.

## 4. Abschluss

- [ ] 4.1 Gesamtprüfung: `npx jest src/areas/schedule`, `npx tsc --noEmit` (nach `node tools/contract-codegen/src/generate.mjs`), `npm run lint`, `node tools/spec-check/src/cli.js` und der i18n-Paritätstest laufen grün.
- [ ] 4.2 Sichtprüfung am Gerät (Android): langer Name mit Endzahl in schmaler Zeitachsen-Spalte, eigener Name, Entfernen-Rückfrage, Vorleser auf der Kachel; Prüfprotokoll unter `specs/pruefprotokolle/` ablegen. Verifikation: datiertes Prüfprotokoll liegt vor.
- [ ] 4.3 Change archivieren (`openspec archive modul-umbenennen-und-namenskuerzung`), sobald 4.2 vorliegt. Verifikation: die drei Requirements stehen in `openspec/specs/schedule/spec.md`.
