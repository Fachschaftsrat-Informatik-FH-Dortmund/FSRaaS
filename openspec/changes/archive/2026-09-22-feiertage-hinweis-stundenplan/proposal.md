## Why

Der INT-009-Spike (`2026-09-10-int-009-spike-befund`) hat belegt, dass der Raumplan gesetzliche Feiertage nicht abbildet — er führt Pfingstmontag und Fronleichnam 2026 mit exakt so vielen Kursinstanzen wie den jeweils folgenden Wochentag. Die sechs Raumabgleich-Requirements (`schedule`, vormals SCHED-F-410 bis F-450) bleiben deshalb bewusst unverändert; sie können einen kalendarisch feststehenden Ausfall nicht erkennen, weil ihre einzige Quelle (INT-009) ihn nicht zeigt.

Das beantwortet die seit 2026-09-04 in `schedule/spec.md` offene Frage teilweise: „Vorlesungsfreie Einzeltage und Feiertage liefert derzeit keine Quelle." Für gesetzliche Feiertage gibt es tatsächlich eine Quelle, die keine Pflege braucht — sie sind für ein Bundesland vollständig algorithmisch bestimmbar (Osterformel plus feste Kalendertage). Die dort ursprünglich erwogene „vom FSR gepflegte Liste" hätte dieselbe jährlich-wechselnde Freiwilligen-Abhängigkeit reproduziert, die dieses Projekt beim Prüfungsplan-Excel-Import gerade erst abgeschafft hat (Entscheidung 2026-09-06).

Rücksprache FSR FB4, 2026-09-10: Ein Feiertags-Hinweis im Stundenplan soll umgesetzt werden, ausdrücklich nur für gesetzliche Feiertage — vorlesungsfreie Einzeltage (z. B. Rosenmontag, Brückentage) und Semesterferien bleiben eine separate, weiterhin offene Frage; für sie kommt keine berechenbare Quelle infrage, sondern allenfalls künftig eine vom Backend gepflegte Angabe (z. B. aus den Fristen- und Termine-Seiten der FH Dortmund), die dieser Change bewusst nicht mitliefert.

## What Changes

- Neue Anforderung in `schedule`: Das System zeigt an einem Stundenplan-Termin, der auf einen gesetzlichen Feiertag in Nordrhein-Westfalen fällt, einen Hinweis, dass die Veranstaltung an diesem Tag voraussichtlich entfällt.
- Die Feiertage werden **algorithmisch berechnet**, nicht aus einer Liste oder einem Fremdsystem bezogen — keine neue Abhängigkeit, kein Registereintrag in `integrations/spec.md` nötig, da kein externer Aufruf stattfindet.
- Der Hinweis ist von den sechs bestehenden Raumabgleich-Requirements (vormals SCHED-F-410 bis F-450) unabhängig: andere Quelle (Kalenderberechnung statt INT-009), andere Bedingung (Datum statt Abgleich gegen den Raumplan-Zwischenspeicher).
- Ausdrücklich nicht Teil dieses Changes: vorlesungsfreie Einzeltage, Brückentage, Semesterferien — die offene Frage aus `schedule/spec.md` bleibt dafür bestehen.

## Capabilities

### New Capabilities

(keine)

### Modified Capabilities

- `schedule`: neue Anforderung „Hinweis auf gesetzlichen Feiertag", eingeordnet bei den bestehenden Raumabgleich-Requirements; die offene Frage zu Feiertagen/vorlesungsfreien Tagen wird auf den verbliebenen Teil (vorlesungsfreie Einzeltage) präzisiert.

## Impact

Betrifft ausschließlich die App (Capability `schedule`), reine Client-Logik ohne Backend- oder Vertragsänderung — die Berechnung braucht keinen Netzzugriff. Roadmap-Schritt 6, dieselbe Etappe wie der Stundenplan-Raumabgleich, dem dieser Change fachlich benachbart ist.
