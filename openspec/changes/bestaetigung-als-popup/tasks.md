## 1. ConfirmDialog-Grundstruktur

- [ ] 1.1 `ConfirmDialog` in `app/src/ui/ConfirmDialog.tsx` anlegen: `Modal` (`transparent`, `animationType`) mit Props `sichtbar`, `text`, `aktionen` (Liste aus `label`, `onPress`, optional `variant`); `onRequestClose` gesetzt, löst nie eine Aktion aus
- [ ] 1.2 Test `app/src/ui/ConfirmDialog.test.tsx` schreiben — `describe('Bestätigungsdialoge als Pop-up', …)` — und verifizieren, dass er grün ist: Pop-up erscheint bei `sichtbar=true`, `onRequestClose` (Android-Zurück, Tippen außerhalb) löst keine übergebene Aktion aus, ein Aufruf ohne Abbruch-Aktion lässt sich nicht folgenlos verlassen
- [ ] 1.3 Zweisprachige Texte (Deutsch/Englisch) für alle in dieser Komponente selbst verwendeten Zeichenketten (falls vorhanden, z. B. Bedienelement-Labels für Barrierefreiheit) über die bestehende i18n-Struktur einbinden und verifizieren, dass keine Zeichenkette fest im Code steht

## 2. Erhebung der verbleibenden Stellen

- [ ] 2.1 Alle Stellen im Bestand erheben, die heute eine Rückfrage vor einer Aktion im Seiteninhalt statt als Pop-up darstellen — Ausgangspunkt: `CourseSelectionScreen.tsx`, `GruppenkennungScreen.tsx`, `PlanungScreen.tsx`, `TerminDetailScreen.tsx`, `TerminEditorScreen.tsx`, `VerwaltungsblattZugang.tsx` sowie die Verwaltungsoberfläche (Web-Export, ADR 0018) — und als Liste mit Datei und Zeile in dieser tasks.md unter Abschnitt 4 ergänzen, bevor Abschnitt 4 begonnen wird

## 3. Auslösender Fund: TerminDetailScreen.tsx

- [ ] 3.1 Löschbestätigung (`loeschenBestaetigen`, Zeile ~82, ~289) von `View` auf `ConfirmDialog` umstellen, mit Abbruch-Aktion; bestehender bzw. ergänzter Test für „Bestätigung vor zerstörender Aktion" (Löschen) grün
- [ ] 3.2 Geltungsbereich-Rückfrage (`pendingAction`, Zeile ~94, ~316) von `View` auf `ConfirmDialog` umstellen, ohne Abbruch-Aktion (Navigation bereits angehalten, Entscheidung erzwungen); Test `describe('Rückfrage ohne zerstörende Wirkung', …)` ergänzen und grün
- [ ] 3.3 Manuell verifizieren (Gerätetest, datiertes Prüfprotokoll), dass der auslösende `AppButton` während offener Rückfrage nicht erneut auslösbar ist — deckt Requirement-Scenario „Auslösender Bedienweg während der Rückfrage"

## 4. Verbleibende Stellen umstellen

- [ ] 4.1 Verwerfen der Planung und Verlassen mit ungesicherten Änderungen in `PlanungScreen.tsx` (Zeile ~450, 472-474) auf `ConfirmDialog` umstellen; zugehöriger Test grün
- [ ] 4.2 Abwahl eines Moduls mit vorhandenen Planeinträgen und Verwerfen der Modulauswahl in `CourseSelectionScreen.tsx` auf `ConfirmDialog` umstellen; zugehöriger Test grün
- [ ] 4.3 Jede weitere in 2.1 erhobene Stelle einzeln auf `ConfirmDialog` umstellen; je Stelle ein eigener, abschließbarer Teilschritt mit grünem Test

## 5. Abschluss

- [ ] 5.1 Repo-weit nach verbliebenen Inline-Rückfragen suchen (Muster wie in 2.1) und verifizieren, dass keine mehr offen ist
- [ ] 5.2 Vollständige Testsuite (`app/`) ausführen und grün verifizieren
