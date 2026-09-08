## 1. Modul-Gruppierung nach Fachsemester

- [ ] 1.1 `modulSchluessel` in `app/src/areas/schedule/kursbaum.ts` von `courseId || name` auf `(courseId || name) + '|' + normalisiertesFachsemester` umstellen (`'0'` und leer weiterhin als „kein auswertbares Fachsemester" auf einen leeren String vereinheitlicht); die bisherige `grades: Set<string>`-Sammlung samt Mehrdeutigkeits-Rückfall entfällt, da der Schlüssel das Fachsemester bereits eindeutig macht
- [ ] 1.2 Bestehende Tests in `kursbaum.test.ts` an das neue `key`-Format anpassen (u. a. Zeile 86 `'Lern- und Arbeitstechniken'`) und `describe('Gliederung der Modulauswahl nach Fachsemester', …)` um die Szenarien „Modulnummer mit Wiederholerangebot in anderem Fachsemester" und „Keine zusätzliche Fachsemester-Filterung" ergänzen; Szenario „Wiederholerangebot" bildet den Live-Befund `courseId 42012` nach (Fachsemester 2 „Algorithmen und Datenstrukturen", Fachsemester 4 „Wdh. Algorithmen und Datenstrukturen") und erwartet zwei getrennte Module in den passenden Fachsemester-Abschnitten
- [ ] 1.3 Bestehende Erwartungen an `module[].key` in `kurssuche.test.ts` und `CourseSelectionScreen.test.tsx` an das neue Schlüsselformat anpassen, ohne die Testaussage selbst zu ändern

## 2. Anzeigename paralleler Termingruppen

- [ ] 2.1 Namensableitung in `kursbaum.baueModulliste` ergänzen: Nach dem Gruppieren prüfen, ob die gesammelten Termine eines Moduls mehrere unterschiedliche Namen tragen, die sich nur durch eine angehängte Zahl (Muster etwa `/^(.*?)\s*\d+$/`) unterscheiden und im Namensstamm übereinstimmen; trifft das zu, wird der Namensstamm ohne Zahl als `Modul.name` verwendet, sonst bleibt der zuerst beobachtete Name unverändert
- [ ] 2.2 Test `describe('Anzeigename paralleler Termingruppen ohne bedeutungslose Endzahl', …)` in `kursbaum.test.ts` für beide Szenarien: „Technisches Englisch 1"–„12" (courseId `41102`, gleiches Fachsemester) ergeben den Namen „Technisches Englisch"; „Softwaretechnik 2" mehrfach mit derselben Zahl bleibt „Softwaretechnik 2"
- [ ] 2.3 Test belegt, dass die Regel nicht greift, wenn sich die Namen über die angehängte Zahl hinaus unterscheiden (kein gemeinsamer Namensstamm)

## 3. Fachsemester-Filter entfernen

- [ ] 3.1 `ModulFilter.grade` und die zugehörige Filterlogik aus `app/src/areas/schedule/kurssuche.ts` entfernen; `describe('Filter nach Fachsemester', …)` aus `kurssuche.test.ts` entfernen, `describe('Freitextsuche im Auswahlbestand', …)` bleibt unverändert bestehen
- [ ] 3.2 `SegmentedControl` und den „Filter zurücksetzen"-Button aus `CourseSelectionScreen.tsx` entfernen (`gradeFilter`-State, `fachsemesterOptionen`, `ALLE_FACHSEMESTER`, `filterAktiv`); vorhandene Tests in `CourseSelectionScreen.test.tsx` laufen weiterhin grün, ergänzt um eine Prüfung, dass kein Fachsemester-Filterelement mehr gerendert wird
- [ ] 3.3 Verwaiste i18n-Schlüssel `kurseFachsemesterLabel`, `kurseFilterAlle`, `kurseFilterZuruecksetzen` aus `app/src/i18n/de.json` und `app/src/i18n/en.json` entfernen; `node tools/spec-check/src/cli.js` prüft auf verwaiste Schlüssel mit

## 4. Abschluss

- [ ] 4.1 `openspec validate kursauswahl-fachsemester-und-filter-korrektur --strict` läuft ohne Befund
- [ ] 4.2 `node tools/spec-check/src/cli.js` läuft ohne Befund
- [ ] 4.3 Vollständige Testsuite von `app/` grün (`kursbaum.test.ts`, `kurssuche.test.ts`, `CourseSelectionScreen.test.tsx` sowie die übrige Suite ohne Regression)
