## Context

Siehe `proposal.md` — Why. Der gerätelokale Einrichtungsstand (`app/src/areas/schedule/einrichtung.ts`) führt heute `sname`, `grade` und `zusatzFachsemester`; alle drei fallen weg oder ändern ihre Gestalt. Der Bestand liegt bereits auf Geräten, ein Umstieg ohne Migration verlöre die Einrichtung stillschweigend.

Grundlage aller Zahlen unten ist eine Live-Abfrage von INT-001 und INT-002 am 2026-09-08. Sie ist im `integrations`-Delta dieses Changes festgehalten, damit sie nicht nur in diesem Entwurf steht.

## Goals / Non-Goals

**Goals:**

- Die Endpunktgruppierung ist reine Fachlogik ohne React, für sich testbar wie `groupMatch.ts` und `kursbaum.ts`
- Die Gruppierung trägt auch dann, wenn INT-001 ausfällt und die Rückfallliste des eigenen Backends einspringt
- Ein bestehender gerätelokaler Einrichtungsstand überlebt den Umstieg ohne Zutun der Nutzerin

**Non-Goals:**

- Kein Schreibpfad in den persönlichen Plan. Die Modulauswahl sammelt Kandidaten; der Weg in den Plan entsteht erst mit dem Planungsmodus
- Keine Änderung an der Gruppenzuordnungslogik (`groupMatch.ts`). Nur die Eingabeform der Kennung ändert sich, nicht ihre Auswertung
- Keine neue Abhängigkeit

## Decisions

### 1. Die Gruppenzuordnung wird abgeleitet, nicht gepflegt

Drei Merkmalsquellen, in dieser Reihenfolge geprüft:

| Merkmal | Quelle | trägt |
|---|---|---|
| Blockwoche | `sname` beginnt mit `Blockwoche` | 3 Endpunkte |
| Tutorium | `name` enthält `Tutori` | `TUPB`, `FemINF` |
| Seminar | `name` enthält `eminar` | `SMPB` |
| Wahlpflicht | `name` enthält `Wahlpflicht` | `WFPB` |
| Master / Bachelor | vierte Stelle des `sname` ist `M` bzw. `B` | 13 Studiengänge |
| dual | dritte Stelle des `sname` ist `D` | 4 Studiengänge |
| Prüfungsordnung | Feld `po`, ersatzweise `StgPO <Jahr>` aus `name` | Sortierung innerhalb der Gruppe |

Greift keine Regel, fällt der Endpunkt in den Auffangkorb — heute `QDL`.

*Alternative: gepflegte Tabelle je `sname`.* Genauer, 21 Zeilen. Verworfen: Ein neu angelegter Endpunkt bliebe bis zur Nachpflege unzugeordnet, und das Projekt existiert, weil genau solche Bringschulden die Vorgängersysteme unbrauchbar gemacht haben (`specs/decisions/0002`). Der Auffangkorb macht denselben Fall sichtbar, ohne dass jemand etwas tun muss.

*Alternative: Regeln plus Übersteuerungsliste.* Verworfen, weil zwei Wahrheitsquellen auseinanderlaufen und der Auffangkorb den Rest bereits sichtbar trägt.

**Zwei Fallen aus dem Bestand:** `FemINF` trägt `po` als Zeichenkette `"NULL"`, nicht als `null` — ein naiver Wahrheitstest ordnet es einer Prüfungsordnung „NULL" zu. Und die `sname`-Stellenregel greift nur bei den Studiengängen; `Blockwoche1`, `QDL` und `FemINF` müssen vorher abgefangen werden, sonst liest die Regel deren vierten Buchstaben.

### 2. Die Prüfungsordnung wird aus zwei Quellen gelesen

`po` ist der Vorzugsweg. Die Rückfallliste des eigenen Backends (`GET /stundenplan/studiengaenge`, INT-008) liefert aber nur `name`, `kurzname` und `fachsemester` — kein `po`. Da die Prüfungsordnung bei allen betroffenen Endpunkten zusätzlich im Klarnamen steht (`Bachelor Informatik (StgPO 2019), VR Data Science`), wird sie von dort gelesen, wenn `po` fehlt. Die Gruppierung bricht bei einem INT-001-Ausfall damit nicht weg.

*Alternative: die Rückfallliste um `po` erweitern.* Das wäre eine Vertragsänderung am eigenen Backend für ein Feld, das ohnehin redundant im Namen steht. Nicht jetzt.

### 3. Ein Abruf je Endpunkt mit `grade=*`

Statt eines Abrufs je (Endpunkt, Fachsemester) genau einer je Endpunkt. Bei drei gewählten Endpunkten also drei Abrufe statt bis zu sieben. Die Antwortmenge wächst dabei je Endpunkt (`INPBPI`: 77 → 126 Termine), die Gesamtmenge sinkt gegenüber dem heutigen Fall mit Zusatz-Fachsemestern. Die Zwischenspeicher-Schlüssel ändern sich von `['stundenplanTermine', sname, grade]` auf `['stundenplanTermine', sname, '*']`; alte Einträge laufen über ihre Ablaufzeit aus, es braucht keine Räumung.

### 4. Migration des gerätelokalen Stands

`bereinige()` in `einrichtung.ts` liest bereits jeden Wert einzeln und fällt auf Vorgaben zurück. Die Migration hängt sich dort ein:

```
  gespeichert                        gelesen als
  { sname: "INPBPI",        ->       { endpunkte: ["INPBPI"],
    grade: "2",                        gruppenkennung: "C8" }
    zusatzFachsemester: ["4"],
    gruppenkennung: "C8" }           grade und zusatzFachsemester
                                     entfallen ersatzlos — ihre
                                     Veranstaltungen sind über
                                     grade=* ohnehin im Bestand
```

Kein Datenverlust: Der Auswahlbestand nach der Migration ist eine echte Obermenge des vorherigen. Die Einrichtung bleibt gültig, ohne dass die Nutzerin etwas tut.

### 5. Die Abschnittsnavigation wird aus dem Mensaplan übernommen

`app/src/areas/canteen/ui/AnkerListe.tsx` leistet genau das Verlangte — waagerechte Chip-Leiste, Sprung beim Antippen, Scroll-Spy — und ist dort für zwei Ansichten in Gebrauch. Sie wandert nach `app/src/ui/` und wird von beiden Bereichen genutzt, statt ein zweites Mal gebaut zu werden.

*Alternative: eigene Leiste im Stundenplan.* Verworfen; zwei Umsetzungen desselben Verhaltens driften.

## Risks / Trade-offs

**Der Fachbereich benennt einen Endpunkt um, und eine Namensregel greift nicht mehr** → Der Endpunkt landet im Auffangkorb, bleibt also wählbar und sichtbar. Ein Vertragstest gegen den echten INT-001-Bestand schlägt fehl, sobald der Auffangkorb wächst — die Regel wird nachgezogen, ohne dass jemand einen Ausfall meldet.

**`grade=*` ist für Bachelor-Endpunkte nicht dokumentiert, nur beobachtet** → Der Endpunkt ist ohnehin undokumentiert und ohne SLA (`integrations`, INT-001/INT-002). Liefert er für einen Endpunkt mit `grade=*` nichts, ist das ein leerer Bestand mit sichtbarem Leerzustand, kein stiller Fehler. Der Vertragstest deckt den Fall ab.

**Die Modulauswahl schreibt in diesem Change noch nichts in den Plan** → Zwischen diesem Change und dem Planungsmodus ist der Fluss unterbrochen. Beide gehören unmittelbar nacheinander umgesetzt; der Merge dieses Changes allein hinterlässt einen Stand, der die Kursauswahl verschlechtert.

**Mehr Netzverkehr bei vielen gewählten Endpunkten** → Sieben gewählte Endpunkte bedeuten sieben Abrufe beim ersten Öffnen. Die Zwischenspeicher-Regel aus `@/cache/ttl` gilt unverändert; die Abrufe laufen nebenläufig wie schon heute die Zusatz-Fachsemester über `useQueries`.

## Open Questions

- Ob die Gruppe „Wahlpflicht" je einen zweiten Eintrag bekommt, hängt daran, ob der Fachbereich einen Master-Wahlpflicht-Endpunkt anlegt. `integrations` führt das bereits als unverifiziert. Ändert nichts an Specs, Vorgehen oder Aufgabenschnitt: Die Gruppe trägt dann zwei Einträge statt einem.
