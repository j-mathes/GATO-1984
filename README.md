# GATO

A browser remake of **GATO**, the 1984 submarine simulation by Paul Arlton and Ed Dawson (Spectrum HoloByte). You command a WWII US submarine in the Pacific: read your orders (sent in Morse code), find the enemy convoy on the chart and radar, and sink it with torpedoes without being sunk yourself.

The rules, numbers and screens come from the original DOS programs, which were taken apart to build this. Enhancements by Jared Mathes.

## Play

- **Online:** <https://j-mathes.github.io/GATO-1984/> (published from this repository by GitHub Pages; see [remake/README.md](remake/README.md#publishing-on-github-pages)).
- **On Windows:** double-click [`Play_GATO.bat`](Play_GATO.bat). It needs [Node.js](https://nodejs.org/), builds the game on the first run and opens it in Chrome (or your default browser).
- **From a terminal:** `cd remake`, then `npm install` and `npm run play`.

Click the game or press a key once so the browser allows sound. The game is played with the keyboard (a click also skips the logo and title page).

## First minutes

1. The Spectrum HoloByte logo gives way to the title page. Press a key for the menu.
2. At the menu press **1** (or Enter) to play, **2** for the demonstration, **3** for the history and specifications, **4** to exit, **5** for the advanced options. Other keys are ignored.
3. Your orders are typed out on a grey band while they are sent in Morse code. Press a key to stop the Morse and show the whole message, then a key again to take the helm. (At difficulty 8 and 9 the text is not printed: you must read the Morse by ear.)
4. You start in quadrant 7 on the surface, running on diesel. Order a speed with **F1**–**F7**, open the chart with **C** and head for the area in your orders.

## Your mission

Each mission gives you a convoy to find: where it was seen, its heading and speed, and where it is probably going. The map is 5 × 4 quadrants (numbered 1 to 20). You complete a mission by **sinking the convoy**, or, in some missions, by **stopping close to the target island** in its quadrant at the right time of day (see GAME CONTROL, item 3). A box announces it, the Captain's Log is updated, and the game goes on: you can keep patrolling, hunt the remaining ships or resupply. Press **Esc** when you want to leave, or **M** for a new mission.

Things to keep an eye on:

- **Contacts.** Use the periscope (**F2**, only at depth 45 or less) and point it with **F / P / A / S** (forward, port, aft, starboard); see Controls for the custom layout's keys. The radar (**F6**), the chart (**C**) and the quadrant map (**Q**) show where ships and islands are.
- **Torpedoes.** You carry 24, fired from four tubes with **F8**. The doors must be open (**T**), and a torpedo runs straight ahead of the bow, so you aim by steering the boat. Open doors slow the boat a little.
- **Fuel, battery and air.** Diesel gives speed and charges the battery, but it **cuts out when you are deeper than 20 or out of fuel**, so surface or come up to snorkel depth to run it. Electric is quiet but drains the battery and cuts out when it is flat. Oxygen runs down while you are submerged and is restored by running on diesel. Warning tones sound when fuel or battery run low.
- **Damage.** The damage report (**R**) shows the eight compartments. A damaged torpedo room cannot fire, a damaged engine room halves your speed and a damaged radio room cannot take messages. Too many damaged compartments lose the boat. Depth charges from escorts that have spotted you damage the boat, and ramming a ship can destroy it.
- **The sub tender.** Come within about 150 units of it on roughly the same heading (within about 22°) with fuel below full, and it refuels you, reloads torpedoes and repairs every compartment. Once started it runs to the end, even if the tender sails on.

## Controls

These are the original game's keys. Because some of them (the function keys, `5`, `P A S F`) are awkward on a modern keyboard, the advanced options can switch to a second, custom layout (right-hand column; see [Custom controls](#advanced-options)).

| Action | Original keys | Custom layout |
| --- | --- | --- |
| Ahead slow / standard / full / flank | F7 / F5 / F3 / F1 | `1` / `2` / `3` / `4` |
| All stop / reverse | F9 / F10 | `0` / `Backspace` |
| Rudder left / right | ← / → | ← / → |
| Rise / dive | ↑ / ↓ | ↑ / ↓ |
| Centre rudder and planes | 5 (or keypad 5) | `N` |
| Diesel / electric engine | D / E | D / E |
| Periscope up / down | F2 / F4 | `P` (one key toggles it) |
| Periscope facing: forward / port / aft / starboard | F / P / A / S | `I` / `J` / `K` / `L` |
| Open / close torpedo doors | T | T |
| Fire a torpedo | F8 | `Space` |
| Radar | F6 | `G` |
| Chart | C | C |
| Quadrant map | Q | Q |
| Captain's Log (ships sunk, tonnage, missions completed) | L | `B` |
| Damage report | R | R |
| Radio room, then back to the control room. With a working radio this shows your orders again | M | M |
| GAME CONTROL | Tab | Tab |
| Controls help (pages through the keys; arrow keys turn pages, any other key closes) | ? or H | ? or H |
| Turn the persistent position dots on the chart, map and radar on or off | W | W |
| Tag the next ship on the radar, chart or map with its data (nearest first, then none); only with enhanced graphics and ship symbols | U | U |
| How far ahead the ship vectors look: 3, 6 (to begin with) or 12 intervals; same condition | O | O |
| Slower / faster time: 1× is the pace of a 1984 PC, 2× and 4× fast-forward | [ / ] | [ / ] |
| Display mode (below) | V | V |
| Leave the mission and return to the menu | Esc | Esc |

The Captain's Log, the damage report and GAME CONTROL pause the game; the radar, chart and quadrant map do not. On the radar, chart, quadrant map, log or damage report, any key that has no assignment (the space bar, for example) takes you back to the control room, as in the original, and so does pressing the key that opened the screen a second time. When a message box is on screen (mission completed, radio room report), the first key only closes it.

When the boat is lost the glass cracks and the sea floods the screen, as in the original (about two and a half seconds; **Skip the sinking scene** in the advanced options turns it off). Then, or at once when the air runs out, you are asked whether to play again (**Y** / **N**).

### GAME CONTROL (Tab)

Press the number of an item to change it; difficulty and next mission ask for a value, which you type and confirm with Enter. Enter, Esc or Tab takes you back to the mission.

| Item | What it does |
| --- | --- |
| 1 Difficulty | 0 to 9. Higher levels make enemies spot you sooner and stay alert longer; at 8 and 9 the orders are Morse only |
| 2 Sound | On / off |
| 3 Time of day | 1 = day, 0 = night. Enemies see you less well at night, and some island objectives only count at a given time |
| 4 Reset Captain's Log | Erases the log |
| 5 Next mission | `1`–`20`, or `R` for a random mission (the original's choice). Takes effect when the next mission starts |
| 6 Time compression | Cycles 1× / 2× / 4× |
| 7 Advanced options | Opens the advanced options (below) without leaving the mission |

Items 5, 6 and 7 are additions to the original, which has items 1 to 4.

## The demonstration and history

**2** at the menu plays a guided tour of the screens, in the order the original program runs them (main screen, chart, quadrant map, radar, captain's log, then the enemy ships, torpedoes, depth charges and the damage report; the order was traced from `DEMO.EXE`'s code, see `analysis/demo_flow.md`). The remake plays it once and returns to the menu; the original starts over until you press F1. **F1** leaves it and **F2** turns its sound off; any other key skips the opening page and the Morse example. **3** opens the history and specifications pages: Space, Enter, the right and down arrows or PgDn go on, the left and up arrows or PgUp go back, Home and End jump to the first and last page, and **Esc** leaves (the history opens on that page next time); a PAGE line shows where you are. Any other key also goes on, and **R** at the end rereads them. The advanced options switch HISTORY PAGE KEYS (row 45) turns this off, which gives the 1984 behaviour: any key goes forward only.

## Display

**V** switches between three views of the 320 × 200 picture:

1. **Authentic** (default): whole-number scaling, sharp pixels, black borders.
2. **Fit**: fills the window and keeps the 8:5 shape.
3. **CRT**: Fit plus faint scanlines and a soft vignette.

## Advanced options

Menu item **5** (or item 7 in GAME CONTROL during a mission) opens a settings screen where the additions this remake makes to the 1984 game can be switched back to the original's behaviour, one by one. Up/Down select, Enter or Space switch, Left/Right change page, **R** restores the defaults, Esc goes back. The text under the list says what each switch does when it is on and when it is off.

The defaults keep the additions (key help, display modes, wake-dot toggle, time compression, the 2.5 steps a second pace, message boxes that wait for a key, and so on), except for the helm status line, skipping the sinking scene, enhanced graphics, custom controls, simple speed keys and the wrap-around world, which are off (ship navigation symbols are on, but only take effect with enhanced graphics).

**Enhanced graphics.** Off gives the 1984 picture. On redraws the screens sharply at your screen's resolution, in natural colours and with typewriter text:

- **Control room:** a graded sky (stars at night), a swell on the sea, and ships coloured by role (warships grey, merchants and tankers rust red, the troop carrier buff, the sub tender white) with shading and a reflection. The periscope has a lens vignette and crosshair and turns greener with depth; raising or lowering it moves a soft lens shutter.
- **Panel:** brass-framed dials with coloured zones (green at periscope depth and cruising speed, red near crush depth, amber at flank speed), amber needles, level bars for fuel, battery and oxygen, glowing lamps (red for low fuel, low battery and damage, amber for charging, green for open doors and ready tubes) and a dim red light at night. Two chevrons show whether the periscope is up (green) or down (amber), and a compass card shows which way it looks.
- **Damage:** a damaged periscope shows cracked glass, and a damaged compartment cracks the glass of its own gauges and lamps (they keep working). When the boat is lost the periscope and each instrument crack in turn before the sea comes in. The damage report is a side view of the boat with each compartment glowing green or pulsing red.
- **Radar, chart, map:** a glowing radar sweep; the chart and quadrant map show the real islands, the chart with a dotted shoal around each.
- **Text screens:** the Captain's Log is a typed ledger page; GAME CONTROL, the advanced options, the controls, the help, the history and the message boxes keep their layout on a gunmetal board in typewriter type. The logo, title page, menu, orders and the demo's Morse example are redrawn too.
- **Display:** **V** still switches between Fit and CRT, and the picture fills the window, wide screens included.

**Ship navigation symbols** (listed only while enhanced graphics is on) draw the ships of the radar, chart and quadrant map like a marine navigation display:

- **Symbols:** a ship under way is a triangle pointing the way it is heading; a stopped ship (below 0.5 knots) is a circle; a damaged one has a dashed outline. Colours: green freighter, red oil tanker, blue transport, orange patrol craft, yellow destroyer, cyan sub tender, white your own boat.
- **At difficulty 2 and below** (where the chart shows the ships) each ship also has a thin heading line, a short bar at its tip while it turns (left for port, right for starboard), a dashed velocity vector ending in a dot, and a trail of up to five dots behind it. Harder levels show only the symbols, so the game is no easier.
- **Vector length:** **O** sets it to 3, 6 or 12 intervals, an interval being the time between two trail dots: one game minute (10 simulation steps) on the radar and map, three on the zoomed-out chart, which therefore looks further ahead. A legend such as `VECTOR 18 MIN  DOTS 3 MIN` on each screen says how far ahead the vector reaches and how far apart the dots are.
- **Data tag:** **U** tags the nearest ship, then the next, until none. It shows the class and contact number (`FREIGHTER #4`; ships have no names until sunk), speed in knots and true heading. It is placed where it hides no other ship, heading line or vector, and a thin line joins it to its ship if it stands away.
- On the radar, which is heading-up, headings are shown relative to your bow. Off gives the plain glowing dots.

**Wrap-around world.** The original stops the boat at the edge of the 5 × 4 map. With this switch on the map joins its opposite edges: leave through the east edge and you come in at the west, and the same north and south. Ships and torpedoes wrap too, and distances, torpedo hits and ship routes take the shorter way round, so a ship just across the seam is close, not 25,000 units away. The chart and quadrant map stay flat pictures, so a ship that crosses an edge appears on the other side. Off keeps the original behaviour.

**Ships turn gradually.** In the original a ship takes the heading of the next leg of its route in one step, even a half turn. With this switch on (the default) it swings round at the turn rate of its class, warships a little faster than merchants, and counts a waypoint as reached once it is inside its turning circle, so it does not circle it. Ships that have spotted you already turned at a fixed rate in the original.

**Custom controls.** With this switch on, the game uses a second layout built for a modern keyboard (the right-hand column of the controls table), which you can then change key by key. Press **C** on the advanced options screen to open *Control assignments*: pick an action, press Enter, then press the new key. If the key is already used you are warned and can override it (the other action is left without a key) or cancel. **Delete** clears an action, **R** restores the custom layout. Tab and Esc are fixed. Only the mission keys can be changed, and the controls help shows the keys in force. With the switch off you get the original keys, and your assignments are kept for later.

**Simple speed keys** (listed only while custom controls is on) replaces the four speed-stage keys and the two engine keys by `=` (speed up one step), `-` (speed down one step), `0` (all stop), `Backspace` (reverse) and `E` (switch between diesel and electric).

## Your saved data

Everything is kept in the browser's local storage for the site's address, so it is separate for each browser and for each address (for example `localhost` and your Pages site). Clearing the site's data resets it. Nothing is sent anywhere.

| What | Key |
| --- | --- |
| Captain's Log | `gato.captains-log.v1` |
| Advanced options and key assignments | `gato.advanced`, `gato.controls` |
| Display mode, wake dots, time speed | `gato.display`, `gato.trails`, `gato.timeScale` |

## Credits and license

*GATO* was written by **Paul Arlton** and **Ed Dawson** and is © 1984 Spectrum HoloByte, Inc. This is an unofficial fan remake, with enhancements by Jared Mathes.

The remake's own code, tools, documentation and additions are licensed under [CC BY-NC-SA 4.0](LICENSE.md): you may share and adapt them for non-commercial purposes, with credit, under the same license. That license does **not** cover the original game or anything extracted from it (the game's data, text and artwork in `remake/src/data/` and `remake/public/assets/`, the files in `Original/`, and the disassembly in `analysis/`). Those belong to their owners, so check that you have the right to publish them before you do (see [Publishing](remake/README.md#publishing-on-github-pages)). [LICENSE.md](LICENSE.md) has the details.

## For developers

- [remake/README.md](remake/README.md): building, testing, how the code is organised, publishing.
- [analysis/README.md](analysis/README.md): how the original was reverse-engineered, with the findings.
