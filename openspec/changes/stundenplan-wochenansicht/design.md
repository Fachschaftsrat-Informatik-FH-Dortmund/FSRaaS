# Entwurf: Wochenansicht des Stundenplans

## Ausgangslage

Begründung siehe `proposal.md`, Abschnitt „Warum". Für den Entwurf zählt allein der Zustand des Bereichs:

Die Logikschicht unter `app/src/areas/schedule/` ist vollständig und getestet, aber unbenutzt. Sechs Module werden von keinem Bildschirm und keiner Route importiert:

```
   dayLayout.ts        Spalten bei Ueberschneidung, Luecken je Tag
   jetzt.ts            laufender + naechster Termin, verbleibende Zeit
   wochenrechnung.ts   Wochenverschiebung, Gueltigkeitszeitraum,
                       vorlesungsfreie Woche, Zielwochentag
   wochentage.ts       sichtbare Wochentage, Belegungsvorschau
   ansichtEinstellungen.ts   drei Filter-/Darstellungsflags
   semesterwechsel.ts  Hinweis bei Semesterwechsel
```

Alle sind reine Funktionen ohne React-Bindung; `dayLayout` liefert bewusst `DaySlot[]` ohne Pixelwerte. Die Umrechnung auf eine Achse ist damit ausdrücklich der Darstellungsschicht überlassen — dieser Entwurf legt fest, wie.

Zwei Bausteine fehlen: ein Modul für Terminkonflikte und die Erweiterung von `ansichtEinstellungen` um den Schalter „alle Filter abschalten" und den zuletzt betrachteten Stand.

## Ziele / Nicht-Ziele

**Ziele:**

- Die vorhandene Logik unverändert übernehmen. Wo eine Signatur nicht passt, wird die Darstellungsschicht angepasst, nicht das getestete Modul.
- Die Konfliktlogik als reine Funktion außerhalb von React, wie alle übrigen Module des Bereichs — damit sie ohne Renderer prüfbar bleibt.
- Ein Datenmodell für Konflikte, das die Anforderung „das Terminpaar trägt die Kennzeichnung" wörtlich abbildet.

**Nicht-Ziele:**

- Keine Änderung an `dayLayout.ts`, `jetzt.ts`, `wochenrechnung.ts`, `wochentage.ts`, `semesterwechsel.ts`.
- Keine Vorwegnahme des Planungsmodus. Das Konfliktmodul liefert nur, was die Wochenansicht braucht; die Kandidatenbewertung der Etappe 5 setzt später darauf auf.
- Keine Datenmigration. Die App ist nicht ausgeliefert; es gibt kein Gerät mit gespeicherten Plandaten. Dieselbe Begründung trug bereits die Entscheidung gegen ein Aufräumen des Matrikelnummer-Schlüssels (`herkunft-schedule-durchsprache`, Aufgabe 6.1).

## Entscheidungen

### 1. Die Spanne der Zeitachse ergibt sich aus der angezeigten Woche

`layoutTag(termine, tagBeginnMin, tagEndeMin)` verlangt eine Spanne, die Anforderung „Proportionale Zeitachse" nennt keine. Die Spanne wird eine Ebene über `dayLayout` ermittelt: frühester Beginn und spätestes Ende aller Termine der **angezeigten Woche**, auf die volle Stunde nach außen gerundet. Alle Tage der Woche bekommen dieselbe Spanne.

```
   Spanne = 8:00-18:00, aus der Woche ermittelt

        Mo         Di         Mi
   08  [.......]  |       |  [Analysis]
   09  [ Mathe ]  [  DB   ]  [Analysis]
   10  |       |  [  DB   ]  |       |
   11  |  2 h  |  |       |  [ Prog  ]
   12  |  frei |  [ Praktikum ]      |
   13  [ Prog  ]  [ Praktikum ]      |
   ...
   18  |       |  |       |  |       |
```

*Erwogen und verworfen:*

- **Fester Rahmen (etwa 8–20 Uhr).** Stabil und über Wochen hinweg vergleichbar, erzwingt aber eine Konstante, die die Spec nicht hergibt, und braucht eine Sonderbehandlung für jeden Termin außerhalb — im Bestand von INT-002 kommen Randzeiten vor.
- **Spanne je Tag einzeln.** Kompakt und ohne Leerraum, aber gleich hohe Kacheln stünden dann für unterschiedliche Dauern, und die Achse spränge beim Wechsel des Wochentags. Das widerspricht dem Zweck der Anforderung, Freistunden auf einen Blick erkennbar zu machen.

*In Kauf genommen:* Die Spanne ändert sich beim Blättern zwischen Wochen. Das ist sichtbar, aber innerhalb einer Woche bleibt der Vergleich zwischen den Tagen intakt — und genau dafür ist die Achse da.

### 2. Ein angenommener Konflikt wird am Paar geführt, nicht am Termin

`PlanEntry.akzeptierterKonflikt: boolean` wird ersetzt durch eine Menge von Gegenpart-Kennungen. Ein Hinweis entfällt nur, wenn **beide** beteiligten Termine einander nennen; eine einseitige Eintragung gilt als nicht angenommen und erzeugt einen Hinweis.

```
   heute (Boolean am Eintrag)          kuenftig (Paar-Relation)

   A.akzeptiert = true                 A.akzeptiert = { B }
   B.akzeptiert = true                 B.akzeptiert = { A }

   B loeschen, C zur selben Zeit:      B loeschen, C zur selben Zeit:
   A.akzeptiert ist noch true          A.akzeptiert = { B }, B gibt es nicht
   --> A x C bleibt STUMM              --> A x C: kein Paar --> HINWEIS
```

Beim Löschen eines Termins werden die Nennungen auf ihn aus den übrigen Einträgen entfernt, damit keine Verweise ins Leere wachsen. Das ist Aufräumen im Schreibpfad, keine Migration.

*Erwogen und verworfen:* eine eigene Liste angenommener Paare neben den Einträgen. Sie wäre normalisierter, verlangt aber einen zweiten Speicherschlüssel und ein zweites Aufräumen; bei der erwarteten Größenordnung — einstellige Zahl angenommener Konflikte je Plan — überwiegt der Aufwand den Gewinn.

### 3. „Alle anzeigen" überlagert die Filter, es setzt sie nicht zurück

Die Anforderung verlangt, dass nach dem Zurücknehmen des Schalters „die zuvor gesetzten Filtereinstellungen unverändert weiter" wirken. `ansichtEinstellungen` bekommt deshalb ein viertes, gleichrangiges Feld; die drei bestehenden Flags werden beim Umlegen **nicht** angefasst. Die Auswertung übergeht sie, solange das Feld gesetzt ist.

```
   alleAnzeigen = true
        |
        v
   +--------------------------------------------+
   | gruppenfremdeAusblenden  ....... uebergangen|
   | Gueltigkeitszeitraum      ....... uebergangen|
   | Eingrenzung auf Fachsemester .... uebergangen|
   +--------------------------------------------+
   Werte bleiben gespeichert, wirken beim Zuruecknehmen wieder
```

*Erwogen und verworfen:* den Schalter als Rücksetzknopf zu bauen, der die drei Flags auf „aus" schreibt. Einfacher zu implementieren, aber die Rücknahme wäre unmöglich — genau der Fall, den die Anforderung ausschließt.

### 4. Der zuletzt betrachtete Stand ist gerätelokal und wird nicht mit dem Plan vermischt

Woche und Wochentag kommen in einen eigenen Speicherschlüssel innerhalb von `ansichtEinstellungen`, nicht in `planStore`. Der Plan ist Nutzerinhalt, der betrachtete Ausschnitt ist Ansichtszustand; eine Vermischung führte dazu, dass ein Blättern den Plan als geändert markiert.

Der Ausweichtag am Wochenende bleibt unberührt: Er gilt laut Anforderung „beim automatischen Sprung", also nur bei aktiver Einstellung. Bei abgeschalteter Einstellung wird der gespeicherte Wochentag unverändert angezeigt, auch wenn dort keine Termine liegen.

### 5. Drei Bildschirme statt einem

```
   (schedule)/index      Wochenansicht
        |                Leiste + Tag + Zeitachse/Liste + Filterzugriff
        |
        +--> detail      Termindetails (Anzeige, Farbe, Status,
        |                Loeschen, Konflikte des Termins)
        |
        +--> termin      Editor fuer eigene Termine
                         (anlegen und bearbeiten, derselbe Bildschirm)
```

Anlegen und Bearbeiten teilen sich einen Bildschirm: Die Felder sind identisch, und zwei getrennte Bildschirme liefen bei jeder Feldänderung auseinander. Die Routendateien bleiben reine Re-Exporte aus `app/src/areas/schedule/screens/` (SHELL-F-050), der Stack behält `initialRouteName: 'index'` (SHELL-F-100).

### 6. Die vier Zustände kommen aus der Grundstruktur

Laden, Leer, Fehler und Offline werden nicht neu gebaut, sondern über `AsyncStates` bezogen (Capability `architecture`). Der Stundenplan hat zwei verschiedene Leerzustände, die die Anforderungen ausdrücklich unterscheiden: kein Studiengang gewählt (Hinweis auf die Einrichtung) und Filter wirkt (Nennung des wirksamen Filters mit Weg zum Schalter). Beide gehen über denselben Baustein, mit unterschiedlichem Text.

## Risiken und Abwägungen

- **Die Achse wird bei einem Ausreißertermin sehr lang.** Ein einzelner Abendtermin dehnt die Woche auf zwölf Stunden, alle anderen Tage bekommen viel Leerraum → Der Schalter zur kompakten Liste besteht bereits als Anforderung und ist der vorgesehene Ausweg; ein Zuschneiden der Achse würde die Proportionalität brechen und wird nicht gebaut.
- **Die Konfliktermittlung läuft über alle Paare eines Tages.** Bei realistischen Tagesgrößen (unter zwanzig Terminen) ist das belanglos, aber die Funktion darf nicht je Renderdurchlauf neu über die ganze Woche laufen → Ermittlung je Tag, gemeinsam mit `dayLayout` in einem Memo.
- **Der Termin-Editor ist der erste Schreibpfad des Bereichs.** Ein unvollständig geschriebener Eintrag darf den gespeicherten Bestand nicht unlesbar machen → `planStore` prüft bereits jeden Eintrag einzeln und überspringt fehlerhafte, statt den Bestand zu verwerfen (DATA-F-020). Der Editor validiert vor dem Schreiben; das bestehende Verhalten bleibt die zweite Absicherung.
- **Neunzehn Anforderungen werden gleichzeitig erstmals sichtbar.** Fällt bei der Abnahme eine Fehlannahme in der Logik auf, betrifft sie womöglich mehrere davon → `tasks.md` schneidet die Verdrahtung in Blöcke, die einzeln abschließbar sind; die Wochenansicht wird vor Details und Editor fertiggestellt.

## Offene Punkte

Keine, die den Zuschnitt oder die Anforderungen berühren. Die Gerätemessungen zur Darstellung (Bildwiederholrate beim Blättern, Vorlesefokus) gehören in das Prüfprotokoll bei der Abnahme, nicht in diesen Entwurf.
