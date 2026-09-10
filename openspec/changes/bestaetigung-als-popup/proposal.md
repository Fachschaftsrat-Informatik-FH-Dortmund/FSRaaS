## Why

Beim Gerätetest vom 2026-09-09 zur Wochenansicht ist aufgefallen, dass die
Rückfrage nach dem Geltungsbereich einer Farbwahl am Seitenende erscheint
statt als Pop-up (Issue #68, Kommentar 1, Punkt 4). Eine Rückfrage am
Seitenende kann übersehen werden, während der auslösende Bedienweg
weiterhin bedienbar aussieht — der Bildschirm zeigt dann zwei Zustände
gleichzeitig, den vor und den während der Rückfrage.

Der Befund gilt nicht nur an dieser Stelle. Die Capability
`ux-and-theming` verlangt bereits eine Bestätigung vor jeder zerstörenden
Aktion, sagt aber nichts über deren Gestalt. Damit ist die Form je Ansicht
neu zu entscheiden, und der Bestand hat mindestens eine Stelle, an der sie
anders ausgefallen ist.

## What Changes

- Jede Rückfrage, die vor der Ausführung einer Aktion eine Entscheidung
  verlangt, erscheint app-weit als Pop-up über der Ansicht — nicht als
  Abschnitt am Seitenende und nicht als eingeschobener Bereich innerhalb des
  Inhalts.
- Die Festlegung gilt für alle Bereiche der App und für die
  Verwaltungsoberfläche, nicht nur für den Stundenplan. Sie ergänzt das
  bestehende Requirement „Bestätigung vor zerstörender Aktion" um die
  Gestalt, ohne dessen Geltungsbereich zu ändern: Sie gilt auch für
  Rückfragen, die nichts zerstören — etwa die nach dem Geltungsbereich einer
  Farbwahl.

## Capabilities

### New Capabilities

Keine.

### Modified Capabilities

- `ux-and-theming`: Ein Requirement kommt hinzu, das die Gestalt von
  Bestätigungsdialogen festlegt. Bestehende Requirements ändern sich nicht;
  „Bestätigung vor zerstörender Aktion" bleibt unverändert und wird durch
  das neue ergänzt.

## Impact

**Roadmap:** Querschnittlich, keinem einzelnen Schritt zugeordnet. Betrifft
den bereits gelieferten Bestand von Schritt 2 bis 5.

**Betroffener Code** (vor der Umsetzung vollständig zu prüfen — die
Aufzählung ist der Stand der Durchsicht, nicht abschließend):

- `app/src/ui/` — eine gemeinsame Grundstruktur für den Bestätigungsdialog,
  damit die Festlegung an einer Stelle erfüllt wird und nicht je Ansicht
  neu; Vorbild ist der Umgang mit den vier Ansichtszuständen
- `app/src/areas/schedule/screens/TerminDetailScreen.tsx` — die Rückfrage
  nach dem Geltungsbereich der Farbwahl, der auslösende Fund
- `app/src/areas/schedule/screens/PlanungScreen.tsx` — Verwerfen der Planung
  und Verlassen mit ungesicherten Änderungen (Zeile 450, 472-474)
- `app/src/areas/schedule/screens/CourseSelectionScreen.tsx` — Abwahl eines
  Moduls mit vorhandenen Planeinträgen, Verwerfen der Modulauswahl
- alle weiteren Stellen, die heute eine Rückfrage im Seiteninhalt führen; sie
  sind vor der Umsetzung vollständig zu erheben

**Bewusst nicht in diesem Schnitt:** Hinweise ohne Entscheidung — Lade-,
Leer-, Fehler- und Offline-Zustände sowie schließbare Einführungshinweise.
Sie verlangen keine Entscheidung und bleiben, wo sie sind.
