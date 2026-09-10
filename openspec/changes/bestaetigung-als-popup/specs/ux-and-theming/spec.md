## ADDED Requirements

### Requirement: Bestätigungsdialoge als Pop-up

Wenn das System vor der Ausführung einer Aktion eine Entscheidung der Nutzerin einholt, dann muss es die Rückfrage als Pop-up über der Ansicht darstellen, nicht als Abschnitt am Seitenende und nicht als eingeschobenen Bereich innerhalb des Inhalts. Solange die Rückfrage offen steht, darf der auslösende Bedienweg nicht erneut auslösbar sein. Die Festlegung gilt für alle Bereiche der Anwendung und für die Verwaltungsoberfläche, und sie gilt auch für Rückfragen, die nichts zerstören. Herkunft: Recherche: Gerätetest 2026-09-09 (Issue #68), Entscheidung 2026-09-11. Aufgefallen an der Rückfrage nach dem Geltungsbereich einer Farbwahl, die am Seitenende erschien: Eine Rückfrage im Seiteninhalt kann übersehen werden, während der auslösende Bedienweg weiterhin bedienbar aussieht — der Bildschirm zeigt dann zwei Zustände gleichzeitig.

#### Scenario: Rückfrage vor einer zerstörenden Aktion
- **WHEN** die Nutzerin eine Aktion auslöst, für die das System eine Bestätigung einholt
- **THEN** erscheint die Rückfrage als Pop-up über der Ansicht

#### Scenario: Rückfrage ohne zerstörende Wirkung
- **WHEN** das System eine Entscheidung erfragt, die nichts zerstört — etwa den Geltungsbereich einer Farbwahl
- **THEN** erscheint die Rückfrage ebenfalls als Pop-up über der Ansicht

#### Scenario: Auslösender Bedienweg während der Rückfrage
- **WHEN** eine Rückfrage offen steht
- **THEN** lässt sich der Bedienweg, der sie ausgelöst hat, nicht erneut auslösen
