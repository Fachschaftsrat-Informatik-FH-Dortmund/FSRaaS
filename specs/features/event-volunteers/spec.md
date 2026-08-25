---
id: event-volunteers
titel: Helfer-Anmeldung
praefix: HELFER
status: draft
prioritaet: kern
version: 0.2.1
owner: FSR FB4
last_reviewed: 2026-08-25
derived_from: []
implemented_in: []
related:
  - ../../platform/backend-and-api.md
  - ../../platform/identity-and-moderation.md
  - ../../platform/security-and-privacy.md
  - ../../platform/integrations.md
  - ../events/spec.md
---

# Helfer-Anmeldung

## 1. Zweck & Nutzen

Ermöglicht Studierenden, sich für Helferschichten bei FSR-Events (Aufbau, Ausschank, Abbau u. ä.) anzumelden, und dem FSR, den Helferbedarf zu planen und zu überblicken. Vollständige Neuentwicklung ohne Vorbild in einer der Alt-Apps.

## 2. Scope / Nicht-Scope

### Scope

- Definition von Helferbedarf je Event, gegliedert nach Rolle und Schicht (siehe `product/glossary.md`, Begriff „Helferbedarf / Rolle / Schicht").
- Anmeldung einzelner Studierender zu einer Rolle/Schicht-Kombination.
- Übersicht des Helferbedarfs für die FSR-Redaktion.

### Nicht-Scope

- Vergütung oder Anrechnung von Helferstunden — nicht Teil dieses Umfangs.
- Event-Verwaltung selbst — siehe `features/events/spec.md`.

## 3. Nutzergeschichten

- Als Studierende möchte ich mich einfach und ohne viele Eingaben für eine Helferschicht anmelden.
- Als FSR-Redaktion möchte ich sehen, welche Schichten noch unbesetzt sind.
- Als Studierende möchte ich meine Anmeldung wieder zurückziehen können, falls ich verhindert bin.

## 4. Funktionale Anforderungen

| ID | Anforderung | Herkunft |
|---|---|---|
| HELFER-F-010 | Das System muss der FSR-Redaktion das Anlegen von Helferbedarf je Event ermöglichen, gegliedert nach Rolle, Schicht und benötigter Personenzahl. | NEU |
| HELFER-F-020 | Das System muss Studierenden die Anmeldung zu einer Rolle/Schicht-Kombination mit Name und genau einem Kontaktweg ermöglichen. | NEU |
| HELFER-F-030 | Wenn eine Rolle/Schicht-Kombination die benötigte Personenzahl erreicht hat, muss das System sie als voll kennzeichnen und weitere Anmeldungen ablehnen. | NEU |
| HELFER-F-040 | Das System muss der angemeldeten Person das Zurückziehen der eigenen Anmeldung ermöglichen. | NEU |
| HELFER-F-050 | Das System muss der FSR-Redaktion eine Übersicht aller Rollen/Schichten eines Events mit besetzten und offenen Plätzen bereitstellen. | NEU |
| HELFER-F-060 | Wenn ein Event abgesagt wird, muss das System alle zugehörigen Helfer-Anmeldungen als geschlossen kennzeichnen und die angemeldeten Personen per Push-Benachrichtigung und In-App-Hinweis informieren. | NEU |

### Erläuterungen

**`HELFER-F-020`** — Setzt IDENT-F-020 (`platform/identity-and-moderation.md`) technisch um: Name und ein Kontaktweg, keine weiteren personenbezogenen Daten (IDENT-F-030).

**`HELFER-F-060`** — Kanalwahl (Push + In-App, kein E-Mail-Versand über den hinterlegten Kontaktweg) Entscheidung FSR FB4, 2026-08-25. Da eine Helfer-Anmeldung ohne Konto erfolgt (siehe `platform/identity-and-moderation.md` Abschnitt 2), kann die Push-Zustellung nicht wie bei News über ein Themen-Abonnement laufen, sondern braucht eine an die einzelne Anmeldung gebundene Geräte-Kennung — technische Ausgestaltung siehe Abschnitt 13.

## 5. Datenmodell

Helferbedarf: Event-Referenz (`UID` des importierten ICS-Events, siehe `features/events/spec.md` und `platform/integrations.md` INT-011), Rolle, Schicht (Zeitfenster), benötigte Personenzahl. Anmeldung: Helferbedarf-Referenz, Name, Kontaktweg, Zeitstempel. Löschfrist nach Zweckerfüllung: `platform/identity-and-moderation.md` IDENT-N-020 (30 Tage nach Eventende).

## 6. Externe Schnittstellen

Schreibpfad ausschließlich über das eigene Backend INT-008 (siehe `platform/architecture.md` ARCH-F-030). Keine weiteren externen Schnittstellen.

## 7. UI-Flows & Zustände

| Zustand | Verhalten |
|---|---|
| Laden | Ladeanzeige beim Abrufen des Helferbedarfs |
| Leer | Hinweis „für dieses Event ist aktuell kein Helferbedarf hinterlegt" |
| Fehler | Fehlermeldung mit Wiederholen-Option beim Laden; beim Anmelden: Hinweis auf Offline-Warteschlange (Abschnitt 8) |
| Offline | Anmeldung landet in der lokalen Offline-Warteschlange, siehe Abschnitt 8 |

## 8. Offline-Verhalten

Wie bei Mensa-Bewertungen (`features/canteen-ratings/spec.md` Abschnitt 8) reiht die App eine offline abgesendete Anmeldung gemäß `platform/architecture.md` (ARCH-F-120) und `platform/data-and-storage.md` (DATA-F-100) in die lokale Warteschlange ein. Idempotenz sichert `platform/backend-and-api.md` (API-F-140) — eine erneut übertragene Anmeldung darf keine zweite Person auf demselben Platz erzeugen.

## 9. Fehlerfälle

| Fall | Reaktion |
|---|---|
| Anmeldung zu einer inzwischen vollen Rolle/Schicht (Wettlaufsituation) | Ablehnung mit Hinweis „bereits voll", Angebot einer alternativen offenen Schicht sofern vorhanden |
| Zurückziehen einer Anmeldung nach Ablauf der Schicht | Ablehnen, Hinweis „Schicht bereits vergangen" |

## 10. Nicht-funktionale Anforderungen

Keine über `platform/non-functional.md` hinausgehenden Anforderungen.

## 11. Akzeptanzkriterien

- Eine Anmeldung zu einer vollen Schicht wird zuverlässig abgelehnt, auch bei zeitgleichen Anmeldeversuchen.
- Nach Absage eines Events sind alle zugehörigen Anmeldungen als geschlossen erkennbar, angemeldete Personen wurden benachrichtigt.

## 12. Bewusst nicht übernommenes Altverhalten

Nicht zutreffend — keine der Alt-Apps bietet Helfer-Anmeldung.

## 13. Offene Fragen

- Push-Zustellung bei Event-Absage (HELFER-F-060) ohne kontogebundene Geräte-Kennung: Arbeitsziel, das Push-Geräte-Token direkt bei der Helfer-Anmeldung zu erfassen und mit der Anmeldung zu verknüpfen (statt eines Themen-Abonnements wie bei News) — konkrete Umsetzung bei Aufbau der Push-Infrastruktur.
