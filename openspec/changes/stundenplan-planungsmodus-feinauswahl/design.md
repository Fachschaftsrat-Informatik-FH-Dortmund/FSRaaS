## Context

Siehe `proposal.md` — Why. Der Bereich bringt die Bausteine bereits mit: `konflikt.ts` ermittelt Überschneidungen, `groupMatch.ts` entscheidet die Gruppenzugehörigkeit, `planStore.ts` hält den Plan gerätelokal. Was fehlt, ist die Schicht dazwischen — der Planungsstand je Modul und Veranstaltungsart — und der Bildschirm darauf.

Alle Zahlen unten stammen aus einer Live-Abfrage von INT-002 am 2026-09-08 für `INPBPI` mit `grade=*`, ausgewertet für die Gruppenkennung `C8`.

## Goals / Non-Goals

**Goals:**

- Der Planungsstand ist reine Fachlogik ohne React, für sich testbar wie `dayLayout.ts` und `jetzt.ts`
- Kein stiller Fehlschlag: Jeder Fall, in dem die App nicht wählen kann, ist sichtbar
- Der Bildschirm bleibt nach dem ersten Zusammenstellen als Korrekturweg nutzbar

**Non-Goals:**

- Keine Optimierung. Kriterienrangfolge, Zeitfenster, Vorbereitungszeit, Anpinnen und automatischer Vorschlag bleiben unangetastet in der Capability stehen
- Keine Bewertung von Terminen. Der Bildschirm zeigt Zustände (gewählt, kollidiert, ausstehend), er empfiehlt nichts
- Keine Änderung an `groupMatch.ts`

## Goals / Non-Goals — Größenordnung

Was der Bildschirm tatsächlich zu leisten hat, bei sechs Modulen und Kennung `C8`:

```
  Rechnerstrukturen und Betriebssysteme 2   P:10  V:1  Ü:5    alle drei eindeutig
  Mathematik für Informatik 3               T:1   V:1  Ü:8     alle drei eindeutig
  Programmierkurs 1                         P:7   V:1          beide eindeutig
  Mathematik für Informatik 2               V:1   Ü:8          beide eindeutig
  Algorithmen und Datenstrukturen           V:1              eindeutig
                                            ÜPP:8            2 Slots passen  <-- Wahl
  Technisches Englisch 8                    SV:12            alle A-P        <-- Wahl

  13 Kombinationen, 11 eindeutig, 2 echte Entscheidungen
```

`Technisches Englisch` ist der Fall, für den es den Bildschirm braucht: zwölf gleichwertige Termine, `studentSet` durchgängig `A-P`, die Gruppenkennung hilft nicht. Hier legt die Nutzerin ihre Woche.

## Decisions

### 1. Vorbelegt wird nur der Fall ohne Wahl

Ein Häkchen sitzt beim Öffnen genau dann, wenn die Veranstaltungsart einen einzigen Slot hat. Bei mehreren bleibt es leer, auch wenn die Gruppenkennung genau einen einschließt — jener wird hervorgehoben.

*Alternative: alles Eindeutige vorbelegen, also auch die vier Fälle, in denen die Kennung entscheidet.* Elf statt sieben Häkchen säßen dann. Verworfen: Die Gruppenkennung stammt aus INT-019, einem undokumentierten Endpunkt ohne SLA, oder aus einer Handeingabe. Ein Häkchen, das darauf beruht, ist eine Behauptung über den Stundenplan der Nutzerin, keine Tatsache. Ein einziger Slot dagegen ist eine Tatsache.

*Alternative: gar nichts vorbelegen, wie die Alt-App.* Verworfen: Das erzeugt genau das Vergessen-Problem, gegen das der Bildschirm gebaut wird — sieben der dreizehn Häkchen wären reine Fleißarbeit ohne Entscheidungsgehalt.

### 2. Der Planungsstand ist eine eigene Ableitung

Eine reine Funktion nimmt die gewählten Module, den Auswahlbestand und den aktuellen Plan und liefert je (Modul, Veranstaltungsart) einen Stand:

```
  { modul, art, slots, gewaehlt: PlanEntry[], stand }

  stand = 'offen'        keine Wahl getroffen, mehrere Slots vorhanden
        | 'eindeutig'    genau ein Slot, vorbelegt
        | 'gewaehlt'     ein oder mehrere Slots gewählt  (mit Anzahl)
        | 'ausstehend'   nichts gewählt und nichts vorbelegbar
```

Daraus speisen sich beide Anzeigen — die Kennzeichnung je Zeile und die Leiste am unteren Rand. Eine Quelle, zwei Darstellungen; die Leiste kann nicht etwas anderes behaupten als die Liste.

### 3. Die Kollisionsprüfung läuft gegen den Zwischenstand

`konflikt.ts` prüft heute innerhalb einer Terminmenge. Für den Planungsmodus wird gefragt: Kollidiert *dieser eine* Kandidat mit dem, was gerade gewählt ist? Bezugsgröße ist der Zwischenstand des Bildschirms, nicht der gespeicherte Plan — wer zwei Termine nacheinander ankreuzt, soll ihre Kollision sofort sehen und nicht erst nach dem Sichern (Entscheidung 6). Das ist eine schmalere Frage als `ermittleKonflikte` und bekommt eine eigene Funktion, statt jene zu überladen. Die bestehenden Requirements „Konfliktprüfung paralleler Termine", „Hinweis bei fehlender konfliktfreier Option" und „Bewusste Übernahme trotz Konflikt" setzen darauf auf und werden mit diesem Change erstmals umgesetzt, ohne dass ihr Text sich ändert.

Vorgemerkte Termine erzeugen dabei keinen Konflikthinweis — das bestehende Requirement „Kein Konflikthinweis bei vorgemerkten Terminen" gilt unverändert und muss in der neuen Prüfung berücksichtigt werden.

### 4. Der Wochentag ist die Gliederung, die Leiste der Ausgleich

Tabs je Wochentag zeigen immer nur einen Tag. Genau deshalb trägt die untere Leiste Namen statt einer Zahl: „Mathe 3 Ü · Progr.kurs 1 P" sagt, was fehlt, ohne dass man fünf Tabs durchtippt; ein Tipp wechselt auf den Tag und hebt hervor.

*Alternative: Marke am Wochentag-Tab.* Zeigt, **wo** etwas fehlt, aber nicht **was**. Schließt sich nicht aus und kann ergänzt werden; die Leiste ist der Träger.

*Alternative: erst beim Übernehmen zusammenfassen.* Verworfen — die Probleme kämen alle auf einmal am Ende, an der Stelle, an der die Nutzerin fertig zu sein glaubt.

### 5. Zwei neue Abhängigkeiten, beide F-Droid-tauglich

`@react-native-community/datetimepicker` für Zeit und Datum, `@react-native-picker/picker` für den Wochentag. Beide MIT-lizenziert, beide Teil der React-Native-Community, beide ohne Google-Play-Services-Abhängigkeit — die Auflage reproduzierbarer Builds ohne proprietäre Bestandteile (Capability `non-functional`) bleibt gewahrt. `react-native-gesture-handler` liegt bereits im Projekt.

*Alternative: Auswahlräder selbst bauen.* Verworfen: Eigene Zeit- und Datumsauswahl bedeutet eigene Barrierefreiheit, eigene Lokalisierung und eigene Zeitzonenbehandlung — für ein ehrenamtlich getragenes Projekt der falsche Aufwand.

## Risks / Trade-offs

**Zwei neue Abhängigkeiten in einem Projekt mit F-Droid-Auflagen** → Beide Pakete sind vor der Aufnahme auf Lizenz und transitive Abhängigkeiten zu prüfen; die Prüfung gehört als Aufgabe in `tasks.md`, nicht als Annahme in diesen Entwurf.

**Der Bildschirm zeigt nur die Termine gewählter Module** → Wer ein Modul vergisst anzukreuzen, sieht es hier nicht. Der Rückweg zur Modulauswahl muss deshalb aus dem Planungsmodus heraus erreichbar bleiben.

**Die Statusvergabe „fest"/„vorgemerkt" ändert sich für bestehende Pläne** → Bereits gespeicherte Einträge behalten ihren Status; die neue Regel greift für neue Entscheidungen. Ein nachträgliches Umschreiben gespeicherter Stände wäre eine Änderung an Nutzerdaten ohne Rückfrage und unterbleibt.

**Ohne den vorangehenden Change gibt es keine Kandidaten** → Dieser Change ist ohne `stundenplan-einrichtung-endpunkte` nicht lauffähig. Die Reihenfolge ist verbindlich.

### 6. Der Planungsmodus sammelt und sichert auf Auslösung

Entschieden 2026-09-08: Ein Speichern-Symbol in der Kopfzeile; die Entscheidungen wirken erst beim Antippen im Plan. Damit weicht dieser eine Bildschirm bewusst vom Muster der übrigen gerätelokalen Speicher ab — `planStore`, `einrichtung` und `ansichtEinstellungen` rufen sämtlich unmittelbar `schreiben()`. Die Begründung liegt in der Sache: Das Zusammenstellen eines Stundenplans ist eine zusammenhängende Überlegung über mehrere Wochentage hinweg. Wer am Donnerstag etwas probiert, um am Montag zu sehen, ob es passt, will diesen Zwischenstand nicht bereits im Plan haben.

*Erwogen und verworfen: sofort schreiben, wie überall sonst.* Wäre einheitlicher und käme ohne Zwischenzustand aus. Die Entscheidung fiel dennoch für das Sammeln, weil der Bildschirm anders als jeder andere Schreibpfad der App nicht eine einzelne Angabe entgegennimmt, sondern eine Reihe voneinander abhängiger Entscheidungen.

**Der Zwischenstand zieht zwei Pflichten nach sich**, die in den Requirements stehen und nicht der Umsetzung überlassen bleiben:

```
  Zustand                       Folge
  -----------------------       ------------------------------------------
  ungesicherte Änderung         Bildschirm weist sie sichtbar aus, sonst
  vorhanden                     ist das Speichern-Symbol nicht auffindbar

  Verlassen mit                 Rückfrage mit drei Wegen: sichern,
  ungesicherter Änderung        verwerfen, zur Bearbeitung zurück
                                (Datenverlust ohne Rückfrage ist
                                 ausgeschlossen, data-and-storage)
```

Der Zwischenstand lebt allein im Bildschirmzustand, nicht in einem Speicher: Ein Absturz oder ein Wechsel in einen anderen Tab verwirft ihn, ohne dass etwas an gespeicherten Daten Schaden nimmt. Das ist vertretbar, weil der Plan bis zum Sichern unverändert bleibt — es geht nur die Zwischenüberlegung verloren, nie ein zuvor gesicherter Stand.

Die Konfliktprüfung aus Entscheidung 3 läuft folgerichtig gegen den **Zwischenstand**, nicht gegen den gespeicherten Plan: Wer zwei Termine nacheinander ankreuzt, soll ihre Kollision sofort sehen und nicht erst nach dem Sichern.

### 7. Das Speichern-Symbol ist die Primäraktion des Bildschirms

`ux-and-theming` lässt je Ansicht höchstens eine hervorgehobene Primäraktion zu. Im Planungsmodus ist das die Sicherungsaktion; der Rückweg zur Modulauswahl und das Anlegen eigener Termine bleiben unauffällig gestaltet.

## Open Questions

Keine.
