## Why

Im Planungsmodus „wählt das Antippen eines Moduls mehrere weitere Module mit
aus" (Gerätetest 2026-09-09, Issue #68, Kommentar 1, Punkt 1; deutlichstes
Beispiel „Technisches Englisch"). Jede Zeile des Planungsmodus ist ein
Termin eines Moduls; beobachtet wurde also, dass ein Häkchen an einer Zeile
auch Zeilen anderer Module als gewählt ausweist. Wer eine
Veranstaltungsreihe einplanen will, sieht damit ungewollt weitere Termine
als eingeplant und bemerkt es erst beim Sichern. Solange der Defekt
besteht, ist jeder weitere Gerätetest des Planungsmodus in seiner Aussage
beeinträchtigt: Man kann nicht unterscheiden, ob eine Beobachtung der
Gestaltung gilt oder diesem Fehler.

## What Changes

- Die Identität eines Slots im Planungsmodus wird eindeutig gemacht.
  `terminEntsprichtEintrag` (`app/src/areas/schedule/planungsstand.ts:57`)
  vergleicht heute `courseId`, `courseType`, `weekday`, Beginn, Ende und
  `studentSet` — aber weder `name` noch `roomId`. `kursbaum.baueModulliste`
  (`app/src/areas/schedule/kursbaum.ts:135`) hält dagegen Rohtermine, die
  sich im Namen unterscheiden, ausdrücklich auseinander, und das Requirement
  „Zusammenfassen deckungsgleicher Rohtermine" verlangt, Termine mit
  abweichendem Raum getrennt darzustellen. Die Darstellung trennt also, die
  Auswahl nicht: Ein Häkchen an einer Zeile schlägt auf jede andere Zeile
  derselben Veranstaltung, Veranstaltungsart, Zeit- und Gruppenlage durch —
  unabhängig von Raum und Name.
- Die Zeilenkennung `terminSchluessel` (`planungsstand.ts:39`) ist ein
  eigener, engerer Ausdruck: Sie enthält den Raum, aber nicht den Namen. Sie
  dient als React-Schlüssel der Zeile (`PlanungScreen.tsx:386`), als
  Sprungziel und Hervorhebung (`:314`, `:397`, `:398`), als `testID`
  (`:529`) und als Kennung eingeblendeter Alternativen
  (`alternativen.ts:47`). Doppelt vergeben ist sie bei Rohterminen, die sich
  allein im Namen unterscheiden.
- Vor der Behebung ist am echten INT-002-Bestand zu klären, welcher der
  beiden möglichen Auslöser vorliegt — beide erzeugen am Gerät dasselbe
  Bild, verlangen aber verschiedene Fassungen der Schlüsselbildung:
  1. Rohtermine, die sich nur in `name` oder `roomId` unterscheiden. Belegt
     ist bislang nur, dass der Merkmalssatz ohne Namen nicht eindeutig ist:
     `44232|Ü|Tue|720|765|C.E.32|A-P` (Befund vom 2026-09-08, Issue #62)
     stimmt in allen sechs Feldern überein und wird seit
     `stundenplan-bedienung-ohne-vormerkung` bei gleichem Namen
     zusammengefasst. Ob Varianten mit abweichendem Namen oder Raum im
     Bestand vorkommen, ist damit nicht belegt.
  2. Ein leeres `courseId`. Dann fällt `modulSchluessel`
     (`kursbaum.ts:53`) auf den Namen zurück, „Technisches Englisch 1" bis
     „Technisches Englisch 12" zerfallen in zwölf Module, und
     `terminEntsprichtEintrag` vergleicht zwei leere Kurskennungen als
     gleich. Für diesen Auslöser spricht der Wortlaut des Gerätetests
     („mehrere weitere *Module*"). Der Vergleich ist außerdem in sich
     uneinheitlich: `planEintraegeFuerModul` (`planungsstand.ts:49`) und der
     Raumplan-Abgleich (`openspec/specs/schedule/spec.md`, Rückfall ohne
     `courseId`) greifen bei leerer Kurskennung auf den Namen zurück,
     `terminEntsprichtEintrag` nicht.
- Kein fachliches Verhalten ändert sich: Ein Antippen wählt genau die Zeile
  aus, die angetippt wurde — das ist bereits heute die spezifizierte
  Wirkung.

## Capabilities

Keine — weder neue noch fachlich geänderte. Reiner Umsetzungsfehler an
bereits spezifiziertem und umgesetztem Verhalten (Requirements „Mehrere
Kandidaten in der Planungsauswahl", „Mehrere Gruppen-Slots übernehmen" und
„Zusammenfassen deckungsgleicher Rohtermine", dessen Scenario „Termine mit
abweichendem Raum" die Auswahl heute verletzt; alle
`openspec/specs/schedule/spec.md`). Kein Requirement ändert sich, keines
kommt hinzu oder entfällt; die Änderung bleibt unterhalb der Spec-Ebene.
Daher `skip_specs: true` in `.openspec.yaml` — dieselbe Einordnung wie beim
archivierten Change `2026-09-10-planungsmodus-sichern-absturz`.

Diese Einordnung trägt nur, solange die Behebung die Identität eines
einzelnen Slots berichtigt und die Gruppierung zu Modulen
(`modulSchluessel`) unberührt lässt. Eine geänderte Modulbildung — etwa
„Technisches Englisch 1" bis „12" wieder zu einem Modul zusammenzuführen —
berührt die Requirements „Gliederung der Modulauswahl nach Fachsemester" und
„Anzeigename paralleler Termingruppen ohne bedeutungslose Endzahl" sowie den
Change `modul-umbenennen-und-namenskuerzung`; dann ist `skip_specs` neu zu
entscheiden.

### New Capabilities

Keine.

### Modified Capabilities

Keine.

## Impact

**Roadmap:** Schritt 5 (Stundenplan), Etappe 5 (Planungsmodus) — Nacharbeit
an bereits geliefertem Code, kein neuer Schnitt.

**Betroffener Code** (vor der Umsetzung vollständig zu prüfen):

- `app/src/areas/schedule/planungsstand.ts` — `terminSchluessel` (Zeile 39),
  `terminEntsprichtEintrag` (Zeile 57) und dessen Verwendung in
  `ermittlePlanungsstand` (Zeile 115), die Stand und Leiste der
  ausstehenden Veranstaltungen speist; der Kommentar oberhalb von
  `terminSchluessel` behauptet noch Eindeutigkeit und ist mit zu berichtigen
- `app/src/areas/schedule/kursbaum.ts` — `modulSchluessel` (Zeile 53, zu
  lesen, nicht zu ändern, siehe Capabilities) und die Zusammenfassung
  deckungsgleicher Rohtermine (Zeile 135); der Kommentar in Zeile 129–134
  beschreibt die Aufteilung zwischen `terminSchluessel` und
  `terminEntsprichtEintrag` und ist mit zu berichtigen
- `app/src/areas/schedule/screens/PlanungScreen.tsx` — Vorbelegung
  (Zeile 158), `terminUmschalten` (Zeile 259 und 264: die Abwahl entfernt
  den ersten Treffer, womöglich den Eintrag einer anderen Zeile), Sprung
  und Hervorhebung (Zeile 314, 397, 398), Zeilenschlüssel (Zeile 386),
  Auswahlanzeige (Zeile 389), Konfliktprüfung (Zeile 394) und `testID`
  (Zeile 529)
- `app/src/areas/schedule/alternativen.ts` — Ausschluss bereits geplanter
  Termine (Zeile 44) und Kennung der Alternativen (Zeile 47) in der
  Wochenansicht
- `app/src/areas/schedule/planungsstand.test.ts` — bestehender Test auf
  `terminEntsprichtEintrag` (Zeile 174)

**Bewusst nicht in diesem Schnitt:** die Gestaltungspunkte aus Issue #68.
Sie laufen in `einrichtung-und-kursauswahl-bedienung`,
`planungsmodus-anzeige` und `modul-umbenennen-und-namenskuerzung`.

**Offener Punkt, der vor der Umsetzung zu klären ist:** welcher der beiden
oben genannten Auslöser tatsächlich vorliegt. Die Frage ist an einer
Live-Abfrage von INT-002 zu entscheiden, nicht am Code — ein Negativtest
gegen den FBWS beweist nichts, weil der Dienst unbekannte Parameter stumm
ignoriert.

**Geklärt am 2026-09-11:** Auslöser 1 liegt vor, Auslöser 2 nicht — Befund
und Zahlen in design.md, Context.
