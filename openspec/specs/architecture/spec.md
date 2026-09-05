## Purpose

Legt die Systemarchitektur fest, an der sich alle Feature-Specs orientieren: Aufbau aus App, Backend und Fremdsystemen, Schichtenbildung in der App, Randbedingungen für Navigation, Offline-Prinzip, Lade-/Fehlerverhalten als Querschnitt und Modulschnitt. Vormals `specs/platform/architecture.md` (Präfix `ARCH`), migriert nach ADR 0019. Owner: FSR FB4.

## Requirements

### Requirement: Drei Bausteine

Das System muss aus den drei Bausteinen App, eigenes Backend und externe Quellsysteme bestehen. Herkunft: NEU (vormals ARCH-F-010).

#### Scenario: Systemüberblick
- **WHEN** die Gesamtarchitektur betrachtet wird
- **THEN** bestehen genau drei Bausteine: App, eigenes Backend (Capability `backend-and-api`, INT-008) und externe Quellsysteme (Capability `integrations`)

### Requirement: Direkter Zugriff bei reinen Lesepfaden

Solange eine Ansicht ausschließlich lesend auf Stundenplandaten, Notenübersicht oder Wiki-Inhalte zugreift und keine Aggregation über mehrere Abfragen benötigt, muss die App diese Quelle direkt ansprechen. Herkunft: NEU (vormals ARCH-F-020).

#### Scenario: Stundenplan ohne Aggregation
- **WHEN** die App den Stundenplan aus FBWS lädt und keine Zusammenführung mehrerer Abfragen nötig ist
- **THEN** ruft die App FBWS direkt auf, ohne Umweg über das Backend

### Requirement: Schreibvorgänge ausschließlich über das Backend

Wenn eine Mensa-Bewertung oder eine Helfer-Anmeldung abgesendet wird, muss die App diesen Schreibvorgang ausschließlich an das eigene Backend senden. Herkunft: NEU (vormals ARCH-F-030).

#### Scenario: Mensa-Bewertung absenden
- **WHEN** eine Nutzerin eine Mensa-Bewertung absendet
- **THEN** sendet die App diesen Schreibvorgang ausschließlich an das eigene Backend, nie direkt an ein Fremdsystem

### Requirement: Clientseitige Aggregation der Raumbelegung (entfallen)

Das System sollte ursprünglich die Raumbelegung für die Raumsuche als vorab im Backend aggregierte Daten bereitstellen, gewonnen durch Zusammenführung der Termine aller Studiengang/Semester-Kombinationen, statt durch clientseitige Abfrage. Diese Anforderung ist entfallen: Am 2026-08-24 wurde mit INT-009 ein raumbezogener Endpunkt gefunden, der mit einem Platzhalter aufgerufen werden kann und alle Raumtermine in einem einzigen Aufruf liefert (Befund vom 2026-08-25 aus dem Android-Quellcode). Die Zusammenführung entfällt damit ersatzlos; ersetzt durch das Requirement „Raumtermine über Zwischenspeicher beziehen". Herkunft: NEU (vormals ARCH-F-040, entfallen).

#### Scenario: Nachweis der Ablösung
- **WHEN** geprüft wird, ob die Raumbelegung clientseitig aus mehreren Studiengang/Semester-Kombinationen zusammengeführt wird
- **THEN** trifft das nicht mehr zu — der Bezug läuft über einen einzelnen Platzhalter-Aufruf gegen INT-009 und den Backend-Zwischenspeicher

### Requirement: Raumtermine über Zwischenspeicher beziehen

Das System muss die Raumtermine über den Zwischenspeicher des Backends beziehen, nicht durch direkten App-Aufruf des Hochschulsystems. Herkunft: NEU (vormals ARCH-F-045).

#### Scenario: Raumsuche öffnet
- **WHEN** die Raumsuche geöffnet wird
- **THEN** bezieht die App die Raumtermine aus dem Backend-Zwischenspeicher, nicht direkt aus dem Hochschulsystem

### Requirement: News und Mensa-Speisepläne über Zwischenspeicher

Das System muss News und Mensa-Speisepläne ausschließlich über den Zwischenspeicher des Backends beziehen, nicht durch direkten App-Aufruf der jeweiligen Quelle. Herkunft: NEU (vormals ARCH-F-050).

#### Scenario: Speiseplan laden
- **WHEN** die App den Mensa-Speiseplan anzeigt
- **THEN** bezieht sie ihn aus dem Backend-Zwischenspeicher, nie direkt aus der Mensa-Quelle

### Requirement: Trennung von Darstellung, Zustand, Logik und Datenzugriff

Das System muss App-seitig zwischen Darstellung, Zustandshaltung, fachlicher Logik und Datenzugriff trennen. Herkunft: Alt: alte apps/fb4_app-main/fb4_app-main/lib/core/views/base_view.dart:5-27 (vormals ARCH-F-060).

#### Scenario: Bildschirm mit Fachlogik
- **WHEN** ein neuer Bildschirm entsteht
- **THEN** liegen Darstellung, Zustandshaltung, fachliche Logik und Datenzugriff in getrennten Schichten vor

### Requirement: UI-frei testbare Fachlogik

Das System muss fachliche Logik so kapseln, dass sie ohne Rendering einer Benutzeroberfläche automatisiert testbar ist. Herkunft: Alt: alte apps/fb4_app-main/fb4_app-main/lib/areas/schedule/viewmodels/schedule_overview_viewmodel.dart:209-252 (vormals ARCH-F-070).

#### Scenario: Test der Gruppenzuordnungslogik
- **WHEN** die Gruppenzuordnungslogik des Stundenplans getestet wird
- **THEN** läuft der Test ohne Rendering einer Benutzeroberfläche

### Requirement: Bildschirmzustand an Lebenszyklus gebunden

Das System muss die Zustandshaltung eines Bildschirms an dessen Lebenszyklus binden, statt sie als app-weit langlebiges Singleton über Navigationswechsel hinweg zu erhalten. Herkunft: Alt: bewusst verworfen (vormals ARCH-F-080).

#### Scenario: Navigationswechsel
- **WHEN** eine Nutzerin einen Bildschirm verlässt und später erneut öffnet
- **THEN** ist der zuvor gehaltene Bildschirmzustand nicht als app-weites Singleton über den Navigationswechsel hinweg erhalten geblieben

### Requirement: Dedizierte Server-State-Schicht

Das System muss serverseitigen Zustand über eine dedizierte Server-State-Schicht mit Cache, Hintergrund-Aktualisierung und Invalidierung verwalten, getrennt von lokalem UI-Zustand. Herkunft: NEU (vormals ARCH-F-150). Konkretisiert das Requirement „Bildschirmzustand an Lebenszyklus gebunden" und schließt die zuvor offene Frage nach Bibliothekswahl, siehe `specs/decisions/0013-zustand-navigation-und-netzwerkschicht.md`.

#### Scenario: Serverdaten im Cache
- **WHEN** die App Daten vom Backend oder einem Fremdsystem lädt
- **THEN** verwaltet eine dedizierte Server-State-Schicht Cache, Hintergrund-Aktualisierung und Invalidierung dieser Daten, getrennt vom lokalen UI-Zustand

### Requirement: Kein app-weiter UI-State-Store

Die App muss Bildschirm-lokalen UI-Zustand ausschließlich komponenten- oder modul-gebunden halten, nie als einzelne app-weite Store-Instanz. Herkunft: NEU (vormals ARCH-N-030). Benennt ausdrücklich das Gegenteil des in der Alt-App gefundenen Singleton-Musters, damit es nicht in neuer Form zurückkehrt. Nachweis per statischer Analyse (`app/src/architecture.test.ts`, Capability `quality-and-testing`, Requirement „Lint-Nachweis für Architektur-Constraints“).

#### Scenario: Statische Analyse gegen globalen Store
- **WHEN** `app/src/architecture.test.ts` läuft
- **THEN** meldet der Test einen Verstoß, sobald eine globale State-Management-Bibliothek für UI-Zustand eingebunden wird

### Requirement: Erreichbarkeit der Kernfeatures

Das System muss jedem Kernfeature (Raumsuche, Stundenplan, Mensaplan, News, Event-Kalender, Helfer-Anmeldung, Wiki) einen von der Startseite aus in höchstens zwei Interaktionsschritten erreichbaren Einstiegspunkt bieten. Herkunft: NEU (vormals ARCH-F-090). Mensa-Bewertungen sind hier bewusst nicht als eigenes Kernfeature mit eigenem Einstiegspunkt geführt — eine Bewertung ist eine Handlung innerhalb des im Mensaplan angezeigten Gerichts, kein eigenständiges Navigationsziel; der Einstieg erfolgt über die Capability `canteen` (siehe Capability `canteen-ratings`).

#### Scenario: Einstieg in die Raumsuche
- **WHEN** eine Nutzerin von der Startseite aus die Raumsuche erreichen will
- **THEN** genügen höchstens zwei Interaktionsschritte

### Requirement: Navigationsstruktur über fünf Alt-Bereiche hinaus

Das System muss die Navigationsstruktur so entwerfen, dass sie mehr als die fünf bisherigen Bereiche der Alt-App aufnehmen kann, ohne dass alle Bereiche als gleichrangige Einträge einer einzigen Tab-Leiste erscheinen. Herkunft: Alt: bewusst verworfen (vormals ARCH-N-010). Der konkrete Entwurf der Navigationsstruktur gehört in die Capability `app-shell`; hier stehen nur die Randbedingungen.

#### Scenario: Sieben Bereiche in erster Ausbaustufe
- **WHEN** die erste Ausbaustufe sieben fachliche Bereiche umfasst
- **THEN** erscheinen sie nicht als sieben gleichrangige Einträge einer einzigen Tab-Leiste

### Requirement: Offline-Anzeige des zuletzt geladenen Stands

Solange keine Netzwerkverbindung besteht, muss die App für jeden Lesepfad mit geräteseitigem Zwischenspeicher den zuletzt geladenen Stand anzeigen. Herkunft: Alt: alte apps/fb4_app-main/fb4_app-main/lib/areas/schedule/viewmodels/schedule_overview_viewmodel.dart:93-152 (vormals ARCH-F-100). Die Formulierung nennt bewusst die Eigenschaft „Lesepfad mit geräteseitigem Zwischenspeicher“ statt einer festen Bereichsliste, damit neue Feature-Specs sich zuordnen können, ohne dass dieses Requirement geändert werden muss. Welcher Bereich welchen Zwischenspeicher mit welcher Gültigkeitsdauer führt, legt die Capability `data-and-storage`, Abschnitt „Zwischenspeicher-Regeln“, fest.

#### Scenario: Stundenplan ohne Netz
- **WHEN** keine Netzwerkverbindung besteht und der Stundenplan zuvor geladen wurde
- **THEN** zeigt die App den zuletzt geladenen Stundenplan an

### Requirement: Raumsuche offline nicht verfügbar

Solange keine Netzwerkverbindung besteht, muss die App die Raumsuche als nicht verfügbar kennzeichnen. Herkunft: NEU (vormals ARCH-F-110).

#### Scenario: Raumsuche ohne Netz
- **WHEN** keine Netzwerkverbindung besteht
- **THEN** kennzeichnet die App die Raumsuche als nicht verfügbar, statt veraltete Ergebnisse zu zeigen

### Requirement: Offline-Warteschlange für Schreibvorgänge

Wenn ein Schreibvorgang ohne Netzwerkverbindung ausgelöst wird, muss die App ihn in eine lokale Warteschlange einreihen und bei wiederhergestellter Verbindung automatisch übertragen. Herkunft: NEU (vormals ARCH-F-120). Betroffen sind Mensa-Bewertungen, Helfer-Anmeldungen, Besetzt-Meldungen der Raumsuche sowie die E-Key-Schreibvorgänge Verloren-Melden und semesterweise Bestätigen. Die Warteschlange darf einen Vorgang bei erneuter Übertragung nicht doppelt wirksam werden lassen; das setzt Idempotenz auf Backend-Seite voraus (Capability `backend-and-api`, Requirement „Idempotente Bewertungsabgabe“).

#### Scenario: Bewertung ohne Netz abgeben
- **WHEN** eine Mensa-Bewertung ohne Netzwerkverbindung abgesendet wird
- **THEN** reiht die App sie in eine lokale Warteschlange ein und überträgt sie automatisch, sobald die Verbindung wiederhergestellt ist

### Requirement: Pause-/Fortsetzungs-Mechanismus der Offline-Warteschlange

Wenn ein Schreibvorgang gemäß der Offline-Warteschlange eingereiht wird, muss die App ihn über einen Pause-/Fortsetzungs-Mechanismus verwalten, der ihn bei Verbindungswiederherstellung ohne erneute Nutzerinteraktion fortsetzt. Herkunft: NEU (vormals ARCH-F-160). Löst die zuvor offene Frage nach dem konkreten Warteschlangen-Mechanismus, siehe `specs/decisions/0013-zustand-navigation-und-netzwerkschicht.md`.

#### Scenario: Verbindung während der Übertragung unterbrochen
- **WHEN** die Verbindung während der Übertragung eines Warteschlangen-Eintrags abbricht und später wiederhergestellt wird
- **THEN** setzt die App die Übertragung automatisch fort, ohne dass die Nutzerin erneut eingreifen muss

### Requirement: Ablehnung bei zustandsabhängigen Schreibvorgängen

Falls ein Schreibvorgang von einem serverseitigen Zustand abhängt, der sich bis zur Übertragung ändern kann, darf die App ihn nicht in die Warteschlange einreihen, sondern muss ihn bei fehlender Verbindung ablehnen. Herkunft: NEU (vormals ARCH-F-125). Die Ausnahme betrifft Verwaltungs- und Moderationshandlungen (Capability `admin`), die Kontolöschung (Capability `settings`) sowie die E-Key-Verknüpfung (Capability `e-key`). Gemeinsames Merkmal: Zwischen Auslösung und Übertragung kann sich der Zustand geändert haben — eine verzögerte Übertragung würde dann einen fremden, neueren Stand überschreiben. Eine Mensa-Bewertung kennt dieses Problem nicht, weil sie nichts überschreibt, sondern etwas hinzufügt.

#### Scenario: E-Key-Verknüpfung ohne Netz
- **WHEN** eine E-Key-Verknüpfung ohne Netzwerkverbindung ausgelöst wird
- **THEN** lehnt die App den Vorgang ab, statt ihn in die Offline-Warteschlange einzureihen

### Requirement: Vier Zustände je Ansicht mit entfernten Daten

Das System muss für jede Ansicht, die entfernte Daten anzeigt, einen Lade-, Leer-, Fehler- und Offline-Zustand bereitstellen. Herkunft: NEU (vormals ARCH-F-130).

#### Scenario: Ansicht ohne Daten
- **WHEN** eine Ansicht entfernte Daten laden will und der Ladevorgang beginnt, leer bleibt, fehlschlägt oder offline erfolgt
- **THEN** zeigt sie jeweils den passenden von vier definierten Zuständen

### Requirement: Wiederverwendbare Grundstruktur für die vier Zustände

Das System muss diese vier Zustände über eine wiederverwendbare Grundstruktur realisieren, statt sie je Bildschirm neu zu definieren. Herkunft: NEU (vormals ARCH-N-020).

#### Scenario: Neuer Bildschirm mit entfernten Daten
- **WHEN** ein neuer Bildschirm entfernte Daten anzeigt
- **THEN** verwendet er die bestehende, wiederverwendbare Grundstruktur für Lade-, Leer-, Fehler- und Offline-Zustand, statt sie neu zu implementieren

### Requirement: Modulschnitt nach fachlichen Bereichen

Das System muss den Quellcode nach fachlichen Bereichen schneiden, sodass Modelle, Datenzugriff, Zustandshaltung und Bildschirme eines Bereichs zusammen auffindbar sind. Herkunft: Alt: alte apps/fb4_app-main/fb4_app-main/lib/areas/schedule/ (vormals ARCH-F-140). Umgesetzt unter `app/src/areas/<bereich>/`, die dateibasierten Routen unter `app/app/` verweisen nur darauf. Nachweis per statischer Analyse in `app/src/architecture.test.ts` und `app/src/navigation/*.test.ts`.

#### Scenario: Neuer fachlicher Bereich
- **WHEN** ein neuer fachlicher Bereich entsteht
- **THEN** liegen seine Modelle, sein Datenzugriff, seine Zustandshaltung und seine Bildschirme gemeinsam unter `app/src/areas/<bereich>/`

## Systemüberblick: Datenflüsse

| Datenfluss | Weg | Begründung |
|---|---|---|
| Stundenplan | App → FBWS, direkt | rein lesend, keine Aggregation nötig |
| Notenübersicht | App → HISinOne, direkt | rein lesend, personenbezogen je Nutzer |
| Wiki | App → BookStack, direkt | rein lesend, änderungsarm |
| Push-Abo | App → UnifiedPush-Distributor bzw. FCM, direkt | Geräte-Abo, kein Nutzerinhalt |
| Mensa-Bewertung | App → Backend | Schreibpfad: Persistenz, Identitätsprüfung, Moderation |
| Helfer-Anmeldung | App → Backend | Schreibpfad: Persistenz, Identitätsprüfung |
| Raumbelegung | App → Backend → Hochschulsystem | Zwischenspeicher; ein Platzhalter-Aufruf liefert alle Raumtermine, keine Aggregation nötig |
| News (FSR-News) | App → Backend → Fremdquelle | Ablösung privater Infrastruktur |
| News (FB-Aktuelles) | App → Backend → Fachbereichsseite | Zwischenspeicher, keine direkte App-Abhängigkeit von der Fachbereichsseite |
| Mensa-Speiseplan | App → Backend → Mensa-Feed | Zwischenspeicher, Ausfallpuffer; Ablösung privater Infrastruktur |
| Events | App → Backend → ICS-Kalender | Import aus vom FSR gepflegtem ICS-Kalender, keine Backend-Redaktionsoberfläche (Entscheidung FSR FB4, 2026-08-25) |
| Anmeldung (Konto) | App bzw. Admin-Oberfläche → Authentik, direkt | Redirect-Fluss im Systembrowser; die App nimmt nie Zugangsdaten entgegen |
| Verwaltung und Redaktion | Admin-Oberfläche → Backend | Schreibpfad mit Rollenprüfung, siehe Capability `admin` |

Die vier Gründe für das eigene Backend im Einzelnen stehen in Capability `backend-and-api`.

## Modulschnitt-Erläuterung

Die Alt-App schnitt Quellcode nach Fachbereichen: `areas/<bereich>/{models,repositories,viewmodels,screens,widgets}` (verifiziert u. a. für `areas/schedule`, `areas/news`, `areas/canteen`; nicht jeder Bereich nutzt alle fünf Unterordner). Dieses Muster ist tragfähig und wird übernommen. Die Navigationsstruktur (Tab-Leiste mit vier Bereichen plus verschachteltem „Mehr“-Stack) nimmt die derzeit sieben Bereiche der ersten Ausbaustufe auf, ohne sie gleichrangig in einer Tab-Leiste zu häufen.

## Abgrenzung

- Bibliothekswahl im Detail (konkrete Versionen, Konfiguration) — nicht Teil dieser Spec. Die grundsätzliche Festlegung von Server-State-, Navigations- und Netzwerkschicht steht in `specs/decisions/0013-zustand-navigation-und-netzwerkschicht.md`.
- Backend-Technologie — `specs/decisions/0003-eigenes-backend-fuer-community-funktionen.md`.
- Konkrete Bildschirmentwürfe — jeweilige Feature-Capability und Capability `ux-and-theming`.

## Offene Fragen

- Speichergrenzen der Offline-Warteschlange: Arbeitsziel 7 Tage Verfallsfrist, siehe Capability `data-and-storage`, Abschnitt „Offene Fragen“. Konfliktbehandlung bei widersprüchlichen Offline-Änderungen (z. B. doppelt gestellte Bewertung) — Klärung bei Umsetzung der betroffenen Feature-Capabilities (`canteen-ratings`, `event-volunteers`).
