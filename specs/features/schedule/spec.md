---
id: schedule
titel: Stundenplan
praefix: SCHED
status: accepted
prioritaet: kern
version: 1.0.0
owner: FSR FB4
last_reviewed: 2026-08-25
derived_from:
  - alte apps/android-fb4/FB4/fB4/src/main/java/de/fsrfb4/fb4/dialog/CalendarExportDialog.java
  - alte apps/android-fb4/FB4/fB4/src/main/java/de/fsrfb4/fb4/activities/timetable/AddEventsActivity.java
  - alte apps/android-fb4/FB4/fB4/src/main/java/de/fsrfb4/fb4/util/GroupLetterUtil.java
  - alte apps/fb4_app-main/fb4_app-main/lib/areas/schedule/viewmodels/schedule_overview_viewmodel.dart
  - alte apps/fb4_app-main/fb4_app-main/lib/areas/schedule/repositories/schedule_repository.dart
  - alte apps/fb4_app-main/fb4_app-main/lib/areas/schedule/repositories/course_info_repository.dart
  - alte apps/fb4_app-main/fb4_app-main/lib/areas/schedule/models/schedule_item.dart
  - alte apps/fb4_app-main/fb4_app-main/lib/areas/schedule/screens/add_official_schedule_page.dart
  - alte apps/fb4_app-main/fb4_app-main/lib/areas/schedule/screens/add_custom_schedule_item_page.dart
implemented_in: []
related:
  - ../../platform/architecture.md
  - ../../platform/integrations.md
  - ../../platform/data-and-storage.md
  - ../../platform/non-functional.md
  - ../../platform/ux-and-theming.md
  - ../../platform/quality-and-testing.md
  - ../../platform/backend-and-api.md
  - ../room-finder/spec.md
  - ../grades/spec.md
  - ../../product/whatsapp-feedback-inventory.md
---

# Stundenplan

## 1. Zweck & Nutzen

Der Stundenplan ist die meistgenutzte Funktion beider Alt-Apps und zeigt Studierenden ihre Lehrveranstaltungen für die aktuelle Woche. Er löst das Problem, dass der offizielle FBWS-Stundenplan pro Studiengang/Semester und ohne Gruppenfilterung ausgeliefert wird — die App filtert lokal auf die tatsächlich relevanten Termine der einzelnen Person und ergänzt eigene, nicht-offizielle Termine.

Für Studierende mit Wahlpflichtfächern kommt eine zweite Herausforderung hinzu: passende, mit dem übrigen Stundenplan konfliktfreie Termine zu finden — teils über das eigene Fachsemester hinaus, da Wahlpflichtmodule organisatorisch oft einem anderen Fachsemester zugeordnet sind als dem eigenen. Ebenso weichen manche Studierende bei Kollisionen oder verpassten Terminen informell auf die Veranstaltung einer anderen Gruppe aus. Der Stundenplan unterstützt beides über einen eigenen Planungsmodus (SCHED-F-250 bis SCHED-F-390), einschließlich eines wählbaren Zeitfensters und Optimierungsmodus.

## 2. Scope / Nicht-Scope

### Scope

- Anzeige offizieller FBWS-Termine (INT-002) für einen gewählten Studiengang und ein gewähltes Fachsemester.
- Lokale Filterung nach Gruppenkennung (`studentSet`-Abgleich, siehe Abschnitt 4).
- Anlegen, Bearbeiten und Löschen eigener, nicht-offizieller Termine, einschließlich eigener Prüfungstermine.
- Lokale Persistenz des Stundenplans über App-Neustarts hinweg (siehe `platform/data-and-storage.md`, DATA-F-010).
- Auswahl relevanter Prüfungstermine aus dem vom FSR/Admin importierten offiziellen Prüfungsplan (INT-013) und deren Anzeige im Stundenplan, gesondert gekennzeichnet.
- Benachrichtigung bei Änderungen an ausgewählten Prüfungsterminen.
- Planungsmodus: Einsicht und Übernahme einzelner Termine anderer Gruppen für eine Pflichtveranstaltung.
- Planungsmodus: Auswahl konfliktfreier Termine für Wahlpflichtmodule gegenüber dem eigenen Stundenplan, einschließlich explizitem Hinweis bei fehlender konfliktfreier Konstellation.
- Planungsmodus: auswählbares bevorzugtes Zeitfenster für die Anwesenheit an der Hochschule sowie auswählbarer Optimierungsmodus, nach dem mehrere konfliktfreie Terminoptionen geordnet werden.
- Planungsmodus: mehrere Wahlpflichtmodule gleichzeitig in einer Planungsauswahl führen und einzelne davon als „Pflicht" markieren, um weitere Kandidaten dagegen zu prüfen.

### Nicht-Scope

- Raumbelegung/-verfügbarkeit über den eigenen Stundenplan hinaus — siehe `features/room-finder/spec.md`.
- Serverseitige Speicherung des persönlichen Stundenplans einschließlich der individuellen Prüfungsauswahl — ausdrücklich ausgeschlossen, siehe `platform/backend-and-api.md` API-F-100 und Abschnitt 4 (Erläuterung zu SCHED-F-220).
- Import und Pflege des offiziellen Prüfungsplans selbst (Excel-Upload, Jahres-Rotation) — Backend-Vorgang, siehe `platform/backend-and-api.md` API-F-180 bis API-F-200 und `platform/integrations.md` INT-013.
- Notenergebnisse zu Prüfungen — siehe `features/grades/spec.md`; diese Spec zeigt ausschließlich Termine, keine Ergebnisse.
- Automatische, kombinatorische Optimierung über mehrere gleichzeitig **unentschiedene** Wahlpflicht-Kandidaten hinweg — mehrere Kandidaten können gleichzeitig in der Planungsauswahl geführt werden (SCHED-F-370), die Konfliktprüfung (SCHED-F-290/390) erfolgt aber je Kandidat einzeln gegen den bereits übernommenen Plan und die bereits als „Pflicht" markierten Module, nicht kombinatorisch zwischen mehreren noch unentschiedenen Kandidaten. Diese Ausgestaltung wurde bewusst erwogen und zurückgestellt (Rücksprache FSR FB4, 2026-08-25) — siehe Erläuterung zu SCHED-F-390.
- Automatische Zuordnung „Wahlpflichtmodul → zuständiges Fachsemester" — die Nutzerin wählt das zusätzliche Fachsemester für die Wahlpflicht-Planung selbst aus (SCHED-F-270), siehe Erläuterung dazu in Abschnitt 4.
- Echtzeit- oder Kapazitätsdaten zu Veranstaltungen (z. B. Auslastung, freie Plätze) — INT-002 liefert dazu keine Felder, siehe `platform/integrations.md` INT-002.

## 3. Nutzergeschichten

- Als Studierende möchte ich meinen Studiengang und mein Semester einmalig auswählen, damit ich danach meinen Stundenplan ohne erneute Eingabe sehe.
- Als Studierende möchte ich eine Gruppenkennung angeben, damit ich nur Termine sehe, die tatsächlich für meine Gruppe gelten.
- Als Studierende möchte ich eigene Termine (z. B. Lerngruppen) neben den offiziellen Terminen führen, damit ich nicht zwei getrennte Kalender pflegen muss.
- Als Studierende möchte ich beim Öffnen der App direkt beim aktuellen Wochentag landen, damit ich nicht manuell blättern muss.
- Als Studierende möchte ich aus dem offiziellen Prüfungsplan genau die Prüfungen auswählen, die mich betreffen (einschließlich Nachholprüfungen), damit ich nicht alle Prüfungstermine des Fachbereichs sehe.
- Als Studierende möchte ich eine eigene Prüfung eintragen können, falls sie nicht im offiziellen Prüfungsplan steht.
- Als Studierende möchte ich informiert werden, wenn sich eine von mir ausgewählte Prüfung verschiebt.
- Als Studierende möchte ich erkennen, wenn sich ein eigener Termin mit einem offiziellen überschneidet, damit ich den Konflikt nicht übersehe.
- Als Studierende möchte ich meinen Stundenplan als Kalenderdatei exportieren können, damit ich ihn in meiner bevorzugten Kalender-App weiterverwenden kann, statt eine zusätzliche App offen zu halten.
- Als Studierende möchte ich bei einem Semesterwechsel darauf hingewiesen werden, dass sich meine Gruppenkennung geändert haben könnte, damit mein Stundenplan nicht unbemerkt veraltet.
- Als Studierende möchte ich für eine Pflichtveranstaltung auch die Termine anderer Gruppen sehen, damit ich bei Terminkollision oder einem verpassten eigenen Termin gezielt zu einer passenderen Gruppe ausweichen kann.
- Als Studierende möchte ich beim Zusammenstellen meines Stundenplans mit Wahlpflichtfächern unterstützt werden, damit ich nicht jedes in Frage kommende Modul einzeln manuell auf Kollisionen mit meinem übrigen Stundenplan prüfen muss.
- Als Studierende möchte ich explizit informiert werden, wenn es für ein gewünschtes Wahlpflichtmodul keine mit meinem Stundenplan konfliktfreie Terminoption gibt, statt das mühsam selbst herauszufinden oder es erst beim Nichterscheinen-Können zu merken.
- Als Studierende möchte ich trotz einer erkannten Terminkollision ein Wahlpflichtmodul bewusst in meinen Plan aufnehmen können, falls ich die verpasste Veranstaltung nacharbeiten möchte.
- Als Studierende möchte ich festlegen, in welchem Zeitfenster ich überhaupt an der Hochschule sein möchte, damit mir der Planungsmodus keine für mich unpassend frühen oder späten Termine bevorzugt vorschlägt.
- Als Studierende möchte ich zwischen verschiedenen Optimierungszielen wählen (z. B. möglichst wenig Zeit vor Ort, ein ausgeglichener Tagesablauf oder mehr Pausen zwischen Terminen), damit der Planungsmodus zu meiner persönlichen Situation passt.
- Als Studierende möchte ich mehrere in Frage kommende Wahlpflichtmodule gleichzeitig im Blick behalten und einzelne davon als bereits entschieden markieren, damit ich schrittweise prüfen kann, ob ein weiteres Modul noch dazupasst, ohne alles gleichzeitig kombinatorisch durchrechnen zu müssen.

## 4. Funktionale Anforderungen

| ID | Anforderung | Herkunft |
|---|---|---|
| SCHED-F-010 | Das System muss den Stundenplan in den fünf Wochentagen Montag bis Freitag darstellen. | Alt: lib/main_page.dart |
| SCHED-F-020 | Das System muss der Nutzerin die Auswahl eines Studiengangs aus INT-001 und eines Fachsemesters aus dessen `grades`-Liste ermöglichen. | Alt: lib/areas/schedule/screens/add_official_schedule_page.dart |
| SCHED-F-030 | Wenn Studiengang und Fachsemester gewählt sind, muss das System die zugehörigen Termine über INT-002 abrufen und den fünf Wochentagen zuordnen. | Alt: lib/areas/schedule/repositories/schedule_repository.dart |
| SCHED-F-040 | Das System muss der Nutzerin die Eingabe einer Gruppenkennung nach dem Muster `^[A-Z][0-9]+$` ermöglichen. | Alt: lib/areas/schedule/models/selected_course_info.dart |
| SCHED-F-050 | Solange keine Gruppenkennung angegeben ist, muss das System alle abgerufenen Termine unabhängig von ihrem `studentSet` anzeigen. | Alt: lib/areas/schedule/viewmodels/schedule_overview_viewmodel.dart:210 |
| SCHED-F-060 | Wenn `studentSet` eines Termins den Wert `*` trägt, dann muss das System diesen Termin für jede angegebene Gruppenkennung anzeigen. | NEU |
| SCHED-F-070 | Wenn `studentSet` eines Termins ein Einzelwert ohne Bindestrich ist (z. B. `C8`), dann muss das System ihn genau dann anzeigen, wenn der Buchstabenteil der Gruppenkennung mit dem Buchstabenteil des `studentSet`-Werts übereinstimmt. | Alt: bewusst verworfen |
| SCHED-F-080 | Wenn `studentSet` eines Termins ein Bereich der Form `A1-C9` ist, dann muss das System einen Termin genau dann anzeigen, wenn das Paar (Buchstabe, Zahl) der Gruppenkennung — die Zahl dabei numerisch, nicht als Zeichenkette, verglichen — innerhalb des durch Anfangs- und Endpaar aufgespannten Bereichs liegt, einschließlich beider Grenzen. | Alt: lib/areas/schedule/viewmodels/schedule_overview_viewmodel.dart:218-249 |
| SCHED-F-090 | Wenn eine Bereichsgrenze in `studentSet` keine Zahl trägt (z. B. `A-C9`), dann muss das System diese Grenze als offen behandeln und jede Zahl auf dem jeweiligen Grenzbuchstaben einschließen. | Alt: lib/areas/schedule/viewmodels/schedule_overview_viewmodel.dart:225,235 |

Die Zahl numerisch statt zeichenweise zu vergleichen ist ausdrücklich festgehalten, weil ein reiner Zeichenkettenvergleich bei mehrstelligen Zahlen falsche Ergebnisse liefert (`"10"` wäre als Zeichenkette kleiner als `"9"`, da `'1' < '9'`). `quality-and-testing.md` (QA-F-030) verlangt automatisierte Tests genau für diesen Fall.
| SCHED-F-100 | Falls bei aktivem Ausblenden gruppenfremder Termine an einem Wochentag kein Termin verbleibt, muss das System diesen Tag als leer kennzeichnen und die Gruppenfilterung als Grund nennen. | NEU |
| SCHED-F-110 | Das System muss der Nutzerin das Anlegen eigener, nicht-offizieller Termine mit Titel, Wochentag, Beginn- und Endzeit ermöglichen. | Alt: lib/areas/schedule/screens/add_custom_schedule_item_page.dart |
| SCHED-F-120 | Das System muss eigene Termine dauerhaft von offiziellen FBWS-Terminen unterscheidbar kennzeichnen. | Alt: bewusst verworfen |
| SCHED-F-130 | Das System muss der Nutzerin das Bearbeiten und Löschen eigener Termine über einen sichtbaren Bedienweg ermöglichen, nicht ausschließlich über eine verdeckte Geste. | Alt: bewusst verworfen |
| SCHED-F-140 | Wenn die Nutzerin eine Gruppenkennung angibt, dann muss das System Termine, deren `studentSet` diese Kennung nicht einschließt, als gruppenfremd gekennzeichnet darstellen, statt sie zu entfernen. | Alt: lib/areas/schedule/widgets/schedule_card.dart:50-54 |
| SCHED-F-145 | Das System muss der Nutzerin einen Schalter bereitstellen, mit dem gruppenfremde Termine ausgeblendet und wieder eingeblendet werden können. | NEU |
| SCHED-F-150 | Wenn die Einstellung „beim Öffnen zum aktuellen Wochentag springen" aktiv ist, dann muss das System beim Öffnen des Stundenplans den aktuellen Wochentag anzeigen. | Alt: lib/areas/schedule/viewmodels/schedule_overview_viewmodel.dart:124-134 |
| SCHED-F-160 | Falls der aktuelle Tag ein Wochenendtag ist, muss das System beim automatischen Sprung zum aktuellen Wochentag stattdessen den vorangegangenen Freitag anzeigen. | Alt: lib/areas/schedule/viewmodels/schedule_overview_viewmodel.dart:132 |
| SCHED-F-170 | Das System muss den dargestellten Stundenplan als iCal-Datei (.ics) exportierbar machen, als einmaligen, lokal erzeugten Export ohne serverseitige Beteiligung. | Recherche: WhatsApp-Chat informatik-pi-ti-ds-ws-24-25, 2026-08-25 |
| SCHED-F-180 | Wenn ein neues Semester beginnt, dann muss das System die Nutzerin auf eine mögliche Anpassung von Fachsemester und Gruppenkennung hinweisen. | Recherche: WhatsApp-Chat praktische-informatik-ws-23-24, 2026-08-25 |
| SCHED-F-190 | Das System muss der Nutzerin das Kennzeichnen eines eigenen Termins als Prüfung ermöglichen. | NEU |
| SCHED-F-200 | Das System muss der Nutzerin die Auswahl relevanter Prüfungen aus dem importierten offiziellen Prüfungsplan (INT-013) ermöglichen, einschließlich Prüfungen, die die Nutzerin nachholen möchte. | NEU |
| SCHED-F-210 | Wenn ein Termin eine Prüfung ist — eigen als Prüfung gekennzeichnet oder aus dem Prüfungsplan ausgewählt —, muss das System ihn visuell gesondert von regulären Terminen kennzeichnen. | NEU |
| SCHED-F-220 | Wenn das Backend eine Aktualisierung des offiziellen Prüfungsplans meldet und mindestens einer der lokal ausgewählten Prüfungstermine der Nutzerin davon betroffen ist, muss das System die Nutzerin darüber informieren. | NEU |
| SCHED-F-230 | Wenn sich ein eigener Termin zeitlich mit einem offiziellen Termin überschneidet, muss das System beide Termine mit einem sichtbaren Konflikthinweis darstellen. | NEU |
| SCHED-F-175 | Das System muss der Nutzerin das Übertragen der ausgewählten Termine in einen von ihr gewählten Gerätekalender ermöglichen, mit Angabe eines Zeitraums. | Recherche: alte apps/android-fb4, dialog/CalendarExportDialog.java, 2026-08-25 |
| SCHED-F-177 | Falls die Berechtigung für den Gerätekalender nicht erteilt wird, muss das System den Datei-Export (SCHED-F-170) als Rückfallweg anbieten. | NEU |
| SCHED-F-240 | Das System muss der Nutzerin vor jedem Export die separate Auswahl ermöglichen, ob offizielle Termine, eigene Termine und Prüfungstermine jeweils enthalten sind. | NEU |
| SCHED-F-245 | Das System muss beim Anlegen des offiziellen Stundenplans die Auswahl ermöglichen, welche der abgerufenen Termine übernommen werden. | Alt: lib/areas/schedule/viewmodels/schedule_overview_viewmodel.dart:58-90 |
| SCHED-F-247 | Das System muss der Nutzerin das Ändern der Farbe eines einzelnen Termins über einen sichtbaren Bedienweg ermöglichen. | Alt: lib/areas/schedule/widgets/schedule_list.dart:59-136 |
| SCHED-F-248 | Das System muss zu jedem offiziellen Termin Veranstaltungsart, Zeitraum, Bezeichnung, Gruppenangabe, lehrende Person und Raum anzeigen. | Alt: lib/areas/schedule/widgets/schedule_card.dart:69-121 |
| SCHED-F-249 | Das System muss beim Anlegen eines eigenen Termins zusätzlich zu Titel, Wochentag und Zeiten die optionale Angabe von Raum und lehrender Person ermöglichen. | Alt: lib/areas/schedule/screens/add_custom_schedule_item_page.dart |
| SCHED-F-252 | Das System muss die Termine eines Wochentags aufsteigend nach Beginnzeit sortiert darstellen. | Alt: lib/areas/schedule/models/schedule_item.dart:80-82 |
| SCHED-F-254 | Falls die Studiengangsliste aus INT-001 nicht abrufbar ist, muss das System die vom Backend vorgehaltene Rückfallliste verwenden. | Recherche: alte apps/android-fb4, retrofit/TimeTableFallbackApi.java, 2026-08-25 |
| SCHED-F-250 | Das System muss der Nutzerin ermöglichen, für eine einzelne offizielle Veranstaltung die Termine anderer Gruppen einzusehen, unabhängig von der eigenen Gruppenkennung. | Recherche: WhatsApp-Chat fh-informatik-22-23 / informatik-pi-ti-ds-ws-24-25 / praktische-informatik-ws-23-24, 2026-08-25 |
| SCHED-F-260 | Das System muss der Nutzerin ermöglichen, einen nach SCHED-F-250 eingesehenen Termin einer anderen Gruppe anstelle des eigenen Gruppentermins in den persönlichen Stundenplan zu übernehmen; ein so übernommener Termin bleibt als offizieller Termin gekennzeichnet. | Recherche: WhatsApp-Chat informatik-pi-ti-ds-ws-24-25, 2026-08-25 |
| SCHED-F-270 | Das System muss der Nutzerin ermöglichen, zusätzlich zum eigenen Fachsemester ein weiteres Fachsemester desselben Studiengangs auszuwählen, um dessen Termine für die Wahlpflicht-Planung abzurufen. | Recherche: WhatsApp-Chat pi-8-semester-fh-informatik, 2026-08-25 |
| SCHED-F-280 | Das System muss der Nutzerin ermöglichen, aus den nach SCHED-F-270 abgerufenen Terminen ein Wahlpflichtmodul für die Planung auszuwählen. | NEU |
| SCHED-F-290 | Wenn ein nach SCHED-F-280 ausgewähltes Wahlpflichtmodul mehrere parallele Termine (Gruppen) anbietet, muss das System jeden dieser Termine gegen den aktuellen persönlichen Plan (eigene Gruppentermine, bereits angenommene Wahlpflicht-Termine, eigene Termine) auf zeitliche Konflikte prüfen und je Termin kennzeichnen, ob er konfliktfrei ist. | NEU |
| SCHED-F-300 | Wenn für ein nach SCHED-F-280 ausgewähltes Wahlpflichtmodul kein konfliktfreier Termin nach SCHED-F-290 existiert, muss das System dies der Nutzerin explizit mitteilen, statt die Termine kommentarlos aus der Auswahl auszublenden. | Recherche: WhatsApp-Chat praktische-informatik-ws-23-24 / informatik-pi-ti-ds-ws-24-25, 2026-08-25 |
| SCHED-F-310 | Das System muss der Nutzerin ermöglichen, trotz einer nach SCHED-F-290 erkannten Kollision einen Termin bewusst in den Plan zu übernehmen; ein so übernommener Termin muss dauerhaft als „angenommener Konflikt" gekennzeichnet bleiben. | NEU |
| SCHED-F-320 | Wenn mehrere nach SCHED-F-290 konfliktfreie Termine für ein Wahlpflichtmodul zur Auswahl stehen, muss das System zu jedem Termin den Wochentag anzeigen. | Recherche: WhatsApp-Chat pi-8-semester-fh-informatik / praktische-informatik-ws-23-24, 2026-08-25 |
| SCHED-F-330 | Das System muss der Nutzerin ermöglichen, für den Planungsmodus ein bevorzugtes Zeitfenster (früheste Beginnzeit, späteste Endzeit) für die Anwesenheit an der Hochschule festzulegen. | NEU |
| SCHED-F-340 | Bei der Prüfung eines Kandidaten-Termins (SCHED-F-290) muss das System zusätzlich zur Kollisionsprüfung kennzeichnen, ob der Termin außerhalb des festgelegten Zeitfensters (SCHED-F-330) liegt, ohne ihn deswegen aus der Auswahl zu entfernen. | NEU |
| SCHED-F-350 | Das System muss der Nutzerin für den Planungsmodus die Auswahl eines Optimierungsmodus ermöglichen, mindestens aus „minimale Zeit an der Hochschule", „ausgeglichener Tagesablauf" und „mehr Abstand zwischen Lerneinheiten". | NEU |
| SCHED-F-360 | Wenn im Planungsmodus mehrere nach SCHED-F-290 konfliktfreie Termine für einen Kandidaten zur Auswahl stehen, muss das System sie entsprechend dem gewählten Optimierungsmodus (SCHED-F-350) ordnen, sodass die nach dessen Kriterium günstigste Option zuerst erscheint. | NEU |
| SCHED-F-370 | Das System muss der Nutzerin ermöglichen, mehrere nach SCHED-F-280 ausgewählte Wahlpflichtmodule gleichzeitig in einer Planungsauswahl zu führen. | NEU |
| SCHED-F-380 | Das System muss der Nutzerin ermöglichen, ein Wahlpflichtmodul innerhalb der Planungsauswahl (SCHED-F-370) als „Pflicht" zu markieren, sobald sie sich für dessen Teilnahme entschieden hat. | NEU |
| SCHED-F-390 | Bei der Konfliktprüfung (SCHED-F-290) eines nicht als „Pflicht" markierten Wahlpflichtmoduls der Planungsauswahl muss das System dessen Termine gegen den bereits übernommenen Stundenplan sowie gegen die als „Pflicht" markierten Wahlpflichtmodule derselben Planungsauswahl prüfen, nicht gegen andere, ebenfalls noch nicht als „Pflicht" markierte Kandidaten. | NEU |

### Erläuterungen

**`SCHED-F-070`** — Die Alt-App vergleicht an dieser Stelle fehlerhaft den Zahlenteil der Gruppenkennung (`info.groupNumber`) mit dem ersten Zeichen des `studentSet`-Werts (`schedule_overview_viewmodel.dart:216`, `info.groupNumber.codeUnitAt(0) == item.studentSet.codeUnitAt(0)`), obwohl ein Buchstabenvergleich (`groupLetter`) gemeint war. Dadurch schlägt der Abgleich bei Einzelwert-`studentSet` in der Alt-App praktisch immer fehl, sofern nicht zufällig Zahl- und Buchstabenzeichen denselben Codepoint teilen. Für die Neuentwicklung ist SCHED-F-070 das korrigierte Sollverhalten (Buchstabenvergleich), nicht das beobachtete Altverhalten — daher die Markierung `Alt: bewusst verworfen` statt eines Quellverweises.

**`SCHED-F-190` bis `SCHED-F-220`** — Aus der Rücksprache mit dem FSR FB4, 2026-08-25: Der Fachbereich veröffentlicht während der Vorlesungszeit einen offiziellen Prüfungsplan als Excel-Datei auf einer Intranet-Seite (`https://intranet.fh-dortmund.de/hochschule/organisation/fachbereiche/informatik/pruefungen/pruefungsplaene`). Da diese Seite einen Hochschul-Login voraussetzt, den weder App noch Backend besitzen (siehe `product/vision.md` Nicht-Ziel 1, `platform/security-and-privacy.md` zum Verzicht auf Passwort-Replay), ist der Import zweistufig: Ein FSR-Mitglied/Admin lädt die Datei manuell herunter und in das eigene Backend hoch (`platform/backend-and-api.md` API-F-180, `platform/integrations.md` INT-013); danach wählen Studierende selbst die für sie relevanten Prüfungen aus dem importierten Bestand aus (SCHED-F-200). Nicht jede Prüfung des Fachbereichs interessiert jede Nutzerin — nur die eigenen und ggf. Nachholprüfungen.

**`SCHED-F-220`** — Verträgt sich mit API-F-100 (kein serverseitiges Speichern des persönlichen Stundenplans): Das Backend kennt nicht, welche Prüfungen eine einzelne Nutzerin ausgewählt hat, sondern löst bei jeder Aktualisierung des offiziellen Prüfungsplan-Bestands einen allgemeinen Hinweis aus (vergleichbar einer News-Meldung). Die App gleicht diesen Hinweis lokal gegen die eigene, ausschließlich gerätegespeicherte Auswahl ab und zeigt die Benachrichtigung nur, wenn tatsächlich ein ausgewählter Termin betroffen ist.

**Zweiwöchentliche Veranstaltungen (Hinweis aus derselben Rücksprache).** Manche Lehrveranstaltungen finden nur alle zwei Wochen statt. In der bislang dokumentierten INT-002-Antwortstruktur ist kein Feld erkennbar, das einen solchen Rhythmus trägt (nur INT-009 hat ein `interval`-Feld, dort bislang als „unklare Bedeutung, nicht weiter untersucht" geführt, siehe `platform/integrations.md`). Ob INT-002 wiederkehrende Termine bereits als separate wöchentliche Einträge liefert (dann unproblematisch) oder der Client die Information zur korrekten zweiwöchentlichen Darstellung fehlt, ist vor Umsetzung mit echten Beispieldaten zu verifizieren — siehe Abschnitt 13.

**`SCHED-F-170`/`SCHED-F-180`** — Aus der automatisierten WhatsApp-Chat-Auswertung (`product/whatsapp-feedback-inventory.md`, Abschnitt 4 „Themenübersicht"): Studis weichen teils auf ICS-Import in eine externe Kalender-App aus, wenn ihnen die App-eigene Ansicht nicht reicht; mehrfach dokumentierte Verwirrung entsteht, wenn sich die Gruppenkennung mit dem Semesterwechsel ändert, die App aber weiter den alten Stand zeigt.

**`SCHED-F-170`/`SCHED-F-175`/`SCHED-F-240` (Export-Ausgestaltung, entschieden).** Rücksprache FSR FB4, 2026-08-25: Studis sollen den in der App zusammengestellten Stundenplan in ein Kalenderprogramm ihrer Wahl integrieren können. Abgewogen wurden ein einmaliger Datei-Export (kein Server-Zugriff nötig, bleibt aber nicht automatisch aktuell) gegenüber einem abonnierbaren Kalender-Link (bleibt synchron, bräuchte aber einen serverseitigen Endpunkt und damit eine Ausnahme von API-F-100). Der abonnierbare Link bleibt ausgeschlossen, API-F-100 gilt ohne Ausnahme.

**Ergänzung vom selben Tag, nach Auswertung des Android-Quellcodes:** Die Android-Alt-App schreibt Termine unmittelbar in einen von der Nutzerin gewählten Gerätekalender, mit Auswahl des Zielkalenders und eines Zeitraums (`dialog/CalendarExportDialog.java`). Das ist bequemer als ein Datei-Export, den die Nutzerin anschließend selbst importieren muss, und damit der zu übertreffende Stand. Entscheidung FSR FB4, 2026-08-25: Beides wird angeboten — der Schreibzugriff als Hauptweg (SCHED-F-175), der Datei-Export als Rückfallweg für den Fall verweigerter Berechtigung oder eines Kalenders außerhalb des Geräts (SCHED-F-177). Die dafür nötige Kalenderberechtigung ist ausschließlich schreibend und wird erst bei tatsächlicher Nutzung angefragt; die zuvor gegenteilige Festlegung in `platform/security-and-privacy.md` Abschnitt 9 wurde entsprechend korrigiert. Konfigurierbar ist in beiden Wegen die Auswahl der enthaltenen Terminarten (SCHED-F-240).

**`SCHED-F-140`/`SCHED-F-145` — kennzeichnen statt entfernen.** Die vorige Fassung von SCHED-F-140 forderte, gruppenfremde Termine gar nicht anzuzeigen. Das stand im Widerspruch zu drei anderen Festlegungen: `platform/ux-and-theming.md` UX-F-080 verlangt, gruppenfremde Termine zusätzlich zur Farbe durch Text oder Symbol zu kennzeichnen — was voraussetzt, dass sie sichtbar sind; das Datenmodell in Abschnitt 5 führt eigens ein Merkmal `gruppenzugehoerig`; und beide Alt-Apps zeigen solche Termine abgeblendet statt sie zu entfernen (Flutter: `schedule_card.dart:50-54`, dokumentiert als L-017). Entscheidung FSR FB4, 2026-08-25: Kennzeichnen ist das Sollverhalten, das Ausblenden wird als Schalter angeboten (SCHED-F-145). Das deckt zugleich den in SCHED-F-250 beschriebenen Bedarf mit ab, Termine anderer Gruppen einzusehen.

**`SCHED-F-245` — Auswahl beim Anlegen.** Beide Alt-Apps lassen die Nutzerin beim Anlegen des offiziellen Stundenplans auswählen, welche der abgerufenen Termine tatsächlich übernommen werden; die Android-App filtert die Auswahlliste dabei nach Gruppenbuchstabe (`activities/timetable/AddEventsActivity.java`). Das ist mehr als Bequemlichkeit: Wahlpflichtveranstaltungen und Termine, an denen eine Person nicht teilnimmt, gehören nicht in ihren Plan, und ohne Auswahl beim Anlegen bliebe nur das nachträgliche Einzellöschen.

**`SCHED-F-247` — Farbwahl.** `platform/ux-and-theming.md` setzt in UX-F-040 (Textfarbe aus der Hintergrundfarbe ableiten), UX-N-010 (Mindestkontrast) und UX-F-090 (sichtbarer Bedienweg für Gestenaktionen) durchgehend voraus, dass Termine eine wählbare Farbe haben — eine Anforderung dafür fehlte bis zum 2026-08-25 jedoch in dieser Spec. SCHED-F-247 schließt die Lücke.

**`SCHED-F-254` — Rückfallliste.** Die Android-Alt-App hält eine vom eigenen Backend ausgelieferte Studiengangsliste vor, falls das Hochschulsystem nicht erreichbar ist (`retrofit/TimeTableFallbackApi.java`). Da die Studiengangsauswahl der Einstieg in den gesamten Stundenplan ist, macht ein Ausfall an dieser Stelle sonst das Anlegen unmöglich — auch für Nutzerinnen, die ihren Plan längst haben, aber ihn ändern wollen. Entspricht API-F-240.

**`SCHED-F-010`** vs. `platform/architecture.md` Abschnitt 3 — die fünf-Tage-Ansicht bleibt für den Stundenplan selbst bestehen, unabhängig von der übergeordneten Navigationsstruktur (SHELL).

**`SCHED-F-050` bis `SCHED-F-090` — Beispieltabelle.** `platform/quality-and-testing.md` (Abschnitt 5, QA-F-030) fordert automatisierte Tests genau für die Fälle dieser Tabelle und verweist für das jeweils korrekte Ergebnis auf diese Spec. Die Tabelle ist damit die verbindliche Vorgabe für diese Tests, nicht nur eine Illustration.

| Gruppenkennung | studentSet | zugehörig | Begründung |
|---|---|---|---|
| (keine) | C8 | ja | Ohne Gruppenkennung gelten alle Termine als zugehörig (SCHED-F-050). |
| C8 | C8 | ja | Einzelwert, Buchstabenteil der Kennung (C) stimmt mit dem Buchstabenteil von `studentSet` überein (SCHED-F-070). |
| C8 | C3 | ja | Einzelwert, nur der Buchstabe wird verglichen; die Zahl im `studentSet` bleibt unberücksichtigt (SCHED-F-070). |
| C8 | D3 | nein | Einzelwert, Buchstabe C weicht von D ab (SCHED-F-070). |
| C8 | * | ja | Wildcard gilt für jede Gruppenkennung (SCHED-F-060). |
| B5 | A1-C9 | ja | Buchstabe B liegt echt zwischen Anfangsbuchstabe A und Endbuchstabe C; Zahl ist damit unerheblich (SCHED-F-080). |
| A1 | A1-C9 | ja | Paar (A,1) entspricht genau der Anfangsgrenze, Grenze ist eingeschlossen (SCHED-F-080). |
| A0 | A1-C9 | nein | Paar (A,0) liegt unterhalb der Anfangsgrenze (A,1) — Buchstabe gleich, Zahl kleiner (SCHED-F-080). |
| C9 | A1-C9 | ja | Paar (C,9) entspricht genau der Endgrenze, Grenze ist eingeschlossen (SCHED-F-080). |
| C10 | A1-C9 | nein | Paar (C,10) liegt oberhalb der Endgrenze (C,9) — Buchstabe gleich, Zahl bei numerischem Vergleich größer (SCHED-F-080; ein Zeichenkettenvergleich würde hier fälschlich „ja" liefern, siehe Erläuterung zu SCHED-F-080). |
| D2 | A1-C9 | nein | Buchstabe D liegt außerhalb des Bereichs A bis C (SCHED-F-080). |
| A5 | A-C9 | ja | Anfangszahl leer, Grenze gilt als offen; bei Buchstabe A zählt jede Zahl (SCHED-F-090). |
| C1 | A1-C | ja | Endzahl leer, Grenze gilt als offen; bei Buchstabe C zählt jede Zahl (SCHED-F-090). |
| C8 | A1B2 | ja, mit Protokolleintrag | `studentSet` entspricht weder Einzelwert- noch Bereichsmuster; sicherer Rückfall auf „gruppenzugehörig" statt fälschlich als fremd markiert (siehe Abschnitt 9 „Fehlerfälle"). |

Die Spalte „zugehörig" beantwortet die Frage, ob ein Termin als zur eigenen Gruppe gehörend gilt. Sie entscheidet nicht über die Sichtbarkeit: Gruppenfremde Termine bleiben nach SCHED-F-140 sichtbar und werden gekennzeichnet; ausgeblendet werden sie nur, wenn die Nutzerin den Schalter aus SCHED-F-145 aktiviert.

**Wildcard-Befund aus der Android-Alt-App.** Deren Gruppenabgleich (`util/GroupLetterUtil.java`) behandelt den Wert `*` nicht gesondert: Er trifft die Bedingung für Einzelwerte nur, wenn die Gruppenkennung selbst mit `*` beginnt, und fällt andernfalls auf „nicht zugehörig" durch. Ein Termin, der ausdrücklich für alle Gruppen gilt, würde damit bei gesetzter Gruppenkennung als gruppenfremd markiert — das Gegenteil des Gemeinten. SCHED-F-060 legt das korrekte Verhalten fest; die Herkunftsmarkierung bleibt `NEU`, weil keine der beiden Alt-Apps ein Vorbild dafür liefert. Geführt als N-007 in `../../product/legacy-inventory.md`.

**`SCHED-F-250`/`SCHED-F-260` — Gruppenwechsel als beobachtetes Verhalten.** Aus der Chat-Auswertung (u. a. `pi-8-semester-fh-informatik`, 2022-12-14 und 2023-01-09; `praktische-informatik-ws-23-24`, 2023-09-21): Studierende weichen bereits informell auf andere Gruppen aus — bei eigener Krankheit, verpasstem Termin oder auf ausdrücklichen Wunsch („Will wer Gruppen wechseln?"). Ein Beleg aus `informatik-pi-ti-ds-ws-24-25` (2024-09-30) zeigt den bestehenden Workaround: Studierende tragen den Termin einer fremden Gruppe manuell als eigenen, nicht-offiziellen Termin ein (SCHED-F-110), um eine freie Lücke im eigenen Plan zu füllen. Da INT-002 mit `studentSet=*` ohnehin bereits alle Gruppentermine liefert (siehe `platform/integrations.md` INT-002) und clientseitig lediglich auf die eigene Gruppenkennung gefiltert wird (SCHED-F-140), ist dafür keine zusätzliche Integration nötig — SCHED-F-250/260 machen diesen bereits gelebten Workaround zu einem regulären, als offiziell erkennbaren Bedienweg, statt ihn über eine Nachbildung als „eigener Termin" laufen zu lassen. Ein weiterer Beleg (`fh-informatik-22-23`, 2022-12-14) nennt ausdrücklich das Risiko, dass insbesondere Termine gegen Wochenende hin „meistens sehr voll" sind — die App selbst kann diese Auslastung nicht anzeigen (INT-002 liefert keine Kapazitätsfelder, siehe Nicht-Scope), das Risiko bleibt daher der Nutzerin überlassen.

**`SCHED-F-270` bis `SCHED-F-320` — Wahlpflicht-Planungsmodus.** Die Chat-Auswertung zeigt durchgängig, dass die Terminfindung für Wahlpflichtmodule eigenständig schwierig ist: Studierende fragen wiederholt nach Modullisten, Empfehlungen für „einfache" Module und danach, wann ein Modul angeboten wird (`pi-8-semester-fh-informatik`, u. a. 2024-01-30, 2024-09-01, 2025-09-23, 2026-04-11; `praktische-informatik-ws-23-24`, u. a. 2025-09-15, 2025-09-19). Ein konkreter Beleg (`pi-8-semester-fh-informatik`, 2025-04-03) zeigt eine bestehende Lücke im Alt-App-Stundenplan selbst: Termine eines Wahlpflichtmoduls fehlten dort vollständig („auch die für Donnerstag stehen dort nicht (also im Wahlpflichtfach Stundenplan)"). Ursache ist vermutlich, dass INT-002 pro `{sname}/{grade}`-Paar abgefragt wird (siehe `platform/integrations.md` INT-002) und Wahlpflichtmodule organisatorisch oft einem anderen Fachsemester zugeordnet sind als dem der Nutzerin — SCHED-F-270 löst das, indem die Nutzerin gezielt ein zusätzliches Fachsemester abrufen kann. Ein weiterer Beleg (`informatik-pi-ti-ds-ws-24-25`, 2025-02-28) zeigt denselben Bedarf bei Wiederholerinnen: Um ihren Stundenplan zu planen, mussten sie erst selbst herausfinden, wann und wo eine zu wiederholende Veranstaltung stattfindet. SCHED-F-290/300 stellen sicher, dass eine fehlende konfliktfreie Option sichtbar gemeldet wird, statt wie im Beleg unbemerkt zu bleiben; SCHED-F-310 deckt den ebenfalls in der Einleitung dieser Spec beschriebenen Fall ab, dass Studierende eine Kollision bewusst in Kauf nehmen und die Veranstaltung nacharbeiten.

**`SCHED-F-270` — warum manuelle statt automatischer Fachsemester-Zuordnung.** Eine automatische Zuordnung „Wahlpflichtmodul → zuständiges Fachsemester" würde eine zusätzliche, gepflegte Datengrundlage voraussetzen (vergleichbar dem admin-importierten Prüfungsplan, INT-013) — dafür liegt keine Evidenz einer bestehenden, maschinenlesbaren Quelle vor. Die Chat-Belege zeigen, dass Studierende diese Zuordnung selbst über Modulhandbuch bzw. Curricula-PDF des Fachbereichs nachschlagen (`pi-8-semester-fh-informatik`, 2024-01-30: `modulhandbuch.php`; `praktische-informatik-ws-23-24`, 2025-09-15: `Curricula.pdf`) — beide öffentlich ohne Hochschul-Login erreichbar, anders als die Prüfungsplan-Seite (siehe Erläuterung zu SCHED-F-190 bis SCHED-F-220). Für den ersten Umfang übernimmt SCHED-F-270 dieses Verhalten unverändert als manuelle Fachsemester-Auswahl, ohne neue Integration; siehe Abschnitt 13 zur offenen Frage einer komfortableren Zuordnung in einer späteren Version.

**`SCHED-F-330`/`SCHED-F-340` — Zeitfenster als weiche statt harte Einschränkung.** Aus der Rücksprache mit dem FSR FB4, 2026-08-25: Ein Termin außerhalb des gewünschten Zeitfensters ist unbequem, aber nicht per se unzulässig — anders als eine echte Terminkollision (SCHED-F-290) lässt er sich nicht automatisch als „geht nicht" behandeln. Konsistent mit dem in dieser Spec durchgängig verfolgten Grundsatz „sichtbar statt fälschlich verborgen" (siehe SCHED-F-100, Abschnitt 9) blendet SCHED-F-340 einen Termin außerhalb des Zeitfensters daher nicht aus, sondern kennzeichnet ihn nur; der Optimierungsmodus (SCHED-F-360) berücksichtigt die Abweichung bei der Reihung, siehe unten. Anders als bei SCHED-F-310 (angenommener Konflikt) ist dafür keine gesonderte Bestätigungshandlung nötig, da keine echte Kollision vorliegt.

**`SCHED-F-350`/`SCHED-F-360` — Definition der Optimierungsmodi.** Aus der Rücksprache mit dem FSR FB4, 2026-08-25: Die drei Modi sind ein Mindestumfang, keine abschließende Liste (weitere Modi bleiben denkbar, siehe Abschnitt 13). Jeder Modus vergleicht ausschließlich bereits nach SCHED-F-290 konfliktfreie Kandidaten-Termine anhand von zwei aus den vorhandenen Zeitangaben ableitbaren Größen — keine neue Integration nötig:

- *Tagesspanne* eines Wochentags: Zeitraum von der frühesten Beginnzeit bis zur spätesten Endzeit aller Termine des bereits übernommenen Plans an diesem Wochentag, unter Einbeziehung des geprüften Kandidaten-Termins.
- *Nachbarabstand* eines Kandidaten-Termins: die kleinere der beiden Pausen zu dem unmittelbar vorangehenden bzw. nachfolgenden Termin desselben Wochentags im bereits übernommenen Plan; liegt an diesem Wochentag noch kein anderer Termin vor, gilt der Nachbarabstand als maximal.

| Optimierungsmodus | Bevorzugt wird der Kandidaten-Termin mit … |
|---|---|
| Minimale Zeit an der Hochschule | der geringsten zusätzlichen bzw. unveränderten Tagesspanne — ein Termin, der sich in eine bereits bestehende Tagesspanne einfügt, schlägt einen Termin an einem sonst freien Tag |
| Ausgeglichener Tagesablauf | der Tagesspanne, die eine Acht-Stunden-Spanne am nächsten trifft, statt sie deutlich zu über- oder unterschreiten |
| Mehr Abstand zwischen Lerneinheiten | dem größten Nachbarabstand |

Bei Gleichstand nach diesen Kriterien ist die Reihenfolge nicht weiter festgelegt (Implementierungsfreiheit); ein deterministisches, aber beliebiges Tie-Breaking (z. B. nach Wochentag) genügt.

**`SCHED-F-370` bis `SCHED-F-390` — Planungsauswahl mit Pflicht-Markierung statt Vollkombinatorik.** Aus der Rücksprache mit dem FSR FB4, 2026-08-25: Denkbar wäre auch ein Modus, der zusätzlich zu den Pflichtkursen mehrere gleichzeitig noch unentschiedene Wahlpflicht-Kandidaten entgegennimmt und alle Kombinationen daraus durchrechnet, um passende Konstellationen auszugeben. Diese Ausweitung wurde bewusst zurückgestellt — Begründung: die Ergebnisdarstellung würde bei mehr als wenigen gleichzeitig offenen Kandidaten schnell unübersichtlich, und der Zusatznutzen gegenüber dem hier gewählten schrittweisen Vorgehen (ein Kandidat nach dem anderen wird entschieden und dann als „Pflicht" markiert, SCHED-F-380) erschien nicht klar genug, um die Komplexität zu rechtfertigen. SCHED-F-370 bis SCHED-F-390 decken dafür genau den in den Nutzergeschichten beschriebenen Fall ab: mehrere Module gleichzeitig im Blick behalten, aber einzeln entscheiden. Eine Vollkombinatorik über mehrere gleichzeitig unentschiedene Kandidaten bleibt eine mögliche spätere Erweiterung, siehe Abschnitt 13.

## 5. Datenmodell

Termin (offiziell): siehe INT-002-Felder in `platform/integrations.md`, ergänzt um Kennzeichnung `istOffiziell: true`, `gruppenzugehoerig: boolean` (Ergebnis von SCHED-F-060 bis SCHED-F-090), `abweichendeGruppe: boolean` (SCHED-F-260, Termin einer anderen Gruppe übernommen statt des eigenen), optional `quellFachsemester` (SCHED-F-270, bei zusätzlich abgerufenem Fachsemester ungleich dem eigenen) und `akzeptierterKonflikt: boolean` (SCHED-F-310).

Termin (eigen): Titel, Wochentag, Beginnzeit, Endzeit, `istOffiziell: false`, `istPruefung: boolean` (SCHED-F-190). Kein Bezug zu INT-002-Feldern wie `courseType`, `lecturerName`, `studentSet`.

Prüfungsauswahl (lokal): Referenz auf einen Eintrag des vom Backend importierten Prüfungsplans (INT-013), rein gerätegespeichert (siehe Erläuterung zu SCHED-F-220) — kein serverseitiges Pendant.

Wahlpflicht-Planungsauswahl (lokal): gewähltes zusätzliches Fachsemester (SCHED-F-270), eine Liste gewählter Wahlpflichtmodule (SCHED-F-280/370), je Eintrag ein `pflicht: boolean`-Flag (SCHED-F-380) sowie der übernommene bzw. vorgeschlagene Termin samt Konfliktstatus und `innerhalbZeitfenster: boolean` (SCHED-F-290/310/340), rein gerätegespeichert — kein serverseitiges Pendant, gleiche Begründung wie bei der Prüfungsauswahl (Erläuterung zu SCHED-F-220, API-F-100). Planungsmodus-Einstellungen (lokal): Zeitfenster (früheste Beginnzeit, späteste Endzeit, SCHED-F-330) und gewählter Optimierungsmodus (SCHED-F-350), ebenfalls rein gerätegespeichert.

Gemeinsame Persistenz aller vier Datenarten: `platform/data-and-storage.md`, DATA-F-010.

## 6. Externe Schnittstellen

Nutzt INT-001 (FBWS Studiengänge) für die Studiengangs-/Semesterauswahl, INT-002 (FBWS Termine) für den Terminabruf und den vom Backend (INT-008) importierten Prüfungsplan (INT-013) für die Prüfungsauswahl. Für den Planungsmodus (SCHED-F-270) ruft die App INT-002 zusätzlich mit einem von der Nutzerin gewählten, vom eigenen abweichenden `{grade}` desselben Studiengangs ab — technisch derselbe Endpunkt, keine neue Integration. Keine weiteren Endpunktdetails hier — siehe `platform/integrations.md`.

## 7. UI-Flows & Zustände

| Zustand | Verhalten |
|---|---|
| Laden | Ladeanzeige während des INT-002-Abrufs, bestehende lokale Termine bleiben währenddessen sichtbar |
| Leer (kein Studiengang gewählt) | Hinweis auf die Studiengangsauswahl als nächsten Schritt |
| Leer (Gruppenfilterung aktiv, siehe SCHED-F-100) | Tag als leer gekennzeichnet, Grund „keine Termine für Gruppe X an diesem Tag" genannt, mit Hinweis auf den Schalter aus SCHED-F-145 |
| Fehler | Fehlermeldung mit Wiederholen-Option, zuletzt geladene Termine bleiben sichtbar (siehe `platform/architecture.md` ARCH-F-130) |
| Offline | Zuletzt geladener Stand wird angezeigt, siehe Abschnitt 8 |
| Planungsmodus: kein konfliktfreier Termin (SCHED-F-300) | Expliziter Hinweis „keine konfliktfreie Terminoption für dieses Modul"; Möglichkeit zur bewussten Übernahme trotz Konflikt (SCHED-F-310) wird angeboten |
| Planungsmodus: Termin außerhalb des Zeitfensters (SCHED-F-340) | Termin bleibt wählbar, zusätzlich sichtbar als „außerhalb des bevorzugten Zeitfensters" gekennzeichnet, keine gesonderte Bestätigung nötig |

## 8. Offline-Verhalten

Der Stundenplan ist einer der drei in `platform/architecture.md` (ARCH-F-100) benannten Bereiche mit garantiertem Offline-Zugriff auf den zuletzt geladenen Stand. Eigene Termine sind ausschließlich lokal gespeichert (DATA-F-010) und daher unabhängig vom Netzzugriff jederzeit verfügbar.

## 9. Fehlerfälle

| Fall | Reaktion |
|---|---|
| INT-001 liefert keinen zur vorherigen Auswahl passenden Studiengang mehr (z. B. nach Umbenennung) | Hinweis anzeigen, erneute Auswahl anbieten |
| INT-002 liefert ein `studentSet`, das keinem der Muster aus Abschnitt 4 entspricht | Termin als gruppenzugehörig behandeln (sicherer Rückfall: sichtbar statt fälschlich als fremd markiert), Vorfall protokollieren (SEC-F-060) |
| Kalenderberechtigung wird verweigert | Datei-Export als Rückfallweg anbieten (SCHED-F-177), keine wiederholte Nachfrage |
| INT-001 nicht erreichbar | Rückfallliste des Backends verwenden (SCHED-F-254), Alter der Liste sichtbar machen |
| Eigener Termin überschneidet sich zeitlich mit einem offiziellen Termin | Beide Termine anzeigen, zusätzlich sichtbarer Konflikthinweis (SCHED-F-230), keine automatische Konfliktauflösung |

## 10. Nicht-funktionale Anforderungen

| ID | Anforderung | Herkunft |
|---|---|---|
| SCHED-N-010 | Das System muss beim Blättern zwischen Wochentagen die Zielwerte aus `platform/non-functional.md` (NFR-N-040) einhalten. | NEU |

## 11. Akzeptanzkriterien

- Alle Beispielszenarien aus `platform/quality-and-testing.md` Abschnitt 5 (keine Gruppenkennung, Einzelwert, Wildcard, Bereich mit Gruppen innerhalb/außerhalb/an den Grenzen, Bereich mit offener Grenze) liefern das in Abschnitt 4 dieser Spec festgelegte Ergebnis.
- Eigene und offizielle Termine sind in der Darstellung eindeutig unterscheidbar (SCHED-F-120) und beide über einen sichtbaren Bedienweg löschbar (SCHED-F-130).
- Der automatische Sprung zum aktuellen Wochentag berücksichtigt Wochenenden korrekt (SCHED-F-160).
- Eine aus dem Prüfungsplan ausgewählte Prüfung sowie eine eigen eingetragene Prüfung sind beide eindeutig als Prüfung erkennbar (SCHED-F-210).
- Eine Änderung an einer ausgewählten Prüfung führt zu einer Benachrichtigung, eine Änderung an einer nicht ausgewählten Prüfung nicht (SCHED-F-220).
- Eine zeitliche Überschneidung eigener und offizieller Termine ist als solche sichtbar, nicht nur an der Uhrzeit ablesbar (SCHED-F-230).
- Der Export enthält je nach getroffener Auswahl ausschließlich die gewählten Terminarten (SCHED-F-240); eine erneute Änderung des Plans erfordert einen erneuten manuellen Export beziehungsweise eine erneute Übertragung, da keine Synchronisation stattfindet.
- Termine lassen sich in einen von der Nutzerin gewählten Gerätekalender übertragen; bei verweigerter Berechtigung steht der Datei-Export zur Verfügung (SCHED-F-175/177).
- Gruppenfremde Termine sind standardmäßig sichtbar und als solche erkennbar; der Schalter blendet sie aus und wieder ein (SCHED-F-140/145).
- Beim Anlegen des offiziellen Stundenplans lässt sich auswählen, welche Termine übernommen werden (SCHED-F-245).
- Eine Nutzerin kann für eine Pflichtveranstaltung den Termin einer anderen Gruppe einsehen und anstelle des eigenen Gruppentermins übernehmen, weiterhin als offizieller Termin erkennbar (SCHED-F-250/260).
- Für ein gewähltes Wahlpflichtmodul mit mehreren parallelen Terminen zeigt das System korrekt an, welche Termine konfliktfrei sind und welche nicht (SCHED-F-290).
- Existiert für ein gewähltes Wahlpflichtmodul kein konfliktfreier Termin, erhält die Nutzerin einen expliziten Hinweis statt einer stillschweigend leeren Auswahl, und kann optional bewusst einen Konflikt akzeptieren (SCHED-F-300/310).
- Termine außerhalb des festgelegten Zeitfensters werden sichtbar gekennzeichnet, aber nicht ausgeblendet (SCHED-F-340).
- Bei mehreren konfliktfreien Terminen für ein Wahlpflichtmodul steht im jeweils gewählten Optimierungsmodus erkennbar die nach dessen Kriterium (Tagesspanne bzw. Nachbarabstand, siehe Erläuterung zu SCHED-F-350/360) günstigste Option zuerst (SCHED-F-360).
- Wird ein Wahlpflichtmodul in der Planungsauswahl als „Pflicht" markiert, zählt es bei der Prüfung weiterer, noch nicht markierter Kandidaten als fixer Bestandteil des Plans; zwei gleichzeitig unentschiedene Kandidaten werden dabei nicht gegeneinander geprüft (SCHED-F-390).

## 12. Bewusst nicht übernommenes Altverhalten

- Fehlerhafter Gruppenabgleich bei Einzelwert-`studentSet` (Zahl-statt-Buchstabe-Vergleich) — Grund: Vergleich schlägt praktisch immer fehl, siehe Erläuterung zu SCHED-F-070.
- Ändern/Entfernen eigener Termine ausschließlich über langes Drücken erreichbar — Grund: nicht auffindbar ohne Vorwissen, siehe `platform/ux-and-theming.md` UX-F-090.
- Bei unerwarteter lokaler Datenmenge wird der gesamte Stundenplan kommentarlos gelöscht und neu angelegt — Grund: Datenverlust ohne Rückfrage, siehe `platform/data-and-storage.md` DATA-F-020.
- Gruppenfremde Termine allein durch abgeschwächte Farbe markieren, ohne Text oder Symbol — Grund: für Menschen mit Farbsinnstörung nicht unterscheidbar, siehe `platform/ux-and-theming.md` UX-F-080.
- Wildcard-`studentSet` als gruppenfremd behandeln — Grund: kehrt die Bedeutung um, siehe Wildcard-Befund in Abschnitt 4.

## 13. Offene Fragen

- SCHED-F-180 erkennt einen Semesterwechsel durch Abgleich der `grade`-Liste des gewählten Studiengangs aus INT-001 gegen den zuletzt gespeicherten Stand — zuverlässiger als ein festes Kalenderdatum, da Semesterstart-Termine variieren, und ohne zusätzliche manuelle Nutzerangabe.
- Format der Prüfungsplan-Excel-Datei (INT-013): Spaltenaufbau erst bei Vorliegen einer realen Datei zu klären, siehe `platform/integrations.md` INT-013.
- Zweiwöchentliche Veranstaltungen: Liefert INT-002 wiederkehrende Termine bereits als separate wöchentliche Einträge, oder fehlt eine Rhythmus-Angabe für eine korrekte Darstellung? Vor Umsetzung mit echten Beispieldaten zu verifizieren, siehe Erläuterung in Abschnitt 4.
- Liefert INT-002 für ein vom eigenen Fachsemester abweichendes `{grade}` (SCHED-F-270) tatsächlich die benötigten Wahlpflicht-Termine, oder nur die dort regulär vorgesehenen Pflichtveranstaltungen? Mehrere Chat-Belege deuten auf Lücken hin, wenn nur das eigene Fachsemester abgefragt wird (siehe Erläuterung zu SCHED-F-270 bis SCHED-F-320) — vor Umsetzung mit echten Beispieldaten zu verifizieren.
- Lohnt sich für eine spätere Version eine komfortablere, FSR-gepflegte Zuordnung „Wahlpflichtmodul → typisches Fachsemester" (vergleichbar dem Prüfungsplan-Import, INT-013) anstelle der manuellen Fachsemester-Auswahl aus SCHED-F-270? Für den ersten Umfang bewusst zurückgestellt, da ohne zusätzliche Integration umsetzbar — siehe Erläuterung zu SCHED-F-270.
- Weitere Optimierungsmodi über die drei Mindestmodi aus SCHED-F-350 hinaus (z. B. „möglichst früh fertig", „bestimmte Wochentage bevorzugt frei") — bewusst als erweiterbare, nicht abschließende Liste formuliert; konkrete weitere Modi bei Bedarf nachzutragen, ohne SCHED-F-350 selbst zu ändern.
- Vollkombinatorische Analyse mehrerer gleichzeitig unentschiedener Wahlpflicht-Kandidaten gegeneinander (statt der schrittweisen Pflicht-Markierung aus SCHED-F-380) — bewusst zurückgestellt, siehe Erläuterung zu SCHED-F-370 bis SCHED-F-390; mögliche spätere Erweiterung, falls sich die schrittweise Variante in der Praxis als unzureichend erweist.
- Ob das Zeitfenster (SCHED-F-330) einheitlich für alle Wochentage gilt oder je Wochentag unterschiedlich einstellbar sein sollte — für den ersten Umfang als ein einheitliches Zeitfenster angenommen, mangels gegenteiliger Evidenz aus der Rücksprache mit dem FSR FB4.
