## Context

Motivation und Umfang: siehe `proposal.md`. Der Planungsmodus
(`app/src/areas/schedule/screens/PlanungScreen.tsx`) zeigt je Wochentag eine
Liste von `TerminZeile`n. Die Schlüsse der App stehen dort in einer dritten,
mit „ⓘ" eingeleiteten Zeile (`abgeleitet`), die je nach Zustand Einträge
gewinnt oder verliert — bis hin zum Wegfall der ganzen Zeile. Der Stand je
(Modul, Veranstaltungsart) kommt aus `planungsstand.ermittlePlanungsstand`;
der Modulname aus `kursbaum.baueModulliste` ist bereits auf den Namensstamm
zusammengeführt. Nach dem Sichern navigiert der Bildschirm mit
`router.replace('/')` — der Stapel des `(schedule)`-Stacks lautet dann
`index → kurse → gruppenkennung → index`, daher der Zurück-Pfeil.

Issue #123 (Zeilen verrutschen, wenn eine Zeile gewählt wird) betrifft
denselben Bildschirm und ist durch das Requirement „Kennzeichnung des
Planungsstands je Veranstaltungsreihe" mittelbar abgedeckt: Hat jede Zeile
immer genau eine Kennzeichnung, entfällt der Wegfall der dritten Zeile. Er
wird deshalb hier mit erledigt (Entscheidung 2). Issue #122 (Hinweis auf
automatisch gewählte Termine) ist im Spec-Delta nicht enthalten und bleibt
außen vor.

## Goals / Non-Goals

**Goals:**
- Jede Terminzeile trägt immer genau eine Kennzeichnung des Planungsstands;
  ihre Höhe ändert sich beim Wählen nicht.
- Die drei Hervorhebungen sind gerätelokal gespeichert, wie die übrigen
  Ansichtseinstellungen.
- `istPruefung` verschwindet vollständig aus Typ, Speicher, Editor, Detail
  und Wochenansicht.

**Non-Goals:**
- Kein Hinweis auf automatisch vorbelegte Termine (Issue #122).
- Keine Umsetzung der Kennzeichnung offizieller Prüfungen: Der offizielle
  Prüfungsbestand ist noch nicht angebunden; mit `istPruefung` entfällt die
  bisher einzige Quelle. Das Requirement „Visuelle Kennzeichnung von
  Prüfungsterminen" wird mit der Anbindung des Prüfungsplans umgesetzt.
- Keine neue Bestätigungs-Primitive (läuft im Change `bestaetigung-als-popup`).

## Decisions

### 1. Veranstaltungsreihe = (Modul, Veranstaltungsart)

Die „Veranstaltungsreihe" des Spec-Deltas ist die Einheit, die
`planungsstand.ts` bereits als `VeranstaltungsartStand` führt. Eine reine
Funktion `zeilenStand(termin, stand, gewaehlt)` in `planungsstand.ts` leitet
daraus den Zeilenstand ab: `eingeplant` (dieser Termin gewählt, Reihe hat
genau einen), `mehrfach` (dieser Termin gewählt, Reihe hat mehrere, mit
Anzahl), `anderweitig` (dieser Termin nicht gewählt, Reihe hat mindestens
einen, mit Anzahl), `offen` (Reihe hat keinen). Alternative — der Bildschirm
rechnet selbst — verworfen: Fachlogik bleibt außerhalb des Bildschirms, wie
bisher.

`anderweitig` nennt die Anzahl ebenfalls, weil das unverändert gültige
Requirement „Kennzeichnung des Planungsstands je Veranstaltung" die Anzahl an
den übrigen Terminen der Art verlangt.

### 2. Kennzeichnung als feste Plakette, Rahmen mit konstanter Breite

Die Kennzeichnung steht als Symbol (Ionicons) plus Text in einer eigenen,
immer vorhandenen Zeile. Konflikt bleibt ein zusätzlicher Text in derselben
Zeile. Der Rahmen jeder Zeile ist immer 2 dp breit; nur seine Farbe wechselt
(gewählt: Akzent, sonst Randfarbe). Bisher wuchs er von 1 auf 2 dp — auch
das verschob die Liste (Issue #123). Die Sprung-Hervorhebung bleibt 3 dp; sie
ist kurzzeitig und betrifft nur eine Zeile.

Symbole: `checkmark-circle` (eingeplant), `checkmark-done-circle` (mehrfach),
`swap-horizontal` (anderweitig), `ellipse-outline` (offen). Bedeutung steht
immer zusätzlich im Text (`ux-and-theming`, „Bedeutung nicht allein über
Farbe").

### 3. Gruppenkennungen als Plaketten, eigene fett und umrandet

INT-002 liefert je Termin genau einen `studentSet`-Wert: eine einzelne
Kennung, einen Bereich wie `C5-E` (Grenzen teils offen, also nicht
aufzählbar) oder `*`. Die Zeile zeigt diesen Wert unverändert als Plakette
(`*` als „Alle Gruppen"). Schließt er die eigene Kennung ein
(`gruppenzugehoerig`), folgt eine zweite Plakette mit der eigenen Kennung,
fett und umrandet; ist der Wert selbst genau die eigene Kennung, wird diese
eine Plakette so dargestellt. Fett und Rahmen tragen die Hervorhebung ohne
Farbe. Alternative — Bereiche in Einzelkennungen auflösen — verworfen: offene
Grenzen lassen sich nicht aufzählen. Der Text „Eigene Gruppe" entfällt; die
Zugehörigkeit steht im `accessibilityLabel` der eigenen Plakette.

### 4. Hervorhebungsschalter in `ansichtEinstellungen.ts`, unter der Wochentagsleiste

Drei neue Felder `hervorhebungEigeneGruppe` (Vorgabe `true`),
`hervorhebungKonflikte` und `hervorhebungEingeplant` (Vorgabe `false`), mit
derselben Bereinigung wie die bestehenden Felder. Die Schalter stehen als
eine Zeile umschaltbarer Plaketten (`accessibilityRole="switch"`) direkt
unter der Wochentagsleiste, oberhalb der Liste. Alternative — im
Verwaltungsblatt der Wochenansicht — verworfen: Das Spec-Delta verlangt den
Kopfbereich des Planungsmodus, und die Wirkung soll beim Umschalten sichtbar
sein.

Farbwirkung: eigene Gruppe — Hintergrund in Akzent-Tönung (wie bisher);
Konflikt — Hintergrund in Gefahr-Tönung, hat Vorrang vor der eigenen Gruppe;
eingeplant — Zeilen der Stände `anderweitig` werden abgeblendet
(Deckkraft 0,55), die ausstehenden treten dadurch hervor. Keine dieser
Wirkungen ändert die Zeilenhöhe.

Das Requirement „Hervorhebung der eigenen Gruppe im Planungsmodus" verlangt
die Hervorhebung bisher unbedingt. Das Spec-Delta führt es deshalb als
MODIFIED mit dem Vorbehalt der Einstellung.

### 5. Rohname aus dem Termin, nicht aus dem Modul

Die Zeile zeigt `termin.name` statt `modul.name`. `kursbaum.ts` bleibt
unverändert — der Rohname ist am Termin ohnehin erhalten. Die Leiste der
ausstehenden Veranstaltungen nennt weiterhin den zusammengeführten
Modulnamen: Sie benennt Reihen, keine Termine.

### 6. `router.dismissTo('/')` statt `router.replace('/')`

`dismissTo` räumt den Stapel bis zur vorhandenen Wochenansicht ab, statt eine
zweite Wochenansicht oben aufzulegen. Der Versatz um einen Frame
(`requestAnimationFrame`) und die einmalige Abmeldung der Kopfzeilen-Aktion
aus `planungsmodus-sichern-absturz` bleiben unverändert.

### 7. „Konflikt" als Beschriftung

`schedule.konfliktAngenommen` → `schedule.konfliktKennzeichen` („Konflikt"),
`schedule.konfliktAngenommenMit` → `schedule.konfliktPaarMit` („Konflikt mit
{{titel}}"). In der Wochenansicht tragen damit angenommene und nicht
angenommene Überschneidungen dieselbe Beschriftung; die Detailansicht
unterscheidet weiter über die Aktion „Konflikt annehmen".

### 8. `istPruefung` ersatzlos entfernen

Feld aus `OfficialPlanEntry`/`EigenerEintrag`, Prüfung aus der
Speichervalidierung (`planStore.ts`) — gespeicherte Einträge mit dem Feld
bleiben gültig, das Feld wird beim Lesen ignoriert —, Schalter im Editor,
Angabe in der Detailansicht und Kachelrand in der Wochenansicht entfallen.

## Risks / Trade-offs

- [`dismissTo` verhält sich auf Android anders als `replace` und berührt den
  in `planungsmodus-sichern-absturz` behobenen Absturz] → Versatz und
  Abmeldung bleiben; Geräteabnahme auf Android ist Pflichtpunkt in
  `tasks.md`.
- [Gleiche Beschriftung für angenommene und offene Konflikte in der
  Wochenansicht] → vom Spec-Delta gewollt; die Unterscheidung bleibt in der
  Detailansicht.
- [Requirement „Visuelle Kennzeichnung von Prüfungsterminen" bis zur
  Anbindung des Prüfungsplans ohne Umsetzung] → im Requirement bereits auf
  den offiziellen Bestand eingegrenzt; offen, bis der Prüfungsplan kommt.
