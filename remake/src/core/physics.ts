import { COMPASS, COMPARTMENT, DEPTH, ENGINE, HELM, ISLAND, RESOURCES, START, WORLD } from "./constants.js";
import { cint } from "./rng.js";
import type { EngineMode, Rng, ScopeFacing, SimEvent, SubmarineState } from "./types.js";

/** Player commands. Key names are those of the original: F1/F3/F5/F7 forward, F10 reverse, F9 stop, T doors, F2/F4 periscope. */
export type HelmCommand =
  | { type: "speed"; level: "F1" | "F3" | "F5" | "F7" | "reverse" | "stop" }
  | { type: "engine"; mode: "diesel" | "electric" }
  | { type: "rudder"; direction: "left" | "right" | "neutral" }
  | { type: "planes"; direction: "up" | "down" | "neutral" }
  | { type: "doors" }
  | { type: "periscope"; direction: "raise" | "lower" }
  | { type: "scope"; facing: ScopeFacing };

export function createSubmarine(rng: Rng): SubmarineState {
  return {
    x: START.spawnBase + Math.trunc(rng.next() * START.spawnSpan),
    y: START.spawnBase + Math.trunc(rng.next() * START.spawnSpan),
    heading: START.heading,
    speed: 0,
    orderedSpeed: 0,
    rudder: 0,
    turnRate: 0,
    planes: 0,
    depth: 0,
    engine: START.engine,
    fuel: START.fuel,
    battery: START.battery,
    oxygen: START.oxygen,
    torpedoes: START.torpedoes,
    doorsOpen: false,
    periscopeUp: false,
    scopeFacing: "F",
    damage: [0, 0, 0, 0, 0, 0, 0, 0, 0],
    lastTube: 0,
    alertTimer: 0,
    resupply: null,
    fuelAlert: false,
    batteryAlert: false,
  };
}

const engineValue = (mode: EngineMode): number => mode;

/** Ordered speed: (N - doorsOpen) * (1 - 0.5*engineRoomDamage) * engine, Gato1.exe 0x054c5-0x05588. */
function orderedFor(sub: SubmarineState, nominal: number): number {
  return (nominal - (sub.doorsOpen ? 1 : 0)) * (1 - (sub.damage[COMPARTMENT.engineRoom] ?? 0) * 0.5) * engineValue(sub.engine);
}

/** Apply one player command (the key handlers at 0x054b3-0x05b60). */
export function applyHelmCommand(sub: SubmarineState, cmd: HelmCommand): void {
  switch (cmd.type) {
    case "speed": {
      if (cmd.level === "stop") sub.orderedSpeed = 0;
      else if (cmd.level === "reverse") sub.orderedSpeed = -(1 - (sub.damage[COMPARTMENT.engineRoom] ?? 0) * 0.5) * engineValue(sub.engine);
      else sub.orderedSpeed = orderedFor(sub, HELM.speedCommands[cmd.level]);
      return;
    }
    case "engine": {
      if (cmd.mode === "diesel" && sub.fuel > 0 && sub.engine !== ENGINE.diesel) {
        sub.engine = ENGINE.diesel;
        sub.orderedSpeed *= 2;
      } else if (cmd.mode === "electric" && sub.battery > 0 && sub.engine !== ENGINE.electric) {
        sub.engine = ENGINE.electric;
        sub.orderedSpeed *= 0.5;
      }
      return;
    }
    case "rudder":
      sub.rudder = cmd.direction === "left" ? HELM.rudderStep : cmd.direction === "right" ? -HELM.rudderStep : 0;
      return;
    case "planes":
      if (cmd.direction === "up") {
        if (sub.depth > 0) sub.planes = -1;
      } else if (cmd.direction === "down") sub.planes = 1;
      else sub.planes = 0;
      return;
    case "doors": {
      const shift = Math.sign(Math.abs(sub.orderedSpeed)) * engineValue(sub.engine) * 0.5;
      sub.orderedSpeed += sub.doorsOpen ? shift : -shift;
      sub.doorsOpen = !sub.doorsOpen;
      return;
    }
    case "periscope":
      if (cmd.direction === "raise") {
        if (!sub.periscopeUp && sub.depth <= DEPTH.periscopeMax) sub.periscopeUp = true;
      } else if (sub.periscopeUp && sub.depth <= DEPTH.periscopeMax) sub.periscopeUp = false;
      return;
    case "scope":
      sub.scopeFacing = cmd.facing;
      return;
  }
}

/** Neutral key ('5' on the keypad): rudder and planes to zero (0x06702-0x0671f). */
export function centreControls(sub: SubmarineState): void {
  sub.rudder = 0;
  sub.planes = 0;
}

/** Number of damaged compartments: sum of A177a[1..8] (0x05b68-0x05ba0). More than 5 destroys the boat (0x05be4). */
export function damageCount(sub: SubmarineState): number {
  return sub.damage.reduce((a, b, i) => (i === 0 ? a : a + b), 0);
}

/**
 * Sum of the indexes of the damaged compartments (0x06441-0x06494, the code adds the loop index, not the damage value).
 * Above 14 the boat sounds an alarm every second step; above 20 at such a step it is lost (0x06508-0x065b6).
 */
export function damageIndexSum(sub: SubmarineState): number {
  let sum = 0;
  for (let k = 1; k <= 8; k += 1) if ((sub.damage[k] ?? 0) > 0) sum += k;
  return sum;
}

/**
 * Engine cut-outs and alarms, 0x05bf9-0x05e84. Order of the original: oxygen regeneration on diesel, diesel cut-out
 * (no fuel or deeper than 20), electric cut-out (battery flat), blinking low-fuel / low-battery alarms.
 */
export function stepEngineChecks(sub: SubmarineState, events: SimEvent[]): void {
  if (sub.oxygen < RESOURCES.oxygenRegenCap && sub.engine === ENGINE.diesel) sub.oxygen += RESOURCES.oxygenRegenPerStep;
  if ((sub.fuel < 1 || sub.depth > DEPTH.shallow) && sub.engine === ENGINE.diesel) {
    sub.orderedSpeed = 0;
    sub.engine = ENGINE.off;
    events.push({ type: "engineCutOut", mode: ENGINE.diesel });
  }
  if (sub.battery < 1 && sub.engine === ENGINE.electric) {
    sub.battery = 0;
    sub.orderedSpeed = 0;
    sub.engine = ENGINE.off;
    events.push({ type: "engineCutOut", mode: ENGINE.electric });
  }
  if (sub.fuel <= RESOURCES.fuelLowAlert) {
    sub.fuelAlert = !sub.fuelAlert;
    if (sub.fuelAlert) events.push({ type: "fuelLow" });
  } else sub.fuelAlert = false;
  if (sub.battery <= RESOURCES.batteryLowAlert) {
    sub.batteryAlert = !sub.batteryAlert;
    if (sub.batteryAlert) events.push({ type: "batteryLow" });
  } else sub.batteryAlert = false;
}

/** One speed adjustment: +0.25 while below the order, otherwise -1 (0x05eb2-0x05f29; the original runs it twice per loop). */
export function stepSpeed(sub: SubmarineState): void {
  if (sub.speed === sub.orderedSpeed) return;
  if (sub.speed < sub.orderedSpeed) sub.speed += HELM.accelPerStep;
  else sub.speed += HELM.decelPerStep;
}

/** One heading adjustment (0x062ac-0x06300, 0x073bb-0x073fc). Wraps to 0 above 6.28 and to 6.28 below 0. */
export function stepHeading(sub: SubmarineState): void {
  if (sub.turnRate === 0) return;
  sub.heading += sub.turnRate;
  if (sub.heading > HELM.headingWrapMax) sub.heading = 0;
  else if (sub.heading < 0) sub.heading = HELM.headingWrapMax;
}

/** Depth, 0x065c7-0x0664e. A boat that is slow but moving below 20 cannot hold depth and sinks (planes forced down). */
export function stepDepth(sub: SubmarineState): void {
  if (sub.planes === -1 && sub.depth === 0) sub.planes = 0;
  sub.depth += sub.planes;
  if (sub.speed !== 0 && sub.speed < 2 && sub.depth > DEPTH.shallow) sub.planes = 1;
}

/** Position update and clamp, 0x0672b-0x067cf. */
export function stepPosition(sub: SubmarineState): void {
  sub.turnRate = sub.speed * sub.rudder; // 0x066ee
  sub.x += Math.cos(sub.heading) * sub.speed;
  sub.y += Math.sin(sub.heading) * sub.speed;
  sub.x = Math.min(Math.max(sub.x, 1), WORLD.maxX);
  sub.y = Math.min(Math.max(sub.y, 1), WORLD.maxY);
}

export interface IslandShape {
  x: number;
  y: number;
  innerRadius: number;
  outerRadius: number;
}

/**
 * Island collision, 0x067db-0x068e2: depth + ((x-ix)/r1)^2 + ((y-iy)/r2)^2 <= 1 + depth^1.001.
 * The boat is pushed back along the (previous) bearing to the island by 6 when moving forward, else by 1, and its
 * ordered speed and planes are cleared. Returns true when it ran aground.
 */
export function resolveIslandCollision(sub: SubmarineState, island: IslandShape, bearingToIsland: number): boolean {
  const e = ((sub.x - island.x) / island.innerRadius) ** 2 + ((sub.y - island.y) / island.outerRadius) ** 2;
  if (sub.depth + e > 1 + sub.depth ** ISLAND.exponent) return false;
  sub.orderedSpeed = 0;
  sub.planes = 0;
  const push = sub.speed > 0 ? ISLAND.pushForward : ISLAND.pushReverse;
  sub.x -= Math.cos(bearingToIsland) * push;
  sub.y -= Math.sin(bearingToIsland) * push;
  return true;
}

/** Fuel, battery and oxygen, 0x071c0-0x072d7. Returns "suffocated" once oxygen falls below 110. */
export function stepResources(sub: SubmarineState): "ok" | "suffocated" {
  if (sub.engine === ENGINE.diesel) {
    sub.fuel = sub.fuel - Math.abs(sub.speed * RESOURCES.dieselFuelPerSpeed) - (sub.damage[COMPARTMENT.fuelTanks] ?? 0) * RESOURCES.fuelTankDamageCost;
  } else if (sub.speed < RESOURCES.electricSpeedLimit && sub.engine === ENGINE.electric) {
    sub.battery =
      sub.battery - sub.speed * sub.speed * RESOURCES.batterySpeedSquaredCost - (sub.damage[COMPARTMENT.batteryRoom] ?? 0) * RESOURCES.batteryDamageCost;
  }
  if (sub.battery < RESOURCES.batteryMax && sub.engine === ENGINE.diesel) {
    sub.battery += RESOURCES.chargePerStep;
    sub.fuel -= RESOURCES.chargeFuelCost;
  }
  if (sub.depth > DEPTH.shallow) sub.oxygen -= RESOURCES.oxygenDrainPerStep;
  return sub.oxygen < RESOURCES.oxygenDeadline ? "suffocated" : "ok";
}

/** Pressure hull, 0x06fa9: below 350 the boat is crushed with probability -0.04 + depth*0.000112 per step. */
export function crushRoll(sub: SubmarineState, rng: Rng): boolean {
  if (sub.depth <= DEPTH.crushStart) return false;
  return rng.next() < DEPTH.crushBase + sub.depth * DEPTH.crushSlope;
}

/** Compass bearing in degrees as shown on the radar screen: CINT(450.0117 - rad*57.2958) MOD 360 (0x0a183). */
export function compassDegrees(heading: number): number {
  const d = cint(COMPASS.offset - heading * COMPASS.degreesPerRadian) % 360;
  return d < 0 ? d + 360 : d;
}
