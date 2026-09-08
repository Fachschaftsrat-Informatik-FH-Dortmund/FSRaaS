# Aufgaben

## 1. Zeitachse

- [ ] 1.1 `zeitachse.ts` auf eine Spanne je Tag umstellen — erster bis letzter Termin des angezeigten Tages, keine Randlücken; Test `describe('Proportionale Zeitachse', …)` mit dem Szenario „Kein Leerraum an den Tagesrändern"
- [ ] 1.2 Lückenschwellen in `dayLayout.ts`: unter fünfzehn Minuten ohne Block und ohne Beschriftung, über einer Stunde auf Stundenhöhe gestaucht mit Bruchzeichen und tatsächlicher Dauer; Tests für die Szenarien „Kurze Lücke" und „Lange Lücke"
- [ ] 1.3 `dayLayout` liefert Abschnitte mit eigener Höhe statt einer linearen Spanne (`design.md` Entscheidung 1); die Umrechnung auf Pixel bleibt in der Darstellungsschicht, ohne Fachlogik
- [ ] 1.4 Stundenlinien ohne Beschriftung zeichnen, in gestauchten Lücken keine; Tests `describe('Stundenlinien auf der Zeitachse', …)` für beide Szenarien
- [ ] 1.5 Jetzt-Strich an den Rand heften, wenn die aktuelle Uhrzeit außerhalb der Tagesspanne liegt; Test zum Szenario „Uhrzeit vor dem ersten Termin"

## 2. Stapelung überschneidender Termine

- [ ] 2.1 Spaltenkappung auf drei in `ordneSpaltenZu`, überzählige Termine als Stapel-Slot mit ausgewiesenem Umfang; Tests `describe('Stapelung bei mehr als drei überschneidenden Terminen', …)` für „Vier überschneidende Termine" und „Eigene Termine zuerst"
- [ ] 2.2 Test `describe('Nebeneinanderdarstellung überschneidender Termine', …)` auf die zwei MODIFIED-Szenarien umstellen — zwei und drei Termine weiterhin nebeneinander
- [ ] 2.3 Aufklappen des Stapels durch Dehnen des Abschnitts umsetzen; Test zum Szenario „Stapel aufklappen" belegt, dass alle enthaltenen Termine einzeln erreichbar sind und nichts verdeckt wird

## 3. Filter zurückbauen

- [ ] 3.1 `gruppenfremdeAusblenden` und `alleAnzeigen` aus `ansichtEinstellungen.ts` entfernen, `wirksameFilter` auflösen; `bereinige()` verwirft gespeicherte Altwerte, Test mit einem Stand alter Gestalt
- [ ] 3.2 `wochenansicht.ts` auf den unbedingt geltenden Gültigkeitszeitraum zurückführen; `leerGrund` behält zwei Fälle
- [ ] 3.3 Tests `describe('Leerer Tag bei wirksamem Filter', …)` auf die zwei MODIFIED-Szenarien umstellen; die Tests zu den entfernten Schaltern entfallen mit den REMOVED-Deltas
- [ ] 3.4 `belegungsvorschauJeTag` aus `wochentage.ts` entfernen; Test `describe('Wochentagsleiste mit bedarfsweisem Samstag', …)` belegt, dass der Eintrag nur noch Wochentag und Datum trägt

## 4. Kopfbereich und Navigation

- [ ] 4.1 Wochenangabe und Wochentagsleiste feststellen, nur die Achse darunter blättern lassen; Test `describe('Feststehender Kopfbereich der Wochenansicht', …)`
- [ ] 4.2 Waagerechtes Wischen für den Tageswechsel über `gesten.ts` aus dem Mensaplan; Test `describe('Tageswechsel durch Wischen', …)` belegt zugleich, dass die Wochentagsleiste als sichtbarer Weg bestehen bleibt
- [ ] 4.3 Rückkehr zur laufenden Woche über die Wochenangabe nach dem Mensa-Muster; Tests `describe('Rückkehr zur laufenden Woche über die Wochenangabe', …)` für beide Szenarien, einschließlich der unveränderten Anordnung in der laufenden Woche

## 5. Ansichts- und Verwaltungsblatt

- [ ] 5.1 Kopfzeilen-Element und Blatt mit Zeitachse-Umschalter, Sprung zu heute, Alternativen-Schalter, Farbautomatik, Zugang zur Einrichtung und den beiden Löschaktionen; Tests `describe('Ansichts- und Verwaltungsblatt in der Kopfzeile', …)` für beide Szenarien
- [ ] 5.2 `toggleSprungZuHeute` erstmals an einen Bedienweg anbinden — bislang implementiert und tot
- [ ] 5.3 Schalterkasten unter dem Plan entfernen

## 6. Löschaktionen

- [ ] 6.1 „Stundenplan leeren" an `planStore.clear()` anbinden, mit Bestätigung und Zusatzfrage zu eigenen Terminen (vorbelegt auf nein); Tests `describe('Nutzeraktion „Stundenplan leeren"', …)` für alle drei Szenarien
- [ ] 6.2 „Stundenplan zurücksetzen" an `planStore.clear()` und `einrichtung.clear()` anbinden; Tests `describe('Nutzeraktion „Stundenplan zurücksetzen"', …)` für beide Szenarien, einschließlich des Nachweises, dass Ticket, News-Regeln und Mensa-Einstellungen unberührt bleiben
- [ ] 6.3 Tests `describe('Kein selbsttätiges Entfernen des Stundenplans', …)` für beide Szenarien — der Semesterwechsel-Hinweis bietet an, entfernt aber nichts; ein entfallener Endpunkt lässt seine Termine stehen

## 7. Alternativen einblenden

- [ ] 7.1 Auswahlbestand in der Wochenansicht verfügbar machen, mit den vier Zuständen Laden, Leer, Fehler und Offline über die bestehende Grundstruktur; ohne Bestand bleibt der Schalter wirkungslos und sagt es, der eigene Plan bleibt offline vollständig
- [ ] 7.2 Alternativen abgesetzt darstellen und über die Stapelung aus Block 2 einordnen; Test `describe('Einblenden aller Veranstaltungen gewählter Module', …)`, Szenario „Alternativen einblenden"
- [ ] 7.3 Blatt mit „anstelle des eigenen Termins" und „zusätzlich zum eigenen Termin"; Test zum Szenario „Alternative übernehmen", damit zugleich die bestehenden Requirements „Einsicht in Termine anderer Gruppen" und „Übernahme des Termins einer anderen Gruppe" erstmals umgesetzt

## 8. Jetzt-Anzeige und Termindetail

- [ ] 8.1 Jetzt-Anzeige zweispaltig, laufende und nächste Veranstaltung nebeneinander; Zeitangaben über `dauerText()` statt in reinen Minuten; Tests `describe('Anzeige des laufenden und nächsten Termins', …)` für beide Szenarien, darunter „in 200 Minuten" als Stunden und Minuten
- [ ] 8.2 Farbwahl auf die Veranstaltung wirken lassen, mit Rückfrage nach dem Geltungsbereich beim Verlassen und dem Palettenwert „keine Farbe"; Tests `describe('Farbwahl je Termin', …)` für alle drei Szenarien
- [ ] 8.3 Farbautomatik im Ansichts-Blatt abschaltbar machen, ohne eigene Farbwahlen zu verlieren; Test belegt das Fortbestehen einer eigenen Farbe bei abgeschalteter Automatik
- [ ] 8.4 Statusumschalter „fest/vorgemerkt" um eine Erklärung ergänzen, was „vorgemerkt" bewirkt — kein Konflikthinweis

## 9. Abschluss

- [ ] 9.1 Prüfprotokoll auf dem Gerät anlegen (Datum, Gerät, Beobachtungen): Lesbarkeit der Zeitachse mit Stauchung und Bruchzeichen, Bedienbarkeit des Stapels, Kontrast der Stundenlinien in hellem und dunklem Erscheinungsbild
- [ ] 9.2 Prüfen, ob zusätzlich zur Kappung auf drei eine Mindestbreite je Kachel nötig ist (offene Frage aus `design.md`), Ergebnis im Prüfprotokoll festhalten
- [ ] 9.3 `node tools/spec-check/src/cli.js` läuft ohne Befund
- [ ] 9.4 `openspec validate stundenplan-wochenansicht-nutzerfuehrung --strict` läuft ohne Befund
- [ ] 9.5 Vollständige Testsuite der App grün
