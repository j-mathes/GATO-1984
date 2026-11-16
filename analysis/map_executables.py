"""Map how the GATO executables relate and write analysis/strings/*.txt + analysis/exe_architecture.md.

Run:  python analysis/map_executables.py     (needs only the standard library; reuses inspect_exe.py)

What is derived from the binaries (nothing below is hard-coded except the report prose):
  * MZ header facts, packer checks and runtime error table (via inspect_exe.py)
  * every INT 21h call and the DOS function (AH) it uses, to tell FCB-era from handle-era runtimes
  * the in-process EXE loader used by CHAIN: located by its default-extension code ('EXE') and by the
    'Error in EXE file' message, with the call sites that reach it
  * BASIC string-literal descriptors (see inspect_exe.find_literal_pool) that name the programs and
    data files each executable references, and the runtime routine each reference calls
  * the launcher's menu dispatch: comparison constants decoded from Microsoft Binary Format singles
"""
import re
import struct
import sys
from collections import Counter
from pathlib import Path

import inspect_exe as ie

ROOT = ie.ROOT
STRINGS_DIR = ie.OUT_DIR / "strings"
ARCH_MD = ie.OUT_DIR / "exe_architecture.md"
EXES = ["Gato.exe", "Gato1.exe", "DEMO.EXE", "History.exe"]

FCB_FUNCS = {0x0F, 0x10, 0x11, 0x12, 0x13, 0x14, 0x15, 0x16, 0x17, 0x1A, 0x21, 0x22, 0x23, 0x24, 0x27, 0x28, 0x29}
HANDLE_FUNCS = {0x3C, 0x3D, 0x3E, 0x3F, 0x40, 0x41, 0x42, 0x43, 0x4B, 0x4C}
STATE_KEYS = [b"COMMON", b"CHAIN", b"CONFIG", b".CFG", b".TMP", b".INI", b".BAT", b"COMSPEC", b"COMMAND.COM",
              b"SYSTEM"]
DOS_FUNC_NAMES = {0x09: "print string", 0x0D: "disk reset", 0x0E: "select disk", 0x0F: "open FCB",
                  0x10: "close FCB", 0x11: "find first", 0x12: "find next", 0x13: "delete FCB",
                  0x16: "create FCB", 0x17: "rename FCB", 0x19: "get current disk", 0x1A: "set DTA",
                  0x27: "random block read", 0x28: "random block write", 0x29: "parse filename",
                  0x2A: "get date", 0x2B: "set date", 0x2C: "get time", 0x2D: "set time"}
CONCAT_SIG = b"\x8b\x1c\x03\x1d\x70"  # mov bx,[si]; add bx,[di]; jo  -> BASIC string '+' (lengths added)
DATA_NAMES = ["ORDXX", "COURXX", "MXP", "OBX", "DEMORD", "LOG1", "HISTORY", "DEMO", "GATO", "GATO1"]


def mbf4(b):
    """Microsoft Binary Format single (4 bytes, little endian: mantissa low..high, exponent)."""
    if b[3] == 0:
        return 0.0
    mant = (0x80 | (b[2] & 0x7F)) << 16 | b[1] << 8 | b[0]
    return (-1 if b[2] & 0x80 else 1) * mant / 2 ** 24 * 2.0 ** (b[3] - 128)


def code_range(d, h, pool):
    return h["header_bytes"], (pool[0] if pool else h["declared_size"])


def int21_calls(d, lo, hi):
    out = []
    for m in re.finditer(b"\xcd\x21", d[lo:hi]):
        i = lo + m.start()
        ah = None
        for k in range(i - 2, max(i - 11, lo), -1):
            if d[k] == 0xB4 and k + 2 <= i:
                ah = d[k + 1]
                break
            if d[k] == 0xB8 and k + 3 <= i:
                ah = d[k + 2]
                break
        out.append((i, ah))
    return out


def ah4b_candidates(d, lo, hi):
    """Byte patterns that look like 'mov ah,4Bh' and whether an INT 21h follows within 8 bytes."""
    res = []
    for m in re.finditer(b"\xb4\x4b|\xb8[\x00-\x03]\x4b", d[lo:hi]):
        i = lo + m.start()
        res.append((i, b"\xcd\x21" in d[i + 2:i + 10]))
    return res


def find_loader(d, lo, hi):
    """Locate the CHAIN loader routine: it defaults a missing extension to 'EXE' right after INT 21h/29h."""
    m = re.search(rb"\xc7\x06..\x45\x58\xc6\x06..\x45", d[lo:hi], re.S)
    if not m:
        return None
    pos = lo + m.start()
    start = d.rfind(b"\x89\x26", max(lo, pos - 0x60), pos)
    info = {"start": start, "ext_default_at": pos}
    window = d[start:start + 0x400]
    info["parse_fcb"] = b"\xb4\x29\xcd\x21" in window
    info["open_fcb"] = b"\xb4\x0f" in window
    info["read_block"] = b"\xb4\x27\xcd\x21" in window
    info["copy_words"] = [int.from_bytes(x, "little") for x in re.findall(rb"\xb9(..)\xf3\xa5", window, re.S)]
    info["keeps_psp"] = bool(re.search(rb"\x83\xed\x10\x8e\xc5\x8e\xdd\xba\x80\x00\xb4\x1a\xcd\x21\xcb", d[start:start + 0x600]))
    info["applies_relocs"] = b"\x26\x01\x2d" in d[start:start + 0x600]
    msg = d.find(b"Error in EXE file")
    info["error_msg"] = msg if msg >= 0 else None
    return info


def literal_refs(d, lo, base, pool):
    """For each string literal, the code sites that load its descriptor and the far call that follows."""
    refs = []
    for off, ptr, text in pool[1]:
        desc = ptr - 4
        word = bytes([desc & 255, desc >> 8])
        for m in re.finditer(re.escape(word), d[lo:base]):
            i = lo + m.start()
            if d[i - 1] not in (0xB8, 0xBA, 0xBB, 0xBE, 0xBF):
                continue
            j = d.find(b"\x9a", i + 2, i + 9)
            if j < 0:
                continue
            o, s = struct.unpack_from("<HH", d, j + 1)
            callee = lo + s * 16 + o
            reclen = None
            mm = re.match(rb"\xb9(..)", d[i + 2:i + 5], re.S)
            if mm:
                reclen = int.from_bytes(mm.group(1), "little")
            refs.append({"text": ie.printable_text(text), "site": i - 1, "callee": callee, "reclen": reclen,
                         "concat": d[callee:callee + 0x20].find(CONCAT_SIG) >= 0})
    return sorted(refs, key=lambda r: r["site"])


def write_strings_file(path, d, h, table, pool):
    strings = ie.extract_strings(d, h, table)
    lines = [f"{path.name} - printable ASCII strings (runs of >= {ie.MIN_LEN} bytes in 0x20-0x7E)",
             f"file size {len(d)} bytes; {len(strings)} strings; offsets are file offsets",
             "A string followed directly by a byte with bit 7 set shows that byte decoded in brackets "
             "(the runtime stores the last character of many messages that way).",
             "", f"{'offset':<10}{'decimal':>8}{'len':>5}  text"]
    for off, n, s, note in strings:
        lines.append(f"0x{off:06x}  {off:>7}{n:>5}  {s}{note}")
    if pool:
        base, entries = pool
        lines += ["", f"BASIC string-literal pool ({len(entries)} constants; [len][ds offset][text]; includes strings "
                      f"shorter than {ie.MIN_LEN} bytes)", f"{'file off':<10}{'ds off':>8}{'len':>5}  text"]
        for off, ptr, text in entries:
            lines.append(f"0x{off:06x}  0x{ptr:04x}{len(text):>5}  {ie.printable_text(text)}")
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")
    return len(strings)


def analyze(name):
    path = ie.SRC / name
    d = path.read_bytes()
    h = ie.parse_header(d)
    table = ie.find_error_table(d)
    pool = ie.find_literal_pool(d, h)
    rows, verdict, packed = ie.packer_checks(d, h)
    lo, hi = code_range(d, h, pool)
    calls = int21_calls(d, h["header_bytes"], h["declared_size"])
    loader = find_loader(d, lo, hi)
    refs = literal_refs(d, lo, pool[0], pool) if pool else []
    r = {
        "name": name, "d": d, "h": h, "table": table, "pool": pool, "packed": packed, "verdict": verdict,
        "calls": calls, "ah_hist": Counter(a for _, a in calls),
        "loader": loader, "refs": refs, "ibm": ie.find_all(d, ie.IBM_MARKER),
        "ah4b": ah4b_candidates(d, h["header_bytes"], h["declared_size"]),
        "state_hits": {k.decode(): ie.find_all(d, k) for k in STATE_KEYS if ie.find_all(d, k)},
        "startup_check": ie.find_all(d, b"Insufficient memory"),
    }
    r["n_strings"] = write_strings_file(STRINGS_DIR / f"{name}.txt", d, h, table, pool)
    chain_to = []
    if loader:
        for ref in refs:
            if ref["callee"] == loader["start"]:
                chain_to.append(ref)
    r["chain_to"] = chain_to
    return r


def file_for_target(text):
    for p in ie.SRC.iterdir():
        if p.suffix.lower() == ".exe" and p.stem.lower() == text.lower():
            return p.name
    return None


def menu_dispatch(r):
    """Decode the launcher's comparison constants (MBF singles) located just before its CHAIN call sites."""
    d, pool = r["d"], r["pool"]
    base = pool[0]
    sites = [c["site"] for c in r["chain_to"]]
    if not sites:
        return []
    win = d[min(sites) - 0x30:max(sites) + 0x10]
    out = []
    for m in re.finditer(rb"\xbf(..)\xbe(..)\x9a", win, re.S):
        ds = int.from_bytes(m.group(1), "little")
        raw = d[base + ds:base + ds + 4]
        out.append((ds, mbf4(raw)))
    return out


def yn(b):
    return "yes" if b else "no"


def build_markdown(res):
    by = {r["name"]: r for r in res}
    g, g1, demo, hist = by["Gato.exe"], by["Gato1.exe"], by["DEMO.EXE"], by["History.exe"]
    same_table = len({tuple((c, t) for _, c, t in r["table"][2]) for r in res if r["table"]}) == 1
    top = max(c for _, c, _ in g["table"][2] if c != 0xFF)
    md = []
    w = md.append

    w("# GATO executable architecture")
    w("")
    w("Generated by [map_executables.py](map_executables.py) from the binaries in `Original/` "
      "(the task text said `original_game/`; the folder is `Original/`). "
      "Full per-file string dumps are in [strings/](strings/); the earlier per-file reports are "
      "[exe_strings.txt](exe_strings.txt), [exe_comparison.txt](exe_comparison.txt) and its siblings.")
    w("")
    w("## 1. Summary")
    w("")
    w("```text")
    w("DOS prompt")
    w("   |  (only Gato.exe is started from DOS)")
    w("   v")
    w("GATO.EXE  title screen + menu  [1] play  [2] demo  [3] history  [4] exit")
    w("   |-- 1 / default --CHAIN \"GATO1\"  --> GATO1.EXE    (game; ends back at DOS)")
    w("   |-- 2           --CHAIN \"DEMO\"   --> DEMO.EXE     --CHAIN \"GATO\" --> GATO.EXE")
    w("   |-- 3           --CHAIN \"HISTORY\"--> HISTORY.EXE  --CHAIN \"GATO\" --> GATO.EXE")
    w("   `-- 4           --END--> DOS")
    w("```")
    w("")
    w("* All four are **IBM BASIC Compiler** programs with the IBM runtime linked in; none is packed.")
    w("* `CHAIN` is implemented **inside the BASIC runtime** as an in-process EXE loader (FCB file I/O, manual "
      "relocation, `retf` into the new image). The executables never call DOS EXEC (INT 21h AH=4Bh).")
    w("* **No configuration state is handed over.** The launcher passes only the *choice of program*; the loader "
      "copies nothing but its own header/FCB buffer and the original PSP stays in place. The only persistent "
      "state shared by the game and the demo is the Captain's Log data file (`LOG1`).")
    w("")
    w("## 2. The four executables")
    w("")
    w("| file | size | declared | trailing | relocs | packed | role | chains to |")
    w("|---|---:|---:|---:|---:|---|---|---|")
    roles = {"Gato.exe": "launcher / menu", "Gato1.exe": "core game", "DEMO.EXE": "scripted demonstration",
             "History.exe": "history viewer"}
    for r in res:
        h, d = r["h"], r["d"]
        targets = ", ".join(sorted({file_for_target(c["text"]) or c["text"] for c in r["chain_to"]})) or "-"
        w(f"| {r['name']} | {len(d)} | {h['declared_size']} | {max(0, len(d) - h['declared_size'])} | "
          f"{h['e_crlc']} | {yn(r['packed'])} | {roles[r['name']]} | {targets} |")
    w("")
    w("Header details (MZ fields, entropy, EXEPACK/PKLITE/LZEXE/DIET/UPX checks, entry code) are in the per-file "
      "reports. Result for every file: no packer signature, `CS:IP = 0000:001A` starting with a far call into the "
      "runtime, relocation table fully inside the image, no high-entropy payload. `DEMO.EXE` and `History.exe` carry "
      "81 and 33 zero bytes after the declared image (padding).")
    w("")
    w("## 3. Compiler and runtime")
    w("")
    w(f"* Licence string `{ie.IBM_MARKER.decode()}` at " + ", ".join(
        f"`{r['name']}` 0x{r['ibm'][0]:x}" for r in res if r["ibm"]) + ".")
    w(f"* The decoded runtime error table is {'identical' if same_table else 'NOT identical'} in all four "
      f"({len(g['table'][2])} entries, highest error {top}; no errors 73-76).")
    w("* No Microsoft, QuickBASIC, GW-BASIC/BASICA or C-runtime markers; machine code is far-call/`push bp` BASIC "
      "compiler output, not hand assembly or C.")
    api = {r["name"]: r for r in res}
    used = Counter()
    for r in res:
        used.update(a for a in r["ah_hist"] if a is not None)
    handle_used = sorted(a for a in used if a in HANDLE_FUNCS)
    unresolved = {r["name"]: r["ah_hist"].get(None, 0) for r in res}
    w("* DOS API used by the runtime (INT 21h function number resolved from the preceding `mov ah`): "
      + ", ".join(f"{a:02X}h {DOS_FUNC_NAMES.get(a, '?')}" for a in sorted(used)) + ".")
    w(f"  Highest function number used: {max(used):02X}h. Handle-based file functions "
      f"({', '.join(f'{a:02X}h' for a in sorted(HANDLE_FUNCS))}) are "
      f"{'used: ' + ', '.join(f'{a:02X}h' for a in handle_used) if handle_used else 'never used'}; file I/O is "
      "FCB-based throughout. That matches a runtime written for DOS 1.x and the error table lacking the DOS 2 "
      "path errors.")
    w(f"  ({sum(unresolved.values())} INT 21h byte pairs could not be resolved: one is a shared wrapper whose "
      "caller sets AH, one is the operand of a `jmp far` in `DEMO.EXE`; none is a function above 2Dh or an EXEC.)")
    w("* Numbers are Microsoft Binary Format singles (e.g. the launcher compares the menu choice with the constants "
      "`00 00 00 82` = 2.0, `00 00 40 82` = 3.0, `00 00 00 83` = 4.0). MBF therefore exists inside the programs, "
      "but not in the scenario data files (those are plain text).")
    w("* **Exact version: not recoverable.** No version/release string exists; the evidence only supports "
      "\"early IBM BASIC Compiler runtime, DOS 1.x-era\". Anything finer (1.00 vs 1.10 vs 2.00) would need a "
      "known compiler build to compare against.")
    w("")
    w("## 4. How GATO.EXE launches the others")
    w("")
    w("### 4.1 No DOS EXEC")
    w("")
    w("| file | INT 21h byte pairs (whole load module) | AH=4Bh calls | stray `B4 4B`-like byte patterns (not followed by INT 21h) |")
    w("|---|---:|---:|---|")
    for r in res:
        n4b = sum(1 for _, a in r["calls"] if a == 0x4B)
        stray = ", ".join(f"0x{o:x}" for o, hit in r["ah4b"] if not hit) or "-"
        w(f"| {r['name']} | {len(r['calls'])} | {n4b} | {stray} |")
    w("")
    w("INT 21h AH=4Bh is never executed. Searched strings in all four binaries: " + ", ".join(
        f"`{k.decode()}`" for k in STATE_KEYS) + " -> " + (
        "no hits." if not any(r["state_hits"] for r in res) else "hits: " + "; ".join(
            f"{r['name']}: {r['state_hits']}" for r in res if r["state_hits"])))
    w("")
    w("### 4.2 The CHAIN loader (found in the launcher, the demo and the history viewer)")
    w("")
    w("| file | loader routine (file offset) | 'Error in EXE file' text | parse name (29h) | open FCB (0Fh) | "
      "read block (27h) | applies relocations | keeps original PSP | words copied |")
    w("|---|---|---|---|---|---|---|---|---|")
    for r in res:
        L = r["loader"]
        if not L:
            w(f"| {r['name']} | none | no | - | - | - | - | - | - |")
            continue
        w(f"| {r['name']} | 0x{L['start']:x} | {('0x%x' % L['error_msg']) if L['error_msg'] else 'no'} | "
          f"{yn(L['parse_fcb'])} | {yn(L['open_fcb'])} | {yn(L['read_block'])} | {yn(L['applies_relocs'])} | "
          f"{yn(L['keeps_psp'])} | {', '.join(f'0x{x:x}' for x in L['copy_words'])} |")
    w("")
    w("What the routine does (read from the disassembly of the launcher's copy at the offset above; the table "
      "shows the same DOS calls, relocation step and PSP hand-off were found in the other two copies):")
    w("")
    w("1. Takes the BASIC string descriptor in `BX`, builds an FCB with INT 21h AH=29h and, if the name has no "
      "extension, fills in `EXE`.")
    w("2. Opens the file (AH=0Fh) and reads the 0x1A-byte MZ header (AH=27h random block read).")
    w("3. Computes the image size from the header and checks that it fits below the top of memory (otherwise it "
      "jumps to the runtime's error path).")
    w("4. Calls four runtime housekeeping routines (not decoded; presumably closing files and releasing "
      "resources), copies a small stub plus the header/FCB buffer to the top of memory and `retf`s into the stub.")
    w("5. The stub reads the rest of the image to the same load address as the running program, adds the load "
      "segment to every relocation entry, sets SS:SP and the entry CS:IP from the header, sets the DTA to PSP:0080h "
      "and `retf`s to the new entry point. On failure it prints `Error in EXE file`.")
    w("")
    w("Chain call sites (BASIC string literal -> call of the loader):")
    w("")
    w("| file | literal | target file | code offset |")
    w("|---|---|---|---|")
    for r in res:
        for c in r["chain_to"]:
            w(f"| {r['name']} | `{c['text']}` | {file_for_target(c['text']) or '?'} | 0x{c['site']:x} |")
    w("")
    w("`GATO1.EXE` contains no loader, no `GATO` literal and no reference to another executable, so once the game "
      "ends control cannot return to the menu: it ends the process (to DOS). *Inference from absence; the "
      "'PLAY AGAIN? (Y/N)' prompt is handled inside the game.*")
    w("")
    w("### 4.3 Menu dispatch in the launcher")
    w("")
    consts = menu_dispatch(g)
    vals = [round(v, 3) for _, v in consts]
    w(f"The menu choice is stored in a numeric BASIC variable and compared with MBF constants "
      f"{vals} (DS offsets {', '.join(hex(a) for a, _ in consts)}) immediately before the chain calls:")
    w("")
    w("```basic")
    w("IF CHOICE = 2 THEN CHAIN \"DEMO\"")
    w("IF CHOICE = 3 THEN CHAIN \"HISTORY\"")
    w("IF CHOICE = 4 THEN END")
    w("CHAIN \"GATO1\"            ' menu item 1 and any other key (\"[1] NORMAL PLAY (DEFAULT)\")")
    w("```")
    w("")
    w("The menu text is in the launcher's literal pool: `[1] NORMAL PLAY (DEFAULT)`, `[2] DEMONSTRATION`, "
      "`[3] HISTORY AND SPECIFICATIONS`, `[4] EXIT`." if vals == [2.0, 3.0, 4.0] else
      "WARNING: constants are not 2/3/4 - re-check the decode.")
    w("")
    w("## 5. State passed between programs")
    w("")
    w("| mechanism | evidence | verdict |")
    w("|---|---|---|")
    w("| BASIC `COMMON` variables | no `COMMON` string; the loader copies only "
      f"{', '.join(f'0x{x:x}' for x in g['loader']['copy_words'])} words (stub, header/FCB buffer) and loads the "
      "new image at the same base as the running one; the new program's start-up code copies its own initial data "
      "image. The launcher's only variable of interest is the menu choice. Whether stale bytes of the old data "
      "segment survive in the new one was not determined | no hand-over found (not fully excluded) |")
    w("| command line / PSP | the loader keeps the original PSP (`DS=ES=PSP`, DTA reset to PSP:0080h); nothing in "
      "the launcher writes to it | PSP is shared but carries no GATO data |")
    w("| temporary/config file written by the launcher | the launcher's only file-name literals are `DEMO`, "
      "`HISTORY`, `GATO1`; none of the config/temp-file strings searched exists in any binary | none |")
    w("| DOS environment / registers | no INT 21h AH=4Bh, no environment access | none |")
    reclens = sorted({ref["reclen"] for r in (g1, demo) for ref in r["refs"] if ref["text"] == "LOG1"
                      and ref["reclen"]})
    params = [ie.printable_text(t).strip() for _, _, t in g1["pool"][1]
              if re.search(rb"DIFFICULTY|SOUND|TIME OF DAY|RESET CAPTAIN", t)]
    w(f"| persistent data files | `LOG1` is opened by the game and the demo with record length "
      f"{', '.join(map(str, reclens))} (the `LOG` and `Log1` files in `Original/` are 2944 bytes = 92 x 32); "
      f"the game-control parameters ({'; '.join(p for p in params if p.startswith('['))}) are asked for *inside* "
      "`GATO1` after launch | state lives in `LOG1`, not in the launcher |")
    w("")
    w("So the launcher is a pure program selector. The \"configuration\" screens belong to the game and the demo "
      "themselves.")
    w("")
    w("## 6. Files each program references")
    w("")
    w("| file | data-file / program literals (code offset of the load -> runtime routine called) |")
    w("|---|---|")
    for r in res:
        seen = []
        for ref in r["refs"]:
            key = (ref["text"], ref["callee"])
            if ref["text"] in DATA_NAMES and key not in [(s[0], s[1]) for s in seen]:
                seen.append((ref["text"], ref["callee"], ref["site"], ref["concat"]))
        txt = "; ".join(f"`{t}` -> 0x{c:x}{' (string concatenation)' if cc else ''} (site 0x{s:x})"
                        for t, c, s, cc in seen) or "none"
        w(f"| {r['name']} | {txt} |")
    w("")
    concat_names = sorted({ref["text"] for r in res for ref in r["refs"] if ref["concat"] and ref["text"] in DATA_NAMES})
    w(f"The callee for {', '.join(f'`{n}`' for n in concat_names)} is the runtime's BASIC string-concatenation "
      "routine (it adds the two lengths, checks for overflow and copies both strings). So these are *base names* "
      "that get a number appended at run time (`ORDXX` + n -> `ORDXX1`..`ORDXX20`, `COURXX` + n, `OBX` + n -> "
      "`OBX1`, `OBX3`..`OBX8`); `XX` is part of the name, not a placeholder. The other literals "
      "(`LOG1`, `MXP`, `DEMORD`, `HISTORY`) go straight to one shared routine per program, which I take to be the "
      "file-open routine (inferred from usage: it also receives the record length for `LOG1`). `DEMO` reads "
      "`DEMORD` instead of `ORDXX`/`COURXX`, so its scenario is scripted rather than loaded.")
    w("")
    w("## 7. Other observations")
    w("")
    w(f"* `Gato.exe` is the only binary with the start-up memory check text "
      f"(`fail in 64k boundary fixup`, `Insufficient memory` at "
      f"{', '.join(hex(o) for o in g['startup_check'])}); the three chain-loaded programs do not have it, "
      "which fits the design that only the launcher is started by DOS.")
    w("* `Gato1.exe` and `DEMO.EXE` hold the same 48-value numeric `DATA` text (12 records of x, y, size, aspect) "
      "that probably draws the islands on the chart screen; `Gato1.exe` ends with the unexplained text `POUET`.")
    w("")
    w("## 8. Confidence and open questions")
    w("")
    w("* **Certain** (read from code/bytes): header facts, no packing, the FCB-only DOS API, the loader routine "
      "and its call sites, the 2/3/4 menu constants, the absence of COMMON/config strings.")
    w("* **Strong inference**: `GATO1` terminates to DOS (no loader/`GATO` literal); `LOG1` is the only "
      "cross-session state; the three chain-loaded programs are never started from DOS by design.")
    w("* **Unknown**: exact compiler release; whether the runtime re-initialises *all* variables on chain or leaves "
      "some bytes from the previous program in memory (not exploited by any code path found); what `POUET` is.")
    w("")
    w("## 9. Reproduce")
    w("")
    w("```powershell")
    w("python analysis\\map_executables.py   # writes analysis\\strings\\*.txt and this file")
    w("python analysis\\inspect_exe.py       # per-file header/packer/runtime reports")
    w("```")
    return "\n".join(md) + "\n"


def main():
    STRINGS_DIR.mkdir(parents=True, exist_ok=True)
    res = [analyze(n) for n in EXES]
    for r in res:
        print(f"{r['name']}: {r['n_strings']} strings -> strings/{r['name']}.txt; "
              f"chain targets: {[c['text'] for c in r['chain_to']]}")
    ARCH_MD.write_text(build_markdown(res), encoding="utf-8")
    print(f"Wrote {ARCH_MD.relative_to(ROOT)}")


if __name__ == "__main__":
    sys.exit(main())
