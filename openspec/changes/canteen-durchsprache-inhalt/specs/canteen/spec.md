## MODIFIED Requirements

### Requirement: Wahl der Gerichte-Sortierung

Das System muss der Nutzerin ermöglichen, für die Sortierung der Gerichte — innerhalb der gewählten Gruppen oder, ohne Gruppierung, für die gesamte Liste — ein Sortierkriterium und, davon getrennt, eine Richtung (auf-/absteigend) zu wählen. Kriterium und Richtung werden als zwei eigenständige Auswahlfelder angeboten, nicht als vorkombinierte Einträge, damit jede Kombination erreichbar bleibt. Herkunft: NEU, entschieden 2026-09-04, Trennung der Richtungswahl bestätigt 2026-09-05; vormals MENSA-F-305.

#### Scenario: Sortierkriterium mit Richtung wählen
- **WHEN** die Nutzerin ein Sortierkriterium und eine Richtung wählt
- **THEN** sortiert das System die Gerichte innerhalb der Gruppen bzw. der gesamten Liste entsprechend

#### Scenario: Kriterium und Richtung getrennt wählbar
- **WHEN** die Nutzerin die Sortierauswahl öffnet
- **THEN** bietet das System das Kriterium und die Richtung in zwei getrennten Auswahlfeldern an

### Requirement: Voreingestelltes Preset

Ohne vorherige eigene Wahl muss das System das Preset „Mensa, günstigstes zuerst" als Voreinstellung verwenden. Herkunft: NEU, entschieden 2026-09-05; vormals MENSA-F-335.

#### Scenario: Erstes Öffnen ohne eigene Wahl
- **WHEN** die Nutzerin die Hauptansicht ohne vorherige eigene Preset-Wahl öffnet
- **THEN** ist das Preset „Mensa, günstigstes zuerst" aktiv

### Requirement: Einordnung unbewerteter Gerichte ans Ende

Trägt ein Gericht beim gewählten Bewertungs-Sortierkriterium keine Bewertung, muss das System es unabhängig von der gewählten Richtung ans Ende der Sortierung einordnen; mehrere unbewertete Gerichte untereinander in der Reihenfolge der Quelle (INT-015). Herkunft: NEU, entschieden 2026-09-04, Ordnung der unbewerteten Gerichte geändert 2026-09-05; vormals MENSA-F-365.

#### Scenario: Gericht ohne Bewertung
- **WHEN** bei aktivem Bewertungs-Sortierkriterium ein Gericht keine Bewertung trägt
- **THEN** ordnet das System es ans Ende der Sortierung ein, mehrere unbewertete Gerichte untereinander in der Reihenfolge der Quelle

#### Scenario: Kein Gericht trägt eine Bewertung
- **WHEN** bei aktivem Bewertungs-Sortierkriterium kein Gericht des angezeigten Tages eine Bewertung trägt
- **THEN** entspricht die Reihenfolge innerhalb jeder Gruppe der Reihenfolge der Quelle
