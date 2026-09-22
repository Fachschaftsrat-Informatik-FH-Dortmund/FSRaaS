## ADDED Requirements

### Requirement: Hinweis auf gesetzlichen Feiertag

Wenn ein Termin des persönlichen Stundenplans auf ein Datum fällt, das in Nordrhein-Westfalen ein gesetzlicher Feiertag ist, muss das System am betroffenen Eintrag einen Hinweis anzeigen, dass die Veranstaltung an diesem Tag voraussichtlich entfällt. Das Feiertagsdatum wird im System selbst berechnet, nicht aus dem Raumplan (INT-009) oder einer gepflegten Liste bezogen. Herkunft: NEU, entschieden 2026-09-10 (Rücksprache FSR FB4), Anlass: INT-009-Spike (`2026-09-10-int-009-spike-befund`) belegt, dass der Raumplan Feiertage nicht abbildet — Pfingstmontag und Fronleichnam 2026 liefen dort mit unveränderter Instanzzahl.

Der Hinweis ist von den bestehenden Raumabgleich-Requirements „Hinweis auf Raumabweichung" und „Hinweis auf fehlende Zuordnung im Raumplan" unabhängig: Er stützt sich auf eine berechnete Kalenderangabe statt auf den Raumplan-Zwischenspeicher und braucht deshalb weder eine gültige INT-009-Zuordnung noch einen aktuellen Abrufstand. Er gilt unabhängig davon, ob der Termin überhaupt im Raumplan auffindbar ist.

Ausdrücklich nicht Gegenstand: vorlesungsfreie Einzeltage ohne gesetzlichen Feiertagsstatus (z. B. Rosenmontag, Brückentage) und Semesterferien — dafür gibt es keine berechenbare Quelle; die offene Frage dazu bleibt in „Offene Fragen" bestehen.

#### Scenario: Termin an einem gesetzlichen Feiertag

- **WHEN** ein Termin des persönlichen Stundenplans auf ein Datum fällt, das in NRW ein gesetzlicher Feiertag ist
- **THEN** zeigt das System am Termin einen Hinweis, dass die Veranstaltung voraussichtlich entfällt

#### Scenario: Termin an einem gewöhnlichen Tag

- **WHEN** ein Termin des persönlichen Stundenplans auf kein Feiertagsdatum fällt
- **THEN** zeigt das System keinen Feiertags-Hinweis

#### Scenario: Feiertag unabhängig vom Raumplan-Stand

- **WHEN** der Raumplan-Zwischenspeicher veraltet ist oder der Termin dort nicht zugeordnet werden kann
- **THEN** zeigt das System den Feiertags-Hinweis trotzdem, sofern das Datum ein gesetzlicher Feiertag ist
