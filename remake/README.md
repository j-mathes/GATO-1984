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
| Tab | GAME CONTROL (items 1–4; difficulty takes a typed 0–9) |
| Z (on the chart) | Hidden debug command: type `PAED`, Enter, then `x,y`, Enter to teleport (only while no enemy is alerted) |
| Any key | Skips the Morse order broadcast |
| Esc | Quit to the launcher |
| V | Display mode |
| W | Wake trails on/off: persistent track dots on the radar, chart and quadrant map (the original's behaviour, default) or clean redraws. Remembered in `localStorage` (`gato.trails`) |

The launcher menu is `1` play, `2` demo, `3` history, `4` exit.

The log, damage report and GAME CONTROL pause the world; radar, chart and quadrant map do not.

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
- `src/app/` the App shell, the 10 Hz fixed-timestep runner (with interpolation), orders, history viewer, log store.
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
  - `ds:0x09e2` = SOUND on/off. `ds:0x2256` = DIFFICULTY 0–9; orders are hidden at 8 or more.
  - Waypoint speed applies while travelling to that waypoint.
  - The world is 25000×20000 in 5×4 quadrants. `LOG1` (92 × 32-byte records) is the only persistent file.
  - Morse: 36 dispatch branches (A–Z, 0–9) matching International Morse, played with `PLAY` strings `B32P62` (dit, about 0.0625 s) and `B10P62` (dah, about 0.2 s).
  - Compartments: 1 radio, 2 torpedo room, 3 battery, 4 fuel tanks, 5 engine, 6 periscopes, 7 control room, 8 conning tower (7 and 8 have no effect).
- **DEMO.EXE** is a narration slide show, not the simulation. Page timings in the remake are estimates.
- **HISTORY.EXE** is a pager. The encyclopedia text is in the data file `History`, not in the EXE.
- **Graphics:** there are no raw CGA bitmaps. Sprites are BASIC `DRAW` strings (`OBX1`, `OBX3`–`OBX8` hold 16 view-angle frames each), exported as PNG atlases and JSON.
- **Instrument screens:** the control room, damage report, radar, chart, quadrant map, captain's log and GAME CONTROL are drawn from layouts replayed out of GATO1's p-code (`analysis/export_cockpit_layouts.py` -> `public/assets/cockpit_layouts.json`, details in `../analysis/gato1_screens.md`). The damage report and the control-room panel match screenshots of the original pixel for pixel (`python analysis/verify_cockpit_layouts.py`); text is drawn with the remake's font on the original cells.
- **Title screen:** also drawn at run time (`DRAW`/`PAINT`/`LINE`/`CIRCLE`), not stored. `analysis/export_title_art.py` replays the program's drawing statements into `public/assets/title_screen.json`; the striped GATO lettering, credits and the launcher's surfaced-submarine backdrop come from that. Details and what is inferred (palette, the (c) ring) are in `../analysis/title_art.md`. Regenerate with `python analysis/export_title_art.py` from the repository root (needs Pillow).
- **Sound:** the runtime programs the PIT channel 2 speaker.

## Caveats

- `PLAY` note tables beyond the Morse tones are not ported. GATO1 contains no table of mid-mission radio traffic: the only messages are CONTACT MADE / MISSION COMPLETED, YOU HAVE SUCCESSFULLY COMPLETED YOUR MISSION, "No more oxygen" and the radio-room damage report (`src/core/radio.ts`, details in `../analysis/radio_and_explosions.md`). The radio alert tone is a remake addition.
- Torpedo-hit explosions follow the original's stages and frame counts (`src/core/explosion.ts`), but the original is CPU bound, so their durations in seconds (about 1.5-5 s) are estimated from the empty-loop lengths. The original blocks the whole game while it plays; the remake keeps the world running.
- `ds:0x23a6` is treated as 0. Some effect durations and the damage-alarm, sub-lost and mission-complete sounds are inferred; the original hit animation has no sound, the explosion boom is a remake addition.
- The original runs unthrottled; the fixed 10 Hz tick, the display modes and the CRT overlay are remake choices.
- Confirm the rights to the original history text before distributing it.
