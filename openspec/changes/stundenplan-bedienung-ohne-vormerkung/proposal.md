# Planungsmodus und Wochenansicht: Bedienung ohne Vormerkung

## Why

Issue #62 sammelt siebzehn Beobachtungen aus dem Betrieb des Planungsmodus auf dem Gerät (Pixel 9 Pro, 2026-09-08) und einen Laufzeitfehler. Sie zerfallen in vier Gruppen.

**Die Vormerkung trägt nicht.** Der Status „fest"/„vorgemerkt" wurde am 2026-09-04 aus einer Rücksprache mit einer studierenden Person aufgenommen und seither an fünf Stellen ausgebaut: eine Zuordnungsregel im Planungsmodus, ein „als fest festlegen"-Bedienweg je Zeile, eine dritte Konfliktstufe `vorgemerkterKonflikt`, eine eigene Kennzeichnung in der Wochenansicht und eine geplante Erklärung im Termindetail. Am Gerät erweist sich das als zu viel Bedienoberfläche für zu wenig Ertrag: Die Alt-App kennt nur „abspeichern" oder „nicht abspeichern", und der eigentliche Bedarf — einen Termin im Plan behalten, ohne ihn wahrzunehmen — ist dort ein „deaktivieren", das die Veranstaltung ausgraut. Entscheidung vom 2026-09-08: Die Vormerkung entfällt in der gesamten App; an ihre Stelle tritt ein Deaktivieren in der Wochenansicht.

**Der Planungsmodus lässt sich nicht zu Ende bedienen.** Es gibt keinen Weg, die Auswahl zu verwerfen — weder im Planungsmodus noch in der Modulauswahl; wer neu ansetzen will, muss jedes Häkchen einzeln zurücknehmen. Die lehrende Person fehlt in der Terminzeile, obwohl `lecturerName` an jedem Rohtermin steht und das Requirement „Anzeige der Termindetails" sie für die Detailansicht bereits verlangt. Der Sprung aus der Leiste der Ausstehenden setzt eine Hervorhebung, die danach dauerhaft stehenbleibt, und scrollt das Ziel nicht in den sichtbaren Bereich. Nach dem Sichern bleibt man im Planungsmodus stehen, statt das Ergebnis zu sehen. Der Verweis „Zur Modulauswahl" oben links doppelt den Zurück-Weg der Kopfzeile, den `unstable_settings.initialRouteName` ohnehin dorthin führt.

**Der Bildschirm ist eng, und die Chips sind zu breit.** Die Wochentags-Chips im Planungsmodus tragen `minWidth: 48` plus `paddingHorizontal: 12` in einem waagerechten Scroll und belegen auf Android rund ein Achtel der Seitenhöhe, obwohl fünf Tage nebeneinander bequem in die Breite passen. Die Leiste der ausstehenden Veranstaltungen wechselt ihre Höhe zwischen den Wochentagen, weil ihre Chips je nach Konfliktlage ein- oder zweizeilig sind — der darüberliegende Plan springt bei jedem Tagwechsel. Der Bearbeiten-Weg der Wochenansicht ist ein Textlink mit `alignSelf: 'flex-end'` im Inhaltsbereich statt eines Symbols in der Kopfzeile.

**Ein Laufzeitfehler.** `terminSchluessel` bildet die Kennung eines Rohtermins aus Kurs, Art, Wochentag, Zeitraum, Raum und Gruppenmenge. INT-002 liefert im geprüften Bestand Termine, die in allen sechs Feldern übereinstimmen (belegt: `44232|Ü|Tue|720|765|C.E.32|A-P`), womit der Schlüssel doppelt vergeben wird und React die zweite Zeile verwirft. Die im Kommentar von `planungsstand.ts` festgehaltene Annahme der Eindeutigkeit ist damit widerlegt.

## What Changes

### Die Vormerkung entfällt, das Deaktivieren tritt an ihre Stelle

**BREAKING** für den gerätelokalen Bestand: `status: 'fest' | 'vorgemerkt'` entfällt an jedem Planeintrag, neu tritt `deaktiviert: boolean` hinzu (Vorgabe: aktiv). Ein gespeicherter Eintrag mit `status: 'vorgemerkt'` wird beim Laden zu einem deaktivierten Eintrag, einer mit `status: 'fest'` zu einem aktiven; nichts geht verloren.

Ein deaktivierter Termin bleibt in der Wochenansicht ausgegraut sichtbar und ist **vollständig stumm**: kein Konflikthinweis, nicht in „laufender und nächster Termin", nicht in Benachrichtigungen, nicht im Kalender- und Datei-Export. Umschaltbar im Termindetail. Der Planungsmodus kennt nur noch „hinzugefügt" und „nicht hinzugefügt" und zeigt den deaktivierten Zustand nicht an — dort geht es um die Zusammenstellung, nicht um die Wahrnehmung.

Zwei gleichzeitig gewählte Gruppen-Slots sind damit beide schlicht hinzugefügt und erzeugen einen Konflikthinweis. Wer ihn nicht will, deaktiviert einen der beiden. Das bestehende `akzeptierteKonflikte` bleibt unverändert für den Fall, dass jemand bewusst zu beiden geht.

### Planungsmodus

- **Auswahl verwerfen** als Bedienweg neben dem Speichern-Symbol in der Kopfzeile, mit Bestätigung. Setzt den Zwischenstand auf den gesicherten Plan zurück, ohne den Plan selbst anzutasten
- **Lehrende Person** in der Terminzeile, gleichrangig zu Raum und Veranstaltungsart
- **Farbliche Hervorhebung der eigenen Gruppe** zusätzlich zur bestehenden Textkennzeichnung
- **Farbige Umrandung eines gewählten Termins** — der Zustand „gewählt" steht heute allein im Kästchensymbol
- **Wochentags-Chips über die volle Breite**, gleichmäßig aufgeteilt, ohne waagerechten Scroll, in gedrängter Höhe
- **Feste Höhe der Leiste der ausstehenden Veranstaltungen**, unabhängig von Wochentag und Inhalt
- **Ein „+" links in dieser Leiste** legt einen eigenen Termin an; der bisherige Knopf unter der Leiste entfällt
- **Der Sprung aus der Leiste** hebt das Ziel kurz auf, scrollt es in den sichtbaren Bereich und kehrt danach in den Normalzustand zurück
- **Ein eigener Termin aus dem Planungsmodus ist stets wöchentlich**, und sein Wochentag steht durch den gerade sichtbaren Tag fest; beide Bedienelemente werden dort nicht angeboten
- **Nach dem Sichern** wechselt das System in die Wochenansicht
- **Der Verweis „Zur Modulauswahl" entfällt**
- **Deckungsgleiche Rohtermine** werden vor der Darstellung zu einem zusammengefasst

### Modulauswahl

- **Auswahl verwerfen** oben rechts in der Kopfzeile, mit Bestätigung und mit derselben Rückfrage zu vorhandenen Planeinträgen, die die Abwahl eines einzelnen Moduls bereits stellt

### Wochenansicht

- **Der Bearbeiten-Weg wird ein Stift-Symbol oben rechts in der Kopfzeile** und führt in die Einrichtung. Damit ist der Einrichtungs-Zugang aus dem Ansichts- und Verwaltungsblatt des Changes `stundenplan-wochenansicht-nutzerfuehrung` ausgegliedert; jenes Blatt behält die Ansichtsschalter und die beiden Löschaktionen
- **Die Wochentags-Chips füllen die volle Breite** und tragen nur Wochentag und Datum, keine Terminanzahl
- **Deaktivieren eines Termins** im Termindetail

### Querschnittlich

- **Von der App abgeleitete Angaben werden von den Daten des Fachbereichs unterscheidbar dargestellt.** Zeit, Raum, Bezeichnung, Gruppenmenge und lehrende Person stammen aus INT-002; Konflikthinweis, „noch nicht eingeplant", „bereits zugewiesen", „eigene Gruppe" und die Überschneidungswarnung sind Schlussfolgerungen der App. Heute stehen beide in derselben Zeile in derselben Gestalt

## Capabilities

### New Capabilities

Keine.

### Modified Capabilities

- `schedule`: Vormerkung entfällt (drei Requirements REMOVED, drei MODIFIED); Deaktivieren eines Termins; Verwerfen der Auswahl in Planungsmodus und Modulauswahl; lehrende Person, Gruppenhervorhebung und Auswahlkennzeichnung im Planungsmodus; Wochentagsleisten über die volle Breite ohne Belegungsvorschau; feste Höhe und „+" in der Leiste der Ausstehenden; Sprungverhalten; eigener Termin aus dem Planungsmodus stets wöchentlich; Wechsel in die Wochenansicht nach dem Sichern; Stift-Symbol als Zugang zur Einrichtung; Zusammenfassen deckungsgleicher Rohtermine
- `ux-and-theming`: abgeleitete Angaben von Quelldaten unterscheidbar darstellen
- `data-and-storage`: Überführung gespeicherter Einträge mit `status` in `deaktiviert` ohne Datenverlust

## Impact

- `app/src/areas/schedule/typen.ts` — `status` entfällt, `deaktiviert` kommt hinzu
- `app/src/areas/schedule/planStore.ts` — Überführung beim Laden; `deaktiviert` umschalten
- `app/src/areas/schedule/planungsstand.ts` — `bestimmeStatus` entfällt; `terminSchluessel` wird eindeutig; Zusammenfassen deckungsgleicher Rohtermine
- `app/src/areas/schedule/konflikt.ts` — die Stufe `vorgemerkterKonflikt` entfällt
- `app/src/areas/schedule/wochenansicht.ts`, `jetzt.ts` und der Export — deaktivierte Einträge bleiben außen vor
- `app/src/areas/schedule/screens/PlanungScreen.tsx` — Verwerfen, lehrende Person, Hervorhebungen, Chips, Leiste mit „+", Sprungverhalten, Wechsel nach dem Sichern, Wegfall des Modulauswahl-Verweises
- `app/src/areas/schedule/screens/CourseSelectionScreen.tsx` — Verwerfen in der Kopfzeile
- `app/src/areas/schedule/screens/TerminEditorScreen.tsx` — Wochentag und Wiederholung im Planungsmodus-Aufruf festgelegt
- `app/src/areas/schedule/screens/TerminDetailScreen.tsx` — Deaktivieren statt Statusumschalter
- `app/src/areas/schedule/screens/ScheduleScreen.tsx` — Wegfall des Einrichtungs-Textlinks, Chips über die volle Breite
- `app/src/areas/schedule/ui/PlanungSpeichernZugang.tsx` und `app/app/(tabs)/(schedule)/_layout.tsx` — Kopfzeilenelemente
- `app/src/areas/schedule/planungAktion.ts` — zweite Aktion neben dem Sichern

## Roadmap-Zuordnung

Roadmap-Schritt 5 (Stundenplan), Etappe „Plan". Bewusst **nicht** enthalten: der Kalender- und Datei-Export, der Prüfungsplan, der Raumplan-Abgleich und der automatische Planungsvorschlag; sie stehen unverändert in der Capability. Der Export wird nur insoweit berührt, als deaktivierte Termine nicht mitgehen.

## Verhältnis zum Change `stundenplan-wochenansicht-nutzerfuehrung`

Jener Change ist angelegt, aber noch nicht umgesetzt. Er überschneidet sich an drei Stellen mit diesem. Der vorliegende Change ist an allen dreien maßgeblich; die betroffenen Punkte sind anschließend per `/opsx:update` aus jenem Change herauszunehmen:

| Punkt | Dort | Hier |
|---|---|---|
| Wochentagsleiste ohne Terminanzahl | MODIFIED „Wochentagsleiste mit bedarfsweisem Samstag", REMOVED „Belegungsvorschau je Tag" | dasselbe, zusätzlich volle Breite — die MODIFIED-Fassung hier ist die vollständige |
| Zugang zur Einrichtung | Teil des Ansichts- und Verwaltungsblatts | eigenes Stift-Symbol oben rechts; das Blatt behält Ansichtsschalter und Löschaktionen |
| Statusumschalter „fest/vorgemerkt" | Task 8.4: um eine Erklärung ergänzen | entfällt ersatzlos; Task 8.4 wird gegenstandslos |

Dieser Change setzt jenen **nicht** voraus und wird vor ihm umgesetzt. Wird jener später archiviert, sind seine Deltas zu den drei genannten Requirements zuvor zu bereinigen.

## Offene Entscheidungen

Keine. Die vier Fragen, die der Schnitt aufwarf, sind am 2026-09-08 entschieden (Fragerunde zu Issue #62):

1. **Zuschnitt:** ein einziger Change für das gesamte Issue statt einer Aufteilung nach Bildschirm — die Abschaffung der Vormerkung wirkt ohnehin in beide
2. **Ersatz der Vormerkung:** „deaktiviert" statt einer einmaligen Konfliktbestätigung; Konflikthinweise bleiben im Übrigen bestehen
3. **Wirkung des Deaktivierens:** vollständig stumm, nicht bloß optisch zurückgenommen
4. **Kopfzeile der Wochenansicht:** das Stift-Symbol führt in die Einrichtung — sie ist genau die Konfiguration, die Issue #62 mit „bearbeiten" meint

Zwei Punkte sind **Gestaltungsfragen und keine offenen Entscheidungen** (`quality-and-testing` führt Gestaltung als protokoll- statt spezifikationspflichtig): wie ein deaktivierter Termin ausgegraut aussieht, ohne unter den Mindestkontrast zu fallen, und woran man abgeleitete Angaben von Quelldaten erkennt. Beide stehen in `design.md` und als Punkte des Prüfprotokolls in `tasks.md`.
