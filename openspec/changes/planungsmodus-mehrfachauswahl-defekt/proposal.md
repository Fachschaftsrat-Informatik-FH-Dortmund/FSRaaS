## Why

Im Planungsmodus wählt das Antippen einer Zeile mehrere weitere Zeilen mit
aus (Gerätetest 2026-09-09, Issue #68, Kommentar 1, Punkt 1; deutlichstes
Beispiel „Technisches Englisch"). Wer eine Veranstaltungsreihe einplanen
will, trägt damit ungewollt weitere Termine in den Zwischenstand ein und
bemerkt es erst beim Sichern. Solange der Defekt besteht, ist jeder weitere
Gerätetest des Planungsmodus in seiner Aussage beeinträchtigt: Man kann
nicht unterscheiden, ob eine Beobachtung der Gestaltung gilt oder diesem
Fehler.

## What Changes

- Die Identität eines Slots im Planungsmodus wird eindeutig gemacht.
  `terminEntsprichtEintrag` (`app/src/areas/schedule/planungsstand.ts:56`)
  vergleicht heute `courseId`, `courseType`, `weekday`, Beginn, Ende und
  `studentSet` — aber weder `name` noch `roomId`. `kursbaum.baueModulliste`
  (`app/src/areas/schedule/kursbaum.ts:133`) hält Rohtermine, die sich
  ausschließlich im Namen unterscheiden, ausdrücklich auseinander. Beide
  Regeln zusammen führen dazu, dass ein Häkchen an einer Zeile auf jede
  andere Zeile derselben Zeit-, Raum- und Gruppenlage durchschlägt.
- Derselbe Ausdruck dient in `PlanungScreen.tsx:386` als React-Schlüssel der
  Zeile; er ist damit doppelt vergeben, solange er nicht eindeutig ist.
- Vor der Behebung ist am echten INT-002-Bestand zu klären, welcher der
  beiden möglichen Auslöser vorliegt — beide erzeugen am Gerät dasselbe
  Bild, verlangen aber verschiedene Fassungen der Schlüsselbildung:
  1. Rohtermine, die sich nur in `name` oder `roomId` unterscheiden. Belegt
     ist bereits, dass INT-002 deckungsgleiche Rohtermine liefert
     (`44232|Ü|Tue|720|765|C.E.32|A-P`, Befund vom 2026-09-08).
  2. Ein leeres `courseId`. Dann fällt `modulSchluessel`
     (`kursbaum.ts:53`) auf den Namen zurück, „Technisches Englisch 1" bis
     „Technisches Englisch 12" zerfallen in zwölf Module, und
     `terminEntsprichtEintrag` vergleicht zwei leere Kurskennungen als
     gleich.
- Kein fachliches Verhalten ändert sich: Ein Antippen wählt genau die Zeile
  aus, die angetippt wurde — das ist bereits heute die spezifizierte
  Wirkung.

## Capabilities

Keine — weder neue noch fachlich geänderte. Reiner Umsetzungsfehler an
bereits spezifiziertem und umgesetztem Verhalten (Requirements „Mehrere
Kandidaten in der Planungsauswahl" und „Mehrere Gruppen-Slots übernehmen",
`openspec/specs/schedule/spec.md`). Kein Requirement ändert sich, keines
kommt hinzu oder entfällt; die Änderung bleibt unterhalb der Spec-Ebene.
Daher `skip_specs: true` in `.openspec.yaml` — dieselbe Einordnung wie beim
Change `planungsmodus-sichern-absturz`.

## Impact

**Roadmap:** Schritt 5 (Stundenplan), Etappe 5 (Planungsmodus) — Nacharbeit
an bereits geliefertem Code, kein neuer Schnitt.

**Betroffener Code** (vor der Umsetzung vollständig zu prüfen):

- `app/src/areas/schedule/planungsstand.ts` — `terminSchluessel` (Zeile 39)
  und `terminEntsprichtEintrag` (Zeile 56); der Kommentar oberhalb von
  `terminSchluessel` behauptet noch Eindeutigkeit und ist mit zu berichtigen
- `app/src/areas/schedule/kursbaum.ts` — `modulSchluessel` (Zeile 53) und die
  Zusammenfassung deckungsgleicher Rohtermine (Zeile 133)
- `app/src/areas/schedule/screens/PlanungScreen.tsx` — Zeilenschlüssel
  (Zeile 386) und Auswahlanzeige (Zeile 389)
- `app/src/areas/schedule/alternativen.ts` — nutzt dieselbe Zuordnung

**Bewusst nicht in diesem Schnitt:** die Gestaltungspunkte aus Issue #68.
Sie laufen in `einrichtung-und-kursauswahl-bedienung`,
`planungsmodus-anzeige` und `modul-umbenennen-und-namenskuerzung`.

**Offener Punkt, der vor der Umsetzung zu klären ist:** welcher der beiden
oben genannten Auslöser tatsächlich vorliegt. Die Frage ist an einer
Live-Abfrage von INT-002 zu entscheiden, nicht am Code — ein Negativtest
gegen den FBWS beweist nichts, weil der Dienst unbekannte Parameter stumm
ignoriert.
