"""Extrahiert die WhatsApp-Export-ZIPs aus chats/ nach analysis/extracted/<slug>.txt.

Die Dateien in chats/ tragen keine .zip-Endung, sind aber echte ZIP-Archive.
Nur die enthaltene .txt-Transkriptdatei wird extrahiert; .vcf-Kontaktkarten
werden nie extrahiert oder gelesen (koennen echte Klarnamen enthalten).
"""
from __future__ import annotations

import sys
import zipfile

from common import CHATS_DIR, EXTRACTED_DIR, ensure_dirs, slugify


def main() -> None:
    if not CHATS_DIR.is_dir():
        sys.exit(f"Chat-Verzeichnis nicht gefunden: {CHATS_DIR}")

    ensure_dirs(EXTRACTED_DIR)

    files = sorted(p for p in CHATS_DIR.iterdir() if p.is_file())
    if not files:
        sys.exit(f"Keine Dateien in {CHATS_DIR} gefunden.")

    extracted = 0
    for path in files:
        if not zipfile.is_zipfile(path):
            print(f"Uebersprungen (kein ZIP): {path.name}")
            continue

        slug = slugify(path.name)
        with zipfile.ZipFile(path) as zf:
            txt_members = [n for n in zf.namelist() if n.lower().endswith(".txt")]
            if not txt_members:
                print(f"Warnung: kein .txt-Mitglied in {path.name}")
                continue
            if len(txt_members) > 1:
                print(f"Warnung: mehrere .txt-Mitglieder in {path.name}, nehme das erste: {txt_members}")

            data = zf.read(txt_members[0])

        out_path = EXTRACTED_DIR / f"{slug}.txt"
        out_path.write_bytes(data)
        extracted += 1
        print(f"{path.name!r} -> {out_path.relative_to(EXTRACTED_DIR.parents[1])} ({len(data)} Bytes)")

    print(f"\n{extracted} von {len(files)} Archiven extrahiert nach {EXTRACTED_DIR}")


if __name__ == "__main__":
    main()
