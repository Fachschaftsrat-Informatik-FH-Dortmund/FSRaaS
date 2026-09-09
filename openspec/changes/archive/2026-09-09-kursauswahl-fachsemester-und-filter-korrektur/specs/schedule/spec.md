## MODIFIED Requirements

### Requirement: Gliederung der Modulauswahl nach Fachsemester

Das System muss die Modulauswahl in Abschnitte gliedern und dabei je Modul das Fachsemester als Abschnitt verwenden, in dem es angeboten wird. Für Module, deren Termine kein auswertbares Fachsemester tragen, muss das System stattdessen den Namen des Endpunkts als Abschnitt verwenden. Trägt dieselbe Modulnummer Termine mit unterschiedlichem Fachsemester — namentlich ein reguläres Angebot und ein davon abweichend benanntes Wiederholerangebot desselben Moduls —, muss das System sie als eigenständige Module mit je einem Fachsemester führen, statt sie zu einem Modul mit mehrdeutigem Fachsemester zusammenzufassen. Die Fachsemester-Gliederung ist die einzige Bedienmöglichkeit, um zwischen Fachsemestern zu wechseln; ein zusätzliches, eigenständiges Filterelement dafür ist ausgeschlossen. Herkunft: NEU, entschieden 2026-09-08, Bestandsaufnahme über eine Live-Abfrage von INT-002 am selben Tag; Modul-Identität je Fachsemester und Klarstellung zur Fachsemester-Navigation ergänzt über eine erneute Live-Abfrage am 2026-09-08 (Issue #57). Nur die Bachelor-Endpunkte mit echter Fachsemesterliste liefern verwertbare `grade`-Werte; Master, Blockwochen, Tutorien, Seminare und Wahlpflicht liefern durchgängig `0`, sodass eine reine Fachsemester-Gliederung dort nichts trennen würde. Der Wiederholerfall ist belegt: `INPBTI/*` liefert unter der Modulnummer `42012` sowohl „Algorithmen und Datenstrukturen" (Fachsemester 2) als auch „Wdh. Algorithmen und Datenstrukturen" (Fachsemester 4) — beide teilen sich die Modulnummer, sind aber fachlich getrennte Lehrangebote für unterschiedliche Kohorten. Ein Modul, das sie zusammenfasst, hätte kein eindeutiges Fachsemester und würde bislang in den Endpunkt-Sammelabschnitt verschoben, wo die Nutzerin es nicht im erwarteten Fachsemester findet.

#### Scenario: Bachelor-Endpunkt mit Fachsemestern
- **WHEN** ein gewählter Endpunkt Termine mit den Fachsemestern 2, 4 und 6 liefert
- **THEN** gliedert das System dessen Module in die Abschnitte dieser drei Fachsemester

#### Scenario: Endpunkt ohne Fachsemester
- **WHEN** ein gewählter Endpunkt ausschließlich Termine ohne auswertbares Fachsemester liefert
- **THEN** führt das System dessen Module in einem nach dem Endpunkt benannten Abschnitt

#### Scenario: Modulnummer mit Wiederholerangebot in anderem Fachsemester
- **WHEN** dieselbe Modulnummer Termine eines regulären Angebots in einem Fachsemester und eines abweichend benannten Wiederholerangebots in einem anderen Fachsemester trägt
- **THEN** führt das System beide als eigenständige Module, jedes im Abschnitt seines eigenen Fachsemesters

#### Scenario: Keine zusätzliche Fachsemester-Filterung
- **WHEN** die Modulauswahl mehr als einen Fachsemester-Abschnitt anzeigt
- **THEN** bietet das System dafür ausschließlich die Gliederung in Abschnitte an, kein zusätzliches Filterelement, das andere Fachsemester ausblendet

## ADDED Requirements

### Requirement: Anzeigename paralleler Termingruppen ohne bedeutungslose Endzahl

Tragen die Termine eines Moduls im selben Fachsemester denselben Namensstamm, aber mehrere unterschiedliche angehängte Zahlen, ohne dass sich die Veranstaltungsart oder eine andere fachliche Eigenschaft unterscheidet, dann muss das System als Anzeigename der Modulauswahl den gemeinsamen Namensstamm ohne die Zahl verwenden. Tritt am Namensstamm eines Moduls durchgängig dieselbe Zahl auf, gilt sie als Teil des Modulnamens und bleibt unverändert. Herkunft: NEU, entschieden 2026-09-08, Bestandsaufnahme über eine Live-Abfrage von INT-002 am selben Tag (Issue #57). Belegt an `INPBTI/*`: Die Modulnummer `41102` liefert zwölf Termine „Technisches Englisch 1" bis „Technisches Englisch 12" — gleiches Fachsemester, gleiche Veranstaltungsart `SV`, nur unterschiedliche Wochentag/Uhrzeit-Slots ohne fachlichen Unterschied auf Modulebene; die angehängte Zahl ist dort ein Artefakt der Verarbeitungsreihenfolge, kein Namensbestandteil. Zur Abgrenzung: Die Modulnummer `44121` liefert „Softwaretechnik 2" durchgängig mit derselben Zahl — dort bleibt sie Teil des Namens, weil kein zweiter, abweichender Zahlenwert auftritt.

#### Scenario: Mehrere Zahlenendungen bei gleichem Namensstamm
- **WHEN** ein Modul im selben Fachsemester mehrere Termine mit gleichem Namensstamm, aber unterschiedlicher angehängter Zahl trägt
- **THEN** zeigt das System den Namensstamm ohne die Zahl als Modulnamen

#### Scenario: Durchgängig dieselbe Zahl
- **WHEN** alle Termine eines Moduls im selben Fachsemester denselben Namen mit derselben angehängten Zahl tragen
- **THEN** zeigt das System den Namen unverändert einschließlich der Zahl
