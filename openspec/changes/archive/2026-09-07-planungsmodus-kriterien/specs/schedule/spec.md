## ADDED Requirements

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

### Requirement: Anpinnen eines Termins

Das System muss der Nutzerin ermöglichen, einen einzelnen Termin des persönlichen Plans anzupinnen. Ein angepinnter Termin darf von einer Optimierung weder umgelegt noch entfernt werden. Herkunft: NEU, entschieden 2026-09-06. Trennt das *Wann* vom *Ob*: „Pflicht" hält fest, dass eine Veranstaltung im Plan bleiben muss; das Anpinnen hält fest, dass es genau dieser Zeitslot sein soll — etwa, weil die eigene Lerngruppe dorthin geht.

#### Scenario: Angepinnter Termin bei erneuter Optimierung
- **WHEN** die Nutzerin einen Termin anpinnt und danach eine Optimierung auslöst
- **THEN** bleibt dieser Termin unverändert an seinem Zeitslot

#### Scenario: Anpinnen zurücknehmen
- **WHEN** die Nutzerin das Anpinnen eines Termins zurücknimmt
- **THEN** darf eine folgende Optimierung diesen Termin wieder umlegen

### Requirement: Vorbereitungszeit je Veranstaltungsart

Das System muss der Nutzerin einen allgemeinen Zielwert für die Vorbereitungszeit vor einem Termin sowie davon abweichende Werte für einzelne Veranstaltungsarten festlegen lassen. Der allgemeine Wert gilt für jede Veranstaltungsart, für die kein abweichender Wert gesetzt ist, einschließlich künftiger, heute unbekannter Arten. Die Werte gelten allgemein und nicht je einzelner Veranstaltung. Herkunft: NEU, entschieden 2026-09-06. FBWS führt derzeit sechs Veranstaltungsarten; sie alle einzeln zu erfragen wäre eine lange Einrichtung, und eine siebte Art bliebe ohne Wert.

#### Scenario: Abweichender Wert für eine Veranstaltungsart
- **WHEN** die Nutzerin für die Veranstaltungsart „Praktikum" einen abweichenden Zielwert festlegt
- **THEN** verwendet das System diesen Wert für Praktika und den allgemeinen Wert für alle übrigen Arten

#### Scenario: Unbekannte Veranstaltungsart
- **WHEN** ein Termin eine Veranstaltungsart trägt, für die kein abweichender Wert gesetzt ist
- **THEN** verwendet das System den allgemeinen Zielwert

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

### Requirement: Konfliktprüfung gegenüber angepinnten Terminen

Bei der Konfliktprüfung eines Kandidaten der Planungsauswahl muss das System dessen Termine gegen den bereits übernommenen Stundenplan sowie gegen die angepinnten Termine prüfen, nicht gegen andere, noch nicht festgelegte Kandidaten. Herkunft: NEU, entschieden 2026-09-06. Ersetzt die entfallene Anforderung „Konfliktprüfung gegenüber Pflicht-Kandidaten" (vormals SCHED-F-390); eine Vollkombinatorik über mehrere gleichzeitig unentschiedene Kandidaten bleibt zurückgestellt (Rücksprache 2026-08-25). Geprüft wird gegen angepinnte statt gegen als Pflicht markierte Termine, weil eine Pflicht-Markierung seit dem 2026-09-06 nur noch die Veranstaltung festhält, nicht deren Uhrzeit — sie trägt also keinen Zeitpunkt, gegen den sich prüfen ließe.

#### Scenario: Prüfung gegen angepinnte Termine
- **WHEN** zwei Kandidaten gleichzeitig unentschieden in der Planungsauswahl stehen
- **THEN** prüft das System jeden nur gegen den übernommenen Plan und die angepinnten Termine, nicht gegeneinander

## MODIFIED Requirements

### Requirement: Kandidat als Pflicht markieren

Das System muss der Nutzerin ermöglichen, einen Kandidaten der Planungsauswahl als „Pflicht" zu markieren. Eine als Pflicht markierte Veranstaltung muss im Plan enthalten bleiben; welcher ihrer Termine gewählt wird, bleibt der Planung überlassen. Herkunft: NEU, entschieden 2026-09-06; vormals SCHED-F-380. Die Markierung betrifft ausschließlich das *Ob* — für das *Wann* gibt es das Anpinnen.

#### Scenario: Kandidat als Pflicht markieren
- **WHEN** die Nutzerin sich für einen Kandidaten entscheidet
- **THEN** markiert das System ihn in der Planungsauswahl als „Pflicht"

#### Scenario: Pflicht-Veranstaltung bleibt enthalten
- **WHEN** die Nutzerin einen Kandidaten als „Pflicht" markiert und eine Optimierung auslöst
- **THEN** enthält der Vorschlag diese Veranstaltung, gegebenenfalls mit einem anderen Termin als zuvor

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

### Requirement: Kennzeichnung außerhalb des Zeitfensters

Bei der Prüfung eines Kandidaten-Termins muss das System zusätzlich zur Kollisionsprüfung kennzeichnen, ob der Termin außerhalb des festgelegten Zeitfensters liegt, ohne ihn deswegen aus der Auswahl zu entfernen. Ob die Abweichung zusätzlich auf die Reihenfolge wirkt, hängt davon ab, an welcher Stelle das Kriterium „Zeitfenster" in der Kriterienrangfolge steht; ist es abgeschaltet, bleibt es eine reine Kennzeichnung. Herkunft: NEU, entschieden 2026-09-06; vormals SCHED-F-340. Die vorige Fassung ließ offen, ob das Zeitfenster die Reihung beeinflusst — die Erläuterung behauptete es, das Reihungs-Requirement kannte es nicht.

#### Scenario: Termin außerhalb des Zeitfensters
- **WHEN** ein konfliktfreier Kandidaten-Termin außerhalb des festgelegten Zeitfensters liegt
- **THEN** kennzeichnet das System ihn entsprechend, entfernt ihn aber nicht aus der Auswahl

#### Scenario: Zeitfenster als oberstes Kriterium
- **WHEN** das Kriterium „Zeitfenster" an oberster Stelle der Rangfolge steht
- **THEN** ordnet das System Termine innerhalb des Zeitfensters vor solchen außerhalb ein

## REMOVED Requirements

### Requirement: Auswahl des Optimierungsmodus

**Grund:** Eine Auswahl aus benannten Modi kann nicht mehr ausdrücken, was gebraucht wird — „möglichst wenige Fahrten, und dabei nach Möglichkeit Vorbereitungszeit" ist keine Auswahl, sondern eine Rangfolge. Zudem waren mit acht Optimierungszielen fünf Modusnamen keine sinnvolle Einteilung mehr. Entschieden 2026-09-06.

**Ersetzt durch:** „Kriterienrangfolge für die Planung". Die fünf Modi leben dort als benannte Voreinstellungen weiter. Vormals SCHED-F-350; die Kennung bleibt vergeben.

### Requirement: Reihung nach Optimierungsmodus

**Grund:** Die Anforderung definierte drei Modi über zwei Größen (Tagesspanne, Nachbarabstand). Der Modus „ausgeglichener Tagesablauf" bevorzugte dabei die Tagesspanne, die einer Acht-Stunden-Spanne am nächsten kommt, und blähte damit an einem kurzen Tag den Tag auf — das Gegenteil dessen, was sein Name verspricht. Außerdem fehlte das Zeitfenster als Größe, obwohl die Erläuterung seine Wirkung auf die Reihung behauptete. Entschieden 2026-09-06.

**Ersetzt durch:** „Reihung nach der Kriterienrangfolge" mit acht definierten Kriterien. Vormals SCHED-F-360; die Kennung bleibt vergeben.

### Requirement: Konfliktprüfung gegenüber Pflicht-Kandidaten

**Grund:** Die Anforderung prüfte Kandidaten gegen die als „Pflicht" markierten Kandidaten. Seit der Trennung von *Ob* und *Wann* am 2026-09-06 hält eine Pflicht-Markierung aber nur noch fest, dass eine Veranstaltung im Plan bleiben muss, und trägt keinen Zeitpunkt mehr, gegen den sich prüfen ließe. Entschieden 2026-09-06.

**Ersetzt durch:** „Konfliktprüfung gegenüber angepinnten Terminen". Die Zurückstellung der Vollkombinatorik von 2026-08-25 bleibt unverändert in Kraft. Vormals SCHED-F-390; die Kennung bleibt vergeben.
