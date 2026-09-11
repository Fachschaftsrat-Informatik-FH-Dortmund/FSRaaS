## Why

Mit der Modulauswahl und der künftig verpflichtenden Gruppenkennung verengt
sich der Stundenplan auf das, was die Nutzerin selbst gewählt hat. Was der
Studiengang sonst noch anbietet, ist danach nirgends mehr sichtbar. Wer
schauen will, was zu einer bestimmten Zeit gerade läuft — ein Modul, das man
noch nicht belegt hat, eine Veranstaltung, in die man einmal hineinschauen
möchte —, findet dafür keinen Weg.

Bisher ergab sich diese Übersicht nebenbei: Solange keine Gruppenkennung
gesetzt war, zeigte die App alle abgerufenen Termine. Dieser Nebeneffekt
entfällt mit dem Change `einrichtung-und-kursauswahl-bedienung`. Er ist
ohnehin kein tragfähiger Ersatz gewesen, denn er zeigte nur Termine
gewählter Module.

## What Changes

- **Schalter im Ansichts-Blatt.** Ein Schalter „Alle Veranstaltungen zeigen"
  blendet in der Wochenansicht zusätzlich die Termine der nicht gewählten
  Module des Auswahlbestands ein, deutlich abgesetzt von den eigenen.
- **Aufnehmen aus der Einblendung.** Antippen eines eingeblendeten Termins
  führt zu einer Rückfrage, ob das zugehörige Modul in die eigene Auswahl
  aufgenommen werden soll. Sie ist auf „nein" vorbelegt, damit ein
  Fehlgriff folgenlos bleibt.
- **Keine Kopplung an die Zeitachse.** Der Schalter wirkt allein auf die
  Einblendung. Wird die Ansicht dadurch zu gedrängt, schaltet die Nutzerin
  die proportionale Zeitachse ab — beide Schalter stehen im selben
  Ansichts-Blatt nebeneinander.

## Capabilities

### New Capabilities

Keine.

### Modified Capabilities

- `schedule`: Zwei Requirements kommen hinzu — die Einblendung der nicht
  gewählten Veranstaltungen und der Weg, ein Modul daraus aufzunehmen.

## Impact

**Roadmap:** Schritt 5 (Stundenplan), Etappe 3 (Wochenansicht).

**Herkunft dieses Changes:** Anders als die Changes zu Issue #68 stammt er
nicht aus einem Gerätetest, sondern aus dem Gespräch vom 2026-09-11, in dem
die Gruppenkennung zur Pflicht wurde. Er ist deshalb bewusst als eigener
Change geführt und nicht in die Nacharbeit gemischt.

**Betroffener Code** (vor der Umsetzung vollständig zu prüfen):

- `app/src/areas/schedule/ansichtEinstellungen.ts` — der neue Schalter
- `app/src/areas/schedule/wochenansicht.ts` — Zusammenstellung der
  anzuzeigenden Termine
- `app/src/areas/schedule/screens/ScheduleScreen.tsx` — abgesetzte
  Darstellung und Antippen
- `app/src/areas/schedule/kursbaum.ts` — der Auswahlbestand liegt bereits
  vollständig vor; ein zusätzlicher Abruf ist nicht nötig

**Offener Punkt für den Gerätetest:** Das Requirement
„Nebeneinanderdarstellung überschneidender Termine" kennt seit dem
2026-09-09 keine Obergrenze für die Zahl der Spalten. Seine Begründung
stützt sich darauf, dass mehr als drei überschneidende Termine ein von der
Nutzerin selbst herbeigeführter Randfall seien. Bei eingeschaltetem Schalter
gilt diese Annahme nicht mehr. Ob die Kacheln dann noch lesbar und einzeln
treffbar bleiben (44×44 dp), ist am Gerät zu prüfen und in der `tasks.md`
dieses Changes als Prüfpunkt zu führen — bewusst als Beobachtung, nicht als
vorweggenommene Festlegung.
