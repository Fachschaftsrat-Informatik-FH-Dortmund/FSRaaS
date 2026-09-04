---
id: backend-and-api
titel: Backend und Schnittstelle
praefix: API
status: accepted
version: 3.4.0
owner: FSR FB4
last_reviewed: 2026-09-04
derived_from:
  - alte apps/fb4_app-main/fb4_app-main/lib/areas/canteen/repositories/meals_repository.dart
  - alte apps/fb4_app-main/fb4_app-main/lib/areas/news/repositories/news_repository.dart
implemented_in:
  - backend/src/Fb4.Backend                     # API-N-040 (Fehlerformat)
  - backend/src/Fb4.Backend/Endpoints           # API-F-230, API-F-240 (Stammdaten, Studiengang-Rückfall); API-F-070, API-F-075 (Mensa-Speiseplan-Zwischenspeicher)
  - backend/src/Fb4.Backend/Infrastructure/Auth # API-F-250 (Rollen aus INT-012)
  - backend/src/Fb4.Backend/Infrastructure/Mensa # API-F-070, API-F-075 (INT-015-Abruf, Zwischenspeicher, Aktualisierungs-Job); API-N-110/N-120, API-F-260
  - app/src/net                                 # API-N-040 (App-seitige Auswertung)
  - app/src/areas/canteen                       # API-F-235 (App-seitiger Stammdaten-Ausgangsbestand, mit MENSA vorgezogen)
  - .github/workflows/deploy.yml                # API-N-200 (automatisierte Auslieferung nach grüner CI)
  - deploy                                      # API-N-200 (systemd-Unit, Reverse-Proxy, Betriebs-Runbook)
related:
  - architecture.md
  - integrations.md
  - identity-and-moderation.md
  - ../decisions/0003-eigenes-backend-fuer-community-funktionen.md
  - ../decisions/0014-selbstbetriebene-fehlertelemetrie.md
  - ../decisions/0015-resilienz-hintergrund-jobs.md
  - ../decisions/0016-api-versionierung-und-deprecation.md
  - ../decisions/0017-zugriff-und-datensicherung-vps.md
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
| Stammdaten ohne externe Quelle | Mensa-Liste, Raumliste, Links und Downloads, Semestertermine und Ticket-Bildzuschnitt haben kein Quellsystem und müssen gepflegt und ausgeliefert werden | jede Änderung erforderte ein App-Update über drei Vertriebswege |
| Ablösung Fremdabhängigkeit | News (INT-003) hängt an `fb4app.hemacode.de`, der Prüfungs- und Zeitplan-Verweis des bestehenden Backends an `hoolycraap.de` — beides private Infrastruktur unklarer Trägerschaft, teils unverschlüsselt | Ausfallrisiko und fehlendes TLS bleiben in der App bestehen |
| Redaktion | FSR-News müssen gepflegt, Prüfungspläne importiert, gemeldete Inhalte moderiert werden | keine Pflegemöglichkeit ohne serverseitige Verwaltung |
| Entkopplung von HTML-Auswertungen | Die Fachbereichsnachrichten (INT-010) liegen nur als HTML vor und werden per Auswertung erschlossen | eine Layout-Änderung der Fachbereichsseite bräche die App bis zum nächsten Store-Update |

Zu „Ablösung Fremdabhängigkeit": Verifiziert in `meals_repository.dart:21` — der Aufruf erfolgt über `http://fb4app.hemacode.de/...`, unverschlüsselt. `news_repository.dart:7` trägt zusätzlich einen Codekommentar, der eine Umgehung der TLS-Vertrauensprüfung nahelegt; im Dart-Code selbst findet sich dafür keine Umsetzung (siehe `integrations.md`, INT-003, Abschnitt „Befund zur Zertifikatsprüfung").

**Entfallener Grund: Aggregation der Raumsuche.** Bis zum 2026-08-25 stand hier als zweiter Grund, Raumbelegung sei nur durch Zusammenführung der Termine aller Studiengang/Semester-Kombinationen herleitbar, was „Dutzende Anfragen je Suche auf dem Endgerät" bedeutet hätte. Diese Annahme ist widerlegt: Der Endpunkt INT-009 nimmt in der Form `Room/*/AllEvents` einen Platzhalter entgegen und liefert alle Raumtermine in einem einzigen Aufruf — die Android-Alt-App nutzt genau das produktiv. Der Aggregationsbedarf entfällt damit ersatzlos. Das Backend behält für die Raumsuche nur die Rolle des Zwischenspeichers, aus denselben Gründen wie bei News und Mensa. Die übrigen vier Gründe tragen die Entscheidung für ein eigenes Backend unverändert, jeder für sich.

## 2. Aufgabenschnitt

| ID | Anforderung | Herkunft |
|---|---|---|
| API-F-010 | Das System muss Mensa-Bewertungen serverseitig speichern. | NEU |
| API-F-020 | Das System muss Helfer-Anmeldungen serverseitig speichern. | NEU |
| API-F-030 | Wenn eine Bewertung oder eine Helfer-Anmeldung eingereicht wird, muss das Backend die Identität der einreichenden Person serverseitig prüfen. | NEU |
| API-N-010 | Das System muss die Anzahl eingehender Schreibanfragen je Konto und Zeitfenster begrenzen. | NEU |
| API-N-015 | Das System muss die Anzahl eingehender kontofreier Schreibanfragen je Quelle und Zeitfenster begrenzen. | NEU |
| API-N-017 | Das System muss auch kontofreie Leseanfragen je Quelle und Zeitfenster begrenzen, mit einem Schwellwert, der übliche App-Nutzung — auch die mehrerer Personen hinter einer geteilten Adresse — nicht behindert, und einen abgewiesenen Aufruf mit einem wiederholbaren Fehler (API-N-040) beantworten. | NEU |
| ~~API-F-040~~ | ~~Das System muss die Termine aller Studiengang/Semester-Kombinationen aus INT-002 periodisch abrufen und über `roomId` zu einer Raumbelegung zusammenführen.~~ — entfallen | NEU |
| API-F-045 | Das System muss die Raumtermine über den Platzhalter-Aufruf aus INT-009 periodisch abrufen und der App ausschließlich aus dem eigenen Zwischenspeicher ausliefern. | Recherche: alte apps/android-fb4, retrofit/TimetableApi.java, 2026-08-25 |
| API-F-055 | Das System muss der App eine Übersicht aller im Raumplan-Zwischenspeicher (INT-009) geführten Räume mit ihrer aktuellen Belegung bereitstellen, nicht beschränkt auf die kuratierte Raumliste. | NEU |
| API-F-056 | Das System muss der App die zwischengespeicherten Raumplan-Termine für den lokalen Abgleich mit dem Stundenplan bereitstellen, ohne den Stundenplan der Nutzerin serverseitig zu speichern. | NEU |
| ~~API-F-050~~ | ~~Das System muss der App für die Raumsuche einen einzelnen Abfrage-Endpunkt auf der aggregierten Raumbelegung bereitstellen, statt die App alle Kombinationen aus INT-001 einzeln abfragen zu lassen.~~ — entfallen | NEU |
| API-F-060 | Das System muss News aus INT-003 vorab abrufen und der App ausschließlich aus dem eigenen Zwischenspeicher ausliefern. | NEU |
| API-F-070 | Das System muss Mensa-Speisepläne aus INT-015 vorab abrufen und der App ausschließlich aus dem eigenen Zwischenspeicher ausliefern. | NEU |
| API-F-075 | Das System muss Öffnungszeiten, Gerichtskategorien und Zusatzstoffverzeichnis aus INT-015 vorab abrufen und der App aus dem eigenen Zwischenspeicher ausliefern. | Recherche: alte apps/android-fb4, retrofit/MenuApi.java, 2026-08-25 |
| API-F-076 | Das System muss den Speiseplan-Zwischenspeicher (API-F-070) so aus INT-015 auffrischen, dass eine Aktualisierung vor der morgendlichen und vor der mittäglichen studentischen Nutzungsspitze abgeschlossen ist, zusätzlich zu einem regelmäßigen Grundintervall über den Tag. | NEU |
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
| API-F-230 | Das System muss die Stammdaten, für die kein externes Quellsystem existiert (Mensa-Liste, Raumliste, Links und Downloads, Semestertermine, Ticket-Bildzuschnitt), serverseitig pflegen und der App ausliefern. | Recherche: alte apps/android-fb4, service/DataService.java, 2026-08-25 |
| API-F-235 | Falls das Backend beim Ausliefern von Stammdaten nicht erreichbar ist, muss die App mit einem im Anwendungspaket mitgelieferten Ausgangsbestand arbeiten. | Recherche: alte apps/android-fb4, assets/canteens.json, 2026-08-25 |
| API-F-240 | Das System muss eine Rückfallliste der Studiengänge vorhalten und ausliefern, falls INT-001 nicht erreichbar ist. | Recherche: alte apps/android-fb4, retrofit/TimeTableFallbackApi.java, 2026-08-25 |
| API-F-205 | Das System muss den Zeitpunkt der letzten Prüfungsplan-Änderung über einen Abfrage-Endpunkt bereitstellen, sodass die App den Abgleich mit ihrer lokalen Auswahl selbst vornehmen kann. | NEU |
| API-F-250 | Das System muss Rollenzugehörigkeiten aus dem Identitätsanbieter (INT-012) übernehmen, statt eine eigene Rollenverwaltung zu führen. | NEU |

**API-F-040 und API-F-050 (entfallen).** Befund vom 2026-08-25 aus dem Android-Quellcode: Der Endpunkt INT-009 nimmt in der Form `Room/*/AllEvents` einen Platzhalter entgegen und liefert alle Raumtermine in einem Aufruf. Die Annahme, Raumbelegung sei nur durch Zusammenführung über alle Studiengang/Semester-Kombinationen herleitbar, ist damit widerlegt. Ersetzt durch API-F-045, das nur noch die Zwischenspeicherung fordert — nicht die Zusammenführung. Siehe auch `architecture.md` ARCH-F-040 und `features/room-finder/spec.md`.

**API-F-055 / API-F-056 — weitere Sichten auf den Raumplan-Zwischenspeicher.** Beide liefern nur andere Projektionen des bereits nach API-F-045 vorgehaltenen INT-009-Bestands, kein zusätzlicher externer Abruf. API-F-055 trägt Raumübersicht und Ansicht laufender Veranstaltungen aus `../features/room-finder/spec.md` (RAUM-F-150 ff.). API-F-056 trägt den Stundenplan-Abgleich aus `../features/schedule/spec.md` (SCHED-F-410): Das Backend stellt die Raumplan-Termine bereit, der Abgleich gegen den persönlichen Stundenplan läuft auf dem Gerät — API-F-100 (kein serverseitiges Speichern des persönlichen Stundenplans) bleibt ohne Ausnahme.

Zu API-N-010/API-N-015: Die vorige Fassung von API-N-010 begrenzte „je Person und Zeitfenster" und ließ damit die kontofreien Schreibpfade ungeschützt — Helfer-Anmeldungen (HELFER-F-020) und Besetzt-Meldungen der Raumsuche (RAUM-F-070) kennen keine Person im Sinne eines Kontos. API-N-015 schließt diese Lücke und stellt auf die Anfragequelle ab statt auf eine Identität.

Zu API-N-017: Ergänzt am 2026-09-04. API-N-010/N-015 decken nur Schreibpfade ab; die kontofreien Lese-Endpunkte (Speiseplan, Mensa-Verzeichnisse, News, Events, Raumtermine) waren bislang völlig ungebremst. Da sie ausschließlich aus dem eigenen Zwischenspeicher bedienen und keinen Fremdaufruf je Anfrage auslösen (API-F-070/060/150/160), ist eine großzügige Obergrenze je Adresse ausreichend — sie schützt nur gegen fehlerhafte oder bösartige Clients, nicht gegen normale Spitzenlast, die der App-seitige Zwischenspeicher (`platform/data-and-storage.md` Abschnitt 4) und die HTTP-Cache-Header nach API-N-016 ohnehin abfangen. Das Regelwerk (`AddRateLimiter`) ist einmal zentral zu setzen und wirkt für alle kontofreien Routen.

Zu API-F-076: Der Speiseplan-Zwischenspeicher wurde in Roadmap-Schritt 4 in einem festen 6-Stunden-Intervall ab Prozessstart aufgefrischt. Das trifft die studentischen Nutzungsspitzen nur zufällig. Da der Speiseplan die meistgenutzte Ansicht der App ist und Studierende typischerweise morgens vor dem Aufstehen und kurz vor der Essenszeit nachsehen (`../features/canteen/spec.md` MENSA-N-020), wird der Job auf Ortszeit-Läufe umgestellt, die vor beiden Fenstern liegen (z. B. gegen 05:30 und 10:00 Uhr), ergänzt um weitere Läufe über den Tag, damit auch Folgetags- und Abenddaten fließen. Der Lauf bleibt ein fester, sparsamer Zeitplan im Sinne von `non-functional.md` NFR-N-090 — kein fortlaufendes Polling, keine nachfragegesteuerte Auslösung (dazu die offene Frage in `../features/canteen/spec.md` Abschnitt 13). Die Fehler-Isolation je Lauf (API-N-110) und die Resilienz je INT-015-Aufruf (API-N-120) gelten unverändert.

Zu API-F-205: Löst die zuvor unbestimmte Zustellung des Hinweises aus API-F-200. Ein Abfrage-Endpunkt statt einer zugestellten Meldung hält API-F-100 (kein serverseitiges Speichern persönlicher Auswahl) ohne Ausnahme ein: Das Backend nennt lediglich den Zeitpunkt der letzten Änderung, die App entscheidet anhand ihrer ausschließlich lokal gespeicherten Auswahl, ob das eine Benachrichtigung wert ist (SCHED-F-220). Der Weg funktioniert zudem ohne Push-Infrastruktur.

Zu API-F-230 bis API-F-240: Die Android-Alt-App führt diese Stammdaten bereits ferngepflegt (`service/DataService.java`) und liefert Ausgangsbestände als Teil des Anwendungspakets mit. Das Muster ist übernehmenswert, weil es Änderungen an Mensen, Räumen oder Links ohne App-Update über drei Vertriebswege ermöglicht. Der Befund vom 2026-08-25 zeigt allerdings auch die Kehrseite: Ohne Pflegeoberfläche veraltet dieser Bestand — die dort abgerufenen Semestertermine stammen aus dem Wintersemester 2023/24. Die Pflege gehört deshalb in die Admin-Oberfläche (`../features/admin/spec.md`), nicht in eine Konfigurationsdatei auf dem Server.

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

Der vollständige Vertrag steht als versionierte OpenAPI-Beschreibung in `api-contract.yaml` und ist die Quelle der Wahrheit für jeden Aufruf zwischen App beziehungsweise Admin-Oberfläche und Backend (`../decisions/0011-monorepo-und-openapi-vertrag.md`). Typen und Client-Code werden daraus erzeugt; eine Vertragsänderung ist eine Spec-Änderung und unterliegt den Regeln aus `../README.md` Abschnitt 8. Dieser Abschnitt legt nur die Prinzipien fest, denen der Vertrag genügen muss.

| ID | Anforderung | Herkunft |
|---|---|---|
| API-N-030 | Das System muss jede Version seiner Schnittstelle eindeutig kennzeichnen. | NEU |
| API-N-035 | Das System muss jeden Aufruf zwischen App und Backend in `api-contract.yaml` beschreiben, bevor er umgesetzt wird. | NEU |
| API-N-040 | Das System muss Fehlerantworten in einem einheitlichen, maschinenlesbaren Format mit Fehlercode und einer für Menschen lesbaren Meldung liefern. | NEU |
| API-F-140 | Wenn eine Bewertung mit einer bereits verarbeiteten Idempotenz-Kennung erneut eingereicht wird, muss das Backend sie als bereits verarbeitet erkennen und nicht doppelt zählen. | NEU |
| API-N-050 | Das System muss Listenergebnisse paginieren. | NEU |
| API-N-060 | Das System muss alle Zeitangaben im Format ISO 8601 mit Zeitzone liefern. | NEU |
| API-N-016 | Das System muss zwischengespeicherte Leseantworten mit HTTP-Cache-Headern versehen (u. a. `Cache-Control` und `ETag`), deren Gültigkeitsdauer der jeweiligen Zwischenspeicher-Regel aus `../platform/data-and-storage.md` Abschnitt 4 entspricht, sodass Client- und vorgelagerte Proxy-Caches unnötige Wiederholungsabrufe vermeiden und ein unveränderter Abruf mit `304` beantwortet werden kann. | NEU |
| API-N-130 | Das System muss zwischen additiven und brechenden Schnittstellenänderungen unterscheiden; nur brechende Änderungen erhöhen das Versionssegment im Pfad. | NEU |
| API-F-270 | Das System muss bei jedem Aufruf die Client-Version protokollieren, um die Zugriffshäufigkeit je Schnittstellenversion auszuwerten. | NEU |
| API-N-140 | Wenn eine Schnittstellenversion als veraltet markiert wird, muss sie mindestens 90 Tage zusätzlich zur neuen Version erreichbar bleiben. | NEU |
| API-N-150 | Das System darf eine veraltete Schnittstellenversion erst abschalten, wenn zusätzlich zur Mindestfrist ein vernachlässigbarer Zugriff gemäß API-F-270 nachgewiesen ist. | NEU |

Zu API-N-130 bis API-N-150: Konkretisieren API-N-030, siehe `../decisions/0016-api-versionierung-und-deprecation.md`.

Zu API-F-140: Diese Anforderung sichert die Offline-Warteschlange aus `architecture.md` (ARCH-F-120) ab — eine wegen unterbrochener Verbindung erneut gesendete Bewertung darf nicht als zweite Bewertung gezählt werden. Ausgestaltung der Idempotenz-Kennung (z. B. clientseitig erzeugte UUID je Vorgang) ist Sache der Umsetzung, nicht dieser Spec.

Zu API-N-016: Ergänzt am 2026-09-04. Die Lese-Endpunkte lieferten bislang keine Cache-Header; jeder App-Start und jeder Fokuswechsel konnte einen Vollabruf auslösen, obwohl der App-seitige Zwischenspeicher (`../platform/data-and-storage.md` Abschnitt 4) die Daten meist noch hält. Mit `Cache-Control` (max-age passend zur Datenart, für den Speiseplan bis Tagesende) und `ETag`/`If-None-Match` bedient der Server einen unveränderten Abruf mit einem leeren `304` statt der vollen Nutzlast, und ein etwaiger Reverse-Proxy kann die Antwort für alle Clients zwischenspeichern. Das ist die zweite, vom Anwendungscode unabhängige Entlastung neben der Ratenbegrenzung nach API-N-017. Bei der Umsetzung erhalten die betroffenen Lese-Endpunkte in `api-contract.yaml` einen `ETag`-Antwortkopf und einen `If-None-Match`-Anfrageparameter — dasselbe Muster, das die Verwaltungs-Endpunkte dort bereits für die Nebenläufigkeitskontrolle nutzen (API-N-035).

Zu API-N-040: Das Backend liefert Fehlerantworten als RFC 9457 „Problem Details" (`application/problem+json`) mit maschinenlesbarem `code` und für Menschen lesbarem `title`. Die App-seitige Auswertung (`app/src/net`) unterscheidet drei Fälle: (a) formatkonformer Rumpf → `code` und Meldung daraus; (b) leerer oder fehlender Rumpf (etwa bei einem `401` vom vorgelagerten Reverse Proxy) → Einordnung allein über den HTTP-Status; (c) vorhandener, aber nicht formatkonformer Rumpf (HTML-Fehlerseite, abgeschnittenes JSON) → als `parse`-Fehler sichtbar gemacht, nie still weiterverarbeitet (SEC-F-060, QA-N-070).

## 5. Fachliche Ressourcen im Überblick

Nur Zweck und grobe Felder; ausformulierte Datenmodelle entstehen mit den jeweiligen Feature-Specs.

| Ressource | Zweck | Grobe Felder |
|---|---|---|
| Bewertung | Mensa-Bewertung je Gericht | Pseudonym, Gericht-Referenz, Bewertungsstufe (schlecht/gut/sehr gut), Kommentar (optional), Zeitstempel |
| Event | Import aus dem FSR-ICS-Kalender (INT-011) | UID, Titel, Zeitraum, Ort, Beschreibung, Status, Helferbedarf (Verknüpfung) |
| Helferbedarf / -anmeldung | Personalplanung je Event | Rolle, Schicht, benötigte Anzahl, angemeldete Personen (Name, Kontaktweg) |
| Raumtermine | Zwischenspeicher der Rohtermine aus INT-009 | roomId, Wochentag/Zeitraum, Bezeichnung, note — Grundlage für Raumsuche, Raumübersicht (RAUM-F-150) und Stundenplan-Abgleich (SCHED-F-410) |
| Raum-Stammdaten | vom FSR gepflegte Raumliste | roomId, Größe (klein/mittel/groß), E-Key-Eignung |
| Mensa-Stammdaten | vom FSR gepflegte Mensa-Liste | Kennung, ITMC-Kennung, Anzeigename, Öffnungszeiten je Wochentag, Standardauswahl, Anzeigereihenfolge, Speiseplan-URL |
| Links und Downloads | vom FSR gepflegte Liste externer Verweise | Bezeichnung, URL, Gruppierung, Reihenfolge |
| Semestertermine | Semesterbeginn, Semesterende, nächster WS-/SS-Start | Datum je Angabe |
| News-Zwischenspeicher | Kopie von INT-003 (FSR-News) und INT-010 (FB-Aktuelles), je mit Klassifizierung | Titel, Text, Datum, Quelle, Klassifizierung |
| Speiseplan-Zwischenspeicher | Kopie von INT-015 | Mensa, Datum, Gerichte, Gerichtskategorien, Zusatzstoffverzeichnis |
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
| API-N-100 | Das System muss Fehler ab Schweregrad „Error" strukturiert protokollieren und an die selbstbetriebene Fehlertelemetrie-Instanz weiterleiten. | NEU |
| API-N-110 | Das System muss jeden periodischen Hintergrund-Job so kapseln, dass eine unbehandelte Ausnahme innerhalb eines Durchlaufs protokolliert wird und ausschließlich diesen Durchlauf abbricht, nicht den Backend-Prozess. | NEU |
| API-N-120 | Das System muss jeden Aufruf eines externen Quellsystems mit Timeout, Wiederholung mit steigendem Abstand und einem Circuit Breaker gegen wiederholten Fehlschlag absichern. | NEU |
| API-F-260 | Das System muss je periodischem Hintergrund-Job Zeitpunkt und Ergebnis des letzten Durchlaufs über den Health-Check-Endpunkt bereitstellen. | NEU |
| API-N-160 | Das System muss serverseitige Sicherungen auf einem vom gesicherten Server organisatorisch getrennten Ziel ablegen. | NEU |
| API-N-170 | Die Wiederherstellung aus einer Sicherung muss innerhalb eines Arbeitstages möglich sein; die Sicherungsfrequenz muss einen Datenverlust von höchstens 24 Stunden sicherstellen. | NEU |
| API-N-180 | Das System muss mindestens einmal je Semester durch eine tatsächliche Wiederherstellung in eine Testumgebung geprüft werden, nachgewiesen durch ein datiertes Prüfprotokoll. | NEU |
| API-N-190 | Wenn eine Person Zugriff auf Server, Secrets-Depot oder Hosting-Zugang erhält oder verliert, muss dies über einen dokumentierten Onboarding-/Offboarding-Ablauf erfolgen, einschließlich Rotation aller geteilten Geheimnisse beim Ausscheiden. | NEU |
| API-N-200 | Das System muss über einen im Repository beschriebenen, automatisierten Ablauf ausgeliefert werden, der nach erfolgreicher CI Build, Test, Übertragung auf den Zielserver und Neustart des Dienstes umfasst und den Betriebszustand nach dem Neustart prüft. | NEU |

Zu API-N-100 bis API-F-260: Konkretisieren API-N-090 und lösen die zuvor fehlende Fehler-Isolation periodischer Jobs, siehe `../decisions/0014-selbstbetriebene-fehlertelemetrie.md` und `../decisions/0015-resilienz-hintergrund-jobs.md`.

Zu API-N-160 bis API-N-190: Lösen den zuvor in Abschnitt 10 offenen Punkt zu Zugriffsverwaltung und Backup-Ziel auf, siehe `../decisions/0017-zugriff-und-datensicherung-vps.md`.

Zu API-N-200: Setzt die Lehre aus `../decisions/0002-spec-anchored-arbeitsweise.md` für den Betrieb um — die Alt-Projekte scheiterten daran, dass Auslieferungswissen an Einzelpersonen gebunden war. Umgesetzt als GitHub-Actions-Workflow (`.github/workflows/deploy.yml`, ausgelöst durch einen grünen CI-Lauf auf `main`) plus dokumentierte Server-Einrichtung, systemd-Unit und Reverse-Proxy-Konfiguration unter `deploy/`. Geheimnisse gelangen ausschließlich über eine `EnvironmentFile` auf dem Server in den Dienst, nie über das Repository oder den CI-Runner (SEC-N-110). Nachweis über ein datiertes Prüfprotokoll statt eines automatisierten Tests (`quality-and-testing.md` Abschnitt 3, QA-F-015): Ein automatisierter Test des Auslieferungswegs setzte einen realen Zielserver mit Datenbank und Reverse-Proxy voraus; der Health-Check am Ende des Workflows prüft das Ergebnis bei jedem Lauf, ein gesonderter Testaufbau wäre unverhältnismäßig.

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

ASP.NET Core mit PostgreSQL und Entity Framework Core; periodische Aufgaben (Zwischenspeicher-Auffrischung, Importe) als Hosted Services im selben Dienst. Entscheidung FSR FB4, 2026-08-25, siehe `../decisions/0011-monorepo-und-openapi-vertrag.md`. PostgreSQL auch deshalb, weil das bestehende E-Key-Verwaltungstool (INT-014) bereits darauf läuft und die spätere Integration (API-F-175) damit einfacher bleibt. Details zum Betrieb auf dem Hetzner-VPS siehe `../decisions/0003-eigenes-backend-fuer-community-funktionen.md`.

## 9. Ablösung des bestehenden Backends

Unter `https://app.fsrfb4.de` läuft bereits ein Backend, das die Android-Alt-App bedient: ferngepflegte Stammdaten (`/data`), versions- und sprachabhängige Hinweise an die App (`/messages/messages.php`) und eine Rückfallliste der Studiengänge (`/studiengaenge.json`). Vollständige Beschreibung: `integrations.md`, INT-008, Abschnitt „Vorgänger".

Der Dienst ist erreichbar, aber inhaltlich veraltet — die live abgefragten Semestertermine stammen aus dem Wintersemester 2023/24, und der hinterlegte Prüfungsplan-Verweis zeigt auf eine private, unverschlüsselte Domain. Entscheidung FSR FB4, 2026-08-25: Das fachliche Konzept wird übernommen (API-F-230 bis API-F-240), die Umsetzung neu gebaut, der Altdienst nach der Umstellung abgeschaltet. Bis dahin läuft er für die Android-Bestandsnutzung weiter.

Zwei Lehren aus dem Altbestand sind in die Anforderungen eingeflossen: Stammdaten brauchen eine Pflegeoberfläche, sonst veralten sie (`../features/admin/spec.md`), und mitgelieferte Ausgangsbestände verhindern, dass ein Ausfall der Stammdaten die App unbrauchbar macht (API-F-235).

## 10. Offene Fragen

- ~~Zugriffsverwaltung und Backup-Ziel auf dem Hetzner-VPS~~ Geklärt 2026-08-26, siehe `../decisions/0017-zugriff-und-datensicherung-vps.md` (API-N-160 bis API-N-190). Weiterhin offen: konkrete Instanzgröße — Arbeitsziel bleibt kleinste für ASP.NET-Core-Betrieb plus PostgreSQL tragfähige Größe, Hochskalierung bei Bedarf.
- Fan-out-Mechanismus für die Push-Zustellung (ein UnifiedPush-Aufruf je Android-Endpunkt gegenüber einem Themen-Aufruf für iOS) — offener Punkt aus `../decisions/0008-vertrieb-ueber-drei-app-stores.md`, zu klären mit der zweiten Ausbaustufe.
- Ob die versions- und sprachabhängigen Hinweise des Altbackends (`/messages`) fachlich übernommen werden oder in NEWS aufgehen — betrifft NEWS, SHELL und diese Spec gleichermaßen, siehe `specs/open-questions.md` (dort die Feinstruktur des Altmechanismus als technischer Befund vom 2026-08-26).
