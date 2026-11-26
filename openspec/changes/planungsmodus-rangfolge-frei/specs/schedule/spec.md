## MODIFIED Requirements

### Requirement: Kriterienrangfolge für die Planung

Das System muss der Nutzerin ermöglichen, die Kriterien der Planungsreihung nach Wichtigkeit zu ordnen und einzelne Kriterien abzuschalten. Das Umordnen muss ohne Ziehgeste über sichtbare Bedienwege möglich sein, die ein Kriterium jeweils um eine Stelle nach oben oder unten verschieben; nach dem Verschieben muss das System die neue Stelle für Hilfstechnologien ansagen. Zur Verfügung stehen mindestens: *Uni-Tage*, *Anwesenheitszeit*, *gleichmäßige Woche*, *Abstand zwischen Lerneinheiten*, *Vorbereitungszeit*, *Abstand Vorlesung–Übung*, *Abwechslung* und *Zeitfenster*. Zusätzlich muss das System mindestens fünf benannte Voreinstellungen anbieten, die die Rangfolge füllen; eine Voreinstellung schaltet genau die Kriterien ein, die sie ausmachen, und lässt die übrigen abgeschaltet. Weicht die eingestellte Rangfolge von jeder Voreinstellung ab, darf das System keine Voreinstellung als gewählt ausweisen und muss die Rangfolge als eigene kennzeichnen. Herkunft: NEU, entschieden 2026-09-06, Bedienweg ohne Ziehgeste und Kennzeichnung der eigenen Rangfolge ergänzt 2026-11-26 (Issue #27, zweiter Zug). Ersetzt die entfallene Anforderung „Auswahl des Optimierungsmodus" (vormals SCHED-F-350). Kriterienliste und Voreinstellungen sind ein Mindestumfang, keine abschließende Liste. Das bisherige Szenario sprach vom Ziehen eines Kriteriums; eine Ziehgeste allein schlösse aber aus, wer mit Bildschirmleser oder Schaltersteuerung arbeitet, und wäre nach dem Requirement „Zweiter sichtbarer Bedienweg statt reiner Geste" der Capability `ux-and-theming` ohnehin nicht ausreichend. Eine Voreinstellung, die nach einer Änderung weiter als gewählt erschiene, behauptete eine Rangfolge, die gar nicht mehr gilt.

Die Voreinstellungen: *Zeit an der Uni* (Anwesenheitszeit) · *Fahrten zur Uni* (Uni-Tage, dann Anwesenheitszeit) · *Ausgeglichene Woche* (gleichmäßige Woche) · *Abstand zwischen Lerneinheiten* · *Vorbereitungszeit* (Vorbereitungszeit, dann Abstand Vorlesung–Übung). *Abwechslung* und *Zeitfenster* sind Kriterien ohne eigene Voreinstellung.

#### Scenario: Voreinstellung wählen
- **WHEN** die Nutzerin die Voreinstellung „Fahrten zur Uni" wählt
- **THEN** enthält die Rangfolge „Uni-Tage" vor „Anwesenheitszeit", und alle übrigen Kriterien sind abgeschaltet

#### Scenario: Rangfolge selbst ändern
- **WHEN** die Nutzerin ein Kriterium in der Rangfolge nach oben verschiebt oder abschaltet
- **THEN** übernimmt das System die geänderte Rangfolge für die Reihung

#### Scenario: Umordnen ohne Ziehgeste
- **WHEN** die Nutzerin ein Kriterium über den sichtbaren Bedienweg um eine Stelle nach oben verschiebt
- **THEN** steht es eine Stelle höher, ohne dass eine Ziehgeste nötig war, und das System sagt die neue Stelle an

#### Scenario: Eigene Rangfolge
- **WHEN** die Nutzerin die Rangfolge so ändert, dass sie keiner Voreinstellung mehr entspricht
- **THEN** weist das System keine Voreinstellung als gewählt aus und kennzeichnet die Rangfolge als eigene

#### Scenario: Abgeschaltetes Kriterium wieder einschalten
- **WHEN** die Nutzerin ein abgeschaltetes Kriterium wieder einschaltet
- **THEN** nimmt das System es an letzter Stelle in die Rangfolge auf
