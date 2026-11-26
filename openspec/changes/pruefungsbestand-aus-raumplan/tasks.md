## 1. Vertrag

- [x] 1.1 `api-contract.yaml` auf 0.8.0: `Pruefungstermin.raeume` statt `roomId`, Schema `Pruefungsbestandsvollstaendigkeit`, Pflichtfeld `vollstaendigkeit` in der Antwort von `/stundenplan/pruefungsplan`, Beschreibung der Erkennung am Namen; Nachweis: `node tools/spec-check/src/cli.js` grün
- [x] 1.2 Typen erzeugen (`npm run generate` in `tools/contract-codegen`); Nachweis: `npm run check` grün, `Contract.cs` und `schema.ts` führen `Raeume`/`raeume` und `Vollstaendigkeit`

## 2. Erkennung

- [x] 2.1 `PruefungsErkennung` (NFC, Leitwort `Prüfung`/`Prüfungen`, Modulnummer fünf- bis sechsstellig, Bezeichnung ohne Modulbezug = Rest nach dem Leitwort); Nachweis: Tests unter „Ableitung des Prüfungsbestands aus dem Raumplan" für Muster, `Prüfung Softwaretechnik 2`, Plural-Eintrag, `Prüfungsvorbereitung`, zerlegtes Umlaut

## 3. Abruf und Bestand

- [x] 3.1 `RaumplanAbruf`: Zeitraumberechnung mit Dauer und Standardfenster-Erkennung als statische Methoden auslagern, Verhalten unverändert; Nachweis: bestehende `RaumplanZwischenspeicherTests` grün
- [x] 3.2 Domänenklassen `Pruefungstermin`, `PruefungsbestandStand` im `Fb4DbContext`, EF-Migration `Pruefungsbestand`; Nachweis: `dotnet build` grün, Migration erzeugt beide Tabellen
- [x] 3.3 `PruefungsbestandAbruf`: 183 Tage, Plausibilitätsprüfung, Zusammenführung je (Name, Beginn, Ende) mit Raumvereinigung, vollständiges Ersetzen, Änderungserkennung ohne abgelaufene Prüfungen, Warnung bei Rückgang auf null; Nachweis: Tests „Ableitung des Prüfungsbestands aus dem Raumplan" (Vorlauf, mehrere Räume, ohne Raum, verdächtige Antwort, Antwort keine Liste) und „Allgemeine Aktualisierungsmeldung bei geändertem Prüfungsplan" (Änderung erkannt, vergangene Prüfung fällt heraus, unveränderter Bestand)
- [x] 3.4 `PruefungsbestandAbrufJob` (sechs Stunden, `PeriodicJobService`) in `Program.cs` registrieren, nur ergänzend; Nachweis: `dotnet build` grün, Registrierung neben `RaumplanAbrufJob` (Jobs hängen an der Verbindungszeichenfolge und laufen in der TestAppFactory nicht; der Job selbst ist ein Dreizeiler über dem getesteten `PruefungsbestandAbruf`)

## 4. Endpunkte

- [x] 4.1 `GET /v1/stundenplan/pruefungsplan` (anmeldefrei, `vollstaendigkeit`, `standAlter`, 503 `pruefungsbestand_nicht_verfuegbar` ohne Bestand); Nachweis: Tests „Abruf des Prüfungsbestands" und „Unvollständigkeit ist Teil des Bestands" über die TestAppFactory
- [x] 4.2 `GET /v1/stundenplan/pruefungsplan/stand` (`geaendertAm`, `null` vor erster Ableitung); Nachweis: Tests „Abfrage-Endpunkt für den Prüfungsplan-Änderungszeitpunkt"

## 5. Abschluss

- [x] 5.1 `specs/product/roadmap.md` Abschnitt 5: Umgang mit der Prüfungslücke als entschieden (2026-09-10) vermerken, Fassung und `last_reviewed` fortschreiben
- [x] 5.2 `dotnet test`, `npm run check` in `tools/contract-codegen`, `node tools/spec-check/src/cli.js`, `openspec validate pruefungsbestand-aus-raumplan` grün
