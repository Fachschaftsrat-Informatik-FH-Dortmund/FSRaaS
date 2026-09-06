# Aufgaben

## 1. Neue Requirements

- [x] 1.1 „Ausgangszustand ohne Optimierung" — Einteilung nach Gruppenkennung, Optimierung als Hilfsmittel
- [x] 1.2 „Rücknahme einer übernommenen Optimierung"
- [x] 1.3 „Anpinnen eines Termins"
- [x] 1.4 „Vorbereitungszeit je Veranstaltungsart" — Standardwert plus Ausnahmen

## 2. Ersetzte Requirements (als REMOVED geführt, nicht gelöscht)

Drei Anforderungen wechseln das Konzept, nicht nur die Formulierung — sie werden deshalb als REMOVED geführt und durch neue ersetzt, statt als MODIFIED fortgeschrieben.

- [x] 2.1 „Auswahl des Optimierungsmodus" (vormals SCHED-F-350) → ersetzt durch „Kriterienrangfolge für die Planung"; acht Kriterien, sortierbar, abschaltbar, fünf Voreinstellungen
- [x] 2.2 „Reihung nach Optimierungsmodus" (vormals SCHED-F-360) → ersetzt durch „Reihung nach der Kriterienrangfolge"; strenge Auswertung ohne Toleranz, alle acht Kriterien definiert, „ausgeglichener Tagesablauf" als gleichmäßige Verteilung über die Woche neu gefasst
- [x] 2.3 „Konfliktprüfung gegenüber Pflicht-Kandidaten" (vormals SCHED-F-390) → ersetzt durch „Konfliktprüfung gegenüber angepinnten Terminen"

## 3. Geänderte Requirements

- [x] 3.1 „Kandidat als Pflicht markieren" → Pflicht betrifft nur noch das *Ob*
- [x] 3.2 „Automatischer Planungsvorschlag" → greedy statt kombinatorisch, Reichweite des Umlegens, Ausgabe bei fehlender konfliktfreier Konstellation
- [x] 3.3 „Kennzeichnung außerhalb des Zeitfensters" → Verhältnis zur Reihung geklärt

## 4. Fortgeschriebene Abschnitte der Haupt-Spec

- [x] 4.1 `Datenmodell`: `angepinnt` je Plantermin; `pflicht` als Veranstaltungs-, nicht Terminmerkmal; Kriterienrangfolge und Vorbereitungszeiten als lokale Einstellungen
- [x] 4.2 `Erläuterungen`: Abschnitt „Definition der Optimierungsmodi" durch die Kriterientabelle ersetzt; Begründung für die strenge Auswertung ohne Gewichtung; die zwei Randfestlegungen (erster Termin des Tages, Übung vor Vorlesung)
- [x] 4.3 `Erläuterungen`: Widerspruch zwischen Zurückstellung der Vollkombinatorik und automatischem Vorschlag aufgelöst und die Auflösung begründet
- [x] 4.4 `Erläuterungen`: bekannte Grenze des Greedy-Verfahrens festgehalten
- [x] 4.5 `UI-Flows & Zustände`: Zeilen für angepinnte Termine, zurückgenommene Optimierung und den Vorschlag mit markiertem Konflikt
- [x] 4.6 `Akzeptanzkriterien`: an die neuen und geänderten Requirements angepasst
- [x] 4.7 `Offene Fragen`: Vollkombinatorik als mögliche spätere Erweiterung präzisiert; „weitere Optimierungsmodi" auf „weitere Kriterien" umgestellt

## 5. Glossar

- [x] 5.1 `specs/product/glossary.md` (0.6.0): Einträge „Angepinnter Termin", „Kriterienrangfolge", „Pflicht-Veranstaltung", „Voreinstellung (Planung)" ergänzt
- [x] 5.2 Dabei berichtigt: Der Glossareintrag „Gruppenkennung" führte noch die vor dem 2026-09-04 geltende Pflichtziffer (`^[A-Z][0-9]+$`). Da bei Widerspruch das Glossar gilt, hätte er die korrigierte Spec überstimmt.

## 6. Umsetzung (Roadmap-Schritt 5, Etappe 5)

- [ ] 6.1 Erster Zug: die fünf Voreinstellungen mit festen Reihenfolgen, Anpinnen, Vorbereitungszeiten — der Planungsmodus ist damit vollständig nutzbar
- [ ] 6.2 Zweiter Zug: freie Sortierung der Kriterienrangfolge und Abschalten einzelner Kriterien
- [ ] 6.3 Reine Gerätelogik — kein Backend, keine Vertragsänderung

## Beim Archivieren

Die Haupt-Specs sind bereits im selben Merge fortgeschrieben (Vorgehen wie bei `canteen-durchsprache-inhalt`). Ein `openspec archive` würde die neuen Requirements deshalb ein zweites Mal einzufügen versuchen und abbrechen — archivieren mit `openspec archive planungsmodus-kriterien --skip-specs`.
