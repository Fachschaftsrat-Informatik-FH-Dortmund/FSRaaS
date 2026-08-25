# WhatsApp-Mining-Pipeline

Extrahiert, parst und filtert die WhatsApp-Gruppenchat-Exporte in `chats/`, um mit
minimalem Tokenverbrauch herauszufinden, welche Funktionen sich Studis am meisten
wünschen. Siehe `specs/product/whatsapp-feedback-inventory.md` für das Ergebnis.

## Ausführung (in dieser Reihenfolge)

```bash
python 01_extract.py
python 02_parse.py
python 03_score.py
python 04_build_candidates.py --threshold 4 --context 2
```

Alle Ausgaben landen unter `analysis/` (repo-weit gitignored). Die einzige Datei mit
echten Handynummern/Klarnamen ist `analysis/parsed/_pseudonyms/<slug>.json` — niemals
öffnen/kopieren/zitieren außerhalb der Pipeline selbst.

Am Ende liest ein LLM ausschließlich `analysis/candidates/candidates.md`
(Zielgröße: einige zehn KB) für die inhaltliche Synthese — nicht die Rohdaten.

## Schwellenwert anpassen

`--threshold 4` (Standard) liefert hohe Präzision bei kompakter Ausgabe. Für mehr
Recall (mehr, aber auch mehr falsch-positive Treffer): `--threshold 3`. Dafür müssen
nur `04_build_candidates.py` erneut laufen, nicht `02`/`03`.

## Neue Chat-Exporte hinzufügen

Neue WhatsApp-Export-ZIPs (auch ohne `.zip`-Endung) einfach nach `chats/` legen und
die vier Skripte erneut ausführen.
