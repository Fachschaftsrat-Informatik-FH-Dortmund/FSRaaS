---
status: draft
version: 0.1.0
owner: FSR FB4
last_reviewed: 2026-09-07
---

# Prüfprotokoll — Sortier-/Gruppierblock der Mensa-Ansicht

Datum: 2026-09-07
Prüfer: Umsetzung (technische Leitung)
Grundlage: `openspec/specs/canteen/spec.md` (Requirements „Wahl der Gruppierung" bis
„Feste Endposition von Beilagen- und Sammelgruppe", Abschnitte „Frei wählbare Sortierung
und Gruppierung" / „Presets für Sortierung und Gruppierung"),
`openspec/changes/canteen-sortieren-gruppieren/` (proposal, design, tasks),
`openspec/specs/quality-and-testing/spec.md` Abschnitt 3,
`openspec/specs/ux-and-theming/spec.md` (UX-F-070/UX-N-010/UX-N-020),
`openspec/specs/non-functional/spec.md` (NFR-F-115).

Dieses Protokoll deckt die Punkte ab, für die nach `quality-and-testing` Abschnitt 3 ein
datiertes Prüfprotokoll statt eines automatisierten Tests zulässig ist (Gestaltung,
Barrierefreiheit, Geräteverhalten). Die Fachlogik (Sortier-/Gruppiermodell, Presets,
Speicher, Integration in die Hauptansicht) ist über Tests abgesichert, die den
Requirement-Titel im `describe`-Namen tragen (siehe Abschnitt 4).

## 1. Sortier-/Gruppierauswahl auf dem Gerät

| Prüfpunkt | Methode | Ergebnis |
|---|---|---|
| Eigener Zugang im Kopfbereich neben dem Filter-Trichter, eigenes Symbol, klar abgrenzbar (Requirement „Zugang zur Sortier-/Gruppierauswahl") | Screen-Test `ui/SortierZugang.test.tsx` + Codeprüfung (`Ionicons` `swap-vertical` vs. `funnel`) | **bestanden** (Logik); Geräteprüfung **ausstehend Gerät** |
| Presets obenan als Liste zum direkten Anwählen, aktives hervorgehoben (Requirements „Vordefinierte Presets", „Voreingestelltes Preset") | Screen-Test `screens/SortierGruppierScreen.test.tsx` | **bestanden** (Logik); Geräteprüfung **ausstehend Gerät** |
| Kriterium und Richtung als zwei getrennte Auswahlfelder (Requirement „Wahl der Gerichte-Sortierung") | Screen-Test `screens/SortierGruppierScreen.test.tsx` | **bestanden** |
| Gruppenreihenfolge nur bei aktiver Gruppierung sichtbar (Requirement „Wahl der Gruppenreihenfolge") | Codeprüfung (`kombi.gruppierung !== 'keine'`) + manuelle Prüfung | **bestanden** (Logik); Geräteprüfung **ausstehend Gerät** |
| Eigenes Preset trägt Umbenennen/Löschen, vordefiniertes nicht (Requirement „Umbenennen und Löschen eigener Presets") | Screen-Test `screens/SortierGruppierScreen.test.tsx` | **bestanden** |
| Löschen fragt vor dem Verwerfen zurück (kein Datenverlust ohne Rückfrage, DATA-F-020) | Codeprüfung (`Alert.alert` mit Abbrechen/Löschen) | **bestanden** (Code); Geräteprüfung **ausstehend Gerät** |

## 2. Integration in die Hauptansicht

| Prüfpunkt | Methode | Ergebnis |
|---|---|---|
| Abschnitte und Gerichte-Reihenfolge folgen dem aktiven Preset (Requirement „Wahl der Gruppierung") | Screen-Test `screens/CanteenScreen.test.tsx`, Einheitentest `sortierung.test.ts` | **bestanden** (Logik); Geräteprüfung **ausstehend Gerät** |
| Preset „Preis": keine Chip-Leiste, keine Abschnittsüberschriften, Gerichte aufsteigend nach eigenem Preis (Akzeptanzkriterium `canteen/spec.md`) | Screen-Test `screens/CanteenScreen.test.tsx` | **bestanden** |
| Chip-Leiste zeigt die Gruppen der aktiven Gruppierung (Mensen bzw. Kategorien), ohne Gruppierung ausgeblendet (Requirement „Chip-Leiste zeigt Gruppen der aktiven Gruppierung") | Screen-Test `screens/CanteenScreen.test.tsx` | **bestanden** (Logik); Rollverhalten/Kontrast **ausstehend Gerät** |
| Gruppe ohne sichtbaren Abschnitt (geschlossen oder weggefiltert) als nicht auswählbarer Chip (Requirement „Nicht auswählbare Chips ohne sichtbaren Abschnitt") | Screen-Test `screens/CanteenScreen.test.tsx` (`accessibilityState.disabled`) | **bestanden** (Logik); Geräteprüfung **ausstehend Gerät** |
| Der angezeigte Preis eines an mehreren Mensen angebotenen Gerichts ändert sich nicht mit der Gruppenreihenfolge (Akzeptanzkriterium `canteen/spec.md`) | Einheitentest `sortierung.test.ts` | **bestanden** |
| „Alle Mensen"-Ansicht unverändert, ohne Preset-Bezug | Statische Prüfung + Screen-Test `screens/CanteenAllScreen.test.tsx` | **bestanden** |
| Filter wirkt nach der Sortierung; Zähler ausgeblendeter Gerichte unverändert (Design D6) | Screen-Test `screens/CanteenScreen.test.tsx` (bestehende Filter-Fälle grün) | **bestanden** |

## 3. Gerätelokaler Speicher

| Prüfpunkt | Methode | Ergebnis |
|---|---|---|
| Eigene Presets, zuletzt aktives Preset gerätelokal persistiert (`canteenSortPresets`, `canteenSortActive`) | Einheitentest `sortierPreset.test.ts` | **bestanden** |
| Beschädigter Eintrag beim Laden verwirft nur diesen, nicht die ganze Liste; unbekannte aktive ID → Voreinstellung (Design „Preset-Speicher-Schema") | Einheitentest `sortierPreset.test.ts` | **bestanden** |
| Kein Konto, keine Übertragung, kein Backend-Aufruf | Codeprüfung (`sortierPreset.ts` spricht nur `@/storage/kv`) | **bestanden** |
| Zuletzt gewähltes Preset nach simuliertem Neustart weiterhin aktiv (Requirement „Merken des zuletzt gewählten Presets") | Einheitentest `sortierPreset.test.ts` | **bestanden** |

## 4. Rückverfolgbarkeit (QA-F-010) und Vollprüfung

| Prüfpunkt | Methode | Ergebnis |
|---|---|---|
| Jeder der 15 Requirement-Titel des Blocks kommt in mindestens einem `describe`-Namen vor | `grep` je Titel gegen `app/src/areas/canteen/**/*.test.ts*` (Task 8.4) | **bestanden** |
| App-Testsuite grün, `tsc` sauber, `eslint` sauber | `node node_modules/jest/bin/jest.js`, `tsc --noEmit`, `eslint .` | **bestanden** |
| Spec-Prüfung `tools/spec-check` 4/4, contract-codegen `--check` grün, `npx expo export --platform android` baut | Task 8.5 | **bestanden** |
| `openspec validate canteen-sortieren-gruppieren --strict` grün | Task 8.6 | **bestanden** |

## 5. Barrierefreiheit / Gestaltung (UX)

| Prüfpunkt | Methode | Ergebnis |
|---|---|---|
| Aktives Preset / aktive Option zusätzlich zur Farbe durch `selected` und ein Zeichen erkennbar (UX-F-070) | Codeprüfung (`RadioList`/`SegmentedControl` mit Häkchen/Punkt, eigene Presetliste mit `●/○`) | **bestanden** (Code); Geräteprüfung **ausstehend Gerät** |
| Bedienelemente ≥ 44×44 dp (Zugang, Preset-Zeilen, Mini-Knöpfe, Auswahlfelder, Eingabefeld) (UX-N-020) | Codeprüfung (`minWidth/minHeight: 44`, `minHeight: 48`) | **bestanden** (Code); Geräteprüfung **ausstehend Gerät** |
| Mindestkontrast 4,5:1 für Text, aktive Flächen und Platzhalter (UX-N-010) | manuelle Prüfung | **ausstehend Gerät** |
| Keine Zeichenkette fest im Code — alle Bezeichnungen aus `de.json`/`en.json`, Paritätstest grün (NFR-F-115) | `src/i18n/parity.test.ts` + `grep` im Review | **bestanden** |
| Vier Zustände der Auswahl-Ansicht (Laden/Leer/Fehler/Offline) — hier nur „Laden" relevant (rein lokale Daten, kein Abruf) | Codeprüfung (`loaded`-Gate über `MessageView busy`) | **bestanden** |

## 6. Offene Geräteschritte

Alle mit **ausstehend Gerät** markierten Zeilen werden beim nächsten Gerätetest-Durchlauf
gemeinsam mit den offenen Punkten aus `2026-09-04-schritt-4-mensa-teil-a.md` abgearbeitet.
Kein Punkt blockiert die fachliche Abnahme des Blocks; die Fachlogik ist vollständig
testgedeckt.
