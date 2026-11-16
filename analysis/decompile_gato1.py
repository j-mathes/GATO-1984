#!/usr/bin/env python3
"""Symbolic decompiler for the compiled BASIC program body of Gato1.exe -> analysis/gato1_basic.txt

It walks the same statement stream as list_statements.py and abstractly executes the x86 glue code, turning
floating-point runtime calls into infix expressions (``v2156 = v2156 + v2196 * COS(v219a)``) and compares into
``IF`` lines.  Anything it cannot model is printed as the raw instruction (prefixed ``?``).

Conventions established from the runtime (see loader_verification.md section 8):
  FAC = 0xb2 floating accumulator; 12fd STORE FAC->[di]; 1300 ASSIGN [si]->[di]; 1317 LOAD FAC<-[si]
  0026 [di]+[si]; 001b [di]+FAC; 0011 [si]-[di]; 000e [si]-FAC; 015e [si]*[di]; 0153 FAC*[di]; 015b [si]*FAC
  01de [si]/[di]; 01d3 FAC/[di]; 01db [si]/FAC; 132b pushes FAC; 0158/0020/000b/01d8/1acd use the pushed value as [si]
  1ad3 compares [si] with [di] (ja: si > di); 37c4 = COS, 37df = SIN, 2f2e = ATN; 2047 = INT (to integer register)
"""
import re
import struct
import sys
from pathlib import Path

import capstone

import list_statements as ls

HERE = Path(__file__).resolve().parent
md = capstone.Cs(capstone.CS_ARCH_X86, capstone.CS_MODE_16)
FAC = ("fac",)
COND = {"ja": ">", "jb": "<", "jae": ">=", "jbe": "<=", "je": "=", "jne": "<>", "jg": ">", "jl": "<", "jge": ">=", "jle": "<="}
NEG = {">": "<=", "<": ">=", ">=": "<", "<=": ">", "=": "<>", "<>": "="}
RT = {v: k for k, v in ls.RT.items()}


class Sym:
    def __init__(self, lst):
        self.l = lst
        self.d = lst.d
        self.base = lst.base

    # --- values -------------------------------------------------------------------------------------------------
    def name(self, off):
        n = self.l.dsname(off)
        return n

    def ptr_expr(self, v):
        if v == FAC:
            return "FAC"
        if v[0] == "ptr":
            return self.name(v[1])
        if v[0] == "elem":
            return f"A{v[1]:04x}[{v[2]}]"
        if v[0] == "imm":
            return str(v[1])
        if v[0] == "int":
            return v[1]
        return f"<{v}>"

    def ival(self, v):
        if v[0] == "imm":
            return str(v[1] if v[1] < 0x8000 else v[1] - 0x10000)
        if v[0] == "int":
            return v[1]
        if v[0] == "ptr":
            return str(v[1])
        if v[0] == "x4":
            return f"4*{v[1]}"
        if v[0] == "str":
            return repr(v[1])
        return str(v)

    def sval(self, v):
        return repr(v[1]) if v[0] == "str" else self.fmt(v)

    def fmt(self, v):
        if v == FAC:
            return "FAC"
        if v[0] in ("ptr", "elem"):
            return self.ptr_expr(v)
        return self.ival(v)

    def run(self, items):
        """items: list of ('ins', capstone ins) / ('call', name, off_or_extra)."""
        r = {k: ("imm", 0) for k in ("ax", "bx", "cx", "dx", "si", "di")}
        out, stack, flags, fac = [], [], None, "?"
        pend = None   # materialised boolean pending register

        def deref(v):
            if v == FAC:
                return fac
            if v[0] == "ptr":
                return self.name(v[1])
            if v[0] == "elem":
                return f"A{v[1]:04x}[{v[2]}]"
            if v[0] == "imm":
                return str(v[1])
            return f"<{v}>"

        i = 0
        while i < len(items):
            it = items[i]
            if it[0] == "call":
                _, name, extra, off = it
                n = name.split("[")[0].split("<")[0]
                if n.startswith("GOSUB->"):
                    n = "GOSUB"
                if n in ("STORE",):
                    out.append(f"{deref(r['di'])} = {fac}")
                elif n == "ASSIGN":
                    out.append(f"{deref(r['di'])} = {deref(r['si'])}")
                elif n == "LOADF":
                    fac = deref(r["si"])
                elif n == "ADD":
                    fac = f"({deref(r['di'])} + {deref(r['si'])})"
                elif n == "ADDF":
                    fac = f"({deref(r['di'])} + {fac})"
                elif n == "ADDF2":
                    fac = f"({fac} + {deref(r['si'])})"
                elif n == "SUB(si-di)":
                    fac = f"({deref(r['si'])} - {deref(r['di'])})"
                elif n == "SUBF":
                    fac = f"({deref(r['si'])} - {fac})"
                elif n == "MUL":
                    fac = f"({deref(r['si'])} * {deref(r['di'])})"
                elif n == "MULF":
                    fac = f"({fac} * {deref(r['di'])})"
                elif n == "MULF2":
                    fac = f"({deref(r['si'])} * {fac})"
                elif n == "DIV(si/di)":
                    fac = f"({deref(r['si'])} / {deref(r['di'])})"
                elif n == "DIVF":
                    fac = f"({fac} / {deref(r['di'])})"
                elif n == "DIVF2":
                    fac = f"({deref(r['si'])} / {fac})"
                elif n == "PUSHF":
                    stack.append(fac)
                elif n in ("POPMUL", "POPADD", "POPSUB", "POPDIV", "POPCMP"):
                    t = stack.pop() if stack else "?tmp"
                    sym = {"POPMUL": "*", "POPADD": "+", "POPSUB": "-", "POPDIV": "/"}.get(n)
                    if n == "POPCMP":
                        flags = (t, fac)
                    else:
                        fac = f"({t} {sym} {fac})"
                elif n in ("CMP(si,di)", "CMPF", "CMPF2"):
                    a = deref(r["si"]) if n != "CMPF" else fac
                    b = deref(r["di"]) if n != "CMPF2" else fac
                    flags = (a, b)
                elif n == "CMP0":
                    flags = (deref(r["si"]), "0")
                elif n == "INT":
                    r["bx"] = ("int", f"CINT({deref(r['si'])})")
                elif n == "CSNG":
                    fac = ival_expr(self, r["bx"])
                elif n in ("COS", "SIN", "ATN", "SQR"):
                    fac = f"{n}({deref(r['bx'])})"
                elif n == "SGNs":
                    fac = f"SGN({deref(r['si'])})"
                elif n == "SGNF":
                    fac = f"SGN({fac})"
                elif n == "ABSs":
                    fac = f"ABS({deref(r['si'])})"
                elif n == "ABSF":
                    fac = f"ABS({fac})"
                elif n == "NEGs":
                    fac = f"(-{deref(r['si'])})"
                elif n == "NEGF":
                    fac = f"(-{fac})"
                elif n == "POW":
                    fac = f"({deref(r['si'])} ^ {deref(r['di'])})"
                elif n == "POWF":
                    fac = f"({fac} ^ {deref(r['di'])})"
                elif n == "RND":
                    fac = "RND"
                elif n == "CINTF":
                    r["bx"] = ("int", f"CINT({fac})")
                elif n == "FIXs":
                    fac = f"FIX({deref(r['bx'])})"
                elif n == "SHIFTs":
                    fac = f"({deref(r['si'])} * 2^{extra})"
                elif n == "SHIFTF":
                    fac = f"({fac} * 2^{extra})"
                elif n == "RETURN":
                    out.append("RETURN")
                elif n == "STRCMP":
                    flags = (self.sval(r["ax"]) if r["ax"][0] == "str" else self.fmt(r["ax"]), self.sval(r["bx"]))
                elif n == "GOSUB":
                    out.append(f"GOSUB {name.split('->')[1]}")
                elif n in ("RETURN",):
                    out.append("RETURN")
                elif n == "ON-GOSUB":
                    out.append(f"ON {self.ival(r['bx'])} GOSUB {name[name.index('['):]}")
                elif n == "SOUND":
                    out.append(f"SOUND {ival_expr(self, r['bx'])}, {deref(r['dx'])}")
                elif n == "PLAY":
                    out.append(f"PLAY {self.sval(r['bx'])}")
                else:
                    out.append(f"{n}(bx={self.fmt(r['bx'])}, dx={self.fmt(r['dx'])}, cx={self.fmt(r['cx'])}, si={self.fmt(r['si'])}, di={self.fmt(r['di'])}, fac={fac})")
                i += 1
                continue
            ins = it[1]
            m, op = ins.mnemonic, ins.op_str
            if m == "int3":
                i += 1
                continue
            parts = [p.strip() for p in op.split(",")] if op else []
            # materialised boolean: mov R,0 ; jcc L ; dec R   (L = address after dec)
            if (m == "mov" and len(parts) == 2 and parts[1] == "0" and parts[0] in r and i + 2 < len(items)
                    and items[i + 1][0] == "ins" and items[i + 1][1].mnemonic in COND
                    and items[i + 2][0] == "ins" and items[i + 2][1].mnemonic == "dec" and items[i + 2][1].op_str == parts[0]):
                jc = items[i + 1][1].mnemonic
                a, b = flags if flags else ("?", "?")
                cond = f"({a} {NEG[COND[jc]]} {b})"
                r[parts[0]] = ("bool", cond)
                i += 3
                continue
            if m == "mov" and len(parts) == 2 and parts[0] in r:
                d, s = parts
                if s in r:
                    r[d] = r[s]
                elif re.fullmatch(r"-?0x[0-9a-f]+|-?\d+", s):
                    n = int(s, 0)
                    if s.startswith("-"):
                        n &= 0xFFFF
                    r[d] = FAC if n == 0xB2 else (("ptr", n) if 0x100 <= n < 0x4000 and n != 0xB2 else ("imm", n))
                    if n in self.l.b.desc_text and d in ("bx", "dx", "ax", "cx"):
                        r[d] = ("str", self.l.b.desc_text[n])
                else:
                    r[d] = ("unk", f"[{s}]")
            elif m == "xchg" and len(parts) == 2 and parts[0] in r and parts[1] in r:
                r[parts[0]], r[parts[1]] = r[parts[1]], r[parts[0]]
            elif m == "xor" and len(parts) == 2 and parts[0] == parts[1] and parts[0] in r:
                r[parts[0]] = ("imm", 0)
            elif m in ("shl", "sal") and len(parts) == 2 and parts[0] in r and parts[1] == "1":
                v = r[parts[0]]
                if v[0] == "x4":
                    r[parts[0]] = v
                elif v[0] == "x2":
                    r[parts[0]] = ("x4", v[1])
                else:
                    r[parts[0]] = ("x2", self.ival(v))
            elif m == "add" and len(parts) == 2 and parts[0] in r:
                a = r[parts[0]]
                s = r.get(parts[1])
                if s is None and re.fullmatch(r"-?0x[0-9a-f]+|-?\d+", parts[1]):
                    n = int(parts[1], 0)
                    if a[0] == "x4":
                        r[parts[0]] = ("elem", n & 0xFFFF, a[1])
                    elif a[0] == "ptr":
                        r[parts[0]] = ("ptr", (a[1] + n) & 0xFFFF)
                    elif a[0] == "elem":
                        r[parts[0]] = ("elem", (a[1] + n) & 0xFFFF, a[2])
                    else:
                        r[parts[0]] = ("int", f"({self.ival(a)} + {n})")
                elif s is not None:
                    if a[0] == "x4" and s[0] == "ptr":
                        r[parts[0]] = ("elem", s[1], a[1])
                    elif s[0] == "x4" and a[0] == "ptr":
                        r[parts[0]] = ("elem", a[1], s[1])
                    else:
                        r[parts[0]] = ("int", f"({self.ival(a)} + {self.ival(s)})")
                else:
                    out.append(f"? {m} {op}")
            elif m == "imul" and len(parts) == 1 and parts[0] in r:
                r["ax"] = ("int", f"({self.ival(r['ax'])} * {self.ival(r[parts[0]])})")
            elif m == "sub" and len(parts) == 2 and parts[0] in r and parts[1] in r:
                r[parts[0]] = ("int", f"({self.ival(r[parts[0]])} - {self.ival(r[parts[1]])})")
            elif m == "dec" and parts and parts[0] in r:
                r[parts[0]] = ("int", f"({self.ival(r[parts[0]])} - 1)")
            elif m == "inc" and parts and parts[0] in r:
                r[parts[0]] = ("int", f"({self.ival(r[parts[0]])} + 1)")
            elif m in ("and", "or", "test") and len(parts) == 2 and parts[0] == parts[1] and parts[0] in r:
                v = r[parts[0]]
                flags = (v[1] if v[0] == "bool" else self.ival(v), "<>0" if v[0] == "bool" else "0")
            elif m in ("and", "or") and len(parts) == 2 and parts[0] in r and parts[1] in r:
                a, b = r[parts[0]], r[parts[1]]
                if a[0] == "bool" and b[0] == "bool":
                    r[parts[0]] = ("bool", f"({a[1]} {m.upper()} {b[1]})")
                else:
                    out.append(f"? {m} {op}")
            elif m == "cwd" or m == "cdq":
                pass
            elif m == "idiv" and parts and parts[0] in r:
                q = f"({self.ival(r['ax'])} \\ {self.ival(r[parts[0]])})"
                rem = f"({self.ival(r['ax'])} MOD {self.ival(r[parts[0]])})"
                r["ax"], r["dx"] = ("int", q), ("int", rem)
            elif m == "cmp" and len(parts) == 2 and parts[0] in r:
                b = parts[1]
                bv = r.get(b) or ("imm", int(b, 0)) if (b in r or re.fullmatch(r"-?0x[0-9a-f]+|-?\d+", b)) else ("unk", b)
                flags = (self.ival(r[parts[0]]), self.ival(bv))
            elif m in COND and len(parts) == 1:
                tgt = parts[0].replace("0x", "")
                a, b = flags if flags else ("?", "?")
                if b == "<>0":
                    # test of a materialised boolean: jne = true branch, je = false branch
                    out.append(f"IF {a} {'' if m == 'jne' else 'is FALSE '}THEN @{tgt}")
                else:
                    out.append(f"IF {a} {COND[m]} {b} THEN @{tgt}")
            elif m == "jmp":
                out.append(f"GOTO @{op.replace('0x', '')}")
            elif m == "cwd" or m == "cdq":
                pass
            else:
                out.append(f"? {m} {op}")
            i += 1
        return out


def ival_expr(sym, v):
    return sym.ival(v)


def items_for(lst):
    d, pos, end = lst.d, lst.b.prog_lo, lst.b.prog_hi
    stmts, cur, start = [], [], pos
    while pos < end:
        if d[pos] == 0xCC:
            if cur:
                stmts.append((start, cur))
            cur, start = [], pos + 1
            pos += 1
            continue
        if d[pos] == 0x9A and pos + 5 <= end and d[pos + 3] == 0x9B and d[pos + 4] == 0x09:
            off = struct.unpack_from("<H", d, pos + 1)[0]
            name = ls.RT.get(off, f"rt_{off:04x}")
            extra = None
            pos += 5
            if off == 0x1DEF:
                n = d[pos]
                tab = struct.unpack_from(f"<{n}H", d, pos + 1)
                name += "[" + ",".join(f"{0x3a00 + t:x}" for t in tab) + "]"
                pos += 1 + 2 * n
            elif off == 0x1D9F:
                name += f"->{0x3a00 + struct.unpack_from('<H', d, pos)[0]:x}"
                pos += 2
            elif off == 0x2FBA:
                n = d[pos]
                name += f"[{n}]"
                pos += 1 + n
            elif off in ls.INLINE1:
                extra = d[pos]
                pos += 1
            cur.append(("call", name, extra, pos))
            continue
        got = list(ls.md.disasm(d[pos:pos + 16], pos, 1))
        if not got:
            cur.append(("ins", type("I", (), {"mnemonic": "db", "op_str": f"{d[pos]:02x}", "address": pos})()))
            pos += 1
            continue
        cur.append(("ins", got[0]))
        pos += got[0].size
    if cur:
        stmts.append((start, cur))
    return stmts


def main():
    lst = ls.Lister("Gato1")
    sym = Sym(lst)
    path = HERE / "gato1_basic.txt"
    with path.open("w", encoding="utf-8") as f:
        for off, items in items_for(lst):
            try:
                lines = sym.run(items)
            except Exception as e:  # keep going; show the failure
                lines = [f"!! {type(e).__name__}: {e}"]
            f.write(f"{off:05x}  " + " : ".join(lines) + "\n")
    print("wrote", path.name)


if __name__ == "__main__":
    main()
