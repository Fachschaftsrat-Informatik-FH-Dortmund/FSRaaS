# Spezifikations-Handbuch

Dieses Handbuch legt fest, wie Spezifikationen (Specs) für die FB4-App geschrieben, gepflegt und mit dem Code verbunden werden. Es gilt für alle Dateien unterhalb von `specs/`.

## 1. Zweck des spec-anchored Ansatzes

Eine Spec ist hier kein Dokument, das vor der Implementierung entsteht und danach veraltet. Sie ist die **Quelle der Wahrheit über die gesamte Lebensdauer eines Features** — von der ersten Idee über die Umsetzung bis zur Ablösung.

Das bedeutet konkret:

- Eine Anforderung wird geschrieben, bevor der zugehörige Code entsteht oder geändert wird.
- Ändert sich das Verhalten des Systems, wird zuerst die Spec angepasst, danach der Code.
- Eine Spec wird **nicht gelöscht**, wenn ein Feature fertig ist. Sie wechselt in den Status `implemented` und bleibt danach die maßgebliche Beschreibung dessen, was der Code tut.
- Jede Anforderung ist über eine ID mit Tests und Quellverzeichnissen verknüpft (siehe Abschnitt 7 „Anker zwischen Spec und Code"). Dadurch lässt sich jederzeit prüfen, ob Spec und Code noch übereinstimmen.

Der Ansatz ist bewusst aufwendiger als eine einmalige Anforderungsliste. Er zahlt sich aus, sobald das Projekt mehrere Mitwirkende, mehrere Iterationen und einen langlebigen Betrieb hat — alles Eigenschaften, die für eine FSR-App über mehrere Studienjahre hinweg zutreffen.

## 2. Verzeichnisstruktur

```
specs/
├── README.md                          diese Datei
├── _templates/
│   ├── feature-spec.md                Kopiervorlage für eine neue Feature-Spec
│   └── adr.md                         Kopiervorlage für eine Architekturentscheidung (ADR)
├── product/
│   ├── vision.md                      Produktvision, Zielgruppen, Abgrenzung zu den Alt-Apps
│   ├── glossary.md                    Domänenglossar, verbindliche Begriffsdefinitionen
│   └── legacy-inventory.md            Bestandsaufnahme der Alt-Apps: Funktionsumfang, Quellenlage
├── platform/                          Querschnittsthemen, die mehrere Features betreffen
│   ├── architecture.md                (ARCH) Systemarchitektur, Modulschnitt, Technologiewahl
│   ├── backend-and-api.md             (API) eigenes Backend, dessen API-Vertrag
│   ├── identity-and-moderation.md     (IDENT) Nutzeridentität, Anonymität, Moderation von Community-Inhalten
│   ├── data-and-storage.md            (DATA) Datenmodelle, Persistenz, Datenhaltung geräteseitig/serverseitig
│   ├── integrations.md                (INT) Schnittstellenregister — siehe Abschnitt „Die wichtigste Datei"
│   ├── security-and-privacy.md        (SEC) Sicherheits- und Datenschutzanforderungen
│   ├── ux-and-theming.md              (UX) Gestaltung, Barrierefreiheit, Corporate Design
│   ├── non-functional.md              (NFR) Leistungs-, Verfügbarkeits- und Kompatibilitätsanforderungen
│   └── quality-and-testing.md         (QA) Teststrategie, Qualitätssicherung, Release-Kriterien
├── features/                          eine Spec je fachlichem Feature
│   ├── app-shell/spec.md              (SHELL)
│   ├── room-finder/spec.md            (RAUM)
│   ├── schedule/spec.md               (SCHED)
│   ├── canteen/spec.md                (MENSA)
│   ├── canteen-ratings/spec.md        (RATE)
│   ├── news/spec.md                   (NEWS)
│   ├── events/spec.md                 (EVENT)
│   ├── event-volunteers/spec.md       (HELFER)
│   ├── wiki/spec.md                   (WIKI)
│   ├── semester-ticket/spec.md        (TICKET)
│   ├── grades/spec.md                 (NOTEN)
│   └── settings/spec.md               (SET)
├── decisions/                         Architecture Decision Records (ADR), fortlaufend nummeriert
│   └── 0001-…, 0002-…, …
└── open-questions.md                  projektweite offene Fragen ohne festen Platz in einer Einzel-Spec
```

Jede Feature-Spec liegt als `spec.md` in einem eigenen Ordner unter `features/<feature-id>/`, damit später weitere Dateien zum selben Feature (z. B. Entwürfe, Diagramme) daneben abgelegt werden können, ohne die Spec-Datei selbst zu verschieben.

## 3. Lebenszyklus

Jede Spec durchläuft, im Frontmatter-Feld `status`, folgende Zustände:

| Status | Bedeutung | Übergang ausgelöst durch |
|---|---|---|
| `draft` | Anforderungen werden erarbeitet oder überarbeitet. Inhalte können sich noch grundlegend ändern. Ausgangszustand jeder neuen Spec. | Anlegen der Spec-Datei aus dem Template. |
| `accepted` | Anforderungen sind fachlich und technisch abgestimmt und verbindlich. Die Umsetzung ist geplant oder begonnen, der Code deckt die Spec aber noch nicht vollständig ab. | Freigabe durch den Owner der Spec (fachlich FSR FB4, technisch die zuständige Entwicklung) — üblicherweise im Rahmen eines Reviews. |
| `implemented` | Die im Code vorhandene Umsetzung wird durch Tests mit Anforderungs-ID-Bezug nachgewiesen (siehe Abschnitt 7). `implemented_in` ist gefüllt. | Der Merge, der die Umsetzung liefert. Dieser Merge aktualisiert Spec und Code gemeinsam (siehe Merge-Regel in Abschnitt 7). |
| `deprecated` | Das Feature entfällt oder wurde durch etwas anderes abgelöst. Die Spec-Datei bleibt bestehen, einzelne Anforderungen bleiben mit Status „entfallen" und Begründung sichtbar (siehe Abschnitt 4). | Produktentscheidung, dokumentiert idealerweise als ADR unter `decisions/`. |

Eine Spec wird **zu keinem Zeitpunkt gelöscht**. Entfällt ein ganzes Feature, wechselt die gesamte Spec auf `deprecated` mit einer Begründung im Dokument selbst; entfällt nur eine einzelne Anforderung innerhalb einer sonst weiter gültigen Spec, bleibt die Spec in ihrem Status und nur die betroffene Anforderung wird als „entfallen" markiert.

## 4. Anforderungs-IDs

Jede prüfbare Anforderung erhält eine ID nach dem Schema:

```
<PREFIX>-F-###   funktionale Anforderung
<PREFIX>-N-###   nicht-funktionale Anforderung
```

Regeln:

- `###` ist dreistellig und wird in **Zehnerschritten ab `010`** vergeben (`010`, `020`, `030`, …), damit später zwischen zwei bestehenden Anforderungen eine neue eingeschoben werden kann (`015` zwischen `010` und `020`), ohne andere IDs zu verändern.
- IDs werden **nie neu vergeben oder umnummeriert** — auch nicht, wenn eine Anforderung entfällt. Eine einmal vergebene ID bleibt für immer für genau diese Anforderung reserviert.
- Entfällt eine Anforderung, wird sie nicht gelöscht, sondern erhält den Status `entfallen` mit Begründung, in der Spec-Datei sichtbar stehend.

Präfix je Themenbereich, verbindlich für das gesamte Projekt:

| Präfix | Bereich | Datei |
|---|---|---|
| ARCH | Architektur | `platform/architecture.md` |
| API | Backend & Schnittstelle | `platform/backend-and-api.md` |
| IDENT | Identität & Moderation | `platform/identity-and-moderation.md` |
| DATA | Daten & Persistenz | `platform/data-and-storage.md` |
| INT | Externe Systeme | `platform/integrations.md` |
| SEC | Sicherheit & Datenschutz | `platform/security-and-privacy.md` |
| UX | Gestaltung & Barrierefreiheit | `platform/ux-and-theming.md` |
| NFR | Nicht-funktionale Anforderungen | `platform/non-functional.md` |
| QA | Qualität & Test | `platform/quality-and-testing.md` |
| SHELL | App-Rahmen & Navigation | `features/app-shell/spec.md` |
| RAUM | Raumsuche | `features/room-finder/spec.md` |
| SCHED | Stundenplan | `features/schedule/spec.md` |
| MENSA | Mensaplan | `features/canteen/spec.md` |
| RATE | Mensa-Bewertungen | `features/canteen-ratings/spec.md` |
| NEWS | News | `features/news/spec.md` |
| EVENT | Event-Kalender | `features/events/spec.md` |
| HELFER | Helfer-Anmeldung | `features/event-volunteers/spec.md` |
| WIKI | Wiki-Anbindung | `features/wiki/spec.md` |
| TICKET | Semesterticket | `features/semester-ticket/spec.md` |
| NOTEN | Notenübersicht | `features/grades/spec.md` |
| SET | Einstellungen | `features/settings/spec.md` |

Sonderfall `INT`: Das Schnittstellenregister nummeriert seine Einträge nicht als funktionale/nicht-funktionale Anforderungen, sondern als einfache Liste von Schnittstellen: `INT-001`, `INT-002`, … (kein `F`/`N`-Teil, keine Zehnerschritte). Der Grund: Ein Registereintrag beschreibt eine Schnittstelle als Ganzes, nicht eine einzelne prüfbare Systemreaktion.

## 5. EARS-Formulierungsmuster

Jede Anforderung folgt einem der folgenden Muster (EARS — Easy Approach to Requirements Syntax, hier auf Deutsch). Jedes Muster erzeugt genau eine Aussage, die für sich allein geprüft werden kann.

| Muster | Form | Beispiel |
|---|---|---|
| Ubiquitär (immer gültig) | Das System muss `<Reaktion>`. | MENSA-F-010 — Das System muss den Speiseplan des aktuellen Tages für die zuletzt gewählte Mensa anzeigen. |
| Ereignisgesteuert | Wenn `<Auslöser>`, dann muss das System `<Reaktion>`. | SCHED-F-140 — Wenn die Nutzerin eine Gruppenkennung angibt, dann muss das System nur Termine anzeigen, deren `studentSet` diese Kennung einschließt. |
| Zustandsabhängig | Solange `<Zustand>`, muss das System `<Reaktion>`. | MENSA-F-050 — Solange keine Netzwerkverbindung besteht, muss das System den zuletzt geladenen Speiseplan anzeigen. |
| Unerwünschte Bedingung / Fehlerfall | Falls `<Bedingung>`, muss das System `<Reaktion>`. | NEWS-F-030 — Falls der News-Dienst nicht erreichbar ist, muss das System eine Fehlermeldung mit Wiederholen-Option anzeigen. |
| Optionales Verhalten | Sofern `<Merkmal vorhanden>`, muss das System `<Reaktion>`. | WIKI-F-060 — Sofern ein API-Token für das Wiki hinterlegt ist, muss das System Wiki-Seiten direkt in der App anzeigen. |

Verbindlichkeit der Modalverben:

- **muss** — verbindlich, ohne Ausnahme umzusetzen.
- **sollte** — empfohlen; Abweichung ist möglich, aber zu begründen.
- **kann** — optional; Umsetzung liegt im Ermessen.

Jede Anforderung enthält **genau eine Aussage**. Mehrere Bedingungen oder Reaktionen in einem Satz werden in mehrere Anforderungen mit eigenen IDs aufgeteilt, damit jede für sich geprüft und getestet werden kann.

## 6. Herkunftsnachweis

Jede Anforderung endet mit genau einer der folgenden Markierungen:

| Markierung | Bedeutung |
|---|---|
| `[Alt: <pfad>:<zeile>]` | Aus dem Verhalten der Alt-App abgeleitet; Fundstelle im Alt-Code angegeben. |
| `[NEU]` | Neuentwicklung ohne Vorbild in einer der Alt-Apps. |
| `[Android: unbekannt]` | Vermutete Funktion der abgelösten Android-App, deren Quellcode nicht vorliegt. Beruht auf Indizien (z. B. Nutzerberichten, Store-Beschreibung, Analogieschluss aus der iOS-App) und ist entsprechend unsicher. |
| `[Alt: bewusst verworfen]` | Verhalten, das in der Alt-App vorhanden war, aber absichtlich nicht übernommen wird. |

Grund für diese Regel: Ein erheblicher Teil der Bestandsanforderungen wurde nicht aus einem bestehenden Lastenheft übernommen, sondern **aus dem Code der alten App rückwärts erschlossen** (Reverse Engineering). Diese Ableitung ist fehleranfällig — Code-Verhalten und beabsichtigtes Verhalten fallen nicht immer zusammen, wie der Datumsfehler in INT-003 zeigt. Die Markierung macht sichtbar, welche Anforderungen auf einer solchen Ableitung beruhen, mit welcher Unsicherheit (Quellcode vorhanden vs. nur vermutet) und wo eine bewusste Abweichung vom Altverhalten vorliegt. Das erlaubt es, Ableitungsfehler gezielt zu prüfen, statt ihnen dieselbe Sicherheit wie einer Neuanforderung zuzuschreiben.

## 7. Die drei Anker zwischen Spec und Code

Der spec-anchored Ansatz funktioniert nur, wenn Spec und Code nachweisbar zusammenhängen. Dafür gibt es drei Mechanismen:

1. **Frontmatter `implemented_in:`** — verweist auf die Quellverzeichnisse, die eine Spec umsetzen. Wird gefüllt, sobald der Status auf `implemented` wechselt, und bei jeder strukturellen Änderung der Umsetzung gepflegt.
2. **Testnamen tragen die Anforderungs-ID**, z. B. `describe('SCHED-F-140 Gruppenzuordnung bei Bereichsangabe', …)`. Dadurch ist jede Anforderung nachweisbar durch mindestens einen Test geprüft. Wird eine Anforderung aus der Spec entfernt, ohne dass der zugehörige Test entfernt oder umbenannt wird, fällt das als toter, nicht mehr zuordenbarer Test auf — ein Signal, dass Spec und Code auseinandergelaufen sind.
3. **Kein Merge ohne Spec-Delta oder `spec-unchanged`-Label** — jede Pull Request, die Verhalten ändert, ändert im selben Merge auch die betroffene Spec-Datei (Anforderung ergänzt, geändert oder auf „entfallen" gesetzt, `version` und `last_reviewed` aktualisiert). Ändert eine PR nachweislich kein spezifiziertes Verhalten (z. B. reines Refactoring, Abhängigkeits-Update), wird stattdessen ausdrücklich das Label `spec-unchanged` gesetzt. Ohne eines von beidem wird nicht gemergt.

## 8. Änderungsregeln

Jede Spec trägt im Frontmatter `version` (semantische Versionierung) und `last_reviewed` (Datum der letzten inhaltlichen Prüfung).

`version` wird erhöht:

- **Patch** (`0.1.0` → `0.1.1`) — Präzisierung ohne Verhaltensänderung, z. B. Formulierung geschärft, Beispiel ergänzt, Tippfehler behoben.
- **Minor** (`0.1.0` → `0.2.0`) — neue Anforderung ergänzt, bestehendes Verhalten aber unverändert.
- **Major** (`0.1.0` → `1.0.0`, bzw. `1.x.0` → `2.0.0`) — bestehendes Verhalten geändert oder entfernt (Anforderung auf „entfallen" gesetzt oder inhaltlich widersprüchlich zur Vorversion geändert).

`last_reviewed` wird bei jeder inhaltlichen Änderung auf das Datum dieser Änderung gesetzt sowie bei jeder turnusmäßigen Durchsicht ohne inhaltliche Änderung.

Der im Frontmatter genannte `owner` ist verantwortlich für die inhaltliche Richtigkeit der Spec und für die Durchsicht bei jeder Änderung. Bei Uneinigkeit über eine Änderung entscheidet der Owner der jeweiligen Datei; bei Querschnittsthemen (`platform/`) ist das in der Regel die technische Leitung des Projekts, bei fachlichen Features (`features/`) der FSR FB4.

## 9. Schreibweise und Dichte

Specs werden von Menschen gelesen **und** von KI-Werkzeugen verarbeitet. Beides verlangt dieselbe Eigenschaft: hohe Informationsdichte bei klarer Struktur. Ausschweifender Fließtext schadet beiden — er kostet Lesezeit wie Verarbeitungsaufwand und verbirgt die eigentliche Aussage.

| Regel | Vorgabe |
|---|---|
| Anforderungen | Immer als Tabelle mit den Spalten `ID`, `Anforderung`, `Herkunft`. Eine Zeile je Anforderung, nie als Fließtext-Absatz. |
| Fließtext | Höchstens drei bis fünf Sätze Einleitung je Abschnitt. Keine Zusammenfassungen am Abschnittsende, kein Inhaltsverzeichnis. |
| Mehrere Merkmale je Eintrag | Tabelle statt Aufzählung — etwa Optionen mit Konsequenzen, Datenklassen, Rollenrechte, Befunde. Aufzählungen nur für echte Listen ohne Attribute. |
| Längere Begründung | Eigener kurzer Abschnitt unter der Tabelle mit der Anforderungs-ID als Bezug, nicht in die Tabellenzelle. |
| Wiederholung | Keine. Zwischen Dateien wird verwiesen, nicht dupliziert. Endpunktdetails stehen ausschließlich in `platform/integrations.md`. |

Beispiel einer Anforderungstabelle:

| ID | Anforderung | Herkunft |
|---|---|---|
| SCHED-F-010 | Das System muss den Stundenplan in den fünf Wochentagen Montag bis Freitag darstellen. | Alt: lib/main_page.dart |
| SCHED-F-140 | Wenn die Nutzerin eine Gruppenkennung angibt, dann muss das System nur Termine anzeigen, deren `studentSet` diese Kennung einschließt. | Alt: lib/areas/schedule/viewmodels/schedule_overview_viewmodel.dart:209 |
| SCHED-F-150 | Falls kein Termin zur angegebenen Gruppenkennung passt, muss das System den Tag als leer kennzeichnen und den Grund nennen. | NEU |

In der Tabellenspalte `Herkunft` stehen die Markierungen aus Abschnitt 6 **ohne** eckige Klammern.

Aus der Zeilenform folgt eine nützliche Eigenschaft: Eine Anforderung ist über ihre ID mit einer einzigen Textsuche vollständig auffindbar — `grep -rn "SCHED-F-140" specs/` liefert Anforderung und Herkunft in einer Zeile, ohne dass die gesamte Spec gelesen werden muss. Ein zusätzlicher Anforderungsindex entfällt deshalb bewusst; er wäre eine Dublette und würde veralten.

Ziel ist Dichte, nicht Kürze um jeden Preis. Jede fachliche Aussage bleibt erhalten — sie steht nur knapper und strukturierter da.

## 10. Index aller Specs

Alle geplanten Spec-Dateien des Projekts. Status ist durchgängig `draft`, solange noch kein Inhalt geschrieben wurde. Priorität nur für Feature-Specs: **kern** = für den Ablösungs-Umfang der Alt-Apps essentiell, **bestand** = übernommen, aber nachrangig gegenüber den Kern-Features. Querschnitts-Specs (`platform/`) sowie Produkt- und Prozessdokumente tragen keine Priorität (`–`).

| Datei | Präfix | Priorität | Status |
|---|---|---|---|
| `platform/architecture.md` | ARCH | – | draft |
| `platform/backend-and-api.md` | API | – | draft |
| `platform/identity-and-moderation.md` | IDENT | – | draft |
| `platform/data-and-storage.md` | DATA | – | draft |
| `platform/integrations.md` | INT | – | draft |
| `platform/security-and-privacy.md` | SEC | – | draft |
| `platform/ux-and-theming.md` | UX | – | draft |
| `platform/non-functional.md` | NFR | – | draft |
| `platform/quality-and-testing.md` | QA | – | draft |
| `features/app-shell/spec.md` | SHELL | bestand | draft |
| `features/room-finder/spec.md` | RAUM | kern | draft |
| `features/schedule/spec.md` | SCHED | kern | draft |
| `features/canteen/spec.md` | MENSA | kern | draft |
| `features/canteen-ratings/spec.md` | RATE | kern | draft |
| `features/news/spec.md` | NEWS | kern | draft |
| `features/events/spec.md` | EVENT | kern | draft |
| `features/event-volunteers/spec.md` | HELFER | kern | draft |
| `features/wiki/spec.md` | WIKI | kern | draft |
| `features/semester-ticket/spec.md` | TICKET | bestand | draft |
| `features/grades/spec.md` | NOTEN | bestand | draft |
| `features/settings/spec.md` | SET | bestand | draft |
| `product/vision.md` | – | – | draft |
| `product/glossary.md` | – | – | draft |
| `product/legacy-inventory.md` | – | – | draft |
| `open-questions.md` | – | – | draft |
| `decisions/0001-react-native-als-plattform.md` | – | – | draft |
| `decisions/0002-spec-anchored-arbeitsweise.md` | – | – | draft |
| `decisions/0003-eigenes-backend-fuer-community-funktionen.md` | – | – | draft |
| `decisions/0004-identitaet-und-anmeldung.md` | – | – | draft |
| `decisions/0005-wiki-bookstack-anbindung.md` | – | – | draft |
| `decisions/0006-abloesung-ods-durch-hisinone.md` | – | – | draft |
| `decisions/0007-datenquellen-mensa-und-news.md` | – | – | draft |

Anmerkung zu den ADRs: Nummern und Titel sind durch die Projektplanung festgelegt. `0003`, `0005` und `0006` sind zusätzlich im Schnittstellenregister (`platform/integrations.md`, Einträge INT-008, INT-007, INT-006) referenziert. Alle sieben ADR sind noch nicht geschrieben; sie entstehen im Zuge der Querschnitts-Specs.

## 11. Eine neue Spec anlegen

1. Passende Vorlage aus `_templates/` kopieren (`feature-spec.md` für ein Feature, `adr.md` für eine Architekturentscheidung).
2. Bei einer neuen Feature-Spec: Präfix in der Tabelle in Abschnitt 4 dieser Datei ergänzen und im Index (Abschnitt 10) eintragen.
3. Frontmatter ausfüllen (siehe Template), Status auf `draft` belassen.
4. Erste Anforderungen mit IDs in Zehnerschritten ab `010`, im passenden EARS-Muster, mit Herkunftsmarkierung, formulieren.
