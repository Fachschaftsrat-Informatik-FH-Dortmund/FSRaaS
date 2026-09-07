# Design — Mensa-Kontext in der Gerichtsliste

## Context

Motivation siehe `proposal.md` („Why"), Verhalten siehe `specs/canteen/spec.md`.

Ausgangslage im Code (`app/src/areas/canteen/`):

- `consolidate.ts` liefert `Konsolidierung { sektionen, geschlossene }`. Die
  geschlossenen Mensen sind also bereits sauber getrennt vorhanden, werden aber
  von `sortierung.ts` nicht angefasst.
- `sortierung.ts` (`wendeAn`) baut aus den konsolidierten Gerichten die
  `Abschnitt[]` — heute ausschließlich aus Gerichten; ein Abschnitt ohne Gerichte
  kann nicht entstehen.
- `CanteenScreen.tsx` filtert danach, wirft leere Abschnitte weg, baut die Chips
  und rendert am Listenende einen Fußbereich aus Öffnungszeit-Zeilen,
  Filter-Zähler und Geschlossen-Zeilen.
- Öffnungszeiten stehen als `Mensa.oeffnungszeiten` in den Stammdaten (Vertrag:
  „Ein Eintrag je Wochentag, Montag zuerst", Einträge dürfen `null` sein). Die
  heutige Auflösung steckt als lokale Hilfsfunktion `oeffnungszeitFuer` in
  `CanteenScreen.tsx` und liefert für Samstag und Sonntag immer `null`.

## Goals / Non-Goals

**Goals**

- Der Ort ist in jeder Gruppierung ablesbar, ohne die Gliederung zu wechseln.
- Eine gewählte Mensa verschwindet nie aus der Mensa-Gliederung — sie ist
  entweder mit Angebot, mit Geschlossen-Hinweis oder mit Filter-Hinweis da.
- Die Fachlogik bleibt React-frei und testbar; kein neuer Netzaufruf.

**Non-Goals (über `proposal.md` hinaus, auf Design-Ebene)**

- Kein Zustand „öffnet gleich" / „jetzt geöffnet": Das bräuchte eine Uhrzeit-Logik
  gegen die Ortszeit und ein Parsing der Öffnungszeit-Zeichenkette, die die
  Stammdaten als freien Text führen.
- Keine Änderung an `consolidate.ts`: Die Trennung „Sektionen / geschlossene"
  trägt bereits, was gebraucht wird.
- Kein Umbau der „Alle Mensen"-Ansicht (`CanteenAllScreen.tsx`).

## Decisions

### D1 — Wiedereröffnung aus den gepflegten Öffnungszeiten, nicht aus Speiseplänen

Der Hinweis nennt den nächsten Wochentag, für den `Mensa.oeffnungszeiten` einen
Eintrag führt; gesucht wird ab dem Folgetag des angezeigten Tages über höchstens
sieben Tage. Entschieden mit der Nutzerin am 2026-09-07.

*Alternativen:* (a) Speisepläne der Folgetage abrufen und den ersten Tag mit
Gerichten nennen — wahrheitsgemäß, kostet aber bis zu sieben zusätzliche Abrufe
je geschlossener Mensa und liefert offline gar nichts, während die Ansicht offline
sonst funktioniert. (b) Hybrid aus dem ohnehin vorab geladenen Fenster (+1/+2 Tage)
mit Rückfall auf die Öffnungszeiten — genau ohne Mehrverkehr, aber die Aussage
wechselt je nach Cache-Stand ihre Grundlage; das ist weder erklärbar noch
zuverlässig testbar.

*Folge für die Formulierung:* Der Hinweis spricht von „wieder geöffnet", nie von
„wieder Gerichte". Die Öffnungszeiten kennen weder Feiertage noch die
vorlesungsfreie Zeit; eine Aussage über das Angebot wäre von den Daten nicht
gedeckt und liefe der Regel „keine stillen Falschaussagen" (SEC-F-060) zuwider.

### D2 — Abschnitte bekommen einen Zustand, der Fußbereich verliert Aufgaben

`Abschnitt` in `sortierung.ts` wird um ein Feld erweitert:

```
zustand: 'gerichte' | 'geschlossen'
```

`wendeAn` erzeugt bei `gruppierung === 'mensa'` zusätzlich zu den Gerichts-Abschnitten
je Kennung aus `konsolidierung.geschlossene` einen Abschnitt mit leerer
Gerichtsliste und `zustand: 'geschlossen'`. Diese Abschnitte durchlaufen dieselbe
Gruppenordnung wie die übrigen (Kriterium „eingestellte Mensa-Reihenfolge" über
den Index in `kontext.mensaReihenfolge`, Kriterium „alphabetisch" über den Namen)
— eine geschlossene Mensa steht damit an genau der Stelle, an der sie stünde,
wenn sie offen hätte.

Bei `gruppierung === 'keine'` und `'kategorie'` erzeugt `wendeAn` keine solchen
Abschnitte; dort bleibt der Geschlossen-Hinweis im Fußbereich wie bisher.

*Alternative:* die geschlossenen Mensen erst im Screen einmischen. Verworfen —
dann müsste der Screen die Gruppenordnung ein zweites Mal implementieren, und
genau das trennt `sortierung.ts` heute sauber ab.

### D3 — Der Filter-Zustand entsteht im Screen, nicht in `sortierung.ts`

`sortierung.ts` kennt die Filtervorgaben nicht und soll sie nicht kennen. Der
Screen filtert wie bisher und wertet das Ergebnis je Abschnitt aus:

| Ausgangszustand | Sichtbare Gerichte danach | Ergebnis |
|---|---|---|
| `gerichte` | ≥ 1 | Abschnitt mit Gerichten |
| `gerichte` | 0, Mensa-Gruppierung | Abschnitt mit Filter-Hinweis |
| `gerichte` | 0, andere Gruppierung | Abschnitt entfällt (wie bisher) |
| `geschlossen` | — | Abschnitt mit Geschlossen- und Wiedereröffnungshinweis |

Damit unterscheidet die Ansicht die beiden leeren Fälle, ohne dass die reine
Sortierlogik von Filtern erfährt.

### D4 — Geschlossene Abschnitte nur, wenn überhaupt etwas angeboten wird

Führt am angezeigten Tag keine einzige gewählte Mensa ein Angebot, bleibt es beim
bestehenden Leerzustand „Heute kein Angebot" mit dem Fußbereich darunter. Eine
Liste, die an einem Sonntag nur aus fünf Geschlossen-Abschnitten besteht, wäre
schlechter als der eine klare Satz — und der Leerzustand ist querschnittlich
vorgegeben (Capability `architecture`, vier Zustände je Ansicht).

### D5 — Öffnungszeit als Angabe an der Überschrift, Status genau einmal je Abschnitt

Die Abschnittskopfzeile wird eine Zeile aus Mensa-Name und einer kompakten
Angabe rechts daneben:

```
Hauptmensa   ( 11:30 – 14:30 )
```

- Kopfzeile: `flexDirection: 'row'`, `alignItems: 'center'`, `flexWrap: 'wrap'`,
  `gap: 8` — auf schmalen Geräten rutscht die Angabe unter den Namen, statt den
  Namen abzuschneiden.
- Angabe: `fontSize: 12`, `borderRadius: 999`, `paddingHorizontal: 8`,
  `paddingVertical: 2`, `backgroundColor: colors.surface`. **Textfarbe
  `colors.text`, nicht `colors.textMuted`** — `textMuted` ist eine 60-%-Deckung
  und erreicht auf `surface` (`#F2F2F7`) nur rund 4,2:1, also weniger als die
  geforderten 4,5:1 (Capability `ux-and-theming`). Zurückgenommen wirkt die
  Angabe über Schriftgröße und Pille, nicht über blassen Text.
- Kein Symbol, kein Emoji, keine zweite Farbe.

Ein Abschnitt trägt seinen Status **genau einmal**, immer an derselben Stelle:

| Fall | Kopfzeile | Darunter |
|---|---|---|
| Mensa mit Angebot | Name + Öffnungszeit-Angabe | Gerichte |
| Mensa mit Angebot, keine Öffnungszeit hinterlegt | nur Name | Gerichte |
| Mensa geschlossen | nur Name (keine Angabe, Requirement „Keine Öffnungszeit für Mensa ohne Angebot") | eine gedämpfte Zeile: geschlossen · wieder geöffnet am \<Wochentag\> |
| Mensa vollständig weggefiltert | Name + Öffnungszeit-Angabe | eine gedämpfte Zeile: alle Gerichte durch die Filter ausgeblendet |

*Alternative:* auch im geschlossenen Fall eine Pille, die „geschlossen" sagt.
Verworfen — die Nutzerin hat den Hinweis ausdrücklich unter der Überschrift
gewünscht, und eine Pille „geschlossen" neben einer Pille „11:30 – 14:30" wäre
zwei Sprachen für denselben Platz.

### D6 — Überschrift bei Mensa-Gruppierung immer, sonst wie bisher

Heute unterdrückt der Screen jede Überschrift, solange es nur einen Abschnitt
gibt. Bei Mensa-Gruppierung entfällt diese Unterdrückung: Die Überschrift trägt
jetzt die Öffnungszeit und ist damit auch bei einer einzigen Mensa nützlich. Bei
Kategorie-Gruppierung bleibt sie unverändert — eine einzelne Kategorieüberschrift
über der gesamten Liste sagt nichts.

### D7 — Neue Beschriftungen, unveränderte gespeicherte Werte

Die gespeicherten Kriterium-Werte (`'quelle'`, `'reihenfolge'`) bleiben, wie sie
sind; bestehende eigene Presets bleiben damit ohne Migration gültig. Nur die
Anzeigetexte wechseln:

| Ort | Wert | Schlüssel | Deutsch |
|---|---|---|---|
| Gerichte-Sortierung | `quelle` | `mensa.sortierkriterium.quelle` | Reihenfolge der Mensa |
| Gruppenreihenfolge, Gruppierung nach Mensa | `reihenfolge` | `mensa.gruppenkriterium.reihenfolgeMensa` (neu) | Meine Mensa-Reihenfolge |
| Gruppenreihenfolge, Gruppierung nach Kategorie | `reihenfolge` | `mensa.gruppenkriterium.reihenfolgeKategorie` (neu) | Reihenfolge der Mensa |

`mensa.gruppenkriterium.reihenfolge` entfällt. Englische Entsprechungen in
`en.json` im selben Zug (NFR-F-115).

### D8 — Wochentag-Auflösung wird eine eigene reine Funktion

`oeffnungszeitFuer` zieht aus `CanteenScreen.tsx` nach
`app/src/areas/canteen/oeffnungszeiten.ts` und bekommt dort Gesellschaft von
`naechsterOeffnungstag`. Beide rein, beide mit eigenen Tests (Capability
`quality-and-testing`, Abschnitt 5). Dabei zwei Korrekturen an der Auflösung:

- Index über `(wochentag + 6) % 7` statt über „Wochentag minus 1, Wochenende
  ausgeschlossen". Der Vertrag legt nur „Montag zuerst" fest; eine Liste mit
  sieben Einträgen wird damit korrekt bedient, eine mit fünf liefert für Samstag
  und Sonntag wie bisher nichts.
- Die heutige Vorbedingung `zeiten.length < 5 → null` entfällt zugunsten einer
  reinen Indexprüfung; eine Mensa mit nur drei gepflegten Tagen verliert dann
  nicht alle Angaben.

## Risks / Trade-offs

- **Der Wiedereröffnungshinweis liegt an Feiertagen und in der vorlesungsfreien
  Zeit falsch** → Die Formulierung bleibt bei „geöffnet" statt „Gerichte", der
  Fehler kostet keine Handlung (die Nutzerin blättert ohnehin auf den Tag), und
  die Alternative wäre siebenfacher Netzverkehr je geschlossener Mensa (D1).
- **Die Chip-Leiste wird länger, weil geschlossene Mensen jetzt auswählbare Chips
  haben** → Sie rollt bereits waagerecht und ist auf eine Zeile begrenzt
  (Requirement „Kompakte, waagerecht rollende Chip-Leiste"); ein Chip, der zu
  einem Abschnitt führt, der etwas aussagt, ist besser als einer, der ausgegraut
  ist und nichts erklärt.
- **Jede Karte trägt ohne Mensa-Gruppierung eine Zeile mehr** → Nur bei mehr als
  einer gewählten Mensa; bei einer einzigen entfällt sie ganz (Requirement
  „Ausweis der anbietenden Mensa ohne Mensa-Gliederung").
- **`Abschnitt` bekommt ein Feld, das drei Testdateien und die „Alle
  Mensen"-Ansicht berührt** → `CanteenAllScreen.tsx` nutzt `AnkerListe`, nicht
  `wendeAn`; das Feld bleibt optional-frei, indem `wendeAn` es überall setzt.

## Migration Plan

Keine. Reine Anzeigeänderung: kein Vertrag, kein Backend, kein neuer oder
geänderter Speicherschlüssel, kein Datenformat. Die gespeicherten Presets bleiben
unverändert gültig (D7). Rücknahme ist ein Revert des Merges.
