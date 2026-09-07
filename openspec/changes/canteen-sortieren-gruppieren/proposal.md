# Sortier-/Gruppierblock der Mensa-Ansicht umsetzen

## Why

Der Sortier-/Gruppierblock der Capability `canteen` ist der letzte spec-only
Rest von Roadmap-Schritt 4: 15 abgenommene Requirements (Wahl der Gruppierung,
Gerichte-Sortierung mit getrennter Richtungswahl, Gruppenreihenfolge, vier
vordefinierte Presets, eigene Presets, Zugang im Kopfbereich, generische
Chip-Leiste) stehen seit dem 2026-09-04 fest und wurden am 2026-09-05 in
`canteen-durchsprache-inhalt` vollständig bestätigt — drei davon geändert.
Der Code (`app/src/areas/canteen/`) gruppiert die Gerichtsliste bis heute fest
nach Mensa-Auswahlreihenfolge, wie vor der Ergänzung; `openspec/specs/canteen/spec.md`
weist das im Abschnitt „Umsetzungsstand" als offenen eigenen Schnitt aus.

Ausgelagert aus `canteen-durchsprache-inhalt/tasks.md` Aufgabe 4.1 nach
GitHub-Issue #26, damit jener Change nicht dauerhaft unfertig aussieht.

## What Changes

- **Neue reine Logikmodule** in `app/src/areas/canteen/` für die drei Bausteine
  Gruppierung (keine / nach Mensa / nach Kategorie), Gruppenreihenfolge
  (Kriterium + Richtung, nur bei aktiver Gruppierung) und Gerichte-Sortierung
  (Kriterium + Richtung). Die Kategorie-Gruppierung (`gruppiereNachKategorie`)
  existiert bereits in `consolidate.ts` und wird in das neue Modell eingebettet.
- **Preset-Modell und -Speicher**: vier unveränderliche vordefinierte Presets
  (Voreinstellung „Mensa, günstigstes zuerst"), eigene benannte Presets in einer
  gerätelokalen Liste (speichern, umbenennen, löschen), gerätelokale Referenz auf
  das zuletzt aktive Preset. Reaktiver Modul-Speicher nach dem Muster von
  `selection.ts` / `priceGroup.ts`; kein Konto, keine Übertragung, kein neuer
  Backend-Aufruf.
- **Neue Ansicht „Sortier-/Gruppierauswahl"** als eigene Route unter
  `app/app/(tabs)/canteen/`, mit eigenem Zugang im Kopfbereich (`headerRight`)
  neben dem bestehenden Filter-Trichter.
- **`consolidate.ts` / `CanteenScreen.tsx` umgebaut**: die Sektions- und
  Gruppenbildung folgt dem aktiven Preset statt der festen Mensa-Gliederung; die
  maßgebliche Mensa (Preis-/Kennzeichnungsquelle) bleibt unverändert an die
  Mensa-Auswahlreihenfolge gebunden.
- **`AnkerListe.tsx` / Chip-Leiste verallgemeinert**: zeigt die Gruppen der
  aktiven Gruppierung (Mensen oder Kategorien) und wird ohne Gruppierung
  ausgeblendet. Einziger Eingriff des Blocks in bestehenden UI-Code.
- **Zwei Bewertungs-Sortierkriterien werden angeboten, sind aber bis
  Roadmap-Schritt 9 wirkungslos** (keine Bewertungsdaten): Die Regel „unbewertete
  Gerichte ans Ende, untereinander in Quellreihenfolge" greift dann für die
  gesamte Liste. Dokumentierter Übergangszustand, bereits in der Spec festgehalten.
- **Prosa-Nachführung in `openspec/specs/canteen/spec.md`** (kein Requirement-Text):
  Abschnitt „Umsetzungsstand" / `implemented_in` fortschreiben, den „spec-only"-Absatz
  entfernen; die Akzeptanzkriterien-Zeilen zum Preset-Standard und zur Ordnung
  unbewerteter Gerichte auf den Stand der Durchsprache vom 2026-09-05 bringen
  (nennen noch „Mensa, eigene Bewertung" bzw. „alphabetische Sortierung").
- **„Alle Mensen"-Ansicht bleibt unverändert** — feste, nach Mensa gegliederte
  Vergleichsansicht ohne wählbare Sortierung (bewusst, entschieden 2026-09-04).

## Capabilities

### New Capabilities

Keine.

### Modified Capabilities

Keine. Die 15 Requirements sind bereits in `openspec/specs/canteen/spec.md`
abgenommen und im archivierten Change `canteen-durchsprache-inhalt`
festgeschrieben. Dieser Schnitt setzt sie ausschließlich um und ändert keinen
Requirement-Text — `.openspec.yaml` trägt daher `skip_specs: true`. Die
Prosa-/Metadaten-Nachführung in `spec.md` (Umsetzungsstand, `implemented_in`,
Akzeptanzkriterien) erfolgt wie bei jedem Umsetzungsschnitt im selben Merge, ist
aber kein Spec-Delta.

## Impact

- **Roadmap:** Schließt den letzten offenen Block von Schritt 4 (MENSA). Unabhängig
  von Schritt 9; die bewertungsgekoppelten Sortierkriterien sind bis dahin inert.
- **Betroffener Code (App):**
  - neu: `sortGroup.ts` (reines Modell + Anwendung), `presets.ts` (vordefiniert +
    Anwendung), `sortGroupPreset.ts` (reaktiver Speicher), `ui/SortGroupZugang.tsx`
    (headerRight), `screens/SortGroupScreen.tsx` (Ansicht),
    `app/app/(tabs)/canteen/sortierung.tsx` (Re-Export, SHELL-F-050).
  - geändert: `consolidate.ts`, `screens/CanteenScreen.tsx`, `ui/AnkerListe.tsx`,
    `app/app/(tabs)/canteen/_layout.tsx`, `preise.ts` (ggf. Sortierschlüssel),
    `app/src/i18n/de.json` + `en.json` (`mensa.sortier*` / `mensa.preset*`).
  - Tests: je „muss"-Requirement mindestens ein `describe` mit Requirement-Titel;
    `consolidate.test.ts` / `CanteenScreen.test.tsx` / `AnkerListe.test.tsx`
    nachziehen.
- **Datenmodell (lokal):** neue AsyncStorage-Schlüssel für die Preset-Liste und
  die zuletzt-aktiv-Referenz (`data-and-storage` führt „Sortier-/Gruppierpresets"
  bereits als lokale, nicht personenbezogene Datenklasse).
- **Kein Vertrag, kein Backend, keine Integration betroffen.**
  `openspec/specs/api-contract.yaml` bleibt unberührt.
- **Keine neue Abhängigkeit.**
