## MODIFIED Requirements

### Requirement: INT-001 — FBWS Studiengänge

Das System muss die Liste der Studiengänge des Fachbereichs mit ihren Fachsemestern (`grades`) über den FBWS-Endpunkt laden. Grundlage für die Auswahl von Studiengang und Semester im Stundenplan und für die vollständige Iteration aller Studiengang/Semester-Kombinationen, die die Raumsuche (INT-008) benötigt. Herkunft: Alt: alte apps/fb4_app-main/fb4_app-main/lib/areas/schedule/repositories/course_info_repository.dart, Feld `po` und Bestandsaufnahme ergänzt über eine Live-Abfrage am 2026-09-08.

**Aufruf**
```
GET https://ws.inf.fh-dortmund.de/timetable/current/rest/CourseOfStudy/?Accept=application/json
```
Keine Parameter außer dem festen Query-String `Accept=application/json`.

**Pfadkorrektur (2026-08-25).** Bis zur Auswertung des Android-Quellcodes war hier der Pfad `/fbws/current/rest/...` dokumentiert, wie ihn die Flutter-Alt-App verwendet. Die Android-Alt-App ruft dieselben Ressourcen unter `/timetable/current/rest/...` ab (`retrofit/TimetableApi.java`) — derselbe Pfad, unter dem auch INT-009 liegt. Eine Live-Abfrage am 2026-08-25 bestätigt, dass `/timetable/`-Pfad **über HTTPS** mit Status 200 antwortet. INT-001, INT-002 und INT-009 sind damit drei Ressourcen **eines** Dienstes unter einem gemeinsamen Pfadpräfix, nicht zwei getrennte Systeme. Für die Neuentwicklung gilt einheitlich `/timetable/`; der `/fbws/`-Pfad wird nicht weiterverwendet.

Hinweis zum Transport: Die Android-Alt-App spricht diesen Dienst über `http://` an (`module/NetworkModule.java`, `baseUrl("http://ws.inf.fh-dortmund.de/")`). Die Live-Abfrage am 2026-08-25 zeigt, dass `https://` einwandfrei funktioniert — der unverschlüsselte Aufruf ist somit kein technischer Zwang, sondern ein Altlastenbefund. Für die Neuentwicklung gilt Capability `security-and-privacy`, Requirement zu zwingendem TLS, ohne Ausnahme.

**Antwortstruktur**
Die Antwort ist ein JSON-**Objekt** (Map von Schlüssel auf Studiengangsdatensatz), keine Liste. Auszuwerten sind die Werte dieser Map. Einträge, bei denen `grades` `null` ist, werden verworfen (so verfährt bereits die Alt-App).

| Feld | Typ | Bedeutung |
|---|---|---|
| `name` | String | Klarname des Studiengangs |
| `sname` | String | Kurzname; wird als Pfadsegment in INT-002 verwendet |
| `grades` | Liste von Objekten mit Feld `grade` | Fachsemester dieses Studiengangs |
| `po` | String oder `null` | Prüfungsordnung des Studiengangs, z. B. `2019`. Bei Angeboten ohne Prüfungsordnung (Blockwochen, Tutorien, Seminare, Wahlpflicht) `null`. **Achtung:** Der Wert `"NULL"` kommt als Zeichenkette vor (`FemINF`) und ist wie `null` zu behandeln |

**Live-Verifikation 2026-09-08 (Feldbestand und Umfang).** Abruf der vollständigen Liste: 25 Einträge. Die vorige Fassung dieser Tabelle führte drei Felder; der Endpunkt liefert zusätzlich `po` (oben ergänzt) sowie je `grades`-Eintrag ein Feld `modified` (Unix-Sekunden, Bedeutung nicht untersucht). Vier Einträge (`INDB`, `INPB`, `STDBSW`, `STDBSY`) tragen weder `name` noch `grades` und werden nach der Verwerfregel oben ausgesondert; zwei davon führen stattdessen ein Feld `descriptionDirectoryVariants`, das für die App ohne Belang ist.

**Befund: Die Liste führt nicht nur Studiengänge (2026-09-08).** Von den 21 verwertbaren Einträgen sind dreizehn Studiengänge; die übrigen acht sind Lehrangebote anderer Art — drei Blockwochen (`Blockwoche1` bis `Blockwoche3`), zwei Tutorien-Angebote (`TUPB`, `FemINF`), die Bachelorseminare (`SMPB`), die Wahlpflichtsammlung (`WFPB`) und Wiederholungsangebote (`QDL`). Die Capability `schedule` führt sie deshalb gemeinsam als „Endpunkte des Lehrangebots" und leitet ihre Gruppierung aus `po`, `sname` und `name` ab.

**Authentifizierung:** Keine. **Eigentümer/Betreiber:** Fachbereich Informatik, FH Dortmund (Betrieb von `ws.inf.fh-dortmund.de`). **Verfügbarkeit:** Nicht dokumentiert, kein bekanntes SLA.

**Cache-Regel (Vorschlag):** Innerhalb einer App-Sitzung einmalig laden und im Speicher vorhalten (Alt-App-Verhalten). Für die Neuentwicklung zusätzlich geräteseitig mit Ablaufzeit von einem Tag persistieren, da sich Studiengänge und Semesterlisten selten ändern.

**Risiko:** Keine erkennbare Versionierung; das Pfadsegment `current` deutet auf einen serverseitig wechselnden Bezug zum aktuellen Semester hin, dessen genaues Umschaltverhalten unbekannt ist.

**Ersatzoption:** Keine bekannte Alternativquelle. Bei Ausfall: zuletzt gecachte Liste weiterverwenden, Hinweis auf mögliche Veraltung anzeigen.

**Status:** Aktiv, unverändert aus der Alt-App übernehmbar.

#### Scenario: Studiengangsliste erfolgreich geladen
- **WHEN** die App den Endpunkt über HTTPS mit `Accept=application/json` abruft
- **THEN** liefert das System eine ausgewertete Liste der Studiengänge mit Kurzname und Fachsemestern, Einträge mit `grades: null` verworfen

#### Scenario: Prüfungsordnung ausgewertet
- **WHEN** ein Eintrag ein Feld `po` mit einem Jahreswert trägt
- **THEN** wertet das System es als Prüfungsordnung aus und behandelt sowohl `null` als auch die Zeichenkette `"NULL"` als „keine Prüfungsordnung"

### Requirement: INT-002 — FBWS Termine

Das System muss die Veranstaltungstermine eines Studiengang/Semester-Paars über den FBWS-Endpunkt laden. Grundlage für den Stundenplan und, über die Vereinigung aller Kombinationen, für die Raumbelegung in der Raumsuche. Herkunft: Alt: alte apps/fb4_app-main/fb4_app-main/lib/areas/schedule/repositories/schedule_repository.dart, `grade=*`-Befund und zwei `courseType`-Werte ergänzt über eine Live-Abfrage am 2026-09-08.

**Aufruf**
```
GET https://ws.inf.fh-dortmund.de/timetable/current/rest/CourseOfStudy/{sname}/{grade}/Events?Accept=application/json&studentSet=*
```
(Pfadkorrektur `/fbws/` → `/timetable/` wie bei INT-001, siehe dort.)
`{sname}` ist der Kurzname aus INT-001, `{grade}` das Fachsemester. `studentSet=*` fordert Termine aller Gruppen an; die Filterung auf eine einzelne Gruppenkennung erfolgt clientseitig (siehe `specs/product/glossary.md`, Begriff `studentSet`).

**Antwortstruktur**
Die Antwort ist eine JSON-**Liste**.

| Feld | Typ | Bedeutung |
|---|---|---|
| `name` | String | Bezeichnung der Veranstaltung; bei `WFPB` zusätzlich die zulässigen Studiengänge als `[StgPO: …]` im Text |
| `courseId` | String | **Modulnummer des Fachbereichs**, z. B. `42012`; identisch mit der Modul-Nr. im Curricula-Bestand und mit `courseId` in INT-009. Kann leer sein |
| `courseType` | String | Veranstaltungsart, siehe `specs/product/glossary.md`. Beobachtete Werte: `V`, `Ü`, `ÜPP`, `P`, `SV`, `T`, `PR` (Blockwochen), `S` (Seminare) |
| `eventType` | String | `Course` für Lehrveranstaltungen; siehe INT-009 für den zweiten Wert `Event` |
| `courseOfStudy` | String | Kurzname des Studiengangs, entspricht `{sname}` |
| `examinationReg` | String | Prüfungsordnung, z. B. `2019 84 079 PR`; bei Wahlpflicht oft mit Suffix ` WP`, aber uneinheitlich |
| `termId` | String | Semesterkennung, z. B. `SS 26` |
| `grade` | String oder Zahl | Fachsemester des Eintrags; bei `WFPB` durchgängig `0` |
| `description` | String oder null | Freitext, meist leer |
| `note` | String oder null | Bemerkung, meist leer; anzeigbar |
| `lecturerId` | String | Kennung der lehrenden Person |
| `lecturerName` | String | Name der lehrenden Person |
| `lecturerSurname` | String | Nachname der lehrenden Person |
| `studentSet` | String | Gültigkeitsbereich für Studierendengruppen, siehe `specs/product/glossary.md` und den Formen-Befund unten |
| `timeBegin` | Zahl oder String, Format `HHmm` | Beginnzeit; **linksseitig mit `0` auf vier Stellen aufzufüllen** (aus `800` wird `0800`) |
| `timeEnd` | Zahl oder String, Format `HHmm` | Endzeit; gleiche Auffüllregel wie `timeBegin` |
| `dateBegin` | Zahl (Unix-Sekunden) | Beginn des Gültigkeitszeitraums der Veranstaltung |
| `dateEnd` | Zahl (Unix-Sekunden) | Ende des Gültigkeitszeitraums |
| `timestampBegin` | Zahl (Unix-Sekunden) | Erster tatsächlicher Terminzeitpunkt |
| `timestampEnd` | Zahl (Unix-Sekunden) | Letzter tatsächlicher Terminzeitpunkt |
| `timeSlotBegin` | Zahl oder null | Index des Zeitrasters, Bedeutung nicht untersucht |
| `timeSlotDuration` | Zahl oder null | Länge in Zeitrastereinheiten, Bedeutung nicht untersucht |
| `timeSlotColum` | Zahl | Spaltenindex im Zeitraster (Schreibweise so im Original), Bedeutung nicht untersucht |
| `interval` | String | Rhythmus; im geprüften Bestand ausnahmslos `"weekly"`. **Achtung:** INT-009 führt dasselbe Feld als **Zahl** |
| `weekday` | String | Wochentag als englisches Dreibuchstaben-Kürzel: `Mon`, `Tue`, `Wed`, `Thu`, `Fri` — im gesamten geprüften Bestand keine Wochenendwerte |
| `roomId` | String | Kennung des Raums |
| `id` | String oder Zahl | Satzkennung; in INT-002 leer beobachtet |

**Live-Verifikation 2026-09-04 (Feldbestand).** Abruf von `INPBPI/2` (121 Einträge) und `WFPB/*` (161 Einträge). Die vorige Fassung dieser Tabelle führte neun Felder; tatsächlich liefert der Endpunkt die oben vollständig aufgenommenen 26. Drei Korrekturen sind für die Feature-Capabilities erheblich:

| Korrektur | Auswirkung |
|---|---|
| `courseId` ist vorhanden | Die Annahme in Capability `schedule`, INT-002 und INT-009 teilten keine gemeinsame Veranstaltungskennung, ist widerlegt. Das Requirement zur Abgleichslogik nutzt `courseId` als vorrangigen Schlüssel |
| `dateBegin`/`dateEnd` sind vorhanden | Der Gültigkeitszeitraum je Veranstaltung ist bekannt; ein Plan mit echtem Datumsbezug braucht dafür keine zusätzliche Quelle |
| `grades` je Studiengang sind grob | INT-001 liefert für die Bachelor-Studiengänge nur `2`, `4`, `6` (bzw. `*`), nicht jedes Fachsemester einzeln |

**Befund zu den `studentSet`-Formen (2026-09-04).** Der Bestand `INPBPI/2` führt 21 verschiedene Werte: `A-P`, `M-N`, `I-J`, `K-L`, `O-P`, `E-F`, `C-D`, `A-B`, `G-H`, `G-I`, `K-M`, `N-P`, `C5-E`, `M5-P`, `J-M4`, `H5-J`, `F-H4`, `A`, `B`, `C`, `D`. Bereiche ohne Zahlen an beiden Grenzen sind der Normalfall, Einzelwerte bestehen aus einem Buchstaben ohne Zahl, gemischte Grenzen kommen vor. Die Wildcard `*` trat im gesamten geprüften Bestand **nicht** als Feldwert auf — sie bleibt als Abrufparameter bestehen. Die Zuordnungsregeln in Capability `schedule` tragen alle beobachteten Formen.

**Live-Verifikation 2026-09-08 (`grade=*` und `courseType`).** Zwei Befunde:

`grade=*` trägt auch für Bachelor-Endpunkte. Bislang war angenommen, die Wildcard sei der Sonderweg für `WFPB`. Der Abruf `INPBPI/2` liefert 77 Termine, `INPBPI/*` liefert 126 — mit den Fachsemestern `2`, `4` und `6`, jeder Termin mit eigenem `grade`-Feld. Die groben `grades` aus INT-001 lassen sich damit in **einem** Abruf je Endpunkt einholen statt in einem je Fachsemester. Die Capability `schedule` nutzt das, um die Fachsemesterfrage aus der Einrichtung zu entfernen.

Endpunkte, deren INT-001-`grades` nur `*` enthält, liefern durchgängig `grade: 0` — geprüft für `INPM`, `Blockwoche1`, `TUPB`, `SMPB`, `FemINF`, `QDL` und `WFPB`. Das betrifft **auch die Master-Studiengänge**, nicht nur die Sammelkategorien; eine Gliederung nach Fachsemester trägt dort nicht.

Der `courseType`-Bestand ist größer als bisher geführt: `PR` tritt in `Blockwoche1` auf (5 von 30 Terminen), `S` in `SMPB` (8 von 8). Beide sind oben ergänzt; die Capability `schedule` darf keine abgeschlossene Werteliste voraussetzen.

**Authentifizierung:** Keine. **Eigentümer/Betreiber:** Fachbereich Informatik, FH Dortmund (siehe INT-001). **Verfügbarkeit:** Nicht dokumentiert, kein bekanntes SLA.

**Cache-Regel (Vorschlag):** Je Studiengang/Semester geräteseitig mit kurzer Ablaufzeit (Vorschlag: ein Tag) cachen. Für die Raumbelegung (siehe Nutzungshinweis unten) serverseitig periodisch abrufen und aggregieren, nicht bei jeder Anfrage neu über alle Kombinationen iterieren.

**Risiko:** Vergleichbar mit INT-001 (dieselbe FBWS-Infrastruktur, keine erkennbare Versionierung). Zusätzlich: Datenqualität der Rohfelder (`timeBegin`/`timeEnd` ohne führende Nullen, `weekday` als Kürzel) macht clientseitige Normalisierung notwendig; Fehler darin wirken sich auf Stundenplan **und** Raumsuche aus, da beide auf diesen Daten aufbauen.

**Ersatzoption:** Keine bekannte Alternativquelle. **Status:** Aktiv, unverändert aus der Alt-App übernehmbar.

**Nutzungshinweis für die Raumsuche — überholt.** Ursprünglich angenommen: Der FBWS biete keinen eigenen Endpunkt für Raumbelegung, weshalb sich diese nur durch Zusammenführung der Termine aller Studiengang/Semester-Kombinationen über `roomId` herleiten lasse. Diese Annahme ist in zwei Schritten widerlegt worden — am 2026-08-24 durch die Entdeckung des raumbezogenen Endpunkts INT-009, und am 2026-08-25 endgültig durch dessen Wildcard-Form (`Room/*/AllEvents`), die alle Raumtermine in einem einzigen Aufruf liefert und in der Android-Alt-App produktiv im Einsatz ist. Für die Raumsuche wird dieser Endpunkt **nicht** mehr verwendet. Maßgeblich ist INT-009; siehe dort und Capability `room-finder`.

**Live-Verifikation 2026-08-26 (Rhythmus-Feld `interval`).** Abfrage aller aktuell angebotenen Studiengang/Fachsemester-Kombinationen (35 Paare, gesamter aktueller Bestand) zeigt `interval` ausnahmslos als `"weekly"` — kein einziges Vorkommen eines anderen Werts. Ob das Feld überhaupt einen anderen Wert kennt (z. B. für zweiwöchentliche Veranstaltungen) oder im aktuellen Semester schlicht keine solche Veranstaltung angeboten wird, bleibt offen. Die als Beispiel genannte Veranstaltung „Lern- und Arbeitstechniken" (`INPBPI`/`INPBTI`/`INPBDS`, Fachsemester 2, `courseId` `411031`) erwies sich als **wöchentlich**, kein Beleg für den Zweiwochen-Fall: ein rund dreieinviertelstündiger Block (16:00–19:20 Uhr, vier Viertelstunden-Zeitfenster), parallel in zwei Räumen (`A.2.03`, `lecturerId LUA` und `A.3.03`, `lecturerId LUA2`) angeboten, beide mit identischem `studentSet` (`A-P`).

**Befund: Parallelangebote ohne Gruppenunterscheidung im `studentSet` — aufgelöst 2026-09-04.** Die beiden Raum-Varianten tragen identische Zeit- und `studentSet`-Werte; aus den Rohdaten allein ist nicht erkennbar, welcher Raum für eine einzelne Studierende vorgesehen ist. Der Curricula-Bestand des Fachbereichs (`resources/Curricula.pdf`, Stand 24.07.2026) erklärt das: Modulnummer `411031` heißt dort „Lern- u. Arbeitstechniken/Studium Generale/Mentoring" und bündelt drei verschiedene Angebote unter einer Nummer. Die zwei Räume sind also zwei Angebote, kein Datenfehler. Die Konsequenz für den Stundenplan steht in Capability `schedule`.

**Nutzungshinweis für den Wahlpflicht-Planungsmodus (SCHED) — Live-Verifikation 2026-08-26.** Für die Wahlpflicht-Planung ruft die App diesen Endpunkt mit `{sname}=WFPB`, `{grade}=*` ab. `WFPB` ist eine eigene, in `CourseOfStudy` geführte Pseudo-Studiengangskennung („Bachelor Wahlpflichtfächer WPF") — kein regulärer Studiengang, sondern eine vom Fachbereich gepflegte Sammelkategorie, die alle aktuell angebotenen Wahlpflichtmodule direkt bündelt (Live-Abfrage 2026-08-26: 27 distinkte Module; Nachprüfung 2026-09-04: 161 Termineinträge auf rund 20 distinkte Module — die Zahl schwankt mit dem Angebot des Semesters. Beispiele: „Data Mining in Industrie und Wirtschaft", „Moderne Datenbanken", „Künstliche Intelligenz"). Jeder Eintrag trägt im Feld `name` die zulässigen Studiengänge/Vertiefungsrichtungen als `[StgPO: ...]`-Angabe, unstrukturiert im Text, nicht als eigenes Feld. Die meisten, aber nicht alle Einträge tragen zusätzlich `examinationReg` mit dem Suffix ` WP`; das Muster ist uneinheitlich genug, um nicht als alleiniges Erkennungsmerkmal zu dienen — maßgeblich ist die Zugehörigkeit zu `WFPB`, nicht der Inhalt von `examinationReg`. Ein Abruf über ein abweichendes `{grade}` des eigenen Studiengangs ist nicht mehr nötig, da `WFPB` bereits die vollständige, aktuelle Liste liefert. **Unverifiziert bleibt, ob `WFPB` auch Master-Wahlpflichtfächer abdeckt** — laut Namensgebung ausdrücklich nur Bachelor; keine äquivalente Kategorie für `INPM`/`MIPM`/`WIPM` in der Studiengangsliste gefunden.

Quelle: `alte apps/fb4_app-main/fb4_app-main/lib/areas/schedule/repositories/schedule_repository.dart`, Modell `alte apps/fb4_app-main/fb4_app-main/lib/areas/schedule/models/schedule_item.dart`

#### Scenario: Termine für Studiengang/Semester geladen
- **WHEN** die App `{sname}/{grade}/Events` mit `studentSet=*` abruft
- **THEN** liefert das System alle 26 dokumentierten Felder je Termin, `timeBegin`/`timeEnd` mit führenden Nullen normalisiert

#### Scenario: Wahlpflichtangebot über WFPB
- **WHEN** `{sname}=WFPB` und `{grade}=*` abgerufen wird
- **THEN** liefert das System die vollständige aktuelle Liste der Bachelor-Wahlpflichtmodule, ohne zusätzlichen Abruf über andere Fachsemester

#### Scenario: Alle Fachsemester eines Endpunkts in einem Abruf
- **WHEN** die App `{sname}/*/Events` für einen Bachelor-Endpunkt abruft
- **THEN** liefert das System die Termine sämtlicher Fachsemester dieses Endpunkts, jeder Termin mit seinem eigenen `grade`-Wert

#### Scenario: Endpunkt ohne Fachsemesterstaffelung
- **WHEN** die App einen Endpunkt abruft, dessen INT-001-`grades` nur `*` enthält
- **THEN** tragen sämtliche gelieferten Termine `grade: 0`, und die App gliedert sie nicht nach Fachsemester
