## Purpose

Dieses Register ist die einzige Stelle im Anforderungsbestand, an der externe Systeme im Detail beschrieben werden: Aufruf, Antwortstruktur, Authentifizierung, Betrieb, Risiko und Ersatzoptionen. Jede Feature-Capability, die eine externe Schnittstelle nutzt, verweist auf die betreffende `INT-###`-Nummer (historische Kennung, bleibt als Referenzanker erhalten) statt Endpunktdetails zu duplizieren. Vormals `specs/platform/integrations.md` (Präfix `INT`), migriert nach ADR 0019. Owner: FSR FB4.

**Regel: Endpunktdetails stehen nur hier.** Eine Feature-Capability darf eine Schnittstelle benennen und ihre fachliche Nutzung beschreiben, aber keine URL, keinen Feldnamen und keine Antwortstruktur duplizieren. Ändert sich ein Endpunkt, wird ausschließlich dieses Register angepasst; die Feature-Capabilities bleiben unverändert gültig, solange sich die fachliche Nutzung nicht ändert.

Jeder Eintrag ist als eigenes Requirement geführt (kein EARS-Einzelsatz, da er eine Schnittstelle als Ganzes beschreibt, siehe `specs/README.md` Abschnitt 4, Sonderfall INT) und trägt weiterhin seine historische `INT-###`-Nummer als Referenzanker, weil neun Feature-Capabilities und mehrere ADRs darauf verweisen.

## Requirements

### Requirement: INT-001 — FBWS Studiengänge

Das System muss die Liste der Studiengänge des Fachbereichs mit ihren Fachsemestern (`grades`) über den FBWS-Endpunkt laden. Grundlage für die Auswahl von Studiengang und Semester im Stundenplan und für die vollständige Iteration aller Studiengang/Semester-Kombinationen, die die Raumsuche (INT-008) benötigt. Herkunft: Alt: alte apps/fb4_app-main/fb4_app-main/lib/areas/schedule/repositories/course_info_repository.dart.

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

**Authentifizierung:** Keine. **Eigentümer/Betreiber:** Fachbereich Informatik, FH Dortmund (Betrieb von `ws.inf.fh-dortmund.de`). **Verfügbarkeit:** Nicht dokumentiert, kein bekanntes SLA.

**Cache-Regel (Vorschlag):** Innerhalb einer App-Sitzung einmalig laden und im Speicher vorhalten (Alt-App-Verhalten). Für die Neuentwicklung zusätzlich geräteseitig mit Ablaufzeit von einem Tag persistieren, da sich Studiengänge und Semesterlisten selten ändern.

**Risiko:** Keine erkennbare Versionierung; das Pfadsegment `current` deutet auf einen serverseitig wechselnden Bezug zum aktuellen Semester hin, dessen genaues Umschaltverhalten unbekannt ist.

**Ersatzoption:** Keine bekannte Alternativquelle. Bei Ausfall: zuletzt gecachte Liste weiterverwenden, Hinweis auf mögliche Veraltung anzeigen.

**Status:** Aktiv, unverändert aus der Alt-App übernehmbar.

#### Scenario: Studiengangsliste erfolgreich geladen
- **WHEN** die App den Endpunkt über HTTPS mit `Accept=application/json` abruft
- **THEN** liefert das System eine ausgewertete Liste der Studiengänge mit Kurzname und Fachsemestern, Einträge mit `grades: null` verworfen

### Requirement: INT-002 — FBWS Termine

Das System muss die Veranstaltungstermine eines Studiengang/Semester-Paars über den FBWS-Endpunkt laden. Grundlage für den Stundenplan und, über die Vereinigung aller Kombinationen, für die Raumbelegung in der Raumsuche. Herkunft: Alt: alte apps/fb4_app-main/fb4_app-main/lib/areas/schedule/repositories/schedule_repository.dart.

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
| `courseType` | String | Veranstaltungsart, siehe `specs/product/glossary.md`. Beobachtete Werte: `V`, `Ü`, `ÜPP`, `P`, `SV`, `T` |
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

### Requirement: INT-003 — News-Feed

Das System muss die vom FSR veröffentlichten News-Meldungen laden und dabei zwingend mit 24-Stunden-Zeitformat (`HH`) parsen. Herkunft: Alt: alte apps/fb4_app-main/fb4_app-main/lib/areas/news/repositories/news_repository.dart.

**Aufruf**
```
GET https://fb4app.hemacode.de/getNews.php
```
Keine Parameter.

**Antwortstruktur**
Die Antwort ist eine JSON-Liste, UTF-8-kodiert (die Kodierung muss explizit als UTF-8 dekodiert werden, nicht der Standard-Zeichensatz der HTTP-Bibliothek).

| Feld | Typ | Bedeutung |
|---|---|---|
| `header` | String | Titel der Meldung |
| `date` | String, Format `dd.MM.yyyy - HH:mm:ss` | Veröffentlichungszeitpunkt |
| `body` | String | Meldungstext |
| `list` | String | Verteiler/Quelle der Meldung |

**Bekannter Fehler der Alt-App:** Sie parst `date` mit dem Muster `dd.MM.yyyy - hh:mm:ss`, also mit der 12-Stunden-Stunde `hh` statt der 24-Stunden-Stunde `HH` (`alte apps/fb4_app-main/fb4_app-main/lib/areas/news/models/news_item.dart:26`). Da im Datenformat keine AM/PM-Angabe mitgeliefert wird, werden Zeiten ab 13:00 Uhr dadurch falsch interpretiert. **Die Neuentwicklung muss 24-Stunden-Parsing (`HH`) verwenden.**

**Authentifizierung:** Keine. **Eigentümer/Betreiber:** Private Infrastruktur unter der Domain `hemacode.de`. Trägerschaft und Fortbestand sind aus dem Code nicht ersichtlich und ungeklärt. **Verfügbarkeit:** Kein bekannter Vertrag, keine zugesagte Verfügbarkeit.

**Cache-Regel (Vorschlag):** Kurzfristig geräteseitig cachen (Vorschlag: 15 Minuten), damit Ausfälle des Diensts kurzzeitig überbrückt werden, ohne veraltete Meldungen lange anzuzeigen.

**Risiko:** **Hoch.** Private Infrastruktur ohne bekannten Betreibervertrag; Ausfall oder Abschaltung ist jederzeit möglich, ohne dass FSR oder FH Dortmund darauf Einfluss hätten.

**Befund zur Zertifikatsprüfung.** Über dem Abruf steht in `news_repository.dart:7` der Kommentar, die HTTPS-Vertrauensprüfung müsse umgangen werden, weil die FH Dortmund keine gültigen Zertifikate verwende. Eine solche Umgehung ist im Code jedoch **nicht vorhanden**: Es gibt weder `HttpOverrides`, noch einen `badCertificateCallback`, noch `NSAllowsArbitraryLoads` in der iOS-Konfiguration oder eine Freigabe für unverschlüsselten Verkehr unter Android. Der Aufruf erfolgt als gewöhnliches `https`-Get mit regulärer Zertifikatsprüfung. Der Kommentar ist damit ein Überbleibsel und beschreibt nicht das tatsächliche Verhalten. Festzuhalten für die Neuentwicklung: Die Zertifikatsprüfung wird unter keinen Umständen abgeschaltet. Trifft man auf ein ungültiges Zertifikat eines Hochschulsystems, ist das beim Betreiber zu klären und nicht clientseitig zu umgehen. Der Kommentar darf nicht als Vorbild oder Rechtfertigung dienen.

**Ersatzoption:** Eigener Abruf der Ursprungsquelle über das eigene Backend (INT-008), das die News-Redaktion des FSR direkt bedient, statt über die private Vermittler-Infrastruktur zu laufen.

**Status:** Aktiv, aber mit hohem Ablöserisiko; siehe `specs/decisions/0007-datenquellen-mensa-und-news.md`.

Quelle: `alte apps/fb4_app-main/fb4_app-main/lib/areas/news/repositories/news_repository.dart`, Modell `alte apps/fb4_app-main/fb4_app-main/lib/areas/news/models/news_item.dart`

#### Scenario: Meldung mit Nachmittagszeit
- **WHEN** eine Meldung mit `date` `"24.08.2026 - 14:30:00"` geladen wird
- **THEN** wertet das System sie als 14:30 Uhr aus, nicht als vormittags fehlinterpretiert

### Requirement: INT-004 — Mensa-Speisepläne (abgelöst durch INT-015)

Dieser Eintrag beschreibt den von der Flutter-Alt-App genutzten Weg und wird von der Neuentwicklung **nicht** verwendet; er bleibt zur Nachvollziehbarkeit der Ablöseentscheidung stehen. Herkunft: Alt: bewusst verworfen.

**Aufruf**
```
GET http://fb4app.hemacode.de/getMeals.php?location={city}&mensa={id}&date=YYYY-MM-DD
```
`{city}` ist `tu-dortmund` oder `fh-dortmund`, `{id}` die Mensa-Kennung.

**Antwortstruktur**
Die Antwort ist ein JSON-Objekt mit Feld `meals`, UTF-8-kodiert (wie bei INT-003 explizit zu dekodieren).

| Feld | Typ | Bedeutung |
|---|---|---|
| `meals` | Liste von Objekten | Gerichte des Tages |
| `meals[].type` | String | Kategorie, z. B. `Menü 1`, `Tagesgericht`, `Vegetarisches Menü`, `Beilagen` |
| `meals[].title` | String | Bezeichnung des Gerichts |
| `meals[].priceStudent` | Zahl | Preis für Studierende |
| `meals[].priceEmployee` | Zahl | Preis für Mitarbeitende |
| `meals[].priceGuests` | Zahl | Preis für Gäste |
| `meals[].supplies` | Liste von Strings | Zusatzstoff-/Allergenhinweise |

**Authentifizierung:** Keine. **Eigentümer/Betreiber:** Dieselbe private Infrastruktur wie INT-003 (`hemacode.de`). Fungiert als Vermittler auf OpenMensa, ist selbst keine Primärquelle. **Verfügbarkeit:** Kein bekannter Vertrag, keine zugesagte Verfügbarkeit.

**Risiko:** **Hoch, aus zwei Gründen:** erstens dieselbe private, vertragslose Infrastruktur wie INT-003; zweitens erfolgt der Aufruf **unverschlüsselt über `http://`**. Zugangsdaten werden hier zwar nicht übertragen, wohl aber die vollständige Anfrage samt Standort- und Mensa-Wahl, einsehbar für jeden Netzwerkteilnehmer auf dem Übertragungsweg.

**Ersatzoption:** **INT-015** (Mensa-API des ITMC der TU Dortmund). Die Android-Alt-App nutzt bereits eine offizielle, TLS-gesicherte und deutlich reichhaltigere Quelle.

**Status:** **Abgelöst durch INT-015** (Entscheidung FSR FB4, 2026-08-25). INT-015 liefert dieselben Inhalte über HTTPS, ohne private Vermittler-Infrastruktur, zusätzlich mit Öffnungszeiten und zweisprachigen Bezeichnungen — womit alle drei in `specs/decisions/0007-datenquellen-mensa-und-news.md` genannten Probleme (unklare Trägerschaft, fehlendes TLS, Vermittler statt Primärquelle) auf einmal entfallen.

Quelle: `alte apps/fb4_app-main/fb4_app-main/lib/areas/canteen/repositories/meals_repository.dart`, Modell `alte apps/fb4_app-main/fb4_app-main/lib/areas/canteen/models/meal.dart`

#### Scenario: Nicht mehr genutzt
- **WHEN** die Neuentwicklung Mensa-Speisepläne lädt
- **THEN** verwendet sie INT-015, nicht diesen Endpunkt

### Requirement: INT-005 — Push-Benachrichtigungen

Das System muss Nutzerinnen und Nutzer über neue News-Meldungen benachrichtigen können, sofern aktiviert, mit plattformabhängigem Zustellweg. Herkunft: Alt: alte apps/fb4_app-main/fb4_app-main/lib/utils/plugins/push_notification_manager.dart.

**Aufruf**
Nach Plattform unterschieden (Entscheidung FSR FB4, 2026-08-25, `specs/decisions/0008-vertrieb-ueber-drei-app-stores.md`):

| Plattform | Zustellweg | Registrierung/Abmeldung |
|---|---|---|
| Android | UnifiedPush: Registrierung bei einem auf dem Gerät installierten Distributor — einem FCM-basierten Distributor auf Geräten mit Google Play Services, einem quelloffenen Distributor (z. B. ntfy) auf reinen F-Droid-/GrapheneOS-Geräten | App registriert bei Aktivierung einen UnifiedPush-Endpunkt beim Backend, meldet ihn bei Deaktivierung wieder ab |
| iOS | Firebase Cloud Messaging (FCM) als Bridge zu Apples APNs, unverändert gegenüber dem ursprünglichen Plan | `subscribeToTopic("Aktuelles")` bei Aktivierung, `unsubscribeFromTopic("Aktuelles")` bei Deaktivierung |

Grund für die Unterscheidung: F-Droid existiert ausschließlich für Android und schließt proprietäre Abhängigkeiten wie FCM im Build aus; iOS ist von F-Droid nicht betroffen, und Apple lässt für Hintergrund-Push ohnehin ausschließlich APNs zu, zu dem FCM auf iOS technisch nur als Bridge dient. Auslösend ist in beiden Fällen ausschließlich eine Einstellung in der App (Opt-in); es gibt kein serverseitig erzwungenes Abonnement.

**Antwortstruktur**
Nicht abschließend bekannt: Die Alt-App verarbeitet eingehende Nachrichten nicht (der zugehörige Handler ist im Quellcode auskommentiert). Für die Neuentwicklung ist die Nutzlaststruktur einer eingehenden Nachricht (z. B. Verweis auf die zugehörige News-Meldung für Deep-Linking) für beide Zustellwege neu zu definieren. Die Nutzlast muss darüber hinaus die Metadaten mitführen, die die App für die geräteseitige Auswertung der Positiv- und Sperrliste braucht: Klassifizierung, Quelle/Verteiler und Titel der Meldung (Capability `news`). Ohne diese Felder kann die App eine Benachrichtigung nicht regelkonform unterdrücken; sie benachrichtigt dann im Zweifel und protokolliert die Abweichung. Die Regeln selbst werden nicht übertragen und sind dem Backend nicht bekannt.

**Authentifizierung:** Android: je registriertem UnifiedPush-Endpunkt eine vom Backend vergebene Endpunkt-Kennung, keine Firebase-Projektbindung. iOS: Geräteregistrierung über Firebase (projektgebunden über `google-services.json`/Firebase-Projektkonfiguration). In beiden Fällen keine Nutzerauthentifizierung.

**Eigentümer/Betreiber:** Android: kein einzelner zentraler Betreiber mehr — abhängig vom auf dem Gerät installierten Distributor. iOS: weiterhin Google (Firebase Cloud Messaging) als Bridge zu Apple (APNs).

**Verfügbarkeit:** Android: abhängig vom gewählten Distributor, nicht projektspezifisch geprüft. iOS: Google-SLA für Firebase sowie Apples APNs-Verfügbarkeit, nicht projektspezifisch geprüft.

**Risiko:** iOS bleibt wie bisher von einem außerhalb der FH Dortmund betriebenen Drittanbieterdienst abhängig; Google vergibt dabei eine pseudonyme Geräte-ID zur Zustellung (siehe Capability `security-and-privacy`). Android ist durch UnifiedPush weniger einseitig von Google abhängig, setzt aber voraus, dass auf dem Gerät ein Distributor installiert ist — ohne installierten Distributor ist auf Android kein Push möglich (Rückfalloption siehe unten).

**Ersatzoption:** Keine im Alt-Code erkennbare Alternative geprüft. Bei Verzicht oder fehlendem Android-Distributor: In-App-Benachrichtigung ohne Push als Rückfalloption.

**Status:** Aktiv, Opt-in-Verhalten wird für die Neuentwicklung beibehalten; spezifiziert in Capability `settings` und Capability `news`, datenschutzrechtliche Einordnung in Capability `security-and-privacy`. Der Fan-out-Mechanismus im Backend (ein UnifiedPush-Aufruf je Android-Endpunkt statt eines einzelnen FCM-Themen-Aufrufs) ist in Capability `backend-and-api` noch nicht spezifiziert, siehe Offene Punkte in ADR 0008.

Quelle: `alte apps/fb4_app-main/fb4_app-main/lib/utils/plugins/push_notification_manager.dart`

#### Scenario: Opt-in auf Android ohne Distributor
- **WHEN** ein Android-Gerät keinen UnifiedPush-Distributor installiert hat
- **THEN** fällt das System auf In-App-Benachrichtigung ohne Push zurück

### Requirement: INT-006 — HISinOne (Notenübersicht)

**Status: offen.** Ein *offizieller* Zugangsweg für Drittanwendungen ist weiterhin unbekannt und muss in einem Spike geklärt werden, bevor Capability `grades` umgesetzt wird. Herkunft: Recherche: portal.fh-dortmund.de, 2026-08-25.

**Befund 2026-08-25 (Android-Alt-App).** HISinOne läuft unter `https://portal.fh-dortmund.de/qisserver/`. Die Android-Alt-App meldet sich dort per Formular-Login mit den Feldern `asdf`/`fdsa` an — dieselbe Mechanik, die die Flutter-Alt-App gegen ODS verwendete, nur gegen das Nachfolgesystem und mit geräteseitig verschlüsselt gespeicherten Zugangsdaten. Sie nutzt diesen Zugang allerdings **nicht** für die Notenübersicht, sondern ausschließlich für den Semesterticket-Bezug; Details dazu in INT-017. Für die Notenübersicht ändert der Befund nichts: Ein Formular-Login mit Passwort-Replay ist für die Neuentwicklung ausgeschlossen (Capability `security-and-privacy`), unabhängig davon, gegen welches System er läuft. Der Spike bleibt damit vollständig offen — er muss klären, ob das Portal einen tokenbasierten Zugang anbietet, nicht ob ein Formular-Login technisch möglich wäre.

**Zweck**
Anzeige der individuellen Prüfungsergebnisse (Notenübersicht) der Studierenden. In HISinOne noch zu klären; nachfolgend zum Vergleich das **abgelöste** ODS-Verfahren, damit erkennbar ist, was ersetzt wird.

**Zum Vergleich: das abgelöste ODS-Verfahren**

**Aufruf (Login)**
```
POST https://ods.fh-dortmund.de/ods
```
Formularfelder: `LIMod`, `HttpRequest_PathFile`, `HttpRequest_Path`, `RemoteEndPointIP` (fest verdrahtet auf `10.11.15.121`), `User`, `PWD`, `x`, `y`. Das Sitzungstoken `SIDD` wird aus dem `content`-Attribut eines Meta-Refresh-Tags der HTML-Antwort extrahiert.

**Aufruf (Notenabruf)**
```
GET https://ods.fh-dortmund.de/ods?Sicht=DSTL&SIDD={token}
```

**Antwortstruktur**
HTML-Antwort. Die Noten werden aus der ersten Tabelle mit CSS-Klasse `maintable` gelesen, spaltenweise per festem Index:

| Spaltenindex | Bedeutung |
|---|---|
| 0 | Name |
| 1 | Semester |
| 2 | ECTS |
| 3 | Status |
| 4 | Versuch |
| 5 | Prüfungsart |
| 7 | Anmerkung |
| 8 | Note |

(Spaltenindex 6 wird von der Alt-App nicht ausgewertet.)

**Authentifizierung:** Benutzername/Passwort im Login-Formular, danach sitzungsbasiert über `SIDD` als Query-Parameter. **Eigentümer/Betreiber:** FH Dortmund (Hochschulrechenzentrum/Prüfungsamt-nahes System). **Verfügbarkeit:** Nicht dokumentiert; durch HISinOne bereits abgelöst.

**Risiko:** **Sicherheitsbefund am Altverfahren:** Die Alt-App speichert Benutzername und Passwort im Klartext im Secure Storage des Geräts und sendet sie bei jedem Ablauf des Tokens erneut an den Server (`alte apps/fb4_app-main/fb4_app-main/lib/areas/ods/repositories/ods_repository.dart`). Für die Neuentwicklung ist Passwort-Replay dieser Art **ausgeschlossen**; gefordert ist eine Anbindung über SSO oder eine offizielle, dafür vorgesehene Schnittstelle von HISinOne, nicht die Nachbildung des ODS-Verfahrens.

**Ersatzoption:** HISinOne selbst ist die Ersatzoption für ODS; welcher Zugangsweg dafür genutzt wird, ist der offene Punkt dieses Eintrags.

**Status:** Offen. Spike erforderlich vor jeder Umsetzung von Capability `grades`.

Quelle (Altverfahren): `alte apps/fb4_app-main/fb4_app-main/lib/areas/ods/services/ods_authentication_service.dart`, `alte apps/fb4_app-main/fb4_app-main/lib/areas/ods/repositories/ods_repository.dart`

#### Scenario: Kein Formular-Login gegen Hochschulsysteme
- **WHEN** die Neuentwicklung Notenübersicht anbindet
- **THEN** verwendet sie SSO oder eine offizielle HISinOne-Schnittstelle, niemals ein Formular-Login mit gespeichertem Passwort

### Requirement: INT-007 — BookStack (FSR-Wiki)

**Status: Kernzugriff bestätigt, Berechtigungsmodell offen.** Das System muss FSR-Wiki-Inhalte über die BookStack-REST-API laden. Herkunft: Recherche: wiki.fsrfb4.de/api, 2026-08-26.

**Aufruf**
Bestätigt durch Live-Testabruf (2026-08-26): BookStack bietet eine REST-API unter `https://wiki.fsrfb4.de/api/`. Genutzte Endpunkte im Test: `/shelves`, `/books`, `/books/{id}`, `/pages`, `/pages/{id}`, alle liefern JSON. Antwortheader nennen ein Rate-Limit von 180 Anfragen pro Zeitfenster (`X-RateLimit-Limit`/`X-RateLimit-Remaining`).

**Antwortstruktur**
Bestätigt: Shelf › Book › Chapter › Page. Ein Buch liefert unter `contents` eine gemischte Liste aus Kapiteln und direkt zugeordneten Seiten (Feld `type`: `"page"` oder `"chapter"`); Kapitel enthalten ihrerseits `pages`. Seiteninhalt liegt im Feld `html` (bei den geprüften, mit dem WYSIWYG-Editor erstellten Seiten befüllt) bzw. `markdown` (bei den geprüften Seiten leer, da `editor: "wysiwyg"`, nicht `"markdown"`). Für die App ist `html` deshalb die verlässlichere Quelle, nicht `markdown` wie zuvor angenommen.

**Authentifizierung:** Bestätigt: Token-ID und Token-Secret im `Authorization`-Header nach dem Muster `Authorization: Token <id>:<secret>`; ohne gültigen Token antwortet die API mit `401`. Ein Token existiert (bereitgestellt vom FSR, Token-Name `fsraas-backend`, Stand 2026-08-26) — läuft vorerst testweise über ein persönliches Nutzerkonto im Wiki, nicht über ein Dienstkonto. Für den produktiven Einsatz ist ein eigenes BookStack-Konto mit auf lesenden Zugriff beschränkten Berechtigungen vorzusehen, statt dauerhaft über ein persönliches Konto zu laufen. Das Token-Secret selbst wird nicht im Anforderungsbestand geführt.

**Eigentümer/Betreiber:** FSR Informatik. Instanz erreichbar unter `https://wiki.fsrfb4.de`, TLS bestätigt. **Verfügbarkeit:** Bestätigt erreichbar (2026-08-26). Umfang zum Prüfzeitpunkt: 2 Regale, 12 Bücher, 87 Seiten.

**Cache-Regel (Vorschlag):** Wiki-Inhalte sind änderungsarm; Seiten geräteseitig mit Ablaufzeit von einem Tag cachen, mit manueller Aktualisierungsmöglichkeit.

**Risiko:** Mittel: Der API-Zugang selbst ist bestätigt, die Berechtigungsabgrenzung dagegen nicht. Der geprüfte Token liefert uneingeschränkt alle Bücher zurück, einschließlich des Buchs „Intern" (BookStack-Beschreibung: „Diese Infos sind nicht öffentlich"). Ohne ein auf freigegebene Inhalte beschränktes Konto oder eine serverseitige Positivliste würde die App interne FSR-Inhalte an Studierende ausliefern.

**Ersatzoption:** Eingebettete Webansicht (WebView) der BookStack-Instanz als Rückfalloption, falls der native Weg aus Berechtigungsgründen nicht tragfähig ist.

**Status:** Kernzugriff bestätigt (URL, Authentifizierung, Antwortstruktur, HTML-Inhalt). Offen bleibt, mit welchem Berechtigungsmodell freigegebene von internen Inhalten getrennt werden — siehe `specs/decisions/0005-wiki-bookstack-anbindung.md`.

Quelle: Live-Testabruf gegen `https://wiki.fsrfb4.de/api/` mit vom FSR bereitgestelltem Token, 2026-08-26.

#### Scenario: Interner Inhalt ohne Berechtigungsabgrenzung
- **WHEN** kein auf freigegebene Inhalte beschränktes Konto oder keine serverseitige Positivliste konfiguriert ist
- **THEN** darf die App das Buch „Intern" nicht an Studierende ausliefern — Umsetzung des Berechtigungsmodells ist Voraussetzung für den produktiven Einsatz

### Requirement: INT-008 — Eigenes Backend

**Status: Betreiber geklärt, Vertrag in `api-contract.yaml` spezifiziert.** Das System muss die Community- und Aggregationsfunktionen, für die es keine geeignete externe Schnittstelle gibt, über ein eigenes Backend tragen. Herkunft: NEU.

Aufgaben: Entgegennahme und Auslieferung der Mensa-Bewertungen (RATE). Verwaltung der Events und Helfer-Anmeldungen (EVENT, HELFER). Vermittlung der E-Key-Verknüpfungen (EKEY) an das bestehende E-Key-Verwaltungstool des FSR (INT-014) — keine eigene E-Key-Datenhaltung, siehe dort. Periodischer Abruf und Zwischenspeicherung der Raumtermine aus INT-009 (Wildcard-Form); **keine** Zusammenführung über Studiengang/Semester-Kombinationen mehr — siehe Nutzungshinweis bei INT-009. Vorgelagerter Zwischenspeicher für INT-003, INT-010 und INT-015 zur Ablösung der Abhängigkeit von `hemacode.de` und zur Entkopplung der App von HTML-Auswertungen. Pflege und Auslieferung der Stammdaten, die keine externe Quelle hat: Mensa-Liste, Raumliste, Links- und Downloads-Liste, Semestertermine, Ticket-Bildzuschnitt.

**Aufruf**
`openspec/specs/api-contract.yaml` — versionierte OpenAPI-Beschreibung, Quelle der Wahrheit für jeden Aufruf zwischen App beziehungsweise Admin-Oberfläche und Backend (`specs/decisions/0011-monorepo-und-openapi-vertrag.md`). Aufgabenschnitt und Prinzipien: Capability `backend-and-api`.

**Antwortstruktur**
Siehe `openspec/specs/api-contract.yaml`.

**Vorgänger: `app.fsrfb4.de` (abzulösen)**
Der FSR betreibt bereits ein Backend unter `https://app.fsrfb4.de`, das die Android-Alt-App bedient. Es ist am 2026-08-25 erreichbar und liefert drei von der App genutzte Ressourcen. **Ergänzung 2026-08-26:** Der Quellcode dieses Backends (`alte apps/app.fsrfb4.de/`) liegt inzwischen ebenfalls vor — ein schlankes PHP-System ohne Framework, MySQL als Datenhaltung. Er bestätigt und verfeinert den zuvor nur live erprobten Befund:

| Aufruf | Zweck |
|---|---|
| `GET /data`, `POST /data` (Feld `Key`) | Ferngepflegte Stammdaten als Liste von Schlüssel-Wert-Paaren |
| `POST /messages/messages.php` (Felder `Sprache`, `API`, `VersionCode`) | Serverseitige Hinweise an die App, abhängig von Sprache und App-Version |
| `GET /studiengaenge.json` | Rückfallliste der Studiengänge, falls INT-001 nicht erreichbar ist |

Beobachtete Schlüssel unter `/data`: `semester_beginning`, `semester_end`, `ws_start`, `ss_start`, `examplan`, `timeplan`, `ticket_rect_coordinates`, `canteens`, `rooms`, `links`, `file_downloads`, `news_url`.

**Lese-/Schreibtrennung bei `/data` (Quellcode-Befund).** `data/index.php` (Lesepfad, von der App aufgerufen) und `data/admin/data.php` (Schreibpfad) sind zwei getrennte Skripte gegen dieselbe MySQL-Tabelle `app_data` (Spalten `datakey`/`Value`, `INSERT … ON DUPLICATE KEY UPDATE`). Der Schreibpfad liegt hinter HTTP-Basic-Auth (`.htaccess`/`.htpasswd`) und wird über ein einfaches HTML-Formular bedient, das je Aufruf genau ein Schlüssel-Wert-Paar setzt — keine Übersicht, keine Validierung, keine Historie. Das ist die technische Ursache des veralteten Bestands (siehe unten) und stützt konkret, warum Capability `admin` eine echte Pflegeoberfläche statt eines Formulars vorsieht.

**Feinstruktur von `/messages/messages.php` (Quellcode-Befund).** Ein Hinweis ist reichhaltiger als ein einzelner Datensatz: `ID`, zweisprachiger `Titel`/`Text` (Spaltenpaare `_de`/`_en`), bis zu zwei Buttons mit je eigenem zweisprachigem Text und einer serverseitig hinterlegten Aktion (`Button1Action`/`Button2Action` — Bedeutung aus dem PHP-Code allein nicht ableitbar, vermutlich ein clientseitig interpretierter Aktionscode), eine `Dauerhaft`-Kennzeichnung sowie Gültigkeit über Bereiche von Android-API-Level (`Min_API`/`Max_API`) und `VersionCode` (`Min_VersionCode`/`Max_VersionCode`), gefiltert auf `Aktiv = TRUE`. Das ist eine gezielte Handlungsaufforderung, kein Nachrichtentext — relevant für die offene Frage in `specs/open-questions.md`, ob dieser Mechanismus eigenständig fortgeführt oder in NEWS aufgelöst wird.

**Verwaiste Endpunkte (Quellcode-Befund, nicht zuvor bekannt).** `feedback/feedback.php` nimmt POST-Daten (`Name`, `Feedback`, `Api`, `VersionCode`) entgegen und legt sie in der Tabelle `app_feedback` ab, die serverseitig zusätzlich `Nr` (fortlaufend, Primärschlüssel) und `Zeit` (Zeitstempel) führt. Zwei weitere, per HTTP-Basic-Auth geschützte Skripte lesen diesen Bestand lesend aus: `feedback/admin/api.php` (JSON, alle Spalten) und `feedback/admin/index.php` (dieselben Daten als HTML-Tabelle, ohne Lösch- oder Bearbeitungsfunktion — reine Anzeige). Beide Alt-Apps rufen `feedback.php` jedoch **nicht** auf — Android wie Flutter öffnen für „Feedback" stattdessen den Mail-Client (`specs/product/legacy-inventory.md`, AND-036/L-074). Der gesamte Feedback-Pfad ist damit ohne Client und braucht in der Neuentwicklung keine Entsprechung.

**Vollständigkeitsprüfung 2026-08-26.** Der abgelegte Codestand von `app.fsrfb4.de` enthält, außerhalb der vendorierten Drittbibliothek `*/admin/passwd/` (Login-Oberfläche der Admin-Bereiche, Fremdcode), genau sechs PHP-Dateien — alle oben genannt, keine weiteren. Die `.htaccess`-Dateien beider Admin-Verzeichnisse erzwingen HTTPS und HTTP-Basic-Auth, enthalten aber keine Rewrite-Regeln auf weitere, hier nicht erfasste Routen.

**Der Datenbestand ist veraltet:** Die live abgefragte Antwort vom 2026-08-25 liefert `semester_beginning: 25.09.2023` und `semester_end: 19.01.2024` — Werte aus dem Wintersemester 2023/24. Der Dienst läuft, wird aber nicht mehr gepflegt.

Entscheidung FSR FB4, 2026-08-25: Das fachliche Konzept der ferngepflegten Stammdaten wird übernommen, die technische Umsetzung neu gebaut. Die Pflege wandert in die Admin-Oberfläche (Capability `admin`), die Auslieferung in den OpenAPI-Vertrag. `app.fsrfb4.de` wird nach der Umstellung abgeschaltet; die dort verlinkte private Domain `hoolycraap.de` entfällt damit ebenfalls.

Der Rückfallmechanismus `studiengaenge.json` ist übernehmenswert: Er macht die Studiengangsauswahl unabhängig von der Erreichbarkeit des Hochschulsystems und gehört als Muster in den Zwischenspeicher-Anteil des neuen Backends. Anmerkung 2026-08-26: Im abgelegten Quellcode-Stand von `app.fsrfb4.de` ist keine `studiengaenge.json` als statische Datei auffindbar — möglicherweise, weil die vorliegende Ablage nicht jede statische Asset-Datei enthält. Live-Erreichbarkeit war am 2026-08-25 nicht Gegenstand der Prüfung; vor Umsetzung kurz zu bestätigen, dass der Rückfallbestand tatsächlich noch existiert.

Quelle: `alte apps/android-fb4/FB4/fB4/src/main/java/de/fsrfb4/fb4/module/NetworkModule.java`, `service/DataService.java`, `retrofit/DataUpdateApi.java`, `retrofit/ServerMessageApi.java`, `retrofit/TimeTableFallbackApi.java`; live abgefragt am 2026-08-25; Backend-Quellcode vollständig ausgewertet 2026-08-26: `alte apps/app.fsrfb4.de/data/index.php`, `data/admin/data.php`, `messages/messages.php`, `feedback/feedback.php`, `feedback/admin/api.php`, `feedback/admin/index.php`

**Authentifizierung:** Über INT-012 (Authentik, OpenID Connect) — siehe dort für den Ablauf; dieser Eintrag verweist nur, um Endpunktdetails nicht zu duplizieren.

**Eigentümer/Betreiber:** FSR FB4 selbst, auf einem eigenen Hetzner-VPS. Zugriffsverwaltung und Backup-Ziel: `specs/decisions/0017-zugriff-und-datensicherung-vps.md`.

**Verfügbarkeit:** Betriebsverantwortung liegt beim FSR FB4 selbst, nicht bei einem Dritten. Konkrete Verfügbarkeitszusage (SLA gegenüber den Nutzenden) noch zu definieren.

**Cache-Regel (Vorschlag):** Für den Zwischenspeicher-Anteil (News/Mensa): serverseitiger Abruf der Ursprungsquellen in festem Intervall, App fragt ausschließlich das eigene Backend ab, nie direkt `hemacode.de` oder OpenMensa.

**Risiko:** Liegt im eigenen Verantwortungsbereich (Betrieb, Kapazität, Sicherheit), anders als bei den übrigen, extern betriebenen Schnittstellen. Kein Fremdbetriebsrisiko, aber voller Aufwand für Bau und Betrieb selbst zu tragen.

**Ersatzoption:** Nicht zutreffend — dies ist selbst die Ersatzoption für INT-003/INT-004 und die einzige Option für RATE/EVENT/HELFER.

**Status:** Betreiber geklärt (FSR FB4, Hetzner-VPS). Aufruf und Antwortstruktur stehen im OpenAPI-Vertrag, Authentifizierung über INT-012. Siehe Capability `backend-and-api` und `specs/decisions/0003-eigenes-backend-fuer-community-funktionen.md`.

#### Scenario: App fragt nie Drittquellen direkt ab
- **WHEN** die App News, Mensa-Speisepläne oder Raumtermine anzeigt
- **THEN** ruft sie ausschließlich das eigene Backend ab, nie `hemacode.de`, OpenMensa oder den FBWS direkt

### Requirement: INT-009 — FBWS Raumplan

Das System muss die Termine eines einzelnen Raums oder aller Räume direkt über den Wildcard-Endpunkt laden, ohne Umweg über die Iteration aller Studiengang/Semester-Kombinationen. Herkunft: Alt: alte apps/android-fb4/FB4/fB4/src/main/java/de/fsrfb4/fb4/retrofit/TimetableApi.java.

**Aufruf**
```
GET https://ws.inf.fh-dortmund.de/timetable/current/rest/Room/{roomId}/AllEvents?Accept=application/json
GET https://ws.inf.fh-dortmund.de/timetable/current/rest/Room/*/AllEvents?Accept=application/json
```
`{roomId}` ist die Raumkennung im selben Format wie das Feld `roomId` aus INT-002 (z. B. `A.E.01`). Live erprobt am Beispiel `A.E.01`.

**Wildcard-Form (Befund 2026-08-25).** Anstelle einer einzelnen Raumkennung ist `*` zulässig; der Endpunkt liefert dann die Termine **aller** Räume in einer einzigen Antwort. Die Android-Alt-App nutzt genau diese Form produktiv für ihre Raumsuche (`retrofit/TimetableApi.java`, Methode `getAllEvents()`; ausgewertet in `service/RoomService.java`). Damit ist die zuvor unter „Risiko" vermerkte Unsicherheit über die Raumabdeckung gegenstandslos: Es ist keine Iteration über bekannte Raumkennungen nötig, und es entsteht keine Lücke durch unbekannte Räume.

**Antwortstruktur**
Die Antwort ist eine JSON-Liste. Datensätze enthalten deutlich mehr Felder als der Termindatensatz aus INT-002:

| Feld | Typ | Bedeutung |
|---|---|---|
| `id` | Zahl | Datensatz-ID |
| `name` | String | Bezeichnung der Veranstaltung bzw. Prüfung |
| `eventType` | String | `Event` (u. a. Prüfungen) oder `Course` (reguläre Lehrveranstaltung) |
| `courseId` | String | Kennung der Lehrveranstaltung, bei Prüfungsdatensätzen leer |
| `courseOfStudy` | String | Studiengang-Kurzname, bei Prüfungsdatensätzen leer |
| `examinationReg` | String | Prüfungsordnung, z. B. `2019 84 079 PR` |
| `lecturerId` / `lecturerName` / `lecturerSurname` | String | Lehrperson, bei Prüfungsdatensätzen leer |
| `studentSet` | String | wie INT-002 |
| `roomId` | String | Raumkennung, entspricht dem angefragten `{roomId}` |
| `dateBegin` / `dateEnd` | Zahl (Unix-Zeitstempel, Tagesgranularität) | Gültigkeitszeitraum der Terminserie |
| `timeBegin` / `timeEnd` | String, Format `Hmm`/`HHmm` ohne führende Null | wie INT-002, gleiche Auffüllregel nötig |
| `timestampBegin` / `timestampEnd` | Zahl (Unix-Zeitstempel) | konkreter Beginn/Ende einer einzelnen Instanz |
| `weekday` | String | wie INT-002 |
| `interval` | Zahl oder String | Wiederholungsintervall — nach einem Hinweis des FSR FB4 (2026-08-25) vermutlich Rhythmus in Wochen (z. B. `2` für zweiwöchentlich); unverifiziert, siehe Capability `schedule` |
| `note` | String | Freitext, bei Prüfungen z. B. `Bitte nicht stören!` |
| `flags` | Zahl | unklare Bedeutung, nicht weiter untersucht |
| `creator` | String oder null | Urheber des Eintrags, meist leer |
| `created` | Zahl | Anlagezeitpunkt bzw. -zähler, Bedeutung unklar (Wert `19` beobachtet — keine plausible Unix-Zeit) |
| `modified` | Zahl (Unix-Sekunden) | Zeitpunkt der letzten Änderung des Datensatzes |
| `termId`, `grade`, `description`, `timeSlotBegin`, `timeSlotDuration`, `timeSlotColum` | wie INT-002 | bei `eventType: "Event"` durchgängig leer oder `null` |

**Nachprüfung 2026-09-04.** Drei Ergänzungen zum Stand vom 2026-08-24: (1) **`modified` ist vorhanden** — damit lässt sich serverseitig erkennen, welche Raumplan-Termine sich seit dem letzten Abruf geändert haben. (2) **`interval` ist bei `eventType: "Event"` die Zahl `0`**, während INT-002 dasselbe Feld als Zeichenkette `"weekly"` führt; ein gemeinsamer Typ existiert nicht. (3) **Prüfungen tragen ein erkennbares Namensmuster:** `"Prüfung 42032 Rechnerstrukturen und Betriebssysteme 2"` — also `Prüfung <courseId> <Bezeichnung>` mit Raum, Datum und Uhrzeit, bei leerem `courseId`-Feld.

**Befund zur Vollständigkeit (2026-09-04, offen).** Ein Abruf von `Room/A.2.02/AllEvents` lieferte lediglich zwei Einträge, beide `eventType: "Event"` — obwohl `A.2.02` in INT-002 als Raum regulärer Lehrveranstaltungen geführt wird. Ob die raumbezogene Form nur Einzelbuchungen ausweist, ob die Raumkennung dort anders geschrieben wird oder ob der Wildcard-Aufruf einen anderen Bestand liefert, ist ungeklärt.

**Authentifizierung:** Keine. **Eigentümer/Betreiber:** Fachbereich Informatik, FH Dortmund (dieselbe FBWS-Infrastruktur wie INT-001/INT-002, eigener Pfad `/timetable/` statt `/fbws/`). **Verfügbarkeit:** Nicht dokumentiert, kein bekanntes SLA.

**Cache-Regel (Vorschlag):** Wie INT-002: kurze Ablaufzeit (Vorschlag: ein Tag), da Terminänderungen kurzfristig möglich sind.

**Risiko:** Wie INT-001/INT-002 (dieselbe Infrastruktur unter demselben Pfadpräfix, keine erkennbare Versionierung). Verbleibendes Risiko: Der Endpunkt liefert Rohtermine, keine berechnete Frei/Belegt-Auskunft — diese Ableitung erfolgt weiterhin im eigenen Code (Capability `room-finder`).

**Ersatzoption:** INT-001 + INT-002, über `roomId` zusammengeführt. Nach dem Wildcard-Befund nur noch als Notbehelf relevant, falls der Wildcard-Aufruf wegfällt.

**Status:** Bestätigt und produktiv erprobt. Der Wildcard-Aufruf ist der vorgesehene Weg für die Raumsuche.

**Nutzung (Stand 2026-09-03).** Der Zwischenspeicher dieses Endpunkts speist mehrere App-Sichten: die Freie-Raum-Suche, die Raumübersicht und die Ansicht laufender Veranstaltungen sowie den Abgleich der Stundenplan-Termine gegen den Raumplan (Capability `schedule`). Vor Umsetzung von Roadmap-Schritt 6 als Spike zu klären: ob dieser Endpunkt kurzfristige Ausfälle und Raumänderungen abbildet oder nur den Sollplan.

**Bezug zu Architektur/Backend.** Frühere Requirements gingen davon aus, Raumbelegung sei nur durch Zusammenführung der Termine aller Studiengang/Semester-Kombinationen herleitbar, und begründeten damit einen wesentlichen Teil des eigenen Backends. Der Wildcard-Befund vom 2026-08-25 widerlegt diese Annahme vollständig. Entscheidung FSR FB4, 2026-08-25: Die Zusammenführung entfällt ersatzlos; das Backend ruft den Wildcard-Endpunkt periodisch ab und hält das Ergebnis als Zwischenspeicher vor. Die betroffenen Requirements in Capability `architecture` und `backend-and-api` sind entsprechend angepasst.

Quelle: live abgefragt am 2026-08-24, `https://ws.inf.fh-dortmund.de/timetable/current/rest/Room/A.E.01/AllEvents?Accept=application/json`; Wildcard-Form aus `alte apps/android-fb4/FB4/fB4/src/main/java/de/fsrfb4/fb4/retrofit/TimetableApi.java`, 2026-08-25

#### Scenario: Alle Raumtermine in einem Aufruf
- **WHEN** der Wildcard-Aufruf `Room/*/AllEvents` genutzt wird
- **THEN** liefert das System alle Raumtermine in einer Antwort, ohne Iteration über Studiengang/Semester-Kombinationen

### Requirement: INT-010 — Fachbereichs-Aktuelles (aktuelles-ni)

**Status: geklärt (2026-08-25).** Das System muss die Fachbereichs-Nachrichtenseite `aktuelles-ni` per HTML-Auswertung als Quelle für die Klassifizierung „FB-Aktuelles" laden. Herkunft: Alt: alte apps/android-fb4/FB4/fB4/src/main/java/de/fsrfb4/fb4/util/NewsParserImpl.java.

**Zweck**
Liefert die Fachbereichs-Nachrichtenseite (Prüfungsinfos, Raumänderungen, Stellenausschreibungen, Fundsachen) als Quelle für die Klassifizierung „FB-Aktuelles" in NEWS. Entscheidung FSR FB4, 2026-08-25: `aktuelles-ni` wird als zusätzliche News-Quelle integriert, siehe Capability `news`.

**Aufruf**
```
GET https://www.inf.fh-dortmund.de/aktuelles-ni/seite
GET https://www.inf.fh-dortmund.de/aktuelles-ni/seite/{page}
```
`{page}` ist eine fortlaufende Seitenzahl für ältere Meldungen. Beide Formen liefern HTML, keinen strukturierten Feed.

**Antwortstruktur**
HTML. Die Android-Alt-App wertet sie mit Jsoup aus (`util/NewsParserImpl.java`): Vor dem Parsen wird `<p class='title'>` durch `<div><p class='title'>` ersetzt, um die flach ausgelieferten Meldungen in abgrenzbare Blöcke zu zerlegen. Für die Neuentwicklung ist die Feldzuordnung am aktuellen Seitenaufbau zu überprüfen, da sie sich seit der letzten Android-Version geändert haben kann.

**Authentifizierung:** Keine — öffentlich zugängliche Fachbereichsseite. **Eigentümer/Betreiber:** Fachbereich Informatik, FH Dortmund — nicht der FSR. **Verfügbarkeit:** Unbekannt, kein bekanntes SLA.

**Cache-Regel (Vorschlag):** Wie INT-003 (News-Feed): kurzfristig serverseitig cachen (Vorschlag: 15 Minuten bis 1 Stunde).

**Risiko:** Mittel. Da kein strukturierter Feed existiert, bleibt die Anbindung dauerhaft anfällig für Layout-Änderungen der Fachbereichsseite, außerhalb der Kontrolle des FSR — bestätigte Betriebsrealität der Android-Alt-App. Konsequenz: Die Auswertung gehört ins Backend (INT-008), nicht in die App — eine Anpassung an ein geändertes Seitenlayout ist dann eine Server-Änderung statt eines App-Updates. Die Auswertung muss bei unerwartetem Aufbau erkennbar fehlschlagen, statt leere oder verstümmelte Meldungen zu liefern (Capability `quality-and-testing`).

**Ersatzoption:** Keine bekannte Alternativquelle für dieselben Inhalte. Bei Ausfall: zuletzt erfolgreich ausgewerteter Stand weiter ausliefern, mit Alters-Hinweis.

**Status:** Geklärt. Vor Umsetzung bleibt lediglich die Feldzuordnung am aktuellen Seitenaufbau zu überprüfen.

Quelle: `alte apps/android-fb4/FB4/fB4/src/main/java/de/fsrfb4/fb4/retrofit/NewsApi.java`, `util/NewsParserImpl.java`, `module/NetworkModule.java`, 2026-08-25

#### Scenario: Unerwarteter Seitenaufbau
- **WHEN** die HTML-Struktur der Fachbereichsseite von der erwarteten Form abweicht
- **THEN** schlägt die Auswertung im Backend erkennbar fehl, statt leere oder verstümmelte Meldungen auszuliefern

### Requirement: INT-011 — FSR-Event-Kalender (ICS)

**Status: Dienst geklärt, technische Details offen.** Das System muss die vom FSR redaktionell gepflegten Events als ICS-Kalender laden. Herkunft: NEU. Ersetzt die ursprünglich vorgesehene Backend-Redaktionsoberfläche für Events — Entscheidung FSR FB4, 2026-08-25.

**Aufruf**
Google Calendar (Entscheidung FSR FB4, 2026-08-25). Eine spätere Ablösung durch ein selbstgehostetes Produkt (z. B. CalDAV auf dem FSR-eigenen Hetzner-VPS) ist ausdrücklich vorgemerkt, aber nicht terminiert. Zugriff über die von Google Calendar bereitgestellte öffentliche ICS-Freigabe-URL des FSR-Kalenders, die das eigene Backend (INT-008) periodisch importiert.

**Antwortstruktur**
Standard-iCalendar-Format (RFC 5545): `VEVENT`-Komponenten mit u. a. `UID`, `SUMMARY`, `DTSTART`, `DTEND`, `LOCATION`, `DESCRIPTION`, `STATUS` (u. a. `CONFIRMED`, `CANCELLED`).

**Authentifizierung:** Abhängig vom gewählten Kalenderdienst. **Eigentümer/Betreiber:** FSR FB4 selbst. **Verfügbarkeit:** Abhängig vom gewählten Kalenderdienst, noch zu definieren.

**Cache-Regel (Vorschlag):** Periodischer Import durch das Backend (Vorschlag: alle 15–60 Minuten), App fragt ausschließlich das eigene Backend ab.

**Risiko:** Gering bis mittel: Der FSR kontrolliert die Inhalte selbst, die Infrastruktur liegt jedoch bei Google. Verknüpfung eines importierten ICS-Events mit optionalem Helferbedarf (Capability `event-volunteers`) erfolgt über `UID` (bestätigt).

**Ersatzoption:** Bei künftiger Ablösung: selbstgehostetes CalDAV auf dem Hetzner-VPS (vorgemerkt, nicht terminiert).

**Status:** Kalenderdienst geklärt (Google Calendar, 2026-08-25), Matching-Schlüssel für Helferbedarf-Verknüpfung bestätigt (`UID`). Noch offen: genaue Freigabe-URL/-Konfiguration.

#### Scenario: Abgesagtes Event
- **WHEN** ein `VEVENT` mit `STATUS:CANCELLED` importiert wird
- **THEN** kennzeichnet das System das Event als abgesagt

### Requirement: INT-012 — Authentik (Identitätsanbieter)

**Status: Anbieter entschieden, Federation zur FH ausstehend.** Das System muss Authentik als einzigen Identitätsanbieter für App, Admin-Oberfläche und Backend verwenden. Herkunft: NEU. Entscheidung FSR FB4, 2026-08-25, siehe `specs/decisions/0010-authentik-als-identitaetsanbieter.md`.

**Zweck**
Trägt das Konto, das für das Verfassen von Mensa-Bewertungen (RATE), die E-Key-Verwaltung (EKEY) und den Zugang zur Verwaltung (ADMIN) benötigt wird, und liefert zugleich die Rollenzugehörigkeit (FSR-Redaktion, Moderation) als Claim.

**Aufruf**
OpenID Connect, Authorization-Code-Fluss mit PKCE, Redirect über den Systembrowser. Die Instanz läuft eigenbetrieben auf demselben Hetzner-VPS wie INT-008; konkrete Issuer-URL, Client-Kennungen und Scopes werden bei Einrichtung festgelegt. Die Anbindung an die Hochschule erfolgt **nicht** aus der App, sondern als Upstream-Federation innerhalb von Authentik gegen den Microsoft-Mandanten der FH Dortmund. Für App und Backend ist dieser Upstream unsichtbar. Ausdrücklich ausgeschlossen bleibt jede Nachbildung eines Formular-Logins gegen ein Hochschulsystem, wie sie beide Alt-Apps praktizieren (INT-006, INT-017) — siehe Capability `security-and-privacy`.

**Antwortstruktur**
Standardkonform: ID-Token und Access-Token als JWT, Nutzerangaben über den Userinfo-Endpunkt. Rollen als Gruppen-Claim.

**Authentifizierung:** Gegenüber Authentik: das gewählte Anmeldeverfahren der Instanz. Solange die FH-Federation nicht steht, sind das eigene Authentik-Konten mit E-Mail-Verifizierung; danach die Weiterleitung an den FH-Mandanten.

**Eigentümer/Betreiber:** FSR FB4 selbst (Authentik-Instanz). Der Upstream-Mandant liegt bei der FH Dortmund.

**Verfügbarkeit:** Eigener Verantwortungsbereich, wie INT-008. Ein Ausfall betrifft alle kontogebundenen Funktionen gleichzeitig; kontofreie Lesefunktionen bleiben unberührt.

**Risiko:** Gering bis mittel. Verbleibendes Risiko ist der Eigenbetrieb einer weiteren sicherheitskritischen Komponente (Aktualisierung, Sicherung, Verfügbarkeit).

**Ersatzoption:** Nicht zutreffend — Authentik ist selbst die Ersatzoption für den zuvor angenommenen, ungeklärten Hochschul-SSO-Weg.

**Verwaltungs-API (Gruppen und Mitgliedschaft).** Für die Rollenzuweisung schreibt das Backend die Gruppenmitgliedschaft in Authentik über dessen REST-Verwaltungs-API unter `https://<instanz>/api/v3/`. Rollen sind Authentik-Gruppen; das Backend hält keine eigene Rollentabelle.

| Zweck | Aufruf (Authentik `api/v3`) | Ausgewertete Felder |
|---|---|---|
| Konto-ID zu einem Benutzernamen ermitteln | `GET core/users/?username={Benutzername}` | `results[].pk` (Ganzzahl), `results[].username` |
| Gruppen-ID zu einem Namen ermitteln | `GET core/groups/?name={Gruppenname}` | `results[].pk` (UUID), `results[].name` |
| Mitglieder einer Gruppe lesen | `GET core/groups/{pk}/` | `pk`, `name`, `users_obj[].pk` (Ganzzahl), `users_obj[].username`, `users_obj[].name` |
| Konto einer Gruppe hinzufügen | `POST core/groups/{pk}/add_user/` mit `{ "pk": "{kontoId}" }` | HTTP-Status |
| Konto aus einer Gruppe entfernen | `POST core/groups/{pk}/remove_user/` mit `{ "pk": "{kontoId}" }` | HTTP-Status |

Die Verwaltungsoberfläche listet Konten mit bestehender Rolle über den Gruppen-Lesepfad. Ein Konto **ohne** bisherige Rolle benennt die bedienende Person über den Benutzernamen; das Backend löst ihn über `core/users/?username=` zur `pk` auf, bevor Aussperrprüfung und Protokolleintrag darauf arbeiten. Eine bereits numerische Kennung wird ohne Auflösung übernommen.

**Authentifizierung (Verwaltungs-API):** Bearer-Token eines Authentik-Dienstkontos (Intent *API*) mit Schreibrecht auf die betreffenden Gruppen — am einfachsten Mitglied von `authentik Admins`. Token und Basis-URL kommen ausschließlich aus der Backend-Konfiguration bzw. einem Secret-Mechanismus, nie aus dem Quellcode oder einer Feature-Capability.

**Status dieser Teil-Schnittstelle:** Lesepfad **live verifiziert am 2026-09-03** gegen die eigenbetriebene Instanz `auth.tobtech.de`: `GET core/groups/?name=…` liefert je Gruppe `pk`/`name`, `GET core/groups/{pk}/` liefert `users_obj` mit genau den Feldern `pk`/`username`/`name`. Die Gruppen `FSR-Redaktion` und `Moderation` existieren. Der Schreibpfad (`add_user`/`remove_user`) und die Benutzernamen-Auflösung sind strukturell aus derselben API bekannt, ein Round-Trip gegen die Instanz steht noch aus. Vertragstest gegen diese Struktur: `AuthentikDirectoryContractTests`. Ohne konfigurierte API meldet das Backend die Rollenverwaltung als „nicht verfügbar" (503), statt still zu scheitern.

**Status:** Anbieter entschieden, OIDC-Discovery und Verwaltungs-API-Lesepfad gegen `auth.tobtech.de` verifiziert (2026-09-03). Offen: Zeitpunkt und Ergebnis der App-Registrierung im FH-Microsoft-Mandanten, welche Claims der Upstream liefert, und der Schreib-Round-Trip der Verwaltungs-API. Nichts davon blockiert die Umsetzung.

#### Scenario: Rollenverwaltung ohne konfigurierte API
- **WHEN** die Authentik-Verwaltungs-API nicht konfiguriert ist
- **THEN** meldet das Backend die Rollenverwaltung als nicht verfügbar (503), statt still zu scheitern

### Requirement: INT-013 — Prüfungsplan (Intranet-Excel)

**Status: zu definieren.** Das System muss den offiziellen Prüfungsplan über einen halbautomatischen Excel-Import verarbeiten, da kein automatisierter API-Zugriff möglich ist. Herkunft: Recherche: resources/pplan.xlsx, 2026-08-25.

**Zweck**
Liefert den offiziellen Prüfungsplan (Termine, keine Ergebnisse) des Fachbereichs als Grundlage für die Prüfungsauswahl im Stundenplan (Capability `schedule`). Nicht zu verwechseln mit HISinOne/INT-006 (Notenergebnisse).

**Aufruf**
Der Fachbereich veröffentlicht den Prüfungsplan als Excel-Datei zu einem variablen Zeitpunkt während der Vorlesungszeit auf einer Intranet-Seite, die einen Hochschul-Login voraussetzt, den weder App noch Backend besitzen (Passwort-Replay ist ausgeschlossen, Capability `security-and-privacy`). Der Zugriff ist deshalb **kein automatisierter API-Aufruf**, sondern ein zweistufiger, halbautomatischer Vorgang: Ein FSR-Mitglied oder Admin lädt die Datei manuell aus dem Intranet herunter und lädt sie anschließend in das eigene Backend hoch (Capability `backend-and-api`), das die Datei parst und weiterverarbeitet.

**Antwortstruktur**
Excel-Datei, ein Arbeitsblatt `PP`. Fünf reale Dateien der Jahrgänge WiSe 2023/24 bis SoSe 2026 liegen unter `resources/` vor.

| Bereich | Inhalt |
|---|---|
| Kopfzeilen | Semesterbezeichnung, `Stand:`-Datum, Prüfungszeitraum, Farblegende |
| Zeilenachse | je Prüfung eine Zeile: `Anmeldezeitraum`, `WT`, `Datum`, `Zeit`, `Raum` (mehrzeilig), `Num.`, `Name`, `Prüfer/in` |
| Spaltenachse ab Spalte I | Matrix aus Studiengang × Vertiefung × Prüfungsordnung |
| Zellwerte der Matrix | Fachsemester als Zahl oder Wahlkategorie als Kürzel (`1`, `2`, `4`, `5`, `W`, `Fo`, `Pr`) |
| Trennzeilen | Zeilen mit Datum, aber ohne Prüfungsangaben, die Tagesabschnitte gliedern |

Drei Eigenschaften erschweren den Import: Die Kopfzeilen-Position schwankt zwischen den Jahrgängen, die Spaltenzahl variiert (33 bis 44), und Zellhintergrundfarben tragen Bedeutung — ein Import, der nur Zellwerte liest, verliert diese Information. Fachlich wertvoll ist die Matrix: Sie liefert die Zuordnung Prüfung → (Studiengang, Vertiefung, Prüfungsordnung, Fachsemester).

**Authentifizierung:** Hochschul-Intranet-Login für den manuellen Download durch den Admin — betrifft nur diesen manuellen Schritt. **Eigentümer/Betreiber:** Fachbereich Informatik, FH Dortmund (Intranet). **Verfügbarkeit:** Nicht dokumentiert; Veröffentlichungszeitpunkt variabel.

**Risiko:** Mittel: Kein technisches Zugriffsrisiko, da App/Backend keine Hochschul-Zugangsdaten halten. Abhängigkeit von einem manuellen Schritt durch eine verantwortliche FSR-Person; Datei-Format kann sich zwischen Jahren ändern.

**Ersatzoption:** Keine bekannte automatisierte Alternative.

**Status:** Struktur grob erfasst. Grundsatzentscheidung (halbautomatischer Import statt Live-API-Zugriff) getroffen, FSR FB4, 2026-08-25. Feldgenaue Festlegung erfolgt bewusst erst bei Umsetzung in der zweiten Ausbaustufe.

**Nebenbefund (2026-08-25).** Die Android-Alt-App importiert den Prüfungsplan nicht, sondern verlinkt ihn nur (Schlüssel `examplan`, aktuell `http://hoolycraap.de/fh/pruefungsplan.pdf`, unverschlüsselt). Der geplante Import ist eine echte Neuerung gegenüber dem Stand beider Alt-Apps.

Quelle: `resources/pplan.xlsx`, `resources/pplan(1).xlsx` bis `resources/pplan(4).xlsx`, ausgewertet 2026-08-25

#### Scenario: Neuer Prüfungsplan-Jahrgang hochgeladen
- **WHEN** ein Admin eine neue Prüfungsplan-Excel-Datei hochlädt
- **THEN** ersetzt das Backend den Bestand vollständig, unabhängig von Kopfzeilen-Position und Spaltenzahl des Jahrgangs

### Requirement: INT-014 — E-Key-Verwaltungstool (Postgres)

**Status: zu definieren.** Das System muss sich mit dem bestehenden E-Key-Verwaltungstool integrieren, statt eine eigene parallele Datenhaltung aufzubauen. Herkunft: NEU.

**Zweck**
Bestehendes, vom FSR bereits eigenständig betriebenes Tool zur Verwaltung von E-Key-Ausgaben, Berechtigungen und Status — System der Wahrheit für alle E-Key-Daten. Das neue App-Backend (INT-008) integriert sich hiermit (Entscheidung FSR FB4, 2026-08-25, siehe Capability `e-key`).

**Aufruf**
Unbekannt, ob das Tool eine API bereitstellt oder ob ausschließlich direkter Datenbankzugriff auf die zugrunde liegende Postgres-Instanz vorgesehen ist. Direkter Datenbankzugriff zweier unabhängiger Anwendungen ohne vermittelnde API ist riskant (Schema-Kopplung) und vor Umsetzung zu klären.

**Antwortstruktur:** Unbekannt. **Authentifizierung:** Unbekannt. **Eigentümer/Betreiber:** FSR FB4 (bestehendes, unabhängiges Tool). **Verfügbarkeit:** Unbekannt.

**Risiko:** Mittel bis hoch, solange unverifiziert: Bei direktem Datenbankzugriff kann eine Schema-Änderung im bestehenden Tool das neue Backend unbemerkt brechen.

**Ersatzoption:** Keine — dieses Tool ist die einzige Quelle für E-Key-Daten.

**Status:** Zu definieren: Aufruf-/Integrationsart, Antwortstruktur, Authentifizierung. Klärung durch FSR FB4 und technische Leitung vor Umsetzung von Capability `e-key`.

#### Scenario: Schema-Änderung im Fremdtool
- **WHEN** eine vertragliche/versionierte Schnittstelle statt direktem Datenbankzugriff besteht
- **THEN** erkennt das Backend eine Schema-Abweichung, statt unbemerkt zu brechen

### Requirement: INT-015 — Mensa-API des ITMC (TU Dortmund)

**Status: bestätigt, live erprobt.** Das System muss Speisepläne, Gerichtskategorien und Zusatzstoff-/Allergenschlüssel über die ITMC-API laden. Ersetzt INT-004. Herkunft: Alt: alte apps/android-fb4/FB4/fB4/src/main/java/de/fsrfb4/fb4/retrofit/MenuApi.java.

**Aufruf**
```
GET https://mobil.itmc.tu-dortmund.de/canteen-menu/v3/canteens/{id}/{date}
GET https://mobil.itmc.tu-dortmund.de/canteen-menu/v3/canteens/{id}
GET https://mobil.itmc.tu-dortmund.de/canteen-menu/v3/types
GET https://mobil.itmc.tu-dortmund.de/canteen-menu/v3/additives
GET https://mobil.itmc.tu-dortmund.de/canteen-menu/v3/categories
```
`{id}` ist die ITMC-Mensakennung (Feld `quelleId` der Mensa-Stammdaten, z. B. `341` für die Hauptmensa), `{date}` ein Datum `YYYY-MM-DD`.

**Antwortstruktur (verifiziert 2026-09-03)**
`GET /canteens/{id}/{date}` → JSON-**Liste** von Gerichten. `GET /canteens/{id}` → JSON-**Objekt**, Schlüssel = Datum `YYYY-MM-DD`, Wert = dieselbe Gerichtsliste.

Gericht-Objekt:

| Feld | Typ | Bedeutung |
|---|---|---|
| `title` | Objekt `{de, en}` | Bezeichnung des Gerichts. Zusatzstoff-/Allergen-Codes stehen zusätzlich inline in Klammern; mehrteilige Gerichte trennen die Komponenten mit ` \| ` |
| `type` | Liste von Strings | Kennzeichnungen des Gerichts, Schlüssel aus `/types` |
| `additives` | Liste von Strings | Zusatzstoff-/Allergen-Codes, Schlüssel aus `/additives` |
| `category` | String | numerischer Kategorie-Code (nicht anzeigetauglich; für die Anzeige dient `counterNames`). Über `/categories` teilweise auflösbar, aber nicht vollständig |
| `price` | Objekt `{student, staff, guest}` | Preise als **String** mit Komma-Dezimaltrennung und Euro-Zeichen, Beispiel `"3,30 €"` — clientseitig zu parsen |
| `counter` | String \| fehlt | Ausgabestelle, unlokalisiert. Bei manchen Verbrauchsorten (Food Fakultät, Kennung 474) fehlt das Feld ganz |
| `counterNames` | Objekt `{de, en}` \| `null` | zweisprachige Anzeigekategorie; für die getrennte Beilagen-Darstellung maßgeblich. Bei der Food Fakultät durchgängig `null` |
| `dispoId` | String | interne Kennung des Dispositionssatzes |
| `position` | Zahl | Sortierreihenfolge innerhalb des Tages |

`GET /types`, `GET /additives` und `GET /categories` → je JSON-Liste von `{ "id": String, "name": { "de": String, "en": String } }`. Damit trägt diese Quelle die Zweisprachigkeit ohne eigene Übersetzungsarbeit. `/categories` (Stand 2026-09-04: elf Einträge) deckt die `category`-Codes der Food-Fakultät-Gerichte nicht ab und wird deshalb vorerst nicht als Kategoriequelle genutzt — die Anzeigekategorie kommt aus `counterNames`/`counter`, fehlt beides, entfällt sie.

`GET /canteens/474` (Food Fakultät), Prüfung 2026-09-04: liefert für den aktuellen Tag 27 Gerichte mit vollständigen `title`, `type`, `additives`, `price` und `position`, aber ohne `counter` und mit `counterNames: null`.

`GET /canteens/{id}/openings/all` antwortete am 2026-09-03 mit **HTTP 500** und wird nicht verwendet. Die Öffnungszeiten je Mensa und Wochentag kommen aus den gepflegten Stammdaten (Capability `admin`).

**Authentifizierung:** Keine. **Eigentümer/Betreiber:** ITMC (IT und Medien Centrum) der TU Dortmund. Offizieller Hochschulbetrieb, keine private Infrastruktur. **Verfügbarkeit:** Nicht vertraglich zugesagt, aber institutionell betrieben und produktiv von der Android-Alt-App genutzt. Live-Abfrage am 2026-08-25: Status 200 in rund 0,2 Sekunden.

**Cache-Regel (Vorschlag):** Speiseplan je Mensa und Tag bis Tagesende. Öffnungszeiten, Gerichtskategorien und Zusatzstoffverzeichnis: Vorschlag ein Tag, serverseitig im Backend vorgehalten. Der Backend-Abrufzeitplan ist an die studentischen Nutzungsspitzen angelehnt: je eine Auffrischung vor der Morgen- und vor der Mittagsspitze, ergänzt um weitere Läufe über den Tag (Capability `backend-and-api`, Capability `canteen`). Die App ruft INT-015 nie selbst ab (Capability `architecture`); das Herunterziehen zum Aktualisieren in der App liest ausschließlich den Backend-Zwischenspeicher neu. Bei diesem Abrufvolumen ist keine gesonderte Absprache mit dem ITMC nötig; der eigene `User-Agent` (`fb4-backend`) macht die Herkunft erkennbar.

**Risiko:** Gering bis mittel. Deutlich niedriger als INT-004: offizieller Hochschulbetreiber statt privater Vermittler, TLS statt Klartext, Primärquelle statt Weiterreichung. Verbleibend: keine erkennbare Versionszusage über `v3` hinaus, kein SLA.

**Ersatzoption:** OpenMensa als offenes Verzeichnisprojekt oder die Speiseplanseiten des Studierendenwerks (`stwdo.de`, in den Mensa-Stammdaten je Mensa als `url` hinterlegt).

**Zugehörige Stammdaten:** Die Zuordnung von Mensa-Kennung zu ITMC-Kennung, Anzeigename, Öffnungszeiten, Standardauswahl und Anzeigereihenfolge ist **nicht** Teil dieser Schnittstelle, sondern wird vom eigenen Backend gepflegt (siehe INT-008 und Capability `admin`).

Quelle: `alte apps/android-fb4/FB4/fB4/src/main/java/de/fsrfb4/fb4/retrofit/MenuApi.java`, `service/MenuService.java`, `module/NetworkModule.java`, `assets/canteens.json`; live abgefragt am 2026-08-25, Feldstruktur verifiziert am 2026-09-03, Food-Fakultät (474) verifiziert am 2026-09-04

#### Scenario: Verbrauchsort ohne Ausgabestellen-Gliederung
- **WHEN** ein Verbrauchsort wie die Food Fakultät (474) `counter` und `counterNames` nicht liefert
- **THEN** verarbeitet das System die Gerichte trotzdem vollständig, ohne Kategorieüberschrift

### Requirement: INT-016 — Nachrichten des Fachbereichs Wirtschaft (FB9)

**Status: bestätigt, produktiv in der Android-Alt-App, nicht im Umfang der Neuentwicklung.** Herkunft: Alt: alte apps/android-fb4/FB4/fB4/src/main/java/de/fsrfb4/fb4/util/NewsEconomyParserImpl.java.

**Zweck**
Liefert Studien-Nachrichten des Fachbereichs Wirtschaft (FB9). Beantwortet die bislang offene Frage aus `specs/product/legacy-inventory.md` Abschnitt 4, ob die Android-Alt-App tatsächlich zwei getrennte News-Quellen führt: Sie tut es — mit eigenem Endpunkt, eigenem Parser (`NewsEconomyParserImpl`), eigenem Datenmodell und eigener Ansicht.

**Aufruf**
```
GET https://www.inf.fh-dortmund.de/de/fb/9/studiengaenge/400/aktuelles_stud.php
```

**Antwortstruktur:** HTML, wie INT-010. Eigene Auswertung, da der Seitenaufbau von `aktuelles-ni` abweicht.

**Authentifizierung:** Keine. **Eigentümer/Betreiber:** FH Dortmund, Fachbereich Wirtschaft (FB9) — weder FSR FB4 noch Fachbereich Informatik. **Verfügbarkeit:** Nicht dokumentiert, kein SLA.

**Risiko:** Mittel, aus denselben Gründen wie INT-010. Zusätzlich fachlich: Die Zielgruppe der App ist laut `specs/product/vision.md` der Fachbereich Informatik; FB9-Nachrichten betreffen nur den Teil der Studierenden in Verbund- und Wirtschaftsinformatik-Studiengängen.

**Ersatzoption:** Verzicht auf diese Quelle, ersatzweise externer Link.

**Status:** Bestätigt. Ob die Quelle in die Neuentwicklung übernommen wird, entscheidet Capability `news` — sie ist im aktuellen Umfang nicht vorgesehen, der Befund ist hier festgehalten, damit die Entscheidung auf Tatsachen statt auf Vermutung beruht.

Quelle: `alte apps/android-fb4/FB4/fB4/src/main/java/de/fsrfb4/fb4/retrofit/NewsApi.java`, `util/NewsEconomyParserImpl.java`, `fragments/news/NewsEconomyFragment.java`, 2026-08-25

#### Scenario: Nicht in die Neuentwicklung übernommen
- **WHEN** die Neuentwicklung Nachrichtenquellen zusammenstellt
- **THEN** wird INT-016 nicht eingebunden, sofern Capability `news` das nicht ausdrücklich ändert

### Requirement: INT-017 — HIS-Portal der FH Dortmund (Semesterticket-Bezug, ausgeschlossen)

**Status: Verfahren bekannt, Nutzung ausgeschlossen.** Das System darf dieses Verfahren nicht nachbilden, da es Passwort-Replay gegen ein Hochschulsystem voraussetzt. Herkunft: Alt: bewusst verworfen.

**Zweck**
Bezugsweg für das NRW-Semesterticket als PDF. Die Android-Alt-App lädt das Ticket darüber automatisch herunter — die Funktion, die Capability `semester-ticket` als priorisierten Spike führt. Dieser Eintrag dokumentiert das Verfahren, damit die Entscheidung dagegen nachvollziehbar bleibt.

**Aufruf**
```
POST https://portal.fh-dortmund.de/qisserver/rds?state=user&type=1&category=auth.login
GET  https://portal.fh-dortmund.de/qisserver/pages/fhdo/cm/stu/fhService/start.xhtml?_flowId=fhService-flow
POST https://portal.fh-dortmund.de/qisserver/pages/fhdo/cm/stu/fhService/start.xhtml?_flowId=fhService-flow&_flowExecutionKey=e1s1
GET  https://portal.fh-dortmund.de/qisserver/rds?state=user&type=3&category=auth.logout
```
Anmeldung über die Formularfelder `asdf` (Benutzername) und `fdsa` (Passwort), Sitzung über Cookies. Der Ticket-Bezug läuft anschließend über einen mehrstufigen Formularablauf, dessen Felder aus der vorher geladenen Seite ausgelesen werden.

**Antwortstruktur:** HTML für Anmeldung und Formularablauf, PDF für den eigentlichen Download.

**Authentifizierung:** Benutzername und Passwort des Hochschulkontos, im Formular übertragen. Die Android-Alt-App speichert beide geräteseitig über den Android-Keystore verschlüsselt (`util/UserCredentialsHelper.java`, `util/Cryptography.java`) und sendet sie über einen Hintergrund-Worker (`worker/TicketDownloadWorker.java`) wiederholt erneut.

**Eigentümer/Betreiber:** FH Dortmund. Dasselbe Portal beherbergt auch HISinOne (INT-006). **Verfügbarkeit:** Nicht dokumentiert.

**Risiko:** **Hoch, und zwar unabhängig von der technischen Umsetzung.** Das Verfahren erfordert, dass die App das Hochschulpasswort entgegennimmt, dauerhaft vorhält und wiederholt erneut sendet — genau das Muster, das Capability `security-and-privacy` und Capability `backend-and-api` ausschließen. Die geräteseitige Verschlüsselung mildert das Risiko, beseitigt es aber nicht: Ein Passwort, das die App entschlüsseln kann, um es zu senden, ist ein Passwort, das die App im Klartext verarbeitet. Hinzu kommt die Bindung an einen undokumentierten Formularablauf mit fest verdrahtetem `_flowExecutionKey`, der bei jeder Portal-Aktualisierung brechen kann.

**Ersatzoption:** Manueller Import des Ticket-PDFs durch die Nutzerin, wie in beiden Alt-Apps ebenfalls vorhanden.

**Status:** **Für die Neuentwicklung ausgeschlossen** (Entscheidung FSR FB4, 2026-08-25). Zunächst ist mit der Authentik-Federation (INT-012) zu prüfen, ob sich das Ticket über einen offiziellen, tokenbasierten Weg beziehen lässt; bis dahin bleibt es beim manuellen Import. Der Komfortverlust gegenüber dem Stand der Android-Alt-App wird bewusst in Kauf genommen und ist in Capability `semester-ticket` dokumentiert.

**Nebenbefund zum Ticket-Zuschnitt.** Die Koordinaten für den Bildausschnitt des Tickets liegen in der Android-Alt-App nicht im Quellcode, sondern kommen als Fernkonfiguration vom bestehenden Backend (`ticket_rect_coordinates`, live abgefragt am 2026-08-25: `[161, 148, 555, 350]`). Das löst den in `specs/product/legacy-inventory.md` als M-010 geführten Mangel der Flutter-Alt-App und ist als Muster übernehmenswert, unabhängig davon, wie das PDF ins Gerät gelangt.

Quelle: `alte apps/android-fb4/FB4/fB4/src/main/java/de/fsrfb4/fb4/retrofit/HisApi.java`, `util/TicketUtil.java`, `util/UserCredentialsHelper.java`, `worker/TicketDownloadWorker.java`, `module/NetworkModule.java`, 2026-08-25

#### Scenario: Kein automatischer Ticket-Bezug
- **WHEN** die Neuentwicklung das Semesterticket bereitstellt
- **THEN** verwendet sie den manuellen PDF-Import, niemals gespeicherte Hochschul-Zugangsdaten

### Requirement: INT-018 — GlitchTip (Fehlertelemetrie)

**Status: geplant.** Das System muss App- und Backend-Fehlerberichte selbstbetrieben sammeln. Herkunft: NEU, siehe `specs/decisions/0014-selbstbetriebene-fehlertelemetrie.md`.

**Zweck**
Selbstbetriebene Sammlung von App- und Backend-Fehlerberichten, damit das FSR-Team von Produktionsfehlern erfährt, ohne auf zufällige Nutzermeldungen angewiesen zu sein.

**Aufruf**
Sentry-kompatibles Ereignis-Protokoll (DSN-basiert), über die offiziellen SDKs `@sentry/react-native` (App) bzw. ein `Sentry`-NuGet-Paket mit Serilog (Backend). Genaue Endpunkt-URL entsteht bei Einrichtung der Instanz.

**Antwortstruktur:** Nicht zutreffend für die Richtung App/Backend → GlitchTip (reiner Schreibpfad); Auswertung erfolgt über die GlitchTip-eigene Oberfläche.

**Authentifizierung:** Projektgebundener DSN-Schlüssel je Client (App, Backend), analog dem Sentry-Protokoll.

**Eigentümer/Betreiber:** FSR FB4 selbst, auf demselben Hetzner-VPS wie INT-008/INT-012. **Verfügbarkeit:** Eigener Verantwortungsbereich; ein Ausfall der Instanz verhindert nur die Fehlerübermittlung, beeinträchtigt keine fachliche Funktion der App.

**Risiko:** Gering. Zusätzlicher selbstbetriebener Dienst mit Update-/Sicherungspflicht (wie Authentik), aber ohne fachliche Abhängigkeit einer App-Funktion davon.

**Ersatzoption:** Sentry SaaS — verworfen, siehe `specs/decisions/0014-selbstbetriebene-fehlertelemetrie.md` (wäre ein Drittanbieter im Sinne der Capability `security-and-privacy`).

**Status:** Geplant. Einrichtung Teil von Schritt 0 der Roadmap.

Quelle: `specs/decisions/0014-selbstbetriebene-fehlertelemetrie.md`

#### Scenario: Instanzausfall
- **WHEN** die GlitchTip-Instanz nicht erreichbar ist
- **THEN** bleibt jede fachliche App-Funktion unbeeinträchtigt; nur die Fehlerübermittlung entfällt

### Requirement: INT-019 — FBWS Gruppenkennung zur Matrikelnummer

Das System muss zu einer eingegebenen Matrikelnummer die vom Fachbereich zugeteilte Gruppenkennung (`studentSet`) abrufen können, damit die Nutzerin ihre Kennung nicht kennen oder von Hand eintippen muss. Herkunft: Recherche: ws.inf.fh-dortmund.de, 2026-09-04.

**Aufruf**
```
GET https://ws.inf.fh-dortmund.de/timetable/current/rest/Student/{matrikelnummer}/Set?Accept=application/json
```
`{matrikelnummer}` ist die Matrikelnummer der Nutzerin. **Der Kopf `Accept: application/json` oder der gleichnamige Abfrageparameter ist zwingend** — ohne ihn antwortet der Dienst mit `501 Not Implemented`. Beide Pfadpräfixe (`/fbws/` und `/timetable/`) liefern dasselbe Ergebnis; für die Neuentwicklung gilt wie bei INT-001/INT-002 einheitlich `/timetable/`.

**Antwortstruktur**
Der Endpunkt kennt **drei** Antwortgestalten, alle mit Status 200:

| Fall | Antwort | Auswertung |
|---|---|---|
| Kennung hinterlegt | Objekt mit `fhDoStudentSet` als **Zeichenkette**, z. B. `{"fhDoStudentSet":"O7"}` | Kennung übernehmen (nach Bestätigung) |
| Keine Kennung hinterlegt | Objekt mit `fhDoStudentSet` als **`false`**, also `{"fhDoStudentSet":false}` | Wie „nicht gefunden" behandeln |
| Kein Datensatz | leere **Liste** `[]` | Wie „nicht gefunden" behandeln |

Alle drei liefern Status 200; der Unterschied steckt allein in der Gestalt. Ein Client muss daher **auf eine nicht-leere Zeichenkette prüfen**, nicht auf Vorhandensein des Feldes und nicht auf Wahrheitswert — `false` und `undefined` sind beide falsy, aber nur ein String ist eine Kennung. Stillschweigendes Durchreichen eines leeren Werts ist unzulässig (Capability `security-and-privacy`).

**Authentifizierung:** Keine. **Eigentümer/Betreiber:** Fachbereich Informatik, FH Dortmund (dieselbe FBWS-Infrastruktur wie INT-001/INT-002/INT-009). **Verfügbarkeit:** Nicht dokumentiert, kein bekanntes SLA.

**Cache-Regel (Vorschlag):** Nicht zwischenspeichern. Der Abruf erfolgt einmalig bei der Einrichtung; das Ergebnis wird als Gruppenkennung gespeichert, nicht die Antwort selbst.

**Risiko und Datenschutz.** Der Endpunkt ist unauthentifiziert und beantwortet **jede** übergebene Matrikelnummer. Daraus folgen zwei Dinge: (1) **Der Endpunkt taugt nicht zur Prüfung der Matrikelnummer.** Mehrere offensichtlich ungültige Nummern lieferten am 2026-09-04 plausibel aussehende Kennungen (`0000000` → `B3`, `9999999` → `A9`), während zwei benachbarte, plausibel gebildete Nummern `false` ergaben. Eine erfolgreiche Antwort belegt also **nicht**, dass die eingegebene Nummer die eigene ist — die App legt die ermittelte Kennung deshalb der Nutzerin zur Bestätigung vor. (2) **Personenbeziehbare Zuordnung ohne Zugangsschutz.** Wer eine Matrikelnummer kennt, erfährt die zugehörige Gruppe — eine Eigenschaft des Hochschulsystems, nicht dieser App. Für die App gilt: Die Matrikelnummer wird ausschließlich für den Abruf der **eigenen** Kennung verwendet, verlässt das Gerät nur an diesen Endpunkt und niemals an das eigene Backend; es findet kein Durchprobieren und keine Abfrage fremder Nummern statt.

**Ersatzoption:** Manuelle Eingabe der Gruppenkennung — bleibt ohnehin als gleichwertiger Weg bestehen, da nicht jede Person ihre Matrikelnummer eingeben möchte.

**Status:** Bestätigt, live erprobt am 2026-09-04.

Quelle: Hinweis des Nutzers (studierende Person) mit Beispielaufruf, 2026-09-04; live nachgeprüft am selben Tag gegen beide Pfadpräfixe sowie gegen eine unbekannte und eine ungültige Nummer.

#### Scenario: Antwort ohne hinterlegte Kennung
- **WHEN** der Endpunkt `{"fhDoStudentSet":false}` oder eine leere Liste liefert
- **THEN** behandelt das System dies als „nicht gefunden", nicht als Fehler

#### Scenario: Kennung zur Bestätigung vorgelegt
- **WHEN** der Endpunkt eine nicht-leere Zeichenkette als Kennung liefert
- **THEN** legt die App sie der Nutzerin zur Bestätigung vor, statt sie stillschweigend zu übernehmen

## Übersicht

| ID | System | Status | Risiko | Abhängige Feature-Capabilities |
|---|---|---|---|---|
| INT-001 | FBWS Studiengänge (`/timetable/`) | aktiv | mittel | schedule, room-finder |
| INT-002 | FBWS Termine (`/timetable/`) | aktiv | mittel | schedule, room-finder |
| INT-003 | News-Feed (hemacode.de) | aktiv, Ablöserisiko | hoch | news |
| INT-004 | Mensa-Speisepläne (hemacode.de) | **abgelöst durch INT-015** | – | – |
| INT-005 | Push-Benachrichtigungen (Android: UnifiedPush, iOS: FCM) | aktiv | mittel | news, settings |
| INT-006 | HISinOne (Notenübersicht) | offen | offen / hoch am Altverfahren | grades |
| INT-007 | BookStack (FSR-Wiki) | Kernzugriff bestätigt, Berechtigungsmodell offen | mittel | wiki |
| INT-008 | Eigenes Backend | Betreiber geklärt (FSR FB4, Hetzner-VPS), Vorgänger `app.fsrfb4.de` abzulösen | eigener Verantwortungsbereich | canteen-ratings, events, event-volunteers, news, canteen, room-finder, e-key, admin |
| INT-009 | FBWS Raumplan (Wildcard `Room/*/AllEvents`) | bestätigt, produktiv erprobt | mittel | room-finder |
| INT-010 | Fachbereichs-Aktuelles (aktuelles-ni) | geklärt: HTML-Auswertung | mittel | news |
| INT-011 | FSR-Event-Kalender (ICS) | Dienst geklärt (Google Calendar) | gering bis mittel | events |
| INT-012 | Authentik (Identitätsanbieter) | Anbieter entschieden, FH-Federation ausstehend | gering bis mittel | canteen-ratings, e-key, admin |
| INT-013 | Prüfungsplan (Intranet-Excel) | Struktur grob erfasst | mittel | schedule |
| INT-014 | E-Key-Verwaltungstool (Postgres) | zu definieren | mittel bis hoch | e-key |
| INT-015 | Mensa-API des ITMC (TU Dortmund) | bestätigt, live erprobt | gering bis mittel | canteen, canteen-ratings |
| INT-016 | Nachrichten des Fachbereichs Wirtschaft (FB9) | bestätigt, nicht im Umfang | mittel | – |
| INT-017 | HIS-Portal (Semesterticket-Bezug) | Verfahren bekannt, Nutzung ausgeschlossen | hoch | semester-ticket |
| INT-018 | GlitchTip (Fehlertelemetrie) | geplant | gering | – |
| INT-019 | FBWS Gruppenkennung zur Matrikelnummer | bestätigt, live erprobt | mittel (unauthentifiziert, personenbeziehbar) | schedule |
