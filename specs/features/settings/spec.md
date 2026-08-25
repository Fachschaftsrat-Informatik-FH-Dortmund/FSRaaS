---
id: settings
titel: Einstellungen
praefix: SET
status: draft
prioritaet: bestand
version: 0.1.1
owner: FSR FB4
last_reviewed: 2026-08-25
derived_from:
  - alte apps/fb4_app-main/fb4_app-main/lib/app_constants.dart
  - alte apps/fb4_app-main/fb4_app-main/lib/core/settings/settings_service.dart
  - alte apps/fb4_app-main/fb4_app-main/lib/areas/more/screens/settings_page.dart
  - alte apps/fb4_app-main/fb4_app-main/lib/areas/more/screens/privacy_page.dart
  - alte apps/fb4_app-main/fb4_app-main/lib/areas/more/screens/licenses_page.dart
implemented_in: []
related:
  - ../../platform/data-and-storage.md
  - ../../platform/security-and-privacy.md
  - ../../platform/ux-and-theming.md
  - ../../platform/integrations.md
  - ../news/spec.md
---

# Einstellungen

## 1. Zweck & Nutzen

Bündelt gerätebezogene Voreinstellungen, Datenschutz-Einwilligung, Erscheinungsbild und rechtliche Angaben an einem Ort. Übernimmt die acht fachlichen Einstellungsschlüssel der Alt-App (`platform/data-and-storage.md` Abschnitt 3) und ergänzt sie um die aus der Neuentwicklung entstehenden Optionen (Erscheinungsbild-Übersteuerung, Konto-/Datenlöschung).

## 2. Scope / Nicht-Scope

### Scope

- Push-Benachrichtigungs-Opt-in (INT-005).
- Erscheinungsbild (hell/dunkel/systemabhängig), siehe `platform/ux-and-theming.md` UX-F-030.
- Mensa-Auswahl (siehe `features/canteen/spec.md`).
- Datenschutzerklärung, Einwilligungsstatus, „Alle lokalen Daten löschen".
- Lizenzhinweise (Open-Source-Bibliotheken).

### Nicht-Scope

- Kontolöschung serverseitig gespeicherter personenbezogener Daten (Bewertungen, Helfer-Anmeldungen) im Detail — Ablauf ist Sache von `platform/identity-and-moderation.md` (IDENT-F-130), hier nur als Einstiegspunkt verlinkt.

## 3. Nutzergeschichten

- Als Studierende möchte ich Push-Benachrichtigungen für News ein- oder ausschalten.
- Als Studierende möchte ich zwischen hellem, dunklem und systemabhängigem Erscheinungsbild wählen.
- Als Studierende möchte ich alle lokal gespeicherten Daten auf einmal löschen können.

## 4. Funktionale Anforderungen

| ID | Anforderung | Herkunft |
|---|---|---|
| SET-F-010 | Das System muss der Nutzerin das Ein- und Ausschalten von Push-Benachrichtigungen für News ermöglichen. | Alt: alte apps/fb4_app-main/fb4_app-main/lib/app_constants.dart:32 (`notificationOnNews`) |
| SET-F-020 | Das System muss der Nutzerin die Wahl zwischen hellem, dunklem und systemabhängigem Erscheinungsbild ermöglichen. | NEU |
| SET-F-030 | Das System muss der Nutzerin die Auswahl der angezeigten Mensen ermöglichen. | Alt: alte apps/fb4_app-main/fb4_app-main/lib/app_constants.dart:32 (`settingsEnabledCanteenIds`) |
| SET-F-040 | Das System muss der Nutzerin die Einstellung „beim Öffnen des Stundenplans zum aktuellen Wochentag springen" ermöglichen. | Alt: alte apps/fb4_app-main/fb4_app-main/lib/app_constants.dart:32 (`goToCurrentDayInSchedule`) |
| SET-F-050 | Das System muss der Nutzerin die Einstellung „Bildschirmhelligkeit in der Ticketansicht erhöhen" ermöglichen. | Alt: alte apps/fb4_app-main/fb4_app-main/lib/app_constants.dart:32 (`increaseDisplayBrightnessInTicketView`) |
| SET-F-060 | Das System muss die aktuelle Datenschutzerklärung sowie den Zeitpunkt und die Version der zuletzt erteilten Einwilligung anzeigen. | Alt: alte apps/fb4_app-main/fb4_app-main/lib/areas/more/screens/privacy_page.dart |
| SET-F-070 | Das System muss eine Aktion „Alle lokalen Daten löschen" mit vorheriger Bestätigung bereitstellen. | Alt: alte apps/fb4_app-main/fb4_app-main/lib/areas/more/screens/settings_page.dart:37 |
| SET-F-080 | Das System muss eine Übersicht der verwendeten Open-Source-Bibliotheken mit Lizenzhinweisen bereitstellen. | Alt: alte apps/fb4_app-main/fb4_app-main/lib/areas/more/screens/licenses_page.dart |
| SET-F-090 | Das System muss einen Einstiegspunkt zur Löschung des eigenen Kontos und aller serverseitig gespeicherten personenbezogenen Daten bereitstellen. | NEU |

## 5. Datenmodell

Einstellungsschlüssel: siehe `platform/data-and-storage.md` Abschnitt 3, ergänzt um `appearanceMode` (hell/dunkel/systemabhängig, siehe `platform/ux-and-theming.md` UX-F-030).

## 6. Externe Schnittstellen

Nutzt INT-005 (Push-Benachrichtigungen) für das Opt-in. `SET-F-090` löst serverseitig einen Vorgang gemäß `platform/identity-and-moderation.md` (IDENT-F-130) über das eigene Backend INT-008 aus. Keine Endpunktdetails hier.

## 7. UI-Flows & Zustände

| Zustand | Verhalten |
|---|---|
| Regulär | Liste der Einstellungen, sofortige Wirkung ohne separaten Speichern-Schritt |
| Löschbestätigung | Bestätigungsdialog vor „Alle lokalen Daten löschen" bzw. Kontolöschung (siehe `platform/ux-and-theming.md` UX-F-120) |

## 8. Offline-Verhalten

Alle lokalen Einstellungen sind offline änderbar. Kontolöschung (SET-F-090) erfordert Netzzugriff; ohne Verbindung wird die Anfrage in die Offline-Warteschlange eingereiht (analog `platform/data-and-storage.md` Abschnitt 5).

## 9. Fehlerfälle

| Fall | Reaktion |
|---|---|
| Push-Aktivierung ohne erteilte Systemberechtigung für Benachrichtigungen | Hinweis auf fehlende Systemberechtigung mit Verweis auf die Systemeinstellungen |
| Kontolöschung schlägt serverseitig fehl | Fehlermeldung mit Wiederholen-Option, lokale Daten bleiben bis zum bestätigten Erfolg unverändert |

## 10. Nicht-funktionale Anforderungen

Keine über `platform/non-functional.md` hinausgehenden Anforderungen.

## 11. Akzeptanzkriterien

- Alle acht aus der Alt-App übernommenen Einstellungen sind vorhanden und wirken sich unmittelbar aus.
- „Alle lokalen Daten löschen" entfernt tatsächlich alle in `platform/data-and-storage.md` Abschnitt 2 gelisteten Datenklassen.

## 12. Bewusst nicht übernommenes Altverhalten

Keines über die bereits in `platform/security-and-privacy.md` (SEC-F-010, wirkungsloses Datenschutz-Gate) dokumentierten Befunde hinaus — hier nur als Einstiegspunkt (SET-F-060) betroffen, nicht als eigener Befund.

## 13. Offene Fragen

- Technische Orchestrierung der Kontolöschung (SET-F-090) über mehrere Backend-Ressourcen hinweg (Bewertungen, E-Key, Push-Kennung) — das Ergebnis ist bereits generisch festgelegt (`platform/identity-and-moderation.md` IDENT-F-130: alle personenbezogenen Daten der Person löschen, entkoppelte Bewertungsinhalte ausgenommen), offen ist nur die Umsetzung im Backend, keine Scope-Frage mehr.
