# GATO1 screens: exact layouts of the instrument panel, damage report, radar, chart, quadrant map and log

Extracted from `Original/Gato1.exe` (program offset + `0x3a00` = file offset; listings `gato1_basic.txt`, `gato1_statements.txt`) by [export_cockpit_layouts.py](export_cockpit_layouts.py), which replays the p-code statements with the title exporter's graphics interpreter ([export_title_art.py](export_title_art.py)). Output: `remake/public/assets/cockpit_layouts.json` (+ previews in `remake/public/assets/cockpit/`). [verify_cockpit_layouts.py](verify_cockpit_layouts.py) compares the static layers with the screenshots in `reference_screenshots/`.

Every screen is a static layer (2 bits per pixel, base64, with the palette of the screen's `COLOR`), a text layer (`LOCATE row,col` cells; the BIOS font is not in the EXE, so text is drawn by the remake's font on those cells) and a `dynamic` block with the coordinates and formulas of what moves.

## Result of the comparison with real screenshots

| Screen | Screenshot | Differing pixels | Remaining differences |
| --- | --- | --- | --- |
| Damage report | `2658844` | **0** of 3489 | - |
| Damage report, torpedo room + periscopes damaged | `2665438` | **0** of 3789 | - |
| Captain's log (flag) | `2661310` | **0** | - |
| Quadrant map (frame, ticks) | `2660548` | **0** | island/trails are dynamic |
| Control room panel | the user's capture | **0** of 3790 (live remake render vs capture) | text glyphs only |
| Chart | `4518765` | 277 of 60846 | un-erased trails of the boat and ships |
| Radar | `4519144` | 130 of 3969 | sweep line and ship trails |

## Runtime routines (Gato1.exe numbering)

`297b` LINE start, `2981` LINE, `298a` BOX, `29c3` BF, `2a09` PSET, `325c` DRAW, `30d4` PAINT, `33ea` CIRCLE aspect, `33fe` CIRCLE, `2a48/2a4e/2a54` GET, `2abb` PUT (action -1 XOR, 0 PSET, 1 PRESET), `0df6/0e10` COLOR background,palette, `1257/1271` LOCATE row,col, `0d79` CLS, `3984/364a/3640` PRINT USING / numbers. Same routines as Gato.exe with other offsets.

* **CIRCLE** is the runtime's integer circle (`0x2134-0x219c`, plot `0x21fd`, scaler `0x2284`): Bresenham in unscaled integers, minor axis scaled by the 8.8 fixed-point aspect `S = aspect*256` (`(v*S+128)>>8`); eight points per step. Reproduced exactly (this is what makes the damage screen pixel-exact).
* **LINE** is the DDA at `0x2c0e`; **PAINT** fills until the border colour; **DRAW** scale persists between statements.
* Default CIRCLE/BOX colour (omitted argument): white on the `COLOR 8,1` screens, but the radar ring is colour 1 in the screenshot (`COLOR 0,1`); the default colour after `COLOR` was not traced, the radar uses 1 by observation.

## 1. Control room (program `0x042a8-0x05077`, sprite arrays `0x03b40-0x040dd`)

`COLOR 8,1` (dark grey background, bright palette 1: cyan `#55ffff`, magenta `#ff55ff`, white). At start-up the program draws small pictures on a scratch screen and `GET`s them: ten digit sprites (DRAW string `0x12d0e` from pen (160,100), boxes `(159..206, 96..100)`), the empty light (CIRCLE r6, aspect .9), the filled light (magenta r4 disc, aspect .8, PAINT 2/2, inside the ring) both `GET (154,94)-(166,106)`, the 7x7 magenta tube box, the engine-mode texts and the BIOS glyphs `CHR$(16)` (oxygen marker) and `CHR$(24..27)` (scope-facing arrows).

| Element | Statements |
| --- | --- |
| scope picture | BF `(0,0)-(319,horizon)` colour `ds:0x21ca` (1 day / 0 night), BF `(0,horizon+1)-(319,97)` colour 2; horizon `ds:0x2152 = 79 - 4*depth`, 79 with the periscope up above depth 46, -1 below 0 (all sea) |
| damaged raised periscope | BF `(1,1)-(318,96)` colour 0, BOX `(0,0)-(319,97)` colour 3 (`0x05187`) |
| frames | BOX `(0,100)-(319,196)`; dials `(2,102)-(205,178)`; torpedoes `(209,150)-(295,178)`; oxygen `(299,112)-(309,178)`; torpedo count `(229,166)-(249,176)`; tubes `(252,166)-(292,176)` with separators x = 262, 272, 282; power `(61,181)-(113,193)`; FUEL/BATT value boxes `(246,102+16i)-(280,112+16i)` |
| dials | centres (36,135), (103,135), (170,135): CIRCLE r4 and r32, aspect .9; ticks cyan from radius (27,26) to (30,29) every 18° (depth, speed; skipped at 15,6,10,4,5 / 15,10,5) and 22.5° (heading; skipped at 12,8,4) |
| numbers | digit sprites XOR-put at the 28 positions listed in the JSON (`0` at the tops, 300/100/200, 15/5/10, 270/90/180, O2 scale 2/1/0) |
| lights | CIRCLE r6 at (289,107), (289,123), (289,139), (219,171), (200,187); r8 at (283,187); filled by PUT of the filled-light sprite at (283,101), (283,117), (283,133), (213,165), (194,181) |
| needles | depth `(36+sin(d*0.0157)*26, 135-cos(d*0.0157)*22)`; speed `(103+sin(s*0.31)*26, 135-cos(s*0.31)*22)`; heading `(170+cos(h)*26, 135-sin(h)*22)`, colour 3, then hub CIRCLE r4 |
| oxygen marker | PUT at `(300, 174 - CINT(oxygen*0.043))` |
| tubes | ready box PUT at `(244+10*tube, 168)`; digits 1-4 XOR-put at (256,169), (266,169), (275,169), (284,169): white on magenta, cyan on black |
| labels (`LOCATE row,col`) | POWER 24,3; DAMAGE 24,19; SCOPE 24,30; DEPTH 22,3; SPEED 22,11; HEADING 22,19; FUEL 14,27; BATT 16,27; CHARGING 18,27; TORPEDOES 20,28; O 14,39 |
| values | fuel (14,32) = fuel/90, battery (16,32), torpedoes (22,30) (PRINT USING `####`/`##`) |
| engine mode | PUT at (63,183): DIESEL normal, ' ELEC' and '  OFF ' inverted (PRESET) |
| scope arrow | facing angle `ds:0x21ae` F 0 / P 1.571 / A 3.142 / S 4.7124: up / left / down / right arrow at (280,184) or (279,184) |

## 2. Damage report (`0x0a307-0x0a7b8`)

`COLOR 8,1`. `CIRCLE (146,60),115` aspect .07 (cyan), then DRAW `C1`+ the three hull strings (`0x13332`, `0x133ec`, `0x134ac`, pen continues), `LINE (30,39)-(120,31)`, dots `PSET (x,49)` for x = 40..240 step 8; labels at rows 16, 18, 20, 22, columns 7 and 25; BOX `(0,100)-(319,199)` and `(2,102)-(317,197)` colour 1; empty lights PUT (XOR) at x = 20/150, y = 118, 134, 150, 166.

| Compartment | Light | Magenta overlay when `A177a[k] > 0` |
| --- | --- | --- |
| 1 Radio | (150,166) | PSET (175,56) + `S4C2U7R12D2R2D5L14` |
| 2 Torpedo room | (20,166) | PSET (7,56) + `S4C2E2R40D3R5D10L2D2BH11L20D1R20BD2L20D1R20BD2L20D1R20` |
| 3 Battery | (20,150) | PSET (79,63) + `S4C2ND5R125D5L12D1L13NU6L25NU6L25NU6L25NU6L12U1L13` |
| 4 Fuel tanks | (150,150) | PSET (210,51) + `S4C2R60L2D1R13L1D1R8D2L2D1L8D1L10DL14D1L45H2U4E2` |
| 5 Engine | (20,134) | PSET (261,64) + `S4C2L25U2L6D4R6U2BL6L5U2L2D4U5L7ND6L1G1D4F1R8U1R2U2` |
| 6 Periscopes | (150,134) | PAINT (124,30) and (130,32), colour 2 border 1 |
| 7 Control room | (20,118) | PSET (100,48) + `S4C2NR53D8R53U8D3R22D3L22` |
| 8 Conning tower | (150,118) | PAINT (124,40) and (124,43), colour 2 border 1 |

The overlays are drawn under the cyan hull; the damaged light is the filled-light sprite (PSET). The JSON stores each overlay as its pixel list.

## 3. Radar, chart, quadrant map, captain's log

* **Radar** (F6, `0x09ce2-0x0a2df`): `COLOR 0,1` (normal intensity: cyan `#00aaaa`, magenta, light grey). Labels HEADING 7,30; SPEED 12,30; DEPTH 17,30; TORP 21,30 (count at 21,34); value boxes `(237,y)-(280,y+10)` and `(235,y-2)-(282,y+12)` for y = 30, 70, 110; frame `(224,23)-(295,140)`; torpedo boxes `(267,156)-(291,170)`, `(269,158)-(289,168)`; CIRCLE (111,100) r = 101, 102, 103 aspect .9 colour 1; BOX `(0,0)-(319,199)`, `(2,2)-(317,197)`; corner octagons (DRAW `S4C3R5F4D5G4L5H4U5E4`) at x = 11, 303, y = 6, 180; own-boat tick `S4C3U4` at (111,102). Sweep `(111+cos(a)*99, 100+sin(a)*89)` colour 2, `a += 0.2`; blips `(111 - sin(b)*d*0.065, 100 - cos(b)*d*0.065)` colour 2 for d < 1350, only at depth <= 45; values at (5,32) heading `(450.0117 - h*57.2958) MOD 360`, (10,32) speed, (15,32) depth.
* **Chart** (C, `0x0b169-0x0b4a3`): `COLOR 18,1` (green background); BF `(3,1)-(317,196)` colour 1; the 12 DATA circles (x, y, r, aspect; `chart_circles.json`) CIRCLE colour 2 + PAINT colour 0 border 2; grid lines y = 1, 50, 99, 148, 197 and x = 2, 65, 128, 191, 254, 317 colour 3; BOX `(0,0)-(319,199)` colour 3. Dots: boat `(x*0.01252, 196 - y*0.009650499)` colour 0, tender colour 0, other ships colour 2 (only for difficulty <= 2). Hidden command: `Z` -> `PASSWORD?` (`PAED`) -> coordinates at LOCATE 1,1.
* **Quadrant map** (Q, `0x0c7d8-0x0cd0c`): `COLOR 17,0` (blue background, palette 0 bright: green, red, yellow); BOX `(0,0)-(319,199)` colour 3, ticks at x = 64, 128, 192, 256 (rows 0-5 and 194-199) and y = 40, 80, 120, 160 (columns 0-5 and 314-319). Position `((x MOD 5000)*0.0638, 199 - (y MOD 5000)*0.0398)`. The island is `DRAW "S<scale>" + A213a[shape]` (MXP columns 6/5) at its centre, PAINT colour 1 border 3, ringed by 40 red dots at `(cx + cos(i*0.1571)*inner*0.064, cy + sin(i*0.1571)*outer*0.04)`; positions are plotted without erasing, so boat (colour 1) and ships (colour 2) leave trails.
* **Captain's log** (L, `0x0aa0f-0x0adf6`): `COLOR 9,1`; flag at x 125..165, y 0..24: BF colour 3, stripe lines every 2 rows colour 2, canton BF `(125,0)-(144,13)` colour 1, stars colour 3 at (127..141 step 2, y 2/6/10) and (126..142 step 2, y 4/8/12). Text: CAPTAIN'S LOG 5,12; header 8,1; rule 9,1; entries from row 11 (name 15 columns, tonnage `######`, six spaces, `LEFT$(date,6)` + the literal `1943`), then a blank row, SHIPS SUNK, TOTAL TONNAGE, a blank row, MISSIONS, COMPLETED.
* **GAME CONTROL** (`0x0aed9-0x0b0d4`): `COLOR 8,1`; title 2,15; items on rows 6-9 with the value at `TAB(34)`; `NUMBER OF ITEM TO CHANGE?` at 13,6; `NEW DIFFICULTY LEVEL?` at 16,6; `(Press RETURN to continue)` at 23,8.

## Not exact / inferred

* BIOS font glyphs: text is drawn with the remake's font on the original cells. The oxygen marker and the down arrow are read from a screenshot; up/left/right arrows are derived from it.
* The default colour of CIRCLE/BOX without a colour argument (see above); PUT actions (-1 XOR, 0 PSET, 1 PRESET) are inferred from their use; `0x2938` (the aspect to fixed-point conversion) was not traced.
* Three white ticks beside the oxygen gauge `(312..319, 127/143/159)` are not in the traced code and are measured from a screenshot.
* The 8x8 text of the log and GAME CONTROL is not scrolled; the original scrolls the whole graphics screen when more than 9 ships are listed.
* Ship pictures in the scope are drawn in colour 0 (line art) by day in the screenshots; the remake tints its outline atlas accordingly. Radar and quadrant trails are optional in the remake (key W, `src/render/trails.ts`).
