## 1. Berechnung der nächsten gültigen Veranstaltung

- [ ] 1.1 `naechsteGueltigeVeranstaltung(entries, jetztSek): string | null` in `wochenansicht.ts` implementieren (design.md, Entscheidung 1: wochenweises Vorrücken je Eintrag über `wochentagVonDatum`/`verschiebeDatum`, geprüft mit `imGueltigkeitszeitraum`, Deckel bei 104 Wochen) und mit `describe('Kennzeichnung eines leeren Wochentags')`-Tests in `wochenansicht.test.ts` abdecken: Eintrag mit künftigem `gueltigVon` liefert dessen erstes Vorkommen; mehrere Einträge liefern das früheste Datum; kein Eintrag mit künftigem gültigen Vorkommen liefert `null`; ein bereits laufender/vergangener Zeitraum ohne `gueltigBis`-Grenze liefert das nächste Vorkommen ab heute.

## 2. Anzeige im Leerzustand

- [ ] 2.1 `ScheduleScreen.tsx`: `naechsteGueltigeVeranstaltung` per `useMemo` (Abhängigkeiten `entries`, `jetztSek`) berechnen und nur bei `grund === 'gueltigkeitszeitraum'` als Prop an `LeererTag` reichen (design.md, Entscheidung 3).
- [ ] 2.2 `LeererTag` erweitert `schedule.tagLeerZeitraum` um den Hinweis: vorhandenes Datum → Übersetzungsschlüssel mit Datumsparameter; kein Datum → eigener Schlüssel „keine weitere Veranstaltung bekannt". Neue Schlüssel in `src/i18n/de.json` und `src/i18n/en.json` ergänzen (NFR-F-115, keine Zeichenkette fest im Code).
- [ ] 2.3 `ScheduleScreen.test.tsx`: Tests unter `describe('Kennzeichnung eines leeren Wochentags')` ergänzen für beide neuen Szenarien (Datum sichtbar / „keine bekannt" sichtbar) und den unveränderten dritten Fall (Tag ohne Termine zeigt weiterhin keinen der beiden Hinweise).

## 3. Abschluss

- [ ] 3.1 `node tools/spec-check/src/cli.js` ohne Befunde.
- [ ] 3.2 Volle Testsuite (`npm test`) grün.
