## Why

In der Wochenansicht steht je Termin nur wenig Breite zur Verfügung. Lange
Veranstaltungsnamen werden am Ende abgeschnitten — und damit verschwindet
ausgerechnet der Teil, der zwei verwandte Veranstaltungen unterscheidet:
„Mathematik für Informatiker 1" und „Mathematik für Informatiker 2" sehen
abgeschnitten gleich aus (Issue #68, Kommentar 1, Punkt 3).

Der ursprüngliche Vorschlag sah ein Alias-System mit über die
Verwaltungsoberfläche gepflegten Standardwerten vor, das bei zu geringer
Spaltenbreite selbsttätig greift. Beides ist am 2026-09-11 verworfen worden:
keine vordefinierten Aliase, und keine Umschaltung nach gemessener Breite.
Übrig bleiben zwei voneinander unabhängige Mittel — eines, das die Nutzerin
selbst in die Hand nimmt, und eines, das ohne ihr Zutun greift.

## What Changes

- **Umbenennen.** Die Nutzerin kann einem Modul einen eigenen Namen geben.
  Der Name gilt für das ganze Modul — Vorlesung, Übung und Praktikum tragen
  ihn gemeinsam, und später hinzukommende Termine desselben Moduls
  übernehmen ihn. Er wird ausschließlich lokal gehalten; es gibt keine über
  die Verwaltungsoberfläche gepflegten Standardwerte und damit auch keinen
  Vertragsanteil in `openspec/specs/api-contract.yaml`.
- **Nur in der Wochenansicht.** Der eigene Name ersetzt die offizielle
  Bezeichnung allein in den Stundenplan-Kacheln. Modulauswahl,
  Planungsmodus und Termindetail führen durchgängig die offizielle
  Bezeichnung — dort, wo ausgewählt wird, steht das, was auch im Aushang
  steht.
- **Bedienweg im Termindetail.** Dort steht die offizielle Bezeichnung und
  darunter der Weg zum eigenen Namen.
- **Kürzung unter Erhalt einer Endzahl.** Passt ein Name nicht in seine
  Kachel, bleibt eine am Ende stehende Zahl erhalten; gekürzt wird der
  Bereich davor. Aus „Mathematik für Informatiker 1" wird so „Mathematik
  fü…1" statt „Mathematik für Inf…". Die Regel gilt für die
  Stundenplan-Kacheln und greift unabhängig davon, ob ein eigener Name
  gesetzt ist.

## Capabilities

### New Capabilities

Keine.

### Modified Capabilities

- `schedule`: Drei Requirements kommen hinzu — eigener Modulname, sein
  Geltungsbereich samt Bedienweg, und die Kürzung unter Erhalt einer
  Endzahl. Kein bestehendes Requirement ändert sich: Die Zusammenführung
  paralleler Termingruppen auf einen Namensstamm gilt für die Modulauswahl
  und wird durch den Change `planungsmodus-anzeige` eingegrenzt, nicht durch
  diesen.

## Impact

**Roadmap:** Schritt 5 (Stundenplan), Etappe 3 (Wochenansicht) — Nacharbeit
an bereits geliefertem Code, kein neuer Schnitt.

**Betroffener Code** (vor der Umsetzung vollständig zu prüfen):

- `app/src/areas/schedule/screens/ScheduleScreen.tsx` — Beschriftung der
  Kacheln
- `app/src/areas/schedule/screens/TerminDetailScreen.tsx` — Bedienweg zum
  eigenen Namen
- `app/src/areas/schedule/planStore.ts` oder ein eigener lokaler Speicher für
  die Zuordnung Modul → eigener Name
- neue reine Funktion für die Kürzung, samt Tests an den Grenzfällen (Name
  ohne Endzahl, Zahl in der Mitte, Name kürzer als die Kachel)

**Bewusst nicht in diesem Schnitt:**

- **Über die Verwaltungsoberfläche gepflegte Standardnamen.** Am 2026-09-11
  verworfen; die Capability `admin` und `openspec/specs/api-contract.yaml`
  bleiben unberührt.
- **Selbsttätige Umschaltung nach gemessener Spaltenbreite.** Ebenfalls
  verworfen — an ihre Stelle tritt die Kürzungsregel, die ohne Messung
  auskommt.
- **Der eigene Name außerhalb der Wochenansicht.** Modulauswahl,
  Planungsmodus und Termindetail bleiben bei der offiziellen Bezeichnung.
