# GATO remake

A browser remake of *GATO* (1984, Spectrum HoloByte; Paul Arlton and Ed Dawson), a WWII submarine simulation originally written in compiled IBM BASIC. The rules and numbers come from reverse-engineering the original DOS binaries.

Stack: Vite, strict TypeScript, native Canvas 2D (320×200, 4-colour CGA look), Web Audio (square-wave PC speaker). No game engine.

## Running

```
npm install
npm run dev        # dev server at http://localhost:5173
npm test           # Vitest (core, integration and app-shell tests)
npm run build      # type-check, then production build into dist/
npm run typecheck  # tsc for the app and, separately, for src/core with no DOM lib
npm run sync:data  # re-copy scenario JSON from ../analysis/json into src/data/scenarios
```

Click or press a key once so the browser allows audio. The game opens on the "Spectrum HoloByte presents" logo (frame `spectrum_logo` of `title_screen.json`), which gives way to the title page after 2.5 s or at once on any key or click; the title page then waits for a key.

### Playing the built game on Windows

- **`Play_GATO.bat`** (in the repository root): double-click it. It installs dependencies if `node_modules` is missing, runs `npm run build` if `remake/dist/` does not exist, starts `npx vite preview --port 4173 --strictPort` in a separate window and opens <http://localhost:4173/> in Chrome (the default browser if Chrome is not found). Close the "GATO server" window to stop. It only needs Node.js and uses paths relative to the script, so the folder can live anywhere. Delete `remake/dist/` to force a rebuild after changing the code.
- **Desktop shortcut:** right-click `Play_GATO.bat` > Send to > Desktop (create shortcut). The shortcut keeps working while the repository stays where it is.
- **`npm run play`** (in `remake/`): builds with `vite build` (no type-check; use `npm run build` for that) and starts the preview server, opening the default browser.

## Display (V)

The default is the authentic 320×200 picture, drawn with `imageSmoothingEnabled = false` and shown at the largest whole-number scale that fits the window. **V** cycles:

1. **Authentic**: integer scaling only.
2. **Fit**: fills the window, keeps the 8:5 aspect ratio.
3. **CRT**: Fit plus a subtle scanline and vignette overlay.

The choice is saved in `localStorage` (`gato.display`). V is ignored while typing in a prompt.

## Controls

| Key | Action |
| --- | --- |
| F1 / F3 / F5 / F7 | Ahead: flank / full / standard / slow (10 / 8 / 6 / 3) |
| F9 / F10 | All stop / reverse |
| F2 / F4 | Raise / lower periscope |
| F6 | Radar |
| F8 | Fire torpedo |
| ← / → | Rudder left / right |
| ↑ / ↓ | Rise / dive (planes) |
| 5 (or Numpad 5) | Centre rudder and planes |
| P / A / S / F | Scope facing: port / aft / starboard / forward |
| D / E | Diesel / electric |
| T | Torpedo doors |
| C | Chart |
| Q | Quadrant map |
| L | Captain's log |
| R | Damage report |
| M | Radio room, then the control room: with a damaged radio room (compartment 1) the "REPORTS HEAVY DAMAGE" message appears; otherwise the orders are shown again (the original requests a new mission here) |
| Tab | GAME CONTROL (items 1–4 as in the original; difficulty takes a typed 0–9). Items 5 and 6 are remake additions: 5 = NEXT MISSION, `1`–`20` or `R`/`0` for the original's random pick (the default), applied when the next mission starts, not to the one running; 6 = TIME COMPRESSION, cycles 1x / 2x / 4x |
| ? or H | Controls quick-reference overlay (remake addition) in five pages: speed and engines, steering, scope and weapons, screens, remake extras (only the extras that are switched on), one key per line. Left/Up/PageUp and Right/Down/PageDown/Space turn the pages; any other key closes it and is not passed on. The world pauses while it is shown |
| [ / ] | Time compression slower / faster: 1x = 2.5 simulation steps a second (the 1984 pace, default), 2x = 5, 4x = 10. A line at the top confirms the change. Remembered in `localStorage` (`gato.timeScale`); also GAME CONTROL item 6 |
| Z (on the chart) | Hidden debug command: type `PAED`, Enter, then `x,y`, Enter to teleport (only while no enemy is alerted) |
| Any key | While a message box is up (mission completed, radio room report) it only closes the box. Orders screen: the first key stops the Morse and shows the whole message (still hidden at difficulty 8 or more), then "PRESS ANY KEY TO CONTINUE" waits for a second key before the control room. In the demo it skips the example |
| Esc | Quit to the launcher |
| V | Display mode |
| W | Wake trails on/off: persistent track dots on the radar, chart and quadrant map (the original's behaviour, default) or clean redraws. Remembered in `localStorage` (`gato.trails`) |

The launcher menu is `1` play, `2` demo, `3` history, `4` exit, and `5` ADVANCED OPTIONS (a remake item, see below). In the demo, `F1` exits to the launcher and `F2` turns the sound off, exactly as the opening page says; as a remake convenience any other key skips the opening page and then the Morse example (the original has no key wait on the opening page).

The log, damage report and GAME CONTROL pause the world; radar, chart and quadrant map do not.

### Advanced options (menu item 5)

Eighteen remake-only additions can be switched back to the 1984 behaviour on a settings screen opened with menu item `5` (two pages of switches): Up/Down select a row, Left/Right change page, Enter or Space switch it (`ON` = remake feature, `OFF` = original), `R` restores the defaults and Esc returns to the menu. The line under the list describes what the selected switch would give if it were changed (`OFF: ...` while it is on, `ON: ...` while it is off). The screen can only be opened from the launcher menu, not during a mission, so changes take effect when the next mission (or the demo) starts, and are saved in `localStorage` (`gato.advanced`). Everything is ON by default except the helm status line, which keeps its current default (off). The switches cover the helm status line, the time-speed pop-up, the `?`/`H` overlay, skipping the logo, GAME CONTROL items 5 and 6, the display modes, the wake-trail toggle, the lost-boat box, skipping the demo intro, `[`/`]`, the `? H W V` hotkeys (a group switch: it sets the help overlay, display modes and wake-trail rows together and turns off by itself when all three are off), Esc, `M` re-reading the orders, the explosion and radio-alert sounds, the 2.5 Hz pace, mission select and the world running during explosions. Rows and what each gives when off are listed in `../analysis/remake_additions.md` (section 5a). Without Esc (row 17) a mission can only end by losing the boat or reloading the page, because a web page cannot end the program as the original does.

A nineteenth switch, CUSTOM CONTROLS (off by default, original keys), lets you reassign the mission keys: with it on, `C` on the ADVANCED OPTIONS screen opens CONTROL ASSIGNMENTS. Up/Down select an action, Enter waits for the new key, Delete blanks it, `R` restores the defaults, Esc goes back. A key that another action already uses gives a warning; Enter overrides it (the other action is left with no key) and Esc cancels. Tab (GAME CONTROL) and Escape (back to the menu) are listed as fixed and can be neither changed nor taken by another action. The assignments are saved in `localStorage` (`gato.controls`) and used only while the switch is on; the help overlay shows the keys in force. The defaults are still the original's keys.

### Pacing: 2.5 Hz simulation, 60 FPS rendering

The original does one pass of its main loop per step and runs it as fast as the CPU allows, so the speed of ships, turning, torpedoes, depth change and the fuel, battery and oxygen drain was whatever a 4.77 MHz IBM PC managed (a floating-point-heavy loop, roughly two and a half passes a second; an estimate, not recorded in the files). The simulation therefore steps 2.5 times a second (400 ms per step) at 1x, with exactly the original's per-step formulas.

Rendering is independent of that: the page draws on every animation frame (60 FPS or whatever the display runs). Positions, headings, depth and speed on the screens are interpolated between the last two steps, so ships, torpedoes, the compass and the gauge needles glide instead of jumping every 400 ms (the picture therefore trails the simulation by one step). Everything the player sets directly (rudder, planes, throttle order, scope facing, doors, engine, screen switches) is applied to the simulation and drawn on the very next frame (for example the torpedo-door circle lights on the dashboard); the boat then answers at the step rate, like the original. A one-line helm status at the top of the screen (`ORDER 8.0  RUDDER MID  PLANES LEVEL`) exists in the code but is off by default, because the original keeps the scope clean; switch it on with `__gato.showControlHud = true` in the console or `localStorage["gato.controlHud"] = "1"`. All remake-only features are listed in `../analysis/remake_additions.md`.

`[` and `]` switch between 1x (2.5 steps a second), 2x (5) and 4x (10) to fast-forward empty ocean; the physics per step is identical at every setting. Remake timings that are in seconds rather than original loop passes (resupply speed, the damage alarm interval) keep their real duration at any rate.

### Wake trails

The original plots the boat and ship positions with `PSET` and never erases them while a track screen is shown, so dots build up on the chart, quadrant map and radar. The remake keeps a small per-screen position buffer (`src/render/trails.ts`), records one dot per simulation step, and empties it whenever the screen is entered again. The radar sweep line and the island blip are not recorded. Demo screens never use trails.

## Pixel-accuracy verification

The control room, damage report, radar, chart, quadrant map, captain's log and GAME CONTROL are drawn from `public/assets/cockpit_layouts.json`, replayed from GATO1's p-code. They were compared with the real captures in `analysis/reference_screenshots/` (`python analysis/verify_cockpit_layouts.py` from the repository root, needs Pillow):

| Screen | Differing pixels | What remains |
| --- | --- | --- |
| Damage report | 0 of 3489 | - |
| Damage report, compartments 2 and 6 damaged | 0 of 3789 | - |
| Captain's log (flag) | 0 of 1025 | - |
| Quadrant map frame and ticks | 0 of 1116 | island and tracks are dynamic |
| Control-room panel, live remake render vs capture | 0 of 3790 | text glyphs only |
| Chart | 277 of 60846 | un-erased tracks, now reproduced with W |
| Radar | 130 of 3969 | sweep line and tracks |

The script's static-layer comparison of the control room reports 0 differing of 261 compared pixels (it only compares the fixed parts); the live-render figure above covers the needles and values as well. Text is drawn with the remake's own font on the original `LOCATE` cells because the BIOS font is not in the executables, and the marker and arrow bitmaps of the control room come from a screenshot.

Test coverage (`src/app/web.test.ts`): every mission screen, GAME CONTROL and the demo's screens are asserted to blit their layer from `cockpit_layouts.json` (and to fall back only when it is absent); the loader is tested with a stubbed `fetch`. Orders and History are text screens that never had a bitmap layout in the original, so they are tested to render without it.

## Layout

- `src/core/` pure simulation with no DOM or Canvas: `physics`, `ai`, `combat`, `simulation`, `launcher`, `demoPlayer`, `scenario`, `types`, `constants`, `rng`. Tests are in `src/core/__tests__/` (unit plus headless end-to-end missions).
- `src/app/` the App shell, the fixed-timestep runner (2.5 simulation steps a second at 1x, rendered at the display's refresh rate with interpolation), orders, history viewer, log store.
- `src/audio/` Web Audio synthesizer, Morse and `PLAY` string parsing.
- `src/input/` keyboard mapping.
- `src/render/` Canvas drawing, sprites, display modes and the CRT overlay.
- `src/data/` JSON extracted from the original files (scenarios, audio tables, history pages, sprites).

## Reverse-engineering summary

Details live in `../analysis/` (`loader_verification.md`, `exe_architecture.md`, `architecture_map.md`, `data_tables.md`).

- **All four executables** are uncompressed (no EXEPACK or PKLITE) programs from the IBM BASIC compiler runtime family. The exact compiler version could not be recovered.
- **GATO.EXE** is only the launcher: a four-item menu (2 → `DEMO`, 3 → `HISTORY`, 4 → exit, anything else → `GATO1`). Programs are chained by the runtime's own loader, not by INT 21h AH=4Bh, and there is no COMMON block or temp file. Difficulty, sound and time of day are in GATO1's GAME CONTROL, not the launcher.
- **GATO1.EXE** is the simulation. Its p-code was decompiled to pseudo-BASIC (`analysis/gato1_basic.txt`). Findings:
  - Scenario files are plain ASCII (no MBF on disk): `ORDXX*` orders, `COURXX*` convoy waypoints plus a 3-value trailer, `OBX*` ship drawings. There are 10 distinct scenarios; 11–20 duplicate 1–10.
  - `COURXX` trailer: `ds:0x2246` = objective island quadrant, `ds:0x2242` = required time of day, `ds:0x226a` = highest convoy slot that must be sunk.
  - `ds:0x09e2` = SOUND on/off. `ds:0x2256` = DIFFICULTY 0–9; at 8 or more the order characters are not printed (the Morse still plays and the blank lines still scroll the grey band).
  - The mission briefing is the same text-mode routine as the demo's Morse example: 40-column text, black on light grey (`COLOR 0,7`), a grey band that grows upwards as lines scroll, the `@` line printed as the rest of the line + 12 spaces + `DTG dd/hhmm ZULU` and sent in Morse like the rest. The remake's briefing screen is checked against capture `2660312` (cell positions of every text row, band rows 6–24, black rows 1–5 and 25; `src/app/web.test.ts`). Row 25 carries a remake hint line (the original program never writes it). The original abandons the orders at the first key and starts the mission right after the last character; the remake instead has a first key complete the message and a second key (or one key after the text finished by itself) continue.
  - Waypoint speed applies while travelling to that waypoint.
  - The world is 25000×20000 in 5×4 quadrants. `LOG1` (92 × 32-byte records) is the only persistent file.
  - Morse: 36 dispatch branches (A–Z, 0–9) matching International Morse, played with `PLAY` strings `B32P62` (dit, about 0.0625 s) and `B10P62` (dah, about 0.2 s).
  - Compartments: 1 radio, 2 torpedo room, 3 battery, 4 fuel tanks, 5 engine, 6 periscopes, 7 control room, 8 conning tower. 7 and 8 are only shown on the damage report: they have no effect of their own, but, like every compartment, count towards "more than 5 damaged" and the index sum (above 14 an alarm, above 20 the boat is lost), so a hit on them is dangerous without changing any control.
  - `ds:0x23a6` is not a variable but, inferred from the code, the runtime's expression temporary: nothing ever stores to it by name, the data-segment header at the start of the program lists `0x23a6` right below the constants (`0x23d0`), and at every use a value was just computed into the floating accumulator and pushed there by runtime routine `0x132b` (the quadrant map's `COS(v23a6)` can only be the dot angle, which the screenshot's elliptical ring confirms). Read that way, it makes the resupply at the subtender require the tender's heading to be within 0.393 rad (pi/8) of the boat's, and ships turn the short way round (`ABS(phi) < pi` test at `0x0768f`/`0x07799`). An earlier port read it as a never-assigned 0 and ignored both.
- **DEMO.EXE** is a scripted slide show, not the simulation (`../analysis/demo_flow.md`). It opens on the grey "GATO DEMONSTRATION" page, which names its only two keys (F1 exit, F2 sound off) and stays up while the program loads its sprite files; then it shows the orders example (`DEMORD`, typed out in black on a light-grey band as its Morse is sent, any key skips it); then it draws the game screens and prints narration in a box at the top of the screen (`LINE (5,5)-(314,y),0,BF`, text on LOCATE cells). Texts, cells and boxes are extracted; all durations are estimates.
- **HISTORY.EXE** is a pager. The encyclopedia text is in the data file `History`, not in the EXE.
- **Graphics:** there are no raw CGA bitmaps. Sprites are BASIC `DRAW` strings (`OBX1`, `OBX3`–`OBX8` hold 16 view-angle frames each), exported as PNG atlases and JSON.
- **Instrument screens:** the control room, damage report, radar, chart, quadrant map, captain's log and GAME CONTROL are drawn from layouts replayed out of GATO1's p-code (`analysis/export_cockpit_layouts.py` -> `public/assets/cockpit_layouts.json`, details in `../analysis/gato1_screens.md`). The damage report and the control-room panel match screenshots of the original pixel for pixel (`python analysis/verify_cockpit_layouts.py`); text is drawn with the remake's font on the original cells.
- **Title screen:** also drawn at run time (`DRAW`/`PAINT`/`LINE`/`CIRCLE`), not stored. `analysis/export_title_art.py` replays the program's drawing statements into `public/assets/title_screen.json`; the striped GATO lettering, credits and the launcher's surfaced-submarine backdrop come from that. The striping is the original's own venetian-blind wipe (43 `LINE (0,Y)-(319,Y),0` statements over the solid `title_letters` frame), which the remake replays line by line before showing the page. Details and what is inferred (palette, the (c) ring, the wipe timing) are in `../analysis/title_art.md`. Regenerate with `python analysis/export_title_art.py` from the repository root (needs Pillow).
- **Sound:** the runtime programs the PIT channel 2 speaker.

## Caveats

- `PLAY` note tables beyond the Morse tones are not ported. GATO1 contains no table of mid-mission radio traffic: the only messages are CONTACT MADE / MISSION COMPLETED, YOU HAVE SUCCESSFULLY COMPLETED YOUR MISSION, "No more oxygen" and the radio-room damage report (`src/core/radio.ts`, details in `../analysis/radio_and_explosions.md`). The radio alert tone is a remake addition.
- Torpedo-hit explosions follow the original's stages and frame counts (`src/core/explosion.ts`), but the original is CPU bound, so their durations in seconds (about 1.5-5 s) are estimated from the empty-loop lengths. The original blocks the whole game while it plays; the remake keeps the world running.
- Sound durations: the damage-alarm and sub-lost sweeps call `SOUND freq, duration` with the duration taken from `ds:0x23a6`, i.e. the temporary holding `0.05 * ds:0x09e2` (the sound flag), so they are mute with sound off; how the runtime rounds a duration that short was not determined, so the remake's alarm, sub-lost and mission-complete sounds are inferred. The original hit animation has no sound, the explosion boom is a remake addition.
- Remake additions that are not in the original: the radio alert tone, the display modes and CRT overlay, wake-trail toggle (`W`), the controls overlay (`?`/`H`), GAME CONTROL item 5 (next mission) and the 2.5 s logo hold (the original's hold is an empty 2000-pass loop whose duration depended on the CPU).
- The original runs unthrottled, one pass of its main loop per simulation step. The remake paces that loop like a 4.77 MHz IBM PC, 2.5 steps a second at 1x; that rate is an estimate, not something stored in the binaries (see "Pacing" above). The display modes and the CRT overlay are remake choices too.
- Mission completion matches the original: sinking the convoy (`YOU HAVE SUCCESSFULLY COMPLETED YOUR MISSION`) or stopping at the objective island at the right time of day (`CONTACT MADE`, `MISSION COMPLETED`) shows a boxed message over the control room, adds to the Captain's Log, and the game goes on; each objective fires once. Leave with `Esc`. The game only ends, with the play-again prompt, when the boat is lost or out of oxygen. Message boxes (completion, radio room damage report) stay until a key is pressed: that key only closes the box (`PRESS ANY KEY` is shown on its last row); `CONTACT MADE` still gives way to `MISSION COMPLETED` by itself after its hold time. The original holds each box with a delay loop and freezes the game meanwhile; the remake waits for a key and keeps the world running. `M` shows the orders again instead of requesting a new random mission.
- Confirm the rights to the original history text before distributing it.
