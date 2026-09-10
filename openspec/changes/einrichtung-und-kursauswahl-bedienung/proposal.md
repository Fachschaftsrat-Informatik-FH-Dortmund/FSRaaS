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

- **Nächster Schritt oben statt unten.** In der Einrichtung und in der
  Kursauswahl steht der Weiter-Bedienweg als Symbol in der Kopfzeile rechts
  oben, nicht als Schaltfläche am Seitenende.
- **Beschriftetes Suchfeld.** Die Freitextsuche der Endpunktauswahl trägt
  eine sichtbare Beschriftung, nicht nur einen Platzhaltertext.
- **Aussagekräftiges Symbol für das Zurücksetzen.** Der Bedienweg
  „Auswahl zurücksetzen" in der Kursauswahl trägt ein Symbol, das das
  Zurücksetzen bezeichnet.
- **Die Gruppenkennung wird Pflicht** und ist nicht überspringbar. Damit
  entfällt der Zustand „keine Gruppenkennung angegeben" und mit ihm das
  Requirement „Alle Termine ohne Gruppenkennung" (**BREAKING** gegenüber dem
  bisherigen Bestand). Die Freiheit, auch gruppenfremde Termine zu sehen,
  geht dabei nicht verloren: Sie hängt nicht an der fehlenden Kennung,
  sondern am Requirement „Kennzeichnung gruppenfremder Termine statt
  Entfernen", das eine gesetzte Kennung ausdrücklich nur kennzeichnen und
  nie filtern lässt.
- **Eigene Seite für die Gruppenkennung**, nach der Modulauswahl und vor dem
  Planungsmodus. Beide Wege ziehen dorthin um — die Ermittlung über die
  Matrikelnummer (INT-019) und die Eingabe von Hand. Die Einrichtung trägt
  danach allein die Wahl der Endpunkte. Der Ortswechsel bringt einen
  fachlichen Gewinn: Die Rückmeldung „x von N Terminen" während der Eingabe
  bezieht sich erst hier auf einen Bestand, den die Nutzerin selbst gewählt
  hat, und wird dadurch aussagekräftig.

## Capabilities

### New Capabilities

Keine.

### Modified Capabilities

- `schedule`: Vier Requirements kommen hinzu (Kopfzeilen-Bedienweg für den
  nächsten Schritt, beschriftete Suche, Symbol für das Zurücksetzen, eigene
  Seite für die Gruppenkennung samt Pflicht). Zwei ändern sich („Freitextsuche
  in der Endpunktauswahl", „Gruppenkennung ohne Matrikelnummer"), eines
  entfällt („Alle Termine ohne Gruppenkennung").

## Impact

**Roadmap:** Schritt 5 (Stundenplan), Etappen 2 und 5 — Nacharbeit an
bereits geliefertem Code, kein neuer Schnitt.

**Betroffener Code** (vor der Umsetzung vollständig zu prüfen):

- `app/src/areas/schedule/screens/SetupScreen.tsx` — Endpunktauswahl, Suche,
  heutiger Ort der Gruppenkennung
- `app/src/areas/schedule/screens/CourseSelectionScreen.tsx` — Weiter-Weg und
  Zurücksetzen
- `app/app/(tabs)/(schedule)/_layout.tsx` — Kopfzeile; dort sitzen bereits die
  Register `modulauswahlAktion.ts` und `planungAktion.ts`, das Muster trägt
  auch den Weiter-Bedienweg
- neue Route und neuer Bildschirm für die Gruppenkennung
- `app/src/areas/schedule/einrichtung.ts` — Ablaufzustand der Einrichtung
- `app/src/areas/schedule/groupMatch.ts` — der Zweig „keine Kennung gesetzt"
  entfällt

**Abhängigkeit:** Der Kopfzeilen-Bedienweg und das Symbol für das
Zurücksetzen sind erst am Gerät abnehmbar, wenn der Change
`vector-icons-native-migration` gelaufen ist — bis dahin erscheint in der App
kein Symbol.

**Bewusst nicht in diesem Schnitt:** die Punkte des Planungsmodus (Change
`planungsmodus-anzeige`), das Umbenennen und die Namenskürzung (Change
`modul-umbenennen-und-namenskuerzung`), die Einblendung nicht gewählter
Veranstaltungen (Change `alle-veranstaltungen-einblenden`) und die
app-weite Form der Bestätigungsdialoge (Change `bestaetigung-als-popup`).
