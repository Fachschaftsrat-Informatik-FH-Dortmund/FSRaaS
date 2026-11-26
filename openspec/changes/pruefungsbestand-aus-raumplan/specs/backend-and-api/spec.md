## MODIFIED Requirements

### Requirement: Ableitung des Prüfungsbestands aus dem Raumplan

Das System muss aus dem Raumplan (INT-009, siehe Capability `integrations`) die Prüfungstermine ableiten und als eigenen Bestand führen. Als Prüfung gilt ein Eintrag, dessen Bezeichnung mit dem Wort „Prüfung" oder „Prüfungen" beginnt; folgt sie dem Muster `Prüfung <Modulnummer> <Bezeichnung>`, werden Modulnummer und Bezeichnung daraus herausgelöst. Raum, Datum und Uhrzeit werden aus den übrigen Feldern übernommen. Der so gewonnene Bestand ist **nachweislich unvollständig** und deckt rund 70 % des offiziellen Prüfungsplans ab; das System muss diese Unvollständigkeit an den Bestand knüpfen, damit die App sie ausweisen kann. Herkunft: NEU, entschieden 2026-09-06; Vollständigkeit und Vorlauf vermessen im INT-009-Spike, 2026-09-07; Abrufzeitraum, Zusammenführung je Prüfung und Form des Unvollständigkeitshinweises festgelegt im Change `pruefungsbestand-aus-raumplan`, 2026-11-26. Ersetzt den entfallenen Excel-Import (vormals API-F-180).

Der Spike hat die tragende Annahme zur Hälfte bestätigt und zur Hälfte widerlegt. Bestätigt: Die Termine stehen rechtzeitig — im Median 55 Tage vor der Prüfung, bei 87 % der Einträge mindestens 42 Tage —, und wo ein Modul geführt wird, stimmt der Prüfungstag in 61 von 64 Fällen exakt mit dem offiziellen Plan überein. Widerlegt: Von 91 Modulen des Prüfungsplans SoSe 2026 fehlen 27, bis auf zwei Ausnahmen sämtlich wirtschaftswissenschaftliche Module der Studiengänge Wirtschaftsinformatik. Für diese Studiengänge fehlt damit ein erheblicher Teil des Prüfungsplans.

**Entschieden 2026-09-10: Die Lücke wird hingenommen und ausgewiesen, keine Excel-Reaktivierung.** Ursache ist strukturell, nicht behebbar: Ein Teil der wirtschaftswissenschaftlichen Prüfungen findet außerhalb der FB4-eigenen Gebäude statt und wird dort nicht über den vom Fachbereich Informatik geführten Raumplan gebucht — INT-009 kann diese Termine deshalb grundsätzlich nicht enthalten, unabhängig von Namensmuster oder Zeitraum. Eine Reaktivierung des entfallenen Excel-Imports (INT-013) würde genau die jährlich wechselnde Freiwilligen-Abhängigkeit zurückholen, deren Wegfall der Grund für dessen Abschaffung war (Entscheidung 2026-09-06) — für eine Lücke, die dadurch ohnehin nicht vollständig geschlossen würde.

**Abrufzeitraum (2026-11-26).** Der Prüfungsbestand stützt sich nicht auf den 28-Tage-Zwischenspeicher der Raumsuche, sondern auf einen eigenen Abruf desselben Platzhalter-Aufrufs `Room/*/AllEvents` über 183 Tage ab Beginn des laufenden Tages (Ortszeit Europe/Berlin), alle sechs Stunden. Grund: Prüfungen stehen im Median 55 Tage vorher im Raumplan, die Anmeldefrist endet rund sieben Wochen vor der ersten Prüfung — ein 28-Tage-Fenster zeigte jede Prüfung erst nach Anmeldeschluss. 183 Tage decken den größten im Spike gemessenen Vorlauf (203 Tage) nicht ganz, aber den gesamten folgenden Prüfungszeitraum ab dem Ende der Vorlesungszeit. Für die Antwort gelten dieselben Regeln wie für den Zwischenspeicher (Requirement „Raumtermine über Platzhalter-Aufruf beziehen"): Eine Antwort, die nur das Sieben-Tage-Standardfenster abdeckt, oder eine leere Antwort bei bisher gefülltem Prüfungsbestand ersetzt den bisherigen Bestand nicht und wird protokolliert; ein Eintrag ohne auswertbare Zeitangabe wird übersprungen und protokolliert.

**Eine Prüfung, nicht ein Raum, ist die Einheit.** Einträge mit derselben Bezeichnung und demselben Beginn und Ende sind eine Prüfung in mehreren Räumen und werden zu einem Prüfungstermin mit der Liste ihrer Räume zusammengeführt. Für die Raumkennung gilt die Auflösung des Zwischenspeichers: Steht dort der Pseudoraum `*`, werden die Räume aus dem Namensfeld gelesen. Findet sich kein Raum, bleibt die Raumliste leer — die Prüfung bleibt im Bestand.

**Form des Unvollständigkeitshinweises.** Jede Auslieferung des Bestands trägt maschinenlesbar, dass er aus dem Raumplan abgeleitet und nicht vollständig ist, und nennt die zuletzt gemessene Abdeckung samt Messdatum. Ein Fließtext wird nicht ausgeliefert; die App formuliert den Hinweis in der Oberflächensprache. Der Hinweis hängt nicht davon ab, ob der Bestand gerade leer ist oder Einträge führt.

#### Scenario: Prüfungseintrag im Raumplan
- **WHEN** der Raumplan einen Eintrag mit dem Namensmuster `Prüfung <Modulnummer> <Bezeichnung>` enthält
- **THEN** führt das Backend ihn im Prüfungsbestand mit Modulnummer, Bezeichnung, Raum, Datum und Uhrzeit

#### Scenario: Nicht auflösbares Namensmuster
- **WHEN** ein Eintrag als Prüfung erkennbar ist, sein Name aber keine Modulnummer nach dem Muster hergibt — etwa `Prüfung Softwaretechnik 2` oder ein Eintrag im Plural mit zwei Modulnummern
- **THEN** führt das Backend ihn als Prüfung ohne Modulbezug im Bestand und protokolliert den Vorfall (SEC-F-060), statt ihn zu verwerfen

#### Scenario: Unvollständigkeit ist Teil des Bestands
- **WHEN** das Backend den Prüfungsbestand ausliefert
- **THEN** weist es ihn als abgeleitet und unvollständig aus, mit gemessener Abdeckung und Messdatum, damit die App die Nutzerin nicht im Glauben lässt, sie sehe den vollständigen Prüfungsplan

#### Scenario: Prüfung mit Vorlauf
- **WHEN** eine Prüfung mehr als 28 und weniger als 183 Tage in der Zukunft im Raumplan steht
- **THEN** führt das Backend sie im Prüfungsbestand

#### Scenario: Prüfung in mehreren Räumen
- **WHEN** der Raumplan dieselbe Prüfung zur selben Zeit in mehreren Räumen führt, als getrennte Einträge oder als ein Eintrag mit mehreren Räumen im Namensfeld
- **THEN** führt das Backend sie als einen Prüfungstermin mit allen Räumen

#### Scenario: Prüfung ohne Raumangabe
- **WHEN** ein Prüfungseintrag weder eine echte Raumkennung trägt noch im Namensfeld einen Raum nennt
- **THEN** führt das Backend ihn mit leerer Raumliste im Bestand, statt ihn zu verwerfen

#### Scenario: Verdächtige Antwort beim Prüfungsabruf
- **WHEN** die Antwort des Abrufs nur das Sieben-Tage-Standardfenster abdeckt oder leer ist, obwohl der Prüfungsbestand bisher Einträge führt
- **THEN** protokolliert das System den Vorfall und behält den bisherigen Prüfungsbestand

### Requirement: Abruf des Prüfungsbestands

Das System muss den abgeleiteten Prüfungsbestand über einen Abruf-Endpunkt bereitstellen, ohne Anmeldung und ohne Kenntnis darüber, welche Prüfungen eine einzelne Nutzerin ausgewählt hat. Herkunft: NEU, entschieden 2026-09-06; Verhalten vor dem ersten Abruf festgelegt im Change `pruefungsbestand-aus-raumplan`, 2026-11-26.

Liegt noch kein erfolgreich abgeleiteter Bestand vor, antwortet das System mit einem Fehler im einheitlichen Fehlerformat statt mit einer leeren Liste — eine leere Liste ließe sich von „derzeit keine Prüfung im Raumplan" nicht unterscheiden (SEC-F-060). Mit jeder Antwort liefert es das Alter des Bestands und ob der letzte Abruf gelang.

#### Scenario: Prüfungsbestand abrufen
- **WHEN** die App den Prüfungsbestand abruft
- **THEN** liefert das Backend die abgeleiteten Prüfungstermine ohne Anmeldung aus, zusammen mit dem Alter des Bestands und dem Unvollständigkeitshinweis

#### Scenario: Noch kein Prüfungsbestand
- **WHEN** die App den Prüfungsbestand abruft, bevor ein Abruf erfolgreich war
- **THEN** antwortet das Backend mit einem Fehler im einheitlichen Fehlerformat, nicht mit einer leeren Liste

### Requirement: Allgemeine Aktualisierungsmeldung bei geändertem Prüfungsplan

Wenn sich der aus dem Raumplan abgeleitete Prüfungsbestand gegenüber dem zuvor abgeleiteten Stand unterscheidet, muss das System eine allgemeine Aktualisierungsmeldung auslösen, ohne dabei personenbezogene Auswahldaten einzelner Nutzerinnen zu verarbeiten. Herkunft: NEU, entschieden 2026-09-06; vormals API-F-200; Begriff der Abweichung festgelegt im Change `pruefungsbestand-aus-raumplan`, 2026-11-26. Löst allgemein aus, ohne zu wissen, welche Nutzerin welche Prüfung ausgewählt hat; das bleibt mit dem Requirement „Verzicht auf serverseitige Speicherung persönlicher Stundenpläne" vereinbar, weil Capability `schedule` den Abgleich mit der individuellen, ausschließlich lokal gespeicherten Auswahl auf dem Gerät vornimmt.

Die Meldung besteht darin, dass der über den Abfrage-Endpunkt bereitgestellte Änderungszeitpunkt fortgeschrieben wird (Requirement „Abfrage-Endpunkt für den Prüfungsplan-Änderungszeitpunkt"). Als Abweichung zählt eine hinzugekommene, entfallene oder in Bezeichnung, Modulnummer, Zeit oder Räumen geänderte Prüfung. Nicht als Abweichung zählt eine Prüfung, die nur deshalb nicht mehr im Bestand steht, weil ihr Termin vor dem Beginn des laufenden Tages endete — sonst meldete das System während des Prüfungszeitraums täglich eine Änderung, die keine ist.

#### Scenario: Prüfungsplan-Änderung erkannt
- **WHEN** der abgeleitete Prüfungsbestand vom zuvor abgeleiteten Stand abweicht
- **THEN** löst das Backend eine allgemeine Aktualisierungsmeldung aus, ohne personenbezogene Auswahldaten zu verarbeiten

#### Scenario: Vergangene Prüfung fällt heraus
- **WHEN** eine Prüfung nur deshalb nicht mehr im abgeleiteten Bestand steht, weil ihr Termin vorüber ist, und sich sonst nichts geändert hat
- **THEN** löst das Backend keine Aktualisierungsmeldung aus

### Requirement: Abfrage-Endpunkt für den Prüfungsplan-Änderungszeitpunkt

Das System muss den Zeitpunkt der letzten Prüfungsplan-Änderung über einen Abfrage-Endpunkt bereitstellen, sodass die App den Abgleich mit ihrer lokalen Auswahl selbst vornehmen kann. Herkunft: NEU (vormals API-F-205); Wert vor dem ersten Abruf festgelegt im Change `pruefungsbestand-aus-raumplan`, 2026-11-26. Löst die zuvor unbestimmte Zustellung des Aktualisierungshinweises: Ein Abfrage-Endpunkt statt einer zugestellten Meldung hält das Requirement „Verzicht auf serverseitige Speicherung persönlicher Stundenpläne" ohne Ausnahme ein und funktioniert zudem ohne Push-Infrastruktur.

Die erste erfolgreiche Ableitung gilt als Änderung. Vor ihr liefert der Endpunkt keinen Zeitpunkt (leerer Wert), aber keinen Fehler.

#### Scenario: App fragt Änderungszeitpunkt ab
- **WHEN** die App den Zeitpunkt der letzten Prüfungsplan-Änderung abfragt
- **THEN** liefert das Backend diesen Zeitpunkt, ohne die lokale Auswahl der Nutzerin zu kennen

#### Scenario: Noch keine Ableitung erfolgt
- **WHEN** die App den Änderungszeitpunkt abfragt, bevor ein Prüfungsbestand abgeleitet wurde
- **THEN** liefert das Backend einen leeren Änderungszeitpunkt statt eines Fehlers
