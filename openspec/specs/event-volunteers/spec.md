## Purpose

Ermöglicht Studierenden die Anmeldung zu Helferschichten bei FSR-Events (Aufbau, Ausschank, Abbau u. ä.) und dem FSR die Planung und Übersicht des Helferbedarfs. Vormals `specs/features/event-volunteers/spec.md` (Präfix `HELFER`), migriert nach ADR 0019. Owner: FSR FB4.

## Requirements

### Requirement: Anlegen von Helferbedarf je Event

Das System muss der FSR-Redaktion das Anlegen von Helferbedarf je Event ermöglichen, gegliedert nach Rolle, Schicht und benötigter Personenzahl. Herkunft: NEU (vormals HELFER-F-010).

#### Scenario: Helferbedarf anlegen
- **WHEN** die FSR-Redaktion für ein Event Helferbedarf anlegt
- **THEN** ermöglicht das System die Gliederung nach Rolle, Schicht und benötigter Personenzahl

### Requirement: Anmeldung zu einer Rolle/Schicht-Kombination

Das System muss Studierenden die Anmeldung zu einer Rolle/Schicht-Kombination mit Name und genau einem Kontaktweg ermöglichen. Herkunft: NEU (vormals HELFER-F-020). Setzt die Datensparsamkeit aus Capability `identity-and-moderation` (vormals IDENT-F-020/IDENT-F-030) technisch um: Name und ein Kontaktweg, keine weiteren personenbezogenen Daten.

#### Scenario: Anmeldung mit Name und Kontaktweg
- **WHEN** eine Studierende sich zu einer Rolle/Schicht-Kombination anmeldet und Name sowie genau einen Kontaktweg angibt
- **THEN** nimmt das System die Anmeldung an

### Requirement: Kennzeichnung voller Rolle/Schicht-Kombinationen

Wenn eine Rolle/Schicht-Kombination die benötigte Personenzahl erreicht hat, muss das System sie als voll kennzeichnen und weitere Anmeldungen ablehnen. Herkunft: NEU (vormals HELFER-F-030).

#### Scenario: Kombination voll
- **WHEN** eine Rolle/Schicht-Kombination die benötigte Personenzahl erreicht hat
- **THEN** kennzeichnet das System sie als voll und lehnt weitere Anmeldungen ab

### Requirement: Zurückziehen der eigenen Anmeldung

Das System muss der angemeldeten Person das Zurückziehen der eigenen Anmeldung ermöglichen. Herkunft: NEU (vormals HELFER-F-040).

#### Scenario: Anmeldung zurückziehen
- **WHEN** eine angemeldete Person ihre Anmeldung zurückziehen möchte
- **THEN** ermöglicht das System das Zurückziehen

### Requirement: Übersicht des Helferbedarfs für die Redaktion

Das System muss der FSR-Redaktion eine Übersicht aller Rollen/Schichten eines Events mit besetzten und offenen Plätzen bereitstellen. Herkunft: NEU (vormals HELFER-F-050).

#### Scenario: Übersicht abrufen
- **WHEN** die FSR-Redaktion die Übersicht eines Events aufruft
- **THEN** zeigt das System alle Rollen/Schichten mit besetzten und offenen Plätzen

### Requirement: Schließung und Benachrichtigung bei Event-Absage

Wenn ein Event abgesagt wird, muss das System alle zugehörigen Helfer-Anmeldungen als geschlossen kennzeichnen und die angemeldeten Personen per Push-Benachrichtigung und In-App-Hinweis informieren. Herkunft: NEU (vormals HELFER-F-060). Kanalwahl (Push + In-App, kein E-Mail-Versand über den hinterlegten Kontaktweg) Entscheidung FSR FB4, 2026-08-25. Da eine Helfer-Anmeldung ohne Konto erfolgt (siehe Capability `identity-and-moderation`), kann die Push-Zustellung nicht wie bei News über ein Themen-Abonnement laufen, sondern braucht eine an die einzelne Anmeldung gebundene Geräte-Kennung — technische Ausgestaltung siehe „Offene Fragen".

#### Scenario: Event abgesagt
- **WHEN** ein Event mit bestehenden Helfer-Anmeldungen abgesagt wird
- **THEN** kennzeichnet das System alle zugehörigen Anmeldungen als geschlossen und informiert die angemeldeten Personen per Push-Benachrichtigung und In-App-Hinweis

## Scope / Nicht-Scope

### Scope

- Definition von Helferbedarf je Event, gegliedert nach Rolle und Schicht (siehe `specs/product/glossary.md`, Begriff „Helferbedarf / Rolle / Schicht").
- Anmeldung einzelner Studierender zu einer Rolle/Schicht-Kombination.
- Übersicht des Helferbedarfs für die FSR-Redaktion.

### Nicht-Scope

- Vergütung oder Anrechnung von Helferstunden — nicht Teil dieses Umfangs.
- Event-Verwaltung selbst — siehe Capability `events`.

## Nutzergeschichten

- Als Studierende möchte ich mich einfach und ohne viele Eingaben für eine Helferschicht anmelden.
- Als FSR-Redaktion möchte ich sehen, welche Schichten noch unbesetzt sind.
- Als Studierende möchte ich meine Anmeldung wieder zurückziehen können, falls ich verhindert bin.

## Datenmodell

Helferbedarf: Event-Referenz (`UID` des importierten ICS-Events, siehe Capability `events` und Capability `integrations`, INT-011), Rolle, Schicht (Zeitfenster), benötigte Personenzahl. Anmeldung: Helferbedarf-Referenz, Name, Kontaktweg, Zeitstempel. Löschfrist nach Zweckerfüllung: Capability `identity-and-moderation` (vormals IDENT-N-020, 30 Tage nach Eventende).

## Externe Schnittstellen

Schreibpfad ausschließlich über das eigene Backend INT-008 (siehe Capability `architecture`, vormals ARCH-F-030). Keine weiteren externen Schnittstellen.

## UI-Flows & Zustände

| Zustand | Verhalten |
|---|---|
| Laden | Ladeanzeige beim Abrufen des Helferbedarfs |
| Leer | Hinweis „für dieses Event ist aktuell kein Helferbedarf hinterlegt" |
| Fehler | Fehlermeldung mit Wiederholen-Option beim Laden; beim Anmelden: Hinweis auf Offline-Warteschlange (siehe „Offline-Verhalten") |
| Offline | Anmeldung landet in der lokalen Offline-Warteschlange, siehe „Offline-Verhalten" |

## Offline-Verhalten

Wie bei Mensa-Bewertungen (Capability `canteen-ratings`) reiht die App eine offline abgesendete Anmeldung gemäß Capability `architecture` (vormals ARCH-F-120) und Capability `data-and-storage` (vormals DATA-F-100) in die lokale Warteschlange ein. Idempotenz sichert Capability `backend-and-api` (vormals API-F-140) — eine erneut übertragene Anmeldung darf keine zweite Person auf demselben Platz erzeugen.

## Fehlerfälle

| Fall | Reaktion |
|---|---|
| Anmeldung zu einer inzwischen vollen Rolle/Schicht (Wettlaufsituation) | Ablehnung mit Hinweis „bereits voll", Angebot einer alternativen offenen Schicht sofern vorhanden |
| Zurückziehen einer Anmeldung nach Ablauf der Schicht | Ablehnen, Hinweis „Schicht bereits vergangen" |

## Nicht-funktionale Anforderungen

Keine über Capability `non-functional` hinausgehenden Anforderungen.

## Akzeptanzkriterien

- Eine Anmeldung zu einer vollen Schicht wird zuverlässig abgelehnt, auch bei zeitgleichen Anmeldeversuchen.
- Nach Absage eines Events sind alle zugehörigen Anmeldungen als geschlossen erkennbar, angemeldete Personen wurden benachrichtigt.

## Bewusst nicht übernommenes Altverhalten

Nicht zutreffend — keine der Alt-Apps bietet Helfer-Anmeldung.

## Offene Fragen

- Push-Zustellung bei Event-Absage ohne kontogebundene Geräte-Kennung: Arbeitsziel, das Push-Geräte-Token direkt bei der Helfer-Anmeldung zu erfassen und mit der Anmeldung zu verknüpfen (statt eines Themen-Abonnements wie bei News) — konkrete Umsetzung bei Aufbau der Push-Infrastruktur.
- Warteliste für bereits volle Rolle/Schicht-Kombinationen: Aktuell führt eine volle Kombination nur zur Ablehnung ohne Nachrück-Mechanismus. Empfehlenswerte Erweiterung aus der Spec-Prüfung vom 2026-08-26 für eine spätere Version — kein Bedarf mit fester Priorität in diesem Umfang, da diese Capability ohnehin Teil der zweiten Ausbaustufe ist.
