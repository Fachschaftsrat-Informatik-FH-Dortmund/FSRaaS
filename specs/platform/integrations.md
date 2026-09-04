---
id: integrations
titel: Schnittstellenregister
praefix: INT
status: accepted
version: 1.3.3
owner: FSR FB4
last_reviewed: 2026-09-04
derived_from:
  - alte apps/android-fb4/FB4/fB4/src/main/java/de/fsrfb4/fb4/module/NetworkModule.java
  - alte apps/android-fb4/FB4/fB4/src/main/java/de/fsrfb4/fb4/retrofit/
  - alte apps/android-fb4/FB4/fB4/src/main/java/de/fsrfb4/fb4/service/DataService.java
  - alte apps/android-fb4/FB4/fB4/src/main/assets/canteens.json
  - alte apps/android-fb4/FB4/fB4/src/main/assets/rooms.json
  - resources/pplan.xlsx
  - alte apps/fb4_app-main/fb4_app-main/lib/areas/schedule/repositories/course_info_repository.dart
  - alte apps/fb4_app-main/fb4_app-main/lib/areas/schedule/repositories/schedule_repository.dart
  - alte apps/fb4_app-main/fb4_app-main/lib/areas/news/repositories/news_repository.dart
  - alte apps/fb4_app-main/fb4_app-main/lib/areas/canteen/repositories/meals_repository.dart
  - alte apps/fb4_app-main/fb4_app-main/lib/utils/plugins/push_notification_manager.dart
  - alte apps/fb4_app-main/fb4_app-main/lib/areas/ods/services/ods_authentication_service.dart
  - alte apps/fb4_app-main/fb4_app-main/lib/areas/ods/repositories/ods_repository.dart
implemented_in: []
related:
  - ../features/schedule/spec.md
  - ../features/room-finder/spec.md
  - ../features/news/spec.md
  - ../features/canteen/spec.md
  - ../features/canteen-ratings/spec.md
  - ../features/grades/spec.md
  - ../features/wiki/spec.md
  - ../features/events/spec.md
  - ../features/event-volunteers/spec.md
  - backend-and-api.md
  - security-and-privacy.md
  - ../decisions/0008-vertrieb-ueber-drei-app-stores.md
---

# Schnittstellenregister

## Zweck

Dieses Register ist die einzige Stelle im Spec-Bestand, an der externe Systeme im Detail beschrieben werden: Aufruf, Antwortstruktur, Authentifizierung, Betrieb, Risiko und Ersatzoptionen. Jede Feature-Spec, die eine externe Schnittstelle nutzt, verweist in ihrem Abschnitt „Externe Schnittstellen" ausschließlich auf die betreffende `INT-###`-Nummer.

**Regel: Endpunktdetails stehen nur hier.** Eine Feature-Spec darf eine Schnittstelle benennen und ihre fachliche Nutzung beschreiben, aber keine URL, keinen Feldnamen und keine Antwortstruktur duplizieren. Ändert sich ein Endpunkt, wird ausschließlich dieses Register angepasst; die Feature-Specs bleiben unverändert gültig, solange sich die fachliche Nutzung nicht ändert.

IDs sind fortlaufend `INT-001`, `INT-002`, … vergeben (kein `F`/`N`-Teil, siehe `README.md`, Abschnitt 4, Sonderfall INT). Jeder Eintrag erhält, sobald sinnvoll anwendbar, folgende Felder: Zweck, Aufruf, Antwortstruktur, Authentifizierung, Eigentümer/Betreiber, Verfügbarkeit, Cache-Regel (Vorschlag), Risiko, Ersatzoption, Status.

---

## INT-001 — FBWS Studiengänge

**Zweck**
Liefert die Liste der Studiengänge des Fachbereichs mit ihren Fachsemestern (`grades`). Grundlage für die Auswahl von Studiengang und Semester im Stundenplan und für die vollständige Iteration aller Studiengang/Semester-Kombinationen, die die Raumsuche (INT-008) benötigt.

**Aufruf**
```
GET https://ws.inf.fh-dortmund.de/timetable/current/rest/CourseOfStudy/?Accept=application/json
```
Keine Parameter außer dem festen Query-String `Accept=application/json`.

**Pfadkorrektur (2026-08-25).** Bis zur Auswertung des Android-Quellcodes war hier der Pfad `/fbws/current/rest/...` dokumentiert, wie ihn die Flutter-Alt-App verwendet. Die Android-Alt-App ruft dieselben Ressourcen unter `/timetable/current/rest/...` ab (`retrofit/TimetableApi.java`) — derselbe Pfad, unter dem auch INT-009 liegt. Eine Live-Abfrage am 2026-08-25 bestätigt, dass `/timetable/`-Pfad **über HTTPS** mit Status 200 antwortet. INT-001, INT-002 und INT-009 sind damit drei Ressourcen **eines** Dienstes unter einem gemeinsamen Pfadpräfix, nicht zwei getrennte Systeme. Für die Neuentwicklung gilt einheitlich `/timetable/`; der `/fbws/`-Pfad wird nicht weiterverwendet.

Hinweis zum Transport: Die Android-Alt-App spricht diesen Dienst über `http://` an (`module/NetworkModule.java`, `baseUrl("http://ws.inf.fh-dortmund.de/")`). Die Live-Abfrage am 2026-08-25 zeigt, dass `https://` einwandfrei funktioniert — der unverschlüsselte Aufruf ist somit kein technischer Zwang, sondern ein Altlastenbefund. Für die Neuentwicklung gilt SEC-N-030 ohne Ausnahme.

**Antwortstruktur**
Die Antwort ist ein JSON-**Objekt** (Map von Schlüssel auf Studiengangsdatensatz), keine Liste. Auszuwerten sind die Werte dieser Map. Einträge, bei denen `grades` `null` ist, werden verworfen (so verfährt bereits die Alt-App).

| Feld | Typ | Bedeutung |
|---|---|---|
| `name` | String | Klarname des Studiengangs |
| `sname` | String | Kurzname; wird als Pfadsegment in INT-002 verwendet |
| `grades` | Liste von Objekten mit Feld `grade` | Fachsemester dieses Studiengangs |

**Authentifizierung**
Keine.

**Eigentümer/Betreiber**
Fachbereich Informatik, FH Dortmund (Betrieb von `ws.inf.fh-dortmund.de`).

**Verfügbarkeit**
Nicht dokumentiert, kein bekanntes SLA.

**Cache-Regel (Vorschlag)**
Innerhalb einer App-Sitzung einmalig laden und im Speicher vorhalten (Alt-App-Verhalten). Für die Neuentwicklung zusätzlich geräteseitig mit Ablaufzeit von einem Tag persistieren, da sich Studiengänge und Semesterlisten selten ändern.

**Risiko**
Keine erkennbare Versionierung; das Pfadsegment `current` deutet auf einen serverseitig wechselnden Bezug zum aktuellen Semester hin, dessen genaues Umschaltverhalten unbekannt ist.

**Ersatzoption**
Keine bekannte Alternativquelle. Bei Ausfall: zuletzt gecachte Liste weiterverwenden, Hinweis auf mögliche Veraltung anzeigen.

**Status**
Aktiv, unverändert aus der Alt-App übernehmbar.

Quelle: `alte apps/fb4_app-main/fb4_app-main/lib/areas/schedule/repositories/course_info_repository.dart`

---

## INT-002 — FBWS Termine

**Zweck**
Liefert die Veranstaltungstermine eines Studiengang/Semester-Paars. Grundlage für den Stundenplan und, über die Vereinigung aller Kombinationen, für die Raumbelegung in der Raumsuche.

**Aufruf**
```
GET https://ws.inf.fh-dortmund.de/timetable/current/rest/CourseOfStudy/{sname}/{grade}/Events?Accept=application/json&studentSet=*
```
(Pfadkorrektur `/fbws/` → `/timetable/` wie bei INT-001, siehe dort.)
`{sname}` ist der Kurzname aus INT-001, `{grade}` das Fachsemester. `studentSet=*` fordert Termine aller Gruppen an; die Filterung auf eine einzelne Gruppenkennung erfolgt clientseitig (siehe `product/glossary.md`, Begriff `studentSet`).

**Antwortstruktur**
Die Antwort ist eine JSON-**Liste**.

| Feld | Typ | Bedeutung |
|---|---|---|
| `name` | String | Bezeichnung der Veranstaltung |
| `courseType` | String | Veranstaltungsart, siehe `product/glossary.md` |
| `lecturerId` | String | Kennung der lehrenden Person |
| `lecturerName` | String | Name der lehrenden Person |
| `studentSet` | String | Gültigkeitsbereich für Studierendengruppen, siehe `product/glossary.md` |
| `timeBegin` | Zahl oder String, Format `HHmm` | Beginnzeit; **linksseitig mit `0` auf vier Stellen aufzufüllen** (aus `800` wird `0800`) |
| `timeEnd` | Zahl oder String, Format `HHmm` | Endzeit; gleiche Auffüllregel wie `timeBegin` |
| `weekday` | String | Wochentag als englisches Dreibuchstaben-Kürzel: `Mon`, `Tue`, `Wed`, `Thu`, `Fri` — nur die fünf Werktage, keine Wochenendwerte |
| `roomId` | String | Kennung des Raums |

**Authentifizierung**
Keine.

**Eigentümer/Betreiber**
Fachbereich Informatik, FH Dortmund (siehe INT-001).

**Verfügbarkeit**
Nicht dokumentiert, kein bekanntes SLA.

**Cache-Regel (Vorschlag)**
Je Studiengang/Semester geräteseitig mit kurzer Ablaufzeit (Vorschlag: ein Tag) cachen. Für die Raumbelegung (siehe Nutzungshinweis unten) serverseitig periodisch abrufen und aggregieren, nicht bei jeder Anfrage neu über alle Kombinationen iterieren.

**Risiko**
Vergleichbar mit INT-001 (dieselbe FBWS-Infrastruktur, keine erkennbare Versionierung). Zusätzlich: Datenqualität der Rohfelder (`timeBegin`/`timeEnd` ohne führende Nullen, `weekday` als Kürzel) macht clientseitige Normalisierung notwendig; Fehler darin wirken sich auf Stundenplan **und** Raumsuche aus, da beide auf diesen Daten aufbauen.

**Ersatzoption**
Keine bekannte Alternativquelle.

**Status**
Aktiv, unverändert aus der Alt-App übernehmbar.

**Nutzungshinweis für die Raumsuche — überholt**
Ursprünglich angenommen: Der FBWS biete keinen eigenen Endpunkt für Raumbelegung, weshalb sich diese nur durch Zusammenführung der Termine aller Studiengang/Semester-Kombinationen über `roomId` herleiten lasse. Diese Annahme ist in zwei Schritten widerlegt worden — am 2026-08-24 durch die Entdeckung des raumbezogenen Endpunkts INT-009, und am 2026-08-25 endgültig durch dessen Wildcard-Form (`Room/*/AllEvents`), die alle Raumtermine in einem einzigen Aufruf liefert und in der Android-Alt-App produktiv im Einsatz ist.

Für die Raumsuche wird dieser Endpunkt **nicht** mehr verwendet. Maßgeblich ist INT-009; siehe dort und `features/room-finder/spec.md`.

**Live-Verifikation 2026-08-26 (Rhythmus-Feld `interval`).** Abfrage aller aktuell angebotenen Studiengang/Fachsemester-Kombinationen (35 Paare, gesamter aktueller Bestand) zeigt `interval` ausnahmslos als `"weekly"` — kein einziges Vorkommen eines anderen Werts. Ob das Feld überhaupt einen anderen Wert kennt (z. B. für zweiwöchentliche Veranstaltungen) oder im aktuellen Semester schlicht keine solche Veranstaltung angeboten wird, bleibt offen. Die als Beispiel genannte Veranstaltung „Lern- und Arbeitstechniken" (`INPBPI`/`INPBTI`/`INPBDS`, Fachsemester 2, `courseId` `411031`) erwies sich als **wöchentlich**, kein Beleg für den Zweiwochen-Fall: ein rund dreieinviertelstündiger Block (16:00–19:20 Uhr, vier Viertelstunden-Zeitfenster), parallel in zwei Räumen (`A.2.03`, `lecturerId LUA` und `A.3.03`, `lecturerId LUA2`) angeboten, beide mit identischem `studentSet` (`A-P`).

**Neuer Befund: Parallelangebote ohne Gruppenunterscheidung im `studentSet`.** Die beiden Raum-Varianten derselben Veranstaltung tragen identische Zeit- und `studentSet`-Werte; aus den Rohdaten allein ist nicht erkennbar, welcher der beiden Räume für eine einzelne Studierende vorgesehen ist. Relevant für `features/schedule/spec.md`, dort als offene Frage aufgenommen.

**Nutzungshinweis für den Wahlpflicht-Planungsmodus (SCHED) — Live-Verifikation 2026-08-26.** Für SCHED-F-400 ruft die App diesen Endpunkt mit `{sname}=WFPB`, `{grade}=*` ab. `WFPB` ist eine eigene, in `CourseOfStudy` geführte Pseudo-Studiengangskennung („Bachelor Wahlpflichtfächer WPF") — kein regulärer Studiengang, sondern eine vom Fachbereich gepflegte Sammelkategorie, die alle aktuell angebotenen Wahlpflichtmodule direkt bündelt (Live-Abfrage: 27 distinkte Module, Beispiele: „Data Mining in Industrie und Wirtschaft", „Moderne Datenbanken", „Künstliche Intelligenz"). Jeder Eintrag trägt im Feld `name` die zulässigen Studiengänge/Vertiefungsrichtungen als `[StgPO: ...]`-Angabe (z. B. `PI/TI/DS-19, MI/MID-19/21, WI-18, INF-ST/NSD/DM-22`), unstrukturiert im Text, nicht als eigenes Feld. Die meisten, aber nicht alle Einträge tragen zusätzlich `examinationReg` mit dem Suffix ` WP`; das Muster ist uneinheitlich genug (bei regulären Pflichtveranstaltungen z. B. `2019 84 079 PR`, bei einem Master-Beispiel ganz ohne Suffix beobachtet), um nicht als alleiniges Erkennungsmerkmal zu dienen — maßgeblich ist die Zugehörigkeit zu `WFPB`, nicht der Inhalt von `examinationReg`.

Löst die zuvor offene Frage aus `features/schedule/spec.md` Abschnitt 13 auf, ersetzt aber auch die bisherige Annahme dort (manuelle Fachsemester-Auswahl, vormals SCHED-F-270): Ein Abruf über ein abweichendes `{grade}` des eigenen Studiengangs ist nicht mehr nötig, da `WFPB` bereits die vollständige, aktuelle Liste liefert. **Unverifiziert bleibt, ob `WFPB` auch Master-Wahlpflichtfächer abdeckt** — laut Namensgebung ausdrücklich nur Bachelor; keine äquivalente Kategorie für `INPM`/`MIPM`/`WIPM` in der Studiengangsliste gefunden.

Quelle: `alte apps/fb4_app-main/fb4_app-main/lib/areas/schedule/repositories/schedule_repository.dart`, Modell `alte apps/fb4_app-main/fb4_app-main/lib/areas/schedule/models/schedule_item.dart`

---

## INT-003 — News-Feed

**Zweck**
Liefert die vom FSR veröffentlichten News-Meldungen.

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

**Authentifizierung**
Keine.

**Eigentümer/Betreiber**
Private Infrastruktur unter der Domain `hemacode.de`. Trägerschaft und Fortbestand sind aus dem Code nicht ersichtlich und ungeklärt.

**Verfügbarkeit**
Kein bekannter Vertrag, keine zugesagte Verfügbarkeit.

**Cache-Regel (Vorschlag)**
Kurzfristig geräteseitig cachen (Vorschlag: 15 Minuten), damit Ausfälle des Diensts kurzzeitig überbrückt werden, ohne veraltete Meldungen lange anzuzeigen.

**Risiko**
**Hoch.** Private Infrastruktur ohne bekannten Betreibervertrag; Ausfall oder Abschaltung ist jederzeit möglich, ohne dass FSR oder FH Dortmund darauf Einfluss hätten.

**Befund zur Zertifikatsprüfung**
Über dem Abruf steht in `news_repository.dart:7` der Kommentar, die HTTPS-Vertrauensprüfung müsse umgangen werden, weil die FH Dortmund keine gültigen Zertifikate verwende. Eine solche Umgehung ist im Code jedoch **nicht vorhanden**: Es gibt weder `HttpOverrides`, noch einen `badCertificateCallback`, noch `NSAllowsArbitraryLoads` in der iOS-Konfiguration oder eine Freigabe für unverschlüsselten Verkehr unter Android. Der Aufruf erfolgt als gewöhnliches `https`-Get mit regulärer Zertifikatsprüfung. Der Kommentar ist damit ein Überbleibsel und beschreibt nicht das tatsächliche Verhalten.

Festzuhalten für die Neuentwicklung: Die Zertifikatsprüfung wird unter keinen Umständen abgeschaltet. Trifft man auf ein ungültiges Zertifikat eines Hochschulsystems, ist das beim Betreiber zu klären und nicht clientseitig zu umgehen. Der Kommentar darf nicht als Vorbild oder Rechtfertigung dienen.

**Ersatzoption**
Eigener Abruf der Ursprungsquelle über das eigene Backend (INT-008), das die News-Redaktion des FSR direkt bedient, statt über die private Vermittler-Infrastruktur zu laufen.

**Status**
Aktiv, aber mit hohem Ablöserisiko; siehe `decisions/0007-datenquellen-mensa-und-news.md`.

Quelle: `alte apps/fb4_app-main/fb4_app-main/lib/areas/news/repositories/news_repository.dart`, Modell `alte apps/fb4_app-main/fb4_app-main/lib/areas/news/models/news_item.dart`

---

## INT-004 — Mensa-Speisepläne

**Zweck**
Liefert den Speiseplan einer Mensa für einen Tag.

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

**Authentifizierung**
Keine.

**Eigentümer/Betreiber**
Dieselbe private Infrastruktur wie INT-003 (`hemacode.de`). Fungiert als Vermittler auf OpenMensa, ist selbst keine Primärquelle.

**Verfügbarkeit**
Kein bekannter Vertrag, keine zugesagte Verfügbarkeit.

**Cache-Regel (Vorschlag)**
Je Mensa und Tag geräteseitig bis Tagesende cachen; Speisepläne ändern sich innerhalb eines Tages nicht.

**Risiko**
**Hoch, aus zwei Gründen:** erstens dieselbe private, vertragslose Infrastruktur wie INT-003; zweitens erfolgt der Aufruf **unverschlüsselt über `http://`**. Zugangsdaten werden hier zwar nicht übertragen, wohl aber die vollständige Anfrage samt Standort- und Mensa-Wahl, einsehbar für jeden Netzwerkteilnehmer auf dem Übertragungsweg. **Die Neuentwicklung muss TLS erzwingen (`https://`)**, unabhängig davon, ob weiterhin über einen Vermittler oder direkt auf OpenMensa zugegriffen wird.

**Ersatzoption**
**INT-015** (Mensa-API des ITMC der TU Dortmund). Die zuvor hier genannten Optionen „direkter Zugriff auf OpenMensa" bzw. „Zwischenspeicherung über das eigene Backend" sind durch den Befund vom 2026-08-25 überholt: Die Android-Alt-App nutzt bereits eine offizielle, TLS-gesicherte und deutlich reichhaltigere Quelle.

**Status**
**Abgelöst durch INT-015** (Entscheidung FSR FB4, 2026-08-25). Dieser Eintrag bleibt als Beschreibung des von der Flutter-Alt-App genutzten Wegs bestehen und wird von der Neuentwicklung nicht verwendet. Begründung: INT-015 liefert dieselben Inhalte über HTTPS, ohne private Vermittler-Infrastruktur, zusätzlich mit Öffnungszeiten und zweisprachigen Bezeichnungen — womit alle drei in `decisions/0007-datenquellen-mensa-und-news.md` genannten Probleme (unklare Trägerschaft, fehlendes TLS, Vermittler statt Primärquelle) auf einmal entfallen.

Quelle: `alte apps/fb4_app-main/fb4_app-main/lib/areas/canteen/repositories/meals_repository.dart`, Modell `alte apps/fb4_app-main/fb4_app-main/lib/areas/canteen/models/meal.dart`

---

## INT-005 — Push-Benachrichtigungen

**Zweck**
Benachrichtigt Nutzerinnen und Nutzer über neue News-Meldungen, sofern aktiviert.

**Aufruf**
Nach Plattform unterschieden (Entscheidung FSR FB4, 2026-08-25, `../decisions/0008-vertrieb-ueber-drei-app-stores.md`):

| Plattform | Zustellweg | Registrierung/Abmeldung |
|---|---|---|
| Android | UnifiedPush: Registrierung bei einem auf dem Gerät installierten Distributor — einem FCM-basierten Distributor auf Geräten mit Google Play Services, einem quelloffenen Distributor (z. B. ntfy) auf reinen F-Droid-/GrapheneOS-Geräten | App registriert bei Aktivierung einen UnifiedPush-Endpunkt beim Backend, meldet ihn bei Deaktivierung wieder ab |
| iOS | Firebase Cloud Messaging (FCM) als Bridge zu Apples APNs, unverändert gegenüber dem ursprünglichen Plan | `subscribeToTopic("Aktuelles")` bei Aktivierung, `unsubscribeFromTopic("Aktuelles")` bei Deaktivierung |

Grund für die Unterscheidung: F-Droid existiert ausschließlich für Android und schließt proprietäre Abhängigkeiten wie FCM im Build aus; iOS ist von F-Droid nicht betroffen, und Apple lässt für Hintergrund-Push ohnehin ausschließlich APNs zu, zu dem FCM auf iOS technisch nur als Bridge dient. Auslösend ist in beiden Fällen ausschließlich eine Einstellung in der App (Opt-in); es gibt kein serverseitig erzwungenes Abonnement.

**Antwortstruktur**
Nicht abschließend bekannt: Die Alt-App verarbeitet eingehende Nachrichten nicht (der zugehörige Handler ist im Quellcode auskommentiert). Für die Neuentwicklung ist die Nutzlaststruktur einer eingehenden Nachricht (z. B. Verweis auf die zugehörige News-Meldung für Deep-Linking) für beide Zustellwege neu zu definieren.

Die Nutzlast muss darüber hinaus die Metadaten mitführen, die die App für die geräteseitige Auswertung der Positiv- und Sperrliste braucht: Klassifizierung, Quelle/Verteiler und Titel der Meldung (`../features/news/spec.md` NEWS-F-250 ff.). Ohne diese Felder kann die App eine Benachrichtigung nicht regelkonform unterdrücken; sie benachrichtigt dann im Zweifel und protokolliert die Abweichung. Die Regeln selbst werden nicht übertragen und sind dem Backend nicht bekannt (NEWS-F-270).

**Authentifizierung**
Android: je registriertem UnifiedPush-Endpunkt eine vom Backend vergebene Endpunkt-Kennung, keine Firebase-Projektbindung. iOS: Geräteregistrierung über Firebase (projektgebunden über `google-services.json`/Firebase-Projektkonfiguration). In beiden Fällen keine Nutzerauthentifizierung.

**Eigentümer/Betreiber**
Android: kein einzelner zentraler Betreiber mehr — abhängig vom auf dem Gerät installierten Distributor (Google bei einem FCM-Distributor, unabhängige Betreiber bei z. B. ntfy, potenziell der FSR FB4 selbst bei einem später selbstgehosteten Distributor). iOS: weiterhin Google (Firebase Cloud Messaging) als Bridge zu Apple (APNs).

**Verfügbarkeit**
Android: abhängig vom gewählten Distributor, nicht projektspezifisch geprüft. iOS: Google-SLA für Firebase sowie Apples APNs-Verfügbarkeit, nicht projektspezifisch geprüft.

**Cache-Regel (Vorschlag)**
Nicht zutreffend (kein abrufbarer Datenbestand).

**Risiko**
iOS bleibt wie bisher von einem außerhalb der FH Dortmund betriebenen Drittanbieterdienst abhängig; Google vergibt dabei eine pseudonyme Geräte-ID zur Zustellung, bereits in der Datenschutzerklärung der Alt-App beschrieben und für die Neuentwicklung erneut zu bewerten (siehe `platform/security-and-privacy.md`, SEC). Android ist durch UnifiedPush weniger einseitig von Google abhängig, setzt aber voraus, dass auf dem Gerät ein Distributor installiert ist — ohne installierten Distributor ist auf Android kein Push möglich (Rückfalloption siehe unten).

**Ersatzoption**
Keine im Alt-Code erkennbare Alternative geprüft. Bei Verzicht oder fehlendem Android-Distributor: In-App-Benachrichtigung ohne Push als Rückfalloption.

**Status**
Aktiv, Opt-in-Verhalten wird für die Neuentwicklung beibehalten; spezifiziert in `features/settings/spec.md` und `features/news/spec.md`, datenschutzrechtliche Einordnung in `platform/security-and-privacy.md`. Der Fan-out-Mechanismus im Backend (ein UnifiedPush-Aufruf je Android-Endpunkt statt eines einzelnen FCM-Themen-Aufrufs) ist in `platform/backend-and-api.md` noch nicht spezifiziert, siehe Offene Punkte in ADR 0008.

Quelle: `alte apps/fb4_app-main/fb4_app-main/lib/utils/plugins/push_notification_manager.dart`

---

## INT-006 — HISinOne (Notenübersicht)

**Status: offen.** Ein *offizieller* Zugangsweg für Drittanwendungen ist weiterhin unbekannt und muss in einem Spike geklärt werden. Siehe `decisions/0006-abloesung-ods-durch-hisinone.md`.

**Befund 2026-08-25 (Android-Alt-App).** HISinOne läuft unter `https://portal.fh-dortmund.de/qisserver/`. Die Android-Alt-App meldet sich dort per Formular-Login mit den Feldern `asdf`/`fdsa` an — dieselbe Mechanik, die die Flutter-Alt-App gegen ODS verwendete, nur gegen das Nachfolgesystem und mit geräteseitig verschlüsselt gespeicherten Zugangsdaten. Sie nutzt diesen Zugang allerdings **nicht** für die Notenübersicht, sondern ausschließlich für den Semesterticket-Bezug; Details dazu in INT-017. Für die Notenübersicht ändert der Befund nichts: Ein Formular-Login mit Passwort-Replay ist für die Neuentwicklung ausgeschlossen (SEC-F-040), unabhängig davon, gegen welches System er läuft. Der Spike bleibt damit vollständig offen — er muss klären, ob das Portal einen tokenbasierten Zugang anbietet, nicht ob ein Formular-Login technisch möglich wäre.

**Zweck**
Anzeige der individuellen Prüfungsergebnisse (Notenübersicht) der Studierenden. In HISinOne noch zu klären; nachfolgend zum Vergleich das **abgelöste** ODS-Verfahren, damit erkennbar ist, was ersetzt wird.

### Zum Vergleich: das abgelöste ODS-Verfahren

**Aufruf (Login)**
```
POST https://ods.fh-dortmund.de/ods
```
Formularfelder: `LIMod`, `HttpRequest_PathFile`, `HttpRequest_Path`, `RemoteEndPointIP` (fest verdrahtet auf `10.11.15.121`), `User`, `PWD`, `x`, `y`.

Das Sitzungstoken `SIDD` wird aus dem `content`-Attribut eines Meta-Refresh-Tags der HTML-Antwort extrahiert.

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

**Authentifizierung**
Benutzername/Passwort im Login-Formular, danach sitzungsbasiert über `SIDD` als Query-Parameter.

**Eigentümer/Betreiber**
FH Dortmund (Hochschulrechenzentrum/Prüfungsamt-nahes System).

**Verfügbarkeit**
Nicht dokumentiert; durch HISinOne bereits abgelöst.

**Cache-Regel (Vorschlag)**
Nicht zutreffend für das Altverfahren; für HISinOne im Spike zu klären.

**Risiko**
**Sicherheitsbefund am Altverfahren:** Die Alt-App speichert Benutzername und Passwort im Klartext im Secure Storage des Geräts und sendet sie bei jedem Ablauf des Tokens erneut an den Server (`alte apps/fb4_app-main/fb4_app-main/lib/areas/ods/repositories/ods_repository.dart`). Für die Neuentwicklung ist Passwort-Replay dieser Art **ausgeschlossen**; gefordert ist eine Anbindung über SSO oder eine offizielle, dafür vorgesehene Schnittstelle von HISinOne, nicht die Nachbildung des ODS-Verfahrens.

**Ersatzoption**
HISinOne selbst ist die Ersatzoption für ODS; welcher Zugangsweg dafür genutzt wird, ist der offene Punkt dieses Eintrags.

**Status**
Offen. Spike erforderlich vor jeder Umsetzung von `features/grades/spec.md`.

Quelle (Altverfahren): `alte apps/fb4_app-main/fb4_app-main/lib/areas/ods/services/ods_authentication_service.dart`, `alte apps/fb4_app-main/fb4_app-main/lib/areas/ods/repositories/ods_repository.dart`

---

## INT-007 — BookStack (FSR-Wiki)

**Status: Kernzugriff bestätigt, Berechtigungsmodell offen.**

**Zweck**
Anzeige von FSR-Wiki-Inhalten (z. B. Prüfungsordnungen, Leitfäden, FAQ) in der App.

**Aufruf**
Bestätigt durch Live-Testabruf (2026-08-26): BookStack bietet eine REST-API unter `https://wiki.fsrfb4.de/api/`. Genutzte Endpunkte im Test: `/shelves`, `/books`, `/books/{id}`, `/pages`, `/pages/{id}`, alle liefern JSON. Antwortheader nennen ein Rate-Limit von 180 Anfragen pro Zeitfenster (`X-RateLimit-Limit`/`X-RateLimit-Remaining`).

**Antwortstruktur**
Bestätigt: Shelf › Book › Chapter › Page. Ein Buch liefert unter `contents` eine gemischte Liste aus Kapiteln und direkt zugeordneten Seiten (Feld `type`: `"page"` oder `"chapter"`); Kapitel enthalten ihrerseits `pages`. Seiteninhalt liegt im Feld `html` (bei den geprüften, mit dem WYSIWYG-Editor erstellten Seiten befüllt) bzw. `markdown` (bei den geprüften Seiten leer, da `editor: "wysiwyg"`, nicht `"markdown"`). Für die App ist `html` deshalb die verlässlichere Quelle, nicht `markdown` wie zuvor angenommen.

**Authentifizierung**
Bestätigt: Token-ID und Token-Secret im `Authorization`-Header nach dem Muster `Authorization: Token <id>:<secret>`; ohne gültigen Token antwortet die API mit `401`. Ein Token existiert (bereitgestellt vom FSR, Token-Name `fsraas-backend`, Stand 2026-08-26) — läuft vorerst testweise über ein persönliches Nutzerkonto im Wiki, nicht über ein Dienstkonto. Für den produktiven Einsatz ist ein eigenes BookStack-Konto mit auf lesenden Zugriff beschränkten Berechtigungen vorzusehen, statt dauerhaft über ein persönliches Konto zu laufen. Das Token-Secret selbst wird nicht in den Specs geführt.

**Eigentümer/Betreiber**
FSR Informatik. Instanz erreichbar unter `https://wiki.fsrfb4.de`, TLS bestätigt.

**Verfügbarkeit**
Bestätigt erreichbar (2026-08-26). Umfang zum Prüfzeitpunkt: 2 Regale, 12 Bücher, 87 Seiten.

**Cache-Regel (Vorschlag)**
Wiki-Inhalte sind änderungsarm; Seiten geräteseitig mit Ablaufzeit von einem Tag cachen, mit manueller Aktualisierungsmöglichkeit.

**Risiko**
Mittel: Der API-Zugang selbst ist bestätigt, die Berechtigungsabgrenzung dagegen nicht. Der geprüfte Token liefert uneingeschränkt alle Bücher zurück, einschließlich des Buchs „Intern" (BookStack-Beschreibung: „Diese Infos sind nicht öffentlich"). Ohne ein auf freigegebene Inhalte beschränktes Konto oder eine serverseitige Positivliste würde die App interne FSR-Inhalte an Studierende ausliefern.

**Ersatzoption**
Eingebettete Webansicht (WebView) der BookStack-Instanz als Rückfalloption, falls der native Weg aus Berechtigungsgründen nicht tragfähig ist.

**Status**
Kernzugriff bestätigt (URL, Authentifizierung, Antwortstruktur, HTML-Inhalt). Offen bleibt, mit welchem Berechtigungsmodell freigegebene von internen Inhalten getrennt werden — siehe `decisions/0005-wiki-bookstack-anbindung.md`.

Quelle: Live-Testabruf gegen `https://wiki.fsrfb4.de/api/` mit vom FSR bereitgestelltem Token, 2026-08-26.

---

## INT-008 — Eigenes Backend

**Status: Betreiber geklärt, Vertrag in `api-contract.yaml` spezifiziert.**

**Zweck**
Trägt die Community- und Aggregationsfunktionen, für die es keine geeignete externe Schnittstelle gibt oder für die eine externe Abhängigkeit vermieden werden soll:

- Entgegennahme und Auslieferung der Mensa-Bewertungen (RATE).
- Verwaltung der Events und Helfer-Anmeldungen (EVENT, HELFER).
- Vermittlung der E-Key-Verknüpfungen (EKEY) an das bestehende E-Key-Verwaltungstool des FSR (INT-014) — keine eigene E-Key-Datenhaltung, siehe dort.
- Periodischer Abruf und Zwischenspeicherung der Raumtermine aus INT-009 (Wildcard-Form). **Keine** Zusammenführung über Studiengang/Semester-Kombinationen mehr — siehe Nutzungshinweis bei INT-009.
- Vorgelagerter Zwischenspeicher für INT-003, INT-010 und INT-015 zur Ablösung der Abhängigkeit von `hemacode.de` und zur Entkopplung der App von HTML-Auswertungen.
- Pflege und Auslieferung der Stammdaten, die keine externe Quelle hat: Mensa-Liste (Kennung, ITMC-Kennung, Anzeigename, Öffnungszeiten, Standardauswahl, Reihenfolge), Raumliste (Kennung, Größe, E-Key-Eignung), Links- und Downloads-Liste, Semestertermine und Ticket-Bildzuschnitt.

**Aufruf**
`platform/api-contract.yaml` — versionierte OpenAPI-Beschreibung, Quelle der Wahrheit für jeden Aufruf zwischen App beziehungsweise Admin-Oberfläche und Backend (`../decisions/0011-monorepo-und-openapi-vertrag.md`). Aufgabenschnitt und Prinzipien: `platform/backend-and-api.md`.

**Antwortstruktur**
Siehe `platform/api-contract.yaml`.

**Vorgänger: `app.fsrfb4.de` (abzulösen)**
Der FSR betreibt bereits ein Backend unter `https://app.fsrfb4.de`, das die Android-Alt-App bedient. Es ist am 2026-08-25 erreichbar und liefert drei von der App genutzte Ressourcen. **Ergänzung 2026-08-26:** Der Quellcode dieses Backends (`alte apps/app.fsrfb4.de/`) liegt inzwischen ebenfalls vor — ein schlankes PHP-System ohne Framework, MySQL als Datenhaltung. Er bestätigt und verfeinert den zuvor nur live erprobten Befund:

| Aufruf | Zweck |
|---|---|
| `GET /data`, `POST /data` (Feld `Key`) | Ferngepflegte Stammdaten als Liste von Schlüssel-Wert-Paaren |
| `POST /messages/messages.php` (Felder `Sprache`, `API`, `VersionCode`) | Serverseitige Hinweise an die App, abhängig von Sprache und App-Version |
| `GET /studiengaenge.json` | Rückfallliste der Studiengänge, falls INT-001 nicht erreichbar ist |

Beobachtete Schlüssel unter `/data`: `semester_beginning`, `semester_end`, `ws_start`, `ss_start`, `examplan`, `timeplan`, `ticket_rect_coordinates`, `canteens`, `rooms`, `links`, `file_downloads`, `news_url`.

**Lese-/Schreibtrennung bei `/data` (Quellcode-Befund).** `data/index.php` (Lesepfad, von der App aufgerufen) und `data/admin/data.php` (Schreibpfad) sind zwei getrennte Skripte gegen dieselbe MySQL-Tabelle `app_data` (Spalten `datakey`/`Value`, `INSERT … ON DUPLICATE KEY UPDATE`). Der Schreibpfad liegt hinter HTTP-Basic-Auth (`.htaccess`/`.htpasswd`) und wird über ein einfaches HTML-Formular bedient, das je Aufruf genau ein Schlüssel-Wert-Paar setzt — keine Übersicht, keine Validierung, keine Historie. Das ist die technische Ursache des veralteten Bestands (siehe unten) und stützt konkret, warum `../features/admin/spec.md` eine echte Pflegeoberfläche statt eines Formulars vorsieht.

**Feinstruktur von `/messages/messages.php` (Quellcode-Befund).** Ein Hinweis ist reichhaltiger als ein einzelner Datensatz: `ID`, zweisprachiger `Titel`/`Text` (Spaltenpaare `_de`/`_en`), bis zu zwei Buttons mit je eigenem zweisprachigem Text und einer serverseitig hinterlegten Aktion (`Button1Action`/`Button2Action` — Bedeutung aus dem PHP-Code allein nicht ableitbar, vermutlich ein clientseitig interpretierter Aktionscode), eine `Dauerhaft`-Kennzeichnung sowie Gültigkeit über Bereiche von Android-API-Level (`Min_API`/`Max_API`) und `VersionCode` (`Min_VersionCode`/`Max_VersionCode`), gefiltert auf `Aktiv = TRUE`. Das ist eine gezielte Handlungsaufforderung (z. B. „bitte aktualisieren", mit Link/Aktion), kein Nachrichtentext — relevant für die offene Frage in `specs/open-questions.md`, ob dieser Mechanismus eigenständig fortgeführt oder in NEWS aufgelöst wird.

**Verwaiste Endpunkte (Quellcode-Befund, nicht zuvor bekannt).** `feedback/feedback.php` nimmt POST-Daten (`Name`, `Feedback`, `Api`, `VersionCode`) entgegen und legt sie in der Tabelle `app_feedback` ab, die serverseitig zusätzlich `Nr` (fortlaufend, Primärschlüssel) und `Zeit` (Zeitstempel) führt. Zwei weitere, per HTTP-Basic-Auth geschützte Skripte lesen diesen Bestand lesend aus: `feedback/admin/api.php` (JSON, alle Spalten) und `feedback/admin/index.php` (dieselben Daten als HTML-Tabelle, ohne Lösch- oder Bearbeitungsfunktion — reine Anzeige). Beide Alt-Apps rufen `feedback.php` jedoch **nicht** auf — Android wie Flutter öffnen für „Feedback" stattdessen den Mail-Client (`product/legacy-inventory.md`, AND-036/L-074). Der gesamte Feedback-Pfad ist damit ohne Client und braucht in der Neuentwicklung keine Entsprechung.

**Vollständigkeitsprüfung 2026-08-26.** Der abgelegte Codestand von `app.fsrfb4.de` enthält, außerhalb der vendorierten Drittbibliothek `*/admin/passwd/` (Login-Oberfläche der Admin-Bereiche, Fremdcode), genau sechs PHP-Dateien — alle oben genannt, keine weiteren: `data/index.php`, `data/admin/data.php`, `messages/messages.php`, `feedback/feedback.php`, `feedback/admin/api.php`, `feedback/admin/index.php`. Die `.htaccess`-Dateien beider Admin-Verzeichnisse erzwingen HTTPS und HTTP-Basic-Auth, enthalten aber keine Rewrite-Regeln auf weitere, hier nicht erfasste Routen.

**Der Datenbestand ist veraltet:** Die live abgefragte Antwort vom 2026-08-25 liefert `semester_beginning: 25.09.2023` und `semester_end: 19.01.2024` — Werte aus dem Wintersemester 2023/24. Der Dienst läuft, wird aber nicht mehr gepflegt.

Entscheidung FSR FB4, 2026-08-25: Das fachliche Konzept der ferngepflegten Stammdaten wird übernommen, die technische Umsetzung neu gebaut. Die Pflege wandert in die Admin-Oberfläche (`../features/admin/spec.md`), die Auslieferung in den OpenAPI-Vertrag. `app.fsrfb4.de` wird nach der Umstellung abgeschaltet; die dort verlinkte private Domain `hoolycraap.de` entfällt damit ebenfalls.

Der Rückfallmechanismus `studiengaenge.json` ist übernehmenswert: Er macht die Studiengangsauswahl unabhängig von der Erreichbarkeit des Hochschulsystems und gehört als Muster in den Zwischenspeicher-Anteil des neuen Backends. Anmerkung 2026-08-26: Im abgelegten Quellcode-Stand von `app.fsrfb4.de` ist keine `studiengaenge.json` als statische Datei auffindbar — möglicherweise, weil die vorliegende Ablage nicht jede statische Asset-Datei enthält. Live-Erreichbarkeit war am 2026-08-25 nicht Gegenstand der Prüfung; vor Umsetzung von API-F-240 kurz zu bestätigen, dass der Rückfallbestand tatsächlich noch existiert.

Quelle: `alte apps/android-fb4/FB4/fB4/src/main/java/de/fsrfb4/fb4/module/NetworkModule.java`, `service/DataService.java`, `retrofit/DataUpdateApi.java`, `retrofit/ServerMessageApi.java`, `retrofit/TimeTableFallbackApi.java`; live abgefragt am 2026-08-25; Backend-Quellcode vollständig ausgewertet 2026-08-26: `alte apps/app.fsrfb4.de/data/index.php`, `data/admin/data.php`, `messages/messages.php`, `feedback/feedback.php`, `feedback/admin/api.php`, `feedback/admin/index.php`

**Authentifizierung**
Über INT-012 (Authentik, OpenID Connect) — siehe dort für den Ablauf; dieser Eintrag verweist nur, um Endpunktdetails nicht zu duplizieren.

**Eigentümer/Betreiber**
FSR FB4 selbst, auf einem eigenen Hetzner-VPS. Zugriffsverwaltung und Backup-Ziel: `decisions/0017-zugriff-und-datensicherung-vps.md`.

**Verfügbarkeit**
Betriebsverantwortung liegt beim FSR FB4 selbst, nicht bei einem Dritten. Konkrete Verfügbarkeitszusage (SLA gegenüber den Nutzenden) noch zu definieren.

**Cache-Regel (Vorschlag)**
Für den Zwischenspeicher-Anteil (News/Mensa): serverseitiger Abruf der Ursprungsquellen in festem Intervall, App fragt ausschließlich das eigene Backend ab, nie direkt `hemacode.de` oder OpenMensa.

**Risiko**
Liegt im eigenen Verantwortungsbereich (Betrieb, Kapazität, Sicherheit), anders als bei den übrigen, extern betriebenen Schnittstellen. Kein Fremdbetriebsrisiko, aber voller Aufwand für Bau und Betrieb selbst zu tragen.

**Ersatzoption**
Nicht zutreffend — dies ist selbst die Ersatzoption für INT-003/INT-004 und die einzige Option für RATE/EVENT/HELFER.

**Status**
Betreiber geklärt (FSR FB4, Hetzner-VPS, siehe „Eigentümer/Betreiber" oben). Aufruf und Antwortstruktur stehen im OpenAPI-Vertrag (`platform/api-contract.yaml`), Authentifizierung über INT-012. Siehe `platform/backend-and-api.md` und `decisions/0003-eigenes-backend-fuer-community-funktionen.md`.

---

## INT-009 — FBWS Raumplan

**Zweck**
Liefert die Termine eines einzelnen Raums direkt, ohne Umweg über die Iteration aller Studiengang/Semester-Kombinationen aus INT-001/INT-002. Grundlage für die Raumsuche (RAUM) als mögliche Alternative oder Ergänzung zur bisher in `platform/architecture.md` (ARCH-F-040) und `platform/backend-and-api.md` (API-F-040/050) angenommenen Backend-Aggregation.

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
| `interval` | Zahl oder String | Wiederholungsintervall — nach einem Hinweis des FSR FB4 (2026-08-25) vermutlich Rhythmus in Wochen (z. B. `2` für zweiwöchentlich); unverifiziert, siehe `features/schedule/spec.md` Abschnitt 13 |
| `note` | String | Freitext, bei Prüfungen z. B. `Bitte nicht stören!` |
| `flags` | Zahl | unklare Bedeutung, nicht weiter untersucht |

**Authentifizierung**
Keine.

**Eigentümer/Betreiber**
Fachbereich Informatik, FH Dortmund (dieselbe FBWS-Infrastruktur wie INT-001/INT-002, eigener Pfad `/timetable/` statt `/fbws/`).

**Verfügbarkeit**
Nicht dokumentiert, kein bekanntes SLA.

**Cache-Regel (Vorschlag)**
Wie INT-002: kurze Ablaufzeit (Vorschlag: ein Tag), da Terminänderungen kurzfristig möglich sind.

**Risiko**
Wie INT-001/INT-002 (dieselbe Infrastruktur unter demselben Pfadpräfix, keine erkennbare Versionierung). Die zuvor hier vermerkte Unsicherheit über die Raumabdeckung entfällt durch den Wildcard-Befund (siehe „Aufruf"). Verbleibendes Risiko: Der Endpunkt liefert Rohtermine, keine berechnete Frei/Belegt-Auskunft — diese Ableitung erfolgt weiterhin im eigenen Code (`features/room-finder/spec.md`).

**Ersatzoption**
INT-001 + INT-002, über `roomId` zusammengeführt. Nach dem Wildcard-Befund nur noch als Notbehelf relevant, falls der Wildcard-Aufruf wegfällt — nicht mehr als regulär vorgesehener Weg.

**Status**
Bestätigt und produktiv erprobt. Der Wildcard-Aufruf ist der vorgesehene Weg für die Raumsuche; er liefert Rohtermine, aus denen die Frei/Belegt-Auskunft im eigenen Code abgeleitet wird.

**Nutzung (Stand 2026-09-03).** Der Zwischenspeicher dieses Endpunkts speist mehrere App-Sichten: die Freie-Raum-Suche (RAUM-F-020), die Raumübersicht und die Ansicht laufender Veranstaltungen (RAUM-F-150/RAUM-F-200) sowie den Abgleich der Stundenplan-Termine gegen den Raumplan (`features/schedule/spec.md` SCHED-F-410). Vor Umsetzung von Roadmap-Schritt 6 als Spike zu klären: ob dieser Endpunkt kurzfristige Ausfälle und Raumänderungen abbildet oder nur den Sollplan — davon hängt ab, wie belastbar die Ansicht laufender Veranstaltungen und der Stundenplan-Hinweis sind. Dabei auch `note` (Freitext) und `flags` (Bedeutung bislang unklar) auf Absage-/Verlegungssignale prüfen.

**Bezug zu ARCH-F-040 / API-F-040/API-F-050**
Diese Anforderungen gingen davon aus, Raumbelegung sei nur durch Zusammenführung der Termine aller Studiengang/Semester-Kombinationen herleitbar, und begründeten damit einen wesentlichen Teil des eigenen Backends. Der Wildcard-Befund vom 2026-08-25 widerlegt diese Annahme vollständig: Ein einziger Aufruf liefert alle Raumtermine. Entscheidung FSR FB4, 2026-08-25: Die Zusammenführung entfällt ersatzlos; das Backend ruft den Wildcard-Endpunkt periodisch ab und hält das Ergebnis als Zwischenspeicher vor — aus denselben Gründen wie bei News und Mensa (Ausfallpuffer, TLS-Erzwingung, keine unmittelbare App-Abhängigkeit vom Hochschulsystem), nicht wegen Aggregationsbedarf. ARCH-F-040 und API-F-040/API-F-050 sind entsprechend angepasst.

Quelle: live abgefragt am 2026-08-24, `https://ws.inf.fh-dortmund.de/timetable/current/rest/Room/A.E.01/AllEvents?Accept=application/json`; Wildcard-Form aus `alte apps/android-fb4/FB4/fB4/src/main/java/de/fsrfb4/fb4/retrofit/TimetableApi.java`, 2026-08-25

---

## INT-010 — Fachbereichs-Aktuelles (aktuelles-ni)

**Status: geklärt (2026-08-25).** Die zuvor offene Frage „strukturierter Feed oder Scraping" ist durch die Auswertung des Android-Quellcodes beantwortet: Es gibt keinen strukturierten Feed, die Quelle wird per HTML-Auswertung erschlossen — und zwar bereits produktiv.

**Zweck**
Liefert die Fachbereichs-Nachrichtenseite `aktuelles-ni` (Prüfungsinfos, Raumänderungen, Stellenausschreibungen, Fundsachen) als Quelle für die Klassifizierung „FB-Aktuelles" in NEWS. Entscheidung FSR FB4, 2026-08-25: `aktuelles-ni` wird als zusätzliche News-Quelle integriert, siehe `features/news/spec.md`.

**Aufruf**
```
GET https://www.inf.fh-dortmund.de/aktuelles-ni/seite
GET https://www.inf.fh-dortmund.de/aktuelles-ni/seite/{page}
```
`{page}` ist eine fortlaufende Seitenzahl für ältere Meldungen. Beide Formen liefern HTML, keinen strukturierten Feed.

**Antwortstruktur**
HTML. Die Android-Alt-App wertet sie mit Jsoup aus (`util/NewsParserImpl.java`): Vor dem Parsen wird `<p class='title'>` durch `<div><p class='title'>` ersetzt, um die flach ausgelieferten Meldungen in abgrenzbare Blöcke zu zerlegen — ein Hinweis darauf, dass die Seite Meldungen nicht als eigenständige Container ausliefert, sondern als fortlaufende Absatzfolge. Genaue Feldzuordnung siehe dortige Auswertung; für die Neuentwicklung ist sie am aktuellen Seitenaufbau zu überprüfen, da sie sich seit der letzten Android-Version geändert haben kann.

**Authentifizierung**
Keine — öffentlich zugängliche Fachbereichsseite. Bestätigt durch den produktiven Einsatz in der Android-Alt-App ohne jede Anmeldung.

**Eigentümer/Betreiber**
Fachbereich Informatik, FH Dortmund — nicht der FSR. Der FSR liest diese Quelle lediglich, hat keine Redaktionshoheit über „FB-Aktuelles"-Inhalte.

**Verfügbarkeit**
Unbekannt, kein bekanntes SLA.

**Cache-Regel (Vorschlag)**
Wie INT-003 (News-Feed): kurzfristig serverseitig cachen (Vorschlag: 15 Minuten bis 1 Stunde), da Inhalte wie Raumänderungen kurzfristig relevant sein können.

**Risiko**
Mittel. Da kein strukturierter Feed existiert, bleibt die Anbindung dauerhaft anfällig für Layout-Änderungen der Fachbereichsseite, die außerhalb der Kontrolle des FSR liegen. Das ist kein hypothetisches Risiko, sondern die bestätigte Betriebsrealität der Android-Alt-App. Konsequenz für die Neuentwicklung: Die Auswertung gehört ins Backend (INT-008), nicht in die App — eine Anpassung an ein geändertes Seitenlayout ist dann eine Server-Änderung statt eines App-Updates, das über drei Vertriebswege ausgerollt werden müsste. Zusätzlich ist die Auswertung so zu gestalten, dass sie bei unerwartetem Aufbau erkennbar fehlschlägt statt leere oder verstümmelte Meldungen zu liefern (`quality-and-testing.md` QA-N-070).

**Ersatzoption**
Keine bekannte Alternativquelle für dieselben Inhalte. Bei Ausfall: zuletzt erfolgreich ausgewerteter Stand weiter ausliefern, mit Alters-Hinweis.

**Status**
Geklärt. Aufruf und Auswertungsweg sind aus dem Android-Quellcode bekannt und produktiv erprobt. Vor Umsetzung von NEWS-F-090 bleibt lediglich die Feldzuordnung am aktuellen Seitenaufbau zu überprüfen.

Quelle: `alte apps/android-fb4/FB4/fB4/src/main/java/de/fsrfb4/fb4/retrofit/NewsApi.java`, `util/NewsParserImpl.java`, `module/NetworkModule.java`, 2026-08-25

---

## INT-011 — FSR-Event-Kalender (ICS)

**Status: Dienst geklärt, technische Details offen.**

**Zweck**
Liefert die vom FSR redaktionell gepflegten Events als ICS-Kalender (iCalendar, RFC 5545). Ersetzt die ursprünglich vorgesehene Backend-Redaktionsoberfläche für Events — Entscheidung FSR FB4, 2026-08-25: Events werden über einen externen ICS-Kalender gepflegt, nicht über eine eigene Verwaltungsoberfläche im Backend. Siehe `features/events/spec.md` (EVENT-F-060) und `specs/open-questions.md` (Archiv).

**Aufruf**
Google Calendar (Entscheidung FSR FB4, 2026-08-25). Eine spätere Ablösung durch ein selbstgehostetes Produkt (z. B. CalDAV auf dem FSR-eigenen Hetzner-VPS) ist ausdrücklich vorgemerkt, aber nicht terminiert. Zugriff über die von Google Calendar bereitgestellte öffentliche ICS-Freigabe-URL des FSR-Kalenders, die das eigene Backend (INT-008) periodisch importiert. Genaue URL und Freigabe-Konfiguration bei Umsetzung festzulegen.

**Antwortstruktur**
Standard-iCalendar-Format (RFC 5545): `VEVENT`-Komponenten mit u. a. `UID`, `SUMMARY`, `DTSTART`, `DTEND`, `LOCATION`, `DESCRIPTION`, `STATUS` (u. a. `CONFIRMED`, `CANCELLED` — relevant für EVENT-F-050, Kennzeichnung abgesagter Events).

**Authentifizierung**
Abhängig vom gewählten Kalenderdienst; bei selbstgehostetem CalDAV auf demselben Hetzner-VPS wie INT-008 vermutlich im eigenen Ermessen des FSR.

**Eigentümer/Betreiber**
FSR FB4 selbst (Redaktion der Events erfolgt hier, nicht im eigenen Backend).

**Verfügbarkeit**
Abhängig vom gewählten Kalenderdienst, noch zu definieren.

**Cache-Regel (Vorschlag)**
Periodischer Import durch das Backend (Vorschlag: alle 15–60 Minuten), App fragt ausschließlich das eigene Backend ab, nie direkt den Kalenderdienst.

**Risiko**
Gering bis mittel: Der FSR kontrolliert die Inhalte selbst, die Infrastruktur liegt jedoch bei Google (Drittanbieterabhängigkeit, vergleichbar mit INT-005 — Event-Inhalte sind aber unkritischer als Push-Gerätekennungen, da keine personenbezogenen Daten Studierender darin vorkommen). Verknüpfung eines importierten ICS-Events mit optionalem Helferbedarf (`features/event-volunteers/spec.md`) erfolgt über `UID` (bestätigt, siehe `features/events/spec.md` Abschnitt 13).

**Ersatzoption**
Bei künftiger Ablösung: selbstgehostetes CalDAV auf dem Hetzner-VPS (vorgemerkt, nicht terminiert). Rückkehr zur ursprünglich vorgesehenen Backend-Redaktionsoberfläche (API-F-080, `platform/backend-and-api.md`, mittlerweile entfallen) nur, falls sich der ICS-Weg grundsätzlich als unpraktikabel erweist.

**Status**
Kalenderdienst geklärt (Google Calendar, 2026-08-25), Matching-Schlüssel für Helferbedarf-Verknüpfung bestätigt (`UID`). Noch offen: genaue Freigabe-URL/-Konfiguration, siehe `features/events/spec.md`.

---

## INT-012 — Authentik (Identitätsanbieter)

**Status: Anbieter entschieden, Federation zur FH ausstehend.** Entscheidung FSR FB4, 2026-08-25, siehe `decisions/0010-authentik-als-identitaetsanbieter.md`.

**Zweck**
Einziger Identitätsanbieter für App, Admin-Oberfläche und Backend. Trägt das Konto, das für das Verfassen von Mensa-Bewertungen (RATE), die E-Key-Verwaltung (EKEY) und den Zugang zur Verwaltung (ADMIN) benötigt wird, und liefert zugleich die Rollenzugehörigkeit (FSR-Redaktion, Moderation) als Claim.

**Aufruf**
OpenID Connect, Authorization-Code-Fluss mit PKCE, Redirect über den Systembrowser. Die Instanz läuft eigenbetrieben auf demselben Hetzner-VPS wie INT-008; konkrete Issuer-URL, Client-Kennungen und Scopes werden bei Einrichtung festgelegt.

Die Anbindung an die Hochschule erfolgt **nicht** aus der App, sondern als Upstream-Federation innerhalb von Authentik gegen den Microsoft-Mandanten der FH Dortmund (App-Registrierung dort zu beantragen). Für App und Backend ist dieser Upstream unsichtbar.

Ausdrücklich ausgeschlossen bleibt jede Nachbildung eines Formular-Logins gegen ein Hochschulsystem, wie sie beide Alt-Apps praktizieren (INT-006 für die Notenübersicht, dieselbe Mechanik in der Android-Alt-App für den Ticket-Download) — siehe `platform/security-and-privacy.md` SEC-F-040.

**Antwortstruktur**
Standardkonform: ID-Token und Access-Token als JWT, Nutzerangaben über den Userinfo-Endpunkt. Rollen als Gruppen-Claim.

**Authentifizierung**
Gegenüber Authentik: das gewählte Anmeldeverfahren der Instanz. Solange die FH-Federation nicht steht, sind das eigene Authentik-Konten mit E-Mail-Verifizierung; danach die Weiterleitung an den FH-Mandanten. Der Wechsel ist eine Konfigurationsänderung in Authentik und berührt weder App noch Backend.

**Eigentümer/Betreiber**
FSR FB4 selbst (Authentik-Instanz). Der Upstream-Mandant liegt bei der FH Dortmund.

**Verfügbarkeit**
Eigener Verantwortungsbereich, wie INT-008. Ein Ausfall betrifft alle kontogebundenen Funktionen gleichzeitig; kontofreie Lesefunktionen bleiben unberührt (IDENT-F-012), womit die Bereichsisolation aus NFR-N-080 gewahrt bleibt.

**Cache-Regel (Vorschlag)**
Nicht zutreffend für den Anmeldevorgang selbst. Ausgestellte Token werden bis zum Ablauf im gesicherten Systemspeicher gehalten (DATA-F-120).

**Risiko**
Gering bis mittel. Der zuvor hier vermerkte Blockade-Charakter entfällt: Die Umsetzung hängt nicht mehr an einer Freigabe der Hochschul-IT, weil eigene Konten bis dahin tragen. Verbleibendes Risiko ist der Eigenbetrieb einer weiteren sicherheitskritischen Komponente (Aktualisierung, Sicherung, Verfügbarkeit).

**Ersatzoption**
Nicht zutreffend — Authentik ist selbst die Ersatzoption für den zuvor angenommenen, ungeklärten Hochschul-SSO-Weg.

**Verwaltungs-API (Gruppen und Mitgliedschaft)**
Für ADMIN-F-070 (Zuweisen und Entziehen der Rollen FSR-Redaktion und Moderation) schreibt das Backend die Gruppenmitgliedschaft in Authentik über dessen REST-Verwaltungs-API unter `https://<instanz>/api/v3/`. Rollen sind Authentik-Gruppen; das Backend hält keine eigene Rollentabelle (API-F-250).

| Zweck | Aufruf (Authentik `api/v3`) | Ausgewertete Felder |
|---|---|---|
| Konto-ID zu einem Benutzernamen ermitteln | `GET core/users/?username={Benutzername}` | `results[].pk` (Ganzzahl), `results[].username` |
| Gruppen-ID zu einem Namen ermitteln | `GET core/groups/?name={Gruppenname}` | `results[].pk` (UUID), `results[].name` |
| Mitglieder einer Gruppe lesen | `GET core/groups/{pk}/` | `pk`, `name`, `users_obj[].pk` (Ganzzahl), `users_obj[].username`, `users_obj[].name` |
| Konto einer Gruppe hinzufügen | `POST core/groups/{pk}/add_user/` mit `{ "pk": "{kontoId}" }` (Authentik nimmt die Ganzzahl auch als String an) | HTTP-Status |
| Konto aus einer Gruppe entfernen | `POST core/groups/{pk}/remove_user/` mit `{ "pk": "{kontoId}" }` | HTTP-Status |

Die Verwaltungsoberfläche listet Konten mit bestehender Rolle über den Gruppen-Lesepfad. Ein Konto **ohne** bisherige Rolle benennt die bedienende Person über den Benutzernamen; das Backend löst ihn über `core/users/?username=` zur `pk` auf, bevor Aussperrprüfung (ADMIN-F-080) und Protokolleintrag (ADMIN-F-110) darauf arbeiten. Eine bereits numerische Kennung wird ohne Auflösung übernommen.

**Authentifizierung:** Bearer-Token eines Authentik-Dienstkontos (Intent *API*) mit Schreibrecht auf die betreffenden Gruppen — am einfachsten Mitglied von `authentik Admins`. Token und Basis-URL kommen ausschließlich aus der Backend-Konfiguration bzw. einem Secret-Mechanismus (SEC-N-110), nie aus dem Quellcode oder einer Feature-Spec.

**Status dieser Teil-Schnittstelle:** Lesepfad **live verifiziert am 2026-09-03** gegen die eigenbetriebene Instanz `auth.tobtech.de`: `GET core/groups/?name=…` liefert je Gruppe `pk`/`name`, `GET core/groups/{pk}/` liefert `users_obj` mit genau den Feldern `pk`/`username`/`name`. Die Gruppen `FSR-Redaktion` und `Moderation` existieren. Der Schreibpfad (`add_user`/`remove_user`) und die Benutzernamen-Auflösung (`core/users/?username=`) sind strukturell aus derselben API bekannt, ein Round-Trip gegen die Instanz steht noch aus (nur beim ersten echten Rollenwechsel bestätigbar). Vertragstest gegen diese Struktur: `AuthentikDirectoryContractTests` (QA-N-070). Ohne konfigurierte API meldet das Backend die Rollenverwaltung als „nicht verfügbar" (503), statt still zu scheitern.

**Status**
Anbieter entschieden, OIDC-Discovery und Verwaltungs-API-Lesepfad gegen `auth.tobtech.de` verifiziert (2026-09-03). Offen: Zeitpunkt und Ergebnis der App-Registrierung im FH-Microsoft-Mandanten, welche Claims der Upstream liefert, und der Schreib-Round-Trip der Verwaltungs-API. Nichts davon blockiert die Umsetzung.

---

## INT-013 — Prüfungsplan (Intranet-Excel)

**Status: zu definieren.**

**Zweck**
Liefert den offiziellen Prüfungsplan (Termine, keine Ergebnisse) des Fachbereichs als Grundlage für die Prüfungsauswahl im Stundenplan (`features/schedule/spec.md`, SCHED-F-200). Nicht zu verwechseln mit HISinOne/INT-006 (Notenergebnisse).

**Aufruf**
Der Fachbereich veröffentlicht den Prüfungsplan als Excel-Datei zu einem variablen Zeitpunkt während der Vorlesungszeit auf einer Intranet-Seite: `https://intranet.fh-dortmund.de/hochschule/organisation/fachbereiche/informatik/pruefungen/pruefungsplaene`. Diese Seite setzt einen Hochschul-Login voraus, den weder App noch Backend besitzen (siehe `product/vision.md` Nicht-Ziel 1, `platform/security-and-privacy.md` zum ausgeschlossenen Passwort-Replay). Der Zugriff ist deshalb **kein automatisierter API-Aufruf**, sondern ein zweistufiger, halbautomatischer Vorgang: Ein FSR-Mitglied oder Admin lädt die Datei manuell aus dem Intranet herunter und lädt sie anschließend in das eigene Backend hoch (`platform/backend-and-api.md` API-F-180), das die Datei parst und weiterverarbeitet.

**Antwortstruktur**
Excel-Datei, ein Arbeitsblatt `PP`. Fünf reale Dateien der Jahrgänge WiSe 2023/24 bis SoSe 2026 liegen unter `resources/` vor und wurden am 2026-08-25 grob ausgewertet. Der Aufbau ist deutlich komplexer als eine flache Terminliste:

| Bereich | Inhalt |
|---|---|
| Kopfzeilen | Semesterbezeichnung, `Stand:`-Datum, Prüfungszeitraum, Farblegende (`Veranstaltung im WS` / `im SS` / `in WS und SS` / `keine Veranstaltung (mehr)`) |
| Zeilenachse | je Prüfung eine Zeile: `Anmeldezeitraum`, `WT` (Wochentag), `Datum`, `Zeit`, `Raum` (mehrzeilig, mehrere Räume je Prüfung), `Num.`, `Name`, `Prüfer/in` |
| Spaltenachse ab Spalte I | Matrix aus Studiengang × Vertiefung × Prüfungsordnung (z. B. `B INF` / `PI`,`TI`,`DS` / PO `19`; `B MI` / PO `19`) |
| Zellwerte der Matrix | Fachsemester als Zahl oder Wahlkategorie als Kürzel (beobachtet: `1`, `2`, `4`, `5`, `W`, `Fo`, `Pr`) |
| Trennzeilen | Zeilen mit Datum, aber ohne Prüfungsangaben, die Tagesabschnitte gliedern |

Drei Eigenschaften erschweren den Import und sind vor der Umsetzung zu berücksichtigen: Die Kopfzeilen-Position schwankt zwischen den Jahrgängen (Beginn in Zeile 1 oder 2, `Stand:` mal in Zeile 1, mal in Zeile 2), die Spaltenzahl variiert (beobachtet 33 bis 44), und die Farblegende deutet darauf hin, dass **Zellhintergrundfarben Bedeutung tragen** — ein Import, der nur Zellwerte liest, verliert diese Information.

Fachlich wertvoll ist die Matrix: Sie liefert genau die Zuordnung Prüfung → (Studiengang, Vertiefung, Prüfungsordnung, Fachsemester), mit der sich die Auswahl in SCHED-F-200 auf die für eine Nutzerin überhaupt in Frage kommenden Prüfungen vorfiltern lässt, statt ihr alle Prüfungen des Fachbereichs vorzulegen.

**Authentifizierung**
Hochschul-Intranet-Login für den manuellen Download durch den Admin — betrifft nur diesen manuellen Schritt, nicht die App oder das Backend. Der Upload ins eigene Backend läuft über dessen reguläre Admin-Authentifizierung.

**Eigentümer/Betreiber**
Fachbereich Informatik, FH Dortmund (Intranet).

**Verfügbarkeit**
Nicht dokumentiert; Veröffentlichungszeitpunkt variabel innerhalb der Vorlesungszeit.

**Cache-Regel (Vorschlag)**
Nicht zutreffend — einmaliger manueller Import je Prüfungsplan-Version, kein periodischer Abruf. Bestand wird bei Import eines neuen Jahres vollständig ersetzt (`platform/backend-and-api.md` API-F-190).

**Risiko**
Mittel: Kein technisches Zugriffsrisiko, da die App/das Backend keine Hochschul-Zugangsdaten hält. Abhängigkeit von einem manuellen Schritt durch eine verantwortliche FSR-Person; Datei-Format kann sich zwischen Jahren ändern.

**Ersatzoption**
Keine bekannte automatisierte Alternative.

**Status**
Struktur grob erfasst (siehe „Antwortstruktur"). Grundsatzentscheidung (halbautomatischer Import statt Live-API-Zugriff) getroffen, FSR FB4, 2026-08-25. Eine feldgenaue Festlegung erfolgt bewusst erst bei Umsetzung der Prüfungsplan-Funktion in der zweiten Ausbaustufe (`../decisions/0012-zuschnitt-der-ersten-ausbaustufe.md`), da die Jahrgangsvarianz eine Auswertung mehrerer Dateien nebeneinander erfordert.

**Nebenbefund (2026-08-25).** Die Android-Alt-App importiert den Prüfungsplan nicht, sondern verlinkt ihn nur: Das bestehende Backend liefert unter dem Schlüssel `examplan` eine URL (aktuell `http://hoolycraap.de/fh/pruefungsplan.pdf` — eine private Domain, unverschlüsselt), analog `timeplan` für den Zeitplan. Der geplante Import ist damit eine echte Neuerung gegenüber dem Stand beider Alt-Apps, und die Ablösung von `hoolycraap.de` gehört zu denselben Fremdabhängigkeiten wie `hemacode.de` (`../decisions/0007-datenquellen-mensa-und-news.md`).

Quelle: `resources/pplan.xlsx`, `resources/pplan(1).xlsx` bis `resources/pplan(4).xlsx`, ausgewertet 2026-08-25

---

## INT-014 — E-Key-Verwaltungstool (Postgres)

**Status: zu definieren.**

**Zweck**
Bestehendes, vom FSR bereits eigenständig betriebenes Tool zur Verwaltung von E-Key-Ausgaben, Berechtigungen und Status — System der Wahrheit für alle E-Key-Daten (E-Key-Nummer, Matrikelnummer, Berechtigungen). Das neue App-Backend (INT-008) integriert sich hiermit, statt eine eigene parallele Datenhaltung aufzubauen (Entscheidung FSR FB4, 2026-08-25, siehe `features/e-key/spec.md`).

**Aufruf**
Unbekannt, ob das Tool eine API bereitstellt oder ob ausschließlich direkter Datenbankzugriff auf die zugrunde liegende Postgres-Instanz vorgesehen ist. Direkter Datenbankzugriff zweier unabhängiger Anwendungen ohne vermittelnde API ist riskant (Schema-Kopplung, siehe Risiko unten) und vor Umsetzung zu klären.

**Antwortstruktur**
Unbekannt — abhängig vom Datenbankschema des bestehenden Tools bzw. einer möglichen API.

**Authentifizierung**
Unbekannt.

**Eigentümer/Betreiber**
FSR FB4 (bestehendes, bereits im Einsatz befindliches Tool, unabhängig von der Neuentwicklung dieser App).

**Verfügbarkeit**
Unbekannt.

**Cache-Regel (Vorschlag)**
Statusabfragen kurzfristig zwischenspeichern (analog INT-003, Vorschlag 15 Minuten), da das Tool außerhalb der Kontrolle dieses Projekts steht.

**Risiko**
Mittel bis hoch, solange unverifiziert: Bei direktem Datenbankzugriff kann eine Schema-Änderung im bestehenden Tool das neue Backend unbemerkt brechen, ohne dass eine vertragliche/versionierte Schnittstelle das anzeigt.

**Ersatzoption**
Keine — dieses Tool ist die einzige Quelle für E-Key-Daten, eine parallele Datenhaltung im neuen Backend ist ausdrücklich nicht vorgesehen.

**Status**
Zu definieren: Aufruf-/Integrationsart (API vs. direkter DB-Zugriff), Antwortstruktur, Authentifizierung. Klärung durch FSR FB4 und technische Leitung vor Umsetzung von `features/e-key/spec.md`.

---

## INT-015 — Mensa-API des ITMC (TU Dortmund)

**Status: bestätigt, live erprobt (Feldstruktur verifiziert 2026-09-03, Verbrauchsorte ohne Ausgabestellen-Gliederung geprüft 2026-09-04).** Ersetzt INT-004 als Speiseplan-Quelle.

**Zweck**
Liefert Speisepläne, Gerichtskategorien und Zusatzstoff-/Allergenschlüssel der Mensen des Studierendenwerks Dortmund. Grundlage für MENSA und, über die normalisierten Gerichtsbezeichnungen, für RATE.

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

`GET /canteens/{id}/{date}` → JSON-**Liste** von Gerichten. `GET /canteens/{id}` → JSON-**Objekt**, Schlüssel = Datum `YYYY-MM-DD`, Wert = dieselbe Gerichtsliste (alle vorliegenden Tage in einem Aufruf).

Gericht-Objekt:

| Feld | Typ | Bedeutung |
|---|---|---|
| `title` | Objekt `{de, en}` | Bezeichnung des Gerichts. Zusatzstoff-/Allergen-Codes stehen zusätzlich inline in Klammern; mehrteilige Gerichte trennen die Komponenten mit ` \| ` (Beispiel: `"Bolognese (20a,28) \| Spaghetti (20a) \| Reibkäse (2,22,26)"`) |
| `type` | Liste von Strings | Kennzeichnungen des Gerichts, Schlüssel aus `/types` (z. B. `A` Fleisch aus artgerechter Haltung, `B` Klimateller, `N` Vegan, `R`, `G`) |
| `additives` | Liste von Strings | Zusatzstoff-/Allergen-Codes, Schlüssel aus `/additives` (z. B. `["2","20a","22"]`) |
| `category` | String | numerischer Kategorie-Code (nicht anzeigetauglich; für die Anzeige dient `counterNames`). Über `/categories` teilweise auflösbar, aber nicht vollständig — bei der Food Fakultät verwenden die Gerichte Codes (`20`, `21`, `30`, `32`), die im `/categories`-Verzeichnis fehlen (Prüfung 2026-09-04) |
| `price` | Objekt `{student, staff, guest}` | Preise als **String** mit Komma-Dezimaltrennung und Euro-Zeichen, Beispiel `"3,30 €"` — clientseitig zu parsen |
| `counter` | String \| fehlt | Ausgabestelle, unlokalisiert (z. B. `"Menü 1"`, `"Beilagen"`). Bei manchen Verbrauchsorten (Food Fakultät, Kennung 474) fehlt das Feld ganz |
| `counterNames` | Objekt `{de, en}` \| `null` | zweisprachige Anzeigekategorie; für die getrennte Beilagen-Darstellung (MENSA-F-040) maßgeblich. Bei der Food Fakultät durchgängig `null` — die Neuentwicklung führt solche Gerichte dann ohne Kategorieüberschrift (`features/canteen/spec.md` MENSA-F-160) |
| `dispoId` | String | interne Kennung des Dispositionssatzes |
| `position` | Zahl | Sortierreihenfolge innerhalb des Tages |

`GET /types`, `GET /additives` und `GET /categories` → je JSON-Liste von `{ "id": String, "name": { "de": String, "en": String } }`, Beispiel `{"id":"N","name":{"de":"Vegan","en":"Vegan"}}`. Damit trägt diese Quelle die Zweisprachigkeit aus NFR-F-115 ohne eigene Übersetzungsarbeit. `/categories` (Stand 2026-09-04: elf Einträge, u. a. `1` „Menu", `61` „Speisen in der food fakultät") deckt die `category`-Codes der Food-Fakultät-Gerichte nicht ab und wird deshalb vorerst nicht als Kategoriequelle genutzt — die Anzeigekategorie kommt aus `counterNames`/`counter` (MENSA-F-030), fehlt beides, entfällt sie (MENSA-F-160).

`GET /canteens/474` (Food Fakultät), Prüfung 2026-09-04: liefert für den aktuellen Tag 27 Gerichte mit vollständigen `title`, `type`, `additives`, `price` und `position`, aber ohne `counter` und mit `counterNames: null`. Die Daten kommen also vollständig an; lediglich die Ausgabestellen-Gliederung fehlt an der Quelle.

`GET /canteens/{id}/openings/all` antwortete am 2026-09-03 mit **HTTP 500** und wird nicht verwendet. Die Öffnungszeiten je Mensa und Wochentag kommen aus den gepflegten Stammdaten (`features/admin/spec.md`, MENSA-F-047); die Android-Alt-App führt beide Quellen nebeneinander, für die Neuentwicklung sind die Stammdaten führend. Fällt eine künftige Auswertung von `openings/all` positiv aus, kann sie als zusätzliche Quelle nachgezogen werden, ohne dass MENSA-F-047 sich ändert.

**Authentifizierung**
Keine.

**Eigentümer/Betreiber**
ITMC (IT und Medien Centrum) der TU Dortmund. Offizieller Hochschulbetrieb, keine private Infrastruktur.

**Verfügbarkeit**
Nicht vertraglich zugesagt, aber institutionell betrieben und produktiv von der Android-Alt-App genutzt. Live-Abfrage am 2026-08-25: Status 200 in rund 0,2 Sekunden.

**Cache-Regel (Vorschlag)**
Speiseplan je Mensa und Tag bis Tagesende (wie zuvor INT-004). Öffnungszeiten, Gerichtskategorien und Zusatzstoffverzeichnis ändern sich selten — Vorschlag: ein Tag, serverseitig im Backend (INT-008) vorgehalten.

Der Backend-Abrufzeitplan ist an die studentischen Nutzungsspitzen angelehnt statt an ein starres Intervall ab Prozessstart: je eine Auffrischung vor der Morgen- und vor der Mittagsspitze (Ortszeit), ergänzt um weitere Läufe über den Tag (`platform/backend-and-api.md` API-F-076, `features/canteen/spec.md` MENSA-N-020). Die App ruft INT-015 nie selbst ab (`platform/architecture.md` ARCH-F-050); das Herunterziehen zum Aktualisieren in der App (MENSA-F-240) liest ausschließlich den Backend-Zwischenspeicher neu, nicht INT-015. Bei diesem Abrufvolumen (rund ein Dutzend Anfragen je Lauf, konstant und unabhängig von der Nutzerzahl der App) ist keine gesonderte Absprache mit dem ITMC nötig; der eigene `User-Agent` (`fb4-backend`) macht die Herkunft erkennbar.

**Risiko**
Gering bis mittel. Deutlich niedriger als INT-004: offizieller Hochschulbetreiber statt privater Vermittler, TLS statt Klartext, Primärquelle statt Weiterreichung. Verbleibend: keine erkennbare Versionszusage über `v3` hinaus, kein SLA.

**Ersatzoption**
OpenMensa als offenes Verzeichnisprojekt oder die Speiseplanseiten des Studierendenwerks (`stwdo.de`, in den Mensa-Stammdaten je Mensa als `url` hinterlegt).

**Zugehörige Stammdaten**
Die Zuordnung von Mensa-Kennung zu ITMC-Kennung, Anzeigename, Öffnungszeiten, Standardauswahl und Anzeigereihenfolge ist **nicht** Teil dieser Schnittstelle, sondern wird vom eigenen Backend gepflegt (siehe INT-008 und `features/admin/spec.md`). Die Android-Alt-App führt dafür neun Mensen mit den Feldern `name`, `id`, `itmcId`, `url`, `pdfUrl`, `enabledDefault`, `openingTime` (fünf Werktagseinträge) und `defaultOrder`.

Quelle: `alte apps/android-fb4/FB4/fB4/src/main/java/de/fsrfb4/fb4/retrofit/MenuApi.java`, `service/MenuService.java`, `module/NetworkModule.java`, `assets/canteens.json`; live abgefragt am 2026-08-25, Feldstruktur der Gerichts-, `types`- und `additives`-Antworten live verifiziert am 2026-09-03, `/categories` und die Food-Fakultät-Antwort (Kennung 474) verifiziert am 2026-09-04

---

## INT-016 — Nachrichten des Fachbereichs Wirtschaft (FB9)

**Status: bestätigt, produktiv in der Android-Alt-App.**

**Zweck**
Liefert Studien-Nachrichten des Fachbereichs Wirtschaft (FB9). Beantwortet die bislang offene Frage aus `product/legacy-inventory.md` Abschnitt 4, ob die Android-Alt-App tatsächlich zwei getrennte News-Quellen führt: Sie tut es — mit eigenem Endpunkt, eigenem Parser (`NewsEconomyParserImpl`), eigenem Datenmodell und eigener Ansicht.

**Aufruf**
```
GET https://www.inf.fh-dortmund.de/de/fb/9/studiengaenge/400/aktuelles_stud.php
```

**Antwortstruktur**
HTML, wie INT-010. Eigene Auswertung, da der Seitenaufbau von `aktuelles-ni` abweicht.

**Authentifizierung**
Keine.

**Eigentümer/Betreiber**
FH Dortmund, Fachbereich Wirtschaft (FB9) — weder FSR FB4 noch Fachbereich Informatik.

**Verfügbarkeit**
Nicht dokumentiert, kein SLA.

**Cache-Regel (Vorschlag)**
Wie INT-010.

**Risiko**
Mittel, aus denselben Gründen wie INT-010 (HTML-Auswertung ohne strukturierten Feed). Zusätzlich fachlich: Die Zielgruppe der App ist laut `product/vision.md` der Fachbereich Informatik; FB9-Nachrichten betreffen nur den Teil der Studierenden in Verbund- und Wirtschaftsinformatik-Studiengängen.

**Ersatzoption**
Verzicht auf diese Quelle, ersatzweise externer Link.

**Status**
Bestätigt. Ob die Quelle in die Neuentwicklung übernommen wird, entscheidet `features/news/spec.md` — sie ist im aktuellen Umfang nicht vorgesehen (siehe dort, Nicht-Scope), der Befund ist hier festgehalten, damit die Entscheidung auf Tatsachen statt auf Vermutung beruht.

Quelle: `alte apps/android-fb4/FB4/fB4/src/main/java/de/fsrfb4/fb4/retrofit/NewsApi.java`, `util/NewsEconomyParserImpl.java`, `fragments/news/NewsEconomyFragment.java`, 2026-08-25

---

## INT-017 — HIS-Portal der FH Dortmund (Semesterticket-Bezug)

**Status: Verfahren bekannt, Nutzung ausgeschlossen.**

**Zweck**
Bezugsweg für das NRW-Semesterticket als PDF. Die Android-Alt-App lädt das Ticket darüber automatisch herunter — die Funktion, die `features/semester-ticket/spec.md` Abschnitt 13 als priorisierten Spike führt. Dieser Eintrag dokumentiert das Verfahren, damit die Entscheidung dagegen nachvollziehbar bleibt.

**Aufruf**
```
POST https://portal.fh-dortmund.de/qisserver/rds?state=user&type=1&category=auth.login
GET  https://portal.fh-dortmund.de/qisserver/pages/fhdo/cm/stu/fhService/start.xhtml?_flowId=fhService-flow
POST https://portal.fh-dortmund.de/qisserver/pages/fhdo/cm/stu/fhService/start.xhtml?_flowId=fhService-flow&_flowExecutionKey=e1s1
GET  https://portal.fh-dortmund.de/qisserver/rds?state=user&type=3&category=auth.logout
```
Anmeldung über die Formularfelder `asdf` (Benutzername) und `fdsa` (Passwort), Sitzung über Cookies. Der Ticket-Bezug läuft anschließend über einen mehrstufigen Formularablauf, dessen Felder aus der vorher geladenen Seite ausgelesen werden.

**Antwortstruktur**
HTML für Anmeldung und Formularablauf, PDF für den eigentlichen Download.

**Authentifizierung**
Benutzername und Passwort des Hochschulkontos, im Formular übertragen. Die Android-Alt-App speichert beide geräteseitig über den Android-Keystore verschlüsselt (`util/UserCredentialsHelper.java`, `util/Cryptography.java`) und sendet sie über einen Hintergrund-Worker (`worker/TicketDownloadWorker.java`) wiederholt erneut.

**Eigentümer/Betreiber**
FH Dortmund. Dasselbe Portal beherbergt auch HISinOne (INT-006) — beide liegen unter `/qisserver/`.

**Verfügbarkeit**
Nicht dokumentiert.

**Cache-Regel (Vorschlag)**
Nicht zutreffend.

**Risiko**
**Hoch, und zwar unabhängig von der technischen Umsetzung.** Das Verfahren erfordert, dass die App das Hochschulpasswort entgegennimmt, dauerhaft vorhält und wiederholt erneut sendet — genau das Muster, das `platform/security-and-privacy.md` (SEC-F-040) und `platform/backend-and-api.md` (API-F-110) ausschließen. Die geräteseitige Verschlüsselung mildert das Risiko, beseitigt es aber nicht: Ein Passwort, das die App entschlüsseln kann, um es zu senden, ist ein Passwort, das die App im Klartext verarbeitet. Hinzu kommt die Bindung an einen undokumentierten Formularablauf mit fest verdrahtetem `_flowExecutionKey`, der bei jeder Portal-Aktualisierung brechen kann.

**Ersatzoption**
Manueller Import des Ticket-PDFs durch die Nutzerin (TICKET-F-010), wie in beiden Alt-Apps ebenfalls vorhanden.

**Status**
**Für die Neuentwicklung ausgeschlossen** (Entscheidung FSR FB4, 2026-08-25). Zunächst ist mit der Authentik-Federation (INT-012) zu prüfen, ob sich das Ticket über einen offiziellen, tokenbasierten Weg beziehen lässt; bis dahin bleibt es beim manuellen Import. Der Komfortverlust gegenüber dem Stand der Android-Alt-App wird bewusst in Kauf genommen und ist in `features/semester-ticket/spec.md` dokumentiert.

**Nebenbefund zum Ticket-Zuschnitt.** Die Koordinaten für den Bildausschnitt des Tickets liegen in der Android-Alt-App nicht im Quellcode, sondern kommen als Fernkonfiguration vom bestehenden Backend (`ticket_rect_coordinates`, live abgefragt am 2026-08-25: `[161, 148, 555, 350]`). Das löst den in `product/legacy-inventory.md` als M-010 geführten Mangel der Flutter-Alt-App und ist als Muster übernehmenswert, unabhängig davon, wie das PDF ins Gerät gelangt.

Quelle: `alte apps/android-fb4/FB4/fB4/src/main/java/de/fsrfb4/fb4/retrofit/HisApi.java`, `util/TicketUtil.java`, `util/UserCredentialsHelper.java`, `worker/TicketDownloadWorker.java`, `module/NetworkModule.java`, 2026-08-25

---

## INT-018 — GlitchTip (Fehlertelemetrie)

**Status: geplant, siehe `decisions/0014-selbstbetriebene-fehlertelemetrie.md`.**

**Zweck**
Selbstbetriebene Sammlung von App- und Backend-Fehlerberichten, damit das FSR-Team von Produktionsfehlern erfährt, ohne auf zufällige Nutzermeldungen angewiesen zu sein.

**Aufruf**
Sentry-kompatibles Ereignis-Protokoll (DSN-basiert), über die offiziellen SDKs `@sentry/react-native` (App) bzw. ein `Sentry`-NuGet-Paket mit Serilog (Backend). Genaue Endpunkt-URL entsteht bei Einrichtung der Instanz.

**Antwortstruktur**
Nicht zutreffend für die Richtung App/Backend → GlitchTip (reiner Schreibpfad); Auswertung erfolgt über die GlitchTip-eigene Oberfläche, nicht über die App.

**Authentifizierung**
Projektgebundener DSN-Schlüssel je Client (App, Backend), analog dem Sentry-Protokoll.

**Eigentümer/Betreiber**
FSR FB4 selbst, auf demselben Hetzner-VPS wie INT-008/INT-012.

**Verfügbarkeit**
Eigener Verantwortungsbereich, wie INT-008/INT-012. Ein Ausfall der Instanz verhindert nur die Fehlerübermittlung, beeinträchtigt keine fachliche Funktion der App.

**Cache-Regel (Vorschlag)**
Nicht zutreffend — kein abrufbarer Datenbestand für die App.

**Risiko**
Gering. Zusätzlicher selbstbetriebener Dienst mit Update-/Sicherungspflicht (wie Authentik), aber ohne fachliche Abhängigkeit einer App-Funktion davon.

**Ersatzoption**
Sentry SaaS — verworfen, siehe `decisions/0014-selbstbetriebene-fehlertelemetrie.md` (wäre ein Drittanbieter im Sinne von SEC-F-125).

**Status**
Geplant. Einrichtung Teil von Schritt 0 der Roadmap.

Quelle: `decisions/0014-selbstbetriebene-fehlertelemetrie.md`

---

## Übersicht

| ID | System | Status | Risiko | Abhängige Feature-Specs |
|---|---|---|---|---|
| INT-001 | FBWS Studiengänge (`/timetable/`) | aktiv | mittel | SCHED, RAUM |
| INT-002 | FBWS Termine (`/timetable/`) | aktiv | mittel | SCHED, RAUM |
| INT-003 | News-Feed (hemacode.de) | aktiv, Ablöserisiko | hoch | NEWS |
| INT-004 | Mensa-Speisepläne (hemacode.de) | **abgelöst durch INT-015** | – | – |
| INT-005 | Push-Benachrichtigungen (Android: UnifiedPush, iOS: FCM) | aktiv | mittel | NEWS, SET |
| INT-006 | HISinOne (Notenübersicht) | offen | offen / hoch am Altverfahren | NOTEN |
| INT-007 | BookStack (FSR-Wiki) | Kernzugriff bestätigt, Berechtigungsmodell offen | mittel | WIKI |
| INT-008 | Eigenes Backend | Betreiber geklärt (FSR FB4, Hetzner-VPS), Vorgänger `app.fsrfb4.de` abzulösen | eigener Verantwortungsbereich | RATE, EVENT, HELFER, NEWS, MENSA, RAUM, EKEY, ADMIN |
| INT-009 | FBWS Raumplan (Wildcard `Room/*/AllEvents`) | bestätigt, produktiv erprobt | mittel | RAUM |
| INT-010 | Fachbereichs-Aktuelles (aktuelles-ni) | geklärt: HTML-Auswertung | mittel | NEWS |
| INT-011 | FSR-Event-Kalender (ICS) | Dienst geklärt (Google Calendar) | gering bis mittel | EVENT |
| INT-012 | Authentik (Identitätsanbieter) | Anbieter entschieden, FH-Federation ausstehend | gering bis mittel | RATE, EKEY, ADMIN |
| INT-013 | Prüfungsplan (Intranet-Excel) | Struktur grob erfasst | mittel | SCHED |
| INT-014 | E-Key-Verwaltungstool (Postgres) | zu definieren | mittel bis hoch | EKEY |
| INT-015 | Mensa-API des ITMC (TU Dortmund) | bestätigt, live erprobt | gering bis mittel | MENSA, RATE |
| INT-016 | Nachrichten des Fachbereichs Wirtschaft (FB9) | bestätigt, nicht im Umfang | mittel | – |
| INT-017 | HIS-Portal (Semesterticket-Bezug) | Verfahren bekannt, Nutzung ausgeschlossen | hoch | TICKET |
| INT-018 | GlitchTip (Fehlertelemetrie) | geplant | gering | – |
