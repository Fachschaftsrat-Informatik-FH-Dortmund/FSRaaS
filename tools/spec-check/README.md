# spec-check

Prüfungen am Anforderungsbestand nach `openspec/specs/quality-and-testing/spec.md`,
Abschnitt „Prüfungen am Anforderungsbestand selbst". Läuft in der CI bei jedem
Pull Request; ein Verstoß blockiert den Merge (NFR-N-140, ADR 0011).

Gelesen werden **beide Bäume**: `openspec/specs/` definiert seit ADR 0019 den
fachlichen Anforderungsbestand, `specs/` enthält Entscheidungen, Produkt- und
Prozessdokumente sowie Prüfprotokolle — die verweisen auf Anforderungen,
definieren aber keine.

| Prüfung (Requirement-Titel) | vormals | Regel |
|---|---|---|
| Keine doppelten Anforderungs-Titel im Bestand | QA-N-080 | Kein Requirement-Titel kommt innerhalb derselben Capability zweimal vor. Derselbe Titel in zwei Capabilities ist zulässig. |
| Herkunftsnachweis ist Pflicht | QA-N-090 | Jeder Requirement-Text trägt genau einen Satz „Herkunft: …", der mit einem der fünf Muster aus `specs/README.md` Abschnitt 6 beginnt (`Alt: <pfad>`, `NEU`, `Android: unbekannt`, `Alt: bewusst verworfen`, `Recherche: <quelle>, <datum>`). |
| Referenzen zeigen auf existierende Ziele | QA-N-110 | `related:` / `betrifft:` zeigen auf existierende Dateien; jede genannte `INT-###` ist im Schnittstellenregister geführt; jede genannte historische Anforderungs-ID hängt als „(vormals …)" an einem Requirement oder steht in einem Abschnitt „Entfallene Anforderungen". |

## Aufruf

```bash
node tools/spec-check/src/cli.js            # Klartext, Exit-Code 0/1
node tools/spec-check/src/cli.js --json     # maschinenlesbar
node tools/spec-check/src/cli.js --root .   # andere Repo-Wurzel
```

## Herkunftsbericht

Keine Prüfung, sondern eine Auswertung — sie bricht nie ab und ändert nichts:

```bash
node tools/spec-check/src/cli.js --herkunft       # Verteilung über den Bestand
node tools/spec-check/src/cli.js --herkunft NEU   # betroffene Requirements je Capability
```

Wozu: Die Herkunftsmarkierung sagt, worauf sich ein Requirement stützt. `Alt:`
und `Recherche:` verweisen auf etwas außerhalb der Spec, das man nachschlagen
kann. `NEU` verweist auf nichts — solche Requirements sind gesetzt worden, weil
jemand sie für richtig hielt, und sind damit das, was am ehesten unbemerkt
falsch ist. Stand 2026-09-05 tragen 397 von 570 Requirements (70 %) die
Markierung `NEU`. Der Bericht ist der Einstieg in eine Durchsprache je
Capability; was sich dabei als überflüssig erweist, wird als REMOVED-Delta
geführt, nicht gelöscht.

## Tests

```bash
cd tools/spec-check && npm test
```

Die Tests decken je Prüfung mindestens einen erkannten Verstoß und einen
sauberen Fall ab (`test/checks.test.js`) und stellen sicher, dass der reale
Bestand alle drei Prüfungen besteht (`test/bestand.test.js`).

## Bewusste Grenzen

- **Struktur prüft `openspec validate`, nicht dieses Werkzeug.** Ob Proposal,
  Spec-Delta, Design und Tasks eines Change wohlgeformt sind, beantwortet der
  OpenSpec-CLI. Dieses Werkzeug prüft nur, was er nicht kennt: Herkunft,
  Titeleindeutigkeit und Verweise.
- **`openspec validate --strict` ist für einen deutschen Bestand unbrauchbar.**
  Die Strict-Stufe verlangt die englischen RFC-2119-Wörter `SHALL`/`MUST` und
  meldet jedes deutsche „muss" als Verstoß — bei Stand openspec 1.12 fallen so
  alle Capabilities durch, ohne dass ein einziger `ERROR` vorliegt. Die CI ruft
  deshalb `openspec validate --specs` ohne `--strict`; echte Struktur-Fehler
  (Stufe `ERROR`) blockieren auch dort.
- **Frontmatter wird nicht mehr geprüft** (vormals QA-N-100). OpenSpec-Specs
  tragen keins, und die Anforderungstabelle der Capability führt die Prüfung
  seit ADR 0019 nicht mehr.
- Der Frontmatter-Parser deckt den in den `specs/`-Dokumenten genutzten
  YAML-Ausschnitt ab (Skalare, einfache Listen), nicht den vollen
  YAML-Standard — bewusst ohne Fremdabhängigkeit.
- `api-contract.yaml` ist keine `.md`-Datei und wird von diesen Prüfungen nicht
  erfasst. Eine Vertragsprüfung ist eine eigene Aufgabe
  (`tools/contract-codegen`).
