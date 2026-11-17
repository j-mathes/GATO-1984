# Remake-only additions

What the TypeScript remake (`remake/`) does that the 1984 binaries (`GATO.EXE`, `GATO1.EXE`, `DEMO.EXE`, `HISTORY.EXE`) do not, found by reading `remake/src/` and the other notes in this folder. "Default" is what a player sees with a fresh browser profile.

Nineteen of the additions have a switch on the ADVANCED OPTIONS screen (section 5a) that turns them back into the 1984 behaviour: rows 1, 2, 3, 6, 8, 9, 10, 11, 12, 15, 16, 17, 20, 24, 25, 28, 30, 32, 43. Rows 38, 40, 41 and 42 are switches themselves (row 41 skips a scene of the original that the remake ports). Everything else is always on. Off by default: the helm status line (row 1), custom controls (row 38), simple speed keys (row 40), the skip of the sinking scene (row 41) and the enhanced graphics (row 42).

Legend: **ON** = active in normal play, **key** = off until the player asks, **fallback** = only used when an asset is missing.

## 1. Overlays, banners, prompts

| # | Feature | Where | Default | How to change | Original |
| --- | --- | --- | --- | --- | --- |
| 1 | **Helm status line** at the top of the screen after a helm command (`ORDER 8.0  RUDDER MID  PLANES LEVEL`) | `render/textScreens.ts` `helmStatus`/`drawToast`; `app/app.ts` `perform`, `HELM_COMMANDS`, `showControlHud` | **OFF** (flag `showControlHud = false`) | `__gato.showControlHud = true` in the console, or `localStorage["gato.controlHud"] = "1"` | None. The scope stays clean; only the dashboard lights/arrows change (door circle, engine text, scope arrow) |
| 2 | **Time-compression toast** (`TIME x2  (5 STEPS/S)`, 1.8 s) | `app/app.ts` `setTimeScale`/`showToast`; `drawToast` | key (only after `[` / `]`) | switch 2 (ADVANCED OPTIONS) | None |
| 3 | **Controls quick-reference overlay** in five pages (speed and engines, steering, scope and weapons, screens, remake extras), one key per line, pauses the world | `render/textScreens.ts` `controlsPages`/`drawHelpOverlay`; `app/app.ts` `helpOpen`, `helpKey`; key `?` or `H` | key | Left/Up/PageUp and Right/Down/PageDown turn pages; any other key (the space bar included) closes | None |
| 4 | **Row 25 hint on the orders screen** (`PRESS ANY KEY TO SKIP`, `...TO CONTINUE`, `ORDERS IN MORSE ONLY - ANY KEY SKIPS`) | `render/textScreens.ts` `drawOrders` | **ON** | delete the `g.text(1, 25, ...)` line | Row 25 is never written |
| 5 | **`PRESS ANY KEY` on the title page** | `render/textScreens.ts` `drawTitle` | **ON** | | The title advances by itself (an empty 5000-pass loop) |
| 6 | **Spectrum HoloByte splash hold + key/click skip** | `app/app.ts` `SPLASH_MS`, `tap()`; `main.ts` `pointerdown` | **ON** (2.5 s) | | A 2000-pass empty loop, no key; the logo scene itself is original |
| 7 | **Title wipe timing** (hold 0.4 s, wipe 0.9 s) | `render/textScreens.ts` `TITLE_HOLD_MS`, `TITLE_WIPE_MS` | **ON** | | The 43 erase lines are original; their speed was CPU-bound |
| 8 | **GAME CONTROL rows `[5] NEXT MISSION`, `[6] TIME COMPRESSION`** | `render/cockpitScreens.ts` `drawGameControlLayout`, `render/playScreens.ts` `drawGameControl`; `core/launcher.ts` `GameControl` | **ON** (not in the demo's copy of the screen) | switch 8 (item 5 also needs switch 30) | Items 1-4 only |
| 9 | **Display modes** `V`: Authentic / Fit / CRT scanlines | `render/display.ts`, `index.html` `#crt`, `main.ts` | **ON** (Authentic, remembered in `gato.display`) | `V` | A fixed CGA monitor |
| 10 | **Wake-trail toggle** `W` | `render/trails.ts`, `app/app.ts` `setTrails` | **ON** = the original's persistent dots; `W` gives clean redraws (remembered in `gato.trails`) | `W` | The dots always persist; the toggle is the addition |
| 11 | **End box text `YOUR SUBMARINE HAS BEEN LOST`** and the framed end box (shown for a lost boat or no oxygen), with the question corrected to `DO YOU WANT TO PLAY AGAIN? (Y/N)` | `render/playScreens.ts` `drawEnd` | **ON** | | `CONTACT MADE`, `MISSION COMPLETED`, the oxygen message and `DO YOU WANT DO PLAY AGAIN? (Y/N)` are strings of GATO1 (the original's question has a typo, `DO` for `TO`; the 1984 variant of this switch and the demo keep it); the text `YOUR SUBMARINE HAS BEEN LOST` and the box geometry are not found in the binary |
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
| 19 | Launcher accepts `1`-`5` at once (typed digits plus Enter also work; item 5 is the remake's ADVANCED OPTIONS, row 37) | `app/app.ts` `menuKey` | **ON** | an `INPUT` line, items 1-4 |
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
| 39 | **Credit line `Enhancements by Jared Mathes`** on the finished title page, row 19, between the authors (row 17) and the copyright (row 21), in the authors' colour; **the credit lines are centred** (the original's cells sit a column to the left of centre) and the (c) ring moves with its line | `render/textScreens.ts` `ENHANCEMENT_CREDIT`, `centredColumn`, `drawTitle` | **ON** (not shown during the letter wipe; no switch) | The credits are only the authors and the copyright, on the original's cells |
| 43 | **Solid ships in the scope** (switch SOLID SHIPS IN THE SCOPE, default ON): the ships of the original picture are filled silhouettes (black by day, white at night, hull closed along the drawn bow and stern edges) instead of open line art | `render/hull.ts`, `render/sprites.ts` `solidShip`, `render/playScreens.ts` `drawContact` | **ON** | the line art, see-through, in the screen's colour 0 by day and white at night (the demo always shows it) |
| 44 | **Pressing the key of the screen you are on goes back to the control room** (R on the damage report, F6 on the radar, ...). A key with no assignment also goes back, which matches the original as reported by a player running it in DOSBox (not traced in the code); modifier, lock and browser keys do not | `app/app.ts` `playKey`, `input/keyboard.ts` `isPlainKey` | **ON** (no switch) | any unassigned key returns; the screen key again does nothing |
| 45 | **History page keys** (switch HISTORY PAGE KEYS, default ON): in the history, the left and up arrows, PgUp and Backspace go back a page, Home and End jump to the first and last page, Esc leaves the history (which then opens on that page next time), any other key still goes on, and a PAGE n OF m line with a key hint shows at the bottom. The 1984 viewer only moves forward. The enhanced graphics show the history in the typewriter skin | `app/historyViewer.ts`, `app/app.ts` `historyKey`, `render/textScreens.ts` `drawHistory` | **ON** | any key goes to the next page and there is no way back; no PAGE line |
| 41 | **Switch SKIP THE SINKING SCENE.** The lost-boat sequence itself is the original's (cracks and rising water, [radio_and_explosions.md](radio_and_explosions.md), "Lost-boat sequence"); the switch, the 2.5 s length and the end box that follows it are the remake's | `core/sinking.ts`, `core/drawString.ts`, `app/app.ts` `framePlay`/`draw`, `render/playScreens.ts` `drawSinking` | scene **ON** (the switch is OFF) | the scene plays, then the log update and the play-again question (`0x0b5cd-0x0b9e3`); running out of air skips it |

| 42 | **Enhanced graphics** (switch ENHANCED GRAPHICS, default OFF): the scope window of the control room (graded sky, stars at night, swell, ships coloured by role with their hulls closed below the deck, shading, thin rigging, a rim light at night and a reflection, the island filled green with a sand shore, haze with distance), the radar (phosphor sweep, glowing contacts), the chart (islands, grid) and the quadrant map (the island's own outline from the original bitmap, smoothed) are drawn sharply at the display's resolution in natural colours, with Courier Prime and Special Elite text. The lost-boat sequence keeps the original's timeline (the water rises over the same 2.5 s) but is drawn as a blue-green rising sea with foam, and its glass cracks only the periscope viewport and the glass of each instrument, one after another, each spreading from its own impact like the broken periscope's cracks (the original's straight crack lines are not used); running out of air fades the screen to black over 3 s before the message (the original shows it at once). The control room instrument panel is redrawn as vector components at the original's coordinates (brass-framed dials with coloured zones for scope depth, crush depth and speed, amber needles, level bars for fuel, battery and oxygen, glowing lamps coloured by meaning, ready-tube and engine-mode colours, a dim red light at night), and the periscope has a lens vignette, a crosshair and a green-blue tint with depth. Raising or lowering the periscope moves a soft lens shutter for 0.75 s (opening from 55 % when raised, a dip to 80 % when lowered; the original's picture does not change when surfaced). The periscope's state is a pair of lit chevrons like elevator buttons beside the word SCOPE (the upper glows green while it is raised, red if it is broken; the lower glows amber while it is lowered), and the scope direction indicator is a small compass card with F, S, A and P round the ring, the one the scope looks at lit and a needle pointing at it. A raised periscope that is damaged shows a dark pane with deterministic glass cracks (`render/enhanced/cracks.ts`). A damaged compartment also cracks the glass of its own instruments, which keep working: the dials and the oxygen gauge follow the control room, the fuel readout and lamp the fuel tanks, the battery readout and its two lamps the battery room, the torpedo box the torpedo room and the power window the engine room; the damage lamp never cracks (`panel.ts` `instrumentPanes`, `drawPane`). The damage report is redrawn (`damage.ts`): the boat in side view, filled and shaded from the original outline, with the eight compartments marked at their original places (green when sound, a pulsing red when damaged), lamps with names and status, and two gauges for how near the boat is to being lost (damaged compartments of the 5 it can lose; the index sum with the alarm at 15 and the loss at 21). The captain's log is a typed ledger page (`log.ts`) with the original's lines. GAME CONTROL, the advanced options, the control assignments, the help, the history, the message boxes and the demo narration keep the original drawing code but are shown in a typewriter skin (`skin.ts`: gunmetal board, cream and amber text in Courier Prime and Special Elite). On a window wider than 8:5 (up to 16:9) the scenes use the whole width: the picture stays 4 times the original and centred, and the sea, sky, metal, board or map background continues into the wings on both sides (the map and instrument wings are shaded darker; the scope shows more sea and sky but ships keep to the original window). The title, menu, splash, orders and Morse screens are still the original pictures, centred in the enhanced canvas. The colours, the ship tones, the star field, the fade and the layout of the radar panel are the remake's | `render/enhanced/` (`scope.ts`, `panel.ts`, `damage.ts`, `log.ts`, `cracks.ts`, `skin.ts`, `scenes.ts`, `shipArt.ts`, `sinking.ts`, `colors.ts`, `typography.ts`), `render/gfx.ts` views, `render/display.ts`, `app/app.ts` `syncGraphics` | **OFF** | the 320 x 200 four-colour pictures (cyan sky, magenta sea, black silhouettes by day and white outlines at night), the magenta and white sinking, and no fade |

## 5a. Advanced options switches

Menu item 5 opens the screen, which shows the switches twelve to a page (`PAGE 1 OF 2`): Up/Down select a row and run on from one page to the next, Left/Right (or PageUp/PageDown) jump to the other page, Enter or Space switch it, `R` restores the defaults, Esc returns to the menu. The screen shows `ON` (the remake feature) or `OFF` (the 1984 behaviour) for each row, and the text under the list describes both states, `ON: ...` above `OFF: ...`, with the one in force in yellow and the other grey. The choices are saved in `localStorage` under `gato.advanced`. It opens from the launcher menu (item 5) and, during a mission, from GAME CONTROL (Tab) item 7; the world is paused while it is open, Esc returns to the menu or to GAME CONTROL, and a change applies at once (also to the mission that is running, for example the pace). "Row" is the row number above. Switches that depend on the one above them are shown indented: the hotkeys switch (16) sets the three under it (3, 9, 10) and follows them, while the next-mission pick (30, under 8) and the time pop-up (2, under 15) stay independent and simply have no effect while their parent is off. All switches default to ON except rows 1, 38, 40, 41 and 42. Row 40 is only listed (as the last row, indented under custom controls) while custom controls is on; with it off the stored value is kept but not used.

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
| 41 | SKIP THE SINKING SCENE (default OFF: the scene plays) | OFF is the original: after a loss (not after running out of air) the glass cracks and the sea floods the screen, about 2.5 s, and keys wait until it is over; ON goes straight to the end message |
| 12 | DEMO: ANY KEY SKIPS INTRO | the demo intro waits its time (the original shows it while it loads); only F1 (exit) and F2 (sound off) act there. Any key still ends the Morse example, as in the original |
| 45 | HISTORY PAGE KEYS | the history only goes forward: every key, arrows and Esc included, shows the next page; no PAGE line |
| 15 | TIME COMPRESSION KEYS [ AND ] | `[` and `]` do nothing (GAME CONTROL item 6 is row 8) |
| 16 | HOTKEYS ? H W V | a group switch over rows 3, 9 and 10: switching it sets all three (OFF: `?`/`H`, `V` and `W` do nothing), and it follows them: it is ON while any of the three is ON and turns OFF when all three are OFF |
| 17 | ESC RETURNS TO MENU | Esc does nothing during a mission (the original ends the program; the page cannot, so a mission then ends by losing the boat or reloading the page) |
| 20 | M REREADS THE ORDERS | `M` with a working radio room asks for a new mission: a fresh world with new orders (a random pick, or the GAME CONTROL item 5 pick while row 30 is on) |
| 24 | EXPLOSION BOOM SOUND | explosions are silent |
| 25 | RADIO ALERT TONE | radio messages are silent |
| 43 | SOLID SHIPS IN THE SCOPE | the original's open line art: see-through, hard to see when small |
| 42 | ENHANCED GRAPHICS (default OFF) | OFF is the 1984 picture; ON draws the scope, control panel, radar, chart, quadrant map, damage report and log at the display's resolution in natural colours, and the text screens in a typewriter skin (row 42 above) |
| 28 | SLOW 1984 PC PACE (2.5 HZ) | 10 simulation steps a second at 1x (2x = 20, 4x = 40). The original has no fixed rate (one pass of its loop as fast as the CPU allows), so there is no exact equivalent |
| 30 | CHOOSE THE NEXT MISSION | the next mission is always the original's random pick; GAME CONTROL item 5 is hidden (the pick is kept but unused) |
| 32 | WORLD RUNS DURING BLASTS | the world is held while an explosion plays, as the original blocks in its animation |
| 38 | CUSTOM CONTROLS (default OFF) | the original key assignments only; ON switches to a custom key layout for a modern keyboard that the player can change on the CONTROL ASSIGNMENTS screen (below) |
| 40 | SIMPLE SPEED KEYS (default OFF; only listed and in force while CUSTOM CONTROLS is on) | a key per speed stage (F1 F3 F5 F7), F9 stop, F10 reverse, D and E engines; ON replaces the stage and engine keys by one key that steps the speed up and one that steps it down (defaults `=` and `-`), ALL STOP (`0`), REVERSE (`Backspace`) and one engine toggle (`E`), see below |

### Simple speed keys (row 40)

* **Stepping:** the ahead stages are stop, slow (3), standard (6), full (8) and flank (10), each times the engine factor, the open doors and engine-room damage like the F keys (`core/physics.ts` `steppedSpeed`). Speed up orders the next higher stage and speed down the next lower one, never below stop; from a speed between stages (doors opened, engine changed) each goes to the nearest stage in its direction. Reverse stays a deliberate key: speed down does not go astern and speed up from reverse goes to stop.
* **Defaults chosen to sit next to `=` and `-`:** `0` for all stop (zero speed, beside `-`) and `Backspace` for reverse (back, beside `=`); the custom layout uses them with the stage keys too. `E` toggles diesel and electric (the fuel and battery rules of the D and E keys); `P` is the periscope toggle in the custom layout.
* **What changes in the lists:** the four stage actions and the D and E actions leave the assignment screen and the help (and their keys do nothing); the step up, step down and engine toggle actions take their place. ALL STOP and REVERSE move to `0` and `Backspace` when the switch is turned on, but only if they still have the F9 and F10 defaults and the new key is free (the same in reverse when it is turned off); an action that comes into use and finds its key taken by another is left without a key. `R` on the assignment screen restores the defaults of the scheme in force.

### Control assignments (row 38)

With CUSTOM CONTROLS on, `C` on the ADVANCED OPTIONS screen opens CONTROL ASSIGNMENTS: one line per mission action (speed, periscope, torpedo, radar, rudder, planes, engines, scope facings, doors, the screens, debug prompt, wake trails, help (two keys), time speed, back to the menu, display mode), with its key. Up/Down/PageUp/PageDown select, Enter or Space waits for the new key, Delete or Backspace blanks the action, `R` restores every default, Esc leaves. One key per action; an action can have no key.

* **Layout:** the list is in the sections of the help pages (speed and engines, steering, scope and weapons, screens, remake extras), each with a `-- TITLE --` line that scrolls with the list. Actions are listed whether or not their feature is switched on, so keys can be assigned ahead of use.
* **Conflicts:** giving an action a key another action already has shows a warning (`<KEY> IS ALREADY USED FOR <ACTION>`); Enter overrides, which leaves the other action without a key (shown `(NONE)`), and Esc cancels.
* **Fixed keys:** Tab (GAME CONTROL) and Escape (back to the menu) are listed with `(FIXED)`: their actions cannot be changed or blanked, and no other action can take those keys. Delete is not assignable (it blanks or cancels), nor are Shift, Ctrl, Alt and Meta alone. Which other keys should be protected is still open.
* **Defaults:** two sets. The original's keys (plus the remake's own keys for the remake-only actions) are what the game uses with the switch off and what `Keymap` gives by default. The custom layout, below, is what the assignment screen starts from and what `R` restores; the player's changes are kept per action and the layout in use follows the switch.
* **Scope:** only the mission keys. Menu, GAME CONTROL numbers, prompts, the demo (F1, F2) and the orders screen keep their fixed keys.
* **Storage:** `localStorage` `gato.controls`, as `{"v": 2, "keys": {...}}`; the assignments are used in play only while the switch is on. The help overlay and the display-mode key follow them. A value written by the first release (no version, whose defaults were the original's keys) is read keeping only what differs from the original's keys, so the custom layout is not mistaken for the player's own choices.

### Custom layout (defaults while CUSTOM CONTROLS is on)

Chosen for a modern keyboard (no function keys), keeping the mnemonic letters and the arrow keys that already worked. Fixed keys are Tab and Escape. No two actions in use share a key, with the stage keys or with the simple speed keys (checked in `web.test.ts`).

| Action | Original | Custom (stage keys) | Custom (simple speed keys) |
| --- | --- | --- | --- |
| Ahead slow / standard / full / flank | F7 / F5 / F3 / F1 | `1` / `2` / `3` / `4` | not used |
| Step speed up / down | none | not used | `=` / `-` |
| All stop / reverse | F9 / F10 | `0` / `Backspace` | `0` / `Backspace` |
| Diesel / electric | D / E | `D` / `E` | `E` toggles |
| Centre rudder and planes | 5 | `N` | `N` |
| Periscope | F2 raise, F4 lower | `P` toggles; raise and lower exist but have no key | same |
| Scope forward / port / aft / starboard | F / P / A / S | `I` / `J` / `K` / `L` | same |
| Fire | F8 | `Space` | `Space` |
| Radar | F6 | `G` | `G` |
| Captain's log | L | `B` | `B` |

All other keys (arrows, `T`, `C`, `Q`, `R`, `M`, `Z`, `W`, `V`, `?`, `H`, `[`, `]`) are the same in both layouts. The periscope toggle (`P`, `core/physics.ts` `periscope` with `toggle`) raises a lowered periscope and lowers a raised one, with the same depth limit as F2 and F4; the help lists only the periscope keys that have one.

## 6. Tooling (not part of the game)

`Play_GATO.bat`, `npm run play`, the GitHub Pages workflow (`.github/workflows/pages.yml`), the Vite/Vitest setup, `window.__gato`, the `analysis/` extractors and `remake/public/assets/*.json`.

## 7. Approximations that are not additions

Drawn or timed from evidence but not byte-exact: the text font (the remake's own, on the original `LOCATE` cells; the BIOS ROM font is not in the executables), the bitmaps of the control-room marker and arrows (from screenshots), the CRT/aspect scaling, all delay-loop durations (intro, demo pages, orders typing delay, the 2 s closing hold), and the radio-room damaged-branch handling in the demo (dropped because `ds:0x175e` is never set there). See [findings.md](findings.md).

## 8. Where to look

* Hidden by default: rows 1, 38 and 40. Switchable on the ADVANCED OPTIONS screen: rows 1, 2, 3, 6, 8, 9, 10, 11, 12, 15, 16, 17, 20, 24, 25, 28, 30, 32, 38, 40, 41, 42, 43 (section 5a).
* Behaviour that alters play: rows 28 (pace), 31 (message boxes wait for a key, world keeps running), 32 (explosions do not block) and 33; each is a constant or one branch in `core/` or `app/app.ts`.
* Remake choices with no state depending on them, easiest to remove in code: rows 2, 4, 5, 7, 11, 12, 13, 21 to 23, 24, 25.
