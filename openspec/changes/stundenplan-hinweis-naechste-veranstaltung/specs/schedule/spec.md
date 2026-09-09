## MODIFIED Requirements

### Requirement: Kennzeichnung eines leeren Wochentags

Falls an einem Wochentag kein Termin dargestellt wird, muss das System diesen Tag als leer kennzeichnen. Liegt der Grund darin, dass alle Termine des Tages außerhalb ihres Gültigkeitszeitraums liegen, muss das System diesen Grund nennen und zusätzlich das Datum der nächsten im persönlichen Plan bekannten, gültigen Veranstaltung ausweisen — ermittelt über den gesamten Plan, nicht nur den angezeigten Tag oder die angezeigte Woche. Ist keine solche künftige Veranstaltung bekannt, muss das System das ausdrücklich benennen, statt den Hinweis wegzulassen. Liegt am Tag ohnehin kein Termin, darf das System keinen Grund und keinen Hinweis auf eine nächste Veranstaltung behaupten. Herkunft: NEU, entschieden 2026-09-09. Erweitert das Requirement „Kennzeichnung eines leeren Wochentags" aus dem Change `stundenplan-wochenansicht-nutzerfuehrung` (dort entschieden 2026-09-08, vormals SCHED-F-100 als „Leerer Tag bei wirksamem Filter"): Der bisherige Grund allein ließ offen, ob und wann sich die Lage ändert — eine Woche, die vollständig aus diesem Grund leer ist, blieb es beim Blättern in jede Richtung, solange keine gültigen Termine bekannt sind (z. B. weil der Plan noch Kurse eines beendeten Semesters enthält und INT-002 die Termine des Folgesemesters noch nicht liefert). Der Zweck bleibt derselbe: Ein leerer Tag darf nicht wie ein Fehler aussehen, und eine Veranstaltung darf nicht ohne Erklärung verschwinden.

#### Scenario: Gültigkeitszeitraum leert den Tag, nächste Veranstaltung bekannt
- **WHEN** an einem Wochentag alle Termine außerhalb ihres Gültigkeitszeitraums liegen und der Plan mindestens eine künftig gültige Veranstaltung enthält
- **THEN** kennzeichnet das System den Tag als leer, nennt den Gültigkeitszeitraum als Grund und zeigt das Datum der nächsten bekannten gültigen Veranstaltung

#### Scenario: Gültigkeitszeitraum leert den Tag, keine künftige Veranstaltung bekannt
- **WHEN** an einem Wochentag alle Termine außerhalb ihres Gültigkeitszeitraums liegen und keine Veranstaltung im Plan einen künftig gültigen Zeitpunkt hat
- **THEN** kennzeichnet das System den Tag als leer, nennt den Gültigkeitszeitraum als Grund und benennt ausdrücklich, dass keine weitere Veranstaltung bekannt ist

#### Scenario: Tag ohne Termine
- **WHEN** an einem Wochentag von vornherein kein Termin im Plan steht
- **THEN** kennzeichnet das System den Tag als leer, ohne einen Grund oder eine nächste Veranstaltung zu behaupten
