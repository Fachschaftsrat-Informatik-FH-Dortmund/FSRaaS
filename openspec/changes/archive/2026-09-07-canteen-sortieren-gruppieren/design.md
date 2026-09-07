## Context

Siehe `proposal.md` — Why. Der Ausgangsstand im Code:

- `consolidate.ts` (`konsolidiere`) fasst die je Mensa gelieferten Tagespläne zu
  einem Eintrag je Gericht zusammen (`schluessel`), bestimmt die maßgebliche
  Mensa (= erste anbietende in Auswahlreihenfolge) und liefert `sektionen` fest
  je Mensa, jede mit Kategorie-Untergruppen aus `gruppiereNachKategorie`
  (`kategorieRang`: benannt → kategorielos → Beilagen).
- `CanteenScreen.tsx` rendert diese Sektionen, wendet danach den
  Ernährungs-/Preisfilter an (`useGerichtFilter`) und baut die Chip-Liste.
- `ui/AnkerListe.tsx` ist die geteilte Chip-Ankernavigation (Haupt- **und**
  „Alle Mensen"-Ansicht); ihre `chips`/`abschnitte` sind heute Mensa-Einträge.
- Reaktive gerätelokale Modul-Speicher ohne globalen Store (ARCH-N-030):
  `selection.ts`, `priceGroup.ts`, `priceLimit.ts`, `dietPreference.ts`,
  `intolerances.ts` — alle nach demselben Muster (`useSyncExternalStore`,
  `readJson`/`writeJson`, `__reset…ForTest`).
- Kopfzugang: `ui/FilterZugang.tsx` als `headerRight` von `index` in
  `app/app/(tabs)/canteen/_layout.tsx`.

Die 15 Requirements stehen in `openspec/specs/canteen/spec.md`
(„Wahl der Gruppierung" bis „Feste Endposition von Beilagen- und Sammelgruppe"),
die Erläuterungen im Abschnitt „Frei wählbare Sortierung und Gruppierung" und
die Preset-Tabelle im Abschnitt „Presets für Sortierung und Gruppierung".

Geklärt für diesen Schnitt (2026-09-07, per Rückfrage):

1. **Die drei Gruppierungen schließen sich gegenseitig aus.** Bei „keine" und
   „nach Mensa" wird die Gerichtsliste flach nach dem gewählten Kriterium
   sortiert — **keine** Kategorie-Zwischenüberschriften, Beilagen wie jedes
   Gericht einsortiert. Die unbedingte Beilagen-Trennung (Requirement „Beilagen
   als eigene Kategorie") und die kategorielose Sammelgruppe (Requirement
   „Sammelgruppe ohne Ausgabestellen-Kategorie") binden strukturell nur bei
   Gruppierung „nach Kategorie". Diese Auslegung wird in der spec.md-Prosa
   (Abschnitt „Umsetzungsstand") festgehalten, weil „Beilagen als eigene
   Kategorie" als unbedingtes „muss" formuliert ist.

## Goals / Non-Goals

**Goals:**

- Die drei Bausteine (Gruppierung, Gruppenreihenfolge, Gerichte-Sortierung) als
  reine, testbare Fachlogik ohne React, entkoppelt von der Zusammenfassung.
- Preset-Modell: vier unveränderliche vordefinierte Presets + gerätelokale eigene
  Presets, zuletzt aktives Preset gemerkt.
- Die maßgebliche Mensa bleibt invariant an die Mensa-Auswahlreihenfolge
  gebunden, unabhängig von der Gruppenreihenfolge.
- `AnkerListe` und `CanteenAllScreen` verhalten sich unverändert, wo sie nicht
  gruppierungsabhängig sind.

**Non-Goals:**

- Keine Änderung an der „Alle Mensen"-Ansicht (bleibt fest nach Mensa, alle drei
  Preise) — bewusst, entschieden 2026-09-04.
- Keine echte Bewertungs-Sortierung: `canteen-ratings` entsteht erst mit
  Roadmap-Schritt 9. Die beiden Bewertungskriterien werden angeboten, greifen
  aber über die Regel für unbewertete Gerichte auf Quellreihenfolge durch.
- Keine weiteren Bausteine (Kennzeichnung, Öffnungsstatus) — offene Frage in
  `canteen/spec.md` Abschnitt „Offene Fragen", nicht Teil dieses Schnitts.
- Kein Backend, kein Vertrag, keine Integration.

## Decisions

### D1 — Neue Ebene `sortierung.ts` über `consolidate.ts`, nicht hineingezogen

`konsolidiere` behält genau eine Aufgabe: ein Eintrag je Gericht, maßgebliche
Mensa, `anbieter`, `geschlossene`. Es gibt zusätzlich einen stabilen
**Quellrang** je Gericht aus (Reihenfolge des ersten Auftretens über die
gewählten Mensen in Auswahlreihenfolge) — heute implizit in `schluesselJeMensa`,
künftig explizit, damit „Reihenfolge der Quelle" auch bei Gruppierung ≠ Mensa
wohldefiniert ist.

Ein neues reines Modul `sortierung.ts` nimmt die konsolidierten Gerichte plus
einen Kontext (`{ preisGruppe, mensaReihenfolge, mensaName, bewertung }`) und ein
aufgelöstes Preset und liefert die Anzeigestruktur:

```
wendeAn(preset, konsolidierung, kontext) -> {
  abschnitte: { id: string; titel: string | null; gerichte: KonsolidiertesGericht[] }[]
  gruppierungAktiv: boolean   // steuert Chip-Leiste + Abschnittsüberschriften
}
```

- Gruppierung „keine" → genau ein Abschnitt (`titel: null`), Gerichte flach
  sortiert.
- Gruppierung „nach Mensa" → ein Abschnitt je Mensa mit Angebot; Reihenfolge der
  Abschnitte aus dem Gruppenreihenfolge-Kriterium (Auswahlreihenfolge |
  alphabetisch) × Richtung; Gerichte je Abschnitt flach sortiert.
- Gruppierung „nach Kategorie" → ein Abschnitt je Kategorie über **alle**
  gewählten Mensen; Reihenfolge aus Quellreihenfolge der Ausgabestellen |
  alphabetisch × Richtung; kategorielose Sammelgruppe und danach Beilagen stehen
  unabhängig vom Kriterium am Ende (Requirement „Feste Endposition …"). Die
  `kategorieRang`-Logik aus `consolidate.ts` wandert hierher.

*Alternative:* Sortier-/Gruppierlogik in `konsolidiere` einbauen. Verworfen —
`konsolidiere` wird auch vom Hintergrund-Abgleich der Lieblingsgerichte genutzt
(`backgroundCheck`-Pfad) und soll frei von Anzeigebelangen bleiben; die
Trennung hält beide Tests klein.

### D2 — Vordefinierte Presets als Code-Konstanten, nur Eigenes wird persistiert

`sortierung.ts` exportiert die vier vordefinierten Presets als unveränderliche
Konstanten mit stabilen IDs (`mensa-eigene-bewertung`, `mensa-community`,
`mensa-guenstigstes`, `preis`). Anzeigenamen kommen aus i18n (`mensa.preset.*`),
nicht aus den Konstanten (NFR-F-115).

Persistiert werden nur:

- `canteenSortPresets` — Liste eigener Presets `{ id, name, gruppierung,
  gruppenreihenfolge?, gerichteSortierung }` (id = generierte lokale Kennung).
- `canteenSortActive` — die ID des zuletzt aktiven Presets (vordefiniert oder
  eigen). Fehlt sie oder zeigt sie auf ein gelöschtes eigenes Preset →
  `mensa-guenstigstes` (Requirement „Voreingestelltes Preset").

*Alternative:* auch die vordefinierten Presets in den Speicher schreiben.
Verworfen — sie sind unveränderlich (Requirement „Umbenennen und Löschen eigener
Presets"), ein Abbild im Speicher könnte bei einer künftigen Definitionsänderung
veralten.

### D3 — Ein reaktiver Modul-Speicher `sortierPreset.ts` nach Muster `selection.ts`

`useSortierGruppierung()` liefert `{ aktiv: AufgelöstesPreset, presets:
EigenesPreset[], loaded, waehle(id), speichereEigenes(name, kombi),
benenneUm(id, name), loesche(id) }`. Kopfzugang, Ansicht und Gerichtsliste teilen
denselben Stand ohne globalen Store (ARCH-N-030). `__resetSortierPresetForTest`
wie bei den übrigen Speichern.

### D4 — Bewertungskriterien über einen Resolver-Seam, heute inert

`Gericht` (Vertrag) trägt keine Bewertung. `wendeAn` bekommt im Kontext
`bewertung?: (schluessel: string) => Bewertungsstufe | undefined`. Bis
Roadmap-Schritt 9 übergibt `CanteenScreen` `undefined` bzw. einen Resolver, der
immer `undefined` liefert → jedes Gericht ist unbewertet → Regel „Einordnung
unbewerteter Gerichte ans Ende" greift für die gesamte Liste, mehrere unbewertete
Gerichte untereinander in Quellreihenfolge (geändert 2026-09-05). Kein toter
Code: der Parameter ist die dokumentierte Anschlussstelle für RATE-F-100.

*Alternative:* die beiden Kriterien erst mit Schritt 9 aufnehmen. Verworfen —
sie gehören zu den vordefinierten Presets „Mensa, eigene Bewertung" /
„Mensa, Community-Bewertung", die schon jetzt Teil der Spec sind; ein späterer
Nachzug erzwänge eine zweite Änderung an derselben Stelle.

### D5 — `AnkerListe` generalisieren, `CanteenAllScreen` unverändert lassen

`AnkerChip`/`AnkerAbschnitt` sind bereits generisch (`id`, `titel`, `inhalt`).
Der Umbau beschränkt sich auf `CanteenScreen`: es übergibt Abschnitte aus
`wendeAn` statt fest aus `konsolidiere`. Bei `gruppierungAktiv === false` erhält
`AnkerListe` genau einen Abschnitt und keine Chips → die Leiste ist ausgeblendet
(heute schon `chips.length > 1`; wird zusätzlich über `gruppierungAktiv` explizit
gesteuert, Requirement „Chip-Leiste zeigt Gruppen der aktiven Gruppierung").
`CanteenAllScreen` übergibt weiterhin Mensa-Abschnitte direkt — kein Verhalten
ändert sich dort.

### D6 — Filter wirkt nach der Sortierung, wie heute

`useGerichtFilter().betroffen` wird weiterhin auf die maßgeblichen Gerichte
angewandt, nachdem `wendeAn` die Abschnitte gebildet hat. Ein Abschnitt ohne
sichtbares Gericht fällt weg; ein Chip ohne sichtbaren Abschnitt ist deaktiviert
(bestehende Logik). Der Zähler „ausgeblendete Gerichte" bleibt unverändert.

### D7 — spec.md-Prosa im selben Merge, kein Spec-Delta

`skip_specs: true`. In `openspec/specs/canteen/spec.md` werden fortgeschrieben
(kein Requirement-Text):

- Abschnitt „Umsetzungsstand": Sortier-/Gruppierblock von spec-only auf
  umgesetzt, `implemented_in` um die neuen Dateien, den „spec-only"-Absatz
  entfernen; die Auslegung aus D1 (Kategorie-Struktur nur bei Gruppierung „nach
  Kategorie") aufnehmen.
- Akzeptanzkriterien: die Zeile zum voreingestellten Preset nennt noch „Mensa,
  eigene Bewertung" statt „Mensa, günstigstes zuerst"; die Zeile zum
  bewertungssortierten Preset nennt noch „alphabetische Sortierung" statt
  Quellreihenfolge — beide auf den Stand der Durchsprache vom 2026-09-05 bringen.
- Fassung/`last_reviewed` nach `specs/README.md` Abschnitt 8.

## Risks / Trade-offs

- **Umbau von `CanteenScreen`/`consolidate.ts` mit breiter Testfläche.** →
  `konsolidiere` behält seine Ausgabegestalt (Eintrag je Gericht, maßgebliche
  Mensa); nur der Quellrang kommt hinzu. Die feste Sektionsbildung wandert in
  `sortierung.ts`. Bestehende `consolidate.test.ts`-Fälle zur Zusammenfassung und
  maßgeblichen Mensa bleiben; die Fälle zur festen Mensa-Gliederung ziehen nach
  `sortierung.test.ts` um.
- **`AnkerListe` ist geteilt.** → `CanteenAllScreen` übergibt Mensa-Abschnitte
  unverändert; ein Test hält fest, dass die „Alle Mensen"-Ansicht ohne
  Preset-Bezug arbeitet.
- **Zwei Presets bis Schritt 9 ununterscheidbar** („Mensa, eigene Bewertung" /
  „Mensa, Community-Bewertung"). → Kein Fehler, in der Spec dokumentiert; ein
  Test hält fest, dass beide sich ohne Bewertungsdaten wie Quellreihenfolge
  verhalten und kein Gericht aus der Liste fällt.
- **eslint-plugin-react-hooks stürzt bei Member-Ausdrücken in Dependency-Arrays
  ab** (`x.length`) und bei Hooks hinter frühem `return`
  (`[[umsetzungsstand]]`-Notiz 2026-09-07). → In `SortierGruppierScreen` und im
  umgebauten `CanteenScreen` nur volle, ggf. per `useMemo` stabilisierte
  Referenzen in Dependency-Arrays; alle Hooks vor bedingten Returns.
- **Preset-Speicher-Schema.** Ein künftiges Feld an einem eigenen Preset braucht
  eine `bereinige`-Funktion wie `dietPreference.ts`. → Von Anfang an ein
  defensives `bereinige` beim Laden (unbekannte Kriterien/Richtungen → Preset
  verwerfen, nicht die ganze Liste).

## Migration Plan

- Reine App-lokale JS-Änderung — Metro-Reload genügt, kein nativer Rebuild, kein
  `expo prebuild`.
- Keine Datenmigration: die neuen AsyncStorage-Schlüssel sind anfangs leer →
  Voreinstellung „Mensa, günstigstes zuerst".
- Rollback = Commit zurücknehmen; verwaiste Schlüssel im Gerätespeicher sind
  folgenlos.
- Geräte-/Gestaltungsabnahme der neuen Ansicht in einem datierten Prüfprotokoll
  (`specs/pruefprotokolle/`), Geräteschritte als „ausstehend Gerät" — analog zu
  Teil A.

## Open Questions

- Ob der Bewertungs-Resolver (D4) schon jetzt die lokale Spiegelung nach
  RATE-F-100 lesen soll, sobald sie existiert. Verschiebbar: die Anschlussstelle
  ändert weder Modell noch Aufgabenschnitt; die Entscheidung fällt mit
  Roadmap-Schritt 9.
