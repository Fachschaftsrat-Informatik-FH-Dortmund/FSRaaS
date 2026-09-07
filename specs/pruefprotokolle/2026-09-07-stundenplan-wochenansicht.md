---
status: draft
version: 0.1.0
owner: FSR FB4
last_reviewed: 2026-09-07
---

# Prüfprotokoll — Wochenansicht des Stundenplans

Datum: 2026-09-07
Prüfer: Umsetzung (technische Leitung)
Grundlage: `openspec/specs/schedule/spec.md` (Requirements „Fünf-Tage-Ansicht",
„Wochentagsleiste mit bedarfsweisem Samstag" bis „Kein Konflikthinweis bei vorgemerkten
Terminen", „Anlegen eigener Termine" bis „Wiederkehrend oder einmalig bei eigenen
Terminen", „Schalter zum Abschalten aller Filter"),
`openspec/changes/stundenplan-wochenansicht/` (proposal, design, tasks),
`openspec/specs/quality-and-testing/spec.md` Abschnitt 3,
`openspec/specs/ux-and-theming/spec.md` (UX-F-070/UX-N-010/UX-N-020),
`openspec/specs/non-functional/spec.md` (NFR-F-115).

Dieses Protokoll deckt die Punkte ab, für die nach `quality-and-testing` Abschnitt 3 ein
datiertes Prüfprotokoll statt eines automatisierten Tests zulässig ist: Gestaltung,
Barrierefreiheit und Geräteverhalten. Die Fachlogik — Konfliktmodell, Filterwirkung,
Wochenrechnung, Tageslayout, Editor-Validierung — ist über Tests abgesichert, die den
Requirement-Titel im `describe`-Namen tragen (Abschnitt 5).

Geprüft wurde am Entwicklungsrechner über die Komponententests und eine Codeprüfung.
Schritte, die ein echtes Gerät verlangen (Vorlesefokus, Bildwiederholrate beim Blättern,
tatsächliche Fingergröße), sind als **ausstehend Gerät** ausgewiesen.

## 1. Mindestkontrast 4,5:1 (UX-N-010)

| Prüfpunkt | Methode | Ergebnis |
|---|---|---|
| Beschriftung einer Terminkachel gegen die Terminfarbe | `farbe.ts` `textfarbeFuerHintergrund` wählt Schwarz oder Weiß nach WCAG-Leuchtdichte; die jeweils bessere Option erreicht rechnerisch stets ≥ 4,58:1 (`farbe.test.ts`), zusätzlich geprüft in `screens/TerminDetailScreen.test.tsx` („Farbwahl je Termin") | **bestanden** |
| Alle sechs Farben der `SCHEDULE_PALETTE` in der Farbwahl der Termindetails | dieselbe Ableitung je Fläche, Häkchen in der abgeleiteten Textfarbe | **bestanden** |
| Übrige Flächen (Wochentagsleiste, Filterleiste, Hinweise, Leerzustände) | ausschließlich Farbpaare aus `theme/tokens.ts` (`text`/`background`, `onAccent`/`accent`, `onBanner`/`banner`, `textMuted`) — keine festen Hex-Werte im Bildschirmcode | **bestanden** (Code); visuelle Prüfung hell/dunkel **ausstehend Gerät** |
| Lückenbeschriftung („30 Minuten frei") auf `textMuted` | Codeprüfung; `textMuted` ist im Farbsystem für Sekundärtext freigegeben | **bestanden** (Code); Geräteprüfung **ausstehend Gerät** |

## 2. Bedienelemente ab 44×44 dp (UX-N-020)

| Prüfpunkt | Methode | Ergebnis |
|---|---|---|
| Blätterknöpfe „Vorige Woche"/„Nächste Woche" | Codeprüfung (`blaettern`: `minWidth`/`minHeight` 44) | **bestanden** |
| Wochentags-Chips | Codeprüfung (`tagChip`: `minWidth` 64, `minHeight` 60) | **bestanden** |
| Schalterzeilen der Filterleiste und des Editors | Codeprüfung (`schalterZeile`: `minHeight` 44; die Zeile ist samt Beschriftung anwählbar) | **bestanden** |
| Farbfelder in den Termindetails | Codeprüfung (44 × 44, rund) | **bestanden** |
| Schaltflächen (`AppButton`) | bestehende Grundgestaltung, `minHeight`/`minWidth` 44 (`ui/primitives.tsx`) | **bestanden** |
| Terminkachel auf der proportionalen Achse | `DP_JE_MINUTE = 1,5` — der kürzeste im Bestand vorkommende Termin (30 min) ergibt 45 dp; zusätzlich `minHeight: 44` an der Kachel als Untergrenze | **bestanden**; siehe Befund 1 |
| Textfelder des Editors | Codeprüfung (`eingabe`: `minHeight` 44) | **bestanden** |
| Tatsächliche Treffsicherheit am Gerät | manuelle Prüfung | **ausstehend Gerät** |

**Befund 1 (bewusst in Kauf genommen):** Ein Termin unter 30 Minuten wird durch
`minHeight: 44` etwas höher gezeichnet, als seine Dauer es proportional verlangte. Die
Bedienbarkeit geht hier der exakten Proportion vor; im geprüften INT-002-Bestand kommt
kein Termin unter 45 Minuten vor. Im Code an `DP_JE_MINUTE` dokumentiert.

## 3. Keine Bedeutung allein über Farbe (UX-F-070)

| Prüfpunkt | Methode | Ergebnis |
|---|---|---|
| Eigener Termin | Text „Eigener Termin" auf der Kachel und im Bedienungshilfen-Namen (`screens/ScheduleScreen.test.tsx`, „Kennzeichnung eigener Termine") | **bestanden** |
| Vorgemerkter Termin | Text „Vorgemerkt" (Requirement „Unterscheidung vorgemerkter Termine", Screen-Test) | **bestanden** |
| Gruppenfremder Termin | Text „Andere Gruppe" (Screen-Test) | **bestanden** |
| Prüfungstermin | Text „Prüfung" **und** linke Randmarkierung (Screen-Test „Visuelle Kennzeichnung von Prüfungsterminen") | **bestanden** |
| Konflikthinweis gegen angenommenen Konflikt | zwei verschiedene Texte („Konflikt" / „Angenommener Konflikt"), Screen-Test hält sie auseinander | **bestanden** |
| Laufender Termin | Text „Läuft gerade" **und** verstärkter Rahmen (Screen-Test) | **bestanden** |
| Aktuelle Uhrzeit auf der Achse | Marke mit Bedienungshilfen-Namen „Jetzt 10:30"; die Marke trägt zusätzlich zur Farbe eine eigene Position und Form | **bestanden** (Logik); visuelle Prüfung **ausstehend Gerät** |
| Ausgewählter Wochentag in der Leiste | zusätzlich zur Akzentfläche eine dickere untere Kante (`tagChipAktiv`) sowie `accessibilityState.selected` | **bestanden** (Code); visuelle Prüfung **ausstehend Gerät** |
| Aktiver Schalter „alle Filter abschalten" | Schalterzustand **und** der Satz „Alle Filter sind abgeschaltet." (Screen-Test) | **bestanden** |
| Leerer Tag | Symbol „—", Titel und Fließtext, der den wirksamen Filter benennt | **bestanden** |

## 4. Keine Aktion allein über eine Geste (UX-F-070)

| Prüfpunkt | Methode | Ergebnis |
|---|---|---|
| Wochenwechsel | sichtbare Knöpfe „Vorige Woche"/„Nächste Woche" und „Zur laufenden Woche"; kein Wischen nötig (Screen-Test „Blättern über Wochengrenzen") | **bestanden** |
| Tageswechsel | anwählbare Chips der Wochentagsleiste (`accessibilityRole="tab"`) | **bestanden** |
| Termin öffnen | Antippen der Kachel, ein Ziel je Termin, auch bei Überschneidung einzeln erreichbar (Screen-Test „Nebeneinanderdarstellung überschneidender Termine") | **bestanden** |
| Bearbeiten und Löschen eines eigenen Termins | sichtbare Schaltflächen in den Termindetails, kein Wischen oder langes Drücken (Screen-Test „Bearbeiten und Löschen eigener Termine über sichtbaren Weg") | **bestanden** |
| Löschen mit Rückfrage | zweistufige Bestätigung im Bildschirm selbst, mit Abbrechen (Screen-Test) — kein Datenverlust ohne Rückfrage (DATA-F-020) | **bestanden** |
| Konflikt annehmen | sichtbare Schaltfläche je offenem Paar in den Termindetails | **bestanden** |

## 5. Rückverfolgbarkeit (QA-F-010) und Vollprüfung

| Prüfpunkt | Methode | Ergebnis |
|---|---|---|
| Jede in diesem Schnitt umgesetzte Anforderung trägt einen Test mit ihrem Requirement-Titel | `konflikt.test.ts`, `zeitachse.test.ts`, ergänzte Fälle in `planStore.test.ts` und `ansichtEinstellungen.test.ts`, `screens/ScheduleScreen.test.tsx`, `screens/TerminDetailScreen.test.tsx`, `screens/TerminEditorScreen.test.tsx` | **bestanden** |
| Sprachkataloge Deutsch und Englisch vollständig, keine Zeichenkette fest im Code (NFR-F-115) | `i18n/parity.test.ts` grün; Codeprüfung der drei neuen Bildschirme | **bestanden** |
| Routendateien sind reine Re-Exporte (SHELL-F-050) | Tests „Routendatei der Termindetails" / „Routendatei des Termin-Editors" | **bestanden** |
| `npx tsc --noEmit`, `npm run lint`, Jest, `node tools/spec-check/src/cli.js` | vollständiger Durchlauf am 2026-09-07 | **bestanden** |
| Bildwiederholrate beim Blättern zwischen Wochen und Tagen (NFR-N-040) | Messung am Gerät | **ausstehend Gerät** |
| Vorlesefokus und Reihenfolge der Bedienungshilfen über die Wochenansicht | Prüfung mit TalkBack/VoiceOver | **ausstehend Gerät** |

## 6. Offene Punkte

- Alle mit **ausstehend Gerät** markierten Schritte, sobald ein Testgerät bereitsteht.
- Die Eingrenzung der Wochenansicht auf ein Fachsemester — vom Requirement „Schalter zum
  Abschalten aller Filter" als dritter Filter genannt und im Requirement „Leerer Tag bei
  wirksamem Filter" mit einem eigenen Szenario belegt — ist nicht umgesetzt: Ein
  Planeintrag trägt kein Fachsemester, es ließe sich aus dem gespeicherten Bestand nicht
  ableiten. Umgesetzt sind die beiden übrigen Filter der Wochenansicht (Gruppenfilterung
  und Gültigkeitszeitraum). Siehe den Abschnitt „Nicht in diesem Schnitt" in
  `openspec/changes/stundenplan-wochenansicht/tasks.md` und GitHub-Issue #51.
