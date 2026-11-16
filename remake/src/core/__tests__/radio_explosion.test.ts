import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  EXPLOSION,
  Explosion,
  PLUME_COLUMNS,
  PLUME_FRAME_SECONDS,
  RADIO_MESSAGES,
  RadioInbox,
  Simulation,
  buildScenario,
  cosmeticRng,
  debrisCount,
  explosionShapes,
  holdSeconds,
  planExplosion,
  plumeHeight,
  plumePeak,
  radioRoomReport,
  scopeScreenX,
  sequenceRng,
  stageSeconds,
  type CourseJson,
  type ExplosionStage,
  type MxpJson,
  type OrdersJson,
  type Rng,
  type ShipLogDocument,
  type SimEvent,
  type SimOptions,
} from "../index.js";

const root = new URL("../../../../", import.meta.url);
const read = <T>(path: string): T => JSON.parse(readFileSync(new URL(path, root), "utf8")) as T;
const shipLog = read<ShipLogDocument>("remake/src/data/ship_log.json");
const mxp = read<MxpJson>("analysis/json/map/MXP.json");

function makeSim(n: number, rng: Rng, over: Partial<SimOptions> = {}): Simulation {
  const scenario = buildScenario(n, read<CourseJson>(`analysis/json/courses/COURXX${n}.json`), read<OrdersJson>(`analysis/json/orders/ORDXX${n}.json`), mxp);
  return new Simulation({ scenario, rng, options: { difficulty: 0, sound: true, timeOfDay: 1, inControlRoom: false, ...over }, shipLog });
}

function run(sim: Simulation, limit: number, done: () => boolean = () => false): SimEvent[] {
  const events: SimEvent[] = [];
  for (let i = 0; i < limit && sim.status === "running" && !done(); i += 1) events.push(...sim.step());
  return events;
}

function park(sim: Simulation, slot: number, x: number, y: number): void {
  Object.assign(sim.vessels[slot] ?? {}, { x, y, targetX: x, targetY: y, speed: 0, waypointIndex: 8 });
}

describe("radio and status messages (GATO1 string pool, 0x07046-0x07e47, 0x0ba3d)", () => {
  it("holds the complete original message set with its exact hold-loop lengths", () => {
    expect(Object.values(RADIO_MESSAGES).map((m) => [m.id, m.lines.map((l) => l.text.trim()), m.holdPasses])).toEqual([
      ["contactMade", ["CONTACT MADE"], 25000],
      ["missionCompleted", ["MISSION COMPLETED"], 10000],
      ["convoyDestroyed", ["YOU HAVE SUCCESSFULLY", "COMPLETED YOUR MISSION"], 19000],
      ["oxygenExhausted", ["No more oxygen"], 19000],
      ["radioDamaged", ["RADIO ROOM", "REPORTS HEAVY DAMAGE", "NO MESSAGES MAY BE RECEIVED"], 10000],
    ]);
  });

  it("island objective: CONTACT MADE then MISSION COMPLETED (ORDXX7 night rescue)", () => {
    const sim = makeSim(7, sequenceRng([0.5]), { timeOfDay: 0 });
    const island = sim.scenario.islands[14];
    if (!island) throw new Error("quadrant 14 has no island");
    sim.teleport(island.x, island.y - island.innerRadius - 80);
    sim.sub.speed = 3;
    expect(run(sim, 2).filter((e) => e.type === "radio")).toEqual([]); // still moving
    sim.sub.speed = 0;
    sim.sub.orderedSpeed = 0;
    const radio = run(sim, 5).filter((e) => e.type === "radio");
    expect(radio).toEqual([
      { type: "radio", message: "contactMade" },
      { type: "radio", message: "missionCompleted" },
    ]);
    expect(sim.completedBy).toBe("island");
  });

  it("convoy objective: YOU HAVE SUCCESSFULLY COMPLETED YOUR MISSION when the last convoy ship sinks", () => {
    const sim = makeSim(1, sequenceRng([0.99]));
    sim.teleport(10000, 10000);
    sim.sub.heading = 0;
    sim.sub.depth = 0;
    for (const slot of [6, 7, 8]) park(sim, slot, 20000, 2000);
    park(sim, 2, 9000, 8000);
    sim.command({ type: "doors" });
    const all: SimEvent[] = [];
    for (const slot of [3, 4, 5]) {
      park(sim, slot, 10250 + 60 * (slot - 3), 10000);
      sim.command({ type: "fire" });
      all.push(...run(sim, 40, () => sim.vessels[slot]?.sunk === true));
    }
    all.push(...sim.step());
    expect(all.filter((e) => e.type === "radio")).toEqual([{ type: "radio", message: "convoyDestroyed" }]);
    expect(sim.completedBy).toBe("convoySunk");
  });

  it("oxygen below 110 reports 'No more oxygen' before the boat is lost", () => {
    const sim = makeSim(1, sequenceRng([0.99]));
    sim.sub.depth = 60;
    sim.sub.oxygen = 110.1;
    const events = run(sim, 10);
    const types = events.map((e) => (e.type === "radio" ? `radio:${e.message}` : e.type));
    expect(types).toContain("radio:oxygenExhausted");
    expect(types.indexOf("radio:oxygenExhausted")).toBeLessThan(types.indexOf("subDestroyed"));
    expect(sim.status).toBe("suffocated");
  });

  it("radio room key: damaged radio room (compartment 1) reports heavy damage, an intact one does not", () => {
    const sim = makeSim(1, sequenceRng([0.99]));
    expect(radioRoomReport(sim.sub)).toBeNull();
    expect(sim.requestRadioRoom()).toBeNull();
    sim.sub.damage[1] = 1;
    expect(sim.requestRadioRoom()?.id).toBe("radioDamaged");
    expect(sim.step()).toContainEqual({ type: "radio", message: "radioDamaged" });
  });

  it("inbox shows messages in turn, keeps CONTACT MADE on screen under MISSION COMPLETED, and expires them by hold time", () => {
    const inbox = new RadioInbox();
    inbox.push("contactMade");
    inbox.push("missionCompleted");
    expect(inbox.current?.lines.map((l) => l.text)).toEqual(["CONTACT MADE"]);
    expect(inbox.current?.box).toEqual({ x0: 10, y0: 10, x1: 309, y1: 60 });
    inbox.advance(holdSeconds(RADIO_MESSAGES.contactMade) - 0.01);
    expect(inbox.current?.message.id).toBe("contactMade");
    inbox.advance(0.02);
    expect(inbox.current?.message.id).toBe("missionCompleted");
    expect(inbox.current?.lines.map((l) => l.text)).toEqual(["CONTACT MADE", "MISSION COMPLETED"]);
    expect(inbox.current?.box).toEqual({ x0: 10, y0: 10, x1: 309, y1: 60 });
    inbox.advance(holdSeconds(RADIO_MESSAGES.missionCompleted));
    expect(inbox.current).toBeNull();
    expect(inbox.pending).toBe(0);
    expect(inbox.history).toEqual(["contactMade", "missionCompleted"]);
    expect(holdSeconds(RADIO_MESSAGES.contactMade)).toBeCloseTo(2.75, 5);
  });
});

describe("explosion plan and lifecycle (GATO1 0x086dd-0x09c24)", () => {
  const input = { x: 160, size: 10, typeCode: 4, frame: 3, survived: false };

  it("derives peak, step, frame count and debris from the apparent size", () => {
    const plan = planExplosion(input, cosmeticRng(1));
    expect(plan.peak).toBeCloseTo(4 + 10 ** 1.6, 6);
    expect(plan.step).toBeCloseTo(1 + plan.peak / 15, 6);
    expect(plan.unit).toBeCloseTo(plan.peak / 44, 6);
    expect(plan.plumeFrames).toBe(Math.floor(plan.peak / plan.step) + 1);
    expect(plan.debris).toHaveLength(40); // 20 + 2 * size
    expect(debrisCount(50)).toBe(EXPLOSION.maxDebris); // capped at 60
    expect(plumePeak(0)).toBe(4);
    expect(planExplosion({ ...input, survived: true }, cosmeticRng(1)).debris).toHaveLength(0);
    expect(planExplosion(input, cosmeticRng(1))).toEqual(planExplosion(input, cosmeticRng(1))); // deterministic
  });

  it("runs grow -> shrink -> sparks -> erase -> fall -> done, and a survived hit ends after the plume", () => {
    const seen = (ex: Explosion): ExplosionStage[] => {
      const stages: ExplosionStage[] = [];
      for (let t = 0; t < ex.totalSeconds + 0.1; t += 0.004) {
        ex.elapsed = t;
        if (stages[stages.length - 1] !== ex.stage) stages.push(ex.stage);
      }
      return stages;
    };
    const full = new Explosion(planExplosion(input, cosmeticRng(1)));
    expect(seen(full)).toEqual(["grow", "shrink", "sparks", "erase", "fall", "done"]);
    const seconds = stageSeconds(full.plan);
    expect(full.totalSeconds).toBeCloseTo(seconds.grow + seconds.shrink + seconds.sparks + seconds.erase + seconds.fall, 9);
    expect(seconds.grow).toBeCloseTo(full.plan.plumeFrames * PLUME_FRAME_SECONDS, 9);

    const survived = new Explosion(planExplosion({ ...input, survived: true }, cosmeticRng(1)));
    expect(seen(survived)).toEqual(["grow", "shrink", "done"]);

    full.elapsed = 0;
    expect(full.finished).toBe(false);
    expect(full.shipVisible).toBe(true); // the sunk ship stays until its spikes are erased
    full.advance(seconds.grow + seconds.shrink + seconds.sparks + 0.001);
    expect(full.stage).toBe("erase");
    expect(full.shipVisible).toBe(false);
    full.advance(full.totalSeconds);
    expect(full.finished).toBe(true);
  });

  it("draws the plume columns at the original height fractions, growing then shrinking, and 14 fall steps", () => {
    const plan = planExplosion(input, cosmeticRng(7));
    const ex = new Explosion(plan);
    expect(plumeHeight(plan, "grow", 0)).toBe(0);
    expect(plumeHeight(plan, "grow", 3)).toBeCloseTo(3 * plan.step, 9);
    expect(plumeHeight(plan, "shrink", 0)).toBeCloseTo(plan.peak, 9);
    expect(plumeHeight(plan, "shrink", plan.plumeFrames - 1)).toBeGreaterThanOrEqual(0);

    ex.elapsed = 5.5 * PLUME_FRAME_SECONDS; // grow frame 5
    const d = 5 * plan.step;
    const flame = explosionShapes(ex, 64).filter((s) => s.kind === "rect" && s.color === "flame" && s.y1 === 64);
    expect(flame).toHaveLength(PLUME_COLUMNS.length);
    flame.forEach((s, i) => {
      if (s.kind === "rect") expect(64 - s.y0).toBeCloseTo((PLUME_COLUMNS[i]?.f ?? 0) * d, 6);
    });

    // debris dots fall 6 px per step; they disappear at the horizon
    const fallStart = stageSeconds(plan).grow + stageSeconds(plan).shrink + stageSeconds(plan).sparks + stageSeconds(plan).erase;
    ex.elapsed = fallStart + 0.0001;
    const first = explosionShapes(ex, 64).filter((s) => s.kind === "dot");
    ex.elapsed = fallStart + 0.0001 + 3 * 0.03;
    const later = explosionShapes(ex, 64).filter((s) => s.kind === "dot");
    expect(later.length).toBeLessThanOrEqual(first.length);
    ex.elapsed = ex.totalSeconds - 0.0001;
    for (const s of explosionShapes(ex, 64)) if (s.kind === "dot") expect(s.y).toBeLessThan(64);
    expect(EXPLOSION.fallSteps).toBe(14);
  });

  it("scope x of the explosion matches the contact formula", () => {
    expect(scopeScreenX(0, 6, 4, "F")).toBeCloseTo(160, 9);
    expect(scopeScreenX(Math.PI / 2, 6, 0, "F")).toBeCloseTo(160 - (227 + 6 * 0.5), 6);
    expect(scopeScreenX(Math.PI / 2, 6, 0, "P")).toBeCloseTo(160 - (227 - 6 * 0.5), 6);
  });

  it("a hit seen through the scope starts an explosion; the sim removes the ship at once and prunes finished animations", () => {
    const sim = makeSim(1, sequenceRng([0.01]), { difficulty: 0, inControlRoom: true });
    sim.teleport(10000, 10000);
    sim.sub.heading = 0;
    sim.sub.periscopeUp = true;
    sim.sub.depth = 10;
    for (const slot of [4, 5, 6, 7, 8]) park(sim, slot, 22000, 3000);
    park(sim, 2, 9000, 8000);
    park(sim, 3, 10400, 10000);
    sim.command({ type: "doors" });
    sim.command({ type: "fire" });
    const events = run(sim, 40, () => sim.vessels[3]?.sunk === true);
    expect(events).toContainEqual({ type: "explosionStarted", slot: 3, survived: false });
    expect(sim.explosions).toHaveLength(1);
    const ex = sim.explosions[0] as Explosion;
    expect(ex.plan.survived).toBe(false);
    expect(ex.plan.typeCode).toBe(sim.vessels[3]?.typeCode);
    expect(ex.plan.debris.length).toBeGreaterThanOrEqual(20);
    sim.advanceExplosions(ex.totalSeconds / 2);
    expect(sim.explosions).toHaveLength(1);
    sim.advanceExplosions(ex.totalSeconds);
    expect(sim.explosions).toHaveLength(0);
  });

  it("no explosion is animated when the control room is not the active screen (the ship simply sinks)", () => {
    const sim = makeSim(1, sequenceRng([0.01]), { difficulty: 0, inControlRoom: false });
    sim.teleport(10000, 10000);
    sim.sub.heading = 0;
    sim.sub.periscopeUp = true;
    sim.sub.depth = 10;
    for (const slot of [4, 5, 6, 7, 8]) park(sim, slot, 22000, 3000);
    park(sim, 2, 9000, 8000);
    park(sim, 3, 10400, 10000);
    sim.command({ type: "doors" });
    sim.command({ type: "fire" });
    run(sim, 40, () => sim.vessels[3]?.sunk === true);
    expect(sim.vessels[3]?.sunk).toBe(true);
    expect(sim.explosions).toHaveLength(0);
  });
});
