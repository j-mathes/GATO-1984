/**
 * Constants recovered from Gato1.exe (compiled BASIC).  Each group names the program offset (file offset) where the
 * value is used; "ds:" is the BASIC data-segment offset of the constant.  Values marked (inferred) are not read
 * directly from the code.
 */

/** World, from the position clamp at 0x067a1-0x067cf (ds:0x26e2 = 24999, ds:0x26e6 = 19999) and the quadrant formula at 0x0c6c8. */
export const WORLD = {
  maxX: 24999,
  maxY: 19999,
  quadrantSize: 5000,
  columns: 5,
  rows: 4,
} as const;

/** Vessel array slots (the BASIC arrays are indexed 1..8). Slot 1 is the island of the current quadrant, loaded from MXP by GOSUB c6c7. */
export const SLOT = { island: 1, tender: 2, firstEnemy: 3, last: 8 } as const;

/** Type codes in COURXX row 1 / OBX file numbers. 2 is never used by a file (there is no OBX2); likely the player's boat (inferred). */
export const TYPE = {
  island: 1,
  subtender: 3,
  freighter: 4,
  tanker: 5,
  troopCarrier: 6,
  patrolBoat: 7,
  destroyer: 8,
} as const;

/** Compartments, indexes of the damage array A177a[1..8]. Mapping from the damage-report layout (0x0a652-0x0a7b8) and the use of each cell. */
export const COMPARTMENT = {
  radioRoom: 1,
  torpedoRoom: 2,
  batteryRoom: 3,
  fuelTanks: 4,
  engineRoom: 5,
  periscopes: 6,
  controlRoom: 7,
  conningTower: 8,
} as const;

/** Start state, from the initialisation at 0x040fd-0x0429d. */
export const START = {
  /** x = 5000 + FIX(RND*5000), y likewise (0x04109, 0x0412c): inside quadrant 7. */
  spawnBase: 5000,
  spawnSpan: 5000,
  heading: 1.507, // ds:0x24de, radians, mathematical angle (0 = east, counter-clockwise)
  fuel: 36040, // ds:0x24d2
  battery: 1000, // ds:0x24d6
  oxygen: 1426, // ds:0x24e6
  torpedoes: 24, // ds:0x24ea
  engine: 2, // v2182 = 2 (diesel)
} as const;

export const ENGINE = { off: 0, electric: 1, diesel: 2 } as const;

/** Helm and speed, 0x05f02-0x05f29, 0x07373-0x073fc, 0x066ee, 0x062ac-0x06300. */
export const HELM = {
  accelPerStep: 0.25, // ds:0x26ac, added while speed < ordered
  decelPerStep: -1, // speed + (-1) while speed >= ordered
  rudderStep: 0.005, // ds:0x264a / 0x2646
  headingWrapMax: 6.28, // ds:0x26b8 (not 2*pi: the original wraps to 0 above 6.28 and to 6.28 below 0)
  speedCommands: { F1: 10, F3: 8, F5: 6, F7: 3 }, // 0x054c5-0x05588 use 3, 6, 8, 10
} as const;

/** Depth rules, 0x05701-0x057ba, 0x06032, 0x060bd, 0x0660f, 0x06fa9, 0x06f1c. */
export const DEPTH = {
  periscopeMax: 45, // F2 only works at or above this depth, ds:0x264e
  shallow: 20, // "submerged" threshold used for snorkel, oxygen drain, forced sinking at slow speed, ds:0x2652
  scopeBlankBelow: 46, // contacts are only drawn through the periscope above this depth (ds:0x25da)
  collisionSafe: 34, // ramming a ship at less than this depth destroys the boat, ds:0x2742
  periscopeBreaks: 61, // ramming with the periscope up and depth < 61 breaks it, ds:0x2746
  crushStart: 350, // ds:0x274a
  crushBase: -0.04, // ds:0x2752
  crushSlope: 0.000112, // ds:0x274e
} as const;

/** Resource use per step, 0x071d1-0x072d7. */
export const RESOURCES = {
  dieselFuelPerSpeed: 0.25, // ds:0x26ac: fuel -= |speed|*0.25
  fuelTankDamageCost: 5, // ds:0x25ea: plus 5 per step if fuel tanks are damaged
  electricSpeedLimit: 11, // ds:0x2798: battery drain only applies while speed < 11
  batterySpeedSquaredCost: 0.02, // ds:0x279c
  batteryDamageCost: 0.5,
  chargePerStep: 2, // diesel charges the battery by 2 per step (until 1000)
  chargeFuelCost: 3, // and costs 3 fuel
  batteryMax: 1000,
  oxygenDrainPerStep: 0.25, // ds:0x27a4, while submerged (depth > 20)
  oxygenDeadline: 110, // ds:0x27a8: "No more oxygen" below this
  oxygenRegenPerStep: 2, // 0x05c25 while on diesel and oxygen < 1424
  oxygenRegenCap: 1424, // ds:0x26a4
  fuelLowAlert: 9022, // ds:0x26a8
  batteryLowAlert: 100, // ds:0x256c
} as const;

/** Torpedoes, 0x0807d-0x08156 (launch) and 0x0815f-0x08665 (flight and hits). */
export const TORPEDO = {
  tubes: 4,
  speed: 17, // ds:0x2824: A1172[tube] = 17
  substepsPerTick: 3, // FOR v2286 = 1 TO 3 around the flight code
  maxRange: 960, // ds:0x2828
  hitListRange: 1200, // ds:0x2834: only ships closer than this to the boat are tested
  /** Hit ellipse: distance < base + cos(angle between torpedo bearing and ship heading)^6 * length. */
  patrolBoat: { base: 9.24, length: 14 }, // ds:0x2838, 0x2626
  other: { base: 9.9, length: 18 }, // ds:0x2840, 0x283c
  damagedSpeed: 1.75, // ds:0x27d4: marker speed written to a hit ship
  ownBoatKillSize: 50, // ds:0x286c: a visible hit whose apparent size exceeds this destroys the boat
} as const;

/** Contacts, 0x06908-0x06f84. */
export const CONTACT = {
  maxTrackDistance: 4000, // ds:0x26ee
  closeListDistance: 1350, // ds:0x26f2 (also the radar range)
  collisionDistance: 20,
  radarScale: 0.065, // ds:0x2900: pixels per unit on the radar
  /** Apparent size: patrol boat -2 + 260/(d-6)^0.67, others -3.8 + 145/sqrt(|d-15|), capped (0x06d56-0x06e8c). */
  sizeCap: 250,
  minVisibleSize: 0.5,
  frameCount: 16,
  frameStep: 0.393,
} as const;

/** Enemy behaviour, 0x07417-0x07d87. */
export const ENEMY = {
  detectionRange: 950, // ds:0x27c8
  alertBaseTicks: 45, // alert lasts 45 + difficulty*15 steps (0x07438)
  alertPerDifficulty: 15,
  detectionBase: 2, // numerator (2 + difficulty + periscope) * (0.2 + timeOfDay)
  detectionNight: 0.2,
  detectionDepthExponent: 1.8,
  detectionOuterExponent: 1.5,
  merchantTurn: 0.028, // ds:0x27d8
  warshipTurn: 0.035, // ds:0x27e4
  merchantFleeBase: 7, // speed = 7 + difficulty
  warshipChaseBase: 10, // speed = 10 + difficulty
  arrivalRadius: 20,
  lastWaypoint: 7,
  islandMargin: 150, // ds:0x27ec
  sunkY: -2000, // ds:0x287c
  sunkThreshold: -900, // ds:0x27e8
} as const;

/** Depth charges, 0x0d1be-0x0d29a. */
export const DEPTH_CHARGE = {
  baseChance: 0.1, // ds:0x326a
  chancePerDifficulty: 0.03, // ds:0x2864
  rangeBase: 240, // ds:0x2bd6
  rangeDepthFactor: 1.5, // ds:0x2712
} as const;

/** Resupply at the subtender, 0x07108-0x071bf and 0x0cd8e-0x0cf8b. */
export const RESUPPLY = {
  range: 150, // ds:0x278c
  alignmentLow: 0.393, // ds:0x270e: headings of tender and boat must differ by less than this ...
  alignmentHigh: 5.887, // ds:0x2794: ... or by more than this (the same thing across the 2 pi wrap)
  fuelFullThreshold: 35950, // ds:0x2790
  fuelPerStep: 9, // fuel = v231a*90 with v231a += 0.1
  fuelCeiling: 36000, // v231a stops at 400
  stepsPerTick: 10, // not in the original (its loops are timing dependent); remake choice
  torpedoReloadTicks: 60, // 600-iteration delay per torpedo in the original; remake choice
} as const;

/** Island collision, 0x067db-0x068e2. */
export const ISLAND = {
  exponent: 1.001, // ds:0x26ea
  pushForward: 6, // ds:0x25ee
  pushReverse: 1,
  objectiveRadiusMargin: 200, // ds:0x2756: speed 0 within inner radius + 200
} as const;

/** The GAME CONTROL menu, 0x0aeea-0x0b165. */
export const GAME_CONTROL = {
  minDifficulty: 0,
  maxDifficulty: 9,
  minMission: 1, // remake addition: [5] MISSION SELECT
  maxMission: 20,
} as const;

/** Display conversion, 0x0a183: compass degrees = CINT(450.0117 - radians*57.2958) MOD 360. */
export const COMPASS = { offset: 450.0117, degreesPerRadian: 57.2958 } as const;

/** Relative-bearing windows of the scope for each facing key, from 0x05976-0x05b3b (radians, 0 = straight ahead). */
export const SCOPE_WINDOWS = {
  F: { lo: 5.4978, hi: 0.7854, wraps: true }, // ahead: (5.4978, 6.3) or [-0.1, 0.7854)
  P: { lo: 0.7854, hi: 2.356, wraps: false }, // port, counter-clockwise from ahead
  A: { lo: 2.356, hi: 3.927, wraps: false },
  S: { lo: 3.927, hi: 5.4978, wraps: false },
} as const;

/** Angle offset of each scope facing (v21ae): F 0, P 1.571, A 3.142, S 4.7124. */
export const SCOPE_OFFSET = { F: 0, P: 1.571, A: 3.142, S: 4.7124 } as const;

/** Damage thresholds, 0x05be4 and 0x06441-0x065b6. */
export const DAMAGE = {
  maxCompartments: 5, // more than 5 damaged compartments destroys the boat
  alarmIndexSum: 14, // sum of damaged compartment numbers above this sounds the alarm
  lostIndexSum: 20, // ... and above this the boat is lost at the next alarm step
} as const;
