"""Annotated disassembly helper for the compiled BASIC program bodies.

Usage:  python analysis/trace_tools.py <Gato1|DEMO|Gato|History> <start-hex> <end-hex>

Prints the instructions in the file-offset range with:
  * far calls shown as runtime routine names (seg_off)
  * BASIC string-literal descriptors resolved to their text
  * data-segment offsets resolved to the MBF value stored there (shown as 'mbf=') or the 16-bit integer ('w=')
INT3 statement markers are hidden.
"""
import re
import sys

import index_functions as x

KEYS = {"Gato1": "Gato1.exe", "DEMO": "DEMO.EXE", "Gato": "Gato.exe", "History": "History.exe"}


def load(key):
    return x.analyze(x.Binary(key, KEYS[key]))


def annotator(b):
    base = b.img.base

    def ann(i):
        s = f"{i.address:05x} {i.mnemonic} {i.op_str}"
        if i.mnemonic == "lcall":
            n = f"{int.from_bytes(i.bytes[3:5], 'little') + 0x1000:04x}_{int.from_bytes(i.bytes[1:3], 'little'):04x}"
            return f"{i.address:05x} CALL {n}"
        if i.mnemonic in ("mov", "push", "lea", "cmp", "add", "sub"):
            for hv in re.findall(r"0x[0-9a-f]+", i.op_str):
                v = int(hv, 16)
                if v in b.desc_text:
                    s += f"   ; STR {b.desc_text[v]!r}"
                elif 0x100 < v < b.img.hi - base and "[" not in i.op_str and "," in i.op_str:
                    q = b.d[base + v:base + v + 4]
                    s += f"   ; ds:{v:#x} w={int.from_bytes(q[:2], 'little')} mbf={x.sdt.mbf4(q):.6g}"
        return s

    return ann


def main(argv):
    b = load(argv[0])
    ann = annotator(b)
    a, e = int(argv[1], 16), int(argv[2], 16)
    for i in b.program_ins:
        if a <= i.address < e and i.mnemonic != "int3":
            print(ann(i))


if __name__ == "__main__":
    main(sys.argv[1:])
