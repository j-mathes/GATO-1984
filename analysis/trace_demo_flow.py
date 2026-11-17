#!/usr/bin/env python3
"""Trace the run-time order of DEMO.EXE's narration (control flow, not file order).

DEMO.EXE is compiled BASIC; its code is not a straight script.  Statements are INT3-separated, GOSUB is the runtime call 0x1da3
followed by a 2-byte program-relative target, RETURN is 0x1dcc, GOTO and IF are x86 jumps.  list_statements.py only decodes the
runtime calls of GATO1.EXE (segment 0x099b), so for DEMO the GOSUB operands were never decoded and the narration was listed in file
order.  The file order is wrong: the program is a loop whose body is chosen by a stage variable (ds:0x2136), and the chart, map and
radar screens are reached by GOTO from the middle of the control-room page.

This script decodes the control flow and walks the program from its entry point like a debugger:

* GOSUB pushes the return address, RETURN pops it; unconditional jumps are followed (what follows one in a statement is dead code);
* the variables the program sets to constants are tracked (the stage counter, the FOR counters), so `IF stage = 1`, `FOR I = 4 TO 8`
  and the delay loops are decided exactly, not guessed;
* a comparison that depends on anything else (keys, the clock, the simulated boat) is decided by a rule: `jcc @a; jmp @b` takes `@a`
  (the compiler puts the THEN part first), a conditional that closes a loop falls through, and any loop visited more than twice is left.
  Every such decision is listed in ``Walk.assumed`` so it can be reviewed;
* the walk stops when the program restarts at the Morse example (the GOSUB to 0x06d04 a second time): the show is a loop.

Usage:  python trace_demo_flow.py      -> analysis/demo_trace.txt   (also used by export_demo_script.py)
"""
import re
import struct
from dataclasses import dataclass, field
from pathlib import Path

import list_statements as ls

HERE = Path(__file__).resolve().parent
SEG = b"\xcb\x05"
GOSUB, RETURN = 0x1DA3, 0x1DCC
PROG_TO_FILE = 0x2600  # file offset = program offset + 0x2600 (GOSUB 0x4704 = file 0x06d04)
MORSE_SUB = 0x06D04
DEAD_BRANCH = (0x06D05, 0x06DAA)  # the radio-damage texts of the Morse subroutine, which DEMO never reaches (ds:0x175e is never set)
MAX_STEPS = 3_000_000

PRINT_RE = re.compile(r"mov bx, ('(?:[^']*)'|\"(?:[^\"]*)\"); lcall 0x5cb, 0x(3587|3573)")
JUMP_RE = re.compile(r"\b(j\w+) @([0-9a-f]+)")
# `A = constant-or-variable` (runtime 0x1304 assigns the single-precision value at si to the variable at di); 0x1301 stores a computed value
ASSIGN_RE = re.compile(r"mov di, (v[0-9a-f]+); mov si, ((v[0-9a-f]+)(?:=(-?[0-9.]+))?); lcall 0x5cb, 0x1304")
STORE_RE = re.compile(r"mov di, (v[0-9a-f]+); lcall 0x5cb, 0x1301")
LOADF_RE = re.compile(r"mov si, (v[0-9a-f]+)(?:=(-?[0-9.]+))?; lcall 0x5cb, 0x131b")
# the NEXT of a FOR loop: `[I + step] ; I = ... ; IF I > limit THEN exit ELSE GOTO body` (a jump from the FOR enters past the addition)
FOR_RE = re.compile(r"(?:mov di, (v[0-9a-f]+)(?:=(-?[0-9.]+))?; mov si, (v[0-9a-f]+); lcall 0x5cb, 0x3c0; )?"
                    r"mov di, (v[0-9a-f]+); lcall 0x5cb, 0x1301; mov si, di; mov di, (v[0-9a-f]+)(?:=(-?[0-9.]+))?; lcall 0x5cb, 0x1d71; "
                    r"(j[a-z]+) @([0-9a-f]+)(?:; jmp @([0-9a-f]+))?")
# `IF si <op> di`: runtime 0x1d71 compares si with di and sets the flags for the jump that follows
CMP_RE = re.compile(r"mov di, (v[0-9a-f]+)(?:=(-?[0-9.]+))?; mov si, (v[0-9a-f]+)(?:=(-?[0-9.]+))?; lcall 0x5cb, 0x1d71; (j[a-z]+) @([0-9a-f]+)")


def holds(op, diff):
    """Whether the jump `op` is taken after comparing si with di (diff = si - di)."""
    return {"je": diff == 0, "jne": diff != 0, "ja": diff > 0, "jg": diff > 0, "jae": diff >= 0, "jge": diff >= 0,
            "jb": diff < 0, "jl": diff < 0, "jbe": diff <= 0, "jle": diff <= 0}[op]


@dataclass
class Walk:
    prints: list = field(default_factory=list)       # (file offset, text) of every text PRINT executed, in order
    events: list = field(default_factory=list)       # GOSUB / RETURN / long jumps, as text
    exact: list = field(default_factory=list)        # branches decided from known values
    assumed: list = field(default_factory=list)      # branches decided by a rule (see the module docstring)
    restart: str = ""                                # where the program started over
    steps: int = 0


def walk():
    lst = ls.Lister("DEMO")
    d = lst.d
    stmts = lst.statements()
    starts = [off for off, _ in stmts]
    end = stmts[-1][0] + 1

    gosubs = {}  # statement index -> target file offset
    returns = set()
    for i, (off, _) in enumerate(stmts):
        nxt = starts[i + 1] if i + 1 < len(starts) else end
        pos = off
        while pos + 5 <= nxt:
            if d[pos] == 0x9A and d[pos + 3:pos + 5] == SEG:
                target = struct.unpack_from("<H", d, pos + 1)[0]
                if target == GOSUB:
                    gosubs[i] = struct.unpack_from("<H", d, pos + 5)[0] + PROG_TO_FILE
                elif target == RETURN:
                    returns.add(i)
                pos += 5
            else:
                pos += 1

    texts = {}
    for i, (_, s) in enumerate(stmts):
        m = PRINT_RE.search(s)
        if m:
            texts[i] = eval(m.group(1))

    mid = [False]  # the last jump landed in the middle of a statement (a FOR loop enters its NEXT past the addition)
    fac = [None]   # the floating accumulator: the value a FOR loop's start (runtime 0x131b) loaded
    known = {}     # data-segment variable -> value, for the variables the program sets to constants

    def stmt_at(offset):
        """Index of the statement a jump to a file offset runs: the next one after an INT3 label marker, else the one containing it."""
        if d[offset] == 0xCC:
            mid[0] = False
            return next((j for j, s in enumerate(starts) if s > offset), len(starts))
        k = max((j for j, s in enumerate(starts) if s <= offset), default=0)
        mid[0] = starts[k] != offset
        return k

    def operand(token, number):
        """Value of a compare operand: a numeric constant of the constant table, or a variable whose value is known."""
        if number is not None and int(token[1:], 16) >= lst.const_lo:
            return float(number)
        return known.get(token)

    out = Walk()
    stack, visits, morse_calls = [], {}, 0
    i = 0
    while 0 <= i < len(stmts) and out.steps < MAX_STEPS:
        out.steps += 1
        off, s = stmts[i]
        visits[i] = visits.get(i, 0) + 1
        if i in texts and not DEAD_BRANCH[0] <= off < DEAD_BRANCH[1]:
            out.prints.append((off, texts[i]))
        landed_mid, mid[0] = mid[0], False
        if i in gosubs:
            out.events.append(f"{off:05x} GOSUB -> {gosubs[i]:05x}")
            if gosubs[i] == MORSE_SUB:
                morse_calls += 1
                if morse_calls == 2:
                    break
            stack.append(i + 1)
            i = stmt_at(gosubs[i])
            continue
        if i in returns:
            if not stack:
                out.events.append(f"{off:05x} RETURN with an empty stack: end")
                break
            i = stack.pop()
            out.events.append(f"{off:05x} RETURN -> {starts[i]:05x}")
            continue

        for m in LOADF_RE.finditer(s):
            fac[0] = operand(m.group(1), m.group(2))
        loop = FOR_RE.search(s)
        if loop:
            counter = loop.group(4)
            if landed_mid:
                value = fac[0]  # entered from the loop's start: the counter takes the start value
            else:
                step = operand(loop.group(1), loop.group(2)) if loop.group(1) else None
                value = known.get(counter)
                value = None if value is None or step is None else value + step
            limit = operand(loop.group(5), loop.group(6))
            if value is not None and limit is not None:
                known[counter] = value
                if holds(loop.group(7), value - limit):
                    i = stmt_at(int(loop.group(8), 16))
                else:
                    i = stmt_at(int(loop.group(9), 16)) if loop.group(9) else i + 1
                continue
            known.pop(counter, None)
        for m in ASSIGN_RE.finditer(s):
            known[m.group(1)] = float(m.group(4)) if m.group(4) is not None else known.get(m.group(3))
        for m in STORE_RE.finditer(s):
            known.pop(m.group(1), None)  # a computed value: unknown from here on
        cmp = CMP_RE.search(s)
        if cmp:
            si = operand(cmp.group(3), cmp.group(4))
            di = operand(cmp.group(1), cmp.group(2))
            if si is not None and di is not None:
                taken = holds(cmp.group(5), si - di)
                other = re.match(r"; jmp @([0-9a-f]+)", s[cmp.end():])
                out.exact.append(f"{off:05x} {cmp.group(3)}={si:g} vs {cmp.group(1)}={di:g}: {cmp.group(5)} {'taken' if taken else 'not taken'}")
                if taken:
                    i = stmt_at(int(cmp.group(6), 16))
                elif other:
                    i = stmt_at(int(other.group(1), 16))
                else:
                    i += 1
                continue

        parts = [p.strip() for p in s.split(";")]
        first_jmp = next((k for k, p in enumerate(parts) if p.startswith("jmp @")), None)
        if first_jmp is not None:
            parts = parts[:first_jmp + 1]  # whatever follows an unconditional jump is dead
        last = JUMP_RE.fullmatch(parts[-1])
        prev = JUMP_RE.fullmatch(parts[-2]) if len(parts) > 1 else None
        if last and last.group(1) == "jmp":
            target = int(last.group(2), 16)
            if prev and prev.group(1) != "jmp":
                cond = int(prev.group(2), 16)
                if target < off < cond:  # `jcc @exit; jmp @loop_start`: a loop on values the walk does not know: leave it
                    out.assumed.append(f"{off:05x} loop left at once (exit {cond:05x}, repeat {target:05x})")
                elif visits[i] > 2:
                    out.assumed.append(f"{off:05x} revisited: left through {cond:05x}")
                else:
                    out.assumed.append(f"{off:05x} `{prev.group(1)}` taken -> {cond:05x} (else {target:05x})")
                i = stmt_at(cond)
                continue
            if abs(target - off) > 0x80:
                out.events.append(f"{off:05x} JMP -> {target:05x}")
                if target < off:
                    out.restart = f"{off:05x} JMP -> {target:05x}"
            i = stmt_at(target)
            continue
        if last:  # a conditional that ends a statement
            if int(last.group(2), 16) >= off and visits[i] <= 2:
                out.assumed.append(f"{off:05x} `{last.group(1)}` not taken (would go to {last.group(2)})")
            i += 1
            continue
        i += 1
    return out


def main():
    w = walk()
    lines = [f"{len(w.prints)} text PRINTs executed in {w.steps} statements; the program restarts with: {w.restart or 'not reached'}", ""]
    lines.append("GOSUB / RETURN / long jumps:")
    lines += [f"  {e}" for e in w.events]
    lines += ["", "Branches decided from known values (the stage counter, FOR counters):"]
    lines += [f"  {e}" for e in dict.fromkeys(w.exact)]
    lines += ["", "Branches decided by a rule (unknown conditions):"]
    lines += [f"  {e}" for e in dict.fromkeys(w.assumed)]
    lines += ["", "Text PRINTs in run order (file offset, text):"]
    lines += [f"  {off:05x}  {text.rstrip()}" for off, text in w.prints if text.strip()]
    text = "\n".join(lines)
    (HERE / "demo_trace.txt").write_text(text + "\n", encoding="utf-8")
    print(f"{len(w.prints)} text PRINTs executed in {w.steps} statements; restarts with: {w.restart or 'not reached'}")


if __name__ == "__main__":
    main()
