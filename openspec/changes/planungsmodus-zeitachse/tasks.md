## 1. Logik

- [x] 1.1 `planungZeitachse.ts`: Spaltenvergabe, Lücken, Zahl der unmittelbaren Überschneidungen je Element (design.md, Entscheidung 1); Test `describe('Zeitachse im Planungsmodus')`
- [x] 1.2 `planungseinstellungen.ts`: `zeitachse: boolean` mit Bereinigung (Entscheidung 5)

## 2. Oberfläche

- [x] 2.1 Umschalter am Ende der Werkzeugzeile (Entscheidung 5)
- [x] 2.2 Zeitachsen-Darstellung mit Mindestspaltenbreite und waagerechtem Verschieben (Entscheidungen 2 und 3)
- [x] 2.3 Kachel mit Wahl, Kennzeichnungen und Überschneidungsangabe (Entscheidung 4)
- [x] 2.4 Sprung aus der Leiste in der Zeitachse (Entscheidung 6)
- [x] 2.5 Texte de/en
- [x] 2.6 Bildschirmtests `describe('Zeitachse im Planungsmodus')` in `PlanungScreen.test.tsx`

## 3. Prüfung und Abschluss

- [x] 3.1 `npx jest src/areas/schedule`, `npx tsc --noEmit`, `npm run lint`, spec-check, i18n-Parität grün
- [ ] 3.2 Geräteabnahme Android: Umschalten, Lesbarkeit der Kacheln, waagerechtes Verschieben bei vielen Parallelgruppen, TalkBack-Ansage der Überschneidungen. Prüfprotokoll unter `specs/pruefprotokolle/`
