## Context

Motivation und Umfang stehen in `proposal.md`. Hier nur, was den technischen Zuschnitt bestimmt.

Der heutige Weg: App → FB4-Backend → INT-015 (ITMC), mit einem serverseitigen Zwischenspeicher dazwischen (Tabelle `SpeiseplanTag`, Hintergrund-Job, Abrufzeitplan) und handgepflegten Öffnungszeiten in den Stammdaten. Der künftige Weg: App → FB4-Backend → INT-020 (`mensa.fb4.it`), ohne eigenen Bestand.

Drei Eigenschaften der neuen Quelle prägen den Entwurf:

1. **Gleiche Kennungen.** `mensa.fb4.it` adressiert Mensen über die Verbrauchsortnummer des Studierendenwerks — dieselbe Zahl, die als `quelleId` in den Stammdaten steht und die INT-015 verwendete. Keine Zuordnungstabelle, keine Migration gespeicherter Auswahlen.
2. **Sie ist selbst ein Cache** und setzt `Cache-Control: public, max-age=300`.
3. **Sie lädt träge.** Gemessen am 2026-09-22: nach längerer Ruhe waren die Speisepläne 6,7 Tage alt und wurden erst durch die Anfrage aufgefrischt; warm antwortet sie in 0,11 s.

## Goals / Non-Goals

**Goals:**

- Den Gerichtsschlüssel über die Quellenablösung hinweg zeichengleich halten, damit Bewertungen, Lieblingsgerichte und Fotos verbunden bleiben.
- Öffnungsangaben und Speiseplan als zwei getrennte Tatsachen führen, statt das eine aus dem anderen zu erschließen.
- Den Vertrag additiv unter `/v1` halten.

**Non-Goals:**

- Keine Ausfallsicherung für `mensa.fb4.it` im Backend. Die Rückfallebene ist der gerätelokale Bestand der App.
- Keine eigene Übersetzung von Gerichtsbezeichnungen. Die Quelle liefert beide Sprachen; fehlt die englische, tritt die deutsche an ihre Stelle.
- Keine App-Ansicht für `/legend` und `/health`. Beide werden ausgewertet, nicht dargestellt.

## Decisions

### Das Backend bleibt in der Kette, hält aber keinen Bestand

Gewählt: App → Backend → Quelle, ohne serverseitigen Speiseplan-Bestand.

Die naheliegende Alternative wäre, die App direkt gegen `mensa.fb4.it` sprechen zu lassen — die Quelle setzt `Access-Control-Allow-Origin: *`, technisch ginge das auch aus dem Web-Export. Dagegen sprechen drei Dinge: Bewertungen und Fotos werden serverseitig über den normalisierten Gerichtsschlüssel angefügt; die Kuration der Mensa-Auswahl (Reihenfolge, Standardauswahl) liegt ohnehin im Backend; und die Regel „die App spricht kein Fremdsystem direkt an" (Capability `architecture`) bliebe sonst nur noch mit einer Ausnahme bestehen. Der Preis ist ein zusätzlicher Netzsprung von 0,11 s.

Der eigene Bestand entfällt dagegen, weil er dupliziert, was die Quelle bereits tut — mit dem zusätzlichen Nachteil, dass ein zweiter Cache eine zweite Stelle ist, an der ein veralteter Stand hängen bleiben kann. Genau dieser Fall ist bei der Quelle selbst messbar aufgetreten.

### Pro Tag durchreichen, nicht zwei Wochen

Die Quelle bietet beides: `GET /canteens/{id}/menu` (alle vorliegenden Tage) und `GET /canteens/{id}/menu/{date}` (ein Tag). Ohne eigenen Bestand hätte das Zwei-Wochen-Ergebnis keinen Ort, an dem es liegen bleiben könnte — alles außer dem angezeigten Tag würde verworfen. Gewählt wird deshalb der Tagesabruf, ein Aufruf je gewählter Mensa.

Bei typisch zwei bis drei gewählten Mensen sind das zwei bis drei Aufrufe je Tagwechsel. Das ist vertretbar, weil die Quelle warm in 0,11 s antwortet und die Aufrufe nebenläufig laufen können.

### Die Gültigkeitsdauer der Quelle beachten

Der HTTP-Client des Backends hält Antworten für die von der Quelle angegebenen 300 Sekunden. Das ist kein eigener Zwischenspeicher im Sinne der Entscheidung: es entsteht kein Datenbestand, keine Auffrischungslogik und keine Aufbewahrung über die von der Quelle gesetzte Frist hinaus — das Backend tut schlicht, was die Quelle anweist. Ohne das erzeugte jeder Tagwechsel volle Last auf der Quelle.

Bewusst **nicht** gewählt: ein eigenes `Cache-Control` an die App weiterreichen. Das wäre die wirksamste Dämpfung, schüfe aber eine dritte Stelle, an der ein Stand hängen bleiben kann — neben dem Cache der Quelle und dem gerätelokalen Bestand der App.

### Gerichtsschlüssel aus den zusammengefügten Komponenten

Der ITMC-Titel war eine Zeichenkette, deren Komponenten mit ` | ` getrennt waren; `GerichtNormalisierung.OhneZusatzstoffKlammern` entfernte die inline stehenden Code-Klammern, der Trenner blieb. Die neue Quelle liefert dieselbe Information bereits zerlegt in `lines[]`, und `name` trägt nur die **erste** Komponente.

```
ITMC:          "Gebackene Kartoffelecken | Kräutermayonaise (20c,26,28,4)"
               -> Schluessel: "gebackene kartoffelecken | kräutermayonaise"

mensa.fb4.it:  name  = "Gebackene Kartoffelecken"
               lines = ["Gebackene Kartoffelecken", "Kräutermayonaise"]

  ueber name:        "gebackene kartoffelecken"                      ABWEICHEND
  ueber join(' | '): "gebackene kartoffelecken | kräutermayonaise"   GLEICH
```

Gewählt: `string.Join(" | ", lines)` als Eingang in die **unveränderte** `GerichtNormalisierung`. Die Alternative — `name` allein — hätte für jedes mehrteilige Gericht einen anderen Schlüssel ergeben und alle bestehenden Bewertungen, Lieblingsgerichte und Fotos von ihren Gerichten getrennt; die Zuordnung ließe sich nachträglich nur raten.

`meal.id` scheidet als Schlüssel aus: die Quelle beschreibt sie als „eindeutig über alle Mensen und Tage", also eindeutig, nicht stabil — dasselbe Gericht trägt am Folgetag eine andere Kennung.

### Die Code-Bereinigung bleibt, obwohl die Quelle sie zusagt

Die Quelle gibt an, die Allergencodes aus den Beschreibungszeilen entfernt zu haben. Die Prüfung am 2026-09-22 über 73 Gerichte: deutsch sauber (0 Treffer), englisch nicht (5 Treffer), darunter `"herbal mayonnaise (20c,26,281,4)"` mit dem Code `281`, den die Legende der Quelle nicht kennt. Der Mangel stammt aus der Stwdo-Quelle. Die vorhandene Regex `\(\s*\d[0-9a-z,\s]*\)` fängt ihn, kostet nichts und bleibt deshalb stehen.

Ebenso bleibt der Sprachrückfall: `nameEn`/`linesEn` fehlten bei 10 von 73 Gerichten; dort tritt die deutsche Fassung an ihre Stelle, statt die Bezeichnung leer zu lassen (Capability `security-and-privacy`: keine stillen Fehler).

### Die englische Legende kommt aus der Quelle, nicht aus der App

Bei der Umsetzung von Abschnitt 2 am 2026-09-23 zeigte sich: `GET /legend` führt je
Eintrag genau ein `label`, und zwar auf Deutsch — eine Sprachwahl bietet die
Schnittstelle nicht. INT-015 lieferte diese Verzeichnisse zweisprachig (`{de, en}`).
Betroffen sind die 11 Zusatzstoff-, 27 Allergen- und 10 Kennzeichnungs-Klartexte; die
Gerichtsbezeichnung bleibt über `linesEn` zweisprachig.

Das Requirement „Gerichtskategorien und Zusatzstoffhinweise in Oberflächensprache"
(vormals MENSA-F-048) ist davon **nicht verletzt**: es fordert die Anzeige in der
gewählten Sprache ausdrücklich nur, „sofern die Quelle sie in dieser Sprache liefert".
Das Backend reicht deshalb bis auf Weiteres den deutschen Klartext in beiden Sprachen
durch — anforderungskonform, aber nicht das Ziel.

Gewählt (Entscheidung FSR FB4, 2026-09-23): `mensa-api` wird um eine englische Legende
ergänzt, das Backend liest sie, sobald sie vorliegt. Die Alternative — die 48 Klartexte
in die Übersetzung der App aufzunehmen — wäre schneller gewesen und hätte nichts
blockiert; sie schüfe aber eine zweite Stelle, die nachziehen muss, wenn das
Studierendenwerk seine Codes ändert. Genau dieses Nachziehen ist in beiden
Vorgängerprojekten unterblieben. Die Quelle liegt im eigenen Verantwortungsbereich des
FSR, also wird sie dort behoben, wo sie herkommt.

**Nachtrag 2026-09-24: eingetroffen und umgesetzt.** Die Quelle führt seit diesem Tag je
Legendeneintrag ein `labelEn` — nachgeprüft: alle 52 Einträge tragen es, die Fassung der
Schnittstelle blieb `0.2.0`, und es ist deren einzige Feldänderung seit der Verifikation
vom 2026-09-22. Das Backend liest es nun, gesteuert über dasselbe `Accept-Language`, das
schon die Gerichtsbezeichnung umschaltet und das der Vertrag an `/mensen/verzeichnisse`
bereits vorsah. Fehlt `labelEn` zu einem Code, tritt `label` ein — derselbe
Sprachrückfall wie bei `linesEn`, aus demselben Grund (keine stillen Fehler, SEC-F-060).
Damit entfällt der Vorbehalt „anforderungskonform, aber nicht das Ziel": die Anzeige
erfolgt in der gewählten Sprache, weil die Quelle sie nun in dieser Sprache liefert.
Entgegen der ursprünglichen Abgrenzung ist das Auslesen im Backend damit **doch** Teil
dieses Changes (Entscheidung FSR FB4, 2026-09-24) — der Nachlauf in `mensa-api` selbst
bleibt außerhalb, er ist dort bereits erfolgt.

### Öffnung und Speiseplan als zwei getrennte Tatsachen

Bisher war „kein Gericht" der einzige Anhaltspunkt für „geschlossen". Die neue Quelle meldet die Öffnung selbst, und die Prüfung hat beide Angaben gegeneinander abgeglichen: in 105 Tag/Mensa-Paaren kein Fall, in dem die Schnittstelle eine Mensa als geschlossen führte, während ihr Speiseplan Gerichte enthielt. Daraus folgt die Aufteilung in drei Zustände je Mensa und Tag:

```
isOpen   Gerichte   Anzeige
------   --------   ----------------------------------------
true     > 0        Gerichtsliste + Oeffnungszeit
true     0          "kein Speiseplan" + Oeffnungszeit        <- neu
false    0          "geschlossen" + Grund + Wiedereroeffnung
false    > 0        tritt nicht auf (0 von 105 geprueft)
```

Der vierte Fall wird trotzdem behandelt: tritt er auf, gilt die Öffnungsangabe, und die Gerichte werden angezeigt — eine offene Mensa ohne Speiseplan ist ein Ärgernis, eine verschwiegene Gerichtsliste ein Fehler.

### Wiedereröffnung aus Öffnungsvorschau und Schließtagen

Die heutige Fassung leitet den Wiedereröffnungstag aus dem Speiseplan-Bestand ab. Das trägt nicht: der Speiseplan-Horizont schwankte am 2026-09-22 je Mensa zwischen 4 und 11 Tagen, und für die drei Standorte ohne Speiseplan existiert er gar nicht. `forecast` (7 Tage) und `closures` (30 Tage) beantworten die Frage dagegen direkt — und stimmten dort, wo beide Quellen etwas sagten, taggenau überein.

Reichweite: Schließungen, die später als 30 Tage in der Zukunft **enden**, liefern keinen Wiedereröffnungstag. Dann bleibt es beim Geschlossen-Hinweis ohne Datum — derselbe Ausgang, den die heutige Fassung für den unbekannten Fall schon vorsieht.

### Vertrag additiv unter `/v1`

Nach ADR 0016 bekommt nur eine brechende Änderung einen neuen Pfad. Die Versuchung wäre, `zusatzstoffe` auf echte Zusatzstoffe zu verengen und daneben `allergene` zu führen — sauberer, aber für eine ältere App eine stillschweigende Bedeutungsänderung. Gewählt: `zusatzstoffe` behält seine bisherige Bedeutung (alle Codes), `allergene` kommt additiv daneben. Eine App, die `allergene` nicht kennt, verhält sich unverändert. Das ist genau der F-Droid-Fall, für den ADR 0016 die Regel aufgestellt hat.

Neue Felder: `komponenten` (Liste), `allergene` (Liste), `co2Klasse`, die Standortangaben je Mensa, die neue Öffnungszeitenform und der gemeldete Datenstand.

## Risks / Trade-offs

- **`mensa.fb4.it` fällt aus und das Backend hat keinen letzten guten Stand** → Der Fehler wird als Fehler gemeldet, nicht als leere Liste (Capability `backend-and-api`), sodass die App auf ihren gerätelokalen Bestand zurückfällt und den Altershinweis zeigt. Bewusst in Kauf genommen: die Quelle liegt im eigenen Verantwortungsbereich und ist damit reparierbar, anders als ein Fremdsystem.
- **Die Quelle liefert stillschweigend veraltete Daten** → Ihr `status` meldet Überalterung nicht, wohl aber ihr `updated`. Dieses wird durchgereicht und speist den Altershinweis. Im Vorlesungsbetrieb hält der Durchreichverkehr sie ohnehin warm; das Problem betrifft praktisch nur ruhige Zeiträume.
- **Mehr Last auf der Quelle als bisher** → Bisher rief ein Hintergrund-Job wenige Male am Tag ab, künftig schlägt jede App-Anfrage durch. Gedämpft durch die 300-Sekunden-Frist der Quelle. Die Quelle ist ein Go-Binary mit Speicher-Cache und antwortet warm in 0,11 s; sie ist dafür ausgelegt.
- **Die Standortliste enthält Unerwartetes** → Eine Kindertagesstätte mit eigenem Speiseplan und vier Standorte außerhalb Dortmunds. Alle bleiben wählbar, die Kuration von Reihenfolge und Standardauswahl im Admin entscheidet, was eine Studierende zuerst sieht.
- **Die Trennung Allergene/Zusatzstoffe stammt aus einer statischen Tabelle der Quelle**, nicht aus deren API („Die Legende stammt von der Stwdo-Website, nicht aus deren API"). Ändert das Studierendenwerk seine Codes, zieht die Legende erst nach, wenn `mensa-api` sie nachführt. → Unbekannte Codes werden unverändert angezeigt statt verschluckt.

## Migration Plan

1. Vertrag additiv erweitern, Typen erzeugen.
2. Backend: neuen Client gegen INT-020, Durchreichen statt Zwischenspeicher, Schlüsselbildung aus den Komponenten. Der Schlüssel bleibt zeichengleich — bestehende Bewertungs-, Lieblings- und Fotodaten brauchen **keine** Migration.
3. Datenbank: Tabelle des Speiseplan-Zwischenspeichers und der Verzeichniseinträge per Migration entfernen. Reiner Lesecache, kein Datenverlust.
4. Stammdaten: Öffnungszeiten aus Admin-Pflege, Vertrag und mitgeliefertem Ausgangsbestand entfernen.
5. App: Öffnungs-/Geschlossen-Zustände, Komponentendarstellung, Filtermenü, Sortier-/Gruppierauswahl, Standortangaben.

**Rückfall.** Bis Schritt 3 ist der alte Weg vollständig wiederherstellbar; danach wäre für eine Rückkehr zu INT-015 die Migration erneut anzuwenden. Da der Gerichtsschlüssel in beiden Richtungen derselbe bleibt, gingen dabei keine Bewertungen verloren.

## Open Questions

- Ab welchem gemeldeten Datenalter der Altershinweis greifen soll. Beeinflusst weder Specs noch Zuschnitt: die Anforderung nennt „älter als die festgelegte Gültigkeitsdauer", der konkrete Wert ist Konfiguration und bei der Umsetzung zu wählen.
- Ob die Beschreibung einer Mensa in der Auswahlliste oder erst in einer Detailansicht steht. Eine Gestaltungsfrage innerhalb der bestehenden Anforderung, ohne Rückwirkung auf Vertrag oder Backend.
