## ADDED Requirements

### Requirement: Einblenden nicht gewählter Veranstaltungen

Das System muss im Ansichts-Blatt der Wochenansicht einen Schalter anbieten, der zusätzlich zu den Terminen des eigenen Plans die Termine der nicht gewählten Module des Auswahlbestands einblendet. Eingeblendete Termine müssen sich von den eigenen deutlich unterscheiden, und zwar zusätzlich zur Farbe durch Text oder Symbol. Sie zählen in keine Auswertung des eigenen Plans: weder in die Konfliktprüfung noch in die Anzeige des laufenden und nächsten Termins noch in den Export. Der Schalter ist voreingestellt abgeschaltet. Herkunft: NEU, entschieden 2026-09-11. Mit Modulauswahl und verpflichtender Gruppenkennung ist der übrige Bestand des Studiengangs sonst nirgends mehr sichtbar; wer wissen will, was gerade läuft, hat dafür keinen Weg.

#### Scenario: Schalter angeschaltet
- **WHEN** die Nutzerin den Schalter „Alle Veranstaltungen zeigen" anschaltet
- **THEN** zeigt das System zusätzlich die Termine der nicht gewählten Module des Auswahlbestands, deutlich von den eigenen abgesetzt

#### Scenario: Eingeblendeter Termin zur selben Zeit
- **WHEN** ein eingeblendeter Termin zeitgleich mit einem Termin des eigenen Plans liegt
- **THEN** meldet das System dafür keinen Konflikt

#### Scenario: Schalter abgeschaltet
- **WHEN** die Nutzerin den Schalter abschaltet
- **THEN** zeigt das System ausschließlich die Termine des eigenen Plans

### Requirement: Aufnehmen eines Moduls aus der Einblendung

Wenn die Nutzerin einen eingeblendeten, nicht gewählten Termin antippt, dann muss das System fragen, ob das zugehörige Modul in die eigene Auswahl aufgenommen werden soll, und diese Frage mit „nein" vorbelegen. Erst nach Zustimmung wird das Modul aufgenommen. Herkunft: NEU, entschieden 2026-09-11. Die Vorbelegung folgt derselben Erwägung wie bei der Abwahl eines Moduls mit vorhandenen Planeinträgen — wer sich vertippt, verändert seinen Plan nicht.

#### Scenario: Eingeblendeten Termin antippen
- **WHEN** die Nutzerin einen eingeblendeten, nicht gewählten Termin antippt
- **THEN** fragt das System, ob das zugehörige Modul aufgenommen werden soll, vorbelegt auf „nein"

#### Scenario: Aufnahme bestätigt
- **WHEN** die Nutzerin der Aufnahme zustimmt
- **THEN** führt das System das Modul als gewählt und seine Termine als Kandidaten für die Planung

#### Scenario: Aufnahme abgelehnt
- **WHEN** die Nutzerin die Frage verneint
- **THEN** bleibt die eigene Auswahl unverändert
