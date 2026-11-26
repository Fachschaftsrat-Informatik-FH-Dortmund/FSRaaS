## MODIFIED Requirements

### Requirement: Raumtermine über Platzhalter-Aufruf beziehen

Das System muss die Raumtermine über den Platzhalter-Aufruf `Room/*/AllEvents` aus INT-009 periodisch abrufen und der App ausschließlich aus dem eigenen Zwischenspeicher ausliefern. Der abzurufende Zeitraum ist dabei mit den Parametern `From` und `To` **ausdrücklich anzugeben**; ohne sie liefert der Endpunkt nur sieben Tage ab dem Folgetag. Beim Ablegen im Zwischenspeicher muss das System für Termine mit der Pseudo-Raumkennung `*` den tatsächlichen Raum aus dem Namensfeld lesen, weil die Belegung sonst um rund ein Drittel zu niedrig ausfällt. Herkunft: Recherche: alte apps/android-fb4, retrofit/TimetableApi.java, 2026-08-25; Abrufweg berichtigt nach dem INT-009-Spike, 2026-09-07; Zeitraum, Takt und Ersatzregeln festgelegt im Change `raumplan-zwischenspeicher`, 2026-11-26 (vormals API-F-045).

Die frühere Fassung ließ den Zeitraum offen, weil sie das Standardfenster für den gesamten Bestand hielt. Der Spike hat gezeigt, dass der Endpunkt beliebige Zeiträume bedient — belegt von Februar 2024 bis September 2027 — und dass die Aggregation über Studiengang/Semester-Kombinationen damit erst recht entbehrlich bleibt.

Der Abruf läuft stündlich und umfasst den Zeitraum vom Beginn des laufenden Tages (Ortszeit Europe/Berlin) bis 28 Tage danach. Stündlich, weil kurzfristige Einzelabsagen sich nur als Verschwinden einer Instanz zeigen (INT-009) und eine Belegungsauskunft für „jetzt" sonst bis zu einen Tag hinterherliefe; 28 Tage, weil das den Stundenplan-Abgleich über die nächsten Wochen trägt, ohne den Bestand unnötig aufzublähen.

Der Abruf muss prüfen, ob die Antwort den angeforderten Zeitraum abdeckt, und einen Fehlschlag protokollieren statt ihn zu verschlucken (SEC-F-060). Grund: Der FBWS ignoriert unbekannte Abfrageparameter stillschweigend und antwortet dann mit dem Sieben-Tage-Fenster. Eine Umbenennung der Parameter würde ohne diese Prüfung nicht als Fehler auffallen, sondern den Zwischenspeicher unbemerkt auf eine Woche schrumpfen lassen. Als nicht abdeckend gilt eine Antwort, deren Termine sämtlich im Standardfenster (Folgetag bis sieben Tage danach) liegen, obwohl der angeforderte Zeitraum den laufenden Tag einschließt und über das Standardfenster hinausreicht. Eine leere Antwort ersetzt einen bisher gefüllten Zwischenspeicher nicht. Ein Termin ohne auswertbare Zeitangabe wird übersprungen und protokolliert, die übrigen werden übernommen.

#### Scenario: Periodischer Abruf
- **WHEN** der periodische Hintergrund-Job für Raumtermine läuft
- **THEN** ruft er `Room/*/AllEvents` mit `From` und `To` für den vorgesehenen Zeitraum ab und legt die Termine im eigenen Zwischenspeicher ab

#### Scenario: Antwort deckt den Zeitraum nicht ab
- **WHEN** die Antwort einen kürzeren Zeitraum umfasst als angefordert
- **THEN** protokolliert das System den Vorfall und behält den bisherigen Zwischenspeicher, statt ihn durch einen verkürzten Bestand zu ersetzen

#### Scenario: Leere Antwort bei gefülltem Zwischenspeicher
- **WHEN** die Antwort keinen einzigen Termin enthält, der Zwischenspeicher aber bisher Termine führt
- **THEN** protokolliert das System den Vorfall und behält den bisherigen Zwischenspeicher

#### Scenario: Raum aus dem Namensfeld
- **WHEN** ein abgerufener Termin die Raumkennung `*` trägt und sein Name eine Raumangabe als Freitext enthält
- **THEN** übernimmt das System den daraus gelesenen Raum in den Zwischenspeicher

#### Scenario: Mehrere Räume im Namensfeld
- **WHEN** ein Termin mit der Raumkennung `*` in seinem Namen mehrere Räume nennt
- **THEN** gilt jeder dieser Räume zur Terminzeit als belegt

#### Scenario: Termin ohne auswertbare Zeitangabe
- **WHEN** ein abgerufener Termin keine auswertbare Beginn- oder Endzeit trägt
- **THEN** überspringt das System diesen Termin, protokolliert den Vorfall und übernimmt die übrigen

### Requirement: Übersicht aller Räume im Raumplan-Zwischenspeicher

Das System muss der App eine Übersicht aller im Raumplan-Zwischenspeicher geführten Räume mit ihrer aktuellen Belegung bereitstellen, nicht beschränkt auf die kuratierte Raumliste. Herkunft: NEU (vormals API-F-055); Verhalten vor dem ersten Abruf festgelegt im Change `raumplan-zwischenspeicher`, 2026-11-26. Liefert nur eine weitere Projektion des bereits vorgehaltenen Bestands, kein zusätzlicher externer Abruf; trägt die Raumübersicht und Ansicht laufender Veranstaltungen aus Capability `room-finder`.

Liegt noch kein erfolgreich abgerufener Bestand vor, antwortet das System mit einem Fehler statt mit einer leeren Übersicht — eine leere Liste ließe sich von „kein Raum bekannt" nicht unterscheiden (SEC-F-060). Mit jeder Antwort liefert es das Alter des Bestands und ob der letzte Abruf gelang, damit die App einen veralteten Stand ausweisen kann.

#### Scenario: Raumübersicht abrufen
- **WHEN** die App die Raumübersicht anfragt
- **THEN** liefert das Backend alle im Zwischenspeicher geführten Räume mit aktueller Belegung, auch nicht kuratierte

#### Scenario: Noch kein Bestand
- **WHEN** die App die Raumübersicht anfragt, bevor ein Abruf erfolgreich war
- **THEN** antwortet das Backend mit einem Fehler im einheitlichen Fehlerformat, nicht mit einer leeren Liste

#### Scenario: Letzter Abruf fehlgeschlagen
- **WHEN** der letzte Abruf fehlschlug, ein älterer Bestand aber vorliegt
- **THEN** liefert das Backend den älteren Bestand mit dessen Abrufzeitpunkt und dem Hinweis, dass die Quelle zuletzt nicht erreichbar war
