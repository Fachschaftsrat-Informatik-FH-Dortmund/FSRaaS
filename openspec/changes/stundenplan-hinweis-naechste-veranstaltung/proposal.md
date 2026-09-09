## Why

Der Change `stundenplan-wochenansicht-nutzerfuehrung` hat das Requirement „Kennzeichnung eines leeren Wochentags" so gefasst, dass der Leerzustand den Gültigkeitszeitraum als Grund nennt, wenn alle Termine eines Tages außerhalb ihres Zeitraums liegen — aber nicht, wann es wieder Termine gibt. Trifft dieser Grund auf jeden Wochentag der aktuell angezeigten Woche zu — etwa weil der persönliche Plan noch Kurse eines bereits beendeten Semesters enthält und INT-002 die Termine des Folgesemesters noch nicht liefert —, bleibt die gesamte Woche leer, ohne dass die Nutzerin erkennen kann, ob das ein vorübergehender Zustand ist und wann er endet. Das Wischen in andere Wochen (Requirement „Tageswechsel durch Wischen") hilft dabei nicht: Solange keine gültigen Termine bekannt sind, bleibt jede Woche gleich leer.

## What Changes

- Der Leerzustand eines Wochentags nennt zusätzlich das Datum der nächsten im persönlichen Plan bekannten, gültigen Veranstaltung — ermittelt über alle `PlanEntry`, nicht nur die des angezeigten Tages.
- Ist keine zukünftige gültige Veranstaltung bekannt (leerer Plan oder alle bekannten Zeiträume liegen in der Vergangenheit), muss das System das ausdrücklich so benennen, statt den Hinweis wegzulassen.
- Kein neuer Bedienweg, keine neue Datenquelle — reine Auswertung der bereits vorhandenen `PlanEntry.gueltigVon`/`gueltigBis` (Requirement „Gültigkeitszeitraum je Eintrag änderbar").

## Capabilities

### New Capabilities

Keine.

### Modified Capabilities

- `schedule`: Requirement „Kennzeichnung eines leeren Wochentags" erhält im Fall des Gültigkeitszeitraum-Grundes einen zusätzlichen Hinweis auf die nächste bekannte gültige Veranstaltung (oder deren Fehlen).

## Impact

- `app/src/areas/schedule/wochenansicht.ts`: neue Hilfsfunktion, die über alle `PlanEntry` die nächstliegende künftig gültige Instanz ermittelt (Datum, nicht nur Wochentag — eine wöchentliche Veranstaltung mit künftigem `gueltigVon` kann mehrere Wochen entfernt liegen); `leerGrund`/dessen Aufrufstelle liefert dieses Datum zusätzlich mit.
- `app/src/areas/schedule/screens/ScheduleScreen.tsx`: zeigt den Hinweis im bestehenden Leerzustand-Text des Gültigkeitszeitraum-Falls an, inklusive des Falls „keine bekannt".
- Übersetzungen (Deutsch/Englisch, NFR-F-115): neue Textbausteine für „nächste Veranstaltung am …" und „keine weitere Veranstaltung bekannt".
- Keine Änderung an INT-002, am Vertrag oder an gespeicherten Daten.

## Roadmap-Zuordnung

Roadmap-Schritt 5 (Stundenplan), Etappe „Plan" — Nacharbeit am selben Requirement „Kennzeichnung eines leeren Wochentags" wie `stundenplan-wochenansicht-nutzerfuehrung`, ausgelöst durch eine beim Testen (2026-09-09) beobachtete Lücke in dessen Leerzustand. Setzt diesen Change voraus (das Requirement und `leerGrund` müssen bestehen).
