# Scenario-file loaders versus `parse_scenarios.py`

Evidence: instruction traces of the compiled program bodies (`trace_tools.py`; file offsets below), the string-literal pool, and the
data files in `Original/`. "Verified" means the loader code and the data agree with `parse_scenarios.py`; "not verified" is stated
explicitly. Register/ds offsets are for the BASIC data segment of each program.

## 1. Summary

| File family | Loader in Gato1.exe | Loader in DEMO.EXE | Verdict |
|---|---|---|---|
| `OBX<n>` | 0xcfcd-0xd0b7 | 0x8120-0x8285 | **Verified** (shape, count, skip of n=2, element size) |
| `MXP` | 0xc613-0xc6b7 | not traced | **Verified** for Gato1 (shape, number type) |
| `ORDXX<n>` | 0xbb40-0xbc20 | `DEMORD` at 0x6dd1-0x6f04 | **Partly verified** (line-oriented, `@` test) |
| `COURXX<n>` | 0xbeb1-0xc118 | none (DEMO has no course file) | **Verified** (rows 1-24 and the trailer read in code; trailer meaning not determined) |

No loader reads binary records or MBF bytes from a file. Every file is read with BASIC `INPUT #` / `LINE INPUT #`, i.e. decimal
text; the single-precision (MBF) numbers exist only in memory after the runtime converts the text. This matches `parse_scenarios.py`
(ASCII, CR LF, one `0x1A` end byte, no binary fields).

## 2. OBX (sprites) - verified

Gato1.exe 0xcfcd-0xd0b7 and DEMO.EXE 0x8120-0x8285 contain the same loop (offsets differ only by the ds layout):

```
FOR V2 = 1 TO 8               ' ds:0x214e (Gato1) / 0x2132 (DEMO), limit constant 8.0
  IF V2 <> 2 THEN             ' compare with constant 2.0 (0x23e0 in DEMO): file OBX2 does not exist
    OPEN "OBX" + STR$(V2) AS #1
    FOR V1 = 0 TO 15          ' ds:0x21de / 0x21be, limit constant 15.0
      LINE INPUT #1, OB$(V1, V2)    ' (reconstruction) 4-byte string descriptor at ds:0xe26 / 0xe06 + 4*(V1*9 + V2)
    NEXT
    CLOSE #1
  END IF
NEXT
```

Checks against the data and `parse_scenarios.py`:

* The loader reads 16 lines per file (`V1` = 0..15) and files `OBX1`, `OBX3`..`OBX8` (V2 = 1..8 without 2). The data matches: 7 files,
  each with exactly 16 non-empty lines, each starting with `C0`. `OBX2` does not exist in `Original/`.
* Element size is 4 bytes (`shl bx,1; shl bx,1`): a BASIC string descriptor, so the lines are stored as strings, not parsed. The
  strings are `DRAW` macros, as `parse_scenarios.py` assumes (`format = draw_sprite`, 16 frames).
* The 2-D array has a row stride of 9 (`imul` by 9, i.e. an array dimensioned (15, 8) with 9 type slots 0..8). The exact index
  order (frame-major) follows from the multiply, but the disassembly around the `xchg` after the multiply is awkward, so treat the
  order as likely rather than proved.
* After the loop DEMO assigns the three island `DRAW` strings (`C3BR9...`, `C3BR26...`, `C3BR16...`, 113/129/110 characters) and `C0BR1`
  to string variables at ds:0x211a-0x2126. These are the embedded pictures exported by `export_sprites.py`.
* The object numbers 1 and 3..8 are the type codes of the scenario files (`1` island, `3..8` ships), consistent with `OBJECT_NAMES`.

## 3. MXP (chart / island table) - verified

Gato1.exe 0xc613-0xc6b7:

```
OPEN "MXP" AS #3
FOR V2 = 1 TO 20
  FOR V1 = 1 TO 6                 ' limits 6.0 (0x25ee) and 20.0 (0x2652)
    INPUT #3, M(V1, V2)           ' single-precision array, 4 bytes/element, base ds:0x1eee, row stride 21
  NEXT
NEXT
CLOSE #3
```

* The file has **20 rows x 6 numbers**, exactly what the loader reads. `parse_scenarios.py` reads it as one row per quadrant
  (20 = 5 x 4 grid) with 6 columns (centre x/y, two radii, two attributes), which agrees with the loader's shape.
* The array stride of 21 (`imul` by 0x15) means the BASIC array is dimensioned (6, 20) with index 0 unused.
* Number type: **4-byte single-precision MBF in memory** (INPUT converts decimal text). Values such as `7500`, `666`, `-1` are
  stored as floats. On disk they are plain text; `parse_scenarios.py` keeps them as numbers, which is the right model.
* Meaning of the last two columns: **island picture index (1..3) and its DRAW scale**, read at Gato1.exe 0x0c9b2 (section 8).

## 4. ORDXX / DEMORD (orders) - partly verified

* Gato1.exe 0xbb40-0xbc20: concatenates `"ORDXX"` with the scenario-number variable (ds:0x234a; concatenation routine at 199b:11f2),
  opens the result as file #1, loops `WHILE NOT EOF(1)` and uses `LINE INPUT #1` into a string at ds:0x2372. The program compares
  a substring of the line with the literal `"@"`.
* This is consistent with the data: every `ORDXX` file begins with `@` (the classification line, e.g. `@  SECRET`) and the
  character occurs once per file; the rest are free-text lines (`TO:`, `FROM:`, body) with blank lines between them.
* DEMO reads `DEMORD` the same way (0x6dd1-0x6f04: OPEN #1, `WHILE NOT EOF`, `LINE INPUT #1`, compare with `"@"`); its file has no `@`
  line, so the demo prints the text as is.
* Not verified: how the program uses the `@` line afterwards (the classification text is likely printed in a different style), and
  the exact screen layout of the orders.

## 5. COURXX (courses) - verified by code

Gato1.exe 0xbeb1-0xc118 (code from `analysis/gato1_pcode_slice.txt`, read by hand and with `decode_gato1_slice.py`):

```
OPEN "COURXX" + STR$(n) AS #1                        ' concat 0xbec3, OPEN 0xbed3
FOR K = 2 TO 8: INPUT #1, TYP(K): NEXT               ' row 1   ds:0x1daa
FOR K = 2 TO 8: INPUT #1, X0(K): X(K) = X0(K): NEXT  ' row 2   ds:0x1cf6 -> ds:0x1d3e
FOR K = 2 TO 8: INPUT #1, Y0(K): Y(K) = Y0(K)        ' row 3   ds:0x1d1a -> ds:0x1d62
                Z(K) = 0: NEXT                       '         ds:0x1cae cleared (meaning inferred: progress/leg counter)
FOR W = 1 TO 7                                       ' var ds:0x214e, limit constant ds:0x271e
  FOR J = 1 TO 3                                     ' var ds:0x21de, limit constant ds:0x2564
    FOR K = 2 TO 8: INPUT #1, A(J, W, K): NEXT       ' rows 4-24, array ds:0x179e, offset ((J*9 + W)*9 + K)*4
  NEXT: NEXT
INPUT #1, V1, V2, V3                                 ' trailer row -> ds:0x2246, ds:0x2242, ds:0x226a (0xc0f6-0xc118)
```

Verified from the code:

* The K loops start at 2.0 and end at 8.0 (ds:0x260a): **7 values per row, stored in ship slots 2..8**. Slot 1 is not read
  from the file (presumably the player's own submarine; inferred).
* Rows 1-3 are type, start x and start y; start x/y are copied into working position arrays, as `parse_scenarios.py` reads them.
* Rows 4-24 are **waypoint-major**: for waypoint W = 1..7 the three rows J = 1, 2, 3. J = 1/2/3 is x/y/speed by the data (coordinates,
  coordinates, knots); the loop limits 3 and 7 are not in the slice and are inferred from the 21 rows. The speed row is stored with
  its waypoint, as `parse_course` assumes.
* The trailer is one `INPUT #1` with three single-precision items stored in ds:0x2246, 0x2242, 0x226a. That the first file value
  goes to the first variable is assumed.
* All numbers are read as decimal text (`INPUT #`) into 4-byte singles; nothing binary.

The meaning of the three trailer variables is resolved in section 8 (they are read far outside the 0xbc00-0xc650 slice, in the
main loop at 0x06fef and 0x07bf8). The question whether speed row W applies to reaching or leaving waypoint W is also answered
there: it applies while travelling **to** waypoint W.

## 6. Morse dispatcher (orders text) - verified by code

Gato1.exe 0xbc00-0xc610, decoded by `decode_gato1_slice.py` and written to `remake/src/data/audio_tables.json` (`morse`).

* The printer reads each `ORDXX` line one character at a time and runs an `ON v GOSUB` with 36 entries (runtime 199b:1def, call at
  0xbe4a, count 0x24, 16-bit program offsets; file offset = 0x3a00 + program offset). Each branch is a list of `GOSUB`s to four tone
  subroutines and a `RETURN` to 0xbe98.
* The four subroutines at 0xc5d5/0xc5e4/0xc5f3/0xc602 are one PLAY each: `B32P62` (dit), `B10P62` (dah), `B32P62B10P62` (dit-dah),
  `B10P62B32P62` (dah-dit).
* **All 36 branches (A-Z, 0-9) decode to International Morse exactly** (checked by the script).
* Timing (standard PLAY rule, tempo 120): dit 0.0625 s + 0.032 s rest, dah 0.2 s + 0.032 s rest; ratio 3.2 (tone only) or 2.45 (with
  rest). Foreground PLAY, no inter-letter or word gap other than the rests.
* Character handling (`morse.text_to_morse`): `v = ASC - 64`; digits accepted only when the SOUND setting ds:0x09e2 = 1 and mapped to
  27..36; letters need ds:0x09e2 <> 0; the difficulty level ds:0x2256 < 8 prints the character, otherwise it is hidden and a 340-step
  delay runs (so at difficulty 8 and 9 the orders must be copied from Morse); a key press stops the sound and abandons the orders;
  the last character of each line is not sounded.
* Resolved in section 8: ds:0x09e2 = SOUND on/off, ds:0x2256 = DIFFICULTY LEVEL. Open: the PLAY runtime's staccato handling.

## 7. Open items

* Index order of the OBX string array (see section 2).
* Control-room (compartment 7) and conning-tower (compartment 8) damage have no effect in the code that was read (they are displayed only).
* Radio messages (variable ds:0x1dd6), the quadrant/chart screens and the log screens were not ported.

## 8. Variables resolved while porting the simulation

The compiled program was re-read as pseudo-BASIC with `analysis/decompile_gato1.py` (symbolic execution of the glue code over the
statement stream from `list_statements.py`; output `gato1_basic.txt`). Runtime conventions it relies on are listed at the top of that
script (single-precision `[si]*[di]`, `[si]/[di]`, **37c4 = COS, 37df = SIN**, 2f2e = ATN, 1def = `ON..GOSUB`; all angles are
mathematical angles in radians, 0 = east, counter-clockwise; x += speed*COS(h), y += speed*SIN(h)).

| Variable | Meaning | Evidence |
|---|---|---|
| ds:0x2246 (`trailer[0]`) | island quadrant that is the mission objective (0 = none) | 0x06fef: speed = 0 AND quadrant (ds:0x224a) = this AND TIME OF DAY = `trailer[1]` AND 200 + inner radius > distance to the island -> "CONTACT MADE / MISSION COMPLETED"; then 0x070f4 overwrites it with 1 |
| ds:0x2242 (`trailer[1]`) | required TIME OF DAY for that objective (1 day, 0 night) | same condition compares it with ds:0x21ca, the GAME CONTROL "[3] TIME OF DAY" setting; ORDXX7 says "SUGGEST NIGHT RESCUE" and COURXX7 has 0 |
| ds:0x226a (`trailer[2]`) | highest convoy slot: mission complete when every ship in slots 3..`trailer[2]` is sunk | 0x07bf8-0x07d9f: slots with 2 < k <= `trailer[2]` and y < -900 decrement a counter, any survivor resets it to 10; the counter < 0 prints "YOU HAVE SUCCESSFULLY COMPLETED YOUR MISSION". Sunk ships are moved to y = -2000 (0x095e4) |
| ds:0x09e2 | SOUND setting, 1 = on (initialised to 1 at 0x03ae1) | GAME CONTROL "[2] SOUND" prints it and toggles it with `(x + 1) MOD 2` (0x0b0a8); every SOUND duration is `3 * ds:0x09e2` or `ds:0x09e2`, so 0 mutes; the Morse dispatcher requires it |
| ds:0x2256 | DIFFICULTY LEVEL, clamped to 0..9 (0x0b051-0x0b098) | GAME CONTROL "[1] DIFFICULTY LEVEL". Used as: enemy speed = difficulty + row speed; flee speed 7 + d, chase speed 10 + d; detection numerator 2 + d + periscope; alert length 45 + 15 d; depth-charge chance 0.1 + 0.03 d; torpedo-hit survival chance d/12; orders hidden when >= 8 |
| ds:0x21ca | TIME OF DAY, 1 = day (default), 0 = night | GAME CONTROL "[3]", toggled with `(x + 1) MOD 2`; scales ship detection `(0.2 + tod)` |
| ds:0x2382, ds:0x2386 (MXP columns 5, 6) | island picture index 1..3 and its DRAW scale | 0x0c9b2: `"S=" + STR$(col6) + "X" + A213a(col5)` draws one of the three island DRAW strings |

Answer to "does the waypoint speed apply to reaching or leaving a waypoint": reaching. When a ship arrives (|dx| and |dy| <= 20) it
increments its counter, loads target = waypoint[counter] and sets `speed = difficulty + speed_row[counter]` (0x07a03-0x07a7b); it then
holds that heading and speed (heading is only recomputed on arrival) until it arrives at the next one. After waypoint 7 the subtender
and patrol boats (type 7) restart at waypoint 1, every other ship stops. (0,0) waypoints are not skipped; they are targets like any other.

Compartments (damage array A177a[1..8], from the damage-report layout at 0x0a652-0x0a7b8 and the use of each cell):
1 radio room (no radio messages), 2 torpedo room (cannot fire), 3 battery room (+0.5 battery drain per step), 4 fuel tanks (+5 fuel
drain per step), 5 engine room (ordered speed x 0.5), 6 periscopes (scope is blind), 7 control room, 8 conning tower (no effect found).
More than 5 damaged compartments destroys the boat (0x05be4); the sum of the damaged compartment numbers above 14 sounds an alarm every
second step and above 20 loses the boat at such a step (0x06441-0x065b6). Depth charges set one random compartment (0x0d226).

## 9. Port notes: what `remake/src/core` implements and how faithful it is

* **Verified formulas (read from the code, constants named with their offsets in `constants.ts`)**: ordered speed = (N - doors) *
  (1 - 0.5 engine damage) * engine; speed +0.25 / -1 per step; rudder +-0.005 * speed per step; heading wrap at 6.28; position clamp
  and island collision `depth + e <= 1 + depth^1.001`; fuel, battery and oxygen drain and diesel charging; crush probability
  `-0.04 + 0.000112 depth` below 350; ship detection chance; evade/pursue turns (0.028 / 0.035); waypoint traversal; torpedo speed 17,
  range 960, three sub-steps per step, hit ellipse `9.9 + cos^6 * 18` (patrol boat `9.24 + cos^6 * 14`); depth charges; scope windows;
  radar range 1350; resupply at the subtender (range 150).
* **Faithful quirks kept on purpose**: the heading wraps to 0 / 6.28 instead of modulo 2 pi; `ds:0x23a6` is the runtime's expression temporary, not an unassigned variable (corrected in the third audit: `headingsAligned` in `physics.ts` makes the tender-alignment test of the resupply condition real, `turnsPositive` in `ai.ts` makes ships turn the short way round - see section 10); damaged ships are marked by speed 1.75;
  an animated hit can be survived with probability difficulty/12 and can destroy the own boat when the target is closer than about 22
  units; hits outside the visible scope sink the target directly.
* **Remake choices (not in the original)**: the step rate (2.5 per second at 1x, see the README's "Pacing"; core default for headless use 10); durations of the resupply loops (their original
  timing depended on the CPU); the damage alarm interval in steps; demo page durations (`demo_script.json`, estimated).
* **Not decoded / not ported**: radio messages, quadrant map and chart drawing, log screens, the PLAY note frequencies and the
  explosion animation timing. DEMO.EXE is modelled as a narration script (it does not run the simulation).

## 10. Audit of the remaining GATO1 edge cases (`ds:0x23a6`, compartments 7 and 8)

**`ds:0x23a6` is the runtime's expression temporary, not a variable.** Evidence (all `Gato1.exe` file offsets):

* Eight places hold the bytes `a6 23`. Seven are operands: `mov si,0x23a6` at `0x719e`, `0x76bc`, `0x77c6` (comparisons), `mov dx,0x23a6` at
  `0x6575`, `0xb674`, `0xb7a0` (the duration argument of `SOUND`), `mov bx,0x23a6` at `0xca62` (the quadrant map's ring). The eighth, at
  `0x3a13`, is the program header `a6 23 d0 23 32 34`, which sits next to `0x23d0`, the start of the constants. Nothing stores to the address by
  name, and the runtime never refers to it either.
* Every use is directly preceded by a value computed into the floating accumulator (`FAC`, `ds:0x00b2`) and a call of runtime routine `0x132b`
  that copies `FAC` to memory and loads the operand at `di` (`0x132b` followed by an inline byte and the compare routine `0x1ac8`). The
  first operand of a comparison is therefore fetched from the temporary. That is what a compiler without common-subexpression handling does
  with `X < a OR X > b`, where `X` is evaluated once and kept.
* The quadrant map shows it works that way: `x = cx + COS(v23a6) * inner * 0.064` can only be the dot angle `i * 0.1571`, as the elliptical
  ring of the screenshot `2660548` proves (with a constant 0 all 40 dots would sit in one vertical line).

What each use means:

| Use | Statement | Meaning |
| --- | --- | --- |
| `0x07153` (resupply entry) | `IF dist(tender) < 150 AND fuel < 35950 AND (ABS(h_tender - h_boat) < 0.393 OR ABS(h_tender - h_boat) > 5.887)` | `ds:0x1eae` is `A1ea6[2]`, the tender's heading, `ds:0x219a` the boat's heading. The tender must be on a roughly parallel course (within pi/8, also across the 0 / 2 pi wrap) before the resupply loop at `0x0cd8e` starts. The loop itself has no alignment test. |
| `0x0768f`, `0x07799` (ship steering) | `IF (phi < 0 AND ABS(phi) < pi) OR (phi > 0 AND ABS(phi) > pi)` with `phi = heading - bearing` (`ds:0x225e`) | the shortest-turn test: the ship turns the short way round. Before this audit the port read the temporary as 0, which sent a ship with `phi < -pi` the long way round. |
| `0x0655c`, `0x0b656`, `0x0b782` (damage alarm, sub-lost sweeps) | `SOUND freq, 0.05 * ds:0x09e2` | the duration is the temporary holding `0.05 * SOUND flag`; with sound off it is 0 and nothing is heard. How the runtime converts such a short duration to timer ticks was not traced, so the remake's alarm and sub-lost sounds stay inferred. |
| `0x0ca22` (quadrant map ring) | `COS(i * 0.1571)` | as above |

Port changes: `RESUPPLY.alignmentLow` / `alignmentHigh` in `constants.ts`, `headingsAligned()` in `physics.ts` (used by `Simulation.stepResupply`), the
corrected `turnsPositive()` in `ai.ts`, with tests in `core.test.ts`. The integration test of the depth-charge loss no longer expects six
charges: with the short-way turns the destroyers need fewer passes, and the boat is lost either by more than five damaged compartments or by an index sum above 20.

**Compartments 7 (control room) and 8 (conning tower).** `A177a` is addressed by `A177a[CINT(v214e)]` loops and by direct cells `ds:0x177e` ... `ds:0x179a`
(compartment `k` at `0x177a + 4k`). Direct reads: 1 radio `0x0ba4a` (radio room, `M`); 2 torpedo room `0x07fbd` (no firing); 3 battery `0x07239`;
4 fuel `0x071d1`; 5 engine `0x054c5`-`0x055c9` (ordered speed x (1 - 0.5 d)); 6 periscopes `0x0515e` (and set to 1 at `0x06f79` when a ship within 20 units meets a raised scope at depth < 61, which is the remake's scope-ram rule). Cells 7
(`0x1796`) and 8 (`0x179a`) are read only by the damage report (`0x0a428`, `0x0a75a`, `0x0a77e`) and by the two loops over all eight cells: the damaged
count at `0x05b80` (more than 5 destroys the boat) and the index sum at `0x06459` (above 14 an alarm, above 20 the boat is lost). Depth charges write a random cell 1..8
(`0x0d226`). So 7 and 8 never change a control; they only raise the two totals. `physics.ts` already summed all eight cells, so nothing changed there; a test now pins this.

**`GAME CONTROL` item 5 and the title wipe** are remake additions: see `remake/README.md` and `title_art.md`.
