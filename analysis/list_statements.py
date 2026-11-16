#!/usr/bin/env python3
"""List the compiled BASIC program body of an EXE one statement per line (statements are separated by INT3 markers).

Usage:  python list_statements.py Gato1|DEMO      -> writes analysis/<name>_statements.txt

* ``9a lo hi 9b 09`` far calls are shown by runtime routine name (RT table below; unknown routines are ``rt_XXXX``).
* Inline operands that follow some runtime calls are decoded: ON..GOSUB table (1def), GOSUB target (1d9f), INPUT item
  list (2fba).  Other inline operands may still appear as garbage instructions.
* Data-segment operands are shown as ``v<hex>`` (variable) or, when the bytes there decode as a plain number, ``v<hex>=<value>``.
* Jump targets are printed as file offsets; program offset = file offset - 0x3a00 (Gato1) / - 0x261a + 0x1a (DEMO).
"""
import re
import struct
import sys
from pathlib import Path

import capstone

import index_functions as x
import scan_data_tables as sdt

HERE = Path(__file__).resolve().parent
KEYS = {"Gato1": "Gato1.exe", "DEMO": "DEMO.EXE"}
md = capstone.Cs(capstone.CS_ARCH_X86, capstone.CS_MODE_16)
md.detail = False

# Routine names identified from their use (single-precision values live in memory, FAC = floating accumulator)
RT = {
    0x000b: "POPSUB", 0x000e: "SUBF", 0x0011: "SUB(si-di)", 0x001b: "ADDF", 0x0020: "POPADD", 0x0023: "ADDF2",
    0x0026: "ADD", 0x0153: "MULF", 0x0158: "POPMUL", 0x015b: "MULF2", 0x015e: "MUL", 0x01d3: "DIVF", 0x01d8: "POPDIV",
    0x01db: "DIVF2", 0x01de: "DIV(si/di)",
    0x12fd: "STORE", 0x1300: "ASSIGN", 0x1317: "LOADF", 0x132b: "PUSHF", 0x1ad3: "CMP(si,di)", 0x1ac8: "CMPF", 0x1acd: "POPCMP",
    0x1ad0: "CMPF2", 0x13d4: "CMP0", 0x2047: "INT", 0x03b6: "OPEN", 0x0321: "CLOSE", 0x2caf: "INPUT#", 0x2fba: "INPUTCONV",
    0x3081: "STORESNG", 0x1dc8: "RETURN", 0x1d9f: "GOSUB", 0x1def: "ON-GOSUB", 0x2d74: "PLAY", 0x0c25: "SOUND",
    0x11f2: "CONCAT", 0x122c: "STRCMP", 0x2237: "LEFT$", 0x2240: "RIGHT$", 0x214e: "LEN", 0x2155: "ASC", 0x11bc: "STRSET",
    0x39ba: "PRINT_BEGIN", 0x363b: "PRINT_STR", 0x364f: "PRINT_STRNL", 0x1fff: "CSNG", 0x2169: "INKEY$",
    0x2ab2: "LINE?", 0x37c4: "COS", 0x37df: "SIN", 0x2f2e: "ATN", 0x1468: "FIXs", 0x2092: "CINTF", 0x13ac: "SGNs",
    0x13b2: "SGNF", 0x1eab: "POW", 0x1ea0: "POWF", 0x1e27: "SQR", 0x2afa: "RND", 0x140b: "ABSs", 0x140e: "ABSF",
    0x139a: "NEGs", 0x139d: "NEGF", 0x141d: "SHIFTs", 0x1420: "SHIFTF", 0x13e6: "CMPz",
}

# runtime routines followed by one inline operand byte (found with inline_operands.py: constant byte after every call)
INLINE1 = {0x000B, 0x0020, 0x0158, 0x01D8, 0x132B, 0x141D, 0x1420, 0x2C63, 0x1ACD}


class Lister:
    def __init__(self, key):
        self.key = key
        self.b = x.analyze(x.Binary(key, KEYS[key]))
        self.d = self.b.d
        self.base = self.b.img.base
        self.prog_base = self.b.hdr + 0x1A - 0x1A  # program code starts at the header end + entry offset
        self.rt_lo = None
        self.const_lo = {"Gato1": 0x23D0, "DEMO": 0x2290}[key]

    def dsname(self, v):
        if v in self.b.desc_text:
            return repr(self.b.desc_text[v])
        if 0x100 <= v < 0x4000:
            q = self.d[self.base + v:self.base + v + 4]
            if len(q) == 4:
                val = sdt.mbf4(q)
                if v >= self.const_lo and (val == 0 or 1e-9 <= abs(val) <= 1e9):
                    return f"v{v:04x}={val:.7g}"
                if val == 0 or (1e-4 <= abs(val) <= 1e8 and abs(val - round(val, 3)) < 1e-9 * max(1, abs(val))):
                    return f"v{v:04x}={val:g}"
        return f"v{v:04x}"

    def render(self, ins):
        s = f"{ins.mnemonic} {ins.op_str}".strip()
        if ins.mnemonic in ("mov", "add", "sub", "cmp", "push", "lea"):
            def rep(m):
                v = int(m.group(0), 16)
                return self.dsname(v) if 0x100 <= v < 0x4000 and "[" not in ins.op_str else m.group(0)
            s = re.sub(r"0x[0-9a-f]+", rep, s)
        return s

    def statements(self):
        d, pos, end = self.d, self.b.prog_lo, self.b.prog_hi
        out, cur, start = [], [], pos
        while pos < end:
            if d[pos] == 0xCC:
                if cur:
                    out.append((start, "; ".join(cur)))
                cur, start = [], pos + 1
                pos += 1
                continue
            if d[pos] == 0x9A and pos + 5 <= end and d[pos + 3] == 0x9B and d[pos + 4] == 0x09:
                off = struct.unpack_from("<H", d, pos + 1)[0]
                name = RT.get(off, f"rt_{off:04x}")
                pos += 5
                if off == 0x1DEF:
                    n = d[pos]
                    tab = struct.unpack_from(f"<{n}H", d, pos + 1)
                    name += f"[{n}:" + ",".join(f"{0x3a00 + t:x}" for t in tab) + "]"
                    pos += 1 + 2 * n
                elif off == 0x1D9F:
                    name += f" ->{0x3a00 + struct.unpack_from('<H', d, pos)[0]:x}"
                    pos += 2
                elif off in INLINE1:
                    name += f"<{d[pos]:02x}>"
                    pos += 1
                elif off == 0x2FBA:
                    n = d[pos]
                    name += f"[{n}:" + ",".join(str(t) for t in d[pos + 1:pos + 1 + n]) + "]"
                    pos += 1 + n
                cur.append(name)
                continue
            got = list(md.disasm(d[pos:pos + 16], pos, 1))
            if not got:
                cur.append(f"db {d[pos]:02x}")
                pos += 1
                continue
            ins = got[0]
            txt = self.render(ins)
            if ins.mnemonic.startswith("j") or ins.mnemonic == "loop":
                m = re.search(r"0x([0-9a-f]+)", ins.op_str)
                if m:
                    txt = f"{ins.mnemonic} @{m.group(1)}"
            cur.append(txt)
            pos += ins.size
        if cur:
            out.append((start, "; ".join(cur)))
        return out


def main(key):
    lst = Lister(key)
    st = lst.statements()
    path = HERE / f"{key.lower()}_statements.txt"
    with path.open("w", encoding="utf-8") as f:
        for off, txt in st:
            f.write(f"{off:05x} {txt}\n")
    print(f"{key}: {len(st)} statements -> {path.name}")


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "Gato1")
