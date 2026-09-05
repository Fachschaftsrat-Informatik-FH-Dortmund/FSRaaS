## Purpose

Der Stundenplan ist die meistgenutzte Funktion beider Alt-Apps: Er zeigt Studierenden ihre Lehrveranstaltungen für die aktuelle Woche, gefiltert auf die tatsächlich relevante Gruppe, ergänzt um eigene Termine und einen Planungsmodus für Wahlpflichtfächer und Gruppenwechsel. Vormals `specs/features/schedule/spec.md` (Präfix `SCHED`), migriert nach ADR 0019. Owner: FSR FB4.

## Requirements

### Requirement: Fünf-Tage-Ansicht

Das System muss den Stundenplan mindestens in den fünf Wochentagen Montag bis Freitag darstellen. Herkunft: Alt: lib/main_page.dart (vormals SCHED-F-010).

#### Scenario: Regulärer Wochenplan
- **WHEN** der Stundenplan für eine laufende Woche angezeigt wird
- **THEN** zeigt das System mindestens die fünf Wochentage Montag bis Freitag

### Requirement: Studiengang- und Fachsemesterauswahl

Das System muss der Nutzerin die Auswahl eines Studiengangs und eines zugehörigen Fachsemesters aus der Capability `integrations` (INT-001) ermöglichen. Herkunft: Alt: lib/areas/schedule/screens/add_official_schedule_page.dart (vormals SCHED-F-020).

#### Scenario: Erstmalige Einrichtung
- **WHEN** die Nutzerin den Stundenplan erstmals einrichtet
- **THEN** bietet das System die Auswahl von Studiengang und Fachsemester aus der über INT-001 gelieferten Liste an

### Requirement: Terminabruf nach Auswahl

Wenn Studiengang und Fachsemester gewählt sind, muss das System die zugehörigen Termine über INT-002 (Capability `integrations`) abrufen und den fünf Wochentagen zuordnen. Herkunft: Alt: lib/areas/schedule/repositories/schedule_repository.dart (vormals SCHED-F-030).

#### Scenario: Termine nach Auswahl
- **WHEN** Studiengang und Fachsemester festgelegt sind
- **THEN** ruft das System die Termine über INT-002 ab und ordnet sie den fünf Wochentagen zu

### Requirement: Gruppenkennungs-Eingabeformat

Das System muss der Nutzerin die Angabe einer Gruppenkennung nach dem Muster `^[A-Z][0-9]*$` ermöglichen, wobei der Buchstabe verpflichtend und die Zahl freiwillig ist. Herkunft: Alt: lib/areas/schedule/models/selected_course_info.dart (vormals SCHED-F-040).

#### Scenario: Gültige Eingabe ohne Zahl
- **WHEN** die Nutzerin nur einen Buchstaben als Gruppenkennung eingibt (z. B. `D`)
- **THEN** akzeptiert das System die Eingabe als gültige Gruppenkennung

#### Scenario: Gültige Eingabe mit Zahl
- **WHEN** die Nutzerin Buchstabe und Zahl eingibt (z. B. `C8`)
- **THEN** akzeptiert das System die Eingabe als gültige Gruppenkennung

### Requirement: Alle Termine ohne Gruppenkennung

Solange keine Gruppenkennung angegeben ist, muss das System alle abgerufenen Termine unabhängig von ihrem `studentSet` anzeigen. Herkunft: Alt: lib/areas/schedule/viewmodels/schedule_overview_viewmodel.dart:210 (vormals SCHED-F-050).

#### Scenario: Keine Gruppenkennung gesetzt
- **WHEN** keine Gruppenkennung angegeben ist und ein Termin mit `studentSet` `C8` vorliegt
- **THEN** zeigt das System diesen Termin als zugehörig an

### Requirement: Wildcard im studentSet

Wenn `studentSet` eines Termins den Wert `*` trägt, dann muss das System diesen Termin für jede angegebene Gruppenkennung anzeigen. Herkunft: NEU (vormals SCHED-F-060). Die Android-Alt-App (`util/GroupLetterUtil.java`) behandelt `*` nicht gesondert und markiert einen für alle Gruppen gültigen Termin fälschlich als gruppenfremd; dieses Verhalten ist bewusst nicht übernommen, siehe Abschnitt „Bewusst nicht übernommenes Altverhalten".

#### Scenario: Wildcard bei gesetzter Gruppenkennung
- **WHEN** die Gruppenkennung `C8` gesetzt ist und ein Termin `studentSet` `*` trägt
- **THEN** zeigt das System diesen Termin als zugehörig an

### Requirement: Einzelwert im studentSet

Wenn `studentSet` eines Termins ein Einzelwert ohne Bindestrich ist (z. B. `C8`), dann muss das System ihn genau dann anzeigen, wenn der Buchstabenteil der Gruppenkennung mit dem Buchstabenteil des `studentSet`-Werts übereinstimmt. Herkunft: Alt: bewusst verworfen (vormals SCHED-F-070). Die Alt-App vergleicht an dieser Stelle fehlerhaft den Zahlenteil der Gruppenkennung (`info.groupNumber`) mit dem ersten Zeichen des `studentSet`-Werts (`schedule_overview_viewmodel.dart:216`), obwohl ein Buchstabenvergleich gemeint war; dieses Verhalten ist ausdrücklich das korrigierte Sollverhalten, nicht das beobachtete Altverhalten.

#### Scenario: Übereinstimmender Buchstabe, abweichende Zahl
- **WHEN** die Gruppenkennung `C8` gesetzt ist und ein Termin `studentSet` `C3` trägt
- **THEN** zeigt das System diesen Termin als zugehörig an, da nur der Buchstabe verglichen wird

#### Scenario: Abweichender Buchstabe
- **WHEN** die Gruppenkennung `C8` gesetzt ist und ein Termin `studentSet` `D3` trägt
- **THEN** zeigt das System diesen Termin als gruppenfremd an

#### Scenario: Einzelwert ohne Zahl
- **WHEN** die Gruppenkennung `D2` gesetzt ist und ein Termin `studentSet` `D` trägt
- **THEN** zeigt das System diesen Termin als zugehörig an

### Requirement: Bereichsangabe im studentSet

Wenn `studentSet` eines Termins ein Bereich der Form `A1-C9` ist, dann muss das System einen Termin genau dann anzeigen, wenn das Paar (Buchstabe, Zahl) der Gruppenkennung — die Zahl dabei numerisch, nicht als Zeichenkette, verglichen — innerhalb des durch Anfangs- und Endpaar aufgespannten Bereichs liegt, einschließlich beider Grenzen. Herkunft: Alt: lib/areas/schedule/viewmodels/schedule_overview_viewmodel.dart:218-249 (vormals SCHED-F-080). Der numerische statt zeichenweise Vergleich ist ausdrücklich festgehalten, weil ein reiner Zeichenkettenvergleich bei mehrstelligen Zahlen falsche Ergebnisse liefert (`"10"` wäre als Zeichenkette kleiner als `"9"`). Die Capability `quality-and-testing` verlangt automatisierte Tests genau für diesen Fall.

#### Scenario: Buchstabe echt innerhalb des Bereichs
- **WHEN** die Gruppenkennung `B5` gesetzt ist und ein Termin `studentSet` `A1-C9` trägt
- **THEN** zeigt das System diesen Termin als zugehörig an, da der Buchstabe B echt zwischen A und C liegt

#### Scenario: Paar entspricht der Anfangsgrenze
- **WHEN** die Gruppenkennung `A1` gesetzt ist und ein Termin `studentSet` `A1-C9` trägt
- **THEN** zeigt das System diesen Termin als zugehörig an, da die Grenze eingeschlossen ist

#### Scenario: Paar unterhalb der Anfangsgrenze
- **WHEN** die Gruppenkennung `A0` gesetzt ist und ein Termin `studentSet` `A1-C9` trägt
- **THEN** zeigt das System diesen Termin als gruppenfremd an

#### Scenario: Paar entspricht der Endgrenze
- **WHEN** die Gruppenkennung `C9` gesetzt ist und ein Termin `studentSet` `A1-C9` trägt
- **THEN** zeigt das System diesen Termin als zugehörig an, da die Grenze eingeschlossen ist

#### Scenario: Paar oberhalb der Endgrenze, numerischer Vergleich
- **WHEN** die Gruppenkennung `C10` gesetzt ist und ein Termin `studentSet` `A1-C9` trägt
- **THEN** zeigt das System diesen Termin als gruppenfremd an, da 10 numerisch größer als 9 ist (ein Zeichenkettenvergleich würde hier fälschlich „ja" liefern)

#### Scenario: Buchstabe außerhalb des Bereichs
- **WHEN** die Gruppenkennung `D2` gesetzt ist und ein Termin `studentSet` `A1-C9` trägt
- **THEN** zeigt das System diesen Termin als gruppenfremd an

#### Scenario: Gemischte Grenzen
- **WHEN** die Gruppenkennung `D2` gesetzt ist und ein Termin `studentSet` `C5-E` trägt
- **THEN** zeigt das System diesen Termin als zugehörig an, da (D,2) zwischen der Anfangsgrenze (C,5) und der offenen Endgrenze E liegt

### Requirement: Offene Bereichsgrenze im studentSet

Wenn eine Bereichsgrenze in `studentSet` keine Zahl trägt (z. B. `A-C9`), dann muss das System diese Grenze als offen behandeln und jede Zahl auf dem jeweiligen Grenzbuchstaben einschließen. Herkunft: Alt: lib/areas/schedule/viewmodels/schedule_overview_viewmodel.dart:225,235 (vormals SCHED-F-090).

#### Scenario: Offene Anfangsgrenze
- **WHEN** die Gruppenkennung `A5` gesetzt ist und ein Termin `studentSet` `A-C9` trägt
- **THEN** zeigt das System diesen Termin als zugehörig an, da bei Buchstabe A jede Zahl zählt

#### Scenario: Offene Endgrenze
- **WHEN** die Gruppenkennung `C1` gesetzt ist und ein Termin `studentSet` `A1-C` trägt
- **THEN** zeigt das System diesen Termin als zugehörig an, da bei Buchstabe C jede Zahl zählt

#### Scenario: Beide Grenzen offen
- **WHEN** die Gruppenkennung `M3` gesetzt ist und ein Termin `studentSet` `A-P` trägt
- **THEN** zeigt das System diesen Termin als zugehörig an

### Requirement: Leerer Tag bei Gruppenfilterung

Falls bei aktivem Ausblenden gruppenfremder Termine an einem Wochentag kein Termin verbleibt, muss das System diesen Tag als leer kennzeichnen und die Gruppenfilterung als Grund nennen. Herkunft: NEU (vormals SCHED-F-100).

#### Scenario: Alle Termine eines Tages ausgeblendet
- **WHEN** an einem Wochentag nach Ausblenden gruppenfremder Termine kein Termin verbleibt
- **THEN** kennzeichnet das System den Tag als leer und nennt die Gruppenfilterung als Grund

### Requirement: Anlegen eigener Termine

Das System muss der Nutzerin das Anlegen eigener, nicht-offizieller Termine mit Titel, Wochentag, Beginn- und Endzeit ermöglichen. Herkunft: Alt: lib/areas/schedule/screens/add_custom_schedule_item_page.dart (vormals SCHED-F-110).

#### Scenario: Eigenen Termin anlegen
- **WHEN** die Nutzerin einen eigenen Termin mit Titel, Wochentag, Beginn- und Endzeit einträgt
- **THEN** legt das System diesen Termin im persönlichen Plan an

### Requirement: Kennzeichnung eigener Termine

Das System muss eigene Termine dauerhaft von offiziellen FBWS-Terminen unterscheidbar kennzeichnen. Herkunft: Alt: bewusst verworfen (vormals SCHED-F-120).

#### Scenario: Eigener neben offiziellem Termin
- **WHEN** ein eigener und ein offizieller Termin gemeinsam dargestellt werden
- **THEN** sind beide anhand einer dauerhaften Kennzeichnung unterscheidbar

### Requirement: Bearbeiten und Löschen eigener Termine über sichtbaren Weg

Das System muss der Nutzerin das Bearbeiten und Löschen eigener Termine über einen sichtbaren Bedienweg ermöglichen, nicht ausschließlich über eine verdeckte Geste. Herkunft: Alt: bewusst verworfen (vormals SCHED-F-130).

#### Scenario: Eigenen Termin ändern
- **WHEN** die Nutzerin einen eigenen Termin öffnet
- **THEN** bietet das System einen sichtbaren Bedienweg zum Bearbeiten und Löschen an

### Requirement: Kennzeichnung gruppenfremder Termine statt Entfernen

Wenn die Nutzerin eine Gruppenkennung angibt, dann muss das System Termine des Auswahlbestands, deren `studentSet` diese Kennung nicht einschließt, als gruppenfremd gekennzeichnet darstellen, statt sie zu entfernen. Herkunft: Alt: lib/areas/schedule/widgets/schedule_card.dart:50-54 (vormals SCHED-F-140). Entscheidung FSR FB4, 2026-08-25: Kennzeichnen ist das Sollverhalten, siehe Erläuterung.

#### Scenario: Gruppenfremder Termin bleibt sichtbar
- **WHEN** eine Gruppenkennung gesetzt ist und ein Termin gemäß den Gruppenzuordnungs-Requirements als gruppenfremd gilt
- **THEN** zeigt das System diesen Termin weiterhin, aber als gruppenfremd gekennzeichnet an

### Requirement: Schalter zum Ausblenden gruppenfremder Termine

Das System muss der Nutzerin einen Schalter bereitstellen, mit dem gruppenfremde Termine ausgeblendet und wieder eingeblendet werden können. Herkunft: NEU (vormals SCHED-F-145).

#### Scenario: Schalter aktivieren
- **WHEN** die Nutzerin den Schalter für gruppenfremde Termine aktiviert
- **THEN** blendet das System gruppenfremde Termine aus, bis der Schalter wieder deaktiviert wird

### Requirement: Sprung zum aktuellen Wochentag

Wenn die Einstellung „beim Öffnen zum aktuellen Wochentag springen" aktiv ist, dann muss das System beim Öffnen des Stundenplans den aktuellen Wochentag anzeigen. Herkunft: Alt: lib/areas/schedule/viewmodels/schedule_overview_viewmodel.dart:124-134 (vormals SCHED-F-150).

#### Scenario: Öffnen mit aktivierter Einstellung
- **WHEN** die Einstellung aktiv ist und die Nutzerin den Stundenplan öffnet
- **THEN** zeigt das System den aktuellen Wochentag

### Requirement: Ausweichtag am Wochenende

Falls der aktuelle Tag ein Wochenendtag ohne Termine ist, muss das System beim automatischen Sprung zum aktuellen Wochentag stattdessen den nächsten Wochentag anzeigen, an dem Termine liegen. Herkunft: Alt: lib/areas/schedule/viewmodels/schedule_overview_viewmodel.dart:132 (vormals SCHED-F-160).

#### Scenario: Samstag ohne Termine
- **WHEN** der aktuelle Tag ein Samstag ohne Termine ist
- **THEN** zeigt das System beim automatischen Sprung den nächsten Wochentag mit Terminen

### Requirement: iCal-Export

Das System muss den dargestellten Stundenplan als iCal-Datei (.ics) exportierbar machen, als einmaligen, lokal erzeugten Export ohne serverseitige Beteiligung. Herkunft: Recherche: WhatsApp-Chat informatik-pi-ti-ds-ws-24-25, 2026-08-25 (vormals SCHED-F-170).

#### Scenario: Export auslösen
- **WHEN** die Nutzerin den Export auslöst
- **THEN** erzeugt das System eine lokale .ics-Datei ohne Serverbeteiligung

### Requirement: Hinweis bei Semesterwechsel

Wenn ein neues Semester beginnt, dann muss das System die Nutzerin auf eine mögliche Anpassung von Fachsemester und Gruppenkennung hinweisen. Herkunft: Recherche: WhatsApp-Chat praktische-informatik-ws-23-24, 2026-08-25 (vormals SCHED-F-180).

#### Scenario: Semesterbeginn erkannt
- **WHEN** ein neues Semester beginnt
- **THEN** weist das System auf eine mögliche Anpassung von Fachsemester und Gruppenkennung hin

### Requirement: Eigenen Termin als Prüfung kennzeichnen

Das System muss der Nutzerin das Kennzeichnen eines eigenen Termins als Prüfung ermöglichen. Herkunft: NEU (vormals SCHED-F-190).

#### Scenario: Eigene Prüfung eintragen
- **WHEN** die Nutzerin einen eigenen Termin als Prüfung markiert
- **THEN** führt das System diesen Termin als Prüfung

### Requirement: Auswahl aus dem offiziellen Prüfungsplan

Das System muss der Nutzerin die Auswahl relevanter Prüfungen aus dem importierten offiziellen Prüfungsplan (INT-013, Capability `integrations`) ermöglichen, einschließlich Prüfungen, die die Nutzerin nachholen möchte. Herkunft: NEU (vormals SCHED-F-200).

#### Scenario: Prüfung auswählen
- **WHEN** die Nutzerin aus dem importierten Prüfungsplan eine für sie relevante Prüfung wählt
- **THEN** übernimmt das System diese Prüfung in den persönlichen Stundenplan

### Requirement: Visuelle Kennzeichnung von Prüfungsterminen

Wenn ein Termin eine Prüfung ist — eigen als Prüfung gekennzeichnet oder aus dem Prüfungsplan ausgewählt —, muss das System ihn visuell gesondert von regulären Terminen kennzeichnen. Herkunft: NEU (vormals SCHED-F-210).

#### Scenario: Prüfungstermin im Plan
- **WHEN** ein Termin als Prüfung gilt
- **THEN** stellt das System ihn visuell gesondert von regulären Terminen dar

### Requirement: Benachrichtigung bei Prüfungsplan-Aktualisierung

Wenn das Backend eine Aktualisierung des offiziellen Prüfungsplans meldet und mindestens einer der lokal ausgewählten Prüfungstermine der Nutzerin davon betroffen ist, muss das System die Nutzerin darüber informieren. Herkunft: NEU (vormals SCHED-F-220). Verträgt sich mit der Anforderung „Kein serverseitiges Speichern des persönlichen Stundenplans" der Capability `backend-and-api` (API-F-100): Der Abgleich erfolgt lokal gegen die ausschließlich gerätegespeicherte Auswahl.

#### Scenario: Ausgewählte Prüfung betroffen
- **WHEN** eine Aktualisierung des Prüfungsplans einen lokal ausgewählten Prüfungstermin betrifft
- **THEN** informiert das System die Nutzerin darüber

### Requirement: Konflikthinweis bei festen Terminen

Wenn sich zwei Termine des persönlichen Plans mit dem Status „fest" zeitlich überschneiden, muss das System beide Termine mit einem sichtbaren Konflikthinweis darstellen, unabhängig davon, ob sie offiziell oder eigen sind. Herkunft: NEU (vormals SCHED-F-230).

#### Scenario: Zwei feste Termine überschneiden sich
- **WHEN** zwei Termine mit Status „fest" zeitlich überschneidend sind
- **THEN** stellt das System beide mit einem sichtbaren Konflikthinweis dar

### Requirement: Kalenderexport in Gerätekalender

Das System muss der Nutzerin das Übertragen der ausgewählten Termine in einen von ihr gewählten Gerätekalender ermöglichen, mit Angabe eines Zeitraums. Herkunft: Recherche: alte apps/android-fb4, dialog/CalendarExportDialog.java, 2026-08-25 (vormals SCHED-F-175).

#### Scenario: Übertragung in den Gerätekalender
- **WHEN** die Nutzerin einen Zielkalender und einen Zeitraum wählt
- **THEN** überträgt das System die ausgewählten Termine in diesen Kalender

### Requirement: Vorbelegter Exportzeitraum

Das System sollte den beim Kalenderexport vorgeschlagenen Zeitraum auf das serverseitig gepflegte aktuelle Semester (Beginn und Ende) vorbelegen. Herkunft: Recherche: alte apps/android-fb4, dialog/CalendarExportDialog.java:204,215, 2026-08-26 (vormals SCHED-F-176).

#### Scenario: Export-Dialog öffnen
- **WHEN** die Nutzerin den Export-Dialog öffnet
- **THEN** sind Von- und Bis-Feld mit dem aktuellen Semester vorbelegt und bleiben änderbar

### Requirement: Datei-Export als Rückfallweg

Falls die Berechtigung für den Gerätekalender nicht erteilt wird, muss das System den Datei-Export als Rückfallweg anbieten. Herkunft: NEU (vormals SCHED-F-177).

#### Scenario: Kalenderberechtigung verweigert
- **WHEN** die Kalenderberechtigung verweigert wird
- **THEN** bietet das System den Datei-Export (.ics) als Rückfallweg an

### Requirement: Auswahl der Terminarten beim Export

Das System muss der Nutzerin vor jedem Export die separate Auswahl ermöglichen, ob offizielle Termine, eigene Termine und Prüfungstermine jeweils enthalten sind. Herkunft: NEU (vormals SCHED-F-240).

#### Scenario: Export mit ausgewählten Terminarten
- **WHEN** die Nutzerin vor dem Export nur Prüfungstermine auswählt
- **THEN** enthält der Export ausschließlich Prüfungstermine

### Requirement: Auswahl beim Anlegen des offiziellen Stundenplans

Das System muss beim Anlegen des offiziellen Stundenplans die Auswahl ermöglichen, welche der abgerufenen Veranstaltungen, Veranstaltungsarten und Gruppen-Slots übernommen werden. Herkunft: Alt: lib/areas/schedule/viewmodels/schedule_overview_viewmodel.dart:58-90 (vormals SCHED-F-245).

#### Scenario: Auswahl beim Anlegen
- **WHEN** die Nutzerin den offiziellen Stundenplan anlegt
- **THEN** kann sie einzelne Veranstaltungen, Veranstaltungsarten und Gruppen-Slots gezielt übernehmen oder weglassen

### Requirement: Farbwahl je Termin

Das System muss der Nutzerin das Ändern der Farbe eines einzelnen Termins über einen sichtbaren Bedienweg ermöglichen, abweichend von der nach der Anforderung zur automatischen Farbzuweisung vergebenen Vorbelegung. Herkunft: Alt: lib/areas/schedule/widgets/schedule_list.dart:59-136 (vormals SCHED-F-247).

#### Scenario: Farbe ändern
- **WHEN** die Nutzerin für einen Termin eine andere Farbe wählt
- **THEN** übernimmt das System diese Farbe abweichend von der automatischen Zuweisung

### Requirement: Anzeige der Termindetails

Das System muss zu jedem offiziellen Termin Veranstaltungsart, Zeitraum, Bezeichnung, Gruppenangabe, lehrende Person und Raum anzeigen. Herkunft: Alt: lib/areas/schedule/widgets/schedule_card.dart:69-121 (vormals SCHED-F-248).

#### Scenario: Offizieller Termin dargestellt
- **WHEN** ein offizieller Termin angezeigt wird
- **THEN** zeigt das System Veranstaltungsart, Zeitraum, Bezeichnung, Gruppenangabe, lehrende Person und Raum

### Requirement: Zusatzangaben beim Anlegen eigener Termine

Das System muss beim Anlegen eines eigenen Termins zusätzlich zu Titel, Wochentag und Zeiten die optionale Angabe von Raum und lehrender Person ermöglichen. Herkunft: Alt: lib/areas/schedule/screens/add_custom_schedule_item_page.dart (vormals SCHED-F-249).

#### Scenario: Optionale Angaben
- **WHEN** die Nutzerin einen eigenen Termin anlegt und Raum sowie lehrende Person angibt
- **THEN** speichert das System diese Angaben am Termin

### Requirement: Sortierung nach Beginnzeit

Das System muss die Termine eines Wochentags aufsteigend nach Beginnzeit sortiert darstellen. Herkunft: Alt: lib/areas/schedule/models/schedule_item.dart:80-82 (vormals SCHED-F-252).

#### Scenario: Mehrere Termine an einem Tag
- **WHEN** ein Wochentag mehrere Termine führt
- **THEN** stellt das System sie aufsteigend nach Beginnzeit sortiert dar

### Requirement: Rückfallliste bei Studiengangsabruf

Falls die Studiengangsliste aus INT-001 nicht abrufbar ist, muss das System die vom Backend vorgehaltene Rückfallliste verwenden. Herkunft: Recherche: alte apps/android-fb4, retrofit/TimeTableFallbackApi.java, 2026-08-25 (vormals SCHED-F-254).

#### Scenario: INT-001 nicht erreichbar
- **WHEN** INT-001 nicht erreichbar ist
- **THEN** verwendet das System die vom eigenen Backend vorgehaltene Rückfallliste

### Requirement: Einsicht in Termine anderer Gruppen

Das System muss der Nutzerin ermöglichen, für eine einzelne offizielle Veranstaltung die Termine anderer Gruppen einzusehen, unabhängig von der eigenen Gruppenkennung. Herkunft: Recherche: WhatsApp-Chat fh-informatik-22-23 / informatik-pi-ti-ds-ws-24-25 / praktische-informatik-ws-23-24, 2026-08-25 (vormals SCHED-F-250).

#### Scenario: Termine anderer Gruppen ansehen
- **WHEN** die Nutzerin bei einer Pflichtveranstaltung die Termine anderer Gruppen aufruft
- **THEN** zeigt das System diese Termine unabhängig von der eigenen Gruppenkennung an

### Requirement: Übernahme des Termins einer anderen Gruppe

Das System muss der Nutzerin ermöglichen, einen eingesehenen Termin einer anderen Gruppe zusätzlich zu oder anstelle des eigenen Gruppentermins in den persönlichen Stundenplan zu übernehmen; ein so übernommener Termin bleibt als offizieller Termin gekennzeichnet. Herkunft: Recherche: WhatsApp-Chat informatik-pi-ti-ds-ws-24-25, 2026-08-25 (vormals SCHED-F-260).

#### Scenario: Termin einer anderen Gruppe übernehmen
- **WHEN** die Nutzerin einen eingesehenen Termin einer anderen Gruppe übernimmt
- **THEN** führt das System ihn im persönlichen Plan weiterhin als offiziellen Termin

### Requirement: Automatischer Bezug der Wahlpflicht-Sammelkategorie

Das System muss die Wahlpflichtmodul-Liste automatisch aus der dafür vorgesehenen FBWS-Sammelkategorie beziehen, ohne dass die Nutzerin ein Fachsemester manuell auswählen muss. Herkunft: Recherche: FBWS live abgefragt (WFPB), 2026-08-26 (vormals SCHED-F-400). Ersetzt die entfallene Anforderung zur manuellen Fachsemester-Auswahl, siehe „Entfallene Anforderungen (historisch)".

#### Scenario: Wahlpflichtliste automatisch beziehen
- **WHEN** die Wahlpflicht-Planung geöffnet wird
- **THEN** bezieht das System die Modulliste automatisch aus der FBWS-Sammelkategorie `WFPB`, ohne manuelle Fachsemester-Auswahl

### Requirement: Kandidat für die Planung auswählen

Das System muss der Nutzerin ermöglichen, eine Veranstaltung des Auswahlbestands als Kandidat für die Planung auszuwählen. Herkunft: NEU (vormals SCHED-F-280).

#### Scenario: Veranstaltung als Kandidat wählen
- **WHEN** die Nutzerin eine Veranstaltung des Auswahlbestands als Kandidat markiert
- **THEN** führt das System sie im Planungsmodus als Kandidat

### Requirement: Konfliktprüfung paralleler Termine

Wenn ein ausgewählter Kandidat mehrere parallele Termine (Gruppen) anbietet, muss das System jeden dieser Termine gegen die Termine des persönlichen Plans mit dem Status „fest" auf zeitliche Konflikte prüfen und je Termin kennzeichnen, ob er konfliktfrei ist. Herkunft: NEU (vormals SCHED-F-290).

#### Scenario: Mehrere parallele Gruppentermine
- **WHEN** ein Kandidat mehrere parallele Termine anbietet
- **THEN** prüft das System jeden Termin gegen die festen Termine des Plans und kennzeichnet ihn als konfliktfrei oder nicht

### Requirement: Hinweis bei fehlender konfliktfreier Option

Wenn für einen ausgewählten Kandidaten kein konfliktfreier Termin existiert, muss das System dies der Nutzerin explizit mitteilen, statt die Termine kommentarlos aus der Auswahl auszublenden. Herkunft: Recherche: WhatsApp-Chat praktische-informatik-ws-23-24 / informatik-pi-ti-ds-ws-24-25, 2026-08-25 (vormals SCHED-F-300).

#### Scenario: Keine konfliktfreie Option
- **WHEN** für einen Kandidaten kein konfliktfreier Termin existiert
- **THEN** teilt das System dies der Nutzerin explizit mit

### Requirement: Bewusste Übernahme trotz Konflikt

Das System muss der Nutzerin ermöglichen, trotz einer erkannten Kollision einen Termin bewusst in den Plan zu übernehmen; ein so übernommener Termin muss dauerhaft als „angenommener Konflikt" gekennzeichnet bleiben. Herkunft: NEU (vormals SCHED-F-310).

#### Scenario: Konflikt bewusst akzeptieren
- **WHEN** die Nutzerin trotz erkannter Kollision einen Termin übernimmt
- **THEN** kennzeichnet das System ihn dauerhaft als „angenommenen Konflikt"

### Requirement: Wochentagsangabe bei mehreren Optionen

Wenn mehrere konfliktfreie Termine für einen Kandidaten zur Auswahl stehen, muss das System zu jedem Termin den Wochentag anzeigen. Herkunft: Recherche: WhatsApp-Chat pi-8-semester-fh-informatik / praktische-informatik-ws-23-24, 2026-08-25 (vormals SCHED-F-320).

#### Scenario: Mehrere konfliktfreie Optionen
- **WHEN** mehrere konfliktfreie Termine eines Kandidaten zur Auswahl stehen
- **THEN** zeigt das System zu jedem den Wochentag an

### Requirement: Bevorzugtes Zeitfenster festlegen

Das System muss der Nutzerin ermöglichen, für den Planungsmodus ein bevorzugtes Zeitfenster (früheste Beginnzeit, späteste Endzeit) für die Anwesenheit an der Hochschule festzulegen. Herkunft: NEU (vormals SCHED-F-330).

#### Scenario: Zeitfenster festlegen
- **WHEN** die Nutzerin früheste Beginnzeit und späteste Endzeit festlegt
- **THEN** übernimmt das System dieses Zeitfenster für den Planungsmodus

### Requirement: Kennzeichnung außerhalb des Zeitfensters

Bei der Prüfung eines Kandidaten-Termins muss das System zusätzlich zur Kollisionsprüfung kennzeichnen, ob der Termin außerhalb des festgelegten Zeitfensters liegt, ohne ihn deswegen aus der Auswahl zu entfernen. Herkunft: NEU (vormals SCHED-F-340).

#### Scenario: Termin außerhalb des Zeitfensters
- **WHEN** ein konfliktfreier Kandidaten-Termin außerhalb des festgelegten Zeitfensters liegt
- **THEN** kennzeichnet das System ihn entsprechend, entfernt ihn aber nicht aus der Auswahl

### Requirement: Auswahl des Optimierungsmodus

Das System muss der Nutzerin für den Planungsmodus die Auswahl eines Optimierungsmodus ermöglichen, mindestens aus „minimale Zeit an der Hochschule", „ausgeglichener Tagesablauf" und „mehr Abstand zwischen Lerneinheiten". Herkunft: NEU (vormals SCHED-F-350). Die drei Modi sind ein Mindestumfang, keine abschließende Liste.

#### Scenario: Optimierungsmodus wählen
- **WHEN** die Nutzerin einen der drei Optimierungsmodi wählt
- **THEN** übernimmt das System ihn für die Reihung der Planungsvorschläge

### Requirement: Reihung nach Optimierungsmodus

Wenn im Planungsmodus mehrere konfliktfreie Termine für einen Kandidaten zur Auswahl stehen, muss das System sie entsprechend dem gewählten Optimierungsmodus ordnen, sodass die nach dessen Kriterium günstigste Option zuerst erscheint. Herkunft: NEU (vormals SCHED-F-360). Kriterien: *Tagesspanne* (Zeitraum von frühester Beginnzeit bis spätester Endzeit aller Termine eines Wochentags im übernommenen Plan, unter Einbeziehung des geprüften Kandidaten) und *Nachbarabstand* (kleinere der beiden Pausen zum unmittelbar vorangehenden bzw. nachfolgenden Termin desselben Wochentags; ohne anderen Termin gilt er als maximal). „Minimale Zeit an der Hochschule" bevorzugt die geringste zusätzliche bzw. unveränderte Tagesspanne, „Ausgeglichener Tagesablauf" die Tagesspanne, die einer Acht-Stunden-Spanne am nächsten kommt, „Mehr Abstand zwischen Lerneinheiten" den größten Nachbarabstand. Bei Gleichstand ist die Reihenfolge nicht weiter festgelegt (deterministisches, aber beliebiges Tie-Breaking genügt).

#### Scenario: Reihung nach „minimale Zeit an der Hochschule"
- **WHEN** mehrere konfliktfreie Termine zur Wahl stehen und der Modus „minimale Zeit an der Hochschule" aktiv ist
- **THEN** ordnet das System den Termin mit der geringsten zusätzlichen Tagesspanne an erste Stelle

#### Scenario: Reihung nach „mehr Abstand zwischen Lerneinheiten"
- **WHEN** mehrere konfliktfreie Termine zur Wahl stehen und der Modus „mehr Abstand zwischen Lerneinheiten" aktiv ist
- **THEN** ordnet das System den Termin mit dem größten Nachbarabstand an erste Stelle

### Requirement: Mehrere Kandidaten in der Planungsauswahl

Das System muss der Nutzerin ermöglichen, mehrere ausgewählte Kandidaten gleichzeitig in einer Planungsauswahl zu führen. Herkunft: NEU (vormals SCHED-F-370).

#### Scenario: Mehrere Kandidaten gleichzeitig führen
- **WHEN** die Nutzerin mehrere Kandidaten auswählt
- **THEN** führt das System sie gemeinsam in einer Planungsauswahl

### Requirement: Kandidat als Pflicht markieren

Das System muss der Nutzerin ermöglichen, einen Kandidaten innerhalb der Planungsauswahl als „Pflicht" zu markieren, sobald sie sich für dessen Teilnahme entschieden hat. Herkunft: NEU (vormals SCHED-F-380).

#### Scenario: Kandidat als Pflicht markieren
- **WHEN** die Nutzerin sich für einen Kandidaten entscheidet
- **THEN** markiert das System ihn in der Planungsauswahl als „Pflicht"

### Requirement: Konfliktprüfung gegenüber Pflicht-Kandidaten

Bei der Konfliktprüfung eines nicht als „Pflicht" markierten Kandidaten der Planungsauswahl muss das System dessen Termine gegen den bereits übernommenen Stundenplan sowie gegen die als „Pflicht" markierten Kandidaten derselben Planungsauswahl prüfen, nicht gegen andere, ebenfalls noch nicht als „Pflicht" markierte Kandidaten. Herkunft: NEU (vormals SCHED-F-390). Eine Vollkombinatorik über mehrere gleichzeitig unentschiedene Kandidaten wurde bewusst zurückgestellt (Rücksprache FSR FB4, 2026-08-25), siehe „Erläuterungen".

#### Scenario: Prüfung gegen Pflicht-Kandidaten
- **WHEN** zwei Kandidaten gleichzeitig unentschieden in der Planungsauswahl stehen
- **THEN** prüft das System jeden nur gegen den übernommenen Plan und die bereits als Pflicht markierten Kandidaten, nicht gegeneinander

### Requirement: Abgleich mit dem Raumplan

Das System muss jeden offiziellen Termin des persönlichen Stundenplans gegen die zwischengespeicherten Raumplan-Termine (INT-009, siehe Capability `room-finder`) abgleichen, zugeordnet vorrangig über die in beiden Beständen geführte Veranstaltungskennung `courseId` und ergänzend über Wochentag, Beginnzeit und Gruppenangabe; für Einträge ohne `courseId` gilt der Merkmalssatz Bezeichnung, Wochentag, Beginnzeit und Gruppenangabe als Rückfall. Herkunft: NEU (vormals SCHED-F-410).

#### Scenario: Zuordnung über courseId
- **WHEN** ein offizieller Termin und ein Raumplan-Eintrag dieselbe `courseId` führen
- **THEN** ordnet das System sie einander zu

#### Scenario: Rückfall ohne courseId
- **WHEN** ein Raumplan-Eintrag keine `courseId` führt
- **THEN** ordnet das System ihn über Bezeichnung, Wochentag, Beginnzeit und Gruppenangabe zu

### Requirement: Hinweis auf Raumabweichung

Wenn ein offizieller Termin im Raumplan zugeordnet werden kann, dort aber unter keiner der geführten Raumkennungen mit dem im Stundenplan gespeicherten Raum übereinstimmt, dann muss das System am betroffenen Stundenplan-Eintrag einen Hinweis auf eine mögliche Raumänderung mit der abweichenden Raumkennung anzeigen. Herkunft: NEU (vormals SCHED-F-420). Bewusst „unter keiner der geführten Raumkennungen": Eine regulär in zwei Räumen parallel angebotene Veranstaltung darf keinen Fehlalarm auslösen, wenn der gespeicherte Raum einer der beiden ist.

#### Scenario: Abweichender Raum
- **WHEN** der im Raumplan geführte Raum von keiner der für den Termin bekannten Raumkennungen abgedeckt wird
- **THEN** zeigt das System einen Hinweis mit der abweichenden Raumkennung

#### Scenario: Regulär parallel in zwei Räumen
- **WHEN** eine Veranstaltung regulär parallel in zwei Räumen angeboten wird und der gespeicherte Raum einer der beiden ist
- **THEN** zeigt das System keinen Abweichungshinweis

### Requirement: Hinweis auf fehlende Zuordnung im Raumplan

Wenn ein offizieller Termin im aktuellen Raumplan unter keinem Merkmalssatz zugeordnet werden kann, dann muss das System am betroffenen Stundenplan-Eintrag einen Hinweis anzeigen, dass der Termin im Raumplan fehlt und möglicherweise entfällt oder verlegt wurde. Herkunft: NEU (vormals SCHED-F-430).

#### Scenario: Termin im Raumplan nicht auffindbar
- **WHEN** ein offizieller Termin im aktuellen Raumplan unter keinem Merkmalssatz zugeordnet werden kann
- **THEN** zeigt das System den Hinweis auf möglichen Ausfall oder Verlegung

### Requirement: Kennzeichnung als unbestätigte Ableitung

Das System muss einen Hinweis auf Raumabweichung oder fehlende Zuordnung als unbestätigte Ableitung kennzeichnen und auf „FB-Aktuelles" (Capability `news`) als verbindliche Quelle verweisen. Herkunft: NEU (vormals SCHED-F-440).

#### Scenario: Hinweis angezeigt
- **WHEN** ein Raumabweichungs- oder Nicht-gefunden-Hinweis angezeigt wird
- **THEN** kennzeichnet das System ihn als unbestätigte Ableitung und verweist auf „FB-Aktuelles"

### Requirement: Kein Verändern des Eintrags bei Hinweis

Solange ein Hinweis auf Raumabweichung oder fehlende Zuordnung angezeigt wird, darf das System den betroffenen Stundenplan-Eintrag nicht verändern, verschieben, ausblenden oder dessen gespeicherten Raum überschreiben. Herkunft: NEU (vormals SCHED-F-445).

#### Scenario: Eintrag bleibt unverändert
- **WHEN** ein Abweichungs- oder Nicht-gefunden-Hinweis an einem Eintrag angezeigt wird
- **THEN** bleibt der gespeicherte Termin unverändert, unverschoben, sichtbar und mit unverändertem Raum

### Requirement: Kein Hinweis bei veraltetem Raumplan

Falls der Raumplan-Zwischenspeicher älter als die vorgesehene Aktualisierungsfrequenz ist, muss das System keinen Hinweis auf Raumabweichung oder fehlende Zuordnung anzeigen und stattdessen das Alter des Raumplan-Stands ausweisen. Herkunft: NEU (vormals SCHED-F-450).

#### Scenario: Veralteter Raumplan-Stand
- **WHEN** der Raumplan-Zwischenspeicher älter als die Aktualisierungsfrequenz ist
- **THEN** zeigt das System keinen Abweichungshinweis, sondern das Alter des Stands

### Requirement: Wochentagsleiste mit bedarfsweisem Samstag

Das System muss über dem Plan eine Leiste aller darzustellenden Wochentage anzeigen und einen Wochentag jenseits von Montag bis Freitag genau dann aufnehmen, wenn an ihm mindestens ein Termin liegt. Herkunft: Recherche: Rücksprache Studierender, 2026-09-04 (vormals SCHED-F-460).

#### Scenario: Samstag mit Termin
- **WHEN** an einem Samstag mindestens ein Termin liegt
- **THEN** nimmt das System den Samstag in die Wochentagsleiste auf

#### Scenario: Samstag ohne Termin
- **WHEN** an einem Samstag kein Termin liegt
- **THEN** lässt das System den Samstag in der Wochentagsleiste aus

### Requirement: Belegungsvorschau je Tag

Das System muss in der Wochentagsleiste je Tag eine Vorschau der Belegung anzeigen, aus der ohne Tageswechsel hervorgeht, ob und wie viele Termine an diesem Tag liegen. Herkunft: Recherche: Rücksprache Studierender, 2026-09-04 (vormals SCHED-F-470).

#### Scenario: Wochentagsleiste ansehen
- **WHEN** die Wochentagsleiste angezeigt wird
- **THEN** zeigt sie je Tag eine Vorschau der Anzahl der dort liegenden Termine

### Requirement: Kalenderdatum je Wochentag

Das System muss zu jedem dargestellten Wochentag das Kalenderdatum der angezeigten Woche ausweisen. Herkunft: Recherche: Rücksprache Studierender, 2026-09-04 (vormals SCHED-F-480).

#### Scenario: Woche angezeigt
- **WHEN** eine Woche dargestellt wird
- **THEN** trägt jeder Wochentag das zugehörige Kalenderdatum

### Requirement: Blättern über Wochengrenzen

Das System muss der Nutzerin das Blättern über Wochengrenzen hinweg sowie die Rückkehr zur laufenden Woche über einen sichtbaren Bedienweg ermöglichen. Herkunft: Recherche: Rücksprache Studierender, 2026-09-04 (vormals SCHED-F-490).

#### Scenario: In die Vorwoche und zurück blättern
- **WHEN** die Nutzerin in die Vorwoche blättert und danach zur laufenden Woche zurückkehrt
- **THEN** zeigt das System denselben Stand wie vor dem Blättern

### Requirement: Anzeige nur im Gültigkeitszeitraum

Das System muss einen offiziellen Termin nur in denjenigen Kalenderwochen anzeigen, die innerhalb seines aus INT-002 übernommenen Gültigkeitszeitraums liegen. Herkunft: Recherche: FBWS live abgefragt, 2026-09-04 (vormals SCHED-F-500).

#### Scenario: Veranstaltung endet in der Wochenmitte
- **WHEN** der Gültigkeitszeitraum einer Veranstaltung in der Wochenmitte endet
- **THEN** erscheint sie in der letzten zutreffenden Woche und in der darauffolgenden nicht mehr

### Requirement: Kennzeichnung vorlesungsfreier Wochen

Falls die angezeigte Woche außerhalb der Vorlesungszeit liegt, muss das System dies kenntlich machen, statt einen regulären Plan darzustellen. Herkunft: Recherche: Rücksprache Studierender, 2026-09-04 (vormals SCHED-F-510).

#### Scenario: Vorlesungsfreie Woche angezeigt
- **WHEN** die angezeigte Woche außerhalb der Vorlesungszeit liegt
- **THEN** kennzeichnet das System sie als vorlesungsfrei statt eines regulären Plans

### Requirement: Proportionale Zeitachse

Das System muss die Termine eines Tages auf einer zur Uhrzeit proportionalen Achse darstellen, sodass Zeiträume ohne Termin als Lücke mit Angabe ihrer Dauer erkennbar sind. Herkunft: Recherche: Rücksprache Studierender, 2026-09-04 (vormals SCHED-F-520).

#### Scenario: Freistunde zwischen zwei Terminen
- **WHEN** zwischen zwei Terminen eines Tages eine Lücke liegt
- **THEN** stellt das System sie proportional mit Angabe ihrer Dauer dar

### Requirement: Abschalten der proportionalen Zeitachse

Das System muss der Nutzerin eine Einstellung bereitstellen, mit der die proportionale Zeitachse zugunsten einer kompakten Liste ohne Lückendarstellung abgeschaltet werden kann. Herkunft: Recherche: Rücksprache Studierender, 2026-09-04 (vormals SCHED-F-530).

#### Scenario: Zeitachse abschalten
- **WHEN** die Nutzerin die Einstellung abschaltet
- **THEN** stellt das System die Termine als kompakte Liste ohne Lückendarstellung dar, die Terminfolge bleibt unverändert

### Requirement: Nebeneinanderdarstellung überschneidender Termine

Wenn sich Termine desselben Tages zeitlich überschneiden, muss das System sie nebeneinander darstellen, sodass jeder Termin einzeln erkenn- und auswählbar bleibt. Herkunft: Recherche: Rücksprache Studierender, 2026-09-04 (vormals SCHED-F-540).

#### Scenario: Überschneidende Termine
- **WHEN** sich zwei Termine desselben Tages zeitlich überschneiden
- **THEN** stellt das System beide nebeneinander, einzeln erkenn- und auswählbar dar

### Requirement: Anzeige des laufenden und nächsten Termins

Das System muss den gerade laufenden und den nächsten anstehenden Termin gemeinsam mit der verbleibenden Zeit in einer eigenen Anzeige über dem Plan ausweisen. Herkunft: Recherche: Rücksprache Studierender, 2026-09-04 (vormals SCHED-F-550).

#### Scenario: Blick auf den Plan während eines laufenden Termins
- **WHEN** ein Termin gerade läuft
- **THEN** zeigt das System ihn und den nächsten anstehenden Termin mit verbleibender Zeit über dem Plan

### Requirement: Hervorhebung des laufenden Termins und der aktuellen Uhrzeit

Das System muss den gerade laufenden Termin zusätzlich im Plan selbst hervorheben und die aktuelle Uhrzeit auf der Zeitachse des heutigen Tages kennzeichnen. Herkunft: Recherche: Rücksprache Studierender, 2026-09-04 (vormals SCHED-F-560). Eine Bewegung in dieser Anzeige unterliegt der Anforderung zur Bewegungsreduktion der Capability `non-functional` und entfällt bei entsprechender Systemeinstellung.

#### Scenario: Laufender Termin im Plan
- **WHEN** ein Termin gerade läuft
- **THEN** hebt das System ihn im Plan hervor und kennzeichnet die aktuelle Uhrzeit auf der Zeitachse

### Requirement: Status „fest" oder „vorgemerkt"

Das System muss jedem Termin des persönlichen Plans einen Status „fest" oder „vorgemerkt" zuordnen und dessen Wechsel über einen sichtbaren Bedienweg ermöglichen. Herkunft: Recherche: Rücksprache Studierender, 2026-09-04 (vormals SCHED-F-570).

#### Scenario: Status wechseln
- **WHEN** die Nutzerin den Status eines Termins über den Bedienweg wechselt
- **THEN** übernimmt das System den neuen Status

### Requirement: Unterscheidung vorgemerkter Termine

Das System muss vorgemerkte Termine von festen Terminen zusätzlich zur Farbgebung durch Text oder Symbol unterscheidbar darstellen. Herkunft: Recherche: Rücksprache Studierender, 2026-09-04 (vormals SCHED-F-580).

#### Scenario: Vorgemerkter Termin dargestellt
- **WHEN** ein Termin den Status „vorgemerkt" trägt
- **THEN** ist er zusätzlich zur Farbe durch Text oder Symbol als solcher erkennbar

### Requirement: Kein Konflikthinweis bei vorgemerkten Terminen

Wenn sich ein vorgemerkter Termin zeitlich mit einem anderen Termin überschneidet, darf das System dafür keinen Konflikthinweis erzeugen. Herkunft: Recherche: Rücksprache Studierender, 2026-09-04 (vormals SCHED-F-590).

#### Scenario: Vorgemerkter Termin überschneidet sich
- **WHEN** sich ein vorgemerkter Termin zeitlich mit einem anderen Termin überschneidet
- **THEN** erzeugt das System keinen Konflikthinweis

### Requirement: Gliederung des Auswahlbestands

Das System muss den Auswahlbestand nach Veranstaltung, darunter nach Veranstaltungsart und darunter nach Gruppen-Slot gegliedert darstellen, statt als flache Liste einzelner Termine. Herkunft: Recherche: FBWS live abgefragt, 2026-09-04 (vormals SCHED-F-600). Die Live-Prüfung vom 2026-09-04 ergab 121 Termine für ein einzelnes Fachsemester und 161 für die Wahlpflicht-Sammelkategorie — eine flache Liste ist in dieser Größenordnung nicht bedienbar.

#### Scenario: Auswahlbestand öffnen
- **WHEN** die Nutzerin den Auswahlbestand öffnet
- **THEN** gliedert das System ihn dreistufig nach Veranstaltung, Veranstaltungsart und Gruppen-Slot

### Requirement: Abwahl einzelner Veranstaltungsarten

Das System muss der Nutzerin ermöglichen, einzelne Veranstaltungsarten einer Veranstaltung abzuwählen, ohne die Veranstaltung selbst abzuwählen. Herkunft: Recherche: Rücksprache Studierender, 2026-09-04 (vormals SCHED-F-610).

#### Scenario: Praktikum abwählen
- **WHEN** die Nutzerin die Veranstaltungsart „Praktikum" einer Veranstaltung abwählt
- **THEN** bleiben die übrigen Veranstaltungsarten derselben Veranstaltung ausgewählt

### Requirement: Mehrere Gruppen-Slots übernehmen

Das System muss der Nutzerin ermöglichen, mehrere Gruppen-Slots derselben Veranstaltung gleichzeitig in den Plan zu übernehmen. Herkunft: Recherche: Rücksprache Studierender, 2026-09-04 (vormals SCHED-F-620).

#### Scenario: Zwei Gruppen-Slots übernehmen
- **WHEN** die Nutzerin zwei Gruppen-Slots derselben Veranstaltung auswählt
- **THEN** übernimmt das System beide gemeinsam in den Plan

### Requirement: Freitextsuche im Auswahlbestand

Das System muss eine Freitextsuche über den Auswahlbestand bereitstellen, die Bezeichnung, Modulnummer und lehrende Person berücksichtigt. Herkunft: Recherche: Rücksprache Studierender, 2026-09-04 (vormals SCHED-F-630).

#### Scenario: Suche nach Modulnummer
- **WHEN** die Nutzerin nach einer Modulnummer sucht
- **THEN** findet das System die zugehörige Veranstaltung

### Requirement: Erweiterung um weitere Fachsemester

Das System muss der Nutzerin ermöglichen, den Auswahlbestand um die Termine weiterer Fachsemester desselben Studiengangs zu erweitern und nach Fachsemester zu filtern. Herkunft: Recherche: Rücksprache Studierender, 2026-09-04 (vormals SCHED-F-640). Löst in der Sache das entfallene Requirement zur manuellen Fachsemester-Auswahl für Wiederholerinnen und Vorzieherinnen ab, siehe „Erläuterungen".

#### Scenario: Weiteres Fachsemester hinzufügen
- **WHEN** die Nutzerin ein weiteres Fachsemester desselben Studiengangs hinzufügt
- **THEN** enthält der Auswahlbestand dessen Veranstaltungen und lässt sich danach filtern

### Requirement: Rückmeldung während der Eingabe der Gruppenkennung

Während der Eingabe der Gruppenkennung muss das System zurückmelden, wie viele Termine des Auswahlbestands die Kennung einschließt. Herkunft: Recherche: FBWS live abgefragt, 2026-09-04 (vormals SCHED-F-650).

#### Scenario: Eingabe ohne Treffer
- **WHEN** die eingegebene Gruppenkennung keinen Termin einschließt
- **THEN** meldet das System „0 von N Terminen" unmittelbar zurück, ohne die Eingabe zu verwerfen

### Requirement: Automatische Farbzuweisung

Das System muss jeder Veranstaltung beim Anlegen selbsttätig eine Farbe zuweisen, die für dieselbe Veranstaltung gleich bleibt und von der Nutzerin über den Bedienweg zur Farbwahl überschrieben werden kann. Herkunft: NEU (vormals SCHED-F-660).

#### Scenario: Veranstaltung erneut angelegt
- **WHEN** dieselbe Veranstaltung erneut angelegt wird
- **THEN** vergibt das System dieselbe automatische Farbe wie zuvor

### Requirement: Kandidaten aus allen Quellen zulassen

Das System muss als Kandidaten für den Planungsmodus jede Veranstaltung des Auswahlbestands zulassen, unabhängig davon, ob sie aus dem eigenen Fachsemester, einem weiteren Fachsemester oder der Wahlpflicht-Sammelkategorie stammt. Herkunft: Recherche: Rücksprache Studierender, 2026-09-04 (vormals SCHED-F-670).

#### Scenario: Veranstaltung aus weiterem Fachsemester als Kandidat
- **WHEN** eine Veranstaltung aus einem zusätzlich hinzugefügten Fachsemester stammt
- **THEN** lässt das System sie ebenso als Planungskandidaten zu wie eine Veranstaltung des eigenen Fachsemesters

### Requirement: Automatischer Planungsvorschlag

Das System muss der Nutzerin ermöglichen, aus den Kandidaten der Planungsauswahl selbsttätig einen konfliktfreien Vorschlag nach dem gewählten Optimierungsmodus erzeugen zu lassen, den sie vor der Übernahme einsehen und einzeln ändern kann. Herkunft: Recherche: Rücksprache Studierender, 2026-09-04 (vormals SCHED-F-680).

#### Scenario: Vorschlag erzeugen und ändern
- **WHEN** die Nutzerin einen Vorschlag erzeugen lässt
- **THEN** zeigt das System ihn vor der Übernahme an und lässt einzelne Termine ändern, bevor der Plan sich ändert

### Requirement: Ermittlung der Gruppenkennung über Matrikelnummer

Das System muss der Nutzerin anbieten, die Gruppenkennung anhand ihrer Matrikelnummer über INT-019 (Capability `integrations`) zu ermitteln, statt sie von Hand einzugeben. Herkunft: Recherche: Rücksprache Studierender mit Beispielaufruf, 2026-09-04 (vormals SCHED-F-690).

#### Scenario: Ermittlung über Matrikelnummer
- **WHEN** die Nutzerin ihre Matrikelnummer eingibt
- **THEN** ermittelt das System die Gruppenkennung über INT-019

### Requirement: Bestätigung der ermittelten Gruppenkennung

Wenn eine Gruppenkennung ermittelt wurde, muss das System sie der Nutzerin zur Bestätigung anzeigen, bevor sie übernommen wird. Herkunft: Recherche: FBWS live abgefragt, 2026-09-04 (vormals SCHED-F-700). INT-019 beantwortet auch offensichtlich ungültige Nummern mit einer plausibel aussehenden Kennung und meldet eine unbekannte Nummer nicht als Fehler, sondern mit Status 200 in einer von zwei stillen Gestalten (`{"fhDoStudentSet":false}` oder `[]`); die Auswertung prüft auf eine nicht-leere Zeichenkette, nicht auf bloßes Vorhandensein des Feldes.

#### Scenario: Ermittelte Kennung bestätigen
- **WHEN** INT-019 eine Kennung liefert
- **THEN** zeigt das System sie zur Bestätigung an, bevor sie übernommen wird

#### Scenario: Unbekannte Matrikelnummer
- **WHEN** INT-019 mit `{"fhDoStudentSet":false}` oder `[]` antwortet
- **THEN** behandelt das System beide Fälle gleich als „keine Gruppe hinterlegt" und übernimmt keine Kennung

### Requirement: Lokale Speicherung der Matrikelnummer

Das System muss die Matrikelnummer ausschließlich auf dem Gerät speichern und sie an kein anderes Ziel als INT-019 übertragen. Herkunft: NEU (vormals SCHED-F-710).

#### Scenario: Matrikelnummer im Netzwerkmitschnitt
- **WHEN** ein Netzwerkmitschnitt während der Nutzung erstellt wird
- **THEN** erscheint die Matrikelnummer in keinem Aufruf außer gegen INT-019

### Requirement: Gruppenkennung ohne Matrikelnummer

Das System muss die Gruppenkennung auch ohne Angabe einer Matrikelnummer festlegbar machen und dabei den Buchstaben als maßgebliche Angabe führen, die Zahl als freiwillige Ergänzung. Herkunft: Recherche: Rücksprache Studierender, 2026-09-04 (vormals SCHED-F-720).

#### Scenario: Einrichtung ohne Matrikelnummer
- **WHEN** die Nutzerin keine Matrikelnummer angibt
- **THEN** lässt sich die Einrichtung dennoch durch manuelle Angabe der Gruppenkennung abschließen

### Requirement: Wiederkehrend oder einmalig bei eigenen Terminen

Das System muss beim Anlegen eines eigenen Eintrags die Wahl ermöglichen, ob er wöchentlich wiederkehrt oder einmalig an einem bestimmten Datum stattfindet. Herkunft: Recherche: Rücksprache Studierender, 2026-09-04 (vormals SCHED-F-730).

#### Scenario: Wöchentlich wiederkehrender Eintrag
- **WHEN** die Nutzerin einen eigenen Eintrag als wöchentlich wiederkehrend anlegt
- **THEN** erscheint er in jeder Woche seines Gültigkeitszeitraums

#### Scenario: Einmaliger Eintrag
- **WHEN** die Nutzerin einen eigenen Eintrag als einmalig an einem Datum anlegt
- **THEN** erscheint er nur in der Woche dieses Datums

### Requirement: Zeitziel beim Blättern zwischen Wochentagen

Das System muss beim Blättern zwischen Wochentagen die Zielwerte der Capability `non-functional` (NFR-N-040) einhalten. Herkunft: NEU (vormals SCHED-N-010).

#### Scenario: Wochentagswechsel
- **WHEN** die Nutzerin zwischen zwei Wochentagen blättert
- **THEN** hält das System den in der Capability `non-functional` festgelegten Zeitwert ein

## Entfallene Anforderungen (historisch)

### Ehemals SCHED-F-270: Zweites Fachsemester für die Wahlpflicht-Planung

Ursprünglicher Text: „Das System muss der Nutzerin ermöglichen, zusätzlich zum eigenen Fachsemester ein weiteres Fachsemester desselben Studiengangs auszuwählen, um dessen Termine für die Wahlpflicht-Planung abzurufen." Herkunft: Recherche: WhatsApp-Chat pi-8-semester-fh-informatik, 2026-08-25.

Status: entfallen (Entscheidung FSR FB4, 2026-08-26). Grund: Die Live-Prüfung vom 2026-08-26 zeigte, dass die FBWS-Sammelkategorie `WFPB` alle aktuell angebotenen Wahlpflichtmodule automatisch liefert — ersetzt durch die Anforderung „Automatischer Bezug der Wahlpflicht-Sammelkategorie" (vormals SCHED-F-400). Die ursprünglich befürchtete Notwendigkeit einer manuellen Fachsemester-Auswahl entfiel damit für die Wahlpflicht-Planung; für Wiederholerinnen und Vorzieherinnen deckt seit 2026-09-04 die Anforderung „Erweiterung um weitere Fachsemester" (vormals SCHED-F-640) denselben fachlichen Bedarf auf andere Weise ab.

## Scope / Nicht-Scope

### Scope

- Anzeige offizieller FBWS-Termine (INT-002) für einen gewählten Studiengang und ein gewähltes Fachsemester, wahlweise erweitert um weitere Fachsemester desselben Studiengangs.
- Darstellung in echten Kalenderwochen mit Datumsbezug, einschließlich Blättern über Wochengrenzen und Kennzeichnung vorlesungsfreier Wochen.
- Kursbasierte Zusammenstellung des Plans über die Ebenen Veranstaltung, Veranstaltungsart und Gruppen-Slot, mit Suche und Filtern.
- Führen eines Termins wahlweise als „fest" oder „vorgemerkt", um sich mehrere zeitgleiche Angebote bewusst offenzuhalten.
- Lokale Filterung nach Gruppenkennung (`studentSet`-Abgleich, siehe „Beispieltabelle Gruppenzuordnung").
- Anlegen, Bearbeiten und Löschen eigener, nicht-offizieller Einträge — wahlweise wöchentlich wiederkehrend oder einmalig an einem Datum —, einschließlich eigener Prüfungstermine.
- Ermittlung der Gruppenkennung aus der Matrikelnummer (INT-019) als Alternative zur manuellen Eingabe.
- Lokale Persistenz des Stundenplans über App-Neustarts hinweg (siehe Capability `data-and-storage`, DATA-F-010).
- Auswahl relevanter Prüfungstermine aus dem vom FSR/Admin importierten offiziellen Prüfungsplan (INT-013) und deren Anzeige im Stundenplan, gesondert gekennzeichnet.
- Benachrichtigung bei Änderungen an ausgewählten Prüfungsterminen.
- Planungsmodus: Einsicht und Übernahme einzelner Termine anderer Gruppen für eine Pflichtveranstaltung.
- Planungsmodus: Auswahl konfliktfreier Termine für Wahlpflichtmodule gegenüber dem eigenen Stundenplan, einschließlich explizitem Hinweis bei fehlender konfliktfreier Konstellation.
- Planungsmodus: auswählbares bevorzugtes Zeitfenster für die Anwesenheit an der Hochschule sowie auswählbarer Optimierungsmodus, nach dem mehrere konfliktfreie Terminoptionen geordnet werden.
- Planungsmodus: mehrere Wahlpflichtmodule gleichzeitig in einer Planungsauswahl führen und einzelne davon als „Pflicht" markieren, um weitere Kandidaten dagegen zu prüfen.
- Abgleich der eigenen offiziellen Termine gegen den Raumplan (INT-009) und Hinweis am Stundenplan-Eintrag bei abweichendem Raum oder fehlender Zuordnung.

### Nicht-Scope

- Raumbelegung/-verfügbarkeit über den eigenen Stundenplan hinaus — siehe Capability `room-finder`.
- Serverseitige Speicherung des persönlichen Stundenplans einschließlich der individuellen Prüfungsauswahl — ausdrücklich ausgeschlossen, siehe Capability `backend-and-api` (API-F-100) und die Erläuterung zur Anforderung „Benachrichtigung bei Prüfungsplan-Aktualisierung".
- Import und Pflege des offiziellen Prüfungsplans selbst (Excel-Upload, Jahres-Rotation) — Backend-Vorgang, siehe Capability `backend-and-api` (API-F-180 bis API-F-200) und Capability `integrations` (INT-013).
- Notenergebnisse zu Prüfungen — siehe Capability `grades`; diese Spec zeigt ausschließlich Termine, keine Ergebnisse.
- Automatische, kombinatorische Optimierung über mehrere gleichzeitig **unentschiedene** Wahlpflicht-Kandidaten hinweg — mehrere Kandidaten können gleichzeitig in der Planungsauswahl geführt werden, die Konfliktprüfung erfolgt aber je Kandidat einzeln gegen den bereits übernommenen Plan und die bereits als „Pflicht" markierten Module, nicht kombinatorisch zwischen mehreren noch unentschiedenen Kandidaten. Diese Ausgestaltung wurde bewusst erwogen und zurückgestellt (Rücksprache FSR FB4, 2026-08-25).
- Echtzeit- oder Kapazitätsdaten zu Veranstaltungen (z. B. Auslastung, freie Plätze) — INT-002 liefert dazu keine Felder, siehe Capability `integrations`.
- Verbindliche Auskunft über Ausfall oder Raumänderung — der Abgleich liefert nur einen unbestätigten Hinweis; die verbindliche Quelle für Raumänderungen ist „FB-Aktuelles" (Capability `news`, Capability `integrations` INT-010).

## Nutzergeschichten

- Als Studierende möchte ich meinen Studiengang und mein Semester einmalig auswählen, damit ich danach meinen Stundenplan ohne erneute Eingabe sehe.
- Als Studierende möchte ich eine Gruppenkennung angeben, damit ich nur Termine sehe, die tatsächlich für meine Gruppe gelten.
- Als Studierende möchte ich eigene Termine (z. B. Lerngruppen) neben den offiziellen Terminen führen, damit ich nicht zwei getrennte Kalender pflegen muss.
- Als Studierende möchte ich beim Öffnen der App direkt beim aktuellen Wochentag landen, damit ich nicht manuell blättern muss.
- Als Studierende möchte ich aus dem offiziellen Prüfungsplan genau die Prüfungen auswählen, die mich betreffen (einschließlich Nachholprüfungen), damit ich nicht alle Prüfungstermine des Fachbereichs sehe.
- Als Studierende möchte ich eine eigene Prüfung eintragen können, falls sie nicht im offiziellen Prüfungsplan steht.
- Als Studierende möchte ich informiert werden, wenn sich eine von mir ausgewählte Prüfung verschiebt.
- Als Studierende möchte ich erkennen, wenn sich ein eigener Termin mit einem offiziellen überschneidet, damit ich den Konflikt nicht übersehe.
- Als Studierende möchte ich meinen Stundenplan als Kalenderdatei exportieren können, damit ich ihn in meiner bevorzugten Kalender-App weiterverwenden kann, statt eine zusätzliche App offen zu halten.
- Als Studierende möchte ich bei einem Semesterwechsel darauf hingewiesen werden, dass sich meine Gruppenkennung geändert haben könnte, damit mein Stundenplan nicht unbemerkt veraltet.
- Als Studierende möchte ich für eine Pflichtveranstaltung auch die Termine anderer Gruppen sehen, damit ich bei Terminkollision oder einem verpassten eigenen Termin gezielt zu einer passenderen Gruppe ausweichen kann.
- Als Studierende möchte ich beim Zusammenstellen meines Stundenplans mit Wahlpflichtfächern unterstützt werden, damit ich nicht jedes in Frage kommende Modul einzeln manuell auf Kollisionen mit meinem übrigen Stundenplan prüfen muss.
- Als Studierende möchte ich explizit informiert werden, wenn es für ein gewünschtes Wahlpflichtmodul keine mit meinem Stundenplan konfliktfreie Terminoption gibt, statt das mühsam selbst herauszufinden oder es erst beim Nichterscheinen-Können zu merken.
- Als Studierende möchte ich trotz einer erkannten Terminkollision ein Wahlpflichtmodul bewusst in meinen Plan aufnehmen können, falls ich die verpasste Veranstaltung nacharbeiten möchte.
- Als Studierende möchte ich festlegen, in welchem Zeitfenster ich überhaupt an der Hochschule sein möchte, damit mir der Planungsmodus keine für mich unpassend frühen oder späten Termine bevorzugt vorschlägt.
- Als Studierende möchte ich zwischen verschiedenen Optimierungszielen wählen (z. B. möglichst wenig Zeit vor Ort, ein ausgeglichener Tagesablauf oder mehr Pausen zwischen Terminen), damit der Planungsmodus zu meiner persönlichen Situation passt.
- Als Studierende möchte ich mehrere in Frage kommende Wahlpflichtmodule gleichzeitig im Blick behalten und einzelne davon als bereits entschieden markieren, damit ich schrittweise prüfen kann, ob ein weiteres Modul noch dazupasst, ohne alles gleichzeitig kombinatorisch durchrechnen zu müssen.
- Als Studierende möchte ich im Stundenplan einen Hinweis sehen, wenn der aktuelle Raumplan für einen meiner Termine einen anderen Raum führt oder ihn nicht kennt, damit ich nicht vor einem falschen oder leeren Raum stehe.
- Als Studierende möchte ich beim Blick auf die Wochentagsleiste sofort erkennen, an welchen Tagen wie viel ansteht, ohne jeden Tag einzeln aufzurufen.
- Als Studierende möchte ich sehen, welcher Termin gerade läuft und was als Nächstes ansteht, ohne den Plan durchsuchen zu müssen.
- Als Studierende möchte ich mir zwei Veranstaltungen zur selben Uhrzeit vormerken können, um vor Ort zu entscheiden, in welche ich gehe, ohne dass die App mich dauerhaft vor einem Konflikt warnt.
- Als Studierende möchte ich beim Zusammenstellen meines Plans einzelne Veranstaltungsarten weglassen können, weil ich zum Beispiel das Praktikum einer Veranstaltung nicht belege.
- Als Wiederholerin möchte ich eine Veranstaltung aus einem anderen Fachsemester in meinen Plan aufnehmen und dabei auf Kollisionen geprüft werden, wie bei einem Wahlpflichtmodul auch.
- Als Studierende möchte ich meinen Plan auch für kommende Wochen ansehen, damit ich erkenne, wann eine Veranstaltung endet oder wann vorlesungsfreie Zeit beginnt.
- Als Studierende möchte ich meine Gruppenkennung nicht kennen oder nachschlagen müssen, sondern sie über meine Matrikelnummer ermitteln lassen.
- Als Studierende möchte ich eine Gruppenkennung auch dann angeben können, wenn ich nur den Buchstaben kenne, weil die Zahl im Alltag keine Rolle spielt.
- Als Studierende möchte ich sowohl eine wöchentliche Lerngruppe als auch einen einmaligen Termin eintragen können, ohne dass die App beides gleich behandelt.

## Erläuterungen

**Zur Einzelwert-Anforderung (vormals SCHED-F-070)** — Die Alt-App vergleicht an dieser Stelle fehlerhaft den Zahlenteil der Gruppenkennung (`info.groupNumber`) mit dem ersten Zeichen des `studentSet`-Werts (`schedule_overview_viewmodel.dart:216`, `info.groupNumber.codeUnitAt(0) == item.studentSet.codeUnitAt(0)`), obwohl ein Buchstabenvergleich (`groupLetter`) gemeint war. Dadurch schlägt der Abgleich bei Einzelwert-`studentSet` in der Alt-App praktisch immer fehl, sofern nicht zufällig Zahl- und Buchstabenzeichen denselben Codepoint teilen. Für die Neuentwicklung ist das korrigierte Verhalten (Buchstabenvergleich) das Sollverhalten, nicht das beobachtete Altverhalten — daher die Markierung „Alt: bewusst verworfen" statt eines Quellverweises.

**Zu den Anforderungen zum offiziellen Prüfungsplan** — Aus der Rücksprache mit dem FSR FB4, 2026-08-25: Der Fachbereich veröffentlicht während der Vorlesungszeit einen offiziellen Prüfungsplan als Excel-Datei auf einer Intranet-Seite (siehe Capability `integrations` INT-013). Da diese Seite einen Hochschul-Login voraussetzt, den weder App noch Backend besitzen (siehe `specs/product/vision.md` Nicht-Ziel 1, Capability `security-and-privacy` zum Verzicht auf Passwort-Replay), ist der Import zweistufig: Ein FSR-Mitglied/Admin lädt die Datei manuell herunter und in das eigene Backend hoch (Capability `backend-and-api` API-F-180, Capability `integrations` INT-013); danach wählen Studierende selbst die für sie relevanten Prüfungen aus dem importierten Bestand aus. Nicht jede Prüfung des Fachbereichs interessiert jede Nutzerin — nur die eigenen und ggf. Nachholprüfungen.

**Zur Benachrichtigung bei Prüfungsplan-Aktualisierung** — Verträgt sich mit API-F-100 (kein serverseitiges Speichern des persönlichen Stundenplans): Das Backend kennt nicht, welche Prüfungen eine einzelne Nutzerin ausgewählt hat, sondern löst bei jeder Aktualisierung des offiziellen Prüfungsplan-Bestands einen allgemeinen Hinweis aus (vergleichbar einer News-Meldung). Die App gleicht diesen Hinweis lokal gegen die eigene, ausschließlich gerätegespeicherte Auswahl ab und zeigt die Benachrichtigung nur, wenn tatsächlich ein ausgewählter Termin betroffen ist.

**Zweiwöchentliche Veranstaltungen (Hinweis aus derselben Rücksprache).** Manche Lehrveranstaltungen finden nur alle zwei Wochen statt. In der bislang dokumentierten INT-002-Antwortstruktur ist kein Feld erkennbar, das einen solchen Rhythmus trägt (nur INT-009 hat ein `interval`-Feld, dort bislang als „unklare Bedeutung, nicht weiter untersucht" geführt, siehe Capability `integrations`). Ob INT-002 wiederkehrende Termine bereits als separate wöchentliche Einträge liefert (dann unproblematisch) oder der Client die Information zur korrekten zweiwöchentlichen Darstellung fehlt, ist vor Umsetzung mit echten Beispieldaten zu verifizieren — siehe „Offene Fragen".

**Zu iCal-Export und Semesterwechsel-Hinweis** — Aus der automatisierten WhatsApp-Chat-Auswertung (`specs/product/whatsapp-feedback-inventory.md`, Abschnitt 4 „Themenübersicht"): Studis weichen teils auf ICS-Import in eine externe Kalender-App aus, wenn ihnen die App-eigene Ansicht nicht reicht; mehrfach dokumentierte Verwirrung entsteht, wenn sich die Gruppenkennung mit dem Semesterwechsel ändert, die App aber weiter den alten Stand zeigt.

**Export-Ausgestaltung (entschieden).** Rücksprache FSR FB4, 2026-08-25: Studis sollen den in der App zusammengestellten Stundenplan in ein Kalenderprogramm ihrer Wahl integrieren können. Abgewogen wurden ein einmaliger Datei-Export (kein Server-Zugriff nötig, bleibt aber nicht automatisch aktuell) gegenüber einem abonnierbaren Kalender-Link (bleibt synchron, bräuchte aber einen serverseitigen Endpunkt und damit eine Ausnahme von API-F-100). Der abonnierbare Link bleibt ausgeschlossen, API-F-100 gilt ohne Ausnahme.

**Ergänzung vom selben Tag, nach Auswertung des Android-Quellcodes:** Die Android-Alt-App schreibt Termine unmittelbar in einen von der Nutzerin gewählten Gerätekalender, mit Auswahl des Zielkalenders und eines Zeitraums (`dialog/CalendarExportDialog.java`). Das ist bequemer als ein Datei-Export, den die Nutzerin anschließend selbst importieren muss, und damit der zu übertreffende Stand. Entscheidung FSR FB4, 2026-08-25: Beides wird angeboten — der Schreibzugriff als Hauptweg, der Datei-Export als Rückfallweg für den Fall verweigerter Berechtigung oder eines Kalenders außerhalb des Geräts. Die dafür nötige Kalenderberechtigung ist ausschließlich schreibend und wird erst bei tatsächlicher Nutzung angefragt; die zuvor gegenteilige Festlegung in Capability `security-and-privacy` Abschnitt 9 wurde entsprechend korrigiert. Konfigurierbar ist in beiden Wegen die Auswahl der enthaltenen Terminarten.

**Vorbelegter Zeitraum.** Die Android-Alt-App belegt die Von-/Bis-Felder des Kalenderexport-Dialogs mit den ferngepflegten Semesterterminen vor (`dialog/CalendarExportDialog.java:204,215`, Werte aus `service/DataService.java`; dieselbe Ressource „Semestertermine" wie in Capability `backend-and-api` API-F-230). Die Felder bleiben danach frei änderbar — die Vorbelegung erspart nur die in aller Regel gewünschte manuelle Eingabe des laufenden Semesters.

**Kennzeichnen statt entfernen.** Die vorige Fassung der Anforderung zur Gruppenfremd-Behandlung forderte, gruppenfremde Termine gar nicht anzuzeigen. Das stand im Widerspruch zu drei anderen Festlegungen: Die Capability `ux-and-theming` (UX-F-080) verlangt, gruppenfremde Termine zusätzlich zur Farbe durch Text oder Symbol zu kennzeichnen — was voraussetzt, dass sie sichtbar sind; das Datenmodell führt eigens ein Merkmal `gruppenzugehoerig`; und beide Alt-Apps zeigen solche Termine abgeblendet statt sie zu entfernen (Flutter: `schedule_card.dart:50-54`, dokumentiert als L-017). Entscheidung FSR FB4, 2026-08-25: Kennzeichnen ist das Sollverhalten, das Ausblenden wird als Schalter angeboten. Das deckt zugleich den Bedarf mit ab, Termine anderer Gruppen einzusehen.

**Auswahl beim Anlegen.** Beide Alt-Apps lassen die Nutzerin beim Anlegen des offiziellen Stundenplans auswählen, welche der abgerufenen Termine tatsächlich übernommen werden; die Android-App filtert die Auswahlliste dabei nach Gruppenbuchstabe (`activities/timetable/AddEventsActivity.java`). Das ist mehr als Bequemlichkeit: Wahlpflichtveranstaltungen und Termine, an denen eine Person nicht teilnimmt, gehören nicht in ihren Plan, und ohne Auswahl beim Anlegen bliebe nur das nachträgliche Einzellöschen.

**Farbwahl.** Die Capability `ux-and-theming` setzt in UX-F-040 (Textfarbe aus der Hintergrundfarbe ableiten), UX-N-010 (Mindestkontrast) und UX-F-090 (sichtbarer Bedienweg für Gestenaktionen) durchgehend voraus, dass Termine eine wählbare Farbe haben — eine Anforderung dafür fehlte bis zum 2026-08-25 jedoch in dieser Spec. Die Anforderung zur Farbwahl schließt die Lücke.

**Rückfallliste.** Die Android-Alt-App hält eine vom eigenen Backend ausgelieferte Studiengangsliste vor, falls das Hochschulsystem nicht erreichbar ist (`retrofit/TimeTableFallbackApi.java`). Da die Studiengangsauswahl der Einstieg in den gesamten Stundenplan ist, macht ein Ausfall an dieser Stelle sonst das Anlegen unmöglich — auch für Nutzerinnen, die ihren Plan längst haben, aber ihn ändern wollen. Entspricht API-F-240.

**Fünf-Tage-Ansicht** vs. Capability `architecture` Abschnitt 3 — die fünf-Tage-Ansicht bleibt für den Stundenplan selbst bestehen, unabhängig von der übergeordneten Navigationsstruktur (SHELL).

**Beispieltabelle Gruppenzuordnung.** Die Capability `quality-and-testing` fordert automatisierte Tests genau für die Fälle der nachfolgenden Tabelle und verweist für das jeweils korrekte Ergebnis auf diese Spec. Die Tabelle ist damit die verbindliche Vorgabe für diese Tests, nicht nur eine Illustration.

| Gruppenkennung | studentSet | zugehörig | Begründung |
|---|---|---|---|
| (keine) | C8 | ja | Ohne Gruppenkennung gelten alle Termine als zugehörig. |
| C8 | C8 | ja | Einzelwert, Buchstabenteil der Kennung (C) stimmt mit dem Buchstabenteil von `studentSet` überein. |
| C8 | C3 | ja | Einzelwert, nur der Buchstabe wird verglichen; die Zahl im `studentSet` bleibt unberücksichtigt. |
| C8 | D3 | nein | Einzelwert, Buchstabe C weicht von D ab. |
| C8 | * | ja | Wildcard gilt für jede Gruppenkennung. |
| B5 | A1-C9 | ja | Buchstabe B liegt echt zwischen Anfangsbuchstabe A und Endbuchstabe C; Zahl ist damit unerheblich. |
| A1 | A1-C9 | ja | Paar (A,1) entspricht genau der Anfangsgrenze, Grenze ist eingeschlossen. |
| A0 | A1-C9 | nein | Paar (A,0) liegt unterhalb der Anfangsgrenze (A,1) — Buchstabe gleich, Zahl kleiner. |
| C9 | A1-C9 | ja | Paar (C,9) entspricht genau der Endgrenze, Grenze ist eingeschlossen. |
| C10 | A1-C9 | nein | Paar (C,10) liegt oberhalb der Endgrenze (C,9) — Buchstabe gleich, Zahl bei numerischem Vergleich größer (ein Zeichenkettenvergleich würde hier fälschlich „ja" liefern). |
| D2 | A1-C9 | nein | Buchstabe D liegt außerhalb des Bereichs A bis C. |
| A5 | A-C9 | ja | Anfangszahl leer, Grenze gilt als offen; bei Buchstabe A zählt jede Zahl. |
| C1 | A1-C | ja | Endzahl leer, Grenze gilt als offen; bei Buchstabe C zählt jede Zahl. |
| C8 | A1B2 | ja, mit Protokolleintrag | `studentSet` entspricht weder Einzelwert- noch Bereichsmuster; sicherer Rückfall auf „gruppenzugehörig" statt fälschlich als fremd markiert (siehe „Fehlerfälle"). |
| M3 | A-P | ja | Bereich ohne Zahlen an beiden Grenzen; beide Grenzen offen, Buchstabe M liegt zwischen A und P. Real vorkommende Form, siehe Befund unten. |
| M3 | M-N | ja | Bereich ohne Zahlen, Buchstabe M entspricht der Anfangsgrenze. |
| M3 | C-D | nein | Buchstabe M liegt außerhalb von C bis D. |
| M3 | A | nein | Einzelwert ohne Zahl; Buchstabenteil A weicht von M ab. |
| D2 | D | ja | Einzelwert ohne Zahl; Buchstabenteil stimmt überein. |
| D2 | C5-E | ja | Anfangsgrenze (C,5), Endgrenze (E, offen); Paar (D,2) liegt dazwischen. |
| C4 | C5-E | nein | Buchstabe gleich der Anfangsgrenze, Zahl 4 kleiner als 5. |
| M5 | J-M4 | nein | Buchstabe gleich der Endgrenze M, Zahl 5 größer als 4. |
| H3 | H5-J | nein | Buchstabe gleich der Anfangsgrenze H, Zahl 3 kleiner als 5. |

Die Spalte „zugehörig" beantwortet die Frage, ob ein Termin als zur eigenen Gruppe gehörend gilt. Sie entscheidet nicht über die Sichtbarkeit: Gruppenfremde Termine bleiben sichtbar und werden gekennzeichnet; ausgeblendet werden sie nur, wenn die Nutzerin den entsprechenden Schalter aktiviert.

**Befund zu den real vorkommenden `studentSet`-Formen (FBWS live abgefragt, 2026-09-04).** Der Bestand von `INPBPI/2` führt 21 verschiedene Werte: `A-P`, `M-N`, `I-J`, `K-L`, `O-P`, `E-F`, `C-D`, `A-B`, `G-H`, `G-I`, `K-M`, `N-P`, `C5-E`, `M5-P`, `J-M4`, `H5-J`, `F-H4`, `A`, `B`, `C`, `D`. Daraus folgen drei Dinge, die die bisherige Beispieltabelle nicht abbildete: Bereiche ohne Zahlen an **beiden** Grenzen sind der Normalfall, Einzelwerte bestehen aus einem Buchstaben **ohne** Zahl, und gemischte Grenzen (`C5-E`, `J-M4`) kommen vor. Die Wildcard `*` trat im gesamten geprüften Bestand **nicht** auf — die Anforderung bleibt dennoch bestehen, weil die Capability `integrations` den Abrufparameter `studentSet=*` führt und ein späteres Auftreten nicht ausgeschlossen ist. Die Zuordnungslogik trägt alle beobachteten Formen unverändert; ergänzt wurden nur die Prüffälle.

**Geklärt am 2026-09-04:** Die Frage, was eine Studierende als Gruppenkennung eintragen soll, ist beantwortet. Der Fachbereich hält die Zuteilung selbst vor und gibt sie zu einer Matrikelnummer heraus (INT-019). In der Praxis ist dabei **der Buchstabe die maßgebliche Angabe; die Zahl wird so gut wie nie gebraucht** (Auskunft einer studierenden Person). Das deckt sich mit dem Datenbestand: Einzelwerte tragen gar keine Zahl, und nur an Bereichsgrenzen wie `C5-E` oder `J-M4` entscheidet sie überhaupt mit. Das Eingabeformat ist entsprechend auf `^[A-Z][0-9]*$` erweitert.

**Wildcard-Befund aus der Android-Alt-App.** Deren Gruppenabgleich (`util/GroupLetterUtil.java`) behandelt den Wert `*` nicht gesondert: Er trifft die Bedingung für Einzelwerte nur, wenn die Gruppenkennung selbst mit `*` beginnt, und fällt andernfalls auf „nicht zugehörig" durch. Ein Termin, der ausdrücklich für alle Gruppen gilt, würde damit bei gesetzter Gruppenkennung als gruppenfremd markiert — das Gegenteil des Gemeinten. Die Anforderung zur Wildcard-Behandlung legt das korrekte Verhalten fest; die Herkunftsmarkierung bleibt „NEU", weil keine der beiden Alt-Apps ein Vorbild dafür liefert. Geführt als N-007 in `specs/product/legacy-inventory.md`.

**Gruppenwechsel als beobachtetes Verhalten.** Aus der Chat-Auswertung (u. a. `pi-8-semester-fh-informatik`, 2022-12-14 und 2023-01-09; `praktische-informatik-ws-23-24`, 2023-09-21): Studierende weichen bereits informell auf andere Gruppen aus — bei eigener Krankheit, verpasstem Termin oder auf ausdrücklichen Wunsch. Ein Beleg aus `informatik-pi-ti-ds-ws-24-25` (2024-09-30) zeigt den bestehenden Workaround: Studierende tragen den Termin einer fremden Gruppe manuell als eigenen, nicht-offiziellen Termin ein, um eine freie Lücke im eigenen Plan zu füllen. Da INT-002 mit `studentSet=*` ohnehin bereits alle Gruppentermine liefert und clientseitig lediglich auf die eigene Gruppenkennung gefiltert wird, ist dafür keine zusätzliche Integration nötig — die Requirements zu Einsicht und Übernahme von Terminen anderer Gruppen machen diesen bereits gelebten Workaround zu einem regulären, als offiziell erkennbaren Bedienweg. Ein weiterer Beleg (`fh-informatik-22-23`, 2022-12-14) nennt ausdrücklich das Risiko, dass insbesondere Termine gegen Wochenende hin „meistens sehr voll" sind — die App selbst kann diese Auslastung nicht anzeigen (INT-002 liefert keine Kapazitätsfelder, siehe Nicht-Scope), das Risiko bleibt daher der Nutzerin überlassen.

**Wahlpflicht-Planungsmodus.** Die Chat-Auswertung zeigt durchgängig, dass die Terminfindung für Wahlpflichtmodule eigenständig schwierig ist: Studierende fragen wiederholt nach Modullisten, Empfehlungen für „einfache" Module und danach, wann ein Modul angeboten wird (`pi-8-semester-fh-informatik`, u. a. 2024-01-30, 2024-09-01, 2025-09-23, 2026-04-11; `praktische-informatik-ws-23-24`, u. a. 2025-09-15, 2025-09-19). Ein konkreter Beleg (`pi-8-semester-fh-informatik`, 2025-04-03) zeigt eine bestehende Lücke im Alt-App-Stundenplan selbst: Termine eines Wahlpflichtmoduls fehlten dort vollständig. Ursache ist vermutlich, dass INT-002 pro `{sname}/{grade}`-Paar abgefragt wird und Wahlpflichtmodule organisatorisch oft einem anderen Fachsemester zugeordnet sind als dem der Nutzerin. Ein weiterer Beleg (`informatik-pi-ti-ds-ws-24-25`, 2025-02-28) zeigt denselben Bedarf bei Wiederholerinnen: Um ihren Stundenplan zu planen, mussten sie erst selbst herausfinden, wann und wo eine zu wiederholende Veranstaltung stattfindet.

**Automatische Wahlpflicht-Liste statt manueller Fachsemester-Auswahl.** Die vorige Fassung ging davon aus, eine automatische Zuordnung „Wahlpflichtmodul → zuständiges Fachsemester" würde eine zusätzliche, gepflegte Datengrundlage voraussetzen, für die keine Evidenz vorlag — die Chat-Belege zeigten nur, dass Studierende diese Zuordnung selbst über Modulhandbuch bzw. Curricula-PDF nachschlagen (`pi-8-semester-fh-informatik`, 2024-01-30: `modulhandbuch.php`; `praktische-informatik-ws-23-24`, 2025-09-15: `Curricula.pdf`). Die Live-Prüfung vom 2026-08-26 widerlegt diese Annahme: Capability `integrations` dokumentiert mit `WFPB` eine vom Fachbereich selbst über FBWS gepflegte Sammelkategorie, die alle aktuell angebotenen Wahlpflichtmodule direkt liefert (27 Module zum Prüfzeitpunkt), inklusive der zulässigen Studiengänge/Vertiefungsrichtungen im Klartext. Entscheidung FSR FB4, 2026-08-26: die manuelle Fachsemester-Auswahl entfällt, ersetzt durch den automatischen Bezug — die App ruft `WFPB` automatisch ab, keine manuelle Fachsemester-Eingabe mehr nötig. Unverifiziert bleibt die Abdeckung für Master-Wahlpflichtfächer, siehe „Offene Fragen".

**Zeitfenster als weiche statt harte Einschränkung.** Aus der Rücksprache mit dem FSR FB4, 2026-08-25: Ein Termin außerhalb des gewünschten Zeitfensters ist unbequem, aber nicht per se unzulässig — anders als eine echte Terminkollision lässt er sich nicht automatisch als „geht nicht" behandeln. Konsistent mit dem in dieser Spec durchgängig verfolgten Grundsatz „sichtbar statt fälschlich verborgen" blendet die Kennzeichnung außerhalb des Zeitfensters einen solchen Termin daher nicht aus, sondern kennzeichnet ihn nur; der Optimierungsmodus berücksichtigt die Abweichung bei der Reihung. Anders als bei der bewussten Übernahme trotz Konflikt ist dafür keine gesonderte Bestätigungshandlung nötig, da keine echte Kollision vorliegt.

**Definition der Optimierungsmodi.** Aus der Rücksprache mit dem FSR FB4, 2026-08-25: Die drei Modi sind ein Mindestumfang, keine abschließende Liste (weitere Modi bleiben denkbar, siehe „Offene Fragen"). Jeder Modus vergleicht ausschließlich bereits konfliktfreie Kandidaten-Termine anhand der in der zugehörigen Requirement-Beschreibung definierten Größen Tagesspanne und Nachbarabstand — keine neue Integration nötig.

| Optimierungsmodus | Bevorzugt wird der Kandidaten-Termin mit … |
|---|---|
| Minimale Zeit an der Hochschule | der geringsten zusätzlichen bzw. unveränderten Tagesspanne — ein Termin, der sich in eine bereits bestehende Tagesspanne einfügt, schlägt einen Termin an einem sonst freien Tag |
| Ausgeglichener Tagesablauf | der Tagesspanne, die eine Acht-Stunden-Spanne am nächsten trifft, statt sie deutlich zu über- oder unterschreiten |
| Mehr Abstand zwischen Lerneinheiten | dem größten Nachbarabstand |

**Planungsauswahl mit Pflicht-Markierung statt Vollkombinatorik.** Aus der Rücksprache mit dem FSR FB4, 2026-08-25: Denkbar wäre auch ein Modus, der zusätzlich zu den Pflichtkursen mehrere gleichzeitig noch unentschiedene Wahlpflicht-Kandidaten entgegennimmt und alle Kombinationen daraus durchrechnet, um passende Konstellationen auszugeben. Diese Ausweitung wurde bewusst zurückgestellt — Begründung: die Ergebnisdarstellung würde bei mehr als wenigen gleichzeitig offenen Kandidaten schnell unübersichtlich, und der Zusatznutzen gegenüber dem hier gewählten schrittweisen Vorgehen erschien nicht klar genug, um die Komplexität zu rechtfertigen. Eine Vollkombinatorik über mehrere gleichzeitig unentschiedene Kandidaten bleibt eine mögliche spätere Erweiterung, siehe „Offene Fragen".

**Raumplan-Abgleich.** Der Fachbereich pflegt Termine im FBWS an zwei Stellen, die dieselben Veranstaltungen aus unterschiedlicher Richtung zeigen: der studiengangsbezogene Terminplan (INT-002), aus dem der Stundenplan entsteht, und der raumbezogene Raumplan (INT-009), den das Backend alle paar Minuten neu abruft (Capability `backend-and-api` API-F-045). Die App speichert den einmal angelegten Stundenplan lokal und aktualisiert ihn nicht von selbst — ein zwischenzeitlicher Raumwechsel im FBWS bleibt der Nutzerin daher verborgen. Der Raumplan-Abgleich schließt diese Lücke, indem er den lokal gespeicherten Termin gegen den frischen Raumplan hält. Der Abgleich läuft vollständig auf dem Gerät; das Backend liefert nur die Raumplan-Termine (Capability `backend-and-api` API-F-056), der Stundenplan verlässt das Gerät nicht (API-F-100).

**Korrektur vom 2026-09-04 (FBWS live abgefragt).** Die vorige Fassung hielt fest, INT-002 und INT-009 teilten keine gemeinsame Veranstaltungskennung, und baute die Zuordnung deshalb allein auf den Merkmalssatz Bezeichnung + Wochentag + Beginnzeit + `studentSet`. Das ist widerlegt: **beide** Bestände führen `courseId` — in INT-002 als offizielle Modulnummer (z. B. `42012` für „Algorithmen und Datenstrukturen", identisch mit der Modul-Nr. im Curricula-Bestand des Fachbereichs), in INT-009 bei allen Einträgen mit `eventType: "Course"`. Der Raumplan-Abgleich nutzt daher `courseId` als vorrangigen Schlüssel; der Merkmalssatz bleibt als Rückfall für Einträge ohne `courseId` (in INT-009 die Einzelbuchungen mit `eventType: "Event"`). Damit entfällt der größte Teil des Mehrdeutigkeitsrisikos; die verbleibende Trennschärfe ist vor Umsetzung an echten Daten zu prüfen (siehe „Offene Fragen").

Die Anforderung zum Raumabweichungs-Hinweis fordert bewusst „unter keiner der geführten Raumkennungen": Eine Veranstaltung, die regulär parallel in zwei Räumen läuft (belegt für „Lern- und Arbeitstechniken", siehe „Offene Fragen" und Capability `integrations` INT-002), darf keinen Fehlalarm auslösen, wenn der eigene gespeicherte Raum einer der beiden ist.

Der Hinweis ist bewusst schwach: Er ändert den Eintrag nicht, verschwindet bei veraltetem Raumplan und nennt „FB-Aktuelles" als die Stelle, an der eine Raumänderung verbindlich steht. Ob INT-009 kurzfristige Änderungen überhaupt trägt, ist offen — dieselbe Frage wie in Capability `room-finder`, „Offene Fragen".

**„fest" und „vorgemerkt".** Aus der Rücksprache mit einer studierenden Person, 2026-09-04: Studierende tragen sich bewusst zwei Veranstaltungen zur selben Uhrzeit ein — um vor Ort zu entscheiden, welche der beiden Gruppen weniger voll ist; um sich einen Termin zu merken, den sie nur gelegentlich brauchen; oder um bei einer echten Kollision beide der Vollständigkeit halber im Blick zu behalten. Die vorige Fassung der Konflikthinweis-Anforderung hätte dafür eine Dauerwarnung erzeugt. Der Status trennt beides: „fest" ist der Termin, zu dem die Person tatsächlich geht, „vorgemerkt" der bewusst geparkte. Nur feste Termine werden gegeneinander auf Konflikte geprüft. Der Status ersetzt nicht `akzeptierterKonflikt`: dort geht die Person bewusst zu beiden kollidierenden Terminen, hier hält sie sich eine Entscheidung offen.

**Wochentagsleiste und Datumsbezug.** Beide Alt-Apps kennen nur Wochentage ohne Datum; der Plan sieht in jeder Woche des Jahres gleich aus. Entscheidung nach Rücksprache, 2026-09-04: echte Kalenderwochen. Das ist ohne zusätzliche Integration möglich, weil INT-002 je Termin `dateBegin`/`dateEnd` liefert (Live-Prüfung 2026-09-04, siehe Capability `integrations`) — daraus folgt die Anzeige nur im Gültigkeitszeitraum, die Veranstaltungen mit begrenztem Zeitraum nur in den zutreffenden Wochen zeigt. Für die Kennzeichnung vorlesungsfreier Wochen genügen zunächst Semesterbeginn und -ende aus den Stammdaten (API-F-230); vorlesungsfreie Einzeltage und Feiertage liefert derzeit keine Quelle, siehe „Offene Fragen". Die Wochentagsleiste verlangt eine Leiste statt eines Blätterwegs, weil der Blick darauf die Frage „was liegt die restliche Woche an" schon beantworten soll — verstärkt durch die Belegungsvorschau. Samstage sind aufgenommen, obwohl der geprüfte FBWS-Bestand keine führt: eigene Termine sind an jedem Wochentag anlegbar.

**Zeitachse und „Jetzt".** Die proportionale Achse macht Freistunden und Überschneidungen sichtbar, die eine reine Liste nur über die Uhrzeiten preisgibt; sie trägt damit die Konflikthinweis-Anforderung und den Planungsmodus mit. Auf ausdrücklichen Wunsch bleibt sie abschaltbar, weil eine kompakte Liste mehr Termine je Bildschirm zeigt. Die Anzeigen zum laufenden/nächsten Termin beantworten die Frage „was kommt als Nächstes" ohne Suchen im Plan.

**Kursbasierte Auswahl.** Die Live-Prüfung vom 2026-09-04 ergab 121 Termine für ein einzelnes Fachsemester (`INPBPI/2`) und 161 für die Wahlpflicht-Sammelkategorie. Eine flache Auswahlliste einzelner Termine, wie sie beide Alt-Apps und die vorige Fassung der Anlege-Auswahl vorsehen, ist in dieser Größenordnung nicht bedienbar. Die dreistufige Gliederung Veranstaltung → Veranstaltungsart → Gruppen-Slot bildet zugleich ab, wie Studierende denken, und deckt drei bisher getrennte Anforderungen in einem Bedienweg ab: die Auswahl selbst, die Einsicht in Termine anderer Gruppen und deren Übernahme. Die Abwahl-Anforderung trägt den Fall, dass eine Person Praktikum oder Übung einer Veranstaltung bewusst auslässt; die Mehrfach-Slot-Anforderung den Fall zweier gleichzeitig geführter Gruppen-Slots. Die Erweiterung um weitere Fachsemester ersetzt in der Sache die entfallene Anforderung zur manuellen Fachsemester-Auswahl: die Wahlpflicht-Zuordnung leistet zwar `WFPB`, das Problem der Wiederholerinnen und Vorzieherinnen — eine Veranstaltung aus einem anderen Fachsemester im eigenen Plan — bleibt davon jedoch unberührt. Die automatische Farbzuweisung vergibt Farben selbsttätig, damit ein frisch angelegter Plan ohne Handarbeit lesbar ist; die Textfarbe folgt daraus nach UX-F-040 und UX-N-010.

**Gruppenkennung ohne Ratespiel.** Bis zum 2026-09-04 war ungeklärt, was eine Studierende überhaupt als Gruppenkennung eintragen soll; die Werte im FBWS-Bestand legten eine Zuordnung nach Nachnamen nahe, der Zahlenteil blieb unerklärt. Der Hinweis einer studierenden Person vom selben Tag löst das auf zwei Wegen auf. Erstens gibt es einen Endpunkt, der die Kennung zu einer Matrikelnummer direkt liefert (INT-019) — der bequemste Weg. Zweitens gilt in der Praxis: **der Buchstabe ist die maßgebliche Angabe, die Zahl wird so gut wie nie gebraucht.** Deshalb ist das Eingabeformat von `^[A-Z][0-9]+$` auf `^[A-Z][0-9]*$` erweitert — die Zahl ist freiwillig. Das erweitert nur, was zulässig ist: jede bisher gültige Eingabe bleibt gültig, `C8` also unverändert. Es passt außerdem zum beobachteten Datenbestand, in dem Einzelwerte durchweg aus einem Buchstaben ohne Zahl bestehen (`A`, `B`, `C`, `D`) und die Zahl nur an Bereichsgrenzen überhaupt eine Rolle spielt (`C5-E`, `J-M4`).

Die Bestätigungs-Anforderung ist keine Höflichkeit, sondern eine Notwendigkeit: INT-019 beantwortet auch offensichtlich ungültige Nummern mit einer plausibel aussehenden Kennung (belegt für `0000000` → `B3` und `9999999` → `A9`) und meldet eine unbekannte Nummer nicht als Fehler, sondern mit Status 200 in einer von zwei stillen Gestalten — `{"fhDoStudentSet":false}` oder `[]`. Eine erfolgreiche Antwort belegt damit nicht, dass die eingegebene Nummer die eigene ist; eine stillschweigende Übernahme würde einen Tippfehler in einen wochenlang falschen Stundenplan verwandeln. Die Auswertung prüft auf eine nicht-leere Zeichenkette, nicht auf Vorhandensein des Feldes — `false` ist ebenso falsy wie `undefined`, aber nur eine Zeichenkette ist eine Kennung. Die Anforderung zur lokalen Speicherung der Matrikelnummer zieht die datenschutzrechtliche Grenze: Die Matrikelnummer ist personenbeziehbar, sie bleibt auf dem Gerät und geht an keinen anderen Empfänger — insbesondere nicht an das eigene Backend, im Einklang mit API-F-100 und Capability `security-and-privacy`.

**Eigener Eintrag: wiederkehrend oder einmalig.** Die Alt-Apps kennen nur wochentagsgebundene Einträge ohne Datum; ein eigener Eintrag war dort zwangsläufig „jede Woche". Mit dem Datumsbezug entsteht eine Lücke, die vorher nicht existierte: Eine Lerngruppe jeden Dienstag und ein einmaliger Beratungstermin am 17. Oktober sind zwei verschiedene Dinge, die bisher gleich behandelt würden. Die entsprechende Anforderung schließt sie. Bei wiederkehrenden Einträgen wirkt der Gültigkeitszeitraum wie bei offiziellen Terminen; bei einmaligen fallen Beginn und Ende des Zeitraums auf dasselbe Datum.

**Verallgemeinerung des Planungsmodus.** Der Planungsmodus war bis zur Fassung 2.1.0 auf Wahlpflichtmodule zugeschnitten. Aus der Rücksprache vom 2026-09-04: die Terminkollision einer Wiederholerin zwischen zwei Fachsemestern ist dasselbe Problem wie die Kollision eines Wahlpflichtmoduls — es gibt keinen sachlichen Grund, die Kollisionsprüfung, das Zeitfenster und die Optimierungsmodi nur der einen Gruppe anzubieten. Die Requirements zu Kandidat, Konfliktprüfung, Planungsauswahl, Pflicht-Markierung und Konfliktprüfung gegenüber Pflicht-Kandidaten sprechen deshalb von „Kandidat" statt „Wahlpflichtmodul". Der automatische Planungsvorschlag zieht daraus die Folgerung für den gesamten Plan: statt Kandidat für Kandidat einzeln zu entscheiden, kann die Nutzerin einen Vorschlag erzeugen lassen. Er bleibt ein Vorschlag — sie sieht ihn vor der Übernahme und ändert ihn einzeln; die Zurückstellung der Vollkombinatorik über mehrere unentschiedene Kandidaten bleibt davon unberührt.

## Datenmodell

Jeder Termin des persönlichen Plans, offiziell wie eigen, trägt zusätzlich `status: fest | vorgemerkt`, eine Farbe und einen Gültigkeitszeitraum `gueltigVon`/`gueltigBis` (bei eigenen Terminen offen, sofern nicht angegeben).

Termin (offiziell): siehe INT-002-Felder in Capability `integrations`, ergänzt um Kennzeichnung `istOffiziell: true`, `gruppenzugehoerig: boolean`, `abweichendeGruppe: boolean` (Termin einer anderen Gruppe übernommen statt des eigenen), `ausWahlpflicht: boolean` (aus der Wahlpflicht-Sammelkategorie statt aus dem eigenen Fachsemester übernommen), `ausFremdemFachsemester: boolean` und `akzeptierterKonflikt: boolean`.

Termin (eigen): Titel, Wochentag, Beginnzeit, Endzeit, `istOffiziell: false`, `istPruefung: boolean` sowie `wiederkehrend: boolean` (bei `false` fallen `gueltigVon` und `gueltigBis` auf dasselbe Datum). Kein Bezug zu INT-002-Feldern wie `courseType`, `lecturerName`, `studentSet`.

Matrikelnummer (lokal, freiwillig): ausschließlich gerätegespeichert und ausschließlich für den Abruf nach INT-019 verwendet. Kein serverseitiges Pendant; die Einrichtung ist auch ohne sie abschließbar.

Auswahlbestand (flüchtig, nicht persistiert): die aus INT-002 abgerufenen Termine des eigenen Fachsemesters, der zusätzlich gewählten Fachsemester und der Wahlpflicht-Sammelkategorie, verdichtet zu Veranstaltung → Veranstaltungsart → Gruppen-Slot. Persistiert wird nur, was die Nutzerin daraus übernimmt.

Ansichtseinstellungen (lokal): Zeitachse oder kompakte Liste, gruppenfremde Termine ausblenden, Sprung zum aktuellen Wochentag.

Prüfungsauswahl (lokal): Referenz auf einen Eintrag des vom Backend importierten Prüfungsplans (INT-013), rein gerätegespeichert — kein serverseitiges Pendant.

Wahlpflicht-Planungsauswahl (lokal): eine Liste gewählter Wahlpflichtmodule aus der automatisch bezogenen Liste, je Eintrag ein `pflicht: boolean`-Flag sowie der übernommene bzw. vorgeschlagene Termin samt Konfliktstatus und `innerhalbZeitfenster: boolean`, rein gerätegespeichert — kein serverseitiges Pendant, gleiche Begründung wie bei der Prüfungsauswahl (API-F-100). Planungsmodus-Einstellungen (lokal): Zeitfenster (früheste Beginnzeit, späteste Endzeit) und gewählter Optimierungsmodus, ebenfalls rein gerätegespeichert.

Gemeinsame Persistenz aller vier Datenarten: Capability `data-and-storage`, DATA-F-010.

Raumplan-Abgleich (lokal, berechnet): je offiziellem Termin ein Status `übereinstimmend` | `raumabweichung` (mit abweichender Raumkennung) | `nicht_zugeordnet`, hergeleitet aus dem Vergleich mit den zwischengespeicherten Raumplan-Terminen. Rein geräteseitig, kein serverseitiges Pendant; keine Persistenz über den aktuellen Raumplan-Stand hinaus nötig.

## Externe Schnittstellen

Nutzt INT-001 (FBWS Studiengänge) für die Studiengangs-/Semesterauswahl, INT-019 (FBWS Gruppenkennung zur Matrikelnummer) für die Ermittlung der Gruppenkennung, INT-002 (FBWS Termine) für den Terminabruf und den vom Backend (INT-008) importierten Prüfungsplan (INT-013) für die Prüfungsauswahl. Für den Planungsmodus ruft die App INT-002 zusätzlich für die FBWS-Sammelkategorie der Wahlpflichtmodule ab — technisch derselbe Endpunkt, keine neue Integration. Für den Raumplan-Abgleich ruft die App zusätzlich die zwischengespeicherten Raumplan-Termine über das Backend ab (INT-008, `openspec/specs/api-contract.yaml` `/raumplan/termine`, API-F-056); die Rohquelle ist INT-009, kein direkter FBWS-Aufruf aus der App. Keine weiteren Endpunktdetails hier — siehe Capability `integrations` und `openspec/specs/api-contract.yaml`.

## UI-Flows & Zustände

| Zustand | Verhalten |
|---|---|
| Laden | Ladeanzeige während des INT-002-Abrufs, bestehende lokale Termine bleiben währenddessen sichtbar |
| Leer (kein Studiengang gewählt) | Hinweis auf die Studiengangsauswahl als nächsten Schritt |
| Leer (Gruppenfilterung aktiv) | Tag als leer gekennzeichnet, Grund „keine Termine für Gruppe X an diesem Tag" genannt, mit Hinweis auf den Ausblenden-Schalter |
| Fehler | Fehlermeldung mit Wiederholen-Option, zuletzt geladene Termine bleiben sichtbar (siehe Capability `architecture` ARCH-F-130) |
| Offline | Zuletzt geladener Stand wird angezeigt, siehe „Offline-Verhalten" |
| Planungsmodus: kein konfliktfreier Termin | Expliziter Hinweis „keine konfliktfreie Terminoption für dieses Modul"; Möglichkeit zur bewussten Übernahme trotz Konflikt wird angeboten |
| Planungsmodus: Termin außerhalb des Zeitfensters | Termin bleibt wählbar, zusätzlich sichtbar als „außerhalb des bevorzugten Zeitfensters" gekennzeichnet, keine gesonderte Bestätigung nötig |
| Raumabweichung für einen Termin erkannt | Kleiner Hinweis am Eintrag mit der abweichenden Raumkennung, Eintrag sonst unverändert |
| Termin im Raumplan nicht auffindbar | Kleiner Hinweis „im Raumplan nicht gefunden — evtl. Ausfall oder Verlegung", Eintrag unverändert |
| Raumplan-Stand veraltet oder nicht abrufbar | Kein Abweichungshinweis; falls veraltet, Alter des Raumplan-Stands sichtbar |
| Angezeigte Woche außerhalb der Vorlesungszeit | Woche als vorlesungsfrei gekennzeichnet, Plan nicht als regulär dargestellt; Rückweg zur laufenden Woche angeboten |
| Wochentag ohne Termine, ohne aktive Gruppenfilterung | Tag als frei gekennzeichnet — abzugrenzen vom Fall der Gruppenfilterung, der diese als Grund nennt |
| Zwei feste Termine überschneiden sich | Beide nebeneinander dargestellt, beide mit Konflikthinweis; kein Termin wird verschoben oder ausgeblendet |
| Fester und vorgemerkter Termin überschneiden sich | Beide nebeneinander dargestellt, kein Konflikthinweis |
| Kursauswahl: Suche oder Filter ohne Treffer | Leerzustand mit Nennung des wirksamen Filters und einem Weg, ihn zurückzunehmen (UX-F-110) |
| Gruppenkennung schließt keinen einzigen Termin ein | Rückmeldung „0 von N Terminen" unmittelbar bei der Eingabe, Eingabe wird nicht verworfen |
| INT-019 antwortet ohne Kennung — leere Liste `[]` **oder** `{"fhDoStudentSet":false}` | Beide gleich behandeln: Hinweis „zu dieser Matrikelnummer ist keine Gruppe hinterlegt", Eingabe bleibt stehen, manuelle Angabe wird angeboten |
| INT-019 nicht erreichbar | Hinweis mit Wiederholen-Option; manuelle Angabe bleibt jederzeit möglich, die Einrichtung ist dadurch nicht blockiert |
| Nach der Matrikelnummer-Ermittlung erhaltene Kennung wird von der Nutzerin abgelehnt | Kennung wird nicht übernommen, Eingabefeld für die manuelle Angabe erhält den Fokus |

## Offline-Verhalten

Der Stundenplan ist einer der drei in Capability `architecture` (ARCH-F-100) benannten Bereiche mit garantiertem Offline-Zugriff auf den zuletzt geladenen Stand. Eigene Termine sind ausschließlich lokal gespeichert (DATA-F-010) und daher unabhängig vom Netzzugriff jederzeit verfügbar.

## Fehlerfälle

| Fall | Reaktion |
|---|---|
| INT-001 liefert keinen zur vorherigen Auswahl passenden Studiengang mehr (z. B. nach Umbenennung) | Hinweis anzeigen, erneute Auswahl anbieten |
| INT-002 liefert ein `studentSet`, das keinem der Muster aus der Beispieltabelle entspricht | Termin als gruppenzugehörig behandeln (sicherer Rückfall: sichtbar statt fälschlich als fremd markiert), Vorfall protokollieren (SEC-F-060) |
| Kalenderberechtigung wird verweigert | Datei-Export als Rückfallweg anbieten, keine wiederholte Nachfrage |
| INT-001 nicht erreichbar | Rückfallliste des Backends verwenden, Alter der Liste sichtbar machen |
| Eigener Termin überschneidet sich zeitlich mit einem offiziellen Termin | Beide Termine anzeigen, zusätzlich sichtbarer Konflikthinweis, keine automatische Konfliktauflösung |
| Raumplan-Termine nicht abrufbar | Stundenplan normal anzeigen, keinen Abgleichhinweis zeigen, kein Fehler in der Stundenplanansicht |
| Mehrere Raumplan-Termine passen mehrdeutig auf denselben Stundenplan-Termin | Keinen Abweichungshinweis erzeugen (sicherer Rückfall), Vorfall protokollieren (SEC-F-060) |

## Nicht-funktionale Anforderungen (Register)

Siehe Requirement „Zeitziel beim Blättern zwischen Wochentagen" oben (vormals SCHED-N-010).

## Akzeptanzkriterien

- Alle Beispielszenarien aus der Beispieltabelle Gruppenzuordnung (keine Gruppenkennung, Einzelwert, Wildcard, Bereich mit Gruppen innerhalb/außerhalb/an den Grenzen, Bereich mit offener Grenze) liefern das in den Requirements festgelegte Ergebnis.
- Eigene und offizielle Termine sind in der Darstellung eindeutig unterscheidbar und beide über einen sichtbaren Bedienweg löschbar.
- Der automatische Sprung zum aktuellen Wochentag berücksichtigt Wochenenden korrekt.
- Eine aus dem Prüfungsplan ausgewählte Prüfung sowie eine eigen eingetragene Prüfung sind beide eindeutig als Prüfung erkennbar.
- Eine Änderung an einer ausgewählten Prüfung führt zu einer Benachrichtigung, eine Änderung an einer nicht ausgewählten Prüfung nicht.
- Eine zeitliche Überschneidung eigener und offizieller Termine ist als solche sichtbar, nicht nur an der Uhrzeit ablesbar.
- Der Export enthält je nach getroffener Auswahl ausschließlich die gewählten Terminarten; eine erneute Änderung des Plans erfordert einen erneuten manuellen Export beziehungsweise eine erneute Übertragung, da keine Synchronisation stattfindet.
- Termine lassen sich in einen von der Nutzerin gewählten Gerätekalender übertragen; bei verweigerter Berechtigung steht der Datei-Export zur Verfügung.
- Gruppenfremde Termine sind standardmäßig sichtbar und als solche erkennbar; der Schalter blendet sie aus und wieder ein.
- Beim Anlegen des offiziellen Stundenplans lässt sich auswählen, welche Termine übernommen werden.
- Eine Nutzerin kann für eine Pflichtveranstaltung den Termin einer anderen Gruppe einsehen und anstelle des eigenen Gruppentermins übernehmen, weiterhin als offizieller Termin erkennbar.
- Für ein gewähltes Wahlpflichtmodul mit mehreren parallelen Terminen zeigt das System korrekt an, welche Termine konfliktfrei sind und welche nicht.
- Existiert für ein gewähltes Wahlpflichtmodul kein konfliktfreier Termin, erhält die Nutzerin einen expliziten Hinweis statt einer stillschweigend leeren Auswahl, und kann optional bewusst einen Konflikt akzeptieren.
- Termine außerhalb des festgelegten Zeitfensters werden sichtbar gekennzeichnet, aber nicht ausgeblendet.
- Bei mehreren konfliktfreien Terminen für ein Wahlpflichtmodul steht im jeweils gewählten Optimierungsmodus erkennbar die nach dessen Kriterium (Tagesspanne bzw. Nachbarabstand) günstigste Option zuerst.
- Wird ein Wahlpflichtmodul in der Planungsauswahl als „Pflicht" markiert, zählt es bei der Prüfung weiterer, noch nicht markierter Kandidaten als fixer Bestandteil des Plans; zwei gleichzeitig unentschiedene Kandidaten werden dabei nicht gegeneinander geprüft.
- Ein offizieller Termin, dessen Raum im aktuellen Raumplan abweicht, trägt im Stundenplan einen Hinweis mit der abweichenden Raumkennung, ohne dass der Eintrag selbst verändert wird.
- Ein offizieller Termin, der im Raumplan nicht auffindbar ist, trägt einen Hinweis auf möglichen Ausfall oder Verlegung.
- Eine regulär in zwei Räumen parallel angebotene Veranstaltung löst keinen Abweichungshinweis aus, solange der gespeicherte Raum einer der beiden ist.
- Bei veraltetem Raumplan-Stand erscheint kein Abweichungshinweis, sondern das Alter des Stands.
- Die Wochentagsleiste zeigt Montag bis Freitag; ein Samstag erscheint genau dann, wenn an ihm ein Termin liegt, und verschwindet, sobald der letzte entfernt ist.
- Jeder Wochentag trägt das Datum der angezeigten Woche; ein Blättern in die Vorwoche und zurück führt zum selben Stand.
- Eine Veranstaltung, deren Gültigkeitszeitraum in der Wochenmitte endet, erscheint in der letzten zutreffenden Woche und in der darauffolgenden nicht mehr.
- Zwei sich überschneidende Termine sind beide sichtbar, einzeln antippbar und werden nicht übereinander gezeichnet.
- Ein Termin mit Status „vorgemerkt" ist ohne Farbwahrnehmung als solcher erkennbar und erzeugt keinen Konflikthinweis; nach dem Wechsel auf „fest" erscheint der Hinweis.
- Wird die proportionale Zeitachse abgeschaltet, verschwinden die Lückenangaben, die Terminfolge und ihre Reihenfolge bleiben unverändert.
- In der Kursauswahl lässt sich eine einzelne Veranstaltungsart abwählen, ohne die übrigen Arten derselben Veranstaltung zu verlieren.
- Zwei Gruppen-Slots derselben Veranstaltung lassen sich gemeinsam in den Plan übernehmen.
- Die Freitextsuche findet eine Veranstaltung sowohl über einen Teil ihrer Bezeichnung als auch über ihre Modulnummer.
- Nach dem Hinzufügen eines weiteren Fachsemesters enthält die Kursauswahl dessen Veranstaltungen und lässt sich nach Fachsemester eingrenzen.
- Die Eingabe einer Gruppenkennung meldet unmittelbar die Zahl der eingeschlossenen Termine, auch wenn diese null ist.
- Ein frisch angelegter Plan ist ohne manuelle Farbwahl farblich unterscheidbar, und dieselbe Veranstaltung trägt nach erneutem Anlegen dieselbe Farbe.
- Der erzeugte Gesamtvorschlag ist vor der Übernahme einsehbar und einzeln änderbar; ohne Bestätigung ändert sich der Plan nicht.
- Die Eingabe der Matrikelnummer führt zu einer angezeigten, noch nicht übernommenen Gruppenkennung; erst die Bestätigung übernimmt sie.
- Eine unbekannte Matrikelnummer führt zu einem verständlichen Hinweis, nicht zu einer stillschweigend leeren Kennung.
- Die Einrichtung lässt sich vollständig ohne Angabe einer Matrikelnummer abschließen, und eine Gruppenkennung aus nur einem Buchstaben wird angenommen.
- Die Matrikelnummer erscheint in keiner Anfrage an das eigene Backend.
- Ein eigener Eintrag lässt sich als wöchentlich wiederkehrend anlegen und erscheint dann in jeder Woche des Zeitraums; ein einmaliger Eintrag erscheint nur in der Woche seines Datums.

## Bewusst nicht übernommenes Altverhalten

- Fehlerhafter Gruppenabgleich bei Einzelwert-`studentSet` (Zahl-statt-Buchstabe-Vergleich) — Grund: Vergleich schlägt praktisch immer fehl, siehe Erläuterung zur Einzelwert-Anforderung.
- Ändern/Entfernen eigener Termine ausschließlich über langes Drücken erreichbar — Grund: nicht auffindbar ohne Vorwissen, siehe Capability `ux-and-theming` UX-F-090.
- Bei unerwarteter lokaler Datenmenge wird der gesamte Stundenplan kommentarlos gelöscht und neu angelegt — Grund: Datenverlust ohne Rückfrage, siehe Capability `data-and-storage` DATA-F-020.
- Gruppenfremde Termine allein durch abgeschwächte Farbe markieren, ohne Text oder Symbol — Grund: für Menschen mit Farbsinnstörung nicht unterscheidbar, siehe Capability `ux-and-theming` UX-F-080.
- Wildcard-`studentSet` als gruppenfremd behandeln — Grund: kehrt die Bedeutung um, siehe Wildcard-Befund in den Erläuterungen.

## Offene Fragen

- Die Anforderung zum Semesterwechsel-Hinweis erkennt einen Semesterwechsel durch Abgleich der `grade`-Liste des gewählten Studiengangs aus INT-001 gegen den zuletzt gespeicherten Stand — zuverlässiger als ein festes Kalenderdatum, da Semesterstart-Termine variieren, und ohne zusätzliche manuelle Nutzerangabe.
- Format der Prüfungsplan-Excel-Datei (INT-013): Spaltenaufbau erst bei Vorliegen einer realen Datei zu klären, siehe Capability `integrations` INT-013.
- Zweiwöchentliche Veranstaltungen: Teilweise beantwortet 2026-08-26 (Live-Prüfung aller aktuell angebotenen Studiengang/Fachsemester-Kombinationen, siehe Capability `integrations` INT-002): `interval` ist im gesamten aktuellen Bestand ausschließlich `weekly`. Die als Beispiel genannte Veranstaltung „Lern- und Arbeitstechniken" ist wöchentlich, kein Beleg für den Zweiwochen-Fall. Ob `interval` überhaupt einen anderen Wert führen kann, bleibt unverifiziert, bis eine tatsächlich zweiwöchentliche Veranstaltung im Bestand auftaucht — bei Umsetzung erneut zu prüfen.
- Beantwortet 2026-09-04: „Lern- und Arbeitstechniken" wird parallel in zwei Räumen mit identischem `studentSet` angeboten (`courseId 411031`). Der Curricula-Bestand des Fachbereichs (`resources/Curricula.pdf`, Stand 24.07.2026) führt die Modulnummer `411031` als „Lern- u. Arbeitstechniken/Studium Generale/Mentoring" — ein Bündel dreier Angebote unter einer Modulnummer. Die zwei parallelen Räume sind damit zwei verschiedene Angebote, kein Datenfehler und keine Mehrdeutigkeit. Die App zeigt beide Varianten nebeneinander; ein Scheinkonflikt entsteht nicht, solange höchstens eine davon den Status „fest" trägt. Welche der drei Teilveranstaltungen eine einzelne Person besucht, bleibt ihre Auswahl.
- Beantwortet am 2026-09-04: Welche Bedeutung hat der Zahlenteil einer Gruppenkennung (`C5`, `M4`)? Die Zuteilung ist über INT-019 zur Matrikelnummer abrufbar, und in der Praxis zählt der Buchstabe, die Zahl wird so gut wie nie gebraucht. Offen bleibt allein, wie der Fachbereich die Zuteilung intern bildet — für die App ohne Belang, da sie die Kennung nicht selbst herleiten muss.
- Neu (2026-09-04): Prüfungstermine erscheinen in INT-009 als Einträge mit `eventType: "Event"` und dem Namensmuster `Prüfung <courseId> <Bezeichnung>`, samt Raum, Datum und Uhrzeit. Ob das INT-013 (Intranet-Excel, Hochschul-Login nötig) für die Auswahl aus dem offiziellen Prüfungsplan ganz oder teilweise ersetzen kann, ist vor der zweiten Ausbaustufe zu prüfen — es würde den zweistufigen manuellen Import überflüssig machen. Offen ist insbesondere, ob dieser Bestand vollständig und rechtzeitig gepflegt wird.
- Neu (2026-09-04): Vorlesungsfreie Einzeltage und Feiertage liefert derzeit keine Quelle. Die Kennzeichnung vorlesungsfreier Wochen stützt sich vorerst allein auf Semesterbeginn und -ende aus den Stammdaten (API-F-230); ob eine vom FSR gepflegte Liste vorlesungsfreier Tage den Aufwand lohnt, ist nach der ersten Nutzung zu entscheiden.
- Neu (2026-09-04): Führt FBWS jemals `Sat` oder `Sun` im Feld `weekday`? Der am 2026-09-04 geprüfte Bestand tut es nicht. Die Wochentagsleiste baut dynamisch und ist damit unabhängig von der Antwort; `openspec/specs/api-contract.yaml` beschränkt den Wochentag im Schema `RaumplanTermin` jedoch auf `Mon`–`Fri` und wäre bei einem Gegenbeleg zu erweitern.
- Gegenstandslos seit 2026-08-26: Liefert INT-002 für ein vom eigenen Fachsemester abweichendes `{grade}` tatsächlich die benötigten Wahlpflicht-Termine? Die manuelle Fachsemester-Auswahl ist entfallen, ersetzt durch den automatischen Bezug aus der FBWS-Sammelkategorie `WFPB`, siehe Capability `integrations` INT-002.
- Gegenstandslos aus demselben Grund: Lohnt sich für eine spätere Version eine komfortablere, FSR-gepflegte Zuordnung „Wahlpflichtmodul → typisches Fachsemester"? Die FBWS-eigene Sammelkategorie leistet das bereits, keine zusätzliche FSR-Pflege nötig.
- Neu (2026-08-26): Deckt die FBWS-Sammelkategorie `WFPB` auch Master-Wahlpflichtfächer ab, oder ausschließlich Bachelor (so die Namensgebung „Bachelor Wahlpflichtfächer WPF")? Keine äquivalente Kategorie für die Master-Studiengänge (`INPM`, `MIPM`, `WIPM`) in der Studiengangsliste gefunden — vor Umsetzung zu klären, falls Master-Wahlpflicht relevant wird.
- Weitere Optimierungsmodi über die drei Mindestmodi hinaus (z. B. „möglichst früh fertig", „bestimmte Wochentage bevorzugt frei") — bewusst als erweiterbare, nicht abschließende Liste formuliert; konkrete weitere Modi bei Bedarf nachzutragen.
- Vollkombinatorische Analyse mehrerer gleichzeitig unentschiedener Wahlpflicht-Kandidaten gegeneinander (statt der schrittweisen Pflicht-Markierung) — bewusst zurückgestellt, siehe Erläuterung zur Planungsauswahl; mögliche spätere Erweiterung, falls sich die schrittweise Variante in der Praxis als unzureichend erweist.
- Ob das Zeitfenster einheitlich für alle Wochentage gilt oder je Wochentag unterschiedlich einstellbar sein sollte — für den ersten Umfang als ein einheitliches Zeitfenster angenommen, mangels gegenteiliger Evidenz aus der Rücksprache mit dem FSR FB4.
- Trennschärfe des Merkmalssatzes Bezeichnung + Wochentag + Beginnzeit + `studentSet` für die Zuordnung INT-002 ↔ INT-009 — an echten Daten zu prüfen; INT-002 führt kein `courseId` für alle Fälle, ein exakter Schlüssel fehlt teils.
- Bildet INT-009 kurzfristige Ausfälle und Raumänderungen ab (bestimmt die Aussagekraft der Raumabweichungs-/Nicht-gefunden-Hinweise)? Gemeinsame offene Frage mit Capability `room-finder`, „Offene Fragen"; vor Roadmap-Schritt 6 als Spike zu klären.
