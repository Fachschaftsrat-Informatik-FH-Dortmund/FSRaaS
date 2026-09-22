# Aufgaben: Einrichtung und Kursauswahl — Bedienung

Sechs Blöcke, jeder einzeln abschließbar und einzeln unterbrechbar. Block 1 ist
reine Logik ohne Darstellung, Block 2 zieht den Bildschirm heraus, ab Block 3
wird die Kopfzeile sichtbar umgebaut. Testnamen tragen den Requirement-Titel aus
`openspec/changes/einrichtung-und-kursauswahl-bedienung/specs/schedule/spec.md`
im `describe`.

## 1. Speicher und Gruppenzuordnung

- [x] 1.1 `einrichtung.ts`: `setGruppenkennung` nimmt nur noch eine nichtleere Kennung (`wert: string`), `null` entfällt; `clear()` bleibt der einzige Weg, die Kennung wieder loszuwerden (design.md, Entscheidung 6). Verifikation: `einrichtung.test.ts` mit `describe('Gruppenkennung verpflichtend vor dem Planungsmodus', …)` — Ersetzen einer gesetzten Kennung wirkt, `clear()` entfernt sie, `npx tsc --noEmit` weist jede Aufrufstelle mit `null` aus.
- [x] 1.2 `groupMatch.ts`: den Zweig `if (!gruppenkennung) return true` entfernen und den Parameter von `gruppenzugehoerig` auf `string` verengen (design.md, Entscheidung 5); den Kopfkommentar entsprechend berichtigen. Verifikation: `groupMatch.test.ts` ohne den Tabellenfall `kennung: null`, ohne `describe('SCHED-F-050 …')` und ohne den Zählfall ohne Kennung; die übrigen Fälle der Beispieltabelle bleiben grün.
- [x] 1.3 `alternativen.ts`: Parameter `gruppenkennung` ebenfalls auf `string` verengen. Verifikation: `alternativen.test.ts` grün, `npx tsc --noEmit` ohne Fehler.

## 2. Schritt zur Gruppenkennung

- [x] 2.1 Neuer Bildschirm `app/src/areas/schedule/screens/GruppenkennungScreen.tsx`: Ermittlung über die Matrikelnummer an erster Stelle, das manuelle Textfeld unmittelbar darunter, ohne Umschalter und ohne Bedienweg zum ersatzlosen Entfernen — aus `SetupScreen.tsx` übernommen, nicht neu erfunden (design.md, Entscheidung 1). Verifikation: `GruppenkennungScreen.test.tsx` mit `describe('Gruppenkennung ohne Matrikelnummer', …)` — Szenarien „Einrichtung ohne Matrikelnummer", „Voreingestellter Weg", „Kleinschreibung eingegeben".
- [x] 2.2 Kein Weg zum ersatzlosen Entfernen: eine gesetzte Kennung lässt sich überschreiben, ein leer geräumtes Eingabefeld lässt die gespeicherte Kennung stehen. Verifikation: `describe('Gruppenkennung verpflichtend vor dem Planungsmodus', …)`, Szenario „Kennung ersetzen statt entfernen" — kein Bedienweg „Entfernen" im Baum, Leeren des Felds ändert den gespeicherten Stand nicht.
- [x] 2.3 Rückmeldung „x von N Terminen" zählt allein die Termine der über den Routenparameter `module` übergebenen Module (design.md, Entscheidung 8); ohne Parameter entfällt die Rückmeldung. Verifikation: `describe('Rückmeldung während der Eingabe der Gruppenkennung', …)` — Szenarien „Eingabe ohne Treffer" und „Nicht gewählte Module zählen nicht mit".
- [x] 2.4 Route `app/app/(tabs)/(schedule)/gruppenkennung.tsx` als reines Re-Export anlegen (SHELL-F-050) und in den Stack von `_layout.tsx` aufnehmen. Verifikation: `npx tsc --noEmit` ohne Fehler, Navigationstest von der Modulauswahl auf den Schritt.

## 3. Kopfzeilen-Bedienwege

- [x] 3.1 Neues Register `app/src/areas/schedule/weiterAktion.ts` nach dem Muster von `modulauswahlAktion.ts`, mit `{ freigegeben: boolean; weiter: () => void }` und `__resetWeiterAktionForTest` (design.md, Entscheidung 2). Verifikation: `weiterAktion.test.ts` — Registrieren, Lesen, Abmelden liefert `null`.
- [x] 3.2 Neue Komponente `app/src/areas/schedule/ui/WeiterZugang.tsx` mit Symbol `arrow-forward`, `accessibilityLabel` und `accessibilityState` für den abgeblendeten Zustand; als `headerRight` von `einrichtung`, `kurse` und `gruppenkennung` in `_layout.tsx`. Verifikation: `describe('Weiterführender Bedienweg in der Kopfzeile', …)` — je ein Szenario für Einrichtung, Modulauswahl und Schritt zur Gruppenkennung.
- [x] 3.3 `ModulauswahlVerwerfenZugang.tsx`: Symbol von `close` auf `refresh` umstellen (design.md, Entscheidung 4); in der Kopfzeile der Modulauswahl steht es neben dem Weiter-Symbol. Verifikation: `describe('Symbol für das Zurücksetzen der Auswahl', …)` — Szenario „Zurücksetzen in der Kopfzeile", beide Symbole unterscheidbar.

## 4. Einrichtung und Modulauswahl

- [x] 4.1 `SetupScreen.tsx`: den gesamten Gruppenkennungs-Abschnitt entfernen (Anzeige, Entfernen-Weg, Matrikelnummer, Entwurfsfeld, Trefferrückmeldung) — die Einrichtung trägt danach allein die Endpunktauswahl. Verifikation: `SetupScreen.test.tsx` ohne den Fall „ohne Gruppenkennung fortsetzen"; `describe('Eigener Schritt für die Gruppenkennung nach der Modulauswahl', …)`, Szenario „Einrichtung ohne Gruppenkennung".
- [x] 4.2 `SetupScreen.tsx`: sichtbare Beschriftung über dem Suchfeld der Endpunktauswahl, die bei gefülltem Feld stehen bleibt (design.md, Entscheidung 7); die Schaltfläche „Weiter zur Kursauswahl" am Seitenende entfällt zugunsten des Kopfzeilen-Wegs. Verifikation: `describe('Freitextsuche in der Endpunktauswahl', …)` — Szenarien „Suche nach Kurzname" und „Beschriftung bei gefülltem Feld".
- [x] 4.3 `CourseSelectionScreen.tsx`: die Schaltfläche „Weiter zur Planung" im Fuß entfällt; der Kopfzeilen-Weg führt stattdessen mit dem Parameter `module` auf `/gruppenkennung` (design.md, Entscheidung 3). Verifikation: `describe('Eigener Schritt für die Gruppenkennung nach der Modulauswahl', …)`, Szenario „Nach der Modulauswahl" — der Weiter-Weg führt auf den Schritt, nicht in den Planungsmodus.

## 5. Durchsetzung der Pflicht

- [x] 5.1 `GruppenkennungScreen.tsx`: Der Weiter-Weg navigiert ohne gesetzte Kennung nicht, sondern benennt die fehlende Angabe (design.md, Entscheidung 6.1). Verifikation: `describe('Gruppenkennung verpflichtend vor dem Planungsmodus', …)`, Szenario „Weitergehen ohne Kennung".
- [x] 5.2 `PlanungScreen.tsx`: ohne gesetzte Kennung statt des Planungsmodus ein Leerzustand mit dem Weg auf den Schritt zur Gruppenkennung (design.md, Entscheidung 6.2). Verifikation: Rendertest, der den Leerzustand und den Bedienweg dorthin prüft.
- [x] 5.3 `ScheduleScreen.tsx`: liegen Planeinträge vor und ist keine Kennung gesetzt, einmalig je Aufbau auf `/gruppenkennung` führen und die Einträge unangetastet lassen (design.md, Entscheidung 6.3). Verifikation: `describe('Gruppenkennung verpflichtend vor dem Planungsmodus', …)`, Szenario „Bestehender Plan ohne Kennung" — Weiterleitung erfolgt, `entries` unverändert; Gegenprobe mit gesetzter Kennung ohne Weiterleitung.

## 6. Spec-Prosa und Abschluss

- [x] 6.1 Prosa in `openspec/specs/schedule/spec.md` von Hand berichtigen, die `openspec archive` nicht nachzieht (proposal.md, Impact): Beispieltabelle ohne die Zeile `(keine) | C8 | ja`, Akzeptanzkriterien ohne „keine Gruppenkennung", neue Zeile unter „UI-Flows & Zustände" für einen Plan aus einer früheren Fassung, Eintrag „Ehemals SCHED-F-050" unter „Entfallene Anforderungen (historisch)" mit ursprünglichem Text, Status und Grund. Verifikation: `node tools/spec-check/src/cli.js` grün, keine Fundstelle für den Zustand ohne Kennung mehr in der Prosa.
- [x] 6.2 Alle neuen Zeichenketten in `app/src/i18n/de.json` und `en.json`, keine im Code (NFR-F-115). Verifikation: `parity.test.ts` bleibt grün.
- [x] 6.3 Vollständiger Durchlauf: `npx tsc --noEmit`, `npm run lint`, Jest, `node tools/spec-check/src/cli.js`. Verifikation: alle vier grün, keine neue Ausnahme in der Audit-Allowlist.
- [ ] 6.4 Gerätetest des Wegs Einrichtung → Modulauswahl → Gruppenkennung → Planungsmodus, einschließlich der Bestätigung, dass die Kopfzeilen-Symbole auf dem Gerät erscheinen (proposal.md, „Erfüllte Voraussetzung"). Verifikation: datiertes Prüfprotokoll unter `specs/pruefprotokolle/`.
