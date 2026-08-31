---
id: architecture
titel: Architektur
praefix: ARCH
status: accepted
version: 1.1.1
owner: FSR FB4
last_reviewed: 2026-08-28
derived_from:
  - alte apps/fb4_app-main/fb4_app-main/lib/main.dart
  - alte apps/fb4_app-main/fb4_app-main/lib/core/views/base_view.dart
  - alte apps/fb4_app-main/fb4_app-main/lib/main_page.dart
  - alte apps/fb4_app-main/fb4_app-main/lib/areas/schedule/viewmodels/schedule_overview_viewmodel.dart
implemented_in:
  - app/src/ui/state        # ARCH-F-130, ARCH-N-020
  - app/src/state           # ARCH-F-150, ARCH-N-030 (Server-Zustandsschicht, ADR 0013)
related:
  - backend-and-api.md
  - integrations.md
  - ../features/app-shell/spec.md
  - ../decisions/0001-react-native-als-plattform.md
  - ../decisions/0008-vertrieb-ueber-drei-app-stores.md
  - ../decisions/0013-zustand-navigation-und-netzwerkschicht.md
---

# Architektur

## Zweck

Diese Spec legt die Systemarchitektur fest, an der sich alle Feature-Specs orientieren: Aufbau aus App, Backend und Fremdsystemen, Schichtenbildung in der App, Randbedingungen für die Navigation, das Offline-Prinzip, Lade-/Fehlerverhalten als Querschnitt und der Modulschnitt. Bibliothekswahl, Backend-Technologie und konkrete Bildschirmentwürfe sind ausgeklammert (Abschnitt 7).

## 1. Systemüberblick

Die App besteht aus drei Bausteinen: der React-Native-App, dem eigenen Backend (INT-008, betrieben vom FSR FB4 auf einem eigenen Hetzner-VPS) und den externen Quellsystemen (INT-001 bis INT-007, INT-009 bis INT-011). Ein Datenfluss läuft direkt von der App zur Quelle, wenn er rein lesend ist und keine Aggregation über mehrere Abfragen benötigt; alle übrigen Datenflüsse laufen über das Backend. Die vier Gründe für das Backend im Einzelnen: `backend-and-api.md`.

| Datenfluss | Weg | Begründung |
|---|---|---|
| Stundenplan | App → FBWS (INT-001, INT-002), direkt | rein lesend, keine Aggregation nötig |
| Notenübersicht | App → HISinOne (INT-006), direkt | rein lesend, personenbezogen je Nutzer |
| Wiki | App → BookStack (INT-007), direkt | rein lesend, änderungsarm |
| Push-Abo | App → UnifiedPush-Distributor bzw. FCM (INT-005, plattformabhängig), direkt | Geräte-Abo, kein Nutzerinhalt |
| Mensa-Bewertung | App → Backend (INT-008) | Schreibpfad: Persistenz, Identitätsprüfung, Moderation |
| Helfer-Anmeldung | App → Backend (INT-008) | Schreibpfad: Persistenz, Identitätsprüfung |
| Raumbelegung | App → Backend (INT-008) → INT-009 | Zwischenspeicher; ein Platzhalter-Aufruf liefert alle Raumtermine, keine Aggregation nötig |
| News (FSR-News) | App → Backend (INT-008) → INT-003 | Ablösung privater Infrastruktur |
| News (FB-Aktuelles) | App → Backend (INT-008) → INT-010 | Zwischenspeicher, keine direkte App-Abhängigkeit von der Fachbereichsseite |
| Mensa-Speiseplan | App → Backend (INT-008) → INT-015 | Zwischenspeicher, Ausfallpuffer; Ablösung privater Infrastruktur |
| Events | App → Backend (INT-008) → INT-011 | Import aus vom FSR gepflegtem ICS-Kalender, keine Backend-Redaktionsoberfläche (Entscheidung FSR FB4, 2026-08-25) |
| Anmeldung (Konto) | App bzw. Admin-Oberfläche → Authentik (INT-012), direkt | Redirect-Fluss im Systembrowser; die App nimmt nie Zugangsdaten entgegen |
| Verwaltung und Redaktion | Admin-Oberfläche → Backend (INT-008) | Schreibpfad mit Rollenprüfung, siehe `../features/admin/spec.md` |

| ID | Anforderung | Herkunft |
|---|---|---|
| ARCH-F-010 | Das System muss aus den drei Bausteinen App, eigenes Backend und externe Quellsysteme bestehen. | NEU |
| ARCH-F-020 | Solange eine Ansicht ausschließlich lesend auf Stundenplandaten, Notenübersicht oder Wiki-Inhalte zugreift und keine Aggregation über mehrere Abfragen benötigt, muss die App diese Quelle direkt ansprechen. | NEU |
| ARCH-F-030 | Wenn eine Mensa-Bewertung oder eine Helfer-Anmeldung abgesendet wird, muss die App diesen Schreibvorgang ausschließlich an das eigene Backend senden. | NEU |
| ~~ARCH-F-040~~ | ~~Das System muss die Raumbelegung für die Raumsuche als vorab im Backend aggregierte Daten bereitstellen, nicht durch clientseitige Abfrage aller Studiengang/Semester-Kombinationen.~~ — entfallen | NEU |
| ARCH-F-045 | Das System muss die Raumtermine über den Zwischenspeicher des Backends beziehen, nicht durch direkten App-Aufruf des Hochschulsystems. | NEU |
| ARCH-F-050 | Das System muss News und Mensa-Speisepläne ausschließlich über den Zwischenspeicher des Backends beziehen, nicht durch direkten App-Aufruf der jeweiligen Quelle. | NEU |

**ARCH-F-040 (entfallen).** Diese Anforderung ging davon aus, der Hochschuldienst biete keinen eigenen Raumbelegungs-Endpunkt, weshalb die Termine aller Studiengang/Semester-Kombinationen zusammengeführt werden müssten. Die Annahme ist in zwei Schritten widerlegt worden: Am 2026-08-24 wurde mit INT-009 ein raumbezogener Endpunkt gefunden, am 2026-08-25 zeigte die Auswertung des Android-Quellcodes, dass dieser Endpunkt mit einem Platzhalter aufgerufen werden kann und **alle** Raumtermine in einem einzigen Aufruf liefert (Endpunktdetails: `integrations.md`, INT-009). Die Zusammenführung entfällt damit ersatzlos. Ersetzt durch ARCH-F-045, das nur noch den Bezugsweg über den Zwischenspeicher festlegt — aus denselben Gründen wie bei News und Mensa (Ausfallpuffer, TLS-Erzwingung, keine unmittelbare App-Abhängigkeit vom Hochschulsystem), nicht wegen Aggregationsbedarf. Siehe `backend-and-api.md` API-F-045 und `../features/room-finder/spec.md`.

## 2. Schichten in der App

Die App trennt Darstellung, Zustandshaltung, fachliche Logik und Datenzugriff. Die Alt-App realisierte das über MVVM mit einem Dependency-Injection-Container (`main.dart`) und `BaseView` (`core/views/base_view.dart`), das je Bildschirm ein ViewModel auflöst. Übernehmenswert: die klare Trennung Bildschirm/Logik und die UI-freie Testbarkeit der Fachlogik. Nicht übernehmenswert: `registerDependencies()` in `main.dart` registriert fast jedes ViewModel als `registerSingleton` (einzige Ausnahme: `AddCustomScheduleItemPageViewModel` als `registerFactory`), wodurch `BaseView` bei jedem `resolve<T>()` dieselbe Instanz liefert und Bildschirmzustand app-weit über Navigationswechsel hinweg bestehen bleibt — sichtbar an den langlebigen Instanzfeldern (`isLoading`, `editMode`) in `schedule_overview_viewmodel.dart`.

| ID | Anforderung | Herkunft |
|---|---|---|
| ARCH-F-060 | Das System muss App-seitig zwischen Darstellung, Zustandshaltung, fachlicher Logik und Datenzugriff trennen. | Alt: lib/core/views/base_view.dart:5-27 |
| ARCH-F-070 | Das System muss fachliche Logik so kapseln, dass sie ohne Rendering einer Benutzeroberfläche automatisiert testbar ist. | Alt: lib/areas/schedule/viewmodels/schedule_overview_viewmodel.dart:209-252 |
| ARCH-F-080 | Das System muss die Zustandshaltung eines Bildschirms an dessen Lebenszyklus binden, statt sie als app-weit langlebiges Singleton über Navigationswechsel hinweg zu erhalten. | Alt: bewusst verworfen |
| ARCH-F-150 | Das System muss serverseitigen Zustand über eine dedizierte Server-State-Schicht mit Cache, Hintergrund-Aktualisierung und Invalidierung verwalten, getrennt von lokalem UI-Zustand. | NEU |
| ARCH-N-030 | Die App muss Bildschirm-lokalen UI-Zustand ausschließlich komponenten- oder modul-gebunden halten, nie als einzelne app-weite Store-Instanz. | NEU |

Zu ARCH-F-150/ARCH-N-030: Konkretisiert ARCH-F-080 und schließt die zuvor offene Frage nach Bibliothekswahl (Abschnitt 7 a. F.) — siehe `../decisions/0013-zustand-navigation-und-netzwerkschicht.md`. ARCH-N-030 benennt ausdrücklich noch einmal das Gegenteil des in der Alt-App gefundenen Singleton-Musters, damit es nicht in neuer Form (z. B. als einzelner globaler State-Management-Store) zurückkehrt.

## 3. Navigation

Die Alt-App zeigte fünf Tabs: Stundenplan, News, Mensa, Semesterticket, Mehr (`main_page.dart:29-53`). Raumsuche, Events, Helfer-Anmeldung und Wiki passen dort nicht mehr hinein. Der konkrete Entwurf der Navigationsstruktur gehört in `../features/app-shell/spec.md` (SHELL); hier stehen nur die Randbedingungen.

| ID | Anforderung | Herkunft |
|---|---|---|
| ARCH-F-090 | Das System muss jedem Kernfeature (Raumsuche, Stundenplan, Mensaplan, News, Event-Kalender, Helfer-Anmeldung, Wiki) einen von der Startseite aus in höchstens zwei Interaktionsschritten erreichbaren Einstiegspunkt bieten. | NEU |
| ARCH-N-010 | Das System muss die Navigationsstruktur so entwerfen, dass sie mehr als die fünf bisherigen Bereiche der Alt-App aufnehmen kann, ohne dass alle Bereiche als gleichrangige Einträge einer einzigen Tab-Leiste erscheinen. | Alt: bewusst verworfen |

Zu ARCH-F-090: Mensa-Bewertungen (RATE) sind hier bewusst nicht als eigenes Kernfeature mit eigenem Einstiegspunkt geführt, obwohl `README.md` Abschnitt 10 RATE als Kern-Priorität einstuft — diese Einstufung betrifft die Umsetzungsreihenfolge, nicht die Navigationsstruktur. Eine Bewertung ist eine Handlung innerhalb eines im Mensaplan angezeigten Gerichts, kein eigenständiges Navigationsziel; der Einstieg erfolgt über MENSA (siehe `../features/canteen/spec.md`, `../features/canteen-ratings/spec.md`).

## 4. Offline-first als Architekturprinzip

Ein Teil der Daten muss ohne Netz nutzbar sein, ein Teil zwingend nicht. Maßgeblich ist nicht diese Aufzählung, sondern die Regel dahinter: Jeder Lesepfad mit geräteseitigem Zwischenspeicher zeigt offline den zuletzt geladenen Stand; wo das Ergebnis von einer aktuellen serverseitigen Berechnung abhängt, ist der Bereich offline nicht verfügbar. Die Tabelle nennt die Bereiche, die es zum Zeitpunkt der letzten Durchsicht gibt; eine neue Feature-Spec ordnet sich dieser Regel zu, ohne dass ARCH-F-100 dafür geändert werden muss.

| Bereich | Offline verfügbar | Begründung |
|---|---|---|
| Stundenplan | ja, zuletzt geladener Stand | lokal persistiert |
| Semesterticket | ja, jederzeit | rein lokal gespeichert, kein Netzbezug |
| News | ja, zuletzt geladener Stand | geräteseitig gecachter Backend-Zwischenspeicher |
| Mensa-Speiseplan | ja, zuletzt geladener Stand | geräteseitig gecachter Backend-Zwischenspeicher |
| Events | ja, zuletzt geladener Stand | geräteseitig gecachter Backend-Zwischenspeicher, siehe `../features/events/spec.md` |
| Wiki | ja, zuletzt geladene Seiten | geräteseitiger Zwischenspeicher, siehe `../features/wiki/spec.md` |
| E-Key-Status | ja, zuletzt geladener Stand | geräteseitiger Zwischenspeicher, siehe `../features/e-key/spec.md` |
| Mensa-Bewertungen (lesend) | ja, zuletzt geladener Stand | geräteseitiger Zwischenspeicher |
| Raumsuche | nein | Ergebnis hängt von aktueller Backend-Aggregation ab |
| Verwaltung und Redaktion | nein | Handlungen hängen von einem serverseitigen Zustand ab, der sich zwischenzeitlich ändern kann, siehe ARCH-F-125 |

Schreibende Vorgänge dürfen offline nicht verlorengehen — mit einer Ausnahme, die ARCH-F-125 benennt.

| ID | Anforderung | Herkunft |
|---|---|---|
| ARCH-F-100 | Solange keine Netzwerkverbindung besteht, muss die App für jeden Lesepfad mit geräteseitigem Zwischenspeicher den zuletzt geladenen Stand anzeigen. | Alt: lib/areas/schedule/viewmodels/schedule_overview_viewmodel.dart:93-152 |
| ARCH-F-110 | Solange keine Netzwerkverbindung besteht, muss die App die Raumsuche als nicht verfügbar kennzeichnen. | NEU |
| ARCH-F-120 | Wenn ein Schreibvorgang ohne Netzwerkverbindung ausgelöst wird, muss die App ihn in eine lokale Warteschlange einreihen und bei wiederhergestellter Verbindung automatisch übertragen. | NEU |
| ARCH-F-160 | Wenn ein Schreibvorgang gemäß ARCH-F-120 in die Offline-Warteschlange eingereiht wird, muss die App ihn über einen Pause-/Fortsetzungs-Mechanismus verwalten, der ihn bei Verbindungswiederherstellung ohne erneute Nutzerinteraktion fortsetzt. | NEU |
| ARCH-F-125 | Falls ein Schreibvorgang von einem serverseitigen Zustand abhängt, der sich bis zur Übertragung ändern kann, darf die App ihn nicht in die Warteschlange einreihen, sondern muss ihn bei fehlender Verbindung ablehnen. | NEU |

Zu ARCH-F-100: Die Formulierung nennt bewusst die Eigenschaft „Lesepfad mit geräteseitigem Zwischenspeicher" statt einer festen Bereichsliste. Die vorige Fassung zählte vier Bereiche abschließend auf; EVENT, WIKI, EKEY und die lesende Ansicht der Mensa-Bewertungen erweiterten diese Liste anschließend in ihren eigenen Specs, wodurch die Anforderung ihrer Umsetzung widersprach. Welche Bereiche welchen Zwischenspeicher mit welcher Gültigkeitsdauer führen, legt `data-and-storage.md` Abschnitt 4 fest, nicht diese Anforderung.

Zu ARCH-F-120: Betroffen sind Mensa-Bewertungen (RATE), Helfer-Anmeldungen (HELFER), Besetzt-Meldungen der Raumsuche (RAUM-F-070) sowie die E-Key-Schreibvorgänge Verloren-Melden und semesterweise Bestätigen (EKEY). Nicht betroffen ist die E-Key-Verknüpfung (EKEY-F-030) — siehe Erläuterung zu ARCH-F-125. Die Warteschlange darf einen Vorgang bei erneuter Übertragung nicht doppelt wirksam werden lassen (z. B. eine Bewertung nicht doppelt zählen). Das setzt Idempotenz auf Backend-Seite voraus, siehe `backend-and-api.md`, API-F-140.

Zu ARCH-F-160: Löst die zuvor offene Frage nach dem konkreten Warteschlangen-Mechanismus — siehe `../decisions/0013-zustand-navigation-und-netzwerkschicht.md`.

Zu ARCH-F-125: Die Ausnahme betrifft Verwaltungs- und Moderationshandlungen (`../features/admin/spec.md` Abschnitt 8), die Kontolöschung (`../features/settings/spec.md` SET-F-090) sowie die E-Key-Verknüpfung (`../features/e-key/spec.md` EKEY-F-030). Gemeinsames Merkmal: Zwischen Auslösung und Übertragung kann sich der Zustand geändert haben — eine Meldung wurde von jemand anderem bearbeitet, ein Kommentar bereits entfernt, eine Rolle bereits entzogen, eine E-Key-Nummer bereits mit einem anderen Konto verknüpft (`../features/e-key/spec.md` Abschnitt 9). Eine verzögerte Übertragung würde dann einen fremden, neueren Stand überschreiben. Eine Mensa-Bewertung kennt dieses Problem nicht, weil sie nichts überschreibt, sondern etwas hinzufügt.

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

- Bibliothekswahl im Detail (konkrete Versionen, Konfiguration) — nicht Teil dieser Spec. Die grundsätzliche Festlegung von Server-State-, Navigations- und Netzwerkschicht steht in `../decisions/0013-zustand-navigation-und-netzwerkschicht.md`.
- Backend-Technologie — `../decisions/0003-eigenes-backend-fuer-community-funktionen.md`.
- Konkrete Bildschirmentwürfe — jeweilige Feature-Spec und `ux-and-theming.md`.

## 8. Offene Fragen

- Speichergrenzen der Offline-Warteschlange: Arbeitsziel 7 Tage Verfallsfrist, siehe `data-and-storage.md` Abschnitt 9. Konfliktbehandlung bei widersprüchlichen Offline-Änderungen (z. B. doppelt gestellte Bewertung) — Klärung bei Umsetzung der betroffenen Feature-Specs (RATE, HELFER).
