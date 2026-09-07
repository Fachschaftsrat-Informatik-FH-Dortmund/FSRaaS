# Aufgaben

## 1. Neue Requirements (`backend-and-api`)

- [x] 1.1 „Ableitung des Prüfungsbestands aus dem Raumplan" — Erkennungsmuster, Herauslösen der Modulnummer aus dem Namensfeld, Protokollierung bei nicht auflösbarem Muster
- [x] 1.2 „Abruf des Prüfungsbestands" — anmeldefreier Abruf-Endpunkt

## 2. Geänderte Requirements

- [x] 2.1 `schedule` „Auswahl aus dem offiziellen Prüfungsplan" → Quelle ist der abgeleitete Bestand; Einschränkung bei Nachholprüfungen festgehalten
- [x] 2.2 `schedule` „Benachrichtigung bei Prüfungsplan-Aktualisierung" → Abgleichverfahren beschrieben, zusätzliches Gegenscenario
- [x] 2.3 `backend-and-api` „Allgemeine Aktualisierungsmeldung bei geändertem Prüfungsplan" → Auslöser ist der abgeleitete Bestand
- [x] 2.4 `integrations` INT-009 → Prüfungsbefund aufgenommen: Namensmuster, leere Felder `courseId`/`courseOfStudy`

## 3. Entfallene Requirements

- [x] 3.1 `backend-and-api` „Import des Prüfungsplans" (vormals API-F-180)
- [x] 3.2 `backend-and-api` „Vollständiger Ersatz des Prüfungsplan-Bestands" (vormals API-F-190)
- [x] 3.3 `admin` „Prüfungsplan-Upload mit Importergebnis" (vormals ADMIN-F-160)
- [x] 3.4 `admin` „Abschluss des Imports trotz unlesbarer Zeilen" (vormals ADMIN-F-170)
- [x] 3.5 `integrations` INT-013 — mit erhaltener Formatanalyse und dem Hinweis auf die verlorene Studiengang-Matrix

## 4. Vertrag und Roadmap

- [x] 4.1 `openspec/specs/api-contract.yaml`: Endpunkt für den Abruf des Prüfungsbestands ergänzen, Schema für einen Prüfungstermin, Fassung erhöhen
- [x] 4.2 Typen neu erzeugen (`tools/contract-codegen`)
- [x] 4.3 `specs/product/roadmap.md`: Prüfungsplan aus der zweiten Ausbaustufe nehmen, Schritt 6 zuordnen; Zeile „Prüfungsplan im Stundenplan" aus der Tabelle der zurückgestellten Punkte entfernen; `version` und `last_reviewed` pflegen
- [x] 4.4 `specs/product/roadmap.md`: ADMIN-Zuordnung um die zwei entfallenen Requirements bereinigen

## 5. Glossar

- [x] 5.0 `specs/product/glossary.md`: Eintrag „Prüfungsbestand" ergänzt (abgeleitet aus dem Raumplan, ersetzt den entfallenen Excel-Import)

## 6. Werkzeug

- [x] 6.1 `tools/spec-check`: Eine entfallene Integration gilt jetzt weiter als vergeben, wenn sie im Abschnitt „Entfallene Anforderungen" steht — bis dahin galt diese Regel nur für Anforderungs-IDs, nicht für `INT-`-Kennungen, und der Wegfall von INT-013 hätte fünf historische Verweise in ADRs und Roadmap gebrochen. Mit Test.

## 7. Umsetzung

Ausgelagert: die Ableitung im Backend, gemeinsam mit dem Raumplan-
Zwischenspeicher in Roadmap-Schritt 6, nach **Issue #29**; der INT-009-Spike
als deren Vorbedingung nach **Issue #28**, dort als Blocker von #29
eingetragen.

Offen bleiben in diesem Change allein die Vertragsaufgaben 4.1 und 4.2 — sie
gehören hierher, weil der Vertrag vor dem Code kommt.

## Beim Archivieren

Die Haupt-Specs sind bereits im selben Merge fortgeschrieben (Vorgehen wie bei `canteen-durchsprache-inhalt`). Ein `openspec archive` würde die neuen Requirements deshalb ein zweites Mal einzufügen versuchen und abbrechen — archivieren mit `openspec archive pruefungsplan-ohne-upload --skip-specs`.
