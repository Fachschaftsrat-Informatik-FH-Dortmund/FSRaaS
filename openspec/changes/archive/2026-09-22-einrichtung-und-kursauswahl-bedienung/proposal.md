## Why

Der Gerätetest vom 2026-09-09 zum Change `stundenplan-bedienung-ohne-vormerkung`
hat den Weg von der Einrichtung über die Kursauswahl in den Planungsmodus
durchgespielt und dabei Punkte gesammelt, die außerhalb des Umfangs jenes
Changes lagen (Issue #68, Beschreibungsteil). Sie betreffen alle denselben
Weg: wo der nächste Schritt steht, ob das Suchfeld beschriftet ist, und ab
wann die Gruppenkennung feststeht.

Der letzte Punkt ist mehr als Gestaltung. Die Gruppenkennung steht heute
mitten in der Einrichtung, noch bevor die Nutzerin ihre Module kennt, und
ist überspringbar. Wer sie überspringt, bekommt einen Plan, in dem die
Gruppenzuordnung — die eigentliche fachliche Leistung dieses Bereichs, mit
belegten Fehlern in beiden Alt-Apps — wirkungslos bleibt.

## What Changes

- **Nächster Schritt oben statt unten.** In der Einrichtung, in der
  Kursauswahl und auf der neuen Seite für die Gruppenkennung steht der
  Weiter-Bedienweg als Symbol in der Kopfzeile rechts oben, nicht als
  Schaltfläche am Seitenende.
- **Beschriftetes Suchfeld.** Die Freitextsuche der Endpunktauswahl trägt
  eine sichtbare Beschriftung, nicht nur einen Platzhaltertext.
- **Aussagekräftiges Symbol für das Zurücksetzen.** Der Bedienweg
  „Auswahl zurücksetzen" in der Kursauswahl trägt ein Symbol, das das
  Zurücksetzen bezeichnet.
- **Die Gruppenkennung wird Pflicht** und ist nicht überspringbar. Damit
  entfällt der Zustand „keine Gruppenkennung angegeben" und mit ihm das
  Requirement „Alle Termine ohne Gruppenkennung" (**BREAKING** gegenüber dem
  bisherigen Bestand). Eine gesetzte Kennung lässt sich ersetzen, aber nicht
  mehr ersatzlos entfernen; ein Plan aus einer früheren Fassung der App ohne
  Kennung bleibt erhalten und führt beim Öffnen auf die neue Seite. Die
  Freiheit, auch gruppenfremde Termine zu sehen, geht dabei nicht verloren:
  Sie hängt nicht an der fehlenden Kennung, sondern am Requirement
  „Kennzeichnung gruppenfremder Termine statt Entfernen", das eine gesetzte
  Kennung ausdrücklich nur kennzeichnen und nie filtern lässt.
- **Eigene Seite für die Gruppenkennung**, nach der Modulauswahl und vor dem
  Planungsmodus. Beide Wege ziehen dorthin um — die Ermittlung über die
  Matrikelnummer (INT-019) und die Eingabe von Hand. Die Einrichtung trägt
  danach allein die Wahl der Endpunkte.
- **Rückmeldung gegen die gewählten Module.** Die Rückmeldung „x von N
  Terminen" während der Eingabe zählt künftig nur die Termine der gewählten
  Module, nicht mehr den gesamten Auswahlbestand aller gewählten Endpunkte.
  Erst der Ortswechsel hinter die Modulauswahl macht diese Bezugsmenge
  möglich; die Zahl sagt dann etwas über den eigenen Plan aus.

## Capabilities

### New Capabilities

Keine.

### Modified Capabilities

- `schedule`: Vier Requirements kommen hinzu (Kopfzeilen-Bedienweg für den
  nächsten Schritt, Symbol für das Zurücksetzen, eigener Schritt für die
  Gruppenkennung, Pflicht der Gruppenkennung). Vier ändern sich
  („Freitextsuche in der Endpunktauswahl" um die Beschriftung,
  „Gruppenkennung ohne Matrikelnummer" um den neuen Ort, „Rückmeldung
  während der Eingabe der Gruppenkennung" um die Bezugsmenge, „Gliederung
  des Auswahlbestands" um den dazwischenliegenden Schritt), eines entfällt
  („Alle Termine ohne Gruppenkennung").

## Impact

**Roadmap:** Schritt 5 (Stundenplan), Etappen 2 und 5 — Nacharbeit an
bereits geliefertem Code, kein neuer Schnitt.

**Betroffener Code** (vor der Umsetzung vollständig zu prüfen):

- `app/src/areas/schedule/screens/SetupScreen.tsx` — Endpunktauswahl, Suche,
  heutiger Ort der Gruppenkennung samt Rückmeldung (zählt heute gegen alle
  Termine der gewählten Endpunkte) und Bedienweg „Gruppenkennung entfernen"
- `app/src/areas/schedule/screens/CourseSelectionScreen.tsx` — Weiter-Weg und
  Zurücksetzen
- `app/app/(tabs)/(schedule)/_layout.tsx` — Kopfzeile; dort sitzen bereits die
  Register `modulauswahlAktion.ts` und `planungAktion.ts`, das Muster trägt
  auch den Weiter-Bedienweg
- neue Route und neuer Bildschirm für die Gruppenkennung
- `app/src/areas/schedule/einrichtung.ts` — Ablaufzustand der Einrichtung
- `app/src/areas/schedule/groupMatch.ts` — der Zweig „keine Kennung gesetzt"
  entfällt
- Tests, die den entfallenden Zustand festschreiben: `groupMatch.test.ts`
  (Tabellenfall `kennung: null`, `describe('SCHED-F-050 …')`, Zählfall ohne
  Kennung) und `SetupScreen.test.tsx` („ohne Gruppenkennung fortsetzen")

**Prosa der Haupt-Spec, die das Archivieren nicht nachzieht:**
`openspec archive` übernimmt nur Requirements. In
`openspec/specs/schedule/spec.md` verweisen außerhalb davon noch Stellen auf
den entfallenden Zustand ohne Kennung; sie sind in diesem Change von Hand zu
berichtigen:

- Erläuterungen, Beispieltabelle Gruppenzuordnung — die Zeile
  `(keine) | C8 | ja` entfällt; die Capability `quality-and-testing` knüpft
  Pflichttests an diese Tabelle
- Akzeptanzkriterien, erster Punkt — „keine Gruppenkennung" aus der
  Aufzählung streichen
- UI-Flows & Zustände — neue Zeile für einen Plan aus einer früheren Fassung
  ohne Gruppenkennung
- Entfallene Anforderungen (historisch) — Eintrag „Ehemals SCHED-F-050" mit
  ursprünglichem Text, Status und Grund, wie bei den übrigen entfallenen
  Anforderungen

**Erfüllte Voraussetzung:** Der Kopfzeilen-Bedienweg und das Symbol für das
Zurücksetzen setzen voraus, dass die Symbole der App überhaupt erscheinen.
Der Change `vector-icons-native-migration` ist am 2026-09-10 archiviert; die
Voraussetzung ist damit erfüllt und beim Gerätetest zu bestätigen.

**Bewusst nicht in diesem Schnitt:** die Punkte des Planungsmodus (Change
`planungsmodus-anzeige`), das Umbenennen und die Namenskürzung (Change
`modul-umbenennen-und-namenskuerzung`), die Einblendung nicht gewählter
Veranstaltungen (Change `alle-veranstaltungen-einblenden`) und die
app-weite Form der Bestätigungsdialoge (Change `bestaetigung-als-popup`).
