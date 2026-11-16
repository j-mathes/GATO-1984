#!/usr/bin/env python3
"""Extract DEMO.EXE's narration (the text it prints while it plays itself) into remake/src/data/demo_script.json.

DEMO.EXE is a scripted slide show: it draws the real game screens with fixed data and prints narration between them,
waiting on empty ``FOR`` loops.  The program body is walked statement by statement (list_statements.Lister); every plain
text PRINT is collected in file order.  Consecutive prints with no other PRINT in between are grouped into one page, and the
first delay-style loop constant that follows a page is recorded as ``delay_loop_limit``.

What is exact: the text, its order and the loop limits.  What is not: loop limits are iteration counts of the compiled
BASIC loop, so the real time depends on the original CPU; ``seconds_estimate`` uses a nominal rate and is only a guide.
"""
import json
import re
import sys
from pathlib import Path

import list_statements as ls
import parse_scenarios as ps

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "remake" / "src" / "data" / "demo_script.json"
NOMINAL_ITERATIONS_PER_SECOND = 2500

UI_LABELS = re.compile(r"^(POWER|DEPTH|TORPEDOES|FUEL|BATT|CHARGING|DIESEL|\s*OFF|\s*ELEC|HEADING|\s*SPEED|\s*DEPTH|TORP|#|\\|_+$|\s*$)")
PRINT_RE = re.compile(r"mov bx, ('(?:[^']*)'|\"(?:[^\"]*)\"); lcall 0x5cb, 0x(3587|3573)")
FORINIT_RE = re.compile(r"mov si, v[0-9a-f]+=(\d+(?:\.\d+)?); lcall 0x5cb, 0x131b")
LIMIT_RE = re.compile(r"mov di, v[0-9a-f]+=(\d+(?:\.\d+)?); mov si, v[0-9a-f]+; lcall 0x5cb, 0x1d71; ja")


def main():
    lst = ls.Lister("DEMO")
    stmts = lst.statements()
    texts = []
    for i, (off, s) in enumerate(stmts):
        m = PRINT_RE.search(s)
        if not m:
            continue
        t = eval(m.group(1))
        if UI_LABELS.match(t) or len(t.strip()) < 4:
            continue
        texts.append((i, off, t.rstrip(), m.group(2) == "3587"))
    pages, cur = [], []
    for k, (i, off, t, nl) in enumerate(texts):
        if cur and i - cur[-1][0] > 4:
            pages.append(cur)
            cur = []
        cur.append((i, off, t, nl))
    if cur:
        pages.append(cur)
    out = []
    for p, page in enumerate(pages):
        last_idx = page[-1][0]
        limit = None
        for _, s in stmts[last_idx + 1:last_idx + 12]:
            m = LIMIT_RE.search(s)
            if m:
                limit = float(m.group(1))
                break
        out.append({"page": p + 1, "file_offset": f"0x{page[0][1]:05x}", "lines": [t for _, _, t, _ in page],
                    "delay_loop_limit": limit,
                    "seconds_estimate": None if limit is None else round(limit / NOMINAL_ITERATIONS_PER_SECOND, 2)})
    doc = {
        "_about": "Narration pages of DEMO.EXE in program order (see analysis/export_demo_script.py for what is exact).",
        "exit_key": "F1 (the demo polls INKEY$ against the F1 key string ds:0x25e4)",
        "sound_toggle_key": "F2 (printed by the demo's title page)",
        "nominal_iterations_per_second": NOMINAL_ITERATIONS_PER_SECOND,
        "pages": out,
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(ps.dump_json(doc, width=140) + "\n", encoding="utf-8")
    print(f"{len(out)} pages, {sum(len(p['lines']) for p in out)} lines -> {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    sys.exit(main())
