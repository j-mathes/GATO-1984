"""Index the Ghidra exports of the four GATO executables and write analysis/architecture_map.md.

Run:  python analysis/index_functions.py            (needs:  pip install capstone)

Inputs
  Original/*.exe                      the binaries (ground truth bytes)
  analysis/disasm/<Name>_decompiled.c Ghidra C export  (function list, call graph, C-level metrics)
  analysis/disasm/<Name>_disasm.txt   Ghidra listing   (function banners, extents, XREF counts)
Outputs
  analysis/architecture_map.md        human-readable map
  analysis/function_index.json        machine-readable index (every function / region)

Method
  1. Ghidra function list -> role by segment: PROGRAM (entry segment), STARTUP (first far call from entry),
     RUNTIME (segment receiving the program's far calls), DATA (everything else).
  2. Ghidra stops at the compiler's INT3 statement markers, so most of Gato1/DEMO's BASIC program is
     'undefined' in the export. The program body is therefore recovered from the EXE bytes with a linear
     sweep and cut into regions at points no jump crosses.
  3. Runtime routines (Ghidra functions and every far-call target) are decoded and tagged from
     instruction evidence: INT 10h/16h/21h, port I/O (speaker, timer, PIC, CGA, keyboard), 0B800h loads,
     string-op signatures, MBF table references. Shared routines are found by hashing opcode skeletons
     across the four binaries.
  4. The DOS-EXEC / CHAIN handoff is derived from the loader routine and its call sites, and checked
     against the Ghidra function that contains each call site.
"""
import bisect
import hashlib
import json
import re
import struct
import sys
from collections import Counter, defaultdict
from pathlib import Path

try:
    from capstone import CS_ARCH_X86, CS_MODE_16, Cs
except ImportError:
    sys.exit("capstone is required: pip install capstone")

import inspect_exe as ie
import map_executables as mx
import scan_data_tables as sdt

ROOT = ie.ROOT
DIS = ROOT / "analysis" / "disasm"
OUT_MD = ROOT / "analysis" / "architecture_map.md"
OUT_JSON = ROOT / "analysis" / "function_index.json"
BINS = [("Gato", "Gato.exe"), ("Gato1", "Gato1.exe"), ("DEMO", "DEMO.EXE"), ("History", "History.exe")]
GHIDRA_BASE_SEG = 0x1000          # Ghidra loads the image at segment 0x1000
MAX_ROUTINE_BYTES = 900
MIN_LABEL_GAP = 8                 # labels closer than this (instructions) are merged
ORPHAN_LOOKBACK = 220             # how far back (instructions) to look for the RET that precedes an orphan routine
MAX_REGION_INSTR = 600            # regions larger than this are split at jump-free cut points
SPLIT_CHUNK = 300
MAX_STRUCT_SPAN = 250             # jumps spanning more instructions are treated as GOTOs between regions
MIN_SKELETON_INSTR = 4            # shortest routine used for cross-binary sharing
SKELETON_PREFIX = 32              # instructions hashed per routine
REACH_LIMIT = 400                 # forward jumps further than this (bytes) do not extend a routine

FILE_FUNCS = {0x0F, 0x10, 0x11, 0x12, 0x13, 0x14, 0x15, 0x16, 0x17, 0x21, 0x22, 0x23, 0x24, 0x27, 0x28, 0x29}
DOS_MISC = {0x09: "print string", 0x0D: "disk reset", 0x0E: "select disk", 0x19: "get drive", 0x1A: "set DTA",
            0x2A: "get date", 0x2B: "set date", 0x2C: "get time", 0x2D: "set time"}
CATEGORY = {  # internal tag -> reporting category
    "video-bios": "video", "video-cga-memory": "video", "video-cga-ports": "video",
    "keyboard-bios": "keyboard", "keyboard-port": "keyboard",
    "sound-speaker": "sound", "sound-timer": "sound",
    "file-io": "file I/O", "dos-misc": "DOS misc (print/date/time/disk)",
    "string-concat": "string", "string-op": "string",
    "mbf-table": "FP math (MBF)", "mbf-arith": "FP math (MBF)",
    "pic-interrupt": "interrupt/PIC", "chain-loader": "chain loader", "startup-relocator": "startup",
    "number-format": "number formatting",
}
PURPOSE_RULES = [  # (regex over referenced literal text, purpose, binaries it applies to or None)
    (r"CLASS\s+SUBMARINE|Spectrum HoloByte|Paul Arlton|\bPRESENTS\b", "title / credits screen", None),
    (r"NORMAL PLAY|ITEM NUMBER|FROM THE MENU", "main menu and program dispatch", None),
    (r"PRESS ANY KEY TO CONTINUE|REREAD", "history pager", None),
    (r"PASSWORD|NEW SUB COORDINATES", "hidden position-set prompt (password protected)", None),
    (r"GAME CONTROL|DIFFICULTY|TIME OF DAY|RESET CAPTAIN|NUMBER OF ITEM", "game-control parameters screen (TAB)", None),
    (r"CAPTAIN'S LOG|TONNAGE|LAST SHIP IN LOG|LOG CLEARED|SHIPS SUNK|REVIEW BEFORE DELETION", "captain's log screen / log file", None),
    (r"BATTERY RM|TORPEDO RM|RADIO RM|FUEL TANKS|REPORTS HEAVY DAMAGE|DAMAGE REPORT", "damage report", None),
    (r"POWER\s+DAMAGE|DEPTH\s+SPEED|TORPEDOES|CHARGING|DIESEL|ELEC", "instrument panel (main control screen)", None),
    (r"ORDXX|COURXX|DTG|ZULU|SECRET|DEMORD", "mission assignment / orders (Morse message)", None),
    (r"MXP|OBX", "map and sprite loading", None),
    (r"MISSION COMPLETED|YOU HAVE SUCCESSFULLY|COMPLETED YOUR MISSION|CONTACT MADE|oxygen|PLAY AGAIN", "mission result / end of game", None),
    (r"QUADRANT|PATROL AREA|CHART", "chart / quadrant map", None),
    (r"THIS IS|LET'S|LETS|NOW |FUNCTION KEY|REMEMBER|WORLD WAR", "demo narration", {"DEMO.EXE"}),
    (r"^MB[A-Z0-9<>.#+\-]*$", "sound effect (PLAY string)", None),
    (r"^[A-Z0-9;,.\-=+ ]*[UDLREFGH]\d[A-Z0-9;,.\-=+ ]{8,}$", "vector drawing (DRAW strings: logo / sprites)", None),
]

md_cs = Cs(CS_ARCH_X86, CS_MODE_16)


# ------------------------------------------------------------------ Ghidra export parsing
FUNC_NAME = r"(?:FUN_[0-9a-f]{4}_[0-9a-f]{4}|entry)"
C_DEF = re.compile(r"^(?:[A-Za-z_][\w\s\*]*?\s)?(" + FUNC_NAME + r")\(([^)]*)\)\s*\n\n\{\n(.*?)^\}", re.M | re.S)
BANNER = re.compile(r"^\s*;\*\s+FUNCTION\s+\*\s*$")
SIG = re.compile(r";\S[^()]*?\b(" + FUNC_NAME + r")\(")
INS = re.compile(r"^(?P<blk>[A-Z]+_\d+):(?P<seg>[0-9a-f]{4}):(?P<off>[0-9a-f]{4})(?P<hex>(?:[0-9a-f]{2})*)\s+"
                 r"(?P<mn>[A-Z][A-Z0-9]*)\b")
XREFN = re.compile(r"XREF\[(\d+)\]")


def parse_c(path):
    text = path.read_text(encoding="latin-1")
    funcs = {}
    for m in C_DEF.finditer(text):
        name, params, body = m.group(1), m.group(2), m.group(3)
        funcs[name] = {
            "c_lines": body.count("\n"),
            "params": 0 if params.strip() in ("", "void") else params.count(",") + 1,
            "c_callees": sorted(set(re.findall(r"\b(FUN_[0-9a-f]{4}_[0-9a-f]{4})\(", body)) - {name}),
            "c_swi": sorted(set(re.findall(r"swi\((0x[0-9a-f]+|\d+)\)", body))),
            "c_io": body.count("in(") + body.count("out("),
            "c_indirect_calls": len(re.findall(r"\(\*\w+\)\(", body)),
        }
    return funcs


def parse_listing(path):
    """Function banners -> {name: {seg, start, end, blk, instrs, xrefs}} using the listing's own addresses."""
    funcs, cur, pending = {}, None, False
    for line in path.read_text(encoding="latin-1").split("\n"):
        if BANNER.match(line):
            pending, cur = True, None
            continue
        if pending:
            m = SIG.search(line)
            if m:
                cur = {"name": m.group(1), "instrs": 0, "xrefs": 0, "start": None, "end": None, "seg": None, "blk": None}
                funcs[cur["name"]] = cur
                pending = False
            continue
        if cur is None:
            continue
        xm = XREFN.search(line)
        if xm and cur["start"] is None:
            cur["xrefs"] = int(xm.group(1))
        m = INS.match(line)
        if not m or m.group("mn") == "??":
            continue
        off = int(m.group("off"), 16)
        n = len(m.group("hex")) // 2
        seg = int(m.group("seg"), 16)
        if cur["seg"] is None:
            cur["blk"], cur["seg"] = m.group("blk"), seg
        elif seg != cur["seg"]:
            continue   # Ghidra lets a function spill into the next segment's data; ignore the spill
        if cur["start"] is None:
            cur["start"] = off
        cur["end"] = max(cur["end"] or 0, off + n)
        cur["instrs"] += 1
    return funcs


# ------------------------------------------------------------------ byte-level helpers
class Binary:
    def __init__(self, key, exe):
        self.key, self.exe = key, exe
        self.path = ie.SRC / exe
        self.d = self.path.read_bytes()
        self.h = ie.parse_header(self.d)
        self.hdr = self.h["header_bytes"]
        self.pool = ie.find_literal_pool(self.d, self.h)
        self.desc_text = {ptr - 4: ie.printable_text(t) for _, ptr, t in self.pool[1]}
        self.img = sdt.Image(exe)
        self.c = parse_c(DIS / f"{key}_decompiled.c")
        self.lst = parse_listing(DIS / f"{key}_disasm.txt")
        self.table_ds = [(run[0] - self.img.base, run[-1] - self.img.base + 4, "MBF table")
                         for run in sdt.tail_mbf_runs(self.img)]
        self.table_ds += [(off - self.img.base, off - self.img.base + n * 8, "powers of ten")
                          for off, n in sdt.find_pow10(self.img)]

    def fo(self, seg, off):
        """File offset of Ghidra address seg:off (Ghidra image base = segment 0x1000)."""
        return self.hdr + (seg - GHIDRA_BASE_SEG) * 16 + off

    def name_at(self, fo):
        seg, rem = divmod(fo - self.hdr, 16)
        return f"FUN_{seg + GHIDRA_BASE_SEG - 0 :04x}_{rem:04x}" if False else self.ghidra_name(fo)

    def ghidra_name(self, fo):
        """Name Ghidra would give a function at file offset fo (segment chosen like the export)."""
        rel = fo - self.hdr
        best = None
        for f in self.lst.values():
            if f["start"] is None:
                continue
            if self.fo(f["seg"], f["start"]) == fo:
                return f["name"]
        seg = rel >> 4
        # unknown to Ghidra: invent a stable name using the runtime segment when known
        rs = getattr(self, "runtime_seg", None)
        if rs is not None and rel >= (rs - GHIDRA_BASE_SEG) * 16:
            return f"rt_{rs:04x}_{fo - self.hdr - (rs - GHIDRA_BASE_SEG) * 16:04x}"
        return f"prog_{rel:04x}"

    def literal_at(self, imm):
        return self.desc_text.get(imm)


def decode_routine(b, start, limit=MAX_ROUTINE_BYTES, end=None):
    """Linear decode from file offset `start` to the first RET/RETF/IRET/far-JMP at or after the furthest
    forward jump target (or to `end` when given)."""
    d, out, off, reach = b.d, [], start, start
    stop = end if end is not None else min(start + limit, len(d))
    while off < stop:
        got = list(md_cs.disasm(d[off:off + 16], off, 1))
        if not got:
            off += 1
            continue
        i = got[0]
        out.append(i)
        off += i.size
        if i.mnemonic.startswith("j") and re.fullmatch(r"0x[0-9a-f]+", i.op_str):
            t = int(i.op_str, 16)
            if i.address < t <= start + REACH_LIMIT:   # far-away targets are shared error exits, not the body
                reach = max(reach, t)
        if end is None and i.mnemonic in ("ret", "retf", "iret", "ljmp") and off > reach:
            break
    return out


def skeleton(ins):
    """Hash of the opcode skeleton of the first SKELETON_PREFIX instructions (numbers erased)."""
    parts = []
    for i in ins[:SKELETON_PREFIX]:
        op = re.sub(r"0x[0-9a-f]+|\b\d+\b", "N", i.op_str)
        parts.append(f"{i.mnemonic} {op}")
    return hashlib.sha1("|".join(parts).encode()).hexdigest()[:16]


def evidence(b, ins):
    """Tag a decoded routine from its instructions. Returns {tag: [evidence strings]}."""
    tags = defaultdict(list)
    ah = dx = None
    mbf_chain = 0
    table_ds = b.table_ds
    for i in ins:
        mn, op = i.mnemonic, i.op_str
        txt = f"{i.address:05x} {mn} {op}"
        m = re.fullmatch(r"ah, (0x[0-9a-f]+)", op) if mn == "mov" else None
        if m:
            ah = int(m.group(1), 16)
        m = re.fullmatch(r"ax, (0x[0-9a-f]+)", op) if mn == "mov" else None
        if m:
            ah = (int(m.group(1), 16) >> 8) & 0xFF
        m = re.fullmatch(r"dx, (0x[0-9a-f]+)", op) if mn == "mov" else None
        if m:
            dx = int(m.group(1), 16)
        if mn == "int":
            n = int(op, 16) if op.startswith("0x") else int(op)
            if n == 0x10:
                tags["video-bios"].append(txt)
            elif n == 0x16:
                tags["keyboard-bios"].append(txt)
            elif n == 0x21:
                if ah in FILE_FUNCS:
                    tags["file-io"].append(f"{txt} (AH={ah:02X})")
                elif ah is not None:
                    tags["dos-misc"].append(f"{txt} (AH={ah:02X} {DOS_MISC.get(ah, '')})")
                else:
                    tags["dos-misc"].append(f"{txt} (AH set by caller)")
        port = None
        m = re.fullmatch(r"(0x[0-9a-f]+), (?:al|ax)", op) if mn == "out" else None
        if m:
            port = int(m.group(1), 16)
        m = re.fullmatch(r"(?:al|ax), (0x[0-9a-f]+)", op) if mn == "in" else None
        if m:
            port = int(m.group(1), 16)
        if mn in ("out", "in") and "dx" in op:
            port = dx
        if port is not None:
            if port in (0x61, 0x42, 0x43, 0x40):
                tags["sound-speaker" if port == 0x61 else "sound-timer"].append(f"{txt} (port {port:#x})")
            elif port == 0x60:
                tags["keyboard-port"].append(txt)
            elif port in (0x20, 0x21):
                tags["pic-interrupt"].append(txt)
            elif 0x3D0 <= port <= 0x3DF:
                tags["video-cga-ports"].append(f"{txt} (port {port:#x})")
        if re.search(r"0xb800\b", op):
            tags["video-cga-memory"].append(txt)
        if mn in ("adc", "sbb", "rcl", "rcr"):
            mbf_chain += 1
        if re.search(r"\b(movsb|movsw|cmpsb|cmpsw|scasb|scasw)\b", mn) and mn.startswith(("rep", "repe", "repne")):
            tags["string-op"].append(txt)
        for hexv in re.findall(r"0x[0-9a-f]+", op):
            if mn.startswith(("j", "call", "lcall", "loop", "int")):
                break   # branch targets are code addresses, not data references
            v = int(hexv, 16)
            for lo, hi, what in table_ds:
                if lo <= v < hi and v > 0x100:
                    tags["mbf-table" if what == "MBF table" else "number-format"].append(f"{txt} ({what})")
    if any(i.mnemonic == "iret" for i in ins):
        tags["pic-interrupt"].append("IRET: interrupt service routine")
    blob = b"".join(i.bytes for i in ins)
    if blob.find(b"\x8b\x1c\x03\x1d\x70") >= 0:
        tags["string-concat"].append("mov bx,[si]; add bx,[di]; jo  (adds string lengths)")
    if mbf_chain >= 6:
        tags["mbf-arith"].append(f"{mbf_chain} ADC/SBB/RCL/RCR instructions (multi-word mantissa arithmetic; heuristic)")
    if any(i.mnemonic == "mov" and i.op_str.endswith("0x5845") for i in ins):
        tags["chain-loader"].append("sets default extension 'EX'+'E' (0x5845) for the file name")
    if any(i.mnemonic.startswith("rep movs") for i in ins) and any(i.mnemonic == "ljmp" for i in ins):
        tags["startup-relocator"].append("rep movsw + far jmp (copies data segment image, then jumps)")
    return tags


def categories(tags):
    return sorted({CATEGORY[t] for t in tags if t in CATEGORY})


# ------------------------------------------------------------------ analysis per binary
def program_bounds(b):
    """Return (program_start, program_end, runtime_seg, startup_seg) as file offsets / Ghidra segments."""
    lo = b.h["entry_file_offset"]
    segs = Counter(int.from_bytes(b.d[k + 3:k + 5], "little") for k in range(lo, min(lo + 24000, len(b.d) - 5))
                   if b.d[k] == 0x9A)
    runtime = segs.most_common(1)[0][0]
    first = int.from_bytes(b.d[lo + 3:lo + 5], "little") if b.d[lo] == 0x9A else None
    return lo, b.hdr + runtime * 16, runtime + GHIDRA_BASE_SEG, (first + GHIDRA_BASE_SEG) if first is not None else None


def role_of(b, seg):
    if seg == b.program_seg:
        return "PROGRAM"
    if seg == b.runtime_seg:
        return "RUNTIME"
    if seg == b.startup_seg:
        return "STARTUP"
    return "DATA/OTHER"


def collect_functions(b):
    """Merge Ghidra's list with routines recovered from the bytes (far-call targets Ghidra never reached)."""
    funcs = {}
    for name, f in b.lst.items():
        if f["start"] is None:
            continue
        fo = b.fo(f["seg"], f["start"])
        funcs[name] = {"name": name, "seg": f["seg"], "off": f["start"], "file": fo, "ghidra": True,
                       "role": role_of(b, f["seg"]), "ghidra_instrs": f["instrs"], "xrefs": f["xrefs"],
                       "ghidra_bytes": f["end"] - f["start"], **b.c.get(name, {})}
    # far-call targets in program code
    prog_lo, prog_hi = b.prog_lo, b.prog_hi
    targets = Counter()
    for i in b.program_ins:
        if i.mnemonic == "lcall":
            o = int.from_bytes(i.bytes[1:3], "little")
            s = int.from_bytes(i.bytes[3:5], "little")
            targets[(s + GHIDRA_BASE_SEG, o)] += 1
    b.far_calls = targets
    for (s, o), n in targets.items():
        name = f"FUN_{s:04x}_{o:04x}"
        if name not in funcs:
            funcs[name] = {"name": name, "seg": s, "off": o, "file": b.fo(s, o), "ghidra": False,
                           "role": role_of(b, s), "recovered": "far-call target"}
        funcs[name]["program_call_sites"] = n
    return funcs


def analyze(b):
    b.prog_lo, b.prog_hi, b.runtime_seg, b.startup_seg = program_bounds(b)
    b.program_seg = GHIDRA_BASE_SEG
    # linear sweep of the program body (INT3 = statement marker, not a stop)
    ins, off = [], b.prog_lo
    while off < b.prog_hi:
        got = list(md_cs.disasm(b.d[off:off + 16], off, 1))
        if not got:
            off += 1
            continue
        ins.append(got[0])
        off += got[0].size
    b.program_ins = ins
    funcs = collect_functions(b)
    b.funcs = funcs
    rt_lo = b.hdr + (b.runtime_seg - GHIDRA_BASE_SEG) * 16
    code_end = b.img.pool_lo   # the runtime segment runs on past the data-segment base, up to the literal pool
    by_file = {f["file"]: n for n, f in funcs.items()}

    def routine_for(tfo, note):
        if tfo in by_file:
            return by_file[tfo]
        if tfo >= rt_lo:
            seg, off = b.runtime_seg, tfo - rt_lo
        else:
            seg, off = ((tfo - b.hdr) >> 4) + GHIDRA_BASE_SEG, (tfo - b.hdr) & 15
        name = f"FUN_{seg:04x}_{off:04x}"
        funcs[name] = {"name": name, "seg": seg, "off": off, "file": tfo, "ghidra": False,
                       "role": role_of(b, seg), "recovered": note}
        by_file[tfo] = name
        return name

    def drain(queue):
        while queue:
            name = queue.pop()
            if name in done:
                continue
            done.add(name)
            f = funcs[name]
            fo = f["file"]
            if not (b.hdr <= fo < code_end - 16):
                continue
            r = decode_routine(b, fo)
            f["decoded_instrs"], f["decoded_bytes"] = len(r), (r[-1].address + r[-1].size - fo) if r else 0
            f["skeleton"] = skeleton(r) if len(r) >= MIN_SKELETON_INSTR else None
            f["tags"] = {k: v[:3] for k, v in evidence(b, r).items()}
            callees = set()
            extent_end = (r[-1].address + r[-1].size) if r else fo
            for i in r:
                if i.mnemonic == "lcall":
                    tfo = b.fo(int.from_bytes(i.bytes[3:5], "little") + GHIDRA_BASE_SEG, int.from_bytes(i.bytes[1:3], "little"))
                elif i.mnemonic == "call" and re.fullmatch(r"0x[0-9a-f]+", i.op_str):
                    tfo = int(i.op_str, 16)
                elif i.mnemonic == "jmp" and re.fullmatch(r"0x[0-9a-f]+", i.op_str) and not (fo <= int(i.op_str, 16) < extent_end):
                    tfo = int(i.op_str, 16)   # tail jump into another routine
                else:
                    continue
                if b.hdr <= tfo < code_end - 16:
                    cn = routine_for(tfo, f"called from {name}")
                    callees.add(cn)
                    if cn not in done:
                        queue.append(cn)
            f["callees"] = sorted(callees)

    done = set()
    drain([n for n, f in funcs.items() if f["role"] != "PROGRAM"])
    # orphan pass: an INT site outside every routine found so far belongs to a routine reached only through the
    # runtime's indirect dispatch tables; infer its entry as the instruction after the preceding RET.
    sweep = get_sweep(b)
    pos = {i.address: k for k, i in enumerate(sweep)}
    for _ in range(3):
        _, outside = attribute_sites(b, int_sites(b))
        new = []
        for site in outside:
            k = pos.get(site[0])
            if k is None:
                continue
            for j in range(k, max(0, k - ORPHAN_LOOKBACK), -1):
                if sweep[j].mnemonic in ("ret", "retf", "iret"):
                    start = sweep[j + 1].address
                    if start not in by_file:
                        new.append(routine_for(start, f"entry inferred from the INT {site[1]:02X}h site at 0x{site[0]:x}"))
                    break
        if not new:
            break
        drain(new)
    for n, f in funcs.items():
        for c in f.get("callees", []):
            funcs[c].setdefault("callers", []).append(n)
    b.by_file = by_file
    # propagation: categories a routine reaches only through routines it calls (up to 3 levels)
    for name, f in funcs.items():
        if "tags" not in f:
            continue
        seen, frontier, via = {name}, [name], set()
        for _ in range(3):
            nxt = []
            for n in frontier:
                for c in funcs[n].get("callees", []):
                    if c not in seen and "tags" in funcs[c]:
                        seen.add(c)
                        nxt.append(c)
                        via |= {CATEGORY[t] for t in funcs[c]["tags"] if t in CATEGORY}
            frontier = nxt
        f["via_categories"] = sorted(via - set(categories(f["tags"])))
    return b


def region_recovery(b):
    """Cut the program body at points no jump crosses; summarise each region."""
    ins = b.program_ins
    pts = [i.address for i in ins]
    jumps = []
    for i in ins:
        if i.mnemonic.startswith("j") and i.mnemonic != "jmpf" and re.fullmatch(r"0x[0-9a-f]+", i.op_str):
            jumps.append((i.address, int(i.op_str, 16)))
        elif i.mnemonic == "loop" or i.mnemonic.startswith("loop"):
            if re.fullmatch(r"0x[0-9a-f]+", i.op_str):
                jumps.append((i.address, int(i.op_str, 16)))
    diff = [0] * (len(pts) + 2)
    long_jumps = 0
    for s, t in jumps:
        if not (b.prog_lo <= t < b.prog_hi):
            continue
        if t > s:
            lo_i, hi_i = bisect.bisect_right(pts, s), bisect.bisect_left(pts, t)
        else:
            lo_i, hi_i = bisect.bisect_right(pts, t), bisect.bisect_right(pts, s)
        if hi_i - lo_i > MAX_STRUCT_SPAN:
            long_jumps += 1   # a long GOTO: an edge between regions, not a structural constraint
            continue
        diff[lo_i] += 1
        diff[hi_i] -= 1
    b.long_jumps = long_jumps
    acc, valid = 0, set()
    for k, a in enumerate(pts):
        acc += diff[k]
        if acc == 0:
            valid.add(k)
    # region starts: program start, long-jump targets (GOTO/GOSUB labels), code after an unconditional long jump,
    # and the starts of Ghidra's own PROGRAM functions
    why = {0: "program start"}
    for s, t in jumps:
        if not (b.prog_lo <= t < b.prog_hi):
            continue
        si, ti = bisect.bisect_left(pts, s), bisect.bisect_left(pts, t)
        if abs(ti - si) > MAX_STRUCT_SPAN:
            why.setdefault(ti, "label (target of a long jump)")
            if ins[si].mnemonic == "jmp" and si + 1 < len(ins):
                why.setdefault(si + 1, "after an unconditional long jump")
    for f in b.funcs.values():
        if f["role"] == "PROGRAM" and f["ghidra"]:
            k = bisect.bisect_left(pts, f["file"])
            if k < len(pts) and pts[k] == f["file"]:
                why.setdefault(k, "Ghidra function " + f["name"])
    kept, last = [], None
    for k in sorted(why):
        if last is None or k - last >= MIN_LABEL_GAP:
            kept.append(k)
            last = k
    # split oversized regions at valid cut points
    starts = []
    for a, e in zip(kept, kept[1:] + [len(ins)]):
        starts.append(a)
        if e - a > MAX_REGION_INSTR:
            pos = a
            for k in sorted(valid):
                if k - pos >= SPLIT_CHUNK and e - k >= SPLIT_CHUNK // 2 and a < k < e:
                    starts.append(k)
                    why.setdefault(k, "split of an oversized region")
                    pos = k
    starts = sorted(set(starts))
    bounds = starts + [len(ins)]
    region_of = {}
    regions = []
    for r, (a, e) in enumerate(zip(bounds, bounds[1:])):
        for k in range(a, e):
            region_of[ins[k].address] = r
        regions.append({"id": r + 1, "start": ins[a].address, "end": ins[e - 1].address + ins[e - 1].size,
                        "instrs": e - a, "begins_because": why.get(a, "label")})
    for r, (a, e) in zip(regions, zip(bounds, bounds[1:])):
        chunk = ins[a:e]
        r["statements"] = sum(1 for i in chunk if i.mnemonic == "int3")
        calls = Counter()
        lits = []
        out_edges, cat_count, via_count = set(), Counter(), Counter()
        for i in chunk:
            if i.mnemonic == "lcall":
                s = int.from_bytes(i.bytes[3:5], "little") + GHIDRA_BASE_SEG
                o = int.from_bytes(i.bytes[1:3], "little")
                calls[f"FUN_{s:04x}_{o:04x}"] += 1
            for hv in re.findall(r"0x[0-9a-f]+", i.op_str):
                v = int(hv, 16)
                if v in b.desc_text and i.mnemonic in ("mov", "push", "lea"):
                    t = b.desc_text[v]
                    if t.strip() and t not in lits:
                        lits.append(t)
            if i.mnemonic.startswith("j") and re.fullmatch(r"0x[0-9a-f]+", i.op_str):
                tgt = int(i.op_str, 16)
                tr = region_of.get(tgt)
                if tr is not None and tr != r["id"] - 1:
                    out_edges.add(tr + 1)
        for n, c in calls.items():
            f = b.funcs.get(n)
            if not f:
                continue
            for cat in categories(f.get("tags", {})):
                cat_count[cat] += c
            for cat in f.get("via_categories", []):
                via_count["~" + cat] += c
        r["literals"] = lits
        r["calls"] = dict(calls.most_common(6))
        r["runtime_calls"] = sum(calls.values())
        r["categories"] = dict(cat_count.most_common())
        r["via_categories"] = dict(via_count.most_common())
        r["jumps_to"] = sorted(out_edges)
    for r in regions:
        r["entered_from"] = sorted(o["id"] for o in regions if r["id"] in o["jumps_to"])
        r["purpose"] = suspect_purpose(b, r)
    b.regions = regions
    b.region_jumps = jumps
    return regions


def suspect_purpose(b, r):
    found = []
    for lit in r["literals"]:
        for rx, purpose, only in PURPOSE_RULES:
            if (only is None or b.exe in only) and re.search(rx, lit):
                if purpose not in found:
                    found.append(purpose)
                break
    if found:
        return "; ".join(found[:3])
    cats = r["categories"]
    fp, st, snd = cats.get("FP math (MBF)", 0), cats.get("string", 0), cats.get("sound", 0)
    if r["runtime_calls"] == 0:
        return "glue code (no runtime calls)"
    if snd >= 3:
        return "sound / tone generation logic (suspected)"
    if fp >= 10 and fp >= 2 * st:
        return "numeric simulation (movement/geometry/gauges; FP-heavy, no text)"
    if st >= 10 and st > fp:
        return "string building / text output (no fixed literals)"
    if cats:
        return "logic using " + ", ".join(list(cats)[:3]) + " runtime services (no text literals)"
    return "BASIC assignment/expression code (runtime calls without recognised services)"


# ------------------------------------------------------------------ handoff
def handoff(bins):
    rows, loaders = [], {}
    for b in bins:
        L = mx.find_loader(b.d, b.hdr, b.pool[0])
        refs = mx.literal_refs(b.d, b.hdr, b.pool[0], b.pool)
        loaders[b.key] = L
        if not L:
            continue
        lname = b.by_file.get(L["start"]) or b.ghidra_name(L["start"])
        for ref in refs:
            if ref["callee"] != L["start"]:
                continue
            site = ref["site"]
            owner = None
            for n, f in b.lst.items():
                if f["start"] is None:
                    continue
                a = b.fo(f["seg"], f["start"])
                if a <= site < a + (f["end"] - f["start"]):
                    owner = n
            tgt = mx.file_for_target(ref["text"])
            rows.append({"from": b.exe, "literal": ref["text"], "to": tgt, "site_file_offset": site,
                         "site_ghidra": f"1000:{site - b.hdr:04x}", "ghidra_function": owner,
                         "loader": lname, "loader_file_offset": L["start"]})
    return rows, loaders


def get_sweep(b):
    """Linear decode of the whole code area (header end .. literal pool); cached on the binary."""
    if getattr(b, "_sweep", None) is None:
        out, off, d = [], b.hdr, b.d
        while off < b.img.pool_lo:
            got = list(md_cs.disasm(d[off:off + 16], off, 1))
            if not got:
                off += 1
                continue
            out.append(got[0])
            off += got[0].size
        b._sweep = out
    return b._sweep


def int_sites(b):
    """Every INT 10h/16h/21h in the code area with the AH value in effect (None if unknown)."""
    sites, ah = [], None
    for i in get_sweep(b):
        if i.mnemonic == "mov" and re.fullmatch(r"ah, (0x[0-9a-f]+)", i.op_str):
            ah = int(i.op_str.split()[-1], 16)
        elif i.mnemonic == "mov" and re.fullmatch(r"ax, (0x[0-9a-f]+)", i.op_str):
            ah = (int(i.op_str.split()[-1], 16) >> 8) & 0xFF
        elif i.mnemonic == "int" and i.op_str in ("0x10", "0x16", "0x21"):
            sites.append((i.address, int(i.op_str, 16), ah))
    return sites


def attribute_sites(b, sites):
    """Split INT sites into those inside a routine the closure found and the rest."""
    ext = sorted((f["file"], f["file"] + f.get("decoded_bytes", 0), n) for n, f in b.funcs.items()
                 if f.get("decoded_bytes"))
    starts = [e[0] for e in ext]
    inside, outside = [], []
    for s in sites:
        k = bisect.bisect_right(starts, s[0]) - 1
        if k >= 0 and ext[k][0] <= s[0] < ext[k][1]:
            inside.append((s, ext[k][2]))
        else:
            outside.append(s)
    return inside, outside


# ------------------------------------------------------------------ report
def fmt_cats(cats):
    return ", ".join(cats) if cats else "-"


def program_function_purpose(b, f):
    """Purpose of a Ghidra PROGRAM function from the literals its code loads."""
    lits = []
    fo_end = f["file"] + f.get("ghidra_bytes", 0)
    for i in b.program_ins:
        if f["file"] <= i.address < fo_end and i.mnemonic in ("mov", "push", "lea"):
            for hv in re.findall(r"0x[0-9a-f]+", i.op_str):
                t = b.desc_text.get(int(hv, 16))
                if t and t.strip() and t not in lits:
                    lits.append(t)
    r = {"literals": lits, "categories": {}, "runtime_calls": 1}
    p = suspect_purpose(b, r)
    return p if lits else "startup / initialisation (no text literals)"


def build_report(bins, rows, loaders):
    md = []
    w = md.append
    runtime_hash = defaultdict(set)
    for b in bins:
        for f in b.funcs.values():
            if f["role"] == "RUNTIME" and f.get("skeleton"):
                runtime_hash[f["skeleton"]].add(b.key)
    for b in bins:
        for f in b.funcs.values():
            sk = f.get("skeleton")
            f["shared_in"] = sorted(runtime_hash[sk]) if sk and f["role"] == "RUNTIME" else []

    w("# GATO architecture map")
    w("")
    w("Generated by [index_functions.py](index_functions.py) from the Ghidra exports in "
      "[disasm/](disasm) and the original executables; the machine-readable index is "
      "[function_index.json](function_index.json). Addresses are Ghidra addresses (`seg:off`, image base segment "
      "0x1000) with the file offset in brackets where useful.")
    w("")
    w("## 1. Coverage of the Ghidra export")
    w("")
    w("| binary | Ghidra functions | PROGRAM | STARTUP | RUNTIME | other | program body (bytes) | program body in Ghidra functions |")
    w("|---|---:|---:|---:|---:|---:|---:|---:|")
    for b in bins:
        g = [f for f in b.funcs.values() if f["ghidra"]]
        c = Counter(f["role"] for f in g)
        prog_bytes = b.prog_hi - b.prog_lo
        covered = sum(f.get("ghidra_bytes", 0) for f in g if f["role"] == "PROGRAM")
        w(f"| {b.exe} | {len(g)} | {c['PROGRAM']} | {c['STARTUP']} | {c['RUNTIME']} | {c['DATA/OTHER']} | "
          f"{prog_bytes} | {covered} ({100 * covered / prog_bytes:.0f}%) |")
    w("")
    w("Roles come from the segment layout: **PROGRAM** = segment of `entry` (the compiled BASIC code), "
      "**STARTUP** = segment of the first far call from `entry` (relocates the data segment), **RUNTIME** = segment "
      "that receives the program's far calls (the linked IBM BASIC runtime).")
    w("")
    w("**Important limitation.** The compiler puts a one-byte `INT3` after most runtime calls as a statement "
      "marker, and Ghidra treats `INT3` as the end of a function. `Gato1.exe` and `DEMO.EXE` therefore have almost "
      "their whole BASIC program (39 KB and 24 KB) marked as undefined data in the export, and only the runtime "
      "functions reachable from `entry` were recovered. This script re-sweeps the program bytes itself and reports "
      "the result as *regions* (section 5), not as Ghidra functions.")
    w("")

    # ---- runtime tags
    w("## 2. Runtime library routines (tagged)")
    w("")
    w("Tags come from decoded instructions (see script header). `shared` = identical opcode skeleton present in "
      "that many of the four binaries. `via` lists categories reached only through a routine this one calls.")
    w("")
    w("| category | " + " | ".join(b.exe for b in bins) + " |")
    w("|---|" + "---:|" * len(bins))
    allcats = sorted({c for b in bins for f in b.funcs.values() if f["role"] == "RUNTIME" for c in categories(f.get("tags", {}))})
    for cat in allcats:
        cells = []
        for b in bins:
            n = sum(1 for f in b.funcs.values() if f["role"] == "RUNTIME" and cat in categories(f.get("tags", {})))
            cells.append(str(n))
        w(f"| {cat} | " + " | ".join(cells) + " |")
    w("")
    w("| binary | runtime routines (Ghidra + far-call targets) | shared with >=1 other binary | untagged |")
    w("|---|---:|---:|---:|")
    for b in bins:
        rt = [f for f in b.funcs.values() if f["role"] == "RUNTIME"]
        w(f"| {b.exe} | {len(rt)} | {sum(1 for f in rt if len(f['shared_in']) >= 2)} | "
          f"{sum(1 for f in rt if not categories(f.get('tags', {})))} |")
    w("")
    w("### Tagged routines (all four binaries; tag evidence is the first matching instruction)")
    w("")
    w("| category | routine (Ghidra addr) | binary | calls from program | shared | evidence |")
    w("|---|---|---|---:|---|---|")
    shown = 0
    for cat in allcats:
        for b in bins:
            items = [f for f in b.funcs.values() if f["role"] == "RUNTIME" and cat in categories(f.get("tags", {}))]
            items.sort(key=lambda f: -f.get("program_call_sites", 0))
            for f in items[:3]:
                tag = next(t for t in f["tags"] if CATEGORY.get(t) == cat)
                ev = f["tags"][tag][0]
                w(f"| {cat} | `{f['name']}` | {b.exe} | {f.get('program_call_sites', 0)} | "
                  f"{len(f['shared_in'])}/4 | `{ev}` |")
                shown += 1
    w("")
    w("(Top 3 per category and binary by number of call sites in the program; the full list is in the JSON index.)")
    w("")
    w("### Most-called runtime routines (filter these out first)")
    w("")
    w("| binary | routine | program call sites | category (direct) | also reaches | shared |")
    w("|---|---|--:|---|---|---|")
    for b in bins:
        top = sorted((f for f in b.funcs.values() if f.get("program_call_sites")), key=lambda f: -f["program_call_sites"])[:8]
        for f in top:
            w(f"| {b.exe} | `{f['name']}` | {f['program_call_sites']} | {fmt_cats(categories(f.get('tags', {})))} | "
              f"{fmt_cats(f.get('via_categories', []))} | {len(f.get('shared_in', []))}/4 |")
    w("")
    w("### Coverage check: BIOS/DOS interrupt sites vs routines found")
    w("")
    w("Every `INT 10h/16h/21h` in the code area was located by a linear sweep; a site is *attributed* when it lies "
      "inside a routine the call closure reached (direct/tail calls only). Sites reached only through the runtime's "
      "indirect dispatch tables stay unattributed, so category counts above are lower bounds.")
    w("")
    w("| binary | INT 10h | INT 16h | INT 21h | attributed | unattributed INT 21h with a file-I/O AH |")
    w("|---|--:|--:|--:|--:|---|")
    for b in bins:
        sites = int_sites(b)
        inside, outside = attribute_sites(b, sites)
        cnt = Counter(s[1] for s in sites)
        fio = [f"0x{s[0]:x}(AH={s[2]:02X})" for s in outside if s[1] == 0x21 and s[2] in FILE_FUNCS]
        w(f"| {b.exe} | {cnt[0x10]} | {cnt[0x16]} | {cnt[0x21]} | {len(inside)}/{len(sites)} | "
          f"{', '.join(fio[:6]) or 'none'}{' ...' if len(fio) > 6 else ''} |")
    w("")

    # ---- handoff
    w("## 3. GATO.EXE -> other programs: the handoff")
    w("")
    w("### 3.1 Mechanism")
    w("")
    L = loaders["Gato"]
    ah_census = {b.key: Counter(s[2] for s in int_sites(b) if s[1] == 0x21) for b in bins}
    exec_hits = {k: v.get(0x4B, 0) for k, v in ah_census.items()}
    w(f"* **No DOS EXEC.** INT 21h with AH=4Bh is executed {sum(exec_hits.values())} times in total across the four "
      "binaries (per-binary: " + ", ".join(f"{k} {v}" for k, v in exec_hits.items()) + "). No `COMMON`, `CHAIN`, "
      "`COMMAND.COM`, `.BAT`, `.TMP`, `.CFG` or `.INI` string exists in any of them.")
    w(f"* **In-process loader.** `CHAIN` is the runtime routine `{bins[0].by_file.get(L['start'])}` "
      f"(file 0x{L['start']:x}). It parses the name with INT 21h AH=29h, defaults the extension to `EXE`, opens it "
      "(AH=0Fh), reads the MZ header and image with AH=27h, applies relocations itself and `retf`s into the new "
      "entry point. The same routine is present in `DEMO.EXE` and `History.exe` (rows below); `Gato1.exe` has none.")
    w("* **Arguments / state.** The only argument is the file name (a BASIC string constant such as `DEMO`); the "
      "loader sets the DTA back to PSP:0080h and keeps the original PSP, so the command tail is unchanged and the "
      "new program receives **no command-line text**. The loader copies only a 0x58-word stub and the 0x20-word "
      "header/FCB buffer. No variables are passed (no `COMMON` block).")
    w("")
    w("### 3.2 Call sites")
    w("")
    w("| from | BASIC literal | to | site (seg:off) | file offset | contained in Ghidra function | loader |")
    w("|---|---|---|---|---|---|---|")
    for r in rows:
        w(f"| {r['from']} | `{r['literal']}` | {r['to']} | {r['site_ghidra']} | 0x{r['site_file_offset']:x} | "
          f"`{r['ghidra_function'] or 'not in Ghidra export'}` | `{r['loader']}` |")
    w("")
    g = bins[0]
    w("### 3.3 How `GATO.EXE` chooses")
    w("")
    consts = mx.menu_dispatch({"d": g.d, "pool": g.pool, "chain_to": [
        {"site": r["site_file_offset"]} for r in rows if r["from"] == "Gato.exe"]})
    w(f"The three call sites are guarded by comparisons of the menu variable with the MBF constants "
      f"{[round(v, 3) for _, v in consts]}: `2` -> `DEMO`, `3` -> `HISTORY`, `4` -> END, otherwise `GATO1`. "
      "`DEMO.EXE` and `History.exe` each chain back to `GATO`; `Gato1.exe` ends the process.")
    w("")

    # ---- per-binary architecture
    w("## 4. Entry points and call hierarchy per binary")
    w("")
    for b in bins:
        entry = b.funcs.get("entry")
        w(f"### {b.exe}")
        w("")
        e_fo = b.h["entry_file_offset"]
        w(f"* Entry: `entry` at 1000:{e_fo - b.hdr:04x} (file 0x{e_fo:x}); program body "
          f"0x{b.prog_lo:x}-0x{b.prog_hi:x}; runtime segment {b.runtime_seg:04x}; startup stub segment "
          f"{(b.startup_seg or 0):04x}.")
        first = [i for i in b.program_ins[:6] if i.mnemonic == "lcall"]
        if first:
            names = [f"FUN_{int.from_bytes(i.bytes[3:5], 'little') + GHIDRA_BASE_SEG:04x}_{int.from_bytes(i.bytes[1:3], 'little'):04x}"
                     for i in first]
            w(f"* Start-up call chain: `entry` -> " + " -> ".join(f"`{n}`" for n in names) +
              " (first = data-segment relocator; the others = runtime initialisation).")
        prog = [f for f in b.funcs.values() if f["role"] == "PROGRAM"]
        for f in sorted(prog, key=lambda f: f["off"]):
            callees = [c for c in f.get("c_callees", []) if c in b.funcs]
            direct, via = Counter(), Counter()
            for c in callees:
                g = b.funcs[c]
                for cat in categories(g.get("tags", {})):
                    direct[cat] += 1
                for cat in g.get("via_categories", []):
                    via[cat] += 1
            top = sorted(callees, key=lambda c: -b.funcs[c].get("program_call_sites", 0))[:4]
            hands = sorted({r["to"] for r in rows if r["from"] == b.exe and r["ghidra_function"] == f["name"]})
            w(f"* `{f['name']}` (Ghidra {f.get('c_lines', '?')} C lines, {f.get('ghidra_bytes', 0)} bytes, "
              f"purpose: {program_function_purpose(b, f)}): calls {len(callees)} distinct routines "
              f"[{', '.join(f'{k} {v}' for k, v in direct.most_common(4)) or 'none tagged'}]"
              + (f"; **hands off to** {', '.join(hands)} (call sites inside this function)" if hands else ""))
        handlers = sorted((f for f in b.funcs.values() if "pic-interrupt" in f.get("tags", {})
                           and any("IRET" in e for e in f["tags"]["pic-interrupt"])), key=lambda f: f["off"])
        if handlers:
            w("* Interrupt service routines (end in IRET): " + ", ".join(f"`{f['name']}`" for f in handlers[:8])
              + " - suspected timer/keyboard hooks (other runtime routines write the PIC mask ports 0x20/0x21).")
        if b.exe in ("Gato1.exe", "DEMO.EXE"):
            w(f"* Ghidra recovered no program functions here; the program is {len(b.program_ins)} instructions in "
              f"{len(b.regions)} recovered regions (section 5).")
        w("")

    # ---- regions
    w("## 5. Custom game code: recovered regions with suspected purpose")
    w("")
    w("Regions are runs of the program body that begin at a **label** (the target of a long jump, i.e. a GOTO/GOSUB "
      "target), at the code after an unconditional long jump, or at the start of a Ghidra PROGRAM function; "
      "regions over %d instructions are split further at points no jump crosses. They are **not** guaranteed "
      "BASIC subroutines: the compiler emits no near calls or returns (GOSUB/RETURN go through runtime routines), so "
      "these are the best structural units available. `Stmts` counts INT3 statement markers. `Entered from` lists "
      "regions that jump into this one (fall-through from the previous region is implied). Purpose is inferred "
      "from the text literals the region loads and the runtime categories it calls; the `Gato.exe`/`History.exe` "
      "program bodies are small enough that Ghidra's own functions are the regions." % MAX_REGION_INSTR)
    w("")
    for b in bins:
        w(f"### {b.exe} ({len(b.regions)} regions, {len(b.program_ins)} instructions, {b.long_jumps} long jumps)")
        w("")
        w("| # | file range | begins because | instrs | stmts | runtime calls | categories | entered from | literals (first) | suspected purpose |")
        w("|--:|---|---|--:|--:|--:|---|---|---|---|")
        for r in b.regions:
            lit = "; ".join(l.strip()[:28] for l in r["literals"][:3]) or "-"
            cats = ", ".join(f"{k} {v}" for k, v in list((r["categories"] | r.get("via_categories", {})).items())[:4]) or "-"
            ent = ",".join(map(str, r["entered_from"][:5])) + (f" +{len(r['entered_from']) - 5}" if len(r["entered_from"]) > 5 else "")
            ent = ent or "-"
            w(f"| {r['id']} | 0x{r['start']:05x}-0x{r['end'] - 1:05x} | {r['begins_because']} | {r['instrs']} | "
              f"{r['statements']} | {r['runtime_calls']} | {cats} | {ent} | {lit} | {r['purpose']} |")
        hubs = sorted((r for r in b.regions if len(r["entered_from"]) >= 3), key=lambda r: -len(r["entered_from"]))[:6]
        if hubs:
            w("")
            w("Hub regions (jumped to from >= 3 regions; likely main loops or shared routines): " + "; ".join(
                f"#{r['id']} ({len(r['entered_from'])} entries: {r['purpose'][:60]})" for r in hubs) + ".")
        w("")
    w("## 6. Caveats")
    w("")
    w("* Region boundaries and purposes are heuristics. Real BASIC subroutine boundaries (GOSUB targets) were not "
      "recovered because GOSUB/RETURN are runtime-mediated.")
    w("* Category tags are from instruction evidence in each routine (and for far-call targets, only the routine "
      "itself plus the `via` hint). A routine that merely calls a wrapper that executes `INT 10h` is *not* tagged video.")
    w("* Runs of tiny entry stubs that fall through into one shared body (for example the number-formatting "
      "stubs `FUN_199b_17ce`..`18ae` in Gato1) each carry the same evidence, so per-category counts are counts of "
      "*entry points*, not of distinct algorithms.")
    w("* 'FP math (MBF)' by multi-word arithmetic is a heuristic (>= 6 ADC/SBB/RCL/RCR); table references are exact.")
    return "\n".join(md) + "\n"


def to_json(bins, rows):
    out = {"binaries": {}, "handoff": rows}
    for b in bins:
        out["binaries"][b.exe] = {
            "program": {"start": b.prog_lo, "end": b.prog_hi, "runtime_segment": f"{b.runtime_seg:04x}",
                        "startup_segment": f"{(b.startup_seg or 0):04x}", "instructions": len(b.program_ins)},
            "functions": [{k: v for k, v in sorted(f.items(), key=lambda kv: kv[0])} for f in
                          sorted(b.funcs.values(), key=lambda f: (f["seg"], f["off"]))],
            "regions": b.regions,
        }
    return out


def main():
    bins = [analyze(Binary(k, e)) for k, e in BINS]
    for b in bins:
        region_recovery(b)
    rows, loaders = handoff(bins)
    OUT_MD.write_text(build_report(bins, rows, loaders), encoding="utf-8")
    OUT_JSON.write_text(json.dumps(to_json(bins, rows), indent=1, default=str) + "\n", encoding="utf-8")
    for b in bins:
        rt = [f for f in b.funcs.values() if f["role"] == "RUNTIME"]
        print(f"{b.exe}: {len(b.funcs)} functions ({len(rt)} runtime), {len(b.regions)} regions")
    print(f"Wrote {OUT_MD.relative_to(ROOT)} and {OUT_JSON.relative_to(ROOT)}")


if __name__ == "__main__":
    sys.exit(main())
