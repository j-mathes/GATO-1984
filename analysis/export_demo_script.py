#!/usr/bin/env python3
"""Extract DEMO.EXE's narration (the text it prints while it plays itself) into remake/src/data/demo_script.json.

DEMO.EXE is a scripted slide show: it draws the real game screens with fixed data and prints narration between them,
waiting on empty ``FOR`` loops.  The program body is walked statement by statement (list_statements.Lister); every plain
text PRINT is collected in file order.  Consecutive prints with no other PRINT in between are grouped into one page, and the
first delay-style loop constant that follows a page is recorded as ``delay_loop_limit``.

The file order is NOT the order the pages are shown in: the program is a loop that jumps into the chart, map and radar code and
picks the rest by a stage variable.  trace_demo_flow.py walks that control flow and ``pages`` is written in the order it runs them.

What is exact: the text, its order (traced, see trace_demo_flow.py for the few branches decided by a rule) and the loop limits.
What is not: loop limits are iteration counts of the compiled BASIC loop, so the real time depends on the original CPU;
``seconds_estimate`` uses a nominal rate and is only a guide.
"""
import json
import re
import sys
from pathlib import Path

import list_statements as ls
import parse_scenarios as ps
import trace_demo_flow as tdf

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "remake" / "src" / "data" / "demo_script.json"
NOMINAL_ITERATIONS_PER_SECOND = 2500

UI_LABELS = re.compile(r"^(POWER|DEPTH|TORPEDOES|FUEL|BATT|CHARGING|DIESEL|\s*OFF|\s*ELEC|HEADING|\s*SPEED|\s*DEPTH|TORP|#|\\|_+$|\s*$)")
PRINT_RE = re.compile(r"mov bx, ('(?:[^']*)'|\"(?:[^\"]*)\"); lcall 0x5cb, 0x(3587|3573)")
FORINIT_RE = re.compile(r"mov si, v[0-9a-f]+=(\d+(?:\.\d+)?); lcall 0x5cb, 0x131b")
LIMIT_RE = re.compile(r"mov di, v[0-9a-f]+=(\d+(?:\.\d+)?); mov si, v[0-9a-f]+; lcall 0x5cb, 0x1d71; ja")
# LOCATE row[,col]: the column operand is omitted when it equals the row (bx is left as it was)
LOCATE_RE = re.compile(r"mov bx, (0x[0-9a-f]+|\d+); lcall 0x5cb, 0x125b; (?:mov bx, (0x[0-9a-f]+|\d+); )?lcall 0x5cb, 0x1275")
# LINE (x1,y1)-(x2,y2),0,BF: 0x2865 sets the first corner, 0x28ad is the filled box with the colour in cx
BOX_RE = re.compile(r"(?:mov bx, (\S+)|xor bx, bx); mov dx, (\S+); lcall 0x5cb, 0x2865; mov bx, (\S+); mov dx, (\S+); xor cx, cx; lcall 0x5cb, 0x28ad")
INTRO_SECONDS = 4.0
MORSE_END_RE = re.compile(r"mov di, v[0-9a-f]+=(\d+); lcall 0x5cb, 0x1d71; jbe")
# The radio subroutine (GOSUB 0x4704) prints RADIO ROOM / REPORTS HEAVY DAMAGE only when ds:0x175e (radio damage) is above 0; DEMO never sets it
DEAD_BRANCH = (0x06d05, 0x06daa)
DEMORD_OPEN = "mov dx, 'DEMORD'"


def number(token, bx=None):
    """Immediate operand of a statement. The lister shows immediates of 0x100 or more as ``v0xxx``; 'bx' means 'same as bx'."""
    if token == "bx":
        return bx
    if token.startswith("v"):
        return int(token[1:], 16)
    return int(token, 0)


def printed_text(statement):
    return eval(PRINT_RE.search(statement).group(1))


def print_position(stmts, index, text):
    """(row, col) of the LOCATE just before a PRINT statement."""
    for back in (1, 2):
        m = LOCATE_RE.search(stmts[index - back][1])
        if m:
            row = int(m.group(1), 0)
            col = int(m.group(2), 0) if m.group(2) else row
            return {"row": row, "col": col, "text": text}
    return {"row": None, "col": None, "text": text}


def narration_box(stmts, first_print):
    """The `LINE (x1,y1)-(x2,y2),0,BF` that clears the box a page is printed into (None when there is none)."""
    for back in range(1, 9):
        m = BOX_RE.search(stmts[first_print - back][1])
        if m:
            x1 = number(m.group(1)) if m.group(1) else 0  # `xor bx, bx` is a corner at 0
            y1 = number(m.group(2), x1)
            return {"x1": x1, "y1": y1, "x2": number(m.group(3)), "y2": number(m.group(4)), "color": 0}
    return None


def morse_example(stmts):
    """The orders example shown right after the intro: the subroutine at 0x06d04 reads DEMORD and prints it while sending it in Morse."""
    start = next(i for i, (_, s) in enumerate(stmts) if DEMORD_OPEN in s)
    end = next(i for i in range(start, len(stmts)) if "lcall 0x5cb, 0x1dcc" in stmts[i][1])
    hold = [int(m.group(1)) for _, s in stmts[start:end] for m in [MORSE_END_RE.search(s)] if m]
    raw = Path(ROOT / "Original" / "DEMORD").read_bytes().split(b"\x1a")[0].decode("ascii")
    lines = raw.split("\r\n")
    if lines and lines[-1] == "":
        lines.pop()
    return {
        "file": "DEMORD",
        "file_offset": f"0x{stmts[start][0]:05x}",
        "lines": lines,
        "screen": "SCREEN 0,1 (text, 40 columns), COLOR 0,7,1: black text on light grey (#aaaaaa); the rest of the screen stays black",
        "print": "LOCATE 24,1: PRINT of 40 spaces, then every character is printed as its Morse is sent; a blank line prints two newlines; "
                 "the screen scrolls with the current colours, which is what builds the grey band",
        "end_hold_loop_limit": hold[-1] if hold else None,
        "end_hold_seconds_estimate": round(hold[-1] / NOMINAL_ITERATIONS_PER_SECOND, 2) if hold else None,
        "keys": "any key stops the Morse and ends the screen at once (INKEY$ at 0x06fe8), also during the final hold",
    }


def main():
    lst = ls.Lister("DEMO")
    stmts = lst.statements()
    texts = []
    for i, (off, s) in enumerate(stmts):
        m = PRINT_RE.search(s)
        if not m:
            continue
        t = eval(m.group(1))
        if UI_LABELS.match(t) or len(t.strip()) < 4 or DEAD_BRANCH[0] <= off < DEAD_BRANCH[1]:
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
            if m and float(m.group(1)) >= 100:  # a delay loop, not a small counting loop
                limit = float(m.group(1))
                break
        entry = {"page": p + 1, "file_offset": f"0x{page[0][1]:05x}", "lines": [t for _, _, t, _ in page],
                 "delay_loop_limit": limit,
                 "seconds_estimate": None if limit is None else round(limit / NOMINAL_ITERATIONS_PER_SECOND, 2),
                 "text": [print_position(stmts, i, raw) for i, _, _, _ in page for raw in [printed_text(stmts[i][1])]],
                 "box": narration_box(stmts, page[0][0])}
        out.append(entry)
    # page 1 is the title/instructions screen drawn while the program loads its data, not a narration box
    intro = out.pop(0)
    if intro["box"] is not None or [t["text"].strip() for t in intro["text"]] != [t.strip() for t in intro["lines"]]:
        raise SystemExit("unexpected first page")
    for n, page in enumerate(out):
        page["page"] = n + 1
    # `out` is in file order, which is not the order the program runs them in (see trace_demo_flow.py): the show is a loop that picks its
    # body by a stage variable and jumps into the chart, map and radar code from the middle of the control-room page
    walked = tdf.walk()
    by_offset = {int(page["file_offset"], 16): page for page in out}
    run, seen = [], set()
    for offset, _ in walked.prints:
        page = by_offset.get(offset)
        if page and page["page"] not in seen:
            seen.add(page["page"])
            run.append(page)
    unreached = [{"page": page["page"], "file_offset": page["file_offset"], "lines": page["lines"]} for page in out if page["page"] not in seen]
    doc = {
        "_about": "Screens and narration pages of DEMO.EXE in the order the program runs them (see analysis/trace_demo_flow.py and "
                  "analysis/demo_flow.md). `page` is the page's number in file order; the order of `pages` is the run order.",
        "run_order": [page["page"] for page in run],
        "restart": f"after the last page the program jumps back ({walked.restart}) to the Morse example and starts the loop again",
        "unreached_pages": unreached,
        "unreached_note": "Texts that are in the file but that the program cannot run in the show: the captain's-log reset, GAME CONTROL and "
                          "'play again?' belong to game code that DEMO.EXE carries along (it is entered only after the boat is lost or a "
                          "key is pressed in the game proper)",
        "exit_key": "F1 (the demo polls INKEY$ against the F1 key string ds:0x25e4)",
        "sound_toggle_key": "F2 (printed by the demo's title page)",
        "nominal_iterations_per_second": NOMINAL_ITERATIONS_PER_SECOND,
        "intro": {
            "file_offset": intro["file_offset"],
            "screen": "SCREEN 1, COLOR 8,1 (grey #555555 background, white text), CLS, then the three PRINTs; the program goes on loading its sprite files with this page up",
            "text": intro["text"],
            "seconds_estimate": INTRO_SECONDS,
            "seconds_note": "no delay loop or key wait follows the page: its time on screen is the loading time of the original, a remake estimate",
        },
        "morse": morse_example(stmts),
        "pages": run,
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(ps.dump_json(doc, width=140) + "\n", encoding="utf-8")
    print(f"{len(out)} pages, {sum(len(p['lines']) for p in out)} lines -> {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    sys.exit(main())
