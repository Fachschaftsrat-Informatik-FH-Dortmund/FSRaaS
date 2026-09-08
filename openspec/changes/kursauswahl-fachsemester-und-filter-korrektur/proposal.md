## Why

**Die Modulauswahl gruppiert Wiederholerangebote fälschlich mit dem regulären Angebot.** Eine Live-Abfrage von INT-002 (`INPBTI/*`, 2026-09-08) zeigt: `courseId 42012` trägt sowohl „Algorithmen und Datenstrukturen" (Fachsemester 2) als auch „Wdh. Algorithmen und Datenstrukturen" (Fachsemester 4, das Wiederholerangebot). `kursbaum.baueModulliste` gruppiert Module ausschließlich nach `courseId`; das entstehende Modul trägt dadurch zwei Fachsemester-Werte, `grades.size` ist 2, und die Gliederungsregel fällt auf den Endpunktnamen zurück, statt das Modul in Fachsemester 2 zu führen. Issue #57 benennt das konkret für Technische Informatik Bachelor (`INPBTI`).

**Dieselbe courseId trägt auch reine Parallelgruppen mit irreführenden Namen.** `courseId 41102` liefert zwölf Termine „Technisches Englisch 1" bis „Technisches Englisch 12" — gleiches Fachsemester (2), gleiche Veranstaltungsart (`SV`), nur unterschiedliche Wochentag/Uhrzeit-Slots. Die aktuelle Gruppierung fasst sie zwar richtig zu einem Modul zusammen, übernimmt als Anzeigenamen aber unverändert den Namen des zuerst verarbeiteten Termins — eine der zwölf Nummern, ohne fachliche Bedeutung auf Modulebene. Issue #57 schlägt vor, die Zahl wegzulassen, wenn eine Modulnummer mehrere Zahlenendungen führt; die Live-Daten bestätigen, dass diese Regel greift, ohne echte Namensbestandteile wie bei `courseId 44121` („Softwaretechnik 2", durchgängig dieselbe Zahl) zu treffen.

**Der Fachsemester-Filter der Modulauswahl ist seit der Anker-Navigation redundant.** Die `SegmentedControl` „Alle Fachsemester / Fachsemester N" wurde beim vorangehenden Change unverändert aus der bisherigen Kursauswahl übernommen (Task 6.4 von `stundenplan-einrichtung-endpunkte`), bevor die Sprungmarken-Leiste (`AnkerListe`) für dieselbe Gliederung eingeführt wurde. Beide Bedienelemente lösen dieselbe Aufgabe — zu einem Fachsemester springen —, eines davon blendet dabei zusätzlich alle anderen Abschnitte aus. Kein Requirement der Capability `schedule` verlangt einen eigenständigen Fachsemester-Filter; die „Freitextsuche im Auswahlbestand" verlangt nur die Textsuche. Rückmeldung des FSR (Issue #57, geklärt 2026-09-08): der Filter mit der Beschriftung „Alle Fachsemester, Fachsemester 2, …" soll entfallen, die Sprungmarken bleiben.

**Der fehlende Bedienweg über die Modulauswahl hinaus ist kein Fehler dieses Bildschirms.** Issue #57 bemängelt zusätzlich das Fehlen eines Buttons zum Weitergehen nach der Modulauswahl. Geklärt mit dem FSR (2026-09-08): Das ist der dokumentierte Zwischenstand von `stundenplan-einrichtung-endpunkte` (Non-Goal: „Die Modulauswahl schreibt noch nichts in den persönlichen Plan") und wird vom bereits offenen Change `stundenplan-planungsmodus-feinauswahl` fortgeführt. Dieser Change ändert daran nichts.

## What Changes

- Modul-Gruppierungsschlüssel in `kursbaum.baueModulliste` von `courseId` auf `courseId` **und** Fachsemester (`grade`) umgestellt: Termine mit derselben `courseId`, aber unterschiedlichem Fachsemester, bilden künftig getrennte Module — jedes mit einem einzigen, eindeutigen Fachsemester-Abschnitt. Das betrifft insbesondere Wiederholerangebote (Namenspräfix „Wdh."), die weiterhin unter ihrem eigenen Namen erscheinen, jetzt aber im richtigen Fachsemester-Abschnitt statt im Endpunkt-Sammelabschnitt.
- Anzeigename eines Moduls verliert eine angehängte Zahl, wenn zu derselben `courseId`/demselben Fachsemester mehrere Termine mit sonst identischem Namensstamm, aber unterschiedlicher Endzahl vorliegen (reine Parallelgruppen ohne fachlichen Unterschied). Ein Modul mit durchgängig derselben Endzahl (z. B. „Softwaretechnik 2") bleibt unverändert — die Regel greift nur bei **mehreren unterschiedlichen** Zahlenendungen.
- Fachsemester-`SegmentedControl` samt „Filter zurücksetzen"-Button entfällt aus `CourseSelectionScreen`; die Freitextsuche bleibt. Die Sprungmarken-Leiste (`AnkerListe`) bleibt die einzige Fachsemester-Navigation.
- Kein Änderungsbedarf am fehlenden Weiter-Bedienweg (siehe „Why") — wird hier ausdrücklich nicht bearbeitet, sondern bleibt beim Change `stundenplan-planungsmodus-feinauswahl`.

## Capabilities

### New Capabilities

Keine.

### Modified Capabilities

- `schedule`: „Gliederung der Modulauswahl nach Fachsemester" um die Modul-Identität je Fachsemester (statt je `courseId` allein), den Wiederholerangebot-Fall und die Klarstellung ergänzt, dass die Fachsemester-Navigation ausschließlich über die Gliederung in Abschnitte erfolgt, nicht über einen zusätzlichen Filter; neue Anforderung zur Anzeige paralleler, gleichwertiger Termingruppen ohne bedeutungslose Endzahl.

## Impact

- `app/src/areas/schedule/kursbaum.ts` — Gruppierungsschlüssel und Anzeigename-Ableitung
- `app/src/areas/schedule/kursbaum.test.ts` — neue Testfälle für Wiederholerangebot und Zahlenendungs-Gruppierung
- `app/src/areas/schedule/kurssuche.ts` — `grade`-Filter entfällt aus `ModulFilter`
- `app/src/areas/schedule/kurssuche.test.ts` — Tests zum Fachsemester-Filter entfallen oder werden auf die Anker-Navigation umgestellt
- `app/src/areas/schedule/screens/CourseSelectionScreen.tsx` — `SegmentedControl` und „Filter zurücksetzen" entfernt
- `app/src/areas/schedule/screens/CourseSelectionScreen.test.tsx` — Tests zum Fachsemester-Filter entfallen
- `app/src/i18n/de.json`, `app/src/i18n/en.json` — verwaiste Schlüssel `kurseFachsemesterLabel`, `kurseFilterAlle`, `kurseFilterZuruecksetzen` entfernt

## Roadmap-Zuordnung

Roadmap-Schritt 5 (Stundenplan), Etappe „Einrichtung" — Nachbesserung an der mit `stundenplan-einrichtung-endpunkte` bereits umgesetzten Modulauswahl, auf Grundlage einer Live-Prüfung gegen den echten Bestand vom 2026-09-08. Bewusst nicht enthalten: der Bedienweg von der Modulauswahl zum Planungsmodus (Etappe „Planung", Change `stundenplan-planungsmodus-feinauswahl`, bereits als Vorschlag angelegt).
