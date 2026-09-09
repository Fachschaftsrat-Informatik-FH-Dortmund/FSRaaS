## Purpose

Der Stundenplan ist die meistgenutzte Funktion beider Alt-Apps: Er zeigt Studierenden ihre Lehrveranstaltungen für die aktuelle Woche, gefiltert auf die tatsächlich relevante Gruppe, ergänzt um eigene Termine und einen Planungsmodus für Wahlpflichtfächer und Gruppenwechsel. Vormals `specs/features/schedule/spec.md` (Präfix `SCHED`), migriert nach ADR 0019. Owner: FSR FB4.

## Requirements

### Requirement: Fünf-Tage-Ansicht

Das System muss den Stundenplan mindestens in den fünf Wochentagen Montag bis Freitag darstellen. Herkunft: Alt: lib/main_page.dart (vormals SCHED-F-010).

#### Scenario: Regulärer Wochenplan
- **WHEN** der Stundenplan für eine laufende Woche angezeigt wird
- **THEN** zeigt das System mindestens die fünf Wochentage Montag bis Freitag

### Requirement: Auswahl der Endpunkte des Lehrangebots

Das System muss der Nutzerin die Auswahl beliebig vieler Endpunkte des Lehrangebots aus der Capability `integrations` (INT-001) ermöglichen. Alle gewählten Endpunkte wirken gleichrangig auf den Auswahlbestand; es gibt keinen ausgezeichneten Hauptendpunkt. Herkunft: NEU, entschieden 2026-09-08. Ersetzt das Requirement „Studiengang- und Fachsemesterauswahl" (vormals SCHED-F-020): Die INT-001-Liste führt nach der Live-Abfrage vom 2026-09-08 nicht nur Studiengänge, sondern auch Blockwochen, Tutorien, Seminare, Wahlpflicht- und Wiederholungsangebote, und wer neben seinem Studiengang eine Blockwoche oder ein Tutorium belegt, braucht mehrere davon zugleich.

#### Scenario: Erstmalige Einrichtung
- **WHEN** die Nutzerin den Stundenplan erstmals einrichtet
- **THEN** bietet das System die über INT-001 gelieferten Endpunkte zur Auswahl an, ohne nach einem Fachsemester zu fragen

#### Scenario: Mehrere Endpunkte gewählt
- **WHEN** die Nutzerin einen Studiengang, eine Blockwoche und die Tutorien auswählt
- **THEN** enthält der Auswahlbestand die Veranstaltungen aller drei Endpunkte

#### Scenario: Endpunkt wieder abgewählt
- **WHEN** die Nutzerin einen zuvor gewählten Endpunkt abwählt
- **THEN** entfällt dessen Beitrag zum Auswahlbestand, ohne dass bereits im persönlichen Plan liegende Termine entfernt werden

### Requirement: Gruppierung der Endpunkte in der Auswahl

Das System muss die zur Auswahl gestellten Endpunkte in benannte Gruppen gliedern und innerhalb einer Gruppe nach Prüfungsordnung und darunter alphabetisch ordnen. Die Gruppenzuordnung muss aus den von INT-001 gelieferten Merkmalen abgeleitet werden — Prüfungsordnung (`po`), Muster des Kurznamens (`sname`) und Merkmale des Klarnamens —, nicht aus einer gepflegten Zuordnungstabelle. Herkunft: NEU, entschieden 2026-09-08, Bestandsaufnahme über eine Live-Abfrage von INT-001 am selben Tag. Eine gepflegte Tabelle wurde erwogen und verworfen: Sie wäre genauer, ließe einen neu angelegten Endpunkt des Fachbereichs aber bis zur Nachpflege unzugeordnet — dieselbe Bringschuld, an der das Vorgängersystem gescheitert ist.

#### Scenario: Studiengang einer Gruppe zugeordnet
- **WHEN** ein Endpunkt als Master erkennbar ist und eine Prüfungsordnung trägt
- **THEN** führt das System ihn in der Gruppe „Master", geordnet nach seiner Prüfungsordnung

#### Scenario: Duale Studiengänge getrennt
- **WHEN** ein Endpunkt als dualer Bachelor-Studiengang erkennbar ist
- **THEN** führt das System ihn in einer eigenen Gruppe, getrennt von den Präsenz-Bachelor-Studiengängen

#### Scenario: Prüfungsordnung fehlt im Feld po
- **WHEN** ein Endpunkt kein auswertbares `po`-Feld trägt, seine Prüfungsordnung aber im Klarnamen steht
- **THEN** leitet das System die Prüfungsordnung aus dem Klarnamen ab, sodass die Gruppierung auch über die Rückfallliste des eigenen Backends trägt, die kein `po` liefert

### Requirement: Auffangkorb für nicht zuzuordnende Endpunkte

Wenn ein Endpunkt keiner der benannten Gruppen zugeordnet werden kann, dann muss das System ihn in einer eigenen Gruppe für nicht zugeordnete Angebote sichtbar zur Auswahl stellen, statt ihn auszulassen. Herkunft: NEU, entschieden 2026-09-08. Der Bestand vom 2026-09-08 enthält mit `QDL` bereits einen solchen Fall; ein stilles Auslassen würde ein reales Lehrangebot unerreichbar machen und den Fehler erst beim Nutzer sichtbar werden lassen.

#### Scenario: Unbekannter Endpunkt
- **WHEN** INT-001 einen Endpunkt liefert, den keine Ableitungsregel einer Gruppe zuordnet
- **THEN** stellt das System ihn in der Gruppe für nicht zugeordnete Angebote zur Auswahl

### Requirement: Freitextsuche in der Endpunktauswahl

Das System muss eine Freitextsuche über die Endpunktauswahl bereitstellen, die Klarnamen und Kurznamen berücksichtigt. Herkunft: NEU, entschieden 2026-09-08. Der Bestand umfasst nach der Live-Abfrage vom 2026-09-08 einundzwanzig auswählbare Endpunkte über acht Gruppen; wer seinen Studiengang kennt, soll ihn nicht durch alle Gruppen suchen müssen.

#### Scenario: Suche nach Kurzname
- **WHEN** die Nutzerin den Kurznamen eines Endpunkts eingibt
- **THEN** zeigt das System den zugehörigen Endpunkt

### Requirement: Dauerhafter Zugang zur Einrichtung

Das System muss die Einrichtung des Stundenplans über einen jederzeit sichtbaren Bedienweg erreichbar machen, unabhängig davon, ob bereits ein persönlicher Plan besteht. In der Wochenansicht muss dieser Bedienweg als Symbol in der Kopfzeile stehen und dort auch beim Blättern im Plan sichtbar bleiben. Herkunft: NEU, entschieden 2026-09-08, Platz in der Kopfzeile festgelegt 2026-09-08 aus Issue #62. Die bisherige Umsetzung erreichte die Einrichtung ausschließlich aus Leerzuständen und aus dem Semesterwechsel-Hinweis; wer nach dem Anlegen eines Plans seine Gruppenkennung korrigieren wollte, hätte zuvor den gesamten Plan leeren müssen. Der zwischenzeitlich eingefügte Textverweis stand im Inhaltsbereich und scrollte mit dem Plan fort.

#### Scenario: Einrichtung bei gefülltem Plan öffnen
- **WHEN** ein persönlicher Plan besteht und die Nutzerin die Einrichtung öffnen will
- **THEN** bietet das System einen sichtbaren Bedienweg dorthin an, ohne dass der Plan geleert werden muss

#### Scenario: Zugang beim Blättern im Plan
- **WHEN** die Nutzerin in der Wochenansicht im Plan nach unten blättert
- **THEN** bleibt das Symbol in der Kopfzeile sichtbar und erreichbar

### Requirement: Terminabruf nach Auswahl

Wenn mindestens ein Endpunkt gewählt ist, muss das System für jeden gewählten Endpunkt die zugehörigen Termine über INT-002 (Capability `integrations`) mit `grade=*` abrufen und den Wochentagen zuordnen. Das Fachsemester eines Termins muss dabei aus dem Termin selbst entnommen werden, nicht aus einer vorherigen Auswahl. Herkunft: Alt: lib/areas/schedule/repositories/schedule_repository.dart, auf Endpunkte und `grade=*` umgestellt 2026-09-08; vormals SCHED-F-030. Die Live-Abfrage vom 2026-09-08 belegt, dass `grade=*` auch für Bachelor-Endpunkte trägt: `INPBPI/2` liefert 77 Termine, `INPBPI/*` liefert 126 mit den Fachsemestern 2, 4 und 6.

#### Scenario: Termine nach Auswahl
- **WHEN** mindestens ein Endpunkt gewählt ist
- **THEN** ruft das System je Endpunkt die Termine über INT-002 mit `grade=*` ab und ordnet sie den Wochentagen zu

#### Scenario: Mehrere Endpunkte gewählt
- **WHEN** drei Endpunkte gewählt sind
- **THEN** führt das System drei Abrufe durch und vereinigt deren Termine zu einem Auswahlbestand

### Requirement: Gültigkeitszeitraum aus dem Endpunktnamen

Wenn der Name eines Endpunkts einen Datumsbereich führt, dann muss das System diesen als Gültigkeitszeitraum aller Termine dieses Endpunkts verwenden, abweichend von den in INT-002 gelieferten Feldern. Lässt sich dem Namen kein Datumsbereich entnehmen, muss das System die gelieferten Felder unverändert übernehmen. Herkunft: Recherche: FBWS live abgefragt, 2026-09-08. Die drei Blockwochen-Endpunkte tragen ihren tatsächlichen Zeitraum ausschließlich im Klarnamen — `Blockwoche 1 (13.04.-17.04.2026)`. Ihre Termine liefern demgegenüber `dateBegin`/`dateEnd` über das gesamte Semester (25.05. bis 25.07.2026, identisch mit den regulären Veranstaltungen) und `interval: "weekly"`. Ohne diese Auswertung erschiene eine Blockwoche als wöchentlicher Termin über das ganze Semester und kollidierte an jedem Wochentag mit dem regulären Plan — ein Fehlalarm, der jede Nutzerin trifft, die eine Blockwoche wählt. Die Ableitung beruht auf einem Textmuster, das der Fachbereich jederzeit ändern kann; ihr Auffangnetz ist das Requirement „Gültigkeitszeitraum je Eintrag änderbar", mit dem sich ein falsch übernommener Zeitraum von Hand berichtigen lässt.

#### Scenario: Blockwoche mit Zeitraum im Namen
- **WHEN** ein gewählter Endpunkt den Namen `Blockwoche 1 (13.04.-17.04.2026)` trägt
- **THEN** gelten seine Termine ausschließlich innerhalb dieses Zeitraums, nicht über das von INT-002 gelieferte Semester

#### Scenario: Endpunktname ohne Datumsbereich
- **WHEN** der Name eines Endpunkts keinen Datumsbereich enthält
- **THEN** übernimmt das System die von INT-002 gelieferten Gültigkeitsangaben unverändert

#### Scenario: Datumsbereich nicht auswertbar
- **WHEN** ein Endpunktname eine Zeichenfolge in Klammern führt, die sich nicht als Datumsbereich lesen lässt
- **THEN** übernimmt das System die gelieferten Gültigkeitsangaben unverändert und protokolliert den Vorfall, statt einen Zeitraum zu erraten

### Requirement: Gruppenkennungs-Eingabeformat

Das System muss der Nutzerin die Angabe einer Gruppenkennung nach dem Muster `^[A-Z][0-9]+$` ermöglichen; Buchstabe und Zahl sind beide verpflichtend. Herkunft: Alt: lib/areas/schedule/models/selected_course_info.dart, Zahl wieder verpflichtend entschieden 2026-09-06; vormals SCHED-F-040. Die zwischenzeitliche Erweiterung auf eine freiwillige Zahl (2026-09-04) ist zurückgenommen: Fünf der 21 im FBWS-Bestand vorkommenden `studentSet`-Werte tragen eine Zahl an einer Bereichsgrenze, an der sie mitentscheidet.

#### Scenario: Gültige Eingabe mit Zahl
- **WHEN** die Nutzerin Buchstabe und Zahl eingibt (z. B. `C8`)
- **THEN** akzeptiert das System die Eingabe als gültige Gruppenkennung

#### Scenario: Eingabe ohne Zahl
- **WHEN** die Nutzerin nur einen Buchstaben eingibt (z. B. `D`)
- **THEN** weist das System die Eingabe als unvollständig zurück und benennt die fehlende Zahl

### Requirement: Alle Termine ohne Gruppenkennung

Solange keine Gruppenkennung angegeben ist, muss das System alle abgerufenen Termine unabhängig von ihrem `studentSet` anzeigen. Herkunft: Alt: lib/areas/schedule/viewmodels/schedule_overview_viewmodel.dart:210 (vormals SCHED-F-050).

#### Scenario: Keine Gruppenkennung gesetzt
- **WHEN** keine Gruppenkennung angegeben ist und ein Termin mit `studentSet` `C8` vorliegt
- **THEN** zeigt das System diesen Termin als zugehörig an

### Requirement: Wildcard im studentSet

Wenn `studentSet` eines Termins den Wert `*` trägt, dann muss das System diesen Termin für jede angegebene Gruppenkennung anzeigen. Herkunft: NEU, bestätigt 2026-09-06; vormals SCHED-F-060. Die Android-Alt-App (`util/GroupLetterUtil.java`) behandelt `*` nicht gesondert und markiert einen für alle Gruppen gültigen Termin fälschlich als gruppenfremd; dieses Verhalten ist bewusst nicht übernommen, siehe Abschnitt „Bewusst nicht übernommenes Altverhalten".

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

Wenn `studentSet` eines Termins ein Bereich der Form `A1-C9` ist, dann muss das System einen Termin genau dann anzeigen, wenn das Paar (Buchstabe, Zahl) der Gruppenkennung — die Zahl dabei numerisch, nicht als Zeichenkette, verglichen — innerhalb des durch Anfangs- und Endpaar aufgespannten Bereichs liegt, einschließlich beider Grenzen. Trägt die Gruppenkennung keine Zahl und ist damit unvollständig, muss das System den Termin als zugehörig behandeln und den Vorfall protokollieren, statt eine Zahl anzunehmen. Herkunft: Alt: lib/areas/schedule/viewmodels/schedule_overview_viewmodel.dart:218-249, Behandlung der unvollständigen Kennung ergänzt 2026-09-06; vormals SCHED-F-080. Der numerische statt zeichenweise Vergleich ist ausdrücklich festgehalten, weil ein reiner Zeichenkettenvergleich bei mehrstelligen Zahlen falsche Ergebnisse liefert (`"10"` wäre als Zeichenkette kleiner als `"9"`). Die Capability `quality-and-testing` verlangt automatisierte Tests genau für diesen Fall.

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

#### Scenario: Unvollständige Gruppenkennung an einer Grenze mit Zahl
- **WHEN** eine unvollständige Gruppenkennung `H` ohne Zahl vorliegt und ein Termin `studentSet` `H5-J` trägt
- **THEN** zeigt das System diesen Termin als zugehörig an und protokolliert den Vorfall, statt die fehlende Zahl als `0` zu behandeln

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

### Requirement: Leerer Tag bei wirksamem Filter

Falls an einem Wochentag durch einen wirksamen Filter kein Termin verbleibt, muss das System diesen Tag als leer kennzeichnen und den Filter nennen, der dazu geführt hat. Herkunft: NEU, entschieden 2026-09-06; vormals SCHED-F-100. Die vorige Fassung nannte allein die Gruppenfilterung; inzwischen wirken mehrere Filter auf die Wochenansicht.

#### Scenario: Alle Termine eines Tages ausgeblendet
- **WHEN** an einem Wochentag nach Ausblenden gruppenfremder Termine kein Termin verbleibt
- **THEN** kennzeichnet das System den Tag als leer und nennt die Gruppenfilterung als Grund

#### Scenario: Eingrenzung auf ein Fachsemester leert den Tag
- **WHEN** an einem Wochentag nach Eingrenzung auf ein Fachsemester kein Termin verbleibt
- **THEN** kennzeichnet das System den Tag als leer und nennt diese Eingrenzung als Grund

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

Wenn sich die über INT-001 gelieferte Endpunktliste gegenüber dem zuletzt gesehenen Stand ändert, muss das System die Nutzerin darauf hinweisen und ihr die Anpassung von Endpunktauswahl und Gruppenkennung anbieten. Der Hinweis darf keine Auswahl und keinen Planeintrag von sich aus verändern. Herkunft: Recherche: WhatsApp-Chat praktische-informatik-ws-23-24, 2026-08-25, auf Endpunkte umgestellt 2026-09-08; vormals SCHED-F-180. Der bisherige Anker — die Fachsemesterliste des gewählten Studiengangs — entfällt mit der Endpunktauswahl. Die Endpunktliste ist der bessere Anker: Zum Semesterbeginn wechseln die Blockwochen-Endpunkte sichtbar, und der bislang gar nicht abgedeckte Fall „ein gewählter Endpunkt existiert nicht mehr" wird mit erfasst.

#### Scenario: Semesterbeginn erkannt
- **WHEN** INT-001 Endpunkte liefert, die im zuletzt gesehenen Stand fehlten — etwa die Blockwochen des neuen Semesters
- **THEN** weist das System auf die Änderung hin und bietet die Anpassung von Endpunktauswahl und Gruppenkennung an

#### Scenario: Gewählter Endpunkt entfallen
- **WHEN** ein von der Nutzerin gewählter Endpunkt in der aktuellen INT-001-Liste fehlt
- **THEN** weist das System darauf hin, ohne die Auswahl oder bestehende Planeinträge selbsttätig zu ändern

### Requirement: Eigenen Termin als Prüfung kennzeichnen

Das System muss der Nutzerin das Kennzeichnen eines eigenen Termins als Prüfung ermöglichen. Herkunft: NEU (vormals SCHED-F-190).

#### Scenario: Eigene Prüfung eintragen
- **WHEN** die Nutzerin einen eigenen Termin als Prüfung markiert
- **THEN** führt das System diesen Termin als Prüfung

### Requirement: Auswahl aus dem offiziellen Prüfungsplan

Das System muss der Nutzerin die Auswahl relevanter Prüfungen aus dem vom Backend bereitgestellten Prüfungsbestand ermöglichen, einschließlich Prüfungen, die die Nutzerin nachholen möchte. Der Bestand wird aus dem Raumplan abgeleitet (INT-009 über INT-008, siehe Capability `backend-and-api`); ein manueller Import entfällt. Herkunft: NEU, entschieden 2026-09-06; vormals SCHED-F-200. Prüfungen zu Veranstaltungen des eigenen Plans sind über die Modulnummer zugeordnet; Nachholprüfungen aus Veranstaltungen außerhalb des Plans sind nur über Bezeichnung oder Modulnummer auffindbar, weil der Raumplan — anders als die entfallene Intranet-Excel — keine Zuordnung zu Studiengang, Vertiefung, Prüfungsordnung und Fachsemester führt.

#### Scenario: Prüfung auswählen
- **WHEN** die Nutzerin aus dem bereitgestellten Prüfungsbestand eine für sie relevante Prüfung wählt
- **THEN** übernimmt das System diese Prüfung in den persönlichen Stundenplan

#### Scenario: Prüfung zur eigenen Veranstaltung
- **WHEN** die Nutzerin zu einer Veranstaltung ihres Plans die zugehörige Prüfung aufruft
- **THEN** zeigt das System sie anhand der Modulnummer zugeordnet an

#### Scenario: Nachholprüfung suchen
- **WHEN** die Nutzerin eine Prüfung zu einer Veranstaltung sucht, die nicht in ihrem Plan steht
- **THEN** findet das System sie über Bezeichnung oder Modulnummer und übernimmt sie auf Auswahl in den persönlichen Stundenplan

### Requirement: Visuelle Kennzeichnung von Prüfungsterminen

Wenn ein Termin eine Prüfung ist — eigen als Prüfung gekennzeichnet oder aus dem Prüfungsplan ausgewählt —, muss das System ihn visuell gesondert von regulären Terminen kennzeichnen. Herkunft: NEU (vormals SCHED-F-210).

#### Scenario: Prüfungstermin im Plan
- **WHEN** ein Termin als Prüfung gilt
- **THEN** stellt das System ihn visuell gesondert von regulären Terminen dar

### Requirement: Benachrichtigung bei Prüfungsplan-Aktualisierung

Wenn das Backend eine Aktualisierung des Prüfungsbestands meldet und mindestens einer der lokal ausgewählten Prüfungstermine der Nutzerin davon betroffen ist, muss das System die Nutzerin darüber informieren. Herkunft: NEU, entschieden 2026-09-06; vormals SCHED-F-220. Verträgt sich mit der Anforderung „Kein serverseitiges Speichern des persönlichen Stundenplans" der Capability `backend-and-api` (API-F-100): Das Backend meldet nur, dass sich der Bestand geändert hat; der Abgleich erfolgt lokal gegen die ausschließlich gerätegespeicherte Auswahl, indem die App den geänderten Bestand abruft und gegen ihre Auswahl hält.

#### Scenario: Ausgewählte Prüfung betroffen
- **WHEN** eine Aktualisierung des Prüfungsbestands einen lokal ausgewählten Prüfungstermin betrifft
- **THEN** informiert das System die Nutzerin darüber

#### Scenario: Keine ausgewählte Prüfung betroffen
- **WHEN** sich der Prüfungsbestand ändert, ohne einen lokal ausgewählten Termin zu betreffen
- **THEN** informiert das System die Nutzerin nicht

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

### Requirement: Gleichrangiger Datei-Export und Verhalten bei verweigerter Berechtigung

Das System muss das Übertragen in einen Gerätekalender und den Datei-Export (.ics) gleichrangig zur Auswahl stellen. Falls die Berechtigung für den Gerätekalender nicht erteilt wird, darf das System den Vorgang nicht abbrechen, sondern muss im selben Vorgang beide Auswege anbieten: den Weg in die Systemeinstellungen der App zum nachträglichen Erteilen der Berechtigung und den Datei-Export. Herkunft: NEU, entschieden 2026-09-06; vormals SCHED-F-177. iOS und Android zeigen den Berechtigungsdialog nach einer Ablehnung kein zweites Mal; ein von der App ausgelöster erneuter Versuch ist deshalb nicht möglich.

#### Scenario: Beide Wege stehen zur Wahl
- **WHEN** die Nutzerin den Export öffnet
- **THEN** bietet das System die Übertragung in einen Gerätekalender und den Datei-Export gleichrangig an

#### Scenario: Kalenderberechtigung verweigert
- **WHEN** die Kalenderberechtigung verweigert wird
- **THEN** bleibt der Vorgang offen und das System bietet sowohl den Weg in die Systemeinstellungen als auch den Datei-Export an

### Requirement: Auswahl der Terminarten beim Export

Das System muss der Nutzerin vor jedem Export die separate Auswahl ermöglichen, ob offizielle Termine, eigene Termine und Prüfungstermine jeweils enthalten sind. Herkunft: NEU (vormals SCHED-F-240).

#### Scenario: Export mit ausgewählten Terminarten
- **WHEN** die Nutzerin vor dem Export nur Prüfungstermine auswählt
- **THEN** enthält der Export ausschließlich Prüfungstermine

### Requirement: Auswahl beim Anlegen des offiziellen Stundenplans

Das System muss beim Anlegen des offiziellen Stundenplans die Auswahl ermöglichen, welche der abgerufenen Veranstaltungen, Veranstaltungsarten und Gruppen-Slots übernommen werden. Die Wahl der Veranstaltungen erfolgt in der Modulauswahl, die von Veranstaltungsart und Gruppen-Slot im Planungsmodus. Herkunft: Alt: lib/areas/schedule/viewmodels/schedule_overview_viewmodel.dart:58-90, auf zwei Bedienschritte aufgeteilt 2026-09-08; vormals SCHED-F-245. Die Aufteilung trennt die Frage, welche Module belegt werden, von der Frage, zu welcher Gruppe man wann geht — die zweite braucht die Konfliktprüfung des Planungsmodus, die erste nicht.

#### Scenario: Auswahl beim Anlegen
- **WHEN** die Nutzerin den offiziellen Stundenplan anlegt
- **THEN** kann sie einzelne Veranstaltungen in der Modulauswahl und einzelne Veranstaltungsarten sowie Gruppen-Slots im Planungsmodus gezielt übernehmen oder weglassen

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

### Requirement: Zusammenfassen deckungsgleicher Rohtermine

Wenn der Terminbestand des Lehrangebots zwei oder mehr Termine liefert, die in Veranstaltung, Veranstaltungsart, Wochentag, Beginnzeit, Endzeit, Raum und Gruppenmenge übereinstimmen, dann muss das System sie vor der Darstellung zu einem einzigen Termin zusammenfassen und den Vorfall protokollieren. Es darf keinen davon verwerfen, ohne dies zu protokollieren. Herkunft: Recherche: Live-Abfrage von INT-002, 2026-09-08, Befund aus Issue #62. Der Bestand enthält deckungsgleiche Termine — belegt für `44232|Ü|Tue|720|765|C.E.32|A-P` —, womit die bislang angenommene Eindeutigkeit dieses Merkmalssatzes widerlegt ist. Zwei Termine, die sich allein im Raum unterscheiden, bleiben getrennt: Sie sind nach der Erläuterung zu `courseId 411031` verschiedene Angebote unter einer Modulnummer, kein Datenfehler.

#### Scenario: Deckungsgleiche Termine im Bestand
- **WHEN** der Bestand zwei in allen genannten Merkmalen übereinstimmende Termine enthält
- **THEN** stellt das System genau einen davon dar und protokolliert das Zusammenfassen

#### Scenario: Termine mit abweichendem Raum
- **WHEN** zwei Termine in allen Merkmalen außer dem Raum übereinstimmen
- **THEN** stellt das System beide getrennt dar

### Requirement: Kandidat für die Planung auswählen

Das System muss der Nutzerin ermöglichen, eine Veranstaltung des Auswahlbestands als Kandidat für die Planung auszuwählen. Herkunft: NEU (vormals SCHED-F-280).

#### Scenario: Veranstaltung als Kandidat wählen
- **WHEN** die Nutzerin eine Veranstaltung des Auswahlbestands als Kandidat markiert
- **THEN** führt das System sie im Planungsmodus als Kandidat

### Requirement: Planungsmodus mit Wochentagsgliederung

Das System muss die Wahl von Veranstaltungsart und Gruppen-Slot in einem eigenen Bildschirm führen, der die Termine der gewählten Module nach Wochentagen gliedert und innerhalb eines Wochentags aufsteigend nach Beginnzeit ordnet. Der Bildschirm muss nach dem erstmaligen Zusammenstellen jederzeit erneut erreichbar sein. Herkunft: NEU, entschieden 2026-09-08, Form übernommen aus alte apps/android-fb4/FB4/fB4/src/main/java/de/fsrfb4/fb4/activities/timetable/AddEventsActivity.java. Die Android-Alt-App gliedert ihren Auswahlbildschirm über einen `TabLayout` je Wochentag mit einer chronologischen Kartenliste je Tag; diese Form hat sich bewährt. Übernommen wird sie mit zwei Unterschieden: Sie zeigt nur die Termine zuvor gewählter Module statt des gesamten Bestands, und sie trägt die Kennzeichnungen des Planungsstands, die der Alt-App fehlen.

#### Scenario: Planungsmodus öffnen
- **WHEN** die Nutzerin nach der Modulauswahl in den Planungsmodus wechselt
- **THEN** zeigt das System die Termine der gewählten Module nach Wochentagen gegliedert, je Wochentag aufsteigend nach Beginnzeit

#### Scenario: Erneuter Aufruf
- **WHEN** ein persönlicher Plan bereits besteht und die Nutzerin eine einzelne Entscheidung ändern will
- **THEN** ist der Planungsmodus erneut erreichbar, ohne dass der Plan geleert oder die Modulauswahl wiederholt werden muss

### Requirement: Lehrende Person in der Terminzeile des Planungsmodus

Das System muss im Planungsmodus je Termin die lehrende Person anzeigen, gleichrangig zu Veranstaltungsart und Raum. Ist sie im Bestand nicht angegeben, lässt das System die Angabe aus, ohne einen Platzhalter zu setzen. Herkunft: Recherche: Issue #62 (Gerätedurchsicht Pixel 9 Pro), 2026-09-08. INT-002 liefert `lecturerName` an jedem Termin, und das Requirement „Anzeige der Termindetails" verlangt die Angabe für die Detailansicht bereits; im Planungsmodus ist sie das Merkmal, an dem sich zwei sonst gleich aussehende Gruppen-Slots unterscheiden lassen.

#### Scenario: Termin mit lehrender Person
- **WHEN** ein Termin im Planungsmodus angezeigt wird und eine lehrende Person führt
- **THEN** zeigt das System sie in der Terminzeile an

#### Scenario: Termin ohne lehrende Person
- **WHEN** ein Termin keine lehrende Person führt
- **THEN** lässt das System die Angabe aus, ohne einen Platzhalter zu setzen

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

### Requirement: Rückfrage beim Verlassen mit ungesicherten Änderungen

Wenn die Nutzerin den Planungsmodus mit ungesicherten Änderungen verlässt, dann muss das System vor dem Verwerfen nachfragen und dabei das Sichern, das Verwerfen und das Zurückkehren zur Bearbeitung anbieten. Ein stillschweigendes Verwerfen ist ausgeschlossen. Herkunft: NEU, entschieden 2026-09-08. Folgt zwingend aus dem Requirement „Ausdrückliches Sichern der Planung": Sobald Entscheidungen erst auf Auslösung wirksam werden, gibt es einen Zwischenstand, der verlorengehen kann — und die Capability `data-and-storage` schließt Datenverlust ohne Rückfrage aus. Die Android-Alt-App führt an derselben Stelle denselben Dialog (`verlassenSpeichern`) mit denselben drei Möglichkeiten.

#### Scenario: Verlassen mit ungesicherten Änderungen
- **WHEN** die Nutzerin den Planungsmodus verlässt und ungesicherte Änderungen vorliegen
- **THEN** fragt das System nach und bietet Sichern, Verwerfen und Zurückkehren zur Bearbeitung an

#### Scenario: Verlassen ohne Änderungen
- **WHEN** die Nutzerin den Planungsmodus verlässt, ohne etwas geändert zu haben
- **THEN** verlässt das System ihn ohne Rückfrage

#### Scenario: Zurückkehren zur Bearbeitung
- **WHEN** die Nutzerin in der Rückfrage die Rückkehr zur Bearbeitung wählt
- **THEN** bleibt sie im Planungsmodus, und sämtliche ungesicherten Änderungen bleiben erhalten

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

### Requirement: Vorbelegung eindeutiger Veranstaltungen

Wenn eine Veranstaltungsart eines gewählten Moduls genau einen Gruppen-Slot anbietet, dann muss das System diesen beim Öffnen des Planungsmodus als gewählt vorbelegen. Bietet eine Veranstaltungsart mehrere Slots an, darf das System keinen davon vorbelegen, auch wenn die Gruppenkennung genau einen einschließt. Herkunft: NEU, entschieden 2026-09-08, Bestandsaufnahme über eine Live-Abfrage von INT-002 am selben Tag. Von dreizehn Kombinationen aus Modul und Veranstaltungsart bei sechs Modulen des 2. Fachsemesters von `INPBPI` bieten sieben genau einen Slot an — dort gibt es nichts zu entscheiden, und ein Häkchen, das die Nutzerin selbst setzen müsste, wäre nur eine Gelegenheit, es zu vergessen. Wo mehrere Slots bestehen, bleibt die Wahl bei ihr, auch wenn die Gruppenkennung sie nahelegt.

#### Scenario: Veranstaltungsart mit einem einzigen Slot
- **WHEN** eine Veranstaltungsart eines gewählten Moduls genau einen Termin anbietet
- **THEN** ist dieser Termin beim Öffnen des Planungsmodus bereits gewählt

#### Scenario: Veranstaltungsart mit mehreren Slots
- **WHEN** eine Veranstaltungsart mehrere Termine anbietet und die Gruppenkennung genau einen davon einschließt
- **THEN** bleibt kein Termin dieser Veranstaltungsart vorbelegt, der zur Gruppenkennung passende ist aber hervorgehoben

### Requirement: Hervorhebung der eigenen Gruppe im Planungsmodus

Das System muss im Planungsmodus die Termine, deren `studentSet` die eigene Gruppenkennung einschließt, gegenüber den übrigen farblich hervorheben und diese Bedeutung zusätzlich zur Farbe über Text oder Symbol tragen. Es darf dabei keinen Termin ausblenden. Das bestehende Requirement „Kennzeichnung fremder Gruppenzugehörigkeit zusätzlich zur Farbe" der Capability `ux-and-theming` gilt unverändert weiter und betrifft die Gegenrichtung: Auch die nicht zugehörigen Termine tragen ihre Bedeutung über Text oder Symbol. Herkunft: Alt: alte apps/android-fb4/FB4/fB4/src/main/java/de/fsrfb4/fb4/activities/timetable/AddEventsActivity.java:688-692, farbliche Ausführung bestätigt 2026-09-08 aus Issue #62. Die Alt-App färbt passende Karten orange ein und blendet trotz des Klassennamens `LetterFilter` nichts aus; der Buchstabe musste dort über einen Menüdialog eingegeben werden, während er hier aus der Einrichtung stammt. Die bisherige Umsetzung trug die Zugehörigkeit allein als Text in der Kennzeichnungszeile.

#### Scenario: Termin der eigenen Gruppe
- **WHEN** ein Termin die eigene Gruppenkennung einschließt
- **THEN** hebt das System ihn farblich hervor und macht diese Bedeutung zusätzlich zur Farbe über Text oder Symbol erkennbar

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

### Requirement: Kennzeichnung gewählter Termine im Planungsmodus

Das System muss im Planungsmodus einen gewählten Termin durch eine farbige Umrandung der gesamten Zeile hervorheben und diese Bedeutung zusätzlich zur Farbe über ein Symbol tragen. Herkunft: Recherche: Issue #62 (Gerätedurchsicht Pixel 9 Pro), 2026-09-08. Der Zustand „gewählt" steht in der bisherigen Umsetzung allein im 24 dp breiten Kästchensymbol am linken Zeilenrand; beim Überfliegen einer Tagesliste von zehn Zeilen ist er nicht zu erfassen.

#### Scenario: Gewählter Termin
- **WHEN** ein Termin im Planungsmodus gewählt ist
- **THEN** trägt seine Zeile eine farbige Umrandung und zusätzlich ein Symbol, das die Wahl anzeigt

#### Scenario: Nicht gewählter Termin
- **WHEN** ein Termin im Planungsmodus nicht gewählt ist
- **THEN** trägt seine Zeile keine hervorgehobene Umrandung

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

Bei der Prüfung eines Kandidaten-Termins muss das System zusätzlich zur Kollisionsprüfung kennzeichnen, ob der Termin außerhalb des festgelegten Zeitfensters liegt, ohne ihn deswegen aus der Auswahl zu entfernen. Ob die Abweichung zusätzlich auf die Reihenfolge wirkt, hängt davon ab, an welcher Stelle das Kriterium „Zeitfenster" in der Kriterienrangfolge steht; ist es abgeschaltet, bleibt es eine reine Kennzeichnung. Herkunft: NEU, entschieden 2026-09-06; vormals SCHED-F-340. Die vorige Fassung ließ offen, ob das Zeitfenster die Reihung beeinflusst — die Erläuterung behauptete es, das Reihungs-Requirement kannte es nicht.

#### Scenario: Termin außerhalb des Zeitfensters
- **WHEN** ein konfliktfreier Kandidaten-Termin außerhalb des festgelegten Zeitfensters liegt
- **THEN** kennzeichnet das System ihn entsprechend, entfernt ihn aber nicht aus der Auswahl

#### Scenario: Zeitfenster als oberstes Kriterium
- **WHEN** das Kriterium „Zeitfenster" an oberster Stelle der Rangfolge steht
- **THEN** ordnet das System Termine innerhalb des Zeitfensters vor solchen außerhalb ein

### Requirement: Kriterienrangfolge für die Planung

Das System muss der Nutzerin ermöglichen, die Kriterien der Planungsreihung nach Wichtigkeit zu ordnen und einzelne Kriterien abzuschalten. Zur Verfügung stehen mindestens: *Uni-Tage*, *Anwesenheitszeit*, *gleichmäßige Woche*, *Abstand zwischen Lerneinheiten*, *Vorbereitungszeit*, *Abstand Vorlesung–Übung*, *Abwechslung* und *Zeitfenster*. Zusätzlich muss das System mindestens fünf benannte Voreinstellungen anbieten, die die Rangfolge füllen; eine Voreinstellung schaltet genau die Kriterien ein, die sie ausmachen, und lässt die übrigen abgeschaltet. Herkunft: NEU, entschieden 2026-09-06. Ersetzt die entfallene Anforderung „Auswahl des Optimierungsmodus" (vormals SCHED-F-350). Kriterienliste und Voreinstellungen sind ein Mindestumfang, keine abschließende Liste.

Die Voreinstellungen: *Zeit an der Uni* (Anwesenheitszeit) · *Fahrten zur Uni* (Uni-Tage, dann Anwesenheitszeit) · *Ausgeglichene Woche* (gleichmäßige Woche) · *Abstand zwischen Lerneinheiten* · *Vorbereitungszeit* (Vorbereitungszeit, dann Abstand Vorlesung–Übung). *Abwechslung* und *Zeitfenster* sind Kriterien ohne eigene Voreinstellung.

#### Scenario: Voreinstellung wählen
- **WHEN** die Nutzerin die Voreinstellung „Fahrten zur Uni" wählt
- **THEN** enthält die Rangfolge „Uni-Tage" vor „Anwesenheitszeit", und alle übrigen Kriterien sind abgeschaltet

#### Scenario: Rangfolge selbst ändern
- **WHEN** die Nutzerin ein Kriterium in der Rangfolge nach oben zieht oder abschaltet
- **THEN** übernimmt das System die geänderte Rangfolge für die Reihung

### Requirement: Reihung nach der Kriterienrangfolge

Wenn mehrere konfliktfreie Termine für einen Kandidaten zur Auswahl stehen, muss das System sie nach der eingestellten Kriterienrangfolge ordnen: Das oberste eingeschaltete Kriterium entscheidet; nur bei Gleichstand zählt das nächste, ohne Toleranzbereich. Herkunft: NEU, entschieden 2026-09-06. Ersetzt die entfallene Anforderung „Reihung nach Optimierungsmodus" (vormals SCHED-F-360).

Die Kriterien messen: *Uni-Tage* — Zahl der Wochentage mit mindestens einem Termin, weniger ist besser. *Anwesenheitszeit* — Summe der Tagesspannen (früheste Beginnzeit bis späteste Endzeit je Wochentag) über die Woche, weniger ist besser. *Gleichmäßige Woche* — Unterschied zwischen den Tagesspannen der Uni-Tage, kleiner ist besser. *Abstand zwischen Lerneinheiten* — Nachbarabstand, also die kleinere der beiden Pausen zum unmittelbar vorangehenden bzw. nachfolgenden Termin desselben Wochentags; ohne anderen Termin gilt er als maximal, größer ist besser. *Vorbereitungszeit* — freie Zeit unmittelbar vor dem Termin, gemessen am Zielwert seiner Veranstaltungsart; der erste Termin eines Tages gilt als erfüllt. *Abstand Vorlesung–Übung* — Zeit zwischen der Vorlesung einer Veranstaltung und deren Termin anderer Art; angestrebt ist mindestens der eingestellte Abstand nach der Vorlesung, ein Termin vor der Vorlesung gilt als schlecht erfüllt. *Abwechslung* — Zahl der Fälle, in denen an einem Wochentag Termine derselben Veranstaltungsart unmittelbar aufeinanderfolgen, weniger ist besser. *Zeitfenster* — ob der Termin im festgelegten Zeitfenster liegt, innerhalb ist besser. Bei Gleichstand aller eingeschalteten Kriterien ist die Reihenfolge nicht weiter festgelegt; deterministisches, aber beliebiges Tie-Breaking genügt.

#### Scenario: Reihung nach „Uni-Tage" vor „Anwesenheitszeit"
- **WHEN** mehrere konfliktfreie Termine zur Wahl stehen und die Rangfolge „Uni-Tage" vor „Anwesenheitszeit" führt
- **THEN** ordnet das System den Termin mit den wenigsten Uni-Tagen an erste Stelle, auch wenn ein anderer eine kürzere Anwesenheitszeit ergäbe

#### Scenario: Gleichstand im obersten Kriterium
- **WHEN** zwei Termine dieselbe Zahl von Uni-Tagen ergeben und „Anwesenheitszeit" das nächste eingeschaltete Kriterium ist
- **THEN** ordnet das System den Termin mit der kürzeren Anwesenheitszeit an erste Stelle

#### Scenario: Übung vor der zugehörigen Vorlesung
- **WHEN** das Kriterium „Abstand Vorlesung–Übung" eingeschaltet ist und ein Übungstermin vor der zugehörigen Vorlesung liegt
- **THEN** bewertet das System ihn schlechter als jeden Termin, der nach der Vorlesung liegt

### Requirement: Mehrere Kandidaten in der Planungsauswahl

Das System muss der Nutzerin ermöglichen, mehrere ausgewählte Kandidaten gleichzeitig in einer Planungsauswahl zu führen. Herkunft: NEU (vormals SCHED-F-370).

#### Scenario: Mehrere Kandidaten gleichzeitig führen
- **WHEN** die Nutzerin mehrere Kandidaten auswählt
- **THEN** führt das System sie gemeinsam in einer Planungsauswahl

### Requirement: Kandidat als Pflicht markieren

Das System muss der Nutzerin ermöglichen, einen Kandidaten der Planungsauswahl als „Pflicht" zu markieren. Eine als Pflicht markierte Veranstaltung muss im Plan enthalten bleiben; welcher ihrer Termine gewählt wird, bleibt der Planung überlassen. Herkunft: NEU, entschieden 2026-09-06; vormals SCHED-F-380. Die Markierung betrifft ausschließlich das *Ob* — für das *Wann* gibt es das Anpinnen.

#### Scenario: Kandidat als Pflicht markieren
- **WHEN** die Nutzerin sich für einen Kandidaten entscheidet
- **THEN** markiert das System ihn in der Planungsauswahl als „Pflicht"

#### Scenario: Pflicht-Veranstaltung bleibt enthalten
- **WHEN** die Nutzerin einen Kandidaten als „Pflicht" markiert und eine Optimierung auslöst
- **THEN** enthält der Vorschlag diese Veranstaltung, gegebenenfalls mit einem anderen Termin als zuvor

### Requirement: Anpinnen eines Termins

Das System muss der Nutzerin ermöglichen, einen einzelnen Termin des persönlichen Plans anzupinnen. Ein angepinnter Termin darf von einer Optimierung weder umgelegt noch entfernt werden. Herkunft: NEU, entschieden 2026-09-06. Trennt das *Wann* vom *Ob*: „Pflicht" hält fest, dass eine Veranstaltung im Plan bleiben muss; das Anpinnen hält fest, dass es genau dieser Zeitslot sein soll — etwa, weil die eigene Lerngruppe dorthin geht.

#### Scenario: Angepinnter Termin bei erneuter Optimierung
- **WHEN** die Nutzerin einen Termin anpinnt und danach eine Optimierung auslöst
- **THEN** bleibt dieser Termin unverändert an seinem Zeitslot

#### Scenario: Anpinnen zurücknehmen
- **WHEN** die Nutzerin das Anpinnen eines Termins zurücknimmt
- **THEN** darf eine folgende Optimierung diesen Termin wieder umlegen

### Requirement: Konfliktprüfung gegenüber angepinnten Terminen

Bei der Konfliktprüfung eines Kandidaten der Planungsauswahl muss das System dessen Termine gegen den Zwischenstand der laufenden Planung sowie gegen die angepinnten Termine prüfen, nicht gegen andere Kandidaten, zu denen noch keine Entscheidung getroffen wurde. Herkunft: NEU, entschieden 2026-09-06, Bezugsgröße auf den Zwischenstand umgestellt 2026-09-08. Ersetzt die entfallene Anforderung „Konfliktprüfung gegenüber Pflicht-Kandidaten" (vormals SCHED-F-390); eine Vollkombinatorik über mehrere gleichzeitig unentschiedene Kandidaten bleibt zurückgestellt (Rücksprache 2026-08-25). Geprüft wird gegen angepinnte statt gegen als Pflicht markierte Termine, weil eine Pflicht-Markierung seit dem 2026-09-06 nur noch die Veranstaltung festhält, nicht deren Uhrzeit. Die Umstellung auf den Zwischenstand ändert nicht, was ausgeschlossen bleibt: Ein Kandidat ohne getroffene Entscheidung zählt weiterhin nicht als Bezugsgröße — wohl aber eine Entscheidung, die in derselben Sitzung getroffen und noch nicht gesichert wurde.

#### Scenario: Prüfung gegen angepinnte Termine
- **WHEN** zwei Kandidaten gleichzeitig unentschieden in der Planungsauswahl stehen
- **THEN** prüft das System jeden nur gegen den Zwischenstand und die angepinnten Termine, nicht gegeneinander

#### Scenario: Ungesicherte Entscheidung zählt
- **WHEN** zu einem Kandidaten in der laufenden Sitzung ein Termin gewählt, aber noch nicht gesichert wurde
- **THEN** prüft das System nachfolgende Kandidaten auch gegen diesen Termin

### Requirement: Ausgangszustand ohne Optimierung

Das System muss den Plan ohne jede Optimierung nach der Gruppenkennung der Nutzerin zusammenstellen, solange sie keine Optimierung auslöst. Die Optimierung ist ein Hilfsmittel, das die Nutzerin beim Zusammenstellen aufruft, kein dauerhaft wirkender Zustand. Herkunft: NEU, entschieden 2026-09-06.

#### Scenario: Plan ohne ausgelöste Optimierung
- **WHEN** die Nutzerin ihren Plan zusammenstellt, ohne eine Optimierung auszulösen
- **THEN** ordnet das System die Termine allein nach ihrer Gruppenkennung zu und ändert daran nichts von selbst

### Requirement: Rücknahme einer übernommenen Optimierung

Das System muss der Nutzerin über einen sichtbaren Bedienweg ermöglichen, eine übernommene Optimierung zurückzunehmen und damit die Einteilung nach Gruppenkennung wiederherzustellen. Angepinnte Termine und selbst angelegte Termine bleiben davon unberührt. Herkunft: NEU, entschieden 2026-09-06. Ohne Rückweg wird der Knopf aus Sorge vor Unumkehrbarkeit gar nicht erst gedrückt.

#### Scenario: Optimierung zurücknehmen
- **WHEN** die Nutzerin eine übernommene Optimierung zurücknimmt
- **THEN** stellt das System die Termine ihrer eigenen Gruppe wieder her und lässt angepinnte sowie selbst angelegte Termine unverändert

### Requirement: Vorbereitungszeit je Veranstaltungsart

Das System muss der Nutzerin einen allgemeinen Zielwert für die Vorbereitungszeit vor einem Termin sowie davon abweichende Werte für einzelne Veranstaltungsarten festlegen lassen. Der allgemeine Wert gilt für jede Veranstaltungsart, für die kein abweichender Wert gesetzt ist, einschließlich künftiger, heute unbekannter Arten. Die Werte gelten allgemein und nicht je einzelner Veranstaltung. Herkunft: NEU, entschieden 2026-09-06. FBWS führt derzeit sechs Veranstaltungsarten; sie alle einzeln zu erfragen wäre eine lange Einrichtung, und eine siebte Art bliebe ohne Wert.

#### Scenario: Abweichender Wert für eine Veranstaltungsart
- **WHEN** die Nutzerin für die Veranstaltungsart „Praktikum" einen abweichenden Zielwert festlegt
- **THEN** verwendet das System diesen Wert für Praktika und den allgemeinen Wert für alle übrigen Arten

#### Scenario: Unbekannte Veranstaltungsart
- **WHEN** ein Termin eine Veranstaltungsart trägt, für die kein abweichender Wert gesetzt ist
- **THEN** verwendet das System den allgemeinen Zielwert

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

Das System muss einen Hinweis auf Raumabweichung oder fehlende Zuordnung als unbestätigte Ableitung kennzeichnen, die Quelle benennen, aus der er abgeleitet ist (die Raumreservierung des Fachbereichs, INT-009), und auf den offiziellen Prüfungsplan sowie „FB-Aktuelles" (Capability `news`) als vorrangige, verbindliche Quellen verweisen. Herkunft: NEU, entschieden 2026-09-06; vormals SCHED-F-440. Der Raumplan-Abgleich ist ausdrücklich ein experimentelles Feature, das unvollständig bleiben darf — deshalb muss am Hinweis selbst stehen, worauf er beruht und was ihm vorgeht.

#### Scenario: Hinweis angezeigt
- **WHEN** ein Raumabweichungs- oder Nicht-gefunden-Hinweis angezeigt wird
- **THEN** kennzeichnet das System ihn als unbestätigte Ableitung, nennt die Raumreservierung als Quelle und verweist auf Prüfungsplan und „FB-Aktuelles" als vorrangige Quellen

### Requirement: Kein Verändern des Eintrags bei Hinweis

Solange ein Hinweis auf Raumabweichung oder fehlende Zuordnung angezeigt wird, darf das System den betroffenen Stundenplan-Eintrag nicht verändern, verschieben, ausblenden oder dessen gespeicherten Raum überschreiben. Herkunft: NEU (vormals SCHED-F-445).

#### Scenario: Eintrag bleibt unverändert
- **WHEN** ein Abweichungs- oder Nicht-gefunden-Hinweis an einem Eintrag angezeigt wird
- **THEN** bleibt der gespeicherte Termin unverändert, unverschoben, sichtbar und mit unverändertem Raum

### Requirement: Kein Hinweis bei veraltetem Raumplan

Falls der Raumplan-Zwischenspeicher älter ist als das Vierfache der vorgesehenen Aktualisierungsfrequenz, mindestens jedoch älter als 30 Minuten, muss das System keinen Hinweis auf Raumabweichung oder fehlende Zuordnung anzeigen und stattdessen das Alter des Raumplan-Stands ausweisen. Herkunft: NEU, entschieden 2026-09-06; vormals SCHED-F-450. Die vorige Fassung ließ die Hinweise bereits entfallen, sobald der Stand älter war als die Aktualisierungsfrequenz — bei einem Abruf alle paar Minuten wäre der Block damit praktisch immer stumm gewesen.

#### Scenario: Veralteter Raumplan-Stand
- **WHEN** der Raumplan-Zwischenspeicher älter als das Vierfache der Aktualisierungsfrequenz und älter als 30 Minuten ist
- **THEN** zeigt das System keinen Abweichungshinweis, sondern das Alter des Stands

#### Scenario: Einzelner ausgelassener Abruf
- **WHEN** der Raumplan-Zwischenspeicher eine Aktualisierungsrunde übersprungen, die Schwelle aber nicht erreicht hat
- **THEN** zeigt das System die Hinweise unverändert weiter

### Requirement: Wochentagsleiste über die volle Bildschirmbreite

Das System muss jede Wochentagsleiste — in der Wochenansicht wie im Planungsmodus — über die volle verfügbare Bildschirmbreite darstellen und die Breite gleichmäßig auf die dargestellten Tage aufteilen. Ein waagerechtes Blättern innerhalb der Leiste ist ausgeschlossen. Die Leiste darf dabei nicht mehr Höhe beanspruchen, als die Mindestgröße für Bedienelemente verlangt. Herkunft: Recherche: Issue #62 (Gerätedurchsicht Pixel 9 Pro), 2026-09-08. Die bisherige Umsetzung führt die Leiste des Planungsmodus als waagerechten Scroll mit Mindestbreite und Innenabstand je Chip; auf dem Prüfgerät belegt sie rund ein Achtel der Bildschirmhöhe, obwohl fünf Tage nebeneinander in die Breite passen.

#### Scenario: Fünf Wochentage
- **WHEN** eine Wochentagsleiste fünf Tage darstellt
- **THEN** füllen die fünf Einträge gemeinsam die volle Bildschirmbreite und sind gleich breit

#### Scenario: Zusätzlicher Wochenendtag
- **WHEN** die Leiste einen zusätzlichen Wochenendtag aufnimmt
- **THEN** verteilt das System die volle Breite gleichmäßig auf die nun größere Zahl von Tagen, ohne waagerechtes Blättern

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

### Requirement: Gliederung der Modulauswahl nach Fachsemester

Das System muss die Modulauswahl in Abschnitte gliedern und dabei je Modul das Fachsemester als Abschnitt verwenden, in dem es angeboten wird. Für Module, deren Termine kein auswertbares Fachsemester tragen, muss das System stattdessen den Namen des Endpunkts als Abschnitt verwenden. Herkunft: NEU, entschieden 2026-09-08, Bestandsaufnahme über eine Live-Abfrage von INT-002 am selben Tag. Nur die Bachelor-Endpunkte mit echter Fachsemesterliste liefern verwertbare `grade`-Werte; Master, Blockwochen, Tutorien, Seminare und Wahlpflicht liefern durchgängig `0`, sodass eine reine Fachsemester-Gliederung dort nichts trennen würde.

#### Scenario: Bachelor-Endpunkt mit Fachsemestern
- **WHEN** ein gewählter Endpunkt Termine mit den Fachsemestern 2, 4 und 6 liefert
- **THEN** gliedert das System dessen Module in die Abschnitte dieser drei Fachsemester

#### Scenario: Endpunkt ohne Fachsemester
- **WHEN** ein gewählter Endpunkt ausschließlich Termine ohne auswertbares Fachsemester liefert
- **THEN** führt das System dessen Module in einem nach dem Endpunkt benannten Abschnitt

### Requirement: Modulauswahl ohne Veranstaltungsart und Gruppen-Slot

Die Modulauswahl darf ausschließlich die Wahl der Module verlangen; sie darf weder Veranstaltungsarten noch Gruppen-Slots noch einzelne Termine zur Auswahl stellen. Herkunft: NEU, entschieden 2026-09-08. Die Frage „welche Module belege ich" ist von der Frage „zu welcher Gruppe gehe ich wann" getrennt; die zweite gehört in den Planungsmodus und braucht dessen Konfliktprüfung, die in einer Modulliste nicht darstellbar ist.

#### Scenario: Modul angekreuzt
- **WHEN** die Nutzerin ein Modul in der Modulauswahl ankreuzt
- **THEN** führt das System es als Kandidat für die Planung, ohne eine Veranstaltungsart oder einen Gruppen-Slot zu erfragen

### Requirement: Abwahl eines Moduls mit vorhandenen Planeinträgen

Wenn die Nutzerin ein Modul abwählt, zu dem bereits Termine im persönlichen Plan stehen, dann muss das System erfragen, ob diese Termine mit entfernt werden sollen, und diese Frage mit „nein" vorbelegen. Ein selbsttätiges Entfernen ist ausgeschlossen; ein wortloses Stehenlassen ohne Hinweis ebenso. Herkunft: NEU, entschieden 2026-09-08. Folgt aus dem Requirement „Bestätigung vor zerstörender Aktion" der Capability `ux-and-theming` und dem Requirement „Kein selbsttätiges Entfernen des Stundenplans" der Capability `data-and-storage`: Planeinträge sind Nutzerdaten, ihr Verlust braucht eine Zustimmung. Die Vorbelegung auf „nein" folgt derselben Erwägung wie bei den Löschaktionen — wer sich vertippt, verliert nichts.

#### Scenario: Modul mit Planeinträgen abgewählt
- **WHEN** die Nutzerin ein Modul abwählt, zu dem Termine im persönlichen Plan stehen
- **THEN** erfragt das System, ob diese Termine mit entfernt werden sollen, vorbelegt auf „nein"

#### Scenario: Termine sollen bleiben
- **WHEN** die Nutzerin die Abwahl bestätigt, ohne dem Entfernen der Termine zuzustimmen
- **THEN** bleiben die Termine im Plan erhalten und der Planungsmodus führt sie weiterhin

#### Scenario: Modul ohne Planeinträge abgewählt
- **WHEN** die Nutzerin ein Modul abwählt, zu dem noch kein Termin im Plan steht
- **THEN** entfällt die Rückfrage, und die Abwahl wirkt unmittelbar

### Requirement: Verwerfen der Modulauswahl

Das System muss in der Modulauswahl einen sichtbaren Bedienweg anbieten, der sämtliche Modulhaken auf einmal zurücknimmt. Er muss vor der Ausführung bestätigt werden; tragen abgewählte Module bereits Planeinträge, muss dieselbe Rückfrage nach deren Verbleib gestellt werden, die die Abwahl eines einzelnen Moduls stellt. Herkunft: Recherche: Issue #62 (Gerätedurchsicht Pixel 9 Pro), 2026-09-08. Die Modulauswahl belegt sich beim Öffnen aus vorhandenen Planeinträgen vor; wer den Plan neu aufsetzen will, findet dort keinen Weg zurück auf null.

#### Scenario: Modulauswahl verwerfen
- **WHEN** die Nutzerin die Modulauswahl verwirft und die Rückfrage bestätigt
- **THEN** ist kein Modul mehr angekreuzt

#### Scenario: Verworfene Module mit Planeinträgen
- **WHEN** unter den verworfenen Modulen mindestens eines bereits Planeinträge trägt
- **THEN** fragt das System nach dem Verbleib dieser Einträge, wie es die Abwahl eines einzelnen Moduls tut

### Requirement: Gliederung des Auswahlbestands

Das System muss den Auswahlbestand über zwei aufeinanderfolgende Bedienschritte gliedern: zuerst die Wahl der Module, danach je gewähltem Modul die Wahl von Veranstaltungsart und Gruppen-Slot. Eine flache Liste einzelner Termine ist ausgeschlossen. Herkunft: Recherche: FBWS live abgefragt, 2026-09-04, auf zwei Schritte aufgeteilt 2026-09-08; vormals SCHED-F-600. Die Live-Prüfung vom 2026-09-04 ergab 121 Termine für ein einzelnes Fachsemester und 161 für die Wahlpflicht-Sammelkategorie — eine flache Liste ist in dieser Größenordnung nicht bedienbar. Die Aufteilung auf zwei Schritte trennt zusätzlich zwei verschiedene Fragen: welche Module belegt werden und zu welcher Gruppe man geht.

#### Scenario: Auswahlbestand öffnen
- **WHEN** die Nutzerin den Auswahlbestand öffnet
- **THEN** zeigt das System zunächst die Module zur Auswahl, ohne Veranstaltungsarten oder Gruppen-Slots

#### Scenario: Veranstaltungsart und Slot wählen
- **WHEN** Module gewählt sind und die Nutzerin zum nächsten Schritt geht
- **THEN** stellt das System je gewähltem Modul Veranstaltungsart und Gruppen-Slot zur Wahl

### Requirement: Abwahl einzelner Veranstaltungsarten

Das System muss der Nutzerin ermöglichen, einzelne Veranstaltungsarten einer Veranstaltung abzuwählen, ohne die Veranstaltung selbst abzuwählen. Herkunft: Recherche: Rücksprache Studierender, 2026-09-04 (vormals SCHED-F-610).

#### Scenario: Praktikum abwählen
- **WHEN** die Nutzerin die Veranstaltungsart „Praktikum" einer Veranstaltung abwählt
- **THEN** bleiben die übrigen Veranstaltungsarten derselben Veranstaltung ausgewählt

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

### Requirement: Freitextsuche im Auswahlbestand

Das System muss eine Freitextsuche über den Auswahlbestand bereitstellen, die Bezeichnung, Modulnummer und lehrende Person berücksichtigt. Herkunft: Recherche: Rücksprache Studierender, 2026-09-04 (vormals SCHED-F-630).

#### Scenario: Suche nach Modulnummer
- **WHEN** die Nutzerin nach einer Modulnummer sucht
- **THEN** findet das System die zugehörige Veranstaltung

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

Das System muss der Nutzerin ermöglichen, aus den Kandidaten der Planungsauswahl selbsttätig einen Vorschlag nach der eingestellten Kriterienrangfolge erzeugen zu lassen, den sie vor der Übernahme einsehen und einzeln ändern kann. Der Vorschlag entsteht schrittweise: Das System geht die Kandidaten in einer festgelegten Reihenfolge durch und wählt für jeden den nach der Rangfolge besten Termin, der gegen den bis dahin aufgebauten Vorschlag konfliktfrei ist; Kombinationen werden nicht durchsucht. Dabei darf das System jeden nicht angepinnten Termin auf einen anderen Gruppen-Slot derselben Veranstaltung umlegen, aber keine Veranstaltung aus dem Vorschlag entfernen. Findet das System keine vollständig konfliktfreie Konstellation, muss es die beste gefundene mit sichtbar markiertem Konflikt anzeigen, die beteiligten Veranstaltungen benennen und auf die „Pflicht"-Markierung als Weg hinweisen, den Vorrang zu bestimmen. Herkunft: Recherche: Rücksprache Studierender, 2026-09-04, Verfahren festgelegt 2026-09-06; vormals SCHED-F-680.

#### Scenario: Vorschlag erzeugen und ändern
- **WHEN** die Nutzerin einen Vorschlag erzeugen lässt
- **THEN** zeigt das System ihn vor der Übernahme an und lässt einzelne Termine ändern, bevor der Plan sich ändert

#### Scenario: Nicht angepinnter Termin wird umgelegt
- **WHEN** ein nicht angepinnter Termin auf einem anderen Gruppen-Slot derselben Veranstaltung ein nach der Rangfolge besseres Ergebnis ergibt
- **THEN** legt das System ihn im Vorschlag dorthin um und weist die Änderung aus

#### Scenario: Keine konfliktfreie Konstellation
- **WHEN** keine Anordnung ohne Konflikt gefunden wird
- **THEN** zeigt das System die beste gefundene mit markiertem Konflikt, benennt die beteiligten Veranstaltungen und weist auf die „Pflicht"-Markierung hin

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

### Requirement: Keine Speicherung der Matrikelnummer

Das System darf die Matrikelnummer nicht dauerhaft speichern. Es verwendet sie ausschließlich für den Abruf nach INT-019 (Capability `integrations`) und überträgt sie an kein anderes Ziel. Gespeichert wird allein die daraus ermittelte und von der Nutzerin bestätigte Gruppenkennung. Herkunft: NEU, entschieden 2026-09-06; vormals SCHED-F-710. Die Matrikelnummer ist personenbeziehbar und wird nach der Ermittlung nicht mehr gebraucht; die Gruppenkennung bleibt auch ohne sie jederzeit von Hand festlegbar.

#### Scenario: Matrikelnummer im Netzwerkmitschnitt
- **WHEN** ein Netzwerkmitschnitt während der Nutzung erstellt wird
- **THEN** erscheint die Matrikelnummer in keinem Aufruf außer gegen INT-019

#### Scenario: Nach Abschluss der Einrichtung
- **WHEN** die Nutzerin die ermittelte Gruppenkennung bestätigt hat und die App neu startet
- **THEN** ist die Gruppenkennung vorhanden und die Matrikelnummer nirgends gespeichert

### Requirement: Gruppenkennung ohne Matrikelnummer

Das System muss die Gruppenkennung auch ohne Angabe einer Matrikelnummer festlegbar machen; die manuelle Angabe erfolgt über ein einzelnes Textfeld und verlangt Buchstabe und Zahl. Die Ermittlung über die Matrikelnummer (INT-019) bleibt der voreingestellte Weg, weil sie die vollständige Kennung samt Zahl liefert, ohne dass die Nutzerin sie kennen muss; ihr Vorrang muss sich aus Anordnung und Betonung ergeben, ein Umschalter zwischen beiden Wegen ist nicht erforderlich. Herkunft: Recherche: Rücksprache Studierender, 2026-09-04, Zahlenpflicht ergänzt 2026-09-06, Eingabeform auf ein Textfeld umgestellt 2026-09-08; vormals SCHED-F-720. Die bisherige Umsetzung bot ein Antippgitter aus allen 26 Buchstaben nebst getrenntem Zahlenfeld und brauchte dafür einen Umschalter; eine Kennung wie `C8` steht auf jedem Aushang als zwei Zeichen und wird mit der gewöhnlichen Tastatur schneller eingegeben.

#### Scenario: Einrichtung ohne Matrikelnummer
- **WHEN** die Nutzerin keine Matrikelnummer angibt
- **THEN** lässt sich die Einrichtung dennoch durch Eingabe der vollständigen Kennung in das Textfeld abschließen

#### Scenario: Voreingestellter Weg
- **WHEN** die Nutzerin die Einrichtung der Gruppenkennung öffnet
- **THEN** steht die Ermittlung über die Matrikelnummer an erster Stelle und die manuelle Eingabe unmittelbar darunter erreichbar

#### Scenario: Kleinschreibung eingegeben
- **WHEN** die Nutzerin `c8` in das Textfeld eingibt
- **THEN** übernimmt das System die Eingabe als `C8`, ohne sie zurückzuweisen

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

### Requirement: Schalter zum Abschalten aller Filter

Das System muss der Nutzerin einen Schalter bereitstellen, der sämtliche wirksamen Filter der Wochenansicht auf einmal abschaltet — Gruppenfilterung, Gültigkeitszeitraum und Eingrenzung auf Fachsemester — und alle Termine des persönlichen Plans zeigt, gleich welchen Status sie tragen. Die Wochenansicht bleibt dabei erhalten. Herkunft: NEU, entschieden 2026-09-06. Zweck ist das manuelle Zusammenstellen des Plans, wenn die App den Fall einer Nutzerin nicht abdeckt; dass die Darstellung dabei unübersichtlich wird, ist ausdrücklich in Kauf genommen.

#### Scenario: Alle Filter abschalten
- **WHEN** die Nutzerin den Schalter aktiviert
- **THEN** zeigt das System alle Termine des persönlichen Plans, einschließlich gruppenfremder und außerhalb ihres Gültigkeitszeitraums liegender

#### Scenario: Schalter zurücknehmen
- **WHEN** die Nutzerin den Schalter wieder deaktiviert
- **THEN** wirken die zuvor gesetzten Filtereinstellungen unverändert weiter

## Entfallene Anforderungen (historisch)

### Ehemals SCHED-F-230: Konflikthinweis bei festen Terminen

Ursprünglicher Text: „Wenn sich zwei Termine des persönlichen Plans mit dem Status „fest" zeitlich überschneiden, muss das System beide Termine mit einem sichtbaren Konflikthinweis darstellen, unabhängig davon, ob sie offiziell oder eigen sind. Hat die Nutzerin die Überschneidung nach der Anforderung zur bewussten Übernahme trotz Konflikt angenommen, darf das System keinen wiederkehrenden Konflikthinweis mehr erzeugen; das Terminpaar trägt dann allein die Kennzeichnung „angenommener Konflikt"." Herkunft: NEU, entschieden 2026-09-06.

Status: entfallen (Issue #62, Entscheidung 2026-09-08). Grund: Die Anforderung knüpfte den Konflikthinweis an den Status „fest", der mit Issue #62 entfällt. Sowohl ihr Titel als auch ihr Szenario „Zwei feste Termine überschneiden sich" trugen ein Vokabular, das die Capability nicht mehr kennt. Ersetzt durch das gleichlautend fortgeführte Requirement „Konflikthinweis bei überschneidenden Terminen". Es trägt dieselbe Regel, bezieht sie aber auf aktive statt auf feste Termine und nimmt deaktivierte Termine ausdrücklich aus. Die Ausnahme für den bewusst angenommenen Konflikt gilt unverändert weiter.

### Ehemals SCHED-F-570: Status „fest" oder „vorgemerkt"

Ursprünglicher Text: „Das System muss jedem Termin des persönlichen Plans einen Status „fest" oder „vorgemerkt" zuordnen und dessen Wechsel über einen sichtbaren Bedienweg ermöglichen. Die Zuordnung muss im Planungsmodus ausdrücklich erfolgen: Ist zu einer Veranstaltungsart genau ein Termin gewählt, gilt er als „fest"; sind mehrere gewählt, bestimmt die Nutzerin, welcher davon „fest" ist und welche „vorgemerkt" sind. Eine Zuordnung nach der Reihenfolge, in der die Termine angetippt wurden, ist ausgeschlossen." Herkunft: Recherche: Rücksprache Studierender, 2026-09-04, Zuordnungsregel ergänzt 2026-09-08.

Status: entfallen (Issue #62, Entscheidung 2026-09-08). Grund: Der Status ist am Gerät als zu viel Bedienoberfläche für zu wenig Ertrag beurteilt worden: eine Zuordnungsregel im Planungsmodus, ein „als fest festlegen"-Bedienweg je Zeile, eine dritte Konfliktstufe und eine eigene Kennzeichnung in der Wochenansicht, um einen einzigen Fall abzudecken — einen Termin im Plan behalten, ohne ihn wahrzunehmen. Diesen Fall deckt das Deaktivieren ab, das die Alt-App unter `action_toggle_cancel` seit jeher führt und das ohne Zuordnungsregel auskommt. Ersetzt durch die Requirements „Deaktivieren eines Termins" und „Wirkung eines deaktivierten Termins". Eine Überführung gespeicherter Einträge mit `status: 'vorgemerkt'`/`'fest'` war zunächst vorgesehen; laut Prüfprotokoll vom 2026-09-09 hält kein Gerät mehr einen solchen Bestand, sie entfällt ersatzlos (`design.md` des Changes `stundenplan-bedienung-ohne-vormerkung`, Entscheidung 2). Der Planungsmodus kennt nur noch „hinzugefügt" und „nicht hinzugefügt".

### Ehemals SCHED-F-580: Unterscheidung vorgemerkter Termine

Ursprünglicher Text: „Das System muss vorgemerkte Termine von festen Terminen zusätzlich zur Farbgebung durch Text oder Symbol unterscheidbar darstellen." Herkunft: Recherche: Rücksprache Studierender, 2026-09-04.

Status: entfallen (Issue #62, Entscheidung 2026-09-08). Grund: Der Status, den diese Anforderung unterscheidbar machen sollte, entfällt. Ersetzt durch das Requirement „Wirkung eines deaktivierten Termins", das dieselbe Pflicht — Bedeutung zusätzlich zur Farbe über Text oder Symbol — für den deaktivierten Zustand führt.

### Ehemals SCHED-F-590: Kein Konflikthinweis bei vorgemerkten Terminen

Ursprünglicher Text: „Wenn sich ein vorgemerkter Termin zeitlich mit einem anderen Termin überschneidet, darf das System dafür keinen Konflikthinweis erzeugen. Im Planungsmodus muss das System eine solche Überschneidung dennoch erkennbar machen, dabei aber deutlich zurückgenommen gegenüber der Kennzeichnung kollidierender fester Termine." Herkunft: Recherche: Rücksprache Studierender, 2026-09-04, Kennzeichnung im Planungsmodus ergänzt 2026-09-08.

Status: entfallen (Issue #62, Entscheidung 2026-09-08). Grund: Der Status, an den die Ausnahme geknüpft war, entfällt. Damit entfällt auch die dritte Konfliktstufe im Planungsmodus, die eine Überschneidung mit einem vorgemerkten Termin zurückgenommen kennzeichnete. Ersetzt durch das Requirement „Wirkung eines deaktivierten Termins" (kein Konflikthinweis für deaktivierte Termine) und die geänderten Requirements „Konflikthinweis bei überschneidenden Terminen" und „Konfliktprüfung paralleler Termine", die nur noch zwei Stufen kennen.

### Ehemals SCHED-F-470: Belegungsvorschau je Tag

Ursprünglicher Text: „Das System muss in der Wochentagsleiste je Tag eine Vorschau der Belegung anzeigen, aus der ohne Tageswechsel hervorgeht, ob und wie viele Termine an diesem Tag liegen." Herkunft: Recherche: Rücksprache Studierender, 2026-09-04.

Status: entfallen (Issue #62, Entscheidung 2026-09-08). Grund: Die Terminanzahl je Tag beantwortete keine Frage, die sich beim Blick auf die Wochentagsleiste stellt, und drängte Wochentag und Datum in eine kleinere Schriftgröße, während die Leiste zugleich die volle Bildschirmbreite füllen soll. Ersatzlos: Das geänderte Requirement „Wochentagsleiste mit bedarfsweisem Samstag" legt den Inhalt eines Eintrags auf Wochentag und Kalenderdatum fest. Wer wissen will, was an einem Tag liegt, wechselt auf ihn.

### Ehemals SCHED-N-010: Zeitziel beim Blättern zwischen Wochentagen

Ursprünglicher Text: „Das System muss beim Blättern zwischen Wochentagen die Zielwerte der Capability `non-functional` (NFR-N-040) einhalten." Herkunft: NEU.

Status: entfallen (entschieden 2026-09-06, Herkunfts-Durchsprache). Grund: Die Anforderung sagte inhaltlich nur, dass der querschnittliche Zeitwert einzuhalten sei — ohne eigenen Wert, ohne eigene Schwelle und ohne eigene Begründung; der Abschnitt „Nicht-funktionale Anforderungen (Register)" verwies seinerseits auf sie zurück. NFR-N-040 gilt unverändert für die gesamte App und damit auch für den Stundenplan.

### Ehemals SCHED-F-350: Auswahl des Optimierungsmodus

Ursprünglicher Text: „Das System muss der Nutzerin für den Planungsmodus die Auswahl eines Optimierungsmodus ermöglichen, mindestens aus „minimale Zeit an der Hochschule", „ausgeglichener Tagesablauf" und „mehr Abstand zwischen Lerneinheiten"." Herkunft: NEU.

Status: entfallen (entschieden 2026-09-06). Grund: Eine Auswahl aus benannten Modi kann nicht mehr ausdrücken, was gebraucht wird — „möglichst wenige Fahrten, und dabei nach Möglichkeit Vorbereitungszeit" ist keine Auswahl, sondern eine Rangfolge. Ersetzt durch „Kriterienrangfolge für die Planung"; die fünf Modi leben dort als benannte Voreinstellungen weiter.

### Ehemals SCHED-F-360: Reihung nach Optimierungsmodus

Ursprünglicher Text: „Wenn im Planungsmodus mehrere konfliktfreie Termine für einen Kandidaten zur Auswahl stehen, muss das System sie entsprechend dem gewählten Optimierungsmodus ordnen, sodass die nach dessen Kriterium günstigste Option zuerst erscheint." Herkunft: NEU.

Status: entfallen (entschieden 2026-09-06). Grund: Der Modus „ausgeglichener Tagesablauf" bevorzugte die Tagesspanne, die einer Acht-Stunden-Spanne am nächsten kommt, und blähte damit an einem kurzen Tag den Tag auf — das Gegenteil dessen, was sein Name verspricht. Außerdem fehlte das Zeitfenster als Größe, obwohl die Erläuterung seine Wirkung auf die Reihung behauptete. Ersetzt durch „Reihung nach der Kriterienrangfolge" mit acht definierten Kriterien.

### Ehemals SCHED-F-390: Konfliktprüfung gegenüber Pflicht-Kandidaten

Ursprünglicher Text: „Bei der Konfliktprüfung eines nicht als „Pflicht" markierten Kandidaten der Planungsauswahl muss das System dessen Termine gegen den bereits übernommenen Stundenplan sowie gegen die als „Pflicht" markierten Kandidaten derselben Planungsauswahl prüfen, nicht gegen andere, ebenfalls noch nicht als „Pflicht" markierte Kandidaten." Herkunft: NEU.

Status: entfallen (entschieden 2026-09-06). Grund: Seit der Trennung von *Ob* und *Wann* hält eine Pflicht-Markierung nur noch fest, dass eine Veranstaltung im Plan bleiben muss, und trägt keinen Zeitpunkt mehr, gegen den sich prüfen ließe. Ersetzt durch „Konfliktprüfung gegenüber angepinnten Terminen"; die Zurückstellung der Vollkombinatorik von 2026-08-25 bleibt in Kraft.

### Ehemals SCHED-F-270: Zweites Fachsemester für die Wahlpflicht-Planung

Ursprünglicher Text: „Das System muss der Nutzerin ermöglichen, zusätzlich zum eigenen Fachsemester ein weiteres Fachsemester desselben Studiengangs auszuwählen, um dessen Termine für die Wahlpflicht-Planung abzurufen." Herkunft: Recherche: WhatsApp-Chat pi-8-semester-fh-informatik, 2026-08-25.

Status: entfallen (Entscheidung FSR FB4, 2026-08-26). Grund: Die Live-Prüfung vom 2026-08-26 zeigte, dass die FBWS-Sammelkategorie `WFPB` alle aktuell angebotenen Wahlpflichtmodule automatisch liefert — ersetzt durch die Anforderung „Automatischer Bezug der Wahlpflicht-Sammelkategorie" (vormals SCHED-F-400). Die ursprünglich befürchtete Notwendigkeit einer manuellen Fachsemester-Auswahl entfiel damit für die Wahlpflicht-Planung; für Wiederholerinnen und Vorzieherinnen deckt seit 2026-09-04 die Anforderung „Erweiterung um weitere Fachsemester" (vormals SCHED-F-640) denselben fachlichen Bedarf auf andere Weise ab.

## Scope / Nicht-Scope

### Scope

- Anzeige offizieller FBWS-Termine (INT-002) für einen gewählten Studiengang und ein gewähltes Fachsemester, wahlweise erweitert um weitere Fachsemester desselben Studiengangs.
- Darstellung in echten Kalenderwochen mit Datumsbezug, einschließlich Blättern über Wochengrenzen und Kennzeichnung vorlesungsfreier Wochen.
- Kursbasierte Zusammenstellung des Plans über die Ebenen Veranstaltung, Veranstaltungsart und Gruppen-Slot, mit Suche und Filtern.
- Deaktivieren eines Termins — dauerhaft oder nur für das nächste Vorkommen —, um sich mehrere zeitgleiche Angebote bewusst offenzuhalten, ohne den geparkten Termin wahrzunehmen.
- Lokale Filterung nach Gruppenkennung (`studentSet`-Abgleich, siehe „Beispieltabelle Gruppenzuordnung").
- Anlegen, Bearbeiten und Löschen eigener, nicht-offizieller Einträge — wahlweise wöchentlich wiederkehrend oder einmalig an einem Datum —, einschließlich eigener Prüfungstermine.
- Ermittlung der Gruppenkennung aus der Matrikelnummer (INT-019) als Alternative zur manuellen Eingabe.
- Lokale Persistenz des Stundenplans über App-Neustarts hinweg (siehe Capability `data-and-storage`, DATA-F-010).
- Auswahl relevanter Prüfungstermine aus dem vom Backend aus dem Raumplan (INT-009) abgeleiteten Prüfungsbestand und deren Anzeige im Stundenplan, gesondert gekennzeichnet.
- Benachrichtigung bei Änderungen an ausgewählten Prüfungsterminen.
- Planungsmodus: Einsicht und Übernahme einzelner Termine anderer Gruppen für eine Pflichtveranstaltung.
- Planungsmodus: Auswahl konfliktfreier Termine für Wahlpflichtmodule gegenüber dem eigenen Stundenplan, einschließlich explizitem Hinweis bei fehlender konfliktfreier Konstellation.
- Planungsmodus: auswählbares bevorzugtes Zeitfenster für die Anwesenheit an der Hochschule sowie auswählbarer Optimierungsmodus, nach dem mehrere konfliktfreie Terminoptionen geordnet werden.
- Planungsmodus: mehrere Wahlpflichtmodule gleichzeitig in einer Planungsauswahl führen und einzelne davon als „Pflicht" markieren, um weitere Kandidaten dagegen zu prüfen.
- Abgleich der eigenen offiziellen Termine gegen den Raumplan (INT-009) und Hinweis am Stundenplan-Eintrag bei abweichendem Raum oder fehlender Zuordnung.

### Nicht-Scope

- Raumbelegung/-verfügbarkeit über den eigenen Stundenplan hinaus — siehe Capability `room-finder`.
- Serverseitige Speicherung des persönlichen Stundenplans einschließlich der individuellen Prüfungsauswahl — ausdrücklich ausgeschlossen, siehe Capability `backend-and-api` (API-F-100) und die Erläuterung zur Anforderung „Benachrichtigung bei Prüfungsplan-Aktualisierung".
- Ableitung und Pflege des Prüfungsbestands selbst — Backend-Vorgang, siehe Capability `backend-and-api` („Ableitung des Prüfungsbestands aus dem Raumplan") und Capability `integrations` (INT-009). Der vormalige Excel-Upload samt Jahres-Rotation ist am 2026-09-06 entfallen.
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
- Als Studierende möchte ich einen von zwei Veranstaltungen zur selben Uhrzeit deaktivieren können, um vor Ort zu entscheiden, in welche ich gehe, ohne dass die App mich dauerhaft vor einem Konflikt warnt.
- Als Studierende möchte ich beim Zusammenstellen meines Plans einzelne Veranstaltungsarten weglassen können, weil ich zum Beispiel das Praktikum einer Veranstaltung nicht belege.
- Als Wiederholerin möchte ich eine Veranstaltung aus einem anderen Fachsemester in meinen Plan aufnehmen und dabei auf Kollisionen geprüft werden, wie bei einem Wahlpflichtmodul auch.
- Als Studierende möchte ich meinen Plan auch für kommende Wochen ansehen, damit ich erkenne, wann eine Veranstaltung endet oder wann vorlesungsfreie Zeit beginnt.
- Als Studierende möchte ich meine Gruppenkennung nicht kennen oder nachschlagen müssen, sondern sie über meine Matrikelnummer ermitteln lassen.
- Als Studierende möchte ich eine Gruppenkennung auch dann angeben können, wenn ich nur den Buchstaben kenne, weil die Zahl im Alltag keine Rolle spielt.
- Als Studierende möchte ich sowohl eine wöchentliche Lerngruppe als auch einen einmaligen Termin eintragen können, ohne dass die App beides gleich behandelt.

## Erläuterungen

**Durchsprache vom 2026-09-06** (`docs/agents/herkunft-durchsprache.md`). Alle 29 `NEU`-Requirements dieser Capability wurden nach der Leitfrage „Würde der FSR das heute noch so beschließen — und woran erkennt man das?" durchgegangen. Ein Requirement entfällt (SCHED-N-010), zwölf ändern sich, eines kommt hinzu. Was bestätigt wurde, trägt seitdem den Beleg „bestätigt 2026-09-06".

**Worauf sich diese Bestätigungen stützen — und worauf nicht.** Anders als beim `canteen`-Durchgang steht hinter keinem dieser Requirements eine laufende Implementierung: `ScheduleScreen` ist zum Zeitpunkt der Durchsprache weiterhin ein Platzhalter, es existieren nur Logikmodule mit Einheitentests und die beiden Einrichtungs-Screens. Auch die vier Requirements, die nach Testnamen umgesetzt aussehen (vormals SCHED-F-060, F-145, F-660, F-710), sind nie an einer Nutzerin erprobt worden. Jede Bestätigung hier ist deshalb eine Abwägung, keine Erfahrung — das ist der schwächste der drei Belegtypen und entscheidet, wie fest diese Anforderungen beim nächsten Durchgang stehen.


**Zur Einzelwert-Anforderung (vormals SCHED-F-070)** — Die Alt-App vergleicht an dieser Stelle fehlerhaft den Zahlenteil der Gruppenkennung (`info.groupNumber`) mit dem ersten Zeichen des `studentSet`-Werts (`schedule_overview_viewmodel.dart:216`, `info.groupNumber.codeUnitAt(0) == item.studentSet.codeUnitAt(0)`), obwohl ein Buchstabenvergleich (`groupLetter`) gemeint war. Dadurch schlägt der Abgleich bei Einzelwert-`studentSet` in der Alt-App praktisch immer fehl, sofern nicht zufällig Zahl- und Buchstabenzeichen denselben Codepoint teilen. Für die Neuentwicklung ist das korrigierte Verhalten (Buchstabenvergleich) das Sollverhalten, nicht das beobachtete Altverhalten — daher die Markierung „Alt: bewusst verworfen" statt eines Quellverweises.

**Zu den Anforderungen zum offiziellen Prüfungsplan** — Aus der Rücksprache mit dem FSR FB4, 2026-08-25: Der Fachbereich veröffentlicht während der Vorlesungszeit einen offiziellen Prüfungsplan als Excel-Datei auf einer Intranet-Seite, die einen Hochschul-Login voraussetzt, den weder App noch Backend besitzen (siehe `specs/product/vision.md` Nicht-Ziel 1, Capability `security-and-privacy` zum Verzicht auf Passwort-Replay). Der Import war deshalb zweistufig und manuell. **Entschieden 2026-09-06: Dieser Weg entfällt vollständig.** Der Raumplan (INT-009), den das Backend ohnehin alle paar Minuten abruft, führt die Prüfungstermine bereits mit — als Einträge mit `eventType: "Event"` und dem Namensmuster `Prüfung <Modulnummer> <Bezeichnung>`. Ausschlaggebend war nicht der Aufwand des einzelnen Uploads, sondern seine Abhängigkeit von einer jährlich wechselnden ehrenamtlichen Person: dieselbe Konstruktion, an der das abgelöste Backend `app.fsrfb4.de` gescheitert ist, dessen Semestertermine bis heute aus dem Wintersemester 2023/24 stammen. Unverändert bleibt, dass nicht jede Prüfung des Fachbereichs jede Nutzerin interessiert — sie wählt selbst aus, welche eigenen und welche Nachholprüfungen sie führt.

**Was mit der Excel verloren geht.** Die Datei trug eine Matrix, die der Raumplan nicht hat: die Zuordnung Prüfung → Studiengang, Vertiefung, Prüfungsordnung, Fachsemester. Für die eigenen Prüfungen ist das folgenlos, weil die Zuordnung über die Modulnummer aus dem eigenen Plan entsteht. Für **Nachholprüfungen** aus Veranstaltungen außerhalb des Plans entfällt jedoch der Weg, sie über „mein Studiengang, mein Fachsemester" zu finden; sie sind dann nur über Bezeichnung oder Modulnummer auffindbar. Bewusst in Kauf genommen. Eine zweite Bruchstelle: Bei Prüfungsdatensätzen hält INT-009 die Felder `courseId` und `courseOfStudy` leer, die Modulnummer steht allein im Namensfeld — ändert der Fachbereich diese Schreibweise, bricht die Zuordnung, weshalb ein Eintrag ohne auflösbares Muster als Prüfung ohne Modulbezug geführt und protokolliert wird statt still zu verschwinden (SEC-F-060).

**Zur Benachrichtigung bei Prüfungsplan-Aktualisierung** — Verträgt sich mit API-F-100 (kein serverseitiges Speichern des persönlichen Stundenplans): Das Backend kennt nicht, welche Prüfungen eine einzelne Nutzerin ausgewählt hat, sondern löst bei jeder Änderung des abgeleiteten Prüfungsbestands einen allgemeinen Hinweis aus (vergleichbar einer News-Meldung). Die App ruft daraufhin den geänderten Bestand ab, gleicht ihn lokal gegen die eigene, ausschließlich gerätegespeicherte Auswahl ab und zeigt die Benachrichtigung nur, wenn tatsächlich ein ausgewählter Termin betroffen ist.

**Zweiwöchentliche Veranstaltungen (Hinweis aus derselben Rücksprache).** Manche Lehrveranstaltungen finden nur alle zwei Wochen statt. In der bislang dokumentierten INT-002-Antwortstruktur ist kein Feld erkennbar, das einen solchen Rhythmus trägt (nur INT-009 hat ein `interval`-Feld, dort bislang als „unklare Bedeutung, nicht weiter untersucht" geführt, siehe Capability `integrations`). Ob INT-002 wiederkehrende Termine bereits als separate wöchentliche Einträge liefert (dann unproblematisch) oder der Client die Information zur korrekten zweiwöchentlichen Darstellung fehlt, ist vor Umsetzung mit echten Beispieldaten zu verifizieren — siehe „Offene Fragen".

**Zu iCal-Export und Semesterwechsel-Hinweis** — Aus der automatisierten WhatsApp-Chat-Auswertung (`specs/product/whatsapp-feedback-inventory.md`, Abschnitt 4 „Themenübersicht"): Studis weichen teils auf ICS-Import in eine externe Kalender-App aus, wenn ihnen die App-eigene Ansicht nicht reicht; mehrfach dokumentierte Verwirrung entsteht, wenn sich die Gruppenkennung mit dem Semesterwechsel ändert, die App aber weiter den alten Stand zeigt.

**Export-Ausgestaltung (entschieden).** Rücksprache FSR FB4, 2026-08-25: Studis sollen den in der App zusammengestellten Stundenplan in ein Kalenderprogramm ihrer Wahl integrieren können. Abgewogen wurden ein einmaliger Datei-Export (kein Server-Zugriff nötig, bleibt aber nicht automatisch aktuell) gegenüber einem abonnierbaren Kalender-Link (bleibt synchron, bräuchte aber einen serverseitigen Endpunkt und damit eine Ausnahme von API-F-100). Der abonnierbare Link bleibt ausgeschlossen, API-F-100 gilt ohne Ausnahme.

**Ergänzung vom selben Tag, nach Auswertung des Android-Quellcodes:** Die Android-Alt-App schreibt Termine unmittelbar in einen von der Nutzerin gewählten Gerätekalender, mit Auswahl des Zielkalenders und eines Zeitraums (`dialog/CalendarExportDialog.java`). Das ist bequemer als ein Datei-Export, den die Nutzerin anschließend selbst importieren muss, und damit der zu übertreffende Stand. Entscheidung FSR FB4, 2026-08-25: Beides wird angeboten — der Schreibzugriff als Hauptweg, der Datei-Export als Rückfallweg für den Fall verweigerter Berechtigung oder eines Kalenders außerhalb des Geräts. Die dafür nötige Kalenderberechtigung ist ausschließlich schreibend und wird erst bei tatsächlicher Nutzung angefragt; die zuvor gegenteilige Festlegung in Capability `security-and-privacy` Abschnitt 9 wurde entsprechend korrigiert. Konfigurierbar ist in beiden Wegen die Auswahl der enthaltenen Terminarten.

**Berichtigt am 2026-09-06: beide Wege sind gleichrangig.** Die Rangfolge vom 2026-08-25 — Schreibzugriff als Hauptweg, Datei-Export als Rückfallweg — ist aufgehoben; beide Wege stehen nebeneinander zur Auswahl. Ausschlaggebend war, dass der Absatz oben selbst zwei sehr verschiedene Fälle unter „Rückfall" zusammenfasst: Die verweigerte Berechtigung ist ein Fehlerfall, ein Kalender außerhalb des Geräts dagegen der reguläre Fall jeder Nutzerin, die ihren Plan in ein Web- oder Desktop-Kalenderprogramm bringen will. Ein als Rückfall geführter Weg wird aber schlechter auffindbar angeboten, als dieser zweite Fall es rechtfertigt. Mit aufgehoben ist die damalige Festlegung „keine wiederholte Nachfrage" bei verweigerter Berechtigung: iOS und Android zeigen den Berechtigungsdialog nach einer Ablehnung kein zweites Mal, ein von der App ausgelöster erneuter Versuch ist also gar nicht möglich. Statt den Vorgang abzubrechen, bietet er deshalb im selben Schritt beide Auswege an — den Weg in die Systemeinstellungen der App zum nachträglichen Erteilen der Berechtigung und den Datei-Export. Unverändert gilt der Rest des Absatzes: Der abonnierbare Kalender-Link bleibt ausgeschlossen, die Kalenderberechtigung ist ausschließlich schreibend und wird erst bei tatsächlicher Nutzung angefragt, und die Auswahl der enthaltenen Terminarten ist in beiden Wegen konfigurierbar.

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
| H (unvollständig) | H5-J | ja, mit Protokolleintrag | Kennung ohne Zahl ist seit dem 2026-09-06 unzulässig; liegt sie dennoch vor, ist die Grenze nicht entscheidbar — sicherer Rückfall auf „gruppenzugehörig" statt Annahme einer Zahl. |
| C (unvollständig) | C5-E | ja, mit Protokolleintrag | Gleicher Fall an der Anfangsgrenze mit Zahl. |
| M (unvollständig) | J-M4 | ja, mit Protokolleintrag | Gleicher Fall an der Endgrenze mit Zahl. |
| D (unvollständig) | A1-C9 | nein | Hier entscheidet allein der Buchstabe: D liegt außerhalb von A bis C, die fehlende Zahl spielt keine Rolle. |

Die Spalte „zugehörig" beantwortet die Frage, ob ein Termin als zur eigenen Gruppe gehörend gilt. Sie entscheidet nicht über die Sichtbarkeit: Gruppenfremde Termine bleiben sichtbar und werden gekennzeichnet; ausgeblendet werden sie nur, wenn die Nutzerin den entsprechenden Schalter aktiviert.

**Befund zu den real vorkommenden `studentSet`-Formen (FBWS live abgefragt, 2026-09-04).** Der Bestand von `INPBPI/2` führt 21 verschiedene Werte: `A-P`, `M-N`, `I-J`, `K-L`, `O-P`, `E-F`, `C-D`, `A-B`, `G-H`, `G-I`, `K-M`, `N-P`, `C5-E`, `M5-P`, `J-M4`, `H5-J`, `F-H4`, `A`, `B`, `C`, `D`. Daraus folgen drei Dinge, die die bisherige Beispieltabelle nicht abbildete: Bereiche ohne Zahlen an **beiden** Grenzen sind der Normalfall, Einzelwerte bestehen aus einem Buchstaben **ohne** Zahl, und gemischte Grenzen (`C5-E`, `J-M4`) kommen vor. Die Wildcard `*` trat im gesamten geprüften Bestand **nicht** auf. Die Anforderung bleibt dennoch bestehen (bestätigt 2026-09-06), aber nicht mit der zuvor hier stehenden Begründung, die Capability `integrations` führe den Abrufparameter `studentSet=*`: Das ist ein Anfrageparameter und sagt nichts darüber, welche Feldwerte in einer Antwort vorkommen können. Tragend ist eine andere Begründung — `*` bedeutet unstrittig „gilt für alle Gruppen", und die Android-Alt-App kehrt genau diese Bedeutung um (N-007). Drei Zeilen Logik, die einen Bedeutungsfehler ausschließen, brauchen keinen Vorkommensnachweis. Die Zuordnungslogik trägt alle beobachteten Formen unverändert; ergänzt wurden nur die Prüffälle.

**Geklärt am 2026-09-04:** Die Frage, was eine Studierende als Gruppenkennung eintragen soll, ist beantwortet. Der Fachbereich hält die Zuteilung selbst vor und gibt sie zu einer Matrikelnummer heraus (INT-019).

**Berichtigt am 2026-09-06: die Zahl ist wieder verpflichtend.** Die Fassung vom 2026-09-04 schloss aus der Auskunft einer studierenden Person, „der Buchstabe ist die maßgebliche Angabe; die Zahl wird so gut wie nie gebraucht", und erweiterte das Eingabeformat auf `^[A-Z][0-9]*$`. Der eigene Befund im selben Abschnitt widerlegt das: Fünf der 21 vorkommenden `studentSet`-Werte — `C5-E`, `M5-P`, `J-M4`, `H5-J`, `F-H4` — tragen eine Zahl an einer Bereichsgrenze, an der sie mitentscheidet. Das ist knapp ein Viertel des Bestands, nicht „so gut wie nie". Richtig an der Auskunft bleibt, dass Studierende ihre Zahl selten im Kopf haben — daraus folgt aber nicht, sie wegzulassen, sondern sie über die Matrikelnummer zu beschaffen. Deshalb ist der Weg über INT-019 seit dem 2026-09-06 der voreingestellte, und die manuelle Angabe verlangt beide Teile.

**Die weggelassene Zahl war nicht neutral, sondern ausschließend.** Die Umsetzung führte eine fehlende Zahl als `0` (`groupMatch.ts`, `Number('')`). Eine Kennung `H` wurde damit gegen `H5-J` als (H,0) verglichen, 0 < 5 — der Termin galt als gruppenfremd und verschwand bei aktivem Ausblenden-Schalter aus dem Plan. Das steht gegen den Grundsatz „sichtbar statt fälschlich als fremd markiert", den dieselbe Spec im Abschnitt „Fehlerfälle" für unbekannte `studentSet`-Muster vorschreibt, und blieb unentdeckt, weil die Beispieltabelle keinen solchen Fall führte. Eine neue Rückfallregel braucht es dafür nicht: Mit dem engeren Muster passt `H` nicht mehr auf die Gruppenkennung und läuft in den bereits bestehenden defensiven Rückfall (unbekanntes Muster → zugehörig, protokolliert). Die vier neuen Zeilen der Beispieltabelle halten das als Prüfvorgabe fest.

**Wildcard-Befund aus der Android-Alt-App.** Deren Gruppenabgleich (`util/GroupLetterUtil.java`) behandelt den Wert `*` nicht gesondert: Er trifft die Bedingung für Einzelwerte nur, wenn die Gruppenkennung selbst mit `*` beginnt, und fällt andernfalls auf „nicht zugehörig" durch. Ein Termin, der ausdrücklich für alle Gruppen gilt, würde damit bei gesetzter Gruppenkennung als gruppenfremd markiert — das Gegenteil des Gemeinten. Die Anforderung zur Wildcard-Behandlung legt das korrekte Verhalten fest; die Herkunftsmarkierung bleibt „NEU", weil keine der beiden Alt-Apps ein Vorbild dafür liefert. Geführt als N-007 in `specs/product/legacy-inventory.md`.

**Gruppenwechsel als beobachtetes Verhalten.** Aus der Chat-Auswertung (u. a. `pi-8-semester-fh-informatik`, 2022-12-14 und 2023-01-09; `praktische-informatik-ws-23-24`, 2023-09-21): Studierende weichen bereits informell auf andere Gruppen aus — bei eigener Krankheit, verpasstem Termin oder auf ausdrücklichen Wunsch. Ein Beleg aus `informatik-pi-ti-ds-ws-24-25` (2024-09-30) zeigt den bestehenden Workaround: Studierende tragen den Termin einer fremden Gruppe manuell als eigenen, nicht-offiziellen Termin ein, um eine freie Lücke im eigenen Plan zu füllen. Da INT-002 mit `studentSet=*` ohnehin bereits alle Gruppentermine liefert und clientseitig lediglich auf die eigene Gruppenkennung gefiltert wird, ist dafür keine zusätzliche Integration nötig — die Requirements zu Einsicht und Übernahme von Terminen anderer Gruppen machen diesen bereits gelebten Workaround zu einem regulären, als offiziell erkennbaren Bedienweg. **Gemischte Gruppen sind der Normalfall, nicht die Ausnahme (festgehalten 2026-09-06).** Studierende stellen sich ihren Stundenplan regelmäßig aus Terminen mehrerer Gruppen zusammen und besuchen Gruppen, denen sie formal nicht angehören; der Fachbereich duldet das, solange die Gruppen nicht überfüllt sind. Das ist die tragende Begründung hinter gleich vier Anforderungen — Kennzeichnen statt Entfernen, Einsicht in Termine anderer Gruppen, Übernahme fremder Termine und der Schalter zum Abschalten aller Filter — und stand bis dahin nirgends. Es erklärt zugleich, warum der Schalter „Alle anzeigen" unübersichtlich sein darf: Wer seinen Plan von Hand aus mehreren Gruppen zusammensetzt, braucht den Rohbestand, nicht eine aufgeräumte Auswahl.

Ein weiterer Beleg (`fh-informatik-22-23`, 2022-12-14) nennt ausdrücklich das Risiko, dass insbesondere Termine gegen Wochenende hin „meistens sehr voll" sind — die App selbst kann diese Auslastung nicht anzeigen (INT-002 liefert keine Kapazitätsfelder, siehe Nicht-Scope), das Risiko bleibt daher der Nutzerin überlassen.

**Wahlpflicht-Planungsmodus.** Die Chat-Auswertung zeigt durchgängig, dass die Terminfindung für Wahlpflichtmodule eigenständig schwierig ist: Studierende fragen wiederholt nach Modullisten, Empfehlungen für „einfache" Module und danach, wann ein Modul angeboten wird (`pi-8-semester-fh-informatik`, u. a. 2024-01-30, 2024-09-01, 2025-09-23, 2026-04-11; `praktische-informatik-ws-23-24`, u. a. 2025-09-15, 2025-09-19). Ein konkreter Beleg (`pi-8-semester-fh-informatik`, 2025-04-03) zeigt eine bestehende Lücke im Alt-App-Stundenplan selbst: Termine eines Wahlpflichtmoduls fehlten dort vollständig. Ursache ist vermutlich, dass INT-002 pro `{sname}/{grade}`-Paar abgefragt wird und Wahlpflichtmodule organisatorisch oft einem anderen Fachsemester zugeordnet sind als dem der Nutzerin. Ein weiterer Beleg (`informatik-pi-ti-ds-ws-24-25`, 2025-02-28) zeigt denselben Bedarf bei Wiederholerinnen: Um ihren Stundenplan zu planen, mussten sie erst selbst herausfinden, wann und wo eine zu wiederholende Veranstaltung stattfindet.

**Automatische Wahlpflicht-Liste statt manueller Fachsemester-Auswahl.** Die vorige Fassung ging davon aus, eine automatische Zuordnung „Wahlpflichtmodul → zuständiges Fachsemester" würde eine zusätzliche, gepflegte Datengrundlage voraussetzen, für die keine Evidenz vorlag — die Chat-Belege zeigten nur, dass Studierende diese Zuordnung selbst über Modulhandbuch bzw. Curricula-PDF nachschlagen (`pi-8-semester-fh-informatik`, 2024-01-30: `modulhandbuch.php`; `praktische-informatik-ws-23-24`, 2025-09-15: `Curricula.pdf`). Die Live-Prüfung vom 2026-08-26 widerlegt diese Annahme: Capability `integrations` dokumentiert mit `WFPB` eine vom Fachbereich selbst über FBWS gepflegte Sammelkategorie, die alle aktuell angebotenen Wahlpflichtmodule direkt liefert (27 Module zum Prüfzeitpunkt), inklusive der zulässigen Studiengänge/Vertiefungsrichtungen im Klartext. Entscheidung FSR FB4, 2026-08-26: die manuelle Fachsemester-Auswahl entfällt, ersetzt durch den automatischen Bezug — die App ruft `WFPB` automatisch ab, keine manuelle Fachsemester-Eingabe mehr nötig. Unverifiziert bleibt die Abdeckung für Master-Wahlpflichtfächer, siehe „Offene Fragen".

**Zeitfenster als weiche statt harte Einschränkung.** Aus der Rücksprache mit dem FSR FB4, 2026-08-25: Ein Termin außerhalb des gewünschten Zeitfensters ist unbequem, aber nicht per se unzulässig — anders als eine echte Terminkollision lässt er sich nicht automatisch als „geht nicht" behandeln. Konsistent mit dem in dieser Spec durchgängig verfolgten Grundsatz „sichtbar statt fälschlich verborgen" blendet die Kennzeichnung außerhalb des Zeitfensters einen solchen Termin daher nicht aus, sondern kennzeichnet ihn nur. Ob die Abweichung zusätzlich auf die Reihenfolge wirkt, war bis zum 2026-09-06 widersprüchlich geregelt: Diese Erläuterung behauptete es, das Reihungs-Requirement kannte das Zeitfenster als Größe gar nicht. Aufgelöst, indem das Zeitfenster ein Kriterium der Rangfolge wurde — die Nutzerin entscheidet über seine Stellung, ob und wie stark es die Reihenfolge bestimmt; abgeschaltet bleibt es eine reine Kennzeichnung. Anders als bei der bewussten Übernahme trotz Konflikt ist dafür keine gesonderte Bestätigungshandlung nötig, da keine echte Kollision vorliegt.

**Von Optimierungsmodi zur Kriterienrangfolge (2026-09-06).** Bis dahin wählte die Nutzerin einen von drei benannten Modi. Das trug nicht mehr: Erstens rechnete „ausgeglichener Tagesablauf" das Gegenteil seines Namens — er bevorzugte die Tagesspanne, die acht Stunden am nächsten kommt, und blähte damit an einem bisher kurzen Tag ausgerechnet den Tag auf. Zweitens kamen vier weitere Optimierungsziele hinzu, womit fünf Modusnamen keine sinnvolle Einteilung mehr waren. Drittens lässt sich der eigentliche Wunsch als Auswahl gar nicht ausdrücken: „möglichst wenige Fahrten, und dabei nach Möglichkeit Vorbereitungszeit" ist eine Rangfolge, keine Auswahl. Die Modi leben als benannte Voreinstellungen weiter, die die Rangfolge füllen.

| Kriterium | Gemessen wird | Besser ist |
|---|---|---|
| Uni-Tage | Zahl der Wochentage mit mindestens einem Termin | weniger |
| Anwesenheitszeit | Summe der Tagesspannen über die Woche | weniger |
| Gleichmäßige Woche | Unterschied zwischen den Tagesspannen der Uni-Tage | kleiner |
| Abstand zwischen Lerneinheiten | Nachbarabstand zum vorangehenden bzw. folgenden Termin | größer |
| Vorbereitungszeit | freie Zeit unmittelbar vor einem Termin, gegen den Zielwert seiner Veranstaltungsart | näher am Zielwert |
| Abstand Vorlesung–Übung | Zeit zwischen einer Vorlesung und dem zugehörigen Termin anderer Art derselben Veranstaltung | mindestens der eingestellte Abstand, in dieser Reihenfolge |
| Abwechslung | Zahl der Fälle, in denen an einem Tag Termine derselben Veranstaltungsart unmittelbar aufeinanderfolgen | weniger |
| Zeitfenster | ob der Termin im festgelegten Zeitfenster liegt | innerhalb |

**Warum streng der Reihe nach und nicht gewichtet.** Die Rangfolge wird lexikographisch ausgewertet: Das oberste eingeschaltete Kriterium entscheidet, erst bei Gleichstand zählt das nächste, ohne Toleranzbereich. Eine Punktegewichtung wurde verworfen, weil sich einer Nutzerin dann nicht mehr erklären lässt, warum ein Vorschlag oben steht, und weil ein hoch gewichtetes Kriterium von mehreren niedrigen überstimmt werden kann. Der Einwand, ein zweitrangiges Kriterium komme bei Minutenwerten nie zum Zug, greift in der Praxis schwächer als gedacht: Das in aller Regel oberste Kriterium — die Zahl der Uni-Tage — ist eine ganze Zahl, Gleichstände dort sind der Normalfall. Wer eine andere Abwägung will, ändert die Reihenfolge; genau dafür ist die Liste da (entschieden 2026-09-06).

**Zwei Randfestlegungen, ohne die Kriterien in die Irre laufen.** Bei der Vorbereitungszeit gilt der **erste Termin eines Tages als erfüllt** — wer den Tag mit dem Praktikum beginnt, bereitet zu Hause vor; ohne diese Regel würde das Kriterium frühe Termine systematisch benachteiligen und die Nutzerin zu späteren Anfangszeiten drängen. Beim Abstand Vorlesung–Übung gilt eine **Übung vor der zugehörigen Vorlesung als schlecht erfüllt**, unabhängig davon, wie viele Stunden dazwischenliegen — sonst würde ausgerechnet die Anordnung, in der Vorbereitung gar nicht möglich ist, als beste bewertet.

**Vorbereitungszeiten je Veranstaltungsart, nicht je Veranstaltung.** FBWS führt derzeit sechs Veranstaltungsarten, eigene Einträge eine siebte. Sieben Felder auszufüllen wäre eine lange Einrichtung, und eine künftige achte Art bliebe ohne Wert. Deshalb ein allgemeiner Zielwert plus Abweichungen für die Arten, bei denen es darauf ankommt — typischerweise Übung und Praktikum.

**Planungsauswahl mit Pflicht-Markierung statt Vollkombinatorik.** Aus der Rücksprache mit dem FSR FB4, 2026-08-25: Denkbar wäre auch ein Modus, der zusätzlich zu den Pflichtkursen mehrere gleichzeitig noch unentschiedene Wahlpflicht-Kandidaten entgegennimmt und alle Kombinationen daraus durchrechnet, um passende Konstellationen auszugeben. Diese Ausweitung wurde bewusst zurückgestellt — Begründung: die Ergebnisdarstellung würde bei mehr als wenigen gleichzeitig offenen Kandidaten schnell unübersichtlich, und der Zusatznutzen gegenüber dem hier gewählten schrittweisen Vorgehen erschien nicht klar genug, um die Komplexität zu rechtfertigen. Eine Vollkombinatorik über mehrere gleichzeitig unentschiedene Kandidaten bleibt eine mögliche spätere Erweiterung, siehe „Offene Fragen".

**Auflösung des Widerspruchs zum automatischen Vorschlag (2026-09-06).** Der am 2026-09-04 ergänzte automatische Planungsvorschlag verlangte dem Wortlaut nach genau die Kombinatorik, die hier zurückgestellt worden war, ohne diese Festlegung zu nennen — zwei Anforderungen, die sich widersprachen. Aufgelöst zugunsten der Zurückstellung: Der Vorschlag arbeitet **greedy**. Er geht die Kandidaten in einer festgelegten Reihenfolge durch und wählt für jeden den nach der Kriterienrangfolge besten Termin, der gegen den bis dahin aufgebauten Vorschlag frei ist. Die bekannte Grenze dieses Verfahrens ist ausdrücklich in Kauf genommen: Es kann eine Konstellation verfehlen, die bei anderer Bearbeitungsreihenfolge aufgegangen wäre. Der Preis dafür ist, dass das Ergebnis in einem Satz erklärbar bleibt („weniger Uni-Tage, bei gleicher Tageszahl kürzere Anwesenheit") und die Nutzerin über Rangfolge, „Pflicht" und Anpinnen nachsteuert, statt aus dutzenden Varianten zu wählen.

**„Pflicht" und „angepinnt" trennen Ob und Wann (2026-09-06).** Die Pflicht-Markierung trug bis dahin beides: Sie hielt fest, dass eine Veranstaltung gewählt ist, und diente zugleich als fixer Zeitpunkt, gegen den andere Kandidaten geprüft wurden. Das ist auseinandergezogen. **Pflicht** heißt nun: diese Veranstaltung muss im Plan bleiben; welcher ihrer Termine gewählt wird, bleibt der Planung überlassen — das *Ob*. **Angepinnt** heißt: dieser Zeitslot steht, die Optimierung fasst ihn nicht an — das *Wann*, etwa weil die eigene Lerngruppe zu diesem Termin geht. Daraus folgt unmittelbar, dass die Konfliktprüfung sich nicht mehr auf Pflicht-Markierungen stützen kann: Sie tragen keinen Zeitpunkt mehr. Geprüft wird gegen den übernommenen Plan und gegen angepinnte Termine.

**Die Optimierung ist ein Hilfsmittel, kein Zustand (2026-09-06).** Der Ausgangszustand ist die Einteilung nach Gruppenbuchstabe, ohne jede Optimierung; die Nutzerin stellt ihren Plan selbst zusammen und ruft die Optimierung auf, wenn sie sie braucht. Eine übernommene Optimierung ist über einen sichtbaren Weg zurücknehmbar — ohne Rückweg wird ein Knopf, der den ganzen Plan umstellen kann, aus Sorge vor Unumkehrbarkeit gar nicht erst gedrückt. Die Optimierung darf dabei jeden nicht angepinnten Termin auf einen anderen Gruppen-Slot derselben Veranstaltung umlegen, aber nie eine Veranstaltung weglassen; findet sie keine konfliktfreie Anordnung, zeigt sie die beste gefundene mit markiertem Konflikt und benennt die „Pflicht"-Markierung als Weg, den Vorrang zu bestimmen.

**Raumplan-Abgleich.** Der Fachbereich pflegt Termine im FBWS an zwei Stellen, die dieselben Veranstaltungen aus unterschiedlicher Richtung zeigen: der studiengangsbezogene Terminplan (INT-002), aus dem der Stundenplan entsteht, und der raumbezogene Raumplan (INT-009), den das Backend alle paar Minuten neu abruft (Capability `backend-and-api` API-F-045). Die App speichert den einmal angelegten Stundenplan lokal und aktualisiert ihn nicht von selbst — ein zwischenzeitlicher Raumwechsel im FBWS bleibt der Nutzerin daher verborgen. Der Raumplan-Abgleich schließt diese Lücke, indem er den lokal gespeicherten Termin gegen den frischen Raumplan hält. Der Abgleich läuft vollständig auf dem Gerät; das Backend liefert nur die Raumplan-Termine (Capability `backend-and-api` API-F-056), der Stundenplan verlässt das Gerät nicht (API-F-100).

**Korrektur vom 2026-09-04 (FBWS live abgefragt).** Die vorige Fassung hielt fest, INT-002 und INT-009 teilten keine gemeinsame Veranstaltungskennung, und baute die Zuordnung deshalb allein auf den Merkmalssatz Bezeichnung + Wochentag + Beginnzeit + `studentSet`. Das ist widerlegt: **beide** Bestände führen `courseId` — in INT-002 als offizielle Modulnummer (z. B. `42012` für „Algorithmen und Datenstrukturen", identisch mit der Modul-Nr. im Curricula-Bestand des Fachbereichs), in INT-009 bei allen Einträgen mit `eventType: "Course"`. Der Raumplan-Abgleich nutzt daher `courseId` als vorrangigen Schlüssel; der Merkmalssatz bleibt als Rückfall für Einträge ohne `courseId` (in INT-009 die Einzelbuchungen mit `eventType: "Event"`). Damit entfällt der größte Teil des Mehrdeutigkeitsrisikos; die verbleibende Trennschärfe ist vor Umsetzung an echten Daten zu prüfen (siehe „Offene Fragen").

Die Anforderung zum Raumabweichungs-Hinweis fordert bewusst „unter keiner der geführten Raumkennungen": Eine Veranstaltung, die regulär parallel in zwei Räumen läuft (belegt für „Lern- und Arbeitstechniken", siehe „Offene Fragen" und Capability `integrations` INT-002), darf keinen Fehlalarm auslösen, wenn der eigene gespeicherte Raum einer der beiden ist.

**Der Raumplan-Abgleich ist ein ausdrücklich experimentelles Feature (entschieden 2026-09-06).** Er darf unvollständig sein und wird gebaut, weil er möglich ist — nicht, weil seine Datengrundlage gesichert wäre. Zwei Folgerungen daraus stehen in den Requirements: Der Hinweis muss benennen, **woher** er stammt (die Raumreservierung des Fachbereichs), damit niemand ihn für eine amtliche Auskunft hält; und er muss die Rangfolge der Quellen nennen — der offizielle Prüfungsplan und „FB-Aktuelles" stehen über der Raumreservierung.

Der Hinweis ist bewusst schwach: Er ändert den Eintrag nicht, verschwindet bei deutlich veraltetem Raumplan und nennt Prüfungsplan und „FB-Aktuelles" als die Stellen, an denen eine Raumänderung verbindlich steht. Die Veraltungsschwelle wurde am 2026-09-06 korrigiert: Sie lag zuvor bei der Aktualisierungsfrequenz selbst, womit der Zwischenspeicher bei einem Abruf alle paar Minuten fast immer als veraltet gegolten hätte und der ganze Block praktisch immer stumm gewesen wäre. Sie liegt jetzt beim Vierfachen der Frequenz, mindestens 30 Minuten — das trifft den gemeinten Fall: nicht „eine Runde verpasst", sondern „das Backend holt seit Längerem nichts mehr". Ob INT-009 kurzfristige Änderungen überhaupt trägt, ist offen — dieselbe Frage wie in Capability `room-finder`, „Offene Fragen".

**Deaktivieren statt Status „fest"/„vorgemerkt".** Aus der Rücksprache mit einer studierenden Person, 2026-09-04: Studierende tragen sich bewusst zwei Veranstaltungen zur selben Uhrzeit ein — um vor Ort zu entscheiden, welche der beiden Gruppen weniger voll ist; um sich einen Termin zu merken, den sie nur gelegentlich brauchen; oder um bei einer echten Kollision beide der Vollständigkeit halber im Blick zu behalten. Die ursprünglich dafür eingeführte Zweiteilung „fest"/„vorgemerkt" (Rücksprache vom 2026-09-04) erwies sich am Gerät als zu viel Bedienoberfläche für zu wenig Ertrag: eine Zuordnungsregel im Planungsmodus, ein „als fest festlegen"-Bedienweg je Zeile, eine dritte Konfliktstufe und eine eigene Kennzeichnung in der Wochenansicht, um einen einzigen Fall abzudecken. Entscheidung vom 2026-09-08 (Issue #62): An die Stelle des Status tritt das Deaktivieren, das die Alt-App unter `action_toggle_cancel` bereits kennt (`TimetableDayFragment.java:146-171`) und das ohne Zuordnungsregel auskommt. Ein deaktivierter Termin bleibt im Plan, ist aber vollständig stumm — er erzeugt keinen Konflikthinweis, zählt nicht als laufender oder nächster Termin und geht in keinen Export ein. Zwei Reichweiten stehen zur Wahl: dauerhaft, bis die Nutzerin es zurücknimmt, oder allein für das nächste Vorkommen (danach von selbst wieder aktiv, wie bei der Alt-App). Der Planungsmodus kennt den Zustand nicht — dort geht es um die Zusammenstellung, nicht um die Wahrnehmung; wer zwei Gruppen-Slots gleichzeitig übernimmt, deaktiviert danach in der Wochenansicht denjenigen, den er nicht wahrnehmen will. Das Deaktivieren ersetzt nicht `akzeptierterKonflikt`: dort geht die Person bewusst zu beiden kollidierenden Terminen, hier hält sie sich eine Entscheidung offen.

**Wochentagsleiste und Datumsbezug.** Beide Alt-Apps kennen nur Wochentage ohne Datum; der Plan sieht in jeder Woche des Jahres gleich aus. Entscheidung nach Rücksprache, 2026-09-04: echte Kalenderwochen. Das ist ohne zusätzliche Integration möglich, weil INT-002 je Termin `dateBegin`/`dateEnd` liefert (Live-Prüfung 2026-09-04, siehe Capability `integrations`) — daraus folgt die Anzeige nur im Gültigkeitszeitraum, die Veranstaltungen mit begrenztem Zeitraum nur in den zutreffenden Wochen zeigt. Für die Kennzeichnung vorlesungsfreier Wochen genügen zunächst Semesterbeginn und -ende aus den Stammdaten (API-F-230); vorlesungsfreie Einzeltage und Feiertage liefert derzeit keine Quelle, siehe „Offene Fragen". Die Wochentagsleiste verlangt eine Leiste statt eines Blätterwegs, weil der Blick darauf die Frage „was liegt die restliche Woche an" schon beantworten soll. Samstage sind aufgenommen, obwohl der geprüfte FBWS-Bestand keine führt: eigene Termine sind an jedem Wochentag anlegbar. Die anfangs mitgeführte Belegungsvorschau (Terminanzahl je Tag) ist am 2026-09-08 entfallen (Issue #62): Sie beantwortete keine Frage, die sich beim Blick auf die Leiste stellt, und drängte Wochentag und Datum in eine kleinere Schriftgröße, während die Leiste zugleich die volle Bildschirmbreite füllen soll.

**Zeitachse und „Jetzt".** Die proportionale Achse macht Freistunden und Überschneidungen sichtbar, die eine reine Liste nur über die Uhrzeiten preisgibt; sie trägt damit die Konflikthinweis-Anforderung und den Planungsmodus mit. Auf ausdrücklichen Wunsch bleibt sie abschaltbar, weil eine kompakte Liste mehr Termine je Bildschirm zeigt. Die Anzeigen zum laufenden/nächsten Termin beantworten die Frage „was kommt als Nächstes" ohne Suchen im Plan.

**Kursbasierte Auswahl.** Die Live-Prüfung vom 2026-09-04 ergab 121 Termine für ein einzelnes Fachsemester (`INPBPI/2`) und 161 für die Wahlpflicht-Sammelkategorie. Eine flache Auswahlliste einzelner Termine, wie sie beide Alt-Apps und die vorige Fassung der Anlege-Auswahl vorsehen, ist in dieser Größenordnung nicht bedienbar. Die dreistufige Gliederung Veranstaltung → Veranstaltungsart → Gruppen-Slot bildet zugleich ab, wie Studierende denken, und deckt drei bisher getrennte Anforderungen in einem Bedienweg ab: die Auswahl selbst, die Einsicht in Termine anderer Gruppen und deren Übernahme. Die Abwahl-Anforderung trägt den Fall, dass eine Person Praktikum oder Übung einer Veranstaltung bewusst auslässt; die Mehrfach-Slot-Anforderung den Fall zweier gleichzeitig geführter Gruppen-Slots. Die Erweiterung um weitere Fachsemester ersetzt in der Sache die entfallene Anforderung zur manuellen Fachsemester-Auswahl: die Wahlpflicht-Zuordnung leistet zwar `WFPB`, das Problem der Wiederholerinnen und Vorzieherinnen — eine Veranstaltung aus einem anderen Fachsemester im eigenen Plan — bleibt davon jedoch unberührt. Die automatische Farbzuweisung vergibt Farben selbsttätig, damit ein frisch angelegter Plan ohne Handarbeit lesbar ist; die Textfarbe folgt daraus nach UX-F-040 und UX-N-010.

**Gruppenkennung ohne Ratespiel.** Bis zum 2026-09-04 war ungeklärt, was eine Studierende überhaupt als Gruppenkennung eintragen soll; die Werte im FBWS-Bestand legten eine Zuordnung nach Nachnamen nahe, der Zahlenteil blieb unerklärt. Der Hinweis einer studierenden Person vom selben Tag löst das auf zwei Wegen auf. Erstens gibt es einen Endpunkt, der die Kennung zu einer Matrikelnummer direkt liefert (INT-019) — der bequemste Weg. Zweitens gilt in der Praxis: **der Buchstabe ist die maßgebliche Angabe, die Zahl wird so gut wie nie gebraucht.** Deshalb ist das Eingabeformat von `^[A-Z][0-9]+$` auf `^[A-Z][0-9]*$` erweitert — die Zahl ist freiwillig. Das erweitert nur, was zulässig ist: jede bisher gültige Eingabe bleibt gültig, `C8` also unverändert. Es passt außerdem zum beobachteten Datenbestand, in dem Einzelwerte durchweg aus einem Buchstaben ohne Zahl bestehen (`A`, `B`, `C`, `D`) und die Zahl nur an Bereichsgrenzen überhaupt eine Rolle spielt (`C5-E`, `J-M4`).

Die Bestätigungs-Anforderung ist keine Höflichkeit, sondern eine Notwendigkeit: INT-019 beantwortet auch offensichtlich ungültige Nummern mit einer plausibel aussehenden Kennung (belegt für `0000000` → `B3` und `9999999` → `A9`) und meldet eine unbekannte Nummer nicht als Fehler, sondern mit Status 200 in einer von zwei stillen Gestalten — `{"fhDoStudentSet":false}` oder `[]`. Eine erfolgreiche Antwort belegt damit nicht, dass die eingegebene Nummer die eigene ist; eine stillschweigende Übernahme würde einen Tippfehler in einen wochenlang falschen Stundenplan verwandeln. Die Auswertung prüft auf eine nicht-leere Zeichenkette, nicht auf Vorhandensein des Feldes — `false` ist ebenso falsy wie `undefined`, aber nur eine Zeichenkette ist eine Kennung. Die Anforderung zur lokalen Speicherung der Matrikelnummer zieht die datenschutzrechtliche Grenze: Die Matrikelnummer ist personenbeziehbar, sie bleibt auf dem Gerät und geht an keinen anderen Empfänger — insbesondere nicht an das eigene Backend, im Einklang mit API-F-100 und Capability `security-and-privacy`.

**Eigener Eintrag: wiederkehrend oder einmalig.** Die Alt-Apps kennen nur wochentagsgebundene Einträge ohne Datum; ein eigener Eintrag war dort zwangsläufig „jede Woche". Mit dem Datumsbezug entsteht eine Lücke, die vorher nicht existierte: Eine Lerngruppe jeden Dienstag und ein einmaliger Beratungstermin am 17. Oktober sind zwei verschiedene Dinge, die bisher gleich behandelt würden. Die entsprechende Anforderung schließt sie. Bei wiederkehrenden Einträgen wirkt der Gültigkeitszeitraum wie bei offiziellen Terminen; bei einmaligen fallen Beginn und Ende des Zeitraums auf dasselbe Datum.

**Verallgemeinerung des Planungsmodus.** Der Planungsmodus war bis zur Fassung 2.1.0 auf Wahlpflichtmodule zugeschnitten. Aus der Rücksprache vom 2026-09-04: die Terminkollision einer Wiederholerin zwischen zwei Fachsemestern ist dasselbe Problem wie die Kollision eines Wahlpflichtmoduls — es gibt keinen sachlichen Grund, die Kollisionsprüfung, das Zeitfenster und die Optimierungsmodi nur der einen Gruppe anzubieten. Die Requirements zu Kandidat, Konfliktprüfung, Planungsauswahl, Pflicht-Markierung und Konfliktprüfung gegenüber Pflicht-Kandidaten sprechen deshalb von „Kandidat" statt „Wahlpflichtmodul". Der automatische Planungsvorschlag zieht daraus die Folgerung für den gesamten Plan: statt Kandidat für Kandidat einzeln zu entscheiden, kann die Nutzerin einen Vorschlag erzeugen lassen. Er bleibt ein Vorschlag — sie sieht ihn vor der Übernahme und ändert ihn einzeln; die Zurückstellung der Vollkombinatorik über mehrere unentschiedene Kandidaten bleibt davon unberührt.

## Datenmodell

Jeder Termin des persönlichen Plans, offiziell wie eigen, trägt zusätzlich `deaktiviertBis: null | 'dauerhaft' | number` (`null` = aktiv; `'dauerhaft'` = bis zur Rücknahme; Unix-Sekunden = bis zu diesem Zeitpunkt deaktiviert, danach wieder aktiv), `angepinnt: boolean` (von der Optimierung nicht umzulegen), eine Farbe und einen Gültigkeitszeitraum `gueltigVon`/`gueltigBis` (bei eigenen Terminen offen, sofern nicht angegeben).

Termin (offiziell): siehe INT-002-Felder in Capability `integrations`, ergänzt um Kennzeichnung `istOffiziell: true`, `gruppenzugehoerig: boolean`, `abweichendeGruppe: boolean` (Termin einer anderen Gruppe übernommen statt des eigenen), `ausWahlpflicht: boolean` (aus der Wahlpflicht-Sammelkategorie statt aus dem eigenen Fachsemester übernommen), `ausFremdemFachsemester: boolean` und `akzeptierterKonflikt: boolean`.

Termin (eigen): Titel, Wochentag, Beginnzeit, Endzeit, `istOffiziell: false`, `istPruefung: boolean` sowie `wiederkehrend: boolean` (bei `false` fallen `gueltigVon` und `gueltigBis` auf dasselbe Datum). Kein Bezug zu INT-002-Feldern wie `courseType`, `lecturerName`, `studentSet`.

Matrikelnummer (flüchtig, freiwillig): wird ausschließlich für den Abruf nach INT-019 verwendet und **nicht gespeichert** — weder auf dem Gerät noch serverseitig. Persistiert wird allein die daraus ermittelte und bestätigte Gruppenkennung; die Einrichtung ist auch ohne Matrikelnummer abschließbar.

Auswahlbestand (flüchtig, nicht persistiert): die aus INT-002 abgerufenen Termine des eigenen Fachsemesters, der zusätzlich gewählten Fachsemester und der Wahlpflicht-Sammelkategorie, verdichtet zu Veranstaltung → Veranstaltungsart → Gruppen-Slot. Persistiert wird nur, was die Nutzerin daraus übernimmt.

Ansichtseinstellungen (lokal): Zeitachse oder kompakte Liste, gruppenfremde Termine ausblenden, alle Filter abschalten („Alle anzeigen"), Sprung zum aktuellen Wochentag.

Prüfungsauswahl (lokal): Referenz auf einen Eintrag des vom Backend abgeleiteten Prüfungsbestands (Rohquelle INT-009), rein gerätegespeichert — kein serverseitiges Pendant.

Planungsauswahl (lokal): eine Liste gewählter Kandidaten, je Eintrag ein `pflicht: boolean`-Flag (die Veranstaltung muss im Plan bleiben — eine Aussage über das *Ob*, nicht über den Zeitslot) sowie der übernommene bzw. vorgeschlagene Termin samt Konfliktstatus und `innerhalbZeitfenster: boolean`, rein gerätegespeichert — kein serverseitiges Pendant, gleiche Begründung wie bei der Prüfungsauswahl (API-F-100). Planungseinstellungen (lokal): Zeitfenster (früheste Beginnzeit, späteste Endzeit), die geordnete Kriterienrangfolge samt an-/abgeschalteter Kriterien, der allgemeine Zielwert für die Vorbereitungszeit und die davon abweichenden Werte je Veranstaltungsart sowie der Mindestabstand Vorlesung–Übung, ebenfalls rein gerätegespeichert.

Gemeinsame Persistenz aller vier Datenarten: Capability `data-and-storage`, DATA-F-010.

Raumplan-Abgleich (lokal, berechnet): je offiziellem Termin ein Status `übereinstimmend` | `raumabweichung` (mit abweichender Raumkennung) | `nicht_zugeordnet`, hergeleitet aus dem Vergleich mit den zwischengespeicherten Raumplan-Terminen. Rein geräteseitig, kein serverseitiges Pendant; keine Persistenz über den aktuellen Raumplan-Stand hinaus nötig.

## Externe Schnittstellen

Nutzt INT-001 (FBWS Studiengänge) für die Studiengangs-/Semesterauswahl, INT-019 (FBWS Gruppenkennung zur Matrikelnummer) für die Ermittlung der Gruppenkennung, INT-002 (FBWS Termine) für den Terminabruf und den vom Backend (INT-008) aus dem Raumplan abgeleiteten Prüfungsbestand für die Prüfungsauswahl. Für den Planungsmodus ruft die App INT-002 zusätzlich für die FBWS-Sammelkategorie der Wahlpflichtmodule ab — technisch derselbe Endpunkt, keine neue Integration. Für den Raumplan-Abgleich ruft die App zusätzlich die zwischengespeicherten Raumplan-Termine über das Backend ab (INT-008, `openspec/specs/api-contract.yaml` `/raumplan/termine`, API-F-056); die Rohquelle ist INT-009, kein direkter FBWS-Aufruf aus der App. Keine weiteren Endpunktdetails hier — siehe Capability `integrations` und `openspec/specs/api-contract.yaml`.

## UI-Flows & Zustände

| Zustand | Verhalten |
|---|---|
| Laden | Ladeanzeige während des INT-002-Abrufs, bestehende lokale Termine bleiben währenddessen sichtbar |
| Leer (kein Studiengang gewählt) | Hinweis auf die Studiengangsauswahl als nächsten Schritt |
| Leer (ein Filter wirkt) | Tag als leer gekennzeichnet, der wirksame Filter als Grund genannt (z. B. „keine Termine für Gruppe X an diesem Tag"), mit Hinweis auf den zugehörigen Schalter |
| Fehler | Fehlermeldung mit Wiederholen-Option, zuletzt geladene Termine bleiben sichtbar (siehe Capability `architecture` ARCH-F-130) |
| Offline | Zuletzt geladener Stand wird angezeigt, siehe „Offline-Verhalten" |
| Planungsmodus: kein konfliktfreier Termin | Expliziter Hinweis „keine konfliktfreie Terminoption für dieses Modul"; Möglichkeit zur bewussten Übernahme trotz Konflikt wird angeboten |
| Automatischer Vorschlag ohne konfliktfreie Konstellation | Beste gefundene Anordnung mit markiertem Konflikt, Nennung der beteiligten Veranstaltungen und Hinweis auf die „Pflicht"-Markierung |
| Optimierung zurückgenommen | Termine der eigenen Gruppe wiederhergestellt; angepinnte und eigene Termine unverändert |
| Angepinnter Termin | Als angepinnt erkennbar; von der Optimierung unangetastet |
| „Alle anzeigen" aktiv | Sämtliche Filter abgeschaltet, alle Termine des Plans sichtbar; der Zustand ist als solcher erkennbar |
| Planungsmodus: Termin außerhalb des Zeitfensters | Termin bleibt wählbar, zusätzlich sichtbar als „außerhalb des bevorzugten Zeitfensters" gekennzeichnet, keine gesonderte Bestätigung nötig |
| Raumabweichung für einen Termin erkannt | Kleiner Hinweis am Eintrag mit der abweichenden Raumkennung, Eintrag sonst unverändert |
| Termin im Raumplan nicht auffindbar | Kleiner Hinweis „im Raumplan nicht gefunden — evtl. Ausfall oder Verlegung", Eintrag unverändert |
| Raumplan-Stand veraltet oder nicht abrufbar | Kein Abweichungshinweis; falls veraltet, Alter des Raumplan-Stands sichtbar |
| Angezeigte Woche außerhalb der Vorlesungszeit | Woche als vorlesungsfrei gekennzeichnet, Plan nicht als regulär dargestellt; Rückweg zur laufenden Woche angeboten |
| Wochentag ohne Termine, ohne aktive Gruppenfilterung | Tag als frei gekennzeichnet — abzugrenzen vom Fall der Gruppenfilterung, der diese als Grund nennt |
| Zwei feste Termine überschneiden sich | Beide nebeneinander dargestellt, beide mit Konflikthinweis; kein Termin wird verschoben oder ausgeblendet |
| Überschneidung wurde bewusst angenommen | Beide nebeneinander dargestellt, kein Konflikthinweis, stattdessen die Kennzeichnung „angenommener Konflikt" |
| Aktiver und deaktivierter Termin überschneiden sich | Beide nebeneinander dargestellt, kein Konflikthinweis |
| Kursauswahl: Suche oder Filter ohne Treffer | Leerzustand mit Nennung des wirksamen Filters und einem Weg, ihn zurückzunehmen (UX-F-110) |
| Gruppenkennung schließt keinen einzigen Termin ein | Rückmeldung „0 von N Terminen" unmittelbar bei der Eingabe, Eingabe wird nicht verworfen |
| INT-019 antwortet ohne Kennung — leere Liste `[]` **oder** `{"fhDoStudentSet":false}` | Beide gleich behandeln: Hinweis „zu dieser Matrikelnummer ist keine Gruppe hinterlegt", Eingabe bleibt stehen, manuelle Angabe wird angeboten |
| INT-019 nicht erreichbar | Hinweis mit Wiederholen-Option; manuelle Angabe von Buchstabe und Zahl bleibt jederzeit möglich, die Einrichtung ist dadurch nicht blockiert |
| Gruppenkennung liegt ohne Zahl vor (Altbestand oder unerwartete INT-019-Antwort) | Termine an Bereichsgrenzen mit Zahl als zugehörig behandeln, Vorfall protokollieren (SEC-F-060), Nachtrag der Zahl anbieten |
| Nach der Matrikelnummer-Ermittlung erhaltene Kennung wird von der Nutzerin abgelehnt | Kennung wird nicht übernommen, Eingabefeld für die manuelle Angabe erhält den Fokus |

## Offline-Verhalten

Der Stundenplan ist einer der drei in Capability `architecture` (ARCH-F-100) benannten Bereiche mit garantiertem Offline-Zugriff auf den zuletzt geladenen Stand. Eigene Termine sind ausschließlich lokal gespeichert (DATA-F-010) und daher unabhängig vom Netzzugriff jederzeit verfügbar.

## Fehlerfälle

| Fall | Reaktion |
|---|---|
| INT-001 liefert keinen zur vorherigen Auswahl passenden Studiengang mehr (z. B. nach Umbenennung) | Hinweis anzeigen, erneute Auswahl anbieten |
| INT-002 liefert ein `studentSet`, das keinem der Muster aus der Beispieltabelle entspricht | Termin als gruppenzugehörig behandeln (sicherer Rückfall: sichtbar statt fälschlich als fremd markiert), Vorfall protokollieren (SEC-F-060) |
| Kalenderberechtigung wird verweigert | Vorgang offen halten und beide Auswege anbieten: Weg in die Systemeinstellungen der App und Datei-Export |
| INT-001 nicht erreichbar | Rückfallliste des Backends verwenden, Alter der Liste sichtbar machen |
| Eigener Termin überschneidet sich zeitlich mit einem offiziellen Termin | Beide Termine anzeigen, zusätzlich sichtbarer Konflikthinweis, keine automatische Konfliktauflösung |
| Raumplan-Termine nicht abrufbar | Stundenplan normal anzeigen, keinen Abgleichhinweis zeigen, kein Fehler in der Stundenplanansicht |
| Mehrere Raumplan-Termine passen mehrdeutig auf denselben Stundenplan-Termin | Keinen Abweichungshinweis erzeugen (sicherer Rückfall), Vorfall protokollieren (SEC-F-060) |
| INT-002 liefert zwei oder mehr deckungsgleiche Rohtermine (gleiche Veranstaltung, Art, Wochentag, Zeitraum, Raum und Gruppenmenge) | Vor der Darstellung zu einem einzigen Termin zusammenfassen, Vorfall protokollieren (SEC-F-060); bei abweichendem Raum bleiben die Termine getrennt |

## Nicht-funktionale Anforderungen (Register)

Diese Capability führt keine eigenen nicht-funktionalen Anforderungen mehr. Es gelten die querschnittlichen Werte der Capability `non-functional`, insbesondere NFR-N-040 für die Reaktionszeit beim Blättern zwischen Wochentagen. Das vormalige SCHED-N-010 ist am 2026-09-06 entfallen, siehe „Entfallene Anforderungen (historisch)".

## Akzeptanzkriterien

- Alle Beispielszenarien aus der Beispieltabelle Gruppenzuordnung (keine Gruppenkennung, Einzelwert, Wildcard, Bereich mit Gruppen innerhalb/außerhalb/an den Grenzen, Bereich mit offener Grenze) liefern das in den Requirements festgelegte Ergebnis.
- Eigene und offizielle Termine sind in der Darstellung eindeutig unterscheidbar und beide über einen sichtbaren Bedienweg löschbar.
- Der automatische Sprung zum aktuellen Wochentag berücksichtigt Wochenenden korrekt.
- Eine aus dem Prüfungsplan ausgewählte Prüfung sowie eine eigen eingetragene Prüfung sind beide eindeutig als Prüfung erkennbar.
- Eine Änderung an einer ausgewählten Prüfung führt zu einer Benachrichtigung, eine Änderung an einer nicht ausgewählten Prüfung nicht.
- Eine zeitliche Überschneidung eigener und offizieller Termine ist als solche sichtbar, nicht nur an der Uhrzeit ablesbar.
- Der Export enthält je nach getroffener Auswahl ausschließlich die gewählten Terminarten; eine erneute Änderung des Plans erfordert einen erneuten manuellen Export beziehungsweise eine erneute Übertragung, da keine Synchronisation stattfindet.
- Kalenderübertragung und Datei-Export stehen gleichrangig zur Wahl; bei verweigerter Berechtigung bricht der Vorgang nicht ab, sondern bietet den Weg in die Systemeinstellungen und den Datei-Export an.
- Gruppenfremde Termine sind standardmäßig sichtbar und als solche erkennbar; der Schalter blendet sie aus und wieder ein.
- Der Schalter „Alle anzeigen" schaltet sämtliche Filter zugleich ab und zeigt alle Termine des Plans; nach dem Zurücknehmen wirken die vorherigen Filtereinstellungen unverändert weiter.
- Ein bewusst angenommener Konflikt erzeugt keinen wiederkehrenden Warnhinweis mehr, sondern trägt allein die Kennzeichnung „angenommener Konflikt".
- Beim Anlegen des offiziellen Stundenplans lässt sich auswählen, welche Termine übernommen werden.
- Eine Nutzerin kann für eine Pflichtveranstaltung den Termin einer anderen Gruppe einsehen und anstelle des eigenen Gruppentermins übernehmen, weiterhin als offizieller Termin erkennbar.
- Für ein gewähltes Wahlpflichtmodul mit mehreren parallelen Terminen zeigt das System korrekt an, welche Termine konfliktfrei sind und welche nicht.
- Existiert für ein gewähltes Wahlpflichtmodul kein konfliktfreier Termin, erhält die Nutzerin einen expliziten Hinweis statt einer stillschweigend leeren Auswahl, und kann optional bewusst einen Konflikt akzeptieren.
- Termine außerhalb des festgelegten Zeitfensters werden sichtbar gekennzeichnet, aber nicht ausgeblendet.
- Bei mehreren konfliktfreien Terminen steht die nach der eingestellten Kriterienrangfolge günstigste Option zuerst; das oberste eingeschaltete Kriterium entscheidet, erst bei Gleichstand das nächste.
- Eine gewählte Voreinstellung füllt die Kriterienrangfolge sichtbar und lässt die übrigen Kriterien abgeschaltet; die Reihenfolge bleibt danach von Hand änderbar.
- Eine als „Pflicht" markierte Veranstaltung bleibt in jedem erzeugten Vorschlag enthalten, auch wenn sich ihr Termin ändert.
- Ein angepinnter Termin bleibt bei jeder Optimierung an seinem Zeitslot; nicht angepinnte Termine dürfen auf einen anderen Gruppen-Slot derselben Veranstaltung wandern, ohne dass eine Veranstaltung wegfällt.
- Die Konfliktprüfung eines Kandidaten läuft gegen den übernommenen Plan und die angepinnten Termine; zwei gleichzeitig unentschiedene Kandidaten werden nicht gegeneinander geprüft.
- Existiert keine konfliktfreie Konstellation, erscheint die beste gefundene mit markiertem Konflikt und der Nennung der beteiligten Veranstaltungen, nicht eine leere Meldung.
- Eine übernommene Optimierung lässt sich zurücknehmen; danach stehen wieder die Termine der eigenen Gruppe, angepinnte und eigene Termine unverändert.
- Ein offizieller Termin, dessen Raum im aktuellen Raumplan abweicht, trägt im Stundenplan einen Hinweis mit der abweichenden Raumkennung, ohne dass der Eintrag selbst verändert wird.
- Ein offizieller Termin, der im Raumplan nicht auffindbar ist, trägt einen Hinweis auf möglichen Ausfall oder Verlegung.
- Eine regulär in zwei Räumen parallel angebotene Veranstaltung löst keinen Abweichungshinweis aus, solange der gespeicherte Raum einer der beiden ist.
- Ein einzelner ausgelassener Raumplan-Abruf lässt die Hinweise unberührt; erst jenseits des Vierfachen der Aktualisierungsfrequenz (mindestens 30 Minuten) erscheint statt eines Abweichungshinweises das Alter des Stands.
- Jeder Raumhinweis nennt die Raumreservierung als Quelle und verweist auf Prüfungsplan und „FB-Aktuelles" als vorrangige Quellen.
- Die Wochentagsleiste zeigt Montag bis Freitag; ein Samstag erscheint genau dann, wenn an ihm ein Termin liegt, und verschwindet, sobald der letzte entfernt ist.
- Jeder Wochentag trägt das Datum der angezeigten Woche; ein Blättern in die Vorwoche und zurück führt zum selben Stand.
- Eine Veranstaltung, deren Gültigkeitszeitraum in der Wochenmitte endet, erscheint in der letzten zutreffenden Woche und in der darauffolgenden nicht mehr.
- Zwei sich überschneidende Termine sind beide sichtbar, einzeln antippbar und werden nicht übereinander gezeichnet.
- Ein deaktivierter Termin ist ohne Farbwahrnehmung als solcher erkennbar und erzeugt keinen Konflikthinweis; nach der Rücknahme der Deaktivierung erscheint der Hinweis wieder.
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
- Die Einrichtung lässt sich vollständig ohne Angabe einer Matrikelnummer abschließen; eine Gruppenkennung aus nur einem Buchstaben wird dabei als unvollständig zurückgewiesen.
- Liegt dennoch eine Kennung ohne Zahl vor, verschwindet kein Termin: An einer Bereichsgrenze mit Zahl gilt er als zugehörig und der Vorfall wird protokolliert.
- Die Matrikelnummer erscheint in keiner Anfrage an das eigene Backend und ist nach Abschluss der Einrichtung nirgends gespeichert; die bestätigte Gruppenkennung überlebt den Neustart.
- Ein eigener Eintrag lässt sich als wöchentlich wiederkehrend anlegen und erscheint dann in jeder Woche des Zeitraums; ein einmaliger Eintrag erscheint nur in der Woche seines Datums.

## Bewusst nicht übernommenes Altverhalten

- Fehlerhafter Gruppenabgleich bei Einzelwert-`studentSet` (Zahl-statt-Buchstabe-Vergleich) — Grund: Vergleich schlägt praktisch immer fehl, siehe Erläuterung zur Einzelwert-Anforderung.
- Ändern/Entfernen eigener Termine ausschließlich über langes Drücken erreichbar — Grund: nicht auffindbar ohne Vorwissen, siehe Capability `ux-and-theming` UX-F-090.
- Bei unerwarteter lokaler Datenmenge wird der gesamte Stundenplan kommentarlos gelöscht und neu angelegt — Grund: Datenverlust ohne Rückfrage, siehe Capability `data-and-storage` DATA-F-020.
- Gruppenfremde Termine allein durch abgeschwächte Farbe markieren, ohne Text oder Symbol — Grund: für Menschen mit Farbsinnstörung nicht unterscheidbar, siehe Capability `ux-and-theming` UX-F-080.
- Wildcard-`studentSet` als gruppenfremd behandeln — Grund: kehrt die Bedeutung um, siehe Wildcard-Befund in den Erläuterungen.

## Offene Fragen

- Die Anforderung zum Semesterwechsel-Hinweis erkennt einen Semesterwechsel durch Abgleich der `grade`-Liste des gewählten Studiengangs aus INT-001 gegen den zuletzt gespeicherten Stand — zuverlässiger als ein festes Kalenderdatum, da Semesterstart-Termine variieren, und ohne zusätzliche manuelle Nutzerangabe.
- Gegenstandslos seit 2026-09-06: Format der Prüfungsplan-Excel-Datei. Der manuelle Excel-Import ist entfallen, der Prüfungsbestand wird aus dem Raumplan abgeleitet; INT-013 ist als REMOVED geführt, die Formatanalyse dort erhalten.
- Zweiwöchentliche Veranstaltungen: Teilweise beantwortet 2026-08-26 (Live-Prüfung aller aktuell angebotenen Studiengang/Fachsemester-Kombinationen, siehe Capability `integrations` INT-002): `interval` ist im gesamten aktuellen Bestand ausschließlich `weekly`. Die als Beispiel genannte Veranstaltung „Lern- und Arbeitstechniken" ist wöchentlich, kein Beleg für den Zweiwochen-Fall. Ob `interval` überhaupt einen anderen Wert führen kann, bleibt unverifiziert, bis eine tatsächlich zweiwöchentliche Veranstaltung im Bestand auftaucht — bei Umsetzung erneut zu prüfen.
- Beantwortet 2026-09-04: „Lern- und Arbeitstechniken" wird parallel in zwei Räumen mit identischem `studentSet` angeboten (`courseId 411031`). Der Curricula-Bestand des Fachbereichs (`resources/Curricula.pdf`, Stand 24.07.2026) führt die Modulnummer `411031` als „Lern- u. Arbeitstechniken/Studium Generale/Mentoring" — ein Bündel dreier Angebote unter einer Modulnummer. Die zwei parallelen Räume sind damit zwei verschiedene Angebote, kein Datenfehler und keine Mehrdeutigkeit. Die App zeigt beide Varianten nebeneinander; ein Scheinkonflikt entsteht nicht, solange höchstens eine davon aktiv ist — die andere lässt sich deaktivieren. Welche der drei Teilveranstaltungen eine einzelne Person besucht, bleibt ihre Auswahl. Ergänzt 2026-09-08 (Issue #62, Requirement „Zusammenfassen deckungsgleicher Rohtermine"): Der Bestand liefert daneben auch echte Duplikate — Termine, die sich in **keinem** Merkmal unterscheiden, nicht einmal im Raum (belegt für `courseId 44232`). Die Abgrenzung zu diesem Fall bleibt der Raum: Zwei Termine, die sich allein darin unterscheiden, sind zwei Angebote wie hier beschrieben und bleiben getrennt; stimmen sie auch im Raum überein, ist es keine Mehrdeutigkeit, sondern ein Datenduplikat, das vor der Darstellung zusammengefasst wird.
- Beantwortet am 2026-09-04: Welche Bedeutung hat der Zahlenteil einer Gruppenkennung (`C5`, `M4`)? Die Zuteilung ist über INT-019 zur Matrikelnummer abrufbar, und in der Praxis zählt der Buchstabe, die Zahl wird so gut wie nie gebraucht. Offen bleibt allein, wie der Fachbereich die Zuteilung intern bildet — für die App ohne Belang, da sie die Kennung nicht selbst herleiten muss.
- Beantwortet 2026-09-06: Prüfungstermine erscheinen in INT-009 als Einträge mit `eventType: "Event"` und dem Namensmuster `Prüfung <Modulnummer> <Bezeichnung>`. Entschieden, sie als alleinige Quelle zu nutzen; der zweistufige manuelle Import entfällt. **Offen bleibt**, ob dieser Bestand vollständig und rechtzeitig gepflegt wird — der INT-009-Spike vor Roadmap-Schritt 6 prüft das mit. Findet er eine Lücke, ist das eine neue Entscheidung, kein stiller Rückfall auf den Upload.
- Neu (2026-09-04): Vorlesungsfreie Einzeltage und Feiertage liefert derzeit keine Quelle. Die Kennzeichnung vorlesungsfreier Wochen stützt sich vorerst allein auf Semesterbeginn und -ende aus den Stammdaten (API-F-230); ob eine vom FSR gepflegte Liste vorlesungsfreier Tage den Aufwand lohnt, ist nach der ersten Nutzung zu entscheiden.
- Neu (2026-09-04): Führt FBWS jemals `Sat` oder `Sun` im Feld `weekday`? Der am 2026-09-04 geprüfte Bestand tut es nicht. Die Wochentagsleiste baut dynamisch und ist damit unabhängig von der Antwort; `openspec/specs/api-contract.yaml` beschränkt den Wochentag im Schema `RaumplanTermin` jedoch auf `Mon`–`Fri` und wäre bei einem Gegenbeleg zu erweitern.
- Gegenstandslos seit 2026-08-26: Liefert INT-002 für ein vom eigenen Fachsemester abweichendes `{grade}` tatsächlich die benötigten Wahlpflicht-Termine? Die manuelle Fachsemester-Auswahl ist entfallen, ersetzt durch den automatischen Bezug aus der FBWS-Sammelkategorie `WFPB`, siehe Capability `integrations` INT-002.
- Gegenstandslos aus demselben Grund: Lohnt sich für eine spätere Version eine komfortablere, FSR-gepflegte Zuordnung „Wahlpflichtmodul → typisches Fachsemester"? Die FBWS-eigene Sammelkategorie leistet das bereits, keine zusätzliche FSR-Pflege nötig.
- Neu (2026-08-26): Deckt die FBWS-Sammelkategorie `WFPB` auch Master-Wahlpflichtfächer ab, oder ausschließlich Bachelor (so die Namensgebung „Bachelor Wahlpflichtfächer WPF")? Keine äquivalente Kategorie für die Master-Studiengänge (`INPM`, `MIPM`, `WIPM`) in der Studiengangsliste gefunden — vor Umsetzung zu klären, falls Master-Wahlpflicht relevant wird.
- Weitere Kriterien über die acht hinaus (z. B. „möglichst früh fertig") — die Kriterienliste ist bewusst erweiterbar und nicht abschließend. Ausdrücklich verworfen wurde am 2026-09-06 eine Einstellung „bestimmte Wochentage bevorzugt frei halten": Das Kriterium „Uni-Tage" räumt ohnehin den Tag frei, an dem am wenigsten liegt — in der Praxis meist den Freitag —, und eine zusätzliche Stellschraube wäre ohne erkennbaren Zusatznutzen zu erklären und zu bedienen. Bei festen außeruniversitären Verpflichtungen wäre sie erneut zu erwägen.
- Vollkombinatorische Analyse mehrerer gleichzeitig unentschiedener Kandidaten gegeneinander — bewusst zurückgestellt (2026-08-25, bestätigt 2026-09-06); auch der automatische Planungsvorschlag arbeitet greedy und kann deshalb eine Konstellation verfehlen, die bei anderer Bearbeitungsreihenfolge aufgegangen wäre. Mögliche spätere Erweiterung, falls sich das schrittweise Verfahren in der Praxis als unzureichend erweist.
- Ob das Zeitfenster einheitlich für alle Wochentage gilt oder je Wochentag unterschiedlich einstellbar sein sollte — für den ersten Umfang als ein einheitliches Zeitfenster angenommen, mangels gegenteiliger Evidenz aus der Rücksprache mit dem FSR FB4.
- Trennschärfe des Merkmalssatzes Bezeichnung + Wochentag + Beginnzeit + `studentSet` für die Zuordnung INT-002 ↔ INT-009 **bei Einträgen ohne `courseId`** — an echten Daten zu prüfen. Berichtigt 2026-09-06: Die frühere Fassung dieser Frage behauptete, INT-002 führe kein `courseId` für alle Fälle und ein exakter Schlüssel fehle teils; das ist durch die Korrektur vom 2026-09-04 überholt — beide Bestände führen `courseId`, in INT-009 fehlt es nur bei Einträgen mit `eventType: "Event"`.
- Bildet INT-009 kurzfristige Ausfälle und Raumänderungen ab (bestimmt die Aussagekraft der Raumabweichungs-/Nicht-gefunden-Hinweise)? Gemeinsame offene Frage mit Capability `room-finder`, „Offene Fragen"; vor Roadmap-Schritt 6 als Spike zu klären.
