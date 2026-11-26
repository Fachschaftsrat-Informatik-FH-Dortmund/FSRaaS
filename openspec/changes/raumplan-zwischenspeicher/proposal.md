## Why

Roadmap-Schritt 6 (Raumsuche) braucht als tragenden ersten Schnitt den
Zwischenspeicher des Raumplans: Alle Sichten der Raumsuche — Freie-Raum-Suche,
Raumübersicht, laufende Veranstaltungen — und der spätere Stundenplan-Abgleich
leiten sich aus demselben Bestand ab (INT-009). Bisher gibt es im Backend
weder Abruf noch Bestand noch Endpunkt; die App-Raumsuche ist ein Platzhalter.

Der INT-009-Spike (2026-09-07) hat zwei Fallen belegt, die ein naiver Abruf
übersieht: Ohne `From`/`To` liefert `Room/*/AllEvents` nur sieben Tage, und
59 % der Kursinstanzen tragen die Pseudo-Raumkennung `*` und nennen ihren Raum
nur im Namensfeld. Beides regelt die Spec bereits; offen ist, welches Fenster,
welcher Takt und was bei einer verdächtigen Antwort geschieht.

## What Changes

- **Periodischer Abruf** von `Room/` und `Room/*/AllEvents` (INT-009) als
  Hosted Service nach dem Muster `PeriodicJobService`, stündlich, Zeitraum
  ausdrücklich über `From`/`To` (heute 00:00 Ortszeit bis 28 Tage danach).
- **Auswertung des Pseudoraums `*`**: Raumkennungen werden aus dem Namensfeld
  gelesen; ein Termin, der mehrere Räume nennt, belegt jeden davon.
- **Persistenz per EF-Migration**: Tabellen für Raumplan-Termine, Raumplan-Räume
  und den Stand des letzten Abrufs. Ein neuer Bestand ersetzt den alten nur
  vollständig und nur, wenn er die Plausibilitätsprüfung besteht.
- **Plausibilitätsprüfung**: Eine Antwort, die nur das Sieben-Tage-Standardfenster
  abdeckt, oder eine leere Antwort bei bisher gefülltem Bestand wird verworfen
  und protokolliert; der bisherige Bestand bleibt.
- **Zwei kontofreie Lese-Endpunkte** aus dem Vertrag: `GET /v1/raeume/uebersicht`
  und `GET /v1/raumplan/termine`, beide mit `standAlter`.

Nicht Teil dieses Changes: App-UI der Raumsuche, `/raeume/frei`,
`/raeume/{roomId}/belegung`, Besetzt-Meldungen (das Feld `besetztMeldungen`
wird mit `0` ausgeliefert), Offline-Warteschlange, Prüfungsbestand und
SCHED-F-410 bis SCHED-F-450.

## Capabilities

### New Capabilities

Keine.

### Modified Capabilities

- `backend-and-api`: „Raumtermine über Platzhalter-Aufruf beziehen" legt Zeitraum,
  Takt und den Umgang mit verdächtigen Antworten fest; „Übersicht aller Räume im
  Raumplan-Zwischenspeicher" regelt den Zustand vor dem ersten erfolgreichen Abruf.

## Impact

- `backend/src/Fb4.Backend/Infrastructure/Raumplan/` (neu): Client, Raumauflösung,
  Abruf-Job, Abfragen.
- `backend/src/Fb4.Backend/Domain/Raumplan.cs`, `Fb4DbContext`, neue Migration.
- `backend/src/Fb4.Backend/Endpoints/RaumplanEndpoints.cs` (neu), `Program.cs`,
  `appsettings.json` (`Raumplan:BaseUrl`).
- Keine Vertragsänderung: Pfade und Schemas stehen in `api-contract.yaml` bereits.
