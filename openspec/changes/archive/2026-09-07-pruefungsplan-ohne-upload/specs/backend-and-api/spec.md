## ADDED Requirements

### Requirement: Ableitung des Prüfungsbestands aus dem Raumplan

Das System muss aus dem zwischengespeicherten Raumplan (INT-009, siehe Capability `integrations`) die Prüfungstermine ableiten und als eigenen Bestand führen. Maßgeblich sind Einträge mit `eventType: "Event"`, deren Bezeichnung dem Muster `Prüfung <Modulnummer> <Bezeichnung>` folgt; Modulnummer und Bezeichnung werden daraus herausgelöst, Raum, Datum und Uhrzeit aus den übrigen Feldern übernommen. Herkunft: NEU, entschieden 2026-09-06.

#### Scenario: Prüfungseintrag im Raumplan
- **WHEN** der Raumplan-Zwischenspeicher einen Eintrag mit `eventType: "Event"` und dem Namensmuster `Prüfung <Modulnummer> <Bezeichnung>` enthält
- **THEN** führt das System ihn im Prüfungsbestand mit Modulnummer, Bezeichnung, Raum, Datum und Uhrzeit

#### Scenario: Nicht auflösbares Namensmuster
- **WHEN** ein Eintrag als Prüfung erkennbar ist, sein Name aber keine Modulnummer nach dem Muster hergibt
- **THEN** führt das System ihn als Prüfung ohne Modulbezug im Bestand und protokolliert den Vorfall (SEC-F-060), statt ihn zu verwerfen

### Requirement: Abruf des Prüfungsbestands

Das System muss den abgeleiteten Prüfungsbestand über einen Abruf-Endpunkt bereitstellen, ohne Anmeldung und ohne Kenntnis darüber, welche Prüfungen eine einzelne Nutzerin ausgewählt hat. Herkunft: NEU, entschieden 2026-09-06.

#### Scenario: Prüfungsbestand abrufen
- **WHEN** die App den Prüfungsbestand abruft
- **THEN** liefert das System die abgeleiteten Prüfungstermine ohne Anmeldung aus

## MODIFIED Requirements

### Requirement: Allgemeine Aktualisierungsmeldung bei geändertem Prüfungsplan

Wenn sich der aus dem Raumplan abgeleitete Prüfungsbestand gegenüber dem zuvor abgeleiteten Stand unterscheidet, muss das System eine allgemeine Aktualisierungsmeldung auslösen, ohne dabei personenbezogene Auswahldaten einzelner Nutzerinnen zu verarbeiten. Herkunft: NEU, entschieden 2026-09-06; vormals API-F-200. Löst allgemein aus, ohne zu wissen, welche Nutzerin welche Prüfung ausgewählt hat; das bleibt mit dem Requirement „Verzicht auf serverseitige Speicherung persönlicher Stundenpläne" vereinbar, weil Capability `schedule` den Abgleich mit der individuellen, ausschließlich lokal gespeicherten Auswahl auf dem Gerät vornimmt.

#### Scenario: Prüfungsplan-Änderung erkannt
- **WHEN** der abgeleitete Prüfungsbestand vom zuvor abgeleiteten Stand abweicht
- **THEN** löst das System eine allgemeine Aktualisierungsmeldung ohne personenbezogene Auswahldaten aus

## REMOVED Requirements

### Requirement: Import des Prüfungsplans

**Grund:** Der Prüfungsbestand wird seit dem 2026-09-06 aus dem ohnehin abgerufenen Raumplan abgeleitet; ein Upload einer Excel-Datei findet nicht mehr statt. Der manuelle Schritt setzte eine jährlich wechselnde ehrenamtliche Person voraus — dieselbe Konstruktion, an der das abgelöste Backend `app.fsrfb4.de` gescheitert ist.

**Ersetzt durch:** „Ableitung des Prüfungsbestands aus dem Raumplan". Vormals API-F-180; die Kennung bleibt vergeben.

### Requirement: Vollständiger Ersatz des Prüfungsplan-Bestands

**Grund:** Die Anforderung regelte den Jahrgangswechsel beim Excel-Import. Der abgeleitete Bestand folgt dem Raumplan-Zwischenspeicher und wird mit jedem Abruf neu gebildet; ein gesonderter Ersatzvorgang je Jahrgang entfällt damit.

**Ersetzt durch:** „Ableitung des Prüfungsbestands aus dem Raumplan". Vormals API-F-190; die Kennung bleibt vergeben.
