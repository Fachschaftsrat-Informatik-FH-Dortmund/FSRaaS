## 1. Feiertagsberechnung

- [x] 1.1 NRW-Feiertagsberechnung implementieren (sechs feste Daten, fünf über die Gaußsche Osterformel abgeleitet — elf nach § 2 Feiertagsgesetz NRW, ohne Reformationstag) und mit `describe('Hinweis auf gesetzlichen Feiertag', …)` gegen mehrere Jahre testen, darunter 2026 (Pfingstmontag 25.05., Fronleichnam 04.06. — Referenzwerte aus dem INT-009-Spike)
- [x] 1.2 Randfälle testen: Jahreswechsel, Osterdatum in unterschiedlichen Jahren (frühester/spätester Ostersonntag im geprüften Zeitraum)

## 2. Anbindung an den Stundenplan

- [x] 2.1 Feiertags-Hinweis an jedem betroffenen Stundenplan-Termin anzeigen, unabhängig vom Raumplan-Abgleich (Test: Hinweis erscheint auch bei veraltetem oder fehlendem INT-009-Zwischenspeicher)
- [x] 2.2 Sicherstellen, dass kein Feiertags-Hinweis an einem gewöhnlichen Termin erscheint (Test: „Termin an einem gewöhnlichen Tag")
- [x] 2.3 Übersetzung des Hinweistexts Deutsch/Englisch ergänzen (NFR-F-115, keine feste Zeichenkette im Code)

## 3. Spec-Pflege

- [x] 3.1 `schedule/spec.md`, „Offene Fragen": den Eintrag zu Feiertagen/vorlesungsfreien Einzeltagen auf den verbliebenen, weiterhin offenen Teil (vorlesungsfreie Einzeltage, Brückentage, Semesterferien) präzisieren
