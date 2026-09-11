## 1. Auslöser klären

- [x] 1.1 Live-Abfrage von INT-002 über alle Endpunkte (`grade=*`) und
      Nachbildung der App-Verarbeitung; Ergebnis in design.md, Context:
      Auslöser 1 liegt vor, `courseId` ist in keinem der 942 Rohtermine leer.

## 2. Slot-Identität vereinheitlichen

- [x] 2.1 In `planungsstand.ts` `terminSchluessel` um den Namen erweitern,
      `terminEntsprichtEintrag` über `terminSchluessel` vergleichen und den
      Kommentar berichtigen (design.md, Entscheidung 1) — verifiziert durch
      neue Tests in `planungsstand.test.ts` für Termine, die sich nur im Raum,
      nur im Namen bzw. wie „Technisches Englisch 1"/„10" in beidem
      unterscheiden.
- [x] 2.2 In `kursbaum.ts` beim Zusammenfassen `terminSchluessel` unverändert
      als Kennung verwenden und den Kommentar berichtigen — verifiziert durch
      die bestehenden Tests „Zusammenfassen deckungsgleicher Rohtermine" und
      „Anzeigename paralleler Termingruppen ohne bedeutungslose Endzahl" in
      `kursbaum.test.ts`.

## 3. Planungsmodus

- [x] 3.1 In `PlanungScreen.tsx` die Zeilenkennung aus Terminschlüssel und
      Modulschlüssel bilden und für React-Schlüssel, Sprungziel,
      Hervorhebung und `testID` verwenden; `springeZu` erhält den
      Modulschlüssel (design.md, Entscheidung 2) — verifiziert durch einen
      neuen Test in `PlanungScreen.test.tsx`: Antippen von „Technisches
      Englisch 1" wählt „Technisches Englisch 10" nicht mit, und die
      bestehenden Sprung- und Hervorhebungstests bleiben grün.
- [x] 3.2 Derselbe Rohtermin in zwei gewählten Modulen erscheint in beiden als
      eigene Zeile ohne doppelten React-Schlüssel und wird nur einmal
      vorbelegt (design.md, Entscheidung 3) — verifiziert durch einen Test in
      `PlanungScreen.test.tsx`: keine „same key"-Warnung, beide Zeilen gewählt,
      das Sichern übernimmt den Termin genau einmal.

## 4. Eingeblendete Alternativen

- [x] 4.1 In `alternativen.ts` bereits erzeugte Kennungen überspringen
      (design.md, Entscheidung 4) — verifiziert durch neue Tests in
      `alternativen.test.ts`: derselbe Rohtermin aus zwei Modulen erscheint
      einmal, zwei Termine mit verschiedenem Namen erscheinen getrennt.

## 5. Abschluss

- [x] 5.1 `npx jest src/areas/schedule`, `npx tsc --noEmit` (ohne neue
      Befunde) und `node tools/spec-check/src/cli.js` laufen grün.
- [x] 5.2 Gerätetest auf einem Android-Testbuild: im Planungsmodus eine Zeile
      „Technisches Englisch" antippen und bestätigen, dass nur diese Zeile
      gewählt ist; datiertes Prüfprotokoll unter dieser Aufgabe festhalten.

### Prüfprotokoll 2026-09-11 — Android-Testbuild

Im Planungsmodus wurde eine Zeile „Technisches Englisch" angetippt. Nur diese
Zeile ist gewählt; gleichzeitige Parallelgruppen bleiben ungewählt. Damit gilt
die Behebung am Gerät als bestätigt.

### Prüfprotokoll 2026-09-11 — automatisierte Prüfung

`npx jest src/areas/schedule`: 30 Suiten, 458 Tests grün. Gegenprobe: Mit
dem Code vor diesem Change schlagen die neuen Tests fehl (6 von 7 im ersten
Lauf; der siebte unterschied Termine auch im Raum und wurde deshalb auf ein
reines Namenspaar aus `DDPM` umgestellt). `npx tsc --noEmit`: nur die zwei
vorbestehenden Befunde in `CanteenSelectionScreen.test.tsx`.
`node tools/spec-check/src/cli.js`: alle Prüfungen bestanden.
