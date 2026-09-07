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

- [x] 4.1 `app/src/areas/schedule/groupMatch.ts`: `MUSTER_GRUPPENKENNUNG` zurück auf `^([A-Za-z])([0-9]+)$`, Kommentarblock berichtigt. Eine Kennung ohne Zahl wird als unvollständig geführt (`zahl: null`) und in `liegtImBereich` behandelt: Buchstabe außerhalb entscheidet weiterhin allein, nur an einer Grenze mit Zahl gilt der Termin als zugehörig und wird protokolliert. Ebenso `einrichtung.ts`: `GRUPPENKENNUNG_MUSTER` auf `^[A-Z][0-9]+$`
- [x] 4.2 `app/src/areas/schedule/groupMatch.test.ts`: die vier neuen Fälle der Beispieltabelle ergänzt (QA-F-030), dazu fünf Tests unter dem Requirement-Titel „Bereichsangabe im studentSet" für Protokollierung und Nichtprotokollierung. `H` gegen `H5-J` war vor der Änderung rot
- [x] 4.3 `app/src/areas/schedule/screens/SetupScreen.tsx`: Eingabe lokal gehalten, gespeichert erst wenn beide Teile vorliegen; Hinweis benennt die fehlende Zahl; ein unvollständiger Altbestand wird zum Nachtragen angeboten statt zurückgesetzt. Matrikelnummer-Weg als Vorauswahl durch einen Test belegt. i18n: `zahlLabel` nicht mehr „(freiwillig)", neuer Schlüssel `gruppenkennungZahlFehlt` in de und en
- [x] 4.4 Gegen `openspec/specs/integrations/spec.md` INT-019 geprüft: drei real beobachtete Kennungen (`O7`, `B3`, `A9`), alle mit Ziffer; eine Kennung ohne Zahl ist nicht belegt, aber mangels Dokumentation und SLA auch nicht ausgeschlossen. Ergebnis im Proposal festgehalten

## Beim Archivieren

Die Haupt-Specs sind bereits im selben Merge fortgeschrieben (Vorgehen wie bei `canteen-durchsprache-inhalt`). Ein `openspec archive` würde die Requirements deshalb ein zweites Mal einzufügen versuchen und abbrechen — archivieren mit `openspec archive gruppenkennung-mit-zahl --skip-specs`.
