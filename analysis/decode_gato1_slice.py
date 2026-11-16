#!/usr/bin/env python3
"""Decode the Morse dispatcher and the COURXX loader tail from analysis/gato1_pcode_slice.txt.

The slice is a hex dump of Gato1.exe file offsets 0xbc00-0xc650 (compiled BASIC code).  Only the slice is read.

Compiled-BASIC conventions used here (established from the surrounding code, see loader_verification.md):
* ``cc``                      statement marker (INT 3)
* ``9a LO HI 9b 09``          far call into the runtime segment (offset LO|HI << 8)
* runtime 1def                ON v GOTO: inline ``count`` byte followed by ``count`` 16-bit program offsets
* runtime 1d9f + 2 bytes      GOSUB to the inline 16-bit program offset
* runtime 1dc8                RETURN
* program offset p            lives at file offset 0x3a00 + p (verified: the dispatcher's table targets land on ``cc`` markers)
"""

import json
import re
import struct
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
SLICE = HERE / "gato1_pcode_slice.txt"
PROGRAM_BASE = 0x3A00
CALL = lambda off: bytes([0x9A, off & 0xFF, off >> 8, 0x9B, 0x09])
ON_GOTO, GOSUB, RETURN, PLAY = CALL(0x1DEF), CALL(0x1D9F), CALL(0x1DC8), CALL(0x2D74)
ITU = {"A": ".-", "B": "-...", "C": "-.-.", "D": "-..", "E": ".", "F": "..-.", "G": "--.", "H": "....", "I": "..",
       "J": ".---", "K": "-.-", "L": ".-..", "M": "--", "N": "-.", "O": "---", "P": ".--.", "Q": "--.-", "R": ".-.",
       "S": "...", "T": "-", "U": "..-", "V": "...-", "W": ".--", "X": "-..-", "Y": "-.--", "Z": "--..",
       "0": "-----", "1": ".----", "2": "..---", "3": "...--", "4": "....-", "5": ".....", "6": "-....",
       "7": "--...", "8": "---..", "9": "----."}


def load_slice():
    mem = {}
    for line in SLICE.read_text().splitlines():
        m = re.match(r"([0-9a-f]{4}):((?: [0-9a-f]{2})+)", line.strip().replace(": ", ": ", 1) if ": " in line else line)
        if not m:
            continue
        base = int(m.group(1), 16)
        for i, tok in enumerate(m.group(2).split()):
            mem[base + i] = int(tok, 16)
    lo, hi = min(mem), max(mem)
    return lo, bytes(mem[i] for i in range(lo, hi + 1))


def main():
    lo, data = load_slice()
    at = lambda f, n: data[f - lo:f - lo + n]

    start = data.index(ON_GOTO) + lo
    count = at(start + 5, 1)[0]
    table = list(struct.unpack(f"<{count}H", at(start + 6, 2 * count)))
    table_end = start + 6 + 2 * count

    # the four tone subroutines: cc, mov bx,<descriptor>, PLAY, cc, RETURN (15 bytes each)
    tones = {}
    for m in re.finditer(rb"\xcc\xbb(..)" + re.escape(PLAY) + b"\xcc" + re.escape(RETURN), data):
        f = lo + m.start()
        tones[f - PROGRAM_BASE] = {"file_offset": f, "string_descriptor": struct.unpack("<H", m.group(1))[0]}

    letters = {}
    symbols = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    for idx, target in enumerate(table, 1):
        f = PROGRAM_BASE + target
        body, pos, calls = [], f, []
        while True:
            assert at(pos, 1) == b"\xcc", f"no statement marker at {pos:#x}"
            pos += 1
            if at(pos, 5) == GOSUB:
                calls.append(struct.unpack("<H", at(pos + 5, 2))[0])
                pos += 7
            elif at(pos, 5) == RETURN:
                pos += 5
                break
            else:
                raise ValueError(f"unexpected statement at {pos:#x}: {at(pos, 8).hex(' ')}")
        letters[symbols[idx - 1]] = {"index": idx, "target_program_offset": target, "target_file_offset": f,
                                     "end_file_offset": pos, "gosub_targets": calls}
    return {"table_file_offset": start, "count": count, "table": table, "table_end": table_end,
            "tones": tones, "letters": letters}


TONE_STRINGS = {0x31DA: "B32P62", 0x31E4: "B10P62", 0x31EE: "B32P62B10P62", 0x31FE: "B10P62B32P62"}
TONE_PATTERN = {"B32P62": ".", "B10P62": "-", "B32P62B10P62": ".-", "B10P62B32P62": "-."}


def build_morse():
    """Letter table with the dot/dash pattern each GOSUB sequence plays, checked against International Morse."""
    r = main()
    tone_of = {off: TONE_STRINGS[t["string_descriptor"]] for off, t in r["tones"].items()}
    out = {}
    for sym, v in r["letters"].items():
        pattern = "".join(TONE_PATTERN[tone_of[c]] for c in v["gosub_targets"])
        out[sym] = {"pattern": pattern, "matches_itu": pattern == ITU[sym], "index": v["index"],
                    "branch_program_offset": f"0x{v['target_program_offset']:04x}",
                    "branch_file_offset": f"0x{v['target_file_offset']:05x}",
                    "gosubs": [f"0x{c:04x}" for c in v["gosub_targets"]],
                    "play_strings": [tone_of[c] for c in v["gosub_targets"]]}
    return r, tone_of, out


if __name__ == "__main__":
    r, tone_of, letters = build_morse()
    print("ON GOTO count", r["count"], "table at", hex(r["table_file_offset"]))
    print({hex(k): v for k, v in tone_of.items()})
    bad = [k for k, v in letters.items() if not v["matches_itu"]]
    print("letters", len(letters), "non-ITU:", bad)
    for k, v in letters.items():
        print(k, v["pattern"], v["branch_file_offset"])
