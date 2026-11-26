## ADDED Requirements

### Requirement: Detailansicht einer Meldung

Wenn die Nutzerin eine Meldung in der Meldungsliste antippt, muss das System eine Detailansicht mit Titel, Klassifizierung, Quelle/Verteiler, Veröffentlichungszeitpunkt und dem vollständigen, ungekürzten Text der Meldung öffnen und dort denselben sichtbaren Bedienweg zum Anpinnen und Ablösen anbieten wie in der Liste. Herkunft: NEU, eingeführt mit dem Change `news-redaktion`, 2026-11-26. Die Liste zeigt je Meldung nur einen gekürzten Text, damit mehrere Meldungen auf einen Bildschirm passen; ohne Detailansicht wäre der vollständige Text einer längeren Meldung nicht erreichbar.

#### Scenario: Meldung öffnen
- **WHEN** die Nutzerin eine Meldung in der Meldungsliste antippt
- **THEN** zeigt das System eine Detailansicht mit dem vollständigen Text, der Klassifizierung und dem Veröffentlichungszeitpunkt der Meldung

#### Scenario: Anpinnen aus der Detailansicht
- **WHEN** die Nutzerin in der Detailansicht einer Meldung den Bedienweg zum Anpinnen auslöst
- **THEN** ist die Meldung angepinnt und erscheint nach der Rückkehr zur Liste oberhalb der übrigen Meldungen

#### Scenario: Meldung nicht mehr verfügbar
- **WHEN** die Detailansicht einer Meldung aufgerufen wird, die weder im geladenen Bestand noch unter den angepinnten Meldungen vorliegt
- **THEN** zeigt das System den Hinweis, dass die Meldung nicht verfügbar ist, mit einem Weg zurück zur Liste, statt einer leeren Ansicht
