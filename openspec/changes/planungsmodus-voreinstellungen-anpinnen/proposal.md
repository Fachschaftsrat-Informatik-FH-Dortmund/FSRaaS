## Why

Der archivierte Change `planungsmodus-kriterien` (2026-09-07) hat den
Planungsmodus auf eine geordnete Kriterienliste umgestellt und die Umsetzung
nach Issue #27 ausgelagert (Roadmap-Schritt 5, Etappe 5). Die Requirements
stehen seitdem in `openspec/specs/schedule/spec.md`, im Code existiert davon
nichts: kein Kriterium, keine Voreinstellung, kein Anpinnen, keine
Vorbereitungszeit, kein Vorschlag. Der Planungsmodus ist bis heute reine
Handarbeit — die Nutzerin klickt jede Veranstaltungsart einzeln an.

Dieser Change setzt den **ersten Zug** aus Issue #27 um. Mit ihm ist der
Planungsmodus vollständig nutzbar: einen Namen antippen, einen Vorschlag
erzeugen lassen, ansehen, einzeln nachbessern, sichern.

## What Changes

- **Kriterien und Voreinstellungen.** Die acht Kriterien der
  Kriterienrangfolge als reine Bewertungsfunktionen, lexikographisch
  ausgewertet, und die fünf benannten Voreinstellungen mit ihren festen
  Reihenfolgen. Die Nutzerin wählt eine Voreinstellung; freie Sortierung und
  Abschalten einzelner Kriterien gehören zum zweiten Zug und nicht hierher.
- **Automatischer Planungsvorschlag, greedy.** Die Veranstaltungsreihen der
  gewählten Module werden in fester Reihenfolge durchgegangen, je Reihe wird
  der nach der Rangfolge beste konfliktfreie Gruppen-Slot gewählt. Keine
  Veranstaltung wird entfernt, angepinnte Termine bleiben stehen. Der
  Vorschlag landet im Zwischenstand des Planungsmodus — sichtbar, einzeln
  änderbar und erst mit dem Sichern im Plan. Umgelegte Termine sind
  gekennzeichnet; geht es nicht konfliktfrei, nennt ein Hinweis die
  beteiligten Veranstaltungen.
- **Anpinnen.** Ein gewählter Termin lässt sich im Planungsmodus anpinnen.
  `angepinnt` wird am Planeintrag gespeichert. Der Vorschlag und die
  Rücknahme fassen angepinnte Termine nicht an.
- **Rücknahme.** Ein sichtbarer Bedienweg stellt die Einteilung nach der
  Gruppenkennung wieder her. Angepinnte und selbst angelegte Termine bleiben
  dabei unberührt.
- **Planungseinstellungen.** Ein eigener Bildschirm, erreichbar aus dem
  Planungsmodus. Er enthält die Voreinstellung, die allgemeine
  Vorbereitungszeit, abweichende Werte je Veranstaltungsart und den
  Mindestabstand Vorlesung–Übung. Alles wird nur auf dem Gerät gespeichert.
- **Gruppen-Slot im Vorschlag.** Neu ist ein kleines Requirement. Termine
  einer Veranstaltungsart, die dieselbe Gruppenmenge und denselben Namen
  tragen, bilden einen Gruppen-Slot, etwa die zwei Vorlesungstermine einer
  Woche. Der Vorschlag wählt sie nur gemeinsam und legt sie nur gemeinsam um.
  Sonst ließe ein Verfahren, das je Reihe einen Termin wählt, die zweite
  Vorlesung fallen.

Reine Gerätelogik: kein Backend, keine Vertragsänderung.

## Nicht in diesem Change

- **Zweiter Zug aus Issue #27:** freie Sortierung der Kriterienrangfolge und
  Abschalten einzelner Kriterien.
- **„Pflicht"-Markierung** (Requirement „Kandidat als Pflicht markieren").
  Da der Vorschlag nie eine Veranstaltung entfernt, bliebe ihr allein der
  Vorrang in der Bearbeitungsreihenfolge. Der Hinweis des Vorschlags auf die
  Pflicht-Markierung (Requirement „Automatischer Planungsvorschlag",
  Szenario „Keine konfliktfreie Konstellation") steht deshalb als offene
  Aufgabe in `tasks.md`.
- **Bevorzugtes Zeitfenster** (Requirements „Bevorzugtes Zeitfenster
  festlegen", „Kennzeichnung außerhalb des Zeitfensters"). Das Kriterium
  „Zeitfenster" ist berechenbar, gehört aber zu keiner Voreinstellung und
  wirkt erst mit der freien Sortierung.

## Capabilities

### Modified Capabilities

- `schedule`: ein ADDED-Requirement „Gemeinsames Umlegen der Termine eines
  Gruppen-Slots". Alle übrigen umgesetzten Requirements stehen bereits in der
  Haupt-Spec (archivierter Change `planungsmodus-kriterien`).

## Impact

- `app/src/areas/schedule/`: neue reine Module `planungskriterien.ts`,
  `planungsvorschlag.ts`, Speicher `planungseinstellungen.ts`;
  `typen.ts`/`planStore.ts` (`angepinnt`); `PlanungScreen.tsx`
  (Vorschlag, Rücknahme, Anpinnen, Kennzeichnung); neuer Bildschirm
  `PlanungEinstellungenScreen.tsx` samt Route.
- `app/src/i18n/de.json`, `en.json`: neue Schlüssel.
- Kein Backend, kein Vertrag, keine Migration. Gespeicherte Planeinträge ohne
  `angepinnt` gelten als nicht angepinnt.

Refs #27
