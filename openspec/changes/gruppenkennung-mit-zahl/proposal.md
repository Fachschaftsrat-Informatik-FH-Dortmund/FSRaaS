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

## Warum es keine neue Rückfallregel braucht

Mit dem engeren Muster passt eine Kennung wie `H` nicht mehr auf `^[A-Z][0-9]+$` und läuft damit in den **bereits bestehenden** defensiven Rückfall der Zuordnungslogik: unbekanntes Gruppenkennung-Muster → Termin gilt als zugehörig, Vorfall protokolliert (SEC-F-060). Ein Restbestand ohne Zahl — etwa eine ältere lokale Einstellung oder eine unerwartete INT-019-Antwort — wird dadurch sichtbar behandelt statt still ausgeschlossen. Die stille `0` verschwindet ersatzlos, ohne dass eine zweite Regel nötig wäre.

## Was das für den Glossareintrag heißt

Der Eintrag „Gruppenkennung" wurde am 2026-09-06 erst auf die freiwillige Ziffer berichtigt, weil er der damals geltenden Spec widersprach. Mit dieser Entscheidung gilt wieder die Pflichtziffer; der Eintrag wird entsprechend zurückgeführt. Beide Schritte bleiben im Eintrag nachvollziehbar, damit ein Nachfolger nicht dieselbe Runde noch einmal dreht.

## Was offen bleibt

Ob INT-019 immer eine Zahl liefert, ist nicht belegt — bekannt ist ein Beispiel (`O7`). Liefert der Dienst je eine Kennung ohne Zahl, greift der defensive Rückfall oben; das ist sichtbar und protokolliert, aber nicht schön. Bei der Umsetzung an echten Antworten zu prüfen.
