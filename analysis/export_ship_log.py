#!/usr/bin/env python3
"""Export the captain's-log ship list (Original/Log1, 92 records x 32 bytes) to remake/src/data/ship_log.json.

Record layout, from the FIELD/GET statements in Gato1.exe (0x09983-0x09c24 and 0x0b108-0x0b154):
    bytes 0-1   MKI$  times sunk flag (0 = not yet sunk; the game picks the next record while this is > 0)
    bytes 2-16  15-character ship name, space padded
    bytes 17-21 5-byte field; its first two bytes are MKI$ tonnage (little endian), the rest is padding
    bytes 22-31 10-character date sunk, "MM-DD-YYYY" (01-01-1980 = never sunk)

Which records a sunk vessel draws from (Gato1.exe 0x09a1c-0x09b2e, record = base + INT(RND*span)):
    freighter 1+RND*20, tanker 26+RND*8, troop carrier 36+RND*8, patrol boat 46+RND*16, destroyer 66+RND*19.
If the picked record is already marked sunk the game advances to the next one: (n MOD 85) + 1.
"""
import struct
import sys
from pathlib import Path

import parse_scenarios as ps

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "remake" / "src" / "data" / "ship_log.json"
BANDS = {"4": (1, 20, "freighter"), "5": (26, 8, "tanker"), "6": (36, 8, "troop_carrier"),
         "7": (46, 16, "patrol_boat"), "8": (66, 19, "destroyer")}


def main():
    d = (ROOT / "Original" / "Log1").read_bytes()
    assert len(d) % 32 == 0
    records = []
    for i in range(len(d) // 32):
        r = d[i * 32:(i + 1) * 32]
        if not r[2:17].strip(b"\x00 "):
            continue
        records.append({"record": i + 1, "name": r[2:17].decode("ascii").strip(),
                        "tonnage": struct.unpack_from("<H", r, 17)[0],
                        "date_sunk": r[22:32].decode("ascii"), "sunk_flag": struct.unpack_from("<H", r, 0)[0]})
    doc = {"_about": "Captain's log ship list from Original/Log1 (same structure as Original/LOG). See export_ship_log.py.",
           "record_wrap": 85,
           "draw_bands": {k: {"first_record": v[0], "span": v[1], "type": v[2]} for k, v in BANDS.items()},
           "records": records}
    OUT.write_text(ps.dump_json(doc, width=140) + "\n", encoding="utf-8")
    print(len(records), "records ->", OUT.relative_to(ROOT))


if __name__ == "__main__":
    sys.exit(main())
