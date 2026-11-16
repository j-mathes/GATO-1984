import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { LogStore } from "../../app/logStore.js";
import {
  Simulation,
  buildScenario,
  createRng,
  damageCount,
  damageIndexSum,
  sequenceRng,
  type CourseJson,
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

/** Run until `done` or `limit` steps; returns every event. */
function run(sim: Simulation, limit: number, done: () => boolean = () => false): SimEvent[] {
  const events: SimEvent[] = [];
  for (let i = 0; i < limit && sim.status === "running" && !done(); i += 1) events.push(...sim.step());
  return events;
}

/** Park a ship where it is: counter past the last waypoint and zero speed, so the AI leaves it alone. */
function park(sim: Simulation, slot: number, x: number, y: number): void {
  const v = sim.vessels[slot];
  if (!v) throw new Error(`no slot ${slot}`);
  Object.assign(v, { x, y, targetX: x, targetY: y, speed: 0, waypointIndex: 8 });
}

describe("mission victory by sinking the convoy (trailer[2] = ds:0x226a)", () => {
  it("completes only when every ship in slots 3..trailer[2] is sunk and books the tonnage in the captain's log", () => {
    const sim = makeSim(1, sequenceRng([0.99]));
    const last = sim.scenario.objectives.lastConvoySlot;
    expect(last).toBe(5);
    sim.teleport(10000, 10000);
    sim.sub.heading = 0;
    sim.sub.depth = 0;
    // slots 6..8 are escorts outside the objective: they stay afloat and far away
    for (const slot of [6, 7, 8]) park(sim, slot, 20000, 2000);
    park(sim, 2, 9000, 8000);
    sim.command({ type: "doors" });

    const all: SimEvent[] = [];
    const sunkOrder: number[] = [];
    for (const slot of [3, 4, 5]) {
      park(sim, slot, 10000 + 250 + 60 * (slot - 3), 10000); // dead ahead, in the torpedo path
      sim.command({ type: "fire" });
      const events = run(sim, 40, () => sim.vessels[slot]?.sunk === true);
      all.push(...events);
      expect(sim.vessels[slot]?.sunk).toBe(true);
      sunkOrder.push(slot);
      if (slot < last) {
        expect(sim.status).toBe("running"); // not yet: more convoy ships afloat
        expect(sim.missionComplete).toBe(false);
      }
    }
    all.push(...sim.step());

    expect(sunkOrder).toEqual([3, 4, 5]);
    expect(sim.status).toBe("missionComplete");
    expect(all.filter((e) => e.type === "missionComplete")).toEqual([{ type: "missionComplete", reason: "convoySunk" }]);
    // escorts outside trailer[2] are irrelevant
    for (const slot of [6, 7, 8]) expect(sim.vessels[slot]?.sunk).toBe(false);

    const sunk = all.filter((e): e is Extract<SimEvent, { type: "shipSunk" }> => e.type === "shipSunk");
    expect(sunk).toHaveLength(3);
    const tonnage = sunk.reduce((a, e) => a + (e.record?.tonnage ?? 0), 0);
    expect(tonnage).toBeGreaterThan(0);
    expect(sim.log.totals).toEqual({ shipsSunk: 3, tonnage, missionsCompleted: 1 });

    const store = new LogStore(shipLog, null);
    store.apply(all, "11-16-2026");
    expect(store.shipsSunk).toBe(3);
    expect(store.totalTonnage).toBe(tonnage);
    expect(store.missionsCompleted).toBe(1);
    expect(store.entries().map((e) => e.dateSunk)).toEqual(["11-16-2026", "11-16-2026", "11-16-2026"]);
  });

  it("does not finish early when a convoy ship survives a hit in an animated explosion (survival chance = difficulty/12)", () => {
    const sim = makeSim(1, sequenceRng([0.01]), { difficulty: 9, inControlRoom: true });
    sim.teleport(10000, 10000);
    sim.sub.heading = 0;
    sim.sub.periscopeUp = true;
    sim.sub.depth = 10;
    for (const slot of [4, 5, 6, 7, 8]) park(sim, slot, 22000, 3000);
    park(sim, 2, 9000, 8000);
    park(sim, 3, 10400, 10000);
    sim.command({ type: "doors" });
    sim.command({ type: "fire" });
    const events = run(sim, 40, () => sim.vessels[3]?.speed === 1.75);
    expect(events.some((e) => e.type === "torpedoHit" && e.survived)).toBe(true);
    expect(sim.vessels[3]?.sunk).toBe(false);
    expect(sim.status).toBe("running");
  });
});

describe("island rescue / patrol objective (trailer[0] = ds:0x2246, trailer[1] = ds:0x2242)", () => {
  it("ORDXX7: night rescue in quadrant 14 completes once the boat is stopped at the island", () => {
    const sim = makeSim(7, sequenceRng([0.5]), { timeOfDay: 0 });
    expect(sim.scenario.objectives).toEqual({ objectiveQuadrant: 14, requiredTimeOfDay: 0, lastConvoySlot: 8 });
    const island = sim.scenario.islands[14];
    if (!island) throw new Error("quadrant 14 has no island");

    // the hidden Z -> PAED command ends in Simulation.teleport (GOSUB c6c7 reloads the quadrant's island)
    sim.teleport(island.x, island.y - island.innerRadius - 80);
    expect(sim.currentQuadrant).toBe(14);
    sim.command({ type: "speed", level: "F1" });
    sim.sub.speed = 3; // still moving: the objective needs speed 0
    sim.sub.orderedSpeed = 3;
    sim.step();
    expect(sim.status).toBe("running");

    sim.sub.speed = 0;
    sim.sub.orderedSpeed = 0;
    const events = run(sim, 5);
    expect(sim.status).toBe("missionComplete");
    expect(events.map((e) => e.type)).toEqual(expect.arrayContaining(["objectiveReached", "missionComplete"]));
    expect(events.find((e) => e.type === "missionComplete")).toEqual({ type: "missionComplete", reason: "island" });
    expect(sim.log.totals.missionsCompleted).toBe(1);
  });

  it("is not completed in daylight, in the wrong quadrant, or from beyond inner radius + 200", () => {
    const island = makeSim(7, sequenceRng([0.5])).scenario.islands[14];
    if (!island) throw new Error("missing");
    const stay = (sim: Simulation): void => {
      sim.sub.speed = 0;
      sim.sub.orderedSpeed = 0;
      run(sim, 3);
    };
    const day = makeSim(7, sequenceRng([0.5]), { timeOfDay: 1 });
    day.teleport(island.x, island.y - island.innerRadius - 80);
    stay(day);
    expect(day.status).toBe("running");

    const wrongQuadrant = makeSim(7, sequenceRng([0.5]), { timeOfDay: 0 });
    wrongQuadrant.teleport(7500, 7500);
    stay(wrongQuadrant);
    expect(wrongQuadrant.status).toBe("running");

    const tooFar = makeSim(7, sequenceRng([0.5]), { timeOfDay: 0 });
    tooFar.teleport(island.x, island.y - island.innerRadius - 600); // may be a quadrant boundary; either way beyond 200
    stay(tooFar);
    expect(tooFar.status).toBe("running");
  });

  it("the unused objective of a convoy scenario (trailer[0] = 0) never triggers", () => {
    const sim = makeSim(1, sequenceRng([0.5]), { timeOfDay: 1 });
    expect(sim.scenario.objectives.objectiveQuadrant).toBe(0);
    sim.sub.speed = 0;
    run(sim, 20);
    expect(sim.status).toBe("running");
  });
});

describe("submarine lost", () => {
  it("is crushed below crush depth, stops cleanly and ignores further input", () => {
    const sim = makeSim(1, createRng(11));
    sim.sub.depth = 1500;
    const events = run(sim, 300);
    expect(sim.status).toBe("destroyed");
    expect(events.filter((e) => e.type === "subDestroyed")).toEqual([{ type: "subDestroyed", reason: "crush" }]);
    const tick = sim.tick;
    expect(sim.step()).toEqual([]);
    sim.command({ type: "speed", level: "F1" });
    expect(sim.tick).toBe(tick);
    expect(sim.sub.orderedSpeed).toBe(0);
  });

  it("is safe just above the first crush probability threshold", () => {
    const sim = makeSim(1, createRng(11));
    sim.sub.depth = 340;
    run(sim, 200);
    expect(sim.status).toBe("running");
  });

  it("is lost to depth charges once more than five compartments are damaged or the damaged indexes add up past 20", () => {
    const sim = makeSim(5, createRng(3), { difficulty: 9 });
    // scenario 5: patrol boats anchored at the island in quadrant 18; sit among them, deep enough not to be rammed
    sim.teleport(17150, 18600);
    sim.sub.depth = 60;
    sim.sub.alertTimer = 1;
    const events = run(sim, 2000);
    expect(sim.status).toBe("destroyed");
    expect(events.filter((e) => e.type === "depthCharge").length).toBeGreaterThanOrEqual(3);
    expect(events.some((e) => e.type === "subDestroyed" && e.reason === "damage")).toBe(true);
    expect(damageCount(sim.sub) > 5 || damageIndexSum(sim.sub) > 20).toBe(true);
  });

  it("is lost when it rams a ship above 34 units of depth", () => {
    const sim = makeSim(1, sequenceRng([0.99]));
    sim.teleport(10000, 10000);
    sim.sub.depth = 0;
    park(sim, 3, 10010, 10000);
    const events = run(sim, 3);
    expect(sim.status).toBe("destroyed");
    expect(events.some((e) => e.type === "subDestroyed" && e.reason === "collision")).toBe(true);
  });
});
