## 1. Reine Logik

- [x] 1.1 `typen.ts`: `istAlternative` durch `einblendung: { art: 'alternative' | 'nichtGewaehlt'; modulKey }` ersetzen, `alternativenDesTages` und `ScheduleScreen` nachziehen (design.md, Entscheidung 1); `npx tsc --noEmit` grün, bestehende Alternativen-Tests grün
- [x] 1.2 `alternativen.ts`: `nichtGewaehlteDesTages` (Module ohne Planeintrag, Rohtermin nur einmal, ein Rohtermin eines gewählten Moduls nie als nicht gewählt); Tests „Einblenden nicht gewählter Veranstaltungen" in `alternativen.test.ts`
- [x] 1.3 `ansichtEinstellungen.ts`: Schalter `alleEinblenden`, Vorgabe `false`; Test „Einblenden nicht gewählter Veranstaltungen" (Vorgabe abgeschaltet, umschaltbar) in `ansichtEinstellungen.test.ts`

## 2. Wochenansicht

- [x] 2.1 Ansichts-Blatt (`VerwaltungsblattZugang`): Schalter „Alle Veranstaltungen zeigen" neben dem Alternativen-Schalter; Komponententest in `VerwaltungsblattZugang.test.tsx`
- [x] 2.2 `ScheduleScreen`: Auswahlbestand abrufen, sobald einer der Einblendungsschalter aktiv ist; eingeblendete Termine durch `termineDesTages` (Gültigkeitszeitraum, design.md Entscheidung 2); Kennzeichen „Nicht gewählt"; keine Wirkung auf Konflikthinweis und Jetzt-Anzeige. Bildschirmtests „Einblenden nicht gewählter Veranstaltungen": Schalter an, Schalter aus, kein Konflikt bei zeitgleichem eigenem Termin
- [x] 2.3 `ScheduleScreen`: Tipp auf nicht gewählten Termin öffnet `ConfirmDialog`, „Nicht aufnehmen" vorbelegt, Zustimmung führt nach `/planung?module=<modulKey>`. Bildschirmtests „Aufnehmen eines Moduls aus der Einblendung": Rückfrage, Zustimmung, Ablehnung
- [x] 2.4 Texte de/en in `i18n`; `parity.test.ts` grün

## 3. Prüfungen und Abschluss

- [x] 3.1 `npx jest src/areas/schedule`, `npx tsc --noEmit` (nach `node tools/contract-codegen/src/generate.mjs`), `npm run lint`, spec-check und `openspec validate alle-veranstaltungen-einblenden` grün
- [ ] 3.2 Geräteprüfung bei eingeschaltetem Schalter: Bleiben die Kacheln vieler überschneidender Termine lesbar und einzeln treffbar (44×44 dp)? Beobachtung, keine Festlegung (proposal.md, Offener Punkt; Requirement „Nebeneinanderdarstellung überschneidender Termine"). Ergebnis als Prüfprotokoll unter `specs/pruefprotokolle/`
