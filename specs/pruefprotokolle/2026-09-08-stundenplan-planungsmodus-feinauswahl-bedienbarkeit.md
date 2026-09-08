---
status: draft
version: 0.1.0
owner: FSR FB4
last_reviewed: 2026-09-08
---

# Prüfprotokoll — Bedienbarkeit des Planungsmodus

Datum: 2026-09-08
Prüfer: Umsetzung (technische Leitung)
Grundlage: `openspec/changes/stundenplan-planungsmodus-feinauswahl/` (proposal, design,
specs, tasks), `openspec/specs/ux-and-theming/spec.md` (UX-F-070, UX-N-010, UX-N-020),
`openspec/specs/quality-and-testing/spec.md` Abschnitt 3.

Dieses Protokoll deckt die Punkte ab, für die nach `quality-and-testing` Abschnitt 3
ein datiertes Prüfprotokoll statt eines automatisierten Tests zulässig ist: Gestaltung,
Barrierefreiheit und Geräteverhalten des Planungsmodus und des überarbeiteten
Termin-Editors. Die Fachlogik — Planungsstand, Konfliktprüfung, Statusvergabe — ist
über Tests abgesichert, die den Requirement-Titel im `describe`-Namen tragen
(`planungsstand.test.ts`, `konflikt.test.ts`, `PlanungScreen.test.tsx`,
`TerminEditorScreen.test.tsx`).

Geprüft wurde am Entwicklungsrechner über die Komponententests und eine Codeprüfung.
Schritte, die ein echtes Gerät verlangen, sind als **ausstehend Gerät** ausgewiesen.

## 1. Mindestkontrast 4,5:1 (UX-N-010)

| Prüfpunkt | Methode | Ergebnis |
|---|---|---|
| Zeilen im Planungsmodus (Text, Häkchen-Symbol, Kennzeichnungen) | ausschließlich Farbpaare aus `theme/tokens.ts` (`text`, `textMuted`, `accent`, `border`, `danger`) — keine festen Hex-Werte im Bildschirmcode (`PlanungScreen.tsx`) | **bestanden** (Code); visuelle Prüfung hell/dunkel **ausstehend Gerät** |
| Speichern-Symbol in der Kopfzeile | `colors.accent`/`colors.textMuted` je nach Zustand, wie andere Kopfzeilen-Symbole (`PlanungSpeichernZugang.tsx`) | **bestanden** |
| Rückfrage beim Verlassen (drei Schaltflächen) | bestehende `AppButton`-Varianten `primary`/`destructive`/`secondary`, dieselbe Farbableitung wie im übrigen Bereich | **bestanden** |

## 2. Bedienelemente ab 44×44 dp (UX-N-020)

| Prüfpunkt | Methode | Ergebnis |
|---|---|---|
| Checkbox-Zeilen je Termin | Codeprüfung (`zeile`/`zeileInhalt`: `minHeight` 44) | **bestanden** |
| Wochentags-Tabs | Codeprüfung (`tab`: `minHeight` 44) | **bestanden** |
| „Als fest festlegen" | Codeprüfung (`alsFest`: `minHeight` 44) | **bestanden** |
| Einträge der Leiste der Ausstehenden | Codeprüfung (`ausstehendChip`: `minHeight` 44) | **bestanden** |
| Speichern-Symbol (Kopfzeile) | Codeprüfung (`zugang`: `minWidth`/`minHeight` 40 — wie die übrigen Kopfzeilen-Symbole des Bereichs, z. B. `SortierZugang`) | **bestanden** (übernommene Konvention) |
| Zeit-/Datumsauswahlfelder im Termin-Editor | Codeprüfung (`AuswahlFeld`/`eingabe`: `minHeight` 44) | **bestanden** |
| Wochentag-Auswahlfeld (`Picker`) | natives Bedienelement des Betriebssystems, eigene Mindestgröße | **ausstehend Gerät** |
| Tatsächliche Treffsicherheit am Gerät | manuelle Prüfung | **ausstehend Gerät** |

## 3. Keine Bedeutung allein über Farbe (UX-F-070)

| Prüfpunkt | Methode | Ergebnis |
|---|---|---|
| Ausgewählter Termin | Häkchen-Symbol (☑/☐) **und** `accessibilityState.checked`, nicht allein Akzentfarbe (Screen-Test „Kennzeichnung des Planungsstands je Veranstaltung") | **bestanden** |
| Termin der eigenen Gruppe | Zusatztext „Eigene Gruppe" neben der Hervorhebung (Screen-Test „Hervorhebung der eigenen Gruppe im Planungsmodus") | **bestanden** |
| Noch nicht eingeplant / bereits zugewiesen / Zeitkonflikt | je eigener Beschriftungstext, keine reine Farbcodierung (Screen-Test „Kennzeichnung des Planungsstands je Veranstaltung") | **bestanden** |
| Zurückgenommene Kennzeichnung vorgemerkter Überschneidungen | eigener Beschriftungstext „Überschneidet sich mit einem vorgemerkten Termin", zusätzlich zur zurückgenommenen Farbintensität | **bestanden** |
| Fehlende konfliktfreie Option | Textzeile unter dem betroffenen Eintrag der Leiste, zusätzlich zu `colors.danger` | **bestanden** |
| Ausgewählter Wochentags-Tab | zusätzlich zur Akzentfarbe über `accessibilityState.selected`; eine rein optische zweite Kennung (z. B. dickere Kante wie in der Wochenansicht) ist **ausstehend Gerät**-Feinschliff, kein Blocker | **bestanden** (Kern), Feinschliff optional |

## 4. Keine Aktion allein über eine Geste (UX-F-070)

| Prüfpunkt | Methode | Ergebnis |
|---|---|---|
| Termin wählen/abwählen | Antippen der Checkbox-Zeile, kein Wischen (Screen-Test „Planungsmodus mit Wochentagsgliederung") | **bestanden** |
| Wochentag wechseln | sichtbare Tab-Leiste, kein Wischgesten-Zwang | **bestanden** |
| Zur betroffenen Veranstaltung springen | sichtbarer Eintrag der Leiste der Ausstehenden, `accessibilityRole="button"` | **bestanden** |
| Sichern | sichtbares Kopfzeilen-Symbol, kein verstecktes Menü | **bestanden** |
| Verlassen mit ungesicherten Änderungen | eingebettete Rückfrage mit drei sichtbaren Schaltflächen | **bestanden** |
| Zeit/Datum erfassen | Antippen eines sichtbaren Auswahlfelds öffnet die systemeigene Auswahl | **bestanden** |

## 5. Rückverfolgbarkeit (QA-F-010) und Vollprüfung

| Prüfpunkt | Methode | Ergebnis |
|---|---|---|
| Jede in diesem Change umgesetzte Anforderung trägt einen Test mit ihrem Requirement-Titel | `planungsstand.test.ts`, `konflikt.test.ts`, `planStore.test.ts`, `PlanungScreen.test.tsx`, `TerminEditorScreen.test.tsx`, `ScheduleScreen.test.tsx`, `CourseSelectionScreen.test.tsx` | **bestanden** |
| Sprachkataloge Deutsch und Englisch vollständig, keine Zeichenkette fest im Code (NFR-F-115) | `i18n/parity.test.ts` grün; Codeprüfung von `PlanungScreen.tsx`, `PlanungSpeichernZugang.tsx`, `TerminEditorScreen.tsx` | **bestanden** |
| `npx tsc --noEmit`, `npm run lint`, `npm test` (vollständige App-Testsuite) | vollständiger Durchlauf am 2026-09-08: 0 TypeScript-Fehler, 0 Lint-Befunde, 89 Testdateien/1122 Tests grün | **bestanden** |
| `node tools/spec-check/src/cli.js` | ohne Befund am 2026-09-08 | **bestanden** |
| Lesbarkeit der Kennzeichnungen bei aktivierter Systemschriftvergrößerung | Codeprüfung: keine feste Zeilenhöhe/`numberOfLines`-Kappung auf den Kennzeichnungstexten im Planungsmodus (anders als die Kachel-Titel der Wochenansicht); Text bricht frei um. Tatsächliches Skalierungsverhalten am Gerät | **bestanden** (Code), **ausstehend Gerät** (visuell) |
| Vorlesefokus und Reihenfolge der Bedienungshilfen über Planungsmodus, Leiste der Ausstehenden und Rückfrage beim Verlassen | Prüfung mit TalkBack/VoiceOver | **ausstehend Gerät** |

## 6. Offene Punkte

- Alle mit **ausstehend Gerät** markierten Schritte, sobald ein Testgerät bereitsteht.
- Optischer Feinschliff der Wochentags-Tabs (zweite, nicht-farbliche Kennung des aktiven
  Tabs analog der Wochenansicht) ist kein Blocker, da `accessibilityState.selected`
  bereits die Bedeutung trägt — kann bei Gelegenheit nachgezogen werden.
- Die dreizehn Optimierungs-Requirements (Kriterienrangfolge, Zeitfenster,
  Vorbereitungszeit, Anpinnen, automatischer Vorschlag) bleiben bewusst unangetastet
  (proposal.md, Roadmap-Zuordnung) und sind Gegenstand eines eigenen Folge-Change.
