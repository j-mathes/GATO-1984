#!/usr/bin/env python3
"""Rebuild the static layers and dynamic gauge geometry of GATO1.EXE's instrument screens (320x200 CGA).

Same method as analysis/export_title_art.py: the compiled BASIC p-code of Gato1.exe (program offset + 0x3a00 = file offset, listing in
analysis/gato1_basic.txt / gato1_statements.txt) draws every screen with LINE/BOX/BF, CIRCLE, PAINT, DRAW, PSET, PUT and LOCATE/PRINT.  The
statements are replayed here with the title exporter's graphics interpreter (Screen) and the result is written as packed 2-bit bitmaps plus
the coordinates of everything that moves.

Runtime routine names of Gato1.exe (same routines as Gato.exe, other offsets; checked against the call patterns):
    297b LINE start   2981 LINE   298a BOX   29c3 BF   2a09 PSET   325c DRAW   30d4 PAINT   33ea CIRCLE aspect   33fe CIRCLE
    2a48/2a4e/2a54 GET   2abb PUT (action: -1 XOR default, 0 PSET, 1 PRESET)   0df6/0e10 COLOR bg,palette   1257/1271 LOCATE row,col
    0d79 CLS   3984/364a PRINT USING

Sections of the program that are replayed (program offsets):
    0x03b40-0x040dd   sprite arrays: digits, lights, tube box (drawn on a scratch screen, then GET)
    0x042a8-0x05077   control room: panel, dials, lights, scope colours   (draws once; needles/values are dynamic)
    0x0a307-0x0a7b8   damage report
    0x09ce2-0x0a2df   radar (F6)        0x0b169-0x0b4a3 chart (C)        0x0c7d8-0x0cd0c quadrant map (Q)       0x0aa0f-0x0adf6 captain's log (L)

Inferred, not decoded:
  * glyph shapes of the BIOS ROM font (CHR$(16) marker, CHR$(24/25) arrows) are taken from a screenshot of the original and stored as
    small bitmaps; PRINT text itself is exported as a text layer (row/col cells), not baked in;
  * CIRCLE is a midpoint ellipse with ry = CINT(r * aspect) (aspect > 1: ry = r, rx = r / aspect);
  * PUT actions: -1 XOR, 0 PSET, 1 PRESET (inverse), as used by the engine-mode text;
  * three short white tick marks next to the oxygen gauge are not in the traced code and are measured from the screenshot.

Outputs: remake/public/assets/cockpit_layouts.json  (plus preview PNGs in remake/public/assets/cockpit/)
"""

import base64
import json
import math
import sys
from pathlib import Path

from PIL import Image

import export_title_art as eta

ROOT = eta.ROOT
EXE = ROOT / "Original" / "Gato1.exe"
OUT = eta.OUT
W, H = eta.W, eta.H
ACTION_XOR, ACTION_PSET, ACTION_PRESET = -1, 0, 1


class G1Screen(eta.Screen):
    """Title interpreter plus the statements Gato1 needs: CIRCLE with aspect, GET and PUT."""

    def get(self, x0, y0, x1, y1):
        return [row[x0:x1 + 1] for row in self.px[y0:y1 + 1]]

    def put(self, x, y, sprite, action=ACTION_XOR):
        for dy, row in enumerate(sprite):
            for dx, v in enumerate(row):
                px, py = x + dx, y + dy
                if not (0 <= px < W and 0 <= py < H):
                    continue
                cur = self.px[py][px]
                self.px[py][px] = v ^ cur if action == ACTION_XOR else v if action == ACTION_PSET else 3 - v

    def text_at(self, row, col, s):
        self.text[(row, col)] = s


class Gato1Exe:
    def __init__(self):
        self.d = EXE.read_bytes()

    def draw_string(self, prefix):
        """DRAW macro string of the string pool that starts with `prefix`; its length is the word of the descriptor before the text."""
        i = self.d.find(prefix.encode())
        if i < 0:
            raise ValueError(prefix)
        n = int.from_bytes(self.d[i - 4:i - 2], "little")
        return self.d[i:i + n].decode()


def pack(px):
    """2 bits per pixel, 4 pixels per byte (first pixel in the high bits), 80 bytes per row, base64."""
    out = bytearray()
    for row in px:
        for x in range(0, W, 4):
            out.append((row[x] << 6) | (row[x + 1] << 4) | (row[x + 2] << 2) | row[x + 3])
    return base64.b64encode(bytes(out)).decode()


def sprite_rows(sprite):
    return ["".join(str(v) for v in row) for row in sprite]


def new_screen(bg=None, palette=None):
    s = G1Screen()
    if bg is not None:
        s.color_state.color(bg, palette)
    return s


def layer(s, extra=None):
    cga, rgb = s.color_state.rgb()
    d = {
        "colorState": {"background": s.color_state.background, "palette": s.color_state.palette, "intensified": s.color_state.intense},
        "paletteCga": cga,
        "paletteNames": [eta.CGA_NAMES[c] for c in cga],
        "palette": ["#%02x%02x%02x" % c for c in rgb],
        "staticPacked": pack(s.px),
        "text": [{"row": r, "col": c, "text": t} for (r, c), t in sorted(s.text.items())],
    }
    if extra:
        d.update(extra)
    return d


# ----------------------------------------------------------------------------------------------------------------------------------
# sprite arrays (0x03b40-0x040dd)
# ----------------------------------------------------------------------------------------------------------------------------------

DIGIT_BOXES = [(159, 163), (164, 167), (168, 171), (172, 176), (177, 181), (182, 186), (187, 191), (192, 196), (197, 201), (202, 206)]


def build_sprites(exe):
    sp = {}
    # digits 0-9: DRAW from the pen position left by CLS (160,100), GET (x0,96)-(x1,100)
    s = new_screen()
    s.pen = (160, 100)
    s.draw(exe.draw_string("C1R1E1U2H1L1G1D2F1BR4R2"))
    sp["digits"] = [s.get(x0, 96, x1, 100) for x0, x1 in DIGIT_BOXES]
    # lights: filled = magenta r4 disc (aspect .8) inside a white r6 ring (aspect .9); empty = the ring only; GET (154,94)-(166,106)
    s = new_screen()
    s.circle_a(160, 100, 4, 0.8, 2)
    s.circle_a(160, 100, 6, 0.9, 3)
    s.paint(160, 100, 2, 2)
    sp["lightOn"] = s.get(154, 94, 166, 106)
    s = new_screen()
    s.circle_a(160, 100, 6, 0.9, 3)
    sp["lightOff"] = s.get(154, 94, 166, 106)
    # torpedo tube "ready" box: BF (2,2)-(8,8) colour 2, GET (2,2)-(8,8)
    s = new_screen()
    s.box_fill(2, 2, 8, 8, 2)
    sp["tubeReady"] = s.get(2, 2, 8, 8)
    return sp


# ----------------------------------------------------------------------------------------------------------------------------------
# control room (0x042a8-0x05077)
# ----------------------------------------------------------------------------------------------------------------------------------

DIAL_NUMBERS = [  # (x, y, digits) = the PUT list at 0x046ff-0x049f0 (digit sprites, XOR)
    (35, 108, "0"), (102, 108, "0"), (169, 108, "0"),
    (5, 133, "3"), (10, 133, "0"), (14, 133, "0"), (55, 133, "1"), (59, 133, "0"), (64, 133, "0"),
    (73, 133, "1"), (76, 133, "5"), (129, 133, "5"),
    (140, 133, "2"), (144, 133, "7"), (150, 133, "0"), (191, 133, "9"), (197, 133, "0"),
    (30, 158, "2"), (35, 158, "0"), (40, 158, "0"), (100, 158, "1"), (104, 158, "0"),
    (164, 158, "1"), (167, 158, "8"), (173, 158, "0"),
    (312, 107, "2"), (313, 113, "1"), (313, 173, "0"),
]
TUBE_DIGITS = [(256, 169, "1"), (266, 169, "2"), (275, 169, "3"), (284, 169, "4")]
O2_TICKS = [(312, 127), (312, 143), (312, 159)]  # measured from a screenshot (not found in the traced code)


def build_control(sp):
    s = new_screen(8, 1)  # COLOR 8,1
    digits = sp["digits"]
    s.box(0, 100, 319, 196, 3)
    s.box(2, 102, 205, 178, 3)
    s.box(209, 150, 295, 178, 3)
    s.box(299, 112, 309, 178, 3)
    s.box(229, 166, 249, 176, 3)
    s.box(252, 166, 292, 176, 3)
    s.box(61, 181, 113, 193, 3)
    for x in (262, 272, 282):
        s.line(x, 166, x, 176, 3)
    for cx in (36, 103, 170):
        s.circle_a(cx, 135, 4, 0.9, 3)
        s.circle_a(cx, 135, 32, 0.9, 3)
    # tick marks: 20 steps of 18 degrees on the depth and speed dials, 16 of 22.5 on the heading dial, cyan, radii 27/26 -> 30/29
    for cx in (36, 103):
        skip = {15, 6, 10, 4, 5} if cx == 36 else {15, 10, 5}
        for i in range(1, 20):
            if i in skip:
                continue
            a = i * 0.31416
            s.line(round(cx + math.cos(a) * 27), round(135 + math.sin(a) * 26), round(cx + math.cos(a) * 30), round(135 + math.sin(a) * 29), 1)
    for i in range(1, 16):
        if i in (12, 8, 4):
            continue
        a = i * 0.3927
        s.line(round(170 + math.cos(a) * 27), round(135 + math.sin(a) * 26), round(170 + math.cos(a) * 30), round(135 + math.sin(a) * 29), 1)
    for x, y, ds in DIAL_NUMBERS:
        s.put(x, y, digits[int(ds)])
    for (cx, cy, r) in ((200, 187, 6), (283, 187, 8), (219, 171, 6), (289, 139, 6)):
        s.circle_a(cx, cy, r, 0.9, 3)
    for i in (0, 16):
        s.box(246, 102 + i, 280, 112 + i, 3)
        s.circle_a(289, 107 + i, 6, 0.9, 3)
    for x, y in O2_TICKS:
        s.line(x, y, 319, y, 3)
    for r, c, t in ((24, 3, "POWER"), (24, 19, "DAMAGE"), (24, 30, "SCOPE"), (22, 3, "DEPTH"), (22, 11, "SPEED"), (22, 19, "HEADING"),
                    (14, 27, "FUEL"), (16, 27, "BATT"), (18, 27, "CHARGING"), (20, 28, "TORPEDOES"), (14, 39, "O")):
        s.text_at(r, c, t)
    dynamic = {
        "scope": {"box": [0, 0, 319, 97], "skyFill": [0, 0, 319, "horizon"], "seaFill": [0, "horizon+1", 319, 97], "seaColor": 2,
                  "skyColorIndex": "timeOfDay (ds:0x21ca: 1 day = colour 1, 0 night = colour 0)",
                  "horizon": "79 - 4 * depth (79 with the periscope up above depth 46; -1 when negative) = ds:0x2152",
                  "periscopeDamagedFrame": {"fill": [1, 1, 318, 96, 0], "box": [0, 0, 319, 97, 3]}},
        "needles": [
            {"id": "depth", "cx": 36, "cy": 135, "rx": 26, "ry": 22, "x": "cx + sin(depth * 0.0157) * rx", "y": "cy - cos(depth * 0.0157) * ry", "color": 3},
            {"id": "speed", "cx": 103, "cy": 135, "rx": 26, "ry": 22, "x": "cx + sin(speed * 0.31) * rx", "y": "cy - cos(speed * 0.31) * ry", "color": 3},
            {"id": "heading", "cx": 170, "cy": 135, "rx": 26, "ry": 22, "x": "cx + cos(heading) * rx", "y": "cy - sin(heading) * ry", "color": 3,
             "note": "heading in math radians (0 = east); the label 0 is at the top"},
        ],
        "hubs": "circle r4 aspect .9 at each needle centre (already in the static layer)",
        "values": [
            {"id": "fuel", "row": 14, "col": 32, "width": 4, "source": "fuel / 90 (v2186 / 90)"},
            {"id": "battery", "row": 16, "col": 32, "width": 4, "source": "battery (v218a)"},
            {"id": "torpedoes", "row": 22, "col": 30, "width": 2, "source": "torpedoes left (v21a6)"},
        ],
        "lights": [  # sprite box top-left (PUT), ring centre; filled (lightOn) when the condition holds
            {"id": "fuelAlert", "put": [283, 101], "center": [289, 107]},
            {"id": "batteryAlert", "put": [283, 117], "center": [289, 123]},
            {"id": "charging", "put": [283, 133], "center": [289, 139], "note": "on while the diesels charge the battery (v218a < 1000 and diesel)"},
            {"id": "doorsOpen", "put": [213, 165], "center": [219, 171]},
            {"id": "damage", "put": [194, 181], "center": [200, 187]},
        ],
        "oxygenMarker": {"x": 300, "y": "174 - oxygen * 0.043", "glyph": "marker", "note": "CHR$(16) right-pointing triangle, PUT with PSET"},
        "oxygenScale": {"box": [299, 112, 309, 178], "range": "oxygen 0..1426 -> y 174..113"},
        "tubes": {"readyBox": {"x": "244 + 10 * tube", "y": 168, "w": 7, "h": 7, "color": 2}, "digits": [{"x": x, "y": y, "digit": d} for x, y, d in TUBE_DIGITS],
                  "digitAction": "XOR: white on a ready (magenta) tube, cyan on an empty one",
                  "readyWhen": "(4 - tube) < torpedoes left and the tube is not running (A1172[tube] = 0)"},
        "power": {"box": [61, 181, 113, 193], "textAt": [63, 183], "modes": {"diesel": "DIESEL printed normally", "electric": "' ELEC' inverted (PRESET)", "off": "'  OFF ' inverted (PRESET)"}},
        "scopeArrow": {"circle": [283, 187, 8], "glyph": "arrowDown / arrowUp", "note": "periscope up/down indicator (CHR$(24)/(25))"},
        "labelCells": "see text",
    }
    return s, dynamic


# ----------------------------------------------------------------------------------------------------------------------------------
# damage report (0x0a307-0x0a7b8)
# ----------------------------------------------------------------------------------------------------------------------------------

COMPARTMENT_LIGHTS = {  # compartment -> PUT position (x, y) of its light, from the 0x0a652-0x0a7a7 block
    1: (150, 166), 2: (20, 166), 3: (20, 150), 4: (150, 150), 5: (20, 134), 6: (150, 134), 7: (20, 118), 8: (150, 118),
}
COMPARTMENT_NAMES = {1: "RADIO RM", 2: "TORPEDO RM", 3: "BATTERY RM", 4: "FUEL TANKS", 5: "ENGINE RM", 6: "PERISCOPES", 7: "CONTROL RM", 8: "CONNING TOWER"}
# compartment -> (PSET x, y, DRAW suffix key) of the magenta outline drawn when damaged (0x0a36b-0x0a438); 6 and 8 are PAINT fills only
OVERLAY_DRAW = {
    1: (175, 56, "S4C2U7R12D2R2D5L14"),
    2: (7, 56, "S4C2E2R40D3R5D10"),
    3: (79, 63, "S4C2ND5R125D5L12"),
    4: (210, 51, "S4C2R60L2D1R13"),
    5: (261, 64, "S4C2L25U2L6D4R6"),
    7: (100, 48, "S4C2NR53D8R53U8"),
}
OVERLAY_PAINT = {6: [(124, 30), (130, 32)], 8: [(124, 40), (124, 43)]}


def damage_base(exe, sp, damaged=()):
    s = new_screen(8, 1)
    for k in damaged:
        if k in OVERLAY_DRAW:
            x, y, key = OVERLAY_DRAW[k]
            s.pset(x, y, 2)
            s.draw(exe.draw_string(key))
    s.circle_a(146, 60, 115, 0.07, 1)
    s.draw("C1" + exe.draw_string("S4BR2BU13L144D1"))
    s.draw("C1" + exe.draw_string("L1U1L2U1L4U1L6U1L11"))
    s.draw("C1" + exe.draw_string("BD5L23U4E1R1F1ND4R2D1L2BL3L7"))
    s.line(30, 39, 120, 31, 1)
    for x in range(40, 241, 8):
        s.pset(x, 49, 1)
    for k in damaged:
        for px, py in OVERLAY_PAINT.get(k, []):
            s.paint(px, py, 2, 1)
    return s


def build_damage(exe, sp):
    s = damage_base(exe, sp)
    for row, name in ((16, "CONTROL RM"), (18, "ENGINE RM"), (20, "BATTERY RM"), (22, "TORPEDO RM")):
        s.text_at(row, 7, name)
    for row, name in ((16, "CONNING TOWER"), (18, "PERISCOPES"), (20, "FUEL TANKS"), (22, "RADIO RM")):
        s.text_at(row, 25, name)
    s.box(0, 100, 319, 199, 1)
    s.box(2, 102, 317, 197, 1)
    for y in range(118, 181, 16):
        for x in (20, 150):
            s.put(x, y, sp["lightOff"])
    base = [row[:] for row in damage_base(exe, sp).px]
    overlays = {}
    for k in range(1, 9):
        d = damage_base(exe, sp, (k,))
        pix = [[x, y] for y in range(H) for x in range(W) if d.px[y][x] != base[y][x] and y < 100]
        overlays[str(k)] = {"name": COMPARTMENT_NAMES[k], "color": 2, "pixels": pix, "light": list(COMPARTMENT_LIGHTS[k]),
                            "lightAction": "PUT lightOn with PSET over the empty light"}
    return s, {"overlays": overlays, "lights": {str(k): list(v) for k, v in COMPARTMENT_LIGHTS.items()},
               "note": "overlays are drawn under the cyan hull; lightOn replaces the empty ring when the compartment's damage > 0",
               "listing": "A177a[k] > 0 for k = 1..8; lights at 0x0a652-0x0a7b8"}


# ----------------------------------------------------------------------------------------------------------------------------------
# radar, chart, quadrant map, captain's log
# ----------------------------------------------------------------------------------------------------------------------------------

def build_radar():
    s = new_screen(0, 1)  # COLOR 0,1
    for r, c, t in ((7, 30, "HEADING"), (12, 30, " SPEED"), (17, 30, " DEPTH"), (21, 30, "TORP")):
        s.text_at(r, c, t)
    for y in (30, 70, 110):
        s.box(237, y, 280, y + 10, 1)
        s.box(235, y - 2, 282, y + 12, 1)
    s.box(224, 23, 295, 140, 1)
    s.box(267, 156, 291, 170, 1)
    s.box(269, 158, 289, 168, 1)
    for r in (101, 102, 103):
        s.circle_a(111, 100, r, 0.9, 1)  # colour omitted: the screenshot shows the default colour of COLOR 0,1 to be 1 (cyan)
    s.box(0, 0, 319, 199, 1)
    s.box(2, 2, 317, 197, 1)
    for x in (11, 303):  # corner octagons: FOR x = 11 TO 303 STEP 292, FOR y = 6 TO 180 STEP 174
        for y in (6, 180):
            s.pset(x, y, 3)
            s.draw("S4C3R5F4D5G4L5H4U5E4")
    s.pset(111, 102, 3)
    s.draw("S4C3U4")
    dynamic = {
        "center": [111, 100],
        "sweep": {"x": "111 + cos(a) * 99", "y": "100 + sin(a) * 89", "color": 2, "angleStep": 0.2, "erase": "old line redrawn in colour 0"},
        "blips": {"x": "111 - sin(bearing) * distance * 0.065", "y": "100 - cos(bearing) * distance * 0.065", "color": 2, "maxDistance": 1350,
                  "island": "CIRCLE radius 3 + 1200 / distance, colour 2"},
        "values": [
            {"id": "heading", "row": 5, "col": 32, "width": 3, "source": "(450.0117 - heading * 57.2958) MOD 360"},
            {"id": "speed", "row": 10, "col": 32, "width": 3},
            {"id": "depth", "row": 15, "col": 32, "width": 3, "source": "FIX(depth)"},
            {"id": "torpedoes", "row": 21, "col": 34},
        ],
        "usable": "depth <= 45 (otherwise the sweep and blips are not drawn)",
    }
    return s, dynamic


def build_chart(exe):
    s = new_screen(18, 1)  # COLOR 18,1: bg colour 2 (green), intensity bit set
    s.box_fill(3, 1, 317, 196, 1)
    circles = json.loads((OUT / "sprites" / "chart_circles.json").read_text())["records"]
    for rec in circles:
        s.circle_a(int(rec["x"]), int(rec["y"]), int(rec["radius"]), rec["aspect"], 2)
        s.paint(int(rec["x"]), int(rec["y"]), 0, 2)
    for y in range(1, 200, 49):
        s.line(3, y, 317, y, 3)
    for x in range(2, 320, 63):
        s.line(x, 1, x, 197, 3)
    s.box(0, 0, 319, 199, 3)
    s.line(1, 1, 317, 1, 0)
    s.line(2, 2, 317, 2, 3)
    dynamic = {"scale": {"x": "world x * 0.01252", "y": "196 - world y * 0.009650499"},
               "ownBoat": {"color": 0}, "ships": {"color": 2, "slots": "1..8"},
               "hidden": "Z (PASSWORD? PAED) coordinate prompt at LOCATE 1,1"}
    return s, dynamic, circles


def build_quadrant(exe):
    s = new_screen(17, 0)  # COLOR 17,0: bg colour 1 (blue), palette 0 (green/red/brown), intensified
    s.box(0, 0, 319, 199, 3)
    for x in range(64, 320, 64):
        s.line(x, 0, x, 5, 3)
        s.line(x, 194, x, 199, 3)
    for y in range(40, 200, 40):
        s.line(0, y, 5, y, 3)
        s.line(314, y, 319, y, 3)
    # island pictures: DRAW "S<scale>" + picture string (A213a[shape], set up at 0x0cf92), then PAINT colour 1 border 3 at the pen start
    mxp = json.loads((ROOT / "remake" / "src" / "data" / "scenarios" / "map" / "MXP.json").read_text())
    pictures = {1: exe.draw_string("C3BR9BU1U3HUHU2E2UERF2RFE2U4H2LHLHL4GL4HL6G4D2G5LG2D6FD4GDGDGD2FDF4R3FR3FR4E2R6ER2E4U3ER3E2U2EHUHL4GLGL2HUEH2L3U2"),
                2: exe.draw_string("C3BR26R4U2H4LU2H4U4E2U4H3UL2H4U2EU3H2L7G3D2GDGD2G2L4G3LG3D5GD3GDGDG4L2G3D4F4D9GD2GD4GD3GD3F5R3FR6ER5ER5E5U4E3UERERERE7UE4UEUEUEU3"),
                3: exe.draw_string("C3BR16BU2U2HUHL2HL2GL2H2U2H2LHUE2U3HLHL5GLG2LG2D3GD2G3LGD4F2RFD2FD2FD2G3D2FDF2R5ER2FR3ERE2R2ERE3U2EU3ER2EU2EU4")}
    islands = {}
    for q in mxp["quadrants"]:
        if not q["has_island"]:
            continue
        shape, scale = q["attr_5"], q["attr_6"]
        key = f"{shape}_{scale}"
        if key in islands:
            continue
        t = G1Screen()
        t.pen = (160, 100)
        t.draw(f"S{scale}" + pictures[shape])
        t.paint(160, 100, 1, 3)
        ys = [y for y in range(H) for x in range(W) if t.px[y][x]]
        xs = [x for y in range(H) for x in range(W) if t.px[y][x]]
        x0, x1, y0, y1 = min(xs), max(xs), min(ys), max(ys)
        islands[key] = {"offset": [x0 - 160, y0 - 100], "rows": sprite_rows([row[x0:x1 + 1] for row in t.px[y0:y1 + 1]]),
                        "shape": shape, "scale": scale}
    dynamic = {"scale": {"x": "(world x MOD 5000) * 0.0638", "y": "199 - (world y MOD 5000) * 0.0398"},
               "tickStep": {"x": 64, "y": 40},
               "islands": islands,
               "islandRule": "key = attr_5 + '_' + attr_6 of the quadrant's MXP row; the picture is drawn with the pen at the island centre, outline colour 3, fill colour 1",
               "outerRing": "40 dots in colour 2 on an ellipse of the outer radius (0x0ca22, 0.0638 x / 0.0398 y per world unit)",
               "trails": "positions are PSET and never erased: own boat colour 1 (green), ships colour 2",
               "ownBoat": "DRAW 'S4C3BF4BD7E2L2U2R3E3H2G2HE5FG2F2E6FG9R9D2L10G3H' (boat symbol) at the boat position in quadrant 5 only; label 'X'"}
    return s, dynamic


def build_log():
    s = new_screen(9, 1)  # COLOR 9,1
    s.box_fill(125, 0, 165, 24, 3)
    for y in range(0, 25, 2):
        s.line(125, y, 165, y, 2)
    s.box_fill(125, 0, 144, 13, 1)
    for y in (2, 6, 10):
        for x in range(127, 142, 2):
            s.pset(x, y, 3)
    for y in (4, 8, 12):
        for x in range(126, 143, 2):
            s.pset(x, y, 3)
    for r, c, t in ((5, 12, "CAPTAIN'S LOG"), (8, 1, "SHIP          TONNAGE       DATE SUNK"), (9, 1, "_" * 37)):
        s.text_at(r, c, t)
    dynamic = {"rows": {"first": 11, "perPage": 90, "format": "name LEFT$(15), tonnage USING '######', 6 spaces, date, '1943'"},
               "totals": ["SHIPS SUNK", "TOTAL TONNAGE", "MISSIONS COMPLETED"], "prompt": "(Press any key to continue)",
               "flag": "50-star flag emblem at x 125..165, y 0..24 (stripes colour 2, canton colour 1, stars colour 3)"}
    return s, dynamic


def build_glyphs():
    """Bitmaps of BIOS ROM-font glyphs the program prints and captures with GET (CHR$(16) marker, CHR$(24/25/26/27) arrows).

    The ROM font is not in the EXE.  The marker and the down arrow are read from a screenshot of the original control room; the other three
    arrows are derived from the down arrow (flip / transpose / mirror) and are approximations.
    """
    down = ["...##...", "...##...", "...##...", "...##...", ".#.##.#.", "..####..", "...##..."]
    up = down[::-1]
    right = ["".join(down[y][x] for y in range(len(down))) for x in range(len(down[0]))]  # transpose: 7 wide, 8 tall
    left = [row[::-1] for row in right]
    conv = lambda rows: [r.replace(".", "0").replace("#", "3") for r in rows]  # noqa: E731
    return {
        "source": "marker and arrowDown measured from a screenshot of the original; other arrows derived",
        "marker": {"offset": [1, 3], "rows": conv(["#.....", "###...", "#####.", "######", "#####.", "###...", "#....."]),
                   "note": "CHR$(16); PUT at (300, 174 - oxygen * 0.043), the glyph's pixels start at +1,+3"},
        "scopeArrows": {"F": {"put": [280, 184], "rows": conv(up)}, "P": {"put": [279, 184], "rows": conv(left)},
                        "A": {"put": [280, 184], "rows": conv(down)}, "S": {"put": [279, 184], "rows": conv(right)}},
    }


def main():
    exe = Gato1Exe()
    sp = build_sprites(exe)
    screens = {}
    for name, (s, dyn) in {"control_room": build_control(sp), "damage_report": build_damage(exe, sp), "radar": build_radar(),
                           "quadrant_map": build_quadrant(exe), "captains_log": build_log()}.items():
        screens[name] = layer(s, {"dynamic": dyn})
    s, dyn, circles = build_chart(exe)
    screens["chart"] = layer(s, {"dynamic": dyn})
    doc = {
        "format": "gato-cockpit-layouts/1", "width": W, "height": H, "pixelEncoding": "2 bits per pixel, 4 pixels per byte (first pixel in the high bits), 80 bytes per row, base64",
        "source": "Original/Gato1.exe program 0x03a1a-0x0cd0c (analysis/export_cockpit_layouts.py)",
        "sprites": {"digits": [sprite_rows(d) for d in sp["digits"]], "lightOn": sprite_rows(sp["lightOn"]), "lightOff": sprite_rows(sp["lightOff"]),
                    "tubeReady": sprite_rows(sp["tubeReady"]), "digitPutAction": "XOR"},
        "glyphs": build_glyphs(),
        "screens": screens,
    }
    (OUT / "cockpit_layouts.json").write_text(json.dumps(doc, separators=(",", ":")) + "\n", encoding="utf-8")
    (OUT / "cockpit").mkdir(exist_ok=True)
    for name, scr in screens.items():
        raw = base64.b64decode(scr["staticPacked"])
        img = Image.new("P", (W, H))
        pal = []
        for c in scr["palette"]:
            pal += [int(c[1:3], 16), int(c[3:5], 16), int(c[5:7], 16)]
        img.putpalette(pal + [0] * (768 - len(pal)))
        data = []
        for b in raw:
            data += [(b >> 6) & 3, (b >> 4) & 3, (b >> 2) & 3, b & 3]
        img.putdata(data)
        img.save(OUT / "cockpit" / f"{name}.png")
        print(f"{name:14} {scr['paletteNames']} text cells {len(scr['text'])}")


if __name__ == "__main__":
    sys.exit(main())
