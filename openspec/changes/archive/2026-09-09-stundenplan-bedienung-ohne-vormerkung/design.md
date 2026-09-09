## Context

Siehe `proposal.md` — Why. Drei Umstände prägen den Zuschnitt.

**Der Status sitzt tief.** `status: 'fest' | 'vorgemerkt'` steht in `typen.ts` an `PlanEntryBase`, wird in `planStore.bereinige()` gegen eine Werteliste geprüft (ein Eintrag mit unbekanntem Wert wird **verworfen**), von `konflikt.ermittleKonflikte` als Filter benutzt, von `planungsstand.bestimmeStatus` vergeben, von `PlanungScreen.alsFestBestimmen` umgeschrieben und von `planStore.statusUmschalten` gewechselt. Der Entfall ist keine Umbenennung, sondern berührt sieben Module.

**Der Planungsmodus ist frisch und noch nirgends erprobt.** Er entstand am 2026-09-08 aus zwei Changes hintereinander; Issue #62 ist die erste Rückmeldung von einem echten Gerät. Entsprechend viele der Punkte sind Maßhaltigkeiten (Chip-Breite, Leistenhöhe, Sprungverhalten) und keine Fachlogik — sie liegen in `PlanungScreen.tsx` und in `styles`, nicht in den reinen Modulen.

**Zwei Bildschirme, dieselbe Leiste.** Wochenansicht und Planungsmodus führen je eine eigene Wochentagsleiste mit eigenem Styling; beide sollen künftig die volle Breite füllen. Das ist der Anlass, sie zusammenzulegen.

## Goals / Non-Goals

**Goals:**

- Der Zustand eines Termins wird an genau einer Stelle ausgewertet, damit „vollständig stumm" nicht in fünf Modulen einzeln nachgezogen werden muss
- Fachlogik bleibt in den reinen Modulen ohne React (`konflikt.ts`, `planungsstand.ts`, `wochenansicht.ts`, `jetzt.ts`), wie im Bereich durchgehend
- Keine neue Abhängigkeit

**Non-Goals:**

- Kein Umbau der Zeitachse, der Stapelung oder des Ansichts-Blatts — die stehen im Change `stundenplan-wochenansicht-nutzerfuehrung`
- Keine Serverspeicherung des Deaktiviert-Zustands; der Plan bleibt gerätelokal (`data-and-storage`)
- Keine Rückfrage vor dem Deaktivieren. Es ist verlustfrei umkehrbar und damit keine zerstörende Aktion im Sinne von `ux-and-theming`

## Decisions

### 1. `deaktiviertBis` statt eines zweiten Wahrheitswerts

```ts
/** null = aktiv; 'dauerhaft' = bis zur Rücknahme; Zahl = Unix-Sekunden, bis wann. */
deaktiviertBis: null | 'dauerhaft' | number;
```

Ein reines `deaktiviert: boolean` neben einem `deaktiviertBis: number | null` ließe vier Kombinationen zu, von denen zwei bedeutungslos sind. Ein einziges Feld mit drei Ausprägungen kennt keinen widersprüchlichen Zustand.

`status` entfällt aus `PlanEntryBase`, `PlanEntryStatus` aus `typen.ts`. `STATUSES` und die Statusprüfung in `istGueltigeBasis` entfallen ersatzlos — `deaktiviertBis` ist ein reguläres Pflichtfeld des Schemas, geprüft wie jedes andere (Entscheidung 2).

**Verworfen:** `status: 'aktiv' | 'deaktiviert'` weiterzuführen und nur umzubenennen. Das hätte die einmalige Reichweite nicht getragen und den Eindruck erhalten, es handle sich um dieselbe Sache unter neuem Namen — sie ist es nicht: „vorgemerkt" war eine Aussage über die Entscheidungslage, „deaktiviert" ist eine über die Wahrnehmung.

### 2. Keine Überführung — `bereinige()` prüft `deaktiviertBis` wie jedes andere Feld

**Zurückgenommen im Prüfprotokoll vom 2026-09-09.** Ursprünglich vorgesehen war eine Überführung in `planStore.bereinige()`: ein gespeicherter Eintrag mit `status: 'vorgemerkt'` würde zu `deaktiviertBis: 'dauerhaft'`, einer mit `status: 'fest'` zu `deaktiviertBis: null`, protokolliert und **nicht** als verworfen gezählt.

Entscheidung bei der Geräteprüfung: Kein im Einsatz befindliches Gerät hält noch einen Bestand alter Gestalt — der Status „fest"/„vorgemerkt" existierte nur kurz, zwischen den Changes `stundenplan-planungsmodus-feinauswahl` (2026-09-08) und diesem. Eine Überführung für einen Fall, der nicht eintritt, ist Aufwand ohne Ertrag und ungeprüfter Code. Ein Eintrag, der dennoch `status` statt `deaktiviertBis` trägt, durchläuft denselben Weg wie jeder andere schema-fremde Eintrag: `istGueltigeBasis` verlangt `deaktiviertBis` als Pflichtfeld, ein Eintrag ohne dieses Feld fällt durch und wird nach DATA-F-020 einzeln verworfen und protokolliert — der übrige Bestand bleibt erhalten.

**Verworfen (weiterhin):** ein Versionsfeld am Bestand mit einer Migrationskette — mit dem Entfall der Überführung erst recht ohne Anlass.

### 3. Eine Funktion `istAktiv(eintrag, jetzt)` als einzige Auswertung

```ts
export function istAktiv(e: PlanEntry, jetztSek: number): boolean {
  if (e.deaktiviertBis === null) return true;
  if (e.deaktiviertBis === 'dauerhaft') return false;
  return jetztSek >= e.deaktiviertBis;
}
```

Ausgewertet wird beim Lesen, nicht durch einen Aufräumlauf — dasselbe Muster wie in der Alt-App (`TimetableEvent.isInvalid()`). Das Requirement „Selbsttätiges Ende einer einmaligen Deaktivierung" ist damit ohne Zeitgeber erfüllt; es gibt keinen Zustand, der beim nächsten Öffnen nachzuziehen wäre.

Die Funktion liegt bei `time.ts`, nicht bei `planStore.ts`: Sie ist rein, und `konflikt.ts`, `wochenansicht.ts` und `jetzt.ts` sollen nicht auf den Speicher zeigen müssen. Aufrufer:

| Modul | Wirkung |
|---|---|
| `konflikt.ermittleKonflikte` | ersetzt den bisherigen Filter `status === 'fest'` |
| `wochenansicht.ts` | deaktivierte Termine bleiben in der Liste, tragen aber ein Merkmal für die Darstellung |
| `jetzt.ts` | deaktivierte Termine kommen als laufender/nächster nicht in Betracht |
| Export (noch nicht umgesetzt) | deaktivierte Termine gehen nicht mit |
| `PlanungScreen` | **kein** Aufrufer — der Planungsmodus kennt den Zustand nicht |

**Wichtig für die Wochenansicht:** Sie filtert deaktivierte Termine *nicht* heraus. Sie zeichnet sie zurückgenommen und übergibt sie der Konfliktprüfung als das, was sie sind — die Prüfung übergeht sie selbst.

### 4. Der Zeitpunkt der einmaligen Deaktivierung folgt der Alt-App-Regel

`TimetableDayFragment.java:150-163`: Endzeit des Termins, auf den betreffenden Wochentag gelegt; liegt der Zeitpunkt bereits in der Vergangenheit, eine Woche weiter. Diese Regel wird übernommen, weil sie den erwarteten Fall trifft: Wer am Dienstagmorgen „diese Woche nicht" sagt, meint den Dienstag, den er vor sich hat, nicht den vergangenen.

Der Bedienweg bietet die beiden Reichweiten als getrennte Einträge an („dauerhaft deaktivieren" / „nur dieses Vorkommen"), nicht als Umschalter mit Datumsauswahl. Ein Datum ist an dieser Stelle nicht zu bestimmen, sondern ergibt sich aus dem Termin.

### 5. Konfliktstufen: drei werden zwei

`pruefeKandidatGegenZwischenstand` liefert heute `'konfliktfrei' | 'konflikt' | 'vorgemerkterKonflikt'`. Die dritte Stufe existierte allein für den entfallenen Status; sie entfällt mit ihm, samt der Zeilenkennzeichnung `planungZeileVorgemerkterKonflikt`. Geprüft wird gegen alle Einträge des Zwischenstands, die im gesicherten Plan aktiv sind — in der Sitzung neu gewählte Termine sind stets aktiv.

### 6. Deckungsgleiche Rohtermine werden beim Aufbau der Modulliste zusammengefasst

Der doppelte React-Key ist nur das Symptom. `terminSchluessel` ist zugleich die fachliche Identität eines Slots: `alsFestBestimmen` und die Vorbelegung vergleichen darüber, und `terminEntsprichtEintrag` bildet denselben Merkmalssatz auf Planeinträge ab. Einen Index an den Key zu hängen, würde den Renderer beruhigen und die Identität zerstören — zwei deckungsgleiche Termine wären dann zwei wählbare Zeilen, die auf denselben Planeintrag zeigen.

Zusammengefasst wird deshalb in `kursbaum.baueModulliste`, an der Stelle, an der die Termine eines Moduls entstehen: Termine mit gleichem `terminSchluessel` werden auf den ersten reduziert, der Vorfall protokolliert. Damit bleibt der Schlüssel eindeutig, und alle nachgelagerten Vergleiche stimmen wieder.

Die Abgrenzung zu `courseId 411031` (zwei Räume, ein `studentSet`) hält der Schlüssel selbst: Er führt `roomId`, also bleiben jene zwei Termine getrennt. Die Erläuterung der Haupt-Spec zu diesem Fall bleibt gültig.

### 7. Kopfzeilen-Aktionen: `planungAktion.ts` wird verallgemeinert

Das Speichern-Symbol des Planungsmodus liegt außerhalb des Komponentenbaums (in `_layout.tsx`) und wird über ein Modul-Register (`registriereePlanungAktion`) angebunden. Dasselbe Muster trägt die zwei neuen Kopfzeilen-Bedienwege:

- Planungsmodus: das Register nimmt zusätzlich `verwerfen` auf; `PlanungSpeichernZugang` zeigt beide Symbole
- Modulauswahl: ein zweites Register derselben Bauart für „Auswahl verwerfen"
- Wochenansicht: das Stift-Symbol braucht **kein** Register — es navigiert nur und kann direkt in `_layout.tsx` stehen

**Verworfen:** ein React-Kontext über den ganzen Stack. Das Register ist bereits da, ist geprüft, und ein Kontext müsste über die Route-Grenze hinweg gehalten werden, an der Expo Router die Kopfzeile aufbaut.

### 8. Eine gemeinsame `WochentagsLeiste`

Beide Bildschirme bekommen dieselbe Komponente: `flexDirection: 'row'` mit `flex: 1` je Eintrag, ohne `ScrollView`. Der Inhalt eines Eintrags ist je Bildschirm verschieden (Wochenansicht: Wochentag und Datum; Planungsmodus: Wochentag), die Aufteilung der Breite und die Mindesthöhe von 44 dp sind es nicht.

Bei sieben Tagen auf einem schmalen Gerät wird die Beschriftung eng. Das Kürzel ist zweistellig („Mo"), das Datum einstellig-bis-zweistellig; bei 360 dp Breite bleiben 51 dp je Eintrag. Das trägt, solange die Schrift der Systemgröße folgt und nicht künstlich verkleinert wird — bei sehr großer Systemschriftgröße bricht das Datum in eine zweite Zeile, was die feste Mindesthöhe auffängt.

### 9. Feste Höhe der Leiste der Ausstehenden

Die Höhe schwankt, weil ein Eintrag bei fehlender konfliktfreier Option eine zweite Textzeile bekommt. Der Hinweis wird ein vorangestelltes Symbol in derselben Zeile; die Leiste bekommt eine feste `height` statt `minHeight`. Der Meldetext „keine konfliktfreie Option" bleibt als `accessibilityLabel` erhalten — die Bedeutung darf nicht allein am Symbol hängen (`ux-and-theming`, „Bedeutung nicht allein über Farbe" und „Beschriftung für Bildschirmvorleser").

Das „+" steht als erster Eintrag links **außerhalb** des scrollenden Inhalts, damit es nicht wegwandert, wenn viele Veranstaltungen ausstehen.

### 10. Kurzzeitige Hervorhebung und Sprung

`hervorgehoben` bleibt Bildschirmzustand, wird aber nach Ablauf zurückgesetzt (rund 1,5 s) und um ein Scrollen ergänzt: Die Terminliste bekommt eine `ScrollView`-Referenz, jede Zeile meldet ihre Y-Position über `onLayout`, der Sprung ruft `scrollTo`. Bei eingeschalteter reduzierter Bewegung (`useReducedMotion`) springt die Liste ohne Animation — das Requirement „Reduzierte Bewegung respektieren" gilt auch hier.

**Verworfen:** eine `FlatList` mit `scrollToIndex`. Die Liste ist auf einen Wochentag begrenzt und zählt selten mehr als fünfzehn Zeilen; der Umbau brächte nichts als eine zweite Listenmechanik im selben Bildschirm.

**Nachtrag (Prüfprotokoll 2026-09-09):** Trägt eine Veranstaltungsart mehrere Slots, sprang das Sprungziel zunächst auf `stand.slots[0]` — den ersten Slot in Eingabereihenfolge, unabhängig von der Gruppenkennung. Am Gerät erwartet: der Sprung zielt auf den ersten Slot der **eigenen** Gruppe (`gruppenzugehoerig`, `groupMatch.ts`), fällt auf den ersten Slot der Liste zurück, wenn keiner passt. Umgesetzt in `AusstehendLeiste` (`PlanungScreen.tsx`).

### 11. Abgeleitete Angaben werden abgesetzt geführt

Die Umsetzung des neuen `ux-and-theming`-Requirements im Planungsmodus:

```
  ┌────────────────────────────────────────────┐
  │ ☑  08:00–09:30 · Algorithmen               │   <- Quelldaten des Fachbereichs
  │    V · C.E.32 · Prof. Muster               │      (Zeit, Name, Art, Raum, Lehrende)
  │    ⓘ noch nicht eingeplant · eigene Gruppe │   <- Schlüsse der App, abgesetzt:
  └────────────────────────────────────────────┘      eigene Zeile, Symbol, gedämpft
```

Die dritte Zeile trägt ein einheitliches vorangestelltes Symbol und eine gedämpfte Farbe. Sie ist damit an Anordnung *und* Symbol erkennbar, nicht nur an der Farbe. Dieselbe Form gilt in der Wochenansicht für Konflikthinweis und Gruppenkennzeichnung.

Wie genau das Symbol aussieht, ist Gestaltung und im Prüfprotokoll zu belegen; dass die Trennung über eine eigene Zeile mit Symbol läuft, ist hier festgelegt, damit sie nicht je Bildschirm anders ausfällt.

### 12. Der eigene Termin aus dem Planungsmodus

`TerminEditorScreen` erhält einen Routenparameter, der den Aufruf aus dem Planungsmodus kennzeichnet. In diesem Fall werden Wochentagsauswahl und Wiederholungsschalter **nicht angeboten** (nicht: angeboten und gesperrt) — ein sichtbares, aber totes Bedienelement ist schlechter als keines. Der Wochentag kommt wie bisher aus dem Parameter, `wiederkehrend` ist fest `true`.

### 13. Der Wechsel in die Wochenansicht nach dem Sichern

`sichern()` leert `sessionEntscheidungen` und `entfernteIds`; erst danach ist `hatUngesicherteAenderungen` falsch und `usePreventRemove` lässt die Navigation zu. Der Wechsel muss deshalb nach dem Zustandslauf erfolgen, nicht im selben Aufruf — sonst fängt die Rückfrage „ungesicherte Änderungen" die eigene Sicherung ab. Umgesetzt über einen Effekt, der auf ein gesetztes „gesichert"-Merkmal reagiert, und über `router.dismissAll()` bzw. `router.replace('/')`, damit der Planungsmodus nicht auf dem Stapel bleibt und der Zurück-Weg aus der Wochenansicht nicht wieder dorthin führt.

## Risks / Trade-offs

**Der Change `stundenplan-wochenansicht-nutzerfuehrung` berührt dieselben Requirements** → In `proposal.md` ist tabellarisch festgehalten, welche drei das sind und dass dieser Change an allen dreien maßgeblich ist. Wird jener Change vor diesem archiviert, entstehen widersprüchliche Deltas; die Reihenfolge ist deshalb festgelegt und in `tasks.md` als Abschlussschritt genannt.

**Die Migration läuft still** → **Gegenstandslos seit dem Prüfprotokoll vom 2026-09-09** (Entscheidung 2): Es gibt keine Migration mehr, da kein Gerät noch einen Bestand alter Gestalt hält.

**„Vollständig stumm" trifft Teile, die es noch nicht gibt** → Kalender- und Datei-Export sowie terminbezogene Benachrichtigungen sind nicht umgesetzt. Das Requirement gilt trotzdem; sein Nachweis für diese Teile fällt an, wenn sie entstehen. `tasks.md` führt für sie keinen Umsetzungsschritt, sondern nur die Auswertung über `istAktiv`, die dann bereitsteht.

**Die Chip-Breite bei sieben Tagen** → Bei sehr großer Systemschriftgröße und schmalem Gerät wird ein Eintrag zweizeilig. Aufgefangen durch die feste Mindesthöhe; am Gerät zu prüfen (Prüfprotokoll).

**Das Zusammenfassen deckungsgleicher Termine könnte echte Angebote schlucken** → Nur, wenn der Fachbereich zwei verschiedene Angebote ohne jedes unterscheidende Merkmal führte. Dann wären sie auch für einen Menschen nicht zu unterscheiden. Das Protokoll macht jeden Fall sichtbar, falls sich die Annahme als falsch erweist.

## Migration Plan

Keine. Weder serverseitig (der Plan liegt gerätelokal) noch gerätelokal — die anfangs vorgesehene Überführung entfällt (Entscheidung 2, Prüfprotokoll 2026-09-09), da kein Gerät mehr einen Bestand alter Gestalt hält.

## Open Questions

Keine, die Specs, Vorgehen oder Aufgabenschnitt berühren. Zwei **Gestaltungsfragen** sind am Gerät zu entscheiden und im Prüfprotokoll festzuhalten (`tasks.md`, Block 9):

1. Wie ein deaktivierter Termin ausgegraut wird, ohne das Requirement „Mindestkontrast für Stundenplan-Einträge" zu verletzen — verringerte Deckkraft steht dem entgegen, eine neutrale Ersatzfarbe womöglich nicht
2. Welches Symbol die abgeleiteten Angaben trägt und ob dieselbe Form auch für die Wochenansicht trägt, wo weniger Platz ist
