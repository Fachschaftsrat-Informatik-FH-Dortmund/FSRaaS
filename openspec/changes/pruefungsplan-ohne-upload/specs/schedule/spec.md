## MODIFIED Requirements

### Requirement: Auswahl aus dem offiziellen Prüfungsplan

Das System muss der Nutzerin die Auswahl relevanter Prüfungen aus dem vom Backend bereitgestellten Prüfungsbestand ermöglichen, einschließlich Prüfungen, die die Nutzerin nachholen möchte. Der Bestand wird aus dem Raumplan abgeleitet (INT-009 über INT-008, siehe Capability `backend-and-api`); ein manueller Import entfällt. Herkunft: NEU, entschieden 2026-09-06; vormals SCHED-F-200. Prüfungen zu Veranstaltungen des eigenen Plans sind über die Modulnummer zugeordnet; Nachholprüfungen aus Veranstaltungen außerhalb des Plans sind nur über Bezeichnung oder Modulnummer auffindbar, weil der Raumplan — anders als die entfallene Intranet-Excel — keine Zuordnung zu Studiengang, Vertiefung, Prüfungsordnung und Fachsemester führt.

#### Scenario: Prüfung auswählen
- **WHEN** die Nutzerin aus dem bereitgestellten Prüfungsbestand eine für sie relevante Prüfung wählt
- **THEN** übernimmt das System diese Prüfung in den persönlichen Stundenplan

#### Scenario: Prüfung zur eigenen Veranstaltung
- **WHEN** die Nutzerin zu einer Veranstaltung ihres Plans die zugehörige Prüfung aufruft
- **THEN** zeigt das System sie anhand der Modulnummer zugeordnet an

#### Scenario: Nachholprüfung suchen
- **WHEN** die Nutzerin eine Prüfung zu einer Veranstaltung sucht, die nicht in ihrem Plan steht
- **THEN** findet das System sie über Bezeichnung oder Modulnummer und übernimmt sie auf Auswahl in den persönlichen Stundenplan

### Requirement: Benachrichtigung bei Prüfungsplan-Aktualisierung

Wenn das Backend eine Aktualisierung des Prüfungsbestands meldet und mindestens einer der lokal ausgewählten Prüfungstermine der Nutzerin davon betroffen ist, muss das System die Nutzerin darüber informieren. Herkunft: NEU, entschieden 2026-09-06; vormals SCHED-F-220. Verträgt sich mit der Anforderung „Kein serverseitiges Speichern des persönlichen Stundenplans" der Capability `backend-and-api` (API-F-100): Das Backend meldet nur, dass sich der Bestand geändert hat; der Abgleich erfolgt lokal gegen die ausschließlich gerätegespeicherte Auswahl, indem die App den geänderten Bestand abruft und gegen ihre Auswahl hält.

#### Scenario: Ausgewählte Prüfung betroffen
- **WHEN** eine Aktualisierung des Prüfungsbestands einen lokal ausgewählten Prüfungstermin betrifft
- **THEN** informiert das System die Nutzerin darüber

#### Scenario: Keine ausgewählte Prüfung betroffen
- **WHEN** sich der Prüfungsbestand ändert, ohne einen lokal ausgewählten Termin zu betreffen
- **THEN** informiert das System die Nutzerin nicht
