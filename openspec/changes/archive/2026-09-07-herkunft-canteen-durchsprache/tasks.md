# Aufgaben

## 1. Herkunftsmarkierungen

- [x] 1.1 Die fünf Anforderungen aus dem Spec-Delta um den `vgl.`-Rückverweis ergänzen
- [x] 1.2 `specs/product/legacy-inventory.md` Abschnitt 5: Definition von `NEU` auf die Sicherheits-Lesart umstellen
- [x] 1.3 Fehlende Zeile `FOTO | 0 | 0` in der Abdeckungsübersicht ergänzt

## 2. Zuschreibungen

- [x] 2.1 13 Stellen in `openspec/specs/canteen/spec.md` auf „Entschieden <Datum>." umgestellt
- [x] 2.2 5 Stellen in `openspec/specs/canteen-ratings/spec.md` umgestellt
- [x] 2.3 `docs/agents/herkunft-durchsprache.md` auf dieselbe Belegform nachgezogen
- [n] 2.4 Fassung/`last_reviewed` der Capability-Specs — entfällt: OpenSpec-Specs führen keine Fassung, der archivierte Change ersetzt sie (`CLAUDE.md`)

## 3. Glossar

- [x] 3.1 „Aktive Mensa", „Maßgebliche Mensa", „Normalisierter Gerichtsschlüssel", „Bewertungsstufe", „Höchstbewertung" aufgenommen
- [x] 3.2 20 veraltete Verweise auf `features/…` und `platform/…` auf die OpenSpec-Pfade umgestellt
- [x] 3.3 Eintrag „Alt-App" korrigiert — er führte den Android-Quellcode als nicht vorliegend, obwohl er seit 2026-08-25 im Repo liegt
- [x] 3.4 Fassung 0.4.3 → 0.5.0, `last_reviewed` auf 2026-09-05

## 4. Befunde als Issues

- [x] 4.1 Stern-Prototyp in `favorites.ts` → Issue #19
- [x] 4.2 Leeres `openspec/changes/archive/`, DoD-Punkt 4 → Issue #20
- [x] 4.3 42 gleichartige Zuschreibungen in 15 Capabilities → Issue #21

## 5. Prüfwerkzeug

- [n] 5.1–5.3 Entfallen: mit PR #18 (`cadd0a2`, `cbbc20b`) bereits umgesetzt — `--herkunft`, `--root`, OpenSpec-Parser
- [x] 5.4 Geprüft: `vgl. <Inventar-ID>` passiert `isValidHerkunft` und die Herkunftsverteilung unverändert (397 NEU)

## 6. Inhaltliche Durchsprache

- [x] 6.1 Die 56 `NEU`-Requirements der Capability `canteen` nach der Leitfrage aus `docs/agents/herkunft-durchsprache.md` durchgehen — erledigt am 2026-09-05 im Change `canteen-durchsprache-inhalt`, alle 56. Kein Requirement entfiel, drei änderten sich.
