# Planungsmodus: Kriterienrangfolge statt Optimierungsmodus

## Warum

Aus der Herkunfts-Durchsprache der Capability `schedule` am 2026-09-06 (`herkunft-schedule-durchsprache`). Der Planungsmodus bleibt im Grundsatz bestehen; sein Zuschnitt wird neu gefasst. Drei Befunde haben das ausgelöst.

**Zwei Anforderungen widersprachen sich.** Die Anforderung zur Konfliktprüfung gegenüber Pflicht-Kandidaten stellt die Vollkombinatorik über gleichzeitig unentschiedene Kandidaten ausdrücklich zurück (Rücksprache 2026-08-25, Begründung: die Ergebnisdarstellung würde unübersichtlich). Die spätere Anforderung zum automatischen Planungsvorschlag (2026-09-04) verlangt genau sie — einen konfliktfreien Vorschlag aus den Kandidaten der Planungsauswahl —, ohne die frühere Festlegung zu nennen.

**Ein Modus rechnete das Gegenteil seines Namens.** „Ausgeglichener Tagesablauf" bevorzugte die Tagesspanne, die einer Acht-Stunden-Spanne am nächsten kommt. An einem bisher kurzen Tag bevorzugte er damit ausgerechnet den Termin, der ihn auf acht Stunden aufbläht.

**Eine Erläuterung erweiterte ein Requirement still.** Die Begründung zum Zeitfenster sagt, der Optimierungsmodus berücksichtige die Abweichung bei der Reihung. Das Requirement zur Reihung kennt als Größen nur Tagesspanne und Nachbarabstand — das Zeitfenster kommt darin nicht vor.

Bei der Klärung kamen vier neue Optimierungsziele dazu, und mit ihnen die Erkenntnis, dass eine Auswahl aus benannten Modi das Gewünschte nicht mehr ausdrücken kann: „möglichst wenige Fahrten, und dabei nach Möglichkeit Vorbereitungszeit" ist keine Auswahl, sondern eine Rangfolge.

## Was sich ändert

**Aus einem Optimierungsmodus wird eine geordnete Kriterienliste.** Die Nutzerin ordnet acht Kriterien nach Wichtigkeit und kann einzelne ganz abschalten. Ausgewertet wird streng der Reihe nach, ohne Toleranz: Das oberste Kriterium entscheidet; erst bei Gleichstand zählt das nächste. Wer eine andere Abwägung will, ändert die Reihenfolge — das ist der Zweck der Liste. Bewusst *keine* Punktegewichtung: Bei gewichteten Punkten lässt sich einer Nutzerin nicht mehr erklären, warum ein Vorschlag oben steht, und ein hoch gewichtetes Kriterium kann überstimmt werden.

**Die bisherigen Modi bleiben als Voreinstellungen.** Fünf benannte Voreinstellungen füllen die Liste; jede schaltet genau die Kriterien ein, die sie ausmachen, und lässt die übrigen aus. Damit bleibt der schnelle Weg erhalten: einen Namen antippen statt eine Sortierung bearbeiten.

**Die Optimierung ist ein Hilfsmittel, kein Dauerzustand.** Der Ausgangszustand ist die Einteilung nach Gruppenbuchstabe, ohne jede Optimierung — die Nutzerin stellt ihren Plan selbst zusammen und greift auf die Optimierung zurück, wenn sie will. Eine übernommene Optimierung lässt sich über einen sichtbaren Weg zurücknehmen; wer ausprobieren soll, muss zurückkönnen.

**„Pflicht" und „angepinnt" trennen Ob und Wann.** Bisher trug „Pflicht" beides. Künftig heißt „Pflicht": diese Veranstaltung muss im Plan bleiben, der Termin ist frei wählbar. „Angepinnt" heißt: dieser Zeitslot steht. Daraus folgt eine Korrektur der Konfliktprüfung: Sie kann sich nicht mehr auf Pflicht-Markierungen stützen, weil die keine feste Uhrzeit mehr tragen — geprüft wird gegen den übernommenen Plan und gegen angepinnte Termine.

**Der automatische Vorschlag arbeitet greedy.** Er geht die Kandidaten in festgelegter Reihenfolge durch und wählt für jeden den nach der Kriterienrangfolge besten Termin, der gegen das bis dahin Gewählte frei ist. Damit bleibt die Zurückstellung der Vollkombinatorik von 2026-08-25 in Kraft. Der Vorschlag darf jeden nicht angepinnten Termin auf einen anderen Gruppen-Slot derselben Veranstaltung umlegen, entfernt aber nie eine Veranstaltung. Findet er keine konfliktfreie Konstellation, zeigt er die beste gefundene mit markiertem Konflikt und nennt die „Pflicht"-Markierung als Weg, die Entscheidung zu steuern.

**Vorbereitungszeiten werden je Veranstaltungsart eingestellt** — ein Standardwert plus Ausnahmen, nicht sieben Einzelfelder. So bekommt auch eine künftige, heute unbekannte Veranstaltungsart einen Wert statt einer Lücke.

## Die acht Kriterien

| Kriterium | Gemessen wird | Besser ist |
|---|---|---|
| Uni-Tage | Zahl der Wochentage mit mindestens einem Termin | weniger |
| Anwesenheitszeit | Summe der Tagesspannen über die Woche | weniger |
| Gleichmäßige Woche | Unterschied zwischen den Tagesspannen der Uni-Tage | kleiner |
| Abstand zwischen Lerneinheiten | Nachbarabstand zum vorangehenden bzw. folgenden Termin | größer |
| Vorbereitungszeit | freie Zeit unmittelbar vor einem Termin, gegen den je Veranstaltungsart eingestellten Zielwert | näher am Zielwert |
| Abstand Vorlesung–Übung | Zeit zwischen einer Vorlesung und dem zugehörigen Termin anderer Art derselben Veranstaltung | mindestens der eingestellte Abstand, in dieser Reihenfolge |
| Abwechslung | Zahl der Fälle, in denen an einem Tag Termine derselben Veranstaltungsart unmittelbar aufeinanderfolgen | weniger |
| Zeitfenster | ob der Termin im festgelegten Zeitfenster liegt | innerhalb |

Zwei Festlegungen an den Rändern, ohne die die Kriterien in die Irre laufen. **Der erste Termin eines Tages gilt bei der Vorbereitungszeit als erfüllt** — wer den Tag mit dem Praktikum beginnt, bereitet zu Hause vor; ohne diese Regel würde das Kriterium frühe Termine systematisch benachteiligen. **Liegt die Übung vor der zugehörigen Vorlesung, gilt der Abstand als schlecht erfüllt**, unabhängig davon, wie viele Stunden dazwischenliegen — sonst würde ausgerechnet die unbrauchbarste Anordnung als beste bewertet.

## Die fünf Voreinstellungen

| Voreinstellung | Kriterien in dieser Reihenfolge |
|---|---|
| Zeit an der Uni | Anwesenheitszeit |
| Fahrten zur Uni | Uni-Tage, Anwesenheitszeit |
| Ausgeglichene Woche | Gleichmäßige Woche |
| Abstand zwischen Lerneinheiten | Abstand zwischen Lerneinheiten |
| Vorbereitungszeit | Vorbereitungszeit, Abstand Vorlesung–Übung |

„Abwechslung" und „Zeitfenster" sind Kriterien ohne eigene Voreinstellung — sie wirken erst, wenn die Nutzerin sie selbst in die Liste zieht. Die Liste der Voreinstellungen ist wie bisher ein Mindestumfang, nicht abschließend.

## Bekannte Grenze

Das Verfahren bleibt greedy. Es kann eine Konstellation verfehlen, die bei anderer Bearbeitungsreihenfolge aufgegangen wäre. Das ist der bewusst gewählte Preis dafür, dass das Ergebnis in einem Satz erklärbar bleibt („weniger Uni-Tage, bei gleicher Tageszahl kürzere Anwesenheit") und die Nutzerin über Rangfolge, „Pflicht" und Anpinnen nachsteuert, statt aus dutzenden Varianten zu wählen.

## Umfang

Bleibt Roadmap-Schritt 5, Etappe 5, in zwei Zügen: zuerst die fünf Voreinstellungen mit festen Reihenfolgen — damit ist der Planungsmodus vollständig nutzbar —, danach im selben Schritt die freie Sortierung und das Abschalten einzelner Kriterien. Alles ist reine Gerätelogik: kein Backend, keine Vertragsänderung.
