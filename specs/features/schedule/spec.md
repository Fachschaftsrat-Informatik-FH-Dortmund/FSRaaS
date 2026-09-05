---
id: schedule
titel: Stundenplan
praefix: SCHED
status: accepted
prioritaet: kern
version: 3.1.0
owner: FSR FB4
last_reviewed: 2026-09-04
derived_from:
  - alte apps/android-fb4/FB4/fB4/src/main/java/de/fsrfb4/fb4/dialog/CalendarExportDialog.java
  - alte apps/android-fb4/FB4/fB4/src/main/java/de/fsrfb4/fb4/service/DataService.java
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

- Anzeige offizieller FBWS-Termine (INT-002) für einen gewählten Studiengang und ein gewähltes Fachsemester, wahlweise erweitert um weitere Fachsemester desselben Studiengangs.
- Darstellung in echten Kalenderwochen mit Datumsbezug, einschließlich Blättern über Wochengrenzen und Kennzeichnung vorlesungsfreier Wochen.
- Kursbasierte Zusammenstellung des Plans über die Ebenen Veranstaltung, Veranstaltungsart und Gruppen-Slot, mit Suche und Filtern.
- Führen eines Termins wahlweise als „fest" oder „vorgemerkt", um sich mehrere zeitgleiche Angebote bewusst offenzuhalten.
- Lokale Filterung nach Gruppenkennung (`studentSet`-Abgleich, siehe Abschnitt 4).
- Anlegen, Bearbeiten und Löschen eigener, nicht-offizieller Einträge — wahlweise wöchentlich wiederkehrend oder einmalig an einem Datum —, einschließlich eigener Prüfungstermine.
- Ermittlung der Gruppenkennung aus der Matrikelnummer (INT-019) als Alternative zur manuellen Eingabe.
- Lokale Persistenz des Stundenplans über App-Neustarts hinweg (siehe `platform/data-and-storage.md`, DATA-F-010).
- Auswahl relevanter Prüfungstermine aus dem vom FSR/Admin importierten offiziellen Prüfungsplan (INT-013) und deren Anzeige im Stundenplan, gesondert gekennzeichnet.
- Benachrichtigung bei Änderungen an ausgewählten Prüfungsterminen.
- Planungsmodus: Einsicht und Übernahme einzelner Termine anderer Gruppen für eine Pflichtveranstaltung.
- Planungsmodus: Auswahl konfliktfreier Termine für Wahlpflichtmodule gegenüber dem eigenen Stundenplan, einschließlich explizitem Hinweis bei fehlender konfliktfreier Konstellation.
- Planungsmodus: auswählbares bevorzugtes Zeitfenster für die Anwesenheit an der Hochschule sowie auswählbarer Optimierungsmodus, nach dem mehrere konfliktfreie Terminoptionen geordnet werden.
- Planungsmodus: mehrere Wahlpflichtmodule gleichzeitig in einer Planungsauswahl führen und einzelne davon als „Pflicht" markieren, um weitere Kandidaten dagegen zu prüfen.
- Abgleich der eigenen offiziellen Termine gegen den Raumplan (INT-009) und Hinweis am Stundenplan-Eintrag bei abweichendem Raum oder fehlender Zuordnung.

### Nicht-Scope

- Raumbelegung/-verfügbarkeit über den eigenen Stundenplan hinaus — siehe `features/room-finder/spec.md`.
- Serverseitige Speicherung des persönlichen Stundenplans einschließlich der individuellen Prüfungsauswahl — ausdrücklich ausgeschlossen, siehe `platform/backend-and-api.md` API-F-100 und Abschnitt 4 (Erläuterung zu SCHED-F-220).
- Import und Pflege des offiziellen Prüfungsplans selbst (Excel-Upload, Jahres-Rotation) — Backend-Vorgang, siehe `platform/backend-and-api.md` API-F-180 bis API-F-200 und `platform/integrations.md` INT-013.
- Notenergebnisse zu Prüfungen — siehe `features/grades/spec.md`; diese Spec zeigt ausschließlich Termine, keine Ergebnisse.
- Automatische, kombinatorische Optimierung über mehrere gleichzeitig **unentschiedene** Wahlpflicht-Kandidaten hinweg — mehrere Kandidaten können gleichzeitig in der Planungsauswahl geführt werden (SCHED-F-370), die Konfliktprüfung (SCHED-F-290/390) erfolgt aber je Kandidat einzeln gegen den bereits übernommenen Plan und die bereits als „Pflicht" markierten Module, nicht kombinatorisch zwischen mehreren noch unentschiedenen Kandidaten. Diese Ausgestaltung wurde bewusst erwogen und zurückgestellt (Rücksprache FSR FB4, 2026-08-25) — siehe Erläuterung zu SCHED-F-390.
- ~~Automatische Zuordnung „Wahlpflichtmodul → zuständiges Fachsemester"~~ Seit 2026-08-26 doch im Scope: `platform/integrations.md` INT-002 dokumentiert mit `WFPB` eine vom Fachbereich selbst gepflegte Sammelkategorie, die alle aktuell angebotenen Wahlpflichtmodule automatisch liefert (SCHED-F-400) — eine manuelle Fachsemester-Auswahl durch die Nutzerin ist damit nicht mehr nötig.
- Echtzeit- oder Kapazitätsdaten zu Veranstaltungen (z. B. Auslastung, freie Plätze) — INT-002 liefert dazu keine Felder, siehe `platform/integrations.md` INT-002.
- Verbindliche Auskunft über Ausfall oder Raumänderung — der Abgleich aus SCHED-F-410 ff. liefert nur einen unbestätigten Hinweis; die verbindliche Quelle für Raumänderungen ist „FB-Aktuelles" (`../news/spec.md`, `platform/integrations.md` INT-010).

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
- Als Studierende möchte ich im Stundenplan einen Hinweis sehen, wenn der aktuelle Raumplan für einen meiner Termine einen anderen Raum führt oder ihn nicht kennt, damit ich nicht vor einem falschen oder leeren Raum stehe.
- Als Studierende möchte ich beim Blick auf die Wochentagsleiste sofort erkennen, an welchen Tagen wie viel ansteht, ohne jeden Tag einzeln aufzurufen.
- Als Studierende möchte ich sehen, welcher Termin gerade läuft und was als Nächstes ansteht, ohne den Plan durchsuchen zu müssen.
- Als Studierende möchte ich mir zwei Veranstaltungen zur selben Uhrzeit vormerken können, um vor Ort zu entscheiden, in welche ich gehe, ohne dass die App mich dauerhaft vor einem Konflikt warnt.
- Als Studierende möchte ich beim Zusammenstellen meines Plans einzelne Veranstaltungsarten weglassen können, weil ich zum Beispiel das Praktikum einer Veranstaltung nicht belege.
- Als Wiederholerin möchte ich eine Veranstaltung aus einem anderen Fachsemester in meinen Plan aufnehmen und dabei auf Kollisionen geprüft werden, wie bei einem Wahlpflichtmodul auch.
- Als Studierende möchte ich meinen Plan auch für kommende Wochen ansehen, damit ich erkenne, wann eine Veranstaltung endet oder wann vorlesungsfreie Zeit beginnt.
- Als Studierende möchte ich meine Gruppenkennung nicht kennen oder nachschlagen müssen, sondern sie über meine Matrikelnummer ermitteln lassen.
- Als Studierende möchte ich eine Gruppenkennung auch dann angeben können, wenn ich nur den Buchstaben kenne, weil die Zahl im Alltag keine Rolle spielt.
- Als Studierende möchte ich sowohl eine wöchentliche Lerngruppe als auch einen einmaligen Termin eintragen können, ohne dass die App beides gleich behandelt.

## 4. Funktionale Anforderungen

| ID | Anforderung | Herkunft |
|---|---|---|
| SCHED-F-010 | Das System muss den Stundenplan mindestens in den fünf Wochentagen Montag bis Freitag darstellen. | Alt: lib/main_page.dart |
| SCHED-F-020 | Das System muss der Nutzerin die Auswahl eines Studiengangs und eines zugehörigen Fachsemesters aus INT-001 ermöglichen. | Alt: lib/areas/schedule/screens/add_official_schedule_page.dart |
| SCHED-F-030 | Wenn Studiengang und Fachsemester gewählt sind, muss das System die zugehörigen Termine über INT-002 abrufen und den fünf Wochentagen zuordnen. | Alt: lib/areas/schedule/repositories/schedule_repository.dart |
| SCHED-F-040 | Das System muss der Nutzerin die Angabe einer Gruppenkennung nach dem Muster `^[A-Z][0-9]*$` ermöglichen, wobei der Buchstabe verpflichtend und die Zahl freiwillig ist. | Alt: lib/areas/schedule/models/selected_course_info.dart |
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
| SCHED-F-140 | Wenn die Nutzerin eine Gruppenkennung angibt, dann muss das System Termine des Auswahlbestands, deren `studentSet` diese Kennung nicht einschließt, als gruppenfremd gekennzeichnet darstellen, statt sie zu entfernen. | Alt: lib/areas/schedule/widgets/schedule_card.dart:50-54 |
| SCHED-F-145 | Das System muss der Nutzerin einen Schalter bereitstellen, mit dem gruppenfremde Termine ausgeblendet und wieder eingeblendet werden können. | NEU |
| SCHED-F-150 | Wenn die Einstellung „beim Öffnen zum aktuellen Wochentag springen" aktiv ist, dann muss das System beim Öffnen des Stundenplans den aktuellen Wochentag anzeigen. | Alt: lib/areas/schedule/viewmodels/schedule_overview_viewmodel.dart:124-134 |
| SCHED-F-160 | Falls der aktuelle Tag ein Wochenendtag ohne Termine ist, muss das System beim automatischen Sprung zum aktuellen Wochentag stattdessen den nächsten Wochentag anzeigen, an dem Termine liegen. | Alt: lib/areas/schedule/viewmodels/schedule_overview_viewmodel.dart:132 |
| SCHED-F-170 | Das System muss den dargestellten Stundenplan als iCal-Datei (.ics) exportierbar machen, als einmaligen, lokal erzeugten Export ohne serverseitige Beteiligung. | Recherche: WhatsApp-Chat informatik-pi-ti-ds-ws-24-25, 2026-08-25 |
| SCHED-F-180 | Wenn ein neues Semester beginnt, dann muss das System die Nutzerin auf eine mögliche Anpassung von Fachsemester und Gruppenkennung hinweisen. | Recherche: WhatsApp-Chat praktische-informatik-ws-23-24, 2026-08-25 |
| SCHED-F-190 | Das System muss der Nutzerin das Kennzeichnen eines eigenen Termins als Prüfung ermöglichen. | NEU |
| SCHED-F-200 | Das System muss der Nutzerin die Auswahl relevanter Prüfungen aus dem importierten offiziellen Prüfungsplan (INT-013) ermöglichen, einschließlich Prüfungen, die die Nutzerin nachholen möchte. | NEU |
| SCHED-F-210 | Wenn ein Termin eine Prüfung ist — eigen als Prüfung gekennzeichnet oder aus dem Prüfungsplan ausgewählt —, muss das System ihn visuell gesondert von regulären Terminen kennzeichnen. | NEU |
| SCHED-F-220 | Wenn das Backend eine Aktualisierung des offiziellen Prüfungsplans meldet und mindestens einer der lokal ausgewählten Prüfungstermine der Nutzerin davon betroffen ist, muss das System die Nutzerin darüber informieren. | NEU |
| SCHED-F-230 | Wenn sich zwei Termine des persönlichen Plans mit dem Status „fest" (SCHED-F-570) zeitlich überschneiden, muss das System beide Termine mit einem sichtbaren Konflikthinweis darstellen, unabhängig davon, ob sie offiziell oder eigen sind. | NEU |
| SCHED-F-175 | Das System muss der Nutzerin das Übertragen der ausgewählten Termine in einen von ihr gewählten Gerätekalender ermöglichen, mit Angabe eines Zeitraums. | Recherche: alte apps/android-fb4, dialog/CalendarExportDialog.java, 2026-08-25 |
| SCHED-F-176 | Das System sollte den beim Kalenderexport vorgeschlagenen Zeitraum auf das serverseitig gepflegte aktuelle Semester (Beginn und Ende) vorbelegen. | Recherche: alte apps/android-fb4, dialog/CalendarExportDialog.java:204,215, 2026-08-26 |
| SCHED-F-177 | Falls die Berechtigung für den Gerätekalender nicht erteilt wird, muss das System den Datei-Export (SCHED-F-170) als Rückfallweg anbieten. | NEU |
| SCHED-F-240 | Das System muss der Nutzerin vor jedem Export die separate Auswahl ermöglichen, ob offizielle Termine, eigene Termine und Prüfungstermine jeweils enthalten sind. | NEU |
| SCHED-F-245 | Das System muss beim Anlegen des offiziellen Stundenplans die Auswahl ermöglichen, welche der abgerufenen Veranstaltungen, Veranstaltungsarten und Gruppen-Slots übernommen werden. | Alt: lib/areas/schedule/viewmodels/schedule_overview_viewmodel.dart:58-90 |
| SCHED-F-247 | Das System muss der Nutzerin das Ändern der Farbe eines einzelnen Termins über einen sichtbaren Bedienweg ermöglichen, abweichend von der nach SCHED-F-660 vergebenen Vorbelegung. | Alt: lib/areas/schedule/widgets/schedule_list.dart:59-136 |
| SCHED-F-248 | Das System muss zu jedem offiziellen Termin Veranstaltungsart, Zeitraum, Bezeichnung, Gruppenangabe, lehrende Person und Raum anzeigen. | Alt: lib/areas/schedule/widgets/schedule_card.dart:69-121 |
| SCHED-F-249 | Das System muss beim Anlegen eines eigenen Termins zusätzlich zu Titel, Wochentag und Zeiten die optionale Angabe von Raum und lehrender Person ermöglichen. | Alt: lib/areas/schedule/screens/add_custom_schedule_item_page.dart |
| SCHED-F-252 | Das System muss die Termine eines Wochentags aufsteigend nach Beginnzeit sortiert darstellen. | Alt: lib/areas/schedule/models/schedule_item.dart:80-82 |
| SCHED-F-254 | Falls die Studiengangsliste aus INT-001 nicht abrufbar ist, muss das System die vom Backend vorgehaltene Rückfallliste verwenden. | Recherche: alte apps/android-fb4, retrofit/TimeTableFallbackApi.java, 2026-08-25 |
| SCHED-F-250 | Das System muss der Nutzerin ermöglichen, für eine einzelne offizielle Veranstaltung die Termine anderer Gruppen einzusehen, unabhängig von der eigenen Gruppenkennung. | Recherche: WhatsApp-Chat fh-informatik-22-23 / informatik-pi-ti-ds-ws-24-25 / praktische-informatik-ws-23-24, 2026-08-25 |
| SCHED-F-260 | Das System muss der Nutzerin ermöglichen, einen nach SCHED-F-250 eingesehenen Termin einer anderen Gruppe zusätzlich zu oder anstelle des eigenen Gruppentermins in den persönlichen Stundenplan zu übernehmen; ein so übernommener Termin bleibt als offizieller Termin gekennzeichnet. | Recherche: WhatsApp-Chat informatik-pi-ti-ds-ws-24-25, 2026-08-25 |
| ~~SCHED-F-270~~ | ~~Das System muss der Nutzerin ermöglichen, zusätzlich zum eigenen Fachsemester ein weiteres Fachsemester desselben Studiengangs auszuwählen, um dessen Termine für die Wahlpflicht-Planung abzurufen.~~ — entfallen | Recherche: WhatsApp-Chat pi-8-semester-fh-informatik, 2026-08-25 |
| SCHED-F-400 | Das System muss die Wahlpflichtmodul-Liste automatisch aus der dafür vorgesehenen FBWS-Sammelkategorie beziehen, ohne dass die Nutzerin ein Fachsemester manuell auswählen muss. | Recherche: FBWS live abgefragt (WFPB), 2026-08-26 |
| SCHED-F-280 | Das System muss der Nutzerin ermöglichen, eine Veranstaltung des Auswahlbestands als Kandidat für die Planung auszuwählen. | NEU |
| SCHED-F-290 | Wenn ein nach SCHED-F-280 ausgewählter Kandidat mehrere parallele Termine (Gruppen) anbietet, muss das System jeden dieser Termine gegen die Termine des persönlichen Plans mit dem Status „fest" (SCHED-F-570) auf zeitliche Konflikte prüfen und je Termin kennzeichnen, ob er konfliktfrei ist. | NEU |
| SCHED-F-300 | Wenn für einen nach SCHED-F-280 ausgewählten Kandidaten kein konfliktfreier Termin nach SCHED-F-290 existiert, muss das System dies der Nutzerin explizit mitteilen, statt die Termine kommentarlos aus der Auswahl auszublenden. | Recherche: WhatsApp-Chat praktische-informatik-ws-23-24 / informatik-pi-ti-ds-ws-24-25, 2026-08-25 |
| SCHED-F-310 | Das System muss der Nutzerin ermöglichen, trotz einer nach SCHED-F-290 erkannten Kollision einen Termin bewusst in den Plan zu übernehmen; ein so übernommener Termin muss dauerhaft als „angenommener Konflikt" gekennzeichnet bleiben. | NEU |
| SCHED-F-320 | Wenn mehrere nach SCHED-F-290 konfliktfreie Termine für einen Kandidaten zur Auswahl stehen, muss das System zu jedem Termin den Wochentag anzeigen. | Recherche: WhatsApp-Chat pi-8-semester-fh-informatik / praktische-informatik-ws-23-24, 2026-08-25 |
| SCHED-F-330 | Das System muss der Nutzerin ermöglichen, für den Planungsmodus ein bevorzugtes Zeitfenster (früheste Beginnzeit, späteste Endzeit) für die Anwesenheit an der Hochschule festzulegen. | NEU |
| SCHED-F-340 | Bei der Prüfung eines Kandidaten-Termins (SCHED-F-290) muss das System zusätzlich zur Kollisionsprüfung kennzeichnen, ob der Termin außerhalb des festgelegten Zeitfensters (SCHED-F-330) liegt, ohne ihn deswegen aus der Auswahl zu entfernen. | NEU |
| SCHED-F-350 | Das System muss der Nutzerin für den Planungsmodus die Auswahl eines Optimierungsmodus ermöglichen, mindestens aus „minimale Zeit an der Hochschule", „ausgeglichener Tagesablauf" und „mehr Abstand zwischen Lerneinheiten". | NEU |
| SCHED-F-360 | Wenn im Planungsmodus mehrere nach SCHED-F-290 konfliktfreie Termine für einen Kandidaten zur Auswahl stehen, muss das System sie entsprechend dem gewählten Optimierungsmodus (SCHED-F-350) ordnen, sodass die nach dessen Kriterium günstigste Option zuerst erscheint. | NEU |
| SCHED-F-370 | Das System muss der Nutzerin ermöglichen, mehrere nach SCHED-F-280 ausgewählte Kandidaten gleichzeitig in einer Planungsauswahl zu führen. | NEU |
| SCHED-F-380 | Das System muss der Nutzerin ermöglichen, einen Kandidaten innerhalb der Planungsauswahl (SCHED-F-370) als „Pflicht" zu markieren, sobald sie sich für dessen Teilnahme entschieden hat. | NEU |
| SCHED-F-390 | Bei der Konfliktprüfung (SCHED-F-290) eines nicht als „Pflicht" markierten Kandidaten der Planungsauswahl muss das System dessen Termine gegen den bereits übernommenen Stundenplan sowie gegen die als „Pflicht" markierten Kandidaten derselben Planungsauswahl prüfen, nicht gegen andere, ebenfalls noch nicht als „Pflicht" markierte Kandidaten. | NEU |
| SCHED-F-410 | Das System muss jeden offiziellen Termin des persönlichen Stundenplans gegen die zwischengespeicherten Raumplan-Termine (INT-009, siehe `../room-finder/spec.md`) abgleichen, zugeordnet vorrangig über die in beiden Beständen geführte Veranstaltungskennung `courseId` und ergänzend über Wochentag, Beginnzeit und Gruppenangabe; für Einträge ohne `courseId` gilt der Merkmalssatz Bezeichnung, Wochentag, Beginnzeit und Gruppenangabe als Rückfall. | NEU |
| SCHED-F-420 | Wenn ein offizieller Termin im Raumplan zugeordnet werden kann, dort aber unter keiner der geführten Raumkennungen mit dem im Stundenplan gespeicherten Raum übereinstimmt, dann muss das System am betroffenen Stundenplan-Eintrag einen Hinweis auf eine mögliche Raumänderung mit der abweichenden Raumkennung anzeigen. | NEU |
| SCHED-F-430 | Wenn ein offizieller Termin im aktuellen Raumplan unter keinem Merkmalssatz zugeordnet werden kann, dann muss das System am betroffenen Stundenplan-Eintrag einen Hinweis anzeigen, dass der Termin im Raumplan fehlt und möglicherweise entfällt oder verlegt wurde. | NEU |
| SCHED-F-440 | Das System muss einen Hinweis nach SCHED-F-420 oder SCHED-F-430 als unbestätigte Ableitung kennzeichnen und auf „FB-Aktuelles" (`../news/spec.md`) als verbindliche Quelle verweisen. | NEU |
| SCHED-F-445 | Solange ein Hinweis nach SCHED-F-420 oder SCHED-F-430 angezeigt wird, darf das System den betroffenen Stundenplan-Eintrag nicht verändern, verschieben, ausblenden oder dessen gespeicherten Raum überschreiben. | NEU |
| SCHED-F-450 | Falls der Raumplan-Zwischenspeicher älter als die vorgesehene Aktualisierungsfrequenz ist, muss das System keinen Hinweis nach SCHED-F-420 oder SCHED-F-430 anzeigen und stattdessen das Alter des Raumplan-Stands ausweisen. | NEU |
| SCHED-F-460 | Das System muss über dem Plan eine Leiste aller darzustellenden Wochentage anzeigen und einen Wochentag jenseits von Montag bis Freitag genau dann aufnehmen, wenn an ihm mindestens ein Termin liegt. | Recherche: Rücksprache Studierender, 2026-09-04 |
| SCHED-F-470 | Das System muss in der Wochentagsleiste je Tag eine Vorschau der Belegung anzeigen, aus der ohne Tageswechsel hervorgeht, ob und wie viele Termine an diesem Tag liegen. | Recherche: Rücksprache Studierender, 2026-09-04 |
| SCHED-F-480 | Das System muss zu jedem dargestellten Wochentag das Kalenderdatum der angezeigten Woche ausweisen. | Recherche: Rücksprache Studierender, 2026-09-04 |
| SCHED-F-490 | Das System muss der Nutzerin das Blättern über Wochengrenzen hinweg sowie die Rückkehr zur laufenden Woche über einen sichtbaren Bedienweg ermöglichen. | Recherche: Rücksprache Studierender, 2026-09-04 |
| SCHED-F-500 | Das System muss einen offiziellen Termin nur in denjenigen Kalenderwochen anzeigen, die innerhalb seines aus INT-002 übernommenen Gültigkeitszeitraums liegen. | Recherche: FBWS live abgefragt, 2026-09-04 |
| SCHED-F-510 | Falls die angezeigte Woche außerhalb der Vorlesungszeit liegt, muss das System dies kenntlich machen, statt einen regulären Plan darzustellen. | Recherche: Rücksprache Studierender, 2026-09-04 |
| SCHED-F-520 | Das System muss die Termine eines Tages auf einer zur Uhrzeit proportionalen Achse darstellen, sodass Zeiträume ohne Termin als Lücke mit Angabe ihrer Dauer erkennbar sind. | Recherche: Rücksprache Studierender, 2026-09-04 |
| SCHED-F-530 | Das System muss der Nutzerin eine Einstellung bereitstellen, mit der die proportionale Zeitachse zugunsten einer kompakten Liste ohne Lückendarstellung abgeschaltet werden kann. | Recherche: Rücksprache Studierender, 2026-09-04 |
| SCHED-F-540 | Wenn sich Termine desselben Tages zeitlich überschneiden, muss das System sie nebeneinander darstellen, sodass jeder Termin einzeln erkenn- und auswählbar bleibt. | Recherche: Rücksprache Studierender, 2026-09-04 |
| SCHED-F-550 | Das System muss den gerade laufenden und den nächsten anstehenden Termin gemeinsam mit der verbleibenden Zeit in einer eigenen Anzeige über dem Plan ausweisen. | Recherche: Rücksprache Studierender, 2026-09-04 |
| SCHED-F-560 | Das System muss den gerade laufenden Termin zusätzlich im Plan selbst hervorheben und die aktuelle Uhrzeit auf der Zeitachse des heutigen Tages kennzeichnen. | Recherche: Rücksprache Studierender, 2026-09-04 |
| SCHED-F-570 | Das System muss jedem Termin des persönlichen Plans einen Status „fest" oder „vorgemerkt" zuordnen und dessen Wechsel über einen sichtbaren Bedienweg ermöglichen. | Recherche: Rücksprache Studierender, 2026-09-04 |
| SCHED-F-580 | Das System muss vorgemerkte Termine von festen Terminen zusätzlich zur Farbgebung durch Text oder Symbol unterscheidbar darstellen. | Recherche: Rücksprache Studierender, 2026-09-04 |
| SCHED-F-590 | Wenn sich ein vorgemerkter Termin zeitlich mit einem anderen Termin überschneidet, darf das System dafür keinen Konflikthinweis nach SCHED-F-230 erzeugen. | Recherche: Rücksprache Studierender, 2026-09-04 |
| SCHED-F-600 | Das System muss den Auswahlbestand nach Veranstaltung, darunter nach Veranstaltungsart und darunter nach Gruppen-Slot gegliedert darstellen, statt als flache Liste einzelner Termine. | Recherche: FBWS live abgefragt, 2026-09-04 |
| SCHED-F-610 | Das System muss der Nutzerin ermöglichen, einzelne Veranstaltungsarten einer Veranstaltung abzuwählen, ohne die Veranstaltung selbst abzuwählen. | Recherche: Rücksprache Studierender, 2026-09-04 |
| SCHED-F-620 | Das System muss der Nutzerin ermöglichen, mehrere Gruppen-Slots derselben Veranstaltung gleichzeitig in den Plan zu übernehmen. | Recherche: Rücksprache Studierender, 2026-09-04 |
| SCHED-F-630 | Das System muss eine Freitextsuche über den Auswahlbestand bereitstellen, die Bezeichnung, Modulnummer und lehrende Person berücksichtigt. | Recherche: Rücksprache Studierender, 2026-09-04 |
| SCHED-F-640 | Das System muss der Nutzerin ermöglichen, den Auswahlbestand um die Termine weiterer Fachsemester desselben Studiengangs zu erweitern und nach Fachsemester zu filtern. | Recherche: Rücksprache Studierender, 2026-09-04 |
| SCHED-F-650 | Während der Eingabe der Gruppenkennung muss das System zurückmelden, wie viele Termine des Auswahlbestands die Kennung einschließt. | Recherche: FBWS live abgefragt, 2026-09-04 |
| SCHED-F-660 | Das System muss jeder Veranstaltung beim Anlegen selbsttätig eine Farbe zuweisen, die für dieselbe Veranstaltung gleich bleibt und von der Nutzerin nach SCHED-F-247 überschrieben werden kann. | NEU |
| SCHED-F-670 | Das System muss als Kandidaten für den Planungsmodus jede Veranstaltung des Auswahlbestands zulassen, unabhängig davon, ob sie aus dem eigenen Fachsemester, einem weiteren Fachsemester (SCHED-F-640) oder der Wahlpflicht-Sammelkategorie (SCHED-F-400) stammt. | Recherche: Rücksprache Studierender, 2026-09-04 |
| SCHED-F-680 | Das System muss der Nutzerin ermöglichen, aus den Kandidaten der Planungsauswahl selbsttätig einen konfliktfreien Vorschlag nach dem gewählten Optimierungsmodus (SCHED-F-350) erzeugen zu lassen, den sie vor der Übernahme einsehen und einzeln ändern kann. | Recherche: Rücksprache Studierender, 2026-09-04 |
| SCHED-F-690 | Das System muss der Nutzerin anbieten, die Gruppenkennung anhand ihrer Matrikelnummer über INT-019 zu ermitteln, statt sie von Hand einzugeben. | Recherche: Rücksprache Studierender mit Beispielaufruf, 2026-09-04 |
| SCHED-F-700 | Wenn eine Gruppenkennung nach SCHED-F-690 ermittelt wurde, muss das System sie der Nutzerin zur Bestätigung anzeigen, bevor sie übernommen wird. | Recherche: FBWS live abgefragt, 2026-09-04 |
| SCHED-F-710 | Das System muss die Matrikelnummer ausschließlich auf dem Gerät speichern und sie an kein anderes Ziel als INT-019 übertragen. | NEU |
| SCHED-F-720 | Das System muss die Gruppenkennung auch ohne Angabe einer Matrikelnummer festlegbar machen und dabei den Buchstaben als maßgebliche Angabe führen, die Zahl als freiwillige Ergänzung. | Recherche: Rücksprache Studierender, 2026-09-04 |
| SCHED-F-730 | Das System muss beim Anlegen eines eigenen Eintrags die Wahl ermöglichen, ob er wöchentlich wiederkehrt oder einmalig an einem bestimmten Datum stattfindet. | Recherche: Rücksprache Studierender, 2026-09-04 |

### Erläuterungen

**`SCHED-F-070`** — Die Alt-App vergleicht an dieser Stelle fehlerhaft den Zahlenteil der Gruppenkennung (`info.groupNumber`) mit dem ersten Zeichen des `studentSet`-Werts (`schedule_overview_viewmodel.dart:216`, `info.groupNumber.codeUnitAt(0) == item.studentSet.codeUnitAt(0)`), obwohl ein Buchstabenvergleich (`groupLetter`) gemeint war. Dadurch schlägt der Abgleich bei Einzelwert-`studentSet` in der Alt-App praktisch immer fehl, sofern nicht zufällig Zahl- und Buchstabenzeichen denselben Codepoint teilen. Für die Neuentwicklung ist SCHED-F-070 das korrigierte Sollverhalten (Buchstabenvergleich), nicht das beobachtete Altverhalten — daher die Markierung `Alt: bewusst verworfen` statt eines Quellverweises.

**`SCHED-F-190` bis `SCHED-F-220`** — Aus der Rücksprache mit dem FSR FB4, 2026-08-25: Der Fachbereich veröffentlicht während der Vorlesungszeit einen offiziellen Prüfungsplan als Excel-Datei auf einer Intranet-Seite (siehe `platform/integrations.md` INT-013). Da diese Seite einen Hochschul-Login voraussetzt, den weder App noch Backend besitzen (siehe `product/vision.md` Nicht-Ziel 1, `platform/security-and-privacy.md` zum Verzicht auf Passwort-Replay), ist der Import zweistufig: Ein FSR-Mitglied/Admin lädt die Datei manuell herunter und in das eigene Backend hoch (`platform/backend-and-api.md` API-F-180, `platform/integrations.md` INT-013); danach wählen Studierende selbst die für sie relevanten Prüfungen aus dem importierten Bestand aus (SCHED-F-200). Nicht jede Prüfung des Fachbereichs interessiert jede Nutzerin — nur die eigenen und ggf. Nachholprüfungen.

**`SCHED-F-220`** — Verträgt sich mit API-F-100 (kein serverseitiges Speichern des persönlichen Stundenplans): Das Backend kennt nicht, welche Prüfungen eine einzelne Nutzerin ausgewählt hat, sondern löst bei jeder Aktualisierung des offiziellen Prüfungsplan-Bestands einen allgemeinen Hinweis aus (vergleichbar einer News-Meldung). Die App gleicht diesen Hinweis lokal gegen die eigene, ausschließlich gerätegespeicherte Auswahl ab und zeigt die Benachrichtigung nur, wenn tatsächlich ein ausgewählter Termin betroffen ist.

**Zweiwöchentliche Veranstaltungen (Hinweis aus derselben Rücksprache).** Manche Lehrveranstaltungen finden nur alle zwei Wochen statt. In der bislang dokumentierten INT-002-Antwortstruktur ist kein Feld erkennbar, das einen solchen Rhythmus trägt (nur INT-009 hat ein `interval`-Feld, dort bislang als „unklare Bedeutung, nicht weiter untersucht" geführt, siehe `platform/integrations.md`). Ob INT-002 wiederkehrende Termine bereits als separate wöchentliche Einträge liefert (dann unproblematisch) oder der Client die Information zur korrekten zweiwöchentlichen Darstellung fehlt, ist vor Umsetzung mit echten Beispieldaten zu verifizieren — siehe Abschnitt 13.

**`SCHED-F-170`/`SCHED-F-180`** — Aus der automatisierten WhatsApp-Chat-Auswertung (`product/whatsapp-feedback-inventory.md`, Abschnitt 4 „Themenübersicht"): Studis weichen teils auf ICS-Import in eine externe Kalender-App aus, wenn ihnen die App-eigene Ansicht nicht reicht; mehrfach dokumentierte Verwirrung entsteht, wenn sich die Gruppenkennung mit dem Semesterwechsel ändert, die App aber weiter den alten Stand zeigt.

**`SCHED-F-170`/`SCHED-F-175`/`SCHED-F-240` (Export-Ausgestaltung, entschieden).** Rücksprache FSR FB4, 2026-08-25: Studis sollen den in der App zusammengestellten Stundenplan in ein Kalenderprogramm ihrer Wahl integrieren können. Abgewogen wurden ein einmaliger Datei-Export (kein Server-Zugriff nötig, bleibt aber nicht automatisch aktuell) gegenüber einem abonnierbaren Kalender-Link (bleibt synchron, bräuchte aber einen serverseitigen Endpunkt und damit eine Ausnahme von API-F-100). Der abonnierbare Link bleibt ausgeschlossen, API-F-100 gilt ohne Ausnahme.

**Ergänzung vom selben Tag, nach Auswertung des Android-Quellcodes:** Die Android-Alt-App schreibt Termine unmittelbar in einen von der Nutzerin gewählten Gerätekalender, mit Auswahl des Zielkalenders und eines Zeitraums (`dialog/CalendarExportDialog.java`). Das ist bequemer als ein Datei-Export, den die Nutzerin anschließend selbst importieren muss, und damit der zu übertreffende Stand. Entscheidung FSR FB4, 2026-08-25: Beides wird angeboten — der Schreibzugriff als Hauptweg (SCHED-F-175), der Datei-Export als Rückfallweg für den Fall verweigerter Berechtigung oder eines Kalenders außerhalb des Geräts (SCHED-F-177). Die dafür nötige Kalenderberechtigung ist ausschließlich schreibend und wird erst bei tatsächlicher Nutzung angefragt; die zuvor gegenteilige Festlegung in `platform/security-and-privacy.md` Abschnitt 9 wurde entsprechend korrigiert. Konfigurierbar ist in beiden Wegen die Auswahl der enthaltenen Terminarten (SCHED-F-240).

**`SCHED-F-176` — Vorbelegter Zeitraum.** Die Android-Alt-App belegt die Von-/Bis-Felder des Kalenderexport-Dialogs mit den ferngepflegten Semesterterminen vor (`dialog/CalendarExportDialog.java:204,215`, Werte aus `service/DataService.java`; dieselbe Ressource „Semestertermine" wie in `platform/backend-and-api.md` API-F-230). Die Felder bleiben danach frei änderbar — die Vorbelegung erspart nur die in aller Regel gewünschte manuelle Eingabe des laufenden Semesters.

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
| M3 | A-P | ja | Bereich ohne Zahlen an beiden Grenzen; beide Grenzen offen, Buchstabe M liegt zwischen A und P (SCHED-F-080/090). Real vorkommende Form, siehe Befund unten. |
| M3 | M-N | ja | Bereich ohne Zahlen, Buchstabe M entspricht der Anfangsgrenze (SCHED-F-080/090). |
| M3 | C-D | nein | Buchstabe M liegt außerhalb von C bis D (SCHED-F-080). |
| M3 | A | nein | Einzelwert ohne Zahl; Buchstabenteil A weicht von M ab (SCHED-F-070). |
| D2 | D | ja | Einzelwert ohne Zahl; Buchstabenteil stimmt überein (SCHED-F-070). |
| D2 | C5-E | ja | Anfangsgrenze (C,5), Endgrenze (E, offen); Paar (D,2) liegt dazwischen (SCHED-F-080/090). |
| C4 | C5-E | nein | Buchstabe gleich der Anfangsgrenze, Zahl 4 kleiner als 5 (SCHED-F-080). |
| M5 | J-M4 | nein | Buchstabe gleich der Endgrenze M, Zahl 5 größer als 4 (SCHED-F-080). |
| H3 | H5-J | nein | Buchstabe gleich der Anfangsgrenze H, Zahl 3 kleiner als 5 (SCHED-F-080). |

Die Spalte „zugehörig" beantwortet die Frage, ob ein Termin als zur eigenen Gruppe gehörend gilt. Sie entscheidet nicht über die Sichtbarkeit: Gruppenfremde Termine bleiben nach SCHED-F-140 sichtbar und werden gekennzeichnet; ausgeblendet werden sie nur, wenn die Nutzerin den Schalter aus SCHED-F-145 aktiviert.

**Befund zu den real vorkommenden `studentSet`-Formen (FBWS live abgefragt, 2026-09-04).** Der Bestand von `INPBPI/2` führt 21 verschiedene Werte: `A-P`, `M-N`, `I-J`, `K-L`, `O-P`, `E-F`, `C-D`, `A-B`, `G-H`, `G-I`, `K-M`, `N-P`, `C5-E`, `M5-P`, `J-M4`, `H5-J`, `F-H4`, `A`, `B`, `C`, `D`. Daraus folgen drei Dinge, die die bisherige Beispieltabelle nicht abbildete: Bereiche ohne Zahlen an **beiden** Grenzen sind der Normalfall, Einzelwerte bestehen aus einem Buchstaben **ohne** Zahl, und gemischte Grenzen (`C5-E`, `J-M4`) kommen vor. Die in SCHED-F-060 beschriebene Wildcard `*` trat im gesamten geprüften Bestand **nicht** auf — die Anforderung bleibt dennoch bestehen, weil `integrations.md` den Abrufparameter `studentSet=*` führt und ein späteres Auftreten nicht ausgeschlossen ist. Die Logik aus SCHED-F-070 bis SCHED-F-090 trägt alle beobachteten Formen unverändert; ergänzt wurden nur die Prüffälle.

**Geklärt am 2026-09-04:** Die Frage, was eine Studierende als Gruppenkennung eintragen soll, ist beantwortet. Der Fachbereich hält die Zuteilung selbst vor und gibt sie zu einer Matrikelnummer heraus (INT-019) — daraus folgt SCHED-F-690. In der Praxis ist dabei **der Buchstabe die maßgebliche Angabe; die Zahl wird so gut wie nie gebraucht** (Auskunft einer studierenden Person). Das deckt sich mit dem Datenbestand: Einzelwerte tragen gar keine Zahl, und nur an Bereichsgrenzen wie `C5-E` oder `J-M4` entscheidet sie überhaupt mit. SCHED-F-040 ist entsprechend auf `^[A-Z][0-9]*$` erweitert, SCHED-F-720 hält den manuellen Weg offen, und SCHED-F-650 gibt bei der Eingabe unmittelbar Rückmeldung.

**Wildcard-Befund aus der Android-Alt-App.** Deren Gruppenabgleich (`util/GroupLetterUtil.java`) behandelt den Wert `*` nicht gesondert: Er trifft die Bedingung für Einzelwerte nur, wenn die Gruppenkennung selbst mit `*` beginnt, und fällt andernfalls auf „nicht zugehörig" durch. Ein Termin, der ausdrücklich für alle Gruppen gilt, würde damit bei gesetzter Gruppenkennung als gruppenfremd markiert — das Gegenteil des Gemeinten. SCHED-F-060 legt das korrekte Verhalten fest; die Herkunftsmarkierung bleibt `NEU`, weil keine der beiden Alt-Apps ein Vorbild dafür liefert. Geführt als N-007 in `../../product/legacy-inventory.md`.

**`SCHED-F-250`/`SCHED-F-260` — Gruppenwechsel als beobachtetes Verhalten.** Aus der Chat-Auswertung (u. a. `pi-8-semester-fh-informatik`, 2022-12-14 und 2023-01-09; `praktische-informatik-ws-23-24`, 2023-09-21): Studierende weichen bereits informell auf andere Gruppen aus — bei eigener Krankheit, verpasstem Termin oder auf ausdrücklichen Wunsch („Will wer Gruppen wechseln?"). Ein Beleg aus `informatik-pi-ti-ds-ws-24-25` (2024-09-30) zeigt den bestehenden Workaround: Studierende tragen den Termin einer fremden Gruppe manuell als eigenen, nicht-offiziellen Termin ein (SCHED-F-110), um eine freie Lücke im eigenen Plan zu füllen. Da INT-002 mit `studentSet=*` ohnehin bereits alle Gruppentermine liefert (siehe `platform/integrations.md` INT-002) und clientseitig lediglich auf die eigene Gruppenkennung gefiltert wird (SCHED-F-140), ist dafür keine zusätzliche Integration nötig — SCHED-F-250/260 machen diesen bereits gelebten Workaround zu einem regulären, als offiziell erkennbaren Bedienweg, statt ihn über eine Nachbildung als „eigener Termin" laufen zu lassen. Ein weiterer Beleg (`fh-informatik-22-23`, 2022-12-14) nennt ausdrücklich das Risiko, dass insbesondere Termine gegen Wochenende hin „meistens sehr voll" sind — die App selbst kann diese Auslastung nicht anzeigen (INT-002 liefert keine Kapazitätsfelder, siehe Nicht-Scope), das Risiko bleibt daher der Nutzerin überlassen.

**`SCHED-F-270` bis `SCHED-F-320` — Wahlpflicht-Planungsmodus.** Die Chat-Auswertung zeigt durchgängig, dass die Terminfindung für Wahlpflichtmodule eigenständig schwierig ist: Studierende fragen wiederholt nach Modullisten, Empfehlungen für „einfache" Module und danach, wann ein Modul angeboten wird (`pi-8-semester-fh-informatik`, u. a. 2024-01-30, 2024-09-01, 2025-09-23, 2026-04-11; `praktische-informatik-ws-23-24`, u. a. 2025-09-15, 2025-09-19). Ein konkreter Beleg (`pi-8-semester-fh-informatik`, 2025-04-03) zeigt eine bestehende Lücke im Alt-App-Stundenplan selbst: Termine eines Wahlpflichtmoduls fehlten dort vollständig („auch die für Donnerstag stehen dort nicht (also im Wahlpflichtfach Stundenplan)"). Ursache ist vermutlich, dass INT-002 pro `{sname}/{grade}`-Paar abgefragt wird (siehe `platform/integrations.md` INT-002) und Wahlpflichtmodule organisatorisch oft einem anderen Fachsemester zugeordnet sind als dem der Nutzerin — SCHED-F-270 löst das, indem die Nutzerin gezielt ein zusätzliches Fachsemester abrufen kann. Ein weiterer Beleg (`informatik-pi-ti-ds-ws-24-25`, 2025-02-28) zeigt denselben Bedarf bei Wiederholerinnen: Um ihren Stundenplan zu planen, mussten sie erst selbst herausfinden, wann und wo eine zu wiederholende Veranstaltung stattfindet. SCHED-F-290/300 stellen sicher, dass eine fehlende konfliktfreie Option sichtbar gemeldet wird, statt wie im Beleg unbemerkt zu bleiben; SCHED-F-310 deckt den ebenfalls in der Einleitung dieser Spec beschriebenen Fall ab, dass Studierende eine Kollision bewusst in Kauf nehmen und die Veranstaltung nacharbeiten.

**`SCHED-F-270` (entfallen) / `SCHED-F-400` — automatische Wahlpflicht-Liste statt manueller Fachsemester-Auswahl.** Die vorige Fassung ging davon aus, eine automatische Zuordnung „Wahlpflichtmodul → zuständiges Fachsemester" würde eine zusätzliche, gepflegte Datengrundlage voraussetzen, für die keine Evidenz vorlag — die Chat-Belege zeigten nur, dass Studierende diese Zuordnung selbst über Modulhandbuch bzw. Curricula-PDF nachschlagen (`pi-8-semester-fh-informatik`, 2024-01-30: `modulhandbuch.php`; `praktische-informatik-ws-23-24`, 2025-09-15: `Curricula.pdf`). Die Live-Prüfung vom 2026-08-26 widerlegt diese Annahme: `platform/integrations.md` INT-002 dokumentiert mit `WFPB` eine vom Fachbereich selbst über FBWS gepflegte Sammelkategorie, die alle aktuell angebotenen Wahlpflichtmodule direkt liefert (27 Module zum Prüfzeitpunkt), inklusive der zulässigen Studiengänge/Vertiefungsrichtungen im Klartext. Entscheidung FSR FB4, 2026-08-26: SCHED-F-270 entfällt, ersetzt durch SCHED-F-400 — die App ruft `WFPB` automatisch ab, keine manuelle Fachsemester-Eingabe mehr nötig. Unverifiziert bleibt die Abdeckung für Master-Wahlpflichtfächer, siehe Abschnitt 13.

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

**`SCHED-F-410` bis `SCHED-F-450` — Raumplan-Abgleich.** Der Fachbereich pflegt Termine im FBWS an zwei Stellen, die dieselben Veranstaltungen aus unterschiedlicher Richtung zeigen: der studiengangsbezogene Terminplan (INT-002), aus dem der Stundenplan entsteht, und der raumbezogene Raumplan (INT-009), den das Backend alle paar Minuten neu abruft (`platform/backend-and-api.md` API-F-045). Die App speichert den einmal angelegten Stundenplan lokal und aktualisiert ihn nicht von selbst — ein zwischenzeitlicher Raumwechsel im FBWS bleibt der Nutzerin daher verborgen. SCHED-F-410 schließt diese Lücke, indem es den lokal gespeicherten Termin gegen den frischen Raumplan hält. Der Abgleich läuft vollständig auf dem Gerät; das Backend liefert nur die Raumplan-Termine (`platform/backend-and-api.md` API-F-056), der Stundenplan verlässt das Gerät nicht (`platform/backend-and-api.md` API-F-100).

**Korrektur vom 2026-09-04 (FBWS live abgefragt).** Die vorige Fassung hielt fest, INT-002 und INT-009 teilten keine gemeinsame Veranstaltungskennung, und baute die Zuordnung deshalb allein auf den Merkmalssatz Bezeichnung + Wochentag + Beginnzeit + `studentSet`. Das ist widerlegt: **beide** Bestände führen `courseId` — in INT-002 als offizielle Modulnummer (z. B. `42012` für „Algorithmen und Datenstrukturen", identisch mit der Modul-Nr. im Curricula-Bestand des Fachbereichs), in INT-009 bei allen Einträgen mit `eventType: "Course"`. SCHED-F-410 nutzt daher `courseId` als vorrangigen Schlüssel; der Merkmalssatz bleibt als Rückfall für Einträge ohne `courseId` (in INT-009 die Einzelbuchungen mit `eventType: "Event"`). Damit entfällt der größte Teil des Mehrdeutigkeitsrisikos; die verbleibende Trennschärfe ist vor Umsetzung an echten Daten zu prüfen (Abschnitt 13).

SCHED-F-420 fordert bewusst „unter keiner der geführten Raumkennungen": Eine Veranstaltung, die regulär parallel in zwei Räumen läuft (belegt für „Lern- und Arbeitstechniken", siehe Abschnitt 13 und `platform/integrations.md` INT-002), darf keinen Fehlalarm auslösen, wenn der eigene gespeicherte Raum einer der beiden ist.

Der Hinweis ist bewusst schwach: Er ändert den Eintrag nicht (SCHED-F-445), verschwindet bei veraltetem Raumplan (SCHED-F-450) und nennt „FB-Aktuelles" als die Stelle, an der eine Raumänderung verbindlich steht (SCHED-F-440). Ob INT-009 kurzfristige Änderungen überhaupt trägt, ist offen — dieselbe Frage wie in `../room-finder/spec.md` Abschnitt 13.

**`SCHED-F-570` bis `SCHED-F-590` — „fest" und „vorgemerkt".** Aus der Rücksprache mit einer studierenden Person, 2026-09-04: Studierende tragen sich bewusst zwei Veranstaltungen zur selben Uhrzeit ein — um vor Ort zu entscheiden, welche der beiden Gruppen weniger voll ist; um sich einen Termin zu merken, den sie nur gelegentlich brauchen; oder um bei einer echten Kollision beide der Vollständigkeit halber im Blick zu behalten. Die vorige Fassung von SCHED-F-230 hätte dafür eine Dauerwarnung erzeugt. Der Status trennt beides: „fest" ist der Termin, zu dem die Person tatsächlich geht, „vorgemerkt" der bewusst geparkte. Nur feste Termine werden gegeneinander auf Konflikte geprüft (SCHED-F-230, SCHED-F-290, SCHED-F-590). Der Status ersetzt nicht `akzeptierterKonflikt` aus SCHED-F-310: dort geht die Person bewusst zu beiden kollidierenden Terminen, hier hält sie sich eine Entscheidung offen.

**`SCHED-F-460` bis `SCHED-F-510` — Wochentagsleiste und Datumsbezug.** Beide Alt-Apps kennen nur Wochentage ohne Datum; der Plan sieht in jeder Woche des Jahres gleich aus. Entscheidung nach Rücksprache, 2026-09-04: echte Kalenderwochen. Das ist ohne zusätzliche Integration möglich, weil INT-002 je Termin `dateBegin`/`dateEnd` liefert (Live-Prüfung 2026-09-04, siehe `platform/integrations.md`) — daraus folgt SCHED-F-500, das Veranstaltungen mit begrenztem Zeitraum nur in den zutreffenden Wochen zeigt. Für SCHED-F-510 genügen zunächst Semesterbeginn und -ende aus den Stammdaten (API-F-230); vorlesungsfreie Einzeltage und Feiertage liefert derzeit keine Quelle, siehe Abschnitt 13. SCHED-F-460 verlangt eine Leiste statt eines Blätterwegs, weil der Blick darauf die Frage „was liegt die restliche Woche an" schon beantworten soll — verstärkt durch die Belegungsvorschau aus SCHED-F-470. Samstage sind aufgenommen, obwohl der geprüfte FBWS-Bestand keine führt: eigene Termine (SCHED-F-110) sind an jedem Wochentag anlegbar.

**`SCHED-F-520` bis `SCHED-F-560` — Zeitachse und „Jetzt".** Die proportionale Achse macht Freistunden und Überschneidungen sichtbar, die eine reine Liste nur über die Uhrzeiten preisgibt; sie trägt damit SCHED-F-230 und den Planungsmodus mit. Auf ausdrücklichen Wunsch bleibt sie abschaltbar (SCHED-F-530), weil eine kompakte Liste mehr Termine je Bildschirm zeigt. SCHED-F-550/560 beantworten die Frage „was kommt als Nächstes" ohne Suchen im Plan; eine Bewegung in dieser Anzeige unterliegt UX-N-030 (Bewegung reduzieren) und entfällt bei entsprechender Systemeinstellung.

**`SCHED-F-600` bis `SCHED-F-660` — kursbasierte Auswahl.** Die Live-Prüfung vom 2026-09-04 ergab 121 Termine für ein einzelnes Fachsemester (`INPBPI/2`) und 161 für die Wahlpflicht-Sammelkategorie. Eine flache Auswahlliste einzelner Termine, wie sie beide Alt-Apps und die vorige Fassung von SCHED-F-245 vorsehen, ist in dieser Größenordnung nicht bedienbar. Die dreistufige Gliederung Veranstaltung → Veranstaltungsart → Gruppen-Slot bildet zugleich ab, wie Studierende denken („ich belege Softwaretechnik 1"), und deckt drei bisher getrennte Anforderungen in einem Bedienweg ab: die Auswahl selbst (SCHED-F-245), die Einsicht in Termine anderer Gruppen (SCHED-F-250) und deren Übernahme (SCHED-F-260). SCHED-F-610 trägt den Fall, dass eine Person Praktikum oder Übung einer Veranstaltung bewusst auslässt; SCHED-F-620 den Fall zweier gleichzeitig geführter Gruppen-Slots (siehe SCHED-F-570). SCHED-F-640 ersetzt in der Sache das entfallene SCHED-F-270: die Wahlpflicht-Zuordnung leistet zwar `WFPB` (SCHED-F-400), das Problem der Wiederholerinnen und Vorzieherinnen — eine Veranstaltung aus einem anderen Fachsemester im eigenen Plan — bleibt davon jedoch unberührt. Die Streichung von SCHED-F-270 am 2026-08-26 war insoweit zu weitgehend; SCHED-F-270 bleibt entfallen, SCHED-F-640 tritt an seine Stelle. SCHED-F-660 vergibt Farben selbsttätig, damit ein frisch angelegter Plan ohne Handarbeit lesbar ist; die Textfarbe folgt daraus nach UX-F-040 und UX-N-010.

**`SCHED-F-690` bis `SCHED-F-720` — Gruppenkennung ohne Ratespiel.** Bis zum 2026-09-04 war ungeklärt, was eine Studierende überhaupt als Gruppenkennung eintragen soll; die Werte im FBWS-Bestand legten eine Zuordnung nach Nachnamen nahe, der Zahlenteil blieb unerklärt. Der Hinweis einer studierenden Person vom selben Tag löst das auf zwei Wegen auf. Erstens gibt es einen Endpunkt, der die Kennung zu einer Matrikelnummer direkt liefert (INT-019) — daraus folgt SCHED-F-690, der bequemste Weg. Zweitens gilt in der Praxis: **der Buchstabe ist die maßgebliche Angabe, die Zahl wird so gut wie nie gebraucht.** Deshalb ist SCHED-F-040 von `^[A-Z][0-9]+$` auf `^[A-Z][0-9]*$` erweitert — die Zahl ist freiwillig. Das erweitert nur, was zulässig ist: jede bisher gültige Eingabe bleibt gültig, `C8` also unverändert. Es passt außerdem zum beobachteten Datenbestand, in dem Einzelwerte durchweg aus einem Buchstaben ohne Zahl bestehen (`A`, `B`, `C`, `D`) und die Zahl nur an Bereichsgrenzen überhaupt eine Rolle spielt (`C5-E`, `J-M4`).

SCHED-F-700 ist keine Höflichkeit, sondern eine Notwendigkeit: INT-019 beantwortet auch offensichtlich ungültige Nummern mit einer plausibel aussehenden Kennung (belegt für `0000000` → `B3` und `9999999` → `A9`) und meldet eine unbekannte Nummer nicht als Fehler, sondern mit Status 200 in einer von zwei stillen Gestalten — `{"fhDoStudentSet":false}` oder `[]`. Eine erfolgreiche Antwort belegt damit nicht, dass die eingegebene Nummer die eigene ist; eine stillschweigende Übernahme würde einen Tippfehler in einen wochenlang falschen Stundenplan verwandeln. Die Auswertung prüft auf eine nicht-leere Zeichenkette, nicht auf Vorhandensein des Feldes — `false` ist ebenso falsy wie `undefined`, aber nur eine Zeichenkette ist eine Kennung. SCHED-F-710 zieht die datenschutzrechtliche Grenze: Die Matrikelnummer ist personenbeziehbar, sie bleibt auf dem Gerät und geht an keinen anderen Empfänger — insbesondere nicht an das eigene Backend, im Einklang mit API-F-100 und `platform/security-and-privacy.md`.

**`SCHED-F-730` — eigener Eintrag: wiederkehrend oder einmalig.** Die Alt-Apps kennen nur wochentagsgebundene Einträge ohne Datum; ein eigener Eintrag war dort zwangsläufig „jede Woche". Mit dem Datumsbezug aus SCHED-F-480 bis SCHED-F-510 entsteht eine Lücke, die vorher nicht existierte: Eine Lerngruppe jeden Dienstag und ein einmaliger Beratungstermin am 17. Oktober sind zwei verschiedene Dinge, die bisher gleich behandelt würden. SCHED-F-730 schließt sie. Bei wiederkehrenden Einträgen wirkt der Gültigkeitszeitraum aus Abschnitt 5 wie bei offiziellen Terminen; bei einmaligen fallen Beginn und Ende des Zeitraums auf dasselbe Datum.

**`SCHED-F-670`/`SCHED-F-680` — Verallgemeinerung des Planungsmodus.** Der Planungsmodus war bis zur Fassung 2.1.0 auf Wahlpflichtmodule zugeschnitten. Aus der Rücksprache vom 2026-09-04: die Terminkollision einer Wiederholerin zwischen zwei Fachsemestern ist dasselbe Problem wie die Kollision eines Wahlpflichtmoduls — es gibt keinen sachlichen Grund, die Kollisionsprüfung, das Zeitfenster und die Optimierungsmodi nur der einen Gruppe anzubieten. SCHED-F-280, F-290, F-370, F-380 und F-390 sprechen deshalb von „Kandidat" statt „Wahlpflichtmodul". SCHED-F-680 zieht daraus die Folgerung für den gesamten Plan: statt Kandidat für Kandidat einzeln zu entscheiden, kann die Nutzerin einen Vorschlag erzeugen lassen. Er bleibt ein Vorschlag — sie sieht ihn vor der Übernahme und ändert ihn einzeln; die in Abschnitt 2 begründete Zurückstellung der Vollkombinatorik über mehrere unentschiedene Kandidaten bleibt davon unberührt.

## 5. Datenmodell

Jeder Termin des persönlichen Plans, offiziell wie eigen, trägt zusätzlich `status: fest | vorgemerkt` (SCHED-F-570), eine Farbe (SCHED-F-247/660) und einen Gültigkeitszeitraum `gueltigVon`/`gueltigBis` (SCHED-F-500; bei eigenen Terminen offen, sofern nicht angegeben).

Termin (offiziell): siehe INT-002-Felder in `platform/integrations.md`, ergänzt um Kennzeichnung `istOffiziell: true`, `gruppenzugehoerig: boolean` (Ergebnis von SCHED-F-060 bis SCHED-F-090), `abweichendeGruppe: boolean` (SCHED-F-260, Termin einer anderen Gruppe übernommen statt des eigenen), `ausWahlpflicht: boolean` (SCHED-F-400, aus der Wahlpflicht-Sammelkategorie statt aus dem eigenen Fachsemester übernommen), `ausFremdemFachsemester: boolean` (SCHED-F-640) und `akzeptierterKonflikt: boolean` (SCHED-F-310).

Termin (eigen): Titel, Wochentag, Beginnzeit, Endzeit, `istOffiziell: false`, `istPruefung: boolean` (SCHED-F-190) sowie `wiederkehrend: boolean` (SCHED-F-730; bei `false` fallen `gueltigVon` und `gueltigBis` auf dasselbe Datum). Kein Bezug zu INT-002-Feldern wie `courseType`, `lecturerName`, `studentSet`.

Matrikelnummer (lokal, freiwillig): ausschließlich gerätegespeichert und ausschließlich für den Abruf nach INT-019 verwendet (SCHED-F-710). Kein serverseitiges Pendant; die Einrichtung ist auch ohne sie abschließbar (SCHED-F-720).

Auswahlbestand (flüchtig, nicht persistiert): die aus INT-002 abgerufenen Termine des eigenen Fachsemesters, der zusätzlich gewählten Fachsemester (SCHED-F-640) und der Wahlpflicht-Sammelkategorie (SCHED-F-400), verdichtet zu Veranstaltung → Veranstaltungsart → Gruppen-Slot (SCHED-F-600). Persistiert wird nur, was die Nutzerin daraus übernimmt.

Ansichtseinstellungen (lokal): Zeitachse oder kompakte Liste (SCHED-F-530), gruppenfremde Termine ausblenden (SCHED-F-145), Sprung zum aktuellen Wochentag (SCHED-F-150).

Prüfungsauswahl (lokal): Referenz auf einen Eintrag des vom Backend importierten Prüfungsplans (INT-013), rein gerätegespeichert (siehe Erläuterung zu SCHED-F-220) — kein serverseitiges Pendant.

Wahlpflicht-Planungsauswahl (lokal): eine Liste gewählter Wahlpflichtmodule aus der automatisch bezogenen Liste (SCHED-F-400/280/370), je Eintrag ein `pflicht: boolean`-Flag (SCHED-F-380) sowie der übernommene bzw. vorgeschlagene Termin samt Konfliktstatus und `innerhalbZeitfenster: boolean` (SCHED-F-290/310/340), rein gerätegespeichert — kein serverseitiges Pendant, gleiche Begründung wie bei der Prüfungsauswahl (Erläuterung zu SCHED-F-220, API-F-100). Planungsmodus-Einstellungen (lokal): Zeitfenster (früheste Beginnzeit, späteste Endzeit, SCHED-F-330) und gewählter Optimierungsmodus (SCHED-F-350), ebenfalls rein gerätegespeichert.

Gemeinsame Persistenz aller vier Datenarten: `platform/data-and-storage.md`, DATA-F-010.

Raumplan-Abgleich (lokal, berechnet, SCHED-F-410): je offiziellem Termin ein Status `übereinstimmend` | `raumabweichung` (mit abweichender Raumkennung) | `nicht_zugeordnet`, hergeleitet aus dem Vergleich mit den zwischengespeicherten Raumplan-Terminen. Rein geräteseitig, kein serverseitiges Pendant; keine Persistenz über den aktuellen Raumplan-Stand hinaus nötig.

## 6. Externe Schnittstellen

Nutzt INT-001 (FBWS Studiengänge) für die Studiengangs-/Semesterauswahl, INT-019 (FBWS Gruppenkennung zur Matrikelnummer) für die Ermittlung der Gruppenkennung nach SCHED-F-690, INT-002 (FBWS Termine) für den Terminabruf und den vom Backend (INT-008) importierten Prüfungsplan (INT-013) für die Prüfungsauswahl. Für den Planungsmodus (SCHED-F-400) ruft die App INT-002 zusätzlich für die FBWS-Sammelkategorie der Wahlpflichtmodule ab — technisch derselbe Endpunkt, keine neue Integration. Für den Raumplan-Abgleich (SCHED-F-410) ruft die App zusätzlich die zwischengespeicherten Raumplan-Termine über das Backend ab (INT-008, `platform/api-contract.yaml` `/raumplan/termine`, API-F-056); die Rohquelle ist INT-009, kein direkter FBWS-Aufruf aus der App. Keine weiteren Endpunktdetails hier — siehe `platform/integrations.md` und `platform/api-contract.yaml`.

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
| Raumabweichung für einen Termin erkannt (SCHED-F-420) | Kleiner Hinweis am Eintrag mit der abweichenden Raumkennung, Eintrag sonst unverändert |
| Termin im Raumplan nicht auffindbar (SCHED-F-430) | Kleiner Hinweis „im Raumplan nicht gefunden — evtl. Ausfall oder Verlegung", Eintrag unverändert |
| Raumplan-Stand veraltet oder nicht abrufbar | Kein Abweichungshinweis; falls veraltet, Alter des Raumplan-Stands sichtbar (SCHED-F-450) |
| Angezeigte Woche außerhalb der Vorlesungszeit (SCHED-F-510) | Woche als vorlesungsfrei gekennzeichnet, Plan nicht als regulär dargestellt; Rückweg zur laufenden Woche angeboten (SCHED-F-490) |
| Wochentag ohne Termine, ohne aktive Gruppenfilterung | Tag als frei gekennzeichnet — abzugrenzen vom Fall SCHED-F-100, der die Gruppenfilterung als Grund nennt |
| Zwei feste Termine überschneiden sich (SCHED-F-230) | Beide nebeneinander dargestellt (SCHED-F-540), beide mit Konflikthinweis; kein Termin wird verschoben oder ausgeblendet |
| Fester und vorgemerkter Termin überschneiden sich | Beide nebeneinander dargestellt, kein Konflikthinweis (SCHED-F-590) |
| Kursauswahl: Suche oder Filter ohne Treffer (SCHED-F-630/640) | Leerzustand mit Nennung des wirksamen Filters und einem Weg, ihn zurückzunehmen (UX-F-110) |
| Gruppenkennung schließt keinen einzigen Termin ein (SCHED-F-650) | Rückmeldung „0 von N Terminen" unmittelbar bei der Eingabe, Eingabe wird nicht verworfen |
| INT-019 antwortet ohne Kennung — leere Liste `[]` **oder** `{"fhDoStudentSet":false}` | Beide gleich behandeln: Hinweis „zu dieser Matrikelnummer ist keine Gruppe hinterlegt", Eingabe bleibt stehen, manuelle Angabe (SCHED-F-720) wird angeboten |
| INT-019 nicht erreichbar | Hinweis mit Wiederholen-Option; manuelle Angabe bleibt jederzeit möglich, die Einrichtung ist dadurch nicht blockiert |
| Nach SCHED-F-690 ermittelte Kennung wird von der Nutzerin abgelehnt | Kennung wird nicht übernommen, Eingabefeld für die manuelle Angabe erhält den Fokus |

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
| Raumplan-Termine nicht abrufbar | Stundenplan normal anzeigen, keinen Abgleichhinweis zeigen, kein Fehler in der Stundenplanansicht |
| Mehrere Raumplan-Termine passen mehrdeutig auf denselben Stundenplan-Termin | Keinen Abweichungshinweis erzeugen (sicherer Rückfall), Vorfall protokollieren (SEC-F-060) |

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
- Ein offizieller Termin, dessen Raum im aktuellen Raumplan abweicht, trägt im Stundenplan einen Hinweis mit der abweichenden Raumkennung, ohne dass der Eintrag selbst verändert wird (SCHED-F-420/F-445).
- Ein offizieller Termin, der im Raumplan nicht auffindbar ist, trägt einen Hinweis auf möglichen Ausfall oder Verlegung (SCHED-F-430).
- Eine regulär in zwei Räumen parallel angebotene Veranstaltung löst keinen Abweichungshinweis aus, solange der gespeicherte Raum einer der beiden ist (SCHED-F-420).
- Bei veraltetem Raumplan-Stand erscheint kein Abweichungshinweis, sondern das Alter des Stands (SCHED-F-450).
- Die Wochentagsleiste zeigt Montag bis Freitag; ein Samstag erscheint genau dann, wenn an ihm ein Termin liegt, und verschwindet, sobald der letzte entfernt ist (SCHED-F-460).
- Jeder Wochentag trägt das Datum der angezeigten Woche; ein Blättern in die Vorwoche und zurück führt zum selben Stand (SCHED-F-480/490).
- Eine Veranstaltung, deren Gültigkeitszeitraum in der Wochenmitte endet, erscheint in der letzten zutreffenden Woche und in der darauffolgenden nicht mehr (SCHED-F-500).
- Zwei sich überschneidende Termine sind beide sichtbar, einzeln antippbar und werden nicht übereinander gezeichnet (SCHED-F-540).
- Ein Termin mit Status „vorgemerkt" ist ohne Farbwahrnehmung als solcher erkennbar und erzeugt keinen Konflikthinweis; nach dem Wechsel auf „fest" erscheint der Hinweis (SCHED-F-570/580/590).
- Wird die proportionale Zeitachse abgeschaltet, verschwinden die Lückenangaben, die Terminfolge und ihre Reihenfolge bleiben unverändert (SCHED-F-530).
- In der Kursauswahl lässt sich eine einzelne Veranstaltungsart abwählen, ohne die übrigen Arten derselben Veranstaltung zu verlieren (SCHED-F-610).
- Zwei Gruppen-Slots derselben Veranstaltung lassen sich gemeinsam in den Plan übernehmen (SCHED-F-620).
- Die Freitextsuche findet eine Veranstaltung sowohl über einen Teil ihrer Bezeichnung als auch über ihre Modulnummer (SCHED-F-630).
- Nach dem Hinzufügen eines weiteren Fachsemesters enthält die Kursauswahl dessen Veranstaltungen und lässt sich nach Fachsemester eingrenzen (SCHED-F-640).
- Die Eingabe einer Gruppenkennung meldet unmittelbar die Zahl der eingeschlossenen Termine, auch wenn diese null ist (SCHED-F-650).
- Ein frisch angelegter Plan ist ohne manuelle Farbwahl farblich unterscheidbar, und dieselbe Veranstaltung trägt nach erneutem Anlegen dieselbe Farbe (SCHED-F-660).
- Der erzeugte Gesamtvorschlag ist vor der Übernahme einsehbar und einzeln änderbar; ohne Bestätigung ändert sich der Plan nicht (SCHED-F-680).
- Die Eingabe der Matrikelnummer führt zu einer angezeigten, noch nicht übernommenen Gruppenkennung; erst die Bestätigung übernimmt sie (SCHED-F-690/F-700).
- Eine unbekannte Matrikelnummer führt zu einem verständlichen Hinweis, nicht zu einer stillschweigend leeren Kennung (SCHED-F-700).
- Die Einrichtung lässt sich vollständig ohne Angabe einer Matrikelnummer abschließen, und eine Gruppenkennung aus nur einem Buchstaben wird angenommen (SCHED-F-720, SCHED-F-040).
- Die Matrikelnummer erscheint in keiner Anfrage an das eigene Backend (SCHED-F-710).
- Ein eigener Eintrag lässt sich als wöchentlich wiederkehrend anlegen und erscheint dann in jeder Woche des Zeitraums; ein einmaliger Eintrag erscheint nur in der Woche seines Datums (SCHED-F-730).

## 12. Bewusst nicht übernommenes Altverhalten

- Fehlerhafter Gruppenabgleich bei Einzelwert-`studentSet` (Zahl-statt-Buchstabe-Vergleich) — Grund: Vergleich schlägt praktisch immer fehl, siehe Erläuterung zu SCHED-F-070.
- Ändern/Entfernen eigener Termine ausschließlich über langes Drücken erreichbar — Grund: nicht auffindbar ohne Vorwissen, siehe `platform/ux-and-theming.md` UX-F-090.
- Bei unerwarteter lokaler Datenmenge wird der gesamte Stundenplan kommentarlos gelöscht und neu angelegt — Grund: Datenverlust ohne Rückfrage, siehe `platform/data-and-storage.md` DATA-F-020.
- Gruppenfremde Termine allein durch abgeschwächte Farbe markieren, ohne Text oder Symbol — Grund: für Menschen mit Farbsinnstörung nicht unterscheidbar, siehe `platform/ux-and-theming.md` UX-F-080.
- Wildcard-`studentSet` als gruppenfremd behandeln — Grund: kehrt die Bedeutung um, siehe Wildcard-Befund in Abschnitt 4.

## 13. Offene Fragen

- SCHED-F-180 erkennt einen Semesterwechsel durch Abgleich der `grade`-Liste des gewählten Studiengangs aus INT-001 gegen den zuletzt gespeicherten Stand — zuverlässiger als ein festes Kalenderdatum, da Semesterstart-Termine variieren, und ohne zusätzliche manuelle Nutzerangabe.
- Format der Prüfungsplan-Excel-Datei (INT-013): Spaltenaufbau erst bei Vorliegen einer realen Datei zu klären, siehe `platform/integrations.md` INT-013.
- ~~Zweiwöchentliche Veranstaltungen: Liefert INT-002 wiederkehrende Termine bereits als separate wöchentliche Einträge, oder fehlt eine Rhythmus-Angabe für eine korrekte Darstellung?~~ Teilweise beantwortet 2026-08-26 (Live-Prüfung aller aktuell angebotenen Studiengang/Fachsemester-Kombinationen, siehe `platform/integrations.md` INT-002): `interval` ist im gesamten aktuellen Bestand ausschließlich `weekly`. Die als Beispiel genannte Veranstaltung „Lern- und Arbeitstechniken" ist wöchentlich, kein Beleg für den Zweiwochen-Fall. Ob `interval` überhaupt einen anderen Wert führen kann, bleibt unverifiziert, bis eine tatsächlich zweiwöchentliche Veranstaltung im Bestand auftaucht — bei Umsetzung erneut zu prüfen.
- ~~**Neu (2026-08-26), aus derselben Live-Prüfung:** „Lern- und Arbeitstechniken" wird parallel in zwei Räumen mit identischem `studentSet` angeboten (`courseId 411031`) — die Rohdaten allein lassen nicht erkennen, welcher Raum für eine einzelne Studierende gilt.~~ **Beantwortet 2026-09-04:** Der Curricula-Bestand des Fachbereichs (`resources/Curricula.pdf`, Stand 24.07.2026) führt die Modulnummer `411031` als „Lern- u. Arbeitstechniken/Studium Generale/Mentoring" — ein Bündel dreier Angebote unter einer Modulnummer. Die zwei parallelen Räume sind damit zwei verschiedene Angebote, kein Datenfehler und keine Mehrdeutigkeit. Die App zeigt beide Varianten nebeneinander (SCHED-F-540); ein Scheinkonflikt nach SCHED-F-230 entsteht nicht, solange höchstens eine davon den Status „fest" trägt (SCHED-F-570/590). Welche der drei Teilveranstaltungen eine einzelne Person besucht, bleibt ihre Auswahl (SCHED-F-600).
- ~~**Neu (2026-09-04):** Welche Bedeutung hat der Zahlenteil einer Gruppenkennung (`C5`, `M4`)?~~ **Beantwortet am selben Tag** durch den Hinweis einer studierenden Person: Die Zuteilung ist über INT-019 zur Matrikelnummer abrufbar (→ SCHED-F-690), und in der Praxis zählt der Buchstabe, die Zahl wird so gut wie nie gebraucht (→ SCHED-F-040 erweitert, SCHED-F-720). Offen bleibt allein, wie der Fachbereich die Zuteilung intern bildet — für die App ohne Belang, da sie die Kennung nicht selbst herleiten muss.
- **Neu (2026-09-04):** Prüfungstermine erscheinen in INT-009 als Einträge mit `eventType: "Event"` und dem Namensmuster `Prüfung <courseId> <Bezeichnung>`, samt Raum, Datum und Uhrzeit. Ob das INT-013 (Intranet-Excel, Hochschul-Login nötig) für SCHED-F-200 ganz oder teilweise ersetzen kann, ist vor der zweiten Ausbaustufe zu prüfen — es würde den zweistufigen manuellen Import überflüssig machen. Offen ist insbesondere, ob dieser Bestand vollständig und rechtzeitig gepflegt wird.
- **Neu (2026-09-04):** Vorlesungsfreie Einzeltage und Feiertage liefert derzeit keine Quelle. SCHED-F-510 stützt sich vorerst allein auf Semesterbeginn und -ende aus den Stammdaten (API-F-230); ob eine vom FSR gepflegte Liste vorlesungsfreier Tage den Aufwand lohnt, ist nach der ersten Nutzung zu entscheiden.
- **Neu (2026-09-04):** Führt FBWS jemals `Sat` oder `Sun` im Feld `weekday`? Der am 2026-09-04 geprüfte Bestand tut es nicht. SCHED-F-460 baut die Wochentagsleiste dynamisch und ist damit unabhängig von der Antwort; `platform/api-contract.yaml` beschränkt den Wochentag im Schema `RaumplanTermin` jedoch auf `Mon`–`Fri` und wäre bei einem Gegenbeleg zu erweitern.
- ~~Liefert INT-002 für ein vom eigenen Fachsemester abweichendes `{grade}` tatsächlich die benötigten Wahlpflicht-Termine?~~ Gegenstandslos seit 2026-08-26: SCHED-F-270 (manuelle Fachsemester-Auswahl) ist entfallen, ersetzt durch SCHED-F-400 (automatischer Bezug aus der FBWS-Sammelkategorie `WFPB`), siehe `platform/integrations.md` INT-002.
- ~~Lohnt sich für eine spätere Version eine komfortablere, FSR-gepflegte Zuordnung „Wahlpflichtmodul → typisches Fachsemester"?~~ Gegenstandslos aus demselben Grund — die FBWS-eigene Sammelkategorie leistet das bereits, keine zusätzliche FSR-Pflege nötig.
- **Neu (2026-08-26):** Deckt die FBWS-Sammelkategorie `WFPB` auch Master-Wahlpflichtfächer ab, oder ausschließlich Bachelor (so die Namensgebung „Bachelor Wahlpflichtfächer WPF")? Keine äquivalente Kategorie für die Master-Studiengänge (`INPM`, `MIPM`, `WIPM`) in der Studiengangsliste gefunden — vor Umsetzung zu klären, falls Master-Wahlpflicht relevant wird.
- Weitere Optimierungsmodi über die drei Mindestmodi aus SCHED-F-350 hinaus (z. B. „möglichst früh fertig", „bestimmte Wochentage bevorzugt frei") — bewusst als erweiterbare, nicht abschließende Liste formuliert; konkrete weitere Modi bei Bedarf nachzutragen, ohne SCHED-F-350 selbst zu ändern.
- Vollkombinatorische Analyse mehrerer gleichzeitig unentschiedener Wahlpflicht-Kandidaten gegeneinander (statt der schrittweisen Pflicht-Markierung aus SCHED-F-380) — bewusst zurückgestellt, siehe Erläuterung zu SCHED-F-370 bis SCHED-F-390; mögliche spätere Erweiterung, falls sich die schrittweise Variante in der Praxis als unzureichend erweist.
- Ob das Zeitfenster (SCHED-F-330) einheitlich für alle Wochentage gilt oder je Wochentag unterschiedlich einstellbar sein sollte — für den ersten Umfang als ein einheitliches Zeitfenster angenommen, mangels gegenteiliger Evidenz aus der Rücksprache mit dem FSR FB4.
- Trennschärfe des Merkmalssatzes Bezeichnung + Wochentag + Beginnzeit + `studentSet` für die Zuordnung INT-002 ↔ INT-009 (SCHED-F-410) — an echten Daten zu prüfen; INT-002 führt kein `courseId`, ein exakter Schlüssel fehlt.
- Bildet INT-009 kurzfristige Ausfälle und Raumänderungen ab (bestimmt die Aussagekraft von SCHED-F-420/F-430)? Gemeinsame offene Frage mit `../room-finder/spec.md` Abschnitt 13; vor Roadmap-Schritt 6 als Spike zu klären.
