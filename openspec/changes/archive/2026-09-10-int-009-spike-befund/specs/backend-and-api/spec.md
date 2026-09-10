## MODIFIED Requirements

### Requirement: Raumtermine über Platzhalter-Aufruf beziehen

Das System muss die Raumtermine über den Platzhalter-Aufruf `Room/*/AllEvents` aus INT-009 periodisch abrufen und der App ausschließlich aus dem eigenen Zwischenspeicher ausliefern. Der abzurufende Zeitraum ist dabei mit den Parametern `From` und `To` **ausdrücklich anzugeben**; ohne sie liefert der Endpunkt nur sieben Tage ab dem Folgetag. Beim Ablegen im Zwischenspeicher muss das System für Termine mit der Pseudo-Raumkennung `*` den tatsächlichen Raum aus dem Namensfeld lesen, weil die Belegung sonst um rund ein Drittel zu niedrig ausfällt. Herkunft: Recherche: alte apps/android-fb4, retrofit/TimetableApi.java, 2026-08-25; Abrufweg berichtigt nach dem INT-009-Spike, 2026-09-07 (vormals API-F-045).

Die frühere Fassung ließ den Zeitraum offen, weil sie das Standardfenster für den gesamten Bestand hielt. Der Spike hat gezeigt, dass der Endpunkt beliebige Zeiträume bedient — belegt von Februar 2024 bis September 2027 — und dass die Aggregation über Studiengang/Semester-Kombinationen damit erst recht entbehrlich bleibt.

Der Abruf muss prüfen, ob die Antwort den angeforderten Zeitraum abdeckt, und einen Fehlschlag protokollieren statt ihn zu verschlucken (SEC-F-060). Grund: Der FBWS ignoriert unbekannte Abfrageparameter stillschweigend und antwortet dann mit dem Sieben-Tage-Fenster. Eine Umbenennung der Parameter würde ohne diese Prüfung nicht als Fehler auffallen, sondern den Zwischenspeicher unbemerkt auf eine Woche schrumpfen lassen.

#### Scenario: Periodischer Abruf
- **WHEN** der periodische Hintergrund-Job für Raumtermine läuft
- **THEN** ruft er `Room/*/AllEvents` mit `From` und `To` für den vorgesehenen Zeitraum ab und legt die Termine im eigenen Zwischenspeicher ab

#### Scenario: Antwort deckt den Zeitraum nicht ab
- **WHEN** die Antwort einen kürzeren Zeitraum umfasst als angefordert
- **THEN** protokolliert das System den Vorfall und behält den bisherigen Zwischenspeicher, statt ihn durch einen verkürzten Bestand zu ersetzen

#### Scenario: Raum aus dem Namensfeld
- **WHEN** ein abgerufener Termin die Raumkennung `*` trägt und sein Name eine Raumangabe als Freitext enthält
- **THEN** übernimmt das System den daraus gelesenen Raum in den Zwischenspeicher

### Requirement: Ableitung des Prüfungsbestands aus dem Raumplan

Das System muss aus dem zwischengespeicherten Raumplan (INT-009, siehe Capability `integrations`) die Prüfungstermine ableiten und als eigenen Bestand führen. Maßgeblich sind Einträge, deren Bezeichnung dem Muster `Prüfung <Modulnummer> <Bezeichnung>` folgt; Modulnummer und Bezeichnung werden daraus herausgelöst, Raum, Datum und Uhrzeit aus den übrigen Feldern übernommen. Der so gewonnene Bestand ist **nachweislich unvollständig** und deckt rund 70 % des offiziellen Prüfungsplans ab; das System muss diese Unvollständigkeit an den Bestand knüpfen, damit die App sie ausweisen kann. Herkunft: NEU, entschieden 2026-09-06; Vollständigkeit und Vorlauf vermessen im INT-009-Spike, 2026-09-07. Ersetzt den entfallenen Excel-Import (vormals API-F-180).

Der Spike hat die tragende Annahme zur Hälfte bestätigt und zur Hälfte widerlegt. Bestätigt: Die Termine stehen rechtzeitig — im Median 55 Tage vor der Prüfung, bei 87 % der Einträge mindestens 42 Tage —, und wo ein Modul geführt wird, stimmt der Prüfungstag in 61 von 64 Fällen exakt mit dem offiziellen Plan überein. Widerlegt: Von 91 Modulen des Prüfungsplans SoSe 2026 fehlen 27, bis auf zwei Ausnahmen sämtlich wirtschaftswissenschaftliche Module der Studiengänge Wirtschaftsinformatik. Für diese Studiengänge fehlt damit ein erheblicher Teil des Prüfungsplans.

**Entscheidung (Rücksprache FSR FB4, 2026-09-10): Die Lücke wird hingenommen und ausgewiesen, keine Excel-Reaktivierung.** Ursache ist strukturell, nicht behebbar: Ein Teil der wirtschaftswissenschaftlichen Prüfungen findet außerhalb der FB4-eigenen Gebäude statt und wird dort nicht über den vom Fachbereich Informatik geführten Raumplan gebucht — INT-009 kann diese Termine deshalb grundsätzlich nicht enthalten, unabhängig von Namensmuster oder Zeitraum. Eine Reaktivierung des entfallenen Excel-Imports (INT-013) würde genau die jährlich wechselnde Freiwilligen-Abhängigkeit zurückholen, deren Wegfall der Grund für dessen Abschaffung war (Entscheidung 2026-09-06) — für eine Lücke, die dadurch ohnehin nicht vollständig geschlossen würde.

#### Scenario: Prüfungseintrag im Raumplan
- **WHEN** der Raumplan-Zwischenspeicher einen Eintrag mit dem Namensmuster `Prüfung <Modulnummer> <Bezeichnung>` enthält
- **THEN** führt das Backend ihn im Prüfungsbestand mit Modulnummer, Bezeichnung, Raum, Datum und Uhrzeit

#### Scenario: Nicht auflösbares Namensmuster
- **WHEN** ein Eintrag als Prüfung erkennbar ist, sein Name aber keine Modulnummer nach dem Muster hergibt — etwa `Prüfung Softwaretechnik 2` oder ein Eintrag im Plural mit zwei Modulnummern
- **THEN** führt das Backend ihn als Prüfung ohne Modulbezug im Bestand und protokolliert den Vorfall (SEC-F-060), statt ihn zu verwerfen

#### Scenario: Unvollständigkeit ist Teil des Bestands
- **WHEN** das Backend den Prüfungsbestand ausliefert
- **THEN** weist es ihn als abgeleitet und unvollständig aus, damit die App die Nutzerin nicht im Glauben lässt, sie sehe den vollständigen Prüfungsplan
