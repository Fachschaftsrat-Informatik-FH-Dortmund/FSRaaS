---
id: settings
titel: Einstellungen
praefix: SET
status: accepted
prioritaet: bestand
version: 0.3.1
owner: FSR FB4
last_reviewed: 2026-09-03
derived_from:
  - alte apps/android-fb4/FB4/fB4/src/main/java/de/fsrfb4/fb4/fragments/LinksDownloadsFragment.java
  - alte apps/android-fb4/FB4/fB4/src/main/java/de/fsrfb4/fb4/fragments/UserSettingFragment.java
  - alte apps/fb4_app-main/fb4_app-main/lib/app_constants.dart
  - alte apps/fb4_app-main/fb4_app-main/lib/core/settings/settings_service.dart
  - alte apps/fb4_app-main/fb4_app-main/lib/areas/more/screens/settings_page.dart
  - alte apps/fb4_app-main/fb4_app-main/lib/areas/more/screens/privacy_page.dart
  - alte apps/fb4_app-main/fb4_app-main/lib/areas/more/screens/licenses_page.dart
implemented_in:
  - app/src/theme           # SET-F-020 (Erscheinungsbild-Wahl, Schlüssel appearanceMode)
  - app/src/i18n            # SET-F-100/F-110 (Sprachwahl, Schlüssel uiLanguage)
  - app/src/navigation      # SET-F-160 (Startansicht-Wahl, Schlüssel startView)
  - app/src/areas/settings  # Einstellungsbildschirm (Teilumfang: Erscheinungsbild, Sprache, Startansicht, Mensen-Auswahl-Einstieg)
  - app/src/areas/canteen   # SET-F-030, SET-F-150 (Auswahl und Reihenfolge der angezeigten Mensen)
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
- Wahl der Startansicht (siehe `features/app-shell/spec.md` SHELL-F-070).
- Mensa-Auswahl (siehe `features/canteen/spec.md`).
- Datenschutzerklärung, Einwilligungsstatus, „Alle lokalen Daten löschen".
- Lizenzhinweise (Open-Source-Bibliotheken).
- Wahl der Oberflächensprache.
- Liste externer Links und Downloads.
- Angaben zur App (Version, FSR-Kontakt, Rückmeldeweg).

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
| SET-F-100 | Das System muss der Nutzerin die Wahl der Oberflächensprache zwischen Deutsch und Englisch ermöglichen. | NEU |
| SET-F-110 | Solange die Nutzerin keine Sprache gewählt hat, muss das System die Sprache der Systemeinstellung verwenden. | NEU |
| SET-F-120 | Das System muss eine Liste externer Links und Downloads anzeigen, die serverseitig gepflegt wird. | Alt: alte apps/fb4_app-main/fb4_app-main/lib/areas/more/screens/links_downloads_page.dart |
| SET-F-130 | Das System muss die Anzeigeversion und die Build-Nummer der laufenden App anzeigen, aus dem Build gelesen. | Alt: bewusst verworfen |
| SET-F-140 | Das System muss einen Rückmeldeweg an den FSR bereitstellen. | Alt: alte apps/fb4_app-main/fb4_app-main/lib/areas/more/screens/more_list_page.dart:47 |
| SET-F-150 | Das System muss der Nutzerin das Festlegen der Reihenfolge der angezeigten Mensen ermöglichen (siehe `features/canteen/spec.md` MENSA-F-025). | Recherche: alte apps/android-fb4, activities/MenuSortActivity.java, 2026-08-25 |
| SET-F-160 | Das System muss der Nutzerin die Wahl der Startansicht ermöglichen: einer der vier Tab-Bereiche oder „zuletzt genutzt". | NEU |

### Erläuterungen

**`SET-F-100`/`SET-F-110`** — `platform/non-functional.md` NFR-F-115 fordert die Wahl zwischen Deutsch und Englisch, benannte bis zum 2026-08-25 aber keine Stelle, an der sie getroffen wird. Beide Alt-Apps liefern hier Vorbilder in unterschiedlicher Ausprägung: Die Flutter-App ist einsprachig, die Android-App bereits zweisprachig über Systemressourcen (`res/values`, `res/values-de`), allerdings ohne eigene Umschaltmöglichkeit — sie folgt der Systemsprache. SET-F-110 übernimmt dieses Verhalten als Voreinstellung, SET-F-100 ergänzt die ausdrückliche Wahl für Nutzerinnen, die eine andere Sprache bevorzugen als ihr Gerät. Datums-, Zeit- und Währungsformate bleiben davon unberührt (NFR-F-120).

**`SET-F-120`** — Die Flutter-Alt-App führt zehn fest im Quellcode hinterlegte Links (L-073); die Android-Alt-App bezieht dieselbe Liste ferngepflegt vom Backend (`fragments/LinksDownloadsFragment.java`, Schlüssel `links` und `file_downloads`). Die ferngepflegte Variante wird übernommen, damit ein geänderter Link nicht ein App-Update über drei Vertriebswege erfordert. Pflege über `../admin/spec.md`, Auslieferung über API-F-230. Dies löst zugleich den in `../../product/legacy-inventory.md` Abschnitt 5 vermerkten Nachtrag zur Links-Liste ein.

**`SET-F-130`** — Die Flutter-Alt-App zeigt eine fest einprogrammierte Versionsnummer (`more_list_page.dart:157`, dokumentiert als M-006), die dadurch von der tatsächlich installierten Version abweichen kann. Da `platform/non-functional.md` NFR-N-230 verlangt, dass ein Fehlerbericht eindeutig einer Quellcode-Version zuordenbar ist, muss die angezeigte Version aus dem Build stammen.

**`SET-F-160`** — Neu aus `../app-shell/nutzerfuehrung-konzept.md` Abschnitt 12. Voreinstellung ist der Stundenplan (`../app-shell/spec.md` SHELL-F-070). Die Option „zuletzt genutzt" merkt sich den zuletzt aktiven Tab lokal (Einstellungsschlüssel-Ergänzung, Abschnitt 5); die zuvor offene Frage nach ihrem Aufwand ist mit der Umsetzung beantwortet — ein zusätzlich vermerkter Tab-Schlüssel genügt.

**Umsetzungsstand (Roadmap-Schritt 2, ergänzt Schritt 4).** Umgesetzt sind SET-F-020 (Erscheinungsbild), SET-F-100/F-110 (Sprachwahl) und SET-F-160 (Startansicht) aus Schritt 2 sowie SET-F-030 und SET-F-150 (Auswahl und Reihenfolge der angezeigten Mensen) aus Schritt 4; alle wirken sofort, ohne separaten Speichern-Schritt. Die Mensen-Auswahl liegt fachlich in `../canteen/spec.md` (MENSA-F-020/F-025) und ist sowohl aus den Einstellungen als auch aus dem Leerzustand des Mensaplans erreichbar. Die übrigen SET-Anforderungen folgen mit ihren jeweiligen Funktionen (Stundenplan-Schalter mit Schritt 5, Ticket-Helligkeit mit Schritt 8, Push mit der zweiten Ausbaustufe, Links/Downloads mit Schritt 7, Datenschutz-/Lösch-/Lizenz-/Rückmelde-Ansichten mit Schritt 10 bzw. den betroffenen Features). `status` bleibt daher `accepted`.

## 5. Datenmodell

Einstellungsschlüssel: siehe `platform/data-and-storage.md` Abschnitt 3, ergänzt um zwei Schlüssel aus der Neuentwicklung:

| Schlüssel | Werte | Bedeutung |
|---|---|---|
| `appearanceMode` | `system` \| `light` \| `dark` | Erscheinungsbild-Wahl (SET-F-020, `platform/ux-and-theming.md` UX-F-030); `system` folgt der Systemeinstellung zur Laufzeit (UX-F-020) |
| `uiLanguage` | `system` \| `de` \| `en` | Oberflächensprache (SET-F-100); `system` folgt der Systemsprache (SET-F-110) |
| `startView` | `schedule` \| `canteen` \| `news` \| `rooms` \| `last` | Startansicht beim regulären Start (SET-F-160, `../app-shell/spec.md` SHELL-F-070) |
| `lastTab` | `schedule` \| `canteen` \| `news` \| `rooms` \| `more` | Zuletzt aktiver Tab, nur ausgewertet wenn `startView` = `last` |

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

- Die fünf als Einstellung bedienbaren Schlüssel der Flutter-Alt-App (Push bei News, Mensa-Auswahl, Sprung zum aktuellen Wochentag, Helligkeit in der Ticketansicht, Datenschutz-Einwilligung) sind vorhanden und wirken sich unmittelbar aus. Die übrigen drei der acht in `platform/data-and-storage.md` Abschnitt 3 gelisteten Schlüssel sind bewusst keine Einstellungen: Angepinnte Meldungen entstehen in NEWS, der Schnellzugriff auf das Ticket in SHELL/TICKET.
- Die gewählte Oberflächensprache wirkt sich ohne Neustart der App aus (SET-F-100).
- Die angezeigte Version stimmt mit der installierten Build-Nummer überein (SET-F-130).
- „Alle lokalen Daten löschen" entfernt tatsächlich alle in `platform/data-and-storage.md` Abschnitt 2 gelisteten Datenklassen.

## 12. Bewusst nicht übernommenes Altverhalten

- Fest einprogrammierte Versionsangabe im Über-Dialog — Grund: kann von der installierten Version abweichen und macht Fehlerberichte unzuverlässig, siehe SET-F-130.
- Fest im Quellcode hinterlegte Links-Liste — Grund: jede Änderung erforderte ein App-Update über drei Vertriebswege, siehe SET-F-120.
- Wirkungsloses Datenschutz-Gate (SEC-F-010) — hier nur als Einstiegspunkt (SET-F-060) betroffen, nicht als eigener Befund.

## 13. Offene Fragen

- Ob ein zusätzlicher Schalter für Lieblingsgericht-Benachrichtigungen nötig ist (offene Frage aus `../canteen/spec.md` Abschnitt 13) — für den ersten Umfang genügt das Markieren und Entmarkieren einzelner Gerichte als Ein- und Ausschalter.
- Technische Orchestrierung der Kontolöschung (SET-F-090) über mehrere Backend-Ressourcen hinweg (Bewertungen, E-Key, Push-Kennung) — das Ergebnis ist bereits generisch festgelegt (`platform/identity-and-moderation.md` IDENT-F-130: alle personenbezogenen Daten der Person löschen, entkoppelte Bewertungsinhalte ausgenommen), offen ist nur die Umsetzung im Backend, keine Scope-Frage mehr.
