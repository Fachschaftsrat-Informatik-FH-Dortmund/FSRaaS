"""Gemeinsame Hilfsfunktionen fuer die WhatsApp-Mining-Pipeline.

Pfade werden relativ zum Repo-Root aufgeloest (nicht zum aktuellen Arbeitsverzeichnis),
damit die Skripte unabhaengig vom Aufrufort funktionieren.
"""
from __future__ import annotations

import json
import re
import unicodedata
from pathlib import Path
from typing import Any, Iterable, Iterator

REPO_ROOT = Path(__file__).resolve().parents[2]
CHATS_DIR = REPO_ROOT / "chats"
ANALYSIS_DIR = REPO_ROOT / "analysis"
EXTRACTED_DIR = ANALYSIS_DIR / "extracted"
PARSED_DIR = ANALYSIS_DIR / "parsed"
PSEUDONYM_DIR = PARSED_DIR / "_pseudonyms"
MANIFEST_PATH = PARSED_DIR / "_manifest.json"
SCORED_DIR = ANALYSIS_DIR / "scored"
TERM_FREQ_PATH = SCORED_DIR / "_term_frequency.json"
CANDIDATES_DIR = ANALYSIS_DIR / "candidates"
CANDIDATES_PATH = CANDIDATES_DIR / "candidates.md"

# Erkennt ein Telefonnummer-aehnliches Muster (internationale +.. oder deutsche 0..-Formate,
# mit optionalen Trennzeichen). Bewusst weit gefasst (Redaktion ist billig, ein Leak nicht).
PHONE_LEAK_RE = re.compile(r"(?:\+\d{1,3}|\b0\d{2,5})[\d\s/-]{5,}\d\b")


def slugify(name: str) -> str:
    """Wandelt einen Chat-Namen in einen dateisystem- und grep-freundlichen Slug um."""
    name = name.replace("WhatsApp-Chat mit ", "").strip()
    normalized = unicodedata.normalize("NFKD", name)
    ascii_only = normalized.encode("ascii", "ignore").decode("ascii")
    ascii_only = ascii_only.lower()
    ascii_only = re.sub(r"[^a-z0-9]+", "-", ascii_only)
    return ascii_only.strip("-")


def ensure_dirs(*dirs: Path) -> None:
    for d in dirs:
        d.mkdir(parents=True, exist_ok=True)


def write_jsonl(path: Path, records: Iterable[dict[str, Any]]) -> int:
    count = 0
    with path.open("w", encoding="utf-8") as f:
        for rec in records:
            f.write(json.dumps(rec, ensure_ascii=False))
            f.write("\n")
            count += 1
    return count


def read_jsonl(path: Path) -> Iterator[dict[str, Any]]:
    with path.open("r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                yield json.loads(line)


def write_json(path: Path, data: Any) -> None:
    with path.open("w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def read_json(path: Path) -> Any:
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


class Pseudonymizer:
    """Weist pro Chat jedem eindeutigen Absender-Rohstring ein stabiles Pseudonym zu.

    Reihenfolge: erstes Auftreten in der Datei bestimmt die Nummer -> deterministisch
    bei jedem erneuten Lauf ueber dieselbe Eingabedatei. Keine Chat-uebergreifende
    Identitaetsaufloesung.
    """

    def __init__(self) -> None:
        self._map: dict[str, str] = {}

    def pseudonym_for(self, raw_sender: str) -> str:
        if raw_sender not in self._map:
            self._map[raw_sender] = f"Person {len(self._map) + 1}"
        return self._map[raw_sender]

    @property
    def mapping(self) -> dict[str, str]:
        return dict(self._map)


def scan_for_phone_leak(path: Path) -> list[str]:
    """Durchsucht eine Textdatei nach telefonnummer-aehnlichen Mustern.

    Gibt die Liste der Treffer zurueck (leer = kein Leak gefunden).
    """
    text = path.read_text(encoding="utf-8")
    return PHONE_LEAK_RE.findall(text)


def redact_phone_numbers(text: str) -> str:
    """Ersetzt telefonnummer-aehnliche Muster im Nachrichtentext durch einen Platzhalter.

    Faengt sowohl versehentlich nicht pseudonymisierte Absenderdaten als auch legitim
    im Chat geteilte Nummern (z. B. Vermieter-Kontakt) ab, bevor der Text irgendwo
    persistiert oder gescort wird.
    """
    return PHONE_LEAK_RE.sub("[Telefonnummer]", text)


def assert_no_phone_leak(path: Path) -> None:
    hits = scan_for_phone_leak(path)
    if hits:
        raise RuntimeError(
            f"Sicherheitsnetz ausgeloest: {len(hits)} telefonnummer-aehnliche Muster in "
            f"{path} gefunden (z. B. {hits[0]!r}). Datei wird nicht weiterverwendet."
        )
