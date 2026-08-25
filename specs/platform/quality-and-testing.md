---
id: quality-and-testing
titel: Qualität und Test
praefix: QA
status: draft
version: 0.2.1
owner: FSR FB4
last_reviewed: 2026-08-25
derived_from:
  - alte apps/fb4_app-main/fb4_app-main/lib/areas/schedule/viewmodels/schedule_overview_viewmodel.dart
  - alte apps/fb4_app-main/fb4_app-main/lib/areas/schedule/models/selected_course_info.dart
  - alte apps/fb4_app-main/fb4_app-main/lib/areas/news/models/news_item.dart
implemented_in: []
related:
  - integrations.md
  - non-functional.md
  - ../features/schedule/spec.md
  - ../features/news/spec.md
  - ../features/canteen-ratings/spec.md
  - ../README.md
---

# Qualität und Test

## 1. Zweck

Dieses Dokument trägt den zentralen Mechanismus des spec-anchored Ansatzes: die verbindliche Verknüpfung von Anforderung und Test über die Anforderungs-ID. Es legt fest, was getestet werden muss, wie, und wie der Spec-Bestand selbst geprüft wird.

## 2. Anforderungs-IDs in Testnamen

Jeder Test, der eine spezifizierte Anforderung prüft, trägt deren ID im Testnamen, z. B.:

```
describe('SCHED-F-140 Gruppenzuordnung bei Bereichsangabe', () => { ... })
```

Die Wirkung gilt in beide Richtungen: Eine Anforderung ohne zugehörigen Test ist unbelegt — es gibt keinen Nachweis, dass der Code sie tatsächlich erfüllt. Ein Test ohne zugehörige Anforderung zeigt einen von zwei Mängeln an: entweder wurde die Spec bei einer Verhaltensänderung nicht mitgeführt, oder der Test prüft Verhalten, das nie spezifiziert wurde und damit außerhalb der vereinbarten Anforderungen liegt.

## 3. Abdeckungsregel

| Anforderungsart | Nachweis |
|---|---|
| Funktionale Anforderung mit „muss" | zwingend automatisierter Test mit Anforderungs-ID im Testnamen |
| Funktionale Anforderung mit „sollte" oder „kann" | automatisierter Test empfohlen, kein Zwang |
| Gestaltung, Barrierefreiheit | Prüfprotokoll (datiert, mit Prüfer) statt Test zulässig |
| Leistungswerte (Abschnitt 3 in `non-functional.md`) | Prüfprotokoll oder Messung statt Test zulässig, sofern Messmethode dokumentiert ist |

## 4. Teststufen

| Stufe | Gehört hinein | Gehört nicht hinein |
|---|---|---|
| Fachlogik ohne UI | reine Funktionen/Module: Gruppenzuordnung, Zeitformat-Umwandlung, Datumsparsing, Normalisierung von Gerichtsbezeichnungen, Zwischenspeicher-Regeln | Netzwerkaufrufe, Rendering, Navigation |
| Komponenten | einzelne UI-Komponenten mit Props/State; Lade-, Leer-, Fehler- und Offline-Zustand je Komponente | echte Netzwerkaufrufe, vollständige Nutzerflüsse |
| Zusammenspiel mit Fremdsystemen über Attrappen | Anfrage-/Antwortverarbeitung gegen INT-001 bis INT-008 mit aufgezeichneten oder simulierten Antworten, Vertragstests | echte externe Systeme, UI-Interaktion |
| Durchgängige Abläufe auf dem Gerät | vollständige Nutzerflüsse über mehrere Bildschirme, auf echtem oder simuliertem Gerät | Detailprüfung einzelner Fachlogik-Sonderfälle (gehört in Stufe „Fachlogik ohne UI") |

## 5. Besonders prüfbedürftige Fachlogik

| Bereich | Quelle | Warum pflichtbedürftig | Beispieldaten/Sonderfälle |
|---|---|---|---|
| Gruppenzuordnung im Stundenplan | `alte apps/fb4_app-main/fb4_app-main/lib/areas/schedule/viewmodels/schedule_overview_viewmodel.dart:209-252` (`isGroupInScheduleItem`) | Bereichslogik über `studentSet` mit mehreren Sonderfällen, im Altcode schwer nachzuvollziehen und dadurch fehleranfällig. Eigene Prüfung deckte zusätzliche Verdachtsmomente auf: Zeile 216 vergleicht `info.groupNumber` (eine Ziffer) statt `info.groupLetter` mit dem ersten Zeichen des `studentSet` bei Einzelwerten; Zeile 210 prüft `groupLetter == "" \|\| groupLetter == ""` — dieselbe Bedingung doppelt, vermutlich ein Kopierfehler | Keine Gruppenkennung → alle Termine sichtbar; Einzelwert-`studentSet` z. B. `C8`; Wildcard `*`; Bereich `A1-C9` mit Gruppen `B5` (innerhalb), `A0` (unter Untergrenze), `C10` (über Obergrenze), `D2` (außerhalb); Bereich mit offener Grenze z. B. `A-C9`. Das für die Neuentwicklung korrekte Verhalten je Fall definiert `features/schedule/spec.md`, nicht dieses Dokument |
| Zeitformat-Umwandlung `HHmm` | INT-002 in `integrations.md` | Rohwerte kommen ohne führende Nullen und wahlweise als Zahl oder String; Stundenplan und Raumsuche bauen beide darauf auf | `800` → `0800`; `930` → `0930`; `1215` unverändert; numerischer Wert `800` vs. String `"800"` |
| Datumsauswertung News-Feed | `alte apps/fb4_app-main/fb4_app-main/lib/areas/news/models/news_item.dart:26` (INT-003) | Belegter Fehler in der Alt-App: 12-Stunden-Muster `hh` statt 24-Stunden-Muster `HH`, obwohl die Rohdaten keine AM/PM-Angabe enthalten | `"24.08.2026 - 14:30:00"` muss als 14:30 Uhr ausgewertet werden, nicht als vormittags fehlinterpretiert |
| Normalisierung der Gerichtsbezeichnungen | RATE, Rohdaten aus INT-004 (`meals[].title`) | Neue Fachlogik ohne Vorbild in der Alt-App; uneinheitliche Roh-Titel würden dasselbe Gericht an verschiedenen Tagen als unterschiedliche Bewertungsziele behandeln | konkrete Normalisierungsregeln definiert `features/canteen-ratings/spec.md`; hier nur als Pflicht-Testbereich benannt |

## 6. Prüfung gegen Fremdsysteme

Keines der Systeme INT-001 bis INT-004 gibt eine Stabilitätszusage (siehe Risikoeinschätzung in `integrations.md`). Für jedes dieser Systeme sollte ein Vertragstest oder eine Schemaänderungs-Erkennung bestehen: ein automatisierter Abgleich der tatsächlichen Antwortstruktur gegen die in `integrations.md` dokumentierten Felder, der bei Abweichung (fehlendes Feld, geänderter Typ, unerwarteter Wert z. B. bei `weekday` oder `courseType`) sichtbar fehlschlägt, statt die Abweichung stillschweigend weiterzuverarbeiten.

## 7. Definition of Done

Eine Anforderung gilt als umgesetzt, wenn:

- sie in einer Spec mit eindeutiger ID, EARS-Formulierung und Herkunftsmarkierung spezifiziert ist,
- der Code sie umsetzt,
- mindestens ein automatisierter Test mit der Anforderungs-ID im Testnamen sie nachweist (oder, sofern nach Abschnitt 3 zulässig, ein datiertes Prüfprotokoll vorliegt),
- `implemented_in:` im Frontmatter der Spec die zuständigen Quellverzeichnisse nennt,
- der `status` der Spec auf den erreichten Stand fortgeschrieben ist,
- `last_reviewed` auf das Datum dieser Änderung aktualisiert ist.

## 8. Prüfungen am Spec-Bestand selbst

| Regel | Wie geprüft |
|---|---|
| Keine doppelten Anforderungs-IDs über alle Specs | Skript sammelt alle `<PREFIX>-F-###`/`<PREFIX>-N-###`-Vorkommen aus allen `.md`-Dateien unter `specs/` und meldet Duplikate |
| Jede Anforderung trägt genau eine Herkunftsmarkierung | Skript prüft jede Anforderungszeile auf genau eines der vier zulässigen Muster aus `README.md` Abschnitt 6 |
| Alle Frontmatter-Pflichtfelder vorhanden | Skript parst das YAML-Frontmatter jeder Spec-Datei gegen die Feldliste aus `_templates/feature-spec.md` bzw. `_templates/adr.md` |
| Alle Verweise zeigen auf existierende Ziele | Skript prüft referenzierte Datei- und Anforderungs-IDs (`related:`, `INT-###`, Anforderungs-ID-Nennungen im Fließtext) gegen den tatsächlichen Spec-Bestand |

Kontrolle dieser Regeln sowie der Spec-Code-Kopplung aus `README.md` Abschnitt 7: automatisierte CI-Pipeline, nicht eine benannte Kontrollperson (Entscheidung FSR FB4, 2026-08-25) — überlebt den jährlichen Wechsel der FSR-Besetzung zuverlässiger als eine an eine Person gebundene Prüfpflicht. Die Pipeline läuft bei jedem Pull Request; ein Verstoß blockiert den Merge.

## 9. Anforderungen

| ID | Anforderung | Herkunft |
|---|---|---|
| QA-F-010 | Jede funktionale Anforderung mit „muss" muss durch mindestens einen automatisierten Test nachgewiesen werden, dessen Name die Anforderungs-ID enthält. | NEU |
| QA-F-020 | Anforderungen zu Gestaltung, Barrierefreiheit oder Leistungswerten dürfen statt durch einen automatisierten Test durch ein datiertes Prüfprotokoll nachgewiesen werden. | NEU |
| QA-F-030 | Die Gruppenzuordnungslogik im Stundenplan muss mit den in Abschnitt 5 genannten Beispielszenarien automatisiert getestet werden. | NEU |
| QA-F-040 | Die Umwandlung der FBWS-Zeitfelder in das Format `HHmm` mit führenden Nullen muss automatisiert getestet werden. | NEU |
| QA-F-050 | Die Datumsauswertung des News-Feeds muss mit einem Testfall für Zeitangaben ab 13:00 Uhr automatisiert getestet werden. | NEU |
| QA-F-060 | Die Normalisierung von Gerichtsbezeichnungen für die Bewertungsfunktion muss automatisiert getestet werden. | NEU |
| QA-N-070 | Für INT-001 bis INT-004 sollte ein Vertragstest oder eine Schemaänderungs-Erkennung bestehen, der bzw. die bei struktureller Abweichung von der dokumentierten Antwortstruktur fehlschlägt. | NEU |
| QA-N-080 | Es dürfen keine doppelten Anforderungs-IDs über den gesamten Spec-Bestand hinweg vorkommen. | NEU |
| QA-N-090 | Jede Anforderung muss genau eine Herkunftsmarkierung tragen. | NEU |
| QA-N-100 | Jede Spec-Datei muss alle für ihren Typ vorgesehenen Frontmatter-Pflichtfelder enthalten. | NEU |
| QA-N-110 | Jeder Verweis auf eine andere Spec oder Anforderungs-ID muss auf ein tatsächlich existierendes Ziel zeigen. | NEU |
| QA-F-120 | Bevor eine Anforderung als umgesetzt gilt, muss die Prüfliste aus Abschnitt 7 vollständig erfüllt sein. | NEU |

## 10. Offene Fragen

- Konkretes Testframework für die Vertragstests/Schemaänderungs-Erkennung aus Abschnitt 6 (z. B. xUnit/NUnit-basierter Snapshot-Vergleich der dokumentierten INT-001-INT-004-Antwortstrukturen, da diese Hochschulsysteme keine eigenen Vertragstest-Endpunkte anbieten) — konkrete Bibliothek bei Umsetzung im .NET/C#-Ökosystem (`backend-and-api.md` Abschnitt 8) zu wählen.

Korrektes Sollverhalten der Gruppenzuordnungs-Sonderfälle aus Abschnitt 5 (Wildcard `*`, Einzelwert-`studentSet`) ist bereits in `features/schedule/spec.md` Abschnitt 4 (Beispieltabelle zu SCHED-F-050 bis SCHED-F-090) verbindlich festgelegt — keine offene Frage mehr, hier nur zur Einordnung erwähnt.
