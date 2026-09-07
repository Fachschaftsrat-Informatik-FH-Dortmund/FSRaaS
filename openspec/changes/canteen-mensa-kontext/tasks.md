# Tasks — Mensa-Kontext in der Gerichtsliste

Reihenfolge: reine Logik zuerst, dann die Anzeigestruktur, dann der Bildschirm,
dann die Beschriftungen. Jeder Block ist für sich abschließbar und hinterlässt
grüne Tests.

## 1. Öffnungszeiten als reine Logik

- [ ] 1.1 `app/src/areas/canteen/oeffnungszeiten.ts` anlegen: `oeffnungszeitFuer(mensa, datum)` aus `CanteenScreen.tsx` hierher verschieben, Index auf `(wochentag + 6) % 7` umstellen und die Vorbedingung `length < 5` durch eine reine Indexprüfung ersetzen (design.md D8). Verifikation: neue `oeffnungszeiten.test.ts` deckt fünf- und siebenstellige Listen, `null`-Einträge und Samstag/Sonntag ab; `npm test` im Ordner `app/` grün.
- [ ] 1.2 `naechsterOeffnungstag(mensa, datum)` in derselben Datei ergänzen: sucht ab dem Folgetag über höchstens sieben Tage den ersten Wochentag mit hinterlegter Öffnungszeit und liefert dessen Wochentag oder `null` (design.md D1). Verifikation: `describe('Wiedereröffnungshinweis an der geschlossenen Mensa', …)` in `oeffnungszeiten.test.ts` prüft beide Scenarios des Requirements, einschließlich „keine Öffnungszeit in den folgenden sieben Tagen".
- [ ] 1.3 `CanteenScreen.tsx` auf die ausgelagerte Funktion umstellen, die lokale Kopie entfernen. Verifikation: `npm run typecheck` und `npm test` grün, `CanteenScreen.test.tsx` unverändert bestanden.

## 2. Abschnitte für geschlossene Mensen

- [ ] 2.1 `Abschnitt` in `sortierung.ts` um `zustand: 'gerichte' | 'geschlossen'` erweitern und in allen drei Zweigen von `wendeAn` setzen (design.md D2). Verifikation: `npm run typecheck` grün; bestehende Fälle in `sortierung.test.ts` laufen unverändert.
- [ ] 2.2 `wendeAn` erzeugt bei Gruppierung „nach Mensa" je Kennung aus `konsolidierung.geschlossene` einen Abschnitt mit leerer Gerichtsliste und `zustand: 'geschlossen'`; bei „keine" und „nach Kategorie" nicht. Verifikation: `describe('Gliederung nach Mensa-Auswahlreihenfolge bei aktiver Mensa-Gruppierung', …)` in `sortierung.test.ts` prüft beide Scenarios, darunter „Gewählte Mensa ohne Angebot".
- [ ] 2.3 Die geschlossenen Abschnitte durchlaufen die Gruppenordnung wie die übrigen — Prüfung für beide Kriterien (eingestellte Mensa-Reihenfolge, alphabetisch) und beide Richtungen. Verifikation: Fälle in `sortierung.test.ts`, die eine geschlossene Mensa zwischen zwei offenen an der erwarteten Position erwarten.

## 3. Gerichtsliste im Bildschirm

- [ ] 3.1 In `CanteenScreen.tsx` die Filterauswertung je Abschnitt nach der Tabelle in design.md D3 umbauen: leerer `gerichte`-Abschnitt wird bei Mensa-Gruppierung zum Filter-Hinweis-Abschnitt, sonst entfernt; `geschlossen`-Abschnitte bleiben immer erhalten. Verifikation: `describe('Hinweis bei vollständig gefilterter Mensa', …)` in `CanteenScreen.test.tsx`.
- [ ] 3.2 Geschlossene Abschnitte rendern: Überschrift mit Mensa-Namen, darunter eine gedämpfte Zeile aus Geschlossen- und Wiedereröffnungshinweis; keine Öffnungszeit-Angabe an der Überschrift. Verifikation: `describe('Geschlossen-Hinweis für Mensa ohne Angebot', …)` und `describe('Keine Öffnungszeit für Mensa ohne Angebot', …)` in `CanteenScreen.test.tsx` prüfen beide Gruppierungsfälle.
- [ ] 3.3 Fußbereich anpassen: Öffnungszeit-Zeilen und Geschlossen-Zeilen erscheinen dort nur noch, wenn die Gruppierung nicht „nach Mensa" ist; Filter-Zähler und „Alle Mensen anzeigen" bleiben unverändert. Verifikation: Scenario „Gewählte Mensa ohne Tagesangebot" und Scenario „Ohne Mensa-Gruppierung" in `CanteenScreen.test.tsx`.
- [ ] 3.4 Abschnittskopfzeile nach design.md D5 bauen: Name plus Öffnungszeit-Angabe in einer umbrechenden Zeile, Textfarbe `colors.text` auf `colors.surface`, kein Symbol. Bei Mensa-Gruppierung wird die Überschrift immer gezeigt, auch bei einem einzigen Abschnitt (D6). Verifikation: `describe('Öffnungszeit an der Mensa-Abschnittsüberschrift', …)` in `CanteenScreen.test.tsx` prüft alle drei Scenarios.
- [ ] 3.5 Chips: bei Mensa-Gruppierung ist jeder Chip einer gewählten Mensa auswählbar, weil jede einen Abschnitt hat; die Sonderbehandlung der geschlossenen Mensen in der Chip-Bildung entfällt. Verifikation: `describe('Nicht auswählbare Chips ohne sichtbaren Abschnitt', …)` in `CanteenScreen.test.tsx` prüft beide Scenarios.
- [ ] 3.6 Gericht-Karte: ohne Mensa-Gruppierung die anbietende(n) Mensa/Mensen nennen, bei genau einer gewählten Mensa gar nicht. Verifikation: `describe('Ausweis der anbietenden Mensa ohne Mensa-Gliederung', …)` in `CanteenScreen.test.tsx` prüft alle drei Scenarios; der bestehende Fall zu „Ausweis mehrerer anbietender Mensen je Gericht" bleibt grün.
- [ ] 3.7 Prüfen, dass der Leerzustand „Heute kein Angebot" weiterhin greift, wenn keine gewählte Mensa ein Angebot führt, statt einer Liste aus lauter Geschlossen-Abschnitten (design.md D4). Verifikation: bestehender Leerzustand-Fall in `CanteenScreen.test.tsx` bzw. `CanteenScreen.wochenende.test.tsx` grün, ergänzt um den Fall „mehrere gewählte Mensen, alle geschlossen".

## 4. Beschriftungen

- [ ] 4.1 i18n nach design.md D7 umstellen: `mensa.sortierkriterium.quelle` neu formulieren, `mensa.gruppenkriterium.reihenfolge` durch `reihenfolgeMensa` und `reihenfolgeKategorie` ersetzen — in `de.json` und `en.json`. Verifikation: `npm run lint` grün und keine Fundstelle mehr für `gruppenkriterium.reihenfolge` außerhalb der neuen Schlüssel.
- [ ] 4.2 `SortierGruppierScreen.tsx` wählt den Schlüssel für das Reihenfolge-Kriterium nach der aktiven Gruppierung; die gespeicherten Werte `'quelle'` und `'reihenfolge'` bleiben unverändert. Verifikation: `describe('Beschriftung des Reihenfolge-Kriteriums nach seiner Bedeutung', …)` in `SortierGruppierScreen.test.tsx` prüft alle drei Scenarios, darunter das Fehlen der Beschriftung „Reihenfolge der Quelle".
- [ ] 4.3 Tests zu den geänderten Kriterienlisten nachziehen: `describe('Sortierkriterien für Gerichte', …)` und `describe('Gruppenreihenfolge-Kriterien bei Mensa-Gruppierung', …)` in `SortierGruppierScreen.test.tsx` auf die neuen Beschriftungen. Verifikation: beide `describe`-Blöcke grün.
- [ ] 4.4 Bestehende eigene Presets bleiben ohne Migration gültig. Verifikation: Fall in `sortierPreset.test.ts`, der eine gespeicherte Kombination mit `kriterium: 'reihenfolge'` einliest und unverändert auflöst.

## 5. Abschluss

- [ ] 5.1 Prüfprotokoll `specs/pruefprotokolle/2026-09-07-canteen-mensa-kontext.md` anlegen: Kontrast der Öffnungszeit-Angabe gegen `colors.surface` in hellem und dunklem Erscheinungsbild (≥ 4,5:1), Umbruch der Kopfzeile bei langem Mensa-Namen auf schmalem Gerät, Lesbarkeit des Geschlossen-Abschnitts mit Screenreader. Verifikation: Protokoll liegt vor, Geräteschritte als „ausstehend Gerät" oder mit Ergebnis vermerkt.
- [ ] 5.2 `openspec/specs/canteen/spec.md` im selben Merge fortschreiben: Erläuterung „Geschlossene Mensa am Seitenende" auf die von der Gruppierung abhängige Regel umschreiben, „Reihenfolge der Quelle" in der Bausteine-Erläuterung durch die neuen Beschriftungen ersetzen, Umsetzungsstand um diesen Change ergänzen. Verifikation: `npm run check` im Ordner `tools/spec-check/` läuft ohne Befund.
- [ ] 5.3 Gesamtlauf: `npm run typecheck`, `npm run lint` und `npm test` im Ordner `app/` grün; `openspec validate --changes canteen-mensa-kontext` ohne Fehler.
