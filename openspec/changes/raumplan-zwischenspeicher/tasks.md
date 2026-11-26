## 1. Abruf INT-009

- [x] 1.1 `RaumplanQuelleOptions` (Basisadresse aus `Raumplan:BaseUrl`, nur https) und `FbwsRaumplanClient` für `Room/` und `Room/*/AllEvents` mit `From`/`To`
- [x] 1.2 `RaumAufloesung`: Raumkennungen aus dem Namensfeld bei `roomId = *`, Auffüllregel für `timeBegin`/`timeEnd`

## 2. Persistenz

- [x] 2.1 Domänenklassen `RaumplanTermin`, `RaumplanRaum`, `RaumplanStand` im `Fb4DbContext`
- [x] 2.2 EF-Migration `RaumplanZwischenspeicher`

## 3. Abruf-Job

- [x] 3.1 `RaumplanAbruf`: Zeitraum berechnen, Plausibilitätsprüfung, vollständiges Ersetzen, Stand fortschreiben
- [x] 3.2 `RaumplanAbrufJob` (stündlich, `PeriodicJobService`) in `Program.cs` registrieren

## 4. Lese-Endpunkte

- [x] 4.1 `GET /v1/raeume/uebersicht` (Belegungszustand, aktueller/nächster Termin, kuratierte Merkmale, 503 ohne Bestand)
- [x] 4.2 `GET /v1/raumplan/termine` (Serienform, Filter `studiengang`)

## 5. Tests und Prüfungen

- [x] 5.1 Tests mit Requirement-Titel: Pseudoraum, Zeitraum, Plausibilität, Übersicht, Termine
- [x] 5.2 `dotnet test`, `node tools/spec-check/src/cli.js`, contract-codegen `--check` grün
