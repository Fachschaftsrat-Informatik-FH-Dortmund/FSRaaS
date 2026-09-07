# Vorgehen und Messwerte des INT-009-Spikes

Durchgeführt am **2026-09-07**, Bezugszeitpunkt: 2026-09-07 17:41 UTC (Montag). Alle Aufrufe über HTTPS gegen `https://ws.inf.fh-dortmund.de`, ohne Anmeldung. Zeitangaben aus den Rohdaten sind UTC; der Fachbereich rechnet in lokaler Zeit (MESZ = UTC+2), was bei Uhrzeitvergleichen berücksichtigt ist.

Die Rohantworten wurden nicht ins Repository übernommen — sie sind über die genannten Aufrufe jederzeit neu zu erheben.

## 0. Wie die Zeitraum-Parameter gefunden wurden

Der erste Durchgang rief `AllEvents` ohne Parameter ab und erhielt 31 Sätze im Zeitraum 2026-09-08 bis 2026-09-14 — sieben Tage ab dem Folgetag. Versuche, dieses Fenster zu erweitern, blieben sämtlich wirkungslos: `days`, `start`/`end` (Unix), `from`/`to` (ISO, klein geschrieben), `date`, `weeks`, `dateBegin`/`dateEnd`, `timestampBegin`, `limit` sowie zusätzliche Pfadsegmente. Alle Varianten lieferten unverändert dieselben 31 Sätze. Der daraus gezogene Schluss — der Endpunkt reiche nur sieben Tage — war **falsch**.

Die richtigen Namen stehen in der HTML-Repräsentation desselben Endpunkts. `…/AllEvents?Accept=text/html` liefert eine FullCalendar-Seite (`agendaWeek`), deren Skript `/fbws/current/View/HTML/Calendar/js/script.min.js` die Ereignisquelle so aufbaut:

```js
events: function(e, t, n, i) {
    var r = {};
    r.From = e.utc().unix();
    r.To   = t.utc().unix();
    fbws.service.getAsync(o, r, function(e) { … })
}
```

Also **`From`** und **`To`**, groß geschrieben, als Unix-Sekunden. Der Dienst ignoriert unbekannte Abfrageparameter stillschweigend und antwortet mit dem Standardfenster, statt einen Fehler zu melden — deshalb ist ein Rateversuch hier nicht von einer Bestätigung zu unterscheiden. `Accept` ist bei diesem Dienst zusätzlich als Abfrageparameter belegt (`?Accept=application/json`, `?Accept=text/html`), nicht nur als Kopfzeile.

Belegte Reichweite mit `From`/`To`:

| Zeitraum | Sätze | Typen |
|---|---|---|
| 2026-01-01 – 2027-01-01 | 9 911 | 7 662 `Course`, 2 249 `Event` |
| Vorlesungszeit 24.05. – 25.07.2026 | 8 128 | 7 580 `Course`, 548 `Event` |
| Prüfungszeitraum 20.07. – 08.09.2026 | 1 290 | 149 davon Prüfungen |
| Februar 2024 (WiSe 23/24) | 337 | 174 davon Prüfungen |
| April – September 2027 | 147 | ausschließlich `Event` |

Der Bestand reicht damit mindestens zweieinhalb Jahre zurück und über ein Jahr voraus.

## 1. Ressourcen und ihr Verhalten

| Aufruf | Ergebnis am 2026-09-07 |
|---|---|
| `Room/` | 200, 35 Raumkennungen (bisher nicht im Register) |
| `Room/{roomId}/Events` | Serien des Semesters, 13 für `A.E.01` |
| `Room/*/Events` | 502 Sätze, **alle** mit `roomId: "*"` |
| `Room/{roomId}/AllEvents` | Einzeltermine, mit `From`/`To` steuerbar |
| `Room/*/AllEvents` | Einzeltermine über alle Räume, mit `From`/`To` steuerbar |

`From`/`To` wirkt **nur auf `AllEvents`**. `Room/A.E.01/Events` liefert mit und ohne Parameter dieselben 13 Sätze, `Room/*/Events` dieselben 502.

**Der Stern bedeutet je Ressource etwas anderes.** In `AllEvents` ist er ein Platzhalter über alle Räume. In `Events` ist er eine echte Raumkennung — der Pseudoraum für Termine ohne Raumzuordnung. Die 13 Sätze aus `Room/A.E.01/Events` sind in den 502 aus `Room/*/Events` nicht enthalten (Schnittmenge der Merkmalssätze leer). Wer `Room/*/Events` für einen Sammelaufruf hält, erhält keinen einzigen regulären Raumtermin.

**Serie gegen Einzeltermin**, dieselben Felder, unterschiedlich gefüllt:

| Feld | `Events` (Serie) | `AllEvents` (Einzeltermin) |
|---|---|---|
| `id` | `""` | Zahl, z. B. `4655741` |
| `dateBegin` / `dateEnd` | Semesterspanne 24.05.–24.07.2026 | beide der Termintag |
| `interval` | `"weekly"` | Zahl (`0`, `1`, `2`, `3`) |
| `termId` | `"SS 26"` | leer |

Kursinstanzen in `AllEvents` tragen die Zuordnungsfelder vollständig: in der Woche 01.–08.06.2026 hatten alle 1 011 `Course`-Instanzen `courseId`, `studentSet`, `courseOfStudy` und `roomId` gesetzt.

## 2. Prüfungstermine: Rechtzeitigkeit

Grundlage sind die 149 Prüfungseinträge im Zeitraum 20.07.–08.09.2026, ermittelt über das Namenspräfix `Prüfung`. Als Vorlauf gilt `timestampBegin` minus `modified`. `modified` ist die **letzte** Änderung, der tatsächliche Vorlauf also mindestens so groß.

| Kennzahl | Tage |
|---|---|
| Minimum | 2 |
| 25 % | 45 |
| Median | **55** |
| 75 % | 66 |
| Maximum | 203 |

129 der 149 Einträge (87 %) hatten mindestens 42 Tage Vorlauf, fünf weniger als 14 Tage, keiner wurde erst nach dem Termin geändert. Die Änderungsdaten liegen zwischen 2026-01-07 und 2026-08-24.

**Maßstab.** `resources/pplan(4).xlsx` (Stand 2026-07-28) weist für SoSe 2026 den Prüfungszeitraum 27.07.–04.09.2026 aus, mit Anmeldezeiträumen wie `04.05.2026 – 08.06.2026` — Anmeldeschluss rund sieben Wochen vor der ersten Prüfung. Ein Median von 55 Tagen deckt das.

## 3. Prüfungstermine: Vollständigkeit

Verglichen wurden die Modulnummern. Aus dem Raumplan über das gesamte Jahr 2026 (9 911 Sätze, 325 Prüfungseinträge) wurden alle fünf- und sechsstelligen Zahlen aus dem Namensfeld gelesen; aus `resources/pplan(4).xlsx` die Spalte `Num.` samt Termin.

| | Module |
|---|---|
| Excel SoSe 2026 | 91 |
| Raumplan 2026 | 71 |
| in beiden | **64** |
| nur Excel | **27** |
| nur Raumplan | 7 |

Abdeckung des Excel-Bestands: **70 %**. Bei 61 der 64 gemeinsamen Module stimmt der Prüfungstag exakt überein, bei drei weicht er ab.

**Die Lücke ist systematisch.** Die 27 nur in der Excel geführten Module, vollständig:

41311 Einführung in die Wirtschaftsinformatik 1 · 41321 Allgemeine BWL / Unternehmensführung · 41322 Human Resource Management und Organisation · 42312 Einführung in die Wirtschaftsinformatik 2 · 42331 Buchführung und Jahresabschluss · 43053 IT-Infrastruktur · 43332 Kosten-, Erlös- und Ergebnisrechnung · 43343 Angewandte Mikro- und Makroökonomie · 44492 Einfluss der Digitalisierung auf Unternehmensorganisation · 45392 ERP 2 · 46803 Strategisches Arbeitsrecht · 46805 Beschaffungsmanagement · 46811 Controlling · 46824 Finanzmanagement · 46831 Investition und Finanzierung · 46836 Supply Chain Management und Logistik · 46837 Marketing · 46842 Produktionsmanagement · 46854 Fortgeschrittenes Web-Engineering · 46862 Entwurf und Modellierung komplexer Software-Architekturen · 46869 DV in der Logistik · 46874 Business Intelligence · 46879 Fortgeschrittenes Geschäftsprozessmanagement · 46894 Grundlagen des Geschäftsprozessmanagements · 46902 Marktorientiertes Innovationsmanagement · 46903 SCM-Anwendungen · 47562 Kostenmanagement

Bis auf zwei Ausnahmen (43053 IT-Infrastruktur, 46854 Fortgeschrittenes Web-Engineering) sind das wirtschaftswissenschaftliche Module der Studiengänge Wirtschaftsinformatik. Die naheliegende Erklärung — diese Prüfungen werden in Räumen außerhalb des FB4-Raumplans geschrieben — ist **nicht** geprüft; belegt ist allein das Muster.

## 4. Prüfungstermine: Erkennbarkeit des Namensmusters

Von den 149 Einträgen folgen **142 (95 %)** dem Muster `Prüfung <Modulnummer> <Bezeichnung>`. Die beiden Abweichungen:

- `Prüfung Softwaretechnik 2` — keine Modulnummer
- `Prüfungen 41065 Mathematik für Informatik 1 / 43076 Mathematik für Informatik 4 (Data Science)` — Plural, zwei Module in einem Eintrag

Bei allen Prüfungseinträgen sind `courseId` und `courseOfStudy` leer; die Modulnummer steht ausschließlich im Namensfeld.

## 5. Ausfälle und Feiertage

Ausgezählt wurden die `Course`-Instanzen je Kalendertag über die Vorlesungszeit 24.05.–25.07.2026 (7 580 Instanzen):

| Wochentag | Instanzen je Woche |
|---|---|
| Montag | 166–167 |
| Dienstag | 214–216 |
| Mittwoch | 189–192 |
| Donnerstag | 171–175 |
| Freitag | durchgängig 95 |

**Gesetzliche Feiertage werden nicht ausgenommen.** Gegenprobe:

| Tag | Kursinstanzen | derselbe Wochentag eine Woche später |
|---|---|---|
| 2026-05-25 Pfingstmontag | **167** | 167 |
| 2026-06-04 Fronleichnam (NRW) | **174** | 174 |

Für einen im Voraus bekannten, kalendarisch feststehenden Ausfall wie einen Feiertag liefert der Bestand keine Auskunft — er ist an diesen Tagen eine mechanische Ausmultiplikation der Serien.

**Einzelfall-Absagen werden dagegen sichtbar entfernt — Befund nach Rückmeldung (2026-09-07), im Bestand nachvollzogen.** Der erste Durchgang dieses Spikes hatte drei kleinere Tagesabweichungen (189 statt 192 am 24.06., 216 statt 214 am 14.07., 167 statt 166 am 06.07.) als Rasterrauschen verworfen. Eine Rückmeldung aus dem FSR FB4 wies darauf hin, dass Raumänderungen über das Semester vorkommen und Einzelfälle bei Krankheit oder Ausfall korrigiert werden. Die Nachprüfung auf Instanzebene (Schlüssel `courseId` + `roomId` + Wochentag + Beginnzeit + Name, gegen alle übrigen Tage desselben Wochentags derselben Vorlesungszeit) fand für alle drei Tage exakt die fehlenden Einzelinstanzen:

| Tag | fehlende Instanz(en) | erklärt die Zähldifferenz |
|---|---|---|
| 2026-06-24 (Mi) | `IT-Landschaft – Planung und Umsetzung` (2×, C.3.34, 10:15 und 12:00) und `Scientific & Transversal Skills 2` (C.3.34, 14:15) | 3 von 3 |
| 2026-07-06 (Mo) | `Algorithmen und Datenstrukturen` (A.E.01, 08:30) | 1 von 1 |
| 2026-07-14 (Di) | `Programmierkurs Systemintegration (1. Semesterhälfte)` (2×, C.3.34, 12:00 und 14:15) | 2 von 2 |

Alle sechs Fehlstellen liegen **innerhalb** des regulären Gültigkeitszeitraums der jeweiligen Serie (durch `dateBegin`/`dateEnd` der übrigen Instanzen ausgeschlossen, dass eine Serie schlicht vorher endet) und tragen keinen Hinweis im Bestand selbst — `note` und `description` sind bei allen leer, keine Volltextsuche nach Ausfall-typischen Begriffen (`fällt aus`, `entfällt`, `verlegt`, `Vertretung`) trifft. Die Korrektur besteht also im ersatzlosen Entfernen der Instanz, ohne Markierung. Damit ist die frühere Einordnung „Rasterrauschen, keine Aussage" widerlegt: Alle drei Abweichungen sind vollständig durch je eine echte Einzelabsage erklärt, keine Restdifferenz bleibt offen.

**Für einen Raumwechsel derselben Sitzung über das Semester fand sich in diesem Fenster kein Beleg.** Geprüft wurde mit dem feinsten verfügbaren Schlüssel (`courseId` + Wochentag + Beginnzeit + `studentSet` + `lecturerName` + Name) auf Serien mit mehr als einer Raumkennung. Zwei Treffer (`48091 Scientific & Transversal Skills 2`, `411031 Lern- und Arbeitstechniken`) erwiesen sich bei Prüfung der Einzeltermine als **gleichzeitige Parallelbelegung zweier Räume in jeder Woche**, nicht als Verlegung über die Zeit — beide Räume erscheinen an (fast) jedem Termintag nebeneinander. Ein Fall, in dem eine Serie zunächst durchgehend Raum A und ab einem bestimmten Datum durchgehend Raum B trägt, kam in der Vorlesungszeit SoSe 2026 nicht vor. Das widerlegt die Rückmeldung nicht — ein neunwöchiges Fenster in einem einzigen Semester bietet dafür wenig Gelegenheit —, bestätigt sie aber auch nicht unabhängig. Offen als Nachprüfung.

Die Verteilung der Instanzen je Serie stützt das Gesamtbild: 591 Serien mit genau 9 Instanzen (eine je Woche der neunwöchigen Vorlesungszeit), 108 mit 18, 8 mit 27 — und ein Rest von 14 Serien mit 1, 6, 7 oder 8 Instanzen, worunter die oben gefundenen Einzelabsagen fallen.

## 6. Der Pseudoraum trägt einen erheblichen Teil der Belegung

Von den 7 580 Kursinstanzen der Vorlesungszeit:

| | Instanzen |
|---|---|
| echte Raumkennung | 3 107 (41 %) |
| Pseudoraum `*` | **4 473 (59 %)** |
| davon mit Raumangabe im Namensfeld | 4 095 |

Beispiele der Freitextform: `Fortgeschrittenes Projektmanagement [StgPO: WIM-18] (in Raum C.E.44)`, `IT-Landschaft – Planung und Umsetzung (von 09:00-16:30 Uhr, in den Räumen C.3.34 und C.3.32)`, `IT-Recht (in Raum A.2.02, 9:15-16:15 Uhr) [StgPO: INF-DS-19]`.

Belegte Minuten über die Vorlesungszeit, überlappende Intervalle je (Raum, Tag) zusammengefasst:

| Quelle | belegte Minuten |
|---|---|
| nur echte `roomId` | 273 985 |
| zuzüglich der aus dem Namensfeld gelesenen Räume | 357 100 |
| **Zuwachs** | **83 115 (+30,3 %)** |

Eine Raumsuche, die allein `roomId` auswertet, meldet also einen erheblichen Teil belegter Räume als frei.

## 7. Deckt die raumweise Serien-Iteration die Belegung ab?

Zur Kontrolle wurden zwei Wege verglichen, dieselbe Wochenbelegung aus den **Serien** zu erheben — beide beschränkt auf echte Raumkennungen, der Pseudoraum also auf beiden Seiten ausgeklammert:

- **raumweise** — `Room/` liefert 35 Kennungen, davon 34 echte; je Raum `Room/{roomId}/Events` → 344 Sätze in 4,5 s
- **über Studiengänge** — `CourseOfStudy/` liefert 25 Studiengänge mit 35 Studiengang/Semester-Kombinationen; je Kombination `…/Events?studentSet=*` → 975 Sätze in 4,4 s

| | belegte Minuten je Woche | (Raum, Tag)-Paare |
|---|---|---|
| raumweise Iteration | 28 890 | 111 |
| Vereinigung über Studiengänge | 28 880 | 111 |

Differenz: 55 Minuten in acht Abschnitten (0,2 %), sämtlich Rasterränder von fünf bis zehn Minuten. Kein Raum aus INT-002 fehlt in `Room/`. Beide Wege sind gleichwertig — und beide unvollständig, solange der Pseudoraum unausgewertet bleibt (Abschnitt 6). Mit `From`/`To` ist der Umweg ohnehin entbehrlich: Ein einziger `Room/*/AllEvents`-Aufruf über den gewünschten Zeitraum liefert alles.

## 8. Feldbelegung und Datenschutz

Über die 31 Sätze des Standardfensters (ausschließlich Einzelbuchungen):

- durchgängig gesetzt: `roomId`, `name`, `weekday`, `timeBegin`/`timeEnd`, `dateBegin`/`dateEnd`, `timestampBegin`/`timestampEnd`, `id`, `interval`, `modified`, `flags`, `created`
- `lecturerName`/`lecturerSurname` in 23 von 31
- `note` in 3 von 31 (dreimal `Bitte nicht stören!`)
- **`description` in 2 von 31 — `gebucht von <Vor- und Nachname>` und `Tati gebucht`**
- bei Einzelbuchungen durchgängig leer: `courseId`, `studentSet`, `courseOfStudy`, `examinationReg`, `termId`, `courseType`, `lecturerId`

`description` trägt damit interne Buchungsvermerke mit Klarnamen von Beschäftigten. Bei Kursinstanzen sind `courseId`, `studentSet` und `courseOfStudy` dagegen gesetzt (1 011 von 1 011).

`created` trägt kleine Zahlen (`19`, `15` beobachtet) und ist keine Zeitangabe. `modified` ist eine Unix-Sekundenangabe und taugt zur Änderungserkennung.

## 9. Semesterbezug

`/timetable/<segment>/rest/Room/` antwortet für `current`, `ss26`, `SS26`, `ws2627`, `WS2627`, `ws26`, `next` und `2026` mit identischen 350 B. Das Segment wird nicht ausgewertet; eine Semesterwahl über den Pfad existiert nicht. Die HTML-Ansicht verweist zudem auf `/fbws/current/…` als Herkunft ihrer Skripte, und der mitgeschnittene Aufruf des Kalenders geht gegen `/fbws/current/rest/…` — beide Pfadpräfixe führen auf denselben Dienst.

`current` lieferte am 2026-09-07 in den **Serien** durchgängig `termId: "SS 26"` mit der Vorlesungszeit 24.05.–24.07.2026, also das bereits beendete Sommersemester. Der Umschaltzeitpunkt auf WiSe 2026/27 bleibt unbekannt und liegt nach Semesterende. Für den Einzelterminbestand ist das folgenlos, da er über `From`/`To` adressiert wird.

## 10. Wie die Alt-App den Endpunkt nutzt

`alte apps/android-fb4/.../retrofit/TimetableApi.java` kennt drei Aufrufe: `CourseOfStudy/`, `CourseOfStudy/{stg}/{sem}/Events` und `Room/*/AllEvents` — letzteren **ohne** `From`/`To`. `service/RoomService.java`, `getFreeRooms(start, end)` stützt die Freie-Raum-Suche allein darauf und filtert mit `event.getDateBegin().isEqual(start.toLocalDate())` auf ein einzelnes Datum. Die Alt-App arbeitet also auf dem Standardfenster von sieben Tagen — für „ist dieser Raum jetzt frei" ausreichend, aber sie wertet den Pseudoraum nicht aus und meldet damit belegte Räume als frei (Abschnitt 6). Die Ressourcen `Room/` und `Room/{roomId}/Events` nutzt sie nicht; daher waren sie im Register bisher nicht erfasst.

## 11. Was offen bleibt

- **Warum fehlen die wirtschaftswissenschaftlichen Prüfungen?** Die Vermutung „Räume außerhalb des FB4" ist nicht geprüft. Eine Rückfrage beim Fachbereich klärt es schneller als jede weitere Messung.
- **Gilt die 70-%-Abdeckung auch für andere Jahrgänge?** Geprüft wurde SoSe 2026 gegen `pplan(4).xlsx`. Die vier weiteren Jahrgangsdateien unter `resources/` erlauben denselben Vergleich für WiSe 2023/24, SoSe 2024 und SoSe 2025 — der Raumplan reicht nachweislich bis Februar 2024 zurück.
- **Wird eine Verlegung derselben Sitzung in einen anderen Raum sichtbar?** Abschnitt 5 belegt das Entfernen einzelner Instanzen (sechs Fälle, exakt erklärt), aber keinen Raumwechsel derselben Sitzung über die Zeit — dafür bot das neunwöchige Beobachtungsfenster wenig Gelegenheit. Ein Einzelfall-Nachweis an einer bekannten Verlegung steht aus.
