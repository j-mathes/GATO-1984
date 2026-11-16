# DEMO.EXE: sequence and layout

Findings from `demo_statements.txt` (file offsets), the strings of `DEMO.EXE`, `Original/DEMORD` and the DOSBox captures `reference_screenshots/Demo01.png` ... `Demo05.png`. Exporter: `export_demo_script.py` -> `remake/src/data/demo_script.json`.

## Order of the program

1. `0x0261a` set-up: `SCREEN 1`, `WIDTH 40`, `COLOR 8,1` (grey `#555555` background, bright palette 1 so the text is white), the sprite `GET`s of the control room, `CLS` (`0x02d0e`).
2. **Intro page** (`0x02d14`-`0x02d63`): three `LOCATE`/`PRINT` pairs. There is no key wait and no delay loop after it: the page is on screen while the program goes on to load its data (`GOSUB 0x815f` reads the `OBX` ship files, `GOSUB 0x75e5` the `MXP` map), so its time on screen was the loading time of a 4.77 MHz PC. `KEY(1)` and `KEY(2)` are switched on and `ON KEY` handlers installed (`0x02dab`, `0x02db7`): F1 leaves the program, F2 turns the sound off, as the page says.

   | LOCATE row, col | text |
   | --- | --- |
   | 7, 12 | `GATO DEMONSTRATION` |
   | 10, 5 | `PRESS FUNCTION KEY 1 (F1) TO EXIT` |
   | 12, 2 | ` FUNCTION KEY 2 (F2) TO TURN OFF SOUND` (the leading space puts F at column 3) |

   `Demo01.png` agrees: grey background, white text, nothing else on the screen. The F1/F2 text appears nowhere else in the program.
3. **Morse example** (`GOSUB 0x4704` = file `0x06d04`, called at `0x02dcb` straight after the intro's set-up). The subroutine is the same orders printer as in `GATO1.EXE`: `SCREEN 0,1` (40-column text), `COLOR 0,7,1` (black on light grey `#aaaaaa`), `OPEN "DEMORD"`, `LOCATE 24,1: PRINT` of 40 spaces, then for every line of the file: a blank line prints two newlines, otherwise each character is printed and its letter sent with the `PLAY` strings `B32P62` / `B10P62` (the four subroutines at `0x075a9`-`0x075d6`; the digits are only sent with the sound flag on). Any key (`INKEY$` at `0x06fe8`) stops it; when the file ends a delay loop of 5000 passes (`0x07148`) waits for a key before `SCREEN 1,0` / `COLOR 8,1` and `RETURN`. The first branch of the subroutine (RADIO ROOM / REPORTS HEAVY DAMAGE) needs `ds:0x175e` > 0, which the demo never sets, so those texts are not part of the show.
   * `DEMORD` is `   THIS IS AN EXAMPLE OF HOW YOU`, an empty line, `   RECEIVE YOUR ORDERS.` (the file has three leading spaces on both text lines; Ctrl-Z at the end).
   * The screen is black above a light-grey band because text mode only colours the cells that are printed or scrolled in. Printing the 40 spaces on row 24 wraps and scrolls once, the newline scrolls again, the blank line scrolls twice more, so after the last line rows 20-24 are grey with the two text lines on rows 22 and 24 and row 25 never touched. This reproduces the band geometry and text rows of `Demo02.png` (band from y = 304 to 384 of 400; row 25 black).
4. **Narrated pages** (from `0x04084` on): each page fills a box at the top with the background colour (`LINE (5,5)-(314,y),0,BF`, `y` = 50, 40 or 35 as the page needs; the text colour is the default foreground, white) and prints its lines on their cells, e.g. page 1 at rows 2, 4, 5, 6, columns 9, 3, 5, 7. `Demo03.png`-`Demo05.png` show the box at x = 5..314, y = 5..50 with the control-room grey and the chart's green. There is no F1/F2 banner after the intro. Pages without a box are the text of the screen being shown (damage report labels, GAME CONTROL, the captain's log); the remake leaves those to its own screen drawing.

Immediates of 0x100 or more are printed by `list_statements.py` as `v0xxx`: `v013a` is 314, `v013d` 317, `v013f` 319.

## Not exact

* Every duration: the intro (4 s, the loading time), the Morse speed (the dit/dah lengths of the remake's `PLAY`), the closing hold (5000 passes at the nominal 2500 passes a second = 2 s) and the page holds.
* The key rule "any key skips the intro" (remake convenience).
* The order of the narrated pages follows the file, which is also the program's drawing order but was not traced through every `GOSUB`/`GOTO`.
* The original orders printer is also what `GATO1.EXE` uses for the mission briefing (`Original` capture `2660312`: the same black screen with a growing grey band); the remake's briefing screen does not use this text-screen model yet.
