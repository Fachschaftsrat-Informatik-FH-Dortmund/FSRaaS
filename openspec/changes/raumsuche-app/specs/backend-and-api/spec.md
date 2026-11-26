## ADDED Requirements

### Requirement: Tagesbelegung eines Raums aus dem Raumplan-Zwischenspeicher

Wenn die App die Belegung eines Raums für einen Tag anfragt, muss das Backend alle Termine dieses Raums aus dem Raumplan-Zwischenspeicher liefern, die diesen Tag (Ortszeit Europe/Berlin) berühren, zusammen mit dem Alter des Bestands. Die Termine sind nach Beginn sortiert. Dazu zählen auch Termine, deren Raum allein aus dem Namensfeld ermittelt wurde. Bekannt ist ein Raum, wenn ihn der Raumplan-Zwischenspeicher oder die kuratierte Raumliste führt. Für eine unbekannte Kennung muss das Backend mit 404 und dem Code `raum_unbekannt` antworten. Herkunft: NEU, Change `raumsuche-app`, 2026-11-26. Liefert wie die Raumübersicht nur eine weitere Projektion des vorgehaltenen Bestands, kein zusätzlicher externer Abruf. Aus Übersicht oder Serienform lässt sich die Tagesbelegung nicht exakt herleiten: Die Serienform verschweigt, in welcher Woche ein Termin stattfindet.

#### Scenario: Raum mit Terminen am Tag
- **WHEN** die App die Belegung eines im Raumplan geführten Raums für einen Tag anfragt, an dem zwei Termine in ihm liegen
- **THEN** liefert das Backend beide Termine nach Beginn sortiert mit dem Alter des Bestands

#### Scenario: Nicht kuratierter Raum
- **WHEN** die App die Belegung eines Raums anfragt, den der Raumplan führt, der aber nicht auf der kuratierten Liste steht
- **THEN** liefert das Backend dessen Termine, keine 404

#### Scenario: Unbekannter Raum
- **WHEN** die App die Belegung einer Kennung anfragt, die weder der Raumplan noch die kuratierte Liste führt
- **THEN** antwortet das Backend mit 404 und dem Code `raum_unbekannt`

#### Scenario: Kein Bestand vorhanden
- **WHEN** die App die Belegung anfragt, bevor ein erster Abruf des Raumplans gelungen ist
- **THEN** antwortet das Backend wie die Raumübersicht mit 503 und dem Code `raumplan_nicht_verfuegbar`
