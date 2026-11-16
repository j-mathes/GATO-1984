# GATO title artwork (GATO.EXE)

Rebuilt by [export_title_art.py](export_title_art.py) into `remake/public/assets/title_screen.json` (+ PNGs). Everything below was read from `Original/Gato.exe`; "inferred" marks what was not decoded.

## How the title is made

There is **no stored bitmap** in GATO.EXE: no 16,384-byte B800h dump, no RLE/PackBits stream. The compiled BASIC program (file `0x61a`-`0x1010`) draws every picture at run time on a 320x200 four-colour screen (`SCREEN 1`) with `LINE`, `PSET`, `DRAW`, `PAINT`, `CIRCLE` and `LOCATE`/`PRINT`. The only art data are the `DRAW` macro strings in the string pool (`0x561e`-`0x5e12`; descriptors at `DS:0x8da`..`0xe4e`, `DS` = file `0x4d40`).

Runtime routines (BASIC runtime starts at file `0x1010`; offsets below are runtime offsets):

| Routine | Statement | Routine | Statement |
| --- | --- | --- | --- |
| `18f5` / `18fb` | `LINE (x1,y1)-(x2,y2),c` | `1d5c` | `PAINT (x,y),paint,border` |
| `1904` / `193d` | `LINE ...,B` / `,BF` | `2086` | `CIRCLE (x,y),r,c` |
| `1983` | `PSET (x,y),c` | `1ee4` | `DRAW` (table-driven interpreter, `0x1ef4`) |
| `0a41`/`0a5b` | `SCREEN` args | `0808`/`0822` | `COLOR` args (INT 10h AH=0Bh) |
| `0bce`/`0be8` | `LOCATE row,col` | `078b` | `CLS` |
| `11fb` / `1210` | `x - y` / `x + y` | `2435` / `2480` | `CINT` |

Runtime behaviour that shapes the picture and is reproduced:

* `DRAW` scale `S n` persists between `DRAW` statements and is applied per axis as `trunc(n*S/4)` (`0x2005`). The prism string `C1BD10R40H20G20` therefore draws at `S2`, 20 px wide, not 40.
* `LINE` is a major-axis DDA with the error seeded to major/2 (`0x2c0e`).
* `COLOR n` with n >= 8 sets the CGA intensity bit (`0x0822` ORs `0x10`).
* Every runtime call is wrapped by `0x1736`, which preserves registers, so the compiler's omitted `mov cx,...` before the second box of the logo is correct.

## Key frames (program order)

| Frame | Program offsets | What it shows |
| --- | --- | --- |
| `spectrum_logo` | `0x6a6`-`0x979` | "Spectrum HoloByte" outline lettering in a double frame, prism with white beam and spectrum rays, TM, box with PRESENTS |
| `title_letters` | `0x979`-`0xa3f` | `COLOR 9`; G, A, T, O drawn relative to (160,80) and `PAINT`ed colour 2; TM |
| **`title`** | `0xa3f`-`0xbd2` | two venetian-blind wipes erase rows y = 3 and 0 (mod 4) of the lettering, then CLASS SUBMARINE, authors, (c) ring and credit; held for ~5000 empty loop passes. **This is the frame the remake shows.** |
| `launcher_menu` | `0xda2`-`0xf17` | `COLOR 1,1`; cyan sky, blue sea, surfaced Gato-class submarine, 32 sparkle dots, four-item menu text |

After the hold, three more wipes dissolve the lettering, the text scrolls off, and the menu frame is drawn; GATO.EXE then waits for the item number. There is no "press any key" in the original; the prompt in the remake is an addition.

The block at `0xf7c`-`0x1010` (a second coast/ship picture) follows the final `CHAIN "GATO1"` and is never reached.

## Colours

Pixel value 0 is the screen background; 1-3 come from the palette. Per frame (`colorState`/`palette` in the JSON):

| Frame | Background | Palette 1 |
| --- | --- | --- |
| `spectrum_logo` | black | bright cyan / magenta / white |
| `title_letters`, `title` | light blue (`COLOR 9`) | bright cyan / magenta / white |
| `launcher_menu` | blue (`COLOR 1,1`) | normal cyan / magenta / white |

So the title is not black-backed: only the logo screen is. **Inferred:** the BIOS mode set leaves the colour-select register at 0x30 (palette 1, intensified) and `COLOR 9` keeps that palette; the palette byte `COLOR 9` writes was not recovered from the runtime's initial data.

## Not exact

* The (c) ring is a 7x6 midpoint ellipse; the runtime `CIRCLE` pixels were not decoded. Its position matches the `C` of the credit line.
* Text is exported as a layer (`text`: 1-based `row`/`col` on the 40x25 grid, colour index 3). The BIOS 8x8 ROM font is not in the EXE, so the remake draws the text with its own font on the original cells.
* The standalone sprite export (`sprites/draw_gato_058d8.png`) shows the prism at full size; in context it is half size.
