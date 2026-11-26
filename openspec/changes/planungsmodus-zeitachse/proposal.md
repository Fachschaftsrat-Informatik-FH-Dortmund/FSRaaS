## Why

Der Planungsmodus zeigt die Termine eines Wochentags als Liste, aufsteigend
nach Beginnzeit. Ob zwei Zeilen *gleichzeitig* oder *nacheinander*
stattfinden, steht dort nur in den Uhrzeiten. Bei sechs Modulen mit
Parallelgruppen stehen an einem Tag schnell zehn Zeilen untereinander. Wer
wissen will, welche Übungsgruppe neben der Vorlesung liegt und welche danach,
muss Uhrzeiten vergleichen. Issue #67 wünscht deshalb eine umschaltbare
Zeitleiste im Planungsmodus. Zugeordnet ist der Change Roadmap-Schritt 5,
Etappe 5 (Planung).

## What Changes

- **Umschalter Liste/Zeitachse** im Planungsmodus. Die Zeitachse zeigt die
  Termine des gewählten Wochentags auf einer zur Uhrzeit proportionalen
  Achse. Sich überschneidende Termine stehen nebeneinander in Spalten,
  aufeinanderfolgende untereinander.
- Die Kacheln der Zeitachse tragen Uhrzeit, Name, Veranstaltungsart, Gruppe
  und die Kennzeichnungen „gewählt" und „kollidiert". Antippen wählt oder
  abwählt wie in der Liste. Für den Bildschirmleser nennt jede Kachel, mit
  wie vielen anderen Terminen sie sich überschneidet.
- Freie Zeit zwischen Terminen erscheint wie in der Wochenansicht als Lücke
  mit Dauer, lange Lücken gestaucht.
- Bei vielen parallelen Terminen wird keine Kachel verborgen oder unlesbar
  schmal: Die Achse wird breiter als der Bildschirm und lässt sich seitlich
  verschieben.
- Die gewählte Darstellung bleibt auf dem Gerät gespeichert.

Reine Gerätelogik: kein Backend, keine Vertragsänderung.

## Nicht in diesem Change

- **Wochenübersicht mit allen fünf Tagen nebeneinander.** Die Gliederung nach
  Wochentagen bleibt (Requirement „Planungsmodus mit Wochentagsgliederung").
- **Anpinnen in der Zeitachse.** Der Pin-Schalter bleibt der Listendarstellung
  vorbehalten; eine Kachel hat dafür zu wenig Platz. Die Zeitachse zeigt den
  Pin nur an.
- **Änderungen an der Wochenansicht.** Ihre Zeitachse (`dayLayout.ts`,
  `ScheduleScreen.tsx`) bleibt unberührt; an ihr arbeitet parallel der Change
  `alle-veranstaltungen-einblenden`.

## Capabilities

### New Capabilities

_keine_

### Modified Capabilities

- `schedule`: ADDED „Zeitachse im Planungsmodus".

## Impact

- `app/src/areas/schedule/planungZeitachse.ts` (neu): reine Spalten- und
  Lückenberechnung für die Zeilen des Planungsmodus.
- `app/src/areas/schedule/screens/PlanungScreen.tsx`: Umschalter in der
  Werkzeugzeile, Zeitachsen-Darstellung.
- `app/src/areas/schedule/planungseinstellungen.ts`: gespeicherte Darstellung.
- `app/src/i18n/de.json`, `en.json`: neue Schlüssel.

Refs #67
