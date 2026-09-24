## ADDED Requirements

### Requirement: Altershinweis bei veralteten Daten der Mensa-Schnittstelle

Falls das Backend zu Mensa-Daten einen Stand meldet, der älter ist als die für diese Datenart festgelegte Gültigkeitsdauer, muss das System die Daten mit einem sichtbaren Hinweis auf ihr Alter anzeigen — auch dann, wenn Netzzugriff besteht. Herkunft: Recherche: mensa.fb4.it, Feld `updated` sowie `GET /health`, 2026-09-22. Die Mensa-Schnittstelle lädt erst auf Anfrage; bei einer Messung am 2026-09-22 waren ihre Speisepläne 6,7 Tage alt, während ihr Zustandsendpunkt weiterhin `ok` meldete, weil dieser nur fehlgeschlagene Abrufe kennt, nicht Überalterung. Ohne diesen Hinweis wäre ein veralteter Speiseplan für die Nutzerin nicht von einem aktuellen zu unterscheiden, da der bestehende Altershinweis allein an den gerätelokalen Zwischenspeicher und an fehlenden Netzzugriff gebunden ist.

#### Scenario: Quelle meldet veralteten Stand
- **WHEN** Netzzugriff besteht und das Backend zu den Mensa-Daten einen Stand meldet, der älter ist als deren festgelegte Gültigkeitsdauer
- **THEN** zeigt das System die Daten mit einem sichtbaren Hinweis auf ihr Alter an

#### Scenario: Quelle meldet aktuellen Stand
- **WHEN** das Backend zu den Mensa-Daten einen Stand innerhalb der festgelegten Gültigkeitsdauer meldet
- **THEN** zeigt das System die Daten ohne Altershinweis an
