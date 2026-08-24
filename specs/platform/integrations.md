---
id: integrations
titel: Schnittstellenregister
praefix: INT
status: draft
version: 0.1.0
owner: FSR FB4
last_reviewed: 2026-08-24
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
Der FBWS bietet keinen eigenen Endpunkt für Raumbelegung. Diese lässt sich nur herleiten, indem die Termine aller Studiengang/Semester-Kombinationen (iteriert über INT-001) abgerufen und über `roomId` zusammengeführt werden. Diese Aggregation ist Aufgabe des eigenen Backends (siehe INT-008), nicht der App direkt, um wiederholtes vollständiges Abfragen aller Kombinationen durch jedes Gerät zu vermeiden.

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

**Status: zu definieren.**

**Zweck**
Trägt die Community- und Aggregationsfunktionen, für die es keine geeignete externe Schnittstelle gibt oder für die eine externe Abhängigkeit vermieden werden soll:

- Entgegennahme und Auslieferung der Mensa-Bewertungen (RATE).
- Verwaltung der Events und Helfer-Anmeldungen (EVENT, HELFER).
- Periodische Aggregation der Raumbelegung aus INT-002 (siehe Nutzungshinweis dort).
- Vorgelagerter Zwischenspeicher für INT-003 und INT-004 zur Ablösung der Abhängigkeit von `hemacode.de`.

**Aufruf**
Zu definieren, siehe `platform/backend-and-api.md` (API).

**Antwortstruktur**
Zu definieren, siehe `platform/backend-and-api.md` (API).

**Authentifizierung**
Zu definieren, siehe `platform/identity-and-moderation.md` (IDENT) und `platform/backend-and-api.md` (API).

**Eigentümer/Betreiber**
FSR FB4 bzw. von ihm beauftragter Betrieb; konkreter Betreiber im Rahmen der Architekturentscheidung zu klären.

**Verfügbarkeit**
Zu definieren; Betriebsverantwortung liegt beim Projekt selbst, nicht bei einem Dritten.

**Cache-Regel (Vorschlag)**
Für den Zwischenspeicher-Anteil (News/Mensa): serverseitiger Abruf der Ursprungsquellen in festem Intervall, App fragt ausschließlich das eigene Backend ab, nie direkt `hemacode.de` oder OpenMensa.

**Risiko**
Liegt im eigenen Verantwortungsbereich (Betrieb, Kapazität, Sicherheit), anders als bei den übrigen, extern betriebenen Schnittstellen. Kein Fremdbetriebsrisiko, aber voller Aufwand für Bau und Betrieb selbst zu tragen.

**Ersatzoption**
Nicht zutreffend — dies ist selbst die Ersatzoption für INT-003/INT-004 und die einzige Option für RATE/EVENT/HELFER.

**Status**
Zu definieren. Siehe `platform/backend-and-api.md` und `decisions/0003-eigenes-backend-fuer-community-funktionen.md`.

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
| INT-008 | Eigenes Backend | zu definieren | eigener Verantwortungsbereich | RATE, EVENT, HELFER, NEWS, MENSA, RAUM |
