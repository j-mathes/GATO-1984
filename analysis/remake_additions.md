# Remake-only additions

What the TypeScript remake (`remake/`) does that the 1984 binaries (`GATO.EXE`, `GATO1.EXE`, `DEMO.EXE`, `HISTORY.EXE`) do not, as found by reading `remake/src/`, `remake/README.md` and the extraction notes in this folder. "Default" is what a player sees with a fresh browser profile. Nothing here has been switched off except the helm status line (row 1 below).

Legend: **ON** = active in normal play, **key** = off until the player asks, **fallback** = only used when an asset is missing.

## 1. Overlays, banners, prompts

| # | Feature | Where | Default | How to change | Original |
| --- | --- | --- | --- | --- | --- |
| 1 | **Helm status line** at the top of the screen after a helm command (`ORDER 8.0  RUDDER MID  PLANES LEVEL`) | `render/textScreens.ts` `helmStatus`/`drawToast`; `app/app.ts` `perform`, `HELM_COMMANDS`, `showControlHud` | **OFF** (flag `showControlHud = false`) | `__gato.showControlHud = true` in the console, or `localStorage["gato.controlHud"] = "1"` | None. The scope stays clean; only the dashboard lights/arrows change (door circle, engine text, scope arrow) |
| 2 | **Time-compression toast** (`TIME x2  (5 STEPS/S)`, 1.8 s) | `app/app.ts` `setTimeScale`/`showToast`; `drawToast` | key (only after `[` / `]`) | no flag yet (shares `drawToast` with row 1) | None |
| 3 | **Controls quick-reference overlay**, pauses the world | `render/textScreens.ts` `CONTROLS_HELP`/`drawHelpOverlay`; `app/app.ts` `helpOpen`; key `?` or `H` | key | closes on any key | None |
| 4 | **Row 25 hint on the orders screen** (`PRESS ANY KEY TO SKIP`, `...TO CONTINUE`, `ORDERS IN MORSE ONLY - ANY KEY SKIPS`) | `render/textScreens.ts` `drawOrders` | **ON** | delete the `g.text(1, 25, ...)` line | Row 25 is never written |
| 5 | **`PRESS ANY KEY` on the title page** | `render/textScreens.ts` `drawTitle` | **ON** | | The title advances by itself (an empty 5000-pass loop) |
| 6 | **Spectrum HoloByte splash hold + key/click skip** | `app/app.ts` `SPLASH_MS`, `tap()`; `main.ts` `pointerdown` | **ON** (2.5 s) | | A 2000-pass empty loop, no key; the logo scene itself is original |
| 7 | **Title wipe timing** (hold 0.4 s, wipe 0.9 s) | `render/textScreens.ts` `TITLE_HOLD_MS`, `TITLE_WIPE_MS` | **ON** | | The 43 erase lines are original; their speed was CPU-bound |
| 8 | **GAME CONTROL rows `[5] NEXT MISSION`, `[6] TIME COMPRESSION`** | `render/cockpitScreens.ts` `drawGameControlLayout`, `render/playScreens.ts` `drawGameControl`; `core/launcher.ts` `GameControl` | **ON** (hidden in the demo's copy of the screen) | | Items 1-4 only |
| 9 | **Display modes** `V`: Authentic / Fit / CRT scanlines | `render/display.ts`, `index.html` `#crt`, `main.ts` | **ON** (Authentic, remembered in `gato.display`) | `V` | A fixed CGA monitor |
| 10 | **Wake-trail toggle** `W` | `render/trails.ts`, `app/app.ts` `setTrails` | **ON** = the original's persistent dots; `W` gives clean redraws (remembered in `gato.trails`) | `W` | The dots always persist; the toggle is the addition |
| 11 | **End box text `YOUR SUBMARINE HAS BEEN LOST`** and the framed end box | `render/playScreens.ts` `drawEnd` | **ON** | | `CONTACT MADE`, `MISSION COMPLETED`, the oxygen message and `DO YOU WANT DO PLAY AGAIN? (Y/N)` are strings of GATO1; the text `YOUR SUBMARINE HAS BEEN LOST` and the box geometry are not found in the binary |
| 12 | **Demo: any key skips the intro and the Morse example**, intro held 4 s | `core/demoPlayer.ts`, `app/app.ts` `demoKey` | **ON** | | Only F1 (exit) and F2 (sound off) exist; the intro stays while files load |
| 13 | **Legacy approximated screens** when `cockpit_layouts.json` or the title art does not load | `render/playScreens.ts`, `textScreens.ts` | fallback | | n/a |
| 14 | **Console hook** `window.__gato` (the `App`) | `main.ts` | **ON** | | n/a |

## 2. Input

| # | Feature | Where | Default | Original |
| --- | --- | --- | --- | --- |
| 15 | `[` / `]` time compression 1x/2x/4x | `input/keyboard.ts`, `app/app.ts` | key (1x, remembered in `gato.timeScale`) | none |
| 16 | `?` / `H` help, `W` trails, `V` display (rows 3, 9, 10) | `input/keyboard.ts`, `main.ts` | key | none |
| 17 | `Esc` returns to the launcher | `input/keyboard.ts` `quit`, `app/app.ts` | **ON** | ends the program (`0x0d17e`) |
| 18 | Mouse click / touch skips the splash and the title | `main.ts`, `app/app.ts` `tap` | **ON** | none |
| 19 | Launcher accepts `1`-`4` at once (typed digits plus Enter also work) | `app/app.ts` `menuKey` | **ON** | an `INPUT` line |
| 20 | `M` with a working radio re-shows the orders (text at once from difficulty 0-7) | `app/app.ts` `radioRoom` | **ON** | asks for a new mission |

## 3. Orders screen flow

| # | Feature | Where | Default | Original |
| --- | --- | --- | --- | --- |
| 21 | **Two-stage skip**: first key stops the Morse and completes the text, second key continues | `app/app.ts` `finishOrders` | **ON** | the first key abandons the orders |
| 22 | **Waits for a key after the last character** | `app/app.ts` `frameOrders` | **ON** | starts the mission right after the last character |
| 23 | Blinking cursor at 2 Hz | `render/textScreens.ts` `cursorBlink` | **ON** | BIOS cursor (rate not measured) |

## 4. Audio

| # | Feature | Where | Default | Original |
| --- | --- | --- | --- | --- |
| 24 | **Explosion boom** (descending sweep) | `audio/soundEngine.ts` `EFFECTS.explosion`, provenance `remake` | **ON** with sound | the torpedo-hit animation has no `SOUND` |
| 25 | **Radio alert tone** for radio messages | `EFFECTS.radioAlert`, `core/radio.ts`, `app/app.ts` `handleEvents` | **ON** with sound | messages are silent |
| 26 | Damage alarm, sub-lost sweep, mission-complete jingle: frequencies read, shape/timing chosen | `EFFECTS.damageAlarm`, `subDestroyed`, `missionComplete` (provenance `inferred`) | **ON** with sound | `SOUND` loops exist; duration is `0.05 * ds:0x09e2` (the runtime temporary at `ds:0x23a6`, see `loader_verification.md` section 10) and its conversion to ticks was not traced, so the audible shape is a guess |
| 27 | Web Audio square-wave synthesis, audio unlock on first key | `audio/soundEngine.ts` | **ON** | PC speaker through the PIT |

## 5. Gameplay and pacing

| # | Feature | Where | Default | Original |
| --- | --- | --- | --- | --- |
| 28 | **Fixed 2.5 Hz simulation (400 ms step) at 1x** | `core/constants.ts` `TIME_COMPRESSION`, `app/runner.ts` | **ON** | one pass of the main loop as fast as the CPU allows; the 2.5 figure is an estimate for a 4.77 MHz PC |
| 29 | **Render interpolation** between simulation steps (60 FPS glide; the picture lags the simulation by one step) | `app/runner.ts` `interpolate` | **ON** | each pass redraws once |
| 30 | **Mission select** (1-20 or random) | `core/launcher.ts`, `app/app.ts` `startMission` | Random = the original's pick | `1 + FIX(RND*20)` |
| 31 | **Mission ends on completion** (convoy sunk / island reached) and shows the end box | `core/simulation.ts`, `app/app.ts` | **ON** | the objective is logged and play continues (`radio_and_explosions.md`) |
| 32 | **World keeps running during explosions** | `app/app.ts` `framePlay` | **ON** | the program blocks while the animation plays |
| 33 | **Resupply speed and torpedo reload in real seconds** (900 fuel/s, 6 s per torpedo), damage-alarm interval 2 s | `core/constants.ts` `RESUPPLY`, `core/simulation.ts` | **ON** | CPU-bound loops |
| 34 | **Explosion durations in seconds** (about 1.5-5 s) | `core/explosion.ts`, `render/explosions.ts` | **ON** | CPU-bound loops |
| 35 | **Demo runs a throw-away simulation** behind the narration (ships move) | `app/app.ts` `startDemo` | **ON** | canned data |
| 36 | **Captain's log in `localStorage`** instead of the `LOG1` file | `app/logStore.ts` (`gato.captains-log.v1`) | **ON** | `LOG1` (92 x 32-byte records) |

## 6. Tooling (not part of the game)

`Play_GATO.bat`, `npm run play`, the Vite/Vitest setup, `window.__gato`, the `analysis/` extractors and `remake/public/assets/*.json`.

## 7. Approximations that are not additions

Drawn or timed from evidence but not byte-exact: the text font (the remake's own, on the original `LOCATE` cells; the BIOS ROM font is not in the executables), the bitmaps of the control-room marker and arrows (from screenshots), the CRT/aspect scaling, all delay-loop durations (intro, demo pages, orders typing delay, the 2 s closing hold), and the radio-room damaged-branch handling in the demo (dropped because `ds:0x175e` is never set there).

## 8. Suggested decisions

* Already hidden: row 1.
* Easiest to drop without touching rules: rows 2, 4, 5, 7, 11, 12, 13, 21-23, 24, 25 (a remake choice each, no state depends on them).
* Behaviour changes that alter play: rows 28 (pace), 31 (mission end), 32 (explosions do not block), 33; each is a constant or one branch in `core/` or `app/app.ts`.
