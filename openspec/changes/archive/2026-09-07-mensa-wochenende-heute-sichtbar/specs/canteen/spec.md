## ADDED Requirements

### Requirement: Aktueller Tag als Ausgangspunkt der Tagesauswahl

Beim Öffnen der Hauptansicht muss das System den aktuellen Tag als gewählten Tag führen, auch wenn dieser ein Samstag oder Sonntag ist und keine der gewählten Mensen an ihm ein Angebot führt. Herkunft: NEU, entschieden 2026-09-05.

#### Scenario: Öffnen an einem Werktag
- **WHEN** die Nutzerin die Hauptansicht an einem Werktag öffnet
- **THEN** ist der aktuelle Tag der gewählte Tag

#### Scenario: Öffnen an einem angebotsfreien Wochenendtag
- **WHEN** die Nutzerin die Hauptansicht an einem Samstag oder Sonntag öffnet, an dem keine der gewählten Mensen ein Angebot führt
- **THEN** ist der aktuelle Tag der gewählte Tag und das System zeigt für ihn den Leerzustand „kein Angebot"

## MODIFIED Requirements

### Requirement: Überspringen angebotsfreier Wochenendtage

Falls an einem Samstag oder Sonntag keine der gewählten Mensen ein Angebot führt, muss das System diesen Tag beim Blättern und Wischen überspringen; den aktuellen Tag muss das System davon ausnehmen und nie überspringen. Ein Wochenendtag ist damit erreichbar, wenn er ein Angebot führt oder wenn er der aktuelle Tag ist. Herkunft: NEU, Ausnahme für den aktuellen Tag entschieden 2026-09-05 (vormals MENSA-F-044).

#### Scenario: Samstag ohne Angebot
- **WHEN** an einem Samstag, der nicht der aktuelle Tag ist, keine der gewählten Mensen ein Angebot führt
- **THEN** überspringt das System diesen Tag beim Blättern und beim Wischen

#### Scenario: Rückblättern auf einen angebotsfreien aktuellen Wochenendtag
- **WHEN** der aktuelle Tag ein Samstag oder Sonntag ohne Angebot ist und die Nutzerin von einem Folgetag zurückblättert oder zurückwischt
- **THEN** wechselt das System auf den aktuellen Tag, statt ihn zu überspringen

#### Scenario: Vorblättern vom angebotsfreien aktuellen Wochenendtag
- **WHEN** der aktuelle Tag ein Samstag ohne Angebot ist und die Nutzerin vorwärts blättert
- **THEN** überspringt das System den folgenden Sonntag ohne Angebot und zeigt den Montag
