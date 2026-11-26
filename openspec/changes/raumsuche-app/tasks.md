## 1. Vertrag und Backend

- [x] 1.1 404-Beschreibung von `/raeume/{roomId}/belegung` in `api-contract.yaml` berichtigen (Raumplan oder kuratierte Liste, Code `raum_unbekannt`), Vertragsfassung anheben; prüfen mit `node tools/contract-codegen/src/generate.mjs` ohne Typänderung
- [x] 1.2 `GET /v1/raeume/{roomId}/belegung` in `RaumplanEndpoints.cs` umsetzen (Ortstag Europe/Berlin, nach Beginn sortiert, 404 `raum_unbekannt`, 503 ohne Bestand); Tests „Tagesbelegung eines Raums aus dem Raumplan-Zwischenspeicher" in `Fb4.Backend.Tests`, `dotnet test` grün

## 2. Datenzugriff und reine Logik der App

- [x] 2.1 `ttl.ts`: Datenart `raumbelegungJetzt` (1 Minute) und `RAUMPLAN_ABRUFTAKT` (1 Stunde); `ttl.test.ts` angepasst
- [x] 2.2 `room-finder/api.ts`: `useRaumuebersicht(zeitpunkt?)`, `useRaumStammdaten()`, `useRaumbelegung(roomId, datum)` über `openapi-fetch`, Typen nur aus `@/api/generated/schema`
- [x] 2.3 `schliesszeit.ts`: Schließzeit lesen (`HH:MM`, `HH.MM`, `HHMM`), Unlesbares protokollieren; Tests „Gepflegte Gebäudeschließzeit statt fester Wert"
- [x] 2.4 `freieRaeume.ts`: frei im Zeitraum, `freiBis`, Ausschluss ohne Raumplan-Eintrag, Filter Größenklasse und E-Key; Tests „Suche nach freien Räumen", „Raum als belegt kennzeichnen", „Raumsuche auf kuratierte Liste beschränken", „Größenklasse anzeigen und filtern", „Freizeitpunkt eines freien Raums anzeigen"
- [x] 2.5 `uebersicht.ts`: Filter nach Zustand, Suche nach Raumkennung, Gruppierung laufender Veranstaltungen; Tests „Übersicht nach Belegungszustand einschränken", „Suche nach Raumkennung in der Übersicht", „Ansicht laufender Veranstaltungen"
- [x] 2.6 `standAlter.ts`: veraltet gemessen beim Abruf, Höchstalter für `AsyncStates`; Tests „Alter eines veralteten Raumplan-Stands anzeigen"

## 3. Oberfläche

- [ ] 3.1 `AsyncStates`: optionaler Hinweisschlüssel in `quelleStand`; bestehende Tests grün, neuer Test für den eigenen Hinweistext
- [ ] 3.2 Route `app/app/(tabs)/rooms/` als Stack (`index`, `raum/[roomId]`), Tab-Layout unverändert beschriftet
- [ ] 3.3 `RoomFinderScreen` mit Sichtwahl und Offline-Kennzeichnung; Tests „Wechsel zwischen den drei Sichten", „Raumsuche offline nicht verfügbar"
- [ ] 3.4 Sicht „Freie Räume" (Zeitraum, Filter, Ergebnisliste, Leerzustand mit „Eine Stunde später"); Komponententest „Suche nach freien Räumen", „E-Key-Zugänglichkeit kennzeichnen"
- [ ] 3.5 Sicht „Übersicht" (Suche, Zustandsfilter mit Zurücksetzen, Zeilen mit laufendem Termin oder „frei bis", kuratierte Merkmale, `note`); Komponententests „Übersicht aller Räume mit Belegungszustand", „Laufende Veranstaltung bei belegtem Raum", „Größenklasse und E-Key-Kennzeichen in der Übersicht", „Freitextfeld eines Raumplan-Termins anzeigen", „Tagesbelegung aus Übersicht oder laufenden Veranstaltungen öffnen"
- [ ] 3.6 Sicht „Laufende Veranstaltungen"; Komponententest „Raum, Bezeichnung und Endzeitpunkt je laufender Veranstaltung"
- [ ] 3.7 `RoomDayScreen` (Tagesbelegung, „Raum unbekannt" bei 404); Komponententest „Belegung eines gewählten Raums anzeigen"
- [ ] 3.8 Texte de/en in `i18n`; `parity.test.ts` grün

## 4. Prüfungen und Abschluss

- [ ] 4.1 `npx jest`, `npx tsc --noEmit` (nach `node tools/contract-codegen/src/generate.mjs`), `npm run lint`, `node tools/spec-check/src/cli.js`, `openspec validate raumsuche-app` grün
- [ ] 4.2 Geräteabnahme der drei Sichten und der Tagesbelegung gegen das laufende Backend mit echtem Raumplan-Bestand (Prüfprotokoll unter `specs/pruefprotokolle/`)
