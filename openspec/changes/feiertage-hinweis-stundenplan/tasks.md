## 1. Feiertagsberechnung

- [ ] 1.1 NRW-Feiertagsberechnung implementieren (acht feste Daten, fünf über die Gaußsche Osterformel abgeleitet) und mit `describe('Hinweis auf gesetzlichen Feiertag', …)` gegen mehrere Jahre testen, darunter 2026 (Pfingstmontag 25.05., Fronleichnam 04.06. — Referenzwerte aus dem INT-009-Spike)
- [ ] 1.2 Randfälle testen: Jahreswechsel, Osterdatum in unterschiedlichen Jahren (frühester/spätester Ostersonntag im geprüften Zeitraum)

## 2. Anbindung an den Stundenplan

- [ ] 2.1 Feiertags-Hinweis an jedem betroffenen Stundenplan-Termin anzeigen, unabhängig vom Raumplan-Abgleich (Test: Hinweis erscheint auch bei veraltetem oder fehlendem INT-009-Zwischenspeicher)
- [ ] 2.2 Sicherstellen, dass kein Feiertags-Hinweis an einem gewöhnlichen Termin erscheint (Test: „Termin an einem gewöhnlichen Tag")
- [ ] 2.3 Übersetzung des Hinweistexts Deutsch/Englisch ergänzen (NFR-F-115, keine feste Zeichenkette im Code)

## 3. Spec-Pflege

- [ ] 3.1 `schedule/spec.md`, „Offene Fragen": den Eintrag zu Feiertagen/vorlesungsfreien Einzeltagen auf den verbliebenen, weiterhin offenen Teil (vorlesungsfreie Einzeltage, Brückentage, Semesterferien) präzisieren
