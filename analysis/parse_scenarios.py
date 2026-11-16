"""Convert the GATO scenario files in ./Original into documented JSON under ./analysis/json.

Run:  python analysis/parse_scenarios.py

All files are plain ASCII text written by BASIC (PRINT# / WRITE-style sequential files):
CR LF line endings and a single 0x1A (Ctrl-Z, CP/M-DOS EOF) as the last byte.
There are no binary records, no Microsoft Binary Format floats and no 16-bit integers.
Numbers are decimal text (a few speeds are fractional, e.g. 5.4).

Formats (see also json/index.json, which repeats this documentation)
--------------------------------------------------------------------
ORDXXn / DEMORD  Mission order text. ORDXX line 1 is "@" + classification, then blank lines,
                 "TO: ...", "FROM: ...", and body lines separated by blank lines. DEMORD is
                 free text. The game appends the scenario number n to the base name "ORDXX"
                 (BASIC string concatenation, see exe_architecture.md): ORDXX1 .. ORDXX20.
COURXXn          Whitespace-separated number grid, 24 rows x 7 columns + a 3-value trailer.
                 Column 0 is the subtender, columns 1-6 are six enemy vessels.
                   row 1       ship type code (3 = subtender, 4..8 = enemy types)
                   rows 2-3    start position: x row, y row
                   rows 4-5    waypoint 1: x row, y row
                   row 6       waypoint 1 speed (knots)
                   rows 7-9    waypoint 2: x row, y row, speed row
                   ...         (same 3-row group) up to waypoint 7
                   row 25      trailer: objective_quadrant, flag_b, value_c
                 Coordinates: x 0-25000, y 0-20000 (5 x 4 grid of 5000-unit quadrants).
                 A waypoint of (0, 0) is "unused" (ship stops / stays at anchor).
MXP              Island table, 20 rows (one per quadrant) x 6 numbers separated by spaces/tabs:
                 center_x, center_y, radius_inner, radius_outer, attr_5, attr_6.
                 center -1,-1 means the quadrant has no island.
OBXn             16 lines of GW-BASIC DRAW macro strings (U D L R E F G H moves, B = move
                 without drawing, N = draw then return, Cn = colour). n is the object type:
                 3..8 are the ship type codes used in COURXX, 1 is island silhouettes.
                 The 16 lines are 16 view angles of the object (widths are symmetric: narrowest
                 at lines 0 and 8, broadside at lines 4 and 12).

Items marked "inferred" in the output were deduced from the data, the manual (gato.pdf) and the
orders text rather than from the game's source; they are listed in json/index.json.
"""
import hashlib
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "Original"
OUT = ROOT / "analysis" / "json"

QUAD_SIZE = 5000
GRID_COLS, GRID_ROWS = 5, 4
SCENARIO_COUNT = 20
UNIQUE_SCENARIOS = 10
SHIP_COUNT = 7
WAYPOINTS = 7
COURSE_ROWS = 24

SHIP_TYPES = {
    3: "subtender",
    4: "freighter",
    5: "tanker",
    6: "troop_carrier",
    7: "patrol_boat",
    8: "destroyer",
}
OBJECT_NAMES = {1: "island", **SHIP_TYPES}


def quadrant_of(x, y):
    """Quadrant number 1..20 (row-major, 5 columns x 4 rows) or None if outside the map."""
    col, row = int(x // QUAD_SIZE), int(y // QUAD_SIZE)
    if 0 <= col < GRID_COLS and 0 <= row < GRID_ROWS and x >= 0 and y >= 0:
        return row * GRID_COLS + col + 1
    return None


def read_lines(path):
    data = path.read_bytes()
    if data.count(b"\x1a") != 1 or not data.endswith(b"\x1a"):
        raise ValueError(f"{path.name}: expected exactly one trailing 0x1A")
    text = data[:-1].decode("ascii")
    if text.replace("\r\n", "").count("\n") or text.replace("\r\n", "").count("\r"):
        raise ValueError(f"{path.name}: line endings are not uniformly CR LF")
    lines = text.split("\r\n")
    if lines[-1] == "":
        lines.pop()
    return data, lines


def to_number(token):
    return int(token) if re.fullmatch(r"-?\d+", token) else float(token)


def base_info(path, data):
    return {
        "source_file": path.name,
        "size_bytes": len(data),
        "sha256": hashlib.sha256(data).hexdigest(),
    }


def parse_orders(path):
    data, lines = read_lines(path)
    info = base_info(path, data)
    nonblank = [ln.strip() for ln in lines if ln.strip()]
    if path.name == "DEMORD":
        info.update(format="free_text", message=" ".join(nonblank), body_lines=nonblank)
        info["raw_lines"] = lines
        return info
    head = re.fullmatch(r"@\s*(.+?)\s*", lines[0])
    if not head:
        raise ValueError(f"{path.name}: first line is not '@<classification>'")
    to = frm = None
    body = []
    for ln in nonblank[1:]:
        m = re.fullmatch(r"(TO|FROM):\s*(.*)", ln)
        if m and m.group(1) == "TO" and to is None:
            to = m.group(2)
        elif m and m.group(1) == "FROM" and frm is None:
            frm = m.group(2)
        else:
            body.append(ln)
    if to is None or frm is None or not body:
        raise ValueError(f"{path.name}: missing TO/FROM/body")
    info.update(
        format="order_text",
        classification=head.group(1),
        to=to,
        from_=frm,
        body_lines=body,
        message=" ".join(body),
        raw_lines=lines,
    )
    return info


def parse_course(path):
    data, lines = read_lines(path)
    rows = [[to_number(t) for t in ln.split()] for ln in lines]
    if len(rows) != COURSE_ROWS + 1 or any(len(r) != SHIP_COUNT for r in rows[:-1]) or len(rows[-1]) != 3:
        raise ValueError(f"{path.name}: unexpected grid shape")

    # Row groups after the type row: start x/y, waypoint-1 x/y, speed, then (x, y, speed) x 6.
    xs = [rows[1], rows[3]] + [rows[6 + 3 * k] for k in range(WAYPOINTS - 1)]
    ys = [rows[2], rows[4]] + [rows[7 + 3 * k] for k in range(WAYPOINTS - 1)]
    speeds = [rows[5]] + [rows[8 + 3 * k] for k in range(WAYPOINTS - 1)]

    ships = []
    for j in range(SHIP_COUNT):
        type_code = rows[0][j]
        waypoints = []
        for k in range(WAYPOINTS):
            x, y, v = xs[k + 1][j], ys[k + 1][j], speeds[k][j]
            waypoints.append({
                "seq": k + 1,
                "x": x,
                "y": y,
                "speed_knots": v,
                "used": not (x == 0 and y == 0),
                "quadrant": quadrant_of(x, y),
            })
        ships.append({
            "index": j,
            "role": "subtender" if j == 0 else "enemy",
            "type_code": type_code,
            "type_name": SHIP_TYPES.get(type_code),
            "start": {"x": xs[0][j], "y": ys[0][j], "quadrant": quadrant_of(xs[0][j], ys[0][j])},
            "waypoints": waypoints,
        })
    a, b, c = rows[-1]
    info = base_info(path, data)
    info.update(
        format="course_grid",
        ships=ships,
        trailer={"objective_quadrant": a, "flag_b": b, "value_c": c},
        raw_rows=rows,
    )
    return info


def parse_mxp(path):
    data, lines = read_lines(path)
    rows = [[to_number(t) for t in ln.split()] for ln in lines]
    if len(rows) != GRID_COLS * GRID_ROWS or any(len(r) != 6 for r in rows):
        raise ValueError(f"{path.name}: expected 20 rows of 6 numbers")
    quadrants = []
    for i, raw in enumerate(rows):
        q = i + 1
        row, col = divmod(i, GRID_COLS)
        has_island = raw[0] != -1 or raw[1] != -1
        if has_island and quadrant_of(raw[0], raw[1]) != q:
            raise ValueError(f"{path.name}: island of quadrant {q} lies outside it")
        entry = {
            "quadrant": q,
            "grid_col": col,
            "grid_row": row,
            "bounds": {"x_min": col * QUAD_SIZE, "x_max": (col + 1) * QUAD_SIZE,
                       "y_min": row * QUAD_SIZE, "y_max": (row + 1) * QUAD_SIZE},
            "has_island": has_island,
            "center_x": raw[0] if has_island else None,
            "center_y": raw[1] if has_island else None,
            "radius_inner": raw[2] if has_island else None,
            "radius_outer": raw[3] if has_island else None,
            "attr_5": raw[4] if has_island else None,
            "attr_6": raw[5] if has_island else None,
            "raw": raw,
        }
        quadrants.append(entry)
    info = base_info(path, data)
    info.update(
        format="island_table",
        quadrant_size=QUAD_SIZE,
        grid={"cols": GRID_COLS, "rows": GRID_ROWS, "width": GRID_COLS * QUAD_SIZE,
              "height": GRID_ROWS * QUAD_SIZE},
        quadrants=quadrants,
    )
    return info


DRAW_RE = re.compile(r"(?P<prefix>[BN]*)(?P<dir>[UDLREFGH])(?P<n>\d*)|C(?P<color>\d+)")
DIRS = {"U": (0, -1), "D": (0, 1), "L": (-1, 0), "R": (1, 0),
        "E": (1, -1), "F": (1, 1), "G": (-1, 1), "H": (-1, -1)}


def parse_draw(text):
    """Tokenise a DRAW string and simulate the pen (screen coordinates, y grows downward)."""
    commands, segments = [], []
    x = y = 0
    pos = 0
    for m in DRAW_RE.finditer(text):
        if m.start() != pos:
            raise ValueError(f"unparsed DRAW text at {pos}: {text[pos:m.start()]!r}")
        pos = m.end()
        if m.group("color") is not None:
            commands.append(["C", int(m.group("color"))])
            continue
        prefix, d = m.group("prefix"), m.group("dir")
        if len(set(prefix)) != len(prefix):
            raise ValueError(f"repeated prefix in {m.group(0)!r}")
        n = int(m.group("n")) if m.group("n") else 1
        commands.append([d, n, "".join(sorted(prefix))] if prefix else [d, n])
        dx, dy = DIRS[d]
        nx, ny = x + dx * n, y + dy * n
        if "B" not in prefix:
            segments.append((x, y, nx, ny))
        if "N" not in prefix:
            x, y = nx, ny
    if pos != len(text):
        raise ValueError(f"trailing DRAW text: {text[pos:]!r}")
    return commands, segments, (x, y)


def parse_obx(path):
    data, lines = read_lines(path)
    object_id = int(path.name[3:])
    frames = []
    for i, text in enumerate(lines):
        commands, segments, end = parse_draw(text)
        if segments:
            pts_x = [p for s in segments for p in (s[0], s[2])]
            pts_y = [p for s in segments for p in (s[1], s[3])]
            bounds = {"min_x": min(pts_x), "max_x": max(pts_x), "min_y": min(pts_y), "max_y": max(pts_y)}
            bounds["width"] = bounds["max_x"] - bounds["min_x"]
            bounds["height"] = bounds["max_y"] - bounds["min_y"]
        else:
            bounds = None
        frames.append({
            "index": i,
            "draw_string": text,
            "commands": commands,
            "pen_end": {"x": end[0], "y": end[1]},
            "drawn_bounds": bounds,
        })
    info = base_info(path, data)
    info.update(
        format="draw_sprite",
        object_id=object_id,
        object_name=OBJECT_NAMES.get(object_id),
        frame_count=len(frames),
        frame_meaning="inferred: 16 view angles at 22.5 degree steps; frame 0 and 8 are end-on "
                      "(narrowest), frames 4 and 12 are broadside mirror images (widest). For OBX1 "
                      "the frames are island silhouette variants.",
        command_schema="[op, arg, flags?]: op in U D L R E F G H -> arg = pixels, flags 'B' (move "
                       "without drawing) and/or 'N' (draw, then return to start); op 'C' -> arg = colour",
        frames=frames,
    )
    return info


def dump_json(obj, level=0, width=110):
    """JSON with 2-space indent; scalar lists and short objects stay on one line."""
    pad = "  " * level

    def is_flat(v):
        return isinstance(v, (str, int, float, bool)) or v is None

    one_line = json.dumps(obj, ensure_ascii=True)
    if is_flat(obj):
        return one_line
    if isinstance(obj, list):
        if not obj:
            return "[]"
        if all(is_flat(v) or (isinstance(v, list) and all(is_flat(w) for w in v)) for v in obj):
            if len(one_line) + len(pad) <= width:
                return one_line
            lines, cur = [], pad + "  "
            for v in obj:
                piece = json.dumps(v, ensure_ascii=True) + ","
                if len(cur) + len(piece) + 1 > width and cur.strip():
                    lines.append(cur.rstrip())
                    cur = pad + "  "
                cur += piece + " "
            lines.append(cur.rstrip().rstrip(","))
            return "[\n" + "\n".join(lines) + "\n" + pad + "]"
        if len(one_line) + len(pad) <= width:
            return one_line
        inner = ",\n".join(pad + "  " + dump_json(v, level + 1, width) for v in obj)
        return "[\n" + inner + "\n" + pad + "]"
    if not obj:
        return "{}"
    if len(one_line) + len(pad) <= width:
        return one_line
    inner = ",\n".join(
        f"{pad}  {json.dumps(k)}: {dump_json(v, level + 1, width)}" for k, v in obj.items())
    return "{\n" + inner + "\n" + pad + "}"


def write_json(path, obj):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(dump_json(obj) + "\n", encoding="utf-8")


def fix_keys(obj):
    """'from_' is used internally to avoid the keyword; emit the natural key 'from'."""
    if isinstance(obj, dict):
        return {("from" if k == "from_" else k): fix_keys(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [fix_keys(v) for v in obj]
    return obj


FORMAT_DOCS = {
    "encoding": "ASCII, CR LF line ends, one 0x1A end-of-file byte. No binary records, no MBF floats, "
                "no 16-bit integers: every number is decimal text (speeds may be fractional).",
    "coordinate_system": {
        "map": "25000 x 20000 units = 5 columns x 4 rows of 5000-unit quadrants.",
        "quadrant_number": "1 + floor(x/5000) + 5*floor(y/5000) (row-major). Allied quadrants per the "
                           "manual are 1, 2, 6, 7 (x,y < 10000), where the subtender patrols.",
        "y_axis": "inferred: y grows toward the compass heading 0 (north); ORDXX1 'heading 350' and "
                  "ORDXX3 'heading 225' match the first-leg vectors of COURXX1/COURXX3 with y up.",
    },
    "duplicates": "Files numbered 11-20 are byte-identical copies of 1-10 for ORDXX and COURXX, so only "
                  "10 distinct scenarios exist.",
    "COURXX": {
        "layout": "24 rows x 7 numbers + trailer row of 3 numbers; column 0 = subtender, columns 1-6 = enemy "
                  "vessels. Row 1 type codes; rows 2-3 start x/y; rows 4-5 waypoint-1 x/y; row 6 waypoint-1 "
                  "speed; then waypoints 2-7 as (x row, y row, speed row).",
        "certain": ["row/column layout", "column 0 is the subtender (its coordinates stay inside quadrants "
                    "1,2,6,7)", "type row", "(0,0) waypoints mark unused slots / anchored ships"],
        "inferred": [
            "type codes 3..8 = subtender, freighter, tanker, troop carrier, patrol boat, destroyer: "
            "confirmed by rendering OBX3-OBX8 and comparing with the manual's ship catalog; the orders "
            "text agrees (unescorted convoys contain only 4/5/6, 'patrol craft' scenarios are mostly 7)",
        ],
        "waypoint_speed_semantics": "decoded at Gato1.exe 0x07a03-0x07a7b: when a ship picks waypoint W as its next target it sets "
                                    "speed = difficulty + (speed row of waypoint W), so the speed row is the speed used while travelling "
                                    "TO waypoint W. (0,0) waypoints are NOT skipped: the ship simply heads for (0,0).",
        "loader_verified": {
            "source": "Gato1.exe 0xbeb1-0xc118 (compiled BASIC); see analysis/loader_verification.md",
            "statement_order": [
                "OPEN \"COURXX\" + n FOR INPUT AS #1",
                "FOR k = 2 TO 8: INPUT #1, type(k)                    ' row 1 (array ds:0x1daa)",
                "FOR k = 2 TO 8: INPUT #1, x0(k): x(k) = x0(k)        ' row 2 (ds:0x1cf6, copied to ds:0x1d3e)",
                "FOR k = 2 TO 8: INPUT #1, y0(k): y(k) = y0(k): z(k) = 0   ' row 3 (ds:0x1d1a, copied to ds:0x1d62; ds:0x1cae cleared)",
                "FOR w = 1 TO 7: FOR j = 1 TO 3: FOR k = 2 TO 8: INPUT #1, a(j, w, k)   ' rows 4-24, array ds:0x179e, "
                "index ((j*9 + w)*9 + k); j = 1 x, 2 y, 3 speed (loop limits 3 and 7 are inferred from the 21 rows)",
                "INPUT #1, V1, V2, V3                                  ' trailer row: stored in ds:0x2246, 0x2242, 0x226a (assumed in file order)",
            ],
            "verified": [
                "file columns map to ship slots 2..8 (slot 1, the player's own boat, is not read from the file)",
                "rows 1-3 = type, start x, start y; start position is copied into a working position array",
                "waypoint rows are stored waypoint-major: for each of 7 waypoints three rows x, y, speed",
                "the speed row is stored together with (after) its waypoint, as parse_course assumes",
                "every number is read with INPUT # (decimal text -> 4-byte single in memory)",
            ],
            "not_determined": [
                "whether the objective-quadrant test also requires a minimum depth (it does not test depth)",
            ],
        },
        "unknown": ["whether the objective quadrant must also be entered 'stopped' at any depth (the code tests speed, quadrant, "
                    "time of day and island distance only; it does not test depth)"],
        "trailer_decoded": {
            "objective_quadrant": "trailer[0], ds:0x2246: island quadrant to reach (0 = none). Gato1.exe 0x06fef: the mission completes when "
                                  "the boat's speed is 0, its quadrant equals this value, TIME OF DAY equals trailer[1] and the island of that "
                                  "quadrant is closer than inner radius + 200.",
            "flag_b": "trailer[1], ds:0x2242: required TIME OF DAY for that island objective (1 = day, 0 = night; compared with the "
                      "GAME CONTROL [3] setting, ds:0x21ca). 0 in scenarios 6-10 (e.g. ORDXX7 'SUGGEST NIGHT RESCUE').",
            "value_c": "trailer[2], ds:0x226a: highest ship slot of the convoy. The mission also completes when every ship in slots "
                       "3..value_c is sunk (slot = file column + 2; values above 8 mean all of slots 3..8). Gato1.exe 0x07bf8-0x07d9f.",
        },
    },
    "ORDXX": "Order text; '@' prefix on line 1 is a marker before the classification. The game adds the "
             "date-time group when displaying.",
    "MXP": {
        "layout": "20 rows (quadrant 1..20) x 6 numbers; -1,-1 = no island.",
        "certain": ["row index = quadrant number", "center_x/center_y fall inside their quadrant"],
        "inferred": ["radius_inner < radius_outer; the outer value (500/1000/1500) is probably the shoal "
                     "or island size, the inner one the island/collision core"],
        "decoded": ["radius_inner (col 3, ds:0x222a) is the island collision core and objective radius; radius_outer "
                    "(col 4, ds:0x222e) the second ellipse axis; attr_5 (col 5, ds:0x2382) = island picture 1..3 (one of the "
                    "three DRAW strings); attr_6 (col 6, ds:0x2386) = DRAW scale S= of that picture. Gato1.exe 0x0c6c8-0x0c7d2, "
                    "0x0c9b2, 0x067db."],
    },
    "OBX": "DRAW macro language of GW-BASIC/BASICA, 16 lines per file. OBX1 = island silhouettes, OBX3-8 = "
           "ships by type code. Lines are 16 view angles (inferred from the symmetric width profile and "
           "renders). Colour command is always C0.",
}


def main():
    for sub in ("orders", "courses", "sprites", "map"):
        (OUT / sub).mkdir(parents=True, exist_ok=True)

    manifest = {}
    parsed_orders, parsed_courses = {}, {}

    for n in range(1, SCENARIO_COUNT + 1):
        for prefix, parser, sub, store in (("ORDXX", parse_orders, "orders", parsed_orders),
                                           ("COURXX", parse_course, "courses", parsed_courses)):
            path = SRC / f"{prefix}{n}"
            obj = fix_keys(parser(path))
            store[n] = obj
            write_json(OUT / sub / f"{path.name}.json", obj)
            manifest[path.name] = {"json": f"{sub}/{path.name}.json", "format": obj["format"],
                                   "size_bytes": obj["size_bytes"], "sha256": obj["sha256"]}

    for n in range(1, UNIQUE_SCENARIOS + 1):
        for store in (parsed_orders, parsed_courses):
            if store[n]["sha256"] != store[n + UNIQUE_SCENARIOS]["sha256"]:
                raise ValueError(f"scenario {n + UNIQUE_SCENARIOS} is not a copy of {n}")

    demo = fix_keys(parse_orders(SRC / "DEMORD"))
    write_json(OUT / "orders" / "DEMORD.json", demo)
    manifest["DEMORD"] = {"json": "orders/DEMORD.json", "format": demo["format"],
                          "size_bytes": demo["size_bytes"], "sha256": demo["sha256"]}

    mxp = parse_mxp(SRC / "MXP")
    write_json(OUT / "map" / "MXP.json", mxp)
    manifest["MXP"] = {"json": "map/MXP.json", "format": mxp["format"],
                       "size_bytes": mxp["size_bytes"], "sha256": mxp["sha256"]}

    islands = {q["quadrant"] for q in mxp["quadrants"] if q["has_island"]}
    for n in range(1, UNIQUE_SCENARIOS + 1):
        obj_q = parsed_courses[n]["trailer"]["objective_quadrant"]
        if obj_q and obj_q not in islands:
            raise ValueError(f"scenario {n}: objective quadrant {obj_q} has no island in MXP")

    for path in sorted(SRC.glob("OBX*"), key=lambda p: int(p.name[3:])):
        obj = parse_obx(path)
        write_json(OUT / "sprites" / f"{path.name}.json", obj)
        manifest[path.name] = {"json": f"sprites/{path.name}.json", "format": obj["format"],
                               "size_bytes": obj["size_bytes"], "sha256": obj["sha256"]}

    used_types = {s["type_code"] for c in parsed_courses.values() for s in c["ships"]}
    missing = [t for t in used_types if not (SRC / f"OBX{t}").exists()]
    if missing:
        raise ValueError(f"ship types without an OBX sprite file: {missing}")

    scenarios = []
    for n in range(1, UNIQUE_SCENARIOS + 1):
        o, c = parsed_orders[n], parsed_courses[n]
        scenarios.append({
            "scenario": n,
            "source_files": {"orders": [f"ORDXX{n}", f"ORDXX{n + UNIQUE_SCENARIOS}"],
                             "course": [f"COURXX{n}", f"COURXX{n + UNIQUE_SCENARIOS}"]},
            "orders": {k: o[k] for k in ("classification", "to", "from", "message", "body_lines")},
            "ships": c["ships"],
            "trailer": c["trailer"],
        })
    write_json(OUT / "scenarios.json", {
        "note": "The 10 distinct scenarios; scenario n is also stored as files n+10. Each pairs ORDXXn "
                "with COURXXn (pairing confirmed by objective quadrants and start quadrants in the orders).",
        "scenarios": scenarios,
    })

    write_json(OUT / "index.json", {
        "generated_by": "analysis/parse_scenarios.py",
        "source_dir": "Original",
        "formats": FORMAT_DOCS,
        "ship_types": {str(k): v for k, v in SHIP_TYPES.items()},
        "files": manifest,
    })
    print(f"Wrote {sum(1 for _ in OUT.rglob('*.json'))} JSON files to {OUT}")


if __name__ == "__main__":
    sys.exit(main())
