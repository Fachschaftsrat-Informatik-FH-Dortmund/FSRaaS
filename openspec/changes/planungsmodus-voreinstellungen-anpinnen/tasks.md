## 1. Kriterien und Voreinstellungen

- [x] 1.1 `planungskriterien.ts`: acht Kriterien als Bewertung eines Planentwurfs (design.md, Entscheidung 1), lexikographischer Vergleich; Test `describe('Reihung nach der Kriterienrangfolge')`
- [x] 1.2 Fünf Voreinstellungen mit fester Reihenfolge; Test `describe('Kriterienrangfolge für die Planung')` (Szenario „Voreinstellung wählen")
- [x] 1.3 Zielwert je Veranstaltungsart mit allgemeinem Rückfall; Test `describe('Vorbereitungszeit je Veranstaltungsart')`

## 2. Einstellungen und Anpinnen (Daten)

- [x] 2.1 `planungseinstellungen.ts`: Voreinstellung, Vorbereitungszeiten, Mindestabstand; gerätelokal, feldweise Bereinigung
- [x] 2.2 `angepinnt?: boolean` in `typen.ts`, Prüfung in `planStore.ts`; Test `describe('Anpinnen eines Termins')`

## 3. Vorschlag und Rücknahme (Logik)

- [x] 3.1 `planungsvorschlag.ts`: Reihen, Gruppen-Slots, greedy Belegung, Konflikt mit Beteiligten; Tests `describe('Automatischer Planungsvorschlag')` und `describe('Gemeinsames Umlegen der Termine eines Gruppen-Slots')`
- [x] 3.2 Angepinnte Reihen bleiben feste Umgebung; Test `describe('Konfliktprüfung gegenüber angepinnten Terminen')`
- [x] 3.3 Einteilung nach Gruppenkennung; Tests `describe('Rücknahme einer übernommenen Optimierung')` und `describe('Ausgangszustand ohne Optimierung')`

## 4. Oberfläche

- [ ] 4.1 Werkzeugzeile im Planungsmodus: Voreinstellung, „Vorschlag erzeugen", „Nach Gruppe einteilen"; Vorschlag ersetzt den Zwischenstand der betroffenen Reihen, Kennzeichnung „vom Vorschlag", Konflikthinweis über `ConfirmDialog`
- [ ] 4.2 Pin-Schalter an gewählten Zeilen, gesammelt bis zum Sichern
- [ ] 4.3 `PlanungEinstellungenScreen` samt Route `planung-einstellungen`
- [ ] 4.4 Texte de/en
- [ ] 4.5 Bildschirmtests in `PlanungScreen.test.tsx` und `PlanungEinstellungenScreen.test.tsx`

## 5. Prüfung und Abschluss

- [ ] 5.1 `npx jest src/areas/schedule`, `npx tsc --noEmit`, `npm run lint`, spec-check, i18n-Parität grün
- [ ] 5.2 Hinweis des Vorschlags auf die „Pflicht"-Markierung (Requirement „Automatischer Planungsvorschlag", Szenario „Keine konfliktfreie Konstellation"). Hängt an der noch nicht umgesetzten Pflicht-Markierung und bleibt offen, bis sie kommt.
- [ ] 5.3 Geräteabnahme Android: Werkzeugzeile passt, Vorschlag und Rücknahme wirken, Pin übersteht Sichern und erneuten Aufruf. Prüfprotokoll unter `specs/pruefprotokolle/`
