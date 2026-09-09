## Context

Siehe `proposal.md` — Why. Die Logikschicht des Bereichs ist den Bildschirmen durchweg voraus: `planStore.clear()`, `einrichtung.clear()` und `toggleSprungZuHeute` sind implementiert und werden von keinem Bildschirm aufgerufen. Drei der Änderungen dieses Changes bestehen im Wesentlichen darin, Vorhandenes an einen Bedienweg zu hängen.

Die eigentliche Arbeit liegt in `zeitachse.ts` und `dayLayout.ts`.

## Goals / Non-Goals

**Goals:**

- Die Achsenberechnung bleibt reine Fachlogik ohne Pixelwerte; die Umrechnung bleibt in der Darstellungsschicht, wie `design.md` des Vorgänger-Changes es festgelegt hat
- Keine neue Abhängigkeit; `gesten.ts` und `AnkerListe` kommen aus dem Mensaplan

**Non-Goals:**

- Keine echte Wochenansicht mit sieben Spalten nebeneinander. Der Bildschirm heißt so, zeigt aber einen Tag; das bleibt so und ist auch nirgends anders spezifiziert
- Kein Export, kein Prüfungsplan, kein Raumplan-Abgleich

## Decisions

### 1. Die Achse wird zu einer Folge von Abschnitten

Bisher rechnet die Darstellung linear: `y = (minute - spanne.vonMin) * DP_JE_MINUTE`. Mit gestauchten Lücken gilt das nicht mehr. Statt einer Formel liefert `dayLayout` eine Folge von Abschnitten mit je eigener Höhe:

```
  Termine:  08:00-09:30   11:00-12:30   16:00-17:30
  Lücken:            90 min        210 min

  ALT (Wochenspanne 08:00-19:30)      NEU (Tagesspanne, gestaucht)
  Höhe = 690 min * 1,5 = 1035 dp      Termin   90 min -> 135 dp
  davon 465 dp Leerraum               Lücke    90 min -> 135 dp   (< 1 h? nein,
                                                                   also gedeckelt
                                                                   auf 60 -> 90 dp)
                                      Termin   90 min -> 135 dp
                                      Lücke   210 min -> 90 dp    Bruchzeichen
                                      Termin   90 min -> 135 dp
                                      -------------------------
                                                        585 dp
```

Terminkacheln bleiben streng proportional — eine 90-Minuten-Kachel ist immer 135 dp. Nur Lücken werden gedeckelt. Die Vergleichbarkeit zwischen Terminen, um die es der Anforderung geht, bleibt damit vollständig erhalten.

*Alternative: Lücken linear lassen und nur die Randlücken abschneiden.* Weniger Eingriff, aber die 315-dp-Freistunde bleibt. Verworfen.

### 2. Die Spaltenkappung sitzt in `ordneSpaltenZu`, nicht in der Darstellung

> **Zurückgenommen am 2026-09-09** (Prüfprotokoll, Abschnitt 1). Die Kappung
> auf drei Spalten und der Stapel entfallen ersatzlos: Am Gerät war der Stapel
> schlecht bedienbar, und mehr als drei überschneidende Termine sind ein von
> der Nutzerin selbst herbeigeführter Randfall, für den die nicht
> maßstabsgetreue Ansicht bereits einen Weg bietet. `ordneSpaltenZu` vergibt
> seither ohne Obergrenze eine Spalte je Termin. Mit der Kappung entfällt auch
> das Szenario „Eigene Termine zuerst": Es entschied, welche drei Termine
> sichtbar bleiben — ohne Kappung bleibt ohnehin jeder sichtbar. Der Abschnitt
> bleibt als Begründungsspur stehen.

`ordneSpaltenZu` färbt Intervalle gierig und setzt `spalten` auf die Gruppenbreite. Die Kappung gehört an dieselbe Stelle: Übersteigt eine Überschneidungsgruppe drei, bekommen drei Termine eine Spalte und die übrigen einen Stapel-Slot. Damit bleibt die Darstellungsschicht frei von Fachlogik, wie der Vorgänger-Entwurf es verlangt.

Welche drei sichtbar sind, entscheidet die Herkunft: Termine des Plans zuerst, eingeblendete Alternativen danach. Innerhalb einer Herkunft chronologisch.

*Alternative: Spaltenzahl aus der Bildschirmbreite ableiten.* Passte sich an Tablet und Web-Export an, machte die Logikschicht aber von einem Layoutwert abhängig, den sie bewusst nicht kennt. Zurückgestellt; drei ist der Wert für alle Größen.

### 3. Das Aufklappen dehnt die Zeile, statt zu überlagern

> **Zurückgenommen am 2026-09-09** (Prüfprotokoll, Abschnitt 1). Mit dem Stapel
> entfällt auch sein Aufklappen. Die Achse ist damit wieder ausnahmslos
> maßstabsgetreu; die entsprechende Erlaubnis im MODIFIED-Delta zur
> proportionalen Zeitachse ist gestrichen.

Ein Tipp auf den Stapel erweitert den betreffenden Abschnitt der Achse, sodass die enthaltenen Termine untereinander erscheinen. Nichts wird verdeckt, und der Bezug zur Tageslage bleibt. Die Achse ist an dieser Stelle vorübergehend nicht maßstabsgetreu — das MODIFIED-Delta zur proportionalen Zeitachse erlaubt das ausdrücklich, statt es stillschweigend hinzunehmen.

*Alternative: schwebendes Feld an der Kachel.* Weniger Eingriff in die Achse, aber an den Tagesrändern schwierig zu positionieren und mit wenig Platz für die vollen Angaben.

### 4. Stundenlinien nur im maßstabsgetreuen Bereich

> **Zurückgenommen am 2026-09-09** (Prüfprotokoll, Abschnitt 1). Die
> Stundenlinien entfallen vollständig — mit ihnen die Frage, wo sie laufen
> dürfen. Ebenso entfallen das Bruchzeichen der gestauchten Lücke und ihr
> Rahmen: Die Dauerangabe allein trägt die Aussage, der Rahmen ließ die Lücke
> wie einen Termin wirken. Die Stauchung selbst (Entscheidung 1) bleibt und hat
> sich am Gerät bewährt.

Aus Entscheidung 1 folgt zwingend: In einer auf 60 Minuten gestauchten Lücke von 3 h 30 müssten vier Stundenlinien auf den Platz von einer. Sie dort zu zeichnen wäre eine falsche Aussage. Die gestauchte Lücke trägt stattdessen das Bruchzeichen; die Linien laufen davor und danach korrekt weiter — die übliche Darstellung einer unterbrochenen Achse.

### 5. Die Filterauswertung schrumpft auf einen Filter

`wirksameFilter()` und die Überlagerung durch `alleAnzeigen` entfallen ersatzlos. `WirksameFilter` verliert beide Felder; der Gültigkeitszeitraum wird unbedingt geprüft. `leerGrund` behält zwei Fälle statt drei. Gespeicherte Werte `gruppenfremdeAusblenden` und `alleAnzeigen` werden von `bereinige()` verworfen — dieselbe Stelle, die schon heute jeden Wert einzeln liest.

### 6. Die Löschaktionen hängen sich an vorhandene Funktionen

`planStore.clear()` und `einrichtung.clear()` bestehen bereits. „Plan leeren" ruft die erste, „zurücksetzen" beide. Neu ist allein die Rückfrage samt der Zusatzfrage zu eigenen Terminen — und die Filterung, die eigene Termine verschont, wenn ihr nicht zugestimmt wurde.

Das Requirement „Kein selbsttätiges Entfernen des Stundenplans" ist bewusst breiter gefasst als der Bedienweg: Es bindet auch den Semesterwechsel-Hinweis und den Abgleich der Endpunktliste, zwei Stellen, an denen ein selbsttätiges Aufräumen naheliegend wirkt.

### 7. Alternativen brauchen den Auswahlbestand in der Wochenansicht

Der Schalter „alle Veranstaltungen der gewählten Module einblenden" verlangt Daten, die die Wochenansicht heute nicht kennt: Sie liest nur den gerätelokalen Plan. Für die Alternativen kommt der Auswahlbestand aus dem FBWS hinzu — mit allem, was das nach sich zieht: Ladezustand, Fehlerzustand, Offline-Verhalten über dieselbe Grundstruktur wie jede datenabhängige Ansicht. Ist der Bestand nicht verfügbar, bleibt der Schalter wirkungslos und sagt das; der eigene Plan bleibt davon unberührt und weiterhin offline vollständig.

## Risks / Trade-offs

**Die Achse setzt beim Tageswechsel oben anders an** → Der Vorgänger-Entwurf nannte das als Grund gegen eine Tagesspanne. Es bleibt richtig und wird in Kauf genommen: Der Gewinn — kein Leerraum, keine 300-dp-Freistunde — überwiegt, und die Kachelhöhen bleiben zwischen Tagen vergleichbar, weil die Höhe je Minute konstant ist.

**64 statt 13 Kacheln bei eingeblendeten Alternativen** → Genau dafür ist die Stapelung da. Ohne sie wäre der Schalter unbenutzbar; die Reihenfolge der Aufgaben in `tasks.md` trägt dem Rechnung.

**Der Wegfall der Belegungsvorschau nimmt eine erfragte Anforderung zurück** → Sie ging auf eine Rücksprache mit einer studierenden Person zurück. Die Rücknahme ist als REMOVED-Delta mit Begründung festgehalten, damit ein Nachfolger sie nicht für ein Versehen hält und wieder einbaut — seit der Bereinigung mit `stundenplan-bedienung-ohne-vormerkung` (2026-09-09) im dortigen, bereits archivierten Delta statt in diesem.

**Der Alternativen-Schalter macht die Wochenansicht netzabhängig** → Nur für die Alternativen. Der persönliche Plan bleibt rein gerätelokal, wie die Capability `data-and-storage` es verlangt; ohne Netz zeigt die Ansicht ihn unverändert vollständig.

### 8. Der Zeitraum je Eintrag braucht nur einen Bedienweg

`gueltigVon` und `gueltigBis` liegen an jedem `PlanEntry`, `null` steht für „offen", und `imGueltigkeitszeitraum` wertet beide bereits richtig aus. Der Change fügt keine Fachlogik hinzu, sondern einen Bedienweg — dieselbe Lage wie bei `planStore.clear()` und `toggleSprungZuHeute`.

Zwei Punkte, die dabei zu regeln sind:

**Der gesetzte Zeitraum ist maßgeblich.** Ein Planeintrag ist eine gerätelokale Abschrift des FBWS-Termins; es gibt heute keinen Pfad, der ihn nachträglich aus INT-002 auffrischt. Die Anforderung hält das trotzdem ausdrücklich fest, damit ein künftiger Abgleich die Handkorrektur nicht stillschweigend überschreibt.

**`wiederkehrend` bleibt widerspruchsfrei.** Bei eigenen Terminen bedeutet „einmalig" intern `gueltigVon === gueltigBis` (`einmaligerGueltigkeitszeitraum`). Wer den Zeitraum im Detail frei setzt, könnte sonst einen als „einmalig" geführten Eintrag über drei Wochen spannen. Die Regel ist daher: Ein Zeitraum von genau einem Tag heißt einmalig, ein längerer heißt wiederkehrend innerhalb dieses Zeitraums. Das Kennzeichen wird aus dem Zeitraum abgeleitet, statt beide unabhängig zu führen.

```
  gueltigVon == gueltigBis      -> einmalig, erscheint an genau diesem Datum
  gueltigVon <  gueltigBis      -> wöchentlich innerhalb des Zeitraums
  beide null                    -> wöchentlich ohne Begrenzung
  Ende vor Beginn               -> zurückgewiesen, alter Zeitraum bleibt
```

Die Datumsauswahl kommt aus dem vorangehenden Change (`@react-native-community/datetimepicker`); dieser Change nimmt dafür keine neue Abhängigkeit auf.

### 9. Entfernen und Löschen sind nicht dasselbe

Das Termindetail führt heute für beide Fälle denselben rot gestalteten Knopf „Termin löschen". Die beiden Fälle unterscheiden sich aber in genau dem Merkmal, an dem `ux-and-theming` die zerstörende Gestaltung festmacht — der Wiederherstellbarkeit:

```
  offizieller Termin              eigener Termin
  ------------------              --------------
  steht im FBWS                   nur auf diesem Gerät
  Modul bleibt gewählt            keine Quelle
  Planungsmodus zeigt ihn         nirgends nachschlagbar
    als "nicht eingeplant"
  Ausstehenden-Leiste nennt ihn
  -> ein Tipp stellt ihn her      -> unwiederbringlich

  nicht zerstörend                zerstörend
  keine Bestätigung               Bestätigung
  "Aus meinem Plan nehmen"        "Termin löschen"
```

Die Sicherheitsnetze aus Change `stundenplan-planungsmodus-feinauswahl` — Kennzeichnung „wird nirgends besucht" und die Leiste der ausstehenden Veranstaltungen — sind der Grund, warum beim offiziellen Termin auf eine Bestätigung verzichtet werden kann: Ein Fehlgriff bleibt sichtbar, statt unbemerkt zu wirken.

## Open Questions

Alle drei am 2026-09-09 am Gerät entschieden
(`specs/pruefprotokolle/2026-09-09-stundenplan-wochenansicht-nutzerfuehrung.md`,
Abschnitt 2):

- **Mindestbreite je Kachel zusätzlich zur Kappung auf drei — gegenstandslos.** Mit dem Entfall der Stapelung entfällt die Kappung, die eine Mindestbreite hätte ergänzen sollen.
- **Gestalt eines Termins bei abgeschalteter Farbautomatik — neutrale Fläche.** Umgesetzt über `anzeigeFarbe` (`farbe.ts`), das anhand der gespeicherten Herkunft der Farbe entscheidet.
- **Zwölf Farbkreise im Termindetail — dauerhaft sichtbar.** Kein zusätzlicher Bedienschritt.

### 10. Die Herkunft der Farbe wird gespeichert, nicht die neutrale Farbe

Beim Prüfen der zweiten Frage fiel auf, dass sich die Farbautomatik praktisch
nicht abschalten ließ: Die Farbe wurde beim Anlegen fest in den Eintrag
geschrieben, der Schalter wirkte deshalb nur auf danach angelegte Termine, und
ein bestehender Plan blieb bunt.

Statt weiterhin beim Anlegen zwischen automatischer und neutraler Farbe zu
wählen, hält der Eintrag jetzt beides auseinander: `color` trägt immer eine
echte Farbe, `farbeVonNutzer` ihre Herkunft. Welche Farbe erscheint, entscheidet
erst die Darstellung (`anzeigeFarbe`). Damit wirkt das Abschalten auf den
gesamten Bestand, ist umkehrbar, und eine eigene Farbwahl überlebt beide
Richtungen.

*Alternative: beim Umschalten alle Einträge einmal umschreiben.* Ein Schreibvorgang über den ganzen Bestand für eine reine Darstellungsfrage — und die ursprüngliche Farbe wäre verloren, das Wiedereinschalten damit nicht mehr möglich. Verworfen.

Ein fehlendes `farbeVonNutzer` in einem gespeicherten Eintrag bedeutet
„automatisch" und ist ausdrücklich kein Grund, den Eintrag zu verwerfen
(DATA-F-020). Eine Migration entfällt damit.
