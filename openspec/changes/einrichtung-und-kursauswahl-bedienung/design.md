## Context

Siehe `proposal.md` — Why. Der Weg Einrichtung → Modulauswahl → Planungsmodus
besteht bereits; dieser Change zieht einen Schritt heraus, verschiebt zwei
Bedienwege in die Kopfzeile und macht die Gruppenkennung verbindlich.

Der Bestand, auf dem aufgesetzt wird:

- `app/app/(tabs)/(schedule)/_layout.tsx` führt den Stapel; Routendateien sind
  reine Re-Exporte (SHELL-F-050).
- Kopfzeilen-Bedienwege eines Bildschirms, der außerhalb des Layouts liegt,
  laufen über ein Modulregister: `planungAktion.ts` und `modulauswahlAktion.ts`
  sind zwei Register derselben Bauart, gelesen von je einer `…Zugang`-
  Komponente im `headerRight`.
- `SetupScreen.tsx` trägt heute beides: die Endpunktauswahl und — darunter, nur
  sichtbar wenn mindestens ein Endpunkt gewählt ist — die Gruppenkennung samt
  Matrikelnummer-Weg, Entwurfsfeld und Trefferrückmeldung.
- `groupMatch.ts` beantwortet die Gruppenzugehörigkeit; sein erster Zweig
  (`if (!gruppenkennung) return true`) ist die Umsetzung der Anforderung, die
  dieser Change entfernt.
- `kursbaum.Modul` trägt seine Rohtermine (`termine`), der Modulschlüssel
  (`key`) wandert bereits als Routenparameter `module` von der Modulauswahl in
  den Planungsmodus.

## Goals / Non-Goals

**Goals:**

- Der Schritt zur Gruppenkennung wird ein eigener Bildschirm mit eigener Route,
  aus `SetupScreen` herausgelöst und nicht verdoppelt.
- Ein einziges Muster trägt den Weiter-Bedienweg aller drei Bildschirme.
- Die Pflicht der Gruppenkennung wird an jeder Stelle durchgesetzt, an der der
  Planungsmodus erreichbar ist — nicht nur am regulären Weg.

**Non-Goals:**

- Kein Umbau der Planungsmodus-Oberfläche selbst (Change `planungsmodus-anzeige`).
- Keine app-weite Vereinheitlichung der Bestätigungsdialoge
  (Change `bestaetigung-als-popup`) — die Rückfragen der Modulauswahl bleiben,
  wie sie sind.
- Kein Anfassen der Freitextsuche der Modulauswahl; die Spec verlangt die
  sichtbare Beschriftung allein für die Endpunktauswahl.

## Decisions

### 1. Eigene Route `/gruppenkennung` statt eines Abschnitts im Setup

Der Schritt bekommt `app/app/(tabs)/(schedule)/gruppenkennung.tsx` als
Re-Export und `app/src/areas/schedule/screens/GruppenkennungScreen.tsx` als
Bildschirm. Der Gruppenkennungs-Teil von `SetupScreen` zieht vollständig
dorthin um; im Setup bleibt allein die Endpunktauswahl.

*Alternative:* derselbe Bildschirm mit einem Schrittzähler. Verworfen — der
Stapel des Bereichs bildet Schritte bereits über Routen ab (`kurse`,
`planung`), und nur eine eigene Route lässt den Schritt aus der Wochenansicht
und aus dem Planungsmodus heraus gezielt anspringen, was die Pflicht-
Durchsetzung (Entscheidung 6) braucht.

### 2. Ein gemeinsames Register `weiterAktion.ts` für alle drei Kopfzeilen

Ein Register nach dem Muster von `modulauswahlAktion.ts`, mit einer Aktion
`{ freigegeben: boolean; weiter: () => void }`, gelesen von einer einzigen
Komponente `WeiterZugang.tsx` im `headerRight` von `einrichtung`, `kurse` und
`gruppenkennung`. Welcher Bildschirm gerade registriert hat, entscheidet der
Bildschirm selbst; das Register hält immer höchstens eine Aktion.

*Alternative:* drei Register derselben Bauart, wie es `planungAktion` und
`modulauswahlAktion` vormachen. Verworfen — dort tragen die Register
unterschiedliche Nutzlasten (Sicherungsstand, Verwerfen); hier ist die Nutzlast
dreimal dieselbe, und drei Kopien desselben Registers wären reine Verdopplung.
Dass zu jeder Zeit nur ein Bildschirm des Stapels vorn liegt, macht ein
gemeinsames Register ungefährlich: Beim Verlassen meldet der Bildschirm `null`.

### 3. Die Modulauswahl reicht über den Routenparameter weiter

`/kurse` übergibt die gewählten Modulschlüssel wie bisher als Parameter
`module` — künftig an `/gruppenkennung`, das ihn unverändert an `/planung`
weiterreicht. Damit bleibt die Modulauswahl weiterhin ein flüchtiger Stand, der
nichts schreibt (bestehender Non-Goal des Modulauswahl-Changes).

*Alternative:* die Auswahl in einem Modulspeicher ablegen. Verworfen — sie
würde einen Zwischenstand persistieren, den heute bewusst niemand persistiert.

### 4. Symbolwahl

`arrow-forward` für den Weiter-Bedienweg, `refresh` für das Zurücksetzen der
Modulauswahl (ersetzt das bisherige `close`). In der Kopfzeile der Modulauswahl
stehen beide nebeneinander und unterscheiden sich damit sichtbar, wie das
Requirement „Symbol für das Zurücksetzen der Auswahl" verlangt. Jedes Symbol
trägt weiterhin ein `accessibilityLabel` — die Bedeutung hängt nie am Bild
allein (UX-F-070).

### 5. `gruppenzugehoerig` wird auf eine gesetzte Kennung verengt

Der Zweig `if (!gruppenkennung) return true` entfällt, und der Parameter wird
von `string | null | undefined` auf `string` verengt. Die Verengung ist der
eigentliche Wert: Sie macht jede Stelle sichtbar, die heute noch ohne Kennung
rechnet, statt sie stillschweigend auf „alles zugehörig" laufen zu lassen.
Betroffen sind `alternativen.alternativenDesTages` (Parameter ebenfalls
verengt, Aufrufer in der Wochenansicht prüft vorher) und `PlanungScreen`
(Wächter nach Entscheidung 6).

*Alternative:* den Parameter weit lassen und nur den Zweig entfernen. Verworfen
— dann liefe `parseGruppenkennung(null)` in den Rückfall „unbekanntes Muster"
und protokollierte einen Fehler bei einem Zustand, den es nicht mehr geben darf.

### 6. Die Pflicht wird an drei Stellen durchgesetzt

Der Planungsmodus ist auf drei Wegen erreichbar; alle drei tragen dieselbe
Prüfung:

1. **Kopfzeilen-Weg des Schritts zur Gruppenkennung.** Der Bedienweg bleibt
   bedienbar; ohne gesetzte Kennung navigiert er nicht, sondern zeigt einen
   Hinweis, der die fehlende Angabe benennt (Szenario „Weitergehen ohne
   Kennung": verwehren *und* benennen — eine abgeblendete Schaltfläche
   verwehrte, benennte aber nichts).
2. **`PlanungScreen` selbst.** Ohne gesetzte Kennung zeigt er statt des
   Planungsmodus einen Leerzustand mit dem Weg auf den Schritt zur
   Gruppenkennung. Das deckt den Tiefeneinstieg ab und ist zugleich die
   Typverengung aus Entscheidung 5.
3. **Wochenansicht beim Öffnen.** Liegen Planeinträge vor und ist keine Kennung
   gesetzt, kann der Stand nur aus einer früheren Fassung der App stammen — die
   neue Reihenfolge lässt ihn nicht mehr entstehen. Die Wochenansicht führt
   dann einmalig je Aufbau auf `/gruppenkennung` und rührt die Einträge nicht an
   (Requirement „Kein selbsttätiges Entfernen des Stundenplans").

Der Bedienweg „Gruppenkennung entfernen" entfällt ersatzlos, und
`setGruppenkennung` nimmt kein `null` mehr an. Eine leer geräumte Eingabe
lässt die gespeicherte Kennung künftig stehen, statt sie zu löschen. Allein
`clear()` — die Aktion „Stundenplan zurücksetzen" — entfernt sie weiterhin
zusammen mit den Endpunkten.

### 7. Sichtbare Beschriftung statt Platzhalter

Das Suchfeld der Endpunktauswahl bekommt eine Beschriftung als eigenes
`Text`-Element über dem Feld; der Platzhalter bleibt zusätzlich stehen. Nur so
bleibt die Beschriftung sichtbar, wenn bereits Text eingegeben ist — genau der
Fall, den das Szenario „Beschriftung bei gefülltem Feld" prüft.

### 8. Die Rückmeldung zählt gegen die Termine der gewählten Module

Der Schritt zur Gruppenkennung baut aus dem Auswahlbestand der gewählten
Endpunkte wie die Modulauswahl die Modulliste (`baueModulliste`), behält die
Module, deren `key` im Routenparameter `module` steht, und zählt
`zaehleGruppenTreffer` über deren `termine`. `zaehleGruppenTreffer` selbst
bleibt unverändert — die Bezugsmenge entscheidet der Aufrufer, nicht die
Funktion.

Wird der Schritt ohne Parameter erreicht (nachträgliche Änderung über den
Zugang zur Einrichtung), gibt es keine gewählten Module und damit keine
Bezugsmenge; die Rückmeldung entfällt dann, statt auf den gesamten
Auswahlbestand auszuweichen — das wäre genau die Zahl, die dieser Change
abschafft.

## Risks / Trade-offs

- **Bestehende Tests schreiben den entfallenden Zustand fest** → `groupMatch.test.ts`
  (Tabellenfall `kennung: null`, `describe('SCHED-F-050 …')`, Zählfall ohne
  Kennung) und `SetupScreen.test.tsx` („ohne Gruppenkennung fortsetzen") werden
  im selben Schnitt entfernt beziehungsweise umgeschrieben, nicht übersprungen.
- **Die Weiterleitung beim Öffnen der Wochenansicht kann überraschen** → Sie
  greift nur, wenn Planeinträge vorliegen *und* keine Kennung gesetzt ist, und
  nur einmal je Aufbau der Ansicht. Ein neu eingerichteter Plan erfüllt die
  Bedingung nie, weil die neue Reihenfolge die Kennung vor den ersten
  Planeintrag setzt.
- **Ein gemeinsames Register für drei Bildschirme** → Meldet ein Bildschirm beim
  Verlassen nicht ab, zeigte die Kopfzeile einen fremden Weiter-Weg. Die
  Abmeldung sitzt deshalb in der Aufräumfunktion desselben `useEffect`, der
  registriert, wie bei `modulauswahlAktion`.
- **Die Kennung lässt sich nur noch ersetzen, nicht entfernen** → gewollt und
  vom Requirement getragen; wer wirklich von vorn anfangen will, nimmt
  „Stundenplan zurücksetzen" im Verwaltungsblatt.
