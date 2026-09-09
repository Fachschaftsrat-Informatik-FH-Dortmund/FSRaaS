# Aufgaben

## 1. Zeitachse

- [x] 1.1 `zeitachse.ts` auf eine Spanne je Tag umstellen — erster bis letzter Termin des angezeigten Tages, keine Randlücken; Test `describe('Proportionale Zeitachse', …)` mit dem Szenario „Kein Leerraum an den Tagesrändern"
- [x] 1.2 Lückenschwellen in `dayLayout.ts`: unter fünfzehn Minuten ohne Block und ohne Beschriftung, über einer Stunde auf Stundenhöhe gestaucht mit Bruchzeichen und tatsächlicher Dauer; Tests für die Szenarien „Kurze Lücke" und „Lange Lücke"
- [x] 1.3 `dayLayout` liefert Abschnitte mit eigener Höhe statt einer linearen Spanne (`design.md` Entscheidung 1); die Umrechnung auf Pixel bleibt in der Darstellungsschicht, ohne Fachlogik
- [x] 1.4 Stundenlinien ohne Beschriftung zeichnen, in gestauchten Lücken keine; Tests `describe('Stundenlinien auf der Zeitachse', …)` für beide Szenarien
- [x] 1.5 Jetzt-Strich an den Rand heften, wenn die aktuelle Uhrzeit außerhalb der Tagesspanne liegt; Test zum Szenario „Uhrzeit vor dem ersten Termin"

## 2. Stapelung überschneidender Termine

- [ ] 2.1 Spaltenkappung auf drei in `ordneSpaltenZu`, überzählige Termine als Stapel-Slot mit ausgewiesenem Umfang; Tests `describe('Stapelung bei mehr als drei überschneidenden Terminen', …)` für „Vier überschneidende Termine" und „Eigene Termine zuerst" — Kappung und „Vier überschneidende Termine" umgesetzt; „Eigene Termine zuerst" setzt die Herkunftsunterscheidung aus Block 7 voraus (Alternativen existieren noch nicht) und bleibt offen
- [x] 2.2 Test `describe('Nebeneinanderdarstellung überschneidender Termine', …)` auf die zwei MODIFIED-Szenarien umstellen — zwei und drei Termine weiterhin nebeneinander
- [x] 2.3 Aufklappen des Stapels durch Dehnen des Abschnitts umsetzen; Test zum Szenario „Stapel aufklappen" belegt, dass alle enthaltenen Termine einzeln erreichbar sind und nichts verdeckt wird

## 3. Filter zurückbauen

- [x] 3.1 `gruppenfremdeAusblenden` und `alleAnzeigen` aus `ansichtEinstellungen.ts` entfernen, `wirksameFilter` auflösen; `bereinige()` verwirft gespeicherte Altwerte, Test mit einem Stand alter Gestalt
- [x] 3.2 `wochenansicht.ts` auf den unbedingt geltenden Gültigkeitszeitraum zurückführen; `leerGrund` behält zwei Fälle
- [x] 3.3 Tests `describe('Leerer Tag bei wirksamem Filter', …)` auf die zwei MODIFIED-Szenarien umstellen; die Tests zu den entfernten Schaltern entfallen mit den REMOVED-Deltas
- [x] 3.4 `belegungsvorschauJeTag` aus `wochentage.ts` entfernen; Test `describe('Wochentagsleiste mit bedarfsweisem Samstag', …)` belegt, dass der Eintrag nur noch Wochentag und Datum trägt

## 4. Kopfbereich und Navigation

- [x] 4.1 Wochenangabe und Wochentagsleiste feststellen, nur die Achse darunter blättern lassen; Test `describe('Feststehender Kopfbereich der Wochenansicht', …)`
- [x] 4.2 Waagerechtes Wischen für den Tageswechsel über `gesten.ts` aus dem Mensaplan; Test `describe('Tageswechsel durch Wischen', …)` belegt zugleich, dass die Wochentagsleiste als sichtbarer Weg bestehen bleibt — die Anbindung ist geprüft, das eigentliche Wischverhalten am Gerät steht noch im Prüfprotokoll (Aufgabe 9.1), da `PanResponder`s Touch-Nachverfolgung sich nicht verlässlich über `fireEvent` nachstellen lässt
- [x] 4.3 Rückkehr zur laufenden Woche über die Wochenangabe nach dem Mensa-Muster; Tests `describe('Rückkehr zur laufenden Woche über die Wochenangabe', …)` für beide Szenarien, einschließlich der unveränderten Anordnung in der laufenden Woche

## 5. Ansichts- und Verwaltungsblatt

- [ ] 5.1 Kopfzeilen-Element und Blatt mit Zeitachse-Umschalter, Sprung zu heute, Alternativen-Schalter, Farbautomatik und den beiden Löschaktionen; Tests `describe('Ansichts- und Verwaltungsblatt in der Kopfzeile', …)` für beide Szenarien — Blatt, Zeitachse-Umschalter, Sprung zu heute und beide Löschaktionen umgesetzt (`VerwaltungsblattZugang.tsx`); Alternativen-Schalter und Farbautomatik fehlen noch, da sie die Blöcke 7 und 8 voraussetzen. **Bereinigt 2026-09-09:** Der Zugang zur Einrichtung ist entgegen der ursprünglichen Fassung dieser Aufgabe **nicht** Teil dieses Blatts — `stundenplan-bedienung-ohne-vormerkung` beansprucht dafür ein eigenes, dauerhaft sichtbares Kopfzeilen-Symbol (`EinrichtungHeaderZugang`, Requirement „Dauerhafter Zugang zur Einrichtung"). Eine zwischenzeitliche Umsetzung hatte den Zugang wieder ins Blatt gebündelt und die eigenständige Komponente entfernt; das ist bei der Bereinigung beider Changes rückgängig gemacht worden — beide Symbole stehen jetzt nebeneinander in der Kopfzeile (`_layout.tsx`, `WochenansichtKopfzeile`)
- [x] 5.2 `toggleSprungZuHeute` erstmals an einen Bedienweg anbinden — bislang implementiert und tot
- [x] 5.3 Schalterkasten unter dem Plan entfernen

## 6. Löschaktionen

- [x] 6.1 „Stundenplan leeren" an `planStore.clear()` anbinden, mit Bestätigung und Zusatzfrage zu eigenen Terminen (vorbelegt auf nein); Tests `describe('Nutzeraktion „Stundenplan leeren"', …)` für alle drei Szenarien
- [x] 6.2 „Stundenplan zurücksetzen" an `planStore.clear()` und `einrichtung.clear()` anbinden; Tests `describe('Nutzeraktion „Stundenplan zurücksetzen"', …)` für beide Szenarien, einschließlich des Nachweises, dass Ticket, News-Regeln und Mensa-Einstellungen unberührt bleiben
- [x] 6.3 Tests `describe('Kein selbsttätiges Entfernen des Stundenplans', …)` für beide Szenarien — der Semesterwechsel-Hinweis bietet an, entfernt aber nichts; ein entfallener Endpunkt lässt seine Termine stehen

## 7. Alternativen einblenden

- [ ] 7.1 Auswahlbestand in der Wochenansicht verfügbar machen, mit den vier Zuständen Laden, Leer, Fehler und Offline über die bestehende Grundstruktur; ohne Bestand bleibt der Schalter wirkungslos und sagt es, der eigene Plan bleibt offline vollständig
- [ ] 7.2 Alternativen abgesetzt darstellen und über die Stapelung aus Block 2 einordnen; Test `describe('Einblenden aller Veranstaltungen gewählter Module', …)`, Szenario „Alternativen einblenden"
- [ ] 7.3 Blatt mit „anstelle des eigenen Termins" und „zusätzlich zum eigenen Termin"; Test zum Szenario „Alternative übernehmen", damit zugleich die bestehenden Requirements „Einsicht in Termine anderer Gruppen" und „Übernahme des Termins einer anderen Gruppe" erstmals umgesetzt

## 8. Jetzt-Anzeige und Termindetail

- [ ] 8.1 Jetzt-Anzeige zweispaltig, laufende und nächste Veranstaltung nebeneinander; Zeitangaben über `dauerText()` statt in reinen Minuten; Tests `describe('Anzeige des laufenden und nächsten Termins', …)` für beide Szenarien, darunter „in 200 Minuten" als Stunden und Minuten
- [ ] 8.2 Farbwahl auf die Veranstaltung wirken lassen, mit Rückfrage nach dem Geltungsbereich beim Verlassen und dem Palettenwert „keine Farbe"; Tests `describe('Farbwahl je Termin', …)` für alle drei Szenarien
- [ ] 8.3 Farbautomatik im Ansichts-Blatt abschaltbar machen, ohne eigene Farbwahlen zu verlieren; Test belegt das Fortbestehen einer eigenen Farbe bei abgeschalteter Automatik
- [x] 8.4 **Gegenstandslos (bereinigt 2026-09-09):** Der Statusumschalter „fest/vorgemerkt" entfällt ersatzlos mit dem Status selbst — Change `stundenplan-bedienung-ohne-vormerkung`, archiviert 2026-09-09. Keine Erklärung mehr nötig, da es den Umschalter nicht mehr gibt; siehe stattdessen Requirement „Deaktivieren eines Termins" der Capability `schedule`
- [ ] 8.5 Gültigkeitszeitraum im Termindetail änderbar machen — Beginn und Ende einzeln, jeweils auch offen, über die Datumsauswahl aus dem vorangehenden Change; Tests `describe('Gültigkeitszeitraum je Eintrag änderbar', …)` für alle vier Szenarien
- [ ] 8.6 `wiederkehrend` aus dem Zeitraum ableiten statt unabhängig führen (`design.md` Entscheidung 8); Test belegt, dass ein eigener Termin mit Zeitraum über einen einzigen Tag als einmalig gilt und einer über mehrere Tage als wiederkehrend
- [ ] 8.7 Entfernen und Löschen im Termindetail trennen: offizieller Termin ohne zerstörende Gestaltung und ohne Bestätigung, eigener Termin zerstörend mit Bestätigung; Tests `describe('Unterscheidung von Entfernen und Löschen im Termindetail', …)` für alle drei Szenarien, einschließlich der Auffindbarkeit im Planungsmodus nach dem Entfernen

## 9. Abschluss

- [ ] 9.1 Prüfprotokoll auf dem Gerät anlegen (Datum, Gerät, Beobachtungen): Lesbarkeit der Zeitachse mit Stauchung und Bruchzeichen, Bedienbarkeit des Stapels, Kontrast der Stundenlinien in hellem und dunklem Erscheinungsbild
- [ ] 9.2 Die drei Gestaltungsfragen aus `design.md` am Gerät entscheiden und im Prüfprotokoll festhalten: Mindestbreite je Kachel zusätzlich zur Kappung auf drei; Gestalt eines Termins bei abgeschalteter Farbautomatik; ob die zwölf Farbkreise im Termindetail dauerhaft sichtbar bleiben
- [x] 9.3 `node tools/spec-check/src/cli.js` läuft ohne Befund
- [ ] 9.4 `openspec validate stundenplan-wochenansicht-nutzerfuehrung --strict` läuft ohne Befund — meldet ausschließlich die bekannte Falschmeldung „should contain SHALL or MUST" auf deutschsprachige `muss`-Formulierungen (`spec-check-werkzeug`-Grenze), keine inhaltlichen Befunde; ohne `--strict` bestehen die Spec-Dateien
- [x] 9.5 Vollständige Testsuite der App grün (90 Suiten, 1181 Tests)
