---
id: backend-and-api
titel: Backend und Schnittstelle
praefix: API
status: draft
version: 2.0.0
owner: FSR FB4
last_reviewed: 2026-08-25
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
  - ../features/e-key/spec.md
  - ../features/schedule/spec.md
---

# Backend und Schnittstelle

## Zweck

Diese Spec begründet, warum ein eigenes Backend (INT-008) unvermeidlich ist, schneidet seine Aufgaben, grenzt es ausdrücklich ab und legt Schnittstellenprinzipien fest. Endpunktdetails stehen nicht hier, sondern werden mit den Feature-Specs im Schnittstellenregister (`integrations.md`) ergänzt.

## 1. Warum das Backend unvermeidlich ist

Vier unabhängige Gründe, jeder für sich hinreichend:

| Grund | Beschreibung | Ohne Backend |
|---|---|---|
| Schreibpfade | Mensa-Bewertungen, Helfer-Anmeldungen und E-Key-Verknüpfungen brauchen serverseitige Persistenz, Identitätsprüfung, Begrenzung der Aufrufrate und Moderation | rein clientseitig nicht realisierbar |
| Aggregation Raumsuche | Raumbelegung ist nur herleitbar, indem die Termine aller Studiengang/Semester-Kombinationen (INT-001 → INT-002) über `roomId` zusammengeführt werden | Dutzende Anfragen je Suche auf dem Endgerät — nicht alltagstauglich |
| Ablösung Fremdabhängigkeit | News (INT-003) und Mensa (INT-004) hängen an `fb4app.hemacode.de`, privater Infrastruktur unklarer Trägerschaft; der Mensa-Aufruf ist zusätzlich unverschlüsselt | Ausfallrisiko und fehlendes TLS bleiben in der App bestehen |
| Redaktion | Events und FSR-News müssen gepflegt werden | keine Pflegemöglichkeit ohne serverseitige Verwaltung |

Zu „Ablösung Fremdabhängigkeit": Verifiziert in `meals_repository.dart:21` — der Aufruf erfolgt über `http://fb4app.hemacode.de/...`, unverschlüsselt. `news_repository.dart:7` trägt zusätzlich einen Codekommentar, der eine Umgehung der TLS-Vertrauensprüfung nahelegt; im Dart-Code selbst findet sich dafür keine Umsetzung (siehe `integrations.md`, INT-003, Abschnitt „Befund zur Zertifikatsprüfung").

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
| ~~API-F-080~~ | ~~Das System muss der FSR-Redaktion die Pflege von Events ermöglichen.~~ — entfallen | NEU |
| API-F-090 | Das System muss der FSR-Redaktion die Pflege von FSR-News ermöglichen. | NEU |
| API-F-150 | Das System muss Fachbereichs-Aktuelles aus INT-010 vorab abrufen und der App ausschließlich aus dem eigenen Zwischenspeicher ausliefern. | NEU |
| API-F-160 | Das System muss die vom FSR im externen ICS-Kalender (INT-011) gepflegten Events periodisch importieren und der App ausschließlich aus dem eigenen Zwischenspeicher ausliefern. | NEU |
| ~~API-F-170~~ | ~~Das System muss E-Key-Verknüpfungen, deren Status und die semesterweisen Bestätigungen serverseitig speichern.~~ — entfallen | NEU |
| API-F-175 | Das System muss E-Key-Verknüpfungsanfragen gegen das bestehende E-Key-Verwaltungstool (INT-014) prüfen und dessen Status/Berechtigungen für die Anzeige zwischenspeichern, statt eine eigene E-Key-Datenhaltung aufzubauen. | NEU |
| API-F-180 | Das System muss einem Admin/FSR-Mitglied den Import des offiziellen Prüfungsplans (INT-013) aus einer hochgeladenen Excel-Datei ermöglichen. | NEU |
| API-F-190 | Wenn ein neuer Prüfungsplan für ein neues Jahr importiert wird, muss das System den bisherigen Prüfungsplan-Bestand vollständig ersetzen. | NEU |
| API-F-200 | Wenn sich ein importierter Prüfungsplan gegenüber dem zuvor gespeicherten Bestand unterscheidet, muss das System eine allgemeine Aktualisierungsmeldung auslösen, ohne dabei personenbezogene Auswahldaten einzelner Nutzerinnen zu verarbeiten. | NEU |
| API-F-210 | Das System muss Raumbesetzt-Meldungen ohne Konto- oder Personenbezug entgegennehmen und speichern. | NEU |
| API-F-220 | Das System muss der FSR-Redaktion die Pflege einer Laufwege-Datenstruktur zwischen Räumen ermöglichen. | NEU |

Zu API-F-040/API-F-050: Eine Recherche am 2026-08-24 hat mit `INT-009` (`platform/integrations.md`) einen bisher unbekannten, raumbezogenen FBWS-Endpunkt bestätigt, der Termine direkt nach Raum liefert, ohne Iteration über INT-001/INT-002. Diese beiden Anforderungen bleiben gültig, solange nicht verifiziert ist, dass INT-009 alle Räume des Fachbereichs abdeckt und eine für die Raumsuche ausreichende Datenqualität liefert (er liefert bislang Rohtermine, keine berechnete Frei/Belegt-Auskunft). Die endgültige technische Wahl trifft `features/room-finder/spec.md`.

Zu API-F-180 bis API-F-200: Herkunft der Anforderungen ist eine Rücksprache mit dem FSR FB4 (2026-08-25) zum offiziellen, auf einer Hochschul-Intranet-Seite als Excel-Datei veröffentlichten Prüfungsplan — Details siehe `platform/integrations.md` INT-013. API-F-200 löst allgemein aus (vergleichbar einer News-Meldung), ohne zu wissen, welche Nutzerin welche Prüfung ausgewählt hat; das bleibt mit API-F-100 (kein serverseitiges Speichern des persönlichen Stundenplans) vereinbar, weil `features/schedule/spec.md` (SCHED-F-220) den Abgleich mit der individuellen, ausschließlich lokal gespeicherten Auswahl auf dem Gerät vornimmt.

**API-F-170 (entfallen).** Architektur-Klarstellung FSR FB4, 2026-08-25: Der FSR betreibt bereits ein eigenständiges E-Key-Verwaltungstool mit eigener Postgres-Datenhaltung. Das neue Backend baut keine parallele E-Key-Datenhaltung auf, sondern integriert sich mit diesem bestehenden Tool (INT-014). Ersetzt durch API-F-175.

**API-F-080 (entfallen).** Redaktionsweg-Entscheidung FSR FB4, 2026-08-25: Events werden über einen vom FSR extern gepflegten ICS-Kalender (INT-011) verwaltet, nicht über eine Redaktionsoberfläche im eigenen Backend. Ersetzt durch API-F-160 (Import statt Pflege-UI). API-F-090 bleibt unverändert gültig, gilt aber explizit nur für die Klassifizierung „FSR-News" innerhalb von NEWS (siehe `features/news/spec.md`) — „FB-Aktuelles" (API-F-150) und „Event-Erinnerungen" haben keine eigene Redaktionsoberfläche, sie werden importiert bzw. automatisch abgeleitet.

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
| Event | Import aus dem FSR-ICS-Kalender (INT-011) | UID, Titel, Zeitraum, Ort, Beschreibung, Status, Helferbedarf (Verknüpfung) |
| Helferbedarf / -anmeldung | Personalplanung je Event | Rolle, Schicht, benötigte Anzahl, angemeldete Personen (Name, Kontaktweg) |
| Raumbelegung | aggregierte Termine je Raum | roomId, Zeitraum, belegt/frei |
| News-Zwischenspeicher | Kopie von INT-003 (FSR-News) und INT-010 (FB-Aktuelles), je mit Klassifizierung | Titel, Text, Datum, Quelle, Klassifizierung |
| Speiseplan-Zwischenspeicher | Kopie von INT-004 | Mensa, Datum, Gerichte |
| E-Key-Verknüpfung | Zuordnung Konto ↔ E-Key, Zwischenspeicher für Anzeige (System der Wahrheit: INT-014, extern) | E-Key-Nummer-Referenz, Konto-Referenz, zuletzt gelesener Status/Berechtigungen, letzte/nächste Bestätigung |
| Prüfungsplan | Import aus INT-013 (Excel-Upload durch Admin/FSR) | Prüfungs-ID, Bezeichnung, Datum/Zeit, Raum, Studiengang-/Prüfungsordnungs-Bezug, Import-Jahr |
| Laufwege | Distanzen/Nachbarschaften zwischen Räumen für RAUM-F-060 | Raum-Paar, Distanz-/Gewichtsmaß |
| Besetzt-Meldung | Crowd-Hinweis auf tatsächliche Raumbelegung (RAUM-F-070/080) | roomId, Zeitstempel, kein Personen-/Kontobezug |

## 6. Betrieb

| ID | Anforderung | Herkunft |
|---|---|---|
| API-N-070 | Das System muss regelmäßige Sicherungen der serverseitig gespeicherten Daten vorhalten. | NEU |
| API-N-080 | Das System muss Protokolle nach dem Prinzip der Datensparsamkeit führen. | NEU |
| API-N-090 | Das System muss den Betriebszustand des Backends überwachen und bei Ausfall benachrichtigen. | NEU |

Betreiber: FSR FB4 selbst, auf einem eigenen Hetzner-VPS. Entschieden 2026-08-25, siehe `specs/open-questions.md` (Archiv) und `platform/integrations.md` (INT-008).

## 7. Redaktionsweg

Entschieden 2026-08-25 (FSR FB4):

| Inhalt | Weg | Begründung |
|---|---|---|
| Events | Externer ICS-Kalender (INT-011), vom FSR gepflegt, vom Backend importiert (API-F-160) | Wiederverwendung bestehender Kalenderwerkzeuge statt eigener Pflegeoberfläche |
| News, Klassifizierung „FSR-News" | Eigene Redaktionsoberfläche im Backend (API-F-090) | FSR-Meldungen entstehen originär in der App-Landschaft, kein externes Vorbild |
| News, Klassifizierung „FB-Aktuelles" | Import aus der Fachbereichsseite `aktuelles-ni` (INT-010, API-F-150) | Reine Übernahme fremdredigierter Inhalte, keine FSR-Redaktion nötig |
| News, Klassifizierung „Event-Erinnerungen" | Automatisch aus EVENT abgeleitet, keine eigene Redaktion | Ergänzt News um Termin-Hinweise ohne doppelte Pflege |

BookStack (INT-007) bleibt ausschließlich Grundlage für WIKI, nicht für News — siehe `features/wiki/spec.md`. Details je Inhalt in `features/events/spec.md` bzw. `features/news/spec.md`.

## 8. Technologiewahl

.NET/C# (Entscheidung FSR FB4, 2026-08-25). Konkrete Framework-Bausteine (z. B. ASP.NET Core, Datenbank-Wahl) sowie Details zu Betrieb auf dem Hetzner-VPS siehe `../decisions/0003-eigenes-backend-fuer-community-funktionen.md`.

## 9. Offene Fragen

- Konkrete Framework-Bausteine und Datenbank-Wahl innerhalb von .NET/C# — `../decisions/0003-eigenes-backend-fuer-community-funktionen.md`.
- Konkreter Server-Zuschnitt auf dem Hetzner-VPS: Arbeitsziel kleinste für .NET/C#-Betrieb plus Datenbank tragfähige Instanzgröße, Hochskalierung bei Bedarf; Zugriff ausschließlich per SSH-Key für die technische Leitung; tägliches automatisiertes Backup mit mindestens 7 Tagen Aufbewahrung. Endgültig festzuhalten in `../decisions/0003-eigenes-backend-fuer-community-funktionen.md`.
- Technische Machbarkeit des Imports von `aktuelles-ni` (INT-010, strukturierter Feed vs. Scraping) — `platform/integrations.md` INT-010.
