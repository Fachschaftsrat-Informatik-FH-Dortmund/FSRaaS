## ADDED Requirements

### Requirement: Planungsmodus mit Wochentagsgliederung

Das System muss die Wahl von Veranstaltungsart und Gruppen-Slot in einem eigenen Bildschirm führen, der die Termine der gewählten Module nach Wochentagen gliedert und innerhalb eines Wochentags aufsteigend nach Beginnzeit ordnet. Der Bildschirm muss nach dem erstmaligen Zusammenstellen jederzeit erneut erreichbar sein. Herkunft: NEU, entschieden 2026-09-08, Form übernommen aus alte apps/android-fb4/FB4/fB4/src/main/java/de/fsrfb4/fb4/activities/timetable/AddEventsActivity.java. Die Android-Alt-App gliedert ihren Auswahlbildschirm über einen `TabLayout` je Wochentag mit einer chronologischen Kartenliste je Tag; diese Form hat sich bewährt. Übernommen wird sie mit zwei Unterschieden: Sie zeigt nur die Termine zuvor gewählter Module statt des gesamten Bestands, und sie trägt die Kennzeichnungen des Planungsstands, die der Alt-App fehlen.

#### Scenario: Planungsmodus öffnen
- **WHEN** die Nutzerin nach der Modulauswahl in den Planungsmodus wechselt
- **THEN** zeigt das System die Termine der gewählten Module nach Wochentagen gegliedert, je Wochentag aufsteigend nach Beginnzeit

#### Scenario: Erneuter Aufruf
- **WHEN** ein persönlicher Plan bereits besteht und die Nutzerin eine einzelne Entscheidung ändern will
- **THEN** ist der Planungsmodus erneut erreichbar, ohne dass der Plan geleert oder die Modulauswahl wiederholt werden muss

### Requirement: Vorbelegung eindeutiger Veranstaltungen

Wenn eine Veranstaltungsart eines gewählten Moduls genau einen Gruppen-Slot anbietet, dann muss das System diesen beim Öffnen des Planungsmodus als gewählt vorbelegen. Bietet eine Veranstaltungsart mehrere Slots an, darf das System keinen davon vorbelegen, auch wenn die Gruppenkennung genau einen einschließt. Herkunft: NEU, entschieden 2026-09-08, Bestandsaufnahme über eine Live-Abfrage von INT-002 am selben Tag. Von dreizehn Kombinationen aus Modul und Veranstaltungsart bei sechs Modulen des 2. Fachsemesters von `INPBPI` bieten sieben genau einen Slot an — dort gibt es nichts zu entscheiden, und ein Häkchen, das die Nutzerin selbst setzen müsste, wäre nur eine Gelegenheit, es zu vergessen. Wo mehrere Slots bestehen, bleibt die Wahl bei ihr, auch wenn die Gruppenkennung sie nahelegt.

#### Scenario: Veranstaltungsart mit einem einzigen Slot
- **WHEN** eine Veranstaltungsart eines gewählten Moduls genau einen Termin anbietet
- **THEN** ist dieser Termin beim Öffnen des Planungsmodus bereits gewählt

#### Scenario: Veranstaltungsart mit mehreren Slots
- **WHEN** eine Veranstaltungsart mehrere Termine anbietet und die Gruppenkennung genau einen davon einschließt
- **THEN** bleibt kein Termin dieser Veranstaltungsart vorbelegt, der zur Gruppenkennung passende ist aber hervorgehoben

### Requirement: Hervorhebung der eigenen Gruppe im Planungsmodus

Das System muss im Planungsmodus die Termine, deren `studentSet` die eigene Gruppenkennung einschließt, gegenüber den übrigen hervorheben und diese Bedeutung zusätzlich zur Farbe über Text oder Symbol tragen. Es darf dabei keinen Termin ausblenden. Herkunft: Alt: alte apps/android-fb4/FB4/fB4/src/main/java/de/fsrfb4/fb4/activities/timetable/AddEventsActivity.java:688-692. Die Alt-App färbt passende Karten orange ein und blendet trotz des Klassennamens `LetterFilter` nichts aus; der Buchstabe musste dort über einen Menüdialog eingegeben werden, während er hier aus der Einrichtung stammt. Die zusätzliche Kennzeichnung über Text oder Symbol verlangt die Capability `ux-and-theming`.

#### Scenario: Termin der eigenen Gruppe
- **WHEN** ein Termin die eigene Gruppenkennung einschließt
- **THEN** hebt das System ihn hervor und macht diese Bedeutung zusätzlich zur Farbe über Text oder Symbol erkennbar

#### Scenario: Gruppenfremder Termin bleibt wählbar
- **WHEN** ein Termin die eigene Gruppenkennung nicht einschließt
- **THEN** zeigt das System ihn weiterhin und lässt seine Wahl zu

### Requirement: Kennzeichnung des Planungsstands je Veranstaltung

Das System muss im Planungsmodus je Termin kennzeichnen, ob die zugehörige Veranstaltungsart des Moduls an keiner Stelle gewählt ist, ob sie bereits gewählt ist — mit Angabe der Anzahl gewählter Slots —, und ob die Wahl dieses Termins mit einem bereits gewählten Termin zeitlich kollidieren würde. Herkunft: NEU, entschieden 2026-09-08. Die Kennzeichnung „an keiner Stelle gewählt" ist das Mittel gegen den Fall, dass zu einem Modul das Praktikum übersehen wird — der Grund, aus dem die Alt-App beim Planen unzuverlässig war. Der Zähler bei „bereits gewählt" trennt die versehentliche Doppelbelegung von der bewussten Übernahme mehrerer Gruppen-Slots.

#### Scenario: Veranstaltungsart noch nirgends gewählt
- **WHEN** zu einem gewählten Modul und einer seiner Veranstaltungsarten an keinem Wochentag ein Termin gewählt ist
- **THEN** kennzeichnet das System die Termine dieser Veranstaltungsart als noch nicht eingeplant

#### Scenario: Veranstaltungsart bereits gewählt
- **WHEN** zu einer Veranstaltungsart bereits ein oder mehrere Termine gewählt sind
- **THEN** kennzeichnet das System ihre übrigen Termine als bereits zugewiesen und nennt die Anzahl der gewählten Slots

#### Scenario: Wahl würde kollidieren
- **WHEN** die Wahl eines Termins mit einem bereits gewählten Termin zeitlich überschneiden würde
- **THEN** kennzeichnet das System ihn als kollidierend, ohne ihn auszublenden oder seine Wahl zu verhindern

### Requirement: Leiste der ausstehenden Veranstaltungen

Das System muss im Planungsmodus dauerhaft anzeigen, welche Veranstaltungsarten gewählter Module noch an keiner Stelle eingeplant sind, und sie dabei benennen statt nur zu zählen. Ein Bedienweg von dort muss auf den Wochentag führen, an dem die betreffende Veranstaltung liegt, und sie hervorheben. Herkunft: NEU, entschieden 2026-09-08. Bei einer Gliederung nach Wochentagen ist immer nur ein Tag sichtbar; eine noch nicht eingeplante Veranstaltung an einem anderen Tag bliebe sonst unbemerkt, bis der Plan fertig scheint.

#### Scenario: Ausstehende Veranstaltung an einem anderen Tag
- **WHEN** eine Veranstaltungsart eines gewählten Moduls noch nirgends eingeplant ist und ihre Termine an einem gerade nicht sichtbaren Wochentag liegen
- **THEN** nennt die Leiste sie beim Namen, und ein Bedienweg von dort wechselt auf den betreffenden Wochentag und hebt sie hervor

#### Scenario: Nichts steht mehr aus
- **WHEN** zu jeder Veranstaltungsart jedes gewählten Moduls mindestens ein Termin gewählt ist
- **THEN** meldet die Leiste, dass nichts mehr aussteht

### Requirement: Zweckbestimmung eigener Termine

Eigene Termine dienen der Abbildung wiederkehrender Lehrveranstaltungen, die der FBWS nicht führt — etwa einer von einer lehrenden Person nebenher angebotenen Arbeitsgruppe oder eines Angebots, dessen Endpunkt keine verwertbaren Daten liefert. Das System darf sich nicht als allgemeiner Terminkalender darstellen und muss den Bedienweg zum Anlegen eigener Termine im Planungsmodus führen, nicht in der Wochenansicht. Herkunft: NEU, entschieden 2026-09-08. Die Zweckbestimmung fehlte bislang in der Capability, weshalb die Anforderungen zu eigenen Terminen offenließen, ob private Termine dazugehören. Sie tun es nicht.

#### Scenario: Bedienweg zum Anlegen
- **WHEN** die Nutzerin einen eigenen Termin anlegen will
- **THEN** bietet das System den Bedienweg dazu im Planungsmodus an

### Requirement: Erfassung von Uhrzeit und Datum über systemeigene Auswahl

Das System muss Beginnzeit, Endzeit und Datum eines eigenen Termins über die systemeigene Zeit- und Datumsauswahl erfassen, sodass unzulässige Eingaben nicht entstehen können, und den Wochentag über ein Auswahlfeld statt über eine Liste aller sieben Tage. Herkunft: NEU, entschieden 2026-09-08. Die bisherige Umsetzung erfasste beides als Freitext (`08:00`, `24.11.2026`), prüfte die Eingabe erst beim Speichern und meldete jeweils nur den ersten Fehler; die deutsche Datumskonvention war dabei fest verdrahtet, unabhängig von der Oberflächensprache.

#### Scenario: Uhrzeit erfassen
- **WHEN** die Nutzerin die Beginnzeit eines eigenen Termins angibt
- **THEN** erfasst das System sie über die systemeigene Zeitauswahl, sodass eine unzulässige Uhrzeit nicht entstehen kann

#### Scenario: Datum erfassen
- **WHEN** die Nutzerin einen einmaligen eigenen Termin anlegt und dessen Datum angibt
- **THEN** erfasst das System es über die systemeigene Datumsauswahl in der Konvention des Geräts

## MODIFIED Requirements

### Requirement: Status „fest" oder „vorgemerkt"

Das System muss jedem Termin des persönlichen Plans einen Status „fest" oder „vorgemerkt" zuordnen und dessen Wechsel über einen sichtbaren Bedienweg ermöglichen. Die Zuordnung muss im Planungsmodus ausdrücklich erfolgen: Ist zu einer Veranstaltungsart genau ein Termin gewählt, gilt er als „fest"; sind mehrere gewählt, bestimmt die Nutzerin, welcher davon „fest" ist und welche „vorgemerkt" sind. Eine Zuordnung nach der Reihenfolge, in der die Termine angetippt wurden, ist ausgeschlossen. Herkunft: Recherche: Rücksprache Studierender, 2026-09-04, Zuordnungsregel ergänzt 2026-09-08; vormals SCHED-F-570. Die bisherige Umsetzung vergab den Status in der Kursauswahl mechanisch nach Auswahlreihenfolge — der zuerst angetippte Slot wurde „fest", jeder weitere „vorgemerkt". Das trägt die Bedeutung nicht, die das Requirement „Kein Konflikthinweis bei vorgemerkten Terminen" dem Status gibt: „vorgemerkt" bezeichnet ein bewusstes Erwägen, nicht eine Position in einer Tippreihenfolge.

#### Scenario: Status wechseln
- **WHEN** die Nutzerin den Status eines Termins über den Bedienweg wechselt
- **THEN** übernimmt das System den neuen Status

#### Scenario: Eindeutige Wahl
- **WHEN** zu einer Veranstaltungsart genau ein Termin gewählt ist
- **THEN** führt das System ihn als „fest"

#### Scenario: Zwei Slots derselben Veranstaltungsart
- **WHEN** die Nutzerin zwei Termine derselben Veranstaltungsart wählt
- **THEN** bestimmt sie, welcher davon „fest" ist, und das System führt den anderen als „vorgemerkt"

### Requirement: Auswahl beim Anlegen des offiziellen Stundenplans

Das System muss beim Anlegen des offiziellen Stundenplans die Auswahl ermöglichen, welche der abgerufenen Veranstaltungen, Veranstaltungsarten und Gruppen-Slots übernommen werden. Die Wahl der Veranstaltungen erfolgt in der Modulauswahl, die von Veranstaltungsart und Gruppen-Slot im Planungsmodus. Herkunft: Alt: lib/areas/schedule/viewmodels/schedule_overview_viewmodel.dart:58-90, auf zwei Bedienschritte aufgeteilt 2026-09-08; vormals SCHED-F-245. Die Aufteilung trennt die Frage, welche Module belegt werden, von der Frage, zu welcher Gruppe man wann geht — die zweite braucht die Konfliktprüfung des Planungsmodus, die erste nicht.

#### Scenario: Auswahl beim Anlegen
- **WHEN** die Nutzerin den offiziellen Stundenplan anlegt
- **THEN** kann sie einzelne Veranstaltungen in der Modulauswahl und einzelne Veranstaltungsarten sowie Gruppen-Slots im Planungsmodus gezielt übernehmen oder weglassen

### Requirement: Mehrere Gruppen-Slots übernehmen

Das System muss der Nutzerin ermöglichen, mehrere Gruppen-Slots derselben Veranstaltung gleichzeitig in den Plan zu übernehmen, und dabei die Anzahl der übernommenen Slots erkennbar machen. Herkunft: Recherche: Rücksprache Studierender, 2026-09-04, Anzeige der Anzahl ergänzt 2026-09-08; vormals SCHED-F-620. Ohne die Anzahl ist eine bewusste Übernahme zweier Slots von einer versehentlichen Doppelbelegung nicht zu unterscheiden.

#### Scenario: Zwei Gruppen-Slots übernehmen
- **WHEN** die Nutzerin zwei Gruppen-Slots derselben Veranstaltung auswählt
- **THEN** übernimmt das System beide gemeinsam in den Plan

#### Scenario: Anzahl erkennbar
- **WHEN** zu einer Veranstaltungsart mehr als ein Gruppen-Slot übernommen ist
- **THEN** weist das System die Anzahl der übernommenen Slots an den betreffenden Terminen aus
