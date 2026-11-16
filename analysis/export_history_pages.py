"""Export the GATO history viewer content to remake/src/data/history_pages.json.

Run:  python analysis/export_history_pages.py

Sources
  Original/History      the text (ASCII, CR LF, 0x1A end marker, '*' page-break lines)
  Original/History.exe  the BASIC viewer; its control flow was read from the Ghidra listing
                        analysis/disasm/History_disasm.txt (entry function, 1000:001a-1000:0160)

Viewer behaviour (read from the listing; see the 'flow' list in the output for the call addresses)
  * WIDTH 80, CLS, OPEN "HISTORY" FOR INPUT AS #1
  * loop: if EOF(1) -> end screen; else LINE INPUT #1,A$
      - A$ = "*"  -> LOCATE 23,25 ; PRINT "PRESS ANY KEY TO CONTINUE" ; wait for INKEY$ <> "" ; CLS
      - else      -> PRINT "      "; A$      (six-space left margin on every line)
  * end screen: 2 empty PRINTs, "PRESS 'R' TO REREAD THIS INFORMATION", "PRESS ANY OTHER KEY TO RETURN",
    wait for a key, CLOSE; if the key is "R" -> CLS and restart, otherwise CHAIN "GATO"
"""
import hashlib
import json
import sys
from pathlib import Path

import extract_history as eh
import inspect_exe as ie
import parse_scenarios as ps

ROOT = ie.ROOT
OUT = ROOT / "remake" / "src" / "data" / "history_pages.json"


def sha(b):
    return hashlib.sha256(b).hexdigest()


def literal(exe_pool, text):
    for off, ptr, t in exe_pool:
        if ie.printable_text(t) == text:
            return {"text": text, "file_offset": off, "data_segment_descriptor": f"0x{ptr - 4:04x}"}
    raise KeyError(text)


def main():
    data = (ie.SRC / "History").read_bytes()
    exe = (ie.SRC / "History.exe").read_bytes()
    if data.count(b"\x1a") != 1 or not data.endswith(b"\x1a"):
        raise ValueError("History: expected exactly one trailing 0x1A")
    raw = data[:-1].decode("latin-1").split("\r\n")
    if raw[-1] == "":
        raw.pop()

    pages_raw, cur, breaks, pos = [], [], [], 0
    for ln in raw:
        if ln == "*":
            pages_raw.append(cur)
            breaks.append(pos)
            cur = []
        else:
            cur.append(ln)
        pos += len(ln) + 2
    pages_raw.append(cur)

    spec_start = next(i for i, p in enumerate(pages_raw) if any(eh.clean_line(x).strip() == "SPECIFICATIONS" for x in p))
    pages, spec_lines = [], []
    stray = []
    for i, lines in enumerate(pages_raw):
        for k, ln in enumerate(lines):
            if "\x8a" in ln:
                stray.append({"page": i + 1, "line_index": k, "raw": repr(ln)})
        cl = [eh.clean_line(x) for x in lines]
        kind = "specifications" if i >= spec_start else "prose"
        page = {
            "index": i + 1,
            "kind": kind,
            "lines": cl,
            "trailing_blank_lines": eh.trailing_blanks(cl),
            "ends_with": "page_break_marker" if i < len(pages_raw) - 1 else "end_of_file",
        }
        if kind == "prose":
            page["paragraphs"] = eh.paragraphs(cl)
        else:
            spec_lines += cl
        pages.append(page)

    _, pool = ie.find_literal_pool(exe, ie.parse_header(exe))
    prompts = {
        "continue": literal(pool, "PRESS ANY KEY TO CONTINUE"),
        "reread": literal(pool, "PRESS 'R' TO REREAD THIS INFORMATION"),
        "return": literal(pool, "PRESS ANY OTHER KEY TO RETURN"),
        "page_break_marker": literal(pool, "*"),
        "reread_key": literal(pool, "R"),
        "data_file": literal(pool, "HISTORY"),
        "chain_target": literal(pool, "GATO"),
        "left_margin": literal(pool, "      "),
    }
    assert prompts["left_margin"]["text"] == " " * 6

    result = {
        "_about": "GATO 'History and Specifications' (main menu item 3). Text (c) 1984 Spectrum HoloByte; "
                  "confirm you may reuse it before shipping the remake.",
        "source": {
            "text": {"path": "Original/History", "bytes": len(data), "sha256": sha(data)},
            "viewer": {"path": "Original/History.exe", "bytes": len(exe), "sha256": sha(exe)},
            "note": "History.exe holds no history text; it reads the file named by the literal 'HISTORY'.",
        },
        "display": {
            "columns": 80,
            "left_margin_spaces": 6,
            "max_text_width": max(len(x) for p in pages for x in p["lines"]),
            "text_rows_per_page_max": max(p["line_count"] if "line_count" in p else len(p["lines"]) for p in pages),
            "continue_prompt_position": {"row": 23, "column": 25,
                                         "certainty": "arguments 0x17 and 0x19 of two runtime calls (assumed LOCATE row,col) "
                                                      "read from the listing; the call semantics are inferred"},
            "character_set": "IBM PC code page 437 (the only non-ASCII byte is 0x8A)",
        },
        "pages": pages,
        "specifications": eh.parse_specs(spec_lines),
        "triggers": {
            "page_turn": {
                "marker": "a line consisting only of '*' in the data file (compared with literal at ds:0x088c)",
                "occurrences_byte_offsets": breaks,
                "action": "show the continue prompt, wait for any key (INKEY$ <> \"\"), CLS, continue reading",
                "key": "any key",
            },
            "end_of_text": {
                "condition": "EOF(1)",
                "action": "print 2 empty lines, the reread prompt and the return prompt, wait for a key, CLOSE #1",
                "reread_key": "R (case-sensitive, exact string compare)",
                "on_reread": "CLS, reopen the file, restart from page 1",
                "on_other_key": "CHAIN \"GATO\" (back to the main menu)",
            },
            "diagrams": {"found": False, "evidence": "no DRAW/PAINT/GET/PUT string literals in History.exe; the data file "
                                                       "contains only text plus the 0x8A and 0x1A bytes"},
        },
        "prompts": prompts,
        "control_codes": [
            {"byte": "0x2A '*'", "meaning": "page break when alone on a line", "offsets": breaks},
            {"byte": "0x1A", "meaning": "end-of-file marker", "offset": len(data) - 1},
            {"byte": "0x8A", "offset": [m for m in range(len(data)) if data[m] == 0x8A],
             "context": "SPECIFICATIONS<CR><0x8A><CR><LF> on page 4",
             "interpretation": "0x0A with bit 7 set (WordStar soft line feed) after a lone CR. The page text above has "
                               "it removed. If the original BASIC LINE INPUT pushes back a non-LF byte after CR (the "
                               "runtime code at History.exe 0x1a38-0x1a4d compares the next byte with 0x0A), the viewer "
                               "showed it as an extra line containing CP437 glyph 0x8A (e-grave) right after the "
                               "SPECIFICATIONS heading.",
             "certainty": "stray byte and runtime comparison are exact; the visible effect is inferred, not run"},
        ],
        "flow": [
            {"addr": "1000:001a", "step": "runtime start-up, CLS, WIDTH 80"},
            {"addr": "1000:0047", "step": "OPEN \"HISTORY\" FOR INPUT AS #1 (runtime calls 1016:0e57, 1016:0e66 with descriptor 0x880)"},
            {"addr": "1000:005b", "step": "IF EOF(1) THEN goto 1000:00f0 (1016:0db6)"},
            {"addr": "1000:006c", "step": "LINE INPUT #1, A$ (1016:19ee) - A$ is ds:0x0872"},
            {"addr": "1000:0082", "step": "compare A$ with \"*\" (descriptor 0x88c, 1016:0c3c)"},
            {"addr": "1000:009b", "step": "page break: LOCATE 23,25 ; PRINT \"PRESS ANY KEY TO CONTINUE\""},
            {"addr": "1000:00b8", "step": "wait loop: key := INKEY$ (1016:10bf); repeat while key = \"\" (descriptor 0x8b0 = empty string)"},
            {"addr": "1000:00d0", "step": "CLS (1016:0789), back to 1000:005b"},
            {"addr": "1000:00d8", "step": "normal line: PRINT \"      \"; A$ (1016:1ce3, 1ad6, 1aea)"},
            {"addr": "1000:00f0", "step": "end: PRINT \"\" twice, PRINT reread prompt, PRINT return prompt"},
            {"addr": "1000:0121", "step": "wait for a key, then CLOSE (1016:0de1)"},
            {"addr": "1000:013e", "step": "IF key$ = \"R\" THEN CLS: goto 1000:0047 ELSE CHAIN \"GATO\" (loader 1016:185f)"},
        ],
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(ps.dump_json(result, width=120) + "\n", encoding="utf-8")
    print(f"Wrote {OUT.relative_to(ROOT)}: {len(pages)} pages, "
          f"{sum(len(p['lines']) for p in pages)} lines")


if __name__ == "__main__":
    sys.exit(main())
