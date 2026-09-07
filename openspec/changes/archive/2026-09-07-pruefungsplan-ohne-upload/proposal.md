# Prüfungsplan ohne manuellen Upload

## Warum

Aus der Herkunfts-Durchsprache der Capability `schedule` am 2026-09-06 (`herkunft-schedule-durchsprache`). Die vier Prüfungsplan-Requirements selbst bleiben in Kraft — geändert wird, woher der Bestand kommt.

Der bisherige Weg ist zweistufig und manuell: Der Fachbereich veröffentlicht den Prüfungsplan als Excel-Datei auf einer Intranet-Seite, die einen Hochschul-Login voraussetzt, den weder App noch Backend besitzen. Ein FSR-Mitglied lädt sie herunter und in das eigene Backend hoch, das sie parst. Genau dieser Schritt ist der Grund, warum der Prüfungsplan in der zweiten Ausbaustufe steht: Das Excel-Format ist erst grob erfasst, die Kopfzeilen-Position schwankt zwischen den Jahrgängen, die Spaltenzahl variiert und Zellhintergrundfarben tragen Bedeutung.

Am 2026-09-04 kam ein Befund dazu: Der Raumplan (INT-009), den das Backend ohnehin alle paar Minuten abruft, führt Prüfungstermine bereits mit — als Einträge mit `eventType: "Event"` und dem Namensmuster `Prüfung <courseId> <Bezeichnung>`, samt Raum, Datum und Uhrzeit.

**Entscheidung 2026-09-06: Der manuelle Upload entfällt vollständig.** Begründung: Was aktiv gepflegt werden muss, veraltet — das ist die Erfahrung, an der das abgelöste Backend `app.fsrfb4.de` gescheitert ist, dessen Semestertermine bis heute aus dem Wintersemester 2023/24 stammen. Ein Importweg, der einen jährlich wechselnden Ehrenamtlichen voraussetzt, ist genau dieselbe Konstruktion.

## Was sich ändert

**Der Prüfungsbestand wird aus dem Raumplan abgeleitet, im Backend.** Das Backend erkennt die Prüfungseinträge im Raumplan-Zwischenspeicher und stellt sie als eigenen Bestand über einen Abruf-Endpunkt bereit. Im Backend und nicht in der App, weil die bereits beschlossene Aktualisierungsmeldung und der Abfrage-Endpunkt für den Änderungszeitpunkt den Bestand ohnehin dort brauchen, und weil das Erkennungsmuster damit an einer Stelle liegt statt in jeder ausgelieferten App-Version.

**Vier Requirements entfallen.** Der Excel-Import und der vollständige Ersatz des Bestands je Jahrgang in `backend-and-api`; der Upload mit Importergebnis und der Abschluss trotz unlesbarer Zeilen in `admin`. Alle vier beschreiben ausschließlich den manuellen Weg.

**Ein Registereintrag entfällt.** INT-013 (Prüfungsplan als Intranet-Excel) wird als REMOVED geführt. Die Formatanalyse der fünf realen Jahrgangsdateien unter `resources/` bleibt im Eintrag erhalten — wenn sich der Raumplan als lückenhaft erweist, ist der Weg zurück dokumentiert und muss nicht neu erarbeitet werden.

**Der Prüfungsplan verlässt die zweite Ausbaustufe.** Er war allein durch das ungeklärte Excel-Format blockiert. Er rückt zu Roadmap-Schritt 6, wo der Raumplan-Zwischenspeicher ohnehin entsteht.

## Was dabei verloren geht

Die Excel-Datei trägt eine Matrix, die der Raumplan nicht hat: die Zuordnung Prüfung → Studiengang, Vertiefung, Prüfungsordnung, Fachsemester. Für die eigenen Prüfungen ist das folgenlos — die Zugehörigkeit ergibt sich aus dem eigenen Stundenplan über die Modulnummer. Für **Nachholprüfungen** aus Veranstaltungen, die nicht im aktuellen Plan stehen, entfällt jedoch der Weg, sie über „mein Studiengang, mein Fachsemester" zu finden; sie sind dann nur über Bezeichnung oder Modulnummer auffindbar. Das ist bewusst in Kauf genommen und in der Capability `schedule` festgehalten.

## Zwei Bruchstellen, die benannt gehören

**Die Modulnummer steht bei Prüfungen nur im Namensfeld.** INT-009 hält bei Datensätzen mit `eventType: "Event"` die Felder `courseId` und `courseOfStudy` leer; die Modulnummer steckt allein in der Zeichenkette `name` (`Prüfung <courseId> <Bezeichnung>`). Die Ableitung muss sie also aus dem Namen herauslösen. Ändert der Fachbereich diese Schreibweise, bricht die Zuordnung — deshalb muss ein Eintrag, dessen Muster nicht greift, als Prüfung ohne Modulbezug geführt und der Vorfall protokolliert werden, statt still zu verschwinden (SEC-F-060).

**Ob der Bestand vollständig und rechtzeitig gepflegt wird, ist unbelegt.** Bekannt ist nur, dass solche Einträge vorkommen. Der INT-009-Spike, der nach `herkunft-schedule-durchsprache` ohnehin Vorbedingung von Roadmap-Schritt 6 ist, prüft das mit. Findet er eine Lücke, ist das eine neue Entscheidung — kein stiller Rückfall auf den Upload.
