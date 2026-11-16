"""Extract PC-speaker audio data to remake/src/data/audio_tables.json.

Run:  python analysis/export_audio_tables.py        (needs capstone, like index_functions.py)

What is extracted (all from byte signatures / instruction operands, nothing typed in by hand except the
signatures themselves)
  runtime   the speaker driver found in all four binaries: PIT programming, divisor formula, timer-tick rate,
            BEEP and the two-tone alarm constants, the note-divisor tables (PLAY) if the runtime has any
  sound     every call of the SOUND-statement routine in Gato1/DEMO with the statement's own instructions
            (everything since the previous INT3 statement marker) and the numeric constants they load
  play      the PLAY strings and every call site of the PLAY-statement routine
  morse     result of the Morse search (table found / not found, with what was searched)
Output values are exact decodes; 'frequency_hz' is derived with divisor = 1193180 / f.
"""
import json
import math
import re
import struct
import sys
from collections import Counter, defaultdict

import index_functions as x
import inspect_exe as ie
import parse_scenarios as ps

ROOT = ie.ROOT
OUT = ROOT / "remake" / "src" / "data" / "audio_tables.json"
PIT_HZ = 1193180
SOUND_SIG = re.compile(rb"\x83\xfb\x25\x72.\x8b\xcb\x8b\xf2\xbf..\xa5\xa4\xac\x3c\x91", re.S)
WINDOW_MAX = 60
MORSE = {"A": ".-", "B": "-...", "C": "-.-.", "D": "-..", "E": ".", "F": "..-.", "G": "--.", "H": "....", "I": "..",
         "J": ".---", "K": "-.-", "L": ".-..", "M": "--", "N": "-.", "O": "---", "P": ".--.", "Q": "--.-",
         "R": ".-.", "S": "...", "T": "-", "U": "..-", "V": "...-", "W": ".--", "X": "-..-", "Y": "-.--",
         "Z": "--..", "0": "-----", "1": ".----", "2": "..---", "3": "...--", "4": "....-", "5": ".....",
         "6": "-....", "7": "--...", "8": "---..", "9": "----."}


def mbf4(q):
    return x.sdt.mbf4(q)


def runtime_facts(b):
    d = b.d
    facts = {}

    def at(rx):
        m = re.search(rx, d[b.hdr:b.img.pool_lo], re.S)
        return (b.hdr + m.start()) if m else None

    p = at(rb"\xb0\xb6\xe6\x43\xe4\x61\x0c\x03\xe6\x61")
    facts["pit_channel2_square_wave_setup"] = {"file_offset": p, "bytes": "b0 b6 e6 43 e4 61 0c 03 e6 61",
                                               "meaning": "mov al,0B6h; out 43h,al (PIT ch2, mode 3); in al,61h; or al,3; out 61h,al (speaker on)"} if p else None
    p = at(rb"\xba\x12\x00\xb8\xdc\x34\xf7\xf1")
    facts["divisor_formula"] = {"file_offset": p, "expression": "divisor = 0x1234DC / frequency = 1193180 / f"} if p else None
    p = at(rb"\xb8\x00\x08\xe6\x40\x8a\xc4\xe6\x40")
    facts["timer_tick"] = {"file_offset": p, "pit0_divisor": 0x800, "tick_hz": round(PIT_HZ / 0x800, 3),
                           "ticks_per_bios_tick": 32,
                           "meaning": "the runtime reprograms PIT channel 0 to 2048 (582.6 Hz) and chains the original "
                                      "18.2 Hz handler every 32nd tick; note durations are counted in these ticks"} if p else None
    m = re.search(rb"\xb9\x20\x03\xba\x80\x00", d[b.hdr:b.img.pool_lo])
    facts["beep"] = {"file_offset": b.hdr + m.start(), "frequency_hz": 0x320, "duration_units": 0x80,
                     "duration_seconds": round(0x80 / (PIT_HZ / 0x800), 4),
                     "meaning": "BEEP / BEL character: 800 Hz for 128 timer ticks (4 BIOS ticks)"} if m else None
    m = re.search(rb"\xb9\xe8\x03\xba\x20\x00\xe8..\xb9\xf4\x01\xba\x20\x00", d[b.hdr:b.img.pool_lo], re.S)
    facts["alarm_two_tone"] = {"file_offset": b.hdr + m.start(),
                               "tones": [{"frequency_hz": 1000, "duration_units": 0x20, "seconds": round(0x20 / (PIT_HZ / 0x800), 4)},
                                         {"frequency_hz": 500, "duration_units": 0x20, "seconds": round(0x20 / (PIT_HZ / 0x800), 4)}],
                               "meaning": "runtime routine that plays 1000 Hz then 500 Hz, 1 BIOS tick each"} if m else None
    return facts


def note_tables(b):
    """Word tables of 12+ geometrically spaced values (ratio ~2^(1/12)) = PLAY note divisors."""
    d, out = b.d, []
    r = 2 ** (1 / 12)
    ratio_ok = lambda a, c: a > 20 and (0.93 < c / a < 0.95 or 1.05 < c / a < 1.07)
    for phase in (0, 1):
        i = b.hdr + phase
        while i + 26 < b.img.hi:
            w = struct.unpack_from("<13H", d, i)
            ok = all(ratio_ok(w[k], w[k + 1]) for k in range(12))
            if ok:
                n = 13
                while i + 2 * (n + 1) <= b.img.hi:
                    a, c = struct.unpack_from("<2H", d, i + 2 * (n - 1))
                    if not ratio_ok(a, c):
                        break
                    n += 1
                vals = list(struct.unpack_from(f"<{n}H", d, i))
                out.append({"file_offset": i, "entries": n, "words": vals,
                            "frequency_hz": [round(PIT_HZ / v, 2) for v in vals]})
                i += 2 * n
            else:
                i += 2
    return out


def find_targets(b):
    """Far-call targets in program code whose bytes match the SOUND-statement signature."""
    cnt = Counter()
    for i in b.program_ins:
        if i.mnemonic == "lcall":
            s = int.from_bytes(i.bytes[3:5], "little") + x.GHIDRA_BASE_SEG
            o = int.from_bytes(i.bytes[1:3], "little")
            cnt[b.fo(s, o)] += 1
    sound = None
    for t, n in cnt.items():
        if SOUND_SIG.search(b.d[t:t + 0x60]):
            sound = (t, n)
    return cnt, sound


def statement_window(b, idx):
    """Instructions of the statement that ends with the call at program index idx."""
    ins = b.program_ins
    k, out = idx - 1, []
    while k >= 0 and len(out) < WINDOW_MAX:
        if ins[k].mnemonic == "int3":
            break
        out.append(ins[k])
        k -= 1
    return list(reversed(out))


def describe(b, i):
    s = f"{i.address:05x} {i.mnemonic} {i.op_str}"
    if i.mnemonic == "lcall":
        s = f"{i.address:05x} call {int.from_bytes(i.bytes[3:5], 'little') + x.GHIDRA_BASE_SEG:04x}:{int.from_bytes(i.bytes[1:3], 'little'):04x}"
    return s


def ds_value(b, v):
    q = b.d[b.img.base + v:b.img.base + v + 4]
    return {"ds_offset": f"0x{v:04x}", "mbf_single": mbf4(q), "int16": int.from_bytes(q[:2], "little")}


def constants_of(b, window):
    consts = []
    for i in window:
        if i.mnemonic not in ("mov", "push", "add", "sub", "cmp", "lea"):
            continue
        for hv in re.findall(r"0x[0-9a-f]+", i.op_str):
            v = int(hv, 16)
            if v in b.desc_text:
                consts.append({"at": i.address, "string": b.desc_text[v]})
            elif "[" not in i.op_str and i.mnemonic == "mov" and "," in i.op_str and 0xb2 <= v < b.img.hi - b.img.base:
                consts.append({"at": i.address, "register": i.op_str.split(",")[0], **ds_value(b, v)})
            elif "[" not in i.op_str and i.mnemonic == "mov" and "," in i.op_str and v < 0xb2:
                consts.append({"at": i.address, "register": i.op_str.split(",")[0], "immediate": v})
    return consts


def sound_args(b, k):
    """freq/duration pointers = last 'mov bx,imm' / 'mov dx,imm' in the instructions before the call."""
    args = {}
    for j in range(k - 1, max(0, k - 40), -1):
        i = b.program_ins[j]
        m = re.fullmatch(r"(bx|dx), (0x[0-9a-f]+)", i.op_str) if i.mnemonic == "mov" else None
        if m and m.group(1) not in args:
            v = int(m.group(2), 16)
            args[m.group(1)] = {"is_fac": True, "ds_offset": "0x00b2", "note": "floating accumulator = value of the preceding expression"} if v == 0xb2 else ds_value(b, v)
        if len(args) == 2:
            break
    return args


def region_of(b, addr):
    for r in b.regions:
        if r["start"] <= addr < r["end"]:
            return {"id": r["id"], "purpose": r["purpose"]}
    return None


def summarise_sound(b, w, k):
    """Frequency and duration of one SOUND statement, from the statement's own instructions.

    Calling convention (read from the runtime routine): BX = frequency in Hz (integer, >= 37), DX = pointer to a
    single-precision duration in BIOS ticks (the routine multiplies it by 32 -> timer ticks). DX = 0x00B2 is the
    floating accumulator, i.e. the value of the expression evaluated just before.
    """
    calls_after_bx = None
    bx_imm = dx_ptr = None
    for pos, i in enumerate(w):
        m = re.fullmatch(r"bx, (0x[0-9a-f]+)", i.op_str) if i.mnemonic == "mov" else None
        if m:
            bx_imm, calls_after_bx = int(m.group(1), 16), 0
        m = re.fullmatch(r"dx, (0x[0-9a-f]+)", i.op_str) if i.mnemonic == "mov" else None
        if m:
            dx_ptr = int(m.group(1), 16)
        if i.mnemonic == "lcall" and calls_after_bx is not None:
            calls_after_bx += 1
    freq_const = bx_imm is not None and calls_after_bx == 0 and 37 <= bx_imm <= 32767
    out = {"frequency_hz": bx_imm if freq_const else None,
           "frequency_source": "constant" if freq_const else "computed (variable/expression; not a constant)"}
    lo, hi = 0x2000, b.img.data_txt[0] - b.img.base
    if not hasattr(b, "_pool_num_offsets"):
        b._pool_num_offsets = {o for o, _ in x.sdt.pool_numbers(b.img)}
    if dx_ptr is None:
        out["duration"] = {"kind": "unknown"}
    elif dx_ptr == 0xb2:
        expr = [describe(b, i) for i in w if i.mnemonic in ("mov", "lcall")][:3]
        out["duration"] = {"kind": "expression_result", "note": "FAC (ds:0x00b2) holds the value of the expression evaluated "
                           "just before; typical preceding statement: constant 3.0 combined with the variable at ds:0x%04x "
                           "through runtime routine %s" % (
                               next((int(re.search(r"si, (0x[0-9a-f]+)", describe(b, i)).group(1), 16) for i in w
                                     if i.mnemonic == "mov" and i.op_str.startswith("si,")), 0), next(
                               (describe(b, i).split()[-1] for i in w if i.mnemonic == "lcall"), "?"))}
    elif lo <= dx_ptr < hi and (b.img.base + dx_ptr) in b._pool_num_offsets:
        v = mbf4(b.d[b.img.base + dx_ptr:b.img.base + dx_ptr + 4])
        out["duration"] = {"kind": "constant", "ds_offset": f"0x{dx_ptr:04x}", "bios_ticks": v,
                           "seconds": round(v / 18.2065, 4), "stop_sound": bool(v == 0 and freq_const and bx_imm == 37)}
    else:
        out["duration"] = {"kind": "variable", "ds_offset": f"0x{dx_ptr:04x}",
                           "note": "program variable (not a numeric literal in the constant pool); initial value not recoverable statically"}
    return out


def call_sites(b, target, sound=False):
    out = []
    ins = b.program_ins
    for k, i in enumerate(ins):
        if i.mnemonic == "lcall":
            s = int.from_bytes(i.bytes[3:5], "little") + x.GHIDRA_BASE_SEG
            o = int.from_bytes(i.bytes[1:3], "little")
            if b.fo(s, o) == target:
                w = statement_window(b, k)
                entry = {"site_file_offset": i.address, "region": region_of(b, i.address)}
                if sound:
                    entry.update(summarise_sound(b, w, k))
                entry["statement_instructions"] = [describe(b, j) for j in w]
                if not sound:
                    entry["constants"] = constants_of(b, w)
                out.append(entry)
    return out


def statements_around(b, lo_addr, hi_addr, pad=120):
    """INT3-delimited statements of the program body between two addresses, each summarised compactly."""
    ins = b.program_ins
    idx = [k for k, i in enumerate(ins) if lo_addr <= i.address <= hi_addr]
    a, z = max(0, idx[0] - pad), min(len(ins), idx[-1] + pad)
    out, cur = [], []
    for i in ins[a:z]:
        if i.mnemonic == "int3":
            if cur:
                out.append(cur)
            cur = []
        else:
            cur.append(i)
    if cur:
        out.append(cur)
    res = []
    for st in out:
        parts = []
        for i in st:
            if i.mnemonic == "lcall":
                n = f"{int.from_bytes(i.bytes[3:5], 'little') + x.GHIDRA_BASE_SEG:04x}_{int.from_bytes(i.bytes[1:3], 'little'):04x}"
                parts.append(f"CALL {n}")
            else:
                s = f"{i.mnemonic} {i.op_str}"
                for hv in re.findall(r"0x[0-9a-f]+", i.op_str):
                    t = b.desc_text.get(int(hv, 16))
                    if t is not None and i.mnemonic in ("mov", "push", "lea"):
                        s += f" ;STR {t!r}"
                parts.append(s)
        res.append({"at": f"0x{st[0].address:x}", "code": parts})
    return res


def morse_window(b):
    sites = []
    for r in x.mx.literal_refs(b.d, b.hdr, b.pool[0], b.pool):
        if re.fullmatch(r"B\d+P\d+(?:B\d+P\d+)*", r["text"]):
            sites.append(r["site"])
    if not sites:
        return []
    return statements_around(b, min(sites), max(sites))


def store_runs(b, min_run=12):
    """Runs of consecutive INT3-delimited statements that each store an immediate into memory
    (a table initialised by assignments, e.g. A%(1)=3)."""
    ins = b.program_ins
    stmts, cur = [], []
    for i in ins:
        if i.mnemonic == "int3":
            if cur:
                stmts.append(cur)
            cur = []
        else:
            cur.append(i)
    runs, run = [], []
    for st in stmts:
        stores = [i for i in st if i.mnemonic == "mov" and re.fullmatch(r"(?:word|byte) ptr \[[^\]]+\], 0x[0-9a-f]+", i.op_str)]
        if stores and len(st) <= 14:
            run.append((st[0].address, [i.op_str.split(", ")[-1] for i in stores], [i.op_str.split(",")[0] for i in stores]))
        else:
            if len(run) >= min_run:
                runs.append(run)
            run = []
    if len(run) >= min_run:
        runs.append(run)
    return [{"first": f"0x{r[0][0]:x}", "statements": len(r), "targets": r[0][2], "values": [v for _, vals, _ in r for v in vals]} for r in runs]


def parse_play(s):
    """Decode a PLAY string into events with durations (whole note = 240/tempo seconds)."""
    tempo, length, octave, events = 120, 4, 4, []
    for m in re.finditer(r"M([BFLNS])|T(\d+)|O(\d+)|L(\d+)|([A-G])([#+\-]?)(\d*)(\.?)|P(\d+)(\.?)", s):
        if m.group(1):
            events.append({"op": "mode", "value": m.group(1)})
        elif m.group(2):
            tempo = int(m.group(2))
            events.append({"op": "tempo", "value": tempo})
        elif m.group(3):
            octave = int(m.group(3))
            events.append({"op": "octave", "value": octave})
        elif m.group(4):
            length = int(m.group(4))
            events.append({"op": "length", "value": length})
        elif m.group(5):
            n = int(m.group(7)) if m.group(7) else length
            dur = 240 / (tempo * n) * (1.5 if m.group(8) else 1)
            events.append({"op": "note", "note": m.group(5) + (m.group(6) or ""), "octave": octave, "length": n,
                           "tempo": tempo, "seconds": round(dur, 5)})
        elif m.group(9):
            n = int(m.group(9))
            events.append({"op": "rest", "length": n, "tempo": tempo,
                           "seconds": round(240 / (tempo * n) * (1.5 if m.group(10) else 1), 5)})
    return events


def morse_section(result):
    """Morse generator of Gato1.exe, decoded from the code slice (decode_gato1_slice.py)."""
    import decode_gato1_slice as dg
    r, tone_of, letters = dg.build_morse()
    play = {p["play"]: p for p in result["play"]["Gato1.exe"]["strings"]}
    tones = {}
    for off, name in sorted(tone_of.items()):
        p = play[name]
        tones[f"0x{off:04x}"] = {"program_offset": f"0x{off:04x}", "file_offset": f"0x{dg.PROGRAM_BASE + off:05x}",
                                 "play_string": name, "morse": dg.TONE_PATTERN[name], "total_seconds": p["total_seconds"],
                                 "events": p["events"]}
    dit, dah = play["B32P62"]["events"], play["B10P62"]["events"]
    return {
        "table_found": True,
        "source": "Gato1.exe, ON v GOSUB dispatcher at file 0xbe4a, branch bodies 0xc1cd-0xc5d4, tone subroutines 0xc5d5-0xc610",
        "verification": f"all {len(letters)} branches decoded; {sum(v['matches_itu'] for v in letters.values())} of {len(letters)} "
                        "equal International Morse (A-Z, 0-9)",
        "letters": {k: {"pattern": v["pattern"], "play_strings": v["play_strings"], "gosub_targets": v["gosubs"],
                        "branch_file_offset": v["branch_file_offset"], "index": v["index"]} for k, v in letters.items()},
        "tone_subroutines": tones,
        "timing": {
            "dit_tone_seconds": dit[0]["seconds"], "dit_rest_seconds": dit[1]["seconds"],
            "dah_tone_seconds": dah[0]["seconds"], "dah_rest_seconds": dah[1]["seconds"],
            "dah_to_dit_ratio_tone_only": round(dah[0]["seconds"] / dit[0]["seconds"], 2),
            "dah_to_dit_ratio_with_rest": round(play["B10P62"]["total_seconds"] / play["B32P62"]["total_seconds"], 2),
            "note": "seconds from the standard PLAY rule at default tempo 120 (see play_duration_rule); the runtime's staccato/legato "
                    "handling (MN/ML/MS) was not decoded, so real tone lengths can be up to 1/8 shorter. The PLAYs are foreground "
                    "(no MB prefix), so each element blocks the program until finished. There is no extra letter or word gap: "
                    "characters are sounded back to back, spaces and punctuation are silent.",
            "pitch": "no octave command: the runtime default octave 4 applies, note B (about 494 Hz); inferred from the PLAY "
                     "syntax, the frequency table of the runtime was not extracted",
        },
        "text_to_morse": [
            "Subroutine at Gato1 0xbc00-0xbe97 prints one order line (L$, ds:0x2372, read with LINE INPUT #1 from ORDXXn) one character at a time.",
            "v = ASC(LEFT$(L$,1)) - 64 (stored in ds:0x224e): A-Z give 1-26.",
            "If the DIFFICULTY LEVEL (ds:0x2256, GAME CONTROL [1], 0..9) is below 8 the character is PRINTed; otherwise a FOR 1 TO 340 "
            "delay loop runs instead, so at difficulty 8 and 9 the orders can only be copied from the Morse (resolved in loader_verification.md section 8).",
            "L$ is shortened by one character; INKEY$ is polled and any key does SOUND 37,0 and abandons the rest of the orders.",
            "Digits ('0'-'9' give -16..-7) are accepted only when the SOUND setting ds:0x9e2 = 1 and become v + 43 = 27..36; letters "
            "(1 <= v <= 26) require ds:0x9e2 <> 0 (it is GAME CONTROL [2] SOUND, 1 = on; the same variable scales every SOUND duration); "
            "every other character is skipped.",
            "If L$ is now empty the next line is read, so the last character of each line is printed but not sounded.",
            "Otherwise ON v GOSUB (runtime 199b:1def, 36 entries) calls the letter's branch; it GOSUBs the dit/dah subroutines "
            "and RETURNs to 0xbe98, which loops to the next character.",
            "Each element subroutine is a single PLAY of one of the four strings; the two-element strings (dit-dah, dah-dit) are "
            "used as shortcuts for A, N and adjacent element pairs.",
        ],
        "demo_exe": "DEMO.EXE contains no PLAY statement and no equivalent dispatcher; its DEMORD text is shown silently "
                    "(its SOUND calls are effects, not Morse).",
        "unused_play_strings": {"MBT40O4L64B-": "0xd310, short blip, background mode", "MBT100L9B": "0xd319, longer blip, background mode; "
                                "both are sounded in region 64, just before the LOG1 record is written, and are not part of the Morse code"},
        "reference_ITU_table": dict(MORSE),
    }


def main():
    bins = {}
    for key, exe in x.BINS:
        b = x.analyze(x.Binary(key, exe))
        x.region_recovery(b)
        bins[exe] = b

    result = {"_about": "PC speaker data of GATO. frequency_hz = 1193180 / divisor; duration unit = 1/582.6 s "
                        "(32 units per 18.2 Hz BIOS tick).", "runtime": {}, "sound_statement": {}, "play": {}}
    for exe, b in bins.items():
        result["runtime"][exe] = {**runtime_facts(b), "note_divisor_tables": note_tables(b)}

    for exe in ("Gato1.exe", "DEMO.EXE"):
        b = bins[exe]
        cnt, sound = find_targets(b)
        entry = {"sound_routine_file_offset": sound[0] if sound else None, "call_sites": []}
        if sound:
            entry["sound_routine_ghidra_name"] = b.by_file.get(sound[0])
            entry["call_sites"] = call_sites(b, sound[0], sound=True)
        result["sound_statement"][exe] = entry
        refs = ie.find_literal_pool(b.d, b.h)
        pl = {"strings": [], "routine_file_offset": None, "call_sites": []}
        lr = x.mx.literal_refs(b.d, b.hdr, b.pool[0], b.pool)
        seeds = [r for r in lr if re.fullmatch(r"M[BFLNS]T\d+[A-Z0-9<>.#+\-]*", r["text"])]
        if seeds:
            tgt = Counter(r["callee"] for r in seeds).most_common(1)[0][0]
            pl["routine_file_offset"] = tgt
            pl["routine_ghidra_name"] = b.by_file.get(tgt)
            pl["routine_evidence"] = ("the routine's dispatch table compares the command letter with 'A'..'G' and its "
                                      "handlers range-check octave (<7), tempo (>=32) and length (<=64): PLAY command parser")
            pl["call_sites"] = call_sites(b, tgt)
            seen = set()
            for r in sorted((r for r in lr if r["callee"] == tgt), key=lambda r: r["site"]):
                if r["text"] in seen:
                    continue
                seen.add(r["text"])
                ev = parse_play(r["text"])
                pl["strings"].append({"play": r["text"], "load_site_file_offset": r["site"], "events": ev,
                                      "total_seconds": round(sum(e.get("seconds", 0) for e in ev), 5)})
        result["play"][exe] = pl

    morse_sites = [s for s in result["play"]["Gato1.exe"]["call_sites"] if s["constants"] and re.fullmatch(r"B\d+P\d+(B\d+P\d+)*", s["constants"][0].get("string", ""))]
    result["play_duration_rule"] = {"whole_note_seconds": "240 / tempo", "note_seconds": "240 / (tempo * length)",
                                    "defaults": {"tempo": 120, "length": 4, "octave": 4},
                                    "certainty": "standard BASIC PLAY rule; defaults assumed from the BASIC manual, not decoded from "
                                                 "the runtime (the runtime stores tempo/length/octave at ds:0x8c/0x8d/0x8b)"}
    result["morse"] = morse_section(result)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(ps.dump_json(result, width=140) + "\n", encoding="utf-8")
    for exe in ("Gato1.exe", "DEMO.EXE"):
        print(exe, "SOUND sites:", len(result["sound_statement"][exe]["call_sites"]),
              "PLAY sites:", len(result["play"][exe]["call_sites"]))
    print(f"Wrote {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    sys.exit(main())
