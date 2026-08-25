---
id: integrations
titel: Schnittstellenregister
praefix: INT
status: draft
version: 0.7.0
owner: FSR FB4
last_reviewed: 2026-08-25
derived_from:
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
GET https://ws.inf.fh-dortmund.de/fbws/current/rest/CourseOfStudy/?Accept=application/json
```
Keine Parameter außer dem festen Query-String `Accept=application/json`.

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
GET https://ws.inf.fh-dortmund.de/fbws/current/rest/CourseOfStudy/{sname}/{grade}/Events?Accept=application/json&studentSet=*
```
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

**Nutzungshinweis für die Raumsuche**
Ursprünglich angenommen: Der FBWS biete keinen eigenen Endpunkt für Raumbelegung, weshalb sich diese nur herleiten lasse, indem die Termine aller Studiengang/Semester-Kombinationen (iteriert über INT-001) abgerufen und über `roomId` zusammengeführt werden. Diese Aggregation ist Aufgabe des eigenen Backends (siehe INT-008), nicht der App direkt, um wiederholtes vollständiges Abfragen aller Kombinationen durch jedes Gerät zu vermeiden. **Korrektur (2026-08-24):** Ein raumbezogener FBWS-Endpunkt existiert tatsächlich, siehe INT-009. Die Aggregation über INT-001/INT-002 bleibt dennoch als Fallback relevant, solange die Raumabdeckung von INT-009 unverifiziert ist — siehe dortigen Abschnitt „Bezug zu ARCH-F-040 / API-F-040/API-F-050" und `features/room-finder/spec.md`.

**Nutzungshinweis für den Wahlpflicht-Planungsmodus (SCHED)**
Für SCHED-F-270 ruft die App diesen Endpunkt zusätzlich mit einem von der Nutzerin gewählten, vom eigenen abweichenden `{grade}` ab, um Wahlpflicht-Termine zu finden, die organisatorisch einem anderen Fachsemester zugeordnet sind als dem eigenen — derselbe Endpunkt, keine neue Integration. Offen (siehe `features/schedule/spec.md` Abschnitt 13): ob ein so abgerufenes `{grade}` tatsächlich die gesuchten Wahlpflicht-Termine liefert oder nur die dort regulär vorgesehenen Pflichtveranstaltungen — vor Umsetzung mit echten Beispieldaten zu verifizieren.

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
Direkter Zugriff auf OpenMensa oder Zwischenspeicherung über das eigene Backend (INT-008).

**Status**
Aktiv, aber mit hohem Ablöserisiko; siehe `decisions/0007-datenquellen-mensa-und-news.md`.

Quelle: `alte apps/fb4_app-main/fb4_app-main/lib/areas/canteen/repositories/meals_repository.dart`, Modell `alte apps/fb4_app-main/fb4_app-main/lib/areas/canteen/models/meal.dart`

---

## INT-005 — Push-Benachrichtigungen

**Zweck**
Benachrichtigt Nutzerinnen und Nutzer über neue News-Meldungen, sofern aktiviert.

**Aufruf**
Kein klassischer Request/Response-Aufruf, sondern Themen-Abonnement über Firebase Cloud Messaging (FCM): `subscribeToTopic("Aktuelles")` bei Aktivierung, `unsubscribeFromTopic("Aktuelles")` bei Deaktivierung. Auslösend ist ausschließlich eine Einstellung in der App (Opt-in); es gibt kein serverseitig erzwungenes Abonnement.

**Antwortstruktur**
Nicht abschließend bekannt: Die Alt-App verarbeitet eingehende Nachrichten nicht (der zugehörige Handler ist im Quellcode auskommentiert). Für die Neuentwicklung ist die Nutzlaststruktur einer eingehenden Nachricht (z. B. Verweis auf die zugehörige News-Meldung für Deep-Linking) neu zu definieren.

**Authentifizierung**
Geräteregistrierung über Firebase (projektgebunden über `google-services.json`/Firebase-Projektkonfiguration), keine Nutzerauthentifizierung.

**Eigentümer/Betreiber**
Google (Firebase Cloud Messaging).

**Verfügbarkeit**
Google-SLA für Firebase, nicht projektspezifisch geprüft.

**Cache-Regel (Vorschlag)**
Nicht zutreffend (kein abrufbarer Datenbestand).

**Risiko**
Abhängigkeit von einem außerhalb der FH Dortmund betriebenen Drittanbieterdienst. Datenschutzrechtlich relevant: Google vergibt eine pseudonyme Geräte-ID zur Zustellung; dies ist bereits in der Datenschutzerklärung der Alt-App beschrieben und für die Neuentwicklung erneut zu bewerten (siehe `platform/security-and-privacy.md`, SEC).

**Ersatzoption**
Keine im Alt-Code erkennbare Alternative geprüft. Bei Verzicht: In-App-Benachrichtigung ohne Push als Rückfalloption.

**Status**
Aktiv, Opt-in-Verhalten wird für die Neuentwicklung beibehalten; spezifiziert in `features/settings/spec.md` und `features/news/spec.md`, datenschutzrechtliche Einordnung in `platform/security-and-privacy.md`.

Quelle: `alte apps/fb4_app-main/fb4_app-main/lib/utils/plugins/push_notification_manager.dart`

---

## INT-006 — HISinOne (Notenübersicht)

**Status: offen.** Zugangsweg, Protokoll und Berechtigungen für HISinOne sind unbekannt und müssen in einem Spike geklärt werden. Siehe `decisions/0006-abloesung-ods-durch-hisinone.md`.

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

**Status: zu verifizieren.**

**Zweck**
Anzeige von FSR-Wiki-Inhalten (z. B. Prüfungsordnungen, Leitfäden, FAQ) in der App.

**Aufruf**
Nach Kenntnisstand bietet BookStack eine REST-API mit tokenbasierter Authentifizierung. **Dieser Kenntnisstand ist nicht verifiziert** und darf nicht als gesicherte Tatsache behandelt werden, bis der Spike ihn bestätigt.

**Antwortstruktur**
Nach Kenntnisstand gliedert BookStack Inhalte in Shelf › Book › Chapter › Page; Seiteninhalte sind sowohl als HTML als auch als Markdown abrufbar. **Ebenfalls unverifiziert.**

**Authentifizierung**
Nach Kenntnisstand Token-ID und Token-Secret im `Authorization`-Header. **Unverifiziert**, insbesondere ob und wie der FSR bereits API-Token bereitstellt.

**Eigentümer/Betreiber**
FSR Informatik (Betrieb der BookStack-Instanz). Genaue URL und Erreichbarkeit sind im Spike zu klären.

**Verfügbarkeit**
Unbekannt.

**Cache-Regel (Vorschlag)**
Wiki-Inhalte sind änderungsarm; Vorschlag nach Verifikation der API: Seiten geräteseitig mit Ablaufzeit von einem Tag cachen, mit manueller Aktualisierungsmöglichkeit.

**Risiko**
Mittel bis hoch, solange unverifiziert: Ohne bestätigten API-Zugang ist unklar, ob eine native Anbindung überhaupt möglich ist oder auf eine eingebettete Webansicht ausgewichen werden muss.

**Ersatzoption**
Eingebettete Webansicht (WebView) der BookStack-Instanz als Rückfalloption, falls kein tragfähiger API-Zugang verfügbar ist.

**Status**
Zu verifizieren. Der Spike muss klären: URL und Erreichbarkeit der Instanz, Verfügbarkeit von API-Token, welche Inhalte für Studierende freigegeben sind, Umfang des Bestands, tatsächliche API-Version und -Fähigkeiten. Siehe `decisions/0005-wiki-bookstack-anbindung.md`.

---

## INT-008 — Eigenes Backend

**Status: Betreiber geklärt, technische Ausgestaltung offen.**

**Zweck**
Trägt die Community- und Aggregationsfunktionen, für die es keine geeignete externe Schnittstelle gibt oder für die eine externe Abhängigkeit vermieden werden soll:

- Entgegennahme und Auslieferung der Mensa-Bewertungen (RATE).
- Verwaltung der Events und Helfer-Anmeldungen (EVENT, HELFER).
- Vermittlung der E-Key-Verknüpfungen (EKEY) an das bestehende E-Key-Verwaltungstool des FSR (INT-014) — keine eigene E-Key-Datenhaltung, siehe dort.
- Periodische Aggregation der Raumbelegung aus INT-002 (siehe Nutzungshinweis dort).
- Vorgelagerter Zwischenspeicher für INT-003 und INT-004 zur Ablösung der Abhängigkeit von `hemacode.de`.

**Aufruf**
Zu definieren, siehe `platform/backend-and-api.md` (API).

**Antwortstruktur**
Zu definieren, siehe `platform/backend-and-api.md` (API).

**Authentifizierung**
Zu definieren, siehe `platform/identity-and-moderation.md` (IDENT) und `platform/backend-and-api.md` (API).

**Eigentümer/Betreiber**
FSR FB4 selbst, auf einem eigenen Hetzner-VPS. Entschieden 2026-08-25; Details (konkreter Server-Zuschnitt, Zugriffsverwaltung, Backup-Ziel) im Rahmen von `decisions/0003-eigenes-backend-fuer-community-funktionen.md` festzuhalten.

**Verfügbarkeit**
Betriebsverantwortung liegt beim FSR FB4 selbst, nicht bei einem Dritten. Konkrete Verfügbarkeitszusage (SLA gegenüber den Nutzenden) noch zu definieren.

**Cache-Regel (Vorschlag)**
Für den Zwischenspeicher-Anteil (News/Mensa): serverseitiger Abruf der Ursprungsquellen in festem Intervall, App fragt ausschließlich das eigene Backend ab, nie direkt `hemacode.de` oder OpenMensa.

**Risiko**
Liegt im eigenen Verantwortungsbereich (Betrieb, Kapazität, Sicherheit), anders als bei den übrigen, extern betriebenen Schnittstellen. Kein Fremdbetriebsrisiko, aber voller Aufwand für Bau und Betrieb selbst zu tragen.

**Ersatzoption**
Nicht zutreffend — dies ist selbst die Ersatzoption für INT-003/INT-004 und die einzige Option für RATE/EVENT/HELFER.

**Status**
Betreiber geklärt (FSR FB4, Hetzner-VPS, siehe „Eigentümer/Betreiber" oben). Technische Ausgestaltung (Aufruf, Antwortstruktur, Authentifizierung) weiterhin zu definieren. Siehe `platform/backend-and-api.md` und `decisions/0003-eigenes-backend-fuer-community-funktionen.md`.

---

## INT-009 — FBWS Raumplan

**Zweck**
Liefert die Termine eines einzelnen Raums direkt, ohne Umweg über die Iteration aller Studiengang/Semester-Kombinationen aus INT-001/INT-002. Grundlage für die Raumsuche (RAUM) als mögliche Alternative oder Ergänzung zur bisher in `platform/architecture.md` (ARCH-F-040) und `platform/backend-and-api.md` (API-F-040/050) angenommenen Backend-Aggregation.

**Aufruf**
```
GET https://ws.inf.fh-dortmund.de/timetable/current/rest/Room/{roomId}/AllEvents?Accept=application/json
```
`{roomId}` ist die Raumkennung im selben Format wie das Feld `roomId` aus INT-002 (z. B. `A.E.01`). Live erprobt am Beispiel `A.E.01`.

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
Wie INT-001/INT-002 (dieselbe FBWS-Infrastruktur, keine erkennbare Versionierung). Zusätzlich unklar, ob der Endpunkt alle Räume des Fachbereichs abdeckt oder nur eine Teilmenge — vor Umsetzung an mehreren Raumkennungen zu verifizieren.

**Ersatzoption**
INT-001 + INT-002, über `roomId` serverseitig zusammengeführt (bisher angenommener Weg, weiterhin gültig als Fallback oder falls dieser Endpunkt nicht alle Räume abdeckt).

**Status**
Neu recherchiert, nicht im Alt-App-Code verwendet. Vor Umsetzung von `features/room-finder/spec.md` zu verifizieren: Abdeckt der Endpunkt alle Räume des Fachbereichs, und liefert er echte Frei/Belegt-Information oder nur Rohtermine (letzteres bestätigt durch die live abgefragte Antwort).

**Bezug zu ARCH-F-040 / API-F-040/API-F-050**
Diese beiden Anforderungen gehen davon aus, der FBWS biete keinen eigenen Raumbelegungs-Endpunkt. INT-009 widerlegt das teilweise: Ein raumbezogener Endpunkt existiert bereits. Das macht die Backend-Aggregation nicht zwingend überflüssig (INT-009 liefert Rohtermine, keine berechnete Frei/Belegt-Auskunft, und die Abdeckung aller Räume ist unverifiziert), ändert aber die Begründung in `architecture.md` und `backend-and-api.md` — siehe dortige Anmerkungen zu ARCH-F-040 bzw. API-F-040/050.

Quelle: live abgefragt am 2026-08-24, `https://ws.inf.fh-dortmund.de/timetable/current/rest/Room/A.E.01/AllEvents?Accept=application/json`

---

## INT-010 — Fachbereichs-Aktuelles (aktuelles-ni)

**Status: zu verifizieren.**

**Zweck**
Liefert die Fachbereichs-Nachrichtenseite `aktuelles-ni` (Prüfungsinfos, Raumänderungen, Stellenausschreibungen, Fundsachen) als Quelle für die Klassifizierung „FB-Aktuelles" in NEWS. Entscheidung FSR FB4, 2026-08-25: `aktuelles-ni` wird als zusätzliche News-Quelle integriert, siehe `features/news/spec.md`.

**Aufruf**
Nicht verifiziert, ob die Fachbereichsseite einen strukturierten Feed (RSS/Atom, JSON) anbietet oder nur als HTML-Seite vorliegt. Bei fehlendem strukturierten Feed ist serverseitiges Scraping durch das eigene Backend (INT-008) die einzige Option — vor Umsetzung zu prüfen.

**Antwortstruktur**
Unbekannt, abhängig vom Ergebnis der Aufruf-Prüfung.

**Authentifizierung**
Nach Kenntnisstand keine, da öffentlich zugängliche Fachbereichsseite. Unverifiziert.

**Eigentümer/Betreiber**
Fachbereich Informatik, FH Dortmund — nicht der FSR. Der FSR liest diese Quelle lediglich, hat keine Redaktionshoheit über „FB-Aktuelles"-Inhalte.

**Verfügbarkeit**
Unbekannt, kein bekanntes SLA.

**Cache-Regel (Vorschlag)**
Wie INT-003 (News-Feed): kurzfristig serverseitig cachen (Vorschlag: 15 Minuten bis 1 Stunde), da Inhalte wie Raumänderungen kurzfristig relevant sein können.

**Risiko**
Mittel bis hoch, solange unverifiziert: Falls kein strukturierter Feed existiert, macht Scraping die Anbindung anfällig für Layout-Änderungen der Fachbereichsseite außerhalb der Kontrolle des FSR.

**Ersatzoption**
Keine bekannte Alternativquelle für dieselben Inhalte. Bei fehlender technischer Machbarkeit: Verzicht auf „FB-Aktuelles" als eigene Klassifizierung, stattdessen weiterhin externer Link (Status quo vor dieser Entscheidung).

**Status**
Zu verifizieren, vor Umsetzung von NEWS-F-090 (`features/news/spec.md`): Existiert ein strukturierter Feed, welche Aktualisierungsfrequenz hat die Quelle, ist Scraping rechtlich/technisch zumutbar.

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

## INT-012 — Hochschul-SSO

**Status: zu verifizieren.**

**Zweck**
Bevorzugter Anmeldeweg für das Konto, das für das Verfassen von Mensa-Bewertungen (RATE) und für die E-Key-Verwaltung (EKEY) benötigt wird — siehe `decisions/0004-identitaet-und-anmeldung.md`. Ziel: Studierende authentifizieren sich über den offiziellen Hochschul-Anmeldeweg, ohne dass die App eigene Zugangsdaten verwaltet.

**Aufruf**
Unbekannt, ob die FH Dortmund einen für Drittanwendungen wie diese App nutzbaren SSO-Dienst betreibt (z. B. OAuth2/OIDC, SAML). Nicht zu verwechseln mit dem ODS-Verfahren aus INT-006 (Formular-Login mit Passwort-Replay) — ein solches Verfahren ist für die Neuentwicklung ausdrücklich ausgeschlossen (siehe `platform/security-and-privacy.md`).

**Antwortstruktur**
Unbekannt, abhängig vom bereitgestellten Protokoll.

**Authentifizierung**
Erwartet: Standardprotokoll (OAuth2/OIDC oder SAML) mit Redirect-Flow über den Browser/eine System-WebView, keine Zugangsdaten im Klartext gegenüber der App.

**Eigentümer/Betreiber**
FH Dortmund (Hochschulrechenzentrum). Ansprechpartner und Verfügbarkeit eines für Drittanwendungen nutzbaren SSO-Diensts sind zu klären.

**Verfügbarkeit**
Unbekannt.

**Cache-Regel (Vorschlag)**
Nicht zutreffend (Authentifizierungsvorgang, kein abrufbarer Datenbestand).

**Risiko**
Hoch, solange unverifiziert: Ohne bestätigten SSO-Zugang ist die Hybrid-Identitätslösung aus `decisions/0004-identitaet-und-anmeldung.md` auf die Ersatzoption (eigenes, einfaches Konto) angewiesen.

**Ersatzoption**
Eigenes, vom Backend (INT-008) verwaltetes Konto, z. B. mit E-Mail-Verifizierung, ohne Bezug zu einem Hochschulsystem. Ausgestaltung offen, siehe `decisions/0004-identitaet-und-anmeldung.md` (Offene Punkte).

**Status**
Zu verifizieren: Existiert ein für diese App nutzbarer SSO-Dienst der FH Dortmund, welches Protokoll, wer ist Ansprechpartner. Klärung durch FSR FB4 in Rücksprache mit der Hochschul-IT, vor Festlegung des endgültigen Anmeldewegs für RATE/EKEY.

---

## INT-013 — Prüfungsplan (Intranet-Excel)

**Status: zu definieren.**

**Zweck**
Liefert den offiziellen Prüfungsplan (Termine, keine Ergebnisse) des Fachbereichs als Grundlage für die Prüfungsauswahl im Stundenplan (`features/schedule/spec.md`, SCHED-F-200). Nicht zu verwechseln mit HISinOne/INT-006 (Notenergebnisse).

**Aufruf**
Der Fachbereich veröffentlicht den Prüfungsplan als Excel-Datei zu einem variablen Zeitpunkt während der Vorlesungszeit auf einer Intranet-Seite: `https://intranet.fh-dortmund.de/hochschule/organisation/fachbereiche/informatik/pruefungen/pruefungsplaene`. Diese Seite setzt einen Hochschul-Login voraus, den weder App noch Backend besitzen (siehe `product/vision.md` Nicht-Ziel 1, `platform/security-and-privacy.md` zum ausgeschlossenen Passwort-Replay). Der Zugriff ist deshalb **kein automatisierter API-Aufruf**, sondern ein zweistufiger, halbautomatischer Vorgang: Ein FSR-Mitglied oder Admin lädt die Datei manuell aus dem Intranet herunter und lädt sie anschließend in das eigene Backend hoch (`platform/backend-and-api.md` API-F-180), das die Datei parst und weiterverarbeitet.

**Antwortstruktur**
Excel-Datei. Genauer Spaltenaufbau unbekannt, bis eine reale Datei zur Analyse vorliegt.

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
Zu definieren: genaues Excel-Format erst bei Vorliegen einer realen Datei zu klären. Grundsatzentscheidung (halbautomatischer Import statt Live-API-Zugriff) getroffen, FSR FB4, 2026-08-25.

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

## Übersicht

| ID | System | Status | Risiko | Abhängige Feature-Specs |
|---|---|---|---|---|
| INT-001 | FBWS Studiengänge | aktiv | mittel | SCHED, RAUM |
| INT-002 | FBWS Termine | aktiv | mittel | SCHED, RAUM |
| INT-003 | News-Feed (hemacode.de) | aktiv, Ablöserisiko | hoch | NEWS |
| INT-004 | Mensa-Speisepläne (hemacode.de) | aktiv, Ablöserisiko | hoch | MENSA, RATE |
| INT-005 | Push-Benachrichtigungen (FCM) | aktiv | mittel | NEWS, SET |
| INT-006 | HISinOne (Notenübersicht) | offen | offen / hoch am Altverfahren | NOTEN |
| INT-007 | BookStack (FSR-Wiki) | zu verifizieren | mittel bis hoch | WIKI |
| INT-008 | Eigenes Backend | Betreiber geklärt (FSR FB4, Hetzner-VPS), Ausgestaltung offen | eigener Verantwortungsbereich | RATE, EVENT, HELFER, NEWS, MENSA, RAUM, EKEY |
| INT-009 | FBWS Raumplan | neu recherchiert, zu verifizieren | mittel | RAUM |
| INT-010 | Fachbereichs-Aktuelles (aktuelles-ni) | zu verifizieren | mittel bis hoch | NEWS |
| INT-011 | FSR-Event-Kalender (ICS) | Dienst geklärt (Google Calendar) | gering bis mittel | EVENT |
| INT-012 | Hochschul-SSO | zu verifizieren | hoch, solange unverifiziert | RATE, EKEY |
| INT-013 | Prüfungsplan (Intranet-Excel) | zu definieren | mittel | SCHED |
| INT-014 | E-Key-Verwaltungstool (Postgres) | zu definieren | mittel bis hoch | EKEY |
