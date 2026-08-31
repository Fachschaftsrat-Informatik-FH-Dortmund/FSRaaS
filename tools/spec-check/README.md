# spec-check

Prüfungen am Spec-Bestand nach `specs/platform/quality-and-testing.md` Abschnitt 8.
Läuft in der CI bei jedem Pull Request; ein Verstoß blockiert den Merge
(NFR-N-140, ADR 0011).

| Prüfung | Anforderung | Regel |
|---|---|---|
| Doppelte IDs | QA-N-080 | Keine Anforderungs-ID (`<PRÄFIX>-F-###` / `-N-###`) wird in mehr als einer Anforderungstabelle definiert. Als „entfallen" markierte Anforderungen zählen weiterhin als vergeben. |
| Herkunft | QA-N-090 | Die letzte Zelle jeder Anforderungszeile trägt genau eines der fünf Muster aus `README.md` Abschnitt 6 (`Alt: <pfad>`, `NEU`, `Android: unbekannt`, `Alt: bewusst verworfen`, `Recherche: <quelle>, <datum>`). |
| Frontmatter | QA-N-100 | Jede Spec-Datei enthält alle für ihre Art vorgesehenen Pflichtfelder (ADR / Feature-Spec / platform-Spec / Produktdokument). |
| Verweise | QA-N-110 | `related:` / `betrifft:` zeigen auf existierende Dateien; jede im Fließtext genannte `INT-###`- oder Anforderungs-ID ist irgendwo definiert. |

## Aufruf

```bash
node tools/spec-check/src/cli.js            # Klartext, Exit-Code 0/1
node tools/spec-check/src/cli.js --json     # maschinenlesbar
node tools/spec-check/src/cli.js --specs ./specs
```

## Tests

```bash
cd tools/spec-check && npm test
```

Die Tests decken je Prüfung mindestens einen erkannten Verstoß und einen sauberen
Fall ab (`test/checks.test.js`) und stellen sicher, dass der reale Bestand alle
vier Prüfungen besteht (`test/bestand.test.js`).

## Bewusste Grenzen

- Anforderungen werden nur aus Dateien mit `praefix:` im Frontmatter gelesen
  (Feature- und `platform/`-Specs). `README.md`, Vorlagen und Produktdokumente
  definieren keine Anforderungen; ihre Anforderungs-Nennungen gelten als Verweise.
- Der Frontmatter-Parser deckt den in den Specs genutzten YAML-Ausschnitt ab
  (Skalare, einfache Listen), nicht den vollen YAML-Standard — bewusst ohne
  Fremdabhängigkeit.
- `api-contract.yaml` ist keine `.md`-Datei und wird von diesen vier Prüfungen
  nicht erfasst (Wortlaut QA §8). Eine Vertragsprüfung ist eine eigene Aufgabe.
