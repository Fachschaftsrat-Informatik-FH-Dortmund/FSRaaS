# Aufgaben

## 1. Datenmodell und Überführung

- [ ] 1.1 `deaktiviertBis: null | 'dauerhaft' | number` in `PlanEntryBase` aufnehmen, `status` und `PlanEntryStatus` aus `typen.ts` entfernen (`design.md`, Entscheidung 1); der TypeScript-Lauf weist jede verbliebene Verwendung aus
- [ ] 1.2 `istAktiv(eintrag, jetztSek)` in `time.ts` anlegen (`design.md`, Entscheidung 3); Test `describe('Wirkung eines deaktivierten Termins', …)` deckt die drei Ausprägungen des Feldes ab
- [ ] 1.3 Überführung in `planStore.bereinige()`: `'vorgemerkt'` → `'dauerhaft'`, `'fest'` → `null`, fehlendes Feld → `null`; Vorfall protokollieren, nicht als verworfen zählen. Tests `describe('Überführung des Terminstatus in den Deaktiviert-Zustand', …)` für alle drei Szenarien, mit einem gespeicherten Stand alter Gestalt
- [ ] 1.4 `statusUmschalten` durch `deaktivierungSetzen(id, deaktiviertBis)` ersetzen; Test `describe('Deaktivieren eines Termins', …)` für alle drei Szenarien, einschließlich der verlustfreien Rücknahme
- [ ] 1.5 Zeitpunkt für „nur dieses Vorkommen" nach der Alt-App-Regel berechnen — Endzeit am betreffenden Wochentag, bei bereits verstrichenem Zeitpunkt eine Woche weiter (`design.md`, Entscheidung 4); Test `describe('Selbsttätiges Ende einer einmaligen Deaktivierung', …)` belegt das selbsttätige Wiederaufleben ohne Nutzeraktion

## 2. Wirkung des Deaktivierens in den Auswertungen

- [ ] 2.1 `konflikt.ermittleKonflikte` von `status === 'fest'` auf `istAktiv` umstellen; Tests `describe('Konflikthinweis bei überschneidenden Terminen', …)` für alle drei Szenarien, darunter „Einer der Termine ist deaktiviert"
- [ ] 2.2 Konfliktstufe `vorgemerkterKonflikt` aus `konflikt.ts` und der Zeilenkennzeichnung entfernen (`design.md`, Entscheidung 5); Tests `describe('Konfliktprüfung paralleler Termine', …)` auf die drei MODIFIED-Szenarien umstellen
- [ ] 2.3 `jetzt.ts` übergeht deaktivierte Termine als laufenden und als nächsten Termin; Test zum Szenario „Deaktivierter Termin in Auswertungen"
- [ ] 2.4 `wochenansicht.ts` behält deaktivierte Termine in der Liste und reicht ihren Zustand an die Darstellung durch — kein Herausfiltern (`design.md`, Entscheidung 3); Test belegt, dass ein deaktivierter Termin weiterhin an seinem Platz erscheint

## 3. Wegfall der Vormerkung in der Oberfläche

- [ ] 3.1 `planungsstand.bestimmeStatus` und `festeSchluesselJeArt` samt `alsFestBestimmen` aus `PlanungScreen.tsx` entfernen; Tests `describe('Mehrere Gruppen-Slots übernehmen', …)` auf die drei MODIFIED-Szenarien umstellen, darunter „Kein Vorrang zu bestimmen"
- [ ] 3.2 Kennzeichnungen `kennzeichenVorgemerkt`, `planungAlsFestFestlegen` und `planungZeileVorgemerkterKonflikt` samt ihren Übersetzungen entfernen; die Testsuite läuft ohne Verweis auf „vorgemerkt"
- [ ] 3.3 Statusumschalter im `TerminDetailScreen` durch den Deaktivieren-Bedienweg mit den zwei Reichweiten ersetzen; Test belegt beide Einträge und die Rücknahme
- [ ] 3.4 Deaktivierten Termin in der Wochenansicht zurückgenommen und zusätzlich zur Farbe über Text oder Symbol kennzeichnen; Test zum Szenario „Deaktivierter Termin in der Wochenansicht"
- [ ] 3.5 Test zum Szenario „Deaktivierter Termin im Planungsmodus" belegt, dass der Planungsmodus ihn als hinzugefügt führt und den Zustand nicht anzeigt

## 4. Verwerfen der Auswahl

- [ ] 4.1 `planungAktion.ts` um `verwerfen` erweitern und `PlanungSpeichernZugang` beide Symbole zeigen lassen (`design.md`, Entscheidung 7); Tests `describe('Verwerfen der Auswahl im Planungsmodus', …)` für alle drei Szenarien, einschließlich des unberührten gesicherten Plans
- [ ] 4.2 Zweites Register derselben Bauart für die Modulauswahl und Kopfzeilen-Bedienweg in `_layout.tsx`; Tests `describe('Verwerfen der Modulauswahl', …)` für beide Szenarien, einschließlich der Rückfrage bei vorhandenen Planeinträgen

## 5. Planungsmodus: Zeile und Leisten

- [ ] 5.1 Lehrende Person in die Terminzeile aufnehmen; Tests `describe('Lehrende Person in der Terminzeile des Planungsmodus', …)` für beide Szenarien, einschließlich des Auslassens ohne Platzhalter
- [ ] 5.2 Eigene Gruppe farblich hervorheben, Textkennzeichnung beibehalten; Tests `describe('Hervorhebung der eigenen Gruppe im Planungsmodus', …)` auf die zwei MODIFIED-Szenarien umstellen
- [ ] 5.3 Gewählten Termin durch farbige Umrandung der Zeile kennzeichnen, Symbol beibehalten; Tests `describe('Kennzeichnung gewählter Termine im Planungsmodus', …)` für beide Szenarien
- [ ] 5.4 Abgeleitete Angaben als abgesetzte dritte Zeile mit vorangestelltem Symbol führen (`design.md`, Entscheidung 11); Tests `describe('Unterscheidung abgeleiteter Angaben von Quelldaten', …)` für beide Szenarien, das zweite über Planungsmodus und Wochenansicht hinweg
- [ ] 5.5 Gemeinsame `WochentagsLeiste` für beide Bildschirme, volle Breite ohne waagerechtes Blättern (`design.md`, Entscheidung 8); Tests `describe('Wochentagsleiste über die volle Bildschirmbreite', …)` für fünf Tage und für den zusätzlichen Wochenendtag
- [ ] 5.6 Wochenansichts-Leiste auf Wochentag und Datum beschränken; Tests `describe('Wochentagsleiste mit bedarfsweisem Samstag', …)` auf die drei MODIFIED-Szenarien umstellen, `belegungsvorschauJeTag` aus `wochentage.ts` entfernen
- [ ] 5.7 Leiste der Ausstehenden auf feste Höhe bringen, Konflikthinweis als Symbol mit erhaltenem `accessibilityLabel`, „+" als fester erster Eintrag links (`design.md`, Entscheidung 9); Tests `describe('Leiste der ausstehenden Veranstaltungen', …)` für alle fünf Szenarien
- [ ] 5.8 Sprung aus der Leiste: kurzzeitige Hervorhebung mit Rücksetzen und Scrollen zum Ziel, reduzierte Bewegung respektieren (`design.md`, Entscheidung 10); Test zum Szenario „Hervorhebung nach dem Sprung"

## 6. Wege und Übergänge

- [ ] 6.1 Verweis „Zur Modulauswahl" aus `PlanungScreen.tsx` entfernen; Test belegt, dass die Modulauswahl weiterhin über den Zurück-Weg der Kopfzeile erreichbar ist
- [ ] 6.2 Nach dem Sichern in die Wochenansicht wechseln, ohne die Rückfrage zu ungesicherten Änderungen auszulösen (`design.md`, Entscheidung 13); Tests `describe('Ausdrückliches Sichern der Planung', …)` auf die drei MODIFIED-Szenarien umstellen
- [ ] 6.3 Einrichtungs-Textlink aus `ScheduleScreen.tsx` entfernen und durch ein Stift-Symbol in der Kopfzeile ersetzen; Tests `describe('Dauerhafter Zugang zur Einrichtung', …)` für beide Szenarien, einschließlich der Sichtbarkeit beim Blättern
- [ ] 6.4 Eigenen Termin aus dem Planungsmodus stets wöchentlich und auf dem sichtbaren Wochentag anlegen, beide Bedienelemente dort nicht anbieten (`design.md`, Entscheidung 12); Tests `describe('Wiederkehrend oder einmalig bei eigenen Terminen', …)` auf die drei MODIFIED-Szenarien umstellen
- [ ] 6.5 Knopf „Termin anlegen" unter der Leiste entfernen, nachdem 5.7 das „+" gesetzt hat; Test belegt, dass genau ein Bedienweg zum Anlegen besteht

## 7. Deckungsgleiche Rohtermine

- [ ] 7.1 Zusammenfassen in `kursbaum.baueModulliste` über `terminSchluessel`, mit Protokollierung (`design.md`, Entscheidung 6); Tests `describe('Zusammenfassen deckungsgleicher Rohtermine', …)` für beide Szenarien, darunter der getrennt bleibende Fall mit abweichendem Raum
- [ ] 7.2 Regressionstest mit dem belegten Datensatz `44232|Ü|Tue|720|765|C.E.32|A-P`: der Planungsmodus rendert ihn einmal, ohne doppelten React-Key
- [ ] 7.3 Vertragstest `fbwsClient.contract.test.ts` prüfen und, falls er strukturelle Eindeutigkeit annimmt, auf den belegten Befund anpassen — er muss bei struktureller Abweichung sichtbar fehlschlagen

## 8. Fortgeschriebene Abschnitte der Haupt-Spec

- [ ] 8.1 `Datenmodell`: `status: fest | vorgemerkt` durch `deaktiviertBis` ersetzen
- [ ] 8.2 `Erläuterungen`: Abschnitt „„fest" und „vorgemerkt"" durch die Begründung des Deaktivierens ersetzen — welcher Bedarf bleibt, welcher Bedienaufwand entfällt, warum zwei Reichweiten
- [ ] 8.3 `Nutzenversprechen` und `User Stories`: die Nennung von „fest"/„vorgemerkt" auf das Deaktivieren umstellen
- [ ] 8.4 Fehlerfall-Tabelle: Zeile „Fester und vorgemerkter Termin überschneiden sich" durch „Aktiver und deaktivierter Termin überschneiden sich" ersetzen; Zeile für deckungsgleiche Rohtermine aufnehmen
- [ ] 8.5 `Prüfvorgaben`: die Zeile zum Status „vorgemerkt" auf den deaktivierten Zustand umstellen
- [ ] 8.6 Erläuterung zu `courseId 411031` um den Befund deckungsgleicher Rohtermine ergänzen — sie grenzen sich über `roomId` ab

## 9. Abschluss

- [ ] 9.1 Prüfprotokoll auf dem Gerät anlegen (Datum, Gerät, Beobachtungen): Höhe und Lesbarkeit beider Wochentagsleisten bei fünf und bei sieben Tagen, ruhige Leistenhöhe beim Tagwechsel, Bedienbarkeit des Sprungs mit Hervorhebung
- [ ] 9.2 Die zwei Gestaltungsfragen aus `design.md` am Gerät entscheiden und im Prüfprotokoll festhalten: Ausgrauen eines deaktivierten Termins ohne Verletzung des Mindestkontrasts; Symbol und Form der abgesetzten Zeile für abgeleitete Angaben, auch in der Wochenansicht
- [ ] 9.3 Prüfprotokoll um den Fall eines Geräts mit vorgemerkten Terminen ergänzen: nach der Aktualisierung erscheinen sie ausgegraut, die Rücknahme wirkt sofort
- [ ] 9.4 `node tools/spec-check/src/cli.js` läuft ohne Befund
- [ ] 9.5 `openspec validate stundenplan-bedienung-ohne-vormerkung --strict` meldet keinen Fehler
- [ ] 9.6 Vollständige Testsuite der App grün
- [ ] 9.7 Diesen Change **vor** `stundenplan-wochenansicht-nutzerfuehrung` archivieren und jenen anschließend per `/opsx:update` um die drei in `proposal.md` tabellierten Punkte bereinigen — sonst entstehen widersprüchliche Deltas zu denselben Requirements
