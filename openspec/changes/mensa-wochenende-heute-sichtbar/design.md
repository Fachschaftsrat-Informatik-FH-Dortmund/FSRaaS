## Context

Siehe `proposal.md` — Abschnitt „Warum". Der gesamte Eingriff liegt in einer reinen Funktion: `naechsterTag(datum, richtung, hatAngebot, jetzt)` in `app/src/areas/canteen/tageswahl.ts`. Sie ist ohne React geschrieben und direkt testbar; `CanteenScreen.tsx` ruft sie aus `blaettern()` auf und setzt das Ergebnis, sofern es nicht `null` ist.

Zwei bestehende Eigenschaften der Funktion prägen den Zuschnitt:

- Die Skip-Schleife läuft **höchstens drei Schritte** — begründet damit, dass am Stück nicht mehr als Samstag und Sonntag zu überspringen sind. Rückwärts vom Montag sind das Sonntag, Samstag, Freitag; der dritte Kandidat fällt unter die Untergrenze, und die Funktion liefert `null`. Genau hier entsteht der Fehler.
- `hatAngebot(tag)` liefert `boolean | undefined`; `undefined` (offline, Ladefehler) gilt als „kein Angebot". Der Bildschirm füttert das aus dem Query-Cache und lädt dafür nur `datum + 1` und `datum + 2` vorab — **ausschließlich vorwärts**.

## Goals / Non-Goals

**Goals:**

- Die Skip-Kette endet am aktuellen Tag, statt ihn zu überschreiten.
- Nach der Änderung gilt: Ist der Zurück-Pfeil bedienbar (`amAnfang === false`), liefert `blaettern(-1)` immer ein Ziel. Kein bedienbares Bedienelement ohne Wirkung.

**Non-Goals:**

- Das Vorabladen wird nicht auf Vorgängertage ausgeweitet (Begründung unter „Risks").
- `CanteenScreen.tsx` bekommt keine neue Logik. `amAnfang = datum <= isoHeute()` ist bereits richtig und bleibt unangetastet.

## Decisions

**Die Ausnahme wird als Abbruchbedingung in der Schleife geführt, nicht im `hatAngebot`-Aufruf.** Die Schleife prüft je Kandidat zuerst die Untergrenze, dann das Überspringen. Der aktuelle Tag ist genau die Untergrenze: `kandidat === heute` ist die Bedingung, unter der zurückgegeben statt weitergesucht wird — vor der Wochenendprüfung, nicht danach.

*Alternative:* `hatAngebot` so einpacken, dass es für den aktuellen Tag stets `true` meldet. Verworfen — das legt eine Tatsachenbehauptung über den Bestand in eine Funktion, die den Bestand meldet, und wäre an der Aufrufstelle in `CanteenScreen.tsx` nicht mehr als Ausnahme zu erkennen. Die Ausnahme gehört dorthin, wo die Untergrenze schon geprüft wird.

**Die Änderung wirkt in beiden Richtungen, obwohl sie rückwärts gebraucht wird.** Vorwärts kann der aktuelle Tag nicht Kandidat sein — jeder Vorwärtsschritt führt von ihm weg. Die Bedingung richtungsabhängig zu machen, verkomplizierte die Funktion ohne Verhaltensunterschied. Sie bleibt richtungsneutral formuliert.

**Der Schleifenzähler bleibt bei drei.** Er ist nach der Änderung großzügiger als nötig: Die Kette bricht rückwärts spätestens am aktuellen Tag ab, vorwärts nach Samstag und Sonntag. Kein Grund, ihn anzufassen; der begleitende Kommentar wird auf die neue Begründung gebracht.

## Risks / Trade-offs

**Ein Wochenendtag mit Angebot wird übersprungen, weil sein Bestand nicht geladen ist** → Unverändert bestehendes Verhalten, in `canteen-durchsprache-inhalt` bewusst bestätigt: Die Mensen des Studierendenwerks führen an Wochenenden praktisch nie ein Angebot. Der aktuelle Tag ist ab dieser Änderung nicht mehr betroffen — er wird unabhängig vom Bestand angezeigt, und gerade dort ist er auch immer geladen.

**Rückwärts wird nie vorab geladen** → Rückwärts ist nur ein einziger Wochenendtag als Kandidat erreichbar, dessen Bestand nicht geladen ist: der Sonntag beim Rückblättern vom Montag, wenn der aktuelle Tag der Samstag davor ist. Er wird dann übersprungen und man landet auf dem Samstag — dem aktuellen Tag, dem Ziel der Änderung. Das Vorabladen auszuweiten brächte hier nichts und kostete Abrufe.

**Ist der aktuelle Tag ein Samstag, bleibt der folgende Sonntag unerreichbar** → Gewollt, in `proposal.md` unter „Nicht Teil dieser Änderung" festgehalten. Wer den Sonntag sehen will, sieht am Sonntag nach.

## Migration Plan

Keine. Reine Verhaltensänderung in der App, kein persistierter Zustand, kein Vertrag, kein Backend. Rücknahme durch Zurücknehmen des Commits.
