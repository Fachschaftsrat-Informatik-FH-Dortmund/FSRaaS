## 1. Speicher

- [x] 1.1 `planungseinstellungen.ts`: `rangfolge` statt `voreinstellung`, `voreinstellungAus`, `kriteriumUmschalten`, `kriteriumVerschieben`; Übernahme alter Bestände, eintragsweise Bereinigung (design.md, Entscheidung 1); Test `describe('Kriterienrangfolge für die Planung')`
- [x] 1.2 `zeitfenster` mit Prüfung und Bereinigung, an `parameterAus` durchgereicht (Entscheidung 3); Test `describe('Bevorzugtes Zeitfenster festlegen')`

## 2. Oberfläche

- [x] 2.1 `PlanungEinstellungenScreen`: Abschnitt „Reihenfolge der Kriterien" mit Schaltern, Auf-/Ab-Schaltflächen, gesperrten Randknöpfen und Ansage (Entscheidung 2); Hinweis bei eigener Rangfolge und bei leerer Rangfolge
- [x] 2.2 `PlanungEinstellungenScreen`: Abschnitt „Bevorzugtes Zeitfenster" (Entscheidung 3)
- [x] 2.3 `PlanungScreen`: Werkzeugzeile mit „Eigene Rangfolge", Kennzeichnung außerhalb des Zeitfensters (Entscheidungen 3 und 4)
- [x] 2.4 Texte de/en
- [x] 2.5 Bildschirmtests `describe('Kriterienrangfolge für die Planung')`, `describe('Bevorzugtes Zeitfenster festlegen')` in `PlanungEinstellungenScreen.test.tsx`; `describe('Kriterienrangfolge für die Planung')` und `describe('Kennzeichnung außerhalb des Zeitfensters')` in `PlanungScreen.test.tsx`

## 3. Prüfung und Abschluss

- [x] 3.1 `npx jest src/areas/schedule`, `npx tsc --noEmit`, `npm run lint`, spec-check, i18n-Parität grün
- [ ] 3.2 Geräteabnahme Android mit TalkBack: Umordnen per Pfeil, Ansage der neuen Stelle, gesperrte Randknöpfe, Zeitfenster-Kennzeichnung; Länge des Einstellungsbildschirms. Prüfprotokoll unter `specs/pruefprotokolle/`
