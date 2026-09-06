## 1. Tagesauswahl: Ausnahme für den aktuellen Tag

- [ ] 1.1 In `app/src/areas/canteen/tageswahl.ts` die Schleife in `naechsterTag()` so ergänzen, dass ein Kandidat, der dem aktuellen Tag entspricht, zurückgegeben wird, bevor die Wochenendprüfung greift — richtungsneutral, wie in `design.md` unter „Decisions" festgelegt. Nachweis: die Tests aus 1.3 und 1.4 laufen grün, die vier bestehenden Tests der Datei bleiben grün (`cd app && npm test -- tageswahl`).
- [ ] 1.2 Den Kopfkommentar der Datei und den Erläuterungsblock über `naechsterTag()` auf die neue Regel bringen: Wochenendtage ohne Angebot werden übersprungen, der aktuelle Tag nie; dazu die Begründung des Schleifenzählers nachziehen. Nachweis: der Kommentar nennt die Ausnahme, und keine Kommentarzeile behauptet mehr, die Untergrenze könne beim Überspringen unterschritten werden.
- [ ] 1.3 Test zum Requirement „Überspringen angebotsfreier Wochenendtage" in `tageswahl.test.ts` ergänzen: mit einer auf Samstag (2026-09-05) festgehaltenen Uhr liefert `naechsterTag('2026-09-07', -1, () => false, SAMSTAG)` den Samstag statt `null`. Der `describe`-Block trägt den Requirement-Titel im Namen (nicht die Alt-ID; CLAUDE.md, Abschnitt „Anforderungs-IDs"). Nachweis: der Test schlägt vor 1.1 fehl und läuft danach grün.
- [ ] 1.4 Test zum selben Requirement für die Gegenrichtung ergänzen: von einem Samstag als aktuellem Tag vorwärts wird der angebotsfreie Sonntag weiterhin übersprungen, Ziel ist der Montag. Nachweis: der Test läuft grün und belegt, dass die Ausnahme das Überspringen nicht allgemein aufhebt.
- [ ] 1.5 Prüfen, dass die bestehenden `describe`-Blöcke mit den Alt-IDs `MENSA-F-042` und `MENSA-F-044` unverändert bleiben — sie werden nach ADR 0019 nicht umnummeriert. Nachweis: `git diff` zeigt an den bestehenden Testnamen keine Änderung.

## 2. Nachweis am Bildschirm

- [ ] 2.1 Neue Testdatei `app/src/areas/canteen/screens/CanteenScreen.wochenende.test.tsx` anlegen, mit einer auf Samstag (2026-09-05) festgehaltenen Uhr nach demselben `jest.useFakeTimers`-Muster wie `CanteenScreen.test.tsx` (dessen `beforeAll` einen Montag fixiert und deshalb nicht mitbenutzt werden kann). Nachweis: die Datei läuft eigenständig durch (`cd app && npm test -- CanteenScreen.wochenende`).
- [ ] 2.2 Darin den Test zum Requirement „Aktueller Tag als Ausgangspunkt der Tagesauswahl" schreiben: Beim Öffnen an einem angebotsfreien Samstag zeigt der Bildschirm das Samstagsdatum, den Leerzustand „kein Angebot" und den Zurück-Pfeil als nicht auslösbar (`accessibilityState.disabled === true`). Nachweis: der Test läuft grün.
- [ ] 2.3 Darin den Round-Trip zum Requirement „Überspringen angebotsfreier Wochenendtage" schreiben: „Nächster Tag" führt vom Samstag auf den Montag, „Vorheriger Tag" von dort zurück auf den Samstag; das angezeigte Datum ist danach wieder das des Samstags. Nachweis: der Test schlägt gegen den heutigen Stand fehl (der Zurück-Pfeil bewirkt nichts) und läuft nach 1.1 grün.

## 3. Spec-Bestand und Abschluss

- [ ] 3.1 Den Absatz „Umsetzungsstand" in `openspec/specs/canteen/spec.md` nachführen: Er zählt `F-044` unter den umgesetzten und durch ID-tragende Tests belegten Anforderungen auf, ohne die Ausnahme für den aktuellen Tag zu kennen. Nachweis: der Absatz nennt die Ausnahme und das Datum der Änderung.
- [ ] 3.2 `node tools/spec-check/src/cli.js` und `node --test tools/spec-check/test/` ausführen. Nachweis: beide laufen ohne Befund durch, wie im CI-Schritt `spec-check`.
- [ ] 3.3 `cd app && npm run lint && npm run typecheck && npm test` ausführen. Nachweis: alle drei laufen grün.
- [ ] 3.4 `openspec validate mensa-wochenende-heute-sichtbar` ausführen und den Change nach `openspec archive` überführen, sodass das Delta in `openspec/specs/canteen/spec.md` übernommen ist. Nachweis: `openspec validate` meldet den Change als gültig, und das geänderte Requirement steht mit der Ausnahme im Hauptbestand.
