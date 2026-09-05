## Purpose

Zeigt vom FSR organisierte Veranstaltungen (Spieleabende, Stammtische, Grillabende, ggf. die Erstsemester-Orientierungswoche) über einen extern vom FSR gepflegten ICS-Kalender an. Vormals `specs/features/events/spec.md` (Präfix `EVENT`), migriert nach ADR 0019. Owner: FSR FB4.

## Requirements

### Requirement: Anzeige kommender Events

Das System muss kommende FSR-Events mit Titel, Zeitraum, Ort und Beschreibung anzeigen. Herkunft: NEU (vormals EVENT-F-010).

#### Scenario: Kommende Events anzeigen
- **WHEN** die Nutzerin die Event-Ansicht öffnet
- **THEN** zeigt das System kommende FSR-Events mit Titel, Zeitraum, Ort und Beschreibung an

### Requirement: Getrennte Auffindbarkeit vergangener Events

Das System muss vergangene Events getrennt von kommenden Events auffindbar machen. Herkunft: NEU (vormals EVENT-F-020).

#### Scenario: Vergangene Events auffinden
- **WHEN** die Nutzerin vergangene Events sucht
- **THEN** stellt das System sie getrennt von den kommenden Events auffindbar dar

### Requirement: Sichtbarkeit von Helferbedarf in der Event-Ansicht

Wenn ein Event einen Helferbedarf hat, muss das System dies in der Event-Ansicht sichtbar machen und zur Helfer-Anmeldung verweisen. Herkunft: NEU (vormals EVENT-F-030).

#### Scenario: Event mit Helferbedarf
- **WHEN** ein Event einen Helferbedarf hat
- **THEN** macht das System dies in der Event-Ansicht sichtbar und verweist zur Helfer-Anmeldung (Capability `event-volunteers`)

### Requirement: Kennzeichnung abgesagter Events

Wenn ein Event abgesagt wird, muss das System es weiterhin sichtbar, aber eindeutig als abgesagt kennzeichnen, statt es zu entfernen. Herkunft: NEU (vormals EVENT-F-050).

#### Scenario: Event abgesagt
- **WHEN** ein Event abgesagt wird
- **THEN** bleibt es in der App sichtbar und wird eindeutig als abgesagt gekennzeichnet, statt entfernt zu werden

### Requirement: Periodischer Import aus dem ICS-Kalender

Das System muss Events periodisch aus dem vom FSR gepflegten ICS-Kalender (INT-011, Capability `integrations`) importieren. Herkunft: NEU (vormals EVENT-F-060).

#### Scenario: Periodischer Import
- **WHEN** der planmäßige Importzeitpunkt erreicht ist
- **THEN** importiert das System die Events aus dem ICS-Kalender (INT-011)

### Requirement: Kennzeichnung importierter Absagen

Wenn ein importiertes ICS-Event den Status `CANCELLED` trägt, muss das System es gemäß dem Requirement „Kennzeichnung abgesagter Events" als abgesagt kennzeichnen. Herkunft: NEU (vormals EVENT-F-070).

#### Scenario: Importiertes CANCELLED-Event
- **WHEN** ein importiertes ICS-Event den Status `CANCELLED` trägt
- **THEN** kennzeichnet das System es als abgesagt

## Entfallene Anforderungen (historisch)

**EVENT-F-040 (entfallen).** „Das System muss der FSR-Redaktion das Anlegen, Bearbeiten und Absagen von Events ermöglichen." Herkunft: NEU. Grund: Redaktionsweg-Entscheidung FSR FB4, 2026-08-25: Events werden über den externen ICS-Kalender (INT-011) gepflegt, nicht über eine vom System bereitgestellte Verwaltungsoberfläche. Ersetzt durch das Requirement „Periodischer Import aus dem ICS-Kalender" (vormals EVENT-F-060). Die Kennzeichnung abgesagter Events (vormals EVENT-F-050) bleibt gültig, ihre Auslösung ändert sich jedoch von einer redaktionellen Aktion im Backend zu einem importierten `STATUS`-Feld (vormals EVENT-F-070).

## Scope / Nicht-Scope

### Scope

- Anzeige kommender und vergangener FSR-Events mit Titel, Zeitraum, Ort, Beschreibung.
- Verknüpfung eines Events mit Helferbedarf, sofern vorhanden — Anmeldung selbst ist Capability `event-volunteers`.
- Import der Events aus dem vom FSR gepflegten ICS-Kalender (INT-011) über das eigene Backend.

### Nicht-Scope

- Redaktionelle Pflege der Events innerhalb dieser App — die Pflege erfolgt extern im ICS-Kalendertool des FSR, nicht in einer von dieser Capability bereitgestellten Oberfläche (siehe Capability `integrations`, INT-011).
- Helfer-Anmeldung selbst — siehe Capability `event-volunteers`.
- Externe Veranstaltungen (Hochschulsport, Uni-Esports, laut `linkstapel.de`) — bleiben externe Links, siehe `specs/product/vision.md` Abschnitt 5.
- Erstsemester-Orientierungswoche als eigenständiges Feature — wird als reguläres Event über denselben ICS-Kalender gepflegt (Entscheidung FSR FB4, 2026-08-25), kein Sonderfall in dieser Capability.

## Nutzergeschichten

- Als Studierende möchte ich sehen, welche FSR-Events anstehen, damit ich teilnehmen kann.
- Als Erstsemester möchte ich die Orientierungswoche im selben Kalender finden wie andere FSR-Events.
- Als FSR-Redaktion möchte ich Events in meinem gewohnten Kalenderwerkzeug pflegen, ohne eine zusätzliche Verwaltungsoberfläche lernen zu müssen.

## Datenmodell

Event: `UID` (aus ICS, eindeutiger Schlüssel für die Verknüpfung mit Helferbedarf), Titel (`SUMMARY`), Zeitraum (`DTSTART`/`DTEND`), Ort (`LOCATION`), Beschreibung (`DESCRIPTION`), Status (`STATUS`, gemappt auf geplant/abgesagt/vergangen), Helferbedarf (optional, Referenz auf das Datenmodell der Capability `event-volunteers`, verknüpft über `UID` — Matching-Mechanismus siehe Capability `integrations`, INT-011). Grobe Felder bereits in Capability `backend-and-api` vorgedacht.

## Externe Schnittstellen

Import aus dem FSR-ICS-Kalender (INT-011), zwischengespeichert über das eigene Backend INT-008 (siehe Capability `architecture`, Datenfluss-Tabelle, Zeile „Events", und Capability `backend-and-api`, vormals API-F-160). Keine weiteren externen Schnittstellen. Endpunktdetails ausschließlich in Capability `integrations`.

## UI-Flows & Zustände

| Zustand | Verhalten |
|---|---|
| Laden | Ladeanzeige beim Abrufen der Event-Liste |
| Leer | Hinweis „aktuell keine geplanten Events" |
| Fehler | Fehlermeldung mit Wiederholen-Option |
| Offline | Zuletzt geladene Event-Liste mit Alters-Hinweis |

## Offline-Verhalten

Events sind ein reiner Lesepfad; wie News und Mensa gilt sinngemäß Offline-Verfügbarkeit mit zuletzt geladenem Stand (analog Capability `architecture`, vormals ARCH-F-100), auch wenn Events dort nicht namentlich aufgeführt war — Ergänzung dieser Capability: Cache-Regel vorgeschlagen ein Tag, zu bestätigen mit Backend-Betrieb.

## Fehlerfälle

| Fall | Reaktion |
|---|---|
| Event ohne gültigen Zeitraum (Redaktionsfehler im ICS-Kalender) | Event nicht anzeigen, Fehler protokollieren statt der Nutzerin einen kaputten Eintrag zu zeigen |
| Abgesagtes Event mit bereits laufender Helfer-Anmeldung | Helfer-Anmeldung ebenfalls als geschlossen kennzeichnen (siehe Capability `event-volunteers`) |
| ICS-Kalender beim periodischen Import nicht erreichbar | Zuletzt erfolgreich importierter Stand bleibt sichtbar, kein Fehler in der App (siehe „Offline-Verhalten") |
| ICS-Event ohne `UID` oder mit doppelter `UID` | Event dennoch anzeigen, Verknüpfung mit Helferbedarf für diesen Eintrag nicht möglich, Vorfall protokollieren |

## Nicht-funktionale Anforderungen

Keine über Capability `non-functional` hinausgehenden Anforderungen.

## Akzeptanzkriterien

- Ein abgesagtes Event bleibt sichtbar und eindeutig als abgesagt erkennbar, unabhängig davon, ob die Absage direkt im ICS-Kalender (`STATUS:CANCELLED`) erfolgt ist.
- Ein Event mit Helferbedarf verweist sichtbar auf die Helfer-Anmeldung.
- Eine Änderung im ICS-Kalender ist nach dem nächsten planmäßigen Import in der App sichtbar, ohne manuellen Eingriff.

## Bewusst nicht übernommenes Altverhalten

Nicht zutreffend — keine der Alt-Apps bietet einen Event-Kalender.

## Offene Fragen

- Genaue Freigabe-URL/-Konfiguration des FSR-Google-Kalenders (INT-011, Dienst am 2026-08-25 als Google Calendar entschieden) — Klärung bei Umsetzung.
- Matching-Mechanismus zur Verknüpfung eines ICS-Events mit Helferbedarf: `UID`-basiert (bestätigt als einzig praktikable Wahl, da `UID` laut RFC 5545 der einzige garantiert stabile Bezeichner eines `VEVENT` ist).
