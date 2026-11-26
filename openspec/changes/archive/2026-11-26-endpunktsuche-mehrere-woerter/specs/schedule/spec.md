## MODIFIED Requirements

### Requirement: Freitextsuche in der Endpunktauswahl

Das System muss eine Freitextsuche über die Endpunktauswahl bereitstellen, die Klarnamen und Kurznamen berücksichtigt. Besteht der Suchtext aus mehreren durch Leerraum getrennten Wörtern, muss das System einen Endpunkt genau dann zeigen, wenn jedes dieser Wörter in seinem Klarnamen oder Kurznamen vorkommt, unabhängig von der Reihenfolge der Wörter, von Groß- und Kleinschreibung und von diakritischen Zeichen; ein Wort darf dabei auch Teil eines längeren Wortes sein. Das Suchfeld muss eine sichtbare Beschriftung tragen, die auch dann stehen bleibt, wenn die Nutzerin bereits Text eingegeben hat; ein Platzhaltertext allein genügt nicht. Herkunft: NEU, entschieden 2026-09-08, Beschriftung ergänzt 2026-09-11 nach dem Gerätetest vom 2026-09-09 (Issue #68), Suche über mehrere Wörter ergänzt 2026-11-26 nach Issue #56. Der Bestand umfasst nach der Live-Abfrage vom 2026-09-08 einundzwanzig auswählbare Endpunkte über acht Gruppen; wer seinen Studiengang kennt, soll ihn nicht durch alle Gruppen suchen müssen. Ein Platzhalter verschwindet mit dem ersten Zeichen; wer die Eingabe später wieder aufnimmt, sieht dann ein unbeschriftetes Feld. Studierende nennen ihren Studiengang in eigenen Worten und eigener Reihenfolge — „Bachelor Technisch" muss „Bachelor Informatik (StgPO 2019), VR Technische Inf." finden, obwohl beide Wörter darin nicht unmittelbar aufeinander folgen.

#### Scenario: Suche nach Kurzname
- **WHEN** die Nutzerin den Kurznamen eines Endpunkts eingibt
- **THEN** zeigt das System den zugehörigen Endpunkt

#### Scenario: Beschriftung bei gefülltem Feld
- **WHEN** die Nutzerin einen Suchbegriff eingegeben hat
- **THEN** bleibt die Beschriftung des Suchfelds sichtbar

#### Scenario: Suche über mehrere Wörter in beliebiger Reihenfolge
- **WHEN** die Nutzerin mehrere Wörter eingibt, die alle im Klar- oder Kurznamen eines Endpunkts vorkommen, aber nicht unmittelbar hintereinander oder in anderer Reihenfolge
- **THEN** zeigt das System diesen Endpunkt

#### Scenario: Ein Wort passt nicht
- **WHEN** die Nutzerin mehrere Wörter eingibt und eines davon in Klar- und Kurznamen eines Endpunkts fehlt
- **THEN** zeigt das System diesen Endpunkt nicht
