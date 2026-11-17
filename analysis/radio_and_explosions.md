# GATO1 radio/status messages, the torpedo-hit explosion and the lost-boat sequence

Read from `analysis/gato1_basic.txt` (program offset + `0x3a00` = file offset) and `Original/Gato1.exe`. Ported in `remake/src/core/radio.ts` and `remake/src/core/explosion.ts`.

## Radio and status messages: what exists

The GATO1 string pool has **no table of mid-mission radio traffic**: no sighting reports, convoy updates, fuel/battery/oxygen warnings (those are `SOUND` tones only) or periodic Command transmissions. The orders come from the `ORDXX*` files (already ported). The complete set of messages printed during a mission:

| Message | Program offsets | Trigger | Hold (empty `FOR` passes) |
| --- | --- | --- | --- |
| `CONTACT MADE`, then `MISSION COMPLETED` | `0x07046-0x070f4` | speed 0, quadrant = `ds:0x2246`, time of day = `ds:0x2242`, within island inner radius + 200 | 25000, then 10000 |
| `YOU HAVE SUCCESSFULLY` / `COMPLETED YOUR MISSION` | `0x07dc5-0x07e47` | every convoy slot 3..`ds:0x226a` sunk (once, `ds:0x226e`) | 19000 |
| ` No more oxygen ` | `0x072fb-0x07346` | oxygen below 110; boat lost | 19000 |
| `RADIO ROOM` / `REPORTS HEAVY DAMAGE` / `NO MESSAGES MAY BE RECEIVED` | `0x0ba3d-0x0badf` | key M while `A177a[1]` (radio room, `ds:0x177e`) > 0 | 10000 |
| `DTG dd/hhmm ZULU` | `0x0bc0d` | header of the orders (already ported) | - |

Messages are `LOCATE`/`PRINT` text, usually over a black `BF` box ((10,10)-(309,60) for the first three, (0,0)-(319,65) for the radio report); `MISSION COMPLETED` is printed into the box of `CONTACT MADE`. Key M (`0x0d13c`) calls the radio-room routine `0x0ba3d`; with a working radio it goes on to pick a random `ORDXX` file, i.e. it asks for a **new mission** (the French manual: "M: Mission - débuter une nouvelle mission"). The remake shows the current orders again instead (switch 20 in ADVANCED OPTIONS gives a new random mission).

In the original, completing an objective does not end the program (it logs the mission and keeps playing). The remake does the same: the boxed message is shown over the control room, the log is updated, and the simulation keeps running; each of the two objectives (island, convoy) fires once and counts once. The island objective's `ds:0x2246 = 1` is replaced by a one-shot flag.

Port: `RADIO_MESSAGES` (text, LOCATE cells, box, hold passes), `RadioInbox` (queue; a message continued in its box gives way after its hold time, the last message of a box stays until a key press closes it, which is a remake choice: the original holds every box with the delay loop and freezes meanwhile), `Simulation.requestRadioRoom()`, and `{ type: "radio" }` events. The cockpit shows them as the original's boxed text plus a `PRESS ANY KEY` hint on the box's last text row; `radioAlert` (two short tones) is a remake addition and plays only with sound on.

## Torpedo-hit explosion (`0x086dd-0x09c24`)

Subroutine `86dc` (called from `0x08665` and `0x085d7`). Everything is drawn straight onto the scope picture with `BF` boxes, `LINE`, `PSET`; there are no sprites, `PUT` or `PAINT`, and **no `SOUND`** in the routine.

1. `size` = apparent size `A1d86` (doubled for patrol boats); screen x = `160 - sin(a)*(227 + size*(0.5+|sin(frame*0.393)|*1.5)*sign)`; horizon y = `ds:0x2152` (79 - 4*depth).
2. `peak = 4 + size^1.6` (`ds:0x2844`), `step = 1 + peak/15`, `unit = peak/44`.
3. Two passes of a plume (`FOR d = 0 TO peak STEP step`, then `peak TO 0 STEP -step`), each frame preceded by `FOR v = 1 TO 300`. Eleven columns, x from -9u to +10u around the centre, heights 1, .8, .8, .6, .6, .3, .3, .15, .15, .05, .05 of `d`; three splash boxes under the horizon. Colour 2 (flame) while growing; the shrink pass repaints with the sky colour `ds:0x21ca`.
4. A survived hit (`RND < difficulty/12`, drawn after the plume) ends here (`0x092b5`). A ship apparent size over 50 destroys the own boat (`0x092f8`).
5. `min(60, 20 + 2*size)` debris spikes (two white lines from the horizon to a random tip, one black dot), drawn without delay; erased in reverse order; then 14 steps in which each dot falls 6 px and drifts 2 px outward until it reaches the horizon. The ship vanishes (`y = -2000`) and the LOG1 record is written.

Frame counts and the progression are exact. **Durations are not recoverable**: the loops are CPU bound. The remake estimates one empty-loop pass at 0.11 ms (compiled single-precision BASIC on an 8088), the plume frame at 300 passes + 20 ms of drawing (about 53 ms), a spike at 12 ms, an erase at 6 ms, a fall step at 30 ms (`EXPLOSION_TIMING`). A size-9 sinking then lasts about 2.3 s. The original stops the whole game while this plays; the remake lets the world run (switch 32 in ADVANCED OPTIONS holds the world as the original does).

Related correction: the "explosion" and "sub destroyed" sounds are not in this routine. The sub-lost sequence (`0x0b5cd-0x0b920`) sweeps `SOUND SQR(v221e), v23a6` for `v221e = 300..32000 step 300` (17-179 Hz). Correction (see `loader_verification.md` section 10): `ds:0x23a6` is the runtime's expression temporary holding `0.05 * ds:0x09e2`, not a never-assigned variable, so the duration is 0.05 timer ticks times the sound flag (mute with sound off); the remake's boom and sub-lost sweeps remain inferred additions.

## Lost-boat sequence (`0x0b5cd-0x0b923`)

Every way of losing the boat except running out of air jumps to `0x0b5cc` (a damaged-compartment count above 5 at `0x05bf5`, an alarm index above 20 at `0x065b6`, ramming a ship above depth 34 at `0x06f3c`, the crush roll at `0x06feb`, an own torpedo at `0x09309`). Running out of air goes to `0x0b923` directly (`0x07346`), so it has no sequence. The sequence is a screen effect, not a sound only: it floods the screen that was showing with colour 2 of that screen's palette (magenta in the control room) and draws cracks in colour 3 (white). The reference capture `4519015-gato-dos-rule-1-do-not-ram-enemy-ships-blub-blub.png` is one frame of it (cracks across the scope window, the water just below the dials).

The branch at `0x0b5f0` tests `ds:0x21ce`, which is 0 while the control room is on screen (set at `0x042ba`) and 1 while the radar, chart, map or another screen is (`0x09c6d`, `0x0a345`, `0x0b190`, `0x0c822`):

| `ds:0x21ce` | Drawing |
| --- | --- |
| 1 (other screens) | `FOR y = 199 TO 3 STEP -3`: `LINE (0,y)-(319,y-4),2,BF`, 66 bands of five rows, each followed by the SOUND sweep `SQR(1400)` to `SQR(32000)` Hz (37 to 179, `v221e` in steps of 300, `0x0b656`) |
| 0 (control room) | `PSET (293,0),3 : DRAW` and `PSET (32,140),3 : DRAW` first; then `FOR y = 199 TO 0 STEP -1`: one pass per row. In the order of the code: the crack at y = 170, the sound sweep when y is a multiple of 4, the crack at 188, `LINE (0,y)-(319,y),2`, then the cracks at 190, 178, 145, 155 and 140. The nine `DRAW` strings are in `remake/src/core/sinking.ts` (`CRACKS`) with their start points |

The `DRAW` strings use `S4` (scale 1:1), `A0`/`A2` (the second crack at y = 170 is turned half a circle), `C3`, `B` and `N`. The water of a pass is drawn after the cracks of earlier passes and so covers them as it rises; the cracks of a later pass lie on top of it. The start points `v0125`, `v013f` are the immediates 293 and 319 (`0x125`, `0x13f`; the decompiler lists words above 255 by their data-segment spelling).

After the loop the program updates the log (`0x0b924`), clears the screen (`rt_0d79`, the call that precedes every screen change in this program) and asks `DO YOU WANT DO PLAY AGAIN? (Y/N)`.

The time is not in the file: the loops are paced by the CPU (and by the `SOUND` calls, whose duration is the runtime temporary described above). `core/sinking.ts` spreads the 200 passes over 2.5 s (`SINKING_TIMING`), an estimate. Ported in `core/sinking.ts` (pure timeline over a 320 x 200 overlay) and `core/drawString.ts` (the `DRAW` interpreter); switch 41 of ADVANCED OPTIONS skips it.
