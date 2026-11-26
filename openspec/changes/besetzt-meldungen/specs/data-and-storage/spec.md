## ADDED Requirements

### Requirement: Status der Offline-Warteschlange einsehbar

Solange die Offline-Warteschlange Einträge enthält, muss das System der Nutzerin anzeigen, welche Schreibvorgänge auf ihre Übertragung warten und welche dauerhaft fehlgeschlagen sind. Herkunft: NEU, Change `besetzt-meldungen`, 2026-11-26. Hebt die Vorgabe „Sichtbarkeit" aus dem Abschnitt „Offline-Warteschlange für Schreibvorgänge" in ein prüfbares Requirement; zuvor stand sie nur in der Erläuterung.

#### Scenario: Wartender Eintrag ohne Netz
- **WHEN** ein Schreibvorgang ohne Netzverbindung eingereiht wurde
- **THEN** zeigt das System ihn als wartend an, bis er übertragen ist

#### Scenario: Eintrag älter als die Verfallsfrist
- **WHEN** ein Eintrag der Warteschlange älter als 7 Tage ist
- **THEN** entfernt das System ihn aus der Warteschlange und protokolliert den Verfall, statt ihn weiter anzuzeigen
