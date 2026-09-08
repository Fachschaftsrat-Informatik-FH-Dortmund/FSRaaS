## Context

`kursbaum.baueModulliste` (`app/src/areas/schedule/kursbaum.ts`) gruppiert den flachen INT-002-Terminbestand zu Modulen über `modulSchluessel(termin) = courseId || name`, sammelt je Modul alle beobachteten Fachsemester in einem `Set<string>` (mit `'0'` ausgefiltert) und entscheidet danach: genau ein Wert → Fachsemester-Abschnitt, sonst → Endpunkt-Abschnitt. Siehe proposal.md — Why für die drei Live-Befunde (`courseId 42012`, `41102`, `44121`), die diese Regel falsch bzw. irreführend auslösen.

`kurssuche.ts` bietet zusätzlich zur Freitextsuche einen strukturellen `grade`-Filter, den `CourseSelectionScreen.tsx` über eine `SegmentedControl` bedient — parallel zur `AnkerListe`-Sprungmarkenleiste, die dieselbe Abschnittsgliederung bereits anspringbar macht.

## Goals / Non-Goals

**Goals:**
- Ein Modul hat nach der Umstellung höchstens ein Fachsemester; Wiederholerangebote erscheinen als eigenständiges Modul im richtigen Abschnitt.
- Rein parallele, gleichwertige Termingruppen (gleicher Namensstamm, mehrere Zahlenendungen, gleiches Fachsemester) zeigen einen Namen ohne bedeutungslose Zahl.
- Die Fachsemester-`SegmentedControl` und der zugehörige Rücksetzen-Button entfallen ersatzlos aus der Modulauswahl.

**Non-Goals:**
- Kein Bedienweg von der Modulauswahl zum Planungsmodus — bleibt bei `stundenplan-planungsmodus-feinauswahl` (siehe proposal.md).
- Keine Änderung an der Freitextsuche selbst; sie bleibt unverändert bestehen.
- Keine Persistenz der Modulauswahl — unverändert Bildschirmzustand wie heute.
- Keine Generalisierung auf beliebige Namensmuster jenseits einer angehängten Zahl (z. B. keine Erkennung von Buchstabensuffixen); die Regel bleibt auf den belegten Fall beschränkt.

## Decisions

### 1. Gruppierungsschlüssel wird `courseId` **und** Fachsemester statt `courseId` allein

`modulSchluessel` wechselt von `courseId || name` zu `(courseId || name) + '|' + grade`, wobei `grade` der normalisierte Fachsemester-Wert eines Termins ist (`String(termin.grade)`, `'0'` und leer wie bisher als „kein auswertbares Fachsemester" behandelt und auf einen leeren String vereinheitlicht). Der bestehende Ablauf „je Modul die Menge aller beobachteten Fachsemester sammeln, bei Mehrdeutigkeit auf den Endpunkt zurückfallen" entfällt dadurch für den Fachsemester-Anteil des Schlüssels: Da der Schlüssel das Fachsemester bereits enthält, kann ein Modul per Konstruktion nur noch ein Fachsemester tragen (oder durchgängig `'0'`/leer, was weiterhin auf den Endpunkt-Abschnitt fällt — unverändertes Verhalten für Master, Blockwochen, Tutorien, Seminare, Wahlpflicht).

*Alternative: Modul weiterhin nur über `courseId` gruppieren, aber „Wdh."-Namen per Namensmuster erkennen und gesondert behandeln.* Verworfen: Ein Namensmuster für „Wiederholerangebot" ist brüchig (keine Zusicherung in `openspec/specs/integrations/spec.md`, dass alle Wiederholerangebote das Präfix „Wdh." tragen) und löst das eigentliche Problem nicht allgemein — zwei beliebige, unterschiedlich benannte Angebote mit derselben Modulnummer in verschiedenen Fachsemestern blieben falsch gruppiert. Die Gruppierung über das Fachsemester selbst ist die allgemeinere, durch die Live-Daten belegte Lösung.

*Alternative: Bei mehrdeutigem Fachsemester weiterhin auf den Endpunkt-Abschnitt zurückfallen, aber den Modulnamen des Wiederholerangebots sichtbar machen.* Verworfen: Löst nicht das eigentliche Problem aus Issue #57 — das reguläre Angebot soll im eigenen Fachsemester erscheinen, nicht im Sammelabschnitt.

### 2. Anzeigename: Namensstamm ohne Zahl nur bei mehreren unterschiedlichen Endzahlen im selben (Modulnummer, Fachsemester)-Schlüssel

Nach Entscheidung 1 sind alle Termine eines Moduls bereits auf ein Fachsemester vereinheitlicht. Für den Anzeigenamen wird zusätzlich geprüft: Tragen die im Modul gesammelten Termine mehrere unterschiedliche Namen, die sich nur durch eine angehängte Zahl (Muster `/^(.*?)\s*\d+$/`) unterscheiden und im gemeinsamen Namensstamm übereinstimmen, wird der Namensstamm ohne Zahl als `Modul.name` verwendet. Tritt nur eine einzige Zahl auf (auch mehrfach wiederholt) oder unterscheiden sich die Namen über die Zahl hinaus, bleibt der zuerst beobachtete Name unverändert — wie heute.

*Alternative: Zahl immer entfernen, wenn der Name auf eine Zahl endet.* Verworfen: Träfe „Softwaretechnik 2" fälschlich, wo die Zahl echter Namensbestandteil ist (Live-Befund `courseId 44121`, durchgängig dieselbe Zahl).

*Alternative: Regel auf `courseType: 'SV'` beschränken, da der belegte Fall diese Veranstaltungsart trägt.* Verworfen: Ohne fachliche Begründung, warum ausschließlich `SV` betroffen sein sollte, wäre das eine geratene Einschränkung; die Bedingung „mehrere unterschiedliche Endzahlen bei gleichem Stamm" ist bereits hinreichend präzise und deckt den Fall ab, ohne unbelegte Annahmen über andere Veranstaltungsarten zu treffen.

### 3. Fachsemester-`SegmentedControl` ersatzlos entfernt, kein Ersatzfilter

Die `AnkerListe`-Sprungmarkenleiste bleibt die einzige Fachsemester-Navigation (siehe proposal.md — Why, Rückmeldung des FSR 2026-09-08). `ModulFilter.grade` und die zugehörige Filterlogik in `kurssuche.filtereModulAbschnitte` entfallen; die Freitextsuche bleibt unverändert bestehen.

## Risiken / Trade-offs

- **Bestehende Planeinträge und die Vorbelegung der Modulauswahl.** `CourseSelectionScreen.planEintraegeFuerModul` matcht bislang ausschließlich über `courseId`. Nach Entscheidung 1 kann eine `courseId` zu mehreren Modulen (je Fachsemester) gehören; ein vorhandener Planeintrag müsste dann dem richtigen der beiden zugeordnet werden. `OfficialPlanEntry` führt aber kein Fachsemester-Feld, und es gibt heute keinen produktiven Schreibpfad, der einen `OfficialPlanEntry` überhaupt anlegt (`kind: 'offiziell'` kommt im gesamten `app/src` nur in Tests vor — die Modulauswahl selbst schreibt nichts in den Plan, siehe proposal.md). Die Mehrdeutigkeit ist damit heute unerreichbar. Mitigation: nicht in diesem Change beheben. Der Abgleich zwischen Planeintrag und Modul gehört inhaltlich zu `stundenplan-planungsmodus-feinauswahl`, das als einziger Change einen Schreibpfad für `OfficialPlanEntry` einführt und deshalb auch festlegen muss, woran ein Planeintrag sein Modul erkennt.
- **Modulschlüssel ändert sich, dadurch verliert eine laufende (nicht persistierte) Auswahl beim Neuladen ihre Zuordnung.** Da die Modulauswahl ohnehin nicht persistiert wird (Non-Goal), ist das kein neues Risiko gegenüber heute.
- **Zahlenendungs-Regel erkennt keine anderen Trennzeichen** (z. B. römische Ziffern, Buchstabenpräfixe). Bewusst nicht generalisiert (siehe Non-Goals); ein weiterer belegter Fall wäre ein eigener, kleiner Änderungsvorschlag.
