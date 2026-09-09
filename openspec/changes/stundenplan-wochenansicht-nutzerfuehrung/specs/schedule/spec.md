## ADDED Requirements

### Requirement: Feststehender Kopfbereich der Wochenansicht

Das System muss Wochenangabe und Wochentagsleiste beim Blättern innerhalb eines Tages sichtbar halten, sodass der Wechsel des Wochentags jederzeit ohne vorheriges Zurückblättern möglich ist. Herkunft: NEU, entschieden 2026-09-08. Die bisherige Umsetzung führte den gesamten Bildschirm als einen Bildlauf; die Wochentagsleiste ist zugleich die einzige Möglichkeit, den Tag zu wechseln, und verschwand bei einer Tagesachse von acht bis achtzehn Uhr nach rund 900 dp aus dem Blick.

#### Scenario: Innerhalb eines vollen Tages blättern
- **WHEN** die Nutzerin in einem Tag mit vielen Terminen nach unten blättert
- **THEN** bleiben Wochenangabe und Wochentagsleiste sichtbar

### Requirement: Tageswechsel durch Wischen

Das System muss den Wechsel zum vorigen und nächsten Wochentag zusätzlich zur Wochentagsleiste über eine waagerechte Wischgeste ermöglichen. Die Geste darf nicht der einzige Weg zu dieser Aktion sein. Herkunft: NEU, entschieden 2026-09-08. Der Mensaplan bietet dieselbe Geste für den Tageswechsel bereits an; die Capability `ux-and-theming` schließt aus, dass eine Aktion allein über eine Geste erreichbar ist — die Wochentagsleiste bleibt der sichtbare Weg.

#### Scenario: Zum nächsten Tag wischen
- **WHEN** die Nutzerin waagerecht über den Plan wischt
- **THEN** wechselt das System zum benachbarten Wochentag, ohne dass die Wochentagsleiste ihren Zweck verliert

### Requirement: Ansichts- und Verwaltungsblatt in der Kopfzeile

Das System muss die Einstellungen der Wochenansicht sowie die Aktionen zum Leeren und Zurücksetzen des Stundenplans über ein einziges Element der Kopfzeile erreichbar machen. Der Zugang zur Einrichtung ist nicht Teil dieses Blatts — er steht als eigenes Kopfzeilen-Symbol daneben (Requirement „Dauerhafter Zugang zur Einrichtung"). Herkunft: NEU, entschieden 2026-09-08, Abgrenzung zum Einrichtungs-Zugang bei der Bereinigung mit `stundenplan-bedienung-ohne-vormerkung` am 2026-09-09 bestätigt. Die bisherige Umsetzung führte die Schalter als Kasten **unter** dem Plan, hinter der gesamten Tagesachse; die Einstellung „beim Öffnen zu heute springen" war überhaupt nicht bedienbar, obwohl im Modell vorhanden.

#### Scenario: Einstellungen erreichen
- **WHEN** die Nutzerin die Einstellungen der Wochenansicht aufruft
- **THEN** öffnet das System ein Blatt mit den Ansichtsschaltern und den Aktionen zum Leeren und Zurücksetzen, ohne den Zugang zur Einrichtung

#### Scenario: Sprung zu heute umschalten
- **WHEN** die Nutzerin die Einstellung „beim Öffnen zum aktuellen Wochentag springen" ändert
- **THEN** übernimmt das System die Änderung für das nächste Öffnen

### Requirement: Einblenden aller Veranstaltungen gewählter Module

Das System muss einen Schalter bereitstellen, der zusätzlich zu den Terminen des persönlichen Plans alle weiteren Termine der gewählten Module einblendet, abgesetzt von den eigenen dargestellt. Ein Bedienweg an einem so eingeblendeten Termin muss die Wahl zwischen „anstelle des eigenen Termins" und „zusätzlich zum eigenen Termin" anbieten. Herkunft: NEU, entschieden 2026-09-08. Setzt die Requirements „Einsicht in Termine anderer Gruppen" und „Übernahme des Termins einer anderen Gruppe" in der Wochenansicht um, die bislang nur im Auswahlbestand wirksam waren. Der Umfang macht die Stapelung überschneidender Termine zur Voraussetzung: Für sechs Module des 2. Fachsemesters von `INPBPI` stehen 64 Termine gegenüber 13 gewählten.

#### Scenario: Alternativen einblenden
- **WHEN** die Nutzerin den Schalter aktiviert
- **THEN** zeigt das System zusätzlich alle weiteren Termine der gewählten Module, abgesetzt von den eigenen

#### Scenario: Alternative übernehmen
- **WHEN** die Nutzerin einen eingeblendeten Termin auswählt
- **THEN** bietet das System an, ihn anstelle des eigenen Termins oder zusätzlich zu ihm in den Plan zu übernehmen

### Requirement: Kennzeichnung eines leeren Wochentags

Falls an einem Wochentag kein Termin dargestellt wird, muss das System diesen Tag als leer kennzeichnen. Liegt der Grund darin, dass alle Termine des Tages außerhalb ihres Gültigkeitszeitraums liegen, muss das System diesen Grund nennen; liegt am Tag ohnehin kein Termin, darf es keinen Grund behaupten. Herkunft: NEU, entschieden 2026-09-08. Ersetzt das Requirement „Leerer Tag bei wirksamem Filter" (vormals SCHED-F-100), dessen Filterbezug mit dem Wegfall der beiden wählbaren Filter gegenstandslos geworden ist. Der Zweck bleibt derselbe: Ein leerer Tag darf nicht wie ein Fehler aussehen, und ein Termin darf nicht ohne Erklärung verschwinden.

#### Scenario: Gültigkeitszeitraum leert den Tag
- **WHEN** an einem Wochentag alle Termine außerhalb ihres Gültigkeitszeitraums liegen
- **THEN** kennzeichnet das System den Tag als leer und nennt den Gültigkeitszeitraum als Grund

#### Scenario: Tag ohne Termine
- **WHEN** an einem Wochentag ohnehin kein Termin liegt
- **THEN** kennzeichnet das System den Tag als leer, ohne einen Grund zu behaupten

### Requirement: Gültigkeitszeitraum je Eintrag änderbar

Das System muss der Nutzerin ermöglichen, den Gültigkeitszeitraum eines einzelnen Eintrags des persönlichen Plans über einen sichtbaren Bedienweg zu ändern, Beginn und Ende je einzeln und jeweils auch offen. Das gilt für offizielle wie für selbst angelegte Einträge. Ein von der Nutzerin gesetzter Zeitraum ist gegenüber den aus INT-002 übernommenen Angaben maßgeblich und darf von keinem Abgleich überschrieben werden. Liegt das Ende vor dem Beginn, muss das System die Eingabe zurückweisen und den Grund benennen. Herkunft: NEU, entschieden 2026-09-08. Die Felder `gueltigVon` und `gueltigBis` bestehen bereits an jedem Eintrag und werden von der Wochenansicht ausgewertet; es fehlte allein der Bedienweg. Die Anforderung ist zugleich das Auffangnetz für die Ableitung des Zeitraums aus dem Endpunktnamen (Capability `schedule`, Requirement „Gültigkeitszeitraum aus dem Endpunktnamen"): Bricht deren Namensmuster weg, erscheint eine Blockwoche als durchgehende wöchentliche Veranstaltung — die Nutzerin korrigiert das dann von Hand, statt einem Fehler des Fremdsystems ausgeliefert zu sein.

#### Scenario: Zeitraum eines offiziellen Termins einschränken
- **WHEN** die Nutzerin für einen offiziellen Termin einen abweichenden Gültigkeitszeitraum festlegt
- **THEN** erscheint der Termin nur noch innerhalb dieses Zeitraums, unabhängig von den aus INT-002 übernommenen Angaben

#### Scenario: Offenes Ende
- **WHEN** die Nutzerin einen Beginn festlegt und das Ende offen lässt
- **THEN** gilt der Termin ab dem Beginn ohne Enddatum

#### Scenario: Ende vor Beginn
- **WHEN** die Nutzerin ein Ende vor dem Beginn angibt
- **THEN** weist das System die Eingabe zurück und benennt den Grund, ohne den bisherigen Zeitraum zu verwerfen

#### Scenario: Eigener Termin auf einen Tag begrenzt
- **WHEN** die Nutzerin den Zeitraum eines selbst angelegten Termins auf einen einzigen Tag setzt
- **THEN** führt das System ihn als einmalig, sodass Zeitraum und die Angabe „wiederkehrend oder einmalig" einander nicht widersprechen

### Requirement: Unterscheidung von Entfernen und Löschen im Termindetail

Das System muss im Termindetail zwischen dem Entfernen eines offiziellen Termins aus dem persönlichen Plan und dem Löschen eines selbst angelegten Termins unterscheiden. Das Entfernen eines offiziellen Termins darf nicht als zerstörende Aktion beschriftet oder gestaltet werden und braucht keine Bestätigung; das Löschen eines eigenen Termins muss als zerstörende Aktion gestaltet und vor der Ausführung bestätigt werden. Herkunft: NEU, entschieden 2026-09-08. Folgt aus den Requirements „Bestätigung vor zerstörender Aktion" und „Keine zerstörende Aktion als Primäraktion" der Capability `ux-and-theming`: Ein offizieller Termin besteht im FBWS unverändert fort, erscheint nach dem Entfernen im Planungsmodus als nicht eingeplant und wird dort von der Leiste der ausstehenden Veranstaltungen benannt — er ist jederzeit wiederherstellbar und damit nicht zerstörend. Ein eigener Termin ist Handarbeit, steht in keinem Fremdsystem und ist nach dem Löschen verloren. Die bisherige Umsetzung stellte beide gleich, mit demselben rot gestalteten Knopf „Termin löschen".

#### Scenario: Offiziellen Termin aus dem Plan nehmen
- **WHEN** die Nutzerin einen offiziellen Termin aus ihrem Plan nimmt
- **THEN** benennt und gestaltet das System die Aktion als Entfernen aus dem Plan, nicht als Löschen, und führt sie ohne Bestätigung aus

#### Scenario: Eigenen Termin löschen
- **WHEN** die Nutzerin einen selbst angelegten Termin löscht
- **THEN** gestaltet das System die Aktion als zerstörend und holt vor der Ausführung eine Bestätigung ein

#### Scenario: Entfernter offizieller Termin bleibt auffindbar
- **WHEN** ein offizieller Termin aus dem Plan genommen wurde und sein Modul weiterhin gewählt ist
- **THEN** führt der Planungsmodus die betreffende Veranstaltungsart als nicht eingeplant und benennt sie in der Leiste der ausstehenden Veranstaltungen

### Requirement: Rückkehr zur laufenden Woche über die Wochenangabe

Das System muss die Rückkehr zur laufenden Woche über die Wochenangabe selbst ermöglichen und einen ergänzenden Hinweis darauf nur dann einblenden, wenn eine andere als die laufende Woche angezeigt wird. Ein zusätzliches Bedienelement, dessen Erscheinen die Anordnung der übrigen verschiebt, ist ausgeschlossen. Herkunft: NEU, entschieden 2026-09-08, Muster übernommen aus der Mensa-Tagesauswahl (Capability `canteen`). Die bisherige Umsetzung setzte einen zweiten Knopf neben die Wochenangabe, der beim Blättern erschien und verschwand und dabei die Blätterpfeile verschob.

#### Scenario: Andere Woche angezeigt
- **WHEN** eine andere als die laufende Woche angezeigt wird
- **THEN** führt ein Bedienweg an der Wochenangabe zur laufenden Woche zurück, und ein ergänzender Hinweis weist darauf hin

#### Scenario: Laufende Woche angezeigt
- **WHEN** die laufende Woche angezeigt wird
- **THEN** entfällt der ergänzende Hinweis, ohne dass sich die Anordnung der übrigen Bedienelemente verschiebt

## MODIFIED Requirements

### Requirement: Proportionale Zeitachse

Das System muss die Termine eines Tages auf einer zur Uhrzeit proportionalen Achse darstellen, sodass Zeiträume ohne Termin als Lücke mit Angabe ihrer Dauer erkennbar sind. Dabei gilt:

- Die Achse beginnt mit dem ersten und endet mit dem letzten Termin des angezeigten Tages; Leerraum vor dem ersten und nach dem letzten Termin entfällt.
- Eine Lücke von weniger als fünfzehn Minuten wird ohne Block und ohne Beschriftung als bloßer Zwischenraum dargestellt.
- Eine Lücke von mehr als einer Stunde wird auf die Höhe einer Stunde gestaucht; sie trägt dabei ihre tatsächliche Dauer.
- Eine Lücke wird nicht umrandet; ihre Beschriftung allein weist sie aus.

Herkunft: Recherche: Rücksprache Studierender, 2026-09-04, Zuschnitt und Stauchung ergänzt 2026-09-08, Rahmen und Bruchzeichen zurückgenommen 2026-09-09; vormals SCHED-F-520. Die vorige Umsetzung spannte die Achse über die **ganze Woche** auf, sodass ein einzelner Abendtermin jeden anderen Tag dehnte und eine Freistunde von dreieinhalb Stunden als über 300 dp hoher Block erschien. Der damalige Einwand gegen eine Spanne je Tag — gleich hohe Kacheln stünden dann für unterschiedliche Dauern — trifft nicht zu, da die Höhe je Minute eine Konstante ist und von der Spanne nicht abhängt.

#### Scenario: Freistunde zwischen zwei Terminen
- **WHEN** zwischen zwei Terminen eines Tages eine Lücke von 45 Minuten liegt
- **THEN** stellt das System sie proportional mit Angabe ihrer Dauer dar

#### Scenario: Kurze Lücke
- **WHEN** zwischen zwei Terminen eines Tages eine Lücke von zehn Minuten liegt
- **THEN** stellt das System sie als bloßen Zwischenraum ohne Block und ohne Beschriftung dar

#### Scenario: Lange Lücke
- **WHEN** zwischen zwei Terminen eines Tages eine Lücke von drei Stunden dreißig liegt
- **THEN** staucht das System sie auf Stundenhöhe und weist sie mit ihrer tatsächlichen Dauer aus

#### Scenario: Kein Leerraum an den Tagesrändern
- **WHEN** der erste Termin eines Tages um 10:00 Uhr beginnt, während an einem anderen Tag der Woche bereits um 8:00 Uhr ein Termin liegt
- **THEN** beginnt die Achse dieses Tages bei 10:00 Uhr

### Requirement: Nebeneinanderdarstellung überschneidender Termine

Wenn sich Termine desselben Tages zeitlich überschneiden, muss das System sie nebeneinander darstellen, sodass jeder Termin einzeln erkenn- und auswählbar bleibt. Eine Obergrenze für die Zahl der Spalten gibt es nicht; kein überschneidender Termin darf verborgen werden. Herkunft: Recherche: Rücksprache Studierender, 2026-09-04, Obergrenze ergänzt 2026-09-08 und am Gerät zurückgenommen 2026-09-09; vormals SCHED-F-540. Die zwischenzeitliche Kappung auf drei Spalten mit aufklappbarem Stapel erwies sich im Prüfprotokoll vom 2026-09-09 als schlecht bedienbar. Mehr als drei überschneidende Termine sind ein von der Nutzerin selbst herbeigeführter Randfall; für den Überblick steht die nicht maßstabsgetreue Ansicht bereit, die ohne Spaltenbreite auskommt.

#### Scenario: Überschneidende Termine
- **WHEN** sich zwei Termine desselben Tages zeitlich überschneiden
- **THEN** stellt das System beide nebeneinander, einzeln erkenn- und auswählbar dar

#### Scenario: Drei überschneidende Termine
- **WHEN** sich drei Termine desselben Tages zeitlich überschneiden
- **THEN** stellt das System alle drei nebeneinander dar

#### Scenario: Mehr als drei überschneidende Termine
- **WHEN** sich an einem Wochentag vier Termine zeitlich überschneiden
- **THEN** stellt das System alle vier nebeneinander dar, jeden einzeln erkenn- und auswählbar, und verbirgt keinen davon

### Requirement: Hervorhebung des laufenden Termins und der aktuellen Uhrzeit

Das System muss den gerade laufenden Termin zusätzlich im Plan selbst hervorheben und die aktuelle Uhrzeit auf der Zeitachse des heutigen Tages kennzeichnen. Liegt die aktuelle Uhrzeit außerhalb der Spanne des angezeigten Tages, muss das System die Kennzeichnung am entsprechenden Rand der Achse anheften, statt sie zu entfernen. Herkunft: Recherche: Rücksprache Studierender, 2026-09-04, Randverhalten ergänzt 2026-09-08; vormals SCHED-F-560. Eine Bewegung in dieser Anzeige unterliegt der Anforderung zur Bewegungsreduktion der Capability `non-functional` und entfällt bei entsprechender Systemeinstellung. Das Randverhalten wird nötig, seit die Achse auf den Tag zugeschnitten ist: Vor der ersten und nach der letzten Veranstaltung läge die aktuelle Uhrzeit sonst außerhalb.

#### Scenario: Laufender Termin im Plan
- **WHEN** ein Termin gerade läuft
- **THEN** hebt das System ihn im Plan hervor und kennzeichnet die aktuelle Uhrzeit auf der Zeitachse

#### Scenario: Uhrzeit vor dem ersten Termin
- **WHEN** der heutige Tag angezeigt wird und die aktuelle Uhrzeit vor dem Beginn des ersten Termins liegt
- **THEN** heftet das System die Kennzeichnung an den oberen Rand der Achse

### Requirement: Anzeige des laufenden und nächsten Termins

Das System muss den gerade laufenden und den nächsten anstehenden Termin gemeinsam mit der verbleibenden Zeit in einer eigenen Anzeige über dem Plan ausweisen. Beide müssen dabei nebeneinander erkennbar sein, und Zeitangaben von mehr als einer Stunde müssen in Stunden und Minuten ausgewiesen werden. Herkunft: Recherche: Rücksprache Studierender, 2026-09-04, Darstellung und Zeitformat ergänzt 2026-09-08; vormals SCHED-F-550. Die bisherige Umsetzung führte beide untereinander und gab die verbleibende Zeit ausschließlich in Minuten an — „in 200 min" statt „in 3 h 20", obwohl derselbe Bildschirm für die Lückenbeschriftung bereits einen Formatierer mit Stunden führt.

#### Scenario: Blick auf den Plan während eines laufenden Termins
- **WHEN** ein Termin gerade läuft
- **THEN** zeigt das System ihn und den nächsten anstehenden Termin mit verbleibender Zeit nebeneinander über dem Plan

#### Scenario: Nächster Termin in mehreren Stunden
- **WHEN** der nächste Termin in 200 Minuten beginnt
- **THEN** weist das System die verbleibende Zeit in Stunden und Minuten aus

### Requirement: Farbwahl je Termin

Das System muss der Nutzerin das Ändern der Farbe über einen sichtbaren Bedienweg ermöglichen, abweichend von der nach der Anforderung zur automatischen Farbzuweisung vergebenen Vorbelegung. Wird eine Farbe geändert, muss das System vor dem Verlassen der Ansicht erfragen, ob die Änderung für alle Veranstaltungen desselben Moduls oder nur für den geöffneten Termin gelten soll. Die Rückkehr zur automatischen Vergabe muss über einen Wert „keine Farbe" der Farbauswahl möglich sein. Die automatische Farbzuweisung als solche muss abschaltbar sein, ohne dass eigene Farbwahlen dadurch verlorengehen; das Abschalten muss auch auf einen bereits bestehenden Plan wirken und umkehrbar sein. Dazu muss das System je Termin festhalten, ob seine Farbe von der Nutzerin gewählt oder automatisch vergeben wurde. Bei abgeschalteter Automatik erscheint ein automatisch eingefärbter Termin in einer neutralen Fläche, ein von der Nutzerin eingefärbter behält seine Farbe. Herkunft: Alt: lib/areas/schedule/widgets/schedule_list.dart:59-136, Geltungsbereich und Rückweg ergänzt 2026-09-08, Herkunft der Farbe ergänzt 2026-09-09; vormals SCHED-F-247. Die automatische Vergabe erfolgt je Veranstaltung, das Ändern wirkte bislang auf einen einzelnen Termin — wer die Farbe seiner Vorlesung änderte, behielt die zugehörige Übung in der alten Farbe, ohne dass ein Rückweg sichtbar gewesen wäre. Das Abschalten der Automatik wirkte zunächst nur auf neu angelegte Termine, weil die Farbe beim Anlegen fest in den Eintrag geschrieben wurde; ein bestehender Plan blieb unverändert bunt (Prüfprotokoll 2026-09-09, Abschnitt 3).

#### Scenario: Farbe ändern
- **WHEN** die Nutzerin für einen Termin eine andere Farbe wählt
- **THEN** übernimmt das System diese Farbe abweichend von der automatischen Zuweisung

#### Scenario: Geltungsbereich erfragen
- **WHEN** die Nutzerin nach einer Farbänderung die Ansicht verlässt
- **THEN** erfragt das System, ob die Änderung für alle Veranstaltungen des Moduls oder nur für den geöffneten Termin gelten soll

#### Scenario: Zurück zur Automatik
- **WHEN** die Nutzerin den Wert „keine Farbe" wählt
- **THEN** gilt für die betreffende Veranstaltung wieder die automatisch vergebene Farbe

#### Scenario: Automatik bei bestehendem Plan abschalten
- **WHEN** die Nutzerin die Farbautomatik abschaltet, während ihr Plan bereits Termine enthält
- **THEN** erscheinen die automatisch eingefärbten Termine in einer neutralen Fläche, während ein von der Nutzerin eingefärbter Termin seine Farbe behält

#### Scenario: Automatik wieder einschalten
- **WHEN** die Nutzerin die Farbautomatik nach dem Abschalten wieder einschaltet
- **THEN** erscheinen die zuvor automatisch vergebenen Farben erneut

## REMOVED Requirements

### Requirement: Leerer Tag bei wirksamem Filter

**Reason**: Der Anforderung ist die Grundlage entzogen. Sie verlangte, den Filter zu nennen, der einen Wochentag geleert hat, und führte dafür Gruppenfilterung und Fachsemester-Eingrenzung als Fälle. Beide entfallen — die Gruppenfilterung mit dem REMOVED-Delta dieses Changes, die Fachsemester-Eingrenzung mit dem Change `stundenplan-einrichtung-endpunkte`. Übrig bleibt der Gültigkeitszeitraum, der stets gilt und deshalb kein wählbarer Filter mehr ist.

**Migration**: Ersetzt durch das Requirement „Kennzeichnung eines leeren Wochentags", das denselben Zweck ohne den Filterbezug erfüllt. Der Leerzustand nennt weiterhin den Gültigkeitszeitraum, wenn er der Grund ist; der bisherige Bedienweg „alle Filter abschalten" im Leerzustand entfällt mit dem zugehörigen Schalter.

### Requirement: Schalter zum Ausblenden gruppenfremder Termine

**Reason**: Der Schalter wirkt auf den persönlichen Plan, und was dort steht, hat die Nutzerin selbst hineingenommen. Wer sich bewusst für die Übung einer anderen Gruppe entschieden hat, geht dorthin; diesen Termin auszublenden verbirgt einen Termin, den sie wahrnehmen wird. Entschieden 2026-09-08.

**Migration**: Ersatzlos. Die Kennzeichnung gruppenfremder Termine bleibt bestehen — das Requirement „Kennzeichnung gruppenfremder Termine statt Entfernen" bezieht sich ohnehin auf den Auswahlbestand, nicht auf den persönlichen Plan, und die Capability `ux-and-theming` verlangt sie zusätzlich zur Farbe. Ein gerätelokal gespeicherter Wert `gruppenfremdeAusblenden` wird beim Laden verworfen; alle Termine des Plans sind danach sichtbar, es gehen keine Daten verloren.

### Requirement: Schalter zum Abschalten aller Filter

**Reason**: Von den drei Filtern, die der Schalter aufheben sollte, entfallen zwei — die Gruppenfilterung mit diesem Change, die Eingrenzung auf ein Fachsemester mit `stundenplan-einrichtung-endpunkte`. Für den verbleibenden Gültigkeitszeitraum, der stets gilt, braucht es keinen Sammelschalter. Entschieden 2026-09-08.

**Migration**: Ersatzlos. Der Gültigkeitszeitraum wird künftig immer angewandt; ein Termin außerhalb seines Zeitraums erscheint nicht mehr, der Leerzustand nennt diesen Grund weiterhin (Requirement „Leerer Tag bei wirksamem Filter"). Ein gerätelokal gespeicherter Wert `alleAnzeigen` wird beim Laden verworfen.

<!-- „Belegungsvorschau je Tag" (REMOVED) und „Wochentagsleiste mit bedarfsweisem Samstag" (MODIFIED) sind mit diesem Change nicht mehr verändert — beide sind bereits vollständig über `stundenplan-bedienung-ohne-vormerkung` archiviert (2026-09-09), dessen MODIFIED-Fassung zusätzlich die volle Bildschirmbreite trägt. Bereinigt bei der Archivierung jenes Changes, siehe dessen `proposal.md`, Abschnitt „Verhältnis zum Change stundenplan-wochenansicht-nutzerfuehrung". -->
