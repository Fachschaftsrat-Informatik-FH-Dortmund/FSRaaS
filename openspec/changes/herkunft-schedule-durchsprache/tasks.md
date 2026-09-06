# Aufgaben

## 1. Geänderte Requirements

- [x] 1.1 „Wildcard im studentSet" → Beleg nachgetragen, tragende Begründung in der Erläuterung ersetzt
- [x] 1.2 „Leerer Tag bei Gruppenfilterung" → „Leerer Tag bei wirksamem Filter", Grundnennung generisch, zusätzliches Scenario
- [x] 1.3 „Datei-Export als Rückfallweg" → „Gleichrangiger Datei-Export und Verhalten bei verweigerter Berechtigung"; Kalender-Schreibzugriff und Datei-Export gleichrangig, Weg in die Systemeinstellungen statt erneuter Abfrage
- [x] 1.4 „Konflikthinweis bei festen Terminen" → Ausnahme für den bewusst angenommenen Konflikt, zusätzliches Scenario
- [x] 1.5 „Kennzeichnung als unbestätigte Ableitung" → Quelle benannt, Prüfungsplan als vorrangige Quelle ergänzt
- [x] 1.6 „Kein Hinweis bei veraltetem Raumplan" → Schwelle auf das Vierfache der Frequenz, mindestens 30 Minuten, zusätzliches Scenario
- [x] 1.7 „Lokale Speicherung der Matrikelnummer" → „Keine Speicherung der Matrikelnummer"; gespeichert wird allein die Gruppenkennung

## 2. Neues Requirement

- [x] 2.1 „Schalter zum Abschalten aller Filter" ergänzt

## 3. Entfallenes Requirement

- [x] 3.1 „Zeitziel beim Blättern zwischen Wochentagen" (vormals SCHED-N-010) als REMOVED geführt, Abschnitt „Entfallene Anforderungen (historisch)" ergänzt
- [x] 3.2 Abschnitt „Nicht-funktionale Anforderungen (Register)" auf NFR-N-040 umgestellt

## 4. Fortgeschriebene Abschnitte der Haupt-Spec

- [x] 4.1 `Fehlerfälle`: Zeile zur verweigerten Kalenderberechtigung auf das neue Verhalten umgestellt („keine wiederholte Nachfrage" entfällt)
- [x] 4.2 `UI-Flows & Zustände`: Zeilen für den angenommenen Konflikt, den „Alle anzeigen"-Schalter und die verweigerte Kalenderberechtigung
- [x] 4.3 `Datenmodell`: Matrikelnummer als flüchtig statt gerätegespeichert geführt
- [x] 4.4 `Akzeptanzkriterien`: an die sieben geänderten und das neue Requirement angepasst

## 5. Belege und berichtigte Erläuterungen

- [x] 5.1 Erläuterung „Durchsprache vom 2026-09-06" — was bestätigt wurde und worauf sich die Bestätigung stützt; ausdrücklich festgehalten, dass keine laufende Implementierung dahintersteht
- [x] 5.2 Wildcard-Befund: Begründung über den Abrufparameter `studentSet=*` ersetzt
- [x] 5.3 „Offene Fragen": überholte Aussage zur fehlenden `courseId` in INT-002 auf den tatsächlich offenen Teil reduziert
- [x] 5.4 Domänenwissen ergänzt: Studierende mischen Gruppen, der Fachbereich duldet das bei nicht überfüllten Gruppen
- [x] 5.5 Raumplan-Abgleich ausdrücklich als experimentelles Feature geführt

## 6. Umsetzung

- [ ] 6.1 `app/src/areas/schedule/einrichtung.ts` und die zugehörigen Tests: Speichern der Matrikelnummer entfernen — die einzige Codefolge dieser Durchsprache
- [ ] 6.2 Die übrigen geänderten Requirements fallen mit den noch offenen Etappen 3 bis 5 von Roadmap-Schritt 5 an, nicht vorher
- [x] 6.3 INT-009-Spike als Vorbedingung von Roadmap-Schritt 6 in `specs/product/roadmap.md` festgehalten

## Beim Archivieren

Die Haupt-Specs sind bereits im selben Merge fortgeschrieben (Vorgehen wie bei `canteen-durchsprache-inhalt`). Ein `openspec archive` würde die neuen Requirements deshalb ein zweites Mal einzufügen versuchen und abbrechen — archivieren mit `openspec archive herkunft-schedule-durchsprache --skip-specs`.
