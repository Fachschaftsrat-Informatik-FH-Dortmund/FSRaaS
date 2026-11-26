## 1. Gemeinsame Primitive

- [x] 1.1 `app/src/ui/ConfirmDialog.tsx` anlegen (design.md, Entscheidungen 1–5): `Modal` mit Hintergrund, der Berührungen abfängt, aber nicht schließt; Frage, optionaler Titel, Aktionen als `AppButton` untereinander; `onRequestClose` → `onDismiss`; Vorlesefokus auf die Frage nach `onShow`; `animationType` `none` bei „Bewegung reduzieren". Keine Zeichenkette in der Primitive. Verifikation: `ConfirmDialog.test.tsx` mit `describe('Bestätigungsdialoge als Pop-up', …)` deckt alle drei Szenarien ab (Pop-up bei zerstörender und nicht zerstörender Rückfrage, Hintergrund löst nichts aus, Zurück ruft `onDismiss`) und läuft grün.

## 2. Stundenplan umstellen

- [x] 2.1 `TerminDetailScreen.tsx`: Rückfrage nach dem Geltungsbereich der Farbwahl auf `ConfirmDialog` umstellen; Abbruch bleibt auf dem Bildschirm. Verifikation: Test findet die Frage `schedule.farbeGeltungFrage` in einem `Modal`, bestehende Tests zur Farbwahl laufen grün.
- [x] 2.2 `TerminDetailScreen.tsx`: Löschen eines eigenen Termins auf `ConfirmDialog` umstellen; der Löschknopf bleibt im Inhalt stehen, die Frage erscheint darüber. Verifikation: Test findet `schedule.terminLoeschenFrage` im `Modal`, bestehende Löschtests laufen grün.
- [x] 2.3 `PlanungScreen.tsx`: `VerwerfenBestaetigung` und `VerlassenBestaetigung` auf `ConfirmDialog` umstellen — minimal, ohne die übrige Planungsansicht anzufassen (parallel laufender Change `planungsmodus-anzeige`). Verifikation: bestehende Tests zu „Rückfrage beim Verlassen mit ungesicherten Änderungen" und zum Verwerfen laufen grün und finden die Fragen im `Modal`.
- [x] 2.4 `CourseSelectionScreen.tsx`: Abwahl eines Moduls mit Planeinträgen (aus der Modulzeile heraus) sowie beide Stufen beim Verwerfen der Modulauswahl auf `ConfirmDialog` umstellen; Abbruch nach design.md Entscheidung 3. Verifikation: bestehende Tests zur Abwahl und zum Verwerfen laufen grün, ein Test belegt, dass Zurück bei der Abwahl das Modul angekreuzt lässt.

## 3. Mensa umstellen

- [x] 3.1 `SortierGruppierScreen.tsx`: Löschen einer gespeicherten Kombination von `Alert.alert` auf `ConfirmDialog` umstellen. Verifikation: Test belegt, dass Löschen erst nach Bestätigung im `Modal` wirkt.
- [x] 3.2 `CanteenScreen.tsx`: Rückfrage bei fehlender Zustimmung von `Alert.alert` auf `ConfirmDialog` umstellen. Verifikation: bestehende Mensa-Tests laufen grün; Grep nach `Alert.alert(` mit Aktionsliste in `app/src` liefert keinen Treffer mehr. Erledigt 2026-11-26: verbleibende `Alert.alert`-Aufrufe sind reine Mitteilungen ohne Entscheidung (Verwaltungsbereich, Hinweis „Benachrichtigungen aus" in der Mensa) und fallen nicht unter die Anforderung.

## 4. Abschluss

- [x] 4.1 Gesamtprüfung: `npx jest`, `npx tsc --noEmit` (nach Contract-Codegen), `npm run lint`, `node tools/spec-check/src/cli.js` und der i18n-Paritätstest laufen grün.
- [ ] 4.2 Sichtprüfung am Gerät (Android, hell/dunkel, Vorleser an) für mindestens die Farbwahl-Rückfrage und das Verlassen der Planung; Prüfprotokoll unter `specs/pruefprotokolle/` ablegen. Verifikation: datiertes Prüfprotokoll liegt vor.
- [ ] 4.3 Change archivieren (`openspec archive bestaetigung-als-popup`), sobald 4.2 vorliegt. Verifikation: das Requirement steht in `openspec/specs/ux-and-theming/spec.md`.
