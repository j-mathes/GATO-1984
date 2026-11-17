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
4. **Narrated pages** (from `0x04084` on): each page fills a box at the top with the background colour (`LINE (5,5)-(314,y),0,BF`, `y` = 50, 40 or 35 as the page needs; the text colour is the default foreground, white) and prints its lines on their cells, e.g. page 1 at rows 2, 4, 5, 6, columns 9, 3, 5, 7. `Demo03.png`-`Demo05.png` show the box at x = 5..314, y = 5..50 with the control-room grey and the chart's green. There is no F1/F2 banner after the intro. Pages without a box are the text of the screen being shown (damage report labels, the captain's log); the remake leaves those to its own screen drawing. The captain's-log note about the first group of ships has the box `LINE (0,0)-(314,50)` (`xor bx, bx` for the corner).

## Run order of the narrated pages (traced)

The pages are **not** shown in file order. The program is a loop whose body is chosen by a stage variable (`ds:0x2136`: set to 0 at `0x02dd3`, to 1 at `0x05f6e`, tested at `0x04073`), and the chart, map and radar screens are reached by `GOTO` from the middle of the control-room code (`0x04219` -> `0x062ab`, `0x06715` -> `0x077ab`, `0x07cd9` -> `0x04993`). `list_statements.py` only decodes the runtime calls of `GATO1.EXE` (segment `0x099b`), so the `GOSUB` operands of `DEMO.EXE` (runtime call `0x1da3`; `RETURN` is `0x1dcc`; the target is a program offset, file offset = target + `0x2600`) were never decoded and the narration had been listed in file order. `trace_demo_flow.py` decodes them and walks the program from its entry point (`analysis/demo_trace.txt` is its report): the stage counter, the `FOR` counters and the `IF` tests on them are evaluated exactly; any other condition (keys, the clock, the boat) is decided by a rule and listed in the report.

| Stage | Pages shown (file-order numbers in `demo_script.json`) |
| --- | --- |
| 0 | 1 main screen, 2 "here is the main chart" (still on the control room), 19 and 20 the chart, 22 and 23 the quadrant map, 24 "let's take a look at radar" (on the map; the radar is drawn after it), 8 "not much is happening here" (on the radar), then the captain's log: 13, 14, 15, 16, 17 |
| 1 | 3 "now we are back in the control room", 4 the ship names (FREIGHTER ... DESTROYER, one after another), 5 torpedoes, 6 depth charges, 7 "pay close attention to the damage report" (on the control room; the loop draws and erases a mark at (213,165), probably the DAMAGE lamp flashing), 9 and 10 the damage report |
| restart | `0x05641` `JMP 0x02dca`: the Morse example is called again and the stage is 0 again; the show never ends by itself (F1 leaves) |

Pages 11 ("LAST SHIP IN LOG LIST SUNK / DO YOU WISH TO REVIEW BEFORE DELETION"), 12 ("LOG CLEARED"), 18 (GAME CONTROL) and 21 ("DO YOU WANT DO PLAY AGAIN? (Y/N)") are in the file but nothing in the show reaches them: they are game code that `DEMO.EXE` carries along (the log reset, the GAME CONTROL screen and the end of a lost game inside the chart code) and are listed as `unreached_pages` in the script. `demo_script.json` holds `pages` in run order (each page keeps its file-order number in `page`); the remake plays them once and then returns to the menu instead of starting over.

Immediates of 0x100 or more are printed by `list_statements.py` as `v0xxx`: `v013a` is 314, `v013d` 317, `v013f` 319.

## Not exact

* Every duration: the intro (4 s, the loading time), the Morse speed (the dit/dah lengths of the remake's `PLAY`), the closing hold (5000 passes at the nominal 2500 passes a second = 2 s) and the page holds.
* The key rule "any key skips the intro" (remake convenience).
* The order of the narrated pages is traced (see above); the few branches that depend on keys or the simulated boat are decided by a rule, listed in `demo_trace.txt`. The screen each page is printed over is inferred from the code around the page (what is drawn before and after it) and from its text. The remake does not restart the show.
* The original orders printer is also what `GATO1.EXE` uses for the mission briefing (capture `2660312`); the remake's briefing screen uses the same text-screen model (`src/app/teletype.ts`), including the header line, the cursor and the hidden-text mode of difficulty 8 and 9.
