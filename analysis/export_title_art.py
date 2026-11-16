#!/usr/bin/env python3
"""Rebuild the 1984 GATO title artwork from Original/Gato.exe and export it for the remake.

What the title is (verified against the bytes, see analysis/title_art.md):

* There is NO stored bitmap (no 16,384-byte B800h dump, no RLE stream).  GATO.EXE is compiled BASIC and *draws* its title at
  run time on a 320x200 four-colour screen (SCREEN 1) with DRAW, PAINT, LINE, PSET, CIRCLE and LOCATE/PRINT.  The only art
  data in the EXE are the DRAW macro strings (Gato.exe 0x561e-0x5e12, string descriptors at DS:0x8da.., DS = file 0x4d40).
* The program body is file 0x61a-0x1010, the BASIC runtime starts at 0x1010.  The p-code was read with
  analysis/trace_tools.py; the runtime routines were identified from their disassembly:
      18f5 LINE start point   18fb LINE   1904 LINE ,B   193d LINE ,BF   1983 PSET   1d5c PAINT   2086 CIRCLE
      1ee4 DRAW   0a41/0a5b SCREEN args   0808/0822 COLOR args   0bce/0be8 LOCATE row/col   078b CLS
      22c3/22d7 PRINT string   11fb x-y   1210 x+y   2435/2480 CINT
* Runtime facts that change the picture and are reproduced here:
    - DRAW scale (S n) is sticky between DRAW statements and is applied per axis as trunc(n*S/4) (runtime 0x2005).  The
      Spectrum HoloByte prism "C1BD10R40H20G20" is therefore drawn at S2 (half size) because the logo letters set S2.
    - LINE is a Bresenham DDA with the error term seeded with major/2 (runtime 0x2c0e).
    - COLOR n (n >= 8) writes the CGA colour-select register with the intensity bit set (runtime 0x0822 ORs 0x10).
* Four key frames are rebuilt, in program order:  spectrum_logo (0x6a6-0x979), title_letters (0x979-0xa3f, the GATO letters
  before the venetian-blind wipe), title (0xa3f-0xbd2, the held title page: striped letters + credits) and launcher_menu
  (0xda2-0xf17, sky/sea with the surfaced ship behind the four-item menu).

Inferred, not decoded (flagged in the output JSON as notes): the colour-select register default of the BIOS mode set
(0x30: palette 1, intensified), the palette left in effect by COLOR 9, the exact CIRCLE pixels of the (c) ring (rebuilt as a
7 x 6 midpoint ellipse), and the glyph shapes of the BIOS 8x8 ROM font (text is exported as a text layer, not baked in).

Outputs (remake/public/assets/):
  title_screen.json            every frame as 200 rows of 320 digits (0-3), palette, background and text layer
  title_screen.png             the main frame ("title") as a 320x200 indexed PNG (graphics layer, exact palette)
  title_screen_preview.png     the same frame at 3x with the text layer approximated (preview only)
  title_frames/<id>.png        indexed PNG of each frame
"""

import base64  # noqa: F401  (kept for callers that want to pack B800h video memory)
import json
import math
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
EXE = ROOT / "Original" / "Gato.exe"
OUT = ROOT / "remake" / "public" / "assets"
DS_BASE = 0x4D40  # file offset of DS:0000 (string descriptor len/ptr pairs live in DS)
W, H = 320, 200

CGA16 = [
    (0, 0, 0), (0, 0, 170), (0, 170, 0), (0, 170, 170), (170, 0, 0), (170, 0, 170), (170, 85, 0), (170, 170, 170),
    (85, 85, 85), (85, 85, 255), (85, 255, 85), (85, 255, 255), (255, 85, 85), (255, 85, 255), (255, 255, 85), (255, 255, 255),
]
CGA_NAMES = ["black", "blue", "green", "cyan", "red", "magenta", "brown", "light grey", "dark grey", "light blue", "light green",
             "light cyan", "light red", "light magenta", "yellow", "white"]
PALETTE_COLOURS = {  # CGA colour numbers for pixel values 1..3
    (0, False): (2, 4, 6), (0, True): (10, 12, 14), (1, False): (3, 5, 7), (1, True): (11, 13, 15),
}


class ColorState:
    """Contents of the CGA colour-select register as BASIC's COLOR statement leaves it."""

    def __init__(self, background=0, palette=1, intense=True):
        self.background, self.palette, self.intense = background, palette, intense

    def color(self, background, palette=None):
        # runtime 0x0822: background >= 8 is written with bit 4 (intensity) set, smaller values clear it
        self.background = background
        self.intense = background >= 8
        if palette is not None:
            self.palette = palette

    def rgb(self):
        cols = [self.background & 15, *PALETTE_COLOURS[(self.palette, self.intense)]]
        return cols, [CGA16[c] for c in cols]


class Screen:
    """320x200 four-colour frame buffer plus the pen / DRAW state of the BASIC runtime."""

    def __init__(self):
        self.color_state = ColorState()
        self.px = [[0] * W for _ in range(H)]
        self.text = {}
        self.pen = (0, 0)
        self.scale = 0  # runtime byte [0x89]; 0 means "no scaling" (same as S4) and survives between DRAW statements
        self.off_screen = 0

    # --- statements -----------------------------------------------------------------------------------------------
    def cls(self):
        self.px = [[0] * W for _ in range(H)]
        self.text = {}

    def plot(self, x, y, c):
        if 0 <= x < W and 0 <= y < H:
            self.px[y][x] = c
        else:
            self.off_screen += 1

    def pset(self, x, y, c):
        self.plot(x, y, c)
        self.pen = (x, y)

    def line(self, x0, y0, x1, y1, c):
        """Runtime 0x2c0e: major-axis DDA, error seeded with major/2, plots the start pixel first."""
        dx, dy = abs(x1 - x0), abs(y1 - y0)
        sx, sy = (1 if x1 >= x0 else -1), (1 if y1 >= y0 else -1)
        major, minor = (dx, dy) if dx >= dy else (dy, dx)
        err, x, y = major >> 1, x0, y0
        for _ in range(major + 1):
            self.plot(x, y, c)
            err += minor
            if err >= major:
                err -= major
                if dx >= dy:
                    y += sy
                else:
                    x += sx
            if dx >= dy:
                x += sx
            else:
                y += sy

    def box(self, x0, y0, x1, y1, c):
        self.line(x0, y0, x1, y0, c)
        self.line(x1, y0, x1, y1, c)
        self.line(x1, y1, x0, y1, c)
        self.line(x0, y1, x0, y0, c)

    def box_fill(self, x0, y0, x1, y1, c):
        for y in range(min(y0, y1), max(y0, y1) + 1):
            self.line(min(x0, x1), y, max(x0, x1), y, c)

    def paint(self, x, y, paint, border):
        """PAINT (x,y),paint,border: 4-connected fill of everything that is not the border colour."""
        if not (0 <= x < W and 0 <= y < H) or self.px[y][x] == border:
            return
        stack = [(x, y)]
        while stack:
            cx, cy = stack.pop()
            if self.px[cy][cx] in (border, paint) and (cx, cy) != (x, y):
                continue
            left = cx
            while left > 0 and self.px[cy][left - 1] != border:
                left -= 1
            right = cx
            while right < W - 1 and self.px[cy][right + 1] != border:
                right += 1
            for xx in range(left, right + 1):
                self.px[cy][xx] = paint
            for ny in (cy - 1, cy + 1):
                if 0 <= ny < H:
                    run = False
                    for xx in range(left, right + 1):
                        free = self.px[ny][xx] not in (border, paint)
                        if free and not run:
                            stack.append((xx, ny))
                        run = free

    def circle(self, cx, cy, rx, ry, c):
        """Midpoint ellipse (the runtime's exact CIRCLE pixels were not decoded)."""
        x, y = 0, ry
        d1 = ry * ry - rx * rx * ry + rx * rx / 4
        while 2 * ry * ry * x < 2 * rx * rx * y:
            self._quad(cx, cy, x, y, c)
            if d1 < 0:
                d1 += 2 * ry * ry * x + 3 * ry * ry
            else:
                d1 += 2 * ry * ry * x - 2 * rx * rx * y + 2 * rx * rx + 3 * ry * ry
                y -= 1
            x += 1
        d2 = ry * ry * (x + 0.5) ** 2 + rx * rx * (y - 1) ** 2 - rx * rx * ry * ry
        while y >= 0:
            self._quad(cx, cy, x, y, c)
            if d2 > 0:
                d2 += -2 * rx * rx * y + 3 * rx * rx
            else:
                d2 += 2 * ry * ry * x - 2 * rx * rx * y + 3 * rx * rx + 2 * ry * ry
                x += 1
            y -= 1

    def _quad(self, cx, cy, x, y, c):
        for sx in (-1, 1):
            for sy in (-1, 1):
                self.plot(cx + sx * x, cy + sy * y, c)

    def draw(self, text):
        """DRAW macro language (runtime 0x1ee4): U D L R E F G H, B, N, C, S; no M/A/X are used by GATO."""
        steps = {"U": (0, -1), "D": (0, 1), "L": (-1, 0), "R": (1, 0), "E": (1, -1), "F": (1, 1), "G": (-1, 1), "H": (-1, -1)}
        colour, blank, keep, i = 3, False, False, 0
        while i < len(text):
            ch = text[i]
            i += 1
            if ch in "; ":
                continue
            j = i
            while j < len(text) and text[j].isdigit():
                j += 1
            num = int(text[i:j]) if j > i else None
            i = j
            if ch == "B":
                blank = True
            elif ch == "N":
                keep = True
            elif ch == "C":
                colour = num
            elif ch == "S":
                self.scale = num
            elif ch in steps:
                n = 1 if num is None else num
                ux, uy = steps[ch]
                mx, my = self._scaled(ux * n), self._scaled(uy * n)
                x, y = self.pen
                nx, ny = x + mx, y + my
                if not blank:
                    self.line(x, y, nx, ny, colour)
                if not keep:
                    self.pen = (nx, ny)
                blank = keep = False
            else:
                raise ValueError(f"unsupported DRAW command {ch!r}")

    def _scaled(self, v):
        return v if self.scale == 0 else int(math.trunc(v * self.scale / 4))

    def locate_print(self, row, col, s):
        self.text[(row, col)] = s

    # --- export ---------------------------------------------------------------------------------------------------
    def snapshot(self, frame_id, description, code_range):
        cga, rgb = self.color_state.rgb()
        return {
            "id": frame_id,
            "description": description,
            "program_offsets": code_range,
            "colorState": {"background": self.color_state.background, "palette": self.color_state.palette,
                           "intensified": self.color_state.intense},
            "paletteCga": cga,
            "paletteNames": [CGA_NAMES[c] for c in cga],
            "palette": ["#%02x%02x%02x" % c for c in rgb],
            "rows": ["".join(str(v) for v in row) for row in self.px],
            "text": [{"row": r, "col": c, "text": s, "colorIndex": 3} for (r, c), s in sorted(self.text.items())],
        }


class Exe:
    def __init__(self, path):
        self.d = path.read_bytes()

    def string(self, desc):
        """Text of the BASIC string constant whose descriptor sits at DS:desc (length word, pointer word)."""
        n = int.from_bytes(self.d[DS_BASE + desc:DS_BASE + desc + 2], "little")
        ptr = int.from_bytes(self.d[DS_BASE + desc + 2:DS_BASE + desc + 4], "little")
        return self.d[DS_BASE + ptr:DS_BASE + ptr + n].decode("latin-1")


# String-constant descriptors as they appear in the p-code (trace_tools.py Gato 0x600 0x1010)
D_LOGO = (0x8DA, 0x97C, 0xA20, 0xACC)
D_PRISM, D_PRESENTS = 0xB94, 0xBC0
D_LETTERS = (0xBD0, 0xC16, 0xC56, 0xC7A)
D_TM, D_CLASS, D_BY, D_COPY, D_HOLO = 0xB86, 0xCCE, 0xCE2, 0xD02, 0xD1A
D_COAST, D_SHIP1, D_SHIP2 = 0xD6A, 0xD96, 0xE4E
D_MENU = (0xE8C, 0xEAC, 0xEC4, 0xEE8, 0xEF6, 0xF16)
LETTER_PAINT = ((80, 25), (127, 25), (190, 25), (240, 25))

EXPECT = {D_PRISM: "C1BD10R40H20G20", D_PRESENTS: "PRESENTS", D_TM: "TM", D_CLASS: "CLASS  SUBMARINE",
          D_BY: "by Paul Arlton and Ed Dawson", D_COPY: " C Copyright 1984 by", D_HOLO: "Spectrum HoloByte, Inc."}


def build(exe):
    for desc, text in EXPECT.items():
        got = exe.string(desc)
        assert got == text, (hex(desc), got, text)
    frames = []
    s = Screen()

    # ---- scene 1: Spectrum HoloByte presents (0x6a6-0x979) ----------------------------------------------------------
    s.cls()
    s.box_fill(1, 75, 319, 140, 0)                  # 0x6c1  LINE (1,75)-(319,140),0,BF
    s.box(1, 1, 319, 72, 1)                         # 0x6d3  LINE (1,1)-(319,72),1,B
    s.box(3, 3, 317, 70, 1)                         # 0x6eb  LINE (3,3)-(317,70),1,B
    for colour in (1, 2, 3):                        # 0x70b  FOR C=1 TO 3: letters in colour C, last pass leaves white
        s.pset(40, 33, 0)
        s.draw(f"C{colour}" + exe.string(D_LOGO[0]))
        s.draw(f"C{colour}" + exe.string(D_LOGO[1]))
        s.pset(150, 65, 0)
        s.draw(f"C{colour}" + exe.string(D_LOGO[2]))
        s.draw(f"C{colour}" + exe.string(D_LOGO[3]))
        s.locate_print(3, 36, exe.string(D_TM))     # LOCATE 3,36: PRINT "TM"
    s.pset(149, 120, 0)                             # 0x806  the prism (S2 is still active, so it is 20 px wide)
    s.draw(exe.string(D_PRISM))
    for x in range(10, 153):                        # 0x826  FOR X=10 TO 152: LINE (10,119)-(X,120),3,BF  (white beam)
        s.box_fill(10, 119, x, 120, 3)
    s.pset(153, 119, 3)                             # 0x865
    for v in range(1, 21):                          # 0x87e  two fans of rays leaving the prism
        s.line(165, 119, 310, 101 - v, 2)
        s.line(166, 120, 310, 100 + v, 1)
    s.box(80, 171, 240, 187, 1)                     # 0x919  LINE (80,171)-(240,187),1,B
    s.locate_print(23, 17, exe.string(D_PRESENTS))  # LOCATE 23,17: PRINT "PRESENTS"
    frames.append(s.snapshot("spectrum_logo", "Spectrum HoloByte logo screen: prism with white beam and spectrum rays, "
                                              "double frame, TM, PRESENTS", "0x6a6-0x979"))

    # ---- scene 2: the GATO title page (0x979-0xbd2) ---------------------------------------------------------------
    s.cls()
    s.color_state.color(9)                          # 0x97e  SCREEN 1 / COLOR 9 -> light blue background, bright palette
    for text, (px, py) in zip(D_LETTERS, LETTER_PAINT):
        s.pset(160, 80, 0)                          # each letter string is drawn relative to (160,80)
        s.draw(exe.string(text))
        s.paint(px, py, 2, 2)                       # PAINT (x,y),2,2
    s.locate_print(2, 36, exe.string(D_TM))
    frames.append(s.snapshot("title_letters", "GATO lettering (colour 2) on the light-blue background, TM", "0x979-0xa3f"))
    for y in range(103, 18, -4):                    # 0xa3f  FOR Y=103 TO 19 STEP -4: LINE (0,Y)-(319,Y),0
        s.line(0, y, 319, y, 0)
    for y in range(20, 101, 4):                     # 0xab0  FOR Y=20 TO 100 STEP 4
        s.line(0, y, 319, y, 0)
    s.locate_print(15, 12, exe.string(D_CLASS))
    s.locate_print(17, 6, exe.string(D_BY))
    s.locate_print(21, 10, exe.string(D_COPY))
    s.circle(83, 163, 7, 6, 3)                      # 0xb7a  CIRCLE (83,163),7,3  (the (c) ring; y radius = 7 * 5/6)
    s.locate_print(23, 9, exe.string(D_HOLO))
    frames.append(s.snapshot("title", "The held GATO title page: striped GATO lettering, CLASS SUBMARINE, authors, copyright "
                                      "(held for ~5000 empty loop passes before the letters dissolve)", "0xa3f-0xbd2"))

    # ---- scene 3: launcher menu backdrop (0xda2-0xf17) -----------------------------------------------------------------
    s.cls()
    s.color_state.color(1, 1)                       # 0xda2  COLOR 1,1 -> blue sea, normal-intensity palette 1
    s.box_fill(0, 0, 319, 100, 1)                   # 0xdaf  LINE (0,0)-(319,100),1,BF  (sky)
    s.pset(128, 105, 0)
    s.draw(exe.string(D_COAST))
    s.pset(318, 100, 1)
    s.draw(exe.string(D_SHIP1))
    s.draw(exe.string(D_SHIP2))
    s.line(45, 81, 130, 75, 3)                      # 0xdf9
    for v in range(1, 251, 8):                      # 0xe1d  FOR V=1 TO 250 STEP 8: PSET (V, V\80+96),3
        s.pset(v, v // 80 + 96, 3)
    for row, col, desc in ((15, 4, D_MENU[0]), (16, 4, D_MENU[1]), (17, 4, D_MENU[2]), (18, 4, D_MENU[3]),
                           (21, 4, D_MENU[4]), (22, 4, D_MENU[5])):
        s.locate_print(row, col, exe.string(desc))
    frames.append(s.snapshot("launcher_menu", "Launcher backdrop: sky, sea, surfaced ship and shoreline behind the 4-item menu",
                             "0xda2-0xf17"))
    assert s.off_screen == 0, f"{s.off_screen} pixels fell outside the screen"
    return frames


def write_png(frame, path, scale=1):
    img = Image.new("P", (W, H))
    pal = []
    for c in frame["palette"]:
        pal += [int(c[1:3], 16), int(c[3:5], 16), int(c[5:7], 16)]
    img.putpalette(pal + [0] * (768 - len(pal)))
    img.putdata([int(ch) for row in frame["rows"] for ch in row])
    if scale > 1:
        img = img.resize((W * scale, H * scale), Image.NEAREST)
    img.save(path)
    return img


def write_preview(frame, path, scale=3):
    img = write_png(frame, path, scale).convert("RGB")
    d = ImageDraw.Draw(img)
    try:
        font = ImageFont.truetype("cour.ttf", 8 * scale)
    except OSError:
        font = ImageFont.load_default()
    white = tuple(int(frame["palette"][3][i:i + 2], 16) for i in (1, 3, 5))
    for t in frame["text"]:
        for k, ch in enumerate(t["text"]):
            if ch != " ":
                d.text(((t["col"] - 1 + k) * 8 * scale, (t["row"] - 1) * 8 * scale), ch, fill=white, font=font)
    img.save(path)


def main():
    frames = build(Exe(EXE))
    doc = {
        "format": "gato-cga-title/1",
        "width": W, "height": H, "bitsPerPixel": 2,
        "videoMode": "CGA 320x200, 4 colours (BASIC SCREEN 1); pixel value 0 shows the background colour",
        "source": "Original/Gato.exe, program body 0x61a-0x1010, DRAW strings 0x561e-0x5e12 (rebuilt by analysis/export_title_art.py)",
        "primary": "title",
        "notes": [
            "No bitmap is stored in GATO.EXE: the title is drawn at run time with DRAW/PAINT/LINE/CIRCLE; this file is the result.",
            "Text (LOCATE/PRINT with the BIOS 8x8 ROM font) is a separate layer: row/col are 1-based like LOCATE on a 40x25 grid.",
            "Palette is inferred: BIOS mode set leaves the colour-select register at 0x30 (palette 1, intensified); COLOR n>=8 keeps "
            "that palette and sets the background; COLOR 1,1 selects normal intensity. The palette byte left by COLOR 9 was not decoded.",
            "The (c) ring is a 7x6 midpoint ellipse; the runtime CIRCLE pixels were not decoded.",
        ],
        "frames": {f["id"]: f for f in frames},
    }
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "title_frames").mkdir(exist_ok=True)
    (OUT / "title_screen.json").write_text(json.dumps(doc, indent=1) + "\n", encoding="utf-8")
    for f in frames:
        write_png(f, OUT / "title_frames" / f"{f['id']}.png")
    main_frame = doc["frames"][doc["primary"]]
    write_png(main_frame, OUT / "title_screen.png")
    write_preview(main_frame, OUT / "title_screen_preview.png")
    for f in frames:
        used = [sum(row.count(str(i)) for row in f["rows"]) for i in range(4)]
        print(f"{f['id']:14} pixels per colour {used}  palette {f['paletteNames']}  text lines {len(f['text'])}")


if __name__ == "__main__":
    sys.exit(main())
