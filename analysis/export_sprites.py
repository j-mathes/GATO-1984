#!/usr/bin/env python3
"""Export GATO's vector sprites (BASIC DRAW strings) as PNG atlases plus JSON sprite sheets.

Findings this script is built on (verified against the bytes, see analysis/data_tables.md):

* GATO has NO pre-rendered CGA 2-bit bitmap blocks.  Neither GET/PUT arrays nor raw pixel data are stored in
  any EXE or data file.  Every picture is a BASIC DRAW macro string:
    - the ship / island silhouettes live in the external files OBX1, OBX3..OBX8 (16 DRAW strings each, one per
      view angle; every string starts with ``C0`` and is drawn from the waterline/keel centre, pen start = (0, 0));
    - a handful of further DRAW strings sit in the string-literal pool of Gato.exe / Gato1.exe / DEMO.EXE
      (title-screen and island/explosion pictures).
* The programs contain the CGA frame-buffer routines (interleaved rows, segment B800h: address
  (y>>1)*80 + (y&1)*0x2000) that implement DRAW/PSET/GET/PUT: Gato1.exe 0x10f8c-0x1137c, DEMO.EXE 0xbe52-0xc254.
  They run on pixels drawn by the DRAW strings, so a pixel capture exists only at run time.
* The only coordinate table is the 12 x (x, y, radius, aspect) DATA list (CIRCLE arguments on a 320x200 screen).

Rendering assumptions (flagged, not decoded from the binary):
* DRAW colour numbers: C0 is the background colour; C1/C2/C3 are rendered with CGA palette 0 (green, red, brown).
  The programs use only C0, C1 and C3.  The palette choice follows the manual's "green = own submarine, red = enemy".
* A string without a C command is drawn in colour 3 (the BASIC default foreground).
* S (scale) is supported (step = n * S / 4, S4 = 1:1) but no string in the game uses it.
* CGA pixels are about 1.2 times taller than wide on a 4:3 monitor; PNGs are 1:1 pixel art.

Outputs (all under remake/public/assets/):
  sprites/obx<N>_<name>.png            16-frame atlas, outline (ink on transparent), cell grid in the JSON
  sprites/obx<N>_<name>_silhouette.png same atlas with the closed outline filled (flood fill from outside)
  sprites/draw_<exe>_<offset>.png      embedded DRAW pictures, in palette-0 colour
  sprites/sprite_sheets.json           every sheet: frames, cell rectangles, origin, bounds, DRAW source
  sprites/chart_circles.json           the 12-record on-screen DATA table
"""

import re
import sys
from collections import deque
from pathlib import Path

from PIL import Image as PILImage

import inspect_exe as ie
import parse_scenarios as ps
import scan_data_tables as sdt

ROOT = ie.ROOT
OUT = ROOT / "remake" / "public" / "assets" / "sprites"
PAD = 2
CGA_PALETTE0 = {1: (0, 170, 0), 2: (170, 0, 0), 3: (170, 85, 0)}
INK_OUTLINE = (255, 255, 255)

TOKEN = re.compile(r"\s*(?:(?P<pre>[BN]*)(?P<dir>[UDLREFGH])(?P<n>\d*)|C(?P<c>\d+)|S(?P<s>\d+)|A(?P<a>\d)"
                   r"|M(?P<mx>[+-]?\d+),(?P<my>[+-]?\d+)|(?P<semi>;))")
STEP = {"U": (0, -1), "D": (0, 1), "L": (-1, 0), "R": (1, 0), "E": (1, -1), "F": (1, 1), "G": (-1, 1), "H": (-1, -1)}


def bresenham(x0, y0, x1, y1):
    dx, dy = abs(x1 - x0), -abs(y1 - y0)
    sx, sy = (1 if x0 < x1 else -1), (1 if y0 < y1 else -1)
    err = dx + dy
    while True:
        yield x0, y0
        if (x0, y0) == (x1, y1):
            return
        e2 = 2 * err
        if e2 >= dy:
            err += dy
            x0 += sx
        if e2 <= dx:
            err += dx
            y0 += sy


def interpret(text):
    """Run a DRAW string from pen (0, 0); return {(x, y): colour} pixels, final pen and the colours used."""
    x = y = 0
    colour, scale, angle = 3, 4, 0
    pixels, used = {}, set()
    pos = 0
    while pos < len(text):
        m = TOKEN.match(text, pos)
        if not m or m.end() == pos:
            raise ValueError(f"unsupported DRAW syntax at {pos}: {text[pos:pos + 12]!r}")
        pos = m.end()
        if m.group("semi"):
            continue
        if m.group("c") is not None:
            colour = int(m.group("c"))
        elif m.group("s") is not None:
            scale = int(m.group("s"))
        elif m.group("a") is not None:
            angle = int(m.group("a"))
        elif m.group("mx") is not None:
            raise ValueError("M (absolute move) is not used by any GATO string")
        else:
            pre, d = m.group("pre"), m.group("dir")
            n = int(m.group("n")) if m.group("n") else 1
            dx, dy = STEP[d]
            for _ in range(angle):  # rotate 90 degrees clockwise per A step
                dx, dy = -dy, dx
            nx, ny = x + round(dx * n * scale / 4), y + round(dy * n * scale / 4)
            if "B" not in pre:
                used.add(colour)
                for p in bresenham(x, y, nx, ny):
                    pixels[p] = colour
            if "N" not in pre:
                x, y = nx, ny
    return pixels, (x, y), used


def bounds(pix):
    xs = [p[0] for p in pix]
    ys = [p[1] for p in pix]
    return (min(xs), min(ys), max(xs), max(ys)) if pix else None


def fill_interior(pix, box):
    """Pixels enclosed by the outline (4-connected flood fill from outside the padded box)."""
    x0, y0, x1, y1 = box
    x0, y0, x1, y1 = x0 - 1, y0 - 1, x1 + 1, y1 + 1
    outside, todo = set(), deque([(x0, y0)])
    while todo:
        p = todo.popleft()
        if p in outside or p in pix or not (x0 <= p[0] <= x1 and y0 <= p[1] <= y1):
            continue
        outside.add(p)
        todo.extend(((p[0] + 1, p[1]), (p[0] - 1, p[1]), (p[0], p[1] + 1), (p[0], p[1] - 1)))
    return {(x, y) for x in range(x0 + 1, x1) for y in range(y0 + 1, y1)
            if (x, y) not in outside and (x, y) not in pix}


def render_atlas(frames_pix, name):
    boxes = [bounds(p) for p in frames_pix]
    real = [b for b in boxes if b]
    minx, miny = min(b[0] for b in real), min(b[1] for b in real)
    maxx, maxy = max(b[2] for b in real), max(b[3] for b in real)
    cw, ch = maxx - minx + 1 + 2 * PAD, maxy - miny + 1 + 2 * PAD
    ox, oy = PAD - minx, PAD - miny  # pen start inside a cell
    n = len(frames_pix)
    outline = PILImage.new("RGBA", (cw * n, ch), (0, 0, 0, 0))
    solid = PILImage.new("RGBA", (cw * n, ch), (0, 0, 0, 0))
    cells = []
    for i, pix in enumerate(frames_pix):
        cx = i * cw
        inside = fill_interior(pix, boxes[i]) if boxes[i] else set()
        for (x, y) in pix:
            outline.putpixel((cx + ox + x, oy + y), INK_OUTLINE + (255,))
            solid.putpixel((cx + ox + x, oy + y), (0, 0, 0, 255))
        for (x, y) in inside:
            solid.putpixel((cx + ox + x, oy + y), (0, 0, 0, 255))
        cells.append({"cell": {"x": cx, "y": 0, "w": cw, "h": ch}, "origin": {"x": cx + ox, "y": oy},
                      "ink_pixels": len(pix), "filled_pixels": len(pix) + len(inside),
                      "bounds_rel_origin": (None if not boxes[i] else
                                            {"min_x": boxes[i][0], "min_y": boxes[i][1],
                                             "max_x": boxes[i][2], "max_y": boxes[i][3]})})
    OUT.mkdir(parents=True, exist_ok=True)
    outline.save(OUT / f"{name}.png")
    solid.save(OUT / f"{name}_silhouette.png")
    return cw, ch, (ox, oy), cells


def render_single(pix, path):
    box = bounds(pix)
    w, h = box[2] - box[0] + 1 + 2 * PAD, box[3] - box[1] + 1 + 2 * PAD
    img = PILImage.new("RGBA", (w, h), (0, 0, 0, 0))
    for (x, y), c in pix.items():
        rgb = CGA_PALETTE0.get(c)
        if rgb:
            img.putpixel((x - box[0] + PAD, y - box[1] + PAD), rgb + (255,))
    img.save(path)
    return w, h, (PAD - box[0], PAD - box[1])


def export_obx():
    sheets = []
    for path in sorted(ie.SRC.glob("OBX*")):
        n = int(path.name[3:])
        _, lines = ps.read_lines(path)
        frames = []
        for text in lines:
            pix, pen_end, _ = interpret(text)
            frames.append((text, pix, pen_end))
        name = f"obx{n}_{ps.OBJECT_NAMES.get(n, 'object')}"
        cw, ch, origin, cells = render_atlas([f[1] for f in frames], name)
        for i, (c, (text, _, pen_end)) in enumerate(zip(cells, frames)):
            c.update(index=i, draw_string=text, pen_end={"x": pen_end[0], "y": pen_end[1]})
        sheets.append({
            "id": name, "source": path.name, "object_type": n, "object_name": ps.OBJECT_NAMES.get(n),
            "kind": "view_angle_frames", "frame_count": len(cells),
            "image_outline": f"{name}.png", "image_silhouette": f"{name}_silhouette.png",
            "cell_size": {"w": cw, "h": ch}, "origin_in_cell": {"x": origin[0], "y": origin[1]},
            "origin_meaning": "pen start of every DRAW string = centre of the keel on the waterline; y grows downward, "
                              "so the hull rises to negative y (OBX1 islands rise from y=0 the same way)",
            "colour": "every string starts with C0 (background colour): the original draws a mask/outline that is "
                      "then filled or used as a silhouette; the PNGs use white (outline) / black (silhouette)",
            "frame_meaning": "inferred: 16 headings at 22.5 degree steps (frame 0/8 end-on, 4/12 broadside)",
            "frames": cells,
        })
    return sheets


# Keyed by DRAW string length.  Purposes are read from the rendered shapes (visual inference, not from the code).
PURPOSE = {
    15: "green isosceles triangle, 41 px wide and 20 px tall (C1 BD10 R40 H20 G20); use not determined",
    164: "digit glyphs '0123456789' drawn side by side in colour 1 (green): a vector number font (visual inference)",
    179: "ship profile (hull line, masts, wake) in colour 3; Gato.exe variant; title-screen use inferred",
    188: "ship profile (hull line, masts, wake) in colour 3; Gato1/DEMO variant",
    190: "ship profile in colour 3; Gato.exe variant of the 188-character string (drawn from the same start)",
    50: "second piece of the Gato.exe title picture (lines at lower left of the ship); exact subject not determined",
    41: "second piece of the ship picture (BD5 L23 ...), no C command so default colour 3; exact subject not determined",
    113: "island outline, colour 3 (brown)",
    129: "island outline (largest), colour 3 (brown)",
    110: "island outline, colour 3 (brown)",
}


def export_embedded():
    seen, sheets = {}, []
    for exe in ("Gato.exe", "Gato1.exe", "DEMO.EXE"):
        im = sdt.Image(exe)
        for kind, off, ptr, text, _ in sdt.command_strings(im):
            if kind != "DRAW":
                continue
            seen.setdefault(text, []).append({"exe": exe, "file_offset": f"0x{off:05x}", "ds_offset": f"0x{ptr:04x}"})
    for text, sources in seen.items():
        pix, pen_end, used = interpret(text)
        first = sources[0]
        name = f"draw_{first['exe'].split('.')[0].lower()}_{first['file_offset'][2:]}"
        w, h, origin = render_single(pix, OUT / f"{name}.png")
        box = bounds(pix)
        sheets.append({
            "id": name, "kind": "embedded_draw_string", "image": f"{name}.png", "sources": sources,
            "draw_string": text, "colours_used": sorted(used), "size": {"w": w, "h": h},
            "origin_in_image": {"x": origin[0], "y": origin[1]},
            "bounds_rel_origin": {"min_x": box[0], "min_y": box[1], "max_x": box[2], "max_y": box[3]},
            "pen_end": {"x": pen_end[0], "y": pen_end[1]},
            "purpose": PURPOSE.get(len(text), "not determined"),
        })
    return sheets


def export_chart():
    im = sdt.Image("Gato1.exe")
    vals = [float(v) for v in im.d[im.data_txt[0]:im.data_txt[1]].decode("ascii").replace(" ", "").split(",")]
    recs = [{"index": i // 4 + 1, "x": vals[i], "y": vals[i + 1], "radius": vals[i + 2], "aspect": vals[i + 3]}
            for i in range(0, len(vals), 4)]
    return {"_about": "The 12-record DATA list in Gato1.exe (file 0x13d32) and DEMO.EXE (0xeff2): (x, y, radius, aspect) in "
                      "320x200 screen pixels, inferred to be CIRCLE arguments. Identical in both programs. How the records "
                      "map to the MXP islands is not established.",
            "records": recs}


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    sheets = export_obx() + export_embedded()
    doc = {"_about": "GATO vector sprites exported from DRAW strings. See export_sprites.py for assumptions. No raw CGA "
                     "2bpp bitmap data exists in the game files; GET/PUT arrays only exist at run time.",
           "screen": {"width": 320, "height": 200, "mode": "CGA 320x200 4-colour (inferred from DRAW colours C0..C3)",
                      "palette0": {"0": "background", "1": "#00aa00 green", "2": "#aa0000 red", "3": "#aa5500 brown"},
                      "pixel_aspect_hint": "about 1.2 (taller than wide) on a 4:3 monitor"},
           "capture_routines": {"Gato1.exe": "0x10f8c-0x1137c (CGA interleaved-row pixel routines)",
                                "DEMO.EXE": "0xbe52-0xc254 (same code)"},
           "sheets": sheets}
    (OUT / "sprite_sheets.json").write_text(ps.dump_json(doc, width=140) + "\n", encoding="utf-8")
    (OUT / "chart_circles.json").write_text(ps.dump_json(export_chart(), width=140) + "\n", encoding="utf-8")
    for s in sheets:
        print(s["id"], s.get("frame_count", ""), s.get("cell_size") or s.get("size"))
    print(f"Wrote {len(sheets)} sheets to {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    sys.exit(main())
