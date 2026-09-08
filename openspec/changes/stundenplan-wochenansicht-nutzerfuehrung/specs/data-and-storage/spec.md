## ADDED Requirements

### Requirement: Nutzeraktion „Stundenplan leeren"

Das System muss eine Nutzeraktion bereitstellen, die alle Termine des persönlichen Stundenplans entfernt und die Einrichtung — gewählte Endpunkte und Gruppenkennung — unangetastet lässt. Die Aktion muss vor der Ausführung bestätigt werden und dabei gesondert erfragen, ob die selbst angelegten Termine mitentfernt werden sollen; diese Zusatzfrage ist mit „nein" vorbelegt. Herkunft: NEU, entschieden 2026-09-08. Der Fall ist das Neuzusammenstellen des Plans innerhalb desselben Semesters. Bislang bot die Capability nur die globale Aktion „Alle lokalen Daten löschen", die auch Semesterticket, Benachrichtigungsregeln und Mensa-Einstellungen entfernt, sowie das Löschen einzelner Termine. Die Vorbelegung auf „nein" folgt daraus, dass selbst angelegte Termine Handarbeit sind und im FBWS nicht stehen: Sie lassen sich nicht wiederbeschaffen, die offiziellen jederzeit.

#### Scenario: Plan leeren, Einrichtung behalten
- **WHEN** die Nutzerin „Stundenplan leeren" auslöst und bestätigt
- **THEN** entfernt das System die offiziellen Termine des Plans und behält gewählte Endpunkte und Gruppenkennung

#### Scenario: Eigene Termine behalten
- **WHEN** die Nutzerin die Aktion bestätigt, ohne der Mitentfernung eigener Termine zuzustimmen
- **THEN** bleiben die selbst angelegten Termine im Plan erhalten

#### Scenario: Eigene Termine mitentfernen
- **WHEN** die Nutzerin der Mitentfernung eigener Termine ausdrücklich zustimmt
- **THEN** entfernt das System auch diese

### Requirement: Nutzeraktion „Stundenplan zurücksetzen"

Das System muss eine Nutzeraktion bereitstellen, die zusätzlich zu allen Terminen auch die Einrichtung des Stundenplans entfernt — gewählte Endpunkte und Gruppenkennung — und die App damit in den Zustand vor der ersten Einrichtung zurückversetzt. Die Aktion muss vor der Ausführung bestätigt werden und dabei gesondert erfragen, ob die selbst angelegten Termine mitentfernt werden sollen; diese Zusatzfrage ist mit „nein" vorbelegt. Herkunft: NEU, entschieden 2026-09-08. Der Fall ist das Semesterende. Sie ist von „Stundenplan leeren" getrennt, weil beide Fälle verschiedene Absichten haben: neu zusammenstellen gegenüber von vorn beginnen.

#### Scenario: Zurücksetzen
- **WHEN** die Nutzerin „Stundenplan zurücksetzen" auslöst und bestätigt
- **THEN** entfernt das System Termine, gewählte Endpunkte und Gruppenkennung, und der Stundenplan zeigt den Zustand vor der ersten Einrichtung

#### Scenario: Andere Bereiche unberührt
- **WHEN** die Nutzerin den Stundenplan zurücksetzt
- **THEN** bleiben Daten anderer Bereiche — Semesterticket, Benachrichtigungsregeln, Mensa-Einstellungen — unverändert erhalten

### Requirement: Kein selbsttätiges Entfernen des Stundenplans

Das System darf den persönlichen Stundenplan ausschließlich auf ausdrückliche Auslösung durch die Nutzerin entfernen. Ein selbsttätiges Leeren oder Zurücksetzen — insbesondere bei einem erkannten Semesterwechsel, bei geänderter Endpunktliste, bei einer entfallenen Auswahl oder bei einem unerwarteten Antwortumfang eines Fremdsystems — ist ausgeschlossen. Herkunft: NEU, entschieden 2026-09-08. Ergänzt das Requirement „Kein kommentarloses Löschen bei inkonsistentem Bestand" um den Fall, dass ein erkanntes Ereignis das Entfernen naheliegend erscheinen lässt. Die Flutter-Alt-App löscht bei unerwarteter Eintragsanzahl den gesamten Bestand kommentarlos; mit dem Hinweis bei Semesterwechsel und dem Abgleich der Endpunktliste entstehen zwei weitere Anlässe, an denen dieselbe Versuchung besteht. Beide dürfen anbieten, nie ausführen.

#### Scenario: Semesterwechsel erkannt
- **WHEN** das System einen Semesterwechsel oder eine geänderte Endpunktliste erkennt
- **THEN** weist es darauf hin und bietet das Leeren oder Zurücksetzen an, führt es aber nicht selbsttätig aus

#### Scenario: Gewählter Endpunkt entfallen
- **WHEN** ein von der Nutzerin gewählter Endpunkt in der aktuellen Fremdsystem-Antwort fehlt
- **THEN** bleiben die daraus entstandenen Termine im Plan erhalten, bis die Nutzerin selbst etwas anderes veranlasst
