---
nummer: 0019
titel: Umstellung des Spec-Bestands auf OpenSpec
status: angenommen
datum: 2026-09-05
betrifft:
  - ../README.md
  - ../platform/quality-and-testing.md
  - ../platform/integrations.md
  - 0002-spec-anchored-arbeitsweise.md
---

# ADR 0019: Umstellung des Spec-Bestands auf OpenSpec

## Kontext

ADR 0002 hat das projekteigene Spec-Format begründet: dauerhafte Specs unter `specs/` als Quelle der Wahrheit, verankert über Anforderungs-IDs (`<PRÄFIX>-F-###`/`<PRÄFIX>-N-###`) in Testnamen und `implemented_in:` im Frontmatter. Der FSR will diese Verwaltung nun auf das CLI-Werkzeug OpenSpec umstellen (`openspec/specs/` als aktueller Bestand, `openspec/changes/` für Vorschläge mit `proposal.md`, Spec-Delta, `design.md`, `tasks.md`, Archivierung per `openspec archive`).

OpenSpec deckt sich nicht deckungsgleich mit dem bisherigen Format:

- Es kennt kein Feld für Herkunftsnachweis (`Alt: <pfad>:<zeile>`, `NEU`, `Android: unbekannt`, `Recherche: <Quelle>, <Datum>`), das nach ADR 0002 unverzichtbar ist, weil ein erheblicher Teil der Anforderungen aus dem Alt-Code rückwärts erschlossen wurde.
- Es kennt kein Anforderungs-ID-Schema mit fester Präfix-Tabelle; Requirements werden capability-/feature-basiert benannt.
- Es kennt keine Entscheidungsprotokolle (ADRs) und keine Produkt-/Prozessdokumente — nur Capability-Specs und Changes.
- Es erzwingt nicht das Prinzip „Endpunktdetails stehen nur im Schnittstellenregister" (`platform/integrations.md`).

## Entscheidung

Der Spec-Bestand für Feature- und Querschnitts-Anforderungen (bisher `specs/features/` und `specs/platform/`) wird nach `openspec/specs/` migriert und ab sofort mit dem OpenSpec-CLI verwaltet (`openspec new change`, `openspec validate`, `openspec archive`). Dabei gilt:

- **Herkunftsnachweis bleibt Pflicht**, wird aber als Textanhang an jedes Requirement geführt (Konvention statt Schema-Feld), z. B. „… Herkunft: Alt: lib/main_page.dart".
- **Anforderungs-IDs entfallen** zugunsten OpenSpec-eigener, capability-basierter Requirement-Titel. Die rund 40 bestehenden ID-Verweise in Testnamen (`describe('SCHED-F-140 …')` u. Ä.) in `app/` und `backend/` werden **nicht** im Zuge dieser Umstellung angepasst, sondern in einem eigenen, späteren Schritt (siehe Offene Punkte).
- **ADRs (`specs/decisions/`) und Produkt-/Prozessdokumente (`specs/product/`, `specs/pruefprotokolle/`, `specs/open-questions.md`) bleiben unverändert an ihrem Ort.** OpenSpec verwaltet nur die Capability-Specs, keine Entscheidungshistorie.
- **Das Schnittstellenregister bleibt als eigene Capability** (`openspec/specs/integrations/spec.md`) erhalten; das Prinzip „Endpunktdetails nur dort" gilt als Konvention weiter, auch ohne technische Durchsetzung durch OpenSpec selbst.
- **`tools/spec-check` wird angepasst statt ersetzt**: `openspec validate` prüft Struktur der Change-Artefakte, nicht Herkunftsnachweis oder Querverweis-Integrität. Diese beiden Prüfungen bleiben ein eigenständiges Skript, umgestellt auf die neuen Pfade.

## Alternativen mit Konsequenzen

| Option | Aufwand | Nutzen | Nachteile |
|---|---|---|---|
| Projekteigenes Format beibehalten (ADR 0002, Status quo) | keiner (bereits etabliert) | keine Umstellungskosten, Herkunft und IDs bereits vollständig durchgesetzt | kein CLI-gestützter Change-Workflow, Werkzeug bleibt Eigenbau |
| **Vollständige Umstellung auf OpenSpec (gewählt)** | hoch einmalig (rund 25 Dateien migrieren, ADR, README, CLAUDE.md, `tools/spec-check` anpassen) | standardisierter, werkzeuggestützter Proposal→Spec→Tasks-Workflow; geringerer Pflegeaufwand für das Eigenbau-Tooling langfristig | Herkunftsnachweis und ID-Schema müssen als Konvention statt Schema/CLI-Zwang fortbestehen; Übergangszeit mit zwei Formaten (ADRs/Produktdokumente bleiben altes Format, Capability-Specs neues) |
| Hybrid: OpenSpec nur für neue Features, Bestand bleibt im alten Format | mittel | risikoärmer, keine Migration bestehender Specs nötig | zwei parallele Formate auf Dauer, höhere Verwechslungsgefahr gerade bei wechselnden FSR-Jahrgängen — widerspricht dem in ADR 0002 benannten Übergabeproblem |

## Konsequenzen

`specs/README.md` und `CLAUDE.md` werden auf `openspec/specs/` als Fundort für Feature- und Querschnittsanforderungen umgestellt; EARS-Formulierungsmuster und Herkunftsnachweis gelten inhaltlich unverändert weiter, nur als Konvention statt technisch erzwungenes Schema. `tools/spec-check` prüft künftig gegen `openspec/specs/**/spec.md`. Die Anforderungs-ID-Verweise in bestehenden Testnamen werden vorerst nicht angepasst — Spec und Test verlieren bis zur Nachfolgearbeit ihren bisherigen 1:1-ID-Bezug für bereits umgesetzte Anforderungen.

## Offene Punkte

- Umbenennung der bestehenden Anforderungs-ID-Verweise in Testnamen (`app/`, `backend/`) auf die neuen OpenSpec-Requirement-Titel: eigener, separater Schritt, Umfang und Zeitpunkt noch offen.
- Genaues Format der Herkunftsangabe innerhalb eines OpenSpec-Requirement-Texts (Satzanhang vs. eigener Unterpunkt) wird beim ersten migrierten Beispiel (`quality-and-testing`) festgelegt und danach einheitlich angewendet.
- Ob `openspec validate` künftige OpenSpec-Versionen ein Konzept für Herkunftsnachweis oder Query-fähige Requirement-IDs nachliefern, die die Eigenbau-Prüfung in `tools/spec-check` teilweise ablösen könnten: zu beobachten.
