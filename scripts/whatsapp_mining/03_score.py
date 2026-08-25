"""Berechnet je Nachricht einen Relevanz-Score und globale/chat-weise Begriffshaeufigkeit.

Nur type in {normal, edited} sind bewertbar (enthalten echten Freitext).
"""
from __future__ import annotations

import re
import sys
from collections import Counter
from typing import Any

from common import PARSED_DIR, SCORED_DIR, ensure_dirs, read_jsonl, write_json, write_jsonl
from keywords_de import STOPWORDS, score_message

SCOREABLE_TYPES = {"normal", "edited"}
TOKEN_RE = re.compile(r"\b[a-zA-ZäöüÄÖÜß]{3,}\b")


def tokenize(text: str) -> list[str]:
    return [t.lower() for t in TOKEN_RE.findall(text)]


def unigrams(tokens: list[str]) -> list[str]:
    return [t for t in tokens if t not in STOPWORDS]


def bigrams(tokens: list[str]) -> list[str]:
    out = []
    for a, b in zip(tokens, tokens[1:]):
        if a not in STOPWORDS or b not in STOPWORDS:
            out.append(f"{a} {b}")
    return out


def main() -> None:
    if not PARSED_DIR.is_dir() or not any(PARSED_DIR.glob("*.jsonl")):
        sys.exit(f"Keine geparsten Chats in {PARSED_DIR} -- zuerst 02_parse.py ausfuehren.")

    ensure_dirs(SCORED_DIR)

    global_terms: Counter[str] = Counter()
    global_term_chats: dict[str, set[str]] = {}
    per_chat_terms: dict[str, Counter[str]] = {}

    trigger_totals: Counter[str] = Counter()
    threshold_counts = {2: 0, 3: 0, 4: 0}
    total_messages = 0
    total_scoreable = 0

    for jsonl_path in sorted(PARSED_DIR.glob("*.jsonl")):
        slug = jsonl_path.stem
        records: list[dict[str, Any]] = list(read_jsonl(jsonl_path))
        scored: list[dict[str, Any]] = []
        chat_terms: Counter[str] = Counter()

        for rec in records:
            total_messages += 1
            if rec["type"] not in SCOREABLE_TYPES or not rec.get("text"):
                scored.append({**rec, "score": 0, "hits": {}})
                continue

            total_scoreable += 1
            text = rec["text"]
            score, hits = score_message(text, rec.get("is_poll", False))
            for cat in hits:
                trigger_totals[cat] += 1
            for t in (2, 3, 4):
                if score >= t:
                    threshold_counts[t] += 1

            tokens = tokenize(text)
            for term in unigrams(tokens) + bigrams(tokens):
                chat_terms[term] += 1
                global_terms[term] += 1
                global_term_chats.setdefault(term, set()).add(slug)

            scored.append({**rec, "score": score, "hits": hits})

        write_jsonl(SCORED_DIR / f"{slug}.jsonl", scored)
        per_chat_terms[slug] = chat_terms
        print(f"{slug}: {len(records)} Nachrichten bewertet")

    term_frequency = {
        "global_top": [
            {"term": term, "count": count, "num_chats": len(global_term_chats[term]), "chats": sorted(global_term_chats[term])}
            for term, count in global_terms.most_common(60)
        ],
        "per_chat_top": {
            slug: [{"term": term, "count": count} for term, count in counter.most_common(20)]
            for slug, counter in per_chat_terms.items()
        },
    }
    write_json(SCORED_DIR / "_term_frequency.json", term_frequency)

    print(f"\nGesamt: {total_messages} Nachrichten, {total_scoreable} bewertbar.")
    print(f"Treffer je Schwelle: {threshold_counts}")
    print(f"Kategorie-Trigger-Zaehlung: {dict(trigger_totals)}")


if __name__ == "__main__":
    main()
