## ADDED Requirements

### Requirement: Kennzeichnung des Planungsstands je Veranstaltungsreihe

Das System muss im Planungsmodus je Veranstaltungsreihe am Feld kennzeichnen, wie weit sie eingeplant ist. Es muss vier Stände unterscheiden: eingeplant, mit mehreren Terminen eingeplant, durch einen anderen Termin derselben Reihe bereits anderweitig eingetragen, und noch einzuplanen. Sind mehrere Termine derselben Reihe gewählt, muss die Kennzeichnung deren Anzahl nennen. Jeder Stand muss zusätzlich zur Farbe durch Symbol oder Text unterscheidbar sein. Herkunft: Recherche: Gerätetest 2026-09-09 (Issue #68), Ausgestaltung entschieden 2026-09-11. Der ursprüngliche Vorschlag unterschied „ein Termin gewählt" und „mehrere Termine gewählt" über einen durchgezogenen und einen nicht durchgezogenen Haken; in Zeilengröße ist dieser Unterschied nicht sicher wahrnehmbar, die Anzahl trägt dieselbe Aussage und erfüllt zugleich das Requirement „Bedeutung nicht allein über Farbe" der Capability `ux-and-theming`.

#### Scenario: Ein Termin der Reihe gewählt
- **WHEN** genau ein Termin einer Veranstaltungsreihe im Zwischenstand steht
- **THEN** kennzeichnet das System die Reihe als eingeplant

#### Scenario: Mehrere Termine der Reihe gewählt
- **WHEN** zwei Termine derselben Veranstaltungsreihe im Zwischenstand stehen
- **THEN** kennzeichnet das System die Reihe als eingeplant und nennt die Anzahl der gewählten Termine

#### Scenario: Reihe anderweitig eingetragen
- **WHEN** ein anderer Termin derselben Veranstaltungsreihe bereits im Zwischenstand steht als der betrachtete
- **THEN** kennzeichnet das System den betrachteten Termin als anderweitig eingetragen

#### Scenario: Reihe noch offen
- **WHEN** zu einer Veranstaltungsreihe kein Termin im Zwischenstand steht
- **THEN** kennzeichnet das System sie als noch einzuplanen

### Requirement: Anzeige der zugewiesenen Gruppenkennungen im Planungsmodus

Das System muss im Planungsmodus je Termin die ihm zugewiesenen Gruppenkennungen anzeigen. Ist die Gruppenkennung der Nutzerin darunter, muss das System sie gegenüber den übrigen hervorheben. Eine Anzeige, die allein die Zugehörigkeit zur eigenen Gruppe meldet, ohne die zugewiesenen Kennungen zu nennen, ist nicht ausreichend. Herkunft: Recherche: Gerätetest 2026-09-09 (Issue #68), Ausgestaltung entschieden 2026-09-11. Wer zwischen parallelen Gruppen wählt, entscheidet anhand der Kennungen; die bloße Auskunft „gehört zu deiner Gruppe" trägt diese Entscheidung nicht.

#### Scenario: Eigene Gruppe unter den zugewiesenen
- **WHEN** ein Termin die Gruppenkennungen `C7` und `C8` trägt und die Nutzerin `C8` festgelegt hat
- **THEN** zeigt das System beide Kennungen und hebt `C8` gegenüber `C7` hervor

#### Scenario: Eigene Gruppe nicht darunter
- **WHEN** ein Termin ausschließlich Gruppenkennungen trägt, die die Kennung der Nutzerin nicht einschließen
- **THEN** zeigt das System die zugewiesenen Kennungen ohne Hervorhebung

### Requirement: Einstellbare farbliche Hervorhebung im Planungsmodus

Das System muss im Kopfbereich des Planungsmodus anbieten, die farbliche Hervorhebung einzeln an- und abzuschalten, und zwar für die Zugehörigkeit zur eigenen Gruppe, für Konflikte und für bereits eingeplante Veranstaltungsreihen. Die Hervorhebung der eigenen Gruppe ist voreingestellt aktiv, die übrigen sind voreingestellt abgeschaltet. Eine abgeschaltete Hervorhebung darf die zugrunde liegende Angabe nicht entfernen; sie bleibt als Text oder Symbol bestehen. Herkunft: Recherche: Gerätetest 2026-09-09 (Issue #68), Ausgestaltung entschieden 2026-09-11. Bisher ist allein die eigene Gruppe farblich hervorgehoben, unabschaltbar; Konflikt und Planungsstand stehen nur als Text da.

#### Scenario: Hervorhebung der eigenen Gruppe abschalten
- **WHEN** die Nutzerin die Hervorhebung der eigenen Gruppe abschaltet
- **THEN** stellt das System Termine der eigenen Gruppe ohne farbliche Hervorhebung dar und kennzeichnet die Zugehörigkeit weiterhin durch Text oder Symbol

#### Scenario: Hervorhebung von Konflikten anschalten
- **WHEN** die Nutzerin die Hervorhebung von Konflikten anschaltet
- **THEN** hebt das System kollidierende Termine zusätzlich farblich hervor

#### Scenario: Voreinstellung beim ersten Öffnen
- **WHEN** die Nutzerin den Planungsmodus zum ersten Mal öffnet
- **THEN** ist allein die Hervorhebung der eigenen Gruppe aktiv

### Requirement: Unveränderte Modulnamen im Planungsmodus

Das System muss im Planungsmodus die Namen der Termine unverändert so anzeigen, wie die Terminquelle sie liefert. Die Zusammenführung mehrerer Namen auf einen gemeinsamen Namensstamm ohne bedeutungslose Endzahl gilt dort nicht. Herkunft: Recherche: Gerätetest 2026-09-09 (Issue #68), Entscheidung 2026-09-11. Die Zusammenführung ist für die Modulauswahl gedacht, wo die Frage „welches Modul belege ich" lautet; im Planungsmodus unterscheidet die Endzahl gerade die parallelen Termine, zwischen denen die Nutzerin dort wählt.

#### Scenario: Paralleler Termin mit Endzahl
- **WHEN** ein Modul im Planungsmodus Termine mit den Namen „Technisches Englisch 3" und „Technisches Englisch 7" führt
- **THEN** zeigt das System beide Namen unverändert einschließlich ihrer Endzahl

### Requirement: Kein Rückweg in den Planungsmodus nach dem Sichern

Wenn die Nutzerin die Planung gesichert hat und das System zur Wochenansicht zurückkehrt, dann darf es keinen Rückweg in den verlassenen Planungsmodus anbieten. Der Planungsmodus wird ausschließlich über seinen regulären Einstiegspunkt erneut geöffnet. Herkunft: Recherche: Gerätetest 2026-09-09 (Issue #68), Entscheidung 2026-09-11. Ein Zurück-Pfeil in einen abgeschlossenen Vorgang legt nahe, die Sicherung sei rücknehmbar; sie ist es nicht.

#### Scenario: Nach dem Sichern
- **WHEN** die Nutzerin die Planung gesichert hat und die Wochenansicht erscheint
- **THEN** bietet das System dort keinen Rückweg in den Planungsmodus an

## MODIFIED Requirements

### Requirement: Anzeigename paralleler Termingruppen ohne bedeutungslose Endzahl

Tragen die Termine eines Moduls im selben Fachsemester denselben Namensstamm, aber mehrere unterschiedliche angehängte Zahlen, ohne dass sich die Veranstaltungsart oder eine andere fachliche Eigenschaft unterscheidet, dann muss das System als Anzeigename **der Modulauswahl** den gemeinsamen Namensstamm ohne die Zahl verwenden. Tritt am Namensstamm eines Moduls durchgängig dieselbe Zahl auf, gilt sie als Teil des Modulnamens und bleibt unverändert. Außerhalb der Modulauswahl gilt diese Zusammenführung nicht; dort erscheinen die Namen unverändert. Herkunft: NEU, entschieden 2026-09-08, Bestandsaufnahme über eine Live-Abfrage von INT-002 am selben Tag (Issue #57), auf die Modulauswahl eingegrenzt 2026-09-11 nach dem Gerätetest vom 2026-09-09 (Issue #68). Belegt an `INPBTI/*`: Die Modulnummer `41102` liefert zwölf Termine „Technisches Englisch 1" bis „Technisches Englisch 12" — gleiches Fachsemester, gleiche Veranstaltungsart `SV`, nur unterschiedliche Wochentag/Uhrzeit-Slots ohne fachlichen Unterschied auf Modulebene; die angehängte Zahl ist dort ein Artefakt der Verarbeitungsreihenfolge, kein Namensbestandteil. Zur Abgrenzung: Die Modulnummer `44121` liefert „Softwaretechnik 2" durchgängig mit derselben Zahl — dort bleibt sie Teil des Namens, weil kein zweiter, abweichender Zahlenwert auftritt.

#### Scenario: Mehrere Zahlenendungen bei gleichem Namensstamm
- **WHEN** ein Modul im selben Fachsemester mehrere Termine mit gleichem Namensstamm, aber unterschiedlicher angehängter Zahl trägt
- **THEN** zeigt das System in der Modulauswahl den Namensstamm ohne die Zahl als Modulnamen

#### Scenario: Durchgängig dieselbe Zahl
- **WHEN** alle Termine eines Moduls im selben Fachsemester denselben Namen mit derselben angehängten Zahl tragen
- **THEN** zeigt das System den Namen unverändert einschließlich der Zahl

#### Scenario: Außerhalb der Modulauswahl
- **WHEN** dieselben Termine außerhalb der Modulauswahl angezeigt werden
- **THEN** verwendet das System die Namen unverändert, ohne sie auf den Namensstamm zusammenzuführen

### Requirement: Bewusste Übernahme trotz Konflikt

Das System muss der Nutzerin ermöglichen, trotz einer erkannten Kollision einen Termin bewusst in den Plan zu übernehmen; das Paar aus dem übernommenen Termin und dem Termin, mit dem er kollidiert, muss dauerhaft als Konflikt gekennzeichnet bleiben. Kollidiert der übernommene Termin mit mehreren Terminen, muss das System die Annahme für jedes betroffene Paar einzeln festhalten. Die Kennzeichnung darf nicht als „angenommener Konflikt" beschriftet sein. Herkunft: NEU, entschieden 2026-09-07; vormals SCHED-F-310; Beschriftung geändert 2026-09-11 nach dem Gerätetest vom 2026-09-09 (Issue #68). Die Kennzeichnung am einzelnen Termin statt am Paar wäre nicht rekonstruierbar: Ein Termin kann gleichzeitig eine angenommene und eine offene Kollision haben. Die Beschriftung „angenommener Konflikt" behauptet einen Vorgang, den es nicht gibt — wer zwei gleichzeitige Termine wählt, nimmt den Konflikt nicht aktiv an, er entsteht als Folge der Auswahl.

#### Scenario: Konflikt bewusst akzeptieren
- **WHEN** die Nutzerin trotz erkannter Kollision einen Termin übernimmt
- **THEN** kennzeichnet das System das Paar aus beiden Terminen dauerhaft als Konflikt

#### Scenario: Übernahme bei mehreren Kollisionen
- **WHEN** die Nutzerin einen Termin übernimmt, der mit zwei bereits vorhandenen Terminen kollidiert
- **THEN** hält das System die Annahme für beide Paare einzeln fest

#### Scenario: Beschriftung der Kennzeichnung
- **WHEN** ein Terminpaar als Konflikt gekennzeichnet ist
- **THEN** beschriftet das System die Kennzeichnung als „Konflikt", nicht als „angenommener Konflikt"

### Requirement: Visuelle Kennzeichnung von Prüfungsterminen

Wenn ein Termin eine aus dem offiziellen Prüfungsplan übernommene Prüfung ist, muss das System ihn visuell gesondert von regulären Terminen kennzeichnen. Herkunft: NEU (vormals SCHED-F-210); auf den offiziellen Prüfungsbestand eingegrenzt 2026-09-11 nach dem Gerätetest vom 2026-09-09 (Issue #68). Die zweite bisherige Quelle — ein eigener, als Prüfung gekennzeichneter Termin — entfällt mit dem Requirement „Eigenen Termin als Prüfung kennzeichnen".

#### Scenario: Prüfungstermin im Plan
- **WHEN** ein aus dem Prüfungsplan übernommener Termin im Plan steht
- **THEN** stellt das System ihn visuell gesondert von regulären Terminen dar

## REMOVED Requirements

### Requirement: Eigenen Termin als Prüfung kennzeichnen

**Reason**: Entscheidung vom 2026-09-11 (Issue #68, Gerätetest 2026-09-09): Die App führt den Stundenplan; Prüfungen kommen ausschließlich aus dem offiziellen, aus dem Raumplan abgeleiteten Bestand (Requirement „Auswahl aus dem offiziellen Prüfungsplan", unverändert gültig). Der Bedienweg im Planungsmodus fiel am Gerät als unpassend auf; die Prüfung der Frage ergab, dass er auch in der Wochenansicht keinen eigenständigen Zweck mehr trägt.

**Migration**: Eine Prüfung, die der offizielle Bestand nicht führt, wird als gewöhnlicher eigener Termin angelegt oder im Kalender des Geräts eingetragen. Das Feld `istPruefung` an eigenen Planeinträgen (`app/src/areas/schedule/typen.ts:58`) entfällt samt dem Schalter im Termineditor; die App ist nicht ausgeliefert, eine Datenmigration ist nicht nötig. Die Nutzergeschichte „Als Studierende möchte ich eine eigene Prüfung eintragen können, falls sie nicht im offiziellen Prüfungsplan steht" entfällt mit diesem Requirement und ist im Kontextabschnitt der Capability zu streichen; ebenso der Halbsatz „einschließlich eigener Prüfungstermine" in der Aufzählung der eigenen Einträge.
