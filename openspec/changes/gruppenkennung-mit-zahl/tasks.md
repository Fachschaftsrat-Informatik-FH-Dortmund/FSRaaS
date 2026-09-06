# Aufgaben

## 1. Geänderte Requirements

- [x] 1.1 „Gruppenkennungs-Eingabeformat" → `^[A-Z][0-9]+$`, Zahl wieder verpflichtend; Scenario „Eingabe ohne Zahl" wird zum Zurückweisungsfall
- [x] 1.2 „Gruppenkennung ohne Matrikelnummer" → manuelle Angabe verlangt beide Teile, Ermittlung über die Matrikelnummer ist der voreingestellte Weg
- [x] 1.3 „Bereichsangabe im studentSet" → eine unvollständige Kennung gilt als zugehörig und wird protokolliert, statt die fehlende Zahl als `0` zu behandeln

## 2. Fortgeschriebene Abschnitte der Haupt-Spec

- [x] 2.1 `Erläuterungen`, Beispieltabelle Gruppenzuordnung: vier Prüffälle für eine Kennung ohne Zahl gegen Grenzen mit Zahl ergänzt
- [x] 2.2 `Erläuterungen`: die Schlussfolgerung „die Zahl wird so gut wie nie gebraucht" zurückgenommen und am eigenen Befund widerlegt
- [x] 2.3 `Erläuterungen`: der stille Ausschluss durch `Number('') === 0` benannt, samt Grund, warum keine neue Rückfallregel nötig ist
- [x] 2.4 `Fehlerfälle`: Zeile für die unvollständige Gruppenkennung

## 3. Glossar

- [x] 3.1 `specs/product/glossary.md`: Eintrag „Gruppenkennung" auf die Pflichtziffer zurückgeführt; beide Schritte des 2026-09-06 im Eintrag nachvollziehbar

## 4. Umsetzung

- [ ] 4.1 `app/src/areas/schedule/groupMatch.ts`: `MUSTER_GRUPPENKENNUNG` zurück auf `^([A-Za-z])([0-9]+)$` und den Kommentarblock (Zeilen 36–49) berichtigen — er begründet heute die stille `0` mit der widerlegten Annahme
- [ ] 4.2 `app/src/areas/schedule/groupMatch.test.ts`: die vier neuen Fälle der Beispieltabelle als Prüffälle ergänzen (QA-F-030)
- [ ] 4.3 `app/src/areas/schedule/screens/SetupScreen.tsx`: manuelle Angabe verlangt Buchstabe **und** Zahl; Matrikelnummer-Weg vorauswählen (ist bereits die Vorauswahl, `modus`-Startwert)
- [ ] 4.4 Bei der Umsetzung prüfen, ob INT-019 je eine Kennung ohne Zahl liefert — belegt ist nur `O7`

## Beim Archivieren

Die Haupt-Specs sind bereits im selben Merge fortgeschrieben (Vorgehen wie bei `canteen-durchsprache-inhalt`). Ein `openspec archive` würde die Requirements deshalb ein zweites Mal einzufügen versuchen und abbrechen — archivieren mit `openspec archive gruppenkennung-mit-zahl --skip-specs`.
