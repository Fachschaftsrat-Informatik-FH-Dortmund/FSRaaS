---
id: grades
titel: Notenübersicht
praefix: NOTEN
status: draft
prioritaet: bestand
version: 0.2.1
owner: FSR FB4
last_reviewed: 2026-08-25
derived_from:
  - alte apps/fb4_app-main/fb4_app-main/lib/areas/ods/repositories/ods_repository.dart
  - alte apps/fb4_app-main/fb4_app-main/lib/areas/ods/services/ods_authentication_service.dart
  - alte apps/fb4_app-main/fb4_app-main/lib/areas/ods/viewmodels/grades_overview_page_viewmodel.dart
  - alte apps/fb4_app-main/fb4_app-main/lib/areas/ods/views/grade_overview_page.dart
implemented_in: []
related:
  - ../../platform/integrations.md
  - ../../platform/security-and-privacy.md
  - ../../decisions/0006-abloesung-ods-durch-hisinone.md
  - ../../decisions/0004-identitaet-und-anmeldung.md
  - ../schedule/spec.md
  - ../../product/whatsapp-feedback-inventory.md
---

# Notenübersicht

## 1. Zweck & Nutzen

Zeigt Studierenden ihre Prüfungsergebnisse, ohne das separate HISinOne-Webportal aufsuchen zu müssen. Übernimmt die fachliche Zielsetzung der Alt-App (dort gegen das inzwischen abgelöste ODS-System), muss aber vollständig neu an HISinOne angebunden werden — der Zugangsweg ist Gegenstand eines noch ausstehenden Spikes (INT-006). Die WhatsApp-Recherche (`product/whatsapp-feedback-inventory.md`) bestätigt wiederkehrende Verwirrung unter Studis rund um den HISinOne-Notenabruf und damit die Priorität dieses ansonsten blockierten Features, ändert aber nichts am Klärungsbedarf des Zugangswegs selbst.

## 2. Scope / Nicht-Scope

### Scope

- Anzeige der individuellen Prüfungsergebnisse (Modul, Semester, ECTS, Status, Note) nach erfolgreicher Anmeldung.
- Anmeldung über SSO oder eine offizielle HISinOne-Schnittstelle.

### Nicht-Scope

- Passwort-Replay-Verfahren nach Vorbild des abgelösten ODS-Zugriffs — ausdrücklich ausgeschlossen, siehe `platform/security-and-privacy.md` SEC-F-040.
- Serverseitige Speicherung von Hochschul-Zugangsdaten — ausgeschlossen, siehe `platform/backend-and-api.md` API-F-110.
- Detaillierte Prüfungsstatistiken oder Notenverlauf über die reine Übersicht hinaus — nicht Teil dieses Umfangs.
- Prüfungstermine (wann eine Prüfung stattfindet) — diese Spec zeigt ausschließlich Ergebnisse; Termine stehen in `features/schedule/spec.md` (SCHED-F-190 bis F-220, aus dem separat importierten Prüfungsplan INT-013).

## 3. Nutzergeschichten

- Als Studierende möchte ich meine aktuellen Prüfungsergebnisse in der App sehen, ohne mich erneut in einem separaten Portal anzumelden.
- Als Studierende möchte ich mich sicher anmelden, ohne dass die App mein Passwort dauerhaft speichert.

## 4. Funktionale Anforderungen

**Status: Umsetzung dieser Spec ist blockiert, bis der Spike zu INT-006 (`decisions/0006-abloesung-ods-durch-hisinone.md`) den Zugangsweg zu HISinOne klärt.** Die folgenden Anforderungen beschreiben das fachliche Ziel unabhängig vom noch unbekannten technischen Zugangsweg; sie sind nicht final, solange INT-006 offen ist.

| ID | Anforderung | Herkunft |
|---|---|---|
| NOTEN-F-010 | Das System muss der Nutzerin nach erfolgreicher Anmeldung ihre Prüfungsergebnisse mit Modul, Semester, ECTS, Status und Note anzeigen. | Alt: alte apps/fb4_app-main/fb4_app-main/lib/areas/ods/views/grade_overview_page.dart |
| NOTEN-F-020 | Das System muss die Anmeldung über SSO oder eine offizielle HISinOne-Authentifizierung durchführen, nicht über zwischengespeicherte Zugangsdaten mit erneutem Versand bei Sitzungsablauf. | Alt: bewusst verworfen |
| NOTEN-F-030 | Falls die Notenübersicht nicht verfügbar ist (Zugangsweg noch nicht implementiert oder HISinOne nicht erreichbar), muss das System dies eindeutig von einem allgemeinen Fehler unterscheidbar anzeigen. | NEU |

## 5. Datenmodell

Prüfungsergebnis: Modul/Name, Semester, ECTS, Status, Versuch, Prüfungsart, Anmerkung, Note. Feldzuordnung orientiert an der Spaltenstruktur des abgelösten ODS-Verfahrens (siehe INT-006 in `platform/integrations.md`); für HISinOne neu zu bestätigen.

## 6. Externe Schnittstellen

Nutzt INT-006 (HISinOne). **Status offen** — siehe `platform/integrations.md`, dort auch das zum Vergleich dokumentierte, abgelöste ODS-Verfahren. Sofern INT-006 auf Hochschul-SSO aufbaut, besteht ein möglicher Zusammenhang zu INT-012 (Hochschul-SSO, siehe `decisions/0004-identitaet-und-anmeldung.md`) — bei Umsetzung gemeinsam zu prüfen, ob ein einziger SSO-Anmeldevorgang für beide Zwecke ausreicht. Keine Endpunktdetails hier.

## 7. UI-Flows & Zustände

| Zustand | Verhalten |
|---|---|
| Nicht angemeldet | Anmelde-Einstieg über SSO/HISinOne |
| Laden | Ladeanzeige während des Abrufs |
| Leer (keine Ergebnisse) | Hinweis „noch keine Prüfungsergebnisse hinterlegt" |
| Fehler | Fehlermeldung mit Wiederholen-Option |
| Nicht verfügbar (Spike noch offen) | Eindeutiger Hinweis „Notenübersicht noch nicht verfügbar", kein Fehlerzustand (NOTEN-F-030) |

## 8. Offline-Verhalten

Notenübersicht ist laut `platform/architecture.md` Datenfluss-Tabelle ein rein lesender Direktzugriff auf HISinOne; Offline-Verhalten (Zwischenspeicherung zuletzt geladener Ergebnisse vs. zwingend online) ist Teil der offenen Klärung zu INT-006 und nicht vorab festzulegen.

## 9. Fehlerfälle

| Fall | Reaktion |
|---|---|
| Anmeldung schlägt fehl | Fehlermeldung, kein automatischer erneuter Versand von Zugangsdaten |
| HISinOne liefert unerwartetes Antwortformat | Fehler protokollieren, Notenübersicht als nicht verfügbar kennzeichnen |

## 10. Nicht-funktionale Anforderungen

Keine über `platform/non-functional.md` hinausgehenden Anforderungen.

## 11. Akzeptanzkriterien

Nicht abschließend definierbar, solange INT-006 offen ist. Vorläufig: Anmeldung erfolgt nachweislich ohne Zwischenspeicherung von Zugangsdaten im Klartext (NOTEN-F-020).

## 12. Bewusst nicht übernommenes Altverhalten

- Speicherung von Zugangsdaten im Klartext im Secure Storage mit erneutem Versand bei Tokenablauf (Passwort-Replay) — Grund: unsicheres Verfahren, siehe `platform/security-and-privacy.md` SEC-F-040.
- Fest verdrahtete interne IP-Adresse im Anmeldeformular — Grund: Betriebsdetail gehört nicht in den Quellcode, siehe `platform/security-and-privacy.md` SEC-F-050.
- HTML-Scraping einer formularbasierten Sitzung als Zugriffsverfahren — Grund: durch offizielle HISinOne-Schnittstelle bzw. SSO zu ersetzen.

## 13. Offene Fragen

- Zugangsweg, Protokoll und Berechtigungen für HISinOne — zentrale offene Frage dieser Spec, Klärung durch den Spike in `decisions/0006-abloesung-ods-durch-hisinone.md`.
- Ob und wie lange Ergebnisse geräteseitig zwischengespeichert werden dürfen — abhängig vom Ergebnis des Spikes.
- Belege aus der WhatsApp-Recherche (Recherche: WhatsApp-Chat fh-informatik-22-23 / informatik-pi-ti-ds-ws-24-25, 2026-08-25) erhöhen die Dringlichkeit des INT-006-Spikes, ändern aber nichts an dessen Klärungsbedarf — keine neuen funktionalen Anforderungen ableitbar, solange der Endpunkt offen ist.
