## Context

Motivation und Umfang stehen in `proposal.md`, die Anforderungen in
`specs/schedule/spec.md`. Hier nur, was den technischen Zuschnitt bestimmt.

Der Planungsmodus (`app/src/areas/schedule/screens/PlanungScreen.tsx`, 721
Zeilen) ist gebaut und bedienbar. Fünf Eigenschaften des vorhandenen Standes
prägen den Entwurf:

1. **Die Fachlogik liegt schon außerhalb des Bildschirms.**
   `planungsstand.ts` berechnet je (Modul, Veranstaltungsart) einen Stand aus
   drei Werten (`'offen' | 'eindeutig' | 'gewaehlt'`) samt `gewaehlteSlots`;
   `groupMatch.ts` beantwortet die Gruppenzugehörigkeit; `konflikt.ts` prüft
   Kandidaten gegen den Zwischenstand. `PlanungScreen` verdrahtet sie nur.
2. **Die Zeile trägt heute eine Sammelzeile abgeleiteter Angaben.** In
   `TerminZeile` (Zeile 493–608) wird ein Array `abgeleitet: string[]` aus bis
   zu fünf Textbausteinen zusammengesetzt und mit vorangestelltem `ⓘ` als
   dritte Zeile ausgegeben — das Ergebnis des Requirements „Unterscheidung
   abgeleiteter Angaben von Quelldaten". Dort steht heute „Gewählt",
   „Eigene Gruppe", „Bereits zugewiesen ({{count}})", „Noch nicht eingeplant",
   „Zeitkonflikt".
3. **Der Rohname des Termins ist bereits vorhanden.** `kursbaum.ts`
   berechnet `anzeigename` nur für `Modul.name`; jeder einzelne
   `OfficialTermin` in `modul.termine` trägt seinen unveränderten `name` aus
   INT-002. Die Zeile greift heute lediglich auf `modul.name` statt auf
   `termin.name` zu.
4. **Es gibt kein Kopfelement im Bildschirmkörper.** Oben steht allein die
   `WochentagsLeiste`; alle weiteren Bedienwege liegen in der
   Navigations-Kopfzeile (`app/app/(tabs)/(schedule)/_layout.tsx`) und werden
   über Modulspeicher angebunden (`planungAktion.ts`). Das Muster für
   Ansichtsschalter ist das `VerwaltungsblattZugang`-Blatt der Wochenansicht:
   ein Kopfzeilen-Symbol öffnet ein `Modal` mit `Switch`-Zeilen über
   `useAnsichtEinstellungen`.
5. **`istPruefung` sitzt auf `PlanEntryBase`**, nicht auf `CustomPlanEntry` —
   also an beiden Eintragsarten. Erzeugt wird es heute ausschließlich vom
   Schalter im Termineditor (`TerminEditorScreen.tsx:143/180/287`); der
   offizielle Prüfungsbestand aus INT-009 ist noch nicht gebaut.

Der `studentSet`-Wert, den das neue Requirement „Anzeige der zugewiesenen
Gruppenkennungen" sichtbar machen soll, ist kein Verzeichnis einzelner
Kennungen, sondern ein Bereich über Buchstaben. Der Live-Befund vom
2026-09-04 (`openspec/specs/integrations/spec.md`, INT-002) nennt für
`INPBPI/2` 21 Werte: `A-P`, `M-N`, `I-J`, `K-L`, `O-P`, `E-F`, `C-D`, `A-B`,
`G-H`, `G-I`, `K-M`, `N-P`, `C5-E`, `M5-P`, `J-M4`, `H5-J`, `F-H4`, `A`, `B`,
`C`, `D`. Eine Zerlegung in konkrete Kennungen ist unmöglich: Die Zahl je
Buchstabe ist nach oben unbegrenzt, `A-P` benennt keine sechzehn Kennungen,
sondern beliebig viele.

## Goals / Non-Goals

**Goals:**

- Den Planungsstand einer Reihe aus derselben reinen Funktion speisen, die ihn
  schon berechnet — vier einander ausschließende Stände statt der heutigen
  Textbausteine, ohne eine zweite Ableitung im Bildschirm.
- Farbliche Hervorhebung als abschaltbare Zutat führen, die Aussage selbst als
  unverlierbaren Text oder Symbol.
- Die Trennung zwischen Quelldatum und abgeleiteter Angabe in der Zeile
  erhalten, wenn ihr zwei neue Angaben zuwachsen.
- Den Ausstieg nach dem Sichern auf einen einzigen Stapelzustand bringen, ohne
  die Entkopplung aus `planungsmodus-sichern-absturz` zurückzunehmen.

**Non-Goals:**

- Keine Änderung an der Auswahllogik selbst. Was ein Klick bewirkt, welche
  Slots vorbelegt werden und wie der Zwischenstand gesichert wird, bleibt
  unberührt.
- Keine Änderung am Bedienweg in den Planungsmodus hinein, nur am Weg heraus.
- Kein Ersatz für den entfallenden Prüfungsschalter. Die Migration steht im
  REMOVED-Requirement und braucht keinen Code.
- Keine Vorarbeit für die Optimierungshälfte (Issue #27). Die vierte Zeile im
  Hervorhebungsblatt entsteht erst mit ihr.

## Decisions

### 1. Der Planungsstand wächst in `planungsstand.ts`, nicht im Bildschirm

Die vier Stände des Requirements sind nicht dieselben wie die heutigen drei
Werte von `VeranstaltungsartStandArt`. Heute steht der Stand je **(Modul,
Veranstaltungsart)**; die Kennzeichnung wird aber je **Zeile**, also je Termin,
gebraucht, und die Zeile unterscheidet zusätzlich, ob *dieser* Termin gewählt
ist oder ein anderer derselben Reihe.

Gewählt: eine zweite reine Funktion in `planungsstand.ts`, die aus dem
vorhandenen `VeranstaltungsartStand` und dem betrachteten Termin den
Zeilenstand ableitet — vier Ausprägungen, passend zu den vier Scenarios:

```
eingeplant            dieser Termin gewählt, gewaehlteSlots.length === 1
mehrfachEingeplant    dieser Termin gewählt, gewaehlteSlots.length > 1   (+ Anzahl)
anderweitig           dieser Termin nicht gewählt, stand === 'gewaehlt'
offen                 stand !== 'gewaehlt'
```

Die Alternative — die Fallunterscheidung wie heute in `TerminZeile` als Kette
von `if`-Zweigen über `abgeleitet` — wurde verworfen: Sie ist der Grund, warum
der heutige Zustand „Gewählt" und „Bereits zugewiesen" gleichzeitig ausgeben
kann und am Gerät als zusammenhanglose Textliste erscheint. Eine Funktion mit
einem Rückgabewert macht die vier Stände zu einer Fallunterscheidung, die sich
einzeln testen lässt, ohne den Bildschirm zu rendern — wie
`ermittlePlanungsstand` selbst.

`VeranstaltungsartStandArt` bleibt unverändert. Der Wert `'eindeutig'` trägt
weiterhin die Vorbelegung, und die Leiste der ausstehenden Veranstaltungen
liest weiterhin `stand !== 'gewaehlt'`.

### 2. Kennzeichnung als Symbol plus Text, nicht als Farbe

Jeder der vier Stände bekommt ein eigenes Ionicons-Symbol und einen eigenen
Textbaustein (`vector-icons-native-migration` ist archiviert, Symbole stehen
zur Verfügung). Die Farbe kommt hinzu, trägt aber nie allein — das verlangt
sowohl das Requirement selbst („zusätzlich zur Farbe durch Symbol oder Text
unterscheidbar") als auch das Requirement „Bedeutung nicht allein über Farbe"
der Capability `ux-and-theming`, und es ist die Voraussetzung dafür, dass
Entscheidung 4 die Farbe überhaupt abschalten darf.

Die Anzahl bei mehrfach eingeplanten Reihen steht im Text
(`{{count}}`-Interpolation wie bisher bei `planungZeileZugewiesen`), nicht als
Ziffer im Symbol: ein Badge in Zeilengröße ist derselbe Wahrnehmungsfehler,
aus dem der ursprüngliche Zwei-Haken-Vorschlag verworfen wurde.

Die vorhandene Auswahl-Checkbox (`☑`/`☐`, `accessibilityRole="checkbox"`)
bleibt, was sie ist: die Bedienung. Die Kennzeichnung ist eine Auskunft und
steht getrennt davon in der abgeleiteten Zeile — sonst tragen zwei Symbole
nebeneinander teils dieselbe, teils verschiedene Aussage.

### 3. Der Gruppen-`studentSet` wird unverändert gezeigt

Gewählt: Der Rohwert steht in der **zweiten** Zeile, bei Art, Raum und
lehrender Person — dort stehen die unveränderten Angaben aus INT-002. Ist die
eigene Kennung nach `gruppenzugehoerig` eingeschlossen, tritt in der **dritten**
Zeile ein abgeleiteter Chip mit der eigenen Kennung hinzu, und die Zeile wird
(abschaltbar, Entscheidung 4) farblich hervorgehoben.

```
08:00–09:30 · Technisches Englisch 3
SV · A.2.03 · Müller · C5-E          <- Quelldaten, unverändert
ⓘ eingeplant · C8 ist deine Gruppe   <- abgeleitet
```

Verworfen: den Bereich in einzelne Buchstabengruppen aufspannen (`C5-E` →
`C5`, `D`, `E`). Das wäre eine Ableitung, die mehr behauptet, als die Quelle
hergibt — `C5` ist keine Gruppenkennung, sondern eine Bereichsgrenze —, und
`A-P` füllte die Zeile mit sechzehn Kacheln, die nichts unterscheiden.

Verworfen ebenso, allein „Eigene Gruppe" stehen zu lassen: Genau das ist der
Befund des Gerätetests. Zwischen zwei parallelen Terminen entscheidet der
Unterschied `C5-E` gegen `A-B`; die Auskunft „gehört zu dir" trägt ihn nicht.

**Folge für das Spec-Delta:** Das Scenario „Eigene Gruppe unter den
zugewiesenen" nennt einen Termin, der „die Gruppenkennungen `C7` und `C8`
trägt". Diese Form liefert INT-002 nicht. Das Scenario ist vor der Umsetzung
auf einen real vorkommenden Wert umzuschreiben (`C5-E` bei eigener Kennung
`C8`), damit der zugehörige Test keinen Fall herstellen muss, den es nicht
gibt. Das ist eine Nacharbeit am bereits erstellten `specs`-Artefakt und
gehört als erster Schritt in `tasks.md`.

### 4. Die drei Hervorhebungsschalter liegen im vorhandenen Einstellungsspeicher

Gewählt: drei weitere `boolean`-Felder in `AnsichtEinstellungen`
(`ansichtEinstellungen.ts`) neben `zeitachse`, `sprungZuHeute`,
`farbautomatik` und `alternativenEinblenden` — mit den Vorgaben `true` für die
eigene Gruppe, `false` für Konflikte und für eingeplante Reihen. `bereinige`
liest sie wie jedes andere Feld einzeln über `alsBoolean`; ein gespeicherter
Altstand ohne diese Felder fällt damit von selbst auf die Vorgabe. Das erfüllt
das Scenario „Voreinstellung beim ersten Öffnen" ohne eigenen Migrationspfad.

Verworfen: ein eigener Speicherschlüssel nur für den Planungsmodus. Er wäre ein
zweiter Ort für dieselbe Art Angabe (gerätelokale Ansichtseinstellung), und der
Planungsmodus liest `useAnsichtEinstellungen` bereits.

**Ort der Bedienung:** ein Kopfzeilen-Symbol am Planungsmodus, das ein Blatt
öffnet — dasselbe Muster wie `VerwaltungsblattZugang`, als eigene Komponente
`HervorhebungsblattZugang` neben dem vorhandenen `PlanungSpeichernZugang` in
der `headerRight`-Gruppe der Route `planung`. Verworfen: eine feste Leiste im
Bildschirmkörper unter der `WochentagsLeiste`. Sie kostet dauerhaft Höhe in der
Liste, die den eigentlichen Inhalt trägt, und stünde quer zum eingeführten
Muster, nach dem Ansichtsschalter des Bereichs in einem Blatt liegen.

Das Requirement fordert „im Kopfbereich des Planungsmodus". Die
Navigations-Kopfzeile ist dieser Kopfbereich; der Zugang ist dort dauerhaft
sichtbar, nur die Schalter selbst liegen eine Ebene tiefer.

### 5. Abgeschaltete Hervorhebung heißt: `style` entfällt, Text bleibt

Die Umsetzung ist an allen drei Stellen dieselbe — die farbliche Zutat wird an
eine Bedingung gehängt, der Textbaustein nicht:

```tsx
eigeneGruppe && hervorhebungEigeneGruppe && { backgroundColor: `${colors.accent}22` }
```

Damit ist die Anforderung „Eine abgeschaltete Hervorhebung darf die zugrunde
liegende Angabe nicht entfernen" strukturell erfüllt statt durch Sorgfalt: Der
Textbaustein wird an keiner Stelle an einen Schalter gebunden. Der Test dazu
prüft, dass der Text bei abgeschalteter Hervorhebung weiterhin auffindbar ist —
nicht, dass ein `style` fehlt.

Die Umrandung gewählter Termine (`borderColor: colors.accent, borderWidth: 2`,
Requirement „Kennzeichnung gewählter Termine im Planungsmodus") ist **keine**
der drei abschaltbaren Hervorhebungen: Sie kennzeichnet die eigene Auswahl,
nicht einen Planungsstand. Der Schalter „bereits eingeplante Reihen" betrifft
allein die Reihen, bei denen ein **anderer** Termin gewählt ist (Zeilenstand
`anderweitig`).

### 6. Der Rohname kommt aus dem Termin, `kursbaum.ts` bleibt unverändert

`termin.name` trägt den unveränderten Namen bereits. Die Zeile wechselt von
`modul.name` auf `termin.name` — in der Überschrift und im
`accessibilityLabel`. `anzeigename` in `kursbaum.ts` wird nicht angefasst; es
gilt ohnehin nur für `Modul.name`, und `Modul.name` wird von der Modulauswahl
gebraucht, wo die Zusammenführung richtig bleibt. Damit hat der Change keinen
Eingriff in `kursbaum.ts`, obwohl `proposal.md` ihn unter den betroffenen
Dateien führt.

Die Leiste der ausstehenden Veranstaltungen (`AusstehendLeiste`) liest
`stand.modulName` — den zusammengeführten Namen. Sie bleibt dabei: Ihr Eintrag
benennt eine **Veranstaltungsart eines Moduls**, für die noch nichts gewählt
ist, also gerade keinen einzelnen Termin, dessen Rohname zu zeigen wäre. Das
Requirement spricht von „die Namen der Termine"; die Leiste nennt keinen.

### 7. Der Rückweg wird durch Abräumen des Stapels geschlossen, nicht durch Verstecken der Kopfzeile

Der Weg in den Planungsmodus läuft über mehrere Bildschirme
(`index` → `kurse` → `gruppenkennung` → `planung`). `router.replace('/')`
tauscht nur den obersten Eintrag; zurück bleibt
`[index, kurse, gruppenkennung, index]`. Der Zurück-Pfeil führt dann über
`gruppenkennung` genau dorthin zurück, wovon der Gerätetest berichtet.

Gewählt: vor dem Ersetzen den Stapel auf seine Wurzel bringen
(`router.dismissAll()`, ersatzweise `navigation.popToTop()`), sodass danach
allein `index` steht und die Kopfzeile von selbst keinen Zurück-Pfeil zeigt.

Verworfen: `headerBackVisible: false` an der Route `index`. Das versteckt den
Pfeil, lässt die Zwischenbildschirme aber im Stapel stehen — die Zurück-Geste
unter Android und die Wischgeste unter iOS führten weiterhin dorthin, und das
Requirement verbietet den Rückweg, nicht seine Anzeige.

Der Aufruf bleibt an derselben Stelle und hinter demselben
`requestAnimationFrame` wie heute (`planungsmodus-sichern-absturz`,
Entscheidung 2): Beide Navigationsschritte gehören in denselben Frame nach dem
abgeschlossenen Zustandslauf, damit das Abmelden der Kopfzeilen-Aktion
committet ist, bevor `react-native-screens` die Fragment-Transaktion beginnt.

### 8. `istPruefung` verschwindet vollständig aus `PlanEntryBase`

Das Feld sitzt auf der gemeinsamen Basis, sein einziger Erzeuger ist der
Schalter im Termineditor. Mit dem REMOVED-Requirement entfällt der Erzeuger;
ein Feld, das nur noch `false` annehmen kann, bleibt nicht stehen.

Gewählt: Das Feld entfällt aus `PlanEntryBase`, aus der Prüfung in
`planStore.ts:51`, aus den Darstellungen in `ScheduleScreen.tsx:897/912` und
`TerminDetailScreen.tsx:190`, aus dem Editor (`TerminEditorScreen.tsx`) und aus
allen Testfixtures (rund zwölf Dateien setzen es auf `false`). Eine
Datenmigration entfällt: Die App ist nicht ausgeliefert, und `planStore`
verwirft ohnehin einen Eintrag, dessen Form nicht passt.

Verworfen: das Feld nach `OfficialPlanEntry` verschieben, um dem Requirement
„Visuelle Kennzeichnung von Prüfungsterminen" ein Zuhause zu lassen. Der
offizielle Prüfungsbestand wird aus INT-009 abgeleitet und ist noch nicht
gebaut; sein Change bringt die Kennzeichnung mit, und wo sie sitzt, entscheidet
er besser als dieser. Ein vorgehaltenes Feld ohne Erzeuger wäre eine Zusage,
die niemand prüft.

**Folge für die Definition of Done:** Das MODIFIED-Requirement „Visuelle
Kennzeichnung von Prüfungsterminen" hat nach diesem Change keinen umgesetzten
Code und keinen laufenden Test mehr — der vorhandene Test
(`ScheduleScreen.test.tsx:531`) erzeugt eine eigene Prüfung und entfällt mit
dem Erzeuger. Das Requirement bleibt im Bestand als unerfüllte Anforderung an
den künftigen Prüfungsplan-Change. Das ist bewusst und muss in `tasks.md` als
solches vermerkt sein, damit es beim Archivieren nicht als übersehene Lücke
gilt.

### 9. Die Textkataloge tragen die Beschriftungsänderungen

Betroffen sind `app/src/i18n/de.json` und `app/src/i18n/en.json`:

| Schlüssel | heute | künftig |
|---|---|---|
| `schedule.konfliktAngenommen` | „Angenommener Konflikt" | „Konflikt" |
| `schedule.konfliktAngenommenMit` | „Angenommene Überschneidung mit {{titel}}" | „Überschneidung mit {{titel}}" |
| `schedule.planungGewaehlt` | „Gewählt" | ersetzt durch die vier Zeilenstände |
| `schedule.planungEigeneGruppe` | „Eigene Gruppe" | ersetzt durch den Kennungs-Chip |
| `schedule.terminPruefungLabel` | „Dieser Termin ist eine Prüfung" | entfällt |

`konfliktAngenommenMit` steht nicht ausdrücklich im Spec-Delta, trägt aber
dieselbe Behauptung an derselben Sache und wird mitgeändert — die
Beschriftungsregel des Requirements gälte sonst nur an einer von zwei Stellen.

Neue Schlüssel entstehen für die vier Zeilenstände, den Kennungs-Chip, den
Blatt-Zugang und die drei Schalterzeilen. Beide Sprachen von Anfang an
(NFR-F-115); keine Zeichenkette fest im Code.

## Risks / Trade-offs

**Die dritte Zeile wächst weiter.** Sie trägt künftig Zeilenstand, eigene
Gruppe und Konflikt nebeneinander und kann auf einem schmalen Gerät umbrechen.
→ Die vier Zeilenstände schließen einander aus (Entscheidung 1), wo heute
„Gewählt" und „Bereits zugewiesen" gleichzeitig erscheinen konnten; unter dem
Strich stehen dort selten mehr Bausteine als heute. Beim Gerätetest der
Umsetzung ausdrücklich zu prüfen.

**`dismissAll()` trifft einen Stapel, der auch flach sein kann.** Wird der
Planungsmodus per Tiefeneinsprung direkt geöffnet, steht unter ihm allein
`index` (`unstable_settings.initialRouteName`). → `dismissAll` ist in diesem
Fall folgenlos, `router.replace('/')` dahinter führt unverändert ans Ziel. Der
Fall ist als Test abzudecken, weil er sich sonst erst am Gerät zeigt.

**Der Rohname macht die Liste breiter und redundanter.** Zwölf Termine
„Technisches Englisch 1" bis „Technisches Englisch 12" stehen künftig mit ihrer
Endzahl untereinander. → Genau das ist der Zweck: Ohne die Zahl sind sie zwölf
identische Zeilen. Die Zusammenführung bleibt dort, wo sie hilft.

**Das Entfernen von `istPruefung` berührt rund zwölf Dateien, überwiegend
Testfixtures.** Ein übersehenes Vorkommen fällt beim Übersetzen auf, nicht zur
Laufzeit. → Die Umstellung ist typgetrieben und damit vollständig prüfbar;
`tsc` ist das Abnahmekriterium dieses Blocks.

**Ein bestehendes Requirement bleibt nach diesem Change ohne Umsetzung**
(Entscheidung 8). → Bewusst, begründet und in `tasks.md` zu vermerken; die
Definition of Done wird dafür nicht umgangen, sondern die Zuständigkeit an den
künftigen Prüfungsplan-Change abgegeben.
