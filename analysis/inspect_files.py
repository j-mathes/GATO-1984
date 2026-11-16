"""Inventory every file in ./Original and write analysis/file_inventory.md."""
import math
import re
import sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "Original"
OUT = ROOT / "analysis" / "file_inventory.md"
MIN_STR = 4
MAX_STRINGS = 2000  # per-file cap on listed strings; the true total is always reported

STR_RE = re.compile(rb"[\x20-\x7e]{%d,}" % MIN_STR)


def entropy(data: bytes) -> float:
    if not data:
        return 0.0
    n = len(data)
    return -sum(c / n * math.log2(c / n) for c in Counter(data).values())


def hexdump(data: bytes) -> str:
    lines = []
    for off in range(0, len(data), 16):
        chunk = data[off:off + 16]
        hx = " ".join(f"{b:02x}" for b in chunk[:8]).ljust(23) + "  " + \
             " ".join(f"{b:02x}" for b in chunk[8:]).ljust(23)
        asc = "".join(chr(b) if 0x20 <= b < 0x7f else "." for b in chunk)
        lines.append(f"{off:08x}  {hx}  |{asc}|")
    return "\n".join(lines)


def main() -> None:
    files = sorted((p for p in SRC.iterdir() if p.is_file()), key=lambda p: p.name.lower())
    out = [
        "# GATO file inventory",
        "",
        f"Source directory: `{SRC.name}/` — {len(files)} files. "
        f"Strings are runs of >= {MIN_STR} printable ASCII bytes (0x20-0x7E). "
        "Entropy is Shannon entropy in bits/byte (0-8).",
        "",
        "## Summary",
        "",
        "| File | Size (bytes) | Entropy | Strings |",
        "|---|---:|---:|---:|",
    ]
    details = []
    for p in files:
        data = p.read_bytes()
        strings = [m.group().decode("ascii") for m in STR_RE.finditer(data)]
        ent = entropy(data)
        out.append(f"| [{p.name}](#{re.sub(r'[^a-z0-9_-]', '', p.name.lower())}) "
                   f"| {len(data)} | {ent:.4f} | {len(strings)} |")
        d = [f"## {p.name}", "",
             f"- **Exact size:** {len(data)} bytes",
             f"- **Entropy:** {ent:.4f} bits/byte",
             f"- **Printable ASCII strings (>= {MIN_STR} chars):** {len(strings)}",
             "", "### Strings", ""]
        if strings:
            d.append("```text")
            d.extend(strings[:MAX_STRINGS])
            if len(strings) > MAX_STRINGS:
                d.append(f"... {len(strings) - MAX_STRINGS} more strings omitted (cap {MAX_STRINGS})")
            d.append("```")
        else:
            d.append("_None._")
        d += ["", f"### Hex + ASCII dump (first {min(256, len(data))} bytes)", "",
              "```text", hexdump(data[:256]) if data else "(empty file)", "```", ""]
        details.append("\n".join(d))
    out.append("")
    OUT.write_text("\n".join(out) + "\n" + "\n".join(details), encoding="utf-8")
    print(f"Wrote {OUT} ({len(files)} files)")


if __name__ == "__main__":
    sys.exit(main())
