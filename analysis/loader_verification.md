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
* Meaning of the last two columns is **not verified** (the loader only stores them; the code that uses `M(5, n)` and `M(6, n)` was not traced).

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

Not determined: what the three trailer variables mean. Inside 0xbc00-0xc650 they are only stored and never read, and the rest of the
program was not available, so `trailer[1]` (1 in scenarios 1-5) and `trailer[2]` (3..9) remain unidentified; `trailer[0]` matches the
objective quadrant in ORDXX5/ORDXX7 by the data only. Also open: whether speed row W applies to reaching or leaving waypoint W.

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
* Character handling (`morse.text_to_morse`): `v = ASC - 64`; digits accepted only when ds:0x9e2 = 1 and mapped to 27..36; letters
  need ds:0x9e2 <> 0; ds:0x2256 < 8 prints the character, otherwise it is hidden and a 340-step delay runs; a key press stops the
  sound and abandons the orders; the last character of each line is not sounded.
* Unresolved: what ds:0x9e2 and ds:0x2256 are (settings), and the PLAY runtime's staccato handling for real tone lengths.

## 7. Open items

* Meaning of the COURXX trailer variables and the MXP columns 5 and 6 (readers not located).
* Index order of the OBX string array (see section 2).
* Variables ds:0x9e2 and ds:0x2256.
