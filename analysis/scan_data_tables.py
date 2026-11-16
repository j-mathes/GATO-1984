"""Scan DEMO.EXE and Gato1.exe for lookup tables, repeating blocks and graphics data; write analysis/data_tables.md.

Run:  python analysis/scan_data_tables.py      (standard library only; reuses inspect_exe / parse_scenarios)

Detectors
  * zone map of each load module (code, relocated runtime segment, literal pool, DATA text, math tables)
  * maximal repeating blocks inside each file and shared blocks between the two files
  * Microsoft Binary Format (MBF) numbers: runtime math tables, exact math-constant matches, and the numeric
    constants stored between the string literals
  * bit-mask / CGA-fill byte tables, arithmetic word tables, CGA address-calculation code signatures
  * BASIC DRAW / PLAY command strings (the vector 'sprites' embedded in the programs)
  * Morse code tables in several encodings
  * GET/PUT-style bitmap headers (width-in-bits, height, packed 2-bit pixels)
Every hit carries its file offset; thresholds are constants at the top of the file.
"""
import hashlib
import math
import re
import struct
import sys
from collections import defaultdict

import inspect_exe as ie
import parse_scenarios as ps

ROOT = ie.ROOT
OUT_MD = ROOT / "analysis" / "data_tables.md"
EXES = ["DEMO.EXE", "Gato1.exe"]

WIN = 24            # repeat-detection window (bytes)
MIN_REPEAT = 32     # shortest maximal repeat reported
MIN_DISTINCT = 4    # a repeat window must contain at least this many distinct byte values
MBF_EXP = range(0x68, 0x8C)   # plausible MBF exponents for table entries (|v| ~ 2^-24 .. 2^12)
MBF_MIN_RUN = 4

NONTRIVIAL_CONSTS = {
    "pi": math.pi, "pi/2": math.pi / 2, "2*pi": 2 * math.pi, "1/(2*pi)": 1 / (2 * math.pi),
    "sqr(2)": math.sqrt(2), "sqr(2)/2": math.sqrt(2) / 2, "ln(2)": math.log(2), "log2(e)": 1 / math.log(2),
    "log10(e)": 1 / math.log(10), "180/pi": 180 / math.pi, "pi/180": math.pi / 180, "pi/4": math.pi / 4,
    "7*pi/4": 7 * math.pi / 4, "pi/6": math.pi / 6, "tan(15 deg)": 2 - math.sqrt(3), "sqr(3)": math.sqrt(3),
}
SERIES = {  # name: coefficients (approximate) of well-known Microsoft-BASIC runtime polynomials
    "SIN (odd polynomial in turns, last term 2*pi)": [39.7107, -76.5750, 81.6022, -41.3417, 6.28319],
    "ATN series": [-0.1281, 0.1994, -0.3333, 1.0],
}

BYTE_TABLES = [
    ("left-fill bit masks", bytes([0x80, 0xC0, 0xE0, 0xF0, 0xF8, 0xFC, 0xFE]), "pixel-run masks for 1 bpp spans (PAINT/LINE)"),
    ("right-fill bit masks", bytes([0x01, 0x03, 0x07, 0x0F, 0x1F, 0x3F, 0x7F]), "pixel-run masks"),
    ("CGA 2bpp pixel masks", bytes([0xC0, 0x30, 0x0C, 0x03]), "one mask per pixel of a 320x200 byte"),
    ("CGA colour fill bytes", bytes([0x00, 0x55, 0xAA, 0xFF]), "byte replicating colour 0..3"),
]
CODE_SIGS = [
    ("CGA video segment load", rb"[\xb8\xb9\xba\xbb\xbd\xbe\xbf]\x00\xb8", "mov reg,0B800h: direct CGA frame-buffer access"),
    ("CGA row address (y>>1)*80 + (y&1)*0x2000",
     rb"\xd1\xea\x9f\x8b\xda\xb1\x02\xd3\xe2\x03\xd3\xb1\x04\xd3\xe2\x9e\x73\x04\x81\xc2\x00\x20",
     "pixel address from Y: 80 bytes per row, +0x2000 for odd scan lines (interleaved CGA)"),
    ("CGA 2bpp mask build (0xC0 >> 2*(x&3))", rb"\x80\xe1\x03\x02\xc9\xb0\xc0\xd2\xe8",
     "pixel mask for 320x200x4: 0xC0 shifted by 2*(x mod 4)"),
    ("CGA 1bpp mask build (0x80 >> (x&7))", rb"\x80\xe1\x07\xb0\x80\xd2\xe8", "pixel mask for 640x200x2"),
    ("pixel XOR write to frame buffer", rb"\x26\x30\x07", "xor es:[bx],al - XOR drawing as used by PUT XOR / PSET"),
]
MORSE = {"A": ".-", "B": "-...", "C": "-.-.", "D": "-..", "E": ".", "F": "..-.", "G": "--.", "H": "....", "I": "..",
         "J": ".---", "K": "-.-", "L": ".-..", "M": "--", "N": "-.", "O": "---", "P": ".--.", "Q": "--.-",
         "R": ".-.", "S": "...", "T": "-", "U": "..-", "V": "...-", "W": ".--", "X": "-..-", "Y": "-.--",
         "Z": "--.."}
DRAW_RE = re.compile(r"^(?:[BN]*[UDLREFGH]\d*|C\d+|S\d+|P\d+(?:,\d+)?|A\d|M[+-]?\d+,[+-]?\d+|;)+$")
PLAY_RE = re.compile(r"^(?:M[BFLNS]|[TOLP]\d+|[A-GN]\d*[#+\-.]?|[<>]|;)+$")


def mbf4(b):
    if b[3] == 0:
        return 0.0
    mant = (0x80 | (b[2] & 0x7F)) << 16 | b[1] << 8 | b[0]
    return (-1 if b[2] & 0x80 else 1) * mant / 2 ** 24 * 2.0 ** (b[3] - 128)


def fmt(v):
    return f"{v:.6g}"


class Image:
    def __init__(self, name):
        self.name = name
        self.d = (ie.SRC / name).read_bytes()
        self.h = ie.parse_header(self.d)
        self.lo, self.hi = self.h["header_bytes"], self.h["declared_size"]
        self.base, self.pool = ie.find_literal_pool(self.d, self.h)
        self.table = ie.find_error_table(self.d)
        self.pool_lo = min(o for o, _, _ in self.pool) - 4
        self.pool_hi = max(o + len(t) for o, _, t in self.pool)
        txt = [(self.base + m.start(), self.base + m.end()) for m in
               re.finditer(rb"[\d,. ]{30,}", self.d[self.base:self.hi]) if m.group().count(b",") >= 8]
        self.data_txt = txt[0] if txt else (self.pool_hi, self.pool_hi)
        self.tail_end = self.base + len(self.d[self.base:self.hi].rstrip(b"\x00"))

    def zone(self, off):
        if off < self.lo:
            return "header"
        if off < self.base:
            return "code/runtime"
        if off < self.pool_lo:
            return "DS-image: runtime code + init data"
        if off < self.data_txt[0]:
            return "DS-image: literal pool"
        if off < self.data_txt[1]:
            return "DS-image: DATA text"
        if off < self.tail_end:
            return "DS-image: math tables"
        return "DS-image: zero fill" if off < self.hi else "trailing"

    def fo(self, off):
        ds = off - self.base
        return f"0x{off:05x}" + (f" (ds:0x{ds:04x})" if ds >= 0 else "")


def zone_rows(im):
    rows = [("MZ header + relocation table", 0, im.lo),
            ("code + runtime library (far-call BASIC output)", im.lo, im.base),
            ("DS-image: runtime code + init data (relocated segment start)", im.base, im.pool_lo),
            ("DS-image: BASIC string/number literal pool", im.pool_lo, im.data_txt[0]),
            ("DS-image: numeric DATA statement text", im.data_txt[0], im.data_txt[1]),
            ("DS-image: runtime math tables", im.data_txt[1], im.tail_end),
            ("DS-image: zero fill", im.tail_end, im.hi)]
    return [r for r in rows if r[2] > r[1]]


def repeats(im):
    d, lo, hi = im.d, im.lo, im.hi
    pos = defaultdict(list)
    for i in range(lo, hi - WIN):
        w = d[i:i + WIN]
        if len(set(w)) >= MIN_DISTINCT:
            pos[w].append(i)
    covered, out = set(), []
    for i in range(lo, hi - WIN):
        if i in covered:
            continue
        occ = pos.get(d[i:i + WIN])
        if not occ or len(occ) < 2 or occ[0] != i:
            continue
        L = WIN
        while all(o + L < hi for o in occ) and len({d[o + L] for o in occ}) == 1:
            L += 1
        if L >= MIN_REPEAT:
            out.append((L, occ))
        for o in occ:
            covered.update(range(o, o + L))
    return sorted(out, key=lambda t: -(t[0] * (len(t[1]) - 1)))


def shared_blocks(a, b):
    idx = defaultdict(list)
    for i in range(b.lo, b.hi - WIN):
        w = b.d[i:i + WIN]
        if len(set(w)) >= MIN_DISTINCT:
            idx[w].append(i)
    out, i = [], a.lo
    while i < a.hi - WIN:
        cands = idx.get(a.d[i:i + WIN])
        if not cands:
            i += 1
            continue
        best = (0, None)
        for j in cands:
            L = WIN
            while i + L < a.hi and j + L < b.hi and a.d[i + L] == b.d[j + L]:
                L += 1
            if L > best[0]:
                best = (L, j)
        if best[0] >= MIN_REPEAT:
            out.append((i, best[1], best[0]))
        i += max(best[0], 1)
    return out


def tail_mbf_runs(im):
    """Runs of >= MBF_MIN_RUN plausible MBF singles inside the math-table zone."""
    d, runs = im.d, []
    a, b = im.data_txt[1], im.tail_end
    for phase in range(4):
        run, i = [], a + phase
        while i + 4 <= b:
            q = d[i:i + 4]
            if q[3] in MBF_EXP:   # the math-table zone holds no text, so no printable-bytes filter here
                run.append(i)
            else:
                if len(run) >= MBF_MIN_RUN:
                    runs.append(run)
                run = []
            i += 4
        if len(run) >= MBF_MIN_RUN:
            runs.append(run)
    runs = [r for r in runs if len({round(mbf4(d[o:o + 4]), 5) for o in r}) >= 3]
    runs.sort(key=lambda r: (r[0], -len(r)))
    merged = []
    for r in runs:
        if merged and r[0] < merged[-1][-1] + 4:
            if len(r) > len(merged[-1]):
                merged[-1] = r
            continue
        merged.append(r)
    return merged


def classify_run(vals):
    for name, series in SERIES.items():
        if all(any(abs(v - s) < 2e-3 for v in vals) for s in series):
            return name
    ln2 = math.log(2)
    exp_terms = [ln2 ** k / math.factorial(k) for k in range(1, 8)]
    if sum(any(abs(v - t) < 6e-3 * max(1, t) for v in vals) for t in exp_terms) >= 4 and any(abs(v - 1) < 1e-6 for v in vals):
        return "EXP series (coefficients ~ ln2^k / k!)"
    return None


def mbf8(b):
    """Microsoft Binary Format double (8 bytes: 7 mantissa bytes, little endian, then exponent)."""
    if b[7] == 0:
        return 0.0
    mant = 0x80 | (b[6] & 0x7F)
    for k in range(5, -1, -1):
        mant = mant << 8 | b[k]
    return (-1 if b[6] & 0x80 else 1) * mant / 2 ** 56 * 2.0 ** (b[7] - 128)


def constant_matches(im):
    """Offsets where a non-trivial math constant occurs as an MBF single (4 bytes) or double (8 bytes)."""
    out = []
    for off in range(im.base, im.hi - 7):
        v = mbf4(im.d[off:off + 4])
        if v:
            for name, c in NONTRIVIAL_CONSTS.items():
                if abs(abs(v) - c) <= 2e-6 * c:
                    out.append((off, name + " (single)", v))
        v8 = mbf8(im.d[off:off + 8])
        if v8:
            for name, c in NONTRIVIAL_CONSTS.items():
                if abs(abs(v8) - c) <= 1e-9 * c:
                    out.append((off, name + " (double)", v8))
    return out


def pool_numbers(im):
    """MBF numbers stored in the gaps between string literals (BASIC numeric constants)."""
    out, prev_end = [], None
    for off, ptr, t in im.pool:
        start = off - 4
        if prev_end is not None and start - prev_end >= 4:
            gap = im.d[prev_end:start]
            best = None
            for phase in range(len(gap) % 4 + 1):
                items = []
                i = phase
                while i + 4 <= len(gap):
                    q = gap[i:i + 4]
                    ok = q == b"\x00\x00\x00\x00" or q[3] in range(0x70, 0x98)
                    items.append((prev_end + i, mbf4(q) if ok else None))
                    i += 4
                score = sum(v is not None for _, v in items)
                if best is None or score > best[0]:
                    best = (score, items)
            out.extend((o, v) for o, v in best[1] if v is not None and o and v is not None)
        prev_end = off + len(t)
    return out


def word_progressions(im, min_len=8):
    d, res = im.d, []
    for phase in (0, 1):
        i = im.lo + phase
        while i + 6 <= im.hi:
            w0, w1 = struct.unpack_from("<HH", d, i)
            step = w1 - w0
            if not (0 < step < 0x4000):
                i += 2
                continue
            n, j = 2, i + 4
            while j + 2 <= im.hi and struct.unpack_from("<H", d, j)[0] == w0 + step * n:
                n += 1
                j += 2
            if n >= min_len:
                res.append((i, n, w0, step))
                i = j
            else:
                i += 2
    return res


def find_pow10(im):
    """Table of powers of ten as 64-bit little-endian integers, descending from 10^18 (number formatting)."""
    out = []
    top = struct.pack("<Q", 10 ** 18)
    for m in re.finditer(re.escape(top), im.d):
        off, n = m.start(), 0
        while off + 8 * (n + 1) <= im.hi and im.d[off + 8 * n:off + 8 * n + 8] == struct.pack("<Q", 10 ** (18 - n)):
            n += 1
        if n >= 8:
            out.append((off, n))
    return out


def staircases(im, min_len=40):
    """Non-decreasing byte runs with steps of 0 or 1 (slowly rising lookup ramps) in the data zones."""
    d, out = im.d, []
    i = im.base
    while i < im.hi - min_len:
        j = i
        while j + 1 < im.hi and d[j + 1] - d[j] in (0, 1):
            j += 1
        n = j - i + 1
        if n >= min_len and len(set(d[i:j + 1])) >= 10:
            vals = d[i:j + 1]
            rise = (vals[-1] - vals[0]) / (n - 1)
            out.append((i, n, vals[0], vals[-1], rise))
            i = j + 1
        else:
            i += 1
    return out


def command_strings(im):
    out = []
    for off, ptr, t in im.pool:
        s = ie.printable_text(t)
        if len(s) >= 10 and re.search(r"[UDLREFGH]\d", s) and DRAW_RE.match(s):
            try:
                _, segs, _ = ps.parse_draw(s.replace(";", ""))
            except ValueError:
                continue
            xs = [p for g in segs for p in (g[0], g[2])]
            ys = [p for g in segs for p in (g[1], g[3])]
            out.append(("DRAW", off, ptr, s, (min(xs), max(xs), min(ys), max(ys)) if segs else None))
        elif len(s) >= 6 and PLAY_RE.match(s) and re.search(r"[TOL]\d", s):
            out.append(("PLAY", off, ptr, s, None))
    return out


def small_int_run(im):
    best = cur = 0
    for _, v in pool_numbers(im):
        cur = cur + 1 if float(v).is_integer() and 1 <= v <= 63 else 0
        best = max(best, cur)
    return best


def morse_search(im):
    d, hits = im.d, []
    for m in re.finditer(rb"(?:[.\-]{1,5}[ ,]){5,}", d):
        hits.append(("dot/dash text", m.start()))
    bits = lambda k, dash: "".join(dash if c == "-" else ("0" if dash == "1" else "1") for c in MORSE[k])
    schemes = {
        "leading-1 sentinel, dot=0 dash=1": bytes(int("1" + bits(k, "1"), 2) for k in MORSE),
        "leading-1 sentinel, dot=1 dash=0": bytes(int("1" + bits(k, "0"), 2) for k in MORSE),
        "length<<5 | bits (dash=1)": bytes((len(MORSE[k]) << 5) | int(bits(k, "1"), 2) for k in MORSE),
        "length<<5 | bits (dot=1)": bytes((len(MORSE[k]) << 5) | int(bits(k, "0"), 2) for k in MORSE),
    }
    for name, seq in schemes.items():
        for m in re.finditer(re.escape(seq[:12]), d):
            hits.append((f"byte table '{name}'", m.start()))
    digits = ",".join("".join("1" if c == "." else "2" for c in MORSE[k]) for k in list(MORSE)[:8]).encode()
    for m in re.finditer(re.escape(digits), d):
        hits.append(("dot=1/dash=2 digit text", m.start()))
    return hits


def get_put_candidates(im):
    d, out = im.d, []
    for i in range(im.lo, im.hi - 8):
        wb, h = struct.unpack_from("<HH", d, i)
        if not (8 <= wb <= 640 and wb % 2 == 0 and 4 <= h <= 200):
            continue
        row = (wb + 7) // 8
        n = row * h
        if i + 4 + n > im.hi or n < 24:
            continue
        data = d[i + 4:i + 4 + n]
        if len(set(data)) < 3 or data.count(0) > 0.9 * n or sum(32 <= c < 127 for c in data) > 0.7 * n:
            continue
        sim = sum(sum(a == b for a, b in zip(data[r * row:(r + 1) * row], data[(r - 1) * row:r * row]))
                  for r in range(1, h)) / max(1, (h - 1) * row)
        out.append((i, wb, h, n, round(sim, 2)))
    return out


def build():
    imgs = [Image(n) for n in EXES]
    a, b = imgs
    md = []
    w = md.append
    index = []   # (exe, offset, bytes, kind, description, confidence)

    w("# Embedded data tables, repeating patterns and graphics data")
    w("")
    w("Generated by [scan_data_tables.py](scan_data_tables.py). Scope: `DEMO.EXE` and `Gato1.exe` (the two programs "
      "with the game engine). Offsets are **file offsets**; `ds:` is the offset inside the BASIC data segment "
      "(file offset minus the data-segment base recovered from the string-literal descriptors). Thresholds and "
      "methods are at the top of the script.")
    w("")
    w("## 0. Short answers")
    w("")
    w("* **Trig/math tables: yes** - runtime MBF coefficient tables (SIN polynomial; ATN and EXP series in `Gato1.exe`) "
      "and pi-related constants (section 2). They belong to the BASIC runtime, not the game.")
    w("* **Game numeric constants: yes** - the literal pool also holds MBF numbers (129 in `DEMO.EXE`, 197 in "
      "`Gato1.exe`): angles such as 0.7854 and 5.4978, sprite/screen coordinates, limits such as 8000, 10000 and "
      "25000 (section 2.3).")
    w("* **Map coordinates:** one `DATA` table of 12 x (x, y, size, aspect) values (section 4). The real island map "
      "is the external `MXP` file.")
    w("* **Morse code table: not found** in any encoding tried (section 6). The only Morse-like assets are two "
      "`PLAY` strings in `Gato1.exe`.")
    w("* **Raw CGA 2-bit bitmaps / GET-PUT blocks: none found.** Sprites are `DRAW` command strings (section 5) "
      "drawn at run time. The code that defines the CGA bitmap layout is documented in section 7.")
    w("")

    w("## 1. Zones of each load module")
    w("")
    for im in imgs:
        w(f"### {im.name}")
        w("")
        w("| zone | file range | size | ds range |")
        w("|---|---|---:|---|")
        for name, x, y in zone_rows(im):
            ds = f"0x{x - im.base:04x}-0x{y - im.base - 1:04x}" if x >= im.base else "-"
            w(f"| {name} | 0x{x:05x}-0x{y - 1:05x} | {y - x} | {ds} |")
        if im.table:
            w(f"| (runtime error-message table, inside the code region) | 0x{im.table[0]:05x}-0x{im.table[1] - 1:05x} | "
              f"{im.table[1] - im.table[0]} | - |")
            index.append((im.name, im.table[0], im.table[1] - im.table[0], "string table", "runtime error messages (35 entries)", "high"))
        w("")
        index.append((im.name, im.pool_lo, im.pool_hi - im.pool_lo, "literal pool", "BASIC string + numeric constants", "high"))
    w("The region starting at the data-segment base is *not* pure data: its first part contains relocated runtime code "
      "(for example the CGA routines in section 7), then the literal pool, the DATA text and the runtime math tables.")
    w("")

    w("## 2. Floating-point (MBF) data")
    w("")
    w("MBF single layout: mantissa low, mid, high (bit 7 = sign), exponent biased by 128 (`00 00 00 00` = 0).")
    w("")
    w("### 2.1 Runtime math tables (runs of consecutive MBF singles in the math-table zone)")
    w("")
    for im in imgs:
        w(f"**{im.name}**")
        w("")
        w("| offset | entries | values | identified as |")
        w("|---|---:|---|---|")
        for run in tail_mbf_runs(im):
            vals = [mbf4(im.d[o:o + 4]) for o in run]
            ident = classify_run(vals) or "unidentified math constants"
            w(f"| {im.fo(run[0])} | {len(run)} | {', '.join(fmt(v) for v in vals)} | {ident} |")
            index.append((im.name, run[0], len(run) * 4, "MBF table", ident, "high" if classify_run(vals) else "medium"))
        w("")
    w("The SIN set 39.7107, -76.5750, 81.6022, -41.3417, 6.28319 is the classic Microsoft-BASIC polynomial (argument "
      "in turns; the last term is 2*pi). The ATN set (-0.1281, 0.1994, -0.3333, 1) and the EXP set "
      "(ln2^k/k! = 0.2402, 0.0555, 0.0096, ...) are likewise the standard series; they are recognised as "
      "single-precision runs only in `Gato1.exe`. `DEMO.EXE` has the SIN series but no single-precision ATN/EXP "
      "series, yet it carries the same double-precision constants (section 2.2), so it links the same math "
      "family. These are BASIC runtime tables, not game data. Which game feature calls `ATN` "
      "(probably bearing/angle computation) was not traced.")
    w("")
    w("### 2.2 Math constants located by exact value (single = 4 bytes, double = 8 bytes; any alignment)")
    w("")
    w("The block of 8-byte values near the end of each data zone is the runtime's argument-reduction table "
      "for `ATN`/`EXP`/`LOG`: pi/2, 1/(2*pi), pi/6, tan 15 deg (0.26795), sqr(3), log2(e), ln 2, sqr(2)/2. "
      "The top four bytes of each double also decode as the single listed right after it.")
    w("")
    for im in imgs:
        hits = constant_matches(im)
        w(f"**{im.name}**: " + (", ".join(f"{n} @ {im.fo(o)}" for o, n, v in hits) or "none"))
        w("")
    w("### 2.3 Numeric constants stored between string literals")
    w("")
    w("BASIC keeps single-precision numeric literals in the same pool as strings. Values below are MBF singles "
      "decoded from the gaps between literal descriptors (best 4-byte phase per gap; values with exponent outside "
      "0x70-0x97 are dropped). Round numbers are likely genuine program constants; a few entries may be misaligned "
      "leftovers.")
    w("")
    for im in imgs:
        nums = pool_numbers(im)
        w(f"**{im.name}** ({len(nums)} numbers)")
        w("")
        w("| offset | values |")
        w("|---|---|")
        groups, cur = [], []
        for o, v in nums:
            if cur and o - cur[-1][0] > 4:
                groups.append(cur)
                cur = []
            cur.append((o, v))
        if cur:
            groups.append(cur)
        for g in groups:
            w(f"| {im.fo(g[0][0])} | {', '.join(fmt(v) for _, v in g)} |")
        w("")
        index.append((im.name, nums[0][0] if nums else im.pool_lo, len(nums) * 4, "MBF constants", "numeric literals in the pool", "medium"))

    w("### 2.4 Number-formatting tables (powers of ten and digit-count staircases)")
    w("")
    w("Found by exact structure, not by name: a table of 64-bit little-endian integers descending from `10^18` "
      "(`00 00 64 a7 b3 b6 e0 0d`; 11 entries, down to `10^8`), followed by byte ramps that rise by 1 every ~3.32 "
      "entries (slope ~ log10(2) = 0.30103), i.e. a map from a binary exponent to a decimal digit count. The two ramps "
      "are adjacent and wrap from 0xff to 0x00, so they are one signed-byte ramp of 287 entries running from -30 to "
      "+56 (about floor(n x log10 2)). This is the runtime's number-to-text conversion (`PRINT`, `STR$`), not game data.")
    w("")
    w("| exe | offset | kind | detail |")
    w("|---|---|---|---|")
    for im in imgs:
        for off, n in find_pow10(im):
            w(f"| {im.name} | {im.fo(off)} | powers-of-ten table | {n} entries x 8 bytes (10^{18} .. 10^{19 - n}) |")
            index.append((im.name, off, n * 8, "integer table", f"powers of ten 10^18..10^{19 - n}, 8 bytes each", "high"))
        for off, n, v0, v1, rise in staircases(im):
            tag = "~log10(2) digit-count ramp" if abs(rise - 0.30103) < 0.03 else "slow ramp"
            w(f"| {im.name} | {im.fo(off)} | staircase ({tag}) | {n} bytes, values 0x{v0:02x}..0x{v1:02x}, slope {rise:.3f} |")
            index.append((im.name, off, n, "byte ramp", f"{tag}, slope {rise:.3f}", "medium"))
    w("")
    w("## 3. Repeating byte patterns")
    w("")
    w(f"Maximal blocks of >= {MIN_REPEAT} bytes (found with a {WIN}-byte window; windows with fewer than "
      f"{MIN_DISTINCT} distinct byte values are ignored) that occur more than once.")
    w("")
    for im in imgs:
        rep = repeats(im)
        w(f"### {im.name}: {len(rep)} repeated blocks; top 10 by bytes saved")
        w("")
        w("| length | copies | offsets | zone | first bytes |")
        w("|---:|---:|---|---|---|")
        for L, occ in rep[:10]:
            zones = sorted({im.zone(o) for o in occ})
            w(f"| {L} | {len(occ)} | {', '.join(hex(o) for o in occ[:5])}{' ...' if len(occ) > 5 else ''} | "
              f"{' / '.join(zones)} | `{im.d[occ[0]:occ[0] + 12].hex(' ')}` |")
        w("")
        w("Most repeats are compiler-generated call sequences: `9a <offset> <segment>` far calls into the runtime "
          "code segment (segment word 0x05cb in DEMO.EXE, 0x099b in Gato1.exe, found by counting far-call operands), "
          "each preceded by the same register loads, wherever the BASIC code performs the same operation. They are "
          "code, not tables.")
        w("")
    sh = shared_blocks(a, b)
    total = sum(L for _, _, L in sh)
    w("### Shared between DEMO.EXE and Gato1.exe")
    w("")
    w(f"{len(sh)} shared blocks, {total} bytes ({100 * total / (a.hi - a.lo):.1f}% of DEMO.EXE's load module, "
      f"{100 * total / (b.hi - b.lo):.1f}% of Gato1.exe's): the common linked runtime plus game code the demo reuses. "
      "Largest blocks:")
    w("")
    w("| DEMO.EXE | Gato1.exe | length | zone (DEMO) |")
    w("|---|---|---:|---|")
    for i, j, L in sorted(sh, key=lambda t: -t[2])[:10]:
        w(f"| 0x{i:05x} | 0x{j:05x} | {L} | {a.zone(i)} |")
    w("")
    biggest = max(sh, key=lambda t: t[2])
    w(f"The largest shared block (DEMO 0x{biggest[0]:05x} = Gato1 0x{biggest[1]:05x}, {biggest[2]} bytes) lies in the "
      "math-table zone: the runtime's number-formatting tables (section 2.4), device/bit tables and the SIN table "
      "tail - confirming the same runtime library in both programs.")
    w("")

    w("## 4. Numeric DATA text and coordinate tables")
    w("")
    for im in imgs:
        x, y = im.data_txt
        vals = [float(v) for v in im.d[x:y].decode().strip().split(",")]
        recs = [vals[k:k + 4] for k in range(0, len(vals) - 3, 4)]
        w(f"* **{im.name}** {im.fo(x)}: {len(vals)} values = {len(recs)} records of 4: "
          + ", ".join("(" + ",".join(f"{v:g}" for v in r) + ")" for r in recs))
        index.append((im.name, x, y - x, "DATA text", "12 x (x, y, radius?, aspect)", "medium"))
    w("")
    w("Interpretation (inferred): x 19..287 and y 22..174 fit a 320x200 screen; the 3rd value (5..15) looks like a "
      "radius and the 4th (0.9 or 1.5) like the aspect argument of `CIRCLE`; 12 records match the 12 islands in `MXP`. "
      "These screen coordinates do **not** equal `MXP` coordinates under a simple scale, so the pairing between the "
      "two tables is not established. No other coordinate tables were found in the data zones; ship routes live in "
      "the external `COURXX` files.")
    w("")

    w("## 5. Embedded DRAW / PLAY command strings (the actual 'bitmaps')")
    w("")
    w("Vector images are GW-BASIC `DRAW` macro strings in the literal pool; `PLAY` strings are sound data. Pen bounds "
      "come from the same interpreter used for the `OBX` files (colour and scale commands are not applied).")
    w("")
    for im in imgs:
        cs = command_strings(im)
        w(f"### {im.name}: {len(cs)} strings")
        w("")
        w("| kind | file offset | ds | length | pen bounds (x0..x1, y0..y1) | text |")
        w("|---|---|---|---:|---|---|")
        for kind, off, ptr, s, bounds in cs:
            bt = f"{bounds[0]}..{bounds[1]}, {bounds[2]}..{bounds[3]}" if bounds else "-"
            w(f"| {kind} | 0x{off:05x} | 0x{ptr:04x} | {len(s)} | {bt} | `{s if len(s) <= 60 else s[:57] + '...'}` |")
            index.append((im.name, off, len(s), f"{kind} string", "vector sprite" if kind == "DRAW" else "tone string", "high"))
        w("")
    w("`MBT40O4L64B-` (tempo 40, 64th note, B-flat) and `MBT100L9B` (tempo 100, length 9, B) are the only sound "
      "strings; one is very short and one long, which fits Morse dots and dashes, but the letter-to-pattern mapping "
      "is not in them. The DRAW strings are shared by both programs; the title-screen logo drawing lives in `Gato.exe`.")
    w("")

    w("## 6. Morse code tables")
    w("")
    w("| exe | dot/dash text | one-byte-per-letter tables (4 schemes) | digit-coded text |")
    w("|---|---:|---:|---:|")
    for im in imgs:
        hits = morse_search(im)
        w(f"| {im.name} | {sum(h[0] == 'dot/dash text' for h in hits)} | "
          f"{sum(h[0].startswith('byte table') for h in hits)} | {sum(h[0].startswith('dot=1') for h in hits)} |")
        for h in hits:
            w(f"|  | {h[0]} at 0x{h[1]:x} | | |")
    w("")
    w("Result: **no Morse lookup table is stored in either image** (searched: dot/dash text; four compact "
      "one-byte-per-letter encodings; digit text with dot=1/dash=2). Longest run of consecutive small-integer "
      "(1-63) numeric constants in the literal pools: "
      + ", ".join(f"{im.name} {small_int_run(im)}" for im in imgs) + " (a letter table needs 26+). "
      "The mapping may be computed in code, held in literals this scan does not recognise, or spread over short "
      "strings. The order text itself is in the `ORDXX` files. Next step if needed: trace the code that references "
      "the two `PLAY` strings.")
    w("")

    w("## 7. CGA graphics: code signatures, byte tables, bitmap headers")
    w("")
    w("### 7.1 Code that defines the bitmap layout")
    w("")
    w("| signature | DEMO.EXE | Gato1.exe | meaning |")
    w("|---|---|---|---|")
    for name, rx, meaning in CODE_SIGS:
        cells = []
        for im in imgs:
            hits = [m.start() + im.lo for m in re.finditer(rx, im.d[im.lo:im.hi])]
            cells.append(", ".join(hex(h) for h in hits[:6]) + (" ..." if len(hits) > 6 else "") if hits else "-")
            if hits:
                index.append((im.name, hits[0], 0, "code signature",
                              f"{name}: {len(hits)} site(s), first shown", "high"))
        w(f"| {name} | {cells[0]} | {cells[1]} | {meaning} |")
    w("")
    w("These match the pixel routines at Gato1 0x10f8c-0x1100c (disassembled by hand): the **CGA interleaved layout**. "
      "Scan line `y` starts at `(y>>1)*80 + (y&1)*0x2000` from segment 0xB800; in 320x200 mode each byte holds 4 "
      "pixels of 2 bits (leftmost pixel in bits 7-6, mask `0xC0 >> 2*(x&3)`); 640x200 mode uses 1 bit per pixel. "
      "A mode byte in the data segment (DS:0x0087, bit 0 set = 1 bpp) selects between them. Any sprite captured with "
      "`GET` therefore has the header `[width in bits][height]` and rows padded to whole bytes.")
    w("")
    w("### 7.2 Byte lookup tables (exact signatures)")
    w("")
    w("| table | DEMO.EXE | Gato1.exe | meaning |")
    w("|---|---|---|---|")
    for name, sig, meaning in BYTE_TABLES:
        cells = []
        for im in imgs:
            hits = [m.start() for m in re.finditer(re.escape(sig), im.d)]
            cells.append(", ".join(im.fo(h) for h in hits[:3]) if hits else "-")
            for hh in hits[:3]:
                index.append((im.name, hh, len(sig), "byte table", f"{name} ({sig.hex(' ')})", "medium"))
        w(f"| {name} (`{sig.hex(' ')}`) | {cells[0]} | {cells[1]} | {meaning} |")
    w("")
    for im in imgs:
        prog = word_progressions(im)
        w(f"Arithmetic word tables in {im.name} (>= 8 words, constant step): "
          + ("; ".join(f"{im.fo(o)} x{n} start {s0} step {st}" for o, n, s0, st in prog[:8]) or "none") + ".")
    w("")
    w("The left-fill mask table sits at the end of the math-table zone in both programs; the right-fill, 2bpp-mask "
      "and colour-fill byte tables are *not* present as tables (the code builds those masks with shifts, see 7.1).")
    w("")
    w("### 7.3 GET/PUT-style bitmap blocks")
    w("")
    w("A `GET` array starts with `[width in bits][height]` followed by rows padded to whole bytes (320x200 mode: "
      "width bits = 2 x pixels). Every offset of each load module was tested for 8 <= width-bits <= 640 (even), "
      "4 <= height <= 200, data neither mostly zero nor mostly printable; candidates were then scored by row-to-row "
      "similarity, since real images repeat bytes between adjacent rows.")
    w("")
    for im in imgs:
        cands = get_put_candidates(im)
        strong = [c for c in cands if c[4] >= 0.5]
        best = max(cands, key=lambda c: c[4], default=None)
        w(f"* {im.name}: {len(cands)} header-shaped candidates, {len(strong)} with row similarity >= 0.5"
          + (f" (best similarity {best[4]} at {im.fo(best[0])}, zone {im.zone(best[0])})." if best else "."))
    w("")
    w("**Conclusion:** no embedded pre-rendered bitmap blocks. Header-shaped matches are statistical coincidences. "
      "In compiled BASIC a `GET` array is filled at run time from the screen after the sprite is drawn with `DRAW`, "
      "so the executables hold `DRAW` strings (section 5) and the `OBX` files hold the ship vectors. Pre-rendered "
      "blocks could only appear if the program `READ` them from `DATA` text; the only `DATA` text is the 48-number "
      "table in section 4.")
    w("")

    w("## 8. Candidate data-table index")
    w("")
    w("| exe | file offset | bytes | kind | description | confidence |")
    w("|---|---|---:|---|---|---|")
    seen = set()
    for exe, off, n, kind, desc, conf in sorted(index, key=lambda t: (t[0], t[1])):
        if (exe, off, kind, desc) in seen:
            continue
        seen.add((exe, off, kind, desc))
        w(f"| {exe} | 0x{off:05x} | {n or '-'} | {kind} | {desc} | {conf} |")
    w("")
    w("Confidence: **high** = exact decode or signature match; **medium** = pattern fits, purpose inferred. "
      "No entry is a claimed GET/PUT bitmap.")
    return "\n".join(md) + "\n"


def main():
    OUT_MD.write_text(build(), encoding="utf-8")
    print(f"Wrote {OUT_MD.relative_to(ROOT)}")


if __name__ == "__main__":
    sys.exit(main())
