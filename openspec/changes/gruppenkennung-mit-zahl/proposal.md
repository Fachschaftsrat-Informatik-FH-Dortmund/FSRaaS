# Gruppenkennung mit verpflichtender Zahl

## Warum

Am 2026-09-04 wurde das Eingabeformat der Gruppenkennung von `^[A-Z][0-9]+$` auf `^[A-Z][0-9]*$` erweitert — die Zahl wurde freiwillig. Begründung damals, aus der Rücksprache mit einer studierenden Person: „der Buchstabe ist die maßgebliche Angabe, die Zahl wird so gut wie nie gebraucht."

**Das ist widerlegt.** Der am 2026-09-04 selbst erhobene FBWS-Bestand von `INPBPI/2` führt 21 verschiedene `studentSet`-Werte, und fünf davon tragen eine Zahl an einer Bereichsgrenze: `C5-E`, `M5-P`, `J-M4`, `H5-J`, `F-H4`. Genau dort entscheidet die Zahl mit — bei knapp einem Viertel der Werte, nicht „so gut wie nie". Der Befund stand die ganze Zeit in derselben Erläuterung wie die gegenteilige Schlussfolgerung.

**Und die Erweiterung hat einen stillen Ausschluss erzeugt.** `app/src/areas/schedule/groupMatch.ts` führt eine fehlende Zahl als `0` (`Number('')`). Eine Kennung `H` wird gegen `H5-J` damit als (H,0) verglichen, 0 < 5 — der Termin gilt als gruppenfremd und verschwindet bei aktivem Ausblenden-Schalter aus dem Plan. Betroffen ist jede untere Bereichsgrenze mit Zahl. Das ist genau der Fehlertyp, den die Spec an jeder anderen Stelle ausschließt („sicherer Rückfall: sichtbar statt fälschlich als fremd markiert", Abschnitt „Fehlerfälle"). Die Beispieltabelle der Gruppenzuordnung enthält keinen Fall „Kennung ohne Zahl gegen Grenze mit Zahl", weshalb kein Test ihn fängt.

Entschieden 2026-09-06: Die Zahl wird wieder verpflichtend.

## Was sich ändert

**Das Eingabeformat geht zurück auf `^[A-Z][0-9]+$`.** Buchstabe und Zahl sind beide verpflichtend.

**Der Weg über die Matrikelnummer wird der voreingestellte.** Er ist der Grund, warum die Pflicht niemanden aussperrt: INT-019 liefert die vollständige Kennung samt Zahl (belegt für `O7`), ohne dass die Nutzerin sie kennen muss. Die manuelle Angabe bleibt vollwertig erreichbar, verlangt dann aber beide Teile. Die vorige Fassung stellte beide Wege gleichrangig nebeneinander; das trägt nicht mehr, seit nur einer von beiden die Zahl zuverlässig beschafft.

**Die Beispieltabelle bekommt die fehlenden Prüffälle.** Vier Zeilen für eine Kennung ohne Zahl gegen Grenzen mit Zahl — der Fall, der den Defekt trug und den bisher kein Test abdeckte.

## Wie ein Restbestand ohne Zahl behandelt wird

Ein Restbestand ohne Zahl — eine ältere gerätelokale Einstellung oder eine unerwartete INT-019-Antwort — bleibt möglich, auch wenn die Eingabe ihn nicht mehr erzeugen kann. Er wird als **unvollständige** Kennung geführt (`zahl: null`) statt die fehlende Zahl als `0` zu lesen. Der Buchstabe entscheidet dabei weiterhin zuerst; erst wenn er auf einer Grenze **mit** Zahl liegt, ist die Zuordnung nicht entscheidbar — dann gilt der Termin als zugehörig und der Vorfall wird protokolliert (SEC-F-060).

**Berichtigt am 2026-09-07, bei der Umsetzung aufgefallen.** Die vorige Fassung dieses Abschnitts hielt fest, der bereits bestehende defensive Rückfall genüge, ohne dass eine zweite Regel nötig sei. Das trägt nicht: Jener Rückfall liefert für *jedes* `studentSet` „zugehörig" und hätte damit auch die Zeile `D` (unvollständig) / `A1-C9` der Beispieltabelle verletzt, wo der Buchstabe allein schon entscheidet (D liegt außerhalb A bis C, die fehlende Zahl spielt dort keine Rolle). Ein Studierender der Gruppe `D` hätte sämtliche `A1-C9`-Termine als eigene angezeigt bekommen — derselbe Fehlertyp wie die stille `0`, nur in die andere Richtung. Die Beispieltabelle und die Fehlerfälle-Zeile („Termine **an Bereichsgrenzen mit Zahl** als zugehörig behandeln") waren von Anfang an eng gefasst und richtig; falsch war allein dieser Abschnitt.

## Was das für den Glossareintrag heißt

Der Eintrag „Gruppenkennung" wurde am 2026-09-06 erst auf die freiwillige Ziffer berichtigt, weil er der damals geltenden Spec widersprach. Mit dieser Entscheidung gilt wieder die Pflichtziffer; der Eintrag wird entsprechend zurückgeführt. Beide Schritte bleiben im Eintrag nachvollziehbar, damit ein Nachfolger nicht dieselbe Runde noch einmal dreht.

## Was offen bleibt

Ob INT-019 immer eine Zahl liefert, ist nicht belegt. **Bei der Umsetzung am 2026-09-07 gegen das Register geprüft:** Der Eintrag INT-019 führt drei Antwortgestalten und drei real beobachtete Kennungen — `O7`, `B3`, `A9` —, alle mit Buchstabe und Ziffer; eine Kennung ohne Zahl ist dort nicht belegt. Ausgeschlossen ist sie damit nicht: Der Endpunkt ist undokumentiert und ohne SLA. Liefert er je eine Kennung ohne Zahl, greift die Behandlung als unvollständige Kennung oben — sichtbar und protokolliert.
