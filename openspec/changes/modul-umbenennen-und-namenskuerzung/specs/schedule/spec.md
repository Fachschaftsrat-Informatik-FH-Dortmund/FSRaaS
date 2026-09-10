## ADDED Requirements

### Requirement: Eigener Name je Modul

Das System muss der Nutzerin ermöglichen, einem Modul einen eigenen Namen zu geben und diesen wieder zu entfernen. Der Name gilt für alle Termine des Moduls, unabhängig von ihrer Veranstaltungsart, und gilt auch für Termine desselben Moduls, die erst später in den Plan gelangen. Er wird ausschließlich auf dem Gerät gehalten und an kein Ziel übertragen. Vordefinierte oder zentral gepflegte Namen gibt es nicht. Herkunft: Recherche: Gerätetest 2026-09-09 (Issue #68), Ausgestaltung entschieden 2026-09-11. Der ursprüngliche Vorschlag sah zentral gepflegte Standardwerte über die Verwaltungsoberfläche vor; er ist am 2026-09-11 zugunsten einer rein persönlichen Umbenennung verworfen worden — eine Abkürzung wie „AuD" ist eine persönliche Gewohnheit, keine Festlegung des Fachbereichs.

#### Scenario: Modul umbenennen
- **WHEN** die Nutzerin einem Modul den eigenen Namen „AuD" gibt
- **THEN** tragen alle Termine dieses Moduls diesen Namen, auch die anderer Veranstaltungsarten

#### Scenario: Später hinzukommender Termin
- **WHEN** die Nutzerin nach dem Umbenennen einen weiteren Termin desselben Moduls in den Plan aufnimmt
- **THEN** trägt auch dieser Termin den eigenen Namen

#### Scenario: Eigenen Namen entfernen
- **WHEN** die Nutzerin den eigenen Namen eines Moduls entfernt
- **THEN** erscheint wieder die offizielle Bezeichnung

### Requirement: Geltungsbereich des eigenen Namens

Das System muss den eigenen Namen eines Moduls ausschließlich in den Stundenplan-Kacheln der Wochenansicht anzeigen. Modulauswahl, Planungsmodus und Termindetail müssen durchgängig die offizielle Bezeichnung führen. Der Bedienweg zum Setzen und Entfernen des eigenen Namens sitzt im Termindetail, unterhalb der offiziellen Bezeichnung, und ist ohne Geste erreichbar. Herkunft: Recherche: Gerätetest 2026-09-09 (Issue #68), Ausgestaltung entschieden 2026-09-11. Der eigene Name löst ein Platzproblem der Kachel; dort, wo ausgewählt wird, muss die Bezeichnung mit Aushang und Prüfungsanmeldung zusammenpassen.

#### Scenario: Eigener Name in der Wochenansicht
- **WHEN** ein Modul einen eigenen Namen trägt und ein Termin in der Wochenansicht erscheint
- **THEN** zeigt das System den eigenen Namen in der Kachel

#### Scenario: Offizielle Bezeichnung in der Modulauswahl
- **WHEN** dasselbe Modul in der Modulauswahl oder im Planungsmodus erscheint
- **THEN** zeigt das System die offizielle Bezeichnung

#### Scenario: Bedienweg im Termindetail
- **WHEN** die Nutzerin das Termindetail eines offiziellen Termins öffnet
- **THEN** nennt das System die offizielle Bezeichnung und bietet darunter den Weg zum eigenen Namen an

### Requirement: Kürzung langer Veranstaltungsnamen unter Erhalt einer Endzahl

Wenn ein Veranstaltungsname nicht vollständig in seine Stundenplan-Kachel passt und auf eine Zahl endet, dann muss das System diese Zahl erhalten und stattdessen den Bereich davor kürzen. Endet der Name nicht auf eine Zahl, wird er am Ende gekürzt. Die Regel gilt für die Stundenplan-Kacheln und wirkt gleichermaßen auf die offizielle Bezeichnung und auf einen eigenen Namen. Herkunft: Recherche: Gerätetest 2026-09-09 (Issue #68), Ausgestaltung entschieden 2026-09-11. Bei verwandten Veranstaltungen trägt gerade die Endzahl die Unterscheidung: „Mathematik für Informatiker 1" und „Mathematik für Informatiker 2" sind am Ende gekürzt nicht mehr auseinanderzuhalten.

#### Scenario: Name mit Endzahl passt nicht
- **WHEN** der Name „Mathematik für Informatiker 1" breiter ist als seine Kachel
- **THEN** kürzt das System den Bereich vor der Zahl und zeigt die Zahl am Ende weiterhin an

#### Scenario: Name ohne Endzahl passt nicht
- **WHEN** der Name „Grundlagen der Betriebssysteme" breiter ist als seine Kachel
- **THEN** kürzt das System ihn am Ende

#### Scenario: Name passt vollständig
- **WHEN** der Name vollständig in seine Kachel passt
- **THEN** zeigt das System ihn unverändert und ungekürzt an
