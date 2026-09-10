## Purpose

Begründet, warum ein eigenes Backend unvermeidlich ist, schneidet seine Aufgaben, grenzt es ausdrücklich ab und legt Schnittstellenprinzipien fest. Endpunktdetails stehen nicht hier, sondern in der Capability `integrations`. Vormals `specs/platform/backend-and-api.md` (Präfix `API`), migriert nach ADR 0019. Owner: FSR FB4.

## Requirements

### Requirement: Serverseitige Speicherung von Mensa-Bewertungen

Das System muss Mensa-Bewertungen serverseitig speichern. Herkunft: NEU (vormals API-F-010).

#### Scenario: Bewertung abgesendet
- **WHEN** eine Mensa-Bewertung beim Backend eingeht
- **THEN** speichert das Backend sie serverseitig

### Requirement: Serverseitige Speicherung von Helfer-Anmeldungen

Das System muss Helfer-Anmeldungen serverseitig speichern. Herkunft: NEU (vormals API-F-020).

#### Scenario: Anmeldung abgesendet
- **WHEN** eine Helfer-Anmeldung beim Backend eingeht
- **THEN** speichert das Backend sie serverseitig

### Requirement: Identitätsprüfung bei Schreibvorgängen

Wenn eine Bewertung oder eine Helfer-Anmeldung eingereicht wird, muss das Backend die Identität der einreichenden Person serverseitig prüfen. Herkunft: NEU (vormals API-F-030).

#### Scenario: Bewertung ohne gültige Identität
- **WHEN** eine Bewertung ohne prüfbare Identität eingereicht wird
- **THEN** lehnt das Backend sie ab

### Requirement: Ratenbegrenzung je Konto

Das System muss die Anzahl eingehender Schreibanfragen je Konto und Zeitfenster begrenzen. Herkunft: NEU (vormals API-N-010). Die vorige Fassung begrenzte „je Person und Zeitfenster“ und ließ damit kontofreie Schreibpfade ungeschützt; das folgende Requirement schließt diese Lücke.

#### Scenario: Zu viele Bewertungen je Konto
- **WHEN** ein Konto innerhalb eines Zeitfensters mehr Schreibanfragen sendet als erlaubt
- **THEN** weist das Backend weitere Anfragen dieses Kontos für den Rest des Zeitfensters ab

### Requirement: Ratenbegrenzung kontofreier Schreibpfade

Das System muss die Anzahl eingehender kontofreier Schreibanfragen je Quelle und Zeitfenster begrenzen. Herkunft: NEU (vormals API-N-015). Betroffen sind insbesondere Helfer-Anmeldungen und Besetzt-Meldungen der Raumsuche, die kein Konto im Sinne einer Identität kennen.

#### Scenario: Zu viele Besetzt-Meldungen von einer Quelle
- **WHEN** dieselbe Anfragequelle innerhalb eines Zeitfensters mehr kontofreie Schreibanfragen sendet als erlaubt
- **THEN** weist das Backend weitere Anfragen dieser Quelle für den Rest des Zeitfensters ab

### Requirement: Ratenbegrenzung kontofreier Lesepfade

Das System muss auch kontofreie Leseanfragen je Quelle und Zeitfenster begrenzen, mit einem Schwellwert, der übliche App-Nutzung — auch die mehrerer Personen hinter einer geteilten Adresse — nicht behindert, und einen abgewiesenen Aufruf mit einem wiederholbaren Fehler beantworten. Herkunft: NEU (vormals API-N-017). Ergänzt am 2026-09-04: Die kontofreien Lese-Endpunkte (Speiseplan, Mensa-Verzeichnisse, News, Events, Raumtermine) waren bislang völlig ungebremst. Da sie ausschließlich aus dem eigenen Zwischenspeicher bedienen, ist eine großzügige Obergrenze je Adresse ausreichend — sie schützt nur gegen fehlerhafte oder bösartige Clients, nicht gegen normale Spitzenlast, die der App-seitige Zwischenspeicher (Capability `data-and-storage`) und die HTTP-Cache-Header ohnehin abfangen.

#### Scenario: Übermäßige Leseanfragen von einer Adresse
- **WHEN** eine Adresse innerhalb eines Zeitfensters die großzügige Obergrenze kontofreier Leseanfragen überschreitet
- **THEN** weist das Backend weitere Anfragen mit einem wiederholbaren Fehler ab

### Requirement: Periodische Aggregation der Raumbelegung (entfallen)

Das System sollte ursprünglich die Termine aller Studiengang/Semester-Kombinationen periodisch abrufen und über `roomId` zu einer Raumbelegung zusammenführen. Diese Anforderung ist entfallen: Befund vom 2026-08-25 aus dem Android-Quellcode zeigt, dass der Endpunkt INT-009 in der Form `Room/*/AllEvents` einen Platzhalter entgegennimmt und alle Raumtermine in einem Aufruf liefert. Ersetzt durch das Requirement „Raumtermine über Platzhalter-Aufruf beziehen“. Herkunft: NEU (vormals API-F-040, entfallen).

#### Scenario: Nachweis der Ablösung
- **WHEN** geprüft wird, ob das Backend Raumtermine über mehrere Studiengang/Semester-Abfragen zusammenführt
- **THEN** trifft das nicht mehr zu — ein einzelner Platzhalter-Aufruf genügt

### Requirement: Raumtermine über Platzhalter-Aufruf beziehen

Das System muss die Raumtermine über den Platzhalter-Aufruf `Room/*/AllEvents` aus INT-009 periodisch abrufen und der App ausschließlich aus dem eigenen Zwischenspeicher ausliefern. Der abzurufende Zeitraum ist dabei mit den Parametern `From` und `To` **ausdrücklich anzugeben**; ohne sie liefert der Endpunkt nur sieben Tage ab dem Folgetag. Beim Ablegen im Zwischenspeicher muss das System für Termine mit der Pseudo-Raumkennung `*` den tatsächlichen Raum aus dem Namensfeld lesen, weil die Belegung sonst um rund ein Drittel zu niedrig ausfällt. Herkunft: Recherche: alte apps/android-fb4, retrofit/TimetableApi.java, 2026-08-25; Abrufweg berichtigt nach dem INT-009-Spike, 2026-09-07 (vormals API-F-045).

Die frühere Fassung ließ den Zeitraum offen, weil sie das Standardfenster für den gesamten Bestand hielt. Der Spike hat gezeigt, dass der Endpunkt beliebige Zeiträume bedient — belegt von Februar 2024 bis September 2027 — und dass die Aggregation über Studiengang/Semester-Kombinationen damit erst recht entbehrlich bleibt.

Der Abruf muss prüfen, ob die Antwort den angeforderten Zeitraum abdeckt, und einen Fehlschlag protokollieren statt ihn zu verschlucken (SEC-F-060). Grund: Der FBWS ignoriert unbekannte Abfrageparameter stillschweigend und antwortet dann mit dem Sieben-Tage-Fenster. Eine Umbenennung der Parameter würde ohne diese Prüfung nicht als Fehler auffallen, sondern den Zwischenspeicher unbemerkt auf eine Woche schrumpfen lassen.

#### Scenario: Periodischer Abruf
- **WHEN** der periodische Hintergrund-Job für Raumtermine läuft
- **THEN** ruft er `Room/*/AllEvents` mit `From` und `To` für den vorgesehenen Zeitraum ab und legt die Termine im eigenen Zwischenspeicher ab

#### Scenario: Antwort deckt den Zeitraum nicht ab
- **WHEN** die Antwort einen kürzeren Zeitraum umfasst als angefordert
- **THEN** protokolliert das System den Vorfall und behält den bisherigen Zwischenspeicher, statt ihn durch einen verkürzten Bestand zu ersetzen

#### Scenario: Raum aus dem Namensfeld
- **WHEN** ein abgerufener Termin die Raumkennung `*` trägt und sein Name eine Raumangabe als Freitext enthält
- **THEN** übernimmt das System den daraus gelesenen Raum in den Zwischenspeicher

### Requirement: Übersicht aller Räume im Raumplan-Zwischenspeicher

Das System muss der App eine Übersicht aller im Raumplan-Zwischenspeicher geführten Räume mit ihrer aktuellen Belegung bereitstellen, nicht beschränkt auf die kuratierte Raumliste. Herkunft: NEU (vormals API-F-055). Liefert nur eine weitere Projektion des bereits vorgehaltenen Bestands, kein zusätzlicher externer Abruf; trägt die Raumübersicht und Ansicht laufender Veranstaltungen aus Capability `room-finder`.

#### Scenario: Raumübersicht abrufen
- **WHEN** die App die Raumübersicht anfragt
- **THEN** liefert das Backend alle im Zwischenspeicher geführten Räume mit aktueller Belegung, auch nicht kuratierte

### Requirement: Raumplan-Termine für lokalen Stundenplan-Abgleich

Das System muss der App die zwischengespeicherten Raumplan-Termine für den lokalen Abgleich mit dem Stundenplan bereitstellen, ohne den Stundenplan der Nutzerin serverseitig zu speichern. Herkunft: NEU (vormals API-F-056). Trägt den Stundenplan-Abgleich aus Capability `schedule`: Das Backend stellt die Raumplan-Termine bereit, der Abgleich gegen den persönlichen Stundenplan läuft auf dem Gerät.

#### Scenario: Abgleich auf dem Gerät
- **WHEN** die App Raumplan-Termine zum Abgleich mit dem persönlichen Stundenplan anfragt
- **THEN** liefert das Backend die Termine, ohne dass der persönliche Stundenplan dabei serverseitig gespeichert wird

### Requirement: Einzelner Abfrage-Endpunkt für Raumsuche (entfallen)

Das System sollte ursprünglich der App für die Raumsuche einen einzelnen Abfrage-Endpunkt auf der aggregierten Raumbelegung bereitstellen, statt die App alle Kombinationen einzeln abfragen zu lassen. Entfallen aus demselben Grund wie die periodische Aggregation: Der Aggregationsbedarf entfällt ersatzlos, da INT-009 bereits alle Raumtermine in einem Aufruf liefert. Herkunft: NEU (vormals API-F-050, entfallen).

#### Scenario: Nachweis der Ablösung
- **WHEN** geprüft wird, ob ein gesonderter Aggregations-Endpunkt für die Raumsuche existiert
- **THEN** ist das nicht mehr nötig — die Übersicht aus dem Zwischenspeicher genügt

### Requirement: News aus Zwischenspeicher ausliefern

Das System muss News vorab abrufen und der App ausschließlich aus dem eigenen Zwischenspeicher ausliefern. Herkunft: NEU (vormals API-F-060).

#### Scenario: News-Abruf
- **WHEN** die App News anfragt
- **THEN** liefert das Backend sie aus dem eigenen Zwischenspeicher, ohne die Fremdquelle live anzufragen

### Requirement: Mensa-Speisepläne aus Zwischenspeicher ausliefern

Das System muss Mensa-Speisepläne vorab abrufen und der App ausschließlich aus dem eigenen Zwischenspeicher ausliefern. Herkunft: NEU (vormals API-F-070).

#### Scenario: Speiseplan-Abruf
- **WHEN** die App den Speiseplan anfragt
- **THEN** liefert das Backend ihn aus dem eigenen Zwischenspeicher

### Requirement: Öffnungszeiten, Kategorien und Zusatzstoffe aus Zwischenspeicher

Das System muss Öffnungszeiten, Gerichtskategorien und Zusatzstoffverzeichnis vorab abrufen und der App aus dem eigenen Zwischenspeicher ausliefern. Herkunft: Recherche: alte apps/android-fb4, retrofit/MenuApi.java, 2026-08-25 (vormals API-F-075).

#### Scenario: Zusatzstoffverzeichnis abrufen
- **WHEN** die App das Zusatzstoffverzeichnis anfragt
- **THEN** liefert das Backend es aus dem eigenen Zwischenspeicher

### Requirement: Auffrischungszeitplan des Speiseplan-Zwischenspeichers

Das System muss den Speiseplan-Zwischenspeicher so aus der Mensa-Quelle auffrischen, dass eine Aktualisierung vor der morgendlichen und vor der mittäglichen studentischen Nutzungsspitze sowie zeitnah nach dem Ende des Mensabetriebs abgeschlossen ist, zusätzlich zu einem regelmäßigen Grundintervall über den Tag. Herkunft: NEU (vormals API-F-076). Der Speiseplan-Zwischenspeicher wurde zuvor in einem festen 6-Stunden-Intervall ab Prozessstart aufgefrischt, was die Nutzungsspitzen nur zufällig traf. Da Studierende typischerweise morgens vor dem Aufstehen und kurz vor der Essenszeit nachsehen (Capability `canteen`), wird auf feste Ortszeit-Läufe umgestellt (z. B. gegen 05:30 und 10:00 Uhr) sowie einen Lauf zeitnah nach Betriebsende (z. B. gegen 15:30 Uhr), da Änderungen am Angebot des Folgetags erfahrungsgemäß gegen Ende des laufenden Betriebstags eingetragen werden. Der Lauf bleibt ein fester, sparsamer Zeitplan (Capability `non-functional`) — kein fortlaufendes Polling. Die konkreten Uhrzeiten und die Ortszeitzone sind konfigurierbar, nicht fest verdrahtet.

#### Scenario: Lauf nach Betriebsende
- **WHEN** der Mensabetrieb für den Tag endet
- **THEN** frischt ein zeitnaher Lauf den Speiseplan-Zwischenspeicher noch am selben Abend auf, statt erst am nächsten Morgen

### Requirement: TLS zwischen App und Backend

Das System muss alle Aufrufe zwischen App und Backend ausschließlich über TLS führen. Herkunft: Alt: alte apps/fb4_app-main/fb4_app-main/lib/areas/canteen/repositories/meals_repository.dart:21 (vormals API-N-020).

#### Scenario: Aufruf ohne TLS
- **WHEN** ein Aufruf zwischen App und Backend versucht wird
- **THEN** läuft er ausschließlich über TLS, nie über unverschlüsseltes HTTP

### Requirement: Event-Pflege durch die Redaktion (entfallen)

Das System sollte ursprünglich der FSR-Redaktion die Pflege von Events ermöglichen. Entfallen: Redaktionsweg-Entscheidung FSR FB4, 2026-08-25 — Events werden über einen vom FSR extern gepflegten ICS-Kalender importiert, nicht über eine Redaktionsoberfläche im eigenen Backend. Ersetzt durch das Requirement „Import von Events aus ICS-Kalender“. Herkunft: NEU (vormals API-F-080, entfallen).

#### Scenario: Nachweis der Ablösung
- **WHEN** geprüft wird, ob das Backend eine Event-Pflegeoberfläche bereitstellt
- **THEN** existiert keine — Events werden importiert

### Requirement: FSR-News-Redaktion

Das System muss der FSR-Redaktion die Pflege von FSR-News ermöglichen. Herkunft: NEU (vormals API-F-090). Gilt explizit nur für die Klassifizierung „FSR-News“ innerhalb der Capability `news`; „FB-Aktuelles“ und „Event-Erinnerungen“ haben keine eigene Redaktionsoberfläche.

#### Scenario: FSR-News verfassen
- **WHEN** ein Redaktionsmitglied eine FSR-News verfasst
- **THEN** speichert das Backend sie über die Redaktionsoberfläche

### Requirement: Fachbereichs-Aktuelles aus Zwischenspeicher

Das System muss Fachbereichs-Aktuelles vorab abrufen und der App ausschließlich aus dem eigenen Zwischenspeicher ausliefern. Herkunft: NEU (vormals API-F-150).

#### Scenario: Fachbereichs-Aktuelles abrufen
- **WHEN** die App Fachbereichs-Aktuelles anfragt
- **THEN** liefert das Backend sie aus dem eigenen Zwischenspeicher

### Requirement: Import von Events aus ICS-Kalender

Das System muss die vom FSR im externen ICS-Kalender gepflegten Events periodisch importieren und der App ausschließlich aus dem eigenen Zwischenspeicher ausliefern. Herkunft: NEU (vormals API-F-160).

#### Scenario: Neues Event im Kalender
- **WHEN** der FSR ein neues Event im externen ICS-Kalender einträgt
- **THEN** übernimmt der periodische Import es in den Zwischenspeicher, aus dem die App es ausgeliefert bekommt

### Requirement: Eigene E-Key-Datenhaltung (entfallen)

Das System sollte ursprünglich E-Key-Verknüpfungen, deren Status und die semesterweisen Bestätigungen serverseitig speichern. Entfallen: Architektur-Klarstellung FSR FB4, 2026-08-25 — der FSR betreibt bereits ein eigenständiges E-Key-Verwaltungstool mit eigener Postgres-Datenhaltung; das neue Backend baut keine parallele Datenhaltung auf. Ersetzt durch das Requirement „Prüfung gegen bestehendes E-Key-Verwaltungstool“. Herkunft: NEU (vormals API-F-170, entfallen).

#### Scenario: Nachweis der Ablösung
- **WHEN** geprüft wird, ob das Backend eine eigene E-Key-Datenhaltung führt
- **THEN** tut es das nicht — es integriert sich mit dem bestehenden Verwaltungstool

### Requirement: Prüfung gegen bestehendes E-Key-Verwaltungstool

Das System muss E-Key-Verknüpfungsanfragen gegen das bestehende E-Key-Verwaltungstool prüfen und dessen Status/Berechtigungen für die Anzeige zwischenspeichern, statt eine eigene E-Key-Datenhaltung aufzubauen. Herkunft: NEU (vormals API-F-175).

#### Scenario: E-Key-Verknüpfung anfragen
- **WHEN** eine Nutzerin eine E-Key-Verknüpfung anfragt
- **THEN** prüft das Backend die Anfrage gegen das bestehende E-Key-Verwaltungstool und speichert nur den Status für die Anzeige zwischen

### Requirement: Ableitung des Prüfungsbestands aus dem Raumplan

Das System muss aus dem zwischengespeicherten Raumplan (INT-009, siehe Capability `integrations`) die Prüfungstermine ableiten und als eigenen Bestand führen. Maßgeblich sind Einträge, deren Bezeichnung dem Muster `Prüfung <Modulnummer> <Bezeichnung>` folgt; Modulnummer und Bezeichnung werden daraus herausgelöst, Raum, Datum und Uhrzeit aus den übrigen Feldern übernommen. Der so gewonnene Bestand ist **nachweislich unvollständig** und deckt rund 70 % des offiziellen Prüfungsplans ab; das System muss diese Unvollständigkeit an den Bestand knüpfen, damit die App sie ausweisen kann. Herkunft: NEU, entschieden 2026-09-06; Vollständigkeit und Vorlauf vermessen im INT-009-Spike, 2026-09-07. Ersetzt den entfallenen Excel-Import (vormals API-F-180).

Der Spike hat die tragende Annahme zur Hälfte bestätigt und zur Hälfte widerlegt. Bestätigt: Die Termine stehen rechtzeitig — im Median 55 Tage vor der Prüfung, bei 87 % der Einträge mindestens 42 Tage —, und wo ein Modul geführt wird, stimmt der Prüfungstag in 61 von 64 Fällen exakt mit dem offiziellen Plan überein. Widerlegt: Von 91 Modulen des Prüfungsplans SoSe 2026 fehlen 27, bis auf zwei Ausnahmen sämtlich wirtschaftswissenschaftliche Module der Studiengänge Wirtschaftsinformatik. Für diese Studiengänge fehlt damit ein erheblicher Teil des Prüfungsplans.

**Entscheidung (Rücksprache FSR FB4, 2026-09-10): Die Lücke wird hingenommen und ausgewiesen, keine Excel-Reaktivierung.** Ursache ist strukturell, nicht behebbar: Ein Teil der wirtschaftswissenschaftlichen Prüfungen findet außerhalb der FB4-eigenen Gebäude statt und wird dort nicht über den vom Fachbereich Informatik geführten Raumplan gebucht — INT-009 kann diese Termine deshalb grundsätzlich nicht enthalten, unabhängig von Namensmuster oder Zeitraum. Eine Reaktivierung des entfallenen Excel-Imports (INT-013) würde genau die jährlich wechselnde Freiwilligen-Abhängigkeit zurückholen, deren Wegfall der Grund für dessen Abschaffung war (Entscheidung 2026-09-06) — für eine Lücke, die dadurch ohnehin nicht vollständig geschlossen würde.

#### Scenario: Prüfungseintrag im Raumplan
- **WHEN** der Raumplan-Zwischenspeicher einen Eintrag mit dem Namensmuster `Prüfung <Modulnummer> <Bezeichnung>` enthält
- **THEN** führt das Backend ihn im Prüfungsbestand mit Modulnummer, Bezeichnung, Raum, Datum und Uhrzeit

#### Scenario: Nicht auflösbares Namensmuster
- **WHEN** ein Eintrag als Prüfung erkennbar ist, sein Name aber keine Modulnummer nach dem Muster hergibt — etwa `Prüfung Softwaretechnik 2` oder ein Eintrag im Plural mit zwei Modulnummern
- **THEN** führt das Backend ihn als Prüfung ohne Modulbezug im Bestand und protokolliert den Vorfall (SEC-F-060), statt ihn zu verwerfen

#### Scenario: Unvollständigkeit ist Teil des Bestands
- **WHEN** das Backend den Prüfungsbestand ausliefert
- **THEN** weist es ihn als abgeleitet und unvollständig aus, damit die App die Nutzerin nicht im Glauben lässt, sie sehe den vollständigen Prüfungsplan

### Requirement: Abruf des Prüfungsbestands

Das System muss den abgeleiteten Prüfungsbestand über einen Abruf-Endpunkt bereitstellen, ohne Anmeldung und ohne Kenntnis darüber, welche Prüfungen eine einzelne Nutzerin ausgewählt hat. Herkunft: NEU, entschieden 2026-09-06.

#### Scenario: Prüfungsbestand abrufen
- **WHEN** die App den Prüfungsbestand abruft
- **THEN** liefert das Backend die abgeleiteten Prüfungstermine ohne Anmeldung aus

### Requirement: Allgemeine Aktualisierungsmeldung bei geändertem Prüfungsplan

Wenn sich der aus dem Raumplan abgeleitete Prüfungsbestand gegenüber dem zuvor abgeleiteten Stand unterscheidet, muss das System eine allgemeine Aktualisierungsmeldung auslösen, ohne dabei personenbezogene Auswahldaten einzelner Nutzerinnen zu verarbeiten. Herkunft: NEU, entschieden 2026-09-06; vormals API-F-200. Löst allgemein aus, ohne zu wissen, welche Nutzerin welche Prüfung ausgewählt hat; das bleibt mit dem Requirement „Verzicht auf serverseitige Speicherung persönlicher Stundenpläne“ vereinbar, weil Capability `schedule` den Abgleich mit der individuellen, ausschließlich lokal gespeicherten Auswahl auf dem Gerät vornimmt.

#### Scenario: Prüfungsplan-Änderung erkannt
- **WHEN** der abgeleitete Prüfungsbestand vom zuvor abgeleiteten Stand abweicht
- **THEN** löst das Backend eine allgemeine Aktualisierungsmeldung aus, ohne personenbezogene Auswahldaten zu verarbeiten

### Requirement: Raumbesetzt-Meldungen ohne Personenbezug

Das System muss Raumbesetzt-Meldungen ohne Konto- oder Personenbezug entgegennehmen und speichern. Herkunft: NEU (vormals API-F-210).

#### Scenario: Besetzt-Meldung senden
- **WHEN** eine Besetzt-Meldung für einen Raum gesendet wird
- **THEN** speichert das Backend sie ohne Konto- oder Personenbezug

### Requirement: Pflege der Laufwege-Datenstruktur

Das System muss der FSR-Redaktion die Pflege einer Laufwege-Datenstruktur zwischen Räumen ermöglichen. Herkunft: NEU (vormals API-F-220).

#### Scenario: Laufweg pflegen
- **WHEN** ein Redaktionsmitglied eine Distanz zwischen zwei Räumen pflegt
- **THEN** speichert das Backend die Laufwege-Datenstruktur

### Requirement: Pflege von Stammdaten ohne externes Quellsystem

Das System muss die Stammdaten, für die kein externes Quellsystem existiert (Mensa-Liste, Raumliste, Links und Downloads, Semestertermine, Ticket-Bildzuschnitt), serverseitig pflegen und der App ausliefern. Herkunft: Recherche: alte apps/android-fb4, service/DataService.java, 2026-08-25 (vormals API-F-230). Die Android-Alt-App führt diese Stammdaten bereits ferngepflegt; das Muster ist übernehmenswert, weil es Änderungen ohne App-Update über drei Vertriebswege ermöglicht. Der Befund vom 2026-08-25 zeigt aber auch die Kehrseite: Ohne Pflegeoberfläche veraltet dieser Bestand — die dort abgerufenen Semestertermine stammen aus dem Wintersemester 2023/24. Die Pflege gehört deshalb in die Admin-Oberfläche (Capability `admin`), nicht in eine Konfigurationsdatei auf dem Server.

#### Scenario: Mensa-Liste ändert sich
- **WHEN** der FSR die Mensa-Liste über die Admin-Oberfläche ändert
- **THEN** liefert das Backend die aktualisierte Liste an die App aus

### Requirement: App-seitiger Ausgangsbestand bei Backend-Ausfall

Falls das Backend beim Ausliefern von Stammdaten nicht erreichbar ist, muss die App mit einem im Anwendungspaket mitgelieferten Ausgangsbestand arbeiten. Herkunft: Recherche: alte apps/android-fb4, assets/canteens.json, 2026-08-25 (vormals API-F-235).

#### Scenario: Backend nicht erreichbar
- **WHEN** die App beim ersten Start Stammdaten laden will und das Backend nicht erreichbar ist
- **THEN** arbeitet sie mit dem im Anwendungspaket mitgelieferten Ausgangsbestand

### Requirement: Rückfallliste der Studiengänge

Das System muss eine Rückfallliste der Studiengänge vorhalten und ausliefern, falls das Hochschulsystem für Studiengänge nicht erreichbar ist. Herkunft: Recherche: alte apps/android-fb4, retrofit/TimeTableFallbackApi.java, 2026-08-25 (vormals API-F-240).

#### Scenario: Hochschulsystem nicht erreichbar
- **WHEN** das Hochschulsystem für Studiengänge nicht erreichbar ist
- **THEN** liefert das Backend die Rückfallliste der Studiengänge aus

### Requirement: Abfrage-Endpunkt für den Prüfungsplan-Änderungszeitpunkt

Das System muss den Zeitpunkt der letzten Prüfungsplan-Änderung über einen Abfrage-Endpunkt bereitstellen, sodass die App den Abgleich mit ihrer lokalen Auswahl selbst vornehmen kann. Herkunft: NEU (vormals API-F-205). Löst die zuvor unbestimmte Zustellung des Aktualisierungshinweises: Ein Abfrage-Endpunkt statt einer zugestellten Meldung hält das Requirement „Verzicht auf serverseitige Speicherung persönlicher Stundenpläne“ ohne Ausnahme ein und funktioniert zudem ohne Push-Infrastruktur.

#### Scenario: App fragt Änderungszeitpunkt ab
- **WHEN** die App den Zeitpunkt der letzten Prüfungsplan-Änderung abfragt
- **THEN** liefert das Backend diesen Zeitpunkt, ohne die lokale Auswahl der Nutzerin zu kennen

### Requirement: Rollenübernahme aus dem Identitätsanbieter

Das System muss Rollenzugehörigkeiten aus dem Identitätsanbieter übernehmen, statt eine eigene Rollenverwaltung zu führen. Herkunft: NEU (vormals API-F-250).

#### Scenario: Rollenprüfung
- **WHEN** das Backend die Rolle einer Person prüft
- **THEN** liest es sie aus dem Claim des Identitätsanbieters, statt eine eigene Rollentabelle zu führen

### Requirement: Verzicht auf serverseitige Speicherung persönlicher Stundenpläne

Das System muss darauf verzichten, persönliche Stundenpläne serverseitig zu speichern. Herkunft: NEU (vormals API-F-100).

#### Scenario: Stundenplan-Abgleich
- **WHEN** die App einen Stundenplan-Abgleich mit dem Backend durchführt
- **THEN** speichert das Backend dabei keinen persönlichen Stundenplan

### Requirement: Verzicht auf Hochschul-Zugangsdaten

Das System muss darauf verzichten, Hochschul-Zugangsdaten entgegenzunehmen oder zu speichern. Herkunft: NEU (vormals API-F-110).

#### Scenario: Kein Zugangsdaten-Endpunkt
- **WHEN** ein Aufruf ans Backend geprüft wird
- **THEN** existiert kein Endpunkt, der Hochschul-Zugangsdaten entgegennimmt oder speichert

### Requirement: Verzicht auf serverseitige Speicherung von Semesterticket-Daten

Das System muss darauf verzichten, Semesterticket-Daten serverseitig zu speichern. Herkunft: NEU (vormals API-F-120).

#### Scenario: Ticket bleibt lokal
- **WHEN** ein Semesterticket in der App hinterlegt wird
- **THEN** speichert das Backend dabei keine Ticket-Daten

### Requirement: Kein Weitergeben personenbezogener Daten an Dritte

Das System muss darauf verzichten, personenbezogene Daten an Dritte außerhalb des FSR FB4 weiterzugeben. Herkunft: NEU (vormals API-F-130).

#### Scenario: Anfrage eines Dritten
- **WHEN** eine Stelle außerhalb des FSR FB4 personenbezogene Daten anfragt
- **THEN** gibt das Backend keine personenbezogenen Daten weiter

### Requirement: Eindeutige Versionskennzeichnung der Schnittstelle

Das System muss jede Version seiner Schnittstelle eindeutig kennzeichnen. Herkunft: NEU (vormals API-N-030).

#### Scenario: Neue Schnittstellenversion
- **WHEN** eine neue Version der Schnittstelle veröffentlicht wird
- **THEN** trägt sie eine eindeutige Kennzeichnung im Pfad

### Requirement: Vertrag vor Umsetzung

Das System muss jeden Aufruf zwischen App und Backend im OpenAPI-Vertrag beschreiben, bevor er umgesetzt wird. Herkunft: NEU (vormals API-N-035). Der vollständige Vertrag steht als versionierte OpenAPI-Beschreibung in `openspec/specs/api-contract.yaml` und ist die Quelle der Wahrheit für jeden Aufruf zwischen App beziehungsweise Admin-Oberfläche und Backend (siehe `specs/decisions/0011-monorepo-und-openapi-vertrag.md`). Typen und Client-Code werden daraus erzeugt; eine Vertragsänderung ist eine Spec-Änderung und unterliegt den Regeln aus `specs/README.md` Abschnitt 8.

#### Scenario: Neuer Aufruf ohne Vertragseintrag
- **WHEN** ein neuer Aufruf zwischen App und Backend umgesetzt werden soll und er noch nicht in `openspec/specs/api-contract.yaml` beschrieben ist
- **THEN** wird er zuerst dort beschrieben, bevor Code entsteht

### Requirement: Einheitliches Fehlerformat

Das System muss Fehlerantworten in einem einheitlichen, maschinenlesbaren Format mit Fehlercode und einer für Menschen lesbaren Meldung liefern. Herkunft: NEU (vormals API-N-040). Das Backend liefert Fehlerantworten als RFC 9457 „Problem Details“ (`application/problem+json`) mit maschinenlesbarem `code` und für Menschen lesbarem `title`. Die App-seitige Auswertung unterscheidet drei Fälle: (a) formatkonformer Rumpf → `code` und Meldung daraus; (b) leerer oder fehlender Rumpf (etwa bei einem `401` vom vorgelagerten Reverse Proxy) → Einordnung allein über den HTTP-Status; (c) vorhandener, aber nicht formatkonformer Rumpf (HTML-Fehlerseite, abgeschnittenes JSON) → als `parse`-Fehler sichtbar gemacht, nie still weiterverarbeitet (Capability `security-and-privacy`, Capability `quality-and-testing`).

#### Scenario: Nicht formatkonformer Fehlerrumpf
- **WHEN** eine Fehlerantwort einen vorhandenen, aber nicht formatkonformen Rumpf trägt
- **THEN** macht die App diesen Fall als Parse-Fehler sichtbar, statt ihn still weiterzuverarbeiten

### Requirement: Idempotente Bewertungsabgabe

Wenn eine Bewertung mit einer bereits verarbeiteten Idempotenz-Kennung erneut eingereicht wird, muss das Backend sie als bereits verarbeitet erkennen und nicht doppelt zählen. Herkunft: NEU (vormals API-F-140). Sichert die Offline-Warteschlange ab (Capability `architecture`): Eine wegen unterbrochener Verbindung erneut gesendete Bewertung darf nicht als zweite Bewertung gezählt werden. Ausgestaltung der Idempotenz-Kennung ist Sache der Umsetzung, nicht dieser Spec.

#### Scenario: Erneute Übertragung nach Verbindungsabbruch
- **WHEN** eine Bewertung mit derselben Idempotenz-Kennung ein zweites Mal eintrifft
- **THEN** erkennt das Backend sie als bereits verarbeitet und zählt sie nicht doppelt

### Requirement: Paginierung von Listenergebnissen

Das System muss Listenergebnisse paginieren. Herkunft: NEU (vormals API-N-050).

#### Scenario: Lange Liste
- **WHEN** eine Liste mehr Einträge enthält als eine Seite fasst
- **THEN** liefert das Backend sie paginiert aus

### Requirement: ISO-8601-Zeitangaben mit Zeitzone

Das System muss alle Zeitangaben im Format ISO 8601 mit Zeitzone liefern. Herkunft: NEU (vormals API-N-060).

#### Scenario: Zeitstempel in Antwort
- **WHEN** das Backend eine Zeitangabe ausliefert
- **THEN** trägt sie das Format ISO 8601 mit Zeitzone

### Requirement: HTTP-Cache-Header für zwischengespeicherte Leseantworten

Das System muss zwischengespeicherte Leseantworten mit HTTP-Cache-Headern versehen (u. a. `Cache-Control` und `ETag`), deren Gültigkeitsdauer der jeweiligen Zwischenspeicher-Regel aus Capability `data-and-storage` entspricht, sodass Client- und vorgelagerte Proxy-Caches unnötige Wiederholungsabrufe vermeiden und ein unveränderter Abruf mit `304` beantwortet werden kann. Herkunft: NEU (vormals API-N-016). Ergänzt am 2026-09-04, als zweite, vom Anwendungscode unabhängige Entlastung neben der Ratenbegrenzung kontofreier Lesepfade. Die betroffenen Lese-Endpunkte erhalten in `openspec/specs/api-contract.yaml` einen `ETag`-Antwortkopf und einen `If-None-Match`-Anfrageparameter — dasselbe Muster, das die Verwaltungs-Endpunkte dort bereits für die Nebenläufigkeitskontrolle nutzen.

#### Scenario: Unveränderter Abruf
- **WHEN** ein Client einen Speiseplan mit gültigem `If-None-Match` erneut abruft und sich der Inhalt nicht geändert hat
- **THEN** antwortet das Backend mit `304` statt der vollen Nutzlast

### Requirement: Unterscheidung additiver und brechender Änderungen

Das System muss zwischen additiven und brechenden Schnittstellenänderungen unterscheiden; nur brechende Änderungen erhöhen das Versionssegment im Pfad. Herkunft: NEU (vormals API-N-130). Konkretisiert das Requirement „Eindeutige Versionskennzeichnung der Schnittstelle“, siehe `specs/decisions/0016-api-versionierung-und-deprecation.md`.

#### Scenario: Additive Änderung
- **WHEN** ein neues optionales Feld zu einer bestehenden Antwort hinzugefügt wird
- **THEN** bleibt das Versionssegment im Pfad unverändert

### Requirement: Protokollierung der Client-Version

Das System muss bei jedem Aufruf die Client-Version protokollieren, um die Zugriffshäufigkeit je Schnittstellenversion auszuwerten. Herkunft: NEU (vormals API-F-270).

#### Scenario: Aufruf mit Client-Version
- **WHEN** ein Aufruf beim Backend eingeht
- **THEN** protokolliert das Backend die mitgesendete Client-Version

### Requirement: Mindestlaufzeit veralteter Schnittstellenversionen

Wenn eine Schnittstellenversion als veraltet markiert wird, muss sie mindestens 90 Tage zusätzlich zur neuen Version erreichbar bleiben. Herkunft: NEU (vormals API-N-140). Konkretisiert das Requirement „Eindeutige Versionskennzeichnung der Schnittstelle“, siehe `specs/decisions/0016-api-versionierung-und-deprecation.md`.

#### Scenario: Neue Version veröffentlicht
- **WHEN** eine neue Schnittstellenversion veröffentlicht und die alte als veraltet markiert wird
- **THEN** bleibt die alte Version mindestens 90 Tage zusätzlich erreichbar

### Requirement: Abschaltung erst bei vernachlässigbarem Zugriff

Das System darf eine veraltete Schnittstellenversion erst abschalten, wenn zusätzlich zur Mindestfrist ein vernachlässigbarer Zugriff nachgewiesen ist. Herkunft: NEU (vormals API-N-150). Konkretisiert das Requirement „Eindeutige Versionskennzeichnung der Schnittstelle“, siehe `specs/decisions/0016-api-versionierung-und-deprecation.md`.

#### Scenario: Mindestfrist erreicht, aber noch Zugriffe
- **WHEN** die Mindestfrist von 90 Tagen erreicht ist, die protokollierte Client-Version aber noch nennenswerten Zugriff zeigt
- **THEN** schaltet das Backend die veraltete Version noch nicht ab

### Requirement: Regelmäßige Sicherungen

Das System muss regelmäßige Sicherungen der serverseitig gespeicherten Daten vorhalten. Herkunft: NEU (vormals API-N-070).

#### Scenario: Sicherungslauf
- **WHEN** der planmäßige Sicherungszeitpunkt erreicht ist
- **THEN** legt das System eine Sicherung der serverseitig gespeicherten Daten an

### Requirement: Datensparsame Protokollierung

Das System muss Protokolle nach dem Prinzip der Datensparsamkeit führen. Herkunft: NEU (vormals API-N-080).

#### Scenario: Protokolleintrag
- **WHEN** ein Protokolleintrag entsteht
- **THEN** enthält er nur die für den Zweck nötigen Angaben

### Requirement: Überwachung des Betriebszustands

Das System muss den Betriebszustand des Backends überwachen und bei Ausfall benachrichtigen. Herkunft: NEU (vormals API-N-090).

#### Scenario: Backend fällt aus
- **WHEN** das Backend nicht mehr erreichbar ist
- **THEN** löst die Überwachung eine Benachrichtigung aus

### Requirement: Strukturierte Fehlerprotokollierung und Telemetrie

Das System muss Fehler ab Schweregrad „Error“ strukturiert protokollieren und an die selbstbetriebene Fehlertelemetrie-Instanz weiterleiten. Herkunft: NEU (vormals API-N-100). Konkretisiert das Requirement „Überwachung des Betriebszustands“, siehe `specs/decisions/0014-selbstbetriebene-fehlertelemetrie.md`.

#### Scenario: Fehler ab Schweregrad Error
- **WHEN** ein Fehler mit Schweregrad „Error“ auftritt
- **THEN** protokolliert das Backend ihn strukturiert und leitet ihn an die eigene Telemetrie-Instanz weiter

### Requirement: Fehler-Isolation periodischer Hintergrund-Jobs

Das System muss jeden periodischen Hintergrund-Job so kapseln, dass eine unbehandelte Ausnahme innerhalb eines Durchlaufs protokolliert wird und ausschließlich diesen Durchlauf abbricht, nicht den Backend-Prozess. Herkunft: NEU (vormals API-N-110). Siehe `specs/decisions/0015-resilienz-hintergrund-jobs.md`.

#### Scenario: Ausnahme in einem Job-Durchlauf
- **WHEN** ein periodischer Hintergrund-Job in einem Durchlauf eine unbehandelte Ausnahme wirft
- **THEN** protokolliert das Backend sie, bricht nur diesen Durchlauf ab und der Backend-Prozess läuft weiter

### Requirement: Resilienz bei Aufrufen externer Quellsysteme

Das System muss jeden Aufruf eines externen Quellsystems mit Timeout, Wiederholung mit steigendem Abstand und einem Circuit Breaker gegen wiederholten Fehlschlag absichern. Herkunft: NEU (vormals API-N-120). Siehe `specs/decisions/0015-resilienz-hintergrund-jobs.md`.

#### Scenario: Fremdsystem wiederholt nicht erreichbar
- **WHEN** ein externes Quellsystem wiederholt fehlschlägt
- **THEN** öffnet der Circuit Breaker und verhindert weitere sofortige Aufrufe

### Requirement: Health-Check mit Job-Status

Das System muss je periodischem Hintergrund-Job Zeitpunkt und Ergebnis des letzten Durchlaufs über den Health-Check-Endpunkt bereitstellen. Herkunft: NEU (vormals API-F-260). Konkretisiert das Requirement „Überwachung des Betriebszustands“, siehe `specs/decisions/0014-selbstbetriebene-fehlertelemetrie.md` und `specs/decisions/0015-resilienz-hintergrund-jobs.md`.

#### Scenario: Health-Check abfragen
- **WHEN** der Health-Check-Endpunkt abgefragt wird
- **THEN** enthält die Antwort je periodischem Job Zeitpunkt und Ergebnis des letzten Durchlaufs

### Requirement: Organisatorisch getrenntes Sicherungsziel

Das System muss serverseitige Sicherungen auf einem vom gesicherten Server organisatorisch getrennten Ziel ablegen. Herkunft: NEU (vormals API-N-160). Siehe `specs/decisions/0017-zugriff-und-datensicherung-vps.md`.

#### Scenario: Sicherung ablegen
- **WHEN** eine Sicherung erstellt wird
- **THEN** liegt sie auf einem vom gesicherten Server organisatorisch getrennten Ziel

### Requirement: Wiederherstellungsfrist und Sicherungsfrequenz

Die Wiederherstellung aus einer Sicherung muss innerhalb eines Arbeitstages möglich sein; die Sicherungsfrequenz muss einen Datenverlust von höchstens 24 Stunden sicherstellen. Herkunft: NEU (vormals API-N-170). Siehe `specs/decisions/0017-zugriff-und-datensicherung-vps.md`.

#### Scenario: Wiederherstellung nach Ausfall
- **WHEN** eine Wiederherstellung aus einer Sicherung nötig wird
- **THEN** ist sie innerhalb eines Arbeitstages abgeschlossen und der Datenverlust beträgt höchstens 24 Stunden

### Requirement: Halbjährliche Wiederherstellungsprüfung

Das System muss mindestens einmal je Semester durch eine tatsächliche Wiederherstellung in eine Testumgebung geprüft werden, nachgewiesen durch ein datiertes Prüfprotokoll. Herkunft: NEU (vormals API-N-180). Siehe `specs/decisions/0017-zugriff-und-datensicherung-vps.md`.

#### Scenario: Semesterprüfung
- **WHEN** ein Semester endet, ohne dass eine Wiederherstellungsprüfung stattgefunden hat
- **THEN** gilt dieses Requirement als nicht erfüllt

### Requirement: Dokumentiertes Onboarding und Offboarding

Wenn eine Person Zugriff auf Server, Secrets-Depot oder Hosting-Zugang erhält oder verliert, muss dies über einen dokumentierten Onboarding-/Offboarding-Ablauf erfolgen, einschließlich Rotation aller geteilten Geheimnisse beim Ausscheiden. Herkunft: NEU (vormals API-N-190). Siehe `specs/decisions/0017-zugriff-und-datensicherung-vps.md`.

#### Scenario: Ausscheiden einer Person
- **WHEN** eine Person mit Server- oder Secrets-Zugriff ausscheidet
- **THEN** werden alle geteilten Geheimnisse im Zuge des dokumentierten Offboarding-Ablaufs rotiert

### Requirement: Automatisierte Auslieferung nach grüner CI

Das System muss über einen im Repository beschriebenen, automatisierten Ablauf ausgeliefert werden, der nach erfolgreicher CI Build, Test, Übertragung auf den Zielserver und Neustart des Dienstes umfasst und den Betriebszustand nach dem Neustart prüft. Herkunft: NEU (vormals API-N-200). Setzt die Lehre aus `specs/decisions/0002-spec-anchored-arbeitsweise.md` für den Betrieb um — die Alt-Projekte scheiterten daran, dass Auslieferungswissen an Einzelpersonen gebunden war. Umgesetzt als GitHub-Actions-Workflow (`.github/workflows/deploy.yml`, ausgelöst durch einen grünen CI-Lauf auf `main`) plus dokumentierte Server-Einrichtung, systemd-Unit und Reverse-Proxy-Konfiguration unter `deploy/`. Geheimnisse gelangen ausschließlich über eine `EnvironmentFile` auf dem Server in den Dienst, nie über das Repository oder den CI-Runner (Capability `security-and-privacy`). Nachweis über ein datiertes Prüfprotokoll statt eines automatisierten Tests (Capability `quality-and-testing`): Ein automatisierter Test des Auslieferungswegs setzte einen realen Zielserver mit Datenbank und Reverse-Proxy voraus; der Health-Check am Ende des Workflows prüft das Ergebnis bei jedem Lauf, ein gesonderter Testaufbau wäre unverhältnismäßig.

#### Scenario: Grüner CI-Lauf auf main
- **WHEN** ein CI-Lauf auf `main` erfolgreich abschließt
- **THEN** löst der automatisierte Ablauf Build, Test, Übertragung und Neustart aus und prüft danach den Betriebszustand

## Entfallene Anforderungen (historisch)

### Ehemals API-F-180: Import des Prüfungsplans

Ursprünglicher Text: „Das System muss einem Admin/FSR-Mitglied den Import des offiziellen Prüfungsplans aus einer hochgeladenen Excel-Datei ermöglichen." Herkunft: NEU.

Status: entfallen (entschieden 2026-09-06). Grund: Der Prüfungsbestand wird aus dem ohnehin abgerufenen Raumplan abgeleitet; ein Upload findet nicht mehr statt. Ausschlaggebend war die Abhängigkeit des manuellen Schritts von einer jährlich wechselnden ehrenamtlichen Person — dieselbe Konstruktion, an der das abgelöste Backend `app.fsrfb4.de` gescheitert ist. Ersetzt durch „Ableitung des Prüfungsbestands aus dem Raumplan".

### Ehemals API-F-190: Vollständiger Ersatz des Prüfungsplan-Bestands

Ursprünglicher Text: „Wenn ein neuer Prüfungsplan für ein neues Jahr importiert wird, muss das System den bisherigen Prüfungsplan-Bestand vollständig ersetzen." Herkunft: NEU.

Status: entfallen (entschieden 2026-09-06). Grund: Die Anforderung regelte den Jahrgangswechsel beim Excel-Import. Der abgeleitete Bestand folgt dem Raumplan-Zwischenspeicher und wird mit jedem Abruf neu gebildet; ein gesonderter Ersatzvorgang je Jahrgang entfällt. Ersetzt durch „Ableitung des Prüfungsbestands aus dem Raumplan".

## Warum das Backend unvermeidlich ist

Vier unabhängige Gründe, jeder für sich hinreichend:

| Grund | Beschreibung | Ohne Backend |
|---|---|---|
| Schreibpfade | Mensa-Bewertungen, Helfer-Anmeldungen und E-Key-Verknüpfungen brauchen serverseitige Persistenz, Identitätsprüfung, Begrenzung der Aufrufrate und Moderation | rein clientseitig nicht realisierbar |
| Stammdaten ohne externe Quelle | Mensa-Liste, Raumliste, Links und Downloads, Semestertermine und Ticket-Bildzuschnitt haben kein Quellsystem und müssen gepflegt und ausgeliefert werden | jede Änderung erforderte ein App-Update über drei Vertriebswege |
| Ablösung Fremdabhängigkeit | News hängt an privater Infrastruktur, ebenso der Prüfungs- und Zeitplan-Verweis des bestehenden Backends — beides unklarer Trägerschaft, teils unverschlüsselt | Ausfallrisiko und fehlendes TLS bleiben in der App bestehen |
| Redaktion | FSR-News müssen gepflegt, Prüfungspläne importiert, gemeldete Inhalte moderiert werden | keine Pflegemöglichkeit ohne serverseitige Verwaltung |
| Entkopplung von HTML-Auswertungen | Die Fachbereichsnachrichten liegen nur als HTML vor und werden per Auswertung erschlossen | eine Layout-Änderung der Fachbereichsseite bräche die App bis zum nächsten Store-Update |

Verifiziert in `meals_repository.dart:21` — der Aufruf erfolgt über unverschlüsseltes HTTP. `news_repository.dart:7` trägt zusätzlich einen Codekommentar, der eine Umgehung der TLS-Vertrauensprüfung nahelegt; im Dart-Code selbst findet sich dafür keine Umsetzung (siehe Capability `integrations`, Eintrag INT-003, Abschnitt „Befund zur Zertifikatsprüfung“).

**Entfallener Grund: Aggregation der Raumsuche.** Bis zum 2026-08-25 stand hier als zweiter Grund, Raumbelegung sei nur durch Zusammenführung der Termine aller Studiengang/Semester-Kombinationen herleitbar, was Dutzende Anfragen je Suche auf dem Endgerät bedeutet hätte. Diese Annahme ist widerlegt: Der Endpunkt INT-009 nimmt in der Form `Room/*/AllEvents` einen Platzhalter entgegen und liefert alle Raumtermine in einem einzigen Aufruf — die Android-Alt-App nutzt genau das produktiv. Der Aggregationsbedarf entfällt damit ersatzlos. Das Backend behält für die Raumsuche nur die Rolle des Zwischenspeichers, aus denselben Gründen wie bei News und Mensa. Die übrigen vier Gründe tragen die Entscheidung für ein eigenes Backend unverändert, jeder für sich.

## Fachliche Ressourcen im Überblick

Nur Zweck und grobe Felder; ausformulierte Datenmodelle entstehen mit den jeweiligen Feature-Capabilities.

| Ressource | Zweck | Grobe Felder |
|---|---|---|
| Bewertung | Mensa-Bewertung je Gericht | Pseudonym, Gericht-Referenz, Bewertungsstufe (schlecht/gut/sehr gut), Kommentar (optional), Zeitstempel |
| Event | Import aus dem FSR-ICS-Kalender | UID, Titel, Zeitraum, Ort, Beschreibung, Status, Helferbedarf (Verknüpfung) |
| Helferbedarf / -anmeldung | Personalplanung je Event | Rolle, Schicht, benötigte Anzahl, angemeldete Personen (Name, Kontaktweg) |
| Raumtermine | Zwischenspeicher der Rohtermine | roomId, Wochentag/Zeitraum, Bezeichnung, note — Grundlage für Raumsuche, Raumübersicht und Stundenplan-Abgleich (Capability `room-finder`, Capability `schedule`) |
| Raum-Stammdaten | vom FSR gepflegte Raumliste | roomId, Größe (klein/mittel/groß), E-Key-Eignung |
| Mensa-Stammdaten | vom FSR gepflegte Mensa-Liste | Kennung, ITMC-Kennung, Anzeigename, Öffnungszeiten je Wochentag, Standardauswahl, Anzeigereihenfolge, Speiseplan-URL |
| Links und Downloads | vom FSR gepflegte Liste externer Verweise | Bezeichnung, URL, Gruppierung, Reihenfolge |
| Semestertermine | Semesterbeginn, Semesterende, nächster WS-/SS-Start | Datum je Angabe |
| News-Zwischenspeicher | Kopie von FSR-News und FB-Aktuelles, je mit Klassifizierung | Titel, Text, Datum, Quelle, Klassifizierung |
| Speiseplan-Zwischenspeicher | Kopie der Mensa-Quelle | Mensa, Datum, Gerichte, Gerichtskategorien, Zusatzstoffverzeichnis |
| E-Key-Verknüpfung | Zuordnung Konto ↔ E-Key, Zwischenspeicher für Anzeige (System der Wahrheit: E-Key-Verwaltungstool, extern) | E-Key-Nummer-Referenz, Konto-Referenz, zuletzt gelesener Status/Berechtigungen, letzte/nächste Bestätigung |
| Prüfungsbestand | Aus dem Raumplan (INT-009) abgeleitet | Modulnummer, Bezeichnung, Datum/Zeit, Raum |
| Laufwege | Distanzen/Nachbarschaften zwischen Räumen | Raum-Paar, Distanz-/Gewichtsmaß |
| Besetzt-Meldung | Crowd-Hinweis auf tatsächliche Raumbelegung | roomId, Zeitstempel, kein Personen-/Kontobezug |

## Betrieb

Betreiber: FSR FB4 selbst, auf einem eigenen Hetzner-VPS. Entschieden 2026-08-25, siehe Capability `integrations`, Eintrag INT-008.

## Redaktionsweg

Entschieden 2026-08-25 (FSR FB4):

| Inhalt | Weg | Begründung |
|---|---|---|
| Events | Externer ICS-Kalender, vom FSR gepflegt, vom Backend importiert | Wiederverwendung bestehender Kalenderwerkzeuge statt eigener Pflegeoberfläche |
| News, Klassifizierung „FSR-News“ | Eigene Redaktionsoberfläche im Backend | FSR-Meldungen entstehen originär in der App-Landschaft, kein externes Vorbild |
| News, Klassifizierung „FB-Aktuelles“ | Import aus der Fachbereichsseite | Reine Übernahme fremdredigierter Inhalte, keine FSR-Redaktion nötig |
| News, Klassifizierung „Event-Erinnerungen“ | Automatisch aus Capability `events` abgeleitet, keine eigene Redaktion | Ergänzt News um Termin-Hinweise ohne doppelte Pflege |

BookStack bleibt ausschließlich Grundlage für Capability `wiki`, nicht für News. Details je Inhalt in Capability `events` bzw. Capability `news`.

## Technologiewahl

ASP.NET Core mit PostgreSQL und Entity Framework Core; periodische Aufgaben (Zwischenspeicher-Auffrischung, Importe) als Hosted Services im selben Dienst. Entscheidung FSR FB4, 2026-08-25, siehe `specs/decisions/0011-monorepo-und-openapi-vertrag.md`. PostgreSQL auch deshalb, weil das bestehende E-Key-Verwaltungstool bereits darauf läuft und die spätere Integration damit einfacher bleibt. Details zum Betrieb auf dem Hetzner-VPS siehe `specs/decisions/0003-eigenes-backend-fuer-community-funktionen.md`.

## Ablösung des bestehenden Backends

Unter `https://app.fsrfb4.de` läuft bereits ein Backend, das die Android-Alt-App bedient: ferngepflegte Stammdaten (`/data`), versions- und sprachabhängige Hinweise an die App (`/messages/messages.php`) und eine Rückfallliste der Studiengänge (`/studiengaenge.json`). Vollständige Beschreibung: Capability `integrations`, Eintrag INT-008, Abschnitt „Vorgänger“.

Der Dienst ist erreichbar, aber inhaltlich veraltet — die live abgefragten Semestertermine stammen aus dem Wintersemester 2023/24, und der hinterlegte Prüfungsplan-Verweis zeigt auf eine private, unverschlüsselte Domain. Entscheidung FSR FB4, 2026-08-25: Das fachliche Konzept wird übernommen, die Umsetzung neu gebaut, der Altdienst nach der Umstellung abgeschaltet. Bis dahin läuft er für die Android-Bestandsnutzung weiter.

Zwei Lehren aus dem Altbestand sind in die Anforderungen eingeflossen: Stammdaten brauchen eine Pflegeoberfläche, sonst veralten sie (Capability `admin`), und mitgelieferte Ausgangsbestände verhindern, dass ein Ausfall der Stammdaten die App unbrauchbar macht.

## Offene Fragen

- Zugriffsverwaltung und Backup-Ziel auf dem Hetzner-VPS: geklärt 2026-08-26, siehe `specs/decisions/0017-zugriff-und-datensicherung-vps.md`. Weiterhin offen: konkrete Instanzgröße — Arbeitsziel bleibt kleinste für ASP.NET-Core-Betrieb plus PostgreSQL tragfähige Größe, Hochskalierung bei Bedarf.
- Fan-out-Mechanismus für die Push-Zustellung (ein UnifiedPush-Aufruf je Android-Endpunkt gegenüber einem Themen-Aufruf für iOS) — offener Punkt aus `specs/decisions/0008-vertrieb-ueber-drei-app-stores.md`, zu klären mit der zweiten Ausbaustufe.
- Ob die versions- und sprachabhängigen Hinweise des Altbackends (`/messages`) fachlich übernommen werden oder in Capability `news` aufgehen — betrifft `news`, `app-shell` und diese Capability gleichermaßen, siehe `specs/open-questions.md` (dort die Feinstruktur des Altmechanismus als technischer Befund vom 2026-08-26).
