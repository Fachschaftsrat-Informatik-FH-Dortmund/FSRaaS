---
status: draft
version: 0.1.0
owner: FSR FB4
last_reviewed: 2026-09-08
---

# Prüfprotokoll — Einrichtung über Endpunkte statt Studiengang und Fachsemester

Datum: 2026-09-08
Prüfer: Umsetzung (technische Leitung)
Grundlage: `openspec/specs/schedule/spec.md` (Requirements „Auswahl der Endpunkte des
Lehrangebots", „Gruppierung der Endpunkte in der Auswahl", „Auffangkorb für nicht
zuzuordnende Endpunkte", „Freitextsuche in der Endpunktauswahl", „Dauerhafter Zugang zur
Einrichtung", „Gliederung der Modulauswahl nach Fachsemester", „Modulauswahl ohne
Veranstaltungsart und Gruppen-Slot", „Gruppenkennung ohne Matrikelnummer"),
`openspec/changes/stundenplan-einrichtung-endpunkte/` (proposal, design, tasks),
`openspec/specs/quality-and-testing/spec.md` Abschnitt 3, `openspec/specs/ux-and-theming/spec.md`
(UX-F-070/UX-N-010/UX-N-020).

Dieses Protokoll deckt die Punkte ab, für die nach `quality-and-testing` Abschnitt 3 ein
datiertes Prüfprotokoll statt eines automatisierten Tests zulässig ist: Gestaltung,
Barrierefreiheit und Geräteverhalten der neuen Endpunkt- und Modulliste. Die Fachlogik —
Gruppenableitung, Migration, Terminabruf, Semesterwechsel-Erkennung — ist über Tests
abgesichert, die den Requirement-Titel im `describe`-Namen tragen.

Geprüft wurde am Entwicklungsrechner über die Komponententests und eine Codeprüfung.
Schritte, die ein echtes Gerät verlangen, sind als **ausstehend Gerät** ausgewiesen.

## 1. Mindestkontrast 4,5:1 (UX-N-010)

| Prüfpunkt | Methode | Ergebnis |
|---|---|---|
| Endpunkt- und Modulzeilen (Text, Häkchen-Symbol) | ausschließlich Farbpaare aus `theme/tokens.ts` (`text`, `textMuted`, `accent`, `border`) — keine festen Hex-Werte im Bildschirmcode (`SetupScreen.tsx`, `CourseSelectionScreen.tsx`) | **bestanden** (Code); visuelle Prüfung hell/dunkel **ausstehend Gerät** |
| Rückfrage vor dem Entfernen von Planeinträgen (Abwahl-Bestätigung) | `AppButton`-Varianten `primary`/`destructive` aus `ui/primitives.tsx`, dieselbe Farbableitung wie im übrigen Bereich | **bestanden** |
| Kopfzeilen-Element „Einrichtung bearbeiten" | `colors.accent` auf `colors.background`, wie der übrige Bedienweg-Text des Bereichs | **bestanden** |

## 2. Bedienelemente ab 44×44 dp (UX-N-020)

| Prüfpunkt | Methode | Ergebnis |
|---|---|---|
| Endpunkt-Checkbox-Zeilen | Codeprüfung (`zeile`: `minHeight` 44) | **bestanden** |
| Modul-Checkbox-Zeilen | Codeprüfung (`zeile`: `minHeight` 44) | **bestanden** |
| Freitextsuche (Endpunkte und Module) | Codeprüfung (`input`/`suche`: `minHeight` 44) | **bestanden** |
| Gruppenkennungs-Textfeld (manuell) | Codeprüfung (`input`: `minHeight` 44) | **bestanden** |
| Kopfzeilen-Element „Einrichtung bearbeiten" | Codeprüfung (`einrichtungLink`: `minHeight` 44) | **bestanden** |
| Rückfrage-Schaltflächen beim Abwählen eines Moduls | bestehende `AppButton`-Grundgestaltung (`minHeight`/`minWidth` 44) | **bestanden** |
| Tatsächliche Treffsicherheit am Gerät | manuelle Prüfung | **ausstehend Gerät** |

## 3. Keine Bedeutung allein über Farbe (UX-F-070)

| Prüfpunkt | Methode | Ergebnis |
|---|---|---|
| Gewählter Endpunkt/gewähltes Modul | Häkchen-Symbol (☑/☐) **und** `accessibilityState.checked`, nicht allein Akzentfarbe (Screen-Tests „Auswahl der Endpunkte des Lehrangebots", „Modulauswahl ohne Veranstaltungsart und Gruppen-Slot") | **bestanden** |
| Rückfallliste aktiv (INT-001 nicht erreichbar) | Bannertext mit Altershinweis, nicht allein Bannerfarbe (Screen-Test „SCHED-F-254") | **bestanden** |
| Unvollständige Gruppenkennung | Text „Unvollständig — bitte auch die Zahl angeben" | **bestanden** |
| Rückfrage vor dem Entfernen von Planeinträgen | zwei unterscheidbare Beschriftungen („Nein, nur abwählen" / „Ja, Termine entfernen"), destruktive Aktion nie die hervorgehobene Variante (UX-F-180/185) | **bestanden** |

## 4. Keine Aktion allein über eine Geste (UX-F-070)

| Prüfpunkt | Methode | Ergebnis |
|---|---|---|
| Endpunkt wählen/abwählen | Antippen einer sichtbaren Checkbox-Zeile, kein Wischen (Screen-Test „Auswahl der Endpunkte des Lehrangebots") | **bestanden** |
| Modul wählen/abwählen | dieselbe Checkbox-Zeile im Modulbildschirm | **bestanden** |
| Zur Einrichtung wechseln | sichtbares Kopfzeilen-Element, kein verstecktes Menü (Screen-Test „Dauerhafter Zugang zur Einrichtung") | **bestanden** |
| Abschnittswechsel in der Modulliste | anwählbare Chips der `AnkerListe` (`accessibilityRole="tab"`), wie im Mensaplan bereits geprüft | **bestanden** (übernommene Komponente) |
| Entfernen bestehender Planeinträge beim Abwählen | zweistufige, im Bildschirm eingebettete Rückfrage mit zwei sichtbaren Schaltflächen, vorbelegt auf „nein" (Screen-Test „Abwahl eines Moduls mit vorhandenen Planeinträgen") | **bestanden** |

## 5. Rückverfolgbarkeit (QA-F-010) und Vollprüfung

| Prüfpunkt | Methode | Ergebnis |
|---|---|---|
| Jede in diesem Change umgesetzte Anforderung trägt einen Test mit ihrem Requirement-Titel | `fbwsClient.test.ts`, `endpunktzeitraum.test.ts`, `endpunkte.test.ts`, `einrichtung.test.ts`, `api.test.ts`, `semesterwechsel.test.ts`, `kursbaum.test.ts`, `kurssuche.test.ts`, `screens/SetupScreen.test.tsx`, `screens/CourseSelectionScreen.test.tsx`, `screens/ScheduleScreen.test.tsx` | **bestanden** |
| Sprachkataloge Deutsch und Englisch vollständig, keine Zeichenkette fest im Code (NFR-F-115) | `i18n/parity.test.ts` grün; Codeprüfung der drei geänderten Bildschirme | **bestanden** |
| Vertragstest gegen den echten INT-001/INT-002-Bestand (Requirement „Vertragstest gegen Fremdsysteme") | `fbwsClient.contract.test.ts`, `npm run test:contract` — läuft außerhalb der Standardsuite, live gegen `ws.inf.fh-dortmund.de` verifiziert am 2026-09-08 | **bestanden** |
| `npx tsc --noEmit`, `npm run lint`, Jest (`npm test`), `node tools/spec-check/src/cli.js` | vollständiger Durchlauf am 2026-09-08 | **bestanden** |
| Vorlesefokus und Reihenfolge der Bedienungshilfen über Einrichtung und Modulauswahl | Prüfung mit TalkBack/VoiceOver | **ausstehend Gerät** |

## 6. Offene Punkte

- Alle mit **ausstehend Gerät** markierten Schritte, sobald ein Testgerät bereitsteht.
- Dieser Change schreibt bewusst noch nichts in den persönlichen Plan (design.md,
  Non-Goals) — die Modulauswahl sammelt Kandidaten, ohne Veranstaltungsart und
  Gruppen-Slot abzufragen. Der Weg in den Plan entsteht erst mit dem unmittelbar
  anschließend umzusetzenden Change `stundenplan-planungsmodus-feinauswahl`.
- Das Kommando `npm run test:contract` ruft echte Fremdsysteme über das Netz auf und
  läuft deshalb außerhalb der CI-Standardsuite (`jest.contract.config.js`) — bei einer
  strukturellen Änderung von INT-001/INT-002 muss es weiterhin händisch oder über einen
  separaten, netzfähigen CI-Lauf ausgeführt werden.
