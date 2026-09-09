---
status: draft
version: 0.1.0
owner: FSR FB4
last_reviewed: 2026-09-09
---

# Prüfprotokoll — Bedienung ohne Vormerkung: Wochentagsleisten, Sprung, Gestaltungsfragen

Datum: 2026-09-09
Prüfer: FSR FB4 (Gerätetest, Android)
Grundlage: `openspec/changes/stundenplan-bedienung-ohne-vormerkung/` (proposal, design,
specs, tasks) Block 9, Aufgaben 9.1–9.3.

Deckt die Punkte ab, für die `quality-and-testing` Abschnitt 3 ein datiertes
Prüfprotokoll statt eines automatisierten Tests zulässt (Gestaltung,
Barrierefreiheit), sowie eine Migrationsentscheidung (9.3), die sich erst am
Gerätebestand beurteilen ließ.

## 1. Wochentagsleisten, Leistenhöhe, Sprung (Aufgabe 9.1)

| Prüfpunkt | Ergebnis |
|---|---|
| Wochenansicht, 5 Tage: volle Breite ohne Scrollen, Wochentag und Datum lesbar | **bestanden** |
| Wochenansicht, 7 Tage (Wochenende zugeschaltet), auch mit stark vergrößerter Systemschrift | **bestanden** — möglicher Zeilenumbruch des Datums bei sehr großer Systemschrift wird zurückgestellt (eigener Bedarf, Barrierefreiheit, sobald alle Funktionen stehen) |
| Planungsmodus: Wochentagsleiste volle Breite, kein Scrollen, gedrängte Höhe | **bestanden** |
| Ruhige Leistenhöhe der „Leiste der Ausstehenden" beim Tagwechsel | **bestanden** |
| Sprung mit Hervorhebung: springt, hebt kurz hervor, kehrt zurück | **bestanden, mit Korrektur** — siehe unten |

**Korrektur gefunden und behoben:** Der Sprung aus der Leiste der Ausstehenden
zielte auf `stand.slots[0]`, den ersten Slot in Eingabereihenfolge — unabhängig
davon, ob er zur eigenen Gruppe gehört. Erwartet und jetzt umgesetzt: der
Sprung zielt auf den ersten Slot der **eigenen** Gruppe (`gruppenzugehoerig`,
`groupMatch.ts`), fällt auf den ersten Slot der Liste zurück, wenn keiner
passt (`design.md`, Entscheidung 10, Nachtrag; `PlanungScreen.tsx`,
`AusstehendLeiste`). Regressionstests: `PlanungScreen.test.tsx`, `describe('Leiste
der ausstehenden Veranstaltungen', …)`.

## 2. Gestaltungsfragen (Aufgabe 9.2, `design.md` Open Questions)

| Prüfpunkt | Ergebnis |
|---|---|
| Ausgegrauter deaktivierter Termin — Mindestkontrast 4,5:1, auch bei hellen Paletten-Farben | **bestanden** |
| Symbol/Form der abgesetzten dritten Zeile für abgeleitete Angaben — Planungsmodus und Wochenansicht | **bestanden** (Form: eigene Zeile, vorangestelltes Symbol, gedämpfte Farbe) |

**Nebenfund, nicht Teil dieses Changes:** Für die dritte Zeile besteht der
Wunsch, statt „Eigene Gruppe" die tatsächlich zugewiesenen Gruppenkennungen zu
zeigen (fett, falls die eigene Gruppe darunter ist). Das ist eine inhaltliche
Neugestaltung, keine Korrektur der hier geprüften Form — als neuer Bedarf in
Issue #68 aufgenommen (siehe „Offene Punkte").

## 3. Migration eines Geräts mit vorgemerkten Terminen (Aufgabe 9.3)

Nicht mehr geprüft, sondern als Entscheidung gegenstandslos gemacht:
**Kein im Einsatz befindliches Gerät hält noch einen Bestand mit
`status: 'fest' | 'vorgemerkt'`.** Der Status existierte nur kurz zwischen den
Changes `stundenplan-planungsmodus-feinauswahl` (2026-09-08) und diesem. Die
vorgesehene Überführung (`design.md`, vormals Entscheidung 2) entfällt
ersatzlos: Code (`planStore.ueberfuehreAlteGestalt`), Tests und das
Spec-Delta `data-and-storage` (ADDED-Requirement „Überführung des
Terminstatus …") wurden entfernt. Ein Eintrag, der dennoch `status` statt
`deaktiviertBis` trägt, wird seither wie jeder andere schema-fremde Eintrag
einzeln verworfen und protokolliert (DATA-F-020) — Test `planStore.test.ts`,
`describe('Entfall der Terminstatus-Überführung', …)`.

## 4. Rand-Fund außerhalb dieses Changes

Die Beschriftung „Angenommener Konflikt" (`schedule.konfliktAngenommen`) wurde
als missverständlich gemeldet — das Feature `akzeptierteKonflikte` selbst ist
laut `proposal.md` von diesem Change ausdrücklich unverändert. Nicht hier
behoben; in Issue #68 aufgenommen.

## 5. Offene Punkte

- Alle mit **bestanden** ausgewiesenen Prüfpunkte gelten als Nachweis nach
  `quality-and-testing` Abschnitt 3.
- Dreizehn UI-Rückmeldungen aus demselben Gerätetest (Einrichtung-Kopfzeile,
  Pflichtfeld Gruppenkennung, separate Gruppeneingabe-Seite, Chip-Redesign für
  den Veranstaltungsstatus je Reihe, Hervorhebungs-Einstellung im
  Planungsmodus, Sperren von Prüfungen im Eigenen-Termin-Dialog,
  Rückwärtsnavigation nach dem Sichern u. a.) sowie der Fund zu
  „Angenommener Konflikt" gehen in
  [Issue #68](https://github.com/Fachschaftsrat-Informatik-FH-Dortmund/FSRaaS/issues/68)
  (nach dem Muster von Issue #62) und von dort in einen eigenen
  `openspec/changes/`-Vorschlag — bewusst **nicht** in diesen Change
  aufgenommen.
- Zeilenumbruch des Datums in der 7-Tage-Wochentagsleiste bei sehr großer
  Systemschrift: zurückgestellt, Teil einer künftigen
  Barrierefreiheits-Durchsicht.
