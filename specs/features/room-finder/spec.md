---
id: room-finder
titel: Raumsuche
praefix: RAUM
status: draft
prioritaet: kern
version: 0.2.2
owner: FSR FB4
last_reviewed: 2026-08-25
derived_from: []
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

Studierende und Lehrende suchen wiederkehrend nach einem freien Raum (z. B. für Lerngruppen) oder nach der Belegung eines bekannten Raums. Keine der beiden Alt-Apps bietet diese Funktion (siehe `product/legacy-inventory.md`); sie ist eine vollständige Neuentwicklung, ermöglicht durch die Recherche zu FBWS-Endpunkten, die Raumdaten liefern (INT-002 in Kombination mit INT-001, sowie der neu recherchierte INT-009).

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
| RAUM-F-010 | Das System muss der Nutzerin die Anzeige der Belegung eines per Kennung gewählten Raums für den aktuellen Tag ermöglichen. | NEU |
| RAUM-F-020 | Das System muss der Nutzerin die Suche nach zu einem gewählten Zeitpunkt freien Räumen ermöglichen. | NEU |
| RAUM-F-030 | Das System muss einen Raum als belegt kennzeichnen, wenn zum abgefragten Zeitpunkt ein Termin mit diesem `roomId` existiert, unabhängig davon, ob der Termin vom Typ `Course` oder `Event` (z. B. Prüfung) ist. | NEU |
| RAUM-F-040 | Das System muss die für die Raumsuche verwendeten Rohtermine serverseitig (Backend, INT-008) aggregieren, nicht durch eine clientseitige Abfrage aller Studiengang/Semester-Kombinationen. | NEU |
| RAUM-N-010 | Solange nicht verifiziert ist, dass INT-009 alle Räume des Fachbereichs abdeckt, muss das Backend die Raumbelegung zusätzlich aus der Aggregation von INT-001/INT-002 herleiten können, um Lücken in INT-009 abzudecken. | Recherche: INT-009, 2026-08-24 |
| RAUM-F-050 | Das System muss der Nutzerin die Eingabe eines Referenzraums ermöglichen, vor dem sie sich gerade befindet. | NEU |
| RAUM-F-060 | Wenn ein Referenzraum angegeben ist, muss das System anhand der serverseitig gepflegten Laufwege-Datenstruktur den nächstgelegenen freien Raum ermitteln. | NEU |
| RAUM-F-070 | Das System muss der Nutzerin das Melden eines Raums als „besetzt" ermöglichen, unabhängig von dessen offiziellem Belegungsstatus. | NEU |
| RAUM-F-080 | Das System muss zu jedem Raum die Anzahl der in einem begrenzten Zeitfenster eingegangenen „besetzt"-Meldungen anzeigen. | NEU |

### Erläuterungen

**`RAUM-F-050`/`RAUM-F-060`** — Entscheidung FSR FB4, 2026-08-25: Statt Geräte-Standortzugriff (GPS) gibt die Nutzerin manuell den Raum an, vor dem sie steht; das Backend ermittelt daraus über eine vom FSR gepflegte Laufwege-Datenstruktur (Distanzen/Nachbarschaften zwischen Räumen) den nächstgelegenen freien Raum. Herkunft, Pflegeweg und Detailgrad dieser Datenstruktur sind offen, siehe Abschnitt 13. Eine echte Lokalisierung über im Gebäude verteilte WLAN-Access-Points ist als möglicher künftiger Ausbauschritt benannt, aber explizit nicht Teil dieses Umfangs (siehe Abschnitt 2, Nicht-Scope).

**`RAUM-F-070`/`RAUM-F-080`** — Ergänzt die offizielle FBWS-Belegungsauskunft um ein von Studierenden getragenes Stimmungsbild, ähnlich einer Crowd-Meldung. Bewusst ohne Konto (siehe `decisions/0004-identitaet-und-anmeldung.md`, das nur RATE-Schreiben und EKEY kontopflichtig macht) — Missbrauchsschutz erfolgt analog `platform/identity-and-moderation.md` (IDENT-F-060) über Muster-/Häufigkeitserkennung je Gerät/Quelle, nicht über Identitätsprüfung. „Begrenztes Zeitfenster" verhindert, dass veraltete Meldungen unbegrenzt fortwirken; konkreter Wert offen, siehe Abschnitt 13.

**`RAUM-F-040`/`RAUM-N-010`** — Ursprünglich (siehe `platform/architecture.md` ARCH-F-040, `platform/backend-and-api.md` API-F-040/050) war ausschließlich die Aggregation aus INT-001/INT-002 vorgesehen, da der FBWS scheinbar keinen eigenen Raumbelegungs-Endpunkt bietet. Eine Recherche am 2026-08-24 hat mit INT-009 (`platform/integrations.md`) einen raumbezogenen Endpunkt bestätigt, der Termine direkt nach Raum liefert. Da unklar ist, ob dieser Endpunkt alle Räume abdeckt (am Beispiel eines einzelnen Raums, `A.E.01`, erprobt) und er Rohtermine statt einer berechneten Frei/Belegt-Auskunft liefert, bleibt die Aggregation aus INT-001/INT-002 als Ergänzung bzw. Fallback bestehen (RAUM-N-010). Die endgültige technische Ausgestaltung (INT-009 als primäre Quelle mit Fallback, oder INT-001/INT-002-Aggregation als primäre Quelle mit INT-009 als Ergänzung um Prüfungstermine) ist bei Umsetzung zu entscheiden, nicht Gegenstand dieser Spec.

## 5. Datenmodell

Raumbelegung (aggregiert, serverseitig): `roomId`, Zeitraum (Beginn, Ende), belegt/frei, optional Bezeichnung des belegenden Termins. Rohtermin je Raum: Felder wie in INT-002/INT-009 dokumentiert. Laufwege (vom FSR gepflegt, serverseitig): Paar aus zwei `roomId`, Distanz-/Gewichtsmaß — genaues Format offen, siehe Abschnitt 13. Besetzt-Meldung: `roomId`, Zeitstempel, keine Personen- oder Konto-Referenz.

## 6. Externe Schnittstellen

Nutzt INT-001 und INT-002 (Aggregationsweg) sowie INT-009 (direkter Raumplan-Endpunkt), beide über das eigene Backend INT-008. Laufwege-Datenstruktur und Besetzt-Meldungen sind rein interne Backend-Ressourcen ohne externe Schnittstelle. Keine Endpunktdetails hier — siehe `platform/integrations.md`.

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
- Für ein gewähltes Zeitfenster ohne belegte Räume liefert die Suche eine nachvollziehbare Leermeldung statt eines Fehlers.
- Für einen gültigen Referenzraum mit erfassten Laufwege-Daten liefert die Nähe-Suche den nächstgelegenen tatsächlich freien Raum.
- Eine Besetzt-Meldung erhöht sichtbar die Meldungsanzahl des betroffenen Raums, auch wenn sie offline abgegeben wurde.

## 12. Bewusst nicht übernommenes Altverhalten

Nicht zutreffend — keine der Alt-Apps bietet Raumsuche.

## 13. Offene Fragen

- Deckt INT-009 alle Räume des Fachbereichs ab? Klärung durch technische Leitung vor Festlegung des Aggregationswegs (siehe RAUM-N-010).
- Aktualisierungsfrequenz der serverseitigen Aggregation: 15 Minuten (Arbeitsziel, konsistent mit `data-and-storage.md` Abschnitt 9).
- Herkunft der Laufwege-Datenstruktur (RAUM-F-060): Ein bestehender Lageplan ist nutzbar (Entscheidung FSR FB4, 2026-08-25) — konkrete Quelle (z. B. auf `fsrfb4.de` oder von der FH bereitgestellt) sowie Format und Verfahren zur Ableitung der Nachbarschaftsdaten daraus bei Umsetzung mit dem FSR zu klären.
- Detailgrad der Laufwege-Daten: Arbeitsziel ein Nachbarschaftsgraph zwischen Räumen mit Fußweg-Minuten als Gewicht (grobe Etage/Gebäude-Granularität statt exakter Gänge, da einfacher manuell zu pflegen) — zu bestätigen, sobald die vorige Frage geklärt ist.
- Zeitfenster, nach dem eine Besetzt-Meldung verfällt (RAUM-F-080): 90 Minuten (Arbeitsziel, zwischen einer einzelnen Unterrichtseinheit und einem vollen Vormittag).
- Lokalisierung über WLAN-Access-Points (Schritt 3 des vom FSR skizzierten Ausbaus, siehe Abschnitt 2 Nicht-Scope): eigenständiges Infrastrukturvorhaben, bei Bedarf als spätere Erweiterung dieser Spec zu behandeln, nicht Teil des aktuellen Umfangs.
