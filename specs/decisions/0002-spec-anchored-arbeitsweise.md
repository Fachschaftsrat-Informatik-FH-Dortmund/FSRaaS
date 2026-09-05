---
nummer: 0002
titel: Spec-anchored Arbeitsweise
status: abgelöst
datum: 2026-08-24
zuletzt_ergaenzt: 2026-09-05   # abgelöst durch ADR 0019 (Umstellung auf OpenSpec)
betrifft:
  - ../README.md
  - ../../openspec/specs/quality-and-testing/spec.md
---

# ADR 0002: Spec-anchored Arbeitsweise

## Kontext

Beide Vorgängerprojekte sind an fehlender Übergabe gescheitert. Ein Fachschaftsrat wechselt seine Aktiven regelmäßig; Wissen, das ausschließlich im Code steht, geht mit den Personen verloren, die ihn geschrieben haben. Der Extremfall dieses Musters liegt bereits vor: Die native Android-Alt-App ist ohne verfügbaren Quellcode praktisch nicht mehr fortführbar. Auch die Flutter/iOS-App wird nur noch als Lesequelle herangezogen, nicht mehr weiterentwickelt. Die Neuentwicklung braucht eine Arbeitsweise, die dieses Muster nicht wiederholt.

## Entscheidung

Dauerhafte Specs unter `specs/` sind die Quelle der Wahrheit über die gesamte Lebensdauer eines Features — von der ersten Idee bis zur Ablösung. Sie bleiben nach der Umsetzung bestehen und werden mitgepflegt, verankert über Anforderungs-IDs in Testnamen sowie über `implemented_in:` im Frontmatter jeder Spec. Details des Mechanismus: `README.md`, Abschnitte 1 und 7.

## Alternativen mit Konsequenzen

| Option | Aufwand | Nutzen | Nachteile |
|---|---|---|---|
| Dokumentation nur im Code (Status quo) | gering laufend | kein zusätzlicher Pflegeaufwand während der Entwicklung | genau der Status quo, der bei beiden Alt-Apps gescheitert ist; Wissen bleibt an die Personen gebunden, die den Code geschrieben haben |
| Anforderungen nur im Ticketsystem | gering bis mittel | vertraute Arbeitsweise, gute kurzfristige Nachvollziehbarkeit | Tickets verfallen oder werden archiviert, sobald sie „erledigt" sind; kein dauerhafter Bezugspunkt für spätere Änderungen |
| Spezifikation nur vorab (einmaliges Lastenheft) | hoch am Anfang, danach kein vorgesehener Pflegeaufwand | klarer Startpunkt, gute Grundlage für die erste Umsetzung | veraltet ab der ersten Änderung nach Fertigstellung und verliert dadurch schnell ihre Verlässlichkeit |
| Spec-anchored (gewählt) | hoch — bei jeder Änderung zusätzlicher Pflegeaufwand für Spec und Test | belastbare Übergabe über Generationen von FSR-Aktiven hinweg; Spec bleibt über die gesamte Lebensdauer maßgeblich | Mehraufwand bei jeder Änderung; erfordert Disziplin bei jedem Merge |

## Konsequenzen

Mehraufwand bei jeder Änderung — jede Verhaltensänderung ändert Spec und Code im selben Merge (siehe `README.md`, Abschnitt 7, Merge-Regel). Im Gegenzug bleibt die Übergabe an neue FSR-Aktive belastbar: Wer eine Spec liest, kennt Verhalten, Herkunft und Umsetzungsstand eines Features, ohne den gesamten Code durchsuchen zu müssen.

**Abgelöst (2026-09-05).** Die hier getroffene Grundsatzentscheidung — dauerhafte Specs als Quelle der Wahrheit, verankert über Tests und Frontmatter — bleibt inhaltlich gültig. Der konkrete Mechanismus (Eigenbau-Format unter `specs/features/` und `specs/platform/` mit `<PRÄFIX>-F-###`-IDs) wird durch ADR 0019 auf das CLI-Werkzeug OpenSpec umgestellt: Feature- und Querschnittsanforderungen ziehen nach `openspec/specs/` um, Anforderungs-IDs entfallen zugunsten capability-basierter Requirement-Titel, Herkunftsnachweis bleibt als Textkonvention erhalten. ADRs und Produktdokumente bleiben unverändert im bisherigen Format unter `specs/`.

## Offene Punkte

- Wer die Einhaltung der spec-anchored Regeln prüft (einzelne Reviewer, automatisierte Pipeline, oder beides): ungeklärt.
- In welchem Rhythmus Specs turnusmäßig durchgesehen werden, auch ohne inhaltliche Änderung: ungeklärt. Berührt `platform/quality-and-testing.md`, Abschnitt 8 (Prüfungen am Spec-Bestand).
