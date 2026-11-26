## 1. Reine Logik

- [x] 1.1 `farbe.ts`: `aufgehellteFlaeche(farbe, hintergrund, anteil)`; Tests „Zurückgenommene Darstellung eingeblendeter Termine" in `farbe.test.ts` (Mischung, Kontrast ≥ 4,5:1 für jede Palettenfarbe auf hellem und dunklem Hintergrund)
- [x] 1.2 `einblendungsStand.ts`: Sitzungsstand für beide Schalter mit `alleAbschalten`, ohne Speicherzugriff; Tests „Einblendung nur für die laufende Sitzung" in `einblendungsStand.test.ts` (Vorgabe aus, kein Schreiben in den Speicher, Stand bleibt über Hook-Instanzen erhalten)
- [x] 1.3 `ansichtEinstellungen.ts`: Felder `alternativenEinblenden`/`alleEinblenden` entfernen, Altwerte beim Laden verwerfen; Test „Einblendung nur für die laufende Sitzung" (gespeicherter Altwert wird verworfen) in `ansichtEinstellungen.test.ts`

## 2. Oberfläche

- [x] 2.1 `VerwaltungsblattZugang`: beide Schalter aus dem Sitzungsstand, Beschriftung „Alternativtermine einblenden"; Komponententests angepasst
- [x] 2.2 `ScheduleScreen`: Kachelstil eingeblendeter Termine (aufgehellte Fläche, gestrichelter Rahmen in Veranstaltungsfarbe) für beide Arten; Bildschirmtest „Eingeblendeter Termin neben eigenem Termin"
- [x] 2.3 `ScheduleScreen`: `AlternativeUebernehmenBlatt` durch `ConfirmDialog` ersetzen, Titel und Angabezeile für beide Arten; Bildschirmtests „Alternativtermin antippen" sowie bestehende Übernahme- und Aufnahmetests grün
- [x] 2.4 `ui/EinblendungChip.tsx` und Einbindung in `WochenansichtKopfzeile` (`app/(tabs)/(schedule)/_layout.tsx`); Komponententests „Hinweis auf aktive Einblendung in der Kopfzeile": Einblendung aktiv, keine Einblendung aktiv, Chip antippen
- [x] 2.5 Texte de/en in `i18n`; `parity.test.ts` grün

## 3. Prüfungen und Abschluss

- [x] 3.1 `npx jest src/areas/schedule`, `npx tsc --noEmit` (nach `node tools/contract-codegen/src/generate.mjs`), `npm run lint`, spec-check und `openspec validate alternativtermine-abgesetzt-und-sitzungsweise` grün
- [ ] 3.2 Geräteabnahme Android in hellem und dunklem Thema: eingeblendete Termine klar von eigenen unterscheidbar, Rückfrage beim Antippen verständlich, Chip in der Kopfzeile lesbar und treffbar, Einblendung nach Neustart aus. Ergebnis als Prüfprotokoll unter `specs/pruefprotokolle/` und Kommentar in Issue #77
