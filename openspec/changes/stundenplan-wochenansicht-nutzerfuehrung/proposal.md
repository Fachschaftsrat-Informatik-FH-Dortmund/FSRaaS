# Wochenansicht: Bedienbarkeit, Zeitachse und Verwaltung des Plans

## Why

Die Wochenansicht ist der meistgenutzte Bildschirm der App. Sechs Befunde aus der Durchsicht vom 2026-09-08:

**Der Tagwechsler scrollt weg.** Der gesamte Bildschirm ist ein einziger Scroll. Wochenkopf und Tageschips stehen oben — sobald man im Tag nach unten scrollt, sind sie fort. Die Chips sind aber die einzige Möglichkeit, den Tag zu wechseln; bei einer Achse von acht bis achtzehn Uhr liegen rund 900 dp dazwischen.

**Die Zeitachse steht falsch aufgespannt.** Ihre Spanne ergibt sich aus der ganzen Woche: frühester Beginn bis spätestes Ende aller Termine. Ein einzelner Abendtermin am Donnerstag dehnt damit jeden anderen Tag. Ein Dienstag mit Terminen von 8 bis 12 Uhr bekommt Leerraum bis 19:30, und eine Freistunde von 12:30 bis 16:00 wird als 315 dp hoher gestrichelter Block gezeichnet, an dem man vorbeiscrollen muss. `design.md` des Vorgänger-Changes hat „Spanne je Tag" mit der Begründung verworfen, gleich hohe Kacheln stünden dann für unterschiedliche Dauern — **das trifft für diese Umsetzung nicht zu**: `DP_JE_MINUTE` ist eine Konstante, eine 90-Minuten-Kachel ist immer 135 dp hoch, unabhängig von der Spanne. Übrig bleibt von jenem Einwand nur, dass die Achse beim Tagwechsel oben anders ansetzt.

**Bei vier parallelen Terminen zerfällt der Tag.** `dayLayout.ordneSpaltenZu` färbt Intervalle gierig **ohne Obergrenze**; bei fünf Überschneidungen ist eine Kachel ein Fünftel der Breite, und kein Titel ist mehr lesbar.

**Zwei Filter widersprechen einander.** „Alle anzeigen" überlagert „Gruppenfremde ausblenden", ohne dessen Schalter zu bewegen — beide zeigen dann Gegensätzliches. Der Gruppenfilter selbst ist zudem sinnlos geworden: Was im persönlichen Plan steht, hat die Nutzerin dort hingesetzt. Wer bewusst zur Übung einer anderen Gruppe geht, will genau dorthin; diesen Termin auszublenden verbirgt einen Termin, den sie wahrnehmen wird.

**Der Stundenplan lässt sich nicht löschen.** Weder „Plan leeren" noch „zurücksetzen" existiert als Bedienweg. `planStore.clear()` und `einrichtung.clear()` sind beide implementiert und werden von keinem Bildschirm aufgerufen; `toggleSprungZuHeute` ebenso. Die Capability `data-and-storage` kennt nur die globale Aktion „Alle lokalen Daten löschen", die auch Ticket, News-Regeln und Mensa-Einstellungen mitnimmt.

**Kleinere Ungenauigkeiten.** Die Jetzt-Anzeige meldet „in 200 min" statt „in 3 h 20", obwohl der Formatierer `dauerText()` im selben Modul steht und für Lücken bereits verwendet wird. Der Farbwechsel im Termindetail wirkt auf einen einzelnen Termin, während die automatische Vergabe je Veranstaltung erfolgt — wer die Farbe seiner Vorlesung ändert, hat danach eine Übung in der alten Farbe. Und der Knopf „Zur laufenden Woche" erscheint und verschwindet neben der Wochenangabe, wodurch das Layout springt; der Mensaplan löst dasselbe seit jeher besser, indem das Datumsfeld selbst der Knopf ist.

## What Changes

**Der Kopfbereich wird festgenagelt**, und der Tag lässt sich zusätzlich waagerecht wischen. Der Mensaplan wischt bereits über `gesten.ts`; der Baustein liegt vor.

**Die Zeitachse wird auf den Tag zugeschnitten und gestaucht.** Sie beginnt beim ersten und endet beim letzten Termin des Tages — keine Randlücken. Lücken unter fünfzehn Minuten bekommen weder Block noch Beschriftung, nur Luft. Lücken über einer Stunde werden auf Stundenhöhe gestaucht und tragen ihre echte Dauer. (Bruchzeichen, Rahmen und Stundenlinien waren zunächst vorgesehen und sind im Prüfprotokoll vom 2026-09-09 ersatzlos zurückgenommen worden.)

**Überschneidende Termine stehen nebeneinander, ohne Obergrenze.** Eine Kappung auf drei Spalten mit aufklappbarem Stapel war zunächst vorgesehen und erwies sich am Gerät als schlecht bedienbar; sie ist im Prüfprotokoll vom 2026-09-09 zurückgenommen. Wer sich viele überschneidende Veranstaltungen wählt, bekommt schmale Kacheln und weicht für den Überblick auf die nicht maßstabsgetreue Ansicht aus.

**Alle Veranstaltungen der gewählten Module lassen sich einblenden.** Ein Schalter zeigt zusätzlich die Parallel-Slots der eigenen Module — sechs Module bedeuten 64 statt 13 Kacheln in der Woche. Ein Tipp auf eine eingeblendete Alternative öffnet ein Blatt mit „stattdessen wählen" und „zusätzlich aufnehmen". Damit werden die bislang unumgesetzten Anforderungen „Einsicht in Termine anderer Gruppen" und „Übernahme des Termins einer anderen Gruppe" in der Wochenansicht wirksam.

**Ein Kopfzeilen-Element öffnet ein Blatt** mit den Ansichtsschaltern (Zeitachse oder kompakte Liste, Sprung zu heute, alle Gruppen einblenden, Farbautomatik) und den beiden Löschaktionen. Der Schalterkasten unter dem Plan entfällt. Der Zugang zur Einrichtung ist **nicht** Teil dieses Blatts, sondern ein eigenes, dauerhaft sichtbares Kopfzeilen-Symbol daneben — Requirement „Dauerhafter Zugang zur Einrichtung" des Changes `stundenplan-bedienung-ohne-vormerkung`, der an dieser Stelle maßgeblich ist.

**Zwei Löschaktionen, immer auf eigene Initiative.** „Plan leeren" entfernt die Termine und lässt die Einrichtung stehen; „Stundenplan zurücksetzen" nimmt auch Endpunkte und Gruppenkennung mit. Die Bestätigung fragt zusätzlich, ob die selbst angelegten Termine mitgelöscht werden — vorbelegt auf Nein, weil sie Handarbeit sind und im FBWS nicht stehen. **Ein automatisches Löschen ist ausgeschlossen**, auch beim Semesterwechsel.

**Zwei Filter entfallen ersatzlos:** der Schalter zum Ausblenden gruppenfremder Termine und der Schalter zum Abschalten aller Filter. Der Gültigkeitszeitraum wird künftig immer angewandt.

**Der Rückweg zur laufenden Woche folgt dem Mensaplan:** die Wochenangabe selbst ist der Bedienweg, mit einem kleinen Zusatzlabel, das nur erscheint, wenn man nicht in der laufenden Woche steht.

**Die Jetzt-Anzeige wird zweispaltig** — laufende und nächste Veranstaltung nebeneinander — und nennt Zeiträume in lesbarer Form. Der Jetzt-Strich auf der Achse bleibt sichtbar, wenn „jetzt" außerhalb der zugeschnittenen Tagesspanne liegt, indem er an den Rand geheftet wird.

**Der Gültigkeitszeitraum wird je Eintrag änderbar.** Beginn und Ende einzeln, jeweils auch offen, für offizielle wie für eigene Einträge. Die Felder `gueltigVon` und `gueltigBis` bestehen an jedem Eintrag und werden von der Wochenansicht bereits ausgewertet — es fehlte allein der Bedienweg. Das ist zugleich das Auffangnetz für die Ableitung des Zeitraums aus dem Endpunktnamen: Bricht deren Namensmuster weg, erscheint eine Blockwoche als durchgehende wöchentliche Veranstaltung, und die Nutzerin korrigiert das von Hand, statt einem Fehler des Fremdsystems ausgeliefert zu sein.

**Die Farbwahl wirkt auf das Modul.** Beim Verlassen des Termindetails nach einer Farbänderung fragt das System, ob sie für alle Veranstaltungen des Moduls oder nur für die geöffnete gelten soll. Ein Palettenwert „keine Farbe" führt zur Automatik zurück; die Automatik selbst ist im Ansichts-Blatt abschaltbar.

## Capabilities

### New Capabilities

Keine.

### Modified Capabilities

- `schedule`: Zeitachse je Tag mit Stauchung; Nebeneinanderdarstellung ohne Obergrenze; festgenagelter Kopfbereich und Wischen; Ansichts- und Verwaltungsblatt in der Kopfzeile (ohne Einrichtung-Zugang, der eigenständig bleibt); Einblenden aller Veranstaltungen gewählter Module; Farbwahl je Veranstaltung; Jetzt-Anzeige und Jetzt-Strich; Rückkehr zur laufenden Woche; zwei Filter entfallen
- `data-and-storage`: gezielte Nutzeraktionen zum Leeren und Zurücksetzen des Stundenplans, mit Rückfrage zu eigenen Terminen und ohne jedes automatische Löschen; Herkunft der Terminfarbe je Eintrag

## Impact

- `app/src/areas/schedule/zeitachse.ts` — Spanne je Tag statt je Woche
- `app/src/areas/schedule/dayLayout.ts` — Spaltenzuordnung ohne Obergrenze; Lückenschwellen und Stauchung
- `app/src/areas/schedule/ansichtEinstellungen.ts` — `gruppenfremdeAusblenden` und `alleAnzeigen` entfallen, Farbautomatik und Alternativen-Schalter kommen hinzu
- `app/src/areas/schedule/wochenansicht.ts` — Filterauswertung und `leerGrund` vereinfachen sich
- `app/src/areas/schedule/wochentage.ts` — `belegungsvorschauJeTag` entfällt
- `app/src/areas/schedule/screens/ScheduleScreen.tsx` — Kopfbereich, Achse, Blatt, Jetzt-Anzeige
- `app/src/areas/schedule/farbe.ts` — `anzeigeFarbe` entscheidet anhand der gespeicherten Farbherkunft
- `app/src/areas/schedule/screens/TerminDetailScreen.tsx` — Farbgeltung
- `app/src/areas/schedule/planStore.ts` / `einrichtung.ts` — die vorhandenen, bislang toten `clear()` an Bedienwege anbinden
- `app/src/areas/canteen/gesten.ts` — Wiederverwendung für das Tageswischen

## Roadmap-Zuordnung

Roadmap-Schritt 5 (Stundenplan), Etappe „Plan". Bewusst **nicht** enthalten: der Kalender- und Datei-Export, der Prüfungsplan und der Raumplan-Abgleich; sie stehen unverändert in der Capability. Setzt die beiden vorangehenden Changes voraus — der Alternativen-Schalter braucht die gewählten Module.

## Verhältnis zum Change `stundenplan-bedienung-ohne-vormerkung`

Jener Change wurde am 2026-09-09 vor diesem archiviert und ist an drei Punkten maßgeblich, die ursprünglich auch hier vorgesehen waren — bei der Archivierung bereinigt (siehe dessen `proposal.md`, Abschnitt „Verhältnis zum Change stundenplan-wochenansicht-nutzerfuehrung"):

- **Wochentagsleiste ohne Terminanzahl**: vollständig dort umgesetzt (zusätzlich mit voller Bildschirmbreite); die entsprechenden MODIFIED-/REMOVED-Deltas sind aus diesem Change entfernt.
- **Zugang zur Einrichtung**: ein eigenes Kopfzeilen-Symbol (`EinrichtungHeaderZugang`), **nicht** Teil des hiesigen Ansichts- und Verwaltungsblatts.
- **Statusumschalter „fest/vorgemerkt"**: entfällt ersatzlos mit dem Status selbst; Task 8.4 dieses Changes ist damit gegenstandslos.

Der Status „fest" oder „vorgemerkt" existiert seither nicht mehr in der Capability `schedule`.

## Offene Entscheidungen

Keine.

Die zunächst offene Frage, **ob „Termin löschen" bei offiziellen Terminen anders heißen soll,** ist entschieden und als Requirement „Unterscheidung von Entfernen und Löschen im Termindetail" aufgenommen. Sie ergab sich aus zwei bestehenden Anforderungen der Capability `ux-and-theming` — „Bestätigung vor zerstörender Aktion" und „Keine zerstörende Aktion als Primäraktion": Ein offizieller Termin besteht im FBWS fort und ist über den Planungsmodus wiederherstellbar, ein eigener Termin nicht. Beide gleich zu gestalten überzeichnet die eine Folge und verharmlost die andere.

Zwei weitere Punkte sind **Gestaltungsfragen und keine offenen Entscheidungen**: ob die zwölf Farbkreise im Termindetail hinter einen Bedienschritt wandern, und wie ein Termin bei abgeschalteter Farbautomatik aussieht. Die Capability `quality-and-testing` führt Gestaltung als protokollpflichtig statt spezifikationspflichtig; beide stehen deshalb als offene Fragen in `design.md` und als Punkte des Prüfprotokolls in `tasks.md`.
