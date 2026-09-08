## ADDED Requirements

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

Das System muss die Einrichtung des Stundenplans über einen jederzeit sichtbaren Bedienweg erreichbar machen, unabhängig davon, ob bereits ein persönlicher Plan besteht. Herkunft: NEU, entschieden 2026-09-08. Die bisherige Umsetzung erreichte die Einrichtung ausschließlich aus Leerzuständen und aus dem Semesterwechsel-Hinweis; wer nach dem Anlegen eines Plans seine Gruppenkennung korrigieren wollte, hätte zuvor den gesamten Plan leeren müssen.

#### Scenario: Einrichtung bei gefülltem Plan öffnen
- **WHEN** ein persönlicher Plan besteht und die Nutzerin die Einrichtung öffnen will
- **THEN** bietet das System einen sichtbaren Bedienweg dorthin an, ohne dass der Plan geleert werden muss

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

### Requirement: Gültigkeitszeitraum aus dem Endpunktnamen

Wenn der Name eines Endpunkts einen Datumsbereich führt, dann muss das System diesen als Gültigkeitszeitraum aller Termine dieses Endpunkts verwenden, abweichend von den in INT-002 gelieferten Feldern. Lässt sich dem Namen kein Datumsbereich entnehmen, muss das System die gelieferten Felder unverändert übernehmen. Herkunft: Recherche: FBWS live abgefragt, 2026-09-08. Die drei Blockwochen-Endpunkte tragen ihren tatsächlichen Zeitraum ausschließlich im Klarnamen — `Blockwoche 1 (13.04.-17.04.2026)`. Ihre Termine liefern demgegenüber `dateBegin`/`dateEnd` über das gesamte Semester (25.05. bis 25.07.2026, identisch mit den regulären Veranstaltungen) und `interval: "weekly"`. Ohne diese Auswertung erschiene eine Blockwoche als wöchentlicher Termin über das ganze Semester und kollidierte an jedem Wochentag mit dem regulären Plan — ein Fehlalarm, der jede Nutzerin trifft, die eine Blockwoche wählt.

#### Scenario: Blockwoche mit Zeitraum im Namen
- **WHEN** ein gewählter Endpunkt den Namen `Blockwoche 1 (13.04.-17.04.2026)` trägt
- **THEN** gelten seine Termine ausschließlich innerhalb dieses Zeitraums, nicht über das von INT-002 gelieferte Semester

#### Scenario: Endpunktname ohne Datumsbereich
- **WHEN** der Name eines Endpunkts keinen Datumsbereich enthält
- **THEN** übernimmt das System die von INT-002 gelieferten Gültigkeitsangaben unverändert

#### Scenario: Datumsbereich nicht auswertbar
- **WHEN** ein Endpunktname eine Zeichenfolge in Klammern führt, die sich nicht als Datumsbereich lesen lässt
- **THEN** übernimmt das System die gelieferten Gültigkeitsangaben unverändert und protokolliert den Vorfall, statt einen Zeitraum zu erraten

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

## MODIFIED Requirements

### Requirement: Terminabruf nach Auswahl

Wenn mindestens ein Endpunkt gewählt ist, muss das System für jeden gewählten Endpunkt die zugehörigen Termine über INT-002 (Capability `integrations`) mit `grade=*` abrufen und den Wochentagen zuordnen. Das Fachsemester eines Termins muss dabei aus dem Termin selbst entnommen werden, nicht aus einer vorherigen Auswahl. Herkunft: Alt: lib/areas/schedule/repositories/schedule_repository.dart, auf Endpunkte und `grade=*` umgestellt 2026-09-08; vormals SCHED-F-030. Die Live-Abfrage vom 2026-09-08 belegt, dass `grade=*` auch für Bachelor-Endpunkte trägt: `INPBPI/2` liefert 77 Termine, `INPBPI/*` liefert 126 mit den Fachsemestern 2, 4 und 6.

#### Scenario: Termine nach Auswahl
- **WHEN** mindestens ein Endpunkt gewählt ist
- **THEN** ruft das System je Endpunkt die Termine über INT-002 mit `grade=*` ab und ordnet sie den Wochentagen zu

#### Scenario: Mehrere Endpunkte gewählt
- **WHEN** drei Endpunkte gewählt sind
- **THEN** führt das System drei Abrufe durch und vereinigt deren Termine zu einem Auswahlbestand

### Requirement: Hinweis bei Semesterwechsel

Wenn sich die über INT-001 gelieferte Endpunktliste gegenüber dem zuletzt gesehenen Stand ändert, muss das System die Nutzerin darauf hinweisen und ihr die Anpassung von Endpunktauswahl und Gruppenkennung anbieten. Der Hinweis darf keine Auswahl und keinen Planeintrag von sich aus verändern. Herkunft: Recherche: WhatsApp-Chat praktische-informatik-ws-23-24, 2026-08-25, auf Endpunkte umgestellt 2026-09-08; vormals SCHED-F-180. Der bisherige Anker — die Fachsemesterliste des gewählten Studiengangs — entfällt mit der Endpunktauswahl. Die Endpunktliste ist der bessere Anker: Zum Semesterbeginn wechseln die Blockwochen-Endpunkte sichtbar, und der bislang gar nicht abgedeckte Fall „ein gewählter Endpunkt existiert nicht mehr" wird mit erfasst.

#### Scenario: Semesterbeginn erkannt
- **WHEN** INT-001 Endpunkte liefert, die im zuletzt gesehenen Stand fehlten — etwa die Blockwochen des neuen Semesters
- **THEN** weist das System auf die Änderung hin und bietet die Anpassung von Endpunktauswahl und Gruppenkennung an

#### Scenario: Gewählter Endpunkt entfallen
- **WHEN** ein von der Nutzerin gewählter Endpunkt in der aktuellen INT-001-Liste fehlt
- **THEN** weist das System darauf hin, ohne die Auswahl oder bestehende Planeinträge selbsttätig zu ändern

### Requirement: Gliederung des Auswahlbestands

Das System muss den Auswahlbestand über zwei aufeinanderfolgende Bedienschritte gliedern: zuerst die Wahl der Module, danach je gewähltem Modul die Wahl von Veranstaltungsart und Gruppen-Slot. Eine flache Liste einzelner Termine ist ausgeschlossen. Herkunft: Recherche: FBWS live abgefragt, 2026-09-04, auf zwei Schritte aufgeteilt 2026-09-08; vormals SCHED-F-600. Die Live-Prüfung vom 2026-09-04 ergab 121 Termine für ein einzelnes Fachsemester und 161 für die Wahlpflicht-Sammelkategorie — eine flache Liste ist in dieser Größenordnung nicht bedienbar. Die Aufteilung auf zwei Schritte trennt zusätzlich zwei verschiedene Fragen: welche Module belegt werden und zu welcher Gruppe man geht.

#### Scenario: Auswahlbestand öffnen
- **WHEN** die Nutzerin den Auswahlbestand öffnet
- **THEN** zeigt das System zunächst die Module zur Auswahl, ohne Veranstaltungsarten oder Gruppen-Slots

#### Scenario: Veranstaltungsart und Slot wählen
- **WHEN** Module gewählt sind und die Nutzerin zum nächsten Schritt geht
- **THEN** stellt das System je gewähltem Modul Veranstaltungsart und Gruppen-Slot zur Wahl

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

## REMOVED Requirements

### Requirement: Studiengang- und Fachsemesterauswahl

**Reason**: Die INT-001-Liste führt nach der Live-Abfrage vom 2026-09-08 nicht nur Studiengänge, sondern auch Blockwochen, Tutorien, Seminare und Wahlpflichtangebote; eine Einzelauswahl schließt die häufige Kombination aus Studiengang und Zusatzangebot aus. Das Fachsemester wird an dieser Stelle nicht mehr gebraucht, seit belegt ist, dass `grade=*` auch für Bachelor-Endpunkte alle Fachsemester in einem Abruf liefert.

**Migration**: Ersetzt durch die Requirements „Auswahl der Endpunkte des Lehrangebots", „Gruppierung der Endpunkte in der Auswahl" und „Gliederung der Modulauswahl nach Fachsemester". Ein gerätelokal gespeicherter Stand mit `sname` und `grade` wird in eine Endpunktmenge mit dem einen bisherigen `sname` überführt; das gespeicherte Fachsemester und etwaige Zusatz-Fachsemester entfallen ersatzlos, da der Abruf mit `grade=*` sie ohnehin alle einschließt.

### Requirement: Erweiterung um weitere Fachsemester

**Reason**: Gegenstandslos. Die Anforderung erlaubte Wiederholerinnen und Vorzieherinnen, den Auswahlbestand um weitere Fachsemester desselben Studiengangs zu erweitern. Mit dem Abruf über `grade=*` sind sämtliche Fachsemester eines Endpunkts von vornherein im Bestand; es gibt nichts mehr hinzuzufügen.

**Migration**: Die Filterung nach Fachsemester bleibt erhalten und wird zur Gliederung der Modulauswahl — siehe Requirement „Gliederung der Modulauswahl nach Fachsemester". Gerätelokal gespeicherte Zusatz-Fachsemester werden beim Laden verworfen, ohne dass etwas verloren geht: Ihre Veranstaltungen sind im Bestand weiterhin enthalten.
