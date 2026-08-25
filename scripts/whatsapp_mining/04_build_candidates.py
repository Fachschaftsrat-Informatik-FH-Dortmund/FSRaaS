"""Baut aus den bewerteten Nachrichten eine kompakte candidates.md fuer die LLM-Synthese.

Treffer (score >= threshold) werden zu ueberlappungs-gemergten Kontextbloecken
zusammengefasst, auf ein Byte-Budget gekappt und als Markdown ausgegeben.
"""
from __future__ import annotations

import argparse
import sys
from typing import Any

from common import (
    CANDIDATES_DIR,
    CANDIDATES_PATH,
    MANIFEST_PATH,
    SCORED_DIR,
    TERM_FREQ_PATH,
    assert_no_phone_leak,
    ensure_dirs,
    read_json,
    read_jsonl,
)

MAX_BLOCK_MESSAGES = 40
MAX_MESSAGE_CHARS = 400
DEFAULT_BUDGET_BYTES = 100_000


def truncate(text: str, n: int) -> str:
    text = text.replace("\n", " ⏎ ")
    if len(text) <= n:
        return text
    return text[: n - 1] + "…"


def merge_windows(indices: list[int], context: int, n: int) -> list[tuple[int, int]]:
    if not indices:
        return []
    windows = [(max(0, i - context), min(n - 1, i + context)) for i in sorted(indices)]
    merged = [windows[0]]
    for start, end in windows[1:]:
        last_start, last_end = merged[-1]
        if start <= last_end + 1:
            merged[-1] = (last_start, max(last_end, end))
        else:
            merged.append((start, end))
    return merged


def build_blocks(slug: str, records: list[dict[str, Any]], threshold: int, context: int) -> list[dict[str, Any]]:
    hit_indices = [i for i, r in enumerate(records) if r.get("score", 0) >= threshold]
    windows = merge_windows(hit_indices, context, len(records))

    blocks = []
    for start, end in windows:
        window_records = records[start : end + 1]
        if len(window_records) > MAX_BLOCK_MESSAGES:
            # Zentriert um den staerksten Treffer kappen.
            peak_local = max(range(len(window_records)), key=lambda i: window_records[i].get("score", 0))
            half = MAX_BLOCK_MESSAGES // 2
            lo = max(0, peak_local - half)
            hi = min(len(window_records), lo + MAX_BLOCK_MESSAGES)
            window_records = window_records[lo:hi]
        peak_score = max((r.get("score", 0) for r in window_records), default=0)
        blocks.append({"slug": slug, "records": window_records, "peak_score": peak_score})
    return blocks


def render_block(block: dict[str, Any], index: int) -> str:
    records = block["records"]
    ts_start = records[0]["ts"]
    ts_end = records[-1]["ts"]
    lines = [f"### [{block['slug']} · Block {index} · {ts_start} – {ts_end}]"]
    for r in records:
        if r["type"] == "system":
            continue
        sender = r.get("sender") or "?"
        time_part = r["ts"][11:16]
        text = r.get("text") or f"<{r['type']}>"
        text = truncate(text, MAX_MESSAGE_CHARS)
        marker = ""
        if r.get("score", 0) > 0:
            hit_str = " ".join(f"{cat}" for cat in r.get("hits", {}))
            marker = f"  ◀ TREFFER (score={r['score']}): {hit_str}"
        lines.append(f"{sender:<12} {time_part}  {text}{marker}")
    return "\n".join(lines)


def apply_budget(blocks: list[dict[str, Any]], budget: int) -> tuple[list[dict[str, Any]], int]:
    rendered = [render_block(b, i + 1) for i, b in enumerate(blocks)]
    sized = list(zip(blocks, rendered))
    sized.sort(key=lambda bp: bp[0]["peak_score"], reverse=True)

    kept = []
    total = 0
    dropped = 0
    for b, text in sized:
        size = len(text.encode("utf-8"))
        if total + size > budget and kept:
            dropped += 1
            continue
        kept.append((b, text))
        total += size

    # Wieder in chronologischer/Chat-Reihenfolge sortieren fuer die Ausgabe.
    kept_blocks = [b for b, _ in kept]
    order = {id(b): i for i, b in enumerate(blocks)}
    kept.sort(key=lambda bp: order[id(bp[0])])
    return [b for b, _ in kept], dropped


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--threshold", type=int, default=4)
    parser.add_argument("--context", type=int, default=2)
    parser.add_argument("--budget-bytes", type=int, default=DEFAULT_BUDGET_BYTES)
    args = parser.parse_args()

    if not SCORED_DIR.is_dir() or not any(SCORED_DIR.glob("*.jsonl")):
        sys.exit(f"Keine bewerteten Chats in {SCORED_DIR} -- zuerst 03_score.py ausfuehren.")

    ensure_dirs(CANDIDATES_DIR)

    manifest = read_json(MANIFEST_PATH)
    term_freq = read_json(TERM_FREQ_PATH)

    all_blocks: list[dict[str, Any]] = []
    overview_rows = []
    total_hits = 0

    for jsonl_path in sorted(SCORED_DIR.glob("*.jsonl")):
        slug = jsonl_path.stem
        records = list(read_jsonl(jsonl_path))
        blocks = build_blocks(slug, records, args.threshold, args.context)
        all_blocks.extend(blocks)

        n_hits = sum(1 for r in records if r.get("score", 0) >= args.threshold)
        total_hits += n_hits
        m = manifest.get(slug, {})
        date_range = m.get("date_range", [None, None])
        overview_rows.append(
            f"| {slug} | {m.get('message_count', '?')} | {date_range[0]}–{date_range[1]} | {n_hits} | {len(blocks)} |"
        )

    kept_blocks, dropped = apply_budget(all_blocks, args.budget_bytes)

    lines: list[str] = []
    lines.append("# WhatsApp-Fundstellen — Rohkandidaten für Feature-Mining")
    total_msgs = sum(m["message_count"] for m in manifest.values())
    lines.append(
        f"Erzeugt: automatisiert · Chats: {len(manifest)} · Nachrichten gesamt: {total_msgs} · "
        f"Treffer (Score ≥{args.threshold}): {total_hits} · Blöcke: {len(kept_blocks)}"
        + (f" ({dropped} durch Byte-Budget verworfen)" if dropped else "")
    )
    lines.append("")
    lines.append("## Übersicht je Chat")
    lines.append("| Chat | Nachrichten | Zeitraum | Treffer | Blöcke |")
    lines.append("|---|---|---|---|---|")
    lines.extend(overview_rows)
    lines.append("")
    lines.append("## Begriffshäufigkeit (chatübergreifend, Top 40, ohne Stoppwörter)")
    lines.append("| Begriff | Gesamt | Anzahl Chats | Chats |")
    lines.append("|---|---|---|---|")
    for entry in term_freq["global_top"][:40]:
        chats_str = ", ".join(entry["chats"][:6]) + ("…" if len(entry["chats"]) > 6 else "")
        lines.append(f"| {entry['term']} | {entry['count']} | {entry['num_chats']} | {chats_str} |")
    lines.append("")
    lines.append("## Fundstellen-Blöcke")
    for i, block in enumerate(kept_blocks, start=1):
        lines.append(render_block(block, i))
        lines.append("")
    lines.append("## Begriffshäufigkeit je Chat")
    for slug, top in term_freq["per_chat_top"].items():
        lines.append(f"### {slug}")
        top_str = ", ".join(f"{e['term']} ({e['count']})" for e in top[:15])
        lines.append(top_str if top_str else "(keine relevanten Begriffe)")
        lines.append("")

    CANDIDATES_PATH.write_text("\n".join(lines), encoding="utf-8")

    assert_no_phone_leak(CANDIDATES_PATH)

    size_kb = CANDIDATES_PATH.stat().st_size / 1024
    print(f"candidates.md geschrieben: {CANDIDATES_PATH} ({size_kb:.1f} KB, {len(kept_blocks)} Blöcke, {dropped} verworfen)")
    print("Sicherheitsnetz (Telefonnummer-Leak-Check): bestanden.")


if __name__ == "__main__":
    main()
