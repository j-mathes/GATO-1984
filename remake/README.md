# GATO remake: developer guide

The TypeScript remake of *GATO*. For how to play, see the [repository README](../README.md); for how the original was reverse-engineered, see [../analysis/README.md](../analysis/README.md).

Stack: Vite, strict TypeScript, native Canvas 2D (320 × 200, 4-colour CGA look) and Web Audio (square-wave PC speaker). No game engine, no runtime dependencies.

## Commands

Run them in `remake/`. Node.js 22 or later is expected.

```
npm install
npm run dev         # dev server at http://localhost:5173
npm test            # Vitest: core, integration and app-shell tests
npm run typecheck   # tsc for the app and, separately, for src/core with no DOM lib
npm run build       # type-check, then production build into dist/
npm run preview     # serve dist/
npm run play        # vite build + preview, opens the browser (no type-check)
npm run sync:data   # copy ../analysis/json/{courses,orders,map} into src/data/scenarios
```

`Play_GATO.bat` in the repository root wraps this for Windows: it installs dependencies if needed, builds if `dist/` is missing, starts `vite preview` on port 4173 and opens Chrome (or the default browser). Delete `dist/` to force a rebuild.

The running game exposes the `App` as `window.__gato` for debugging, and `__gato.showControlHud = true` (or `localStorage["gato.controlHud"] = "1"`) brings back the helm status line.

## Layout

| Folder | Contents |
| --- | --- |
| `src/core/` | Pure simulation with no DOM or Canvas (compiled by a second tsconfig without the DOM lib): `physics`, `ai`, `combat`, `simulation`, `explosion`, `sinking` (the lost-boat sequence as a timeline) and `drawString` (the `DRAW` interpreter it uses), `radio`, `scenario`, `launcher` (menu and GAME CONTROL logic), `demoPlayer`, `advanced` (the option switches), `constants`, `rng`, `types`. Tests in `src/core/__tests__/` (unit tests plus headless end-to-end missions) |
| `src/app/` | The `App` shell and its modes (`app.ts`), the fixed-timestep runner (`runner.ts`), orders and the Morse timeline (`orders.ts`), the text-screen model of the orders and the demo's Morse example (`teletype.ts`), history viewer, captain's log store. `web.test.ts` tests all of it against a recording fake `Gfx` |
| `src/render/` | Canvas drawing: `gfx.ts` (the drawing surface and its views), screens from the extracted layouts (`cockpitScreens.ts`, `cockpitLayouts.ts`), text screens (`textScreens.ts`), the approximated fallback screens (`playScreens.ts`), sprites, explosions, wake trails, title artwork, display modes and the CRT overlay (`display.ts`), and `enhanced/` (the scene registry and typewriter text of the enhanced graphics) |
| `src/input/` | `keyboard.ts` (play keys, GAME CONTROL keys, line editor) and `controls.ts` (the key assignments) |
| `src/audio/` | Web Audio synthesizer, Morse and `PLAY` string parsing |
| `src/data/` | JSON extracted from the original files (scenarios, audio tables, history pages, ship log, demo script) |
| `public/assets/` | Extracted artwork: sprite sheets, title frames, cockpit layouts. Fetched at run time with URLs relative to the page. `fonts/` holds the enhanced graphics' typefaces (third-party, with their licences) |
| `scripts/` | `sync-scenarios.mjs` |

## How it fits together

**Core and shell.** `src/core` knows nothing about the browser: `Simulation` takes a scenario, options and a seeded RNG, and advances one step per `step()` call, returning events (torpedo launched, ship sunk, radio message, ...). The `App` turns key presses into core commands, owns the simulation, sound and the captain's log, reacts to the events, and draws through an injected `Gfx`. Tests drive `Simulation` directly or the `App` with a fake `Gfx`.

**App modes.** `splash` (Spectrum HoloByte logo) -> `title` (letter wipe) -> `menu` -> `orders` (teletype briefing) -> `play`, plus `demo`, `history`, `settings` (advanced options) and `controls` (key assignments). `play` shows one of seven screens (control room, radar, chart, quadrant map, log, damage, GAME CONTROL).

**Pacing.** The original runs one pass of its main loop per step as fast as the CPU allows, so the remake paces the loop like a 4.77 MHz IBM PC: `TIME_COMPRESSION.baseHz` = 2.5 steps a second at 1x (400 ms per step), 5 at 2x and 10 at 4x (keys `[` and `]`, GAME CONTROL item 6). The 2.5 figure is an estimate, not something stored in the binaries. `FixedTimestepRunner` accumulates real time and steps the simulation; rendering runs on every animation frame and interpolates positions, headings, depth and speed between the last two steps (`interpolate` in `runner.ts`), so everything glides at the display's refresh rate while the picture trails the simulation by one step. What the player sets directly (rudder, planes, throttle order, scope facing, doors, engine, screen switches) is applied and drawn on the very next frame; the boat answers at the step rate. The core's own default is 10 steps a second, which is what the core tests use. Remake timings given in seconds rather than original loop passes (resupply, torpedo reload, damage-alarm interval, explosion lengths, message-box holds) keep their real duration at any rate.

**Screens.** The control room, damage report, radar, chart, quadrant map, captain's log and GAME CONTROL are drawn from `public/assets/cockpit_layouts.json`, which `analysis/export_cockpit_layouts.py` rebuilds by replaying GATO1's p-code: static 2-bits-per-pixel layers, `LOCATE` text cells and dynamic gauge geometry. The title, launcher backdrop and splash come from `title_screen.json` the same way. The approximated screens in `playScreens.ts` and the sprite title layout are fallbacks for when an asset does not load. Text uses the remake's own font on the original `LOCATE` cells, because the BIOS font is not in the executables.

**Wake trails.** The original plots positions with `PSET` and never erases them on the track screens. `render/trails.ts` keeps a per-screen buffer, records one dot per simulation step, and empties it when the screen is entered again. The radar sweep line and the island blip are not recorded; demo screens never use trails.

**Views and the enhanced graphics.** All drawing goes through `Gfx`, which draws in a *view*: a logical space fitted into the canvas and centred (`gfx.view(w, h)`). The original screens use the 320 x 200 view on a 640 x 400 canvas, where the factor is exactly 2, so their output is unchanged (`render/gfx.test.ts` keeps a recorded transcript of every call as a golden test). The enhanced graphics are a second renderer for the same game state: `render/enhanced/scene.ts` holds one scene per mission screen, drawn in a space 800 units high (4 times the original) and 1280 to 1422 wide, following the window between 8:5 and 16:9, on a canvas sized to the window and the display's pixel ratio up to 2560 pixels wide (`render/display.ts`: `computeLayout`, `backingSize`, `enhancedViewSize`). `App.syncGraphics()` (the ENHANCED GRAPHICS switch, row 42) turns it on; a screen without a registered scene is still drawn by the original code, centred in its own view, so scenes can be added one screen at a time. The scenes registered so far (`render/enhanced/scenes.ts`) are the control room (the enhanced scope, `scope.ts`, over the instrument panel, `panel.ts`, which is built from vector components placed at the original's coordinates times 4: dials with zones and needles, value boxes with level bars, lamps, the oxygen gauge, the tubes and the engine and scope indicators, with a day and a night colour set in `colors.ts`; ships are coloured and shaded by `shipArt.ts` from the silhouette and outline atlases, enlarged 4 times with the edges rounded; the explosion drawing is still the original's), the radar, the chart, the quadrant map, the damage report (`damage.ts`: the hull filled from the original outline by `render/hull.ts` `filledSilhouette`, compartment regions from `overlayRegion`) and the captain's log (`log.ts`); a damaged periscope draws deterministic glass cracks (`cracks.ts`). The text screens (GAME CONTROL, advanced options, control assignments, help, history, message boxes, demo narration) keep their original drawing code and get a typewriter skin: `App.withSkin` sets `Gfx.skin` (`enhanced/skin.ts`), which maps the CGA colours to the skin's, paints its backdrop on `clear()` and sets `text()` in Courier Prime or Special Elite; the demo always uses the original pictures. The enhanced space lines up with the original's: the central 1280 x 800 units are the 320 x 200 picture times 4, so original drawing code can be called inside an enhanced scene by switching the view with `g.view(320, 200)`. On a wide window the scenes fill the whole width (`xo`, the margin on each side, is where the 4 times picture starts; backgrounds run out to the edges, see `backdrop` in `scenes.ts`, `ScopeArea.wing` and `drawMetal`). Fit and CRT apply to both graphics; whole-number scaling only to the original. Text uses `render/enhanced/typography.ts`: Courier Prime for body text and Special Elite for titles, drawn on the same 40 x 25 grid (one glyph per cell, so columns stay aligned). The font files are in `public/assets/fonts/` with their licences, and are loaded the first time the enhanced graphics are switched on.

**Orders screen.** `app/teletype.ts` models the 40-column text screen (black on a light-grey band that grows as lines scroll in); `orders.ts` builds the Morse timeline that decides which character is printed when. The demo's Morse example uses the same model. At difficulty 8 and above nothing is printed but the band still scrolls.

**Options and key assignments.** `core/advanced.ts` defines the switches (key, label, default, what each state gives, optional prerequisite); `AdvancedOptions` stores them in `localStorage` (`gato.advanced`) and calls back on change. The `App` consults a switch at each point where a remake addition acts, so switching one off gives the 1984 behaviour. `input/controls.ts` holds the table of actions (`CONTROL_DEFS`), their default keys in two layouts (the original's, and a custom one for modern keyboards) and the `Keymap` (one key per action, conflict detection with override, locked keys, the simple-speed scheme, a versioned stored form); `translatePlayKey` looks keys up in the active keymap, which is the player's own (starting from the custom layout) only while CUSTOM CONTROLS is on. The full list of switches and what each does is in [../analysis/remake_additions.md](../analysis/remake_additions.md).

**Browser storage.** `gato.captains-log.v1`, `gato.advanced`, `gato.controls`, `gato.display`, `gato.trails`, `gato.timeScale`, and `gato.controlHud` (developer flag). All are optional: a missing or damaged value falls back to the default.

## Data and assets

The files under `src/data/` and `public/assets/` are generated from the originals by the scripts in [../analysis/](../analysis/README.md) and committed, so building the remake needs neither Python nor the `Original/` folder. To regenerate, run the matching `analysis/export_*.py` from the repository root; after `analysis/parse_scenarios.py`, run `npm run sync:data` to copy the scenario JSON into `src/data/scenarios`.

## Testing and pixel accuracy

`npm test` runs the core tests (rules, AI, combat, loaders, the demo script, radio and explosions, headless end-to-end missions) and `src/app/web.test.ts` (runner and interpolation, orders and Morse timeline, sound engine, the screens, options, key assignments, the title and demo flows). Tests read only committed files.

The cockpit layouts were compared with real DOSBox captures in `analysis/reference_screenshots/` (`python analysis/verify_cockpit_layouts.py`, needs Pillow):

| Screen | Differing pixels | What remains |
| --- | --- | --- |
| Damage report | 0 of 3489 | - |
| Damage report, compartments 2 and 6 damaged | 0 of 3789 | - |
| Captain's log (flag) | 0 of 1025 | - |
| Quadrant map frame and ticks | 0 of 1116 | island and tracks are dynamic |
| Control-room panel, live remake render vs capture | 0 of 3790 | text glyphs only |
| Chart | 277 of 60846 | un-erased tracks, reproduced by the wake trails |
| Radar | 130 of 3969 | sweep line and tracks |

The script's static-layer comparison of the control room reports 0 of 261 differing pixels (it compares only the fixed parts); the live-render figure covers the needles and values too. The orders screen is checked cell for cell against capture `2660312`. `web.test.ts` asserts that every mission screen, GAME CONTROL and the demo's screens blit their layer from `cockpit_layouts.json` and fall back only when it is absent, and that the Orders and History text screens render without it.

## Publishing on GitHub Pages

The build is a static site, so it can be served from any path. `vite.config.ts` sets `base: "./"` and the game fetches its assets with URLs relative to the page, which is what makes a project site (<https://j-mathes.github.io/GATO-1984/>) work.

[`.github/workflows/pages.yml`](../.github/workflows/pages.yml) builds and deploys on every push to `main` (or by hand from the Actions tab): `npm ci`, `npm run typecheck`, `npm test`, `npm run build`, then it publishes `remake/dist`. A failing type-check or test stops the deployment.

One-time setup:

1. Push the repository to GitHub.
2. In **Settings > Pages > Build and deployment**, set **Source** to **GitHub Actions**.
3. Push to `main`, or run the workflow from the Actions tab. The site address is shown in the workflow run and under Settings > Pages.

Notes:

- Only `remake/dist` is published. It contains the remake's code (CC BY-NC-SA 4.0, see [../LICENSE.md](../LICENSE.md)) and the data and artwork extracted from the original files, including the History text, which that license does not cover. Make sure you may distribute them before making the site public.
- Pages serve every project of one account from the same origin, so `localStorage` is shared with your other sites. The game's keys all start with `gato.`.
- To check a build under a subpath locally, copy `dist/` into a folder named like the repository, serve its parent folder with any static server, and open `/<folder>/`.
- If the site is moved to a custom domain or another host, nothing needs to change as long as `dist/` is served as a whole.

## Notes on fidelity

[../analysis/findings.md](../analysis/findings.md) lists what is exact, inferred or estimated (timings, sounds, the 2.5 Hz pace, the font), and [../analysis/remake_additions.md](../analysis/remake_additions.md) lists everything the remake adds to the original.
