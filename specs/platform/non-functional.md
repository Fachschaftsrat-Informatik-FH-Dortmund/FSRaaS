---
id: non-functional
titel: Nicht-funktionale Anforderungen
praefix: NFR
status: draft
version: 0.1.0
owner: FSR FB4
last_reviewed: 2026-08-24
derived_from:
  - alte apps/fb4_app-main/fb4_app-main/lib/main.dart
  - alte apps/fb4_app-main/fb4_app-main/lib/areas/canteen/repositories/meals_repository.dart
implemented_in: []
related:
  - integrations.md
  - architecture.md
  - ux-and-theming.md
  - quality-and-testing.md
  - ../features/canteen/spec.md
---

# Nicht-funktionale Anforderungen

## 1. Zweck

Projektweite Qualitätsanforderungen: Leistung, Verfügbarkeit, Ressourcenverbrauch, Sprache, Wartbarkeit, Bildschirmausrichtung. Feature-spezifische Verschärfungen gehören in die jeweilige Feature-Spec und verweisen hierher. Zahlenwerte in diesem Dokument sind, sofern nicht ausdrücklich als bestätigt gekennzeichnet, Vorschläge zur Bestätigung.

## 2. Plattform-Mindestversionen

| Plattform | Vorschlag | Begründung | Status |
|---|---|---|---|
| iOS | 15 | Anhaltspunkt: übliches Support-Fenster aktueller Apple-Geräte; keine projektspezifische Verbreitungserhebung unter FB4-Studierenden vorliegend | offen, zu bestätigen |
| Android | 10 (API 29) | Anhaltspunkt: React-Native-Mindestunterstützung und übliche Verbreitung; keine projektspezifische Verbreitungserhebung vorliegend | offen, zu bestätigen |

Klärung: Erhebung unter Studierenden des FB4 (z. B. Kurzumfrage des FSR) oder Auswertung verfügbarer Store-Statistiken vor Festlegung.

## 3. Leistung

| Kennzahl | Zielwert (vorgeschlagen) | Status |
|---|---|---|
| Startzeit bis zur ersten nutzbaren Ansicht | unter 2 Sekunden | offen, zu bestätigen |
| Reaktionszeit beim Blättern durch Wochentage/Datumsseiten | unter 200 ms wahrgenommene Reaktion je Wechsel | offen, zu bestätigen |
| Schwelle für Ladezustand-Anzeige bei Netzabrufen | ab 300 ms | offen, zu bestätigen |
| Timeout für Netzabrufe | 10 Sekunden, danach Fehlermeldung mit Wiederholen-Option | offen, zu bestätigen |

Die Alt-App lädt Speisepläne je Datumsseite bei Bedarf nach und hält sie in einem Zwischenspeicher (`alte apps/fb4_app-main/fb4_app-main/lib/areas/canteen/repositories/meals_repository.dart:9-38`, siehe auch `data-and-storage.md` Abschnitt 4). Dieses Muster aus On-Demand-Laden plus Zwischenspeicher pro Seite ist übernehmenswert und gilt sinngemäß für jede Ansicht mit blätterbaren Zeit- oder Datumsseiten.

## 4. Verfügbarkeit und Verhalten bei Ausfall

Grundsatz: Der Ausfall eines Fremdsystems darf nur den davon abhängigen Funktionsbereich beeinträchtigen, nie die gesamte App. Risikoeinschätzung je System: siehe `integrations.md`.

| System | Risiko lt. integrations.md | Verhalten bei Ausfall |
|---|---|---|
| INT-001/002 FBWS (Studiengänge, Termine) | mittel | zuletzt geladene Daten anzeigen, als möglicherweise veraltet kennzeichnen; nur Stundenplan/Raumsuche betroffen |
| INT-003 News-Feed | hoch | Fehlermeldung mit Wiederholen-Option; übrige App bleibt nutzbar |
| INT-004 Mensa-Speisepläne | hoch | zuletzt geladener Speiseplan bis Tagesende; übrige App bleibt nutzbar |
| INT-005 Push-Benachrichtigungen | mittel | In-App-Hinweise als Rückfalloption ohne Push |
| INT-006 HISinOne | offen | Notenübersicht als nicht verfügbar kennzeichnen; übrige App unbeeinträchtigt |
| INT-007 BookStack | mittel bis hoch | Wiki-Bereich zeigt Fehlerzustand; übrige App unbeeinträchtigt |
| INT-008 Eigenes Backend | eigener Verantwortungsbereich | betrifft RATE, EVENT, HELFER, NEWS, MENSA, RAUM gemeinsam, da zentraler Vermittler — größtes Einzelrisiko für die Bereichsisolation, siehe Abschnitt 8 |

## 5. Energie- und Datenverbrauch

Hintergrundabrufe laufen in festen, sparsamen Intervallen statt fortlaufendem Polling. Bereits gültige Zwischenspeicher (siehe `data-and-storage.md` Abschnitt 4) werden nicht vorzeitig erneut abgerufen. Umfangreiche Abrufe (z. B. Wiki-Vorabladen) nehmen Rücksicht auf Mobilfunkverbindungen; genaue Schwellwerte sind offen (Abschnitt 8).

## 6. Sprache

Deutsch ist die einzige Oberflächensprache; Datums-, Zeit- und Währungsformate folgen der deutschen Konvention. Die Alt-App initialisiert entsprechend die Lokalisierung `de_DE` (`alte apps/fb4_app-main/fb4_app-main/lib/main.dart:37`). Mehrsprachigkeit ist nicht Teil des aktuellen Umfangs; ob und wann sie nachrüstbar sein muss, ist offen (Abschnitt 8).

## 7. Wartbarkeit

Jede Verhaltensänderung zieht eine Spec-Änderung nach sich (spec-anchored Vorgehen, `README.md` Abschnitt 7). Die automatisierbare Prüfung dieser Regel ist Sache von `quality-and-testing.md` (QA), nicht dieses Dokuments.

## 8. Bildschirmausrichtung

Die Alt-App erzwingt Hochformat (`alte apps/fb4_app-main/fb4_app-main/lib/main.dart:113-115`). Vorschlag: Hochformat bleibt die primäre Ausrichtung, da die Kernfunktionen (Stundenplan, Mensaplan, News) listenbasiert sind. Ob einzelne Ansichten (z. B. Wiki-Tabellen, Raumpläne) Querformat zulassen sollen, entscheidet `ux-and-theming.md`.

## 9. Anforderungen

| ID | Anforderung | Herkunft |
|---|---|---|
| NFR-N-010 | Die Mindestversion für iOS sollte 15 betragen (vorgeschlagen, zu bestätigen). | NEU |
| NFR-N-020 | Die Mindestversion für Android sollte API 29 (Android 10) betragen (vorgeschlagen, zu bestätigen). | NEU |
| NFR-N-030 | Die Startzeit bis zur ersten nutzbaren Ansicht sollte unter 2 Sekunden liegen (vorgeschlagen, zu bestätigen). | NEU |
| NFR-N-040 | Die Reaktionszeit beim Blättern durch Wochentage oder Datumsseiten sollte unter 200 ms liegen (vorgeschlagen, zu bestätigen). | NEU |
| NFR-F-050 | Das System muss Inhalte blätterbarer Zeit- oder Datumsseiten bei Bedarf je Seite nachladen und im Zwischenspeicher vorhalten. | Alt: alte apps/fb4_app-main/fb4_app-main/lib/areas/canteen/repositories/meals_repository.dart:9 |
| NFR-N-060 | Das System sollte bei Netzabrufen ab 300 ms einen Ladezustand anzeigen (vorgeschlagen, zu bestätigen). | NEU |
| NFR-F-070 | Falls ein Netzabruf eine vorgegebene Zeitspanne überschreitet, muss das System den Abruf abbrechen und eine Fehlermeldung mit Wiederholen-Option anzeigen. | NEU |
| NFR-N-080 | Falls ein Fremdsystem ausfällt, darf nur der davon abhängige Funktionsbereich beeinträchtigt sein, nicht die gesamte App. | NEU |
| NFR-N-090 | Das System muss Hintergrundabrufe in festen, sparsamen Intervallen ausführen und darf gültige Zwischenspeicher nicht vorzeitig erneut abrufen. | NEU |
| NFR-N-100 | Umfangreiche Abrufe (z. B. Wiki-Vorabladen) sollten Rücksicht auf Mobilfunkverbindungen nehmen und deren Datenverbrauch begrenzen. | NEU |
| NFR-F-110 | Das System muss Deutsch als einzige Oberflächensprache verwenden. | Alt: alte apps/fb4_app-main/fb4_app-main/lib/main.dart:37 |
| NFR-F-120 | Das System muss Datums-, Zeit- und Währungsangaben nach deutscher Konvention formatieren. | Alt: alte apps/fb4_app-main/fb4_app-main/lib/main.dart:37 |
| NFR-N-130 | Die Architektur sollte künftige Mehrsprachigkeit nicht grundsätzlich ausschließen, auch wenn sie aktuell nicht umgesetzt wird. | NEU |
| NFR-N-140 | Das System muss so betrieben werden, dass jede Verhaltensänderung mit einer Änderung der zugehörigen Spec einhergeht. | NEU |
| NFR-N-150 | Die App sollte Hochformat als primäre Bildschirmausrichtung verwenden. | Alt: alte apps/fb4_app-main/fb4_app-main/lib/main.dart:113 |

## 10. Offene Fragen

- Plattform-Mindestversionen (NFR-N-010, NFR-N-020): keine projektspezifische Verbreitungserhebung vorhanden. Klärung durch FSR FB4 vor der ersten Release-Planung.
- Leistungszielwerte (NFR-N-030, NFR-N-040, NFR-N-060): vorgeschlagen, nicht gemessen. Klärung durch technische Leitung anhand eines frühen Prototyps.
- Schwellwerte für Datenverbrauch bei Hintergrundabrufen und Prefetching (Abschnitt 5): nicht festgelegt. Klärung im Zuge von `architecture.md`.
- Zeitpunkt und Bedarf für Mehrsprachigkeit (NFR-N-130): ungeklärt, hängt von künftiger Internationalisierung des FB4 ab. Klärung durch FSR FB4.
- Ausnahmen von der Hochformat-Vorgabe (NFR-N-150) für einzelne Ansichten: Entscheidung liegt bei `ux-and-theming.md`.
