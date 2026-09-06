## RENAMED Requirements

- FROM: `### Requirement: Leerer Tag bei Gruppenfilterung`
- TO: `### Requirement: Leerer Tag bei wirksamem Filter`

- FROM: `### Requirement: Datei-Export als Rückfallweg`
- TO: `### Requirement: Gleichrangiger Datei-Export und Verhalten bei verweigerter Berechtigung`

- FROM: `### Requirement: Lokale Speicherung der Matrikelnummer`
- TO: `### Requirement: Keine Speicherung der Matrikelnummer`

## MODIFIED Requirements

### Requirement: Wildcard im studentSet

Wenn `studentSet` eines Termins den Wert `*` trägt, dann muss das System diesen Termin für jede angegebene Gruppenkennung anzeigen. Herkunft: NEU, bestätigt 2026-09-06; vormals SCHED-F-060. Die Android-Alt-App (`util/GroupLetterUtil.java`) behandelt `*` nicht gesondert und markiert einen für alle Gruppen gültigen Termin fälschlich als gruppenfremd; dieses Verhalten ist bewusst nicht übernommen, siehe Abschnitt „Bewusst nicht übernommenes Altverhalten".

#### Scenario: Wildcard bei gesetzter Gruppenkennung
- **WHEN** die Gruppenkennung `C8` gesetzt ist und ein Termin `studentSet` `*` trägt
- **THEN** zeigt das System diesen Termin als zugehörig an

### Requirement: Leerer Tag bei wirksamem Filter

Falls an einem Wochentag durch einen wirksamen Filter kein Termin verbleibt, muss das System diesen Tag als leer kennzeichnen und den Filter nennen, der dazu geführt hat. Herkunft: NEU, entschieden 2026-09-06; vormals SCHED-F-100. Die vorige Fassung nannte allein die Gruppenfilterung; inzwischen wirken mehrere Filter auf die Wochenansicht.

#### Scenario: Alle Termine eines Tages ausgeblendet
- **WHEN** an einem Wochentag nach Ausblenden gruppenfremder Termine kein Termin verbleibt
- **THEN** kennzeichnet das System den Tag als leer und nennt die Gruppenfilterung als Grund

#### Scenario: Eingrenzung auf ein Fachsemester leert den Tag
- **WHEN** an einem Wochentag nach Eingrenzung auf ein Fachsemester kein Termin verbleibt
- **THEN** kennzeichnet das System den Tag als leer und nennt diese Eingrenzung als Grund

### Requirement: Gleichrangiger Datei-Export und Verhalten bei verweigerter Berechtigung

Das System muss das Übertragen in einen Gerätekalender und den Datei-Export (.ics) gleichrangig zur Auswahl stellen. Falls die Berechtigung für den Gerätekalender nicht erteilt wird, darf das System den Vorgang nicht abbrechen, sondern muss im selben Vorgang beide Auswege anbieten: den Weg in die Systemeinstellungen der App zum nachträglichen Erteilen der Berechtigung und den Datei-Export. Herkunft: NEU, entschieden 2026-09-06; vormals SCHED-F-177. iOS und Android zeigen den Berechtigungsdialog nach einer Ablehnung kein zweites Mal; ein von der App ausgelöster erneuter Versuch ist deshalb nicht möglich.

#### Scenario: Beide Wege stehen zur Wahl
- **WHEN** die Nutzerin den Export öffnet
- **THEN** bietet das System die Übertragung in einen Gerätekalender und den Datei-Export gleichrangig an

#### Scenario: Kalenderberechtigung verweigert
- **WHEN** die Kalenderberechtigung verweigert wird
- **THEN** bleibt der Vorgang offen und das System bietet sowohl den Weg in die Systemeinstellungen als auch den Datei-Export an

### Requirement: Konflikthinweis bei festen Terminen

Wenn sich zwei Termine des persönlichen Plans mit dem Status „fest" zeitlich überschneiden, muss das System beide Termine mit einem sichtbaren Konflikthinweis darstellen, unabhängig davon, ob sie offiziell oder eigen sind. Hat die Nutzerin die Überschneidung nach der Anforderung zur bewussten Übernahme trotz Konflikt angenommen, darf das System keinen wiederkehrenden Konflikthinweis mehr erzeugen; das Terminpaar trägt dann allein die Kennzeichnung „angenommener Konflikt". Herkunft: NEU, entschieden 2026-09-06; vormals SCHED-F-230. Ohne diese Ausnahme entstünde für einen bewusst angenommenen Konflikt genau die Dauerwarnung, gegen die der Status „vorgemerkt" eingeführt wurde.

#### Scenario: Zwei feste Termine überschneiden sich
- **WHEN** zwei Termine mit Status „fest" zeitlich überschneidend sind
- **THEN** stellt das System beide mit einem sichtbaren Konflikthinweis dar

#### Scenario: Konflikt wurde bewusst angenommen
- **WHEN** die Nutzerin die Überschneidung zweier fester Termine bewusst angenommen hat
- **THEN** zeigt das System keinen Konflikthinweis mehr, sondern allein die Kennzeichnung „angenommener Konflikt"

### Requirement: Kennzeichnung als unbestätigte Ableitung

Das System muss einen Hinweis auf Raumabweichung oder fehlende Zuordnung als unbestätigte Ableitung kennzeichnen, die Quelle benennen, aus der er abgeleitet ist (die Raumreservierung des Fachbereichs, INT-009), und auf den offiziellen Prüfungsplan sowie „FB-Aktuelles" (Capability `news`) als vorrangige, verbindliche Quellen verweisen. Herkunft: NEU, entschieden 2026-09-06; vormals SCHED-F-440. Der Raumplan-Abgleich ist ausdrücklich ein experimentelles Feature, das unvollständig bleiben darf — deshalb muss am Hinweis selbst stehen, worauf er beruht und was ihm vorgeht.

#### Scenario: Hinweis angezeigt
- **WHEN** ein Raumabweichungs- oder Nicht-gefunden-Hinweis angezeigt wird
- **THEN** kennzeichnet das System ihn als unbestätigte Ableitung, nennt die Raumreservierung als Quelle und verweist auf Prüfungsplan und „FB-Aktuelles" als vorrangige Quellen

### Requirement: Kein Hinweis bei veraltetem Raumplan

Falls der Raumplan-Zwischenspeicher älter ist als das Vierfache der vorgesehenen Aktualisierungsfrequenz, mindestens jedoch älter als 30 Minuten, muss das System keinen Hinweis auf Raumabweichung oder fehlende Zuordnung anzeigen und stattdessen das Alter des Raumplan-Stands ausweisen. Herkunft: NEU, entschieden 2026-09-06; vormals SCHED-F-450. Die vorige Fassung ließ die Hinweise bereits entfallen, sobald der Stand älter war als die Aktualisierungsfrequenz — bei einem Abruf alle paar Minuten wäre der Block damit praktisch immer stumm gewesen.

#### Scenario: Veralteter Raumplan-Stand
- **WHEN** der Raumplan-Zwischenspeicher älter als das Vierfache der Aktualisierungsfrequenz und älter als 30 Minuten ist
- **THEN** zeigt das System keinen Abweichungshinweis, sondern das Alter des Stands

#### Scenario: Einzelner ausgelassener Abruf
- **WHEN** der Raumplan-Zwischenspeicher eine Aktualisierungsrunde übersprungen, die Schwelle aber nicht erreicht hat
- **THEN** zeigt das System die Hinweise unverändert weiter

### Requirement: Keine Speicherung der Matrikelnummer

Das System darf die Matrikelnummer nicht dauerhaft speichern. Es verwendet sie ausschließlich für den Abruf nach INT-019 (Capability `integrations`) und überträgt sie an kein anderes Ziel. Gespeichert wird allein die daraus ermittelte und von der Nutzerin bestätigte Gruppenkennung. Herkunft: NEU, entschieden 2026-09-06; vormals SCHED-F-710. Die Matrikelnummer ist personenbeziehbar und wird nach der Ermittlung nicht mehr gebraucht; die Gruppenkennung bleibt auch ohne sie jederzeit von Hand festlegbar.

#### Scenario: Matrikelnummer im Netzwerkmitschnitt
- **WHEN** ein Netzwerkmitschnitt während der Nutzung erstellt wird
- **THEN** erscheint die Matrikelnummer in keinem Aufruf außer gegen INT-019

#### Scenario: Nach Abschluss der Einrichtung
- **WHEN** die Nutzerin die ermittelte Gruppenkennung bestätigt hat und die App neu startet
- **THEN** ist die Gruppenkennung vorhanden und die Matrikelnummer nirgends gespeichert

## ADDED Requirements

### Requirement: Schalter zum Abschalten aller Filter

Das System muss der Nutzerin einen Schalter bereitstellen, der sämtliche wirksamen Filter der Wochenansicht auf einmal abschaltet — Gruppenfilterung, Gültigkeitszeitraum und Eingrenzung auf Fachsemester — und alle Termine des persönlichen Plans zeigt, gleich welchen Status sie tragen. Die Wochenansicht bleibt dabei erhalten. Herkunft: NEU, entschieden 2026-09-06. Zweck ist das manuelle Zusammenstellen des Plans, wenn die App den Fall einer Nutzerin nicht abdeckt; dass die Darstellung dabei unübersichtlich wird, ist ausdrücklich in Kauf genommen.

#### Scenario: Alle Filter abschalten
- **WHEN** die Nutzerin den Schalter aktiviert
- **THEN** zeigt das System alle Termine des persönlichen Plans, einschließlich gruppenfremder und außerhalb ihres Gültigkeitszeitraums liegender

#### Scenario: Schalter zurücknehmen
- **WHEN** die Nutzerin den Schalter wieder deaktiviert
- **THEN** wirken die zuvor gesetzten Filtereinstellungen unverändert weiter

## REMOVED Requirements

### Requirement: Zeitziel beim Blättern zwischen Wochentagen

**Grund:** Die Anforderung sagte inhaltlich nur, dass beim Blättern zwischen Wochentagen der querschnittliche Zeitwert der Capability `non-functional` (NFR-N-040) einzuhalten sei — ohne eigenen Wert, ohne eigene Schwelle und ohne eigene Begründung; der Registerabschnitt dieser Spec verwies seinerseits auf sie zurück. Entschieden 2026-09-06.

**Ersetzt durch:** nichts. NFR-N-040 gilt unverändert für die gesamte App und damit auch für den Stundenplan. Vormals SCHED-N-010; die Kennung bleibt vergeben.
