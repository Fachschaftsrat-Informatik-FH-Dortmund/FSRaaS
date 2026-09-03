---
id: room-finder
titel: Raumsuche
praefix: RAUM
status: accepted
prioritaet: kern
version: 1.2.0
owner: FSR FB4
last_reviewed: 2026-09-03
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

**Erweiterung vom 2026-09-03.** Neben der Suche nach einem freien Raum brauchen Studierende zwei weitere Blickrichtungen auf dieselben Raumtermine: eine Übersicht *aller* Räume mit ihrer aktuellen Belegung („welche Räume sind gerade frei, was läuft wo") und deren Umkehrung, eine Ansicht der *gerade laufenden Veranstaltungen*. Beide leiten sich ohne zusätzliche Schnittstelle aus dem Raumplan-Zwischenspeicher (INT-009) ab. Der daraus ebenfalls mögliche Abgleich „mein Stundenplan-Termin gegen den Raumplan" — Hinweis bei abweichendem Raum oder fehlender Zuordnung — ist in `../schedule/spec.md` (SCHED-F-410 bis SCHED-F-450) verortet, weil er im Stundenplan angezeigt wird, nicht hier.

## 2. Scope / Nicht-Scope

### Scope

- Anzeige der Belegung eines einzelnen, per Kennung gewählten Raums für den aktuellen Tag bzw. die aktuelle Woche.
- Suche nach zu einem Zeitpunkt freien Räumen.
- Hinweis auf die Möglichkeit, beim FSR einen E-Key für Zugang außerhalb offizieller Zeiten auszuleihen — Anforderung und Umsetzung in `features/e-key/spec.md` (EKEY-F-010), hier nur als Scope-Berührungspunkt vermerkt.
- Nächstgelegenen freien Raum zu einem von der Nutzerin manuell angegebenen Referenzraum ermitteln, auf Basis einer vom FSR gepflegten Laufwege-Datenstruktur (kein Geräte-Standortzugriff).
- Melden eines Raums als „besetzt" durch Studierende, unabhängig vom offiziellen Belegungsstatus, mit Anzeige der Meldungsanzahl.
- Übersicht aller im Raumplan (INT-009) geführten Räume mit ihrer aktuellen Belegung, unabhängig von der kuratierten Raumliste.
- Ansicht der aktuell laufenden Veranstaltungen, abgeleitet aus der Raumbelegung.
- Anzeige des Freitextfelds `note` eines Raumplan-Termins (INT-009), sofern gesetzt.

### Nicht-Scope

- Raumbuchung oder -reservierung — die FBWS-Schnittstellen sind rein lesend, eine Buchungsfunktion würde ein Schreibrecht am Hochschulsystem voraussetzen, das nicht vorliegt.
- Persönlicher Stundenplan — siehe `features/schedule/spec.md`.
- Navigation/Wegbeschreibung innerhalb des Gebäudes — nicht Teil des aktuellen Umfangs.
- Geräte-Standortzugriff (GPS) — bewusst nicht genutzt; die Nähe zu einem freien Raum wird über eine manuelle Referenzraum-Eingabe und serverseitige Laufwege-Daten ermittelt, nicht über Gerätestandort (Entscheidung FSR FB4, 2026-08-25).
- Lokalisierung über im Gebäude verteilte WLAN-Access-Points — vom FSR als möglicher künftiger Ausbauschritt benannt, ausdrücklich nicht Teil dieses Umfangs (siehe Abschnitt 13).
- Hinweis auf Raumänderung oder Ausfall am Stundenplan-Eintrag — in `../schedule/spec.md` (SCHED-F-410 ff.) verortet; die Raumübersicht selbst wertet keinen Soll-Ist-Abgleich aus, sie zeigt nur den Ist-Stand des Raumplans.

## 3. Nutzergeschichten

- Als Studierende möchte ich sehen, ob ein bestimmter Raum gerade belegt ist, damit ich ihn für eine Lerngruppe nutzen kann.
- Als Studierende möchte ich einen freien Raum zu einer bestimmten Uhrzeit finden, ohne jeden Raum einzeln nachzuschlagen.
- Als Studierende möchte ich angeben, vor welchem Raum ich gerade stehe, damit mir der nächstgelegene freie Raum vorgeschlagen wird, statt selbst Entfernungen abschätzen zu müssen.
- Als Studierende möchte ich einen Raum als besetzt melden können, wenn die offizielle Auskunft nicht der Realität entspricht, damit andere sich nicht umsonst auf den Weg machen.
- Als Studierende möchte ich auf einen Blick sehen, welche Räume gerade frei sind und was in den belegten läuft, ohne jeden Raum einzeln nachzuschlagen.
- Als Studierende möchte ich sehen, welche Veranstaltungen gerade stattfinden, um eine offene Tür oder einen kurzfristig verlegten Termin zu finden.

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
| RAUM-F-140 | Solange die meldende Person dieselbe Gerätesitzung verwendet, muss das System ihr das Zurückziehen einer von ihr abgegebenen, noch aktiven Besetzt-Meldung ermöglichen. | NEU |
| RAUM-F-150 | Das System muss der Nutzerin eine Übersicht aller im Raumplan-Zwischenspeicher (INT-009) geführten Räume mit ihrem aktuellen Belegungszustand (frei oder belegt) anzeigen. | NEU |
| RAUM-F-160 | Wenn ein Raum in der Übersicht als belegt ausgewiesen ist, dann muss das System die laufende Veranstaltung mit Bezeichnung und Endzeitpunkt anzeigen. | NEU |
| RAUM-F-170 | Wenn ein Raum in der Übersicht als frei ausgewiesen ist, dann muss das System nach RAUM-F-090 angeben, bis wann er frei ist. | NEU |
| RAUM-F-180 | Sofern ein Raum der Übersicht zusätzlich auf der kuratierten Raumliste (RAUM-F-120) steht, muss das System dessen Größenklasse und E-Key-Kennzeichen mit anzeigen. | NEU |
| RAUM-F-190 | Solange für einen Raum eine gültige Besetzt-Meldung (RAUM-F-070/F-080) vorliegt, muss das System dies in der Übersicht zusätzlich zum offiziellen Belegungszustand anzeigen. | NEU |
| RAUM-F-200 | Das System muss der Nutzerin eine Ansicht der aktuell laufenden Veranstaltungen bereitstellen, abgeleitet aus der Belegung der Räume des Raumplans. | NEU |
| RAUM-F-210 | Das System muss zu jeder laufenden Veranstaltung Raum, Bezeichnung und Endzeitpunkt anzeigen. | NEU |
| RAUM-F-220 | Sofern ein Raumplan-Termin ein gesetztes Freitextfeld `note` (INT-009) trägt, muss das System dessen Inhalt bei diesem Termin anzeigen. | NEU |
| RAUM-F-230 | Das System muss der Nutzerin den Wechsel zwischen Freie-Raum-Suche, Raumübersicht und Ansicht laufender Veranstaltungen innerhalb des Raum-Bereichs ermöglichen, ohne den Bereich zu verlassen. | NEU |
| RAUM-F-240 | Das System muss der Nutzerin das Einschränken der Raumübersicht auf einen Belegungszustand (frei oder belegt) ermöglichen. | NEU |
| RAUM-F-245 | Das System muss der Nutzerin das Suchen nach einer Raumkennung innerhalb der Raumübersicht ermöglichen. | NEU |
| RAUM-F-250 | Wenn die Nutzerin in der Raumübersicht oder in der Ansicht laufender Veranstaltungen einen Raum auswählt, dann muss das System dessen Tagesbelegung nach RAUM-F-010 anzeigen. | NEU |
| RAUM-F-260 | Falls der Raumplan-Zwischenspeicher älter als die vorgesehene Aktualisierungsfrequenz ist, muss das System das Alter des Stands in Raumübersicht und Ansicht laufender Veranstaltungen sichtbar anzeigen. | NEU |

### Erläuterungen

**`RAUM-F-140`** — Analog zum Widerruf bei HELFER-F-040 und RATE-F-070: Eine fehlerhafte Meldung blieb bislang bis zum Verfall (90 Minuten, Abschnitt 13) unverändert wirksam. Die Zuordnung „von ihr abgegeben" bleibt geräteseitig (z. B. eine lokal gespeicherte Kennung der eigenen zuletzt gesendeten Meldungen), nicht serverseitig personenbezogen — RAUM-F-070 und API-F-210 bleiben ohne Konto- oder Personenbezug unverändert gültig. Konkreter Mechanismus (z. B. clientseitig erzeugte Meldungs-Kennung, die für einen Widerruf erneut vorgelegt wird) ist Sache des Vertrags bei Umsetzung von Schritt 6.

**`RAUM-F-050`/`RAUM-F-060`** — Entscheidung FSR FB4, 2026-08-25: Statt Geräte-Standortzugriff (GPS) gibt die Nutzerin manuell den Raum an, vor dem sie steht; das Backend ermittelt daraus über eine vom FSR gepflegte Laufwege-Datenstruktur (Distanzen/Nachbarschaften zwischen Räumen) den nächstgelegenen freien Raum. Herkunft, Pflegeweg und Detailgrad dieser Datenstruktur sind offen, siehe Abschnitt 13. Eine echte Lokalisierung über im Gebäude verteilte WLAN-Access-Points ist als möglicher künftiger Ausbauschritt benannt, aber explizit nicht Teil dieses Umfangs (siehe Abschnitt 2, Nicht-Scope).

**`RAUM-F-070`/`RAUM-F-080`** — Ergänzt die offizielle FBWS-Belegungsauskunft um ein von Studierenden getragenes Stimmungsbild, ähnlich einer Crowd-Meldung. Bewusst ohne Konto (siehe `decisions/0004-identitaet-und-anmeldung.md`, das nur RATE-Schreiben und EKEY kontopflichtig macht) — Missbrauchsschutz erfolgt analog `platform/identity-and-moderation.md` (IDENT-F-060) über Muster-/Häufigkeitserkennung je Gerät/Quelle, nicht über Identitätsprüfung. „Begrenztes Zeitfenster" verhindert, dass veraltete Meldungen unbegrenzt fortwirken; konkreter Wert offen, siehe Abschnitt 13.

**`RAUM-F-040` und `RAUM-N-010` (entfallen).** Beide beruhten auf der Annahme, es gebe keinen Endpunkt, der Raumtermine vollständig liefert, weshalb die Termine aller Studiengang/Semester-Kombinationen zusammengeführt werden müssten. Die Auswertung des Android-Quellcodes am 2026-08-25 widerlegt das: `Room/*/AllEvents` liefert alle Raumtermine in einem Aufruf und ist dort produktiv im Einsatz. Ersetzt durch RAUM-F-045, das nur noch den Bezugsweg über den Zwischenspeicher des Backends festlegt. Siehe `platform/architecture.md` ARCH-F-045 und `platform/backend-and-api.md` API-F-045.

**`RAUM-F-100`/`RAUM-F-110`/`RAUM-F-120` — kuratierte Raumliste statt aller Räume.** Die Android-Alt-App führt eine gepflegte Liste von 19 Räumen mit je einer Größenklasse (klein, mittel, groß) und einem Kennzeichen für E-Key-Zugänglichkeit; der Terminbestand liefert nur die Belegung dazu. Dieser Zuschnitt ist übernehmenswert und fachlich begründet: Nicht jeder Raum, in dem eine Veranstaltung stattfindet, eignet sich für eine Lerngruppe — Hörsäle, Labore und Räume anderer Fachbereiche tauchen im Terminbestand auf, sind aber keine sinnvollen Suchergebnisse. Die Größenklasse beantwortet zudem die Frage, die bei einer Lerngruppe zuerst gestellt wird, nämlich ob der Raum für die Gruppe passt. Die Pflege dieser Liste erfolgt über die Verwaltungsoberfläche (`../admin/spec.md`), die Auslieferung über das Backend (`platform/backend-and-api.md` API-F-230).

**`RAUM-F-110` — Zusammenhang mit EKEY.** Das Kennzeichen macht EKEY-F-010 konkret: Der Hinweis auf die Ausleihmöglichkeit erscheint nicht pauschal, sondern dort, wo er etwas nützt — bei einem Raum, der ohne E-Key außerhalb der offiziellen Zeiten nicht zugänglich ist.

**`RAUM-F-130` — Gebäudeschließzeit.** Die Android-Alt-App setzt für einen Raum ohne nachfolgenden Termin pauschal 21:30 Uhr als Endzeitpunkt an, im Quellcode selbst als offener Punkt markiert (`service/RoomService.java`, dokumentiert als N-004 in `product/legacy-inventory.md`). Ein fest im Quellcode stehender Wert veraltet unbemerkt, sobald sich Öffnungszeiten ändern, und ist nur mit einem App-Update über drei Vertriebswege korrigierbar. Die Angabe gehört deshalb zu den gepflegten Stammdaten.

**`RAUM-F-150` bis `RAUM-F-210` — zwei zusätzliche Blickrichtungen auf denselben Bestand.** Die Freie-Raum-Suche (RAUM-F-020) beantwortet „wo kann ich hin", die Raumübersicht „was ist gerade wo", die Ansicht laufender Veranstaltungen „was findet gerade statt". Alle drei speisen sich aus dem einen Raumplan-Zwischenspeicher (INT-009, `platform/backend-and-api.md` API-F-045); die Ansicht laufender Veranstaltungen ist die nach Veranstaltung statt nach Raum gruppierte Sicht auf dieselben Daten und braucht keinen eigenen Abruf. Anders als die Freie-Raum-Suche ist die Übersicht **nicht** auf die kuratierte Raumliste beschränkt (Entscheidung FSR FB4, 2026-09-03): Wer wissen will, was im Gebäude läuft, will auch Hörsäle und Labore sehen; die kuratierte Liste bleibt nur dort maßgeblich, wo es um die Eignung für eine Lerngruppe geht (RAUM-F-120). Für Räume außerhalb der kuratierten Liste fehlen Größenklasse und E-Key-Kennzeichen — das ist hinnehmbar (RAUM-F-180 „sofern").

**`RAUM-F-220` — `note`-Feld.** INT-009 liefert je Termin ein Freitextfeld `note`, im erhobenen Beispiel für Prüfungen mit `Bitte nicht stören!` belegt. Ob der Fachbereich es auch für kurzfristige Hinweise (Ausfall, Verlegung) nutzt, ist nicht bestätigt — siehe Abschnitt 13. Solange es gesetzt ist, wird es angezeigt; die App interpretiert es nicht.

**`RAUM-F-230` — UI-Einbindung.** Der Raum-Bereich ist bereits ein Tab-Eintrag (`../app-shell/spec.md` SHELL-F-060). Die drei Sichten werden innerhalb dieses Bereichs umschaltbar angeboten (z. B. als segmentierte Auswahl über der Liste), nicht als zusätzliche Navigationsziele — SHELL bleibt unverändert. Ob das Tab-Symbol und -Label von „Raumsuche" auf „Räume" wechseln, ist eine offene SHELL-Frage (Abschnitt 13).

## 5. Datenmodell

Raum-Stammdaten (vom FSR gepflegt, serverseitig): `roomId`, Größenklasse (klein/mittel/groß), E-Key-Zugänglichkeit, Gebäudeschließzeit. Raumtermin (Zwischenspeicher, serverseitig): Felder wie in INT-009 dokumentiert. Freier-Raum-Ergebnis (berechnet): `roomId`, frei bis (RAUM-F-090), Größenklasse, E-Key-Zugänglichkeit. Laufwege (vom FSR gepflegt, serverseitig): Paar aus zwei `roomId`, Distanz-/Gewichtsmaß — genaues Format offen, siehe Abschnitt 13. Besetzt-Meldung: `roomId`, Zeitstempel, keine Personen- oder Konto-Referenz.

Raumstatus (berechnet, serverseitig, RAUM-F-150 bis RAUM-F-190): `roomId`, Belegungszustand (frei/belegt), laufender Termin (optional: Bezeichnung, Endzeitpunkt), nächster Termin (optional: Bezeichnung, Beginn), Anzahl gültiger Besetzt-Meldungen; Größenklasse und E-Key-Zugänglichkeit nur für Räume der kuratierten Liste. Laufende Veranstaltung (berechnet, RAUM-F-200/F-210): `roomId`, Bezeichnung, Endzeitpunkt — die nach Veranstaltung gruppierte Sicht auf die belegten Räume.

## 6. Externe Schnittstellen

Nutzt INT-009 (Raumplan, Platzhalter-Form über alle Räume) über das eigene Backend INT-008. INT-001 und INT-002 werden für die Raumsuche nicht mehr verwendet. Raumübersicht und Ansicht laufender Veranstaltungen nutzen denselben Zwischenspeicher, kein zusätzlicher externer Abruf. Laufwege-Datenstruktur und Besetzt-Meldungen sind rein interne Backend-Ressourcen ohne externe Schnittstelle. Keine Endpunktdetails hier — siehe `platform/integrations.md` und `platform/api-contract.yaml`.

## 7. UI-Flows & Zustände

| Zustand | Verhalten |
|---|---|
| Laden | Ladeanzeige während der Backend-Abfrage |
| Leer (keine freien Räume zum gewählten Zeitpunkt) | Hinweis „keine freien Räume gefunden", Vorschlag eines nahegelegenen Zeitfensters |
| Leer (kein freier Raum in Laufweg-Reichweite des Referenzraums) | Hinweis, dass kein naher freier Raum gefunden wurde, Angebot der allgemeinen Raumsuche (RAUM-F-020) als Rückfalloption |
| Fehler | Fehlermeldung mit Wiederholen-Option |
| Offline | Raumsuche als nicht verfügbar kennzeichnen (siehe `platform/architecture.md` ARCH-F-110), siehe Abschnitt 8 für die Ausnahme beim Melden als „besetzt" |
| Raumübersicht / laufende Veranstaltungen: Laden | Ladeanzeige während der Backend-Abfrage |
| Raumübersicht: kein Raum entspricht dem gesetzten Filter | Hinweis „kein Raum im gewählten Zustand", Filter zurücksetzbar |
| Laufende Veranstaltungen: aktuell keine | Hinweis „gerade findet keine erfasste Veranstaltung statt" |
| Raumplan-Stand veraltet | Alter des Stands sichtbar anzeigen (RAUM-F-260), beide Sichten bleiben nutzbar |

## 8. Offline-Verhalten

Die Raumsuche ist laut `platform/architecture.md` (ARCH-F-110) der einzige Kernbereich ohne Offline-Verfügbarkeit, da das Ergebnis von der aktuellen Backend-Aggregation abhängt. Diese Spec übernimmt das unverändert. Dasselbe gilt für Raumübersicht und Ansicht laufender Veranstaltungen — beide hängen am aktuellen Zwischenspeicher-Stand und werden offline als nicht verfügbar gekennzeichnet. Ausnahme: Eine Besetzt-Meldung (RAUM-F-070) lässt sich auch offline abgeben und wird gemäß `platform/architecture.md` (ARCH-F-120) und `platform/data-and-storage.md` (DATA-F-100) in die lokale Offline-Warteschlange eingereiht — die Nutzerin kennt den Belegungsstatus vor Ort auch ohne aktuelle Backend-Daten.

## 9. Fehlerfälle

| Fall | Reaktion |
|---|---|
| Angefragte Raumkennung existiert nicht in den Quelldaten | Hinweis „Raum unbekannt", keine Fehlermeldung wie bei einem technischen Ausfall |
| Backend-Aggregation veraltet (älter als die vorgesehene Aktualisierungsfrequenz) | Alter der Daten sichtbar anzeigen statt unkommentiert als aktuell auszugeben |
| Als Referenzraum angegebener Raum hat keine erfassten Laufwege-Daten | Hinweis, dass für diesen Raum keine Nähe-Suche möglich ist, Angebot der allgemeinen Raumsuche (RAUM-F-020) |
| Massenhafte Besetzt-Meldungen von derselben Quelle in kurzer Zeit | Zur Prüfung markiert, analog `platform/identity-and-moderation.md` IDENT-F-060 |
| Raum aus dem Raumplan ist nicht in der kuratierten Liste | In der Übersicht dennoch anzeigen, ohne Größenklasse/E-Key-Kennzeichen — kein Fehler |
| Raumplan-Termin ohne auswertbare Zeitangabe | Termin in Übersicht und Ansicht laufender Veranstaltungen überspringen, Vorfall protokollieren (SEC-F-060), übrige Räume normal anzeigen |

## 10. Nicht-funktionale Anforderungen

Keine über `platform/non-functional.md` hinausgehenden Anforderungen.

## 11. Akzeptanzkriterien

- Für einen bekannten, aktuell belegten Raum zeigt die Suche den Raum korrekt als belegt, einschließlich Prüfungsterminen.
- Zu jedem als frei ausgewiesenen Raum ist erkennbar, bis wann er frei ist, welche Größenklasse er hat und ob er mit E-Key zugänglich ist (RAUM-F-090 bis RAUM-F-110).
- Für ein gewähltes Zeitfenster ohne belegte Räume liefert die Suche eine nachvollziehbare Leermeldung statt eines Fehlers.
- Für einen gültigen Referenzraum mit erfassten Laufwege-Daten liefert die Nähe-Suche den nächstgelegenen tatsächlich freien Raum.
- Eine Besetzt-Meldung erhöht sichtbar die Meldungsanzahl des betroffenen Raums, auch wenn sie offline abgegeben wurde.
- Die Raumübersicht führt auch Räume, die nicht auf der kuratierten Liste stehen; für kuratierte Räume erscheinen zusätzlich Größenklasse und E-Key-Kennzeichen (RAUM-F-150/F-180).
- Zu jedem belegten Raum sind laufende Veranstaltung und Endzeitpunkt erkennbar, zu jedem freien Raum, bis wann er frei ist (RAUM-F-160/F-170).
- Die Ansicht laufender Veranstaltungen listet genau die Veranstaltungen, deren Raum zum Abfragezeitpunkt belegt ist (RAUM-F-200/F-210).
- Ein veralteter Raumplan-Stand wird in beiden neuen Sichten mit seinem Alter ausgewiesen, nicht kommentarlos als aktuell dargestellt (RAUM-F-260).

## 12. Bewusst nicht übernommenes Altverhalten

- Fest im Quellcode hinterlegte Schließzeit von 21:30 Uhr für Räume ohne nachfolgenden Termin — Grund: veraltet unbemerkt und ist nur per App-Update korrigierbar, siehe RAUM-F-130.
- Ermittlung der freien Räume unmittelbar aus dem Hochschulsystem heraus in der App — Grund: macht die Raumsuche vom Hochschulsystem abhängig und verhindert einen Ausfallpuffer, siehe RAUM-F-045.

## 13. Offene Fragen

- ~~Deckt INT-009 alle Räume des Fachbereichs ab?~~ Beantwortet am 2026-08-25: Die Platzhalter-Form liefert alle Räume in einem Aufruf, siehe INT-009.
- Aktualisierungsfrequenz des serverseitigen Abrufs: 15 Minuten (Arbeitsziel, konsistent mit `platform/data-and-storage.md` Abschnitt 4).
- ~~Herkunft der Größenklassen und Gebäudeschließzeiten für die Raumliste~~ Eingeschätzt 2026-08-26 (FSR FB4): vermutlich noch aktuell. Keine Vollprüfung vor Übernahme als Ausgangsbestand in die Stammdatenpflege vorgesehen; Korrektur bei Bedarf über die Verwaltungsoberfläche (`../admin/spec.md`).
- ~~Herkunft der Laufwege-Datenstruktur (RAUM-F-060)~~ Geklärt 2026-08-26: Ein früherer Lageplan unter `https://campus.inf.fh-dortmund.de/` existierte, ist aber nicht mehr erreichbar (Verbindungsaufbau abgelehnt, live geprüft 2026-08-26). Die Laufwege-Daten müssen deshalb von Hand erstellt werden — FSR-Mitglieder schätzen Fußweg-Distanzen zwischen den gepflegten Räumen und pflegen sie über die Laufwege-Verwaltung in ADMIN (`../admin/spec.md` ADMIN-F-090). Detailgrad unverändert: ein Nachbarschaftsgraph mit Fußweg-Minuten als Gewicht, grobe Etage-/Gebäude-Granularität statt exakter Gänge, da so einfacher manuell zu pflegen.
- Zeitfenster, nach dem eine Besetzt-Meldung verfällt (RAUM-F-080): 90 Minuten (Arbeitsziel, zwischen einer einzelnen Unterrichtseinheit und einem vollen Vormittag).
- Lokalisierung über WLAN-Access-Points (Schritt 3 des vom FSR skizzierten Ausbaus, siehe Abschnitt 2 Nicht-Scope): eigenständiges Infrastrukturvorhaben, bei Bedarf als spätere Erweiterung dieser Spec zu behandeln, nicht Teil des aktuellen Umfangs.
- Bildet INT-009 kurzfristige Ausfälle und Raumänderungen ab oder nur den Sollplan? Bestimmt, wie belastbar RAUM-F-200 und der Stundenplan-Abgleich (SCHED-F-410 ff.) sind. Vor Umsetzung von Roadmap-Schritt 6 als Spike zu klären — dabei auch die Felder `note` und `flags` aus INT-009 auf Absage-/Verlegungssignale prüfen.
- Tab-Label und -Symbol des Raum-Bereichs: bleibt „Raumsuche" (`../app-shell/spec.md` SHELL-F-060, `../../platform/ux-and-theming.md`) oder wird zu „Räume", da der Bereich nun mehr als eine Suche enthält? SHELL-Entscheidung, nicht hier.
- Zeitpunkt-Bezug der Raumübersicht: nur „jetzt" oder frei wählbar wie bei der Freie-Raum-Suche (RAUM-F-020)? Für den ersten Umfang „jetzt" angenommen, die Freie-Raum-Suche deckt beliebige Zeitpunkte ab.
