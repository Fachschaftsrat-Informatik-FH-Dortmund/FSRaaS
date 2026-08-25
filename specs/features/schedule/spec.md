---
id: schedule
titel: Stundenplan
praefix: SCHED
status: draft
prioritaet: kern
version: 0.4.1
owner: FSR FB4
last_reviewed: 2026-08-25
derived_from:
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

## 2. Scope / Nicht-Scope

### Scope

- Anzeige offizieller FBWS-Termine (INT-002) für einen gewählten Studiengang und ein gewähltes Fachsemester.
- Lokale Filterung nach Gruppenkennung (`studentSet`-Abgleich, siehe Abschnitt 4).
- Anlegen, Bearbeiten und Löschen eigener, nicht-offizieller Termine, einschließlich eigener Prüfungstermine.
- Lokale Persistenz des Stundenplans über App-Neustarts hinweg (siehe `platform/data-and-storage.md`, DATA-F-010).
- Auswahl relevanter Prüfungstermine aus dem vom FSR/Admin importierten offiziellen Prüfungsplan (INT-013) und deren Anzeige im Stundenplan, gesondert gekennzeichnet.
- Benachrichtigung bei Änderungen an ausgewählten Prüfungsterminen.

### Nicht-Scope

- Raumbelegung/-verfügbarkeit über den eigenen Stundenplan hinaus — siehe `features/room-finder/spec.md`.
- Serverseitige Speicherung des persönlichen Stundenplans einschließlich der individuellen Prüfungsauswahl — ausdrücklich ausgeschlossen, siehe `platform/backend-and-api.md` API-F-100 und Abschnitt 4 (Erläuterung zu SCHED-F-220).
- Import und Pflege des offiziellen Prüfungsplans selbst (Excel-Upload, Jahres-Rotation) — Backend-Vorgang, siehe `platform/backend-and-api.md` API-F-180 bis API-F-200 und `platform/integrations.md` INT-013.
- Notenergebnisse zu Prüfungen — siehe `features/grades/spec.md`; diese Spec zeigt ausschließlich Termine, keine Ergebnisse.

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
| SCHED-F-100 | Falls kein Termin zur angegebenen Gruppenkennung an einem Wochentag passt, muss das System diesen Tag als leer kennzeichnen und den Grund (Gruppenfilterung) nennen. | NEU |
| SCHED-F-110 | Das System muss der Nutzerin das Anlegen eigener, nicht-offizieller Termine mit Titel, Wochentag, Beginn- und Endzeit ermöglichen. | Alt: lib/areas/schedule/screens/add_custom_schedule_item_page.dart |
| SCHED-F-120 | Das System muss eigene Termine dauerhaft von offiziellen FBWS-Terminen unterscheidbar kennzeichnen. | Alt: bewusst verworfen |
| SCHED-F-130 | Das System muss der Nutzerin das Bearbeiten und Löschen eigener Termine über einen sichtbaren Bedienweg ermöglichen, nicht ausschließlich über eine verdeckte Geste. | Alt: bewusst verworfen |
| SCHED-F-140 | Wenn die Nutzerin eine Gruppenkennung angibt, dann muss das System nur Termine anzeigen, deren `studentSet` diese Kennung einschließt. | Alt: lib/areas/schedule/viewmodels/schedule_overview_viewmodel.dart:209 |
| SCHED-F-150 | Wenn die Einstellung „beim Öffnen zum aktuellen Wochentag springen" aktiv ist, dann muss das System beim Öffnen des Stundenplans den aktuellen Wochentag anzeigen. | Alt: lib/areas/schedule/viewmodels/schedule_overview_viewmodel.dart:124-134 |
| SCHED-F-160 | Falls der aktuelle Tag ein Wochenendtag ist, muss das System beim automatischen Sprung zum aktuellen Wochentag stattdessen den vorangegangenen Freitag anzeigen. | Alt: lib/areas/schedule/viewmodels/schedule_overview_viewmodel.dart:132 |
| SCHED-F-170 | Das System muss den dargestellten Stundenplan als iCal-Datei (.ics) exportierbar machen, als einmaligen, lokal erzeugten Export ohne serverseitige Beteiligung. | Recherche: WhatsApp-Chat informatik-pi-ti-ds-ws-24-25, 2026-08-25 |
| SCHED-F-180 | Wenn ein neues Semester beginnt, dann muss das System die Nutzerin auf eine mögliche Anpassung von Fachsemester und Gruppenkennung hinweisen. | Recherche: WhatsApp-Chat praktische-informatik-ws-23-24, 2026-08-25 |
| SCHED-F-190 | Das System muss der Nutzerin das Kennzeichnen eines eigenen Termins als Prüfung ermöglichen. | NEU |
| SCHED-F-200 | Das System muss der Nutzerin die Auswahl relevanter Prüfungen aus dem importierten offiziellen Prüfungsplan (INT-013) ermöglichen, einschließlich Prüfungen, die die Nutzerin nachholen möchte. | NEU |
| SCHED-F-210 | Wenn ein Termin eine Prüfung ist — eigen als Prüfung gekennzeichnet oder aus dem Prüfungsplan ausgewählt —, muss das System ihn visuell gesondert von regulären Terminen kennzeichnen. | NEU |
| SCHED-F-220 | Wenn das Backend eine Aktualisierung des offiziellen Prüfungsplans meldet und mindestens einer der lokal ausgewählten Prüfungstermine der Nutzerin davon betroffen ist, muss das System die Nutzerin darüber informieren. | NEU |
| SCHED-F-230 | Wenn sich ein eigener Termin zeitlich mit einem offiziellen Termin überschneidet, muss das System beide Termine mit einem sichtbaren Konflikthinweis darstellen. | NEU |
| SCHED-F-240 | Das System muss der Nutzerin vor dem iCal-Export die separate Auswahl ermöglichen, ob offizielle Termine, eigene Termine und Prüfungstermine jeweils enthalten sind. | NEU |

### Erläuterungen

**`SCHED-F-070`** — Die Alt-App vergleicht an dieser Stelle fehlerhaft den Zahlenteil der Gruppenkennung (`info.groupNumber`) mit dem ersten Zeichen des `studentSet`-Werts (`schedule_overview_viewmodel.dart:216`, `info.groupNumber.codeUnitAt(0) == item.studentSet.codeUnitAt(0)`), obwohl ein Buchstabenvergleich (`groupLetter`) gemeint war. Dadurch schlägt der Abgleich bei Einzelwert-`studentSet` in der Alt-App praktisch immer fehl, sofern nicht zufällig Zahl- und Buchstabenzeichen denselben Codepoint teilen. Für die Neuentwicklung ist SCHED-F-070 das korrigierte Sollverhalten (Buchstabenvergleich), nicht das beobachtete Altverhalten — daher die Markierung `Alt: bewusst verworfen` statt eines Quellverweises.

**`SCHED-F-190` bis `SCHED-F-220`** — Aus der Rücksprache mit dem FSR FB4, 2026-08-25: Der Fachbereich veröffentlicht während der Vorlesungszeit einen offiziellen Prüfungsplan als Excel-Datei auf einer Intranet-Seite (`https://intranet.fh-dortmund.de/hochschule/organisation/fachbereiche/informatik/pruefungen/pruefungsplaene`). Da diese Seite einen Hochschul-Login voraussetzt, den weder App noch Backend besitzen (siehe `product/vision.md` Nicht-Ziel 1, `platform/security-and-privacy.md` zum Verzicht auf Passwort-Replay), ist der Import zweistufig: Ein FSR-Mitglied/Admin lädt die Datei manuell herunter und in das eigene Backend hoch (`platform/backend-and-api.md` API-F-180, `platform/integrations.md` INT-013); danach wählen Studierende selbst die für sie relevanten Prüfungen aus dem importierten Bestand aus (SCHED-F-200). Nicht jede Prüfung des Fachbereichs interessiert jede Nutzerin — nur die eigenen und ggf. Nachholprüfungen.

**`SCHED-F-220`** — Verträgt sich mit API-F-100 (kein serverseitiges Speichern des persönlichen Stundenplans): Das Backend kennt nicht, welche Prüfungen eine einzelne Nutzerin ausgewählt hat, sondern löst bei jeder Aktualisierung des offiziellen Prüfungsplan-Bestands einen allgemeinen Hinweis aus (vergleichbar einer News-Meldung). Die App gleicht diesen Hinweis lokal gegen die eigene, ausschließlich gerätegespeicherte Auswahl ab und zeigt die Benachrichtigung nur, wenn tatsächlich ein ausgewählter Termin betroffen ist.

**Zweiwöchentliche Veranstaltungen (Hinweis aus derselben Rücksprache).** Manche Lehrveranstaltungen finden nur alle zwei Wochen statt. In der bislang dokumentierten INT-002-Antwortstruktur ist kein Feld erkennbar, das einen solchen Rhythmus trägt (nur INT-009 hat ein `interval`-Feld, dort bislang als „unklare Bedeutung, nicht weiter untersucht" geführt, siehe `platform/integrations.md`). Ob INT-002 wiederkehrende Termine bereits als separate wöchentliche Einträge liefert (dann unproblematisch) oder der Client die Information zur korrekten zweiwöchentlichen Darstellung fehlt, ist vor Umsetzung mit echten Beispieldaten zu verifizieren — siehe Abschnitt 13.

**`SCHED-F-170`/`SCHED-F-180`** — Aus der automatisierten WhatsApp-Chat-Auswertung (`product/whatsapp-feedback-inventory.md`, Abschnitt 4 „Themenübersicht"): Studis weichen teils auf ICS-Import in eine externe Kalender-App aus, wenn ihnen die App-eigene Ansicht nicht reicht; mehrfach dokumentierte Verwirrung entsteht, wenn sich die Gruppenkennung mit dem Semesterwechsel ändert, die App aber weiter den alten Stand zeigt.

**`SCHED-F-170`/`SCHED-F-240` (Export-Ausgestaltung, entschieden).** Rücksprache FSR FB4, 2026-08-25: Studis sollen den in der App zusammengestellten Stundenplan in ein Kalenderprogramm ihrer Wahl integrieren können; die technisch versierte Zielgruppe wünscht dabei maximale Konfigurationsfreiheit. Abgewogen wurden ein einmaliger, lokal erzeugter Datei-Export (kein Server-Zugriff nötig, bleibt aber nicht automatisch aktuell) gegenüber einem abonnierbaren Kalender-Link (bleibt synchron, bräuchte aber einen serverseitigen Endpunkt und damit eine gezielte Ausnahme von API-F-100). Entscheidung: ausschließlich der einmalige Datei-Export — API-F-100 bleibt ohne Ausnahme bestehen. Konfigurierbar ist die Auswahl der enthaltenen Terminarten (SCHED-F-240); Zeitraum-Filterung und Erinnerungs-Konfiguration sind bewusst nicht Teil dieses Umfangs.

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
| C8 | A1B2 | ja, mit Protokolleintrag | `studentSet` entspricht weder Einzelwert- noch Bereichsmuster; sicherer Rückfall auf „sichtbar" statt fälschlich verborgen (SCHED-F-140, siehe Abschnitt 9 „Fehlerfälle"). |

## 5. Datenmodell

Termin (offiziell): siehe INT-002-Felder in `platform/integrations.md`, ergänzt um Kennzeichnung `istOffiziell: true` und `gruppenzugehoerig: boolean` (Ergebnis von SCHED-F-060 bis SCHED-F-090).

Termin (eigen): Titel, Wochentag, Beginnzeit, Endzeit, `istOffiziell: false`, `istPruefung: boolean` (SCHED-F-190). Kein Bezug zu INT-002-Feldern wie `courseType`, `lecturerName`, `studentSet`.

Prüfungsauswahl (lokal): Referenz auf einen Eintrag des vom Backend importierten Prüfungsplans (INT-013), rein gerätegespeichert (siehe Erläuterung zu SCHED-F-220) — kein serverseitiges Pendant.

Gemeinsame Persistenz aller drei Datenarten: `platform/data-and-storage.md`, DATA-F-010.

## 6. Externe Schnittstellen

Nutzt INT-001 (FBWS Studiengänge) für die Studiengangs-/Semesterauswahl, INT-002 (FBWS Termine) für den Terminabruf und den vom Backend (INT-008) importierten Prüfungsplan (INT-013) für die Prüfungsauswahl. Keine Endpunktdetails hier — siehe `platform/integrations.md`.

## 7. UI-Flows & Zustände

| Zustand | Verhalten |
|---|---|
| Laden | Ladeanzeige während des INT-002-Abrufs, bestehende lokale Termine bleiben währenddessen sichtbar |
| Leer (kein Studiengang gewählt) | Hinweis auf die Studiengangsauswahl als nächsten Schritt |
| Leer (Gruppenfilterung, siehe SCHED-F-100) | Tag als leer gekennzeichnet, Grund „keine Termine für Gruppe X an diesem Tag" genannt |
| Fehler | Fehlermeldung mit Wiederholen-Option, zuletzt geladene Termine bleiben sichtbar (siehe `platform/architecture.md` ARCH-F-130) |
| Offline | Zuletzt geladener Stand wird angezeigt, siehe Abschnitt 8 |

## 8. Offline-Verhalten

Der Stundenplan ist einer der drei in `platform/architecture.md` (ARCH-F-100) benannten Bereiche mit garantiertem Offline-Zugriff auf den zuletzt geladenen Stand. Eigene Termine sind ausschließlich lokal gespeichert (DATA-F-010) und daher unabhängig vom Netzzugriff jederzeit verfügbar.

## 9. Fehlerfälle

| Fall | Reaktion |
|---|---|
| INT-001 liefert keinen zur vorherigen Auswahl passenden Studiengang mehr (z. B. nach Umbenennung) | Hinweis anzeigen, erneute Auswahl anbieten |
| INT-002 liefert ein `studentSet`, das keinem der Muster aus Abschnitt 4 entspricht | Termin ohne Gruppenfilterung anzeigen (sicherer Rückfall: sichtbar statt fälschlich verborgen), Vorfall protokollieren (SEC-F-060) |
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
- Der iCal-Export enthält je nach getroffener Auswahl ausschließlich die gewählten Terminarten (SCHED-F-240); eine erneute Änderung des Plans erfordert einen erneuten manuellen Export, da keine Synchronisation stattfindet.

## 12. Bewusst nicht übernommenes Altverhalten

- Fehlerhafter Gruppenabgleich bei Einzelwert-`studentSet` (Zahl-statt-Buchstabe-Vergleich) — Grund: Vergleich schlägt praktisch immer fehl, siehe Erläuterung zu SCHED-F-070.
- Ändern/Entfernen eigener Termine ausschließlich über langes Drücken erreichbar — Grund: nicht auffindbar ohne Vorwissen, siehe `platform/ux-and-theming.md` UX-F-090.
- Bei unerwarteter lokaler Datenmenge wird der gesamte Stundenplan kommentarlos gelöscht und neu angelegt — Grund: Datenverlust ohne Rückfrage, siehe `platform/data-and-storage.md` DATA-F-020.

## 13. Offene Fragen

- SCHED-F-180 erkennt einen Semesterwechsel durch Abgleich der `grade`-Liste des gewählten Studiengangs aus INT-001 gegen den zuletzt gespeicherten Stand — zuverlässiger als ein festes Kalenderdatum, da Semesterstart-Termine variieren, und ohne zusätzliche manuelle Nutzerangabe.
- Format der Prüfungsplan-Excel-Datei (INT-013): Spaltenaufbau erst bei Vorliegen einer realen Datei zu klären, siehe `platform/integrations.md` INT-013.
- Zweiwöchentliche Veranstaltungen: Liefert INT-002 wiederkehrende Termine bereits als separate wöchentliche Einträge, oder fehlt eine Rhythmus-Angabe für eine korrekte Darstellung? Vor Umsetzung mit echten Beispieldaten zu verifizieren, siehe Erläuterung in Abschnitt 4.
