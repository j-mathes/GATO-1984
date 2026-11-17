# Remake-only additions

What the TypeScript remake (`remake/`) does that the 1984 binaries (`GATO.EXE`, `GATO1.EXE`, `DEMO.EXE`, `HISTORY.EXE`) do not, as found by reading `remake/src/`, `remake/README.md` and the extraction notes in this folder. "Default" is what a player sees with a fresh browser profile. Eighteen of these (rows 1, 2, 3, 6, 8, 9, 10, 11, 12, 15, 16, 17, 20, 24, 25, 28, 30, 32) have a switch on the ADVANCED OPTIONS screen (section 5a) that turns them back into the 1984 behaviour; the rest are always on. Row 38 (custom controls) is a switch itself. Off by default: the helm status line (row 1) and custom controls (row 38).

Legend: **ON** = active in normal play, **key** = off until the player asks, **fallback** = only used when an asset is missing.

## 1. Overlays, banners, prompts

| # | Feature | Where | Default | How to change | Original |
| --- | --- | --- | --- | --- | --- |
| 1 | **Helm status line** at the top of the screen after a helm command (`ORDER 8.0  RUDDER MID  PLANES LEVEL`) | `render/textScreens.ts` `helmStatus`/`drawToast`; `app/app.ts` `perform`, `HELM_COMMANDS`, `showControlHud` | **OFF** (flag `showControlHud = false`) | `__gato.showControlHud = true` in the console, or `localStorage["gato.controlHud"] = "1"` | None. The scope stays clean; only the dashboard lights/arrows change (door circle, engine text, scope arrow) |
| 2 | **Time-compression toast** (`TIME x2  (5 STEPS/S)`, 1.8 s) | `app/app.ts` `setTimeScale`/`showToast`; `drawToast` | key (only after `[` / `]`) | switch 2 (ADVANCED OPTIONS) | None |
| 3 | **Controls quick-reference overlay** in five pages (speed and engines, steering, scope and weapons, screens, remake extras), one key per line, pauses the world | `render/textScreens.ts` `controlsPages`/`drawHelpOverlay`; `app/app.ts` `helpOpen`, `helpKey`; key `?` or `H` | key | Left/Up/PageUp and Right/Down/PageDown/Space turn pages; any other key closes | None |
| 4 | **Row 25 hint on the orders screen** (`PRESS ANY KEY TO SKIP`, `...TO CONTINUE`, `ORDERS IN MORSE ONLY - ANY KEY SKIPS`) | `render/textScreens.ts` `drawOrders` | **ON** | delete the `g.text(1, 25, ...)` line | Row 25 is never written |
| 5 | **`PRESS ANY KEY` on the title page** | `render/textScreens.ts` `drawTitle` | **ON** | | The title advances by itself (an empty 5000-pass loop) |
| 6 | **Spectrum HoloByte splash hold + key/click skip** | `app/app.ts` `SPLASH_MS`, `tap()`; `main.ts` `pointerdown` | **ON** (2.5 s) | | A 2000-pass empty loop, no key; the logo scene itself is original |
| 7 | **Title wipe timing** (hold 0.4 s, wipe 0.9 s) | `render/textScreens.ts` `TITLE_HOLD_MS`, `TITLE_WIPE_MS` | **ON** | | The 43 erase lines are original; their speed was CPU-bound |
| 8 | **GAME CONTROL rows `[5] NEXT MISSION`, `[6] TIME COMPRESSION`** | `render/cockpitScreens.ts` `drawGameControlLayout`, `render/playScreens.ts` `drawGameControl`; `core/launcher.ts` `GameControl` | **ON** (hidden in the demo's copy of the screen) | | Items 1-4 only |
| 9 | **Display modes** `V`: Authentic / Fit / CRT scanlines | `render/display.ts`, `index.html` `#crt`, `main.ts` | **ON** (Authentic, remembered in `gato.display`) | `V` | A fixed CGA monitor |
| 10 | **Wake-trail toggle** `W` | `render/trails.ts`, `app/app.ts` `setTrails` | **ON** = the original's persistent dots; `W` gives clean redraws (remembered in `gato.trails`) | `W` | The dots always persist; the toggle is the addition |
| 11 | **End box text `YOUR SUBMARINE HAS BEEN LOST`** and the framed end box (shown for a lost boat or no oxygen) | `render/playScreens.ts` `drawEnd` | **ON** | | `CONTACT MADE`, `MISSION COMPLETED`, the oxygen message and `DO YOU WANT DO PLAY AGAIN? (Y/N)` are strings of GATO1; the text `YOUR SUBMARINE HAS BEEN LOST` and the box geometry are not found in the binary |
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
| 31 | **Message boxes wait for a key press** (the last box of a message: `MISSION COMPLETED`, the convoy message, the radio-room damage report); the key only closes the box and is not passed on; a `PRESS ANY KEY` hint is drawn on the box's last text row. `CONTACT MADE` still gives way to `MISSION COMPLETED` by itself after its hold time. The world keeps running while a box is up | `core/radio.ts` `RadioInbox.dismiss`/`waitingForKey`; `app/app.ts` `playKey`; `render/playScreens.ts` `drawRadioMessage` | **ON** | each box is held by an empty `FOR` loop (19000 / 10000 / 25000 passes, about 2.1 / 1.1 / 2.75 s at the remake's estimate) and the program is frozen meanwhile |
| 32 | **World keeps running during explosions** | `app/app.ts` `framePlay` | **ON** | the program blocks while the animation plays |
| 33 | **Resupply speed and torpedo reload in real seconds** (900 fuel/s, 6 s per torpedo), damage-alarm interval 2 s | `core/constants.ts` `RESUPPLY`, `core/simulation.ts` | **ON** | CPU-bound loops |
| 34 | **Explosion durations in seconds** (about 1.5-5 s) | `core/explosion.ts`, `render/explosions.ts` | **ON** | CPU-bound loops |
| 35 | **Demo runs a throw-away simulation** behind the narration (ships move) | `app/app.ts` `startDemo` | **ON** | canned data |
| 36 | **Captain's log in `localStorage`** instead of the `LOG1` file | `app/logStore.ts` (`gato.captains-log.v1`) | **ON** | `LOG1` (92 x 32-byte records) |
| 37 | **Menu item 5, ADVANCED OPTIONS**, and its settings screen (section 5a); also GAME CONTROL **item `[7] ADVANCED OPTIONS`** during a mission, which pauses the world | `core/launcher.ts` `LAUNCHER_MENU`, `core/advanced.ts`, `app/app.ts` `settingsKey`/`openSettings`/`gameControlKey`, `render/textScreens.ts` `drawAdvancedOptions`, `drawLauncherMenu`, `render/cockpitScreens.ts` `drawGameControlLayout` | **ON** (settings in `localStorage` `gato.advanced`); item 7 is always shown on the mission's GAME CONTROL (not in the demo's copy) and is not affected by any switch, so the screen can always be reached | The menu has items 1-4 only; GAME CONTROL has items 1-4 |

## 5a. Advanced options switches

Menu item 5 opens the screen, which shows the switches ten to a page (`PAGE 1 OF 2`): Up/Down select a row and run on from one page to the next, Left/Right (or PageUp/PageDown) jump to the other page, Enter or Space switch it, `R` restores the defaults, Esc returns to the menu. The screen shows `ON` (the remake feature) or `OFF` (the 1984 behaviour) for each row, and the line under the list describes the other state: `OFF: ...` while the switch is on, `ON: ...` while it is off. The choices are saved in `localStorage` under `gato.advanced`. It opens from the launcher menu (item 5) and, during a mission, from GAME CONTROL (Tab) item 7; the world is paused while it is open, Esc returns to the menu or to GAME CONTROL, and a change applies at once (also to the mission that is running, for example the pace). "Row" is the row number above. Switches that depend on the one above them are shown indented: the hotkeys switch (16) sets the three under it (3, 9, 10) and follows them, while the next-mission pick (30, under 8) and the time pop-up (2, under 15) stay independent and simply have no effect while their parent is off. All switches default to ON except rows 1 and 38.

| Row | Switch (screen label) | OFF gives |
| --- | --- | --- |
| 1 | HELM STATUS LINE (default OFF) | no text over the scope; only the dashboard lights change (`__gato.showControlHud = true` or `gato.controlHud = 1` still forces the line on) |
| 2 | TIME SPEED POP-UP | no pop-up when `[` / `]` or GAME CONTROL item 6 changes the speed of time |
| 3 | CONTROLS HELP OVERLAY | `?` and `H` do nothing |
| 6 | SKIP LOGO WITH KEY / CLICK | the Spectrum HoloByte logo stays for its 2.5 s and ignores keys and clicks |
| 8 | GAME CONTROL ITEMS 5 AND 6 | GAME CONTROL shows items 1-4 only; keys `5` and `6` do nothing there |
| 9 | DISPLAY MODES (FIT, CRT) | the picture is always the Authentic whole-number scale; the chosen mode is kept for later |
| 10 | WAKE TRAILS ON/OFF | track dots always persist; `W` does nothing |
| 11 | LOST-BOAT BOX AND TEXT | a cleared screen with only `DO YOU WANT DO PLAY AGAIN? (Y/N)` (and the oxygen message when the air ran out) |
| 12 | DEMO: ANY KEY SKIPS INTRO | the demo intro waits its time (the original shows it while it loads); only F1 (exit) and F2 (sound off) act there. Any key still ends the Morse example, as in the original |
| 15 | TIME COMPRESSION KEYS [ AND ] | `[` and `]` do nothing (GAME CONTROL item 6 is row 8) |
| 16 | HOTKEYS ? H W V | a group switch over rows 3, 9 and 10: switching it sets all three (OFF: `?`/`H`, `V` and `W` do nothing), and it follows them: it is ON while any of the three is ON and turns OFF when all three are OFF |
| 17 | ESC RETURNS TO MENU | Esc does nothing during a mission (the original ends the program; the page cannot, so a mission then ends by losing the boat or reloading the page) |
| 20 | M REREADS THE ORDERS | `M` with a working radio room asks for a new mission: a fresh world with new orders (a random pick, or the GAME CONTROL item 5 pick while row 30 is on) |
| 24 | EXPLOSION BOOM SOUND | explosions are silent |
| 25 | RADIO ALERT TONE | radio messages are silent |
| 28 | SLOW 1984 PC PACE (2.5 HZ) | 10 simulation steps a second at 1x (2x = 20, 4x = 40). The original has no fixed rate (one pass of its loop as fast as the CPU allows), so there is no exact equivalent |
| 30 | CHOOSE THE NEXT MISSION | the next mission is always the original's random pick; GAME CONTROL item 5 is hidden (the pick is kept but unused) |
| 32 | WORLD RUNS DURING BLASTS | the world is held while an explosion plays, as the original blocks in its animation |
| 38 | CUSTOM CONTROLS (default OFF) | the original key assignments only; ON lets the player reassign the mission keys on the CONTROL ASSIGNMENTS screen (below) |

### Control assignments (row 38)

With CUSTOM CONTROLS on, `C` on the ADVANCED OPTIONS screen opens CONTROL ASSIGNMENTS: one line per mission action (speed, periscope, torpedo, radar, rudder, planes, engines, scope facings, doors, the screens, debug prompt, wake trails, help (two keys), time speed, back to the menu, display mode), with its key. Up/Down/PageUp/PageDown select, Enter or Space waits for the new key, Delete or Backspace blanks the action, `R` restores every default, Esc leaves. One key per action; an action can have no key.

* **Layout:** the list is in the sections of the help pages (speed and engines, steering, scope and weapons, screens, remake extras), each with a `-- TITLE --` line that scrolls with the list. Actions are listed whether or not their feature is switched on, so keys can be assigned ahead of use.
* **Conflicts:** giving an action a key another action already has shows a warning (`<KEY> IS ALREADY USED FOR <ACTION>`); Enter overrides, which leaves the other action without a key (shown `(NONE)`), and Esc cancels.
* **Fixed keys:** Tab (GAME CONTROL) and Escape (back to the menu) are listed with `(FIXED)`: their actions cannot be changed or blanked, and no other action can take those keys. Delete is not assignable (it blanks or cancels), nor are Shift, Ctrl, Alt and Meta alone. Which other keys should be protected is still open.
* **Defaults:** the original's keys (and the remake's own keys for the remake-only actions); custom defaults are not decided yet.
* **Scope:** only the mission keys. Menu, GAME CONTROL numbers, prompts, the demo (F1, F2) and the orders screen keep their fixed keys.
* **Storage:** `localStorage` `gato.controls`; the assignments are used in play only while the switch is on. The help overlay and the display-mode key follow them.

## 6. Tooling (not part of the game)

`Play_GATO.bat`, `npm run play`, the Vite/Vitest setup, `window.__gato`, the `analysis/` extractors and `remake/public/assets/*.json`.

## 7. Approximations that are not additions

Drawn or timed from evidence but not byte-exact: the text font (the remake's own, on the original `LOCATE` cells; the BIOS ROM font is not in the executables), the bitmaps of the control-room marker and arrows (from screenshots), the CRT/aspect scaling, all delay-loop durations (intro, demo pages, orders typing delay, the 2 s closing hold), and the radio-room damaged-branch handling in the demo (dropped because `ds:0x175e` is never set there).

## 8. Suggested decisions

* Hidden by default: rows 1 and 38. Switchable on the ADVANCED OPTIONS screen: rows 1, 2, 3, 6, 8, 9, 10, 11, 12, 15, 16, 17, 20, 24, 25, 28, 30, 32, 38 (section 5a).
* Easiest to drop without touching rules: rows 2, 4, 5, 7, 11, 12, 13, 21-23, 24, 25 (a remake choice each, no state depends on them).
* Behaviour changes that alter play: rows 28 (pace), 31 (message boxes wait for a key, world keeps running), 32 (explosions do not block), 33; each is a constant or one branch in `core/` or `app/app.ts`.
