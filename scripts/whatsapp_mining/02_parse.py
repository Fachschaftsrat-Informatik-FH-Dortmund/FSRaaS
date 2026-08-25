"""Parst die extrahierten WhatsApp-Transkripte in strukturierte, pseudonymisierte JSONL.

Siehe Plan (specs-fremd, unter .claude/plans/) fuer die validierten Parsing-Regeln.
Wichtig: Klassifizierung ueber exakte feste Strings (endswith/==), nie ueber offene
Klammer-Regex wie <[^<>]*bearbeitet[^<>]*> -- Nachrichtentext kann ein unverschlossenes
< enthalten (z. B. Emoticon <3), das sonst faelschlich als System-Tag erkannt wird.
"""
from __future__ import annotations

import re
import sys
from pathlib import Path
from typing import Any

from common import (
    EXTRACTED_DIR,
    MANIFEST_PATH,
    PARSED_DIR,
    PSEUDONYM_DIR,
    Pseudonymizer,
    assert_no_phone_leak,
    ensure_dirs,
    redact_phone_numbers,
    write_json,
    write_jsonl,
)

MSG_RE = re.compile(r"^‎?(\d{2}\.\d{2}\.\d{2,4}), (\d{2}:\d{2}) - (.*)$")
SENDER_RE = re.compile(r"^‎?([^\n:]{1,60}?): (.*)$", re.S)

EDITED_SUFFIX = "<Diese Nachricht wurde bearbeitet.>"
DELETED_BODIES = {
    "Diese Nachricht wurde gelöscht.",
    "Du hast diese Nachricht gelöscht.",
}
MEDIA_BODY = "<Medien ausgeschlossen>"
POLL_VOTE_RE = re.compile(r"\(‎?\d+\xa0?Stimmen\)")
VCF_RE = re.compile(r"\S+\.vcf\b.*$", re.M)

SYSTEM_EVENT_RULES: list[tuple[str, str]] = [
    ("hinzugefügt", "member_added"),
    ("entfernt", "member_removed"),
    ("verlassen", "member_removed"),
    ("erstellt", "group_created"),
    ("beigetreten", "member_joined"),
    ("admin", "admin_changed"),
]


def classify_system_event(text: str) -> str:
    lowered = text.lower()
    if "telefonnummer" in lowered and "geändert" in lowered:
        return "phone_changed"
    for keyword, event in SYSTEM_EVENT_RULES:
        if keyword in lowered:
            return event
    return "other"


def parse_timestamp(date_str: str, time_str: str) -> str:
    day, month, year = date_str.split(".")
    if len(year) == 2:
        year = str(2000 + int(year))
    return f"{year}-{int(month):02d}-{int(day):02d}T{time_str}:00"


def strip_lrm(s: str) -> str:
    return s.replace("‎", "")


def parse_chat(text: str, pseudo: Pseudonymizer) -> list[dict[str, Any]]:
    lines = text.split("\n")
    raw_records: list[dict[str, Any]] = []
    current: dict[str, Any] | None = None

    for line in lines:
        m = MSG_RE.match(line)
        if m:
            if current is not None:
                raw_records.append(current)
            date_str, time_str, rest = m.groups()
            sm = SENDER_RE.match(rest)
            if sm:
                sender_raw, first_body = sm.groups()
                current = {
                    "ts": parse_timestamp(date_str, time_str),
                    "is_system": False,
                    "sender_raw": strip_lrm(sender_raw).strip(),
                    "body_lines": [first_body],
                }
            else:
                current = {
                    "ts": parse_timestamp(date_str, time_str),
                    "is_system": True,
                    "sender_raw": None,
                    "body_lines": [rest],
                }
        else:
            if current is not None:
                current["body_lines"].append(line)
            # Zeilen vor der ersten erkannten Nachricht (sollte nicht vorkommen) werden verworfen.

    if current is not None:
        raw_records.append(current)

    records: list[dict[str, Any]] = []
    next_id = 1
    for rec in raw_records:
        body = "\n".join(rec["body_lines"])

        if rec["is_system"]:
            records.append(
                {
                    "id": next_id,
                    "ts": rec["ts"],
                    "sender": None,
                    "type": "system",
                    "event": classify_system_event(body),
                    "text": None,
                    "is_poll": False,
                    "edited": False,
                }
            )
            next_id += 1
            continue

        sender = pseudo.pseudonym_for(rec["sender_raw"])
        edited = False
        if body.rstrip().endswith(EDITED_SUFFIX):
            edited = True
            body = body.rstrip()[: -len(EDITED_SUFFIX)].rstrip()

        if body.strip() in DELETED_BODIES:
            records.append(
                {"id": next_id, "ts": rec["ts"], "sender": sender, "type": "deleted", "text": None, "is_poll": False, "edited": False}
            )
            next_id += 1
            continue

        if body.strip() == MEDIA_BODY:
            records.append(
                {"id": next_id, "ts": rec["ts"], "sender": sender, "type": "media_omitted", "text": None, "is_poll": False, "edited": False}
            )
            next_id += 1
            continue

        if VCF_RE.search(body):
            body = VCF_RE.sub("[Kontaktkarte]", body)
            records.append(
                {"id": next_id, "ts": rec["ts"], "sender": sender, "type": "contact_card", "text": "[Kontaktkarte]", "is_poll": False, "edited": edited}
            )
            next_id += 1
            continue

        is_poll = bool(POLL_VOTE_RE.search(body))
        body = redact_phone_numbers(body)
        records.append(
            {
                "id": next_id,
                "ts": rec["ts"],
                "sender": sender,
                "type": "edited" if edited else "normal",
                "text": body,
                "is_poll": is_poll,
                "edited": edited,
            }
        )
        next_id += 1

    return records


def main() -> None:
    if not EXTRACTED_DIR.is_dir() or not any(EXTRACTED_DIR.iterdir()):
        sys.exit(f"Keine extrahierten Dateien in {EXTRACTED_DIR} -- zuerst 01_extract.py ausfuehren.")

    ensure_dirs(PARSED_DIR, PSEUDONYM_DIR)

    manifest: dict[str, Any] = {}

    for txt_path in sorted(EXTRACTED_DIR.glob("*.txt")):
        slug = txt_path.stem
        text = txt_path.read_text(encoding="utf-8")
        pseudo = Pseudonymizer()
        records = parse_chat(text, pseudo)

        out_path = PARSED_DIR / f"{slug}.jsonl"
        write_jsonl(out_path, records)
        write_json(PSEUDONYM_DIR / f"{slug}.json", pseudo.mapping)

        type_counts: dict[str, int] = {}
        timestamps: list[str] = []
        for r in records:
            type_counts[r["type"]] = type_counts.get(r["type"], 0) + 1
            timestamps.append(r["ts"])

        manifest[slug] = {
            "source_file": txt_path.name,
            "message_count": len(records),
            "type_counts": type_counts,
            "unique_senders": len(pseudo.mapping),
            "date_range": [min(timestamps), max(timestamps)] if timestamps else [None, None],
        }

        print(f"{slug}: {len(records)} Nachrichten, {len(pseudo.mapping)} Absender, Typen={type_counts}")

    write_json(MANIFEST_PATH, manifest)

    # Sicherheitsnetz: alle geschriebenen Dateien ausser den Pseudonym-Maps auf Telefonnummer-Leaks pruefen.
    for jsonl_path in PARSED_DIR.glob("*.jsonl"):
        assert_no_phone_leak(jsonl_path)
    assert_no_phone_leak(MANIFEST_PATH)

    total = sum(m["message_count"] for m in manifest.values())
    print(f"\nGesamt: {total} Nachrichten in {len(manifest)} Chats. Manifest: {MANIFEST_PATH}")
    print("Sicherheitsnetz (Telefonnummer-Leak-Check auf Nicht-Pseudonym-Dateien): bestanden.")


if __name__ == "__main__":
    main()
