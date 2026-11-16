import { COMPARTMENT, DEPTH, DEPTH_CHARGE, ENEMY, SCOPE_OFFSET, SLOT, TORPEDO, TYPE } from "./constants.js";
import { Explosion, cosmeticRng, planExplosion, scopeScreenX } from "./explosion.js";
import type {
  LogTotals,
  Rng,
  ShipLogDocument,
  ShipLogRecord,
  SimEvent,
  SinkRecord,
  SubmarineState,
  Torpedo,
  TubeIndex,
  Vessel,
} from "./types.js";

const TWO_PI = 6.2832;

export function createTorpedoes(): Torpedo[] {
  const list: Torpedo[] = [];
  for (let tube = 0; tube <= TORPEDO.tubes; tube += 1) {
    list.push({ tube: Math.max(tube, 1) as TubeIndex, active: false, x: 0, y: 0, heading: 0, speed: 0, travelled: 0, spent: false });
  }
  return list;
}

/** In-memory captain's log built from ship_log.json; ships are drawn from per-type record bands (0x09a1c-0x09bb2). */
export class ShipLog {
  private readonly records: ShipLogRecord[];
  private readonly bands: ShipLogDocument["draw_bands"];
  private readonly wrap: number;
  readonly totals: LogTotals = { shipsSunk: 0, tonnage: 0, missionsCompleted: 0 };

  constructor(doc: ShipLogDocument) {
    this.records = [];
    for (const r of doc.records) {
      this.records[r.record] = { record: r.record, name: r.name, tonnage: r.tonnage, dateSunk: r.date_sunk, sunkFlag: r.sunk_flag };
    }
    this.bands = doc.draw_bands;
    this.wrap = doc.record_wrap;
  }

  /** Pick the record for a sunk ship of `typeCode`; advance past records that are already marked sunk. */
  claim(typeCode: number, rng: Rng, date: string): ShipLogRecord | null {
    const band = this.bands[String(typeCode)];
    if (!band) return null; // the subtender (type 3) is not logged
    let index = band.first_record + Math.floor(rng.next() * band.span);
    for (let guard = 0; guard < this.wrap; guard += 1) {
      const rec = this.records[index];
      if (rec && rec.sunkFlag <= 0) {
        rec.sunkFlag = 1;
        rec.dateSunk = date;
        this.totals.shipsSunk += 1;
        this.totals.tonnage += rec.tonnage;
        return rec;
      }
      index = (index + 1) % this.wrap + 1;
    }
    return null;
  }
}

export interface DepthChargeContext {
  sub: SubmarineState;
  difficulty: number;
  rng: Rng;
  events: SimEvent[];
}

/** Depth-charge attack of an alerted warship (GOSUB d1bd, 0x0d1be): RND < 0.1 + 0.03*difficulty and within 240 - 1.5*depth. */
export function depthChargeAttack(ctx: DepthChargeContext, ship: Vessel): void {
  const roll = ctx.rng.next(); // BASIC evaluates both operands of AND
  const inRange = ship.distance < DEPTH_CHARGE.rangeBase - ctx.sub.depth * DEPTH_CHARGE.rangeDepthFactor;
  if (roll < DEPTH_CHARGE.baseChance + ctx.difficulty * DEPTH_CHARGE.chancePerDifficulty && inRange) {
    const compartment = 1 + Math.floor(ctx.rng.next() * 8);
    ctx.sub.damage[compartment] = 1;
    ctx.events.push({ type: "depthCharge", slot: ship.slot, compartment });
  }
}

/** F8: fire the next free tube straight ahead (0x07fbd-0x08156). Returns the tube, or null if the shot is refused. */
export function launchTorpedo(sub: SubmarineState, torpedoes: Torpedo[], events: SimEvent[]): TubeIndex | null {
  const t1 = torpedoes[1];
  if (!t1) return null;
  if ((t1.speed > 0 && sub.lastTube >= TORPEDO.tubes) || sub.torpedoes <= 0 || !sub.doorsOpen || (sub.damage[COMPARTMENT.torpedoRoom] ?? 0) > 0) {
    return null;
  }
  let tube: number;
  if (sub.lastTube >= TORPEDO.tubes) tube = 1;
  else if ((torpedoes[sub.lastTube + 1]?.speed ?? 1) === 0) tube = sub.lastTube + 1;
  else return null;
  const t = torpedoes[tube];
  if (!t) return null;
  sub.lastTube = tube;
  sub.torpedoes -= 1;
  t.active = true;
  t.x = sub.x;
  t.y = sub.y;
  t.heading = sub.heading;
  t.speed = TORPEDO.speed;
  t.travelled = 0;
  t.spent = false;
  events.push({ type: "torpedoLaunched", tube: tube as TubeIndex });
  return tube as TubeIndex;
}

export interface CombatContext extends DepthChargeContext {
  vessels: Vessel[];
  torpedoes: Torpedo[];
  log: ShipLog;
  /** Slots within 1350 of the boat plus slot 1 (the A1e82 list built by updateContacts). */
  closeList: number[];
  inControlRoom: boolean;
  date: string;
  /** Running explosion animations (appended to when a hit is visible through the scope). */
  explosions?: Explosion[];
}

export interface CombatResult {
  ownBoatDestroyed: boolean;
}

function releaseTube(t: Torpedo): void {
  t.active = false;
  t.x = -999;
  t.y = -999;
  t.speed = 0;
  t.heading = 0;
  t.travelled = 0;
  t.spent = false;
}

/** Flight and hits of all torpedoes: three sub-steps of 17 units per tick, hit ellipse per ship type (0x0815f-0x08665). */
export function advanceTorpedoes(ctx: CombatContext): CombatResult {
  const result: CombatResult = { ownBoatDestroyed: false };
  for (let step = 0; step < TORPEDO.substepsPerTick; step += 1) {
    for (let i = 1; i <= TORPEDO.tubes; i += 1) {
      const t = ctx.torpedoes[i];
      if (!t || t.speed === 0) continue;
      t.x += t.speed * Math.cos(t.heading);
      t.y += t.speed * Math.sin(t.heading);
      t.travelled += t.speed;
      if (t.travelled > TORPEDO.maxRange) releaseTube(t);
    }
    if (ctx.closeList.length === 0) continue;
    for (const slot of ctx.closeList) {
      const ship = ctx.vessels[slot];
      if (!ship || slot === SLOT.island || ship.distance > TORPEDO.hitListRange) continue;
      for (let i = 1; i <= TORPEDO.tubes; i += 1) {
        const t = ctx.torpedoes[i];
        if (!t || t.speed === 0 || t.spent) continue;
        if (torpedoHits(t, ship)) {
          if (resolveHit(ctx, t, ship)) result.ownBoatDestroyed = true;
        }
      }
    }
  }
  return result;
}

/** dist < base + cos(angle(torpedo, ship) - ship heading)^6 * length (0x08555, 0x085e3). */
export function torpedoHits(t: Torpedo, ship: Vessel): boolean {
  const dx = t.x - ship.x;
  const dy = t.y - ship.y;
  const phi = dx === 0 ? Math.sign(dy) * 1.5708 : Math.atan(dy / dx);
  const shape = ship.typeCode === TYPE.patrolBoat ? TORPEDO.patrolBoat : TORPEDO.other;
  return Math.sqrt(dx * dx + dy * dy) < shape.base + Math.cos(phi - ship.heading) ** 6 * shape.length;
}

/** Angle of the torpedo relative to the scope facing when the explosion is visible through the scope, otherwise null. */
function explosionAngle(ctx: CombatContext, t: Torpedo): number | null {
  const sub = ctx.sub;
  const skip = !ctx.inControlRoom || (!sub.periscopeUp && sub.depth > DEPTH.shallow) || sub.depth > DEPTH.periscopeMax;
  if (skip) return null;
  const dx = t.x - sub.x;
  const dy = t.y - sub.y;
  let a = dx === 0 ? Math.sign(dy) * 1.5708 : Math.atan(dy / dx);
  if (dx < 0) a += 3.1416;
  while (a < 0) a += TWO_PI;
  let rel = a - sub.heading;
  while (rel < 0) rel += TWO_PI;
  rel -= SCOPE_OFFSET[sub.scopeFacing];
  while (rel < 0) rel += TWO_PI;
  return rel < 5.4978 && rel > 0.7854 ? null : rel;
}

/** Returns true when the hit destroyed the own boat. 0x086dd-0x09c24. */
function resolveHit(ctx: CombatContext, t: Torpedo, ship: Vessel): boolean {
  ship.speed = TORPEDO.damagedSpeed;
  ship.damaged = true;
  t.spent = true;
  const angle = explosionAngle(ctx, t);
  const visible = angle !== null;
  let survived = false;
  if (visible) {
    const size = ship.typeCode === TYPE.patrolBoat ? ship.apparentSize * 2 : ship.apparentSize;
    if (ctx.rng.next() < ctx.difficulty / 12) survived = true;
    else if (size > TORPEDO.ownBoatKillSize) return true;
    ctx.explosions?.push(
      new Explosion(
        planExplosion(
          {
            x: scopeScreenX(angle, ship.apparentSize, ship.frame, ctx.sub.scopeFacing),
            size,
            drawnSize: ship.apparentSize,
            typeCode: ship.typeCode,
            frame: ship.frame,
            survived,
          },
          cosmeticRng((Math.floor(t.x) * 31 + Math.floor(t.y) * 17 + ship.slot) | 0),
        ),
      ),
    );
    ctx.events.push({ type: "explosionStarted", slot: ship.slot, survived });
  }
  ctx.events.push({ type: "torpedoHit", slot: ship.slot, typeCode: ship.typeCode, survived });
  if (!survived) sinkVessel(ctx, ship, visible);
  return false;
}

/** Remove a ship from play (speed 0, y = -2000) and enter it in the captain's log. */
export function sinkVessel(ctx: Pick<CombatContext, "log" | "rng" | "events" | "date">, ship: Vessel, animated: boolean): SinkRecord | null {
  ship.speed = 0;
  ship.y = ENEMY.sunkY;
  ship.x = animated ? ENEMY.sunkY : 0;
  ship.waypointIndex = 8;
  ship.sunk = true;
  const rec = ctx.log.claim(ship.typeCode, ctx.rng, ctx.date);
  const record: SinkRecord | null = rec ? { slot: ship.slot, typeCode: ship.typeCode, record: rec.record, name: rec.name, tonnage: rec.tonnage } : null;
  ctx.events.push({ type: "shipSunk", record, slot: ship.slot, typeCode: ship.typeCode });
  return record;
}
