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

Click or press a key once so the browser allows audio.

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
| M | Back to the control room |
| Tab | GAME CONTROL (items 1–4; difficulty takes a typed 0–9) |
| Z (on the chart) | Hidden debug command: type `PAED`, Enter, then `x,y`, Enter to teleport (only while no enemy is alerted) |
| Any key | Skips the Morse order broadcast |
| Esc | Quit to the launcher |
| V | Display mode |

The launcher menu is `1` play, `2` demo, `3` history, `4` exit.

The log, damage report and GAME CONTROL pause the world; radar, chart and quadrant map do not.

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
- **Sound:** the runtime programs the PIT channel 2 speaker.

## Caveats

- Radio messages, `PLAY` note tables beyond the Morse tones and explosion animation timing are not ported.
- `ds:0x23a6` is treated as 0. Some effect durations and the damage-alarm, explosion, sub-lost and mission-complete sounds are inferred.
- The original runs unthrottled; the fixed 10 Hz tick, the display modes and the CRT overlay are remake choices.
- Confirm the rights to the original history text before distributing it.
