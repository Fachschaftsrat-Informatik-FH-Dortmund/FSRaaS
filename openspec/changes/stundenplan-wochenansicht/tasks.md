# Aufgaben: Wochenansicht des Stundenplans

Fünf Blöcke, jeder einzeln abschließbar und einzeln unterbrechbar. Blöcke 1 und 2 sind reine Logik ohne Darstellung; ab Block 3 wird sichtbar gearbeitet. Testnamen tragen den Requirement-Titel aus `openspec/specs/schedule/spec.md` im `describe`.

## 1. Konfliktmodell

- [ ] 1.1 `akzeptierterKonflikt: boolean` in `app/src/areas/schedule/typen.ts` durch eine Menge von Gegenpart-Kennungen ersetzen (design.md, Entscheidung 2). Verifikation: `npx tsc --noEmit` läuft ohne Fehler, alle Aufrufstellen sind angepasst.
- [ ] 1.2 `planStore.ts`: Schemaprüfung auf das neue Feld umstellen; ein Eintrag mit unlesbarem Feld wird weiterhin einzeln übersprungen statt den Bestand zu verwerfen (DATA-F-020). Verifikation: bestehende `planStore.test.ts`-Fälle grün, ein neuer Fall für ein unlesbares Konfliktfeld.
- [ ] 1.3 `planStore.ts`: Beim Löschen eines Termins die Nennungen auf ihn aus den übrigen Einträgen entfernen. Verifikation: Test, der nach dem Löschen prüft, dass kein Eintrag mehr auf die entfernte Kennung zeigt.
- [ ] 1.4 Neues Modul `konflikt.ts` als reine Funktion: ermittelt zu den Terminen eines Tages die kollidierenden Paare und trennt angenommene von offenen. Ein Paar gilt nur als angenommen, wenn beide Termine einander nennen. Verifikation: `konflikt.test.ts` mit `describe('Konflikthinweis bei festen Terminen', …)` — zwei feste Termine kollidieren, angenommenes Paar, ersetzter Gegenpart, dritter Termin zusätzlich.
- [ ] 1.5 `konflikt.ts`: vorgemerkte Termine erzeugen keinen Hinweis, weder untereinander noch gegen feste. Verifikation: `describe('Kein Konflikthinweis bei vorgemerkten Terminen', …)`.
- [ ] 1.6 Annahme eines Konflikts als Schreibvorgang in `planStore.ts`, der beide Seiten des Paars setzt; bei mehreren Kollisionen je Paar einzeln. Verifikation: `describe('Bewusste Übernahme trotz Konflikt', …)` mit dem Fall zweier gleichzeitiger Kollisionen.

## 2. Ansichtszustand

- [ ] 2.1 `ansichtEinstellungen.ts` um das Feld für „alle Filter abschalten" erweitern, als Überlagerung ohne Änderung der drei bestehenden Flags (design.md, Entscheidung 3). Verifikation: `describe('Schalter zum Abschalten aller Filter', …)` — Schalter setzen, zurücknehmen, die zuvor gesetzten Filter wirken unverändert weiter.
- [ ] 2.2 `ansichtEinstellungen.ts` um den zuletzt betrachteten Stand (Woche und Wochentag) erweitern. Verifikation: `describe('Sprung zum aktuellen Wochentag', …)` — aktivierte Einstellung, abgeschaltete Einstellung mit vorherigem Stand, abgeschaltete Einstellung ohne vorherigen Stand.
- [ ] 2.3 Reine Funktion, die aus den Terminen einer Woche die Spanne der Zeitachse ermittelt (frühester Beginn, spätestes Ende, auf volle Stunden nach außen gerundet, design.md Entscheidung 1). Verifikation: Test mit Randzeiten und mit einer Woche ohne Termine.

## 3. Wochenansicht

- [ ] 3.1 `ScheduleScreen.tsx` ersetzt `<ComingSoon />` durch die Wochenansicht und bezieht Lade-, Leer-, Fehler- und Offline-Zustand über `AsyncStates` (design.md, Entscheidung 6). Verifikation: Rendertest je Zustand; die beiden Leerzustände (kein Studiengang gewählt / Filter wirkt) sind unterscheidbar, `describe('Leerer Tag bei wirksamem Filter', …)`.
- [ ] 3.2 Wochentagsleiste über `wochentage.ts` — Samstag nur bei Bedarf, Belegungsvorschau je Tag, Kalenderdatum je Wochentag. Verifikation: je ein `describe` für „Wochentagsleiste mit bedarfsweisem Samstag", „Belegungsvorschau je Tag" und „Kalenderdatum je Wochentag".
- [ ] 3.3 Blättern über Wochengrenzen, Anzeige nur im Gültigkeitszeitraum und Kennzeichnung vorlesungsfreier Wochen über `wochenrechnung.ts`, samt Rückweg zur laufenden Woche. Verifikation: je ein `describe` für die drei Requirement-Titel.
- [ ] 3.4 Tagesdarstellung über `dayLayout.ts`: proportionale Zeitachse mit Lücken samt Dauer, Nebeneinanderdarstellung überschneidender Termine, Umschalten auf die kompakte Liste ohne Lücken. Verifikation: `describe('Proportionale Zeitachse', …)`, `describe('Abschalten der proportionalen Zeitachse', …)`, `describe('Nebeneinanderdarstellung überschneidender Termine', …)`.
- [ ] 3.5 Laufender und nächster Termin über `jetzt.ts`, Hervorhebung des laufenden Termins und der aktuellen Uhrzeit. Verifikation: `describe('Anzeige des laufenden und nächsten Termins', …)` und `describe('Hervorhebung des laufenden Termins und der aktuellen Uhrzeit', …)` mit festgehaltener Uhrzeit.
- [ ] 3.6 Fünf-Tage-Ansicht, Sortierung nach Beginnzeit, Kennzeichnung gruppenfremder Termine und der Schalter zum Ausblenden. Verifikation: je ein `describe` für die vier Requirement-Titel.
- [ ] 3.7 Konflikthinweis und Kennzeichnung „angenommener Konflikt" am Termin darstellen, Unterscheidung fester und vorgemerkter Termine. Verifikation: `describe('Unterscheidung vorgemerkter Termine', …)` und ein Rendertest, der Hinweis und Kennzeichnung auseinanderhält.
- [ ] 3.8 Hinweis bei Semesterwechsel über `semesterwechsel.ts` einbinden. Verifikation: `describe('Hinweis bei Semesterwechsel', …)`.
- [ ] 3.9 Schalter „alle Filter abschalten" in der Wochenansicht bedienbar machen, der aktive Zustand ist als solcher erkennbar. Verifikation: Rendertest, der den erkennbaren Zustand und die Rücknahme prüft.

## 4. Termindetails

- [ ] 4.1 Bildschirm für die Termindetails mit allen Angaben des Eintrags. Verifikation: `describe('Anzeige der Termindetails', …)` für einen offiziellen und einen eigenen Termin.
- [ ] 4.2 Farbwahl je Termin über `planStore.ts` und `farbe.ts`, mit ausreichendem Kontrast der Beschriftung. Verifikation: `describe('Farbwahl je Termin', …)`.
- [ ] 4.3 Status „fest" oder „vorgemerkt" umschalten. Verifikation: `describe('Status „fest" oder „vorgemerkt"', …)`.
- [ ] 4.4 Route `(tabs)/(schedule)/detail` als reines Re-Export anlegen (SHELL-F-050) und in den Stack aufnehmen. Verifikation: Navigationstest von der Wochenansicht zu den Details und zurück.

## 5. Eigene Termine

- [ ] 5.1 Editor-Bildschirm für eigene Termine, für Anlegen und Bearbeiten derselbe (design.md, Entscheidung 5), mit Zusatzangaben und Validierung vor dem Schreiben. Verifikation: `describe('Anlegen eigener Termine', …)` und `describe('Zusatzangaben beim Anlegen eigener Termine', …)`.
- [ ] 5.2 Wiederkehrend oder einmalig, mit den entsprechenden Gültigkeitsgrenzen. Verifikation: `describe('Wiederkehrend oder einmalig bei eigenen Terminen', …)`.
- [ ] 5.3 Eigene Termine sind in der Wochenansicht als solche gekennzeichnet. Verifikation: `describe('Kennzeichnung eigener Termine', …)`.
- [ ] 5.4 Bearbeiten und Löschen über einen sichtbaren Weg, Löschen mit Rückfrage. Verifikation: `describe('Bearbeiten und Löschen eigener Termine über sichtbaren Weg', …)`.
- [ ] 5.5 Eigenen Termin als Prüfung kennzeichnen und in der Wochenansicht visuell hervorheben. Verifikation: `describe('Eigenen Termin als Prüfung kennzeichnen', …)` und `describe('Visuelle Kennzeichnung von Prüfungsterminen', …)`.
- [ ] 5.6 Route `(tabs)/(schedule)/termin` als reines Re-Export anlegen und in den Stack aufnehmen. Verifikation: Navigationstest vom Editor zurück auf die Wochenansicht.

## 6. Abschluss

- [ ] 6.1 Alle neuen Zeichenketten in `app/src/i18n/` auf Deutsch und Englisch, keine im Code (NFR-F-115). Verifikation: der bestehende Paritätstest der Sprachdateien bleibt grün.
- [ ] 6.2 Barrierefreiheit der Wochenansicht: Mindestkontrast 4,5:1, Bedienelemente ab 44×44 dp, keine Bedeutung allein über Farbe, keine Aktion allein über eine Geste. Verifikation: datiertes Prüfprotokoll unter `specs/pruefprotokolle/`, wie es die Capability `quality-and-testing` für Gestaltung zulässt.
- [ ] 6.3 Vollständiger Durchlauf: `npx tsc --noEmit`, `npm run lint`, Jest, `node tools/spec-check/src/cli.js`. Verifikation: alle vier grün, keine neue Ausnahme in der Audit-Allowlist.
