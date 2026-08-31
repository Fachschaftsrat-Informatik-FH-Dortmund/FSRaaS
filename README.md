# FB4-App

App des Fachschaftsrats Informatik (FB4) der FH Dortmund. Löst zwei Alt-Apps ab.

Dieses Projekt arbeitet **spec-anchored**: Die Specs unter [`specs/`](specs/) sind die
Quelle der Wahrheit, nicht der Code. Keine Verhaltensänderung ohne Spec-Änderung im
selben Merge. Details: [`CLAUDE.md`](CLAUDE.md) und [`specs/README.md`](specs/README.md).

## Monorepo (ADR 0011)

| Verzeichnis | Inhalt | Technik |
|---|---|---|
| `specs/` | Quelle der Wahrheit — Anforderungen, Vertrag, Entscheidungen | Markdown, OpenAPI |
| `app/` | React-Native-App (iOS, Android) und PC-Verwaltungsoberfläche als Web-Export | Expo (Prebuild + Dev-Client, ohne EAS/`expo-updates`, ADR 0009) |
| `backend/` | Eigenes Backend (INT-008): Schreibpfade, Zwischenspeicher, Stammdaten, Redaktion | ASP.NET Core, PostgreSQL, EF Core (ADR 0011) |
| `tools/spec-check/` | Prüfungen am Spec-Bestand (QA §8), CI-Gate | Node, ohne Fremdabhängigkeit |
| `tools/contract-codegen/` | Erzeugt Typen aus `specs/platform/api-contract.yaml` (API-N-035) | Node |

## Umsetzungsstand

Umsetzungsreihenfolge: [`specs/product/roadmap.md`](specs/product/roadmap.md).

- **Schritt 0 — Fundament:** in Arbeit. Monorepo-Gerüst, `LICENSE`, CI mit den vier
  Spec-Prüfungen, Codeerzeugung aus dem Vertrag, App- und Backend-Skelett,
  Sprachdateien Deutsch/Englisch.
- Schritte 1–10 (Querschnitt, App-Rahmen, Stammdaten/Verwaltung, Mensa, Stundenplan,
  Raumsuche, News, Semesterticket, Bewertungen, Auslieferung): offen.

## Entwicklung

Voraussetzungen: Node ≥ 20, .NET SDK 9, PostgreSQL (nur für Backend-Betrieb, nicht
für Tests).

```bash
# Spec-Bestand prüfen (läuft auch in der CI)
node tools/spec-check/src/cli.js
cd tools/spec-check && npm test

# Typen aus dem Vertrag erzeugen
cd tools/contract-codegen && npm install && npm run generate

# App
cd app && npm install && npm run typecheck && npm test
npm start            # Dev-Client, benötigt einen Development-Build auf dem Gerät

# Backend
cd backend && dotnet test
dotnet run --project src/Fb4.Backend    # /health antwortet auch ohne Datenbank
```

## Lizenz

MIT — siehe [`LICENSE`](LICENSE). Gilt für den gesamten Bestand (NFR-N-160).
