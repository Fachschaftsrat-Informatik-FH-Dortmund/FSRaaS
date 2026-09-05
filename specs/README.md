---
status: accepted
version: 2.0.0
owner: FSR FB4
last_reviewed: 2026-09-05
---

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

Seit ADR 0019 (2026-09-05) wird der fachliche Anforderungsbestand — bisher `specs/features/` und `specs/platform/` — mit dem CLI-Werkzeug **OpenSpec** verwaltet und liegt unter `openspec/specs/` (aktueller Bestand) und `openspec/changes/` (laufende Vorschläge: `proposal.md`, Spec-Delta, `design.md`, `tasks.md`). Dieses Dokument beschreibt weiterhin verbindlich, *was* eine Anforderung ausmacht — EARS-Formulierung (Abschnitt 5) und Herkunftsnachweis (Abschnitt 6) gelten für jedes OpenSpec-Requirement unverändert, nur als Textkonvention statt als eigenes Schema-Feld. Das feste Anforderungs-ID-Schema aus Abschnitt 4 gilt nicht mehr für neue Requirements; siehe ADR 0019 zu Details und offenen Punkten (u. a. Migration bestehender ID-Verweise in Testnamen).

## 2. Verzeichnisstruktur

```
specs/
├── README.md                          diese Datei — Konventionen für Anforderungstext, gilt auch für openspec/specs/
├── _templates/
│   └── adr.md                         Kopiervorlage für eine Architekturentscheidung (ADR)
├── product/
│   ├── vision.md                      Produktvision, Zielgruppen, Abgrenzung zu den Alt-Apps
│   ├── glossary.md                    Domänenglossar, verbindliche Begriffsdefinitionen
│   ├── legacy-inventory.md            Bestandsaufnahme beider Alt-Apps: Funktionsumfang, Mängel
│   ├── whatsapp-feedback-inventory.md Auswertung von WhatsApp-Gruppenchats auf Feature-Hinweise
│   └── roadmap.md                     Zuordnung der Anforderungen zu den Ausbaustufen
├── pruefprotokolle/                   datierte Prüfprotokolle, wo ein Test unverhältnismäßig ist
├── decisions/                         Architecture Decision Records (ADR), fortlaufend nummeriert
│   └── 0001-…, 0002-…, …
└── open-questions.md                  projektweite offene Fragen ohne festen Platz in einer Einzel-Spec

openspec/
├── specs/                             aktueller fachlicher Anforderungsbestand, eine Capability je Ordner
│   ├── architecture/spec.md           vormals platform/architecture.md
│   ├── backend-and-api/spec.md        vormals platform/backend-and-api.md
│   ├── identity-and-moderation/spec.md
│   ├── data-and-storage/spec.md
│   ├── integrations/spec.md           Schnittstellenregister — siehe Abschnitt „Die wichtigste Datei"
│   ├── security-and-privacy/spec.md
│   ├── ux-and-theming/spec.md
│   ├── non-functional/spec.md
│   ├── quality-and-testing/spec.md
│   ├── app-shell/spec.md              — daneben: nutzerfuehrung-konzept.md (Design-Herleitung)
│   ├── room-finder/spec.md, schedule/spec.md, canteen/spec.md, canteen-ratings/spec.md,
│   │   canteen-photos/spec.md, news/spec.md, events/spec.md, event-volunteers/spec.md,
│   │   wiki/spec.md, semester-ticket/spec.md, grades/spec.md, settings/spec.md, e-key/spec.md,
│   │   admin/spec.md                  je ein Ordner pro Feature, vormals specs/features/<feature>/spec.md
│   └── api-contract.yaml              OpenAPI-Vertrag des eigenen Backends, unverändert übernommen
└── changes/                           laufende Änderungsvorschläge (Proposal → Spec-Delta → Design → Tasks → Archive)
```

Die frühere `platform/`-Präfixtabelle (ARCH, API, IDENT, DATA, INT, SEC, UX, NFR, QA) und die Feature-Präfixe (SHELL, RAUM, SCHED, …) sind als Namensgeber der Capability-Ordner unter `openspec/specs/` erhalten, dienen aber nicht mehr als ID-Bestandteil neuer Anforderungen (ADR 0019).

## 3. Lebenszyklus

Jede Spec durchläuft, im Frontmatter-Feld `status`, folgende Zustände:

| Status | Bedeutung | Übergang ausgelöst durch |
|---|---|---|
| `draft` | Anforderungen werden erarbeitet oder überarbeitet. Inhalte können sich noch grundlegend ändern. Ausgangszustand jeder neuen Spec. | Anlegen der Spec-Datei aus dem Template. |
| `accepted` | Anforderungen sind fachlich und technisch abgestimmt und verbindlich. Die Umsetzung ist geplant oder begonnen, der Code deckt die Spec aber noch nicht vollständig ab. | Freigabe durch den Owner der Spec (fachlich FSR FB4, technisch die zuständige Entwicklung) — üblicherweise im Rahmen eines Reviews. |
| `implemented` | Die im Code vorhandene Umsetzung wird durch Tests mit Anforderungs-ID-Bezug nachgewiesen (siehe Abschnitt 7). `implemented_in` ist gefüllt. | Der Merge, der die Umsetzung liefert. Dieser Merge aktualisiert Spec und Code gemeinsam (siehe Merge-Regel in Abschnitt 7). |
| `deprecated` | Das Feature entfällt oder wurde durch etwas anderes abgelöst. Die Spec-Datei bleibt bestehen, einzelne Anforderungen bleiben mit Status „entfallen" und Begründung sichtbar (siehe Abschnitt 4). | Produktentscheidung, dokumentiert idealerweise als ADR unter `decisions/`. |

Eine Spec wird **zu keinem Zeitpunkt gelöscht**. Entfällt ein ganzes Feature, wechselt die gesamte Spec auf `deprecated` mit einer Begründung im Dokument selbst; entfällt nur eine einzelne Anforderung innerhalb einer sonst weiter gültigen Spec, bleibt die Spec in ihrem Status und nur die betroffene Anforderung wird als „entfallen" markiert.

Sonderfall ADRs: `decisions/*.md` verwenden ein eigenes, kleineres Statusvokabular (`vorgeschlagen`, `angenommen`, `abgelöst`, `verworfen`, siehe `_templates/adr.md`) statt der vier Stati oben — ein ADR protokolliert eine getroffene Entscheidung, keine Anforderung mit eigenem Implementierungs-Lebenszyklus. Beide Vokabulare erscheinen bewusst nebeneinander im Index (Abschnitt 10).

Seit ADR 0019 gilt dieses Lebenszyklus-Vokabular (`draft`/`accepted`/`implemented`/`deprecated`) nur noch für Dokumente, die weiterhin unter `specs/` liegen (Produkt- und Prozessdokumente). Für Capability-Specs unter `openspec/specs/` bestimmt der OpenSpec-eigene Change-Workflow den Lebenszyklus: eine Anforderung entsteht als Spec-Delta in einem `openspec/changes/<name>/`-Vorschlag und wird mit `openspec archive` in `openspec/specs/` übernommen — das entspricht sinngemäß dem Übergang von `draft`/`accepted` zu `implemented`. Auch dort gilt unverändert: **nichts wird gelöscht**, ein entfallenes Requirement wird als REMOVED-Delta geführt, nicht entfernt.

## 4. Anforderungs-IDs (historisch — gilt nicht für neue Anforderungen)

Dieses Schema wurde mit ADR 0019 für neue Anforderungen abgelöst; neue Requirements unter `openspec/specs/` tragen OpenSpec-eigene, capability-basierte Titel statt einer ID nach diesem Muster. Abschnitt 4 bleibt hier stehen, weil die rund 40 bestehenden ID-Verweise in Testnamen (`app/`, `backend/`) und in `git`-Historie/Prüfprotokollen dieses Schema weiter voraussetzen, bis die in ADR 0019 offen gelassene Testnamen-Migration erfolgt ist.

Jede prüfbare Anforderung erhielt eine ID nach dem Schema:

```
<PREFIX>-F-###   funktionale Anforderung
<PREFIX>-N-###   nicht-funktionale Anforderung
```

Regeln:

- `###` ist dreistellig und wird in **Zehnerschritten ab `010`** vergeben (`010`, `020`, `030`, …), damit später zwischen zwei bestehenden Anforderungen eine neue eingeschoben werden kann (`015` zwischen `010` und `020`), ohne andere IDs zu verändern.
- IDs werden **nie neu vergeben oder umnummeriert** — auch nicht, wenn eine Anforderung entfällt. Eine einmal vergebene ID bleibt für immer für genau diese Anforderung reserviert.
- Die Zählung läuft **je Teil getrennt**: `-F-` und `-N-` beginnen beide bei `010` und laufen unabhängig voneinander. Im Bestand gibt es Abweichungen davon — in `SEC`, `NFR`, `DATA` und `QA` wurden `-N-`-Nummern historisch in dieselbe Folge eingereiht wie die `-F-`-Nummern (etwa `SEC-N-030` zwischen `SEC-F-020` und `SEC-F-040`). Diese Abweichungen bleiben bestehen, weil IDs nicht umnummeriert werden; neue Anforderungen folgen der getrennten Zählung.
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
| FOTO | Gerichtsfotos | `features/canteen-photos/spec.md` |
| NEWS | News | `features/news/spec.md` |
| EVENT | Event-Kalender | `features/events/spec.md` |
| HELFER | Helfer-Anmeldung | `features/event-volunteers/spec.md` |
| WIKI | Wiki-Anbindung | `features/wiki/spec.md` |
| TICKET | Semesterticket | `features/semester-ticket/spec.md` |
| NOTEN | Notenübersicht | `features/grades/spec.md` |
| SET | Einstellungen | `features/settings/spec.md` |
| EKEY | E-Key-Verwaltung | `features/e-key/spec.md` |
| ADMIN | Verwaltung & Redaktion | `features/admin/spec.md` |

Sonderfall `INT`: Das Schnittstellenregister nummeriert seine Einträge nicht als funktionale/nicht-funktionale Anforderungen, sondern als einfache Liste von Schnittstellen: `INT-001`, `INT-002`, … (kein `F`/`N`-Teil, keine Zehnerschritte). Der Grund: Ein Registereintrag beschreibt eine Schnittstelle als Ganzes, nicht eine einzelne prüfbare Systemreaktion.

## 5. EARS-Formulierungsmuster

Gilt unverändert für jedes Requirement, ob in einem verbliebenen Dokument unter `specs/` oder in einem OpenSpec-Requirement unter `openspec/specs/` (ADR 0019). Die IDs in den folgenden Beispielen sind historisch — neue Requirements tragen keine ID, sondern einen capability-basierten Titel.

Jede Anforderung folgt einem der folgenden Muster (EARS — Easy Approach to Requirements Syntax, hier auf Deutsch). Jedes Muster erzeugt genau eine Aussage, die für sich allein geprüft werden kann.

| Muster | Form | Beispiel |
|---|---|---|
| Ubiquitär (immer gültig) | Das System muss `<Reaktion>`. | MENSA-F-010 — Das System muss den Speiseplan des aktuellen Tages für die zuletzt gewählte Mensa anzeigen. |
| Ereignisgesteuert | Wenn `<Auslöser>`, dann muss das System `<Reaktion>`. | NEWS-F-070 — Wenn eine Push-Benachrichtigung zu einer Meldung angetippt wird, muss das System direkt zur betreffenden Meldung navigieren. |
| Zustandsabhängig | Solange `<Zustand>`, muss das System `<Reaktion>`. | MENSA-F-050 — Solange keine Netzwerkverbindung besteht, muss das System den zuletzt geladenen Speiseplan anzeigen. |
| Unerwünschte Bedingung / Fehlerfall | Falls `<Bedingung>`, muss das System `<Reaktion>`. | NEWS-F-030 — Falls der News-Dienst nicht erreichbar ist, muss das System eine Fehlermeldung mit Wiederholen-Option anzeigen. |
| Optionales Verhalten | Sofern `<Merkmal vorhanden>`, muss das System `<Reaktion>`. | WIKI-F-010 — Sofern ein API-Token für das Wiki hinterlegt ist, muss das System Wiki-Seiten direkt in der App anzeigen. |

Verbindlichkeit der Modalverben:

- **muss** — verbindlich, ohne Ausnahme umzusetzen.
- **sollte** — empfohlen; Abweichung ist möglich, aber zu begründen.
- **kann** — optional; Umsetzung liegt im Ermessen.

Jede Anforderung enthält **genau eine Aussage**. Mehrere Bedingungen oder Reaktionen in einem Satz werden in mehrere Anforderungen mit eigenen IDs aufgeteilt, damit jede für sich geprüft und getestet werden kann.

## 6. Herkunftsnachweis

Gilt unverändert für jede neue Anforderung (ADR 0019). In einem OpenSpec-Requirement steht die Markierung als letzter Satz des Requirement-Texts, ohne eckige Klammern, eingeleitet mit „Herkunft: …" (siehe Beispiel in Abschnitt 9). In verbliebenen `specs/`-Dokumenten gilt weiterhin die Tabellenspalte `Herkunft` wie bisher.

Jede Anforderung endet mit genau einer der folgenden Markierungen (Klammern nur hier zur Benennung, siehe Formatregel oben):

| Markierung | Bedeutung |
|---|---|
| `[Alt: <pfad>:<zeile>]` | Aus dem Verhalten der Alt-App abgeleitet; Fundstelle im Alt-Code angegeben. |
| `[NEU]` | Neuentwicklung ohne Vorbild in einer der Alt-Apps. |
| `[Android: unbekannt]` | Vermutete Funktion der abgelösten Android-App, deren Quellcode nicht vorliegt. Beruht auf Indizien (z. B. Nutzerberichten, Store-Beschreibung, Analogieschluss aus der iOS-App) und ist entsprechend unsicher. |
| `[Alt: bewusst verworfen]` | Verhalten, das in der Alt-App vorhanden war, aber absichtlich nicht übernommen wird. |
| `[Recherche: <Quelle>, <Datum>]` | Auf externer Recherche außerhalb des Alt-Codes beruhend — Live-Abfrage eines Systems, eine Website, ein Store-Eintrag o. Ä. `<Quelle>` benennt die Fundstelle (URL, System, `INT-###`), `<Datum>` den Zeitpunkt der Recherche, da sich der Fund seither geändert haben kann. |

Grund für diese Regel: Ein erheblicher Teil der Bestandsanforderungen wurde nicht aus einem bestehenden Lastenheft übernommen, sondern **aus dem Code der alten App rückwärts erschlossen** (Reverse Engineering). Diese Ableitung ist fehleranfällig — Code-Verhalten und beabsichtigtes Verhalten fallen nicht immer zusammen, wie der Datumsfehler in INT-003 zeigt. Die Markierung macht sichtbar, welche Anforderungen auf einer solchen Ableitung beruhen, mit welcher Unsicherheit (Quellcode vorhanden vs. nur vermutet) und wo eine bewusste Abweichung vom Altverhalten vorliegt. Das erlaubt es, Ableitungsfehler gezielt zu prüfen, statt ihnen dieselbe Sicherheit wie einer Neuanforderung zuzuschreiben.

`[Recherche: …]` unterliegt derselben Unsicherheit wie `[Android: unbekannt]`, nur mit anderer Quelle: Sie stammt nicht aus dem Alt-Code, sondern aus einer Beobachtung außerhalb dieses Repositories zu einem bestimmten Zeitpunkt — vor dem Wechsel von `draft` auf `accepted` ist sie durch den regulären Weg (Spike, Rücksprache mit FSR oder Fachbereich) zu bestätigen, nicht als gesichert zu behandeln, nur weil sie konkreter klingt als `[NEU]`.

## 7. Die Anker zwischen Spec und Code

Der spec-anchored Ansatz funktioniert nur, wenn Spec und Code nachweisbar zusammenhängen. Für Dokumente, die weiterhin unter `specs/` liegen (Produkt-/Prozessdokumente), gelten die drei ursprünglichen Mechanismen unverändert: Frontmatter `implemented_in:`, Anforderungs-ID im Testnamen, kein Merge ohne Spec-Delta oder `spec-unchanged`-Label.

Für Capability-Specs unter `openspec/specs/` (ADR 0019) gilt sinngemäß dasselbe Prinzip, mit OpenSpec-eigenen Mitteln:

1. **Testnamen tragen den Requirement-Titel** statt einer ID, z. B. `describe('Gruppenzuordnung bei Bereichsangabe', …)` mit einem Verweis auf die Capability (`schedule`) im umgebenden Testpfad. Bestehende Tests mit alter ID bleiben vorerst unverändert (ADR 0019, offener Punkt); neue Tests folgen dem Titel.
2. **Kein Merge ohne Spec-Delta** — jede Pull Request, die Verhalten ändert, bringt einen `openspec/changes/<name>/`-Vorschlag mit Spec-Delta (ADDED/MODIFIED/REMOVED) mit, der beim Merge archiviert wird (`openspec archive`). Ändert eine PR nachweislich kein spezifiziertes Verhalten, gilt weiterhin das Label `spec-unchanged`.
3. **`openspec validate`** prüft die strukturelle Konsistenz von Proposal, Spec-Delta, Design und Tasks; Herkunftsnachweis und Querverweis-Integrität prüft weiterhin `tools/spec-check`, umgestellt auf `openspec/specs/**/spec.md`.

## 8. Änderungsregeln

Für Dokumente unter `specs/` gilt unverändert: Frontmatter `version` (semantische Versionierung, s. u.) und `last_reviewed` (Datum der letzten inhaltlichen Prüfung), gepflegt vom im Frontmatter genannten `owner`.

`version` wird erhöht:

- **Patch** (`0.1.0` → `0.1.1`) — Präzisierung ohne Verhaltensänderung, z. B. Formulierung geschärft, Beispiel ergänzt, Tippfehler behoben.
- **Minor** (`0.1.0` → `0.2.0`) — neue Anforderung ergänzt, bestehendes Verhalten aber unverändert.
- **Major** (`0.1.0` → `1.0.0`, bzw. `1.x.0` → `2.0.0`) — bestehendes Verhalten geändert oder entfernt (Anforderung auf „entfallen" gesetzt oder inhaltlich widersprüchlich zur Vorversion geändert).

Für Capability-Specs unter `openspec/specs/` schreibt OpenSpec kein Frontmatter-Schema vor; Version und Prüfdatum ergeben sich aus der Historie der archivierten Changes (`openspec/changes/archive/`). Ein Kopf mit `Owner:` und `Zuletzt geprüft:` wird als Konvention weitergeführt (siehe Beispiel in Abschnitt 9), ist aber kein von `openspec validate` erzwungenes Feld.

## 9. Schreibweise und Dichte

Specs werden von Menschen gelesen **und** von KI-Werkzeugen verarbeitet. Beides verlangt dieselbe Eigenschaft: hohe Informationsdichte bei klarer Struktur. Ausschweifender Fließtext schadet beiden — er kostet Lesezeit wie Verarbeitungsaufwand und verbirgt die eigentliche Aussage. Das gilt für beide Formate.

### In verbliebenen `specs/`-Dokumenten (Produkt-/Prozessdokumente, ADRs)

| Regel | Vorgabe |
|---|---|
| Anforderungen | Immer als Tabelle mit den Spalten `ID`, `Anforderung`, `Herkunft`. Eine Zeile je Anforderung, nie als Fließtext-Absatz. |
| Fließtext | Höchstens drei bis fünf Sätze Einleitung je Abschnitt. Keine Zusammenfassungen am Abschnittsende, kein Inhaltsverzeichnis. |
| Mehrere Merkmale je Eintrag | Tabelle statt Aufzählung. Aufzählungen nur für echte Listen ohne Attribute. |
| Wiederholung | Keine. Zwischen Dateien wird verwiesen, nicht dupliziert. |

### In OpenSpec-Capability-Specs (`openspec/specs/`)

Ein Requirement ist eine Überschrift mit „muss"/„sollte"/„kann" im EARS-Muster (Abschnitt 5), gefolgt vom Herkunftssatz (Abschnitt 6) und mindestens einem `#### Scenario:`-Block, der die Prüfbarkeit sicherstellt:

```
### Requirement: Gruppenzuordnung bei Bereichsangabe

Wenn `studentSet` eines Termins einen Zeichenbereich trägt, muss das System diesen Termin
für jede innerhalb des Bereichs liegende Gruppenkennung anzeigen. Herkunft: NEU.

#### Scenario: Gruppenkennung innerhalb des Bereichs
- **WHEN** ein Termin mit `studentSet` `A1-C9` vorliegt und die Nutzerin der Gruppe `B5` zugeordnet ist
- **THEN** zeigt das System den Termin an
```

(Format nach `openspec templates` — Requirement-Überschrift, Fließtext mit EARS-Satz und Herkunft, mindestens ein `#### Scenario:`-Block mit **WHEN**/**THEN**.)

Endpunktdetails stehen weiterhin ausschließlich in der Capability `integrations` (vormals `platform/integrations.md`); Feature-Capabilities verweisen nur auf deren Requirement-Titel bzw. die historische `INT-###`-Nummer im Herkunftssatz.

Ziel ist Dichte, nicht Kürze um jeden Preis. Jede fachliche Aussage bleibt erhalten — sie steht nur knapper und strukturierter da.

## 10. Index aller Specs

Seit ADR 0019 in zwei Teile geteilt: der fachliche Anforderungsbestand unter `openspec/specs/`, verwaltet mit OpenSpec; die verbliebenen Dokumente unter `specs/` (Produkt, Prozess, Entscheidungen), weiterhin mit dem Lebenszyklus aus Abschnitt 3.

### 10.1 `openspec/specs/` (Capability-Specs)

Priorität nur für Feature-Capabilities: **kern** = für den Ablösungs-Umfang der Alt-Apps essentiell, **bestand** = übernommen, aber nachrangig, **ausbau** = ohne Vorbild in den Alt-Apps und über deren Umfang hinausgehend. Vormalige Präfixe stehen zur Einordnung, sind aber kein ID-Bestandteil mehr. Der aktuellste Stand einer Capability ist immer `openspec/specs/<name>/spec.md` selbst — diese Tabelle dient nur der Übersicht, nicht als Statusfeld (OpenSpec kennt kein `status:`-Frontmatter).

| Capability | vormaliger Präfix | Priorität | Ausbaustufe |
|---|---|---|---|
| `architecture` | ARCH | – | – |
| `backend-and-api` | API | – | – |
| `identity-and-moderation` | IDENT | – | – |
| `data-and-storage` | DATA | – | – |
| `integrations` | INT | – | – |
| `security-and-privacy` | SEC | – | – |
| `ux-and-theming` | UX | – | – |
| `non-functional` | NFR | – | – |
| `quality-and-testing` | QA | – | – |
| `app-shell` | SHELL | kern | 1 |
| `room-finder` | RAUM | kern | 1 |
| `schedule` | SCHED | kern | 1 (ohne Prüfungsplan) |
| `canteen` | MENSA | kern | 1 |
| `canteen-ratings` | RATE | kern | 1 (ohne Freitext) |
| `canteen-photos` | FOTO | ausbau | 2 |
| `news` | NEWS | kern | 1 (ohne Push) |
| `admin` | ADMIN | kern | 1 (Teilumfang) |
| `settings` | SET | bestand | 1 |
| `semester-ticket` | TICKET | bestand | 1 |
| `events` | EVENT | kern | 2 |
| `event-volunteers` | HELFER | kern | 2 |
| `wiki` | WIKI | kern | 2 |
| `grades` | NOTEN | bestand | 2 |
| `e-key` | EKEY | bestand | 2 |

Die Spalte „Ausbaustufe" verweist auf `product/roadmap.md`; dort steht die Zuordnung je Anforderung, nicht nur je Capability.

### 10.2 `specs/` (Produkt, Prozess, Entscheidungen)

| Datei | Status |
|---|---|
| `product/vision.md` | accepted |
| `product/glossary.md` | accepted |
| `product/legacy-inventory.md` | accepted |
| `product/whatsapp-feedback-inventory.md` | draft |
| `product/roadmap.md` | accepted |
| `pruefprotokolle/2026-09-02-app-rahmen.md` | draft |
| `pruefprotokolle/2026-09-02-schritt-3-verwaltung.md` | draft |
| `open-questions.md` | draft |
| `decisions/0001-react-native-als-plattform.md` | angenommen |
| `decisions/0002-spec-anchored-arbeitsweise.md` | abgelöst (durch 0019) |
| `decisions/0003-eigenes-backend-fuer-community-funktionen.md` | angenommen |
| `decisions/0004-identitaet-und-anmeldung.md` | angenommen |
| `decisions/0005-wiki-bookstack-anbindung.md` | vorgeschlagen |
| `decisions/0006-abloesung-ods-durch-hisinone.md` | vorgeschlagen |
| `decisions/0007-datenquellen-mensa-und-news.md` | vorgeschlagen |
| `decisions/0008-vertrieb-ueber-drei-app-stores.md` | angenommen |
| `decisions/0009-expo-werkzeugkasten.md` | angenommen |
| `decisions/0010-authentik-als-identitaetsanbieter.md` | angenommen |
| `decisions/0011-monorepo-und-openapi-vertrag.md` | angenommen |
| `decisions/0012-zuschnitt-der-ersten-ausbaustufe.md` | angenommen |
| `decisions/0013-zustand-navigation-und-netzwerkschicht.md` | angenommen |
| `decisions/0014-selbstbetriebene-fehlertelemetrie.md` | angenommen |
| `decisions/0015-resilienz-hintergrund-jobs.md` | angenommen |
| `decisions/0016-api-versionierung-und-deprecation.md` | angenommen |
| `decisions/0017-zugriff-und-datensicherung-vps.md` | angenommen |
| `decisions/0018-verwaltungsoberflaeche-react-native-web.md` | angenommen |
| `decisions/0019-umstellung-auf-openspec.md` | angenommen |

Anmerkung zu den ADRs: Nummern und Titel der ADR `0001`–`0007` sind durch die ursprüngliche Projektplanung festgelegt. `0003`, `0005` und `0006` sind zusätzlich in der Capability `integrations` (vormals `platform/integrations.md`, Einträge INT-008, INT-007, INT-006) referenziert. `0008` bis `0012` sind im laufenden Spec-Prozess neu hinzugekommen. `0013` bis `0018` entstanden aus einer Prüfung des Spec-Bestands vor Implementierungsbeginn. `0019` stellt den Anforderungsbestand auf OpenSpec um — die ADR-Liste wächst bei Bedarf weiter.

## 11. Eine neue Anforderung oder Entscheidung anlegen

**Neue oder geänderte fachliche Anforderung (Capability unter `openspec/specs/`):**

1. `openspec new change <kebab-case-name>` — legt `openspec/changes/<name>/` an.
2. `proposal.md` verfassen: was soll sich ändern und warum.
3. Spec-Delta erstellen (ADDED/MODIFIED/REMOVED gegen die betroffene Capability), jedes Requirement im EARS-Muster (Abschnitt 5) mit Herkunftssatz (Abschnitt 6) und mindestens einem Scenario (Abschnitt 9).
4. Bei Bedarf `design.md` (technischer Ansatz) und `tasks.md` (Umsetzungsschritte als Checkliste) ergänzen.
5. `openspec validate` gegenprüfen, danach umsetzen; Tasks abhaken.
6. Beim Merge: `openspec archive <name> --yes` — übernimmt das Spec-Delta in `openspec/specs/`.

**Neue Architekturentscheidung (ADR unter `specs/decisions/`):**

1. `_templates/adr.md` nach `specs/decisions/00XX-kurzer-titel.md` kopieren, fortlaufend nummerieren.
2. Frontmatter ausfüllen, Status `vorgeschlagen`.
3. Kontext, Entscheidung, Alternativen mit Konsequenzen (Tabellenform, Abschnitt 9) ausfüllen.
4. Im Index (Abschnitt 10.2) eintragen.
