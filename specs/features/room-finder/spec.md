---
id: room-finder
titel: Raumsuche
praefix: RAUM
status: accepted
prioritaet: kern
version: 1.0.0
owner: FSR FB4
last_reviewed: 2026-08-25
derived_from:
  - alte apps/android-fb4/FB4/fB4/src/main/java/de/fsrfb4/fb4/service/RoomService.java
  - alte apps/android-fb4/FB4/fB4/src/main/java/de/fsrfb4/fb4/fragments/roomsearch/RoomSearchFragment.java
  - alte apps/android-fb4/FB4/fB4/src/main/assets/rooms.json
implemented_in: []
related:
  - ../../platform/architecture.md
  - ../../platform/integrations.md
  - ../../platform/backend-and-api.md
  - ../../platform/non-functional.md
  - ../../platform/identity-and-moderation.md
  - ../../platform/data-and-storage.md
  - ../schedule/spec.md
  - ../e-key/spec.md
---

# Raumsuche

## 1. Zweck & Nutzen

Studierende und Lehrende suchen wiederkehrend nach einem freien Raum (z. B. für Lerngruppen) oder nach der Belegung eines bekannten Raums.

**Korrektur vom 2026-08-25.** Bis zur Auswertung des Android-Quellcodes führte diese Spec die Raumsuche als vollständige Neuentwicklung ohne Vorbild in den Alt-Apps. Das war falsch: Die Android-Alt-App enthält eine vollwertige Raumsuche (`product/legacy-inventory.md`, AND-014 bis AND-016) und ist damit der zu übertreffende Stand. Sie führt eine kuratierte Liste von 19 Räumen mit Raumgröße und E-Key-Eignung, ermittelt die Belegung aus einem einzigen Aufruf über alle Räume und gibt zu jedem freien Raum an, bis wann er frei ist. Die Anforderungen dieser Spec sind entsprechend nachgezogen; die Herkunftsmarkierungen wurden von `NEU` auf den tatsächlichen Befund korrigiert, wo ein Vorbild besteht.

Zwei Annahmen sind damit ebenfalls hinfällig geworden. Erstens war unklar, ob ein raumbezogener Endpunkt alle Räume abdeckt — er tut es, in der Platzhalter-Form `Room/*/AllEvents` (INT-009). Zweitens war eine serverseitige Zusammenführung über alle Studiengang/Semester-Kombinationen vorgesehen — sie entfällt ersatzlos, das Backend hält die Rohtermine nur noch als Zwischenspeicher vor.

## 2. Scope / Nicht-Scope

### Scope

- Anzeige der Belegung eines einzelnen, per Kennung gewählten Raums für den aktuellen Tag bzw. die aktuelle Woche.
- Suche nach zu einem Zeitpunkt freien Räumen.
- Hinweis auf die Möglichkeit, beim FSR einen E-Key für Zugang außerhalb offizieller Zeiten auszuleihen — Anforderung und Umsetzung in `features/e-key/spec.md` (EKEY-F-010), hier nur als Scope-Berührungspunkt vermerkt.
- Nächstgelegenen freien Raum zu einem von der Nutzerin manuell angegebenen Referenzraum ermitteln, auf Basis einer vom FSR gepflegten Laufwege-Datenstruktur (kein Geräte-Standortzugriff).
- Melden eines Raums als „besetzt" durch Studierende, unabhängig vom offiziellen Belegungsstatus, mit Anzeige der Meldungsanzahl.

### Nicht-Scope

- Raumbuchung oder -reservierung — die FBWS-Schnittstellen sind rein lesend, eine Buchungsfunktion würde ein Schreibrecht am Hochschulsystem voraussetzen, das nicht vorliegt.
- Persönlicher Stundenplan — siehe `features/schedule/spec.md`.
- Navigation/Wegbeschreibung innerhalb des Gebäudes — nicht Teil des aktuellen Umfangs.
- Geräte-Standortzugriff (GPS) — bewusst nicht genutzt; die Nähe zu einem freien Raum wird über eine manuelle Referenzraum-Eingabe und serverseitige Laufwege-Daten ermittelt, nicht über Gerätestandort (Entscheidung FSR FB4, 2026-08-25).
- Lokalisierung über im Gebäude verteilte WLAN-Access-Points — vom FSR als möglicher künftiger Ausbauschritt benannt, ausdrücklich nicht Teil dieses Umfangs (siehe Abschnitt 13).

## 3. Nutzergeschichten

- Als Studierende möchte ich sehen, ob ein bestimmter Raum gerade belegt ist, damit ich ihn für eine Lerngruppe nutzen kann.
- Als Studierende möchte ich einen freien Raum zu einer bestimmten Uhrzeit finden, ohne jeden Raum einzeln nachzuschlagen.
- Als Studierende möchte ich angeben, vor welchem Raum ich gerade stehe, damit mir der nächstgelegene freie Raum vorgeschlagen wird, statt selbst Entfernungen abschätzen zu müssen.
- Als Studierende möchte ich einen Raum als besetzt melden können, wenn die offizielle Auskunft nicht der Realität entspricht, damit andere sich nicht umsonst auf den Weg machen.

## 4. Funktionale Anforderungen

| ID | Anforderung | Herkunft |
|---|---|---|
| RAUM-F-010 | Das System muss der Nutzerin die Anzeige der Belegung eines per Kennung gewählten Raums für den aktuellen Tag ermöglichen. | Android: unbekannt |
| RAUM-F-020 | Das System muss der Nutzerin die Suche nach zu einem gewählten Zeitraum freien Räumen ermöglichen. | Recherche: alte apps/android-fb4, service/RoomService.java, 2026-08-25 |
| RAUM-F-030 | Das System muss einen Raum als belegt kennzeichnen, wenn zum abgefragten Zeitpunkt ein Termin mit diesem `roomId` existiert, unabhängig davon, ob der Termin vom Typ `Course` oder `Event` (z. B. Prüfung) ist. | NEU |
| ~~RAUM-F-040~~ | ~~Das System muss die für die Raumsuche verwendeten Rohtermine serverseitig (Backend, INT-008) aggregieren, nicht durch eine clientseitige Abfrage aller Studiengang/Semester-Kombinationen.~~ — entfallen | NEU |
| RAUM-F-045 | Das System muss die Raumtermine über den Zwischenspeicher des Backends (INT-008) beziehen, das sie seinerseits über den Platzhalter-Aufruf aus INT-009 abruft. | Recherche: alte apps/android-fb4, retrofit/TimetableApi.java, 2026-08-25 |
| ~~RAUM-N-010~~ | ~~Solange nicht verifiziert ist, dass INT-009 alle Räume des Fachbereichs abdeckt, muss das Backend die Raumbelegung zusätzlich aus der Aggregation von INT-001/INT-002 herleiten können, um Lücken in INT-009 abzudecken.~~ — entfallen | Recherche: INT-009, 2026-08-24 |
| RAUM-F-050 | Das System muss der Nutzerin die Eingabe eines Referenzraums ermöglichen, vor dem sie sich gerade befindet. | NEU |
| RAUM-F-060 | Wenn ein Referenzraum angegeben ist, muss das System anhand der serverseitig gepflegten Laufwege-Datenstruktur den nächstgelegenen freien Raum ermitteln. | NEU |
| RAUM-F-070 | Das System muss der Nutzerin das Melden eines Raums als „besetzt" ermöglichen, unabhängig von dessen offiziellem Belegungsstatus. | NEU |
| RAUM-F-080 | Das System muss zu jedem Raum die Anzahl der in einem begrenzten Zeitfenster eingegangenen „besetzt"-Meldungen anzeigen. | NEU |
| RAUM-F-090 | Das System muss zu jedem als frei ausgewiesenen Raum angeben, bis zu welchem Zeitpunkt er frei ist. | Recherche: alte apps/android-fb4, service/RoomService.java, 2026-08-25 |
| RAUM-F-100 | Das System muss zu jedem Raum dessen Größenklasse anzeigen und die Suche nach Größenklasse einschränkbar machen. | Recherche: alte apps/android-fb4, assets/rooms.json, 2026-08-25 |
| RAUM-F-110 | Das System muss zu jedem Raum kennzeichnen, ob er mit einem E-Key zugänglich ist. | Recherche: alte apps/android-fb4, assets/rooms.json, 2026-08-25 |
| RAUM-F-120 | Das System muss die Raumsuche auf die vom FSR gepflegte Raumliste beschränken, statt jeden im Terminbestand vorkommenden Raum anzubieten. | Recherche: alte apps/android-fb4, service/RoomService.java, 2026-08-25 |
| RAUM-F-130 | Falls für einen freien Raum kein nachfolgender Termin vorliegt, muss das System als Endzeitpunkt die gepflegte Gebäudeschließzeit verwenden, nicht einen fest im Quellcode hinterlegten Wert. | Alt: bewusst verworfen |

### Erläuterungen

**`RAUM-F-050`/`RAUM-F-060`** — Entscheidung FSR FB4, 2026-08-25: Statt Geräte-Standortzugriff (GPS) gibt die Nutzerin manuell den Raum an, vor dem sie steht; das Backend ermittelt daraus über eine vom FSR gepflegte Laufwege-Datenstruktur (Distanzen/Nachbarschaften zwischen Räumen) den nächstgelegenen freien Raum. Herkunft, Pflegeweg und Detailgrad dieser Datenstruktur sind offen, siehe Abschnitt 13. Eine echte Lokalisierung über im Gebäude verteilte WLAN-Access-Points ist als möglicher künftiger Ausbauschritt benannt, aber explizit nicht Teil dieses Umfangs (siehe Abschnitt 2, Nicht-Scope).

**`RAUM-F-070`/`RAUM-F-080`** — Ergänzt die offizielle FBWS-Belegungsauskunft um ein von Studierenden getragenes Stimmungsbild, ähnlich einer Crowd-Meldung. Bewusst ohne Konto (siehe `decisions/0004-identitaet-und-anmeldung.md`, das nur RATE-Schreiben und EKEY kontopflichtig macht) — Missbrauchsschutz erfolgt analog `platform/identity-and-moderation.md` (IDENT-F-060) über Muster-/Häufigkeitserkennung je Gerät/Quelle, nicht über Identitätsprüfung. „Begrenztes Zeitfenster" verhindert, dass veraltete Meldungen unbegrenzt fortwirken; konkreter Wert offen, siehe Abschnitt 13.

**`RAUM-F-040` und `RAUM-N-010` (entfallen).** Beide beruhten auf der Annahme, es gebe keinen Endpunkt, der Raumtermine vollständig liefert, weshalb die Termine aller Studiengang/Semester-Kombinationen zusammengeführt werden müssten. Die Auswertung des Android-Quellcodes am 2026-08-25 widerlegt das: `Room/*/AllEvents` liefert alle Raumtermine in einem Aufruf und ist dort produktiv im Einsatz. Ersetzt durch RAUM-F-045, das nur noch den Bezugsweg über den Zwischenspeicher des Backends festlegt. Siehe `platform/architecture.md` ARCH-F-045 und `platform/backend-and-api.md` API-F-045.

**`RAUM-F-100`/`RAUM-F-110`/`RAUM-F-120` — kuratierte Raumliste statt aller Räume.** Die Android-Alt-App führt eine gepflegte Liste von 19 Räumen mit je einer Größenklasse (klein, mittel, groß) und einem Kennzeichen für E-Key-Zugänglichkeit; der Terminbestand liefert nur die Belegung dazu. Dieser Zuschnitt ist übernehmenswert und fachlich begründet: Nicht jeder Raum, in dem eine Veranstaltung stattfindet, eignet sich für eine Lerngruppe — Hörsäle, Labore und Räume anderer Fachbereiche tauchen im Terminbestand auf, sind aber keine sinnvollen Suchergebnisse. Die Größenklasse beantwortet zudem die Frage, die bei einer Lerngruppe zuerst gestellt wird, nämlich ob der Raum für die Gruppe passt. Die Pflege dieser Liste erfolgt über die Verwaltungsoberfläche (`../admin/spec.md`), die Auslieferung über das Backend (`platform/backend-and-api.md` API-F-230).

**`RAUM-F-110` — Zusammenhang mit EKEY.** Das Kennzeichen macht EKEY-F-010 konkret: Der Hinweis auf die Ausleihmöglichkeit erscheint nicht pauschal, sondern dort, wo er etwas nützt — bei einem Raum, der ohne E-Key außerhalb der offiziellen Zeiten nicht zugänglich ist.

**`RAUM-F-130` — Gebäudeschließzeit.** Die Android-Alt-App setzt für einen Raum ohne nachfolgenden Termin pauschal 21:30 Uhr als Endzeitpunkt an, im Quellcode selbst als offener Punkt markiert (`service/RoomService.java`, dokumentiert als N-004 in `product/legacy-inventory.md`). Ein fest im Quellcode stehender Wert veraltet unbemerkt, sobald sich Öffnungszeiten ändern, und ist nur mit einem App-Update über drei Vertriebswege korrigierbar. Die Angabe gehört deshalb zu den gepflegten Stammdaten.

## 5. Datenmodell

Raum-Stammdaten (vom FSR gepflegt, serverseitig): `roomId`, Größenklasse (klein/mittel/groß), E-Key-Zugänglichkeit, Gebäudeschließzeit. Raumtermin (Zwischenspeicher, serverseitig): Felder wie in INT-009 dokumentiert. Freier-Raum-Ergebnis (berechnet): `roomId`, frei bis (RAUM-F-090), Größenklasse, E-Key-Zugänglichkeit. Laufwege (vom FSR gepflegt, serverseitig): Paar aus zwei `roomId`, Distanz-/Gewichtsmaß — genaues Format offen, siehe Abschnitt 13. Besetzt-Meldung: `roomId`, Zeitstempel, keine Personen- oder Konto-Referenz.

## 6. Externe Schnittstellen

Nutzt INT-009 (Raumplan, Platzhalter-Form über alle Räume) über das eigene Backend INT-008. INT-001 und INT-002 werden für die Raumsuche nicht mehr verwendet. Laufwege-Datenstruktur und Besetzt-Meldungen sind rein interne Backend-Ressourcen ohne externe Schnittstelle. Keine Endpunktdetails hier — siehe `platform/integrations.md`.

## 7. UI-Flows & Zustände

| Zustand | Verhalten |
|---|---|
| Laden | Ladeanzeige während der Backend-Abfrage |
| Leer (keine freien Räume zum gewählten Zeitpunkt) | Hinweis „keine freien Räume gefunden", Vorschlag eines nahegelegenen Zeitfensters |
| Leer (kein freier Raum in Laufweg-Reichweite des Referenzraums) | Hinweis, dass kein naher freier Raum gefunden wurde, Angebot der allgemeinen Raumsuche (RAUM-F-020) als Rückfalloption |
| Fehler | Fehlermeldung mit Wiederholen-Option |
| Offline | Raumsuche als nicht verfügbar kennzeichnen (siehe `platform/architecture.md` ARCH-F-110), siehe Abschnitt 8 für die Ausnahme beim Melden als „besetzt" |

## 8. Offline-Verhalten

Die Raumsuche ist laut `platform/architecture.md` (ARCH-F-110) der einzige Kernbereich ohne Offline-Verfügbarkeit, da das Ergebnis von der aktuellen Backend-Aggregation abhängt. Diese Spec übernimmt das unverändert. Ausnahme: Eine Besetzt-Meldung (RAUM-F-070) lässt sich auch offline abgeben und wird gemäß `platform/architecture.md` (ARCH-F-120) und `platform/data-and-storage.md` (DATA-F-100) in die lokale Offline-Warteschlange eingereiht — die Nutzerin kennt den Belegungsstatus vor Ort auch ohne aktuelle Backend-Daten.

## 9. Fehlerfälle

| Fall | Reaktion |
|---|---|
| Angefragte Raumkennung existiert nicht in den Quelldaten | Hinweis „Raum unbekannt", keine Fehlermeldung wie bei einem technischen Ausfall |
| Backend-Aggregation veraltet (älter als die vorgesehene Aktualisierungsfrequenz) | Alter der Daten sichtbar anzeigen statt unkommentiert als aktuell auszugeben |
| Als Referenzraum angegebener Raum hat keine erfassten Laufwege-Daten | Hinweis, dass für diesen Raum keine Nähe-Suche möglich ist, Angebot der allgemeinen Raumsuche (RAUM-F-020) |
| Massenhafte Besetzt-Meldungen von derselben Quelle in kurzer Zeit | Zur Prüfung markiert, analog `platform/identity-and-moderation.md` IDENT-F-060 |

## 10. Nicht-funktionale Anforderungen

Keine über `platform/non-functional.md` hinausgehenden Anforderungen.

## 11. Akzeptanzkriterien

- Für einen bekannten, aktuell belegten Raum zeigt die Suche den Raum korrekt als belegt, einschließlich Prüfungsterminen.
- Zu jedem als frei ausgewiesenen Raum ist erkennbar, bis wann er frei ist, welche Größenklasse er hat und ob er mit E-Key zugänglich ist (RAUM-F-090 bis RAUM-F-110).
- Für ein gewähltes Zeitfenster ohne belegte Räume liefert die Suche eine nachvollziehbare Leermeldung statt eines Fehlers.
- Für einen gültigen Referenzraum mit erfassten Laufwege-Daten liefert die Nähe-Suche den nächstgelegenen tatsächlich freien Raum.
- Eine Besetzt-Meldung erhöht sichtbar die Meldungsanzahl des betroffenen Raums, auch wenn sie offline abgegeben wurde.

## 12. Bewusst nicht übernommenes Altverhalten

- Fest im Quellcode hinterlegte Schließzeit von 21:30 Uhr für Räume ohne nachfolgenden Termin — Grund: veraltet unbemerkt und ist nur per App-Update korrigierbar, siehe RAUM-F-130.
- Ermittlung der freien Räume unmittelbar aus dem Hochschulsystem heraus in der App — Grund: macht die Raumsuche vom Hochschulsystem abhängig und verhindert einen Ausfallpuffer, siehe RAUM-F-045.

## 13. Offene Fragen

- ~~Deckt INT-009 alle Räume des Fachbereichs ab?~~ Beantwortet am 2026-08-25: Die Platzhalter-Form liefert alle Räume in einem Aufruf, siehe INT-009.
- Aktualisierungsfrequenz des serverseitigen Abrufs: 15 Minuten (Arbeitsziel, konsistent mit `platform/data-and-storage.md` Abschnitt 4).
- Herkunft der Größenklassen und Gebäudeschließzeiten für die Raumliste: Die Android-Alt-App liefert 19 Räume mit Größenklasse und E-Key-Kennzeichen als Ausgangsbestand mit (`assets/rooms.json`); ob diese Liste noch aktuell und vollständig ist, klärt der FSR bei Übernahme in die Stammdatenpflege.
- Herkunft der Laufwege-Datenstruktur (RAUM-F-060): Ein bestehender Lageplan ist nutzbar (Entscheidung FSR FB4, 2026-08-25) — konkrete Quelle (z. B. auf `fsrfb4.de` oder von der FH bereitgestellt) sowie Format und Verfahren zur Ableitung der Nachbarschaftsdaten daraus bei Umsetzung mit dem FSR zu klären.
- Detailgrad der Laufwege-Daten: Arbeitsziel ein Nachbarschaftsgraph zwischen Räumen mit Fußweg-Minuten als Gewicht (grobe Etage/Gebäude-Granularität statt exakter Gänge, da einfacher manuell zu pflegen) — zu bestätigen, sobald die vorige Frage geklärt ist.
- Zeitfenster, nach dem eine Besetzt-Meldung verfällt (RAUM-F-080): 90 Minuten (Arbeitsziel, zwischen einer einzelnen Unterrichtseinheit und einem vollen Vormittag).
- Lokalisierung über WLAN-Access-Points (Schritt 3 des vom FSR skizzierten Ausbaus, siehe Abschnitt 2 Nicht-Scope): eigenständiges Infrastrukturvorhaben, bei Bedarf als spätere Erweiterung dieser Spec zu behandeln, nicht Teil des aktuellen Umfangs.
