## ADDED Requirements

### Requirement: Gemeinsames Umlegen der Termine eines Gruppen-Slots

Wenn eine Veranstaltungsart eines gewählten Moduls mehrere Termine anbietet, die dieselbe Gruppenmenge (`studentSet`) und denselben Namen tragen, muss das System sie beim automatischen Planungsvorschlag und bei der Rücknahme einer übernommenen Optimierung als einen Gruppen-Slot behandeln: Es wählt sie nur gemeinsam und legt sie nur gemeinsam um. Hat die Nutzerin Termine mehrerer Gruppen-Slots derselben Veranstaltungsart gewählt, darf das System diese Wahl weder umlegen noch verkleinern. Herkunft: NEU, entschieden 2026-11-26 bei der Umsetzung von Issue #27. Das greedy arbeitende Vorschlagsverfahren wählt je Veranstaltungsart eine Option. Wären die zwei Vorlesungstermine einer Woche zwei Optionen, ließe es einen davon fallen und entfernte damit stillschweigend einen Teil der Veranstaltung. Der Name gehört zum Schlüssel, weil Parallelgruppen wie „Technisches Englisch 1" und „Technisches Englisch 10" Gruppenmenge und Zeit teilen und trotzdem Alternativen sind (vgl. Requirement „Zusammenfassen deckungsgleicher Rohtermine"). Die bewusste Mehrfachwahl bleibt nach dem Requirement „Mehrere Gruppen-Slots übernehmen" eine Entscheidung der Nutzerin.

#### Scenario: Zwei Vorlesungstermine derselben Gruppenmenge
- **WHEN** die Vorlesung eines gewählten Moduls montags und donnerstags für die Gruppenmenge `*` unter demselben Namen stattfindet und die Nutzerin einen Vorschlag erzeugen lässt
- **THEN** enthält der Vorschlag beide Vorlesungstermine

#### Scenario: Parallelgruppen unterschiedlichen Namens
- **WHEN** zwei Termine einer Veranstaltungsart dieselbe Gruppenmenge tragen, sich aber im Namen unterscheiden
- **THEN** behandelt das System sie als zwei Gruppen-Slots, von denen der Vorschlag einen wählt

#### Scenario: Bewusste Mehrfachwahl
- **WHEN** die Nutzerin zu einer Veranstaltungsart Termine zweier Gruppen-Slots gewählt hat und einen Vorschlag erzeugen lässt
- **THEN** bleiben beide Termine unverändert im Zwischenstand
