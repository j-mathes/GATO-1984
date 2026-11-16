#!/usr/bin/env python3
"""Compare the extracted static layers (remake/public/assets/cockpit_layouts.json) with screenshots of the original game.

The screenshots in analysis/reference_screenshots are 320x200 captures; each pixel is matched to the nearest colour of the screen's palette.
Text cells (BIOS font, not baked into the layers) and the rectangles that hold moving things (scope picture, needles, values, trails)
are ignored.  Expected: 0 differing pixels for the damage report (also with damaged compartments), a few hundred at most elsewhere
(the screenshots show un-erased trails of the sweep, ships and the boat).
"""

import base64
import glob
import json
import sys
from pathlib import Path

from PIL import Image

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
W, H = 320, 200

# (screenshot id prefix, screen, ignored rectangles x0,y0,x1,y1)
CASES = [
    ("2658844", "damage_report", []),
    ("2665438", "damage_report", [], {"damaged": (2, 6)}),
    ("4519144", "radar", [(224, 23, 300, 175)]),
    ("4518765", "chart", []),
    ("2661310", "captains_log", [(0, 80, 319, 199)]),
    ("2660548", "quadrant_map", [(8, 8, 311, 191)]),
    ("2663438", "control_room", [(0, 0, 319, 99), (0, 100, 205, 178), (209, 100, 319, 199), (61, 181, 113, 193), (270, 181, 296, 194)]),
]


def main():
    doc = json.loads((ROOT / "remake" / "public" / "assets" / "cockpit_layouts.json").read_text())
    for case in CASES:
        key, screen, ignore = case[0], case[1], case[2]
        opts = case[3] if len(case) > 3 else {}
        s = doc["screens"][screen]
        pal = [tuple(int(c[i:i + 2], 16) for i in (1, 3, 5)) for c in s["palette"]]
        raw = base64.b64decode(s["staticPacked"])
        mine = []
        for b in raw:
            mine += [(b >> 6) & 3, (b >> 4) & 3, (b >> 2) & 3, b & 3]
        for k in opts.get("damaged", ()):
            o = s["dynamic"]["overlays"][str(k)]
            for x, y in o["pixels"]:
                mine[y * W + x] = 2
            lx, ly = o["light"]
            for dy, row in enumerate(doc["sprites"]["lightOn"]):
                for dx, ch in enumerate(row):
                    if ch != "0":
                        mine[(ly + dy) * W + lx + dx] = int(ch)
        mask = set()
        for t in s["text"]:
            for k in range(len(t["text"])):
                for yy in range(8):
                    for xx in range(8):
                        mask.add(((t["col"] - 1 + k) * 8 + xx, (t["row"] - 1) * 8 + yy))
        path = glob.glob(str(HERE / "reference_screenshots" / f"{key}*"))
        if not path:
            print(f"{screen:14} {key}: screenshot missing")
            continue
        ref = Image.open(path[0]).convert("RGB")
        n = tot = 0
        for y in range(H):
            for x in range(W):
                if (x, y) in mask or any(a <= x <= c and b <= y <= e for a, b, c, e in ignore):
                    continue
                r = min(range(4), key=lambda i: sum((ref.getpixel((x, y))[j] - pal[i][j]) ** 2 for j in range(3)))
                m = mine[y * W + x]
                tot += bool(r or m)
                n += r != m
        print(f"{screen:14} {key}  {n:5d} differing of {tot:6d} compared pixels")


if __name__ == "__main__":
    sys.exit(main())
