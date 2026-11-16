"""Inspect Original/Gato.exe and write analysis/exe_strings.txt.

Sections of the report:
  1. MZ header fields and derived layout
  2. Executable-compression (packer) checks
  3. BASIC compiler / runtime identification (incl. decoded runtime error table)
  4. Every ASCII string (>= MIN_LEN printable bytes) with its exact file offset
"""
import math
import re
import struct
import sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
EXE = ROOT / "Original" / "Gato.exe"
OUT = ROOT / "analysis" / "exe_strings.txt"
MIN_LEN = 4

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
RUNTIME_MARKERS = [b"BRUN", b"BRUN10", b"BRUN20", b"BRUN30", b"BASRUN", b"BC.LIB", b"BASCOM", b"BASCOM.LIB",
                   b"Microsoft", b"MICROSOFT", b"MS-DOS", b"GW-BASIC", b"BASICA", b"QuickBASIC", b"Version",
                   b"VERSION", b"Compiler", b"Copyright (C)", b"(C) "]
IBM_MARKER = b"Licensed Material - Program Property of IBM"

ERROR_TABLE_START = 0x1C84  # first code byte, located right after the RET that precedes the table
KNOWN_LATER_ERRORS = {73: "Advanced feature", 74: "Rename across disks", 75: "Path/File access error",
                      76: "Path not found"}


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
    relocs = [struct.unpack_from("<HH", d, h["e_lfarlc"] + 4 * i) for i in range(h["e_crlc"])]
    h["relocs"] = relocs
    return h


def hexdump_line(d, off, n=16):
    c = d[off:off + n]
    return " ".join(f"{b:02x}" for b in c)


def packer_checks(d, h):
    """Return (list of (check, result, detail), verdict_text)."""
    rows = []
    body = d[h["header_bytes"]:]
    cs_off = h["header_bytes"] + h["e_cs"] * 16

    overlay = len(d) - h["declared_size"]
    rows.append(("Declared size vs file size", "OK" if overlay == 0 else "MISMATCH",
                 f"header declares {h['declared_size']} bytes, file is {len(d)} bytes "
                 f"({'no overlay' if overlay == 0 else f'{overlay} extra bytes'})"))

    sig_1c = d[0x1C:0x20]
    rows.append(("LZEXE signature at file offset 0x1C", "absent" if sig_1c not in (b"LZ09", b"LZ91") else "FOUND",
                 f"bytes at 0x1C = {sig_1c.hex(' ')} ({sig_1c!r})"))

    rows.append(("PKLITE signature at 0x1E ('PKLITE Copr.')", "absent" if d[0x1E:0x24] != b"PKLITE" else "FOUND",
                 f"bytes at 0x1C-0x23 = {d[0x1C:0x24].hex(' ')}; e_ovno field (PKLITE version/flags) = "
                 f"0x{h['e_ovno']:04x}"))

    exepack_hits = [(o, d[cs_off + o:cs_off + o + 2]) for o in (0x0E, 0x10, 0x12)
                    if d[cs_off + o:cs_off + o + 2] == b"RB"]
    rows.append(("EXEPACK 'RB' marker in the CS:0 header", "absent" if not exepack_hits else "FOUND",
                 f"checked CS:000E/0010/0012 at file offset 0x{cs_off:x}: "
                 f"{[d[cs_off + o:cs_off + o + 2].hex() for o in (0x0E, 0x10, 0x12)]}"))

    hits = []
    for sig, name in PACKER_SIGNATURES:
        for off in find_all(d, sig):
            hits.append((off, name, sig))
    rows.append(("Packer signature strings anywhere in the file", "absent" if not hits else "FOUND",
                 "none of: " + ", ".join(n for _, n in PACKER_SIGNATURES) if not hits else
                 "; ".join(f"{n} at 0x{o:x}" for o, n, _ in hits)))

    entry = h["entry_file_offset"]
    first = d[entry]
    note = "far CALL (opcode 9A) into the program image" if first == 0x9A else "unclassified"
    rows.append(("Entry-point code", "plain" if first == 0x9A else "check",
                 f"CS:IP = {h['e_cs']:04x}:{h['e_ip']:04x} -> file offset 0x{entry:x}, bytes "
                 f"{hexdump_line(d, entry, 12)}  ({note}); a packer would start with a decompression stub"))

    bad = [(s, o) for o, s in h["relocs"] if h["header_bytes"] + s * 16 + o + 2 > len(d)]
    rows.append(("Relocation table", "OK" if not bad else "INVALID",
                 f"{len(h['relocs'])} entries at 0x{h['e_lfarlc']:x}, all inside the image"
                 if not bad else f"{len(bad)} entries outside the image; packers typically leave 0-2 "
                                 f"relocations, a compiled BASIC program has hundreds"))

    ent_total = entropy(d)
    ent_hdr = entropy(d[:h["header_bytes"]])
    ent_body = entropy(body)
    blocks = [entropy(body[i:i + 2048]) for i in range(0, len(body), 2048)]
    rows.append(("Entropy (bits/byte)", "not compressed" if max(blocks) < 7.6 else "HIGH",
                 f"whole file {ent_total:.3f}, header {ent_hdr:.3f} (inflated by the relocation table), "
                 f"load module {ent_body:.3f}; 2 KB blocks min {min(blocks):.2f} / max {max(blocks):.2f} "
                 f"(compressed data is ~7.9-8.0)"))

    plain = len(re.findall(rb"[\x20-\x7e]{%d,}" % MIN_LEN, body))
    rows.append(("Readable runtime text in the load module", "present" if plain > 50 else "sparse",
                 f"{plain} ASCII strings incl. the runtime error-message table; a compressed image would "
                 f"hide them"))

    packed = any(r[1] in ("FOUND", "HIGH", "INVALID") for r in rows)
    verdict = ("COMPRESSION INDICATORS PRESENT - review the rows above." if packed else
               "NOT packed: no EXEPACK/PKLITE/LZEXE/DIET/UPX signature, ordinary header and relocation "
               "table, plain entry code and no high-entropy payload. This is a normal, uncompressed "
               "linked EXE.")
    return rows, verdict


def decode_error_table(d):
    """Entries are: code byte, text, last text byte has bit 7 set. Table ends at code 0xFF."""
    entries, p = [], ERROR_TABLE_START
    while p < len(d):
        code, start = d[p], p
        p += 1
        text = bytearray()
        while d[p] < 0x80:
            text.append(d[p])
            p += 1
        text.append(d[p] & 0x7F)
        p += 1
        entries.append((start, code, text.decode("ascii")))
        if code == 0xFF:
            break
    return entries, p


def runtime_id(d, h):
    lines = []
    ibm = find_all(d, IBM_MARKER)
    lines.append(f"Copyright/licence string: {IBM_MARKER.decode()!r} at "
                 f"{', '.join(f'0x{o:x}' for o in ibm) or 'NOT FOUND'}")
    prog = [(m.start(), m.group()) for m in re.finditer(rb"[\x20-\x7e]*Copyright[\x20-\x7e]*", d)]
    for o, s in prog:
        lines.append(f"Program text: {s.decode()!r} at 0x{o:x} (application copyright, not the runtime)")

    absent = [m.decode() for m in RUNTIME_MARKERS if not find_all(d, m)]
    present = [m.decode() for m in RUNTIME_MARKERS if find_all(d, m)]
    lines.append("Other runtime/vendor markers searched: absent = " + ", ".join(absent))
    if present:
        lines.append("  present = " + ", ".join(present) + " (see offsets in the string list)")
    ver = [(o, s.decode()) for o, s in ((m.start(), m.group()) for m in
           re.finditer(rb"[\x20-\x7e]{4,}", d)) if re.search(r"\b(v|ver\.?|version|release)\s*\d", s.decode(), re.I)]
    lines.append("Embedded version strings: " + (", ".join(f"0x{o:x}:{s!r}" for o, s in ver) or "none"))
    lines.append("Linked file-handling runtime: 'Bad record number' / 'Input past end' / device table "
                 "KYBD SCRN CAS1 COM1-2 LPT1-3 => BASIC runtime with random-access file support (GET/PUT).")

    entries, end = decode_error_table(d)
    codes = {c for _, c, _ in entries}
    lines.append("")
    lines.append(f"Runtime error-message table: file offsets 0x{ERROR_TABLE_START:x}-0x{end - 1:x}, "
                 f"{len(entries)} entries (code byte, then text whose last character has bit 7 set):")
    for off, code, text in entries:
        shown = "0xFF (generic)" if code == 0xFF else str(code)
        lines.append(f"  0x{off:05x}  error {shown:>14}  {text}")
    top = max(c for c in codes if c != 0xFF)
    missing = [f"{c} {n}" for c, n in KNOWN_LATER_ERRORS.items() if c not in codes]
    lines.append("")
    lines.append(f"Highest numbered runtime error: {top}. Not in the table: {', '.join(missing)}.")

    conclusion = [
        "",
        "CONCLUSION",
        "  Compiler/runtime: IBM Personal Computer BASIC Compiler (BASCOM) family. The IBM BASIC runtime is",
        "  linked into the EXE itself (its error-message table and licence string are inside the file), and",
        f"  the IBM licence string sits at 0x{ibm[0]:x}. Error messages use bit-7-terminated text, and there are",
        "  no Microsoft, GW-BASIC/BASICA or QuickBASIC markers.",
        "  Version: NOT embedded. The runtime contains no version or release string, so the exact release",
        "  (e.g. 1.00 vs 1.10 vs 2.00) cannot be read from the strings. The error table stops at error 72 and",
        "  lacks the DOS 2.x-era path errors (73-76), so it is an early-generation runtime of that family;",
        "  treat anything more precise as a hypothesis until compared with a known compiler build or its",
        "  BASRUN/library object code.",
    ]
    return lines + conclusion


def extract_strings(d):
    out = []
    table_end = decode_error_table(d)[1]
    for m in re.finditer(rb"[\x20-\x7e]{%d,}" % MIN_LEN, d):
        off, s = m.start(), m.group()
        nxt = d[m.end()] if m.end() < len(d) else 0
        note = ""
        if 0xA0 <= nxt <= 0xFE:
            note = f'  [+0x{nxt:02X} -> "{(s + bytes([nxt & 0x7F])).decode()}"]'
        if ERROR_TABLE_START <= off < table_end:
            note += "  <error table>"
        out.append((off, len(s), s.decode("ascii"), note))
    return out


def main():
    d = EXE.read_bytes()
    h = parse_header(d)
    out = []
    w = out.append

    w(f"GATO.EXE analysis - {EXE.relative_to(ROOT)}")
    w(f"file size: {len(d)} bytes (0x{len(d):x})")
    w("=" * 100)
    w("")
    w("1. MZ HEADER")
    w("-" * 100)
    for i, (name, meaning) in enumerate(HEADER_FIELDS):
        v = struct.unpack_from("<H", d, 2 * i)[0]
        w(f"  +0x{2 * i:02x}  {name:<11} 0x{v:04x} {v:>6}   {meaning}")
    w("")
    w(f"  header size      : {h['header_bytes']} bytes ({h['e_cparhdr']} paragraphs)")
    w(f"  declared size    : {h['declared_size']} bytes   load module: {h['load_module_size']} bytes")
    w(f"  entry point      : CS:IP {h['e_cs']:04x}:{h['e_ip']:04x} -> file offset 0x{h['entry_file_offset']:x}")
    w(f"  stack            : SS:SP {h['e_ss']:04x}:{h['e_sp']:04x}")
    w(f"  relocations      : {h['e_crlc']} entries at file offset 0x{h['e_lfarlc']:x}")
    w(f"  extra alloc      : min {h['e_minalloc']} / max 0x{h['e_maxalloc']:04x} paragraphs")
    w("")
    w("2. EXECUTABLE COMPRESSION CHECKS")
    w("-" * 100)
    rows, verdict = packer_checks(d, h)
    for name, res, detail in rows:
        w(f"  [{res:^14}] {name}")
        w(f"                   {detail}")
    w("")
    w(f"  VERDICT: {verdict}")
    w("")
    w("3. BASIC COMPILER / RUNTIME IDENTIFICATION")
    w("-" * 100)
    for ln in runtime_id(d, h):
        w("  " + ln if ln else "")
    w("")
    strings = extract_strings(d)
    w(f"4. ASCII STRINGS (runs of >= {MIN_LEN} bytes in 0x20-0x7E; {len(strings)} found)")
    w("-" * 100)
    w("  Offsets are file offsets. A string ending right before a byte with bit 7 set is shown with that")
    w("  byte decoded in brackets (BASIC runtime stores the last character of many messages that way).")
    w("  Tab/control bytes split strings. Length is in bytes.")
    w("")
    w(f"  {'offset':<10}{'decimal':>8}{'len':>5}  text")
    for off, n, s, note in strings:
        w(f"  0x{off:06x}  {off:>7}{n:>5}  {s}{note}")
    OUT.write_text("\n".join(out) + "\n", encoding="utf-8")
    print(f"Wrote {OUT} ({len(strings)} strings)")


if __name__ == "__main__":
    sys.exit(main())
