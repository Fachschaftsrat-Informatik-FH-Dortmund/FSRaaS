---
status: draft
version: 0.1.0
owner: FSR FB4
last_reviewed: 2026-09-07
---

# Prüfprotokoll — Mensa-Kontext in der Gerichtsliste

Datum: 2026-09-07
Prüfer: Umsetzung (technische Leitung)
Grundlage: `openspec/changes/canteen-mensa-kontext/` (proposal, design, tasks),
`openspec/specs/canteen/spec.md` (Requirements „Ausweis der anbietenden Mensa ohne
Mensa-Gliederung", „Öffnungszeit an der Mensa-Abschnittsüberschrift",
„Wiedereröffnungshinweis an der geschlossenen Mensa", „Hinweis bei vollständig
gefilterter Mensa", „Gliederung nach Mensa-Auswahlreihenfolge bei aktiver
Mensa-Gruppierung", „Geschlossen-Hinweis für Mensa ohne Angebot", „Keine
Öffnungszeit für Mensa ohne Angebot", „Nicht auswählbare Chips ohne sichtbaren
Abschnitt", „Beschriftung des Reihenfolge-Kriteriums nach seiner Bedeutung"),
`openspec/specs/quality-and-testing/spec.md` Abschnitt 3,
`openspec/specs/ux-and-theming/spec.md` (Mindestkontrast 4,5:1, Bedienelemente
≥ 44×44 dp), `openspec/specs/non-functional/spec.md` (NFR-F-115).

Dieses Protokoll deckt die drei Punkte ab, für die nach `quality-and-testing`
Abschnitt 3 ein datiertes Prüfprotokoll statt eines automatisierten Tests
zulässig ist (Gestaltung, Barrierefreiheit, Geräteverhalten): Kontrast der
Öffnungszeit-Angabe, Umbruchverhalten der Abschnittskopfzeile und Lesbarkeit
des Geschlossen-Abschnitts mit Screenreader. Die Fachlogik — Öffnungszeit- und
Wiedereröffnungsauflösung, Abschnittsaufbau für geschlossene/gefilterte Mensen,
Bildschirmintegration, Beschriftungen — ist vollständig über Tests abgesichert,
die den Requirement-Titel im `describe`-Namen tragen (`oeffnungszeiten.test.ts`,
`sortierung.test.ts`, `screens/CanteenScreen.test.tsx`,
`screens/CanteenScreen.wochenende.test.tsx`,
`screens/SortierGruppierScreen.test.tsx`, `sortierPreset.test.ts`).

## 1. Kontrast der Öffnungszeit-Angabe gegen `colors.surface`

Die Angabe an der Abschnittsüberschrift trägt `color: colors.text` auf
`backgroundColor: colors.surface` (design.md D5) — bewusst nicht
`colors.textMuted`, das auf `surface` nur rund 4,2:1 erreicht.

| Erscheinungsbild | `text` | `surface` | WCAG-Kontrastverhältnis | Ergebnis |
|---|---|---|---|---|
| Hell | `#1C1C1E` | `#F2F2F7` | ≈ 15,3:1 (rechnerisch nach der WCAG-2-Formel) | **bestanden** (rechnerisch); visuelle Bestätigung **ausstehend Gerät** |
| Dunkel | `#F2F2F7` | `#1C1C1E` | ≈ 15,3:1 (dieselbe Farbpaarung, vertauschte Rollen — Kontrastverhältnis ist symmetrisch) | **bestanden** (rechnerisch); visuelle Bestätigung **ausstehend Gerät** |

Beide Werte liegen deutlich über den geforderten 4,5:1 (Capability
`ux-and-theming`). Die Farbwerte stammen aus `app/src/theme/tokens.ts`
(`LIGHT`/`DARK`); die Rechnung ist reine Farbarithmetik und geräteunabhängig,
die visuelle Bestätigung (Rendering, Anti-Aliasing, Systemschriftgröße) steht
noch aus.

## 2. Umbruch der Kopfzeile bei langem Mensa-Namen auf schmalem Gerät

| Prüfpunkt | Methode | Ergebnis |
|---|---|---|
| Kopfzeile aus Name und Öffnungszeit-Angabe: `flexDirection: 'row'`, `alignItems: 'center'`, `flexWrap: 'wrap'`, `gap: 8` — die Angabe rutscht bei zu wenig Platz unter den Namen statt ihn abzuschneiden (design.md D5) | Codeprüfung (`styles.sektionKopf` in `CanteenScreen.tsx`) | **bestanden** (Code); Verhalten bei einem tatsächlich langen Mensa-Namen auf einem schmalen Gerät **ausstehend Gerät** |
| Überschrift bei Mensa-Gruppierung auch bei nur einem Abschnitt sichtbar (design.md D6, Requirement „Öffnungszeit an der Mensa-Abschnittsüberschrift", Scenario „Einzige gewählte Mensa") | Screen-Test `screens/CanteenScreen.test.tsx` | **bestanden** |
| Name bleibt vollständig lesbar, kein Abschneiden über `numberOfLines`/Ellipse (der Titel-Text trägt keine Zeilenbegrenzung) | Codeprüfung (`styles.sektionTitel` ohne `numberOfLines`) | **bestanden** (Code); Geräteprüfung mit einem mehrzeiligen Namen **ausstehend Gerät** |

## 3. Lesbarkeit des Geschlossen-Abschnitts mit Screenreader

| Prüfpunkt | Methode | Ergebnis |
|---|---|---|
| Abschnittsüberschrift trägt weiterhin nur den Mensa-Namen als Text — kein zusätzliches, nicht vorgelesenes Symbol (Requirement „Keine Öffnungszeit für Mensa ohne Angebot") | Codeprüfung (`kopfName` ohne Symbol/Icon im geschlossenen Fall) | **bestanden** (Code); Vorlesereihenfolge mit VoiceOver/TalkBack **ausstehend Gerät** |
| Geschlossen- und Wiedereröffnungshinweis stehen als ein zusammenhängender `Text`-Block direkt unter der Überschrift, statt als zwei getrennte, für den Screenreader eigenständig fokussierbare Elemente | Codeprüfung (`abschnitt.art === 'geschlossen'` rendert einen einzelnen `<Text>`) + Screen-Test `screens/CanteenScreen.test.tsx` (`describe('Geschlossen-Hinweis für Mensa ohne Angebot', …)`) | **bestanden** |
| Hinweistext bleibt eine Aussage über die Öffnung, nie über das Angebot („wieder geöffnet", nicht „wieder Gerichte") — keine stille Falschaussage an Feiertagen/vorlesungsfreier Zeit (SEC-F-060, design.md D1) | Codeprüfung (`mensa.wiederGeoeffnet` in `de.json`/`en.json`) + Einheitentest `oeffnungszeiten.test.ts` (`describe('Wiedereröffnungshinweis an der geschlossenen Mensa', …)`) | **bestanden** |
| Kein Kontrastverlust durch die gedämpfte Zeile — sie nutzt `colors.textMuted`, wie die übrigen Hinweiszeilen im Fußbereich | Codeprüfung (`styles.hinweisZeile` mit `colors.textMuted`, unverändert gegenüber dem bisherigen Fußbereich) | **bestanden** (Code); Kontrastmessung auf dem Gerät **ausstehend Gerät** |

## 4. Rückverfolgbarkeit (QA-F-010)

| Prüfpunkt | Methode | Ergebnis |
|---|---|---|
| Jeder der neun geänderten/neuen Requirement-Titel des Changes kommt in mindestens einem `describe`-Namen vor | Durchsicht `oeffnungszeiten.test.ts`, `sortierung.test.ts`, `screens/CanteenScreen.test.tsx`, `screens/CanteenScreen.wochenende.test.tsx`, `screens/SortierGruppierScreen.test.tsx`, `sortierPreset.test.ts` | **bestanden** |
| App-Testsuite grün, `tsc --noEmit` sauber, `eslint .` sauber | `npm test`, `npm run typecheck`, `npm run lint` im Ordner `app/` | **bestanden** |
| Spec-Prüfung `tools/spec-check` ohne Befund | `node src/cli.js` im Ordner `tools/spec-check/` | **bestanden** |
| `openspec validate --changes canteen-mensa-kontext` ohne Fehler | Task 5.3 | **bestanden** |

## 5. Offene Geräteschritte

Alle mit **ausstehend Gerät** markierten Zeilen — visuelle Bestätigung des
rechnerischen Kontrasts, Umbruchverhalten bei einem tatsächlich langen
Mensa-Namen, Vorlesereihenfolge mit VoiceOver/TalkBack, Kontrastmessung der
gedämpften Hinweiszeile — werden beim nächsten Gerätetest-Durchlauf gemeinsam
mit den offenen Punkten aus `2026-09-07-canteen-sortieren-gruppieren.md`
abgearbeitet. Kein Punkt blockiert die fachliche Abnahme des Changes; die
Fachlogik ist vollständig testgedeckt.
