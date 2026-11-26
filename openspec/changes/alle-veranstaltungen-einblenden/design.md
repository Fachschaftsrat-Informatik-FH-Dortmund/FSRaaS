## Context

Die Wochenansicht kann bereits zusätzliche Termine einblenden: Das Requirement
„Einblenden aller Veranstaltungen gewählter Module" zeigt die weiteren Termine
der Module, die der Plan schon trägt. Umgesetzt ist das in
`app/src/areas/schedule/alternativen.ts`. Die Funktion `alternativenDesTages`
erzeugt synthetische, nie gespeicherte `PlanEntry`-Objekte mit dem Merkmal
`istAlternative: true`. `ScheduleScreen.tsx` mischt sie in die Tagesliste, die
`layoutTag` (Zeitachse) und die kompakte Liste unverändert verarbeiten. Der
Auswahlbestand wird über `useTermineFuerEndpunkte` nur abgerufen, solange der
Schalter aktiv ist.

Der Change ergänzt eine zweite Quelle für eingeblendete Termine: die nicht
gewählten Module desselben Auswahlbestands. Für die Begründung siehe
`proposal.md`, Abschnitt Why.

Weitere Randbedingungen aus dem Bestand:

- „Gewählt" heißt im Code: Der Plan trägt mindestens einen Eintrag des Moduls
  (`gewaehlteModule`, `planungsstand.planEintraegeFuerModul`). Die Auswahl in
  der Modulauswahl selbst wird nicht gespeichert. Sie reist als
  Routenparameter `module` zur Gruppenkennung und von dort in den
  Planungsmodus.
- Der Planungsmodus (`PlanungScreen`) nimmt jedes Modul aus dem
  Routenparameter `module` zusätzlich zu den Modulen mit Planeinträgen auf.
- Rückfragen laufen über `ConfirmDialog` (`app/src/ui/`, Requirement
  „Bestätigungsdialoge als Pop-up").

## Goals / Non-Goals

**Goals:**

- Ein Mechanismus für alle eingeblendeten Termine. Alternativen und nicht
  gewählte Veranstaltungen unterscheiden sich nur in ihrer Herkunft, nicht im
  Weg durch Zeitachse, Stapelung und Kachel.
- Eingeblendete Termine bleiben aus Konfliktprüfung, Jetzt-Anzeige, Export
  und Wochentagsleiste heraus, ohne dass diese Stellen davon wissen müssen.

**Non-Goals:**

- Kein eigener Speicher für die Modulauswahl. „Aufnehmen" führt in den
  Planungsmodus, der das Modul dann als Kandidat führt. In den Plan kommt es
  erst durch die dortige Wahl und das Sichern.
- Keine Obergrenze für überschneidende Spalten. Ob die Kacheln bei vielen
  Einblendungen bedienbar bleiben, ist ein Prüfpunkt am Gerät (`proposal.md`,
  Offener Punkt).
- Keine Änderung am Planungsmodus selbst.

## Decisions

### 1. Herkunft als Merkmal statt Wahrheitswert

`PlanEntry.istAlternative?: boolean` wird zu
`einblendung?: { art: 'alternative' | 'nichtGewaehlt'; modulKey: string }`.
Die Kachel braucht die Art für ihr Textkennzeichen. Der Tipp braucht sie, um
den richtigen Bedienweg zu wählen, und den `modulKey`, um das Modul an den
Planungsmodus zu übergeben.

*Alternative:* Ein zweites Merkmal `istNichtGewaehlt` neben `istAlternative`.
Verworfen, weil damit zwei Wahrheitswerte gleichzeitig `true` sein könnten,
obwohl die Herkunft eindeutig ist. Den Modulschlüssel bräuchte man trotzdem.

### 2. Eine Erzeugungsfunktion je Herkunft, eine gemeinsame Zusammenstellung

`alternativen.ts` bekommt die zweite Funktion `nichtGewaehlteDesTages`. Sie
nimmt alle Module des Auswahlbestands ohne Planeintrag und liefert deren
Termine am Wochentag, nach derselben Bauart wie `alternativenDesTages`:
stabile Kennung aus `terminSchluessel` mit eigenem Präfix und einmaliges
Einblenden eines Rohtermins, der in mehreren Modulen steht.

Ein Rohtermin, der in einem gewählten und zugleich in einem nicht gewählten
Modul steht, gehört zur gewählten Seite. Er erscheint nie als „nicht gewählt",
sonst würde das Antippen ein Modul zum Aufnehmen anbieten, dessen Termin der
Plan schon führt.

Beide Ergebnisse durchlaufen in `ScheduleScreen` anschließend
`termineDesTages`. Damit gilt das Requirement „Anzeige nur im
Gültigkeitszeitraum" auch für eingeblendete Termine. Die bestehende
Alternativen-Einblendung hat den Zeitraum bisher nicht geprüft. Das wird hier
nachgezogen, weil das Requirement unbedingt gilt.

### 3. Getrennter Schalter, gemeinsamer Abruf

Der neue Schalter heißt in `AnsichtEinstellungen` `alleEinblenden`. Er steht im
Ansichts-Blatt (`VerwaltungsblattZugang`) neben dem Alternativen-Schalter und
der Zeitachse. Den Auswahlbestand ruft die Ansicht ab, sobald einer der
beiden Einblendungsschalter aktiv ist. Den Lade-, Fehler- und Offline-Hinweis
(`AlternativenStatus`) zeigt sie unter derselben Bedingung. Der Leerhinweis
„keine gewählten Module" gilt nur der Alternativen-Einblendung.

*Alternative:* Ein einziger Schalter für beide Einblendungen. Verworfen, weil
die Requirements zwei verschiedene Dinge beschreiben. Wer Alternativen zum
eigenen Modul sucht, will nicht zugleich den ganzen Studiengang sehen.

### 4. Gemeinsamer Darstellungsweg, unterschiedliches Textkennzeichen

Beide Arten laufen durch `TerminKachel` und den vorhandenen abgesetzten Stil
für Einblendungen. Das Kennzeichen lautet „Alternative" bzw. „Nicht gewählt",
damit die Bedeutung nicht allein am Rahmen hängt (UX-F-070). Ein Rohtermin
ist nie beides (Entscheidung 2).

### 5. Aufnehmen über `ConfirmDialog` und den Planungsmodus

Ein Tipp auf einen nicht gewählten Termin öffnet `ConfirmDialog`. Der Titel
nennt die Art, die Frage nennt den Veranstaltungsnamen. Die erste Aktion
„Nicht aufnehmen" ist `primary`. Das ist dieselbe Vorbelegung auf „nein" wie
bei der Abwahl in `CourseSelectionScreen`. Die zweite Aktion „Modul aufnehmen"
ist `secondary`. Zurück-Taste oder Escape gelten als „nein".

Bei Zustimmung navigiert die Ansicht nach
`/planung?module=<modulKey>`. Dort führt der Planungsmodus das Modul neben
den Modulen mit Planeinträgen als Kandidaten. Das entspricht dem Szenario
„Aufnahme bestätigt".

*Alternative:* Das Modul direkt in den Plan schreiben, etwa mit allen seinen
Terminen oder nur dem angetippten. Verworfen. Welche Veranstaltungsart und
welcher Gruppen-Slot gilt, entscheidet nach dem Requirement „Modulauswahl
ohne Veranstaltungsart und Gruppen-Slot" der Planungsmodus, nicht die
Wochenansicht.

## Risks / Trade-offs

- [Viele überschneidende Kacheln bei aktivem Schalter] → Beobachtung am Gerät
  als Prüfpunkt in `tasks.md`. Ausweg für die Nutzerin ist die abschaltbare
  Zeitachse im selben Blatt.
- [Größerer Speicherbedarf beim Abruf aller Module] → Kein zusätzlicher
  Abruf. Der Bestand ist derselbe, den Modulauswahl und Planungsmodus schon
  laden und zwischenspeichern.
- [Umbenennung von `istAlternative` berührt `typen.ts`] → Das Merkmal ist
  optional und wird nie gespeichert (`planStore` prüft es nicht). Gelesen
  wird es nur in `alternativen.ts` und `ScheduleScreen.tsx`.
