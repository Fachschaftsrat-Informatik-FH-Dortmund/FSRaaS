---
id: schedule
titel: Stundenplan
praefix: SCHED
status: draft
prioritaet: kern
version: 0.1.0
owner: FSR FB4
last_reviewed: 2026-08-24
derived_from:
  - alte apps/fb4_app-main/fb4_app-main/lib/areas/schedule/models/course_info.dart
  - alte apps/fb4_app-main/fb4_app-main/lib/areas/schedule/models/schedule_item.dart
  - alte apps/fb4_app-main/fb4_app-main/lib/areas/schedule/models/schedule_list_controller.dart
  - alte apps/fb4_app-main/fb4_app-main/lib/areas/schedule/models/schedule_settings.dart
  - alte apps/fb4_app-main/fb4_app-main/lib/areas/schedule/models/selected_course_info.dart
  - alte apps/fb4_app-main/fb4_app-main/lib/areas/schedule/repositories/course_info_repository.dart
  - alte apps/fb4_app-main/fb4_app-main/lib/areas/schedule/repositories/schedule_repository.dart
  - alte apps/fb4_app-main/fb4_app-main/lib/areas/schedule/screens/add_custom_schedule_item_page.dart
  - alte apps/fb4_app-main/fb4_app-main/lib/areas/schedule/screens/add_official_schedule_page.dart
  - alte apps/fb4_app-main/fb4_app-main/lib/areas/schedule/screens/schedule_overview_page.dart
  - alte apps/fb4_app-main/fb4_app-main/lib/areas/schedule/viewmodels/add_custom_schedule_item_page_viewmodel.dart
  - alte apps/fb4_app-main/fb4_app-main/lib/areas/schedule/viewmodels/add_official_schedule_page_viewmodel.dart
  - alte apps/fb4_app-main/fb4_app-main/lib/areas/schedule/viewmodels/schedule_overview_viewmodel.dart
  - alte apps/fb4_app-main/fb4_app-main/lib/areas/schedule/widgets/schedule_card.dart
  - alte apps/fb4_app-main/fb4_app-main/lib/areas/schedule/widgets/schedule_list.dart
  - alte apps/fb4_app-main/fb4_app-main/lib/areas/more/screens/settings_page.dart
  - alte apps/fb4_app-main/fb4_app-main/lib/app_constants.dart
  - alte apps/fb4_app-main/fb4_app-main/lib/api_constants.dart
implemented_in: []
related:
  - ../app-shell/spec.md
  - ../room-finder/spec.md
  - ../../platform/architecture.md
  - ../../platform/data-and-storage.md
  - ../../platform/integrations.md
  - ../../platform/ux-and-theming.md
  - ../../platform/non-functional.md
  - ../../platform/quality-and-testing.md
  - ../../product/glossary.md
---

# Stundenplan

## 1. Zweck & Nutzen

Studierende sollen ihren persönlichen Stundenplan aus den offiziellen FBWS-Daten des Fachbereichs zusammenstellen und um eigene Termine ergänzen können, ohne dass Termine anderer Studierendengruppen den Überblick stören. Der Stundenplan ist eine Alltagsfunktion und wird mehrmals täglich geöffnet; entsprechend hoch ist die Anforderung an Verlässlichkeit der Gruppenzuordnung und an Datenerhalt beim Speichern.

## 2. Scope / Nicht-Scope

### Scope

- Anlegen eines Stundenplans aus offiziellen FBWS-Daten (Studiengang, Semester, optionale Gruppenkennung).
- Anlegen, Bearbeiten (Farbe) und Entfernen eigener Termine.
- Tagesweise Anzeige über fünf Wochentage mit Wisch- und Direktnavigation.
- Lokale Gruppenzuordnung zur Kennzeichnung fremder Termine.
- Vollständiges Löschen des Stundenplans.

### Nicht-Scope

- Raumbelegungsdaten und Raumsuche — `../room-finder/spec.md`.
- Speicherort, Verschlüsselung und Löschwege der Daten — `../../platform/data-and-storage.md`.
- Endpunktdetails von INT-001/INT-002 — `../../platform/integrations.md`.
- Navigationseinstieg in den Stundenplan-Bereich — `../app-shell/spec.md`.
- Farbsystem, Kontrastvorgaben, Bedienwege für Gesten — `../../platform/ux-and-theming.md`.

## 3. Nutzergeschichten

- Als Studierende möchte ich meinen Stundenplan aus dem offiziellen Angebot meines Studiengangs übernehmen, damit ich ihn nicht von Hand abtippen muss.
- Als Studierende möchte ich nur Termine meiner eigenen Gruppe hervorgehoben sehen, damit ich Parallelveranstaltungen nicht mit meinen eigenen verwechsle.
- Als Studierender möchte ich eigene Termine (z. B. Lerngruppen) ergänzen, damit mein Plan vollständig ist.
- Als Studierende möchte ich versehentlich hinzugefügte Termine wieder entfernen und Farben zur besseren Unterscheidung vergeben.

## 4. Funktionale Anforderungen

| ID | Anforderung | Herkunft |
|---|---|---|
| SCHED-F-010 | Das System muss den Stundenplan als Tagesansicht für die fünf Wochentage Montag bis Freitag darstellen. | Alt: alte apps/fb4_app-main/fb4_app-main/lib/areas/schedule/screens/schedule_overview_page.dart:108-114 |
| SCHED-F-020 | Das System muss den Wechsel zwischen Wochentagen per Wischgeste ermöglichen. | Alt: alte apps/fb4_app-main/fb4_app-main/lib/areas/schedule/screens/schedule_overview_page.dart:104-117 |
| SCHED-F-030 | Das System muss zusätzlich zur Wischgeste eine Segmentleiste zur direkten Auswahl eines Wochentags bereitstellen. | Alt: alte apps/fb4_app-main/fb4_app-main/lib/areas/schedule/screens/schedule_overview_page.dart:56-83 |
| SCHED-F-040 | Wenn die Nutzerin zwischen Wochentagen wischt, dann muss das System die Segmentleiste synchron auf den angezeigten Wochentag aktualisieren. | Alt: alte apps/fb4_app-main/fb4_app-main/lib/areas/schedule/screens/schedule_overview_page.dart:106-107 |
| SCHED-F-050 | Das System muss das Anlegen eines offiziellen Stundenplans über die Auswahl eines Studiengangs ermöglichen. | Alt: alte apps/fb4_app-main/fb4_app-main/lib/areas/schedule/screens/add_official_schedule_page.dart:179-195 |
| SCHED-F-060 | Das System muss die wählbaren Studiengänge über INT-001 beziehen. | Alt: alte apps/fb4_app-main/fb4_app-main/lib/areas/schedule/viewmodels/add_official_schedule_page_viewmodel.dart:37-42 |
| SCHED-F-070 | Solange kein Studiengang ausgewählt ist, muss das System die Semesterauswahl sperren. | Alt: alte apps/fb4_app-main/fb4_app-main/lib/areas/schedule/screens/add_official_schedule_page.dart:203-213 |
| SCHED-F-080 | Falls die Nutzerin die Semesterauswahl öffnet, bevor ein Studiengang gewählt wurde, muss das System einen Hinweisdialog anzeigen. | Alt: alte apps/fb4_app-main/fb4_app-main/lib/areas/schedule/screens/add_official_schedule_page.dart:214-237 |
| SCHED-F-090 | Das System muss die wählbaren Semester aus der `grades`-Liste des gewählten Studiengangs anzeigen. | Alt: alte apps/fb4_app-main/fb4_app-main/lib/areas/schedule/screens/add_official_schedule_page.dart:207-208 |
| SCHED-F-100 | Das System muss die Angabe einer Gruppenkennung beim Anlegen eines offiziellen Stundenplans als optional behandeln. | Alt: alte apps/fb4_app-main/fb4_app-main/lib/areas/schedule/screens/add_official_schedule_page.dart:252-270 |
| SCHED-F-110 | Das System muss eine eingegebene Gruppenkennung gegen das Muster `^[A-Z][0-9]+$` prüfen. | Alt: alte apps/fb4_app-main/fb4_app-main/lib/areas/schedule/screens/add_official_schedule_page.dart:262-263 |
| SCHED-F-120 | Falls eine eingegebene Gruppenkennung nicht dem Muster `^[A-Z][0-9]+$` entspricht, muss das System eine Validierungsmeldung anzeigen. | Alt: alte apps/fb4_app-main/fb4_app-main/lib/areas/schedule/screens/add_official_schedule_page.dart:261-267 |
| SCHED-F-130 | Das System muss Eingaben in das Gruppenkennung-Feld automatisch in Großbuchstaben umwandeln. | Alt: alte apps/fb4_app-main/fb4_app-main/lib/areas/schedule/screens/add_official_schedule_page.dart:260 |
| SCHED-F-140 | Falls beim Speichern kein Studiengang oder kein Semester ausgewählt ist, muss das System eine Fehlermeldung anzeigen und den Speichervorgang verhindern. | Alt: alte apps/fb4_app-main/fb4_app-main/lib/areas/schedule/screens/add_official_schedule_page.dart:113-137 |
| SCHED-F-150 | Wenn Studiengang und Semester bestätigt werden, muss das System die Termine dieser Kombination über INT-002 abrufen. | Alt: alte apps/fb4_app-main/fb4_app-main/lib/areas/schedule/viewmodels/schedule_overview_viewmodel.dart:58-66 |
| SCHED-F-160 | Wenn die abgerufenen Termine angezeigt werden, muss das System sie zusammen mit den bereits gespeicherten Terminen im Auswahlmodus mit Kontrollkästchen darstellen. | Alt: alte apps/fb4_app-main/fb4_app-main/lib/areas/schedule/viewmodels/schedule_overview_viewmodel.dart:72-90 |
| SCHED-F-170 | Das System muss der Nutzerin erlauben, einzelne abgerufene Termine über Kontrollkästchen auszuwählen oder abzuwählen. | Alt: alte apps/fb4_app-main/fb4_app-main/lib/areas/schedule/widgets/schedule_card.dart:36-47 |
| SCHED-F-180 | Wenn die Nutzerin die Auswahl bestätigt, muss das System ausschließlich die ausgewählten Termine dauerhaft zum Stundenplan hinzufügen. | Alt: alte apps/fb4_app-main/fb4_app-main/lib/areas/schedule/viewmodels/schedule_overview_viewmodel.dart:169-186 |
| SCHED-F-190 | Wenn die Nutzerin den Auswahlmodus abbricht, muss das System die abgerufenen Termine verwerfen, ohne den bestehenden Stundenplan zu verändern. | Alt: alte apps/fb4_app-main/fb4_app-main/lib/areas/schedule/screens/schedule_overview_page.dart:159-174 |
| SCHED-F-200 | Das System muss beim Anlegen eines eigenen Eintrags Name, Wochentag, Startzeit, Endzeit, Raum, Lehrende(r) und Kürzel als Pflichtfelder verlangen. | Alt: alte apps/fb4_app-main/fb4_app-main/lib/areas/schedule/viewmodels/add_custom_schedule_item_page_viewmodel.dart:27-35 |
| SCHED-F-210 | Das System muss die Länge des Kürzels eines eigenen Eintrags auf 5 Zeichen begrenzen. | Alt: alte apps/fb4_app-main/fb4_app-main/lib/areas/schedule/screens/add_custom_schedule_item_page.dart:218-227 |
| SCHED-F-220 | Falls beim Speichern eines eigenen Eintrags ein Pflichtfeld leer ist, muss das System eine Fehlermeldung anzeigen und den Speichervorgang verhindern. | Alt: alte apps/fb4_app-main/fb4_app-main/lib/areas/schedule/screens/add_custom_schedule_item_page.dart:34-60 |
| SCHED-F-230 | Das System muss einem eigenen Eintrag automatisch die Veranstaltungsart `C` zuweisen. | Alt: alte apps/fb4_app-main/fb4_app-main/lib/areas/schedule/viewmodels/add_custom_schedule_item_page_viewmodel.dart:17 |
| SCHED-F-240 | Wenn die Nutzerin einen Termin lange drückt, muss das System ein Menü zum Ändern der Farbe oder Entfernen des Eintrags anzeigen. | Alt: alte apps/fb4_app-main/fb4_app-main/lib/areas/schedule/widgets/schedule_list.dart:39-42 |
| SCHED-F-250 | Das System muss beim Ändern der Farbe eines Termins eine Auswahl aus 22 vordefinierten Farben anbieten. | Alt: alte apps/fb4_app-main/fb4_app-main/lib/areas/schedule/widgets/schedule_list.dart:89-112 |
| SCHED-F-270 | Das System muss die Termine je Wochentag aufsteigend nach Startzeit sortieren. | Alt: alte apps/fb4_app-main/fb4_app-main/lib/areas/schedule/models/schedule_item.dart:80-82 |
| SCHED-F-280 | Das System muss `timeBegin` und `timeEnd` als vierstelligen Wert im Format `HHmm` mit führender Nullauffüllung speichern. | Alt: alte apps/fb4_app-main/fb4_app-main/lib/areas/schedule/models/schedule_item.dart:42-43 |
| SCHED-F-290 | Das System muss `timeBegin` und `timeEnd` im Format `HH:MM` anzeigen. | Alt: alte apps/fb4_app-main/fb4_app-main/lib/areas/schedule/widgets/schedule_card.dart:69-84 |
| SCHED-F-300 | Das System muss auf einer Terminkarte Startzeit, Endzeit, `[courseType] Name`, `studentSet \| lecturerName (lecturerId)` und Raum anzeigen. | Alt: alte apps/fb4_app-main/fb4_app-main/lib/areas/schedule/widgets/schedule_card.dart:69-117 |
| SCHED-F-310 | Sofern die Einstellung „Aktuellen Wochentag zuerst zeigen" aktiviert ist, muss das System beim Öffnen des Stundenplans zum aktuellen Wochentag springen. | Alt: alte apps/fb4_app-main/fb4_app-main/lib/areas/schedule/viewmodels/schedule_overview_viewmodel.dart:124-135 |
| SCHED-F-320 | Das System muss eine Einstellung zum vollständigen Löschen des Stundenplans bereitstellen. | Alt: alte apps/fb4_app-main/fb4_app-main/lib/areas/more/screens/settings_page.dart:37-48 |
| SCHED-F-340 | Solange kein Stundenplan angelegt wurde, muss das System einen Leerzustand mit Hinweis auf das Anlegen über das Plus-Symbol anzeigen. | Alt: alte apps/fb4_app-main/fb4_app-main/lib/areas/schedule/screens/schedule_overview_page.dart:124-131 |
| SCHED-F-350 | Wenn ein Termin nicht zur angegebenen Gruppenkennung gehört, muss das System ihn dennoch anzeigen und optisch abschwächen statt ihn auszublenden. | Alt: alte apps/fb4_app-main/fb4_app-main/lib/areas/schedule/widgets/schedule_card.dart:52-54 |
| SCHED-F-360 | Solange keine Gruppenkennung angegeben ist, muss das System alle Termine als zur Nutzerin zugehörig behandeln. | Alt: alte apps/fb4_app-main/fb4_app-main/lib/areas/schedule/viewmodels/schedule_overview_viewmodel.dart:210 |
| SCHED-F-370 | Wenn `studentSet` den Wert `*` oder einen leeren Wert hat, muss das System den Termin als zu jeder Gruppenkennung zugehörig behandeln. | Alt: bewusst verworfen |
| SCHED-F-380 | Wenn `studentSet` keinen Bindestrich enthält und weder `*` noch leer ist, muss das System den Anfangsbuchstaben der Gruppenkennung mit dem Buchstaben von `studentSet` vergleichen und den Termin bei Übereinstimmung als zugehörig behandeln. | Alt: bewusst verworfen |
| SCHED-F-390 | Wenn `studentSet` dem Muster `^([A-Z])([0-9]*)-([A-Z])([0-9]*)$` entspricht und der Buchstabe der Gruppenkennung gleich dem Anfangsbuchstaben ist, muss das System den Termin als zugehörig behandeln, sofern die Anfangszahl leer ist oder die Zahl der Gruppenkennung größer oder gleich der Anfangszahl ist. | Alt: alte apps/fb4_app-main/fb4_app-main/lib/areas/schedule/viewmodels/schedule_overview_viewmodel.dart:224-230 |
| SCHED-F-400 | Wenn `studentSet` dem Muster `^([A-Z])([0-9]*)-([A-Z])([0-9]*)$` entspricht und der Buchstabe der Gruppenkennung gleich dem Endbuchstaben ist, muss das System den Termin als zugehörig behandeln, sofern die Endzahl leer ist oder die Zahl der Gruppenkennung kleiner oder gleich der Endzahl ist. | Alt: alte apps/fb4_app-main/fb4_app-main/lib/areas/schedule/viewmodels/schedule_overview_viewmodel.dart:233-239 |
| SCHED-F-410 | Wenn `studentSet` dem Muster `^([A-Z])([0-9]*)-([A-Z])([0-9]*)$` entspricht und der Buchstabe der Gruppenkennung echt zwischen Anfangs- und Endbuchstaben liegt, muss das System den Termin unabhängig von der Zahl als zugehörig behandeln. | Alt: alte apps/fb4_app-main/fb4_app-main/lib/areas/schedule/viewmodels/schedule_overview_viewmodel.dart:244-248 |
| SCHED-F-420 | Falls keine der Regeln aus SCHED-F-390 bis SCHED-F-410 zutrifft, muss das System den Termin als nicht zugehörig behandeln. | Alt: alte apps/fb4_app-main/fb4_app-main/lib/areas/schedule/viewmodels/schedule_overview_viewmodel.dart:251 |
| SCHED-F-430 | Falls `studentSet` weder dem Einzelwert- noch dem Bereichsmuster entspricht, muss das System den Termin als zu allen Gruppen zugehörig behandeln und den Vorfall protokollieren, statt die Verarbeitung abzubrechen. | NEU |
| SCHED-F-440 | Falls beim Laden des lokal gespeicherten Stundenplans eine unerwartete Anzahl an Wochentag-Einträgen festgestellt wird, muss das System den bestehenden Bestand erhalten und die Nutzerin auf die Unstimmigkeit hinweisen, statt ihn zu löschen. | Alt: bewusst verworfen |
| SCHED-F-450 | Das System kann eine Wochenansicht als Alternative zur Tagesansicht anbieten (Vorschlag, Umfang mit dem Fachbereich zu klären). | NEU |
| SCHED-F-460 | Das System kann den gespeicherten Stundenplan bei Änderungen des offiziellen Plans gegen INT-002 abgleichen und Abweichungen anzeigen (Vorschlag, Umfang mit dem Fachbereich zu klären). | NEU |
| SCHED-F-470 | Das System kann den Export einzelner oder aller Termine in den Gerätekalender anbieten (Vorschlag, Umfang mit dem Fachbereich zu klären). | NEU |
| SCHED-F-480 | Das System kann den Raum eines Termins mit der Raumsuche verlinken (Vorschlag, Umfang mit dem Fachbereich zu klären; siehe `../room-finder/spec.md`). | NEU |
| SCHED-F-490 | Das System kann eine Erinnerung vor Beginn einer Veranstaltung anzeigen (Vorschlag, Umfang mit dem Fachbereich zu klären). | NEU |

Die zweite sichtbare Bedienmöglichkeit für Farbe ändern/Eintrag entfernen (statt ausschließlich langem Drücken) sowie die Bestätigung vor dem endgültigen Löschen des Stundenplans sind Querschnittsanforderungen aus `../../platform/ux-and-theming.md` (UX-F-090, UX-F-120) und werden hier nicht wiederholt. Die zusätzliche textuelle oder symbolische Kennzeichnung fremder Gruppentermine aus SCHED-F-350 ist ebenfalls dort geregelt (UX-F-080).

### Erläuterungen

**SCHED-F-360 bis SCHED-F-430 — Gruppenzuordnung.** `isGroupInScheduleItem` in der Alt-App (`schedule_overview_viewmodel.dart:209-252`) enthält zwei bestätigte Fehler, die in Abschnitt 12 dokumentiert sind. Die folgende Tabelle legt das für die Neuentwicklung beabsichtigte Verhalten anhand von Beispieldaten fest und ist Grundlage der in `../../platform/quality-and-testing.md` (QA-F-030) geforderten Testfälle.

| Gruppenkennung | studentSet | zugehörig | Begründung |
|---|---|---|---|
| (keine) | C8 | ja | Ohne Gruppenkennung gelten alle Termine als zugehörig (SCHED-F-360). |
| C8 | C8 | ja | Einzelwert, Anfangsbuchstabe der Kennung (C) stimmt mit dem Buchstaben von `studentSet` überein (SCHED-F-380). |
| C8 | C3 | ja | Einzelwert, nur der Buchstabe wird verglichen; die Zahl im `studentSet` bleibt unberücksichtigt (SCHED-F-380). |
| C8 | D3 | nein | Einzelwert, Buchstabe C weicht von D ab (SCHED-F-380). |
| C8 | * | ja | Wildcard gilt für jede Gruppenkennung (SCHED-F-370). |
| C8 | (leer) | ja | Leerer Wert gilt für jede Gruppenkennung (SCHED-F-370). |
| B5 | A1-C9 | ja | Buchstabe B liegt echt zwischen Anfangsbuchstabe A und Endbuchstabe C (SCHED-F-410). |
| A1 | A1-C9 | ja | Buchstabe entspricht dem Anfangsbuchstaben A, Zahl 1 ist größer oder gleich der Anfangszahl 1 (SCHED-F-390). |
| A0 | A1-C9 | nein | Buchstabe entspricht dem Anfangsbuchstaben A, Zahl 0 ist kleiner als die Anfangszahl 1 (SCHED-F-390, SCHED-F-420). |
| C9 | A1-C9 | ja | Buchstabe entspricht dem Endbuchstaben C, Zahl 9 ist kleiner oder gleich der Endzahl 9 (SCHED-F-400). |
| C10 | A1-C9 | nein | Buchstabe entspricht dem Endbuchstaben C, Zahl 10 ist größer als die Endzahl 9 (SCHED-F-400, SCHED-F-420). |
| D2 | A1-C9 | nein | Buchstabe D liegt außerhalb des Bereichs A bis C (SCHED-F-420). |
| A5 | A-C9 | ja | Anfangszahl leer; bei Buchstabe A zählt jede Zahl als zugehörig (SCHED-F-390). |
| C1 | A1-C | ja | Endzahl leer; bei Buchstabe C zählt jede Zahl als zugehörig (SCHED-F-400). |
| C8 | A1B2 | ja, mit Protokolleintrag | `studentSet` entspricht weder Einzelwert- noch Bereichsmuster; im Alt-Code führt dieser Fall zu einem Absturz (siehe Abschnitt 12), die Neuentwicklung behandelt den Termin stattdessen als zugehörig zu allen Gruppen (SCHED-F-430). |

**SCHED-F-440.** Ergänzt die allgemeine Vorgabe DATA-F-020 (`../../platform/data-and-storage.md`) um den feature-spezifischen Befund: Die Alt-App erwartet exakt fünf gespeicherte Wochentag-Einträge und löscht bei jeder Abweichung den gesamten Bestand kommentarlos neu (`schedule_overview_viewmodel.dart:136-147`).

## 5. Datenmodell

Ein Stundenplan-Termin entspricht den Feldern des FBWS-Termindatensatzes (siehe INT-002 in `../../platform/integrations.md` für die Rohstruktur): `name`, `courseType`, `lecturerId`, `lecturerName`, `studentSet`, `timeBegin`, `timeEnd`, `weekday`, `roomId`, ergänzt um eine lokal gewählte `color`. Eigene Einträge nutzen dieselbe Struktur mit `courseType = "C"` und ohne `studentSet`-Einschränkung. Die Gruppenkennung (`^[A-Z][0-9]+$`, siehe `../../product/glossary.md`) ist ein rein lokales Attribut des Stundenplans einer Nutzerin, keine eigene Entität, und wird nie an einen Server übertragen. Speicherort, Lebensdauer und Löschwege dieser Daten regelt `../../platform/data-and-storage.md` (DATA-F-010).

## 6. Externe Schnittstellen

Nutzt INT-001 (FBWS Studiengänge) zur Auswahl des Studiengangs beim Anlegen eines offiziellen Stundenplans. Nutzt INT-002 (FBWS Termine) zum Abrufen der Termine für die gewählte Studiengang/Semester-Kombination. Endpunktdetails ausschließlich in `../../platform/integrations.md`.

## 7. UI-Flows & Zustände

| Ansicht | Lade-Zustand | Leer-Zustand | Fehler-Zustand | Offline-Zustand |
|---|---|---|---|---|
| Stundenplan-Übersicht | kurzer Ladeindikator beim Lesen der lokalen Daten | Hinweistext mit Verweis auf das Plus-Symbol (SCHED-F-340) | nicht anwendbar (rein lokale Anzeige) | zuletzt gespeicherter Stundenplan wird unverändert angezeigt (ARCH-F-100) |
| Offiziellen Plan anlegen | Ladeindikator während Studiengänge (INT-001) bzw. Termine (INT-002) abgerufen werden | nicht anwendbar, Formular ist immer sichtbar | Fehlermeldung mit Wiederholen-Option bei Netz- oder Serverfehler | Anlegen ist ohne Netzwerkverbindung nicht möglich; Hinweis darauf anzeigen |
| Eigenen Eintrag anlegen | nicht anwendbar, rein lokales Formular | nicht anwendbar | Validierungsmeldung bei leerem Pflichtfeld (SCHED-F-220) | uneingeschränkt nutzbar, da rein lokal |

## 8. Offline-Verhalten

Der zuletzt gespeicherte Stundenplan bleibt ohne Netzwerkverbindung vollständig les- und bearbeitbar (Farbe ändern, Eintrag entfernen, eigenen Eintrag anlegen), da diese Vorgänge ausschließlich lokale Daten betreffen (ARCH-F-100, DATA-F-010). Das Anlegen oder Erneuern eines offiziellen Stundenplans erfordert zwingend eine Verbindung zu INT-001/INT-002 und ist offline nicht möglich.

## 9. Fehlerfälle

| Fall | Systemreaktion | Bezug |
|---|---|---|
| Semesterauswahl geöffnet, bevor ein Studiengang gewählt wurde | Hinweisdialog anzeigen | SCHED-F-080 |
| Ungültige Gruppenkennung eingegeben | Validierungsmeldung anzeigen | SCHED-F-120 |
| Kein Studiengang oder Semester beim Speichern gewählt | Fehlermeldung anzeigen, Speichern verhindern | SCHED-F-140 |
| Pflichtfeld im eigenen Eintrag leer | Fehlermeldung anzeigen, Speichern verhindern | SCHED-F-220 |
| `studentSet` in unbekanntem Format geliefert | Termin als zu allen Gruppen zugehörig behandeln, Vorfall protokollieren | SCHED-F-430 |
| Unerwartete Anzahl gespeicherter Wochentag-Einträge beim Laden | Bestand erhalten, Nutzerin informieren | SCHED-F-440 |
| Netzwerk- oder Serverfehler bei INT-001/INT-002 | Fehlermeldung mit Wiederholen-Option | NFR-F-070 (`../../platform/non-functional.md`) |

## 10. Nicht-funktionale Anforderungen

| ID | Anforderung | Herkunft |
|---|---|---|
| SCHED-N-010 | Der Wechsel zwischen Wochentagen sollte unabhängig von der Anzahl gespeicherter Termine die in NFR-N-040 vorgegebene Reaktionszeit einhalten. | NEU |

Die automatisierte Testpflicht der Gruppenzuordnungslogik (SCHED-F-360 bis SCHED-F-430) sowie der Zeitformat-Umwandlung (SCHED-F-280) ist bereits in `../../platform/quality-and-testing.md` (QA-F-030, QA-F-040) festgelegt und wird hier nicht wiederholt. Die UI-freie Testbarkeit der Fachlogik folgt aus ARCH-F-070 (`../../platform/architecture.md`).

## 11. Akzeptanzkriterien

- Ein offizieller Stundenplan lässt sich für Studiengang, Semester und optional eine Gruppenkennung anlegen; nur bestätigte Termine werden übernommen (SCHED-F-050 bis SCHED-F-190).
- Ein eigener Termin lässt sich mit allen Pflichtfeldern anlegen, erhält `courseType = C` und wird korrekt einsortiert (SCHED-F-200 bis SCHED-F-230, SCHED-F-270).
- Für jede Zeile der Beispieltabelle zu SCHED-F-360 bis SCHED-F-430 liefert die Gruppenzuordnung das dort festgelegte Ergebnis.
- Der Stundenplan lässt sich vollständig löschen, nur nach Bestätigung (SCHED-F-320, UX-F-120).
- Die Farbe eines Termins lässt sich ändern, ein Eintrag lässt sich entfernen, beides über einen zweiten sichtbaren Bedienweg zusätzlich zum langen Drücken (SCHED-F-240, SCHED-F-250, UX-F-090).

## 12. Bewusst nicht übernommenes Altverhalten

| Verhalten | Fundstelle | Begründung / Ersatz |
|---|---|---|
| Doppelte, wirkungsgleiche Bedingung `info.groupLetter == "" \|\| info.groupLetter == ""` statt einer Prüfung von `groupLetter` und `groupNumber` | schedule_overview_viewmodel.dart:210 | Kopierfehler; da `groupLetter` und `groupNumber` in `SelectedCourseInfo` stets gemeinsam gesetzt werden, hat der Fehler im Altcode keine falsche Ausgabe zur Folge, ist aber irreführend und bei künftigen Änderungen fehleranfällig. Korrektes Verhalten: SCHED-F-360. |
| Vergleich von `info.groupNumber` (Ziffernteil) mit dem ersten Zeichen von `studentSet` (Buchstabe) bei Einzelwerten | schedule_overview_viewmodel.dart:216 | Kann für gültige Daten nie zutreffen; jeder Termin mit Einzelwert-`studentSet` (inklusive Wildcard `*`) gilt im Altcode fälschlich als fremd. Korrektes Verhalten: SCHED-F-370, SCHED-F-380. |
| Absturz (`RangeError`) bei `studentSet`, das weder Einzelwert noch dem Bereichsmuster entspricht, weil `.allMatches(...).toList()[0]` auf einer leeren Liste zugreift | schedule_overview_viewmodel.dart:219-221 | Ungeprüfter Zugriff auf ein Regex-Ergebnis; die Neuentwicklung muss bei unerwartetem Rohdatenformat robust bleiben. Korrektes Verhalten: SCHED-F-430. |
| Kommentarloses Löschen und Neuanlegen des gesamten gespeicherten Stundenplans bei einer von fünf abweichenden Eintragsanzahl | schedule_overview_viewmodel.dart:136-147 | Datenverlust ohne Rückfrage; siehe auch DATA-F-020. Korrektes Verhalten: SCHED-F-440. |
| Gruppenzugehörigkeit wird ausschließlich über abgeschwächte Deckkraft der Akzentfarbe markiert | schedule_card.dart:52-54 | Verstößt gegen den Grundsatz, Bedeutung nicht allein über Farbe zu vermitteln; siehe UX-F-080. |
| Textfarbe der Terminkarte ist unabhängig von der Hintergrundfarbe fest Weiß | schedule_card.dart:72,80,98,107,114 | Führt zu Kontrastproblemen auf hellen Palettenfarben (z. B. Gelb, Limette); siehe UX-F-040, UX-N-010. |
| Farbe ändern und Eintrag entfernen ausschließlich über langes Drücken erreichbar | schedule_list.dart:39-42 | Ohne Vorwissen nicht auffindbar; siehe UX-F-090. |
| `ScheduleOverviewViewModel` als app-weites Singleton mit langlebigen Instanzfeldern (`isLoading`, `editMode`) statt an den Lebenszyklus des Bildschirms gebunden | schedule_overview_viewmodel.dart:17-30; main.dart:59-61 | Widerspricht sauberer Zustandshaltung; siehe ARCH-F-080. |

## 13. Offene Fragen

- Umfang und Interaktionsmodell der Wochenansicht (SCHED-F-450): als Ersatz oder Ergänzung zur Tagesansicht? Klärung durch FSR FB4 und UX vor Umsetzung.
- Abgleichsverhalten zwischen gespeichertem und offiziellem Plan (SCHED-F-460): automatische Übernahme von Änderungen oder Bestätigung je Abweichung? Klärung durch FSR FB4.
- Umfang des Kalenderexports (SCHED-F-470): einmaliger Export oder laufende Synchronisation, benötigte Plattformberechtigungen? Klärung durch technische Leitung.
- Konkrete Verlinkung Raum → Raumsuche (SCHED-F-480): abhängig vom Datenmodell aus `../room-finder/spec.md`. Klärung gemeinsam mit RAUM.
- Kanal und Vorlaufzeit der Erinnerung vor Veranstaltungsbeginn (SCHED-F-490): Push oder lokale Benachrichtigung, konfigurierbare Vorlaufzeit? Klärung durch FSR FB4 und technische Leitung.
