# Herkunfts-Durchsprache der Capability schedule

## Warum

Nach `docs/agents/herkunft-durchsprache.md` durchgesprochen, Leitfrage je Requirement: *Würde der FSR das heute noch so beschließen — und woran erkennt man das?* Vorgenommen am 2026-09-06 für alle 29 `NEU`-Requirements der Capability `schedule`.

Zwei Befunde gleich zu Beginn korrigieren das Bild, das die Anleitung zeichnet.

**Die Frontier ist eine andere als angenommen.** Die Anleitung nennt als Einstieg den Block „ab SCHED-F-460, 23 Requirements auf einmal". Der trägt tatsächlich fast durchgehend `Recherche: Rücksprache Studierender, 2026-09-04`; `NEU` sind daraus nur zwei. Die 29 `NEU`-Requirements liegen in drei älteren Blöcken — Planungsmodus (10), Raumplan-Abgleich (6), Prüfungsplan (4) — plus neun Einzelnen.

**Es gibt keine laufende Implementierung, auf die sich eine Bestätigung stützen könnte.** Der `canteen`-Durchgang konnte umgesetzte Requirements gesammelt bestätigen, weil Code und Tests trugen. Hier nicht: `app/src/areas/schedule/screens/ScheduleScreen.tsx` ist weiterhin `<ComingSoon />`. Es existieren reine Logikmodule mit Einheitentests (`groupMatch.ts`, `farbe.ts`, `ansichtEinstellungen.ts`) und die beiden Einrichtungs-Screens, aber keine benutzbare Plan-Ansicht. Vier Requirements, die nach Testnamen „umgesetzt" aussehen (F-060, F-145, F-660, F-710), sind damit genauso unbestätigt wie der Rest und wurden unter derselben Leitfrage behandelt. Die Belege dieser Durchsprache stützen sich deshalb durchgehend auf eine Abwägung, nicht auf Erfahrung — das steht so in den Erläuterungen, weil es den Unterschied ausmacht, wie fest eine Anforderung beim nächsten Durchgang steht.

**Ergebnis: ein Requirement entfällt, sieben ändern sich, eines kommt hinzu.** Fünf weitere Änderungen betreffen den Prüfungsplan und den Planungsmodus und laufen in eigenen Changes (`pruefungsplan-ohne-upload`, `planungsmodus-kriterien`), weil sie über diese Capability hinausreichen beziehungsweise ein eigenes Funktionsfeld neu zuschneiden.

## Was sich ändert

**Die Matrikelnummer wird nicht mehr gespeichert.** Bisher regelte die Anforderung nur, wohin die Nummer *nicht* darf, und setzte das Speichern als gegeben voraus — ohne dass irgendwo stand, wozu. Gespeichert wird künftig allein die daraus ermittelte und bestätigte Gruppenkennung. Das ist die einzige Entscheidung dieser Durchsprache mit unmittelbarer Codefolge: `app/src/areas/schedule/einrichtung.ts` legt die Nummer heute ab, mit Tests darauf.

**Kalender-Schreibzugriff und Datei-Export werden gleichrangig.** Bisher war der Schreibzugriff Hauptweg und der Datei-Export Rückfall. Beide werden nebeneinander angeboten. Bei verweigerter Berechtigung bricht der Vorgang nicht ab, sondern führt wahlweise in die Systemeinstellungen oder zum Datei-Export — die bisherige Festlegung „keine wiederholte Nachfrage" entfällt. Grund für den Weg in die Systemeinstellungen statt einer erneuten Abfrage: iOS und Android zeigen den Berechtigungsdialog nach einer Ablehnung kein zweites Mal, „erneut versuchen" kann die App also nicht selbst auslösen.

**Ein bewusst angenommener Konflikt erzeugt keine Dauerwarnung mehr.** Der Konflikthinweis galt bisher für je zwei feste Termine ausnahmslos — auch für ein Paar, das die Nutzerin nach der Anforderung zur bewussten Übernahme ausdrücklich angenommen hat. Damit kam genau die Dauerwarnung zurück, gegen die der Status „vorgemerkt" eingeführt wurde. Ein angenommener Konflikt trägt künftig allein seine Kennzeichnung.

**Der leere Tag nennt den Filter, der ihn leert — nicht mehr nur die Gruppenfilterung.** Es gibt inzwischen mehrere Filter, und mit dem neuen „Alle anzeigen"-Schalter kommt ein weiterer dazu.

**Der Raumabweichungs-Hinweis benennt seine Quelle und die Rangfolge.** Er nennt künftig, woraus er abgeleitet ist (die Raumreservierung des Fachbereichs), und verweist auf den offiziellen Prüfungsplan *und* „FB-Aktuelles" als vorrangige, verbindliche Quellen — bisher stand dort nur „FB-Aktuelles".

**Die Veraltungsschwelle des Raumplans wird brauchbar.** Bisher entfielen die Hinweise, sobald der Zwischenspeicher älter war als die Aktualisierungsfrequenz. Da das Backend alle paar Minuten abruft, wäre der Stand fast immer „veraltet" und der ganze Block praktisch immer stumm gewesen. Künftig gilt das Vierfache der Frequenz, mindestens 30 Minuten — das trifft den gemeinten Fall: nicht „eine Runde verpasst", sondern „das Backend holt seit Längerem nichts mehr".

**Neu: ein Schalter, der alle Filter auf einmal abschaltet.** Zweck ist manuelles Planen, wenn die App den eigenen Fall nicht abdeckt. Dass die Ansicht dabei unübersichtlich wird, ist ausdrücklich in Kauf genommen.

**Entfallen: das Zeitziel beim Blättern zwischen Wochentagen** (vormals SCHED-N-010). Die Anforderung sagte inhaltlich nur „es gilt der querschnittliche Zeitwert", ohne eigenen Wert und ohne eigene Begründung, und der Registerabschnitt verwies seinerseits auf sie zurück. Als REMOVED geführt, die Kennung bleibt vergeben.

## Was bleibt, mit nachgetragenem Beleg

- **Der Planungsmodus** (10 Requirements) im Grundsatz — Zuschnitt und Kriterien ändern sich in `planungsmodus-kriterien`.
- **Der Raumplan-Abgleich** (6 Requirements), ausdrücklich als experimentelles Feature geführt, das unvollständig bleiben darf. Der INT-009-Spike wird Vorbedingung von Roadmap-Schritt 6.
- **Die Prüfungsplan-Requirements** (4) — die Quelle wechselt in `pruefungsplan-ohne-upload`, die Anforderungen selbst bleiben.
- **Wildcard-Behandlung, Ausblende-Schalter, automatische Farbzuweisung** — drei billige, schwer zu bereuende Festlegungen ohne Umsetzungsdeckung.
- **Auswahl der Terminarten beim Export.**

## Drei Erläuterungen werden berichtigt

**Die Begründung der Wildcard-Anforderung trug nicht.** Sie stützte sich darauf, dass die Capability `integrations` den Abrufparameter `studentSet=*` führe — das ist ein Anfrageparameter, kein Feldwert in der Antwort, und begründet nicht, warum ein Termin mit dem Wert `*` erwartet werden muss. Die tragende Begründung ist eine andere und stand schon daneben: `*` bedeutet unstrittig „gilt für alle Gruppen", und die Android-Alt-App kehrt diese Bedeutung um (N-007). Drei Zeilen Logik, die einen Bedeutungsfehler ausschließen, brauchen keinen Vorkommensnachweis.

**Die Erläuterung zur Export-Ausgestaltung trug noch die alte Rangfolge.** Der Absatz vom 2026-08-25 führte den Schreibzugriff als Hauptweg und den Datei-Export als Rückfallweg — genau die Rangfolge, die das geänderte Requirement aufhebt. Er fasste dabei zwei ungleiche Fälle unter „Rückfall": die verweigerte Berechtigung (ein Fehlerfall) und einen Kalender außerhalb des Geräts (der reguläre Fall jeder Nutzerin mit Web- oder Desktop-Kalender). Berichtigt durch einen datierten Nachtrag im selben Abschnitt, der zugleich die entfallene Festlegung „keine wiederholte Nachfrage" festhält.

**Eine „Offene Frage" war durch die eigene Erläuterung überholt.** Die Korrektur vom 2026-09-04 stellt fest, dass INT-002 und INT-009 beide `courseId` führen. Die Frageliste behauptete weiterhin, INT-002 führe „kein `courseId` für alle Fälle, ein exakter Schlüssel fehlt teils". Die Frage wird auf das reduziert, was tatsächlich offen ist: die Trennschärfe des Merkmalssatzes für Einträge *ohne* `courseId`.

## Was dabei an Domänenwissen aufgeschrieben wird

Studierende stellen sich ihren Stundenplan regelmäßig aus Terminen mehrerer Gruppen zusammen und besuchen Gruppen, denen sie formal nicht angehören; der Fachbereich duldet das, solange die Gruppen nicht überfüllt sind. Das ist die tragende Begründung hinter vier Anforderungen — Kennzeichnen statt Entfernen, Einsicht in Termine anderer Gruppen, Übernahme fremder Termine, „Alle anzeigen" — und stand bisher nirgends.
