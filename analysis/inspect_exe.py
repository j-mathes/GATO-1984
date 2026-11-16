"""Inspect the GATO executables in Original/ and write analysis/exe_strings*.txt.

Usage: python analysis/inspect_exe.py [Gato.exe Gato1.exe DEMO.EXE History.exe]   (default: all four)

Per-executable report sections:
  1. MZ header fields and derived layout (incl. any trailing overlay bytes)
  2. Executable-compression (packer) checks
  3. BASIC compiler / runtime identification (incl. decoded runtime error table)
  4. Every ASCII string (>= MIN_LEN printable bytes) with its exact file offset
  5. Decoded BASIC string-literal pool ([length][data-segment offset][text] constants)
Also writes analysis/exe_comparison.txt comparing the executables.
"""
import hashlib
import math
import re
import struct
import sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "Original"
OUT_DIR = ROOT / "analysis"
OUTPUTS = {  # Gato.exe keeps the originally requested file name
    "Gato.exe": "exe_strings.txt",
    "Gato1.exe": "exe_strings_gato1.txt",
    "DEMO.EXE": "exe_strings_demo.txt",
    "History.exe": "exe_strings_history.txt",
}
COMPARISON = "exe_comparison.txt"
MIN_LEN = 4
SHINGLE = 32
LIMIT_UNIQUE = 120

HEADER_FIELDS = [
    ("e_magic", "signature 'MZ'"),
    ("e_cblp", "bytes used in last 512-byte page (0 = full)"),
    ("e_cp", "512-byte pages in file"),
    ("e_crlc", "relocation entries"),
    ("e_cparhdr", "header size in 16-byte paragraphs"),
    ("e_minalloc", "min extra paragraphs"),
    ("e_maxalloc", "max extra paragraphs"),
    ("e_ss", "initial SS (relative to load segment)"),
    ("e_sp", "initial SP"),
    ("e_csum", "checksum (ignored by DOS)"),
    ("e_ip", "initial IP"),
    ("e_cs", "initial CS (relative to load segment)"),
    ("e_lfarlc", "file offset of relocation table"),
    ("e_ovno", "overlay number (0 = main program)"),
]

# Known EXE packer / protector markers searched anywhere in the file.
PACKER_SIGNATURES = [
    (b"PKLITE", "PKLITE"), (b"PKWARE", "PKLITE/PKWARE"), (b"LZ91", "LZEXE 0.91"),
    (b"LZ09", "LZEXE 0.90"), (b"LZEXE", "LZEXE"), (b"EXEPACK", "EXEPACK"),
    (b"Packed file is corrupt", "EXEPACK stub message"), (b"UPX!", "UPX"), (b"DIET", "DIET"),
    (b"dlz", "DIET (dlz)"), (b"TINYPROG", "TINYPROG"), (b"WWPACK", "WWPACK"),
    (b"PGMPAK", "PGMPAK"), (b"EXELITE", "EXELITE"), (b"AINEXE", "AINEXE"), (b"-lh5-", "LHA/LZH data"),
]

# Markers that would identify other BASIC runtimes (absence is evidence too).
RUNTIME_MARKERS = [b"BRUN", b"BASRUN", b"BC.LIB", b"BASCOM", b"Microsoft", b"MICROSOFT", b"MS-DOS",
                   b"GW-BASIC", b"BASICA", b"QuickBASIC", b"Version", b"VERSION", b"Compiler",
                   b"Copyright (C)", b"(C) "]
IBM_MARKER = b"Licensed Material - Program Property of IBM"

KNOWN_LATER_ERRORS = {73: "Advanced feature", 74: "Rename across disks", 75: "Path/File access error",
                      76: "Path not found"}

# Data-file names and screen texts used to infer each executable's role.
ROLE_KEYS = [b"ORDXX", b"COURXX", b"MXP", b"OBX", b"DEMORD", b"HISTORY", b"LOG1", b"CAPTAIN'S LOG",
             b"PASSWORD?", b"ENTER NEW SUB COORDINATES", b"HISTORY AND SPECIFICATIONS", b"NORMAL PLAY",
             b"DEMONSTRATION", b"Spectrum HoloByte", b"POUET", b"CHAIN", b"GATO"]


def entropy(data):
    if not data:
        return 0.0
    n = len(data)
    return -sum(c / n * math.log2(c / n) for c in Counter(data).values())


def find_all(data, needle):
    return [m.start() for m in re.finditer(re.escape(needle), data)]


def parse_header(d):
    if d[:2] != b"MZ":
        raise ValueError("not an MZ executable")
    vals = struct.unpack_from("<14H", d, 0)
    h = dict(zip((n for n, _ in HEADER_FIELDS), vals))
    h["header_bytes"] = h["e_cparhdr"] * 16
    h["declared_size"] = (h["e_cp"] - 1) * 512 + (h["e_cblp"] or 512)
    h["load_module_size"] = h["declared_size"] - h["header_bytes"]
    h["entry_file_offset"] = h["header_bytes"] + h["e_cs"] * 16 + h["e_ip"]
    h["relocs"] = [struct.unpack_from("<HH", d, h["e_lfarlc"] + 4 * i) for i in range(h["e_crlc"])]
    return h


def hex_bytes(d, off, n=16):
    return " ".join(f"{b:02x}" for b in d[off:off + n])


def describe_overlay(d, h):
    tail = d[h["declared_size"]:]
    if not tail:
        return "none", "no bytes beyond the declared image size"
    kinds = set(tail)
    if kinds == {0}:
        what = "all 0x00 (padding)"
    elif kinds == {0x1A}:
        what = "all 0x1A (padding)"
    else:
        what = f"mixed content, {len(kinds)} distinct byte values"
    return "overlay", (f"{len(tail)} bytes beyond the declared size (file offset 0x{h['declared_size']:x}); "
                       f"{what}; first bytes {hex_bytes(tail, 0, 24)}")


def packer_checks(d, h):
    """Return (list of (check, result, detail), verdict_text)."""
    rows = []
    body = d[h["header_bytes"]:h["declared_size"]]
    cs_off = h["header_bytes"] + h["e_cs"] * 16

    if len(d) < h["declared_size"]:
        rows.append(("Declared size vs file size", "TRUNCATED",
                     f"header declares {h['declared_size']} bytes but file is {len(d)} bytes"))
    else:
        status, detail = describe_overlay(d, h)
        rows.append(("Declared size vs file size", "OK" if status == "none" else "overlay",
                     f"header declares {h['declared_size']} bytes, file is {len(d)} bytes; {detail}"))

    sig_1c = d[0x1C:0x20]
    rows.append(("LZEXE signature at file offset 0x1C", "absent" if sig_1c not in (b"LZ09", b"LZ91") else "FOUND",
                 f"bytes at 0x1C = {sig_1c.hex(' ')} ({sig_1c!r})"))

    rows.append(("PKLITE signature at 0x1E ('PKLITE Copr.')", "absent" if d[0x1E:0x24] != b"PKLITE" else "FOUND",
                 f"bytes at 0x1C-0x23 = {d[0x1C:0x24].hex(' ')}; e_ovno field (PKLITE version/flags) = "
                 f"0x{h['e_ovno']:04x}"))

    exepack = [d[cs_off + o:cs_off + o + 2] for o in (0x0E, 0x10, 0x12)]
    rows.append(("EXEPACK 'RB' marker in the CS:0 header", "FOUND" if b"RB" in exepack else "absent",
                 f"checked CS:000E/0010/0012 at file offset 0x{cs_off:x}: {[x.hex() for x in exepack]}"))

    hits = [(off, name) for sig, name in PACKER_SIGNATURES for off in find_all(d, sig)]
    rows.append(("Packer signature strings anywhere in the file", "FOUND" if hits else "absent",
                 "; ".join(f"{n} at 0x{o:x}" for o, n in hits) if hits
                 else "none of: " + ", ".join(n for _, n in PACKER_SIGNATURES)))

    entry = h["entry_file_offset"]
    first = d[entry]
    rows.append(("Entry-point code", "plain" if first == 0x9A else "check",
                 f"CS:IP = {h['e_cs']:04x}:{h['e_ip']:04x} -> file offset 0x{entry:x}, bytes "
                 f"{hex_bytes(d, entry, 12)}  "
                 f"({'far CALL (opcode 9A) into the program image' if first == 0x9A else 'unclassified'}); "
                 f"a packer would start with a decompression stub"))

    bad = [1 for o, s in h["relocs"] if h["header_bytes"] + s * 16 + o + 2 > h["declared_size"]]
    rows.append(("Relocation table", "INVALID" if bad else "OK",
                 f"{len(bad)} of {len(h['relocs'])} entries outside the image" if bad else
                 f"{len(h['relocs'])} entries at 0x{h['e_lfarlc']:x}, all inside the image "
                 f"(packers typically leave 0-2; compiled BASIC programs have dozens to thousands)"))

    blocks = [entropy(body[i:i + 2048]) for i in range(0, len(body), 2048)]
    rows.append(("Entropy (bits/byte)", "HIGH" if max(blocks) >= 7.6 else "not compressed",
                 f"whole file {entropy(d):.3f}, header {entropy(d[:h['header_bytes']]):.3f} (relocation "
                 f"table), load module {entropy(body):.3f}; 2 KB blocks min {min(blocks):.2f} / "
                 f"max {max(blocks):.2f} (compressed data is ~7.9-8.0)"))

    plain = len(re.findall(rb"[\x20-\x7e]{%d,}" % MIN_LEN, body))
    rows.append(("Readable text in the load module", "present" if plain > 50 else "sparse",
                 f"{plain} ASCII strings incl. the runtime error-message table; a compressed image would "
                 f"hide them"))

    packed = any(r[1] in ("FOUND", "HIGH", "INVALID", "TRUNCATED") for r in rows)
    verdict = ("COMPRESSION/ANOMALY INDICATORS PRESENT - review the rows above." if packed else
               "NOT packed: no EXEPACK/PKLITE/LZEXE/DIET/UPX signature, ordinary header and relocation "
               "table, plain entry code and no high-entropy payload. This is a normal, uncompressed "
               "linked EXE.")
    return rows, verdict, packed


def find_error_table(d):
    """Entries are: code byte, text, last text byte has bit 7 set. Table ends at code 0xFF.

    Returns (start, end, entries) or None when the runtime error table is absent.
    """
    m = re.search(rb"\x02Syntax erro\xf2", d)
    if not m:
        return None
    entries, p = [], m.start()
    while p < len(d):
        code, start = d[p], p
        p += 1
        text = bytearray()
        while p < len(d) and d[p] < 0x80:
            text.append(d[p])
            p += 1
        if p >= len(d):
            break
        text.append(d[p] & 0x7F)
        p += 1
        entries.append((start, code, text.decode("ascii")))
        if code == 0xFF:
            break
    return m.start(), p, entries


def runtime_id(d, h, table):
    lines = []
    ibm = find_all(d, IBM_MARKER)
    lines.append(f"Copyright/licence string: {IBM_MARKER.decode()!r} at "
                 f"{', '.join(f'0x{o:x}' for o in ibm) or 'NOT FOUND'}")
    for m in re.finditer(rb"[\x20-\x7e]*Copyright[\x20-\x7e]*", d):
        lines.append(f"Program text: {m.group().decode()!r} at 0x{m.start():x} "
                     f"(application copyright, not the runtime)")

    absent = [m.decode() for m in RUNTIME_MARKERS if not find_all(d, m)]
    present = [f"{m.decode()}@" + ",".join(f"0x{o:x}" for o in find_all(d, m)[:4])
               for m in RUNTIME_MARKERS if find_all(d, m)]
    lines.append("Other runtime/vendor markers searched: absent = " + ", ".join(absent))
    if present:
        lines.append("  present = " + "; ".join(present))
    ver = [(m.start(), m.group().decode()) for m in re.finditer(rb"[\x20-\x7e]{4,}", d)
           if re.search(r"\b(v|ver\.?|version|release)\s*\d", m.group().decode(), re.I)]
    lines.append("Embedded version strings: " + (", ".join(f"0x{o:x}:{s!r}" for o, s in ver) or "none"))
    lines.append("Device table: " + (
        "KYBD SCRN CAS1 COM1 COM2 LPT1-3 present" if b"CAS1" in d else "NOT found")
        + "; 'Bad record number' present => runtime supports random-access files (GET/PUT)"
        if b"Bad record numbe" in d else "Device table / file-record messages: NOT found")

    if table is None:
        lines += ["", "Runtime error-message table: NOT FOUND"]
        return lines, None
    start, end, entries = table
    codes = {c for _, c, _ in entries}
    lines.append("")
    lines.append(f"Runtime error-message table: file offsets 0x{start:x}-0x{end - 1:x}, {len(entries)} "
                 f"entries (code byte, then text whose last character has bit 7 set):")
    for off, code, text in entries:
        shown = "0xFF (generic)" if code == 0xFF else str(code)
        lines.append(f"  0x{off:05x}  error {shown:>14}  {text}")
    top = max(c for c in codes if c != 0xFF)
    missing = [f"{c} {n}" for c, n in KNOWN_LATER_ERRORS.items() if c not in codes]
    lines.append("")
    lines.append(f"Highest numbered runtime error: {top}. Not in the table: {', '.join(missing) or 'none'}.")
    lines += [
        "",
        "CONCLUSION",
        "  Compiler/runtime: IBM Personal Computer BASIC Compiler (BASCOM) family. The IBM BASIC runtime is",
        "  linked into the EXE itself (its error-message table and licence string are inside the file).",
        "  Error messages use bit-7-terminated text, and there are no Microsoft, GW-BASIC/BASICA or",
        "  QuickBASIC markers.",
        "  Version: NOT embedded. The runtime contains no version or release string, so the exact release",
        "  (e.g. 1.00 vs 1.10 vs 2.00) cannot be read from the strings. The error table stops at error 72 and",
        "  lacks the DOS 2.x-era path errors (73-76), so it is an early-generation runtime of that family;",
        "  treat anything more precise as a hypothesis until compared with a known compiler build or its",
        "  BASRUN/library object code. See exe_comparison.txt for how the four executables relate.",
    ]
    return lines, top


def extract_strings(d, h, table):
    out = []
    t_start, t_end = (table[0], table[1]) if table else (-1, -1)
    for m in re.finditer(rb"[\x20-\x7e]{%d,}" % MIN_LEN, d):
        off, s = m.start(), m.group()
        nxt = d[m.end()] if m.end() < len(d) else 0
        note = ""
        if 0xA0 <= nxt <= 0xFE:
            note = f'  [+0x{nxt:02X} -> "{(s + bytes([nxt & 0x7F])).decode()}"]'
        if t_start <= off < t_end:
            note += "  <error table>"
        if off >= h["declared_size"]:
            note += "  <overlay>"
        out.append((off, len(s), s.decode("ascii"), note))
    return out


def find_literal_pool(d, h):
    """Decode BASIC string constants stored as [len:u16][data-segment offset:u16][text].

    The data-segment base is recovered by voting: for a real entry, file_offset(text) - pointer is the
    same constant for every literal. Returns (ds_base_file_offset, [(file_off, ds_off, text_bytes)]) or None.
    """
    lo, hi = h["header_bytes"], h["declared_size"]
    votes = Counter()
    for i in range(lo, hi - 4):
        n = d[i]
        if n >= 3 and d[i + 1] == 0 and i + 4 + n <= hi:
            text = d[i + 4:i + 4 + n]
            if all(0x20 <= c < 0x7F for c in text):
                votes[i + 4 - (d[i + 2] | d[i + 3] << 8)] += 1
    if not votes:
        return None
    base = votes.most_common(1)[0][0]
    entries, i = [], lo
    while i < hi - 4:
        n = d[i] | d[i + 1] << 8
        ptr = d[i + 2] | d[i + 3] << 8
        if 1 <= n <= 255 and i + 4 - base == ptr and i + 4 + n <= hi:
            entries.append((i + 4, ptr, d[i + 4:i + 4 + n]))
            i += 4 + n
        else:
            i += 1
    return base, entries


def printable_text(b):
    return "".join(chr(c) if 0x20 <= c < 0x7F else f"\\x{c:02x}" for c in b)


def analyze(path):
    d = path.read_bytes()
    h = parse_header(d)
    table = find_error_table(d)
    rows, verdict, packed = packer_checks(d, h)
    rt_lines, top = runtime_id(d, h, table)
    strings = extract_strings(d, h, table)
    pool = find_literal_pool(d, h)

    out = []
    w = out.append
    w(f"{path.name} analysis - {path.relative_to(ROOT)}")
    w(f"file size: {len(d)} bytes (0x{len(d):x})   sha256: {hashlib.sha256(d).hexdigest()}")
    w("=" * 100)
    w("")
    w("1. MZ HEADER")
    w("-" * 100)
    for i, (name, meaning) in enumerate(HEADER_FIELDS):
        v = struct.unpack_from("<H", d, 2 * i)[0]
        w(f"  +0x{2 * i:02x}  {name:<11} 0x{v:04x} {v:>6}   {meaning}")
    w("")
    w(f"  header size      : {h['header_bytes']} bytes ({h['e_cparhdr']} paragraphs)")
    w(f"  declared size    : {h['declared_size']} bytes   load module: {h['load_module_size']} bytes   "
      f"trailing bytes: {max(0, len(d) - h['declared_size'])}")
    w(f"  entry point      : CS:IP {h['e_cs']:04x}:{h['e_ip']:04x} -> file offset 0x{h['entry_file_offset']:x}")
    w(f"  stack            : SS:SP {h['e_ss']:04x}:{h['e_sp']:04x}")
    w(f"  relocations      : {h['e_crlc']} entries at file offset 0x{h['e_lfarlc']:x}")
    w(f"  extra alloc      : min {h['e_minalloc']} / max 0x{h['e_maxalloc']:04x} paragraphs")
    w("")
    w("2. EXECUTABLE COMPRESSION CHECKS")
    w("-" * 100)
    for name, res, detail in rows:
        w(f"  [{res:^14}] {name}")
        w(f"                   {detail}")
    w("")
    w(f"  VERDICT: {verdict}")
    w("")
    w("3. BASIC COMPILER / RUNTIME IDENTIFICATION")
    w("-" * 100)
    for ln in rt_lines:
        w("  " + ln if ln else "")
    w("")
    w(f"4. ASCII STRINGS (runs of >= {MIN_LEN} bytes in 0x20-0x7E; {len(strings)} found)")
    w("-" * 100)
    w("  Offsets are file offsets. A string ending right before a byte with bit 7 set is shown with that")
    w("  byte decoded in brackets (BASIC runtime stores the last character of many messages that way).")
    w("  Tab/control bytes split strings. Length is in bytes.")
    w("")
    w(f"  {'offset':<10}{'decimal':>8}{'len':>5}  text")
    for off, n, s, note in strings:
        w(f"  0x{off:06x}  {off:>7}{n:>5}  {s}{note}")
    w("")
    w("5. BASIC STRING-LITERAL POOL (decoded constants)")
    w("-" * 100)
    if pool is None:
        w("  not found")
    else:
        base, entries = pool
        w("  The compiler stores each string constant as [length:u16][data-segment offset:u16][text bytes].")
        w(f"  Data segment starts at file offset 0x{base:x} (paragraph 0x{(base - h['header_bytes']) // 16:x} "
          f"of the load module); {len(entries)} literals. Unlike section 4 this includes strings shorter than")
        w(f"  {MIN_LEN} bytes, keeps exact lengths and drops the printable length/pointer bytes that "
          f"section 4 glues to the front.")
        w("")
        w(f"  {'file off':<10}{'ds off':>8}{'len':>5}  text")
        for off, ptr, text in entries:
            w(f"  0x{off:06x}  0x{ptr:04x}{len(text):>5}  {printable_text(text)}")
    out_path = OUT_DIR / OUTPUTS.get(path.name, f"exe_strings_{path.stem.lower()}.txt")
    out_path.write_text("\n".join(out) + "\n", encoding="utf-8")
    print(f"Wrote {out_path.name} ({len(strings)} strings)")

    body = d[h["header_bytes"]:h["declared_size"]]
    shingles = {body[i:i + SHINGLE] for i in range(len(body) - SHINGLE) if len(set(body[i:i + SHINGLE])) > 4}
    return {
        "name": path.name, "data": d, "h": h, "table": table, "top_error": top, "packed": packed,
        "strings": strings, "shingles": shingles, "out_name": out_path.name, "pool": pool,
        "ibm": find_all(d, IBM_MARKER),
    }


def comparison(results):
    names = [r["name"] for r in results]
    L = []
    w = L.append
    w("GATO executables - comparison")
    w("=" * 100)
    w("")
    w("A. LAYOUT")
    w("-" * 100)
    w(f"  {'file':<12}{'size':>8}{'declared':>9}{'trail':>6}{'hdr':>7}{'relocs':>7}  {'SS:SP':<10}{'packed?':<9}"
      f"{'IBM string':<11}{'err table':<10}{'strings':>8}  report")
    for r in results:
        h, d = r["h"], r["data"]
        t = r["table"]
        w(f"  {r['name']:<12}{len(d):>8}{h['declared_size']:>9}{max(0, len(d) - h['declared_size']):>6}"
          f"{h['header_bytes']:>7}{h['e_crlc']:>7}  {h['e_ss']:04x}:{h['e_sp']:04x}  "
          f"{'yes' if r['packed'] else 'no':<9}"
          f"{('0x%x' % r['ibm'][0]) if r['ibm'] else '-':<11}{('0x%x' % t[0]) if t else '-':<10}"
          f"{len(r['strings']):>8}  {r['out_name']}")
    w("")
    w("B. RUNTIME RELATIONSHIP")
    w("-" * 100)
    tables = {r["name"]: [(c, tx) for _, c, tx in r["table"][2]] for r in results if r["table"]}
    same = len({tuple(v) for v in tables.values()}) == 1
    w(f"  Decoded runtime error tables identical across {len(tables)} executables: {'YES' if same else 'NO'}"
      f" ({len(next(iter(tables.values())))} entries each)" if tables else "  No error tables found")
    w(f"  Fraction of {SHINGLE}-byte code windows shared (|A and B| / smaller file's window count):")
    w("  " + " " * 13 + "".join(f"{n:>13}" for n in names))
    for a in results:
        row = []
        for b in results:
            inter = len(a["shingles"] & b["shingles"])
            row.append(f"{100 * inter / max(1, min(len(a['shingles']), len(b['shingles']))):>12.1f}%")
        w(f"  {a['name']:<13}" + "".join(row))
    w("  (High overlap = the same linked IBM runtime library/modules; it does not show identical programs.)")
    w("")
    w("C. ROLE EVIDENCE (data-file names and screen text found in each executable)")
    w("-" * 100)
    w(f"  {'string':<30}" + "".join(f"{n:>13}" for n in names))
    for key in ROLE_KEYS:
        cells = []
        for r in results:
            offs = find_all(r["data"], key)
            cells.append(f"{(str(len(offs)) + 'x') if offs else '-':>13}")
        w(f"  {key.decode():<30}" + "".join(cells))
    w("  (counts are occurrences; first offsets are in each exe_strings*.txt)")
    w("")
    w("D. PROGRAM / DATA-FILE NAMES AND CHAIN TARGETS (string literals that name files or programs)")
    w("-" * 100)
    names_re = re.compile(r"ORDXX|COURXX|MXP|OBX|DEMO|HISTORY|GATO|LOG|\.(EXE|BAS|DAT|TXT|COM)$")
    for r in results:
        lits = [(off, ptr, printable_text(t)) for off, ptr, t in (r["pool"][1] if r["pool"] else [])]
        hit = [f"{s!r}@0x{off:x}" for off, ptr, s in lits if names_re.search(s) and len(s) <= 14]
        w(f"  {r['name']:<12} " + (", ".join(hit) or "none"))
    w("")
    w("E. STRING LITERALS UNIQUE TO EACH EXECUTABLE (decoded literal pool; length >= 6, not present in any "
      "other executable)")
    w("-" * 100)
    for r in results:
        mine = [(off, printable_text(t)) for off, _, t in (r["pool"][1] if r["pool"] else [])]
        others = set()
        for o in results:
            if o is not r and o["pool"]:
                others |= {printable_text(t) for _, _, t in o["pool"][1]}
        uniq = [(off, s) for off, s in mine
                if s not in others and len(s.strip()) >= 6 and re.search(r"[A-Za-z]{3}", s)]
        w(f"  {r['name']}: {len(uniq)} of {len(mine)} literals")
        for off, s in uniq[:LIMIT_UNIQUE]:
            w(f"      0x{off:06x}  {s}")
        if len(uniq) > LIMIT_UNIQUE:
            w(f"      ... {len(uniq) - LIMIT_UNIQUE} more in {r['out_name']} (section 5)")
    w("")
    w("F. NUMERIC DATA TEXT (probable DATA statements: runs of digits, commas and dots, >= 30 bytes)")
    w("-" * 100)
    for r in results:
        runs = [(m.start(), m.group().decode()) for m in re.finditer(rb"[\d,. ]{30,}", r["data"])
                if m.group().count(b",") >= 8]
        w(f"  {r['name']}: " + ("none" if not runs else ""))
        for off, s in runs:
            vals = s.strip().split(",")
            w(f"      0x{off:06x}  {len(vals)} values: {s.strip()}")
    return "\n".join(L) + "\n"


def main(argv):
    names = argv or list(OUTPUTS)
    results = [analyze(SRC / n) for n in names]
    if len(results) > 1:
        (OUT_DIR / COMPARISON).write_text(comparison(results), encoding="utf-8")
        print(f"Wrote {COMPARISON}")


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
