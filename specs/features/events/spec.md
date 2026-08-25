---
id: events
titel: Event-Kalender
praefix: EVENT
status: draft
prioritaet: kern
version: 1.0.3
owner: FSR FB4
last_reviewed: 2026-08-25
derived_from: []
implemented_in: []
related:
  - ../../platform/backend-and-api.md
  - ../../platform/security-and-privacy.md
  - ../../platform/integrations.md
  - ../event-volunteers/spec.md
  - ../news/spec.md
  - ../../product/vision.md
---

# Event-Kalender

## 1. Zweck & Nutzen

Zeigt vom FSR organisierte Veranstaltungen (Spieleabende, Stammtische, Grillabende, laut `fsrfb4.de`) sowie ggf. die Erstsemester-Orientierungswoche. Vollständige Neuentwicklung ohne Vorbild in einer der Alt-Apps — bislang wurden solche Termine ausschließlich über Website, Instagram und Discord kommuniziert. Redaktionsweg-Entscheidung FSR FB4, 2026-08-25 (siehe `specs/open-questions.md`, Archiv): Events werden über einen vom FSR extern gepflegten ICS-Kalender (INT-011) verwaltet, nicht über eine eigene Verwaltungsoberfläche im Backend.

## 2. Scope / Nicht-Scope

### Scope

- Anzeige kommender und vergangener FSR-Events mit Titel, Zeitraum, Ort, Beschreibung.
- Verknüpfung eines Events mit Helferbedarf, sofern vorhanden — Anmeldung selbst ist `features/event-volunteers/spec.md`.
- Import der Events aus dem vom FSR gepflegten ICS-Kalender (INT-011) über das eigene Backend.

### Nicht-Scope

- Redaktionelle Pflege der Events innerhalb dieser App — die Pflege erfolgt extern im ICS-Kalendertool des FSR, nicht in einer von dieser Spec bereitgestellten Oberfläche (siehe `platform/integrations.md` INT-011).
- Helfer-Anmeldung selbst — siehe `features/event-volunteers/spec.md`.
- Externe Veranstaltungen (Hochschulsport, Uni-Esports, laut `linkstapel.de`) — bleiben externe Links, siehe `product/vision.md` Abschnitt 5.
- Erstsemester-Orientierungswoche als eigenständiges Feature — wird als reguläres Event über denselben ICS-Kalender gepflegt (Entscheidung FSR FB4, 2026-08-25), kein Sonderfall in dieser Spec.

## 3. Nutzergeschichten

- Als Studierende möchte ich sehen, welche FSR-Events anstehen, damit ich teilnehmen kann.
- Als Erstsemester möchte ich die Orientierungswoche im selben Kalender finden wie andere FSR-Events.
- Als FSR-Redaktion möchte ich Events in meinem gewohnten Kalenderwerkzeug pflegen, ohne eine zusätzliche Verwaltungsoberfläche lernen zu müssen.

## 4. Funktionale Anforderungen

| ID | Anforderung | Herkunft |
|---|---|---|
| EVENT-F-010 | Das System muss kommende FSR-Events mit Titel, Zeitraum, Ort und Beschreibung anzeigen. | NEU |
| EVENT-F-020 | Das System muss vergangene Events getrennt von kommenden Events auffindbar machen. | NEU |
| EVENT-F-030 | Wenn ein Event einen Helferbedarf hat, muss das System dies in der Event-Ansicht sichtbar machen und zur Helfer-Anmeldung verweisen. | NEU |
| ~~EVENT-F-040~~ | ~~Das System muss der FSR-Redaktion das Anlegen, Bearbeiten und Absagen von Events ermöglichen.~~ — entfallen | NEU |
| EVENT-F-050 | Wenn ein Event abgesagt wird, muss das System es weiterhin sichtbar, aber eindeutig als abgesagt kennzeichnen, statt es zu entfernen. | NEU |
| EVENT-F-060 | Das System muss Events periodisch aus dem vom FSR gepflegten ICS-Kalender (INT-011) importieren. | NEU |
| EVENT-F-070 | Wenn ein importiertes ICS-Event den Status `CANCELLED` trägt, muss das System es gemäß EVENT-F-050 als abgesagt kennzeichnen. | NEU |

### Erläuterungen

**`EVENT-F-040` (entfallen).** Redaktionsweg-Entscheidung FSR FB4, 2026-08-25: Events werden über den externen ICS-Kalender INT-011 gepflegt, nicht über eine vom System bereitgestellte Verwaltungsoberfläche. Ersetzt durch EVENT-F-060 (Import statt Pflege-UI). Die Kennzeichnung abgesagter Events (EVENT-F-050) bleibt gültig, ihre Auslösung ändert sich jedoch von einer redaktionellen Aktion im Backend zu einem importierten `STATUS`-Feld (EVENT-F-070).

## 5. Datenmodell

Event: `UID` (aus ICS, eindeutiger Schlüssel für die Verknüpfung mit Helferbedarf), Titel (`SUMMARY`), Zeitraum (`DTSTART`/`DTEND`), Ort (`LOCATION`), Beschreibung (`DESCRIPTION`), Status (`STATUS`, gemappt auf geplant/abgesagt/vergangen gemäß EVENT-F-070), Helferbedarf (optional, Referenz auf `features/event-volunteers/spec.md`-Datenmodell, verknüpft über `UID` — Matching-Mechanismus siehe `platform/integrations.md` INT-011). Grobe Felder bereits in `platform/backend-and-api.md` Abschnitt 5 vorgedacht.

## 6. Externe Schnittstellen

Import aus dem FSR-ICS-Kalender (INT-011), zwischengespeichert über das eigene Backend INT-008 (siehe `platform/architecture.md` Datenfluss-Tabelle, Zeile „Events", und `platform/backend-and-api.md` API-F-160). Keine weiteren externen Schnittstellen. Endpunktdetails ausschließlich in `platform/integrations.md`.

## 7. UI-Flows & Zustände

| Zustand | Verhalten |
|---|---|
| Laden | Ladeanzeige beim Abrufen der Event-Liste |
| Leer | Hinweis „aktuell keine geplanten Events" |
| Fehler | Fehlermeldung mit Wiederholen-Option |
| Offline | Zuletzt geladene Event-Liste mit Alters-Hinweis |

## 8. Offline-Verhalten

Events sind ein reiner Lesepfad; wie News und Mensa gilt sinngemäß Offline-Verfügbarkeit mit zuletzt geladenem Stand (analog `platform/architecture.md` ARCH-F-100), auch wenn Events dort nicht namentlich aufgeführt ist — Ergänzung dieser Spec: Cache-Regel vorgeschlagen ein Tag, zu bestätigen mit Backend-Betrieb.

## 9. Fehlerfälle

| Fall | Reaktion |
|---|---|
| Event ohne gültigen Zeitraum (Redaktionsfehler im ICS-Kalender) | Event nicht anzeigen, Fehler protokollieren statt der Nutzerin einen kaputten Eintrag zu zeigen |
| Abgesagtes Event mit bereits laufender Helfer-Anmeldung | Helfer-Anmeldung ebenfalls als geschlossen kennzeichnen (siehe `features/event-volunteers/spec.md`) |
| ICS-Kalender beim periodischen Import nicht erreichbar | Zuletzt erfolgreich importierter Stand bleibt sichtbar, kein Fehler in der App (siehe Offline-Verhalten, Abschnitt 8) |
| ICS-Event ohne `UID` oder mit doppelter `UID` | Event dennoch anzeigen, Verknüpfung mit Helferbedarf für diesen Eintrag nicht möglich, Vorfall protokollieren |

## 10. Nicht-funktionale Anforderungen

Keine über `platform/non-functional.md` hinausgehenden Anforderungen.

## 11. Akzeptanzkriterien

- Ein abgesagtes Event bleibt sichtbar und eindeutig als abgesagt erkennbar, unabhängig davon, ob die Absage direkt im ICS-Kalender (`STATUS:CANCELLED`) erfolgt ist.
- Ein Event mit Helferbedarf verweist sichtbar auf die Helfer-Anmeldung.
- Eine Änderung im ICS-Kalender ist nach dem nächsten planmäßigen Import in der App sichtbar, ohne manuellen Eingriff.

## 12. Bewusst nicht übernommenes Altverhalten

Nicht zutreffend — keine der Alt-Apps bietet einen Event-Kalender.

## 13. Offene Fragen

- Genaue Freigabe-URL/-Konfiguration des FSR-Google-Kalenders (INT-011, Dienst am 2026-08-25 als Google Calendar entschieden) — Klärung bei Umsetzung.
- Matching-Mechanismus zur Verknüpfung eines ICS-Events mit Helferbedarf: `UID`-basiert (bestätigt als einzig praktikable Wahl, da `UID` laut RFC 5545 der einzige garantiert stabile Bezeichner eines `VEVENT` ist).
