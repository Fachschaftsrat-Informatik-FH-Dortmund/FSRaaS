## MODIFIED Requirements

### Requirement: INT-009 — FBWS Raumplan

Das System muss die Raumtermine des Fachbereichs über die Ressourcen `Room/`, `Room/{roomId}/Events` und `Room/{roomId}/AllEvents` beziehen. `AllEvents` nimmt mit den Abfrageparametern **`From` und `To`** (groß geschrieben, Unix-Sekunden) einen beliebigen Zeitraum entgegen und liefert die Einzeltermine darin; ohne diese Parameter antwortet der Endpunkt mit einem Standardfenster von sieben Tagen ab dem Folgetag. Der Bestand ist zugleich die Quelle für die Prüfungstermine: Einträge mit dem Namensmuster `Prüfung <Modulnummer> <Bezeichnung>` sind Prüfungen; bei ihnen sind `courseId` und `courseOfStudy` leer, die Modulnummer steht ausschließlich im Namensfeld. Herkunft: Alt: alte apps/android-fb4/FB4/fB4/src/main/java/de/fsrfb4/fb4/retrofit/TimetableApi.java; Endpunktverhalten Recherche: FBWS live abgefragt im INT-009-Spike, 2026-09-07; Hinweis auf Einzelabsage-Korrekturen Recherche: Rücksprache FSR FB4, 2026-09-07, im selben Spike auf Instanzebene nachvollzogen.

**Aufruf**
```
GET .../timetable/current/rest/Room/?Accept=application/json
GET .../timetable/current/rest/Room/{roomId}/Events?Accept=application/json
GET .../timetable/current/rest/Room/{roomId}/AllEvents?Accept=application/json&From={unix}&To={unix}
GET .../timetable/current/rest/Room/*/AllEvents?Accept=application/json&From={unix}&To={unix}
```
Host `https://ws.inf.fh-dortmund.de`. `{roomId}` ist die Raumkennung im Format des Feldes `roomId` aus INT-002 (z. B. `A.E.01`). `Accept` ist bei diesem Dienst auch als Abfrageparameter belegt, nicht nur als Kopfzeile.

**`From`/`To` sind nirgends dokumentiert (Befund 2026-09-07).** Sie stammen aus der HTML-Repräsentation desselben Endpunkts: `…/AllEvents?Accept=text/html` liefert eine FullCalendar-Seite, deren Skript beim Blättern zwischen Wochen `From` und `To` als Unix-Sekunden setzt. **Der Dienst ignoriert unbekannte Abfrageparameter stillschweigend** und antwortet mit dem Standardfenster, statt einen Fehler zu melden — `from`/`to` in Kleinschreibung, `start`/`end`, `days`, `date`, `weeks`, `limit` und zusätzliche Pfadsegmente bleiben allesamt wirkungslos. Wer das Fenster mit einer geratenen Schreibweise zu erweitern versucht, erhält eine gültige Antwort und schließt daraus fälschlich, der Bestand reiche nur sieben Tage. Mit `From`/`To` reicht er nachweislich von Februar 2024 bis mindestens September 2027; ein einzelner Aufruf über das Jahr 2026 lieferte 9 911 Sätze.

`From`/`To` wirkt **ausschließlich auf `AllEvents`**. `Room/{roomId}/Events` und `Room/*/Events` liefern mit und ohne diese Parameter dieselbe Antwort.

**`Room/` — die Raumliste.** Liefert eine JSON-Liste von Raumkennungen; am 2026-09-07 waren es 35. Sie enthält neben den Räumen der Standorte A, B und C auch `Online`, die Außenstandorte (`EF38, 1.22`, `EF40A, E24`, `EF44, 113` und weitere) sowie den Pseudoraum `*`. Jeder Raum, den INT-002 nennt, kommt darin vor. Sie ist nicht mit der kuratierten Raumliste der Raumsuche zu verwechseln, die eigene Stammdaten sind.

**Der Stern bedeutet je Ressource etwas anderes.** In `AllEvents` ist er ein **Platzhalter** über alle Räume. In `Events` ist er eine **echte Raumkennung** — der Pseudoraum für Termine ohne Raumzuordnung. `Room/*/Events` lieferte 502 Sätze, sämtlich mit `roomId: "*"`, und keinen einzigen Termin eines echten Raums; die 13 Sätze aus `Room/A.E.01/Events` fehlen darin.

**Der Pseudoraum trägt einen erheblichen Teil der Belegung (Befund 2026-09-07).** Von 7 580 Kursinstanzen der Vorlesungszeit SoSe 2026 stehen **4 473 (59 %)** unter `roomId: "*"`; bei 4 095 davon nennt das Namensfeld den tatsächlichen Raum als Freitext, etwa `… (in Raum C.E.44)` oder `… (von 09:00-16:30 Uhr, in den Räumen C.3.34 und C.3.32)`. Wird der Raum zusätzlich aus dem Namensfeld gelesen, steigt die erfasste Belegung um **30 %**. Eine Auswertung allein über `roomId` meldet belegte Räume als frei.

**Zwei Sichten auf denselben Bestand.** `Events` liefert die **Serien** des Semesters, `AllEvents` die daraus ausmultiplizierten **Einzeltermine** samt der Einzelbuchungen:

| Feld | `Events` (Serie) | `AllEvents` (Einzeltermin) |
|---|---|---|
| `id` | leer | gesetzt, Zahl |
| `eventType` | `Course` | `Course` oder `Event` |
| `dateBegin` / `dateEnd` | Semesterspanne | beide der Termintag |
| `interval` | Zeichenkette `"weekly"` | Zahl (`0`, `1`, `2`, `3` beobachtet) |
| `termId` | Semesterkennung, z. B. `SS 26` | leer |
| `courseId`, `studentSet`, `courseOfStudy` | gesetzt | bei Kursinstanzen gesetzt, bei Einzelbuchungen leer |

Die übrigen Felder (`name`, `roomId`, `weekday`, `timeBegin`/`timeEnd` im Format `Hmm`/`HHmm` ohne führende Null, `timestampBegin`/`timestampEnd`, `lecturerName`, `lecturerSurname`, `note`, `examinationReg`, `grade`, `description`, `flags`, `created`, `modified`, `timeSlotBegin`, `timeSlotDuration`, `timeSlotColum`) entsprechen INT-002; die dortige Auffüllregel für Uhrzeiten gilt unverändert. `modified` ist eine Unix-Sekundenangabe und erlaubt es, geänderte Sätze zu erkennen. `created` trägt kleine Zahlen (`19`, `15` beobachtet) und ist keine Zeitangabe.

**Kalendarisch feststehende Ausfälle bildet der Bestand nicht ab, kurzfristige Einzelabsagen entfernt er ersatzlos (Befund 2026-09-07, Einzelabsagen nach Rückmeldung FSR FB4 nachvollzogen).** Für einen Feiertag ist der Instanzbestand eine mechanische Ausmultiplikation der Serien: Pfingstmontag (2026-05-25) trägt 167 Kursinstanzen, exakt so viele wie der Montag darauf; Fronleichnam (2026-06-04) trägt 174, exakt so viele wie der Donnerstag darauf. Über die gesamte Vorlesungszeit bleibt die Zahl der Instanzen je Wochentag ansonsten konstant — mit drei Ausnahmen, die sich auf Instanzebene vollständig aufklären lassen: Am 24.06., 06.07. und 14.07.2026 fehlen gegenüber sonst gleichen Wochentagen zusammen sechs einzelne Sitzungen, jede ersatzlos entfernt und ohne jede Markierung in `note` oder `description`. Ein Raumwechsel derselben Sitzung über die Zeit ließ sich im geprüften Semester dagegen nicht nachweisen — die einzigen gefundenen Mehrraum-Serien waren gleichzeitige Parallelbelegungen zweier Räume, keine Verlegungen. Wer aus diesem Bestand einen kalendarisch bekannten Ausfall lesen will, erhält keine Auskunft; eine kurzfristige Einzelabsage zeigt sich als stilles Verschwinden der Instanz.

**Als Prüfungsquelle rechtzeitig, aber unvollständig (Befund 2026-09-07).** Für den Prüfungszeitraum SoSe 2026 führt der Raumplan 149 Prüfungseinträge. Ihr Vorlauf — Termin minus `modified`, also eine Untergrenze — beträgt im Median 55 Tage; 87 % der Einträge haben mindestens 42 Tage Vorlauf. Das deckt den Bedarf, dessen Anmeldefrist rund sieben Wochen vor der ersten Prüfung endet. **Der Bestand ist jedoch nicht vollständig:** Von 91 Modulen des Prüfungsplans SoSe 2026 (`resources/pplan(4).xlsx`) führt der Raumplan 64 — eine Abdeckung von 70 %. Bei 61 dieser 64 stimmt der Prüfungstag exakt überein. Die 27 fehlenden sind bis auf zwei Ausnahmen wirtschaftswissenschaftliche Module der Studiengänge Wirtschaftsinformatik; die Ursache ist ungeklärt.

**Das Namensmuster trägt zu 95 %.** 142 der 149 Prüfungseinträge folgen `Prüfung <Modulnummer> <Bezeichnung>`. Belegte Abweichungen: `Prüfung Softwaretechnik 2` (ohne Modulnummer) und `Prüfungen 41065 … / 43076 …` (Plural, zwei Module in einem Eintrag). Ein Eintrag, dessen Muster nicht greift, ist als Prüfung ohne Modulbezug zu führen und der Vorfall zu protokollieren (SEC-F-060).

**`description` kann Klarnamen tragen.** Beobachtet wurden Buchungsvermerke der Form `gebucht von <Vor- und Nachname>`. Das Feld ist eine interne Notiz der Raumverwaltung und darf in der App nicht angezeigt werden.

**Das Pfadsegment vor `/rest/` ist wirkungslos.** `/timetable/ss26/`, `/timetable/ws2627/`, `/timetable/next/` und `/timetable/2026/` liefern dieselbe Antwort wie `/timetable/current/`; auch `/fbws/current/rest/…` führt auf denselben Dienst. Eine Semesterwahl über den Pfad existiert nicht. In den Serien lieferte `current` am 2026-09-07 noch `SS 26` mit der Vorlesungszeit 24.05.–24.07.2026, also das beendete Semester; der Umschaltzeitpunkt bleibt unbekannt und betrifft INT-001 und INT-002 gleichermaßen. Für die Einzeltermine ist das folgenlos, da sie über `From`/`To` adressiert werden.

**Authentifizierung:** Keine. **Eigentümer/Betreiber:** Fachbereich Informatik, FH Dortmund (dieselbe FBWS-Infrastruktur wie INT-001/INT-002, eigener Pfad `/timetable/` statt `/fbws/`). **Verfügbarkeit:** Nicht dokumentiert, kein bekanntes SLA.

**Cache-Regel (Vorschlag):** Kurze Ablaufzeit wie bei INT-002 (Vorschlag: ein Tag), da Terminänderungen kurzfristig möglich sind. Der Zeitraum ist beim Abruf ausdrücklich zu setzen, statt sich auf das Standardfenster zu verlassen.

**Risiko:** Wie INT-001/INT-002 (dieselbe Infrastruktur, keine erkennbare Versionierung). Hinzu kommt, dass `From`/`To` undokumentiert sind und der Dienst unbekannte Parameter stillschweigend ignoriert — eine Umbenennung würde nicht als Fehler auffallen, sondern stillschweigend auf das Sieben-Tage-Fenster zurückfallen. Ein Abruf muss deshalb prüfen, ob der gelieferte Zeitraum dem angeforderten entspricht (SEC-F-060).

**Ersatzoption:** Für die Serien die Vereinigung über INT-001 + INT-002, über `roomId` zusammengeführt — nachweislich gleichwertig (Differenz 0,2 %). Für die Einzeltermine gibt es keine Ersatzoption.

**Status:** Bestätigt und produktiv erprobt, Verhalten am 2026-09-07 im Spike vermessen.

#### Scenario: Alle Raumtermine in einem Aufruf
- **WHEN** der Platzhalter-Aufruf `Room/*/AllEvents` mit `From` und `To` genutzt wird
- **THEN** liefert das System alle Raumtermine des angeforderten Zeitraums in einer Antwort, ohne Iteration über Studiengang/Semester-Kombinationen

#### Scenario: Zeitraum ausdrücklich anfordern
- **WHEN** Raumtermine für einen bestimmten Zeitraum benötigt werden
- **THEN** wird `Room/*/AllEvents` mit `From` und `To` als Unix-Sekunden aufgerufen, und die Antwort wird darauf geprüft, ob sie den angeforderten Zeitraum abdeckt

#### Scenario: Aufruf ohne Zeitraum
- **WHEN** `AllEvents` ohne `From` und `To` aufgerufen wird
- **THEN** liefert das System nur die sieben Tage ab dem Folgetag, was für jede Auswertung mit Vorlauf zu wenig ist

#### Scenario: Stern in Room/*/Events ist keine Wildcard
- **WHEN** `Room/*/Events` aufgerufen wird
- **THEN** liefert das System ausschließlich Termine des Pseudoraums `*` ohne Raumzuordnung und keinen Termin eines echten Raums

#### Scenario: Raum steht im Namensfeld
- **WHEN** ein Termin `roomId: "*"` trägt und sein Name eine Raumangabe als Freitext enthält
- **THEN** ist der Raum aus dem Namensfeld zu lesen, weil die Belegung sonst um rund ein Drittel zu niedrig ausfällt

#### Scenario: Kalendarisch feststehender Ausfall nicht ableitbar
- **WHEN** geprüft wird, ob ein Feiertag oder eine sonst kalendarisch bekannte Unterbrechung im Raumplan als Ausfall erkennbar ist
- **THEN** gibt der Raumplan darüber keine Auskunft — er führt auch gesetzliche Feiertage als belegt

#### Scenario: Kurzfristige Einzelabsage erkennbar
- **WHEN** eine einzelne Sitzung einer sonst regelmäßigen Serie krankheits- oder ausfallbedingt abgesagt wird
- **THEN** fehlt die betroffene Instanz im nächsten Abruf, ohne Markierung des Grundes in `note` oder `description`

#### Scenario: Prüfungseintrag erkennen
- **WHEN** ein Datensatz dem Namensmuster `Prüfung <Modulnummer> <Bezeichnung>` folgt
- **THEN** gilt er als Prüfungstermin, und die Modulnummer ist dem Namensfeld zu entnehmen, nicht dem leeren Feld `courseId`

#### Scenario: Buchungsvermerk nicht anzeigen
- **WHEN** ein Termin im Feld `description` einen Buchungsvermerk mit Klarnamen trägt
- **THEN** wird dieses Feld nicht an die App ausgeliefert und nicht angezeigt
