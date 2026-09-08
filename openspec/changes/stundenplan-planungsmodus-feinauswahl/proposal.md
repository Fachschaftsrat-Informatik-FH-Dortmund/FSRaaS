# Planungsmodus: Feinauswahl von Veranstaltungsart und Gruppen-Slot

## Why

**Der Planungsmodus ist vollständig spezifiziert und zu null Prozent umgesetzt.** Die Capability `schedule` führt achtzehn Requirements dazu — von „Kandidat für die Planung auswählen" über die Konfliktprüfung bis zur Kriterienrangfolge. Eine Suche über `app/src` nach „Kandidat", „Anpinnen", „Zeitfenster" oder „Optimierung" liefert keinen einzigen Treffer. Die Roadmap führt Schritt 5 in fünf Etappen — reine Logik, Einrichtung, Plan, Export, Planung — und die letzte ist offen.

**An seiner Stelle steht eine mechanische Ersatzregel.** Die heutige Kursauswahl schreibt unmittelbar in den persönlichen Plan und vergibt den Status dabei nach der Auswahlreihenfolge: Der zuerst angetippte Slot wird „fest", jeder weitere „vorgemerkt". Das hat mit der Bedeutung, die das Requirement dem Status gibt — „vorgemerkt" erzeugt keinen Konflikthinweis, ist also ein bewusstes Erwägen —, nichts zu tun. Das Kandidaten-Konzept der Spec wird übersprungen.

**Und es gibt einen stillen Fehlschlag.** Schaltet man in der heutigen Kursauswahl eine Veranstaltungsart ein, für die kein Slot zur eigenen Gruppenkennung passt, wählt `artUmschalten` keinen Slot aus und der Schalter springt wortlos zurück. Das ist kein seltener Randfall: Bei Gruppenkennung `C8` und dem Bestand vom 2026-09-08 trifft das jede Veranstaltungsart, deren Slots die Kennung nicht einschließen. Stille Fehler sind nach Capability `security-and-privacy` ausgeschlossen.

**Der Bedarf der Nutzerin ist ein anderer als angenommen.** Beim Planen geht es um zwei Dinge: die Veranstaltungen passend über die Woche zu legen, und dabei keine zu vergessen — nicht „zwischendurch irgendein Praktikum". Eine Messung am echten Bestand zeigt, wie klein die eigentliche Entscheidungsmenge ist: Für sechs Module im 2. Fachsemester von `INPBPI` gibt es dreizehn Kombinationen aus Modul und Veranstaltungsart. Elf davon sind eindeutig — sieben haben überhaupt nur einen Slot, bei vieren trifft die Gruppenkennung genau einen. Echte Wahl bleibt bei zweien: `Algorithmen und Datenstrukturen · ÜPP` (zwei von acht Slots passen zu `C8`, das an der Grenze `C5-E` liegt) und `Technisches Englisch 8 · SV` (zwölf Slots, alle mit `studentSet` `A-P` — die Gruppenkennung hilft dort überhaupt nicht).

## What Changes

**Ein Planungsmodus als eigener Bildschirm, gegliedert nach Wochentagen.** Tabs Montag bis Freitag, darin die Termine der gewählten Module chronologisch mit Ankreuzfeldern. Die Form folgt der Android-Alt-App (`AddEventsActivity`), die dafür als brauchbar gilt — anders als dort aber beschränkt auf die zuvor gewählten Module statt auf den gesamten Bestand, und mit Unterstützung, die es dort nicht gab.

**Vorbelegt wird nur, wo es nichts zu entscheiden gibt.** Hat eine Veranstaltungsart genau einen Slot, sitzt das Häkchen beim Öffnen. Wo mehrere Slots existieren, bleibt es leer — auch wenn die Gruppenkennung einen davon einschließt; jener wird stattdessen hervorgehoben. Jede echte Wahl bleibt bei der Nutzerin, die Scheinwahlen nimmt ihr die App ab.

**Drei Kennzeichnungen je Zeile:** *wird nirgends besucht* (zu diesem Modul und dieser Art ist an keinem Tag ein Haken gesetzt — das Mittel gegen das vergessene Praktikum), *bereits zugewiesen* mit Zähler (verhindert die versehentliche Doppelbelegung und macht das bewusste Belegen zweier Slots sichtbar) und *Zeitkonflikt*.

**Eine schmale Leiste am unteren Rand nennt das Ausstehende beim Namen** — nicht nur eine Zahl. Ein Tipp auf einen Namen wechselt auf den Tag, an dem die Veranstaltung liegt, und hebt sie hervor. Die Leiste leert sich, während man arbeitet; leer heißt fertig.

**Die eigene Gruppe wird hervorgehoben**, wie in der Alt-App. Dort geschieht das über eine orange Karteneinfärbung; der Buchstabe musste über einen Menüdialog eingetippt werden. Bei uns steht die Kennung in der Einrichtung, die Hervorhebung greift von selbst. Sie darf nach Capability `ux-and-theming` nicht die einzige Trägerin dieser Bedeutung sein und bekommt deshalb zusätzlich Text oder Symbol.

**Der Status „fest"/„vorgemerkt" wird hier vergeben**, nicht mehr nach Auswahlreihenfolge. Was eindeutig ist, wird fest; wer bewusst zwei Slots derselben Veranstaltungsart behält, bestimmt selbst, welcher fest und welcher vorgemerkt ist.

**Eigene Termine werden hier angelegt** — und bekommen eine Zweckbestimmung, die bisher fehlte: Sie bilden **wiederkehrende Lehrveranstaltungen** ab, die im FBWS fehlen, etwa die Arbeitsgruppe einer lehrenden Person oder einen Endpunkt, der nicht sauber liefert. **Die App ist kein Kalender**; private Termine gehören nicht hinein. Die Wahl „einmalig" bleibt trotzdem, weil Prüfungen, Nachhol- und Blockveranstaltungen einmalige Lehrtermine sind.

**Uhrzeit und Datum werden über die systemeigene Auswahl erfasst.** Heute sind beides Freitextfelder (`08:00`, `24.11.2026`), deren Eingabe geprüft, zurückgewiesen und erklärt werden muss. Ein Auswahlrad lässt unmögliche Eingaben gar nicht erst entstehen und zeigt die Datumskonvention des Geräts. Der Wochentag wird ein Auswahlfeld statt einer Radioliste über sieben Zeilen.

## Capabilities

### New Capabilities

Keine.

### Modified Capabilities

- `schedule`: Planungsmodus als Bildschirm mit Wochentagsgliederung, Vorbelegung, Kennzeichnungen und Ausstehendenleiste; Statusvergabe im Planungsmodus statt nach Auswahlreihenfolge; Zweckbestimmung eigener Termine; Erfassung von Uhrzeit und Datum über systemeigene Auswahl

## Impact

- neu: Planungsmodus-Bildschirm und die zugehörige reine Fachlogik (Vorbelegung, Planungsstand je Veranstaltungsart, Ausstehendes)
- `app/src/areas/schedule/planStore.ts` — Schreibpfad aus dem Planungsmodus statt aus der Kursauswahl
- `app/src/areas/schedule/konflikt.ts` — Konfliktprüfung eines Kandidaten gegen die festen Termine des Plans
- `app/src/areas/schedule/screens/TerminEditorScreen.tsx` — Auswahlräder statt Freitext
- `app/app/(tabs)/(schedule)/` — neue Route für den Planungsmodus
- neue Abhängigkeiten: `@react-native-community/datetimepicker` und `@react-native-picker/picker` — beide MIT, beide ohne Google-Play-Services-Abhängigkeit und damit mit den F-Droid-Auflagen der Capability `non-functional` vereinbar

## Roadmap-Zuordnung

Roadmap-Schritt 5 (Stundenplan), Etappe „Planung". Bewusst **nicht** enthalten: die dreizehn Optimierungs-Requirements des Planungsmodus — Kriterienrangfolge mit ihren fünf Voreinstellungen, bevorzugtes Zeitfenster, Vorbereitungszeit je Veranstaltungsart, Anpinnen, Ausgangszustand ohne Optimierung, Rücknahme einer übernommenen Optimierung und automatischer Planungsvorschlag. Sie bleiben unverändert in `openspec/specs/schedule/spec.md` stehen und werden in einem eigenen Change umgesetzt. Dieser Change baut die Konfliktlogik, auf der sie aufsetzen.

Setzt `stundenplan-einrichtung-endpunkte` voraus: Ohne dessen Modulauswahl gibt es keine Kandidaten, mit denen der Planungsmodus arbeiten könnte.

## Offene Entscheidungen

- **Was „Übernehmen" genau tut und wie man in den Planungsmodus zurückkehrt,** ist nicht bis ins Letzte entschieden. Dieser Change legt fest, dass der Modus jederzeit erneut erreichbar sein muss und die Übernahme nichts ungefragt entfernt; ob es zusätzlich eine Rückfrage beim Verlassen mit ungesicherten Änderungen gibt — die Alt-App hatte eine —, bleibt der Umsetzung überlassen.
- **Was beim Abwählen eines Moduls mit bestehenden Planeinträgen geschieht,** ist weiterhin offen (siehe `stundenplan-einrichtung-endpunkte`).
