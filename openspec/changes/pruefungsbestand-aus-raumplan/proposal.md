## Why

Roadmap-Schritt 6 verlangt den aus dem Raumplan abgeleiteten Prüfungsbestand
(Issue #29). Die Requirements dafür stehen seit 2026-09-06 in Capability
`backend-and-api`, der Vertrag beschreibt `/stundenplan/pruefungsplan` und
`/stundenplan/pruefungsplan/stand` — im Backend gibt es aber weder Erkennung
noch Bestand noch Endpunkt. Seit PR #144 liegt der Raumplan-Zwischenspeicher vor,
auf dessen Abrufweg sich der Prüfungsbestand stützt.

Ein Hindernis zeigt erst das Zusammensetzen: Der Zwischenspeicher reicht nur
28 Tage voraus. Prüfungen stehen im Median 55 Tage vor dem Termin im Raumplan,
und die Anmeldefrist endet rund sieben Wochen vor der ersten Prüfung
(INT-009-Spike). Ein Bestand aus dem 28-Tage-Fenster zeigte jede Prüfung erst,
wenn die Anmeldung längst vorbei ist. Damit ginge der Zweck verloren, für den
der Raumplan als Quelle gewählt wurde.

## What Changes

- **Eigener Abruf mit Vorlauf.** Ein zweiter periodischer Job ruft denselben
  Platzhalter-Aufruf `Room/*/AllEvents` (INT-009) mit einem Zeitraum von
  183 Tagen ab, alle sechs Stunden, und behält daraus nur die Prüfungseinträge.
  Für die Antwort gilt dieselbe Plausibilitätsprüfung wie beim
  Zwischenspeicher. Der 28-Tage-Zwischenspeicher bleibt unverändert.
- **Erkennung.** Ein Eintrag ist eine Prüfung, wenn sein Name mit dem Wort
  „Prüfung" oder „Prüfungen" beginnt. Modulnummer und Bezeichnung werden aus
  `Prüfung <Modulnummer> <Bezeichnung>` herausgelöst. Greift das Muster nicht,
  bleibt der Eintrag als Prüfung ohne Modulbezug im Bestand und der Vorfall wird
  protokolliert.
- **Ein Prüfungstermin je Prüfung, nicht je Raum.** Einträge derselben Prüfung
  in mehreren Räumen werden zusammengeführt, ebenso Räume, die nur im Namensfeld
  stehen. Findet sich kein Raum, bleibt die Raumliste leer und die Prüfung trotzdem
  im Bestand.
- **Unvollständigkeit wird offen ausgewiesen.** Jede Antwort trägt einen
  maschinenlesbaren Hinweis: abgeleitet aus dem Raumplan, nicht vollständig,
  gemessene Abdeckung 70 % (Stand 2026-09-07). Die App kann den Hinweis damit
  übersetzt anzeigen.
- **Änderungszeitpunkt.** Weicht ein neu abgeleiteter Bestand vom vorigen ab,
  setzt das Backend `geaendertAm` neu. Prüfungen, die nur deshalb wegfallen,
  weil ihr Termin vorüber ist, zählen dabei nicht als Abweichung.
- **Vertrag** (`api-contract.yaml` 0.7.1 → 0.8.0): `Pruefungstermin.roomId`
  wird zu `raeume` (Liste). Die Antwort von `/stundenplan/pruefungsplan` erhält
  das Pflichtfeld `vollstaendigkeit`. **BREAKING** für das Schema; es gibt aber
  noch keinen Konsumenten, weder in der App noch im Backend.
- Vor dem ersten erfolgreichen Abruf antwortet `/stundenplan/pruefungsplan`
  mit 503 statt mit einer leeren Liste; `/stand` liefert `geaendertAm: null`.

**Bewusst weggelassen (Nicht-Ziele):** die gesamte App-Seite. Dazu gehören:
- Auswahl aus dem Prüfungsbestand
- Suche nach Nachholprüfungen
- Kennzeichnung im Plan
- Anzeige des Vollständigkeitshinweises
- Benachrichtigung (Capability `schedule`, Requirements „Auswahl aus dem
  offiziellen Prüfungsplan" bis „Benachrichtigung bei
  Prüfungsplan-Aktualisierung")

Das ist ein eigener Bildschirm samt Speicherung und Abgleich, also kein kleiner
Zusatz, und am Stundenplan arbeiten gerade andere Sessions. Ebenfalls nicht
enthalten: Stundenplan-Raumabgleich (Requirements „Raumplan-Abgleich …"), Push.

## Capabilities

### New Capabilities

Keine.

### Modified Capabilities

- `backend-and-api`: Die folgenden Requirements werden geändert.
  - „Ableitung des Prüfungsbestands aus dem Raumplan" legt fest:
    - eigener Abruf mit Vorlauf
    - Erkennungsregel
    - Zusammenführung je Prüfung
    - Form des Unvollständigkeitshinweises
  - „Abruf des Prüfungsbestands" regelt den Zustand vor dem ersten Abruf und das
    Stand-Alter.
  - „Allgemeine Aktualisierungsmeldung bei geändertem Prüfungsplan" bestimmt, was
    als Abweichung zählt.
  - „Abfrage-Endpunkt für den Prüfungsplan-Änderungszeitpunkt" regelt den Wert
    vor dem ersten Abruf.

Die Entscheidung zur 70-%-Lücke (2026-09-10: hinnehmen und ausweisen, keine
Excel-Reaktivierung) steht bereits in der Spec. Dieser Change setzt sie um und
trifft sie nicht neu. `specs/product/roadmap.md` führt die Lücke in Abschnitt 5
noch als offene Folgeentscheidung; das wird nachgezogen.

## Impact

- `openspec/specs/api-contract.yaml`, erzeugte Typen (`tools/contract-codegen`,
  Ausgaben in Backend und App)
- `backend/src/Fb4.Backend/Infrastructure/Raumplan/`: neue Erkennung
  (`PruefungsErkennung`), neuer Abruf (`PruefungsbestandAbruf` samt Job); kleine
  Auslagerung von Zeitraum- und Abdeckungsprüfung aus `RaumplanAbruf` zur
  gemeinsamen Nutzung
- `backend/src/Fb4.Backend/Domain/`: neue Entitäten
  - `Pruefungstermin`
  - `PruefungsbestandStand`
- `Fb4DbContext` und neue EF-Migration
- `backend/src/Fb4.Backend/Endpoints/PruefungsplanEndpoints.cs` (neu),
  `Program.cs` (nur Registrierung ergänzt)
- Last auf INT-009: ein zusätzlicher Aufruf alle sechs Stunden über rund ein
  halbes Jahr. Laut Spike liefert ein ganzes Jahr knapp 10 000 Sätze.
- `specs/product/roadmap.md`: Abschnitt 5, Fassung und Datum
