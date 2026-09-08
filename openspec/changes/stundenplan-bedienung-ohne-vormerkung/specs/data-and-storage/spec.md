## ADDED Requirements

### Requirement: Überführung des Terminstatus in den Deaktiviert-Zustand

Wenn beim Laden des lokal gespeicherten Stundenplans ein Eintrag den entfallenen Status „fest" oder „vorgemerkt" trägt, dann muss das System ihn überführen: „vorgemerkt" wird zu einem dauerhaft deaktivierten, „fest" zu einem aktiven Eintrag. Alle übrigen Angaben des Eintrags bleiben unverändert. Das System darf keinen Eintrag wegen des entfallenen Feldes verwerfen und muss die Überführung protokollieren. Ein Eintrag, der weder das alte Feld noch den neuen Zustand trägt, gilt als aktiv. Herkunft: NEU, entschieden 2026-09-08 (Issue #62). Der Status „fest"/„vorgemerkt" entfällt in der Capability `schedule`; auf den Geräten, die bereits einen Plan tragen, steht er weiterhin im gespeicherten Bestand. Das bestehende Requirement „Kein kommentarloses Löschen bei inkonsistentem Bestand" verbietet, solche Einträge als unlesbar zu behandeln.

#### Scenario: Gespeicherter Eintrag mit Status „vorgemerkt"
- **WHEN** ein gespeicherter Eintrag den Status „vorgemerkt" trägt
- **THEN** führt das System ihn nach dem Laden als dauerhaft deaktiviert, mit allen übrigen Angaben unverändert

#### Scenario: Gespeicherter Eintrag mit Status „fest"
- **WHEN** ein gespeicherter Eintrag den Status „fest" trägt
- **THEN** führt das System ihn nach dem Laden als aktiv, mit allen übrigen Angaben unverändert

#### Scenario: Eintrag ohne Zustandsangabe
- **WHEN** ein gespeicherter Eintrag weder den alten Status noch den neuen Zustand trägt
- **THEN** führt das System ihn als aktiv, statt ihn zu verwerfen
