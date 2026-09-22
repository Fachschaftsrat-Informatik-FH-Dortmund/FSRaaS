## RENAMED Requirements

- FROM: `### Requirement: News und Mensa-Speisepläne über Zwischenspeicher`
- TO: `### Requirement: News und Mensa-Speisepläne über das Backend`

## MODIFIED Requirements

### Requirement: News und Mensa-Speisepläne über das Backend

Das System muss News und Mensa-Speisepläne ausschließlich über das eigene Backend beziehen, nicht durch direkten App-Aufruf der jeweiligen Quelle. Ob das Backend die Daten dabei in einem eigenen Bestand vorhält oder unmittelbar durchreicht, bleibt der jeweiligen Datenart überlassen und ist für die App nicht erkennbar. Herkunft: NEU (vormals ARCH-F-050), am 2026-09-22 von „Zwischenspeicher" auf „Backend" umformuliert, nachdem der Mensa-Zwischenspeicher entfallen ist. Die Regel selbst bleibt unverändert: die App spricht kein Fremdsystem direkt an — auch nicht die vom FSR selbst betriebene Mensa-Schnittstelle, damit Kuration der Mensa-Auswahl, Verknüpfung mit Bewertungen und Fotos sowie die einheitliche Fehlerbehandlung an einer Stelle bleiben.

#### Scenario: Speiseplan laden
- **WHEN** die App den Mensa-Speiseplan anzeigt
- **THEN** bezieht sie ihn über das eigene Backend, nie direkt aus der Mensa-Quelle

#### Scenario: Mensa-Schnittstelle des FSR
- **WHEN** geprüft wird, ob die App die vom FSR betriebene Mensa-Schnittstelle unmittelbar aufruft
- **THEN** trifft das nicht zu — auch dieser Aufruf läuft über das eigene Backend
