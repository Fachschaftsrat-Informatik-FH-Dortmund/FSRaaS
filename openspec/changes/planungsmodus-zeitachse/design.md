## Context

`PlanungScreen.tsx` zeigt je Wochentag die Zeilen der gewählten Module
(`{ modul, termin }`) als Liste, aufsteigend nach Beginnzeit. Die
Wochenansicht hat bereits eine proportionale Zeitachse mit
Nebeneinanderdarstellung (`dayLayout.layoutTag`, Darstellung in
`ScheduleScreen.tsx`, 1,5 dp je Minute, Lücken unter 15 Minuten ohne
Beschriftung, über 60 Minuten auf Stundenhöhe gestaucht). Sie arbeitet auf
Planeinträgen (`PlanEntry`), nicht auf Rohterminen. An ihr arbeitet parallel
der Change `alle-veranstaltungen-einblenden`.

Im Planungsmodus ist die Lage eine andere als in der Wochenansicht: Dort
überschneiden sich selten mehr als zwei Einträge. Hier stehen alle
Gruppen-Slots aller gewählten Module nebeneinander, vier oder mehr parallele
Termine sind der Normalfall.

## Goals / Non-Goals

**Goals:** parallele von aufeinanderfolgenden Terminen auf einen Blick
unterscheidbar machen; Wahl in beiden Darstellungen; nichts verbergen;
barrierefrei.

**Non-Goals:** Wochenübersicht über fünf Tage, Anpinnen in der Kachel,
Umbau der Zeitachse der Wochenansicht.

## Decisions

### 1. Eigene reine Layoutfunktion `planungZeitachse.ts`

`legePlanungsTagAus(zeilen)` nimmt beliebige Elemente mit `timeBeginMin`
und `timeEndMin` und liefert dieselbe Struktur wie die Wochenansicht:
Abschnitte `belegt` (mit Spaltenzuordnung) und `luecke` (mit echter und
dargestellter Dauer). Zusätzlich zählt sie je Element, mit wie vielen
anderen es sich **unmittelbar** überschneidet. Die Spaltenzahl eines
Abschnitts reicht dafür nicht, weil eine Überschneidungsgruppe transitiv ist:
A überschneidet B, B überschneidet C, A und C aber nicht.

Spaltenvergabe, Gruppierung und Lückenschwellen folgen `dayLayout.ts`
(gleicher Algorithmus, gleiche Konstanten), damit beide Achsen gleich lesen.

*Verworfen:* `dayLayout.layoutTag` generisch machen. Die Funktion und ihr
Ergebnistyp (`TerminSlot.entry: PlanEntry`) hängen an `typen.ts` und an der
Wochenansicht, die gerade parallel umgebaut wird. Eine gemeinsame
Verallgemeinerung ist ein eigener Schritt, sobald beide Changes gemergt
sind; bis dahin sind die zwei Funktionen klein genug, um die Doppelung zu
tragen.

### 2. Maßstab und Lücken wie in der Wochenansicht

1,5 dp je Minute, Lücken mit Beschriftung „… frei" und denselben
Textschlüsseln. Ein 90-Minuten-Termin ist 135 dp hoch, ein 30-Minuten-Termin
45 dp; die Mindestgröße von 44 dp für Tippziele ist damit für alle Termine ab
30 Minuten erfüllt. Kürzere Termine kennt der FBWS-Bestand im Planungsmodus
praktisch nicht. Eine Mindesthöhe, die kurze Termine streckt, wurde
verworfen: Sie würde genau die Überschneidungen vortäuschen, die die
Zeitachse sichtbar machen soll.

### 3. Mindestbreite je Spalte, seitliches Verschieben statt Stauchen

Jede Spalte ist mindestens 120 dp breit. Ist die größte Spaltenzahl des Tages
mal 120 dp breiter als der verfügbare Platz, wird die Achse entsprechend
breiter und liegt in einer waagerechten `ScrollView`. Sonst füllt sie die
Breite. So bleibt jede Kachel lesbar (Uhrzeit, zweizeiliger Name, Art und
Gruppe), und kein Termin wird überdeckt.

*Verworfen:* auf die Bildschirmbreite stauchen wie in der Wochenansicht. Bei
sechs parallelen Übungsgruppen blieben je Kachel rund 60 dp, für Name und
Gruppe zu wenig. Ebenfalls verworfen: eine Obergrenze mit „+n weitere", weil
das Requirement nichts verbergen darf (wie „Nebeneinanderdarstellung
überschneidender Termine").

### 4. Kachel: dieselben Kennzeichnungen, dieselbe Wahl

Eine Kachel ist ein `Pressable` mit `accessibilityRole="checkbox"` und ruft
denselben Umschalter wie die Listenzeile. Sie trägt:

- Uhrzeit, Name (höchstens zwei Zeilen), Veranstaltungsart und Gruppe,
- ☑/☐ und die farbige Umrandung für „gewählt" (Requirement „Kennzeichnung
  gewählter Termine im Planungsmodus"),
- ⚠ für „kollidiert" und die Hintergrundfarben der einstellbaren
  Hervorhebung wie die Listenzeile,
- ein Pin-Symbol, wenn der Termin angepinnt ist (nur Anzeige, siehe
  proposal.md).

Die Beschriftung für Hilfstechnologien lautet wie in der Liste und hängt die
Zahl der Überschneidungen an („überschneidet sich mit 2 Terminen"). Damit
trägt die Zeitachse ihre eigentliche Aussage auch ohne Sicht.

### 5. Umschalter in der Werkzeugzeile, gespeichert in den Planungseinstellungen

Am Ende der Werkzeugzeile sitzt eine 44 × 44 dp große Schaltfläche mit
`accessibilityRole="switch"` und Beschriftung „Zeitachse". Das Symbol zeigt
die jeweils andere Darstellung (`time-outline` in der Liste, `list-outline`
in der Zeitachse); der Zustand steht zusätzlich in `accessibilityState`.
Gespeichert wird er als `zeitachse: boolean` im Speicher der
Planungseinstellungen, Vorgabe `false` (Liste).

*Verworfen:* die bestehende Ansichtseinstellung `zeitachse` der Wochenansicht
mitzubenutzen. Sie schaltet dort die proportionale Achse zugunsten einer
kompakten Liste ab (Requirement „Abschalten der proportionalen Zeitachse")
und gilt für einen anderen Bildschirm mit anderem Zweck; wer die Woche
kompakt sehen will, kann beim Planen trotzdem die Achse brauchen.

### 6. Sprung aus der Leiste der ausstehenden Veranstaltungen

Der Sprung (Requirement „Leiste der ausstehenden Veranstaltungen") meldet in
der Zeitachse die berechnete obere Kante der Kachel als Position; Scrollen
und kurzzeitige Hervorhebung funktionieren damit unverändert.

## Risks / Trade-offs

- **Doppelte Layoutlogik** neben `dayLayout.ts` (Entscheidung 1). Gemindert
  durch gleiche Konstanten und gleiche Tests; Zusammenführung als
  Folgeschritt.
- **Zwei Richtungen zu scrollen.** Bei sehr vielen parallelen Terminen
  scrollt die Achse senkrecht und waagerecht. Die Geräteabnahme muss zeigen,
  ob das am Pixel 9 Pro bedienbar bleibt.
- **Werkzeugzeile wird enger.** Die drei bestehenden Schaltflächen teilen
  sich die Breite abzüglich 44 dp.
