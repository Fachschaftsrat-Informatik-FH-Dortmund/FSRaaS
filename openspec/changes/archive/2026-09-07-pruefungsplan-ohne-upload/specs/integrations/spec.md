## REMOVED Requirements

### Requirement: INT-013 — Prüfungsplan (Intranet-Excel)

**Grund:** Der offizielle Prüfungsbestand wird seit dem 2026-09-06 aus dem Raumplan (INT-009) abgeleitet, den das Backend ohnehin alle paar Minuten abruft. Der zweistufige manuelle Weg — Download aus dem Intranet durch eine FSR-Person, Upload in das eigene Backend — entfällt damit vollständig. Ausschlaggebend war nicht der Aufwand des einzelnen Vorgangs, sondern seine Abhängigkeit von einer jährlich wechselnden ehrenamtlichen Person: dieselbe Konstruktion, an der das abgelöste Backend `app.fsrfb4.de` gescheitert ist.

**Ersetzt durch:** INT-009 als Quelle, ausgewertet im Backend (Capability `backend-and-api`, „Ableitung des Prüfungsbestands aus dem Raumplan").

**Was erhalten bleibt:** Die Formatanalyse der fünf realen Jahrgangsdateien (WiSe 2023/24 bis SoSe 2026) und die Dateien selbst unter `resources/` bleiben bestehen und werden im Abschnitt „Entfallene Anforderungen" mitgeführt. Sollte sich der Raumplan-Bestand als unvollständig erweisen, ist der Weg zurück damit dokumentiert und muss nicht neu erarbeitet werden. Insbesondere erhalten bleibt der Befund, dass die Excel-Matrix eine Zuordnung Prüfung → Studiengang, Vertiefung, Prüfungsordnung und Fachsemester trägt, die INT-009 nicht liefert.

**Kennung:** INT-013 bleibt vergeben und wird nicht neu verwendet.

## MODIFIED Requirements

### Requirement: INT-009 — FBWS Raumplan

Das System muss die Termine eines einzelnen Raums oder aller Räume direkt über den Wildcard-Endpunkt laden, ohne Umweg über die Iteration aller Studiengang/Semester-Kombinationen. Der Bestand ist zugleich die Quelle für die Prüfungstermine: Einträge mit `eventType: "Event"` und dem Namensmuster `Prüfung <Modulnummer> <Bezeichnung>` sind Prüfungen. Bei diesen Einträgen sind die Felder `courseId` und `courseOfStudy` leer — die Modulnummer steht ausschließlich in der Zeichenkette `name` und ist daraus herauszulösen. Herkunft: Alt: alte apps/android-fb4/FB4/fB4/src/main/java/de/fsrfb4/fb4/retrofit/TimetableApi.java; Prüfungsbefund Recherche: FBWS live abgefragt, 2026-09-04, als Quelle festgelegt 2026-09-06.

#### Scenario: Alle Raumtermine in einem Aufruf
- **WHEN** der Wildcard-Aufruf `Room/*/AllEvents` genutzt wird
- **THEN** liefert das System alle Raumtermine in einer Antwort, ohne Iteration über Studiengang/Semester-Kombinationen

#### Scenario: Prüfungseintrag erkennen
- **WHEN** ein Datensatz `eventType: "Event"` trägt und sein Name dem Muster `Prüfung <Modulnummer> <Bezeichnung>` folgt
- **THEN** gilt er als Prüfungstermin, und die Modulnummer ist dem Namensfeld zu entnehmen, nicht dem leeren Feld `courseId`
