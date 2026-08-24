---
id: architecture
titel: Architektur
praefix: ARCH
status: draft
version: 0.1.0
owner: FSR FB4
last_reviewed: 2026-08-24
derived_from:
  - alte apps/fb4_app-main/fb4_app-main/lib/main.dart
  - alte apps/fb4_app-main/fb4_app-main/lib/core/views/base_view.dart
  - alte apps/fb4_app-main/fb4_app-main/lib/main_page.dart
  - alte apps/fb4_app-main/fb4_app-main/lib/areas/schedule/viewmodels/schedule_overview_viewmodel.dart
implemented_in: []
related:
  - backend-and-api.md
  - integrations.md
  - ../features/app-shell/spec.md
  - ../decisions/0001-react-native-als-plattform.md
---

# Architektur

## Zweck

Diese Spec legt die Systemarchitektur fest, an der sich alle Feature-Specs orientieren: Aufbau aus App, Backend und Fremdsystemen, Schichtenbildung in der App, Randbedingungen für die Navigation, das Offline-Prinzip, Lade-/Fehlerverhalten als Querschnitt und der Modulschnitt. Bibliothekswahl, Backend-Technologie und konkrete Bildschirmentwürfe sind ausgeklammert (Abschnitt 7).

## 1. Systemüberblick

Die App besteht aus drei Bausteinen: der React-Native-App, dem eigenen Backend (INT-008) und den externen Quellsystemen (INT-001 bis INT-007). Ein Datenfluss läuft direkt von der App zur Quelle, wenn er rein lesend ist und keine Aggregation über mehrere Abfragen benötigt; alle übrigen Datenflüsse laufen über das Backend. Die vier Gründe für das Backend im Einzelnen: `backend-and-api.md`.

| Datenfluss | Weg | Begründung |
|---|---|---|
| Stundenplan | App → FBWS (INT-001, INT-002), direkt | rein lesend, keine Aggregation nötig |
| Notenübersicht | App → HISinOne (INT-006), direkt | rein lesend, personenbezogen je Nutzer |
| Wiki | App → BookStack (INT-007), direkt | rein lesend, änderungsarm |
| Push-Abo | App → FCM (INT-005), direkt | Geräte-Abo, kein Nutzerinhalt |
| Mensa-Bewertung | App → Backend (INT-008) | Schreibpfad: Persistenz, Identitätsprüfung, Moderation |
| Helfer-Anmeldung | App → Backend (INT-008) | Schreibpfad: Persistenz, Identitätsprüfung |
| Raumbelegung | App → Backend (INT-008) | Aggregation über alle Studiengang/Semester-Kombinationen |
| News | App → Backend (INT-008) → INT-003 | Ablösung privater Infrastruktur |
| Mensa-Speiseplan | App → Backend (INT-008) → INT-004 | Ablösung privater Infrastruktur, TLS-Erzwingung |
| Events | App → Backend (INT-008) | FSR-Redaktion |

| ID | Anforderung | Herkunft |
|---|---|---|
| ARCH-F-010 | Das System muss aus den drei Bausteinen App, eigenes Backend und externe Quellsysteme bestehen. | NEU |
| ARCH-F-020 | Solange eine Ansicht ausschließlich lesend auf Stundenplandaten, Notenübersicht oder Wiki-Inhalte zugreift und keine Aggregation über mehrere Abfragen benötigt, muss die App diese Quelle direkt ansprechen. | NEU |
| ARCH-F-030 | Wenn eine Mensa-Bewertung oder eine Helfer-Anmeldung abgesendet wird, muss die App diesen Schreibvorgang ausschließlich an das eigene Backend senden. | NEU |
| ARCH-F-040 | Das System muss die Raumbelegung für die Raumsuche als vorab im Backend aggregierte Daten bereitstellen, nicht durch clientseitige Abfrage aller Studiengang/Semester-Kombinationen. | NEU |
| ARCH-F-050 | Das System muss News und Mensa-Speisepläne ausschließlich über den Zwischenspeicher des Backends beziehen, nicht durch direkten App-Aufruf von `hemacode.de`. | NEU |

## 2. Schichten in der App

Die App trennt Darstellung, Zustandshaltung, fachliche Logik und Datenzugriff. Die Alt-App realisierte das über MVVM mit einem Dependency-Injection-Container (`main.dart`) und `BaseView` (`core/views/base_view.dart`), das je Bildschirm ein ViewModel auflöst. Übernehmenswert: die klare Trennung Bildschirm/Logik und die UI-freie Testbarkeit der Fachlogik. Nicht übernehmenswert: `registerDependencies()` in `main.dart` registriert fast jedes ViewModel als `registerSingleton` (einzige Ausnahme: `AddCustomScheduleItemPageViewModel` als `registerFactory`), wodurch `BaseView` bei jedem `resolve<T>()` dieselbe Instanz liefert und Bildschirmzustand app-weit über Navigationswechsel hinweg bestehen bleibt — sichtbar an den langlebigen Instanzfeldern (`isLoading`, `editMode`) in `schedule_overview_viewmodel.dart`.

| ID | Anforderung | Herkunft |
|---|---|---|
| ARCH-F-060 | Das System muss App-seitig zwischen Darstellung, Zustandshaltung, fachlicher Logik und Datenzugriff trennen. | Alt: lib/core/views/base_view.dart:5-27 |
| ARCH-F-070 | Das System muss fachliche Logik so kapseln, dass sie ohne Rendering einer Benutzeroberfläche automatisiert testbar ist. | Alt: lib/areas/schedule/viewmodels/schedule_overview_viewmodel.dart:209-252 |
| ARCH-F-080 | Das System muss die Zustandshaltung eines Bildschirms an dessen Lebenszyklus binden, statt sie als app-weit langlebiges Singleton über Navigationswechsel hinweg zu erhalten. | Alt: bewusst verworfen |

## 3. Navigation

Die Alt-App zeigte fünf Tabs: Stundenplan, News, Mensa, Semesterticket, Mehr (`main_page.dart:29-53`). Raumsuche, Events, Helfer-Anmeldung und Wiki passen dort nicht mehr hinein. Der konkrete Entwurf der Navigationsstruktur gehört in `../features/app-shell/spec.md` (SHELL); hier stehen nur die Randbedingungen.

| ID | Anforderung | Herkunft |
|---|---|---|
| ARCH-F-090 | Das System muss jedem Kernfeature (Raumsuche, Stundenplan, Mensaplan, News, Event-Kalender, Helfer-Anmeldung, Wiki) einen von der Startseite aus in höchstens zwei Interaktionsschritten erreichbaren Einstiegspunkt bieten. | NEU |
| ARCH-N-010 | Das System muss die Navigationsstruktur so entwerfen, dass sie mehr als die fünf bisherigen Bereiche der Alt-App aufnehmen kann, ohne dass alle Bereiche als gleichrangige Einträge einer einzigen Tab-Leiste erscheinen. | Alt: bewusst verworfen |

## 4. Offline-first als Architekturprinzip

Ein Teil der Daten muss ohne Netz nutzbar sein, ein Teil zwingend nicht.

| Bereich | Offline verfügbar | Begründung |
|---|---|---|
| Stundenplan | ja, zuletzt geladener Stand | lokal persistiert |
| Semesterticket | ja, zuletzt geladener Stand | ändert sich selten |
| News | ja, zuletzt geladener Stand | geräteseitig gecachter Backend-Zwischenspeicher |
| Mensa-Speiseplan | ja, zuletzt geladener Stand | geräteseitig gecachter Backend-Zwischenspeicher |
| Raumsuche | nein | Ergebnis hängt von aktueller Backend-Aggregation ab |

Schreibende Vorgänge (Bewertung, Helfer-Anmeldung) dürfen offline nicht verlorengehen.

| ID | Anforderung | Herkunft |
|---|---|---|
| ARCH-F-100 | Solange keine Netzwerkverbindung besteht, muss die App den zuletzt geladenen Stundenplan, das zuletzt geladene Semesterticket sowie die zuletzt geladenen Speisepläne und News anzeigen. | Alt: lib/areas/schedule/viewmodels/schedule_overview_viewmodel.dart:93-152 |
| ARCH-F-110 | Solange keine Netzwerkverbindung besteht, muss die App die Raumsuche als nicht verfügbar kennzeichnen. | NEU |
| ARCH-F-120 | Wenn eine Bewertung oder eine Helfer-Anmeldung ohne Netzwerkverbindung ausgelöst wird, muss die App den Vorgang in eine lokale Warteschlange einreihen und bei wiederhergestellter Verbindung automatisch übertragen. | NEU |

Zu ARCH-F-120: Die Warteschlange darf einen Vorgang bei erneuter Übertragung nicht doppelt wirksam werden lassen (z. B. eine Bewertung nicht doppelt zählen). Das setzt Idempotenz auf Backend-Seite voraus, siehe `backend-and-api.md`, API-F-140.

## 5. Fehler- und Ladeverhalten als Querschnitt

Jede Ansicht, die entfernte Daten zeigt, braucht vier Zustände. Das ist eine architektonische Vorgabe, keine Einzelfallentscheidung je Bildschirm.

| ID | Anforderung | Herkunft |
|---|---|---|
| ARCH-F-130 | Das System muss für jede Ansicht, die entfernte Daten anzeigt, einen Lade-, Leer-, Fehler- und Offline-Zustand bereitstellen. | NEU |
| ARCH-N-020 | Das System muss diese vier Zustände über eine wiederverwendbare Grundstruktur realisieren, statt sie je Bildschirm neu zu definieren. | NEU |

## 6. Modulschnitt

Die Alt-App schnitt Quellcode nach Fachbereichen: `areas/<bereich>/{models,repositories,viewmodels,screens,widgets}` (verifiziert u. a. für `areas/schedule`, `areas/news`, `areas/canteen`; nicht jeder Bereich nutzt alle fünf Unterordner). Dieses Muster ist tragfähig und wird übernommen.

| ID | Anforderung | Herkunft |
|---|---|---|
| ARCH-F-140 | Das System muss den Quellcode nach fachlichen Bereichen schneiden, sodass Modelle, Datenzugriff, Zustandshaltung und Bildschirme eines Bereichs zusammen auffindbar sind. | Alt: lib/areas/schedule/ |

## 7. Abgrenzung

- Bibliothekswahl (State-Management, Navigation, Netzwerk-Client) — nicht Teil dieser Spec.
- Backend-Technologie — `../decisions/0003-eigenes-backend-fuer-community-funktionen.md`.
- Konkrete Bildschirmentwürfe — jeweilige Feature-Spec und `ux-and-theming.md`.

## 8. Offene Fragen

- Konkrete Navigationsstruktur (Tab-Leiste, Drawer, Sammel-Einstieg o. Ä.) — `../features/app-shell/spec.md`, Klärung durch FSR FB4 und UX.
- Speichergrenzen und Konfliktbehandlung der Offline-Warteschlange — Klärung bei Umsetzung von `backend-and-api.md` und der betroffenen Feature-Specs (RATE, HELFER).
