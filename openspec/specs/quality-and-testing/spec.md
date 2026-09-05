## Purpose

Trägt den zentralen Mechanismus des spec-anchored Ansatzes: die verbindliche Verknüpfung von Anforderung und Test. Legt fest, was getestet werden muss, wie, und wie der Anforderungsbestand selbst geprüft wird. Vormals `specs/platform/quality-and-testing.md` (Präfix `QA`), migriert nach ADR 0019. Owner: FSR FB4.

## Requirements

### Requirement: Testnachweis für funktionale Anforderungen mit „muss"

Jede funktionale Anforderung mit „muss" muss durch mindestens einen automatisierten Test nachgewiesen werden, dessen Name den Requirement-Bezug (Titel bzw., für noch nicht migrierte Bestandsanforderungen, die Anforderungs-ID) enthält. Herkunft: NEU (vormals QA-F-010).

#### Scenario: Requirement ohne Test
- **WHEN** ein Requirement mit „muss" formuliert ist und kein Test seinen Titel im Namen trägt
- **THEN** gilt die Anforderung als unbelegt

### Requirement: Testnachweis für nicht-funktionale Anforderungen mit „muss"

Jede nicht-funktionale Anforderung mit „muss", die keinem der Sonderfälle aus dem Abschnitt „Teststufen und Ausnahmen" zugeordnet ist, muss durch mindestens einen automatisierten Test nachgewiesen werden oder, mit einer im Requirement dokumentierten Begründung, durch ein datiertes Prüfprotokoll. Herkunft: NEU (vormals QA-F-015). Schließt die Lücke, dass ein reiner Testzwang wörtlich nur funktionale Anforderungen bindet, während ein erheblicher Teil der sicherheits- und betriebsrelevanten Anforderungen im gesamten Bestand keinem der Sonderfälle zuzuordnen ist.

#### Scenario: Nicht-funktionale Anforderung ohne Sonderfall
- **WHEN** eine nicht-funktionale Anforderung mit „muss" formuliert ist und weder Gestaltung, Barrierefreiheit, Leistungswert noch Architektur-Constraint betrifft
- **THEN** ist entweder ein automatisierter Test oder ein datiertes Prüfprotokoll mit Begründung erforderlich

### Requirement: Prüfprotokoll statt Test bei Gestaltung, Barrierefreiheit und Leistungswerten

Anforderungen zu Gestaltung, Barrierefreiheit oder Leistungswerten dürfen statt durch einen automatisierten Test durch ein datiertes Prüfprotokoll nachgewiesen werden. Herkunft: NEU (vormals QA-F-020).

#### Scenario: Barrierefreiheits-Anforderung
- **WHEN** eine Anforderung Barrierefreiheit betrifft und ein datiertes, geprüftes Protokoll vorliegt
- **THEN** gilt die Anforderung als nachgewiesen, auch ohne automatisierten Test

### Requirement: Automatisierter Test für die Gruppenzuordnungslogik im Stundenplan

Die Gruppenzuordnungslogik im Stundenplan muss mit den Beispielszenarien aus dem Abschnitt „Besonders prüfbedürftige Fachlogik" automatisiert getestet werden. Herkunft: NEU (vormals QA-F-030).

#### Scenario: Wildcard und Bereichsangaben
- **WHEN** `studentSet` eines Termins eine Wildcard, einen Einzelwert oder einen Zeichenbereich mit offener oder gemischter Grenze enthält
- **THEN** deckt ein automatisierter Test den jeweiligen Fall gegen die Beispieltabelle in `openspec/specs/schedule/spec.md` ab

### Requirement: Automatisierter Test für die FBWS-Zeitformat-Umwandlung

Die Umwandlung der FBWS-Zeitfelder in das Format `HHmm` mit führenden Nullen muss automatisiert getestet werden. Herkunft: NEU (vormals QA-F-040).

#### Scenario: Rohwert ohne führende Null
- **WHEN** ein Rohwert wie `800` oder `"800"` als Zeitangabe geliefert wird
- **THEN** wandelt das System ihn automatisiert geprüft in `0800` um

### Requirement: Automatisierter Test für die News-Datumsauswertung

Die Datumsauswertung des News-Feeds muss mit einem Testfall für Zeitangaben ab 13:00 Uhr automatisiert getestet werden. Herkunft: NEU (vormals QA-F-050). Grund: belegter Fehler in der Alt-App, 12-Stunden-Muster `hh` statt 24-Stunden-Muster `HH` bei Rohdaten ohne AM/PM-Angabe.

#### Scenario: Nachmittagszeit
- **WHEN** der Rohwert `"24.08.2026 - 14:30:00"` ausgewertet wird
- **THEN** ergibt das System 14:30 Uhr, nicht vormittags fehlinterpretiert

### Requirement: Automatisierter Test für die Normalisierung von Gerichtsbezeichnungen

Die Normalisierung von Gerichtsbezeichnungen für die Bewertungsfunktion muss automatisiert getestet werden. Herkunft: NEU (vormals QA-F-060).

#### Scenario: Uneinheitliche Rohtitel
- **WHEN** Rohtitel mit inline stehenden, tagesabhängigen Zusatzstoff-Codes vorliegen
- **THEN** normalisiert das System sie automatisiert geprüft auf dasselbe Bewertungsziel

### Requirement: Vertragstest gegen Fremdsysteme

Für die in der Capability `integrations` als Kernsysteme geführten Schnittstellen (FBWS-Ressourcen, Mensa-Feed) sollte ein Vertragstest oder eine Schemaänderungs-Erkennung bestehen, der bzw. die bei struktureller Abweichung von der dort dokumentierten Antwortstruktur fehlschlägt. Herkunft: NEU (vormals QA-N-070).

#### Scenario: Geänderte Antwortstruktur
- **WHEN** ein Fremdsystem ein Feld entfernt, seinen Typ ändert oder einen unerwarteten Wert liefert
- **THEN** schlägt der Vertragstest sichtbar fehl, statt die Abweichung stillschweigend weiterzuverarbeiten

### Requirement: Keine doppelten Anforderungs-Titel im Bestand

Es dürfen keine doppelten Requirement-Titel innerhalb derselben Capability vorkommen. Herkunft: NEU (vormals QA-N-080, dort auf Anforderungs-IDs bezogen; mit ADR 0019 auf Requirement-Titel übertragen).

#### Scenario: Doppelter Titel
- **WHEN** zwei Requirements in derselben `spec.md` denselben Titel tragen
- **THEN** meldet die Prüfung aus `tools/spec-check` einen Verstoß

### Requirement: Herkunftsnachweis ist Pflicht

Jedes Requirement muss genau eine Herkunftsmarkierung tragen (`Alt: <pfad>:<zeile>`, `NEU`, `Android: unbekannt`, `Alt: bewusst verworfen` oder `Recherche: <Quelle>, <Datum>`, siehe `specs/README.md` Abschnitt 6). Herkunft: NEU (vormals QA-N-090).

#### Scenario: Requirement ohne Herkunftssatz
- **WHEN** ein Requirement-Text keinen der fünf zulässigen Herkunftssätze enthält
- **THEN** meldet `tools/spec-check` einen Verstoß

### Requirement: Referenzen zeigen auf existierende Ziele

Jeder Verweis auf eine andere Capability, ein anderes Requirement oder eine ADR muss auf ein tatsächlich existierendes Ziel zeigen. Herkunft: NEU (vormals QA-N-110).

#### Scenario: Verweis auf entfernte Capability
- **WHEN** ein Requirement-Text auf eine Capability verweist, die nicht mehr unter `openspec/specs/` existiert
- **THEN** meldet `tools/spec-check` einen Verstoß

### Requirement: Lint-Nachweis für Architektur-Constraints

Ein Architektur-Constraint, das sich nicht sinnvoll als Verhaltenstest prüfen lässt, darf stattdessen durch eine Lint-Regel oder statische Analyse nachgewiesen werden. Herkunft: NEU (vormals QA-N-115).

#### Scenario: Modulschnitt-Vorgabe
- **WHEN** ein Requirement eine Vorgabe zum Modulschnitt oder zur Wiederverwendung enthält
- **THEN** genügt eine Lint-Regel (`app/eslint.config.js`) oder ein statischer Test (`app/src/architecture.test.ts`) als Nachweis

### Requirement: Vollständige Prüfliste vor Umsetzungsstatus

Bevor eine Anforderung als umgesetzt gilt, muss die Prüfliste aus `CLAUDE.md`, Abschnitt „Definition of Done" vollständig erfüllt sein. Herkunft: NEU (vormals QA-F-120).

#### Scenario: Unvollständige Prüfliste
- **WHEN** mindestens ein Punkt der Definition of Done fehlt
- **THEN** gilt die Anforderung nicht als umgesetzt

### Requirement: Fortlaufende Schwachstellenprüfung der Abhängigkeiten

Das System muss Abhängigkeiten aus dem npm- und dem NuGet-Ökosystem fortlaufend automatisiert auf bekannte Schwachstellen prüfen. Herkunft: NEU (vormals QA-N-120).

#### Scenario: Neue bekannte Schwachstelle
- **WHEN** Dependabot eine neue Schwachstelle in einer Abhängigkeit meldet
- **THEN** entsteht automatisiert ein Update-Pull-Request

### Requirement: CI-Gate bei neu eingeführter Schwachstelle

Wenn ein Pull Request eine Abhängigkeit mit bekannter Schwachstelle ab Schweregrad hoch einführt, muss die CI-Pipeline den Merge blockieren. Herkunft: NEU (vormals QA-F-130).

#### Scenario: Neue Abhängigkeit mit hoher Schwachstelle
- **WHEN** ein Pull Request eine npm- oder NuGet-Abhängigkeit mit einer nicht in `app/audit-ci.jsonc` triagierten Schwachstelle ab Schweregrad hoch einführt
- **THEN** blockiert `audit-ci` bzw. `dotnet list package --vulnerable` den Merge

### Requirement: Statische Sicherheitsanalyse und Geheimnis-Scan bei jedem Pull Request

Das System muss den Quellcode bei jedem Pull Request automatisiert auf verbreitete Sicherheitsmuster sowie auf versehentlich eingecheckte Geheimnisse prüfen. Herkunft: NEU (vormals QA-N-140).

#### Scenario: Eingechecktes Geheimnis
- **WHEN** ein Push ein Muster enthält, das wie ein API-Schlüssel oder Token aussieht
- **THEN** blockiert GitHub Secret Scanning / Push Protection den Push bzw. meldet den Fund

### Requirement: Softwarestückliste je Release

Das System sollte zu jedem veröffentlichten Stand eine Softwarestückliste erzeugen und als Release-Artefakt bereitstellen. Herkunft: NEU (vormals QA-N-150).

#### Scenario: Veröffentlichter Stand
- **WHEN** ein Release veröffentlicht wird
- **THEN** liegt eine SBOM (SPDX-Export aus dem GitHub Dependency Graph) als Release-Artefakt bei

## Teststufen und Ausnahmen

| Stufe | Gehört hinein | Gehört nicht hinein |
|---|---|---|
| Fachlogik ohne UI | reine Funktionen/Module: Gruppenzuordnung, Zeitformat-Umwandlung, Datumsparsing, Normalisierung von Gerichtsbezeichnungen, Zwischenspeicher-Regeln | Netzwerkaufrufe, Rendering, Navigation |
| Komponenten | einzelne UI-Komponenten mit Props/State; Lade-, Leer-, Fehler- und Offline-Zustand je Komponente | echte Netzwerkaufrufe, vollständige Nutzerflüsse |
| Zusammenspiel mit Fremdsystemen über Attrappen | Anfrage-/Antwortverarbeitung gegen die in `integrations` geführten Systeme mit aufgezeichneten oder simulierten Antworten, Vertragstests | echte externe Systeme, UI-Interaktion |
| Durchgängige Abläufe auf dem Gerät | vollständige Nutzerflüsse über mehrere Bildschirme, auf echtem oder simuliertem Gerät | Detailprüfung einzelner Fachlogik-Sonderfälle |

Ausnahmen von der zwingenden Testpflicht: Gestaltung/Barrierefreiheit (Prüfprotokoll statt Test zulässig), Leistungswerte (Prüfprotokoll oder Messung mit dokumentierter Methode), Architektur-Constraints (Lint-Regel statt Verhaltenstest).

## Besonders prüfbedürftige Fachlogik

| Bereich | Quelle | Warum pflichtbedürftig | Beispieldaten/Sonderfälle |
|---|---|---|---|
| Gruppenzuordnung im Stundenplan | `alte apps/fb4_app-main/fb4_app-main/lib/areas/schedule/viewmodels/schedule_overview_viewmodel.dart:209-252` (`isGroupInScheduleItem`) | Bereichslogik über `studentSet` mit mehreren Sonderfällen, im Altcode schwer nachzuvollziehen und dadurch fehleranfällig. Eigene Prüfung deckte zusätzliche Verdachtsmomente auf: Zeile 216 vergleicht `info.groupNumber` (eine Ziffer) statt `info.groupLetter` mit dem ersten Zeichen des `studentSet` bei Einzelwerten; Zeile 210 prüft `groupLetter == "" \|\| groupLetter == ""` — dieselbe Bedingung doppelt, vermutlich ein Kopierfehler | Keine Gruppenkennung → alle Termine sichtbar; Einzelwert-`studentSet` z. B. `C8`; Wildcard `*`; Bereich `A1-C9` mit Gruppen `B5` (innerhalb), `A0` (unter Untergrenze), `C10` (über Obergrenze), `D2` (außerhalb); Bereich mit offener Grenze z. B. `A-C9`. Ergänzt um real vorkommende Formen (FBWS live abgefragt, 2026-09-04): Einzelwert ohne Zahl (`A`, `D`), Bereich ohne Zahlen an beiden Grenzen (`A-P`, `M-N`, `C-D`) und Bereich mit gemischten Grenzen (`C5-E`, `J-M4`, `H5-J`). Maßgeblich ist die vollständige Beispieltabelle in `openspec/specs/schedule/spec.md` |
| Zeitformat-Umwandlung `HHmm` | Capability `integrations` | Rohwerte kommen ohne führende Nullen und wahlweise als Zahl oder String; Stundenplan und Raumsuche bauen beide darauf auf | `800` → `0800`; `930` → `0930`; `1215` unverändert; numerischer Wert `800` vs. String `"800"` |
| Datumsauswertung News-Feed | `alte apps/fb4_app-main/fb4_app-main/lib/areas/news/models/news_item.dart:26` | Belegter Fehler in der Alt-App: 12-Stunden-Muster `hh` statt 24-Stunden-Muster `HH`, obwohl die Rohdaten keine AM/PM-Angabe enthalten | `"24.08.2026 - 14:30:00"` muss als 14:30 Uhr ausgewertet werden, nicht als vormittags fehlinterpretiert |
| Normalisierung der Gerichtsbezeichnungen | Capability `canteen-ratings`, Rohdaten aus Capability `integrations` (`title.de`) | Neue Fachlogik ohne Vorbild in der Alt-App; uneinheitliche Roh-Titel würden dasselbe Gericht an verschiedenen Tagen als unterschiedliche Bewertungsziele behandeln | konkrete Normalisierungsregeln definiert die Capability `canteen-ratings`; hier nur als Pflicht-Testbereich benannt |
| Kategoriezuordnung im Speiseplan | Capability `canteen`, Rohdaten aus Capability `integrations` (`counterNames`, `counter`, `category`) | Nicht jeder Verbrauchsort liefert eine anzeigbare Kategorie; ein roher Zahlencode als Überschrift ist für die Nutzerin bedeutungslos, ein weggefallenes Gericht ein stiller Datenverlust | Regelfall mit `counterNames{de,en}`; nur `counter` ohne `counterNames`; „Beilagen" (getrennt, ans Ende); Food Fakultät (Kennung 474): `counter` fehlt, `counterNames` `null`, nur nicht auflösbarer `category`-Code → alle Gerichte in einer Sammelgruppe ohne Überschrift, keines fällt weg |
| Zusammenfassung der Gerichtsliste über mehrere Mensen | Capability `canteen`, je Mensa gelieferte Tagespläne | Neue Fachlogik: dieselben Gerichte an mehreren gewählten Mensen werden zu einem Eintrag zusammengezogen; falsche Auflösung führt zu doppelten Einträgen oder falschen Preisen | Gericht nur an einer Mensa; Gericht an zwei Mensen mit gleichem Preis → ein Eintrag, beide Mensen genannt; Gericht an zwei Mensen mit abweichendem Preis → ein Eintrag, Angaben der maßgeblichen Mensa; aktive Mensa führt das Gericht nicht → maßgeblich ist die erste anbietende; Wochenende ohne Angebot beim Blättern übersprungen |

## Prüfungen am Anforderungsbestand selbst

| Regel | Wie geprüft |
|---|---|
| Keine doppelten Requirement-Titel je Capability | `tools/spec-check` sammelt alle Requirement-Titel aus `openspec/specs/**/spec.md` und meldet Duplikate |
| Jedes Requirement trägt genau eine Herkunftsmarkierung | `tools/spec-check` prüft jeden Requirement-Text auf genau eines der fünf zulässigen Muster |
| Alle Verweise zeigen auf existierende Ziele | `tools/spec-check` prüft referenzierte Capabilities und ADRs gegen den tatsächlichen Bestand |
| Struktur von Proposal, Spec-Delta, Design, Tasks | `openspec validate` |

Kontrolle: automatisierte CI-Pipeline, nicht eine benannte Kontrollperson (Entscheidung FSR FB4, 2026-08-25) — überlebt den jährlichen Wechsel der FSR-Besetzung zuverlässiger als eine an eine Person gebundene Prüfpflicht. Die Pipeline läuft bei jedem Pull Request; ein Verstoß blockiert den Merge.

## Dependency- und Security-Scanning

Reines Ausführungsdetail der oben beschlossenen Philosophie, keine neue Architekturentscheidung mit echten Grundsatzalternativen. Ausschließlich kostenlose, GitHub-native Bausteine, da das Repository ohnehin öffentlich und MIT-lizenziert ist.

| Werkzeug | Zweck | Wirkung bei Verstoß |
|---|---|---|
| Dependabot (`.github/dependabot.yml`, npm + NuGet) | Alerts und automatische Update-Pull-Requests für bekannte Schwachstellen | Hintergrundmechanismus, blockiert nichts direkt |
| CI-Audit-Gate npm (`audit-ci --high` mit datierter Allowlist, `app/audit-ci.jsonc`) | Verhindert, dass eine PR eine neu bekannte Schwachstelle einführt | blockiert den Merge |
| CI-Audit-Gate NuGet (`dotnet list package --vulnerable --include-transitive`) | wie oben, für das NuGet-Ökosystem | blockiert den Merge |
| CodeQL | Statische Sicherheitsanalyse (SAST) | Ergebnisse als PR-Check |
| ESLint (`eslint-config-expo` + `no-console`-Regel, `app/eslint.config.js`) | Statische Analyse des App-Codes; die `no-console`-Regel erzwingt, dass kein `console` außerhalb der Fehlerschicht verwendet wird | `npm run lint` im CI-Job `app`, blockiert den Merge |
| GitHub Secret Scanning + Push Protection | Verhindert versehentlich eingecheckte Geheimnisse | blockiert den Push bzw. meldet den Fund |
| GitHub Dependency Graph (SPDX-Export) | Softwarestückliste (SBOM) je veröffentlichtem Stand | Release-Artefakt |

Zur Allowlist des npm-Audit-Gates: Eine frische Expo-Installation (ADR 0009) bringt rund ein Dutzend Advisories ab Schweregrad hoch in reiner Build-Werkzeugkette mit (`metro`, `@expo/cli`, `tar`, `postcss`, `image-size`, `@xmldom/xmldom`), die nicht ins App-Paket gelangen und deren Behebung jeweils einen Expo-SDK-Wechsel erzwingt. Der Bestand dieser bekannten, triagierten Advisories steht — je Eintrag mit GHSA-Kennung, Begründung und Datum — in `app/audit-ci.jsonc`; jede darüber hinausgehende Schwachstelle ab hoch bricht die CI.

## Offene Fragen

- Konkretes Testframework für die Vertragstests/Schemaänderungs-Erkennung (z. B. xUnit/NUnit-basierter Snapshot-Vergleich der dokumentierten FBWS-Antwortstrukturen, da diese Hochschulsysteme keine eigenen Vertragstest-Endpunkte anbieten) — konkrete Bibliothek bei Umsetzung im .NET/C#-Ökosystem zu wählen.
- Migration der bestehenden Anforderungs-ID-Verweise in Testnamen auf Requirement-Titel (ADR 0019, offener Punkt) — Umfang und Zeitpunkt noch offen.

Korrektes Sollverhalten der Gruppenzuordnungs-Sonderfälle (Wildcard `*`, Einzelwert-`studentSet`) ist bereits in `openspec/specs/schedule/spec.md` verbindlich festgelegt — keine offene Frage mehr, hier nur zur Einordnung erwähnt.
