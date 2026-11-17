import { CONTACT, DEPTH, ENEMY, ISLAND, SCOPE_WINDOWS, SLOT, TORPEDO, TYPE, WORLD } from "./constants.js";
import { depthChargeAttack } from "./combat.js";
import { cint } from "./rng.js";
import type { IslandShape } from "./physics.js";
import type { IslandRecord, Rng, Scenario, ScopeFacing, SimEvent, SubmarineState, TimeOfDay, Vessel } from "./types.js";
import { WORLD_HEIGHT, WORLD_WIDTH, worldDelta, wrapInto } from "./world.js";

const TWO_PI = 6.2832; // ds:0x26fa
const PI = 3.1416; // ds:0x268c
const HALF_PI = 1.5708; // ds:0x26f6

/** Vessels indexed by slot 1..8 (index 0 is unused). Slot 1 is the island; load it with {@link loadIsland}. */
export function createVessels(scenario: Scenario): Vessel[] {
  const blank = (slot: number): Vessel => ({
    slot,
    typeCode: 0,
    x: 0,
    y: 0,
    targetX: 0,
    targetY: 0,
    waypointIndex: 0,
    speed: 0,
    heading: 0,
    desiredHeading: null,
    waypoints: [],
    distance: 0,
    bearing: 0,
    relativeBearing: 0,
    frame: 0,
    apparentSize: 0,
    sunk: false,
    damaged: false,
  });
  const vessels: Vessel[] = [];
  for (let slot = 0; slot <= SLOT.last; slot += 1) vessels.push(blank(slot));
  for (const ship of scenario.ships) {
    const v = vessels[ship.slot];
    if (!v) continue;
    v.typeCode = ship.typeCode;
    v.x = ship.start.x;
    v.y = ship.start.y;
    v.targetX = ship.start.x;
    v.targetY = ship.start.y;
    v.waypoints = ship.waypoints.map((w) => ({ ...w }));
  }
  const island = vessels[SLOT.island];
  if (island) island.typeCode = TYPE.island;
  return vessels;
}

/** GOSUB c6c7 (0x0c6c8): put the island of the boat's quadrant into slot 1. */
export function loadIsland(vessels: Vessel[], island: IslandRecord | undefined): void {
  const v = vessels[SLOT.island];
  if (!v) return;
  v.x = island ? island.x : -1;
  v.y = island ? island.y : -1;
}

export function islandShape(island: IslandRecord | undefined): IslandShape {
  return island && island.present
    ? { x: island.x, y: island.y, innerRadius: island.innerRadius, outerRadius: island.outerRadius }
    : { x: -1, y: -1, innerRadius: 1, outerRadius: 1 };
}

/** The island is reloaded only when the boat is within 21 units of a quadrant edge (0x06698). */
export function nearQuadrantEdge(sub: SubmarineState): boolean {
  const mx = Math.trunc(sub.x) % WORLD.quadrantSize;
  const my = Math.trunc(sub.y) % WORLD.quadrantSize;
  return my > 4979 || my < 21 || mx > 4979 || mx < 21;
}

// --------------------------------------------------------------------------------------------------------------------
// Contacts (0x06908-0x06f84)
// --------------------------------------------------------------------------------------------------------------------

function mathAngle(dx: number, dy: number): number {
  let a = dx === 0 ? Math.sign(dy) * HALF_PI : Math.atan(dy / dx);
  if (dx < 0) a += PI;
  while (a < 0) a += TWO_PI;
  return a;
}

/** Apparent size of a ship at `distance`: patrol boat -2 + 260/(d-6)^0.67, others -3.8 + 145/sqrt(|d-15|), capped at 250. */
export function apparentSize(typeCode: number, distance: number): number {
  const size =
    typeCode === TYPE.patrolBoat ? -2 + 260 / Math.pow(-6 + distance, 0.67) : -3.8 + 145 / Math.sqrt(Math.abs(-15 + distance));
  return Math.min(size, CONTACT.sizeCap);
}

export interface ContactResult {
  /** Slots within 1350 (plus slot 1), in order: the torpedo hit list (A1e82). */
  closeList: number[];
  /** First slot within 20 units of the boat, if any. */
  collision: { slot: number } | null;
}

/**
 * Update distance, bearing, relative bearing, sprite frame and apparent size of slots 1..8.
 * Slots beyond 4000 are skipped and keep their previous values (0x06994). With `wrap` (remake) distances and bearings go the shorter way round the world.
 */
export function updateContacts(sub: SubmarineState, vessels: Vessel[], island: IslandShape, wrap = false): ContactResult {
  const closeList: number[] = [];
  let collision: ContactResult["collision"] = null;
  for (let slot = SLOT.island; slot <= SLOT.last; slot += 1) {
    const v = vessels[slot];
    if (!v) continue;
    const { dx, dy } = worldDelta(sub.x, sub.y, v.x, v.y, wrap);
    v.distance = Math.sqrt(dx * dx + dy * dy);
    if (v.distance > CONTACT.maxTrackDistance) continue;
    if (!(slot > SLOT.island && v.distance > CONTACT.closeListDistance)) closeList.push(slot);
    v.bearing = mathAngle(dx, dy);
    let rel = v.bearing - sub.heading;
    while (rel < 0) rel += TWO_PI;
    v.relativeBearing = rel;
    let frame = cint((v.bearing - v.heading) * 2.55);
    while (frame < 0) frame += CONTACT.frameCount;
    while (frame > CONTACT.frameCount - 1) frame -= CONTACT.frameCount;
    v.frame = frame;
    if (slot === SLOT.island) v.apparentSize = -1.5 + 3000 / (90 + (v.distance - island.innerRadius)); // 0x06ca1
    else v.apparentSize = apparentSize(v.typeCode, v.distance);
    if (v.distance <= CONTACT.collisionDistance && collision === null) collision = { slot };
  }
  return { closeList, collision };
}

// --------------------------------------------------------------------------------------------------------------------
// Detection and alert (0x07417-0x07575)
// --------------------------------------------------------------------------------------------------------------------

export interface AiContext {
  sub: SubmarineState;
  vessels: Vessel[];
  difficulty: number;
  timeOfDay: TimeOfDay;
  island: IslandShape;
  rng: Rng;
  events: SimEvent[];
  /** Remake only: the world wraps (distances and routes take the shorter way round, positions wrap at the edges). */
  wrap?: boolean;
  /** Remake only: ships turn at their class's rate and take the waypoint when inside their turning circle, instead of snapping to the next leg's heading. */
  gradualTurns?: boolean;
}

/** Probability that a ship at `distance` notices the boat this step: ((2+difficulty+scope)*(0.2+tod)/(...))^1.5 (0x07540). */
export function detectionChance(sub: SubmarineState, distance: number, difficulty: number, timeOfDay: TimeOfDay): number {
  const periscope = sub.periscopeUp ? 1 : -1;
  const lit = (ENEMY.detectionBase + difficulty + periscope) * (ENEMY.detectionNight + timeOfDay);
  const depthTerm = Math.pow(Math.trunc(cint(sub.depth) / 20) + 1, ENEMY.detectionDepthExponent);
  const rangeTerm = Math.trunc(cint(distance) / 100) + 1;
  return Math.pow(lit / (depthTerm * rangeTerm), ENEMY.detectionOuterExponent);
}

/** Alert timer: counts up while enemies are alerted; when it expires ships 3..8 resume their route (0x07417-0x074f7). */
export function stepAlertTimer(sub: SubmarineState, vessels: Vessel[], difficulty: number): void {
  if (sub.alertTimer <= 0) return;
  sub.alertTimer += 1;
  if (ENEMY.alertBaseTicks + difficulty * ENEMY.alertPerDifficulty < sub.alertTimer) {
    sub.alertTimer = 0;
    for (let slot = SLOT.firstEnemy; slot <= SLOT.last; slot += 1) {
      const v = vessels[slot];
      if (!v) continue;
      v.waypointIndex -= 1;
      v.targetX = v.x;
      v.targetY = v.y;
    }
  }
}

// --------------------------------------------------------------------------------------------------------------------
// Enemy and tender movement (0x07503-0x07d87)
// --------------------------------------------------------------------------------------------------------------------

/** The original marks a damaged ship by writing the speed 1.75 into its speed cell. */
export function isMarkedDamaged(v: Vessel): boolean {
  return v.speed === TORPEDO.damagedSpeed;
}

function isWarship(v: Vessel): boolean {
  return v.typeCode > TYPE.troopCarrier;
}

/**
 * Turn direction test shared by merchants (turn away, 0.028) and warships (turn towards, 0.035, opposite sign), 0x0768f / 0x07799:
 * `(phi < 0 AND ABS(phi) < pi) OR (phi > 0 AND ABS(phi) > pi)`. The first ABS(phi) is the expression temporary at ds:0x23a6; it makes the
 * boat turn the short way round (an earlier port read it as 0).
 */
export function turnsPositive(phi: number): boolean {
  const a = Math.abs(phi);
  return (phi < 0 && a < PI) || (phi > 0 && a > PI);
}

function selectWaypoint(v: Vessel, difficulty: number): void {
  const wp = v.waypoints[v.waypointIndex - 1];
  if (wp) {
    v.targetX = wp.x;
    v.targetY = wp.y;
    // The row speed of waypoint W is the speed used while travelling TO W (0x07a7b).
    v.speed = difficulty + wp.speed;
  }
}

/** The heading from the ship to its target (the shorter way round the world with `wrap`); the original's arctangent, so it can be negative. */
function aimAngle(v: Vessel, wrap: boolean | undefined): number {
  const { dx, dy } = worldDelta(v.x, v.y, v.targetX, v.targetY, wrap);
  let a = dx === 0 ? Math.sign(dy) * HALF_PI : Math.atan(dy / dx);
  if (dx < 0) a += PI;
  return a;
}

/** A heading brought into 0..2pi. */
function normalHeading(a: number): number {
  let h = a;
  while (h < 0) h += TWO_PI;
  while (h >= TWO_PI) h -= TWO_PI;
  return h;
}

/** The ship takes the heading of its next leg at once (the original); with gradual turns only its first leg is taken at once and later legs are steered to. */
function aimAtTarget(ctx: AiContext, v: Vessel): void {
  const a = aimAngle(v, ctx.wrap);
  if (ctx.gradualTurns && v.desiredHeading != null) {
    v.desiredHeading = normalHeading(a);
    return;
  }
  v.heading = a;
  v.desiredHeading = normalHeading(a);
}

/** How fast a class of ship swings round (radians a step): the rate the original uses when it turns a ship away from or towards the boat. */
function turnRate(v: Vessel): number {
  return isWarship(v) ? ENEMY.warshipTurn : ENEMY.merchantTurn;
}

/**
 * Remake: steer towards the target. The heading moves towards the bearing of the target by at most the turn rate of the ship's class a step, the
 * short way round; a ship that is stopped does not turn.
 */
function steerToTarget(ctx: AiContext, v: Vessel): void {
  if (v.desiredHeading == null || v.speed === 0) return;
  v.desiredHeading = normalHeading(aimAngle(v, ctx.wrap));
  let d = v.desiredHeading - v.heading;
  while (d > Math.PI) d -= TWO_PI;
  while (d < -Math.PI) d += TWO_PI;
  const rate = turnRate(v);
  v.heading = normalHeading(Math.abs(d) <= rate ? v.desiredHeading : v.heading + Math.sign(d) * rate);
}

/** One step of every ship in slots 2..8: detection, evasion or pursuit, waypoint traversal, island stop, movement. */
export function stepEnemies(ctx: AiContext): void {
  const { sub, vessels, difficulty, timeOfDay, island, rng, events } = ctx;
  for (let slot = SLOT.tender; slot <= SLOT.last; slot += 1) {
    const v = vessels[slot];
    if (!v) continue;
    let reacted = false;
    if (!(slot === SLOT.tender || v.distance > ENEMY.detectionRange)) {
      if (detectionChance(sub, v.distance, difficulty, timeOfDay) > rng.next()) {
        if (sub.alertTimer === 0) events.push({ type: "contactAlert", slot });
        sub.alertTimer = 1;
      }
      if (sub.alertTimer !== 0) {
        reacted = true;
        const phi = v.heading - v.bearing;
        if (isWarship(v) && !isMarkedDamaged(v)) {
          depthChargeAttack(ctx, v);
          if (v.speed !== 0) v.heading += turnsPositive(phi) ? -ENEMY.warshipTurn : ENEMY.warshipTurn;
          if (!isMarkedDamaged(v)) v.speed = ENEMY.warshipChaseBase + difficulty;
        } else {
          if (v.speed !== 0) v.heading += turnsPositive(phi) ? ENEMY.merchantTurn : -ENEMY.merchantTurn;
          if (!isMarkedDamaged(v)) v.speed = ENEMY.merchantFleeBase + difficulty;
        }
      }
    }
    if (!reacted) {
      followRoute(ctx, v);
      if (ctx.gradualTurns) steerToTarget(ctx, v);
    }
    while (v.heading < 0) v.heading += TWO_PI;
    stopInsideIsland(v, island);
    v.x += v.speed * Math.cos(v.heading);
    v.y += v.speed * Math.sin(v.heading);
    if (ctx.wrap && v.y >= 0) {
      // a sunk ship is parked below zero and stays there
      v.x = wrapInto(v.x, WORLD_WIDTH);
      v.y = wrapInto(v.y, WORLD_HEIGHT);
    }
  }
}

function followRoute(ctx: AiContext, v: Vessel): void {
  const { dx, dy } = worldDelta(v.x, v.y, v.targetX, v.targetY, ctx.wrap);
  // A ship that turns gradually cannot reach a point nearer than its turning circle (speed / rate), so that is where it counts as having arrived and starts its next leg.
  const arrival = ctx.gradualTurns ? Math.max(ENEMY.arrivalRadius, Math.abs(v.speed) / turnRate(v)) : ENEMY.arrivalRadius;
  const travelling = v.waypointIndex > ENEMY.lastWaypoint || Math.abs(dy) > arrival || Math.abs(dx) > arrival;
  if (travelling) return;
  v.waypointIndex += 1;
  ctx.events.push({ type: "waypointReached", slot: v.slot, waypoint: v.waypointIndex });
  if (v.x > 0 && v.waypointIndex > ENEMY.lastWaypoint) {
    // After the last waypoint the tender and patrol boats loop; every other ship stops.
    if (v.typeCode === TYPE.patrolBoat || v.slot === SLOT.tender) {
      v.waypointIndex = 1;
      selectWaypoint(v, ctx.difficulty);
    } else v.speed = 0;
  } else selectWaypoint(v, ctx.difficulty);
  aimAtTarget(ctx, v);
}

/** Ships stop inside the island ellipse shrunk by 150 on both radii (0x07c63). */
function stopInsideIsland(v: Vessel, island: IslandShape): void {
  const a = (v.x - island.x) / (island.innerRadius - ENEMY.islandMargin);
  const b = (v.y - island.y) / (island.outerRadius - ENEMY.islandMargin);
  if (a ** 2 + b ** 2 < 1) v.speed = 0;
}

/**
 * Convoy test of the original (0x07bf8-0x07d9f): every ship in slots 3..lastConvoySlot must be sunk (y below -900).
 * The original keeps a counter that any survivor resets to 10, so it ends negative only when none survives.
 */
export function convoySunk(vessels: Vessel[], lastConvoySlot: number): boolean {
  let counter = 0;
  for (let slot = SLOT.tender; slot <= SLOT.last; slot += 1) {
    const v = vessels[slot];
    if (!v || !(slot <= lastConvoySlot && slot > SLOT.tender)) continue;
    if (v.y < ENEMY.sunkThreshold) counter -= 1;
    else counter = 10;
  }
  return counter < 0;
}

/** Objective radius test (0x06fef): the island is closer than its inner radius + 200. */
export function withinIslandObjective(vessels: Vessel[], island: IslandShape): boolean {
  const d = vessels[SLOT.island]?.distance ?? Infinity;
  return d < island.innerRadius + ISLAND.objectiveRadiusMargin;
}

// --------------------------------------------------------------------------------------------------------------------
// Sensors
// --------------------------------------------------------------------------------------------------------------------

export interface RadarBlip {
  slot: number;
  typeCode: number;
  distance: number;
  /** Screen offset from the radar centre in pixels (x right, y down): -sin(rel)*d*0.065, -cos(rel)*d*0.065. */
  dx: number;
  dy: number;
}

/** F6 radar (0x09f8c-0x0a14f): usable at depth <= 45; shows slots 1..8 closer than 1350. */
export function radarContacts(sub: SubmarineState, vessels: Vessel[]): RadarBlip[] {
  if (sub.depth > DEPTH.periscopeMax) return [];
  const blips: RadarBlip[] = [];
  for (let slot = SLOT.island; slot <= SLOT.last; slot += 1) {
    const v = vessels[slot];
    if (!v || v.distance >= CONTACT.closeListDistance) continue;
    blips.push({
      slot,
      typeCode: v.typeCode,
      distance: v.distance,
      dx: -Math.sin(v.relativeBearing) * v.distance * CONTACT.radarScale,
      dy: -Math.cos(v.relativeBearing) * v.distance * CONTACT.radarScale,
    });
  }
  return blips;
}

/** True when the scope shows anything: surfaced (depth < 21), or periscope up above 46; a damaged periscope is blind (0x0515e). */
export function scopeUsable(sub: SubmarineState): boolean {
  if (sub.periscopeUp && (sub.damage[6] ?? 0) !== 0) return false;
  return (sub.periscopeUp && sub.depth < DEPTH.scopeBlankBelow) || sub.depth < DEPTH.shallow + 1;
}

export function inScopeWindow(relativeBearing: number, facing: ScopeFacing): boolean {
  const w = SCOPE_WINDOWS[facing];
  if (w.wraps) return relativeBearing > w.lo || relativeBearing < w.hi;
  return relativeBearing > w.lo && relativeBearing < w.hi;
}

/** Contacts drawn in the current scope facing (0x0527a-0x053e5): apparent size >= 0.5 and inside the window. */
export function scopeContacts(sub: SubmarineState, vessels: Vessel[]): Vessel[] {
  if (!scopeUsable(sub)) return [];
  const out: Vessel[] = [];
  for (let slot = SLOT.island; slot <= SLOT.last; slot += 1) {
    const v = vessels[slot];
    if (!v || v.sunk || v.distance > CONTACT.maxTrackDistance) continue;
    if (v.apparentSize >= CONTACT.minVisibleSize && inScopeWindow(v.relativeBearing, sub.scopeFacing)) out.push(v);
  }
  return out;
}
