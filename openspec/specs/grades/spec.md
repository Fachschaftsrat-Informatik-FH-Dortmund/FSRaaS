## Purpose

Zeigt Studierenden ihre Prüfungsergebnisse, ohne das separate HISinOne-Webportal aufsuchen zu müssen; übernimmt die fachliche Zielsetzung der Alt-App, muss aber vollständig neu an HISinOne angebunden werden. Vormals `specs/features/grades/spec.md` (Präfix `NOTEN`), migriert nach ADR 0019. Owner: FSR FB4.

**Status: Umsetzung ist blockiert, bis der Spike zu INT-006 (`specs/decisions/0006-abloesung-ods-durch-hisinone.md`) den Zugangsweg zu HISinOne klärt.** Die folgenden Requirements beschreiben das fachliche Ziel unabhängig vom noch unbekannten technischen Zugangsweg; sie sind nicht final, solange INT-006 offen ist.

## Requirements

### Requirement: Anzeige der Prüfungsergebnisse nach Anmeldung

Das System muss der Nutzerin nach erfolgreicher Anmeldung ihre Prüfungsergebnisse mit Modul, Semester, ECTS, Status und Note anzeigen. Herkunft: Alt: alte apps/fb4_app-main/fb4_app-main/lib/areas/ods/views/grade_overview_page.dart (vormals NOTEN-F-010).

#### Scenario: Ergebnisse nach Anmeldung
- **WHEN** die Nutzerin sich erfolgreich angemeldet hat
- **THEN** zeigt das System ihre Prüfungsergebnisse mit Modul, Semester, ECTS, Status und Note an

### Requirement: Anmeldung ohne Zugangsdaten-Zwischenspeicherung

Das System muss die Anmeldung über SSO oder eine offizielle HISinOne-Authentifizierung durchführen, nicht über zwischengespeicherte Zugangsdaten mit erneutem Versand bei Sitzungsablauf. Herkunft: Alt: bewusst verworfen (vormals NOTEN-F-020).

#### Scenario: Anmeldung über SSO/HISinOne
- **WHEN** die Nutzerin sich anmeldet
- **THEN** führt das System die Anmeldung über SSO oder eine offizielle HISinOne-Authentifizierung durch, ohne Zugangsdaten zwischenzuspeichern und bei Sitzungsablauf erneut zu versenden

### Requirement: Unterscheidbare Nichtverfügbarkeit

Falls die Notenübersicht nicht verfügbar ist (Zugangsweg noch nicht implementiert oder HISinOne nicht erreichbar), muss das System dies eindeutig von einem allgemeinen Fehler unterscheidbar anzeigen. Herkunft: NEU (vormals NOTEN-F-030).

#### Scenario: Zugangsweg noch nicht implementiert
- **WHEN** der Zugangsweg zu HISinOne noch nicht implementiert oder HISinOne nicht erreichbar ist
- **THEN** zeigt das System dies eindeutig unterscheidbar von einem allgemeinen Fehler an

## Scope / Nicht-Scope

### Scope

- Anzeige der individuellen Prüfungsergebnisse (Modul, Semester, ECTS, Status, Note) nach erfolgreicher Anmeldung.
- Anmeldung über SSO oder eine offizielle HISinOne-Schnittstelle.

### Nicht-Scope

- Passwort-Replay-Verfahren nach Vorbild des abgelösten ODS-Zugriffs — ausdrücklich ausgeschlossen, siehe Capability `security-and-privacy` (vormals SEC-F-040).
- Serverseitige Speicherung von Hochschul-Zugangsdaten — ausgeschlossen, siehe Capability `backend-and-api` (vormals API-F-110).
- Detaillierte Prüfungsstatistiken oder Notenverlauf über die reine Übersicht hinaus — nicht Teil dieses Umfangs.
- Prüfungstermine (wann eine Prüfung stattfindet) — diese Capability zeigt ausschließlich Ergebnisse; Termine stehen in Capability `schedule` (vormals SCHED-F-190 bis F-220, aus dem separat importierten Prüfungsplan INT-013).

## Nutzergeschichten

- Als Studierende möchte ich meine aktuellen Prüfungsergebnisse in der App sehen, ohne mich erneut in einem separaten Portal anzumelden.
- Als Studierende möchte ich mich sicher anmelden, ohne dass die App mein Passwort dauerhaft speichert.

## Datenmodell

Prüfungsergebnis: Modul/Name, Semester, ECTS, Status, Versuch, Prüfungsart, Anmerkung, Note. Feldzuordnung orientiert an der Spaltenstruktur des abgelösten ODS-Verfahrens (siehe Capability `integrations`, INT-006); für HISinOne neu zu bestätigen.

## Externe Schnittstellen

Nutzt INT-006 (HISinOne). **Status offen** — siehe Capability `integrations`, dort auch das zum Vergleich dokumentierte, abgelöste ODS-Verfahren. Sofern INT-006 auf Hochschul-SSO aufbaut, besteht ein möglicher Zusammenhang zu INT-012 (Hochschul-SSO, siehe `specs/decisions/0004-identitaet-und-anmeldung.md`) — bei Umsetzung gemeinsam zu prüfen, ob ein einziger SSO-Anmeldevorgang für beide Zwecke ausreicht. Keine Endpunktdetails hier.

## UI-Flows & Zustände

| Zustand | Verhalten |
|---|---|
| Nicht angemeldet | Anmelde-Einstieg über SSO/HISinOne |
| Laden | Ladeanzeige während des Abrufs |
| Leer (keine Ergebnisse) | Hinweis „noch keine Prüfungsergebnisse hinterlegt" |
| Fehler | Fehlermeldung mit Wiederholen-Option |
| Nicht verfügbar (Spike noch offen) | Eindeutiger Hinweis „Notenübersicht noch nicht verfügbar", kein Fehlerzustand |

## Offline-Verhalten

Notenübersicht ist laut Capability `architecture` (Datenfluss-Tabelle) ein rein lesender Direktzugriff auf HISinOne; Offline-Verhalten (Zwischenspeicherung zuletzt geladener Ergebnisse vs. zwingend online) ist Teil der offenen Klärung zu INT-006 und nicht vorab festzulegen.

## Fehlerfälle

| Fall | Reaktion |
|---|---|
| Anmeldung schlägt fehl | Fehlermeldung, kein automatischer erneuter Versand von Zugangsdaten |
| HISinOne liefert unerwartetes Antwortformat | Fehler protokollieren, Notenübersicht als nicht verfügbar kennzeichnen |

## Nicht-funktionale Anforderungen

Keine über Capability `non-functional` hinausgehenden Anforderungen.

## Akzeptanzkriterien

Nicht abschließend definierbar, solange INT-006 offen ist. Vorläufig: Anmeldung erfolgt nachweislich ohne Zwischenspeicherung von Zugangsdaten im Klartext (siehe Requirement „Anmeldung ohne Zugangsdaten-Zwischenspeicherung").

## Bewusst nicht übernommenes Altverhalten

- Speicherung von Zugangsdaten im Klartext im Secure Storage mit erneutem Versand bei Tokenablauf (Passwort-Replay) — Grund: unsicheres Verfahren, siehe Capability `security-and-privacy` (vormals SEC-F-040).
- Fest verdrahtete interne IP-Adresse im Anmeldeformular — Grund: Betriebsdetail gehört nicht in den Quellcode, siehe Capability `security-and-privacy` (vormals SEC-F-050).
- HTML-Scraping einer formularbasierten Sitzung als Zugriffsverfahren — Grund: durch offizielle HISinOne-Schnittstelle bzw. SSO zu ersetzen.

## Offene Fragen

- Zugangsweg, Protokoll und Berechtigungen für HISinOne — zentrale offene Frage dieser Capability, Klärung durch den Spike in `specs/decisions/0006-abloesung-ods-durch-hisinone.md`.
- Ob und wie lange Ergebnisse geräteseitig zwischengespeichert werden dürfen — abhängig vom Ergebnis des Spikes.
- Belege aus der WhatsApp-Recherche (Recherche: WhatsApp-Chat fh-informatik-22-23 / informatik-pi-ti-ds-ws-24-25, 2026-08-25, siehe `specs/product/whatsapp-feedback-inventory.md`) erhöhen die Dringlichkeit des INT-006-Spikes, ändern aber nichts an dessen Klärungsbedarf — keine neuen funktionalen Anforderungen ableitbar, solange der Endpunkt offen ist.
