## MODIFIED Requirements

### Requirement: Ratenbegrenzung kontofreier Schreibpfade

Das System muss die Anzahl eingehender kontofreier Schreibanfragen je Quelle und Zeitfenster begrenzen und eine abgewiesene Anfrage mit dem Status 429 und einer Angabe beantworten, wann ein erneuter Versuch möglich ist. Quelle ist die Netzadresse der Anfrage (bei IPv6 ihr /64-Präfix); das Backend zählt sie ausschließlich flüchtig im Arbeitsspeicher und speichert sie weder zur Meldung noch in einem eigenen Bestand. Herkunft: NEU (vormals API-N-015); Quelle und Antwort festgelegt im Change `besetzt-meldungen`, 2026-11-26. Betroffen sind insbesondere Helfer-Anmeldungen und Besetzt-Meldungen der Raumsuche, die kein Konto im Sinne einer Identität kennen. Der Schwellwert ist konfigurierbar und so großzügig gewählt, dass mehrere Personen hinter einer gemeinsamen Adresse des Hochschulnetzes nicht behindert werden.

#### Scenario: Zu viele Besetzt-Meldungen von einer Quelle
- **WHEN** dieselbe Anfragequelle innerhalb eines Zeitfensters mehr kontofreie Schreibanfragen sendet als erlaubt
- **THEN** weist das Backend weitere Anfragen dieser Quelle für den Rest des Zeitfensters ab

#### Scenario: Antwort bei greifender Begrenzung
- **WHEN** das Backend eine kontofreie Schreibanfrage wegen der Ratenbegrenzung abweist
- **THEN** antwortet es mit 429 im einheitlichen Fehlerformat und dem Kopf `Retry-After`

#### Scenario: Quelle wird nicht gespeichert
- **WHEN** eine kontofreie Schreibanfrage angenommen wird
- **THEN** enthält der gespeicherte Datensatz keine Netzadresse und keine andere Kennung der Quelle

## ADDED Requirements

### Requirement: Idempotente Besetzt-Meldung

Wenn eine Besetzt-Meldung mit einer bereits verarbeiteten Idempotenz-Kennung erneut eingeht, muss das Backend sie als bereits verarbeitet erkennen, sie nicht doppelt zählen und eine bereits zurückgezogene Meldung nicht wieder in Kraft setzen. Herkunft: NEU, Change `besetzt-meldungen`, 2026-11-26. Gegenstück zum Requirement „Idempotente Bewertungsabgabe" für den ersten kontofreien Schreibpfad; sichert die Offline-Warteschlange ab (Capability `architecture`). Die Idempotenz-Kennung ist zugleich die Kennung, unter der die meldende Person ihre Meldung zurückziehen kann; sie verlässt das Gerät nur in den beiden Anfragen der meldenden Person und wird in keiner Leseantwort ausgeliefert.

#### Scenario: Erneute Übertragung einer Besetzt-Meldung
- **WHEN** eine Besetzt-Meldung mit derselben Idempotenz-Kennung ein zweites Mal eintrifft
- **THEN** erkennt das Backend sie als bereits verarbeitet und zählt sie nicht doppelt

#### Scenario: Kennung für einen anderen Raum wiederverwendet
- **WHEN** eine Besetzt-Meldung mit einer Idempotenz-Kennung eintrifft, die bereits für einen anderen Raum verarbeitet wurde
- **THEN** weist das Backend sie mit 409 ab
