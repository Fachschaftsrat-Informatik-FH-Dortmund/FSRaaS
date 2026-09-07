## 1. Reine Logik — Quellrang in der Zusammenfassung

- [x] 1.1 `consolidate.ts`: `KonsolidiertesGericht` um einen stabilen `quellrang`
  (Reihenfolge des ersten Auftretens über die gewählten Mensen in
  Auswahlreihenfolge) erweitern; `konsolidiere` vergibt ihn beim Aufbau.
  Prüfen: `consolidate.test.ts` — neuer Fall belegt, dass ein nur an der zweiten
  Mensa geführtes Gericht einen höheren `quellrang` trägt als eines der ersten
  Mensa, und dass die Zusammenfassung (ein Eintrag je Gericht) und die
  maßgebliche Mensa unverändert bleiben.

## 2. Reine Logik — Sortier-/Gruppiermodell

- [x] 2.1 Neues Modul `sortierung.ts`: Typen `Gruppierung`
  (`'keine' | 'mensa' | 'kategorie'`), `Sortierkriterium`
  (`'quelle' | 'bezeichnung' | 'preis' | 'eigeneBewertung' | 'community'`),
  `Richtung` (`'auf' | 'ab'`), `Kombination`
  (`{ gruppierung, gruppenreihenfolge?: { kriterium, richtung }, gerichteSortierung: { kriterium, richtung } }`).
  Prüfen: `sortierung.test.ts` — `describe('Wahl der Gruppierung', …)` und
  `describe('Wahl der Gerichte-Sortierung', …)` zeigen, dass jede Kombination aus
  Kriterium und getrennter Richtung darstellbar und anwendbar ist, auch
  „Reihenfolge der Quelle, absteigend".
- [x] 2.2 `sortierung.ts`: `wendeAn(kombination, konsolidierung, kontext)` →
  `{ abschnitte: { id, titel: string | null, gerichte }[], gruppierungAktiv }`.
  Gruppierung „keine" = ein Abschnitt, Gerichte flach sortiert;
  „nach Mensa" = ein Abschnitt je Mensa mit Angebot, Gerichte je Abschnitt flach
  sortiert; „nach Kategorie" = ein Abschnitt je Kategorie über alle Mensen.
  Die maßgebliche Mensa bleibt an die Mensa-Auswahlreihenfolge gebunden.
  Prüfen: `sortierung.test.ts` — Fall belegt, dass eine geänderte
  Gruppenreihenfolge einer Mensa-Gruppierung den bei einem an mehreren Mensen
  angebotenen Gericht angezeigten Preis nicht ändert (Akzeptanzkriterium
  `canteen/spec.md`).
- [x] 2.3 `sortierung.ts`: Sortierkriterien umsetzen — Quellreihenfolge (aus
  `quellrang`), Bezeichnung (lokalisiert, `Intl.Collator`), Preis der gewählten
  Preisgruppe (`preisFuer`), eigene Bewertungsstufe und
  Community-Gesamtbewertung über den Resolver aus `kontext.bewertung`.
  Prüfen: `describe('Sortierkriterien für Gerichte', …)` — alle fünf Kriterien
  sind anwählbar; Preis- und Bezeichnungssortierung ordnen erwartungsgemäß.
- [x] 2.4 `sortierung.ts`: Regel für unbewertete Gerichte — trägt ein Gericht
  beim gewählten Bewertungskriterium keine Bewertung, wird es unabhängig von der
  Richtung ans Ende einsortiert; mehrere unbewertete untereinander in
  Quellreihenfolge. Ohne jede Bewertung entspricht die Reihenfolge innerhalb
  jeder Gruppe der Quellreihenfolge.
  Prüfen: `describe('Einordnung unbewerteter Gerichte ans Ende', …)` — mit
  `kontext.bewertung` immer `undefined` verhält sich ein Bewertungs-Preset wie
  Quellreihenfolge, kein Gericht fällt aus der Liste, keine Fehleranzeige.
- [x] 2.5 `sortierung.ts`: Gruppenreihenfolge — bei Gruppierung „nach Mensa"
  Kriterien Mensa-Auswahlreihenfolge und alphabetisch (Mensa-Name), je Richtung;
  bei „nach Kategorie" Kriterien Quellreihenfolge der Ausgabestellen und
  alphabetisch (Kategoriename), je Richtung.
  Prüfen: `describe('Wahl der Gruppenreihenfolge', …)`,
  `describe('Gruppenreihenfolge-Kriterien bei Mensa-Gruppierung', …)` und
  `describe('Gruppenreihenfolge-Kriterien bei Kategorie-Gruppierung', …)` mit je
  einem Reihenfolge-Fall auf- und absteigend.
- [x] 2.6 `sortierung.ts`: bei Gruppierung „nach Kategorie" stehen die
  kategorielose Sammelgruppe und danach die Beilagen-Gruppe unabhängig vom
  Gruppenreihenfolge-Kriterium am Ende (`kategorieRang` aus `consolidate.ts`
  hierher übernehmen). Bei „keine"/„nach Mensa" gibt es keine
  Kategorie-Unterstruktur — Beilagen wie jedes Gericht einsortiert.
  Prüfen: `describe('Feste Endposition von Beilagen- und Sammelgruppe', …)` —
  Kategorie-Gruppierung „alphabetisch, absteigend" lässt Sammelgruppe und
  Beilagen dennoch zuletzt; ein Fall belegt, dass Preset „Preis" (Gruppierung
  „keine") die Liste flach ohne Kategorieüberschriften sortiert.

## 3. Reine Logik — Presets

- [x] 3.1 `sortierung.ts`: die vier vordefinierten Presets als unveränderliche
  Konstanten mit stabilen IDs (`mensa-eigene-bewertung`, `mensa-community`,
  `mensa-guenstigstes`, `preis`) gemäß Preset-Tabelle in `canteen/spec.md`.
  Prüfen: `describe('Vordefinierte Presets', …)` — genau diese vier Presets mit
  den in der Tabelle genannten Kombinationen sind abrufbar.
- [x] 3.2 `sortierung.ts`: `voreinstellung` = `mensa-guenstigstes`.
  Prüfen: `describe('Voreingestelltes Preset', …)` — ohne vorherige Wahl liefert
  die Auflösung das Preset „Mensa, günstigstes zuerst".

## 4. Gerätelokaler Speicher

- [x] 4.1 Neues Modul `sortierPreset.ts` nach Muster `selection.ts`
  (`useSyncExternalStore`, `readJson`/`writeJson`, `__resetSortierPresetForTest`):
  Schlüssel `canteenSortPresets` (Liste eigener Presets `{ id, name, kombination }`)
  und `canteenSortActive` (ID des zuletzt aktiven Presets). Defensive
  `bereinige`-Funktion beim Laden — Preset mit unbekanntem Kriterium/Richtung
  verwerfen, nicht die ganze Liste; unbekannte/fehlende aktive ID →
  `mensa-guenstigstes`.
  Prüfen: `sortierPreset.test.ts` — Laden mit beschädigtem Eintrag verwirft nur
  diesen; fehlende aktive ID fällt auf die Voreinstellung zurück.
- [x] 4.2 `sortierPreset.ts`: Hook `useSortierGruppierung()` →
  `{ aktiv, presets, loaded, waehle, speichereEigenes, benenneUm, loesche }`.
  Prüfen: `describe('Speichern eines eigenen Presets', …)` — die aktuelle
  Kombination wird unter einem Namen als wählbares Preset angelegt und bleibt
  nach `__reset…`/Neu-Laden erhalten.
- [x] 4.3 `sortierPreset.ts`: `benenneUm`/`loesche` wirken nur auf eigene
  Presets; vordefinierte sind unveränderlich.
  Prüfen: `describe('Umbenennen und Löschen eigener Presets', …)` — eigenes
  Preset lässt sich umbenennen und löschen; für eine vordefinierte ID sind beide
  Handlungen wirkungslos (bzw. werfen einen erkennbaren Fehler).
- [x] 4.4 `sortierPreset.ts`: `waehle(id)` schreibt `canteenSortActive`; die
  Auflösung stellt das Preset bei jedem Laden wieder her.
  Prüfen: `describe('Merken des zuletzt gewählten Presets', …)` — nach einer
  Wahl und simuliertem Neustart (`__reset…` + Neu-Laden) ist dasselbe Preset
  aktiv.

## 5. Oberfläche — Sortier-/Gruppierauswahl

- [x] 5.1 `ui/SortierZugang.tsx` (Muster `FilterZugang.tsx`): eigener Zugang als
  zweites `headerRight`-Element neben dem Filter-Trichter in
  `app/app/(tabs)/canteen/_layout.tsx`, eigenes Symbol (Ionicons, z. B.
  `swap-vertical`/`funnel` abgrenzbar), `accessibilityLabel` aus i18n.
  Prüfen: `SortierZugang.test.tsx` — `describe('Zugang zur Sortier-/Gruppierauswahl', …)`
  belegt Rendern neben dem Filterzugang und Navigation auf `/canteen/sortierung`.
- [x] 5.2 Route `app/app/(tabs)/canteen/sortierung.tsx` als reiner Re-Export von
  `screens/SortierGruppierScreen` (SHELL-F-050); Stack-Eintrag im `_layout.tsx`
  mit Titel aus i18n.
  Prüfen: `npx expo export --platform android` baut; Route erscheint im Stack.
- [x] 5.3 `screens/SortierGruppierScreen.tsx`: Presets obenan als Liste zum
  direkten Anwählen (aktives hervorgehoben, vordefinierte + eigene), darunter der
  Zusammenstellungsbereich (Gruppierung; bei aktiver Gruppierung
  Gruppenreihenfolge; Gerichte-Sortierung — Kriterium und Richtung als zwei
  getrennte Auswahlfelder) mit „als eigenes Preset speichern"; eigene Presets
  tragen Umbenennen/Löschen, vordefinierte nicht. Alle Hooks vor bedingten
  Returns, keine Member-Ausdrücke in Dependency-Arrays.
  Prüfen: `SortierGruppierScreen.test.tsx` —
  `describe('Wahl der Gerichte-Sortierung', …)` belegt zwei getrennte
  Auswahlfelder für Kriterium und Richtung;
  `describe('Umbenennen und Löschen eigener Presets', …)` belegt, dass ein
  vordefiniertes Preset keine dieser Handlungen anbietet.

## 6. Integration in die Hauptansicht

- [x] 6.1 `CanteenScreen.tsx` / `GerichtListe`: Abschnitte aus
  `wendeAn(useSortierGruppierung().aktiv, konsolidierung, kontext)` statt fest aus
  `konsolidiere`; `kontext.bewertung` vorerst `() => undefined` (Resolver-Seam,
  D4). Filter (`useGerichtFilter`) und Zähler unverändert nach der Sortierung
  anwenden.
  Prüfen: `CanteenScreen.test.tsx` — bestehende Fälle grün; neuer Fall belegt
  Preset „Preis": keine Chip-Leiste, keine Abschnittsüberschriften, Gerichte
  aufsteigend nach Preis der eigenen Preisgruppe.
- [x] 6.2 `ui/AnkerListe.tsx` / `CanteenScreen`: Chip-Leiste zeigt die Gruppen
  der aktiven Gruppierung (Mensen bzw. Kategorien) und ist bei
  `gruppierungAktiv === false` ausgeblendet. `CanteenAllScreen` übergibt
  weiterhin Mensa-Abschnitte direkt und bleibt unverändert.
  Prüfen: `AnkerListe.test.tsx` / `CanteenScreen.test.tsx` —
  `describe('Chip-Leiste zeigt Gruppen der aktiven Gruppierung', …)` belegt
  Kategorie-Chips bei Kategorie-Gruppierung und ausgeblendete Leiste ohne
  Gruppierung; ein Fall belegt, dass `CanteenAllScreen` ohne Preset-Bezug
  arbeitet.
- [x] 6.3 Ununterscheidbarkeit der beiden Bewertungs-Presets bis Schritt 9
  festhalten.
  Prüfen: `sortierung.test.ts` oder `CanteenScreen.test.tsx` — „Mensa, eigene
  Bewertung" und „Mensa, Community-Bewertung" verhalten sich ohne
  Bewertungsdaten wie Quellreihenfolge; kein Gericht fällt aus der Liste, keine
  Fehleranzeige.

## 7. Zeichenketten

- [x] 7.1 `app/src/i18n/de.json` + `en.json`: `mensa.sortierZugang`,
  `mensa.sortierTitel`, `mensa.preset.*` (vier vordefinierte Namen),
  `mensa.gruppierung.*`, `mensa.sortierkriterium.*`, `mensa.richtung.*`,
  `mensa.presetSpeichern` / `mensa.presetUmbenennen` / `mensa.presetLoeschen`.
  Prüfen: `npm test` — der i18n-Paritätstest (de/en) bleibt grün; keine
  Zeichenkette fest im Code (`grep` im Review).

## 8. Spec-Prosa, Prüfprotokoll, Abschluss

- [x] 8.1 `openspec/specs/canteen/spec.md` Abschnitt „Umsetzungsstand":
  Sortier-/Gruppierblock von spec-only auf umgesetzt, `implemented_in` um
  `sortierung.ts` / `sortierPreset.ts` / `ui/SortierZugang.tsx` /
  `screens/SortierGruppierScreen.tsx` ergänzen, den „spec-only"-Absatz
  entfernen; die Auslegung aus `design.md` D1 (Kategorie-Struktur nur bei
  Gruppierung „nach Kategorie") aufnehmen.
  Prüfen: `tools/spec-check` läuft grün.
- [x] 8.2 `openspec/specs/canteen/spec.md` Akzeptanzkriterien: die Zeile zum
  voreingestellten Preset auf „Mensa, günstigstes zuerst" und die Zeile zum
  bewertungssortierten Preset auf Quellreihenfolge statt „alphabetische
  Sortierung" bringen (Stand Durchsprache 2026-09-05). Fassung + `last_reviewed`
  nach `specs/README.md` Abschnitt 8 anheben.
  Prüfen: `tools/spec-check` grün; Diff nur an den beiden Zeilen und dem
  Frontmatter.
- [x] 8.3 Prüfprotokoll `specs/pruefprotokolle/<datum>-canteen-sortieren-gruppieren.md`
  für Gestaltung/Barrierefreiheit der neuen Ansicht anlegen; Geräteschritte als
  „ausstehend Gerät" markieren (Capability `quality-and-testing` Abschnitt 3).
  Prüfen: Datei vorhanden, Abschnitt „statisch bestanden" ausgefüllt.
- [x] 8.4 Rückverfolgbarkeit gegen QA-F-010 messen: jeder der 15
  Requirement-Titel des Blocks kommt in mindestens einem `describe`-Namen vor.
  Prüfen: `grep` je Titel gegen `app/src/areas/canteen/*.test.ts*` — keine Lücke.
- [x] 8.5 Vollprüfung: `node node_modules/jest/bin/jest.js` (App) grün, `tsc`
  sauber, `npx eslint .` sauber, `tools/spec-check` 4/4, contract-codegen
  `--check` grün, `npx expo export --platform android` baut.
- [ ] 8.6 `openspec validate canteen-sortieren-gruppieren --strict` grün, dann
  `openspec archive canteen-sortieren-gruppieren`.
