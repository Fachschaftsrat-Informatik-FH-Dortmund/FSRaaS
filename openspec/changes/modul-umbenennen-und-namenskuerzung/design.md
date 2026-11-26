## Context

Anlass und Abgrenzung stehen in `proposal.md`, die drei Anforderungen im
Spec-Delta `specs/schedule/spec.md`. Am 2026-09-11 verworfen und hier nicht
wieder aufgenommen: vordefinierte oder zentral gepflegte Aliase sowie eine
Umschaltung nach gemessener Spaltenbreite.

Bestand (Stand 2026-11-26):

- Die Kachel der Wochenansicht ist `TerminKachel` in
  `app/src/areas/schedule/screens/ScheduleScreen.tsx`. Sie zeigt den Titel über
  `titelVon(entry)` mit `numberOfLines={2}` — das Ende wird abgeschnitten. Die
  Kachel dient sowohl der proportionalen Zeitachse (Breite je nach
  Überschneidung 1/n der Spalte) als auch der kompakten Liste.
- `titelVon` steckt außerdem in der Jetzt-Anzeige über dem Plan und im
  Übernahme-Blatt einer eingeblendeten Alternative, beide in derselben Datei.
- Das Termindetail (`TerminDetailScreen.tsx`) zeigt die offizielle
  Bezeichnung im farbigen Kopf und als Angabe „Bezeichnung". Rückfragen laufen
  dort bereits über `ConfirmDialog` (`app/src/ui/`).
- Ein Modul wird im persönlichen Plan schon heute über `courseId`, ersatzweise
  den Namen, identifiziert — so wirken die modulweite Farbwahl
  (`farbeFuerModulSetzen`, `planStore.ts`) und die Farbautomatik
  (`automatikSchluessel`, `TerminDetailScreen.tsx`). Ein `PlanEntry` trägt kein
  Fachsemester; der Schlüssel aus `kursbaum.ts` (`courseId|Fachsemester`) ist
  dort nicht verfügbar.
- Gerätelokale Einstellungen liegen in kleinen reaktiven Modul-Speichern über
  `@/storage/kv` (`ansichtEinstellungen.ts`, `planStore.ts`).

Parallel läuft die Arbeit am Planungsmodus (#27, #62). `PlanungScreen.tsx`,
`CourseSelectionScreen.tsx`, `planungsstand.ts` und `kursbaum.ts` bleiben in
diesem Change unberührt.

## Goals / Non-Goals

**Goals:**

- Ein eigener Modulname, gerätelokal, der für alle heutigen und künftigen
  Termine desselben Moduls in der Kachel gilt.
- Ein Bedienweg im Termindetail, Entfernen nur nach Rückfrage.
- Kürzung unter Erhalt einer Endzahl ohne jede Breitenmessung im App-Code.

**Non-Goals:**

- Kein eigener Name für eigene Termine (`kind: 'eigen'`): Sie gehören keinem
  Modul an, ihr Titel ist bereits frei wählbar (`TerminEditorScreen`).
- Keine Verwaltung verwaister Namen (Module, die nicht mehr im Plan stehen) —
  siehe Risiken.
- Keine Kürzungsregel außerhalb der Kachel; Jetzt-Anzeige, Blatt und Detail
  brechen wie bisher um.

## Decisions

**1. Eigener Speicher `modulnamen.ts` statt eines Felds am `PlanEntry`.**
Neue Datei `app/src/areas/schedule/modulnamen.ts`, Schlüssel
`scheduleModuleNames`, Inhalt ein Objekt Modulschlüssel → eigener Name.
Reaktiver Modul-Speicher nach dem Muster von `ansichtEinstellungen.ts`, Hook
`useModulnamen()` mit `namen`, `loaded`, `setzen(schluessel, name)` und
`entfernen(schluessel)`.
Das Szenario „Später hinzukommender Termin" ist damit ohne Zutun erfüllt: Die
Zuordnung hängt am Modul, nicht am einzelnen Eintrag, und jeder neue Eintrag
findet sie beim Rendern vor. Verworfen: ein Feld `eigenerName` am `PlanEntry`.
Es müsste bei jedem Schreibpfad, der Einträge anlegt (Modulauswahl,
Planungsmodus, Übernahme einer Alternative), vom Bestand übernommen werden —
genau die Dateien, die parallel umgebaut werden — und ginge verloren, sobald
alle Termine eines Moduls einmal aus dem Plan genommen sind.

Beim Laden wird jeder Eintrag einzeln geprüft (Zeichenkette, nicht leer); ein
ungültiger Eintrag wird protokolliert und übersprungen, der Rest bleibt
(DATA-F-020, SEC-F-060) — wie in `planStore.ts`.

**2. Modulschlüssel: `courseId`, ersatzweise der offizielle Name.**
Reine Funktion `modulSchluesselVon(entry)` in `modulnamen.ts`, `null` für
eigene Termine. Dieselbe Regel wie die modulweite Farbwahl, damit „Modul" in
der Detailansicht überall dasselbe heißt. Verworfen: der Schlüssel aus
`kursbaum.ts` mit Fachsemester — am `PlanEntry` nicht vorhanden, und ein Modul
mit Terminen in zwei Fachsemestern soll ohnehin einen Namen tragen.

**3. Kürzung: Zerlegen als reine Funktion, Kürzen durch das Textlayout.**
`teileEndzahl(name)` in `app/src/areas/schedule/namenskuerzung.ts` liefert
`{ stamm, endzahl }`. Als Endzahl gilt eine Ziffernfolge am Ende des Namens,
auch mit Punkten gegliedert, der mindestens ein Zeichen vorausgeht, das weder
Ziffer, Punkt noch Leerraum ist („Mathematik für Informatiker 1" →
„Mathematik für Informatiker" + „1"; „Mathe2" → „Mathe" + „2"; „Web 2.0" →
„Web" + „2.0"). Kein Treffer bei einer Zahl in der Mitte
(„Web 2.0 Technologien"), bei einem reinen Zahlnamen und bei römischen Ziffern
— die Anforderung spricht von einer Zahl, im FBWS-Bestand tragen verwandte
Veranstaltungen arabische Ziffern (vgl. `namensstamm` in `kursbaum.ts`).

Die Kachel stellt einen Namen mit Endzahl als waagerechte Zeile aus zwei
`Text`-Elementen dar: der Stamm mit `flexShrink: 1`, `numberOfLines={2}` und
`ellipsizeMode="tail"`, dahinter die Endzahl ohne Schrumpfen, unten
ausgerichtet. Passt der Name nicht, kürzt das native Textlayout den Stamm mit
„…", die Zahl bleibt stehen („Mathematik fü… 1"). Ohne Endzahl bleibt es beim
einzelnen `Text` mit Kürzung am Ende. Verworfen:

- Messen über `onLayout`/`onTextLayout` und Kürzen auf eine errechnete
  Zeichenzahl — genau die am 2026-09-11 verworfene Abhängigkeit von gemessener
  Breite, zudem ein zweiter Render-Durchgang je Kachel.
- `ellipsizeMode="middle"` — erhält die zweite Hälfte des Namens statt nur der
  Zahl, wirkt nur bei einer Zeile und auf Android nicht bei `numberOfLines > 1`.
- Eine feste Zeichengrenze je Spaltenzahl — Schriftgröße und Gerätebreite
  machen jede Grenze falsch.

Die Zeichenfolge des Namens bleibt in beiden Fällen ungekürzt im
`accessibilityLabel` der Kachel; der Vorleser hört nie die gekürzte Form.

**4. Geltungsbereich: nur `TerminKachel` liest den eigenen Namen.**
Eine Funktion `kachelTitel(entry, namen)` in `modulnamen.ts` liefert den
eigenen Namen, sonst `titelVon`. Sie wird ausschließlich in `TerminKachel`
aufgerufen — sichtbarer Titel und `accessibilityLabel`. Die Jetzt-Anzeige und
das Übernahme-Blatt in `ScheduleScreen.tsx` bleiben bei der offiziellen
Bezeichnung: Die Anforderung beschränkt den eigenen Namen auf die Kacheln, und
beide Stellen haben die volle Breite zur Verfügung. Modulauswahl und
Planungsmodus lesen `modulnamen.ts` nicht und bleiben damit ohne Änderung bei
der offiziellen Bezeichnung.

**5. Bedienweg im Termindetail direkt unter „Bezeichnung".**
Bei einem offiziellen Termin folgt auf die Angabe „Bezeichnung" ein Abschnitt
„Eigener Name in der Wochenansicht": ein Textfeld (vorbelegt mit dem
bestehenden Namen), ein Knopf „Übernehmen" und — wenn ein Name gesetzt ist —
ein Knopf „Eigenen Namen entfernen". Keine Geste, alle Bedienelemente ≥ 44 dp.
Kopf und Angabe „Bezeichnung" zeigen weiter die offizielle Bezeichnung.

- „Übernehmen" speichert den getrimmten Text; bei leerem oder unverändertem
  Text ist der Knopf inaktiv. Höchstlänge 40 Zeichen (`maxLength`) — der Name
  soll eine Kachel entlasten, die Kürzung greift ohnehin.
- Ein Überschreiben fragt nicht nach: Die Nutzerin hat den neuen Namen eben
  selbst eingegeben, der alte steht bis dahin im Feld.
- „Entfernen" fragt über `ConfirmDialog` nach (DATA-F-020: lokale
  Nutzerdaten nicht ohne Rückfrage verwerfen). Der Dialog nennt den Namen und
  sagt, dass danach wieder die offizielle Bezeichnung erscheint; Abbruch lässt
  alles stehen. Die Entfernen-Aktion ist `destructive`.
- Der Name gilt sofort und ohne Geltungsbereichs-Rückfrage, anders als die
  Farbe: Er ist laut Anforderung immer modulweit.

**6. „Plan leeren" und „Zurücksetzen" lassen die Namen stehen.**
Die eigenen Namen sind eine persönliche Gewohnheit über Semester hinweg; ein
im nächsten Semester wieder gewähltes Modul trägt ihn erneut. Das
Verwaltungsblatt (`VerwaltungsblattZugang.tsx`) bleibt unverändert.

## Risks / Trade-offs

- [Bei zweizeiligem Stamm steht die Endzahl rechts neben dem Textblock statt
  im Fließtext] → Bei einzeiligen Namen ist das Bild identisch mit dem
  bisherigen; bei zweizeiligen bleibt der Name vollständig lesbar. Die
  Sichtprüfung am Gerät (tasks.md, Abschnitt 4) entscheidet, ob nachgebessert
  werden muss.
- [Verwaiste Namen sammeln sich an] → Wenige Bytes je Modul; sie schaden
  nicht und wirken wieder, sobald das Modul zurückkehrt. Eine Bereinigung wäre
  ein eigener Change.
- [Ändert der FBWS die `courseId` eines Moduls, greift der Name nicht mehr] →
  Derselbe Schlüssel trägt schon die modulweite Farbwahl; die Nutzerin vergibt
  den Namen dann neu. Kein Datenverlust, der alte Eintrag bleibt liegen.
- [Ellipsen-Verhalten unterscheidet sich zwischen Android, iOS und Web] →
  `numberOfLines` mit `ellipsizeMode="tail"` ist auf allen drei Plattformen
  der Standardfall; die Gerätesichtprüfung deckt Android ab.

## Migration Plan

Keine. Der neue Speicher startet leer; bestehende Pläne bleiben unverändert.
Rücknahme: Code zurücknehmen, der Schlüssel `scheduleModuleNames` bleibt
ungelesen liegen.
