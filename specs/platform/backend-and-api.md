---
id: backend-and-api
titel: Backend und Schnittstelle
praefix: API
status: draft
version: 0.1.0
owner: FSR FB4
last_reviewed: 2026-08-24
derived_from:
  - alte apps/fb4_app-main/fb4_app-main/lib/areas/canteen/repositories/meals_repository.dart
  - alte apps/fb4_app-main/fb4_app-main/lib/areas/news/repositories/news_repository.dart
implemented_in: []
related:
  - architecture.md
  - integrations.md
  - identity-and-moderation.md
  - ../decisions/0003-eigenes-backend-fuer-community-funktionen.md
  - ../features/canteen-ratings/spec.md
  - ../features/events/spec.md
  - ../features/event-volunteers/spec.md
  - ../features/room-finder/spec.md
  - ../features/news/spec.md
  - ../features/canteen/spec.md
---

# Backend und Schnittstelle

## Zweck

Diese Spec begründet, warum ein eigenes Backend (INT-008) unvermeidlich ist, schneidet seine Aufgaben, grenzt es ausdrücklich ab und legt Schnittstellenprinzipien fest. Endpunktdetails stehen nicht hier, sondern werden mit den Feature-Specs im Schnittstellenregister (`integrations.md`) ergänzt.

## 1. Warum das Backend unvermeidlich ist

Vier unabhängige Gründe, jeder für sich hinreichend:

| Grund | Beschreibung | Ohne Backend |
|---|---|---|
| Schreibpfade | Mensa-Bewertungen und Helfer-Anmeldungen brauchen serverseitige Persistenz, Identitätsprüfung, Begrenzung der Aufrufrate und Moderation | rein clientseitig nicht realisierbar |
| Aggregation Raumsuche | Raumbelegung ist nur herleitbar, indem die Termine aller Studiengang/Semester-Kombinationen (INT-001 → INT-002) über `roomId` zusammengeführt werden | Dutzende Anfragen je Suche auf dem Endgerät — nicht alltagstauglich |
| Ablösung Fremdabhängigkeit | News (INT-003) und Mensa (INT-004) hängen an `fb4app.hemacode.de`, privater Infrastruktur unklarer Trägerschaft; der Mensa-Aufruf ist zusätzlich unverschlüsselt | Ausfallrisiko und fehlendes TLS bleiben in der App bestehen |
| Redaktion | Events und FSR-News müssen gepflegt werden | keine Pflegemöglichkeit ohne serverseitige Verwaltung |

Zu „Ablösung Fremdabhängigkeit": Verifiziert in `meals_repository.dart:21` — der Aufruf erfolgt über `http://fb4app.hemacode.de/...`, unverschlüsselt. `news_repository.dart:7` trägt zusätzlich einen Codekommentar („we need to ignore https trust because FH Dortmund does not seem to care too much about using valid certificates"), der auf ein Zertifikatsproblem auch beim an sich verschlüsselten News-Aufruf hindeutet. Dieser zweite Befund ist in `integrations.md` (INT-003) bisher nicht erfasst und sollte dort nachgetragen werden.

## 2. Aufgabenschnitt

| ID | Anforderung | Herkunft |
|---|---|---|
| API-F-010 | Das System muss Mensa-Bewertungen serverseitig speichern. | NEU |
| API-F-020 | Das System muss Helfer-Anmeldungen serverseitig speichern. | NEU |
| API-F-030 | Wenn eine Bewertung oder eine Helfer-Anmeldung eingereicht wird, muss das Backend die Identität der einreichenden Person serverseitig prüfen. | NEU |
| API-N-010 | Das System muss die Anzahl eingehender Schreibanfragen je Person und Zeitfenster begrenzen. | NEU |
| API-F-040 | Das System muss die Termine aller Studiengang/Semester-Kombinationen aus INT-002 periodisch abrufen und über `roomId` zu einer Raumbelegung zusammenführen. | NEU |
| API-F-050 | Das System muss der App für die Raumsuche einen einzelnen Abfrage-Endpunkt auf der aggregierten Raumbelegung bereitstellen, statt die App alle Kombinationen aus INT-001 einzeln abfragen zu lassen. | NEU |
| API-F-060 | Das System muss News aus INT-003 vorab abrufen und der App ausschließlich aus dem eigenen Zwischenspeicher ausliefern. | NEU |
| API-F-070 | Das System muss Mensa-Speisepläne aus INT-004 vorab abrufen und der App ausschließlich aus dem eigenen Zwischenspeicher ausliefern. | NEU |
| API-N-020 | Das System muss alle Aufrufe zwischen App und Backend ausschließlich über TLS führen. | Alt: lib/areas/canteen/repositories/meals_repository.dart:21 |
| API-F-080 | Das System muss der FSR-Redaktion die Pflege von Events ermöglichen. | NEU |
| API-F-090 | Das System muss der FSR-Redaktion die Pflege von FSR-News ermöglichen. | NEU |

## 3. Was das Backend ausdrücklich nicht tut

Bewusste Begrenzung, keine spätere Ergänzung ohne erneute Abstimmung.

| ID | Anforderung | Herkunft |
|---|---|---|
| API-F-100 | Das System muss darauf verzichten, persönliche Stundenpläne serverseitig zu speichern. | NEU |
| API-F-110 | Das System muss darauf verzichten, Hochschul-Zugangsdaten entgegenzunehmen oder zu speichern. | NEU |
| API-F-120 | Das System muss darauf verzichten, Semesterticket-Daten serverseitig zu speichern. | NEU |
| API-F-130 | Das System muss darauf verzichten, personenbezogene Daten an Dritte außerhalb des FSR FB4 weiterzugeben. | NEU |

## 4. Schnittstellenprinzipien

| ID | Anforderung | Herkunft |
|---|---|---|
| API-N-030 | Das System muss jede Version seiner Schnittstelle eindeutig kennzeichnen. | NEU |
| API-N-040 | Das System muss Fehlerantworten in einem einheitlichen, maschinenlesbaren Format mit Fehlercode und einer für Menschen lesbaren Meldung liefern. | NEU |
| API-F-140 | Wenn eine Bewertung mit einer bereits verarbeiteten Idempotenz-Kennung erneut eingereicht wird, muss das Backend sie als bereits verarbeitet erkennen und nicht doppelt zählen. | NEU |
| API-N-050 | Das System muss Listenergebnisse paginieren. | NEU |
| API-N-060 | Das System muss alle Zeitangaben im Format ISO 8601 mit Zeitzone liefern. | NEU |

Zu API-F-140: Diese Anforderung sichert die Offline-Warteschlange aus `architecture.md` (ARCH-F-120) ab — eine wegen unterbrochener Verbindung erneut gesendete Bewertung darf nicht als zweite Bewertung gezählt werden. Ausgestaltung der Idempotenz-Kennung (z. B. clientseitig erzeugte UUID je Vorgang) ist Sache der Umsetzung, nicht dieser Spec.

## 5. Fachliche Ressourcen im Überblick

Nur Zweck und grobe Felder; ausformulierte Datenmodelle entstehen mit den jeweiligen Feature-Specs.

| Ressource | Zweck | Grobe Felder |
|---|---|---|
| Bewertung | Mensa-Bewertung je Gericht | Pseudonym, Gericht-Referenz, Sterne, Kommentar (optional), Zeitstempel |
| Event | FSR-Veranstaltung | Titel, Zeitraum, Ort, Beschreibung, Helferbedarf |
| Helferbedarf / -anmeldung | Personalplanung je Event | Rolle, Schicht, benötigte Anzahl, angemeldete Personen (Name, Kontaktweg) |
| Raumbelegung | aggregierte Termine je Raum | roomId, Zeitraum, belegt/frei |
| News-Zwischenspeicher | Kopie von INT-003 | Titel, Text, Datum, Quelle |
| Speiseplan-Zwischenspeicher | Kopie von INT-004 | Mensa, Datum, Gerichte |

## 6. Betrieb

| ID | Anforderung | Herkunft |
|---|---|---|
| API-N-070 | Das System muss regelmäßige Sicherungen der serverseitig gespeicherten Daten vorhalten. | NEU |
| API-N-080 | Das System muss Protokolle nach dem Prinzip der Datensparsamkeit führen. | NEU |
| API-N-090 | Das System muss den Betriebszustand des Backends überwachen und bei Ausfall benachrichtigen. | NEU |

Wer das Backend betreibt, ist offen — siehe `specs/open-questions.md`.

## 7. Redaktionsweg

Für Events und FSR-News ist abzuwägen: eigene Verwaltungsoberfläche im Backend gegenüber Wiederverwendung bestehender Werkzeuge (ICS-Kalender für Events, BookStack für News-artige Inhalte). Offen — siehe Abschnitt 9.

## 8. Technologiewahl

Bleibt offen. Siehe `../decisions/0003-eigenes-backend-fuer-community-funktionen.md`.

## 9. Offene Fragen

- Betreiber des Backends — `specs/open-questions.md`.
- Redaktionsweg für Events und FSR-News (eigene Oberfläche vs. bestehende Werkzeuge) — Klärung durch FSR FB4.
- Technologiewahl — `../decisions/0003-eigenes-backend-fuer-community-funktionen.md`.
- Ergänzung des Zertifikatsbefunds aus `news_repository.dart:7` in `integrations.md` (INT-003) — Klärung durch den Owner dieser Datei.
