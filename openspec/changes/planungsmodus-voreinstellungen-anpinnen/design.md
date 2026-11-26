## Context

Die Requirements des Planungsmodus stehen seit dem Change
`planungsmodus-kriterien` vollständig in der Haupt-Spec. Umgesetzt ist der
Planungsmodus selbst (`PlanungScreen.tsx`): ein Zwischenstand im
Bildschirmzustand, Planungsstand je Veranstaltungsart (`planungsstand.ts`),
Konfliktkennzeichnung (`konflikt.ts`) und ausdrückliches Sichern. Daran
knüpft dieser Change an. Alle Rechenlogik kommt in reine Module ohne React,
wie im übrigen Bereich.

## Goals / Non-Goals

**Goals:** fünf Voreinstellungen, die acht Kriterien als Bewertung, ein
greedy Vorschlag in den Zwischenstand, Anpinnen, Rücknahme,
Vorbereitungszeiten je Veranstaltungsart.

**Non-Goals:** freie Sortierung und Abschalten (zweiter Zug),
Zeitfenster-Einstellung, Vollkombinatorik. Die Pflicht-Markierung war
zunächst ausgenommen und ist am 2026-11-26 nachgezogen (Entscheidung 8).

## Decisions

### 1. Bewertung über den ganzen Planentwurf, Vergleich als Zahlenvektor

`planungskriterien.ts` bewertet einen **Planentwurf**: alle aktiven Termine
nach Einsetzen einer Option. Für jedes Kriterium ergibt sich eine Zahl,
kleiner ist besser. Kriterien, bei denen „größer besser" ist, werden negiert.
Zwei Entwürfe werden lexikographisch über die eingeschalteten Kriterien
verglichen, ohne Toleranz.

Die Messung folgt der Spec. Wo die Spec offen ist, gilt:

| Kriterium | Wert (kleiner ist besser) |
|---|---|
| Uni-Tage | Zahl der Wochentage mit mindestens einem Termin |
| Anwesenheitszeit | Summe der Tagesspannen in Minuten |
| Gleichmäßige Woche | größte minus kleinste Tagesspanne der Uni-Tage |
| Abstand zwischen Lerneinheiten | negierter kleinster Nachbarabstand der eingesetzten Termine; ohne Nachbarn 24 h |
| Vorbereitungszeit | Summe der Fehlbeträge `max(0, Zielwert − freie Zeit davor)` über **alle** Termine des Entwurfs; erster Termin eines Tages: 0 |
| Abstand Vorlesung–Übung | Summe je Termin anderer Art eines Moduls mit Vorlesung im Entwurf: Fehlbetrag zum Mindestabstand nach der letzten vorangehenden Vorlesung; liegt keine Vorlesung davor, eine Woche (10 080 min) |
| Abwechslung | Zahl unmittelbar aufeinanderfolgender Termine gleicher Veranstaltungsart je Tag |
| Zeitfenster | Zahl der eingesetzten Termine außerhalb des Zeitfensters; ohne Zeitfenster 0 |

Vorbereitungszeit und Abstand Vorlesung–Übung werden über den ganzen Entwurf
gemessen, nicht nur am neuen Termin. Der Grund: Eine Vorlesung direkt vor
einem bereits stehenden Praktikum nimmt **diesem** die Vorbereitungszeit.
Eine Messung allein am neuen Termin sähe das nicht.

Eine Woche als Strafwert liegt über jedem möglichen Fehlbetrag, solange der
Mindestabstand unter einer Woche bleibt. Die Einstellung begrenzt ihn
deshalb. So erfüllt eine Übung vor der Vorlesung das Szenario „schlechter
als jeder Termin nach der Vorlesung". Die Woche wird linear von Montag bis
Sonntag gelesen.

Eigene Termine zählen als Hindernisse und für Uni-Tage und
Anwesenheitszeit. Für sie gilt der allgemeine Zielwert der Vorbereitungszeit
(Erläuterung „Vorbereitungszeiten je Veranstaltungsart": eigene Einträge
sind die siebte Art).

### 2. Gruppen-Slot = Veranstaltungsart × Gruppenmenge × Name

Eine **Reihe** ist (Modul, Veranstaltungsart), wie in `planungsstand.ts`.
Ihre Termine werden zu **Gruppen-Slots** gebündelt, Schlüssel ist
`studentSet` + `name`. Ein Gruppen-Slot ist eine Option des Vorschlags
(ADDED-Requirement). Die Bündelung ist eine Annahme über den FBWS-Bestand.
Eine Live-Prüfung war am 2026-11-26 nicht möglich, weil INT-002 mit 301 auf
eine HTML-Seite umleitete. Die Annahme stützt sich auf die Beobachtung vom
2026-09-08 (Parallelgruppen unterscheiden sich im Namen).

### 3. Welche Reihen der Vorschlag anfasst

| Lage der Reihe im Zwischenstand | Verhalten |
|---|---|
| ein gewählter Termin ist angepinnt | unverändert, zählt als feste Umgebung |
| Termine aus mehr als einem Gruppen-Slot gewählt | unverändert (bewusste Mehrfachwahl) |
| nur ein Gruppen-Slot vorhanden | dieser, vollständig |
| sonst (nichts oder Teile genau eines Slots gewählt) | wird neu belegt |

Die Bearbeitungsreihenfolge geht zuerst nach der Zahl der Gruppen-Slots,
die wenigsten zuerst (am stärksten eingeschränkt). Danach folgt die
Modulreihenfolge der Auswahl, dann die Veranstaltungsart. Bei Gleichstand
aller Kriterien gewinnt der bisher gewählte Slot: Ein Vorschlag soll nichts
ohne Not umstellen. Danach gewinnt der Slot der eigenen Gruppe, zuletzt die
Eingabereihenfolge. Das erfüllt das deterministische Tie-Breaking der Spec.

Ist keine Option konfliktfrei, gewinnt die mit den wenigsten Überschneidungen.
Bei Gleichstand entscheiden die Kriterien. Die Reihe wird als Konflikt
geführt, samt den Namen der Veranstaltungen, mit denen sie kollidiert.

### 4. Der Vorschlag schreibt in den Zwischenstand, nicht in den Plan

Der Planungsmodus hat schon einen ungesicherten Zwischenstand mit Sichern
und Verwerfen. Der Vorschlag ersetzt darin die Termine der neu belegten
Reihen. Gesicherte Einträge kommen in `entfernteIds`, Sitzungseinträge
werden ersetzt. Ein Termin, der bleibt, behält seinen Eintrag samt Kennung,
Farbe und Pin. Damit gilt das Szenario „vor der Übernahme einsehen und
einzeln ändern" ohne einen eigenen Vorschauzustand. Umgelegte und neu
gesetzte Termine tragen bis zum Verlassen die Kennzeichnung „vom Vorschlag".
Bei Konflikt erscheint ein Hinweis über `ConfirmDialog`. Er nennt die
beteiligten Veranstaltungen und das Anpinnen als Weg, einen Termin
festzuhalten, und die Pflicht-Markierung als Weg zum Vorrang (Entscheidung 8).

Der Vorschlag trägt keine `akzeptierteKonflikte` ein. Die Kollision hat das
System gewählt, nicht die Nutzerin. Sie bleibt deshalb als offener Konflikt
sichtbar, auch nach dem Sichern in der Wochenansicht.

### 5. Rücknahme = Einteilung nach Gruppenkennung

Die Rücknahme muss auch nach dem Sichern wirken, in einer späteren Sitzung.
Ein gemerkter Vorher-Stand reicht deshalb nicht. Rechnerisch gilt je Reihe,
die der Vorschlag anfassen dürfte (Entscheidung 3):

- Es gibt genau einen Gruppen-Slot der eigenen Gruppe: dieser.
- Es gibt mehrere: der bisher gewählte, falls er darunter ist, sonst der
  erste.
- Es gibt keinen: die Reihe bleibt, wie sie ist. Die Rücknahme entfernt
  keine Veranstaltung.

Angepinnte Termine, Mehrfachwahlen und eigene Termine bleiben unberührt. Das
Ergebnis landet wie der Vorschlag im Zwischenstand.

### 6. `angepinnt` am Planeintrag, optional

`PlanEntryBase.angepinnt?: boolean`. Fehlt das Feld, gilt der Eintrag als
nicht angepinnt. Gespeicherte Bestände bleiben ohne Migration gültig.
`planStore` verwirft nur einen Eintrag, dessen Feld vorhanden und kein
Boolean ist (DATA-F-020: einzeln, protokolliert). Im Planungsmodus trägt
jede gewählte Zeile einen Pin-Schalter (44 dp, Symbol plus
`accessibilityState`). Für gesicherte Einträge wird die Änderung wie die
Konfliktannahmen bis zum Sichern gesammelt und dort als Patch geschrieben.

### 7. Planungseinstellungen als eigener Speicher und Bildschirm

`planungseinstellungen.ts` ist aufgebaut wie `ansichtEinstellungen.ts`:
reaktiver Modulspeicher, gerätelokal, feldweise Bereinigung mit Vorgabe und
Protokoll. Vorgaben:

- Voreinstellung *Fahrten zur Uni*
- allgemeine Vorbereitungszeit 30 min, keine Ausnahmen
- Mindestabstand Vorlesung–Übung 0 min

Werte werden über Schritt-Schaltflächen (±15 min, 0 bis 240 bzw. 0 bis
6 Tage) eingestellt, nicht über Freitext. So gibt es keine Parse-Fehler.
Ausnahmen gelten je Veranstaltungsart aus der bekannten Liste `CourseType`.
Eine unbekannte Art erhält immer den allgemeinen Wert (Requirement
„Vorbereitungszeit je Veranstaltungsart", Szenario „Unbekannte
Veranstaltungsart"). Erreichbar ist der Bildschirm über eine Werkzeugzeile
im Planungsmodus. Sie zeigt auch die gewählte Voreinstellung, „Vorschlag
erzeugen" und „Nach Gruppe einteilen".

### 8. Pflicht-Markierung als Vorrang in der Bearbeitungsreihenfolge

Nachgezogen am 2026-11-26 (tasks.md 5.2). Das Requirement „Kandidat als
Pflicht markieren" verlangt, dass eine Pflicht-Veranstaltung im Plan bleibt.
Das tut der Vorschlag ohnehin für jede Veranstaltung (Entscheidung 3). Wirksam
wird die Markierung deshalb allein über die Reihenfolge: Reihen eines
Pflicht-Moduls stehen in der Bearbeitungsreihenfolge vor allen anderen, erst
danach gelten Zahl der Gruppen-Slots und Modulreihenfolge. So wählt der greedy
Vorschlag für sie zuerst und damit aus allen noch freien Gruppen-Slots. Das
ist der „Vorrang", auf den das Szenario „Keine konfliktfreie Konstellation"
hinweist.

- **Kandidat = Modul.** Markiert wird ein Modul der Planungsauswahl, nicht
  eine einzelne Veranstaltungsart. Das entspricht dem Datenmodell der Spec
  (`pflicht` je Eintrag der Planungsauswahl).
- **Gespeichert** als Liste von Modulschlüsseln im Speicher der
  Planungseinstellungen (`pflichtModule`). Ein eigener Speicher für die
  Planungsauswahl hätte nur dieses eine Feld. Schlüssel abgewählter Module
  bleiben liegen, wirken aber nicht, weil der Vorschlag nur gewählte Module
  kennt.
- **Bedienweg.** Ein Abschnitt „Pflicht-Veranstaltungen" in den
  Planungseinstellungen, je Kandidat ein Schalter. Der Planungsmodus gibt die
  Kandidaten beim Öffnen als Routenparameter mit (`kandidaten`, JSON aus
  Schlüssel und Name). Eine weitere Zeile im Planungsmodus hätte Platz über
  der Terminliste gekostet (Risiko „Werkzeugzeile kostet Platz"). Der
  Konflikthinweis nennt die Pflicht-Markierung und bietet neben
  „Verstanden" den Weg „Zu den Planungseinstellungen".

## Risks / Trade-offs

- **Greedy verfehlt Konstellationen.** Das ist in der Spec ausdrücklich in
  Kauf genommen (Erläuterung zur Auflösung des Widerspruchs, 2026-09-06).
- **Annahme zum Gruppen-Slot ungeprüft gegen den aktuellen Bestand.** Siehe
  Entscheidung 2. Erweist sie sich als falsch, betrifft das nur die
  Bündelung, nicht die Kriterien.
- **Werkzeugzeile kostet Platz.** Eine Zeile mit drei Bedienwegen über der
  Liste. Die Geräteabnahme muss zeigen, ob das auf dem Pixel 9 Pro trägt.
