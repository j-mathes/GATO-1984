# Findings about the original programs

A summary of what the reverse-engineering established about the four DOS executables in `Original/` and how the remake relies on it. The per-topic documents linked from [README.md](README.md) have the evidence; this page says what was found and how sure we are. Offsets are file offsets unless marked `ds:` (the BASIC data segment) or "program offset" (file offset - `0x3a00`).

## The executables

- **All four** are uncompressed (no EXEPACK, no PKLITE) programs of the IBM BASIC compiler runtime family. The exact compiler version could not be recovered. See [exe_architecture.md](exe_architecture.md).
- **GATO.EXE** is only the launcher: a menu (2 -> `DEMO`, 3 -> `HISTORY`, 4 -> exit, anything else -> `GATO1`). Programs are chained by the runtime's own loader, not by INT 21h AH=4Bh, and there is no COMMON block or temporary file. Difficulty, sound and time of day belong to GATO1's GAME CONTROL, not to the launcher.
- **GATO1.EXE** is the simulation. Its p-code was decompiled to pseudo-BASIC (`gato1_basic.txt`).
- **DEMO.EXE** is a scripted slide show, not the simulation: the "GATO DEMONSTRATION" page, the orders example (`DEMORD`), then canned game screens with narration boxes at the top. See [demo_flow.md](demo_flow.md).
- **HISTORY.EXE** is a pager. The encyclopedia text is in the data file `History`, not in the EXE.

## Data

- Scenario files are plain ASCII (no Microsoft Binary Format on disk): `ORDXX*` orders, `COURXX*` convoy waypoints plus a three-value trailer, `OBX*` ship drawings. There are 10 distinct scenarios; 11 to 20 duplicate 1 to 10. See [loader_verification.md](loader_verification.md).
- `COURXX` trailer: `ds:0x2246` = objective island quadrant, `ds:0x2242` = required time of day, `ds:0x226a` = highest convoy slot that must be sunk.
- `LOG1` (92 x 32-byte records) is the only persistent file.
- The world is 25000 x 20000 in 5 x 4 quadrants.
- There are no raw CGA bitmaps. Sprites are BASIC `DRAW` strings (`OBX1`, `OBX3` to `OBX8` hold 16 view-angle frames each), exported as PNG atlases and JSON. The title screen and the instrument screens are drawn at run time too, and were rebuilt by replaying the drawing statements ([title_art.md](title_art.md), [gato1_screens.md](gato1_screens.md)).
- Morse: 36 dispatch branches (A to Z, 0 to 9) matching International Morse, played with `PLAY` strings `B32P62` (dit, about 0.0625 s) and `B10P62` (dah, about 0.2 s). The runtime programs the PIT channel 2 speaker.

## Rules established from GATO1

- `ds:0x09e2` = sound on/off. `ds:0x2256` = difficulty 0 to 9; at 8 or more the order characters are not printed (the Morse still plays and the blank lines still scroll the grey band).
- The mission briefing is the same text-mode routine as the demo's Morse example: 40-column text, black on light grey (`COLOR 0,7`), a grey band that grows upwards as lines scroll, and the `@` line printed as the rest of the line, 12 spaces and `DTG dd/hhmm ZULU`. It is checked cell for cell against capture `2660312`.
- Waypoint speed applies while travelling to that waypoint.
- Compartments: 1 radio, 2 torpedo room, 3 battery, 4 fuel tanks, 5 engine, 6 periscopes, 7 control room, 8 conning tower. Compartments 7 and 8 only show on the damage report: they have no effect of their own but, like every compartment, count towards "more than 5 damaged" and the index sum (above 14 an alarm, above 20 the boat is lost).
- `ds:0x23a6` is not a variable but, inferred from the code, the runtime's expression temporary: nothing stores to it by name, the data-segment header lists it right below the constants, and at every use a value was just computed into the floating accumulator and pushed there by runtime routine `0x132b`. Read that way, resupply at the tender needs the tender's heading within 0.393 rad (pi/8) of the boat's, and ships turn the short way round (`ABS(phi) < pi`, `0x0768f` and `0x07799`). Details in `loader_verification.md` section 10.
- Completing an objective (the island at the right time of day, or the whole convoy sunk) prints a boxed message, logs the mission and carries on; the program ends only when the boat is lost or out of oxygen, or on Esc ([radio_and_explosions.md](radio_and_explosions.md)).
- Losing the boat (except by running out of air) plays a screen effect: white cracks and a magenta water level that rises from the bottom, with a coarser variant on the map and radar screens. The sequence was first missed because only its `SOUND` loop had been read; capture `4519015` shows it ([radio_and_explosions.md](radio_and_explosions.md), "Lost-boat sequence"). Its length is not in the file.

## What is not exact

- **Timing.** The original does one pass of its main loop per step and runs it as fast as the CPU allows, and its delay loops are empty `FOR` loops. No duration is recorded in the files. The remake's 2.5 steps a second at 1x is an estimate for a 4.77 MHz PC; the logo hold, title wipe, explosion lengths, message-box holds and the demo's page timings are estimates too.
- **Text font.** The BIOS font is not in the executables, so text is drawn with the remake's own font on the original `LOCATE` cells. The control-room marker and arrow bitmaps come from screenshots.
- **Sounds.** `PLAY` note tables beyond the Morse tones are not ported. The damage-alarm and sub-lost sweeps call `SOUND freq, duration` with a duration that is a runtime temporary (`0.05 * ds:0x09e2`); how the runtime rounds a duration that short was not determined, so the remake's alarm, sub-lost and mission-complete sounds are inferred. The original torpedo-hit animation has no sound.
- **Radio traffic.** GATO1 has no table of mid-mission radio messages: the only ones are CONTACT MADE / MISSION COMPLETED, YOU HAVE SUCCESSFULLY COMPLETED YOUR MISSION, "No more oxygen" and the radio-room damage report.
- **Hidden command.** On the chart, `Z` opens a `PASSWORD?` prompt (`0x0b4d4`; the password is `PAED`) and then a coordinates prompt that teleports the boat, only while no enemy is alerted. The remake keeps it.

Everything the remake does that the original does not is listed in [remake_additions.md](remake_additions.md).

## Rights

The remake publishes data and artwork extracted from the original files, including the encyclopedia text of `History`. The project's own license ([../LICENSE.md](../LICENSE.md)) does not cover them. Confirm the rights to distribute them before publishing the remake.
