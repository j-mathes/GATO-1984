# Analysis of the original GATO programs

How the 1984 DOS game was taken apart to build the remake. The original files are in `../Original/`; the remake is in [`../remake/`](../remake/README.md). Start with [findings.md](findings.md) for what was learned and how sure it is.

## Documents

| Document | Subject |
| --- | --- |
| [findings.md](findings.md) | Summary of what the four executables do, the rules recovered, and what is estimated rather than exact |
| [remake_additions.md](remake_additions.md) | Every feature the remake has that the original does not, where it lives in the code, its default and how to switch it off |
| [file_inventory.md](file_inventory.md) | Every file in `Original/`: size, entropy, strings and a hex dump of the first 256 bytes (generated) |
| [exe_architecture.md](exe_architecture.md) | How the executables relate: compression check, runtime family, chaining, strings (generated) |
| [architecture_map.md](architecture_map.md) | Function index of the Ghidra exports (generated; machine-readable form in `function_index.json`) |
| [data_tables.md](data_tables.md) | Embedded tables, repeating blocks and graphics data in `DEMO.EXE` and `GATO1.EXE` (generated) |
| [loader_verification.md](loader_verification.md) | The scenario-file loaders compared with `parse_scenarios.py`, and the `ds:0x23a6` finding |
| [gato1_screens.md](gato1_screens.md) | The exact layouts of the instrument panel, damage report, radar, chart, quadrant map and log |
| [title_art.md](title_art.md) | How the title screen and the launcher backdrop are drawn, rebuilt and verified |
| [demo_flow.md](demo_flow.md) | The sequence and layout of `DEMO.EXE`, checked against screenshots |
| [radio_and_explosions.md](radio_and_explosions.md) | The messages GATO1 prints during a mission and the torpedo-hit explosion |

`reference_screenshots/` holds DOSBox captures of the original used to check the remake. `gato1_basic.txt` is the decompiled pseudo-BASIC of `GATO1.EXE` and `*_statements.txt` the statement listings; `disasm/` and `strings/` hold the disassembly, decompilation and string dumps; `json/` is the parsed scenario data.

## Scripts

Run them from the repository root with Python 3. Those marked "capstone" need `pip install capstone`, those marked "Pillow" need `pip install Pillow`; the rest use only the standard library.

| Script | Writes |
| --- | --- |
| `inspect_files.py` | `file_inventory.md` |
| `inspect_exe.py`, `map_executables.py` | `exe_strings*.txt`, `strings/`, `exe_architecture.md` |
| `index_functions.py` (capstone) | `architecture_map.md`, `function_index.json` |
| `scan_data_tables.py` | `data_tables.md` |
| `parse_scenarios.py` | `json/` (courses, orders, map). Then `npm run sync:data` in `remake/` copies it into the remake |
| `list_statements.py`, `decompile_gato1.py` (capstone) | `*_statements.txt`, `gato1_basic.txt` |
| `export_sprites.py` (Pillow) | `remake/public/assets/sprites/` |
| `export_title_art.py` (Pillow) | `remake/public/assets/title_screen.json` and the title PNGs |
| `export_cockpit_layouts.py` (Pillow) | `remake/public/assets/cockpit_layouts.json` and PNGs |
| `export_audio_tables.py` (capstone) | `remake/src/data/audio_tables.json` |
| `export_demo_script.py` | `remake/src/data/demo_script.json` |
| `export_history_pages.py`, `extract_history.py` | `remake/src/data/history_pages.json`, `history_content.json` |
| `export_ship_log.py` | `remake/src/data/ship_log.json` |
| `verify_cockpit_layouts.py` (Pillow) | prints the pixel comparison against `reference_screenshots/` |
| `trace_tools.py`, `rt_dump.py`, `decode_gato1_slice.py`, `inline_operands.py` | helpers for reading a range of the compiled code (usage in each file's docstring) |

The Ghidra project (`../ghidra/`) is not kept in the repository.
