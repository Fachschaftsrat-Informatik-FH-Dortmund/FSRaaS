## Why

Der erste Zug aus Issue #27 (Change `planungsmodus-voreinstellungen-anpinnen`)
lässt die Nutzerin nur eine der fünf Voreinstellungen wählen. Das Requirement
„Kriterienrangfolge für die Planung" verlangt mehr: Sie soll die Kriterien
selbst ordnen und einzelne abschalten. Erst dann lässt sich ein Wunsch wie
„möglichst wenige Fahrten, dabei Vorbereitungszeit" ausdrücken, und erst
dann bekommen *Abwechslung* und *Zeitfenster*, die zu keiner Voreinstellung
gehören, überhaupt eine Wirkung. Dieser Change setzt den **zweiten Zug**
um. Zugeordnet ist er Roadmap-Schritt 5, Etappe 5 (Planung).

## What Changes

- **Freie Sortierung.** In den Planungseinstellungen stehen die
  eingeschalteten Kriterien als nummerierte Liste. Jede Zeile trägt eine
  Auf- und eine Ab-Schaltfläche. Umordnen geht ohne Ziehgeste und ist damit
  mit Bildschirmleser und Schaltersteuerung bedienbar. Nach dem Verschieben
  sagt das System die neue Stelle an.
- **Abschalten einzelner Kriterien.** Jedes Kriterium hat einen Schalter.
  Abgeschaltete stehen in einem eigenen Abschnitt; wieder eingeschaltet
  rücken sie ans Ende der Rangfolge. Sind alle abgeschaltet, sagt ein
  Hinweis, dass der Vorschlag dann nur noch Konflikte auflöst.
- **Voreinstellung und eigene Rangfolge.** Eine Voreinstellung füllt die
  Rangfolge wie bisher. Weicht die Rangfolge von jeder Voreinstellung ab, ist
  keine mehr gewählt. Die Werkzeugzeile des Planungsmodus zeigt dann „Eigene
  Rangfolge".
- **Bevorzugtes Zeitfenster.** Die bestehenden Requirements „Bevorzugtes
  Zeitfenster festlegen" und „Kennzeichnung außerhalb des Zeitfensters"
  werden umgesetzt: früheste Beginnzeit und späteste Endzeit in den
  Planungseinstellungen, eine Kennzeichnung an jeder Terminzeile außerhalb
  des Fensters. Ohne Fenster bliebe das achte Kriterium wirkungslos.
- Ein gespeicherter Bestand aus dem ersten Zug (nur Voreinstellung) wird
  übernommen, ohne dass die Nutzerin etwas tun muss.

Reine Gerätelogik: kein Backend, keine Vertragsänderung.

## Nicht in diesem Change

- **Zeitfenster je Wochentag.** Die Capability führt das als offene Frage und
  nimmt für den ersten Umfang ein einheitliches Fenster an. Dieser Change
  folgt der Annahme und entscheidet die Frage nicht.
- **Weitere Kriterien** über die acht hinaus (offene Frage der Capability).
- **Ziehen zum Umordnen.** Eine Ziehgeste kann später als zweiter Weg
  hinzukommen. Die Schaltflächen bleiben dann der sichtbare Weg nach dem
  Requirement „Zweiter sichtbarer Bedienweg statt reiner Geste".

## Capabilities

### New Capabilities

_keine_

### Modified Capabilities

- `schedule`: MODIFIED „Kriterienrangfolge für die Planung". Das Umordnen
  muss ohne Ziehgeste über sichtbare Bedienwege möglich sein (das bisherige
  Szenario sprach von „nach oben zieht"). Eine von allen Voreinstellungen
  abweichende Rangfolge zeigt keine Voreinstellung als gewählt an.
  Zeitfenster und Kennzeichnung stehen bereits vollständig in der Haupt-Spec
  und bekommen kein Delta.

## Impact

- `app/src/areas/schedule/planungseinstellungen.ts`: Rangfolge statt
  Voreinstellung als gespeicherter Wert, Zeitfenster, Übernahme alter
  Bestände.
- `app/src/areas/schedule/screens/PlanungEinstellungenScreen.tsx`:
  Abschnitte „Reihenfolge der Kriterien" und „Bevorzugtes Zeitfenster".
- `app/src/areas/schedule/screens/PlanungScreen.tsx`: Name der Rangfolge in
  der Werkzeugzeile, Kennzeichnung außerhalb des Zeitfensters.
- `app/src/i18n/de.json`, `en.json`: neue Schlüssel.
- Kein Backend, kein Vertrag, keine Migration im Backend.

Refs #27
