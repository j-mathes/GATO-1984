"""Extract the GATO history text, page structure and viewer behaviour into analysis/history_content.json.

Run:  python analysis/extract_history.py

Where the content really lives
  * History.exe (the viewer) contains only the prompts, the page-break marker "*", the data-file name
    "HISTORY" and the chain target "GATO". It contains no history text and no graphics.
  * The encyclopedia text is the separate data file Original/History (ASCII, CR LF, one 0x1A end marker).
"""
import hashlib
import json
import re
import sys
from pathlib import Path

import inspect_exe as ie
import parse_scenarios as ps

ROOT = ie.ROOT
OUT = ROOT / "analysis" / "history_content.json"
INDENT = 5  # paragraph first lines are indented by 5 spaces
SPEC_LABEL = re.compile(r"^ {5}([A-Za-z][A-Za-z ]*?):\s{2,}(\S.*)$")


def sha(b):
    return hashlib.sha256(b).hexdigest()


def clean_line(raw):
    """Drop the stray CR/0x8A pair and trailing blanks; keep leading indentation."""
    return raw.replace("\r\x8a", "").rstrip()


def trailing_blanks(lines):
    n = 0
    for ln in reversed(lines):
        if ln.strip():
            break
        n += 1
    return n


def paragraphs(lines):
    out, cur = [], []
    for ln in lines:
        if not ln.strip():
            continue
        if re.match(r" {%d}\S" % INDENT, ln) and cur:
            out.append(cur)
            cur = []
        cur.append(ln.strip())
    if cur:
        out.append(cur)
    texts = []
    for p in out:
        text = ""
        for part in p:
            text = (text[:-1] + part) if text.endswith("-") and part[:1].islower() and " " not in text[-12:].split()[-1] \
                else (text + " " + part).strip()
        texts.append(text)
    return texts


def parse_specs(lines):
    """Specifications table: label at column 5, values from the column where the first value starts."""
    fields, cur, value_col = [], None, None
    note = []
    in_note = False
    for ln in lines:
        if not ln.strip() or ln.strip() == "SPECIFICATIONS":
            continue
        if ln.startswith("NOTE:"):
            in_note = True
            note.append(ln[len("NOTE:"):].strip())
            continue
        if in_note:
            note.append(ln.strip())
            continue
        m = SPEC_LABEL.match(ln)
        if m:
            value_col = m.start(2)
            cur = {"label": m.group(1), "lines": [m.group(2).strip()]}
            fields.append(cur)
        elif cur and value_col and len(ln) - len(ln.lstrip()) >= value_col:
            cur["lines"].append(ln.strip())
    return {"value_column": value_col, "fields": fields,
            "note": " ".join(note).replace("sub- marines", "submarines")}


def main():
    hist_path = ie.SRC / "History"
    exe_path = ie.SRC / "History.exe"
    data = hist_path.read_bytes()
    exe = exe_path.read_bytes()
    if data.count(b"\x1a") != 1 or not data.endswith(b"\x1a"):
        raise ValueError("History: expected exactly one trailing 0x1A")
    text = data[:-1].decode("latin-1")
    raw_lines = text.split("\r\n")
    if raw_lines[-1] == "":
        raw_lines.pop()

    page_raw, offsets, cur, cur_start, pos = [], [], [], 0, 0
    breaks = []
    for ln in raw_lines:
        line_off = pos
        pos += len(ln) + 2
        if ln == "*":
            page_raw.append(cur)
            offsets.append((cur_start, line_off))
            breaks.append(line_off)
            cur, cur_start = [], pos
        else:
            cur.append(ln)
    page_raw.append(cur)
    offsets.append((cur_start, pos))

    spec_start = next(i for i, p in enumerate(page_raw) if any(clean_line(x).strip() == "SPECIFICATIONS" for x in p))
    pages = []
    spec_lines = []
    for i, (lines, (a, b)) in enumerate(zip(page_raw, offsets)):
        cl = [clean_line(x) for x in lines]
        kind = "specifications" if i >= spec_start else "prose"
        page = {
            "page": i + 1,
            "kind": kind,
            "byte_range": [a, b],
            "line_count": len(cl),
            "trailing_blank_lines": trailing_blanks(cl),
            "lines": cl,
        }
        if kind == "prose":
            page["paragraphs"] = paragraphs(cl)
        else:
            spec_lines += cl
        pages.append(page)

    codes = []
    for m in re.finditer(rb"\x8a", data):
        codes.append({
            "offset": m.start(), "byte": "0x8A", "context_hex": data[m.start() - 4:m.start() + 4].hex(" "),
            "where": "line 'SPECIFICATIONS' (page %d): bytes 0D 8A 0D 0A instead of 0D 0A" % (spec_start + 1),
            "interpretation": "Stray lone CR followed by 0x8A = 0x0A with bit 7 set, the WordStar 'soft line feed' "
                              "convention, left over from the word processor that produced the file. "
                              "Not displayable text; strip it for the remake.",
            "unresolved": "How the original BASIC viewer rendered it (an extra blank line, or CP437 glyph 0x8A) was "
                          "not determined; it was not decoded from the viewer's code.",
        })
    codes.append({"offset": len(data) - 1, "byte": "0x1A", "meaning": "Ctrl-Z end-of-file marker"})
    codes.append({"offsets": breaks, "byte": "'*' alone on a line (0x2A)",
                  "meaning": "page break; the viewer's literal \"*\" is compared with each line read"})

    base, pool = ie.find_literal_pool(exe, ie.parse_header(exe))
    literals = [{"file_offset": off, "data_segment_offset": ptr, "text": ie.printable_text(t)}
                for off, ptr, t in pool]
    lens = [len(x) for p in pages for x in p["lines"]]
    result = {
        "_about": "GATO 'History and Specifications' content (menu item [3]). Original text (c) 1984 Spectrum "
                  "HoloByte; reproduce only with the right to do so.",
        "source": {
            "text_file": {"path": "Original/History", "size_bytes": len(data), "sha256": sha(data)},
            "viewer": {"path": "Original/History.exe", "size_bytes": len(exe), "sha256": sha(exe)},
            "note": "The text is NOT inside History.exe; the executable only reads the data file named by the "
                    "string literal 'HISTORY' and contains the prompts listed under 'viewer'.",
        },
        "format": {
            "encoding": "7-bit ASCII (one stray 0x8A byte, see control_codes)",
            "line_ending": "CR LF",
            "end_of_file": "single 0x1A",
            "page_separator": "a line consisting only of '*'",
            "pages": len(pages),
            "total_lines_without_separators": len(lens),
            "max_line_length": max(lens),
            "paragraph_convention": "first line of a paragraph is indented by 5 spaces; others start at column 0",
            "specification_layout": "labels at column 5, values from column 24; continuation lines indented to column 24",
            "typography_notes": "'Torpedos:' is the original spelling; 'sub-' / 'marines.' is a hyphenation across lines "
                                "(joined as 'submarines' in paragraphs/note).",
        },
        "control_codes": codes,
        "pages": pages,
        "specifications": parse_specs(spec_lines),
        "viewer": {
            "program": "History.exe",
            "string_literals": literals,
            "behaviour_inferred_from_literals": [
                "opens the data file 'HISTORY' and reads it line by line",
                "a line equal to '*' ends a page; after each page it shows 'PRESS ANY KEY TO CONTINUE'",
                "after the last page it shows \"PRESS 'R' TO REREAD THIS INFORMATION\" and "
                "'PRESS ANY OTHER KEY TO RETURN'; 'R' restarts, any other key chains to 'GATO' (the menu)",
            ],
            "certainty": "literals are exact; the control flow is inferred from them and the data format, "
                         "not from a full disassembly of History.exe",
        },
        "diagrams": {
            "found": [],
            "searched": "History.exe has no DRAW/PAINT/GET/PUT strings and no graphics-mode setup; History has no "
                        "non-text bytes except the 0x8A and 0x1A noted above. The history screens are text only.",
        },
    }
    OUT.write_text(ps.dump_json(result, width=120) + "\n", encoding="utf-8")
    print(f"Wrote {OUT.relative_to(ROOT)}: {len(pages)} pages, {len(lens)} lines, {len(codes)} control-code entries")


if __name__ == "__main__":
    sys.exit(main())
