## Purpose

Ermöglicht Studierenden und Lehrenden das Finden freier Räume, das Nachschlagen der Belegung bekannter Räume sowie zwei zusätzliche Sichten auf denselben Raumplan-Bestand: eine Übersicht aller Räume und eine Ansicht laufender Veranstaltungen. Vormals `specs/features/room-finder/spec.md` (Präfix `RAUM`), migriert nach ADR 0019. Owner: FSR FB4.

## Requirements

### Requirement: Belegung eines gewählten Raums anzeigen

Das System muss der Nutzerin die Anzeige der Belegung eines per Kennung gewählten Raums für den aktuellen Tag ermöglichen. Herkunft: Android: unbekannt (vormals RAUM-F-010).

#### Scenario: Raum per Kennung wählen
- **WHEN** die Nutzerin die Kennung eines Raums eingibt
- **THEN** zeigt das System dessen Belegung für den aktuellen Tag an

### Requirement: Suche nach freien Räumen

Das System muss der Nutzerin die Suche nach zu einem gewählten Zeitraum freien Räumen ermöglichen. Herkunft: Recherche: alte apps/android-fb4, service/RoomService.java, 2026-08-25 (vormals RAUM-F-020).

#### Scenario: Zeitraum ohne belegte Räume
- **WHEN** für einen gewählten Zeitraum keine belegten Räume vorliegen
- **THEN** liefert die Suche eine nachvollziehbare Leermeldung statt eines Fehlers

### Requirement: Raum als belegt kennzeichnen

Das System muss einen Raum als belegt kennzeichnen, wenn zum abgefragten Zeitpunkt ein Termin mit diesem `roomId` existiert, unabhängig davon, ob der Termin vom Typ `Course` oder `Event` (z. B. Prüfung) ist. Herkunft: NEU (vormals RAUM-F-030).

#### Scenario: Prüfungstermin belegt den Raum
- **WHEN** zum abgefragten Zeitpunkt ein Termin vom Typ `Event` mit diesem `roomId` existiert
- **THEN** kennzeichnet das System den Raum als belegt, ebenso wie bei einem Termin vom Typ `Course`

### Requirement: Raumtermine über den Backend-Zwischenspeicher beziehen

Das System muss die Raumtermine über den Zwischenspeicher des Backends (INT-008) beziehen, das sie seinerseits über den Platzhalter-Aufruf aus INT-009 abruft. Herkunft: Recherche: alte apps/android-fb4, retrofit/TimetableApi.java, 2026-08-25 (vormals RAUM-F-045). Ersetzt die entfallenen Anforderungen zur clientseitigen Aggregation, siehe Abschnitt „Entfallene Anforderungen (historisch)": `Room/*/AllEvents` liefert alle Raumtermine in einem Aufruf.

#### Scenario: Raumtermine aus dem Zwischenspeicher
- **WHEN** die App Raumtermine anfragt
- **THEN** bezieht sie diese aus dem Zwischenspeicher des Backends, nicht durch eigene Abfragen aller Studiengang/Semester-Kombinationen

### Requirement: Referenzraum-Eingabe

Das System muss der Nutzerin die Eingabe eines Referenzraums ermöglichen, vor dem sie sich gerade befindet. Herkunft: NEU (vormals RAUM-F-050).

#### Scenario: Referenzraum eingeben
- **WHEN** die Nutzerin einen Referenzraum angibt
- **THEN** übernimmt das System diesen als Ausgangspunkt für die Nähe-Suche

### Requirement: Nächstgelegenen freien Raum ermitteln

Wenn ein Referenzraum angegeben ist, muss das System anhand der serverseitig gepflegten Laufwege-Datenstruktur den nächstgelegenen freien Raum ermitteln. Herkunft: NEU (vormals RAUM-F-060).

#### Scenario: Nächstgelegener freier Raum
- **WHEN** ein Referenzraum mit erfassten Laufwege-Daten angegeben ist
- **THEN** liefert das System den nächstgelegenen tatsächlich freien Raum

#### Scenario: Referenzraum ohne erfasste Laufwege-Daten
- **WHEN** der angegebene Referenzraum keine erfassten Laufwege-Daten hat
- **THEN** weist das System darauf hin, dass keine Nähe-Suche möglich ist, und bietet die allgemeine Suche nach freien Räumen an

### Requirement: Raum als besetzt melden

Das System muss der Nutzerin das Melden eines Raums als „besetzt" ermöglichen, unabhängig von dessen offiziellem Belegungsstatus. Herkunft: NEU (vormals RAUM-F-070). Bewusst ohne Konto; Missbrauchsschutz erfolgt analog Capability `identity-and-moderation` (IDENT-F-060) über Muster-/Häufigkeitserkennung.

#### Scenario: Besetzt-Meldung offline
- **WHEN** die Nutzerin einen Raum ohne Netzverbindung als besetzt meldet
- **THEN** reiht das System die Meldung in die lokale Offline-Warteschlange ein, statt sie zu verwerfen

### Requirement: Anzahl der Besetzt-Meldungen anzeigen

Das System muss zu jedem Raum die Anzahl der in einem begrenzten Zeitfenster eingegangenen „besetzt"-Meldungen anzeigen. Herkunft: NEU (vormals RAUM-F-080).

#### Scenario: Besetzt-Meldung erhöht die Anzeige
- **WHEN** eine gültige Besetzt-Meldung für einen Raum eingeht
- **THEN** erhöht sich die sichtbar angezeigte Meldungsanzahl dieses Raums

### Requirement: Freizeitpunkt eines freien Raums anzeigen

Das System muss zu jedem als frei ausgewiesenen Raum angeben, bis zu welchem Zeitpunkt er frei ist. Herkunft: Recherche: alte apps/android-fb4, service/RoomService.java, 2026-08-25 (vormals RAUM-F-090).

#### Scenario: Freizeitpunkt anzeigen
- **WHEN** ein Raum als frei ausgewiesen wird
- **THEN** zeigt das System an, bis zu welchem Zeitpunkt er frei ist

### Requirement: Größenklasse anzeigen und filtern

Das System muss zu jedem Raum dessen Größenklasse anzeigen und die Suche nach Größenklasse einschränkbar machen. Herkunft: Recherche: alte apps/android-fb4, assets/rooms.json, 2026-08-25 (vormals RAUM-F-100).

#### Scenario: Nach Größenklasse filtern
- **WHEN** die Nutzerin die Raumsuche auf eine Größenklasse einschränkt
- **THEN** zeigt das System nur Räume dieser Größenklasse an

### Requirement: E-Key-Zugänglichkeit kennzeichnen

Das System muss zu jedem Raum kennzeichnen, ob er mit einem E-Key zugänglich ist. Herkunft: Recherche: alte apps/android-fb4, assets/rooms.json, 2026-08-25 (vormals RAUM-F-110). Macht den Hinweis auf die Ausleihmöglichkeit aus Capability `e-key` (EKEY-F-010) konkret, dort wo er nützt.

#### Scenario: E-Key-Kennzeichen sichtbar
- **WHEN** ein Raum außerhalb der offiziellen Zeiten nur mit E-Key zugänglich ist
- **THEN** zeigt das System dieses Kennzeichen bei dem Raum an

### Requirement: Raumsuche auf kuratierte Liste beschränken

Das System muss die Raumsuche auf die vom FSR gepflegte Raumliste beschränken, statt jeden im Terminbestand vorkommenden Raum anzubieten. Herkunft: Recherche: alte apps/android-fb4, service/RoomService.java, 2026-08-25 (vormals RAUM-F-120). Nicht jeder im Terminbestand vorkommende Raum eignet sich für eine Lerngruppe; Pflege über Capability `admin`.

#### Scenario: Nicht kuratierter Raum kein Suchergebnis
- **WHEN** ein Raum im Terminbestand vorkommt, aber nicht auf der kuratierten Liste steht
- **THEN** erscheint er nicht als Ergebnis der Freie-Raum-Suche

### Requirement: Gepflegte Gebäudeschließzeit statt fester Wert

Falls für einen freien Raum kein nachfolgender Termin vorliegt, muss das System als Endzeitpunkt die gepflegte Gebäudeschließzeit verwenden, nicht einen fest im Quellcode hinterlegten Wert. Herkunft: Alt: bewusst verworfen (vormals RAUM-F-130). Die Android-Alt-App setzt pauschal 21:30 Uhr fest im Quellcode an; ein solcher Wert veraltet unbemerkt und ist nur per App-Update korrigierbar.

#### Scenario: Kein nachfolgender Termin
- **WHEN** für einen freien Raum kein nachfolgender Termin vorliegt
- **THEN** verwendet das System die serverseitig gepflegte Gebäudeschließzeit als Endzeitpunkt

### Requirement: Besetzt-Meldung zurückziehen

Solange die meldende Person dieselbe Gerätesitzung verwendet, muss das System ihr das Zurückziehen einer von ihr abgegebenen, noch aktiven Besetzt-Meldung ermöglichen. Herkunft: NEU (vormals RAUM-F-140). Analog zum Widerruf in Capability `event-volunteers` (HELFER-F-040) und Capability `canteen-ratings` (RATE-F-070); die Zuordnung bleibt geräteseitig, ohne Personenbezug.

#### Scenario: Eigene Meldung zurückziehen
- **WHEN** die meldende Person mit derselben Gerätesitzung ihre noch aktive Besetzt-Meldung zurückzieht
- **THEN** entfernt das System diese Meldung

### Requirement: Übersicht aller Räume mit Belegungszustand

Das System muss der Nutzerin eine Übersicht aller im Raumplan-Zwischenspeicher (INT-009) geführten Räume mit ihrem aktuellen Belegungszustand (frei oder belegt) anzeigen. Herkunft: NEU (vormals RAUM-F-150). Anders als die Freie-Raum-Suche nicht auf die kuratierte Liste beschränkt (Entscheidung FSR FB4, 2026-09-03).

#### Scenario: Übersicht zeigt alle Raumplan-Räume
- **WHEN** die Raumübersicht geöffnet wird
- **THEN** listet das System alle im Raumplan geführten Räume mit ihrem aktuellen Belegungszustand, auch solche außerhalb der kuratierten Liste

### Requirement: Laufende Veranstaltung bei belegtem Raum

Wenn ein Raum in der Übersicht als belegt ausgewiesen ist, dann muss das System die laufende Veranstaltung mit Bezeichnung und Endzeitpunkt anzeigen. Herkunft: NEU (vormals RAUM-F-160).

#### Scenario: Belegter Raum mit laufender Veranstaltung
- **WHEN** ein Raum in der Übersicht als belegt ausgewiesen ist
- **THEN** zeigt das System die laufende Veranstaltung mit Bezeichnung und Endzeitpunkt an

### Requirement: Freizeitpunkt bei freiem Raum in der Übersicht

Wenn ein Raum in der Übersicht als frei ausgewiesen ist, dann muss das System nach dem Requirement „Freizeitpunkt eines freien Raums anzeigen" angeben, bis wann er frei ist. Herkunft: NEU (vormals RAUM-F-170).

#### Scenario: Freier Raum in der Übersicht
- **WHEN** ein Raum in der Übersicht als frei ausgewiesen ist
- **THEN** zeigt das System an, bis wann er frei ist

### Requirement: Größenklasse und E-Key-Kennzeichen in der Übersicht

Sofern ein Raum der Übersicht zusätzlich auf der kuratierten Raumliste steht, muss das System dessen Größenklasse und E-Key-Kennzeichen mit anzeigen. Herkunft: NEU (vormals RAUM-F-180).

#### Scenario: Kuratierter Raum in der Übersicht
- **WHEN** ein in der Übersicht angezeigter Raum zusätzlich auf der kuratierten Liste steht
- **THEN** zeigt das System dessen Größenklasse und E-Key-Kennzeichen mit an

#### Scenario: Nicht kuratierter Raum in der Übersicht
- **WHEN** ein in der Übersicht angezeigter Raum nicht auf der kuratierten Liste steht
- **THEN** zeigt das System ihn ohne Größenklasse und E-Key-Kennzeichen an, ohne dies als Fehler zu behandeln

### Requirement: Besetzt-Meldung zusätzlich in der Übersicht anzeigen

Solange für einen Raum eine gültige Besetzt-Meldung vorliegt, muss das System dies in der Übersicht zusätzlich zum offiziellen Belegungszustand anzeigen. Herkunft: NEU (vormals RAUM-F-190).

#### Scenario: Gültige Besetzt-Meldung in der Übersicht
- **WHEN** für einen offiziell freien Raum eine gültige Besetzt-Meldung vorliegt
- **THEN** zeigt die Übersicht diese Meldung zusätzlich zum offiziellen Belegungszustand an

### Requirement: Ansicht laufender Veranstaltungen

Das System muss der Nutzerin eine Ansicht der aktuell laufenden Veranstaltungen bereitstellen, abgeleitet aus der Belegung der Räume des Raumplans. Herkunft: NEU (vormals RAUM-F-200).

#### Scenario: Keine laufende Veranstaltung
- **WHEN** aktuell kein Raum des Raumplans belegt ist
- **THEN** zeigt das System den Hinweis, dass gerade keine erfasste Veranstaltung stattfindet

### Requirement: Raum, Bezeichnung und Endzeitpunkt je laufender Veranstaltung

Das System muss zu jeder laufenden Veranstaltung Raum, Bezeichnung und Endzeitpunkt anzeigen. Herkunft: NEU (vormals RAUM-F-210).

#### Scenario: Laufende Veranstaltung mit Details
- **WHEN** eine Veranstaltung aktuell läuft
- **THEN** zeigt das System dazu Raum, Bezeichnung und Endzeitpunkt an

### Requirement: Freitextfeld eines Raumplan-Termins anzeigen

Sofern ein Raumplan-Termin ein gesetztes Freitextfeld `note` (INT-009) trägt, muss das System dessen Inhalt bei diesem Termin anzeigen. Herkunft: NEU (vormals RAUM-F-220).

#### Scenario: Termin mit gesetztem Freitextfeld
- **WHEN** ein Raumplan-Termin ein gesetztes Feld `note` trägt
- **THEN** zeigt das System dessen Inhalt unverändert bei diesem Termin an

### Requirement: Wechsel zwischen den drei Sichten

Das System muss der Nutzerin den Wechsel zwischen Freie-Raum-Suche, Raumübersicht und Ansicht laufender Veranstaltungen innerhalb des Raum-Bereichs ermöglichen, ohne den Bereich zu verlassen. Herkunft: NEU (vormals RAUM-F-230).

#### Scenario: Sicht wechseln
- **WHEN** die Nutzerin innerhalb des Raum-Bereichs zwischen den drei Sichten wechselt
- **THEN** bleibt sie im Raum-Bereich, ohne zu einem anderen Tab zu navigieren

### Requirement: Übersicht nach Belegungszustand einschränken

Das System muss der Nutzerin das Einschränken der Raumübersicht auf einen Belegungszustand (frei oder belegt) ermöglichen. Herkunft: NEU (vormals RAUM-F-240).

#### Scenario: Übersicht ohne passenden Raum
- **WHEN** kein Raum dem gesetzten Belegungszustands-Filter entspricht
- **THEN** zeigt das System den Hinweis „kein Raum im gewählten Zustand" mit einem Weg, den Filter zurückzusetzen

### Requirement: Suche nach Raumkennung in der Übersicht

Das System muss der Nutzerin das Suchen nach einer Raumkennung innerhalb der Raumübersicht ermöglichen. Herkunft: NEU (vormals RAUM-F-245).

#### Scenario: Raumkennung in der Übersicht suchen
- **WHEN** die Nutzerin eine Raumkennung in die Übersichtssuche eingibt
- **THEN** zeigt das System die dazu passenden Räume an

### Requirement: Tagesbelegung aus Übersicht oder laufenden Veranstaltungen öffnen

Wenn die Nutzerin in der Raumübersicht oder in der Ansicht laufender Veranstaltungen einen Raum auswählt, dann muss das System dessen Tagesbelegung nach dem Requirement „Belegung eines gewählten Raums anzeigen" anzeigen. Herkunft: NEU (vormals RAUM-F-250).

#### Scenario: Raum aus der Übersicht auswählen
- **WHEN** die Nutzerin in der Raumübersicht einen Raum auswählt
- **THEN** zeigt das System dessen Tagesbelegung an

### Requirement: Alter eines veralteten Raumplan-Stands anzeigen

Falls der Raumplan-Zwischenspeicher älter als die vorgesehene Aktualisierungsfrequenz ist, muss das System das Alter des Stands in Raumübersicht und Ansicht laufender Veranstaltungen sichtbar anzeigen. Herkunft: NEU (vormals RAUM-F-260).

#### Scenario: Veralteter Zwischenspeicher
- **WHEN** der Raumplan-Zwischenspeicher älter als die vorgesehene Aktualisierungsfrequenz ist
- **THEN** zeigt das System dessen Alter sichtbar an, statt ihn kommentarlos als aktuell darzustellen

## Entfallene Anforderungen (historisch)

- **RAUM-F-040** — Das System muss die für die Raumsuche verwendeten Rohtermine serverseitig (Backend, INT-008) aggregieren, nicht durch eine clientseitige Abfrage aller Studiengang/Semester-Kombinationen. Herkunft: NEU. Status: entfallen. Grund: Beruhte auf der Annahme, es gebe keinen Endpunkt, der Raumtermine vollständig liefert. Die Auswertung des Android-Quellcodes am 2026-08-25 widerlegt das — `Room/*/AllEvents` liefert alle Raumtermine in einem Aufruf. Ersetzt durch das Requirement „Raumtermine über den Backend-Zwischenspeicher beziehen".
- **RAUM-N-010** — Solange nicht verifiziert ist, dass INT-009 alle Räume des Fachbereichs abdeckt, muss das Backend die Raumbelegung zusätzlich aus der Aggregation von INT-001/INT-002 herleiten können, um Lücken in INT-009 abzudecken. Herkunft: Recherche: INT-009, 2026-08-24. Status: entfallen. Grund: dieselbe Widerlegung wie bei RAUM-F-040 — die Platzhalter-Form deckt alle Räume in einem Aufruf ab, eine Lückenfüllung über INT-001/INT-002 ist gegenstandslos.

## Erläuterungen

**Korrektur vom 2026-08-25.** Bis zur Auswertung des Android-Quellcodes führte diese Spec die Raumsuche als vollständige Neuentwicklung ohne Vorbild in den Alt-Apps. Das war falsch: Die Android-Alt-App enthält eine vollwertige Raumsuche (`specs/product/legacy-inventory.md`, AND-014 bis AND-016) und ist damit der zu übertreffende Stand. Die Herkunftsmarkierungen wurden von `NEU` auf den tatsächlichen Befund korrigiert, wo ein Vorbild besteht.

**Erweiterung vom 2026-09-03.** Neben der Suche nach einem freien Raum brauchen Studierende zwei weitere Blickrichtungen auf dieselben Raumtermine: eine Übersicht aller Räume mit ihrer aktuellen Belegung und deren Umkehrung, eine Ansicht der gerade laufenden Veranstaltungen. Beide leiten sich ohne zusätzliche Schnittstelle aus dem Raumplan-Zwischenspeicher (INT-009) ab. Der daraus ebenfalls mögliche Abgleich „mein Stundenplan-Termin gegen den Raumplan" ist in Capability `schedule` (SCHED-F-410 bis SCHED-F-450) verortet, weil er im Stundenplan angezeigt wird, nicht hier.

**Nicht-Scope.** Raumbuchung/-reservierung (FBWS ist rein lesend), persönlicher Stundenplan (Capability `schedule`), Navigation/Wegbeschreibung im Gebäude, Geräte-Standortzugriff (GPS — bewusst nicht genutzt, Entscheidung FSR FB4, 2026-08-25, stattdessen manuelle Referenzraum-Eingabe mit serverseitigen Laufwege-Daten), Lokalisierung über WLAN-Access-Points (möglicher künftiger Ausbauschritt, nicht Teil dieses Umfangs), Hinweis auf Raumänderung/Ausfall am Stundenplan-Eintrag (Capability `schedule`, SCHED-F-410 ff.).

**Kuratierte Raumliste.** Die Android-Alt-App führt eine gepflegte Liste von 19 Räumen mit je einer Größenklasse (klein, mittel, groß) und einem Kennzeichen für E-Key-Zugänglichkeit; der Terminbestand liefert nur die Belegung dazu. Nicht jeder Raum im Terminbestand eignet sich für eine Lerngruppe — Hörsäle, Labore und Räume anderer Fachbereiche sind keine sinnvollen Suchergebnisse. Pflege über die Verwaltungsoberfläche (Capability `admin`), Auslieferung über das Backend (Capability `backend-and-api`, API-F-230).

## Datenmodell

Raum-Stammdaten (vom FSR gepflegt, serverseitig): `roomId`, Größenklasse (klein/mittel/groß), E-Key-Zugänglichkeit, Gebäudeschließzeit. Raumtermin (Zwischenspeicher, serverseitig): Felder wie in Capability `integrations` (INT-009) dokumentiert. Freier-Raum-Ergebnis (berechnet): `roomId`, frei bis, Größenklasse, E-Key-Zugänglichkeit. Laufwege (vom FSR gepflegt, serverseitig): Paar aus zwei `roomId`, Distanz-/Gewichtsmaß — genaues Format offen, siehe Offene Fragen. Besetzt-Meldung: `roomId`, Zeitstempel, keine Personen- oder Konto-Referenz.

Raumstatus (berechnet, serverseitig): `roomId`, Belegungszustand (frei/belegt), laufender Termin (optional: Bezeichnung, Endzeitpunkt), nächster Termin (optional: Bezeichnung, Beginn), Anzahl gültiger Besetzt-Meldungen; Größenklasse und E-Key-Zugänglichkeit nur für Räume der kuratierten Liste. Laufende Veranstaltung (berechnet): `roomId`, Bezeichnung, Endzeitpunkt — die nach Veranstaltung gruppierte Sicht auf die belegten Räume.

## Externe Schnittstellen

Nutzt INT-009 (Raumplan, Platzhalter-Form über alle Räume) über das eigene Backend INT-008. INT-001 und INT-002 werden für die Raumsuche nicht mehr verwendet. Raumübersicht und Ansicht laufender Veranstaltungen nutzen denselben Zwischenspeicher, kein zusätzlicher externer Abruf. Laufwege-Datenstruktur und Besetzt-Meldungen sind rein interne Backend-Ressourcen ohne externe Schnittstelle. Keine Endpunktdetails hier — siehe Capability `integrations` und `api-contract.yaml`.

## UI-Flows & Zustände

| Zustand | Verhalten |
|---|---|
| Laden | Ladeanzeige während der Backend-Abfrage |
| Leer (keine freien Räume zum gewählten Zeitpunkt) | Hinweis „keine freien Räume gefunden", Vorschlag eines nahegelegenen Zeitfensters |
| Leer (kein freier Raum in Laufweg-Reichweite des Referenzraums) | Hinweis, dass kein naher freier Raum gefunden wurde, Angebot der allgemeinen Raumsuche als Rückfalloption |
| Fehler | Fehlermeldung mit Wiederholen-Option |
| Offline | Raumsuche als nicht verfügbar kennzeichnen (siehe Capability `architecture`, ARCH-F-110), Ausnahme beim Melden als „besetzt" |
| Raumübersicht / laufende Veranstaltungen: Laden | Ladeanzeige während der Backend-Abfrage |
| Raumübersicht: kein Raum entspricht dem gesetzten Filter | Hinweis „kein Raum im gewählten Zustand", Filter zurücksetzbar |
| Laufende Veranstaltungen: aktuell keine | Hinweis „gerade findet keine erfasste Veranstaltung statt" |
| Raumplan-Stand veraltet | Alter des Stands sichtbar anzeigen, beide Sichten bleiben nutzbar |

## Offline-Verhalten

Die Raumsuche ist laut Capability `architecture` (ARCH-F-110) der einzige Kernbereich ohne Offline-Verfügbarkeit, da das Ergebnis von der aktuellen Backend-Aggregation abhängt. Dasselbe gilt für Raumübersicht und Ansicht laufender Veranstaltungen — beide hängen am aktuellen Zwischenspeicher-Stand und werden offline als nicht verfügbar gekennzeichnet. Ausnahme: Eine Besetzt-Meldung lässt sich auch offline abgeben und wird gemäß Capability `architecture` (ARCH-F-120) und Capability `data-and-storage` (DATA-F-100) in die lokale Offline-Warteschlange eingereiht.

## Fehlerfälle

| Fall | Reaktion |
|---|---|
| Angefragte Raumkennung existiert nicht in den Quelldaten | Hinweis „Raum unbekannt", keine Fehlermeldung wie bei einem technischen Ausfall |
| Backend-Aggregation veraltet (älter als die vorgesehene Aktualisierungsfrequenz) | Alter der Daten sichtbar anzeigen statt unkommentiert als aktuell auszugeben |
| Als Referenzraum angegebener Raum hat keine erfassten Laufwege-Daten | Hinweis, dass für diesen Raum keine Nähe-Suche möglich ist, Angebot der allgemeinen Raumsuche |
| Massenhafte Besetzt-Meldungen von derselben Quelle in kurzer Zeit | Zur Prüfung markiert, analog Capability `identity-and-moderation` (IDENT-F-060) |
| Raum aus dem Raumplan ist nicht in der kuratierten Liste | In der Übersicht dennoch anzeigen, ohne Größenklasse/E-Key-Kennzeichen — kein Fehler |
| Raumplan-Termin ohne auswertbare Zeitangabe | Termin in Übersicht und Ansicht laufender Veranstaltungen überspringen, Vorfall protokollieren (Capability `security-and-privacy`, SEC-F-060), übrige Räume normal anzeigen |

## Nicht-funktionale Anforderungen

Keine über Capability `non-functional` hinausgehenden Anforderungen.

## Bewusst nicht übernommenes Altverhalten

- Fest im Quellcode hinterlegte Schließzeit von 21:30 Uhr für Räume ohne nachfolgenden Termin — Grund: veraltet unbemerkt und ist nur per App-Update korrigierbar, siehe Requirement „Gepflegte Gebäudeschließzeit statt fester Wert".
- Ermittlung der freien Räume unmittelbar aus dem Hochschulsystem heraus in der App — Grund: macht die Raumsuche vom Hochschulsystem abhängig und verhindert einen Ausfallpuffer, siehe Requirement „Raumtermine über den Backend-Zwischenspeicher beziehen".

## Offene Fragen

- Aktualisierungsfrequenz des serverseitigen Abrufs: 15 Minuten (Arbeitsziel, konsistent mit Capability `data-and-storage` Abschnitt 4).
- Herkunft der Größenklassen und Gebäudeschließzeiten für die Raumliste: eingeschätzt 2026-08-26 (FSR FB4) als vermutlich noch aktuell, keine Vollprüfung vor Übernahme vorgesehen; Korrektur bei Bedarf über die Verwaltungsoberfläche (Capability `admin`).
- Herkunft der Laufwege-Datenstruktur: geklärt 2026-08-26 — ein früherer Lageplan existierte, ist aber nicht mehr erreichbar; die Daten müssen von Hand erstellt und über die Laufwege-Verwaltung in Capability `admin` (ADMIN-F-090) gepflegt werden. Detailgrad: ein Nachbarschaftsgraph mit Fußweg-Minuten als Gewicht, grobe Etage-/Gebäude-Granularität.
- Zeitfenster, nach dem eine Besetzt-Meldung verfällt: 90 Minuten (Arbeitsziel).
- Lokalisierung über WLAN-Access-Points: eigenständiges Infrastrukturvorhaben, bei Bedarf als spätere Erweiterung zu behandeln, nicht Teil des aktuellen Umfangs.
- Bildet INT-009 kurzfristige Ausfälle und Raumänderungen ab oder nur den Sollplan? Bestimmt, wie belastbar die Ansicht laufender Veranstaltungen und der Stundenplan-Abgleich (Capability `schedule`, SCHED-F-410 ff.) sind. Vor Umsetzung als Spike zu klären.
- Tab-Label und -Symbol des Raum-Bereichs: bleibt „Raumsuche" (Capability `app-shell`, SHELL-F-060, Capability `ux-and-theming`) oder wird zu „Räume" — SHELL-Entscheidung, nicht hier.
- Zeitpunkt-Bezug der Raumübersicht: nur „jetzt" oder frei wählbar wie bei der Freie-Raum-Suche? Für den ersten Umfang „jetzt" angenommen.
