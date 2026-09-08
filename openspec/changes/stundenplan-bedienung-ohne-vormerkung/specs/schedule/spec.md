## ADDED Requirements

### Requirement: Konflikthinweis bei überschneidenden Terminen

Wenn sich zwei aktive Termine des persönlichen Plans zeitlich überschneiden, muss das System beide Termine mit einem sichtbaren Konflikthinweis darstellen, unabhängig davon, ob sie offiziell oder eigen sind. Hat die Nutzerin die Überschneidung nach der Anforderung zur bewussten Übernahme trotz Konflikt angenommen, darf das System keinen wiederkehrenden Konflikthinweis mehr erzeugen; das Terminpaar trägt dann allein die Kennzeichnung „angenommener Konflikt". Ist mindestens einer der beiden Termine deaktiviert, entsteht kein Konflikthinweis. Herkunft: NEU, entschieden 2026-09-06, Bezug vom Status „fest" auf den aktiven Zustand umgestellt 2026-09-08; vormals SCHED-F-230 und „Konflikthinweis bei festen Terminen". Ohne die Ausnahme für den angenommenen Konflikt entstünde eine Dauerwarnung für etwas, das die Nutzerin bewusst so will. Die Umstellung folgt dem Entfall des Status „fest"/„vorgemerkt": Wer sich zwei zeitgleiche Angebote offenhalten will, deaktiviert eines davon und bekommt damit dieselbe Ruhe, die zuvor die Vormerkung gab.

#### Scenario: Zwei aktive Termine überschneiden sich
- **WHEN** zwei aktive Termine zeitlich überschneidend sind
- **THEN** stellt das System beide mit einem sichtbaren Konflikthinweis dar

#### Scenario: Konflikt wurde bewusst angenommen
- **WHEN** die Nutzerin die Überschneidung zweier aktiver Termine bewusst angenommen hat
- **THEN** zeigt das System keinen Konflikthinweis mehr, sondern allein die Kennzeichnung „angenommener Konflikt"

#### Scenario: Einer der Termine ist deaktiviert
- **WHEN** sich zwei Termine überschneiden und mindestens einer davon deaktiviert ist
- **THEN** erzeugt das System keinen Konflikthinweis

### Requirement: Deaktivieren eines Termins

Das System muss der Nutzerin ermöglichen, einen Termin des persönlichen Plans über einen sichtbaren Bedienweg zu deaktivieren und die Deaktivierung ebenso wieder zurückzunehmen. Dabei muss es zwei Reichweiten anbieten: dauerhaft, bis die Nutzerin es zurücknimmt, oder allein für das nächste Vorkommen. Der Bedienweg gilt gleichermaßen für offizielle und für eigene Termine. Herkunft: Alt: alte apps/android-fb4/FB4/fB4/src/main/java/de/fsrfb4/fb4/fragments/timetable/TimetableDayFragment.java:146-171, um die dauerhafte Reichweite erweitert 2026-09-08. Die Alt-App kennt unter `action_toggle_cancel` nur die einmalige Form: Sie setzt `invalidUntil` auf das Ende des nächsten Vorkommens, womit der Termin danach von selbst wieder gilt. Die dauerhafte Reichweite kommt hinzu, weil sie den entfallenen Status „vorgemerkt" ablöst — ein bewusst geparkter Parallel-Slot bleibt im Plan, ohne wahrgenommen zu werden.

#### Scenario: Termin dauerhaft deaktivieren
- **WHEN** die Nutzerin einen Termin dauerhaft deaktiviert
- **THEN** bleibt er deaktiviert, bis sie die Deaktivierung zurücknimmt

#### Scenario: Termin für das nächste Vorkommen deaktivieren
- **WHEN** die Nutzerin einen Termin allein für das nächste Vorkommen deaktiviert
- **THEN** ist er bis zum Ende dieses Vorkommens deaktiviert und danach wieder aktiv

#### Scenario: Deaktivierung zurücknehmen
- **WHEN** die Nutzerin die Deaktivierung eines Termins zurücknimmt
- **THEN** ist er wieder aktiv, ohne dass eine seiner übrigen Angaben verlorengeht

### Requirement: Wirkung eines deaktivierten Termins

Das System muss einen deaktivierten Termin in der Wochenansicht weiterhin an seinem Platz darstellen, dabei zurückgenommen und zusätzlich zur Farbe über Text oder Symbol als deaktiviert erkennbar. In jeder Auswertung des persönlichen Plans muss es ihn übergehen: Er darf keinen Konflikthinweis erzeugen und an keinem beteiligt sein, nicht als laufender oder nächster Termin gelten, in keinen Kalender- und Datei-Export eingehen und keine terminbezogene Benachrichtigung auslösen. Im Planungsmodus muss das System ihn wie jeden anderen hinzugefügten Termin führen und den Zustand dort nicht anzeigen. Herkunft: Alt: alte apps/android-fb4/FB4/fB4/src/main/java/de/fsrfb4/fb4/adapter/TimetableEventAdapter.java:64-70, Wirkung auf Auswertungen festgelegt 2026-09-08. Die Alt-App setzt für einen deaktivierten Termin allein `setEnabled(false)` auf Karte und Textfelder — eine rein optische Zurücknahme, weil sie weder Konflikthinweise noch eine Jetzt-Anzeige noch einen Export kennt. Die Trennung zwischen Wochenansicht und Planungsmodus folgt daraus, dass im Planungsmodus über die Zusammenstellung entschieden wird und nicht über die Wahrnehmung.

#### Scenario: Deaktivierter Termin in der Wochenansicht
- **WHEN** ein Termin deaktiviert ist und in der Wochenansicht angezeigt wird
- **THEN** stellt das System ihn zurückgenommen dar und macht diese Bedeutung zusätzlich zur Farbe über Text oder Symbol erkennbar

#### Scenario: Deaktivierter Termin überschneidet sich
- **WHEN** sich ein deaktivierter Termin zeitlich mit einem aktiven Termin überschneidet
- **THEN** erzeugt das System für diese Überschneidung keinen Konflikthinweis

#### Scenario: Deaktivierter Termin in Auswertungen
- **WHEN** ein deaktivierter Termin gerade läuft oder als nächster anstünde
- **THEN** übergeht das System ihn in der Anzeige des laufenden und nächsten Termins, im Export und in terminbezogenen Benachrichtigungen

#### Scenario: Deaktivierter Termin im Planungsmodus
- **WHEN** ein deaktivierter Termin im Planungsmodus erscheint
- **THEN** führt das System ihn als hinzugefügt und zeigt den deaktivierten Zustand dort nicht an

### Requirement: Selbsttätiges Ende einer einmaligen Deaktivierung

Wenn der Zeitpunkt erreicht ist, bis zu dem ein Termin einmalig deaktiviert war, dann muss das System ihn ohne Zutun der Nutzerin wieder als aktiv führen. Es darf dafür keine Rückfrage stellen und keinen Hinweis erzeugen. Herkunft: Alt: alte apps/android-fb4/FB4/fB4/src/main/java/de/fsrfb4/fb4/realm/TimetableEvent.java:92-94. Die Alt-App wertet `invalidUntil` bei jedem Lesen gegen die aktuelle Zeit aus, statt einen Aufräumlauf zu führen; ein abgelaufener Eintrag gilt damit von selbst wieder.

#### Scenario: Zeitpunkt der einmaligen Deaktivierung verstrichen
- **WHEN** ein einmalig deaktivierter Termin nach dem Ende seines Vorkommens erneut angezeigt wird
- **THEN** ist er wieder aktiv, ohne dass die Nutzerin etwas dafür tun musste

### Requirement: Verwerfen der Auswahl im Planungsmodus

Das System muss im Planungsmodus einen sichtbaren Bedienweg anbieten, der die in der laufenden Sitzung getroffenen Entscheidungen verwirft und den Zwischenstand auf den gesicherten Plan zurücksetzt. Der Bedienweg muss vor dem Verwerfen bestätigt werden und darf den gesicherten Plan nicht verändern. Er muss nahe bei der Sicherungsaktion stehen. Herkunft: Recherche: Issue #62 (Gerätedurchsicht Pixel 9 Pro), 2026-09-08. Ohne diesen Weg bleibt nur, jedes einzelne Häkchen von Hand zurückzunehmen; wer im Planungsmodus neu ansetzen will, hat dafür bei sechs Modulen bis zu dreizehn Bedienschritte.

#### Scenario: Auswahl verwerfen
- **WHEN** die Nutzerin die Auswahl verwirft und die Rückfrage bestätigt
- **THEN** entspricht der Zwischenstand wieder dem gesicherten Plan, und der Bildschirm weist keine ungesicherten Änderungen mehr aus

#### Scenario: Verwerfen abbrechen
- **WHEN** die Nutzerin die Rückfrage vor dem Verwerfen abbricht
- **THEN** bleiben sämtliche getroffenen Entscheidungen erhalten

#### Scenario: Gesicherter Plan bleibt unberührt
- **WHEN** die Nutzerin die Auswahl verwirft
- **THEN** bleibt der gesicherte persönliche Plan unverändert

### Requirement: Verwerfen der Modulauswahl

Das System muss in der Modulauswahl einen sichtbaren Bedienweg anbieten, der sämtliche Modulhaken auf einmal zurücknimmt. Er muss vor der Ausführung bestätigt werden; tragen abgewählte Module bereits Planeinträge, muss dieselbe Rückfrage nach deren Verbleib gestellt werden, die die Abwahl eines einzelnen Moduls stellt. Herkunft: Recherche: Issue #62 (Gerätedurchsicht Pixel 9 Pro), 2026-09-08. Die Modulauswahl belegt sich beim Öffnen aus vorhandenen Planeinträgen vor; wer den Plan neu aufsetzen will, findet dort keinen Weg zurück auf null.

#### Scenario: Modulauswahl verwerfen
- **WHEN** die Nutzerin die Modulauswahl verwirft und die Rückfrage bestätigt
- **THEN** ist kein Modul mehr angekreuzt

#### Scenario: Verworfene Module mit Planeinträgen
- **WHEN** unter den verworfenen Modulen mindestens eines bereits Planeinträge trägt
- **THEN** fragt das System nach dem Verbleib dieser Einträge, wie es die Abwahl eines einzelnen Moduls tut

### Requirement: Kennzeichnung gewählter Termine im Planungsmodus

Das System muss im Planungsmodus einen gewählten Termin durch eine farbige Umrandung der gesamten Zeile hervorheben und diese Bedeutung zusätzlich zur Farbe über ein Symbol tragen. Herkunft: Recherche: Issue #62 (Gerätedurchsicht Pixel 9 Pro), 2026-09-08. Der Zustand „gewählt" steht in der bisherigen Umsetzung allein im 24 dp breiten Kästchensymbol am linken Zeilenrand; beim Überfliegen einer Tagesliste von zehn Zeilen ist er nicht zu erfassen.

#### Scenario: Gewählter Termin
- **WHEN** ein Termin im Planungsmodus gewählt ist
- **THEN** trägt seine Zeile eine farbige Umrandung und zusätzlich ein Symbol, das die Wahl anzeigt

#### Scenario: Nicht gewählter Termin
- **WHEN** ein Termin im Planungsmodus nicht gewählt ist
- **THEN** trägt seine Zeile keine hervorgehobene Umrandung

### Requirement: Lehrende Person in der Terminzeile des Planungsmodus

Das System muss im Planungsmodus je Termin die lehrende Person anzeigen, gleichrangig zu Veranstaltungsart und Raum. Ist sie im Bestand nicht angegeben, lässt das System die Angabe aus, ohne einen Platzhalter zu setzen. Herkunft: Recherche: Issue #62 (Gerätedurchsicht Pixel 9 Pro), 2026-09-08. INT-002 liefert `lecturerName` an jedem Termin, und das Requirement „Anzeige der Termindetails" verlangt die Angabe für die Detailansicht bereits; im Planungsmodus ist sie das Merkmal, an dem sich zwei sonst gleich aussehende Gruppen-Slots unterscheiden lassen.

#### Scenario: Termin mit lehrender Person
- **WHEN** ein Termin im Planungsmodus angezeigt wird und eine lehrende Person führt
- **THEN** zeigt das System sie in der Terminzeile an

#### Scenario: Termin ohne lehrende Person
- **WHEN** ein Termin keine lehrende Person führt
- **THEN** lässt das System die Angabe aus, ohne einen Platzhalter zu setzen

### Requirement: Wochentagsleiste über die volle Bildschirmbreite

Das System muss jede Wochentagsleiste — in der Wochenansicht wie im Planungsmodus — über die volle verfügbare Bildschirmbreite darstellen und die Breite gleichmäßig auf die dargestellten Tage aufteilen. Ein waagerechtes Blättern innerhalb der Leiste ist ausgeschlossen. Die Leiste darf dabei nicht mehr Höhe beanspruchen, als die Mindestgröße für Bedienelemente verlangt. Herkunft: Recherche: Issue #62 (Gerätedurchsicht Pixel 9 Pro), 2026-09-08. Die bisherige Umsetzung führt die Leiste des Planungsmodus als waagerechten Scroll mit Mindestbreite und Innenabstand je Chip; auf dem Prüfgerät belegt sie rund ein Achtel der Bildschirmhöhe, obwohl fünf Tage nebeneinander in die Breite passen.

#### Scenario: Fünf Wochentage
- **WHEN** eine Wochentagsleiste fünf Tage darstellt
- **THEN** füllen die fünf Einträge gemeinsam die volle Bildschirmbreite und sind gleich breit

#### Scenario: Zusätzlicher Wochenendtag
- **WHEN** die Leiste einen zusätzlichen Wochenendtag aufnimmt
- **THEN** verteilt das System die volle Breite gleichmäßig auf die nun größere Zahl von Tagen, ohne waagerechtes Blättern

### Requirement: Zusammenfassen deckungsgleicher Rohtermine

Wenn der Terminbestand des Lehrangebots zwei oder mehr Termine liefert, die in Veranstaltung, Veranstaltungsart, Wochentag, Beginnzeit, Endzeit, Raum und Gruppenmenge übereinstimmen, dann muss das System sie vor der Darstellung zu einem einzigen Termin zusammenfassen und den Vorfall protokollieren. Es darf keinen davon verwerfen, ohne dies zu protokollieren. Herkunft: Recherche: Live-Abfrage von INT-002, 2026-09-08, Befund aus Issue #62. Der Bestand enthält deckungsgleiche Termine — belegt für `44232|Ü|Tue|720|765|C.E.32|A-P` —, womit die bislang angenommene Eindeutigkeit dieses Merkmalssatzes widerlegt ist. Zwei Termine, die sich allein im Raum unterscheiden, bleiben getrennt: Sie sind nach der Erläuterung zu `courseId 411031` verschiedene Angebote unter einer Modulnummer, kein Datenfehler.

#### Scenario: Deckungsgleiche Termine im Bestand
- **WHEN** der Bestand zwei in allen genannten Merkmalen übereinstimmende Termine enthält
- **THEN** stellt das System genau einen davon dar und protokolliert das Zusammenfassen

#### Scenario: Termine mit abweichendem Raum
- **WHEN** zwei Termine in allen Merkmalen außer dem Raum übereinstimmen
- **THEN** stellt das System beide getrennt dar

## MODIFIED Requirements

### Requirement: Konfliktprüfung paralleler Termine

Wenn ein ausgewählter Kandidat mehrere parallele Termine (Gruppen) anbietet, muss das System jeden dieser Termine gegen die Termine des Zwischenstands auf zeitliche Konflikte prüfen und je Termin kennzeichnen, ob er konfliktfrei ist. Zwischenstand ist der gesicherte Plan samt allen in der laufenden Sitzung getroffenen, noch ungesicherten Entscheidungen. Deaktivierte Termine des gesicherten Plans zählen dabei nicht als Bezugsgröße. Die Kennzeichnung kennt genau zwei Stufen — konfliktfrei oder kollidierend. Herkunft: NEU, Bezugsgröße auf den Zwischenstand umgestellt 2026-09-08, Bezug auf den Status „fest" entfallen 2026-09-08; vormals SCHED-F-290. Seit die Planung erst auf ausdrückliche Sicherung wirkt, wäre eine Prüfung allein gegen den gesicherten Plan blind für alles, was gerade entschieden wird. Die dritte Stufe für vorgemerkte Termine entfällt mit dem Status selbst; ein deaktivierter Termin bleibt außen vor, weil die Nutzerin ihn gerade nicht wahrnimmt.

#### Scenario: Mehrere parallele Gruppentermine
- **WHEN** ein Kandidat mehrere parallele Termine anbietet
- **THEN** prüft das System jeden Termin gegen die Termine des Zwischenstands und kennzeichnet ihn als konfliktfrei oder kollidierend

#### Scenario: Kollision innerhalb derselben Sitzung
- **WHEN** die Nutzerin zwei zeitlich überschneidende Termine nacheinander auswählt, ohne zwischendurch zu sichern
- **THEN** kennzeichnet das System die Kollision unmittelbar, ohne das Sichern abzuwarten

#### Scenario: Kollision mit einem deaktivierten Termin
- **WHEN** ein Kandidaten-Termin sich allein mit einem deaktivierten Termin des gesicherten Plans überschneidet
- **THEN** kennzeichnet das System ihn als konfliktfrei

### Requirement: Mehrere Gruppen-Slots übernehmen

Das System muss der Nutzerin ermöglichen, mehrere Gruppen-Slots derselben Veranstaltung gleichzeitig in den Plan zu übernehmen, und dabei die Anzahl der übernommenen Slots erkennbar machen. Ein Vorrang zwischen den übernommenen Slots wird nicht geführt; sie sind gleichrangig hinzugefügt. Herkunft: Recherche: Rücksprache Studierender, 2026-09-04, Anzeige der Anzahl ergänzt 2026-09-08, Vorrangbestimmung entfallen 2026-09-08; vormals SCHED-F-620. Ohne die Anzahl ist eine bewusste Übernahme zweier Slots von einer versehentlichen Doppelbelegung nicht zu unterscheiden. Die vorherige Fassung verlangte, einen der Slots als „fest" zu bestimmen; mit dem Entfall des Status entfällt auch dieser Bedienschritt — wer einen der beiden Slots ruhigstellen will, deaktiviert ihn in der Wochenansicht.

#### Scenario: Zwei Gruppen-Slots übernehmen
- **WHEN** die Nutzerin zwei Gruppen-Slots derselben Veranstaltung auswählt
- **THEN** übernimmt das System beide gemeinsam und gleichrangig in den Plan

#### Scenario: Anzahl erkennbar
- **WHEN** zu einer Veranstaltungsart mehr als ein Gruppen-Slot übernommen ist
- **THEN** weist das System die Anzahl der übernommenen Slots an den betreffenden Terminen aus

#### Scenario: Kein Vorrang zu bestimmen
- **WHEN** die Nutzerin zwei Gruppen-Slots derselben Veranstaltungsart gewählt hat
- **THEN** verlangt das System von ihr keine Bestimmung, welcher der beiden vorrangig gilt

### Requirement: Hervorhebung der eigenen Gruppe im Planungsmodus

Das System muss im Planungsmodus die Termine, deren `studentSet` die eigene Gruppenkennung einschließt, gegenüber den übrigen farblich hervorheben und diese Bedeutung zusätzlich zur Farbe über Text oder Symbol tragen. Es darf dabei keinen Termin ausblenden. Das bestehende Requirement „Kennzeichnung fremder Gruppenzugehörigkeit zusätzlich zur Farbe" der Capability `ux-and-theming` gilt unverändert weiter und betrifft die Gegenrichtung: Auch die nicht zugehörigen Termine tragen ihre Bedeutung über Text oder Symbol. Herkunft: Alt: alte apps/android-fb4/FB4/fB4/src/main/java/de/fsrfb4/fb4/activities/timetable/AddEventsActivity.java:688-692, farbliche Ausführung bestätigt 2026-09-08 aus Issue #62. Die Alt-App färbt passende Karten orange ein und blendet trotz des Klassennamens `LetterFilter` nichts aus; der Buchstabe musste dort über einen Menüdialog eingegeben werden, während er hier aus der Einrichtung stammt. Die bisherige Umsetzung trug die Zugehörigkeit allein als Text in der Kennzeichnungszeile.

#### Scenario: Termin der eigenen Gruppe
- **WHEN** ein Termin die eigene Gruppenkennung einschließt
- **THEN** hebt das System ihn farblich hervor und macht diese Bedeutung zusätzlich zur Farbe über Text oder Symbol erkennbar

#### Scenario: Gruppenfremder Termin bleibt wählbar
- **WHEN** ein Termin die eigene Gruppenkennung nicht einschließt
- **THEN** zeigt das System ihn weiterhin und lässt seine Wahl zu

### Requirement: Leiste der ausstehenden Veranstaltungen

Das System muss im Planungsmodus dauerhaft anzeigen, welche Veranstaltungsarten gewählter Module noch an keiner Stelle eingeplant sind, und sie dabei benennen statt nur zu zählen. Ein Bedienweg von dort muss auf den Wochentag führen, an dem die betreffende Veranstaltung liegt, sie in den sichtbaren Bereich holen und kurzzeitig hervorheben; danach kehrt die Darstellung von selbst in den Normalzustand zurück. Die Leiste muss eine feste Höhe einnehmen, die sich weder mit dem Wochentag noch mit ihrem Inhalt ändert. An ihrem linken Rand muss ein Bedienweg zum Anlegen eines eigenen Termins stehen. Herkunft: NEU, entschieden 2026-09-08, feste Höhe, Sprungverhalten und Anlege-Bedienweg ergänzt 2026-09-08 aus Issue #62. Bei einer Gliederung nach Wochentagen ist immer nur ein Tag sichtbar; eine noch nicht eingeplante Veranstaltung an einem anderen Tag bliebe sonst unbemerkt, bis der Plan fertig scheint. Die feste Höhe folgt daraus, dass die Einträge je nach Konfliktlage ein- oder zweizeilig sind und der darüberliegende Plan bei jedem Tagwechsel sprang. Die dauerhaft stehenbleibende Hervorhebung nach einem Sprung war nicht mehr von einer Auswahl zu unterscheiden.

#### Scenario: Ausstehende Veranstaltung an einem anderen Tag
- **WHEN** eine Veranstaltungsart eines gewählten Moduls noch nirgends eingeplant ist und ihre Termine an einem gerade nicht sichtbaren Wochentag liegen
- **THEN** nennt die Leiste sie beim Namen, und ein Bedienweg von dort wechselt auf den betreffenden Wochentag, holt den Termin in den sichtbaren Bereich und hebt ihn kurzzeitig hervor

#### Scenario: Hervorhebung nach dem Sprung
- **WHEN** die kurzzeitige Hervorhebung nach einem Sprung abgelaufen ist
- **THEN** zeigt das System den Termin im Normalzustand, ohne dass die Nutzerin dafür etwas tun musste

#### Scenario: Nichts steht mehr aus
- **WHEN** zu jeder Veranstaltungsart jedes gewählten Moduls mindestens ein Termin gewählt ist
- **THEN** meldet die Leiste, dass nichts mehr aussteht

#### Scenario: Höhe beim Tagwechsel
- **WHEN** die Nutzerin zwischen Wochentagen mit unterschiedlich vielen ausstehenden Veranstaltungen wechselt
- **THEN** behält die Leiste dieselbe Höhe, und der darüberliegende Plan verschiebt sich nicht

#### Scenario: Eigenen Termin aus der Leiste anlegen
- **WHEN** die Nutzerin den Bedienweg am linken Rand der Leiste auslöst
- **THEN** öffnet das System das Anlegen eines eigenen Termins

### Requirement: Ausdrückliches Sichern der Planung

Das System muss die im Planungsmodus getroffenen Entscheidungen erst dann in den persönlichen Plan übernehmen, wenn die Nutzerin eine dafür vorgesehene Sicherungsaktion auslöst. Bis dahin darf keine Wahl den Plan verändern. Der Bildschirm muss erkennbar machen, ob ungesicherte Änderungen vorliegen. Nach dem Sichern muss das System in die Wochenansicht wechseln. Herkunft: NEU, entschieden 2026-09-08, Muster übernommen aus alte apps/android-fb4/FB4/fB4/src/main/java/de/fsrfb4/fb4/activities/timetable/AddEventsActivity.java (Menüeintrag `speichern`), Wechsel in die Wochenansicht ergänzt 2026-09-08 aus Issue #62. Der Planungsmodus weicht damit bewusst von den übrigen gerätelokalen Speichern der App ab, die unmittelbar schreiben: Das Zusammenstellen eines Stundenplans ist eine zusammenhängende Überlegung über mehrere Wochentage hinweg, deren Zwischenstände nicht schon im Plan stehen sollen. Der Wechsel in die Wochenansicht zeigt das Ergebnis der Arbeit; ohne ihn bleibt die Nutzerin auf einem Bildschirm stehen, auf dem sich nach dem Sichern sichtbar nichts geändert hat.

#### Scenario: Wahl vor dem Sichern
- **WHEN** die Nutzerin einen Termin auswählt oder abwählt, ohne zu sichern
- **THEN** bleibt der persönliche Plan unverändert, und der Bildschirm weist die Änderung als ungesichert aus

#### Scenario: Sichern auslösen
- **WHEN** die Nutzerin die Sicherungsaktion auslöst
- **THEN** übernimmt das System sämtliche getroffenen Entscheidungen gemeinsam in den persönlichen Plan und wechselt in die Wochenansicht

#### Scenario: Nichts geändert
- **WHEN** die Nutzerin den Planungsmodus öffnet und nichts ändert
- **THEN** weist der Bildschirm keine ungesicherten Änderungen aus

### Requirement: Dauerhafter Zugang zur Einrichtung

Das System muss die Einrichtung des Stundenplans über einen jederzeit sichtbaren Bedienweg erreichbar machen, unabhängig davon, ob bereits ein persönlicher Plan besteht. In der Wochenansicht muss dieser Bedienweg als Symbol in der Kopfzeile stehen und dort auch beim Blättern im Plan sichtbar bleiben. Herkunft: NEU, entschieden 2026-09-08, Platz in der Kopfzeile festgelegt 2026-09-08 aus Issue #62. Die bisherige Umsetzung erreichte die Einrichtung ausschließlich aus Leerzuständen und aus dem Semesterwechsel-Hinweis; wer nach dem Anlegen eines Plans seine Gruppenkennung korrigieren wollte, hätte zuvor den gesamten Plan leeren müssen. Der zwischenzeitlich eingefügte Textverweis stand im Inhaltsbereich und scrollte mit dem Plan fort.

#### Scenario: Einrichtung bei gefülltem Plan öffnen
- **WHEN** ein persönlicher Plan besteht und die Nutzerin die Einrichtung öffnen will
- **THEN** bietet das System einen sichtbaren Bedienweg dorthin an, ohne dass der Plan geleert werden muss

#### Scenario: Zugang beim Blättern im Plan
- **WHEN** die Nutzerin in der Wochenansicht im Plan nach unten blättert
- **THEN** bleibt das Symbol in der Kopfzeile sichtbar und erreichbar

### Requirement: Wochentagsleiste mit bedarfsweisem Samstag

Das System muss über dem Plan eine Leiste aller darzustellenden Wochentage anzeigen und einen Wochentag jenseits von Montag bis Freitag genau dann aufnehmen, wenn an ihm mindestens ein Termin liegt. Je Eintrag zeigt die Leiste den Wochentag und das Kalenderdatum, sonst nichts. Herkunft: Recherche: Rücksprache Studierender, 2026-09-04, Beschränkung des Eintragsinhalts ergänzt 2026-09-08 aus Issue #62; vormals SCHED-F-460. Die zusätzlich geführte Terminanzahl beantwortete keine Frage, die sich beim Blick auf die Leiste stellt, und drängte Wochentag und Datum in eine kleinere Schriftgröße.

#### Scenario: Samstag mit Termin
- **WHEN** an einem Samstag mindestens ein Termin liegt
- **THEN** nimmt das System den Samstag in die Wochentagsleiste auf

#### Scenario: Samstag ohne Termin
- **WHEN** an einem Samstag kein Termin liegt
- **THEN** lässt das System den Samstag in der Wochentagsleiste aus

#### Scenario: Inhalt eines Eintrags
- **WHEN** ein Eintrag der Wochentagsleiste angezeigt wird
- **THEN** trägt er Wochentag und Kalenderdatum, aber keine Terminanzahl

### Requirement: Wiederkehrend oder einmalig bei eigenen Terminen

Das System muss beim Anlegen eines eigenen Eintrags die Wahl ermöglichen, ob er wöchentlich wiederkehrt oder einmalig an einem bestimmten Datum stattfindet. Wird der Eintrag aus dem Planungsmodus heraus angelegt, ist er stets wöchentlich wiederkehrend und liegt auf dem dort gerade sichtbaren Wochentag; das System bietet in diesem Fall weder die Wahl der Wiederholung noch die des Wochentags an. Herkunft: Recherche: Rücksprache Studierender, 2026-09-04, Festlegung für den Planungsmodus ergänzt 2026-09-08 aus Issue #62; vormals SCHED-F-730. Der Planungsmodus stellt einen Wochenstundenplan zusammen; ein einmaliges Ereignis gehört dort nicht hin, und der Wochentag steht durch den sichtbaren Tag bereits fest. Die bisherige Umsetzung gab den Wochentag als Vorgabe mit, ließ das Auswahlfeld aber bedienbar — eine Änderung dort hätte den Termin aus dem gerade bearbeiteten Tag herausfallen lassen.

#### Scenario: Wöchentlich wiederkehrender Eintrag
- **WHEN** die Nutzerin einen eigenen Eintrag als wöchentlich wiederkehrend anlegt
- **THEN** erscheint er in jeder Woche seines Gültigkeitszeitraums

#### Scenario: Einmaliger Eintrag
- **WHEN** die Nutzerin einen eigenen Eintrag als einmalig an einem Datum anlegt
- **THEN** erscheint er nur in der Woche dieses Datums

#### Scenario: Eintrag aus dem Planungsmodus
- **WHEN** die Nutzerin einen eigenen Termin aus dem Planungsmodus heraus anlegt
- **THEN** bietet das System weder die Wahl der Wiederholung noch die des Wochentags an, und der Eintrag ist wöchentlich wiederkehrend auf dem dort sichtbaren Wochentag

## REMOVED Requirements

### Requirement: Konflikthinweis bei festen Terminen

**Reason**: Die Anforderung knüpfte den Konflikthinweis an den Status „fest", der mit Issue #62 entfällt (Entscheidung 2026-09-08). Sowohl ihr Titel als auch ihr Szenario „Zwei feste Termine überschneiden sich" tragen ein Vokabular, das die Capability nicht mehr kennt.

**Migration**: Ersetzt durch das gleichlautend fortgeführte Requirement „Konflikthinweis bei überschneidenden Terminen". Es trägt dieselbe Regel, bezieht sie aber auf aktive statt auf feste Termine und nimmt deaktivierte Termine ausdrücklich aus. Die Ausnahme für den bewusst angenommenen Konflikt gilt unverändert weiter.

### Requirement: Status „fest" oder „vorgemerkt"

**Reason**: Entschieden 2026-09-08 (Issue #62). Der Status ist am Gerät als zu viel Bedienoberfläche für zu wenig Ertrag beurteilt worden: eine Zuordnungsregel im Planungsmodus, ein „als fest festlegen"-Bedienweg je Zeile, eine dritte Konfliktstufe und eine eigene Kennzeichnung in der Wochenansicht, um einen einzigen Fall abzudecken — einen Termin im Plan behalten, ohne ihn wahrzunehmen. Diesen Fall deckt das Deaktivieren ab, das die Alt-App unter `action_toggle_cancel` seit jeher führt und das ohne Zuordnungsregel auskommt.

**Migration**: Ersetzt durch die Requirements „Deaktivieren eines Termins" und „Wirkung eines deaktivierten Termins". Gespeicherte Einträge mit `status: 'vorgemerkt'` gelten künftig als dauerhaft deaktiviert, solche mit `status: 'fest'` als aktiv; die Überführung ist in der Capability `data-and-storage` festgehalten. Der Planungsmodus kennt nur noch „hinzugefügt" und „nicht hinzugefügt".

### Requirement: Unterscheidung vorgemerkter Termine

**Reason**: Der Status, den diese Anforderung unterscheidbar machen sollte, entfällt.

**Migration**: Ersetzt durch das Requirement „Wirkung eines deaktivierten Termins", das dieselbe Pflicht — Bedeutung zusätzlich zur Farbe über Text oder Symbol — für den deaktivierten Zustand führt.

### Requirement: Kein Konflikthinweis bei vorgemerkten Terminen

**Reason**: Der Status, an den die Ausnahme geknüpft war, entfällt. Damit entfällt auch die dritte Konfliktstufe im Planungsmodus, die eine Überschneidung mit einem vorgemerkten Termin zurückgenommen kennzeichnete.

**Migration**: Ersetzt durch das Requirement „Wirkung eines deaktivierten Termins" (kein Konflikthinweis für deaktivierte Termine) und die geänderten Requirements „Konflikthinweis bei überschneidenden Terminen" und „Konfliktprüfung paralleler Termine", die nur noch zwei Stufen kennen.

### Requirement: Belegungsvorschau je Tag

**Reason**: Entschieden 2026-09-08 (Issue #62). Die Terminanzahl je Tag beantwortete keine Frage, die sich beim Blick auf die Wochentagsleiste stellt, und drängte Wochentag und Datum in eine kleinere Schriftgröße, während die Leiste zugleich die volle Bildschirmbreite füllen soll.

**Migration**: Ersatzlos. Das geänderte Requirement „Wochentagsleiste mit bedarfsweisem Samstag" legt den Inhalt eines Eintrags auf Wochentag und Kalenderdatum fest. Wer wissen will, was an einem Tag liegt, wechselt auf ihn.
