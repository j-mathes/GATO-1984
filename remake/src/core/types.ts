import type { ENGINE } from "./constants.js";
import type { RadioMessageId } from "./radio.js";

/** Source of uniform random numbers in [0, 1), the equivalent of BASIC's RND. */
export interface Rng {
  next(): number;
}

/** 0 = night, 1 = day: "[3] TIME OF DAY" in GAME CONTROL (ds:0x21ca). */
export type TimeOfDay = 0 | 1;
export type EngineMode = (typeof ENGINE)[keyof typeof ENGINE];
export type TubeIndex = 1 | 2 | 3 | 4;
export type ScopeFacing = "F" | "P" | "A" | "S";

// --------------------------------------------------------------------------------------------------------------------
// Parsed scenario files (the JSON written by analysis/parse_scenarios.py)
// --------------------------------------------------------------------------------------------------------------------

export interface CourseWaypointJson {
  seq: number;
  x: number;
  y: number;
  speed_knots: number;
  used: boolean;
}

export interface CourseShipJson {
  index: number;
  type_code: number;
  start: { x: number; y: number };
  waypoints: CourseWaypointJson[];
}

/** analysis/json/courses/COURXXn.json */
export interface CourseJson {
  ships: CourseShipJson[];
  trailer: { objective_quadrant: number; flag_b: number; value_c: number };
}

/** analysis/json/orders/ORDXXn.json */
export interface OrdersJson {
  classification?: string;
  to?: string;
  from?: string;
  body_lines?: string[];
  message?: string;
  raw_lines: string[];
}

export interface MxpQuadrantJson {
  quadrant: number;
  has_island: boolean;
  center_x: number | null;
  center_y: number | null;
  radius_inner: number | null;
  radius_outer: number | null;
  attr_5: number | null;
  attr_6: number | null;
}

/** analysis/json/map/MXP.json */
export interface MxpJson {
  quadrants: MxpQuadrantJson[];
}

// --------------------------------------------------------------------------------------------------------------------
// Scenario as used by the simulation
// --------------------------------------------------------------------------------------------------------------------

export interface Waypoint {
  x: number;
  y: number;
  /** Row "speed" of the COURXX file. The ship travels to this waypoint at difficulty + speed (0x07a7b). */
  speed: number;
}

export interface ScenarioShip {
  /** Array slot 2..8: file column + 2. Slot 2 is the subtender. */
  slot: number;
  typeCode: number;
  start: { x: number; y: number };
  /** Always 7 entries, in file order; (0, 0) entries are kept (the original treats them as ordinary targets). */
  waypoints: Waypoint[];
}

export interface IslandRecord {
  quadrant: number;
  present: boolean;
  x: number;
  y: number;
  /** MXP column 3 (ds:0x222a): collision core, also the objective radius. */
  innerRadius: number;
  /** MXP column 4 (ds:0x222e). */
  outerRadius: number;
  /** MXP column 5 (ds:0x2382): index 1..3 of the island picture (three DRAW strings). */
  shape: number;
  /** MXP column 6 (ds:0x2386): DRAW scale (S=) of the island picture. */
  drawScale: number;
}

export interface MissionObjectives {
  /** COURXX trailer[0] (ds:0x2246): island quadrant to reach, 0 = none. */
  objectiveQuadrant: number;
  /** COURXX trailer[1] (ds:0x2242): TIME OF DAY (0 night, 1 day) required to complete the island objective. */
  requiredTimeOfDay: number;
  /** COURXX trailer[2] (ds:0x226a): the mission is complete when every ship in slots 3..lastConvoySlot is sunk. */
  lastConvoySlot: number;
}

export interface Scenario {
  /** 1..20 (11..20 repeat 1..10). */
  id: number;
  orders: OrdersJson;
  ships: ScenarioShip[];
  objectives: MissionObjectives;
  /** Indexed by quadrant number 1..20 (index 0 unused). */
  islands: IslandRecord[];
}

// --------------------------------------------------------------------------------------------------------------------
// Simulation state
// --------------------------------------------------------------------------------------------------------------------

/** One entry of the vessel arrays A1cf6/A1d1a/... (slots 1..8). */
export interface Vessel {
  slot: number;
  typeCode: number;
  x: number; // A1cf6
  y: number; // A1d1a
  targetX: number; // A1d3e
  targetY: number; // A1d62
  waypointIndex: number; // A1cae: counter of reached waypoints (0..8)
  speed: number; // A1dce
  heading: number; // A1ea6, math angle (0 = east, counter-clockwise)
  waypoints: Waypoint[];
  // Derived each step (A1df2, A1e16, A1e5e, A1e3a, A1d86)
  distance: number;
  bearing: number;
  relativeBearing: number;
  frame: number;
  apparentSize: number;
  sunk: boolean;
  /** Set to TORPEDO.damagedSpeed by a surviving torpedo hit (the original marks damage with speed 1.75). */
  damaged: boolean;
}

export interface Torpedo {
  tube: TubeIndex;
  active: boolean;
  x: number; // A114a
  y: number; // A115e
  heading: number; // A1186
  speed: number; // A1172: 0 when the tube is free
  travelled: number; // A119a
  spent: boolean; // A11ae: already hit something
}

export interface SubmarineState {
  x: number; // v2156
  y: number; // v215a
  heading: number; // v219a
  speed: number; // v2196
  orderedSpeed: number; // v2176
  rudder: number; // v217e
  turnRate: number; // v217a = speed * rudder
  planes: -1 | 0 | 1; // v21fa
  depth: number; // v2192
  engine: EngineMode; // v2182
  fuel: number; // v2186
  battery: number; // v218a
  oxygen: number; // v21a2
  torpedoes: number; // v21a6
  doorsOpen: boolean; // v21d6
  periscopeUp: boolean; // v219e = 1
  scopeFacing: ScopeFacing; // v21ae
  /** A177a[1..8]; index 0 unused. 0 = intact, 1 = damaged. */
  damage: number[];
  lastTube: number; // v2272
  alertTimer: number; // v21aa: 0 = enemies not alerted
  resupply: ResupplyState | null;
  /** Blink state of the low-fuel / low-battery alarms (ds:0x220a, ds:0x220e). */
  fuelAlert: boolean;
  batteryAlert: boolean;
}

export interface ResupplyState {
  stepsRemaining: number;
  reloadTicks: number;
}

export type GameStatus = "running" | "destroyed" | "suffocated";

export interface SinkRecord {
  slot: number;
  typeCode: number;
  record: number;
  name: string;
  tonnage: number;
}

export interface LogTotals {
  shipsSunk: number;
  tonnage: number;
  missionsCompleted: number;
}

export interface ShipLogRecord {
  record: number;
  name: string;
  tonnage: number;
  dateSunk: string;
  sunkFlag: number;
}

export interface SimOptions {
  /** GAME CONTROL [1], 0..9 (ds:0x2256). */
  difficulty: number;
  /** GAME CONTROL [2] (ds:0x09e2): true = sound on. */
  sound: boolean;
  /** GAME CONTROL [3] (ds:0x21ca). */
  timeOfDay: TimeOfDay;
  /** True while the control-room screen is shown (ds:0x21ce = 0). Explosions are only animated, and can only kill the
   * own boat, while the control room is the active screen and the scope is usable. */
  inControlRoom: boolean;
}

export type SimEvent =
  | { type: "torpedoLaunched"; tube: TubeIndex }
  | { type: "torpedoHit"; slot: number; typeCode: number; survived: boolean }
  | { type: "shipSunk"; record: SinkRecord | null; slot: number; typeCode: number }
  | { type: "depthCharge"; slot: number; compartment: number }
  | { type: "contactAlert"; slot: number }
  | { type: "waypointReached"; slot: number; waypoint: number }
  | { type: "collision"; slot: number }
  | { type: "periscopeBroken" }
  | { type: "resupplyStarted" }
  | { type: "resupplyFinished" }
  | { type: "objectiveReached" }
  | { type: "missionComplete"; reason: "island" | "convoySunk" }
  | { type: "subDestroyed"; reason: "damage" | "crush" | "collision" | "ownTorpedo" | "oxygen" }
  | { type: "fuelLow" }
  | { type: "damageAlarm" }
  | { type: "batteryLow" }
  | { type: "engineCutOut"; mode: EngineMode }
  /** A message of the original's radio/status set (core/radio.ts), emitted at its trigger. */
  | { type: "radio"; message: RadioMessageId }
  /** A visible torpedo hit started its explosion animation (core/explosion.ts). */
  | { type: "explosionStarted"; slot: number; survived: boolean };

// --------------------------------------------------------------------------------------------------------------------
// Static data
// --------------------------------------------------------------------------------------------------------------------

export interface HistoryPage {
  kind: string;
  lines: string[];
  [key: string]: unknown;
}

export interface HistoryPagesDocument {
  pages: HistoryPage[];
  [key: string]: unknown;
}

export interface DemoTextCell {
  /** 1-based LOCATE row and column of the 40 x 25 text grid; null where the PRINT continues the previous line. */
  row: number | null;
  col: number | null;
  text: string;
}

/** `LINE (x1,y1)-(x2,y2),0,BF`: the box a narration page is printed into, filled with the background colour of the screen behind it. */
export interface DemoBox {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: number;
}

export interface DemoPage {
  /** The page's number in the file (the order of `DemoScriptDocument.pages` is the run order, which differs). */
  page: number;
  lines: string[];
  delay_loop_limit: number | null;
  seconds_estimate: number | null;
  /** The printed lines with their cells (absent in old script files). */
  text?: DemoTextCell[];
  /** Narration box at the top of the screen; null for pages that are text of the drawn screen itself (damage report labels, GAME CONTROL, ...). */
  box?: DemoBox | null;
}

/** The "GATO DEMONSTRATION" page drawn first (grey SCREEN 1 background, white text). */
export interface DemoIntro {
  text: { row: number; col: number; text: string }[];
  seconds_estimate: number;
}

/** The orders example (file DEMORD) that is typed out with its Morse after the intro. */
export interface DemoMorseExample {
  file: string;
  lines: string[];
  /** Estimated seconds of the delay loop that ends the screen after the last character (any key ends it sooner). */
  end_hold_seconds_estimate: number | null;
}

export interface DemoScriptDocument {
  intro?: DemoIntro;
  morse?: DemoMorseExample;
  /** The narration pages in the order DEMO.EXE runs them (analysis/trace_demo_flow.py), not in file order. */
  pages: DemoPage[];
  /** Pages that are in the file but that the program never shows in the demo (game code it carries along). */
  unreached_pages?: { page: number; file_offset: string; lines: string[] }[];
  nominal_iterations_per_second: number;
}

export interface ShipLogDocument {
  record_wrap: number;
  draw_bands: Record<string, { first_record: number; span: number; type: string }>;
  records: { record: number; name: string; tonnage: number; date_sunk: string; sunk_flag: number }[];
}
