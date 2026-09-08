# Einrichtung über Endpunkte statt Studiengang und Fachsemester

## Why

Die Einrichtung des Stundenplans verlangt heute die Wahl **eines** Studiengangs und **eines** Fachsemesters. Beides trägt nicht:

**Die Liste ist keine Studiengangsliste.** Eine Live-Abfrage von INT-001 am 2026-09-08 liefert 25 Einträge, von denen nur dreizehn Studiengänge sind. Die übrigen sind Lehrangebote anderer Art: drei Blockwochen, ein Tutorien-Sammelendpunkt, ein zweites Tutorium für Studentinnen (`FemINF`), die Bachelorseminare, die Wahlpflichtsammlung `WFPB` und `QDL` (Wiederholungsangebote). Vier weitere Einträge (`INDB`, `INPB`, `STDBSW`, `STDBSY`) tragen weder Namen noch Fachsemester und werden bereits heute verworfen. Als flache, ungeordnete Radioliste ist dieser Bestand nicht bedienbar.

**Eine Auswahl reicht nicht.** Wer neben seinem Studiengang eine Blockwoche belegt oder ein Tutorium besucht, braucht zwei oder drei dieser Endpunkte gleichzeitig. Heute schließt die Einrichtung das aus.

**Das Fachsemester ist an dieser Stelle eine unnötige Frage.** Die Live-Abfrage vom 2026-09-08 belegt, dass `grade=*` auch für Bachelor-Endpunkte funktioniert: `INPBPI/2` liefert 77 Termine, `INPBPI/*` liefert 126 mit den Fachsemestern 2, 4 und 6, jeder Termin mit eigenem `grade`-Feld. Das Fachsemester lässt sich also nach dem Abruf als Gliederungsebene der Modulauswahl verwenden, statt vorher erfragt zu werden. Damit entfällt zugleich die Sonderbehandlung für Wiederholerinnen und Vorzieherinnen.

**Und die Einrichtung ist eine Sackgasse.** `/einrichtung` ist ausschließlich über den Leerzustand der Wochenansicht, den Leerzustand der Kursauswahl und den Semesterwechsel-Hinweis erreichbar. Sobald ein Plan steht, führt kein Bedienweg mehr dorthin: Wer seine Gruppenkennung korrigieren will, müsste erst den gesamten Plan leeren.

## What Changes

**Endpunkte statt Studiengang, mehrfach und gleichrangig.** Die Einrichtung führt die INT-001-Liste als Endpunkte des Lehrangebots, von denen beliebig viele gewählt werden können. Es gibt keinen Hauptendpunkt; alle wirken gleichrangig auf den Auswahlbestand.

**Die Liste wird gegliedert, abgeleitet aus den Daten.** Gruppen: Bachelor, Bachelor dual, Master (je nach Prüfungsordnung sortiert), Blockwoche, Seminare, Tutorien, Wahlpflicht und ein Auffangkorb für alles Übrige. Die Zuordnung entsteht aus dem — bisher undokumentierten — Feld `po`, aus dem Muster des Kurznamens und aus Namensmerkmalen. Ausdrücklich **keine** gepflegte Zuordnungstabelle: Ein neuer Endpunkt des Fachbereichs erscheint sichtbar im Auffangkorb, statt zu verschwinden oder auf eine Nachpflege zu warten. Das Projekt existiert, weil genau solche Pflegeschulden die Vorgängersysteme unbrauchbar gemacht haben.

**Das Fachsemester entfällt aus der Einrichtung.** Je gewähltem Endpunkt ein Abruf mit `grade=*`; die Gliederung nach Fachsemester geschieht in der Modulauswahl aus dem `grade`-Feld der einzelnen Termine.

**Die Modulauswahl wird zur reinen Ankreuzliste.** Sie beantwortet nur noch „welche Module belege ich" — ohne Veranstaltungsarten, ohne Gruppen-Slots, ohne einzelne Termine. Abschnitte nach Fachsemester, wo es eines gibt, sonst nach Endpunktname; Ankernavigation wie im Mensaplan. **BREAKING** gegenüber der heutigen dreistufigen Kursauswahl: Arten und Slots wandern in den Planungsmodus (eigener Change).

**Die Gruppenkennung wird ein Textfeld.** Statt eines Gitters aus allen 26 Buchstaben plus separatem Zahlenfeld ein einzelnes Feld, in das `C8` am Stück getippt wird. Der Weg über die Matrikelnummer bleibt der voreingestellte, steht aber ohne Umschalter darüber, weil die manuelle Eingabe nun in eine Zeile passt.

**Die Einrichtung wird dauerhaft erreichbar** — über ein Kopfzeilen-Element des Stundenplans, unabhängig davon, ob ein Plan besteht.

**Der Semesterwechsel-Hinweis meldet künftig Endpunkte.** Sein bisheriger Anker, die Fachsemesterliste des gewählten Studiengangs, fällt weg. Er schlägt stattdessen an, wenn Endpunkte hinzukommen oder ein gewählter verschwindet — was den heute gar nicht abgedeckten Fall „gewählter Endpunkt existiert nicht mehr" mit erledigt.

## Capabilities

### New Capabilities

Keine.

### Modified Capabilities

- `schedule`: Endpunktauswahl mit Gruppierung und Mehrfachwahl ersetzt Studiengang- und Fachsemesterauswahl; Terminabruf mit `grade=*`; Modulauswahl ohne Arten und Slots; Semesterwechsel-Hinweis auf Endpunkte umgestellt; dauerhafter Zugang zur Einrichtung; Gruppenkennung als einzelnes Textfeld
- `integrations`: INT-001 um das Feld `po` ergänzt; INT-002 um den Befund zu `grade=*` und zwei bisher nicht geführte `courseType`-Werte

## Impact

- `app/src/areas/schedule/einrichtung.ts` — Datenmodell von `sname`/`grade`/`zusatzFachsemester` auf eine Endpunktmenge; Migration bestehender gerätelokaler Stände
- `app/src/areas/schedule/fbwsClient.ts` — `po` auswerten statt verwerfen
- `app/src/areas/schedule/api.ts` — Abruf je Endpunkt mit `grade=*`
- `app/src/areas/schedule/screens/SetupScreen.tsx` — Neuaufbau
- `app/src/areas/schedule/screens/CourseSelectionScreen.tsx` — auf Modulauswahl reduziert
- `app/src/areas/schedule/kursbaum.ts` — Gliederungsebene Fachsemester statt Veranstaltungsart
- neu: Ableitungsregeln für die Endpunktgruppierung, als reine Fachlogik ohne React
- `app/src/areas/canteen/ui/AnkerListe.tsx` — Wiederverwendung für die Abschnittsnavigation
- `app/src/areas/schedule/semesterwechsel.ts` — Vergleich über Endpunktmengen statt Fachsemesterlisten

## Roadmap-Zuordnung

Roadmap-Schritt 5 (Stundenplan), Etappe „Einrichtung". Bewusst **nicht** enthalten: der Planungsmodus mit Veranstaltungsart- und Slot-Auswahl (Change `stundenplan-planungsmodus-feinauswahl`) und der Umbau der Wochenansicht (Change `stundenplan-wochenansicht-nutzerfuehrung`). Bis der Planungsmodus vorliegt, schreibt die Modulauswahl noch nichts in den Plan — die beiden Changes gehören unmittelbar nacheinander umgesetzt.

## Offene Entscheidungen

- **Was beim Abwählen eines Moduls geschieht, das bereits im Plan steht,** ist nicht entschieden. Bis dahin bleibt die Abwahl folgenlos für vorhandene Planeinträge; sie ungefragt zu entfernen wäre ein Datenverlust ohne Rückfrage und ist ausgeschlossen (Capability `data-and-storage`).
- **Ob ein Master-Wahlpflicht-Endpunkt existiert,** ist offen. Im Bestand vom 2026-09-08 gibt es nur `WFPB` (Bachelor). Die Gruppe „Wahlpflicht" trägt daher vorerst genau einen Eintrag.
