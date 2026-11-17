import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  ENGINE,
  Launcher,
  GameControl,
  DemoPlayer,
  galleryShip,
  FixedStepLoop,
  Simulation,
  TYPE,
  advanceTorpedoes,
  applyHelmCommand,
  buildScenario,
  compassDegrees,
  convoySunk,
  createRng,
  createTorpedoes,
  createVessels,
  damageCount,
  damageIndexSum,
  detectionChance,
  headingsAligned,
  launchTorpedo,
  quadrantOf,
  screenForPage,
  sequenceRng,
  stepDepth,
  stepHeading,
  stepEngineChecks,
  stepSpeed,
  stepPosition,
  torpedoHits,
  turnsPositive,
  updateContacts,
  shortestDelta,
  worldDelta,
  wrapInto,
  WORLD_HEIGHT,
  WORLD_WIDTH,
  ShipLog,
  type CourseJson,
  type DemoScriptDocument,
  type MxpJson,
  type OrdersJson,
  type ShipLogDocument,
  type SimEvent,
  type SimOptions,
} from "../index.js";

const root = new URL("../../../../", import.meta.url);
const read = <T>(path: string): T => JSON.parse(readFileSync(new URL(path, root), "utf8")) as T;
const shipLog = read<ShipLogDocument>("remake/src/data/ship_log.json");
const demoScript = read<DemoScriptDocument>("remake/src/data/demo_script.json");
const mxp = read<MxpJson>("analysis/json/map/MXP.json");

function scenario(n: number) {
  return buildScenario(n, read<CourseJson>(`analysis/json/courses/COURXX${n}.json`), read<OrdersJson>(`analysis/json/orders/ORDXX${n}.json`), mxp);
}

const options = (over: Partial<SimOptions> = {}): SimOptions => ({ difficulty: 0, sound: true, timeOfDay: 1, inControlRoom: true, ...over });

function newSim(n = 1, over: Partial<SimOptions> = {}, seed = 7): Simulation {
  return new Simulation({ scenario: scenario(n), rng: createRng(seed), options: options(over), shipLog });
}

describe("scenario loading", () => {
  it("maps file columns to slots 2..8 and the trailer to the three objective fields", () => {
    const s = scenario(1);
    expect(s.ships.map((x) => x.slot)).toEqual([2, 3, 4, 5, 6, 7, 8]);
    expect(s.ships[0]?.typeCode).toBe(TYPE.subtender);
    expect(s.objectives).toEqual({ objectiveQuadrant: 0, requiredTimeOfDay: 1, lastConvoySlot: 5 });
    expect(scenario(7).objectives).toEqual({ objectiveQuadrant: 14, requiredTimeOfDay: 0, lastConvoySlot: 8 });
  });

  it("computes quadrants like the original", () => {
    expect(quadrantOf(7500, 7500)).toBe(7);
    expect(quadrantOf(24999, 19999)).toBe(20);
  });
});

describe("helm and engines", () => {
  it("orders speed as (N - doors) * (1 - engine damage/2) * engine", () => {
    const sim = newSim();
    applyHelmCommand(sim.sub, { type: "speed", level: "F1" });
    expect(sim.sub.orderedSpeed).toBe(20); // diesel
    sim.sub.engine = ENGINE.electric;
    sim.sub.doorsOpen = true;
    sim.sub.damage[5] = 1;
    applyHelmCommand(sim.sub, { type: "speed", level: "F1" });
    expect(sim.sub.orderedSpeed).toBe(4.5); // (10-1) * 0.5 * 1
  });

  it("steps the speed one stage up or down (simple speed keys): stop, slow, standard, full, flank; never below stop", () => {
    const sim = newSim();
    const sub = sim.sub;
    const step = (direction: "up" | "down"): number => {
      applyHelmCommand(sub, { type: "speed", level: direction });
      return sub.orderedSpeed;
    };
    expect([step("up"), step("up"), step("up"), step("up"), step("up")]).toEqual([6, 12, 16, 20, 20]); // diesel: 3, 6, 8, 10 x 2
    expect([step("down"), step("down"), step("down"), step("down"), step("down")]).toEqual([16, 12, 6, 0, 0]);
    applyHelmCommand(sub, { type: "speed", level: "reverse" });
    expect(sub.orderedSpeed).toBeLessThan(0);
    expect(step("down")).toBeLessThan(0); // reverse is its own command: stepping down does not go further astern
    expect(step("up")).toBe(0); // from reverse, up goes to stop
    sub.engine = ENGINE.electric;
    sub.doorsOpen = true;
    sub.orderedSpeed = 3; // between stages: electric with the doors open gives 2, 5, 7, 9
    expect(step("up")).toBe(5);
    expect(step("down")).toBe(2);
    sub.orderedSpeed = 3;
    expect(step("down")).toBe(2);
  });

  it("toggles the engine between diesel and electric with the same fuel and battery rules", () => {
    const sim = newSim();
    const sub = sim.sub;
    sub.orderedSpeed = 6;
    applyHelmCommand(sub, { type: "engine", mode: "toggle" });
    expect([sub.engine, sub.orderedSpeed]).toEqual([ENGINE.electric, 3]);
    applyHelmCommand(sub, { type: "engine", mode: "toggle" });
    expect([sub.engine, sub.orderedSpeed]).toEqual([ENGINE.diesel, 6]);
    sub.fuel = 0;
    applyHelmCommand(sub, { type: "engine", mode: "toggle" }); // to electric
    applyHelmCommand(sub, { type: "engine", mode: "toggle" }); // diesel has no fuel: stays electric
    expect(sub.engine).toBe(ENGINE.electric);
  });

  it("cuts the diesel out below 20 m or without fuel and the electric motor on a flat battery (the D key itself has no depth test)", () => {
    const sim = newSim();
    const sub = sim.sub;
    const run = (): SimEvent[] => {
      const events: SimEvent[] = [];
      stepEngineChecks(sub, events);
      return events;
    };
    sub.orderedSpeed = 8;
    sub.depth = 20;
    expect(run()).toEqual([]); // 20 is still allowed
    expect([sub.engine, sub.orderedSpeed]).toEqual([ENGINE.diesel, 8]);
    sub.depth = 21;
    expect(run()).toContainEqual({ type: "engineCutOut", mode: ENGINE.diesel });
    expect([sub.engine, sub.orderedSpeed]).toEqual([ENGINE.off, 0]);
    sub.depth = 0;
    applyHelmCommand(sub, { type: "engine", mode: "diesel" }); // restarting at the surface works
    expect(sub.engine).toBe(ENGINE.diesel);
    sub.fuel = 0.5;
    expect(run()).toContainEqual({ type: "engineCutOut", mode: ENGINE.diesel });
    sub.engine = ENGINE.electric;
    sub.battery = 0.5;
    expect(run()).toContainEqual({ type: "engineCutOut", mode: ENGINE.electric });
    expect(sub.battery).toBe(0);
  });

  it("toggles the periscope: up when down, down when up, only at periscope depth", () => {
    const sub = newSim().sub;
    applyHelmCommand(sub, { type: "periscope", direction: "toggle" });
    expect(sub.periscopeUp).toBe(true);
    applyHelmCommand(sub, { type: "periscope", direction: "toggle" });
    expect(sub.periscopeUp).toBe(false);
    sub.depth = 46;
    applyHelmCommand(sub, { type: "periscope", direction: "toggle" });
    expect(sub.periscopeUp).toBe(false); // too deep to raise
    sub.depth = 40;
    applyHelmCommand(sub, { type: "periscope", direction: "toggle" });
    sub.depth = 46;
    applyHelmCommand(sub, { type: "periscope", direction: "toggle" });
    expect(sub.periscopeUp).toBe(true); // and too deep to lower
  });

  it("accelerates by 0.25 and brakes by 1 per step", () => {
    const sim = newSim();
    sim.sub.orderedSpeed = 2;
    stepSpeed(sim.sub);
    expect(sim.sub.speed).toBe(0.25);
    sim.sub.speed = 5;
    stepSpeed(sim.sub);
    expect(sim.sub.speed).toBe(4);
  });

  it("wraps heading to 0 above 6.28 and to 6.28 below 0, not modulo 2*pi", () => {
    const sim = newSim();
    sim.sub.heading = 6.27;
    sim.sub.turnRate = 0.02;
    stepHeading(sim.sub);
    expect(sim.sub.heading).toBe(0);
    sim.sub.turnRate = -0.01;
    stepHeading(sim.sub);
    expect(sim.sub.heading).toBe(6.28);
  });

  it("forces a slow moving submerged boat to sink", () => {
    const sim = newSim();
    sim.sub.depth = 30;
    sim.sub.speed = 1;
    stepDepth(sim.sub);
    expect(sim.sub.planes).toBe(1);
  });

  it("converts the heading to the compass shown on the radar", () => {
    expect(compassDegrees(1.507)).toBe(4);
    expect(compassDegrees(0)).toBe(90);
  });
});

describe("enemy movement", () => {
  it("travels to waypoint W at difficulty + the row speed of waypoint W, then continues", () => {
    const sim = newSim(1, { difficulty: 2 });
    const freighter = sim.vessels[3];
    expect(freighter).toBeDefined();
    if (!freighter) return;
    sim.step();
    const first = scenario(1).ships[1]?.waypoints[0];
    expect(freighter.waypointIndex).toBe(1);
    expect(freighter.targetX).toBe(first?.x);
    expect(freighter.speed).toBe(2 + (first?.speed ?? 0));
  });

  it("stops merchants after the last waypoint but loops patrol boats and the tender", () => {
    const sim = newSim(1);
    const freighter = sim.vessels[3];
    const tender = sim.vessels[2];
    if (!freighter || !tender) throw new Error("missing vessels");
    for (const v of [freighter, tender]) {
      v.waypointIndex = 7;
      v.x = v.targetX = v.waypoints[6]?.x ?? 0;
      v.y = v.targetY = v.waypoints[6]?.y ?? 0;
    }
    sim.step();
    expect(freighter.speed).toBe(0);
    expect(tender.waypointIndex).toBe(1);
  });

  it("computes the detection chance from depth, range, periscope and time of day", () => {
    const sim = newSim();
    sim.sub.depth = 0;
    sim.sub.periscopeUp = false;
    // ((2 + 0 - 1) * (0.2 + 1) / ((0+1)^1.8 * (5+1)))^1.5
    expect(detectionChance(sim.sub, 500, 0, 1)).toBeCloseTo((1.2 / 6) ** 1.5, 10);
    sim.sub.periscopeUp = true;
    expect(detectionChance(sim.sub, 500, 0, 1)).toBeGreaterThan(detectionChance({ ...sim.sub, periscopeUp: false }, 500, 0, 1));
  });

  it("alerts a ship inside 950 units and makes merchants flee at 7 + difficulty", () => {
    const sim = newSim(3, { difficulty: 4 }, 1);
    const ship = sim.vessels[3];
    if (!ship) throw new Error("missing");
    sim.sub.x = ship.x - 300;
    sim.sub.y = ship.y;
    sim.sub.depth = 0;
    sim.sub.periscopeUp = true;
    const events: SimEvent[] = [];
    for (let i = 0; i < 200 && sim.sub.alertTimer === 0; i += 1) events.push(...sim.step());
    expect(events.some((e) => e.type === "contactAlert")).toBe(true);
    sim.step();
    expect(ship.speed).toBe(7 + 4);
  });
});

describe("wrap-around world (remake switch; the original clamps at the edge)", () => {
  it("measures the shorter way round only when wrapping", () => {
    expect(shortestDelta(24900, 100, WORLD_WIDTH, false)).toBe(-24800);
    expect(shortestDelta(24900, 100, WORLD_WIDTH, true)).toBe(200); // across the east edge
    expect(shortestDelta(100, 24900, WORLD_WIDTH, true)).toBe(-200);
    expect(shortestDelta(100, 600, WORLD_WIDTH, true)).toBe(500);
    expect(worldDelta(10, 19950, 30, 50, true)).toEqual({ dx: 20, dy: 100 });
    expect(wrapInto(25010, WORLD_WIDTH)).toBe(10);
    expect(wrapInto(-5, WORLD_HEIGHT)).toBe(19995);
    expect(wrapInto(0, WORLD_WIDTH)).toBe(1); // the lowest position is 1, as in the original
  });

  it("the boat stops at the edge of the world unless the world wraps, then it comes in on the other side", () => {
    const run = (wrap: boolean): { x: number; y: number } => {
      const sub = newSim().sub;
      Object.assign(sub, { x: 24990, y: 10, heading: 0, speed: 20 });
      stepPosition(sub, wrap);
      return { x: sub.x, y: sub.y };
    };
    expect(run(false).x).toBe(24999);
    expect(run(true).x).toBeCloseTo(10, 6);
    const north = newSim().sub;
    Object.assign(north, { x: 500, y: 19995, heading: Math.PI / 2, speed: 10 });
    stepPosition(north, true);
    expect(north.y).toBeCloseTo(5, 6);
    const south = Object.assign(newSim().sub, { x: 500, y: 3, heading: -Math.PI / 2, speed: 10 });
    stepPosition(south, true);
    expect(south.y).toBeCloseTo(19993, 6);
  });

  it("a ship across the seam is near: distance and bearing go the short way", () => {
    const sim = newSim();
    const ship = sim.vessels[3];
    if (!ship) throw new Error("missing");
    Object.assign(sim.sub, { x: 24900, y: 8000, heading: 0 });
    Object.assign(ship, { x: 100, y: 8000 });
    updateContacts(sim.sub, sim.vessels, { x: -1, y: -1, innerRadius: 1, outerRadius: 1 }, true);
    expect(ship.distance).toBeCloseTo(200);
    expect(ship.relativeBearing).toBeCloseTo(0); // dead ahead (east), not astern
    updateContacts(sim.sub, sim.vessels, { x: -1, y: -1, innerRadius: 1, outerRadius: 1 }, false);
    expect(ship.distance).toBeCloseTo(24800);
  });

  it("a torpedo hits across the seam, and a ship that sails off the east edge appears in the west", () => {
    const sim = newSim();
    const ship = sim.vessels[3];
    if (!ship) throw new Error("missing");
    Object.assign(ship, { x: 5, y: 9000, heading: 0 });
    const torp = createTorpedoes();
    const t = torp[1];
    if (!t) throw new Error("missing");
    Object.assign(t, { active: true, speed: 17, x: 24995, y: 9000, heading: 0 });
    expect(torpedoHits(t, ship, false)).toBe(false);
    expect(torpedoHits(t, ship, true)).toBe(true);
    const sailing = newSim(1, { wrapWorld: true });
    const freighter = sailing.vessels[3];
    if (!freighter) throw new Error("missing");
    Object.assign(freighter, { x: 24995, y: 9000, heading: 0, speed: 8, targetX: 26000, targetY: 9000, waypointIndex: 1 });
    sailing.step();
    expect(freighter.x).toBeLessThan(100);
  });

  it("without the switch nothing changes: the boat is clamped and ships keep to the plain map", () => {
    const sim = newSim(1);
    Object.assign(sim.sub, { x: 24999, y: 8000, heading: 0, speed: 20 });
    sim.step();
    expect(sim.sub.x).toBe(24999);
  });
});

describe("gradual ship turns (remake switch; the original takes the next leg's heading at once)", () => {
  /** A freighter that has just reached a waypoint, with the next one to the north while it was heading east. */
  function turning(over: Partial<SimOptions>): { sim: Simulation; ship: ReturnType<typeof newSim>["vessels"][number] } {
    const sim = newSim(1, over);
    const ship = sim.vessels[3];
    if (!ship) throw new Error("missing");
    sim.sub.x = 2000; // far away: no alert
    sim.sub.y = 2000;
    sim.sub.depth = 80;
    sim.step(); // the first leg is taken at once in both modes
    ship.waypoints = [{ x: 15000, y: 8000, speed: 4 }, { x: 15000, y: 12000, speed: 4 }, ...ship.waypoints.slice(2)];
    Object.assign(ship, { x: 15000, y: 8000, heading: 0, waypointIndex: 1, speed: 8, targetX: 15000, targetY: 8000 });
    return { sim, ship };
  }

  it("takes the first leg at once, then swings round a little each step instead of snapping to the next leg", () => {
    const { sim, ship } = turning({ gradualTurns: true });
    sim.step(); // arrives: the next waypoint is due north
    const headings = [ship.heading];
    for (let i = 0; i < 12; i += 1) {
      sim.step();
      headings.push(ship.heading);
    }
    expect(headings[0]).toBeLessThan(0.1); // still nearly east after the step that chose the new leg
    const steps = headings.slice(1).map((h, i) => Math.abs(h - (headings[i] as number)));
    expect(Math.max(...steps)).toBeLessThanOrEqual(0.028 + 1e-9); // a merchant turns at 0.028 rad a step at most
    expect(headings.at(-1)).toBeGreaterThan(0.2);
    expect(headings.at(-1)).toBeLessThan(Math.PI / 2 + 1e-9); // and never beyond the new bearing
  });

  it("the original takes the new heading at once", () => {
    const { sim, ship } = turning({});
    sim.step();
    expect(ship.heading).toBeCloseTo(Math.PI / 2, 2);
  });

  it("a ship that turns gradually still reaches every waypoint and does not circle one", () => {
    const sim = newSim(1, { gradualTurns: true });
    sim.sub.x = 2000;
    sim.sub.y = 2000;
    sim.sub.depth = 80;
    const freighter = sim.vessels[3];
    if (!freighter) throw new Error("missing");
    let reached = 0;
    for (let i = 0; i < 6000 && freighter.waypointIndex < 3; i += 1) {
      sim.sub.x = 2000;
      sim.sub.y = 2000;
      for (const e of sim.step()) if (e.type === "waypointReached" && e.slot === 3) reached += 1;
    }
    expect(reached).toBeGreaterThanOrEqual(2);
  });

  it("warships turn faster than merchants", () => {
    const sim = newSim(1, { gradualTurns: true });
    const destroyer = sim.vessels.find((v) => v.typeCode === TYPE.destroyer);
    const freighter = sim.vessels[3];
    if (!destroyer || !freighter) throw new Error("missing");
    for (const v of [destroyer, freighter]) Object.assign(v, { desiredHeading: 0, heading: 0, speed: 8, x: 12000, y: 12000, targetX: 12000, targetY: 14000, waypointIndex: 2 });
    sim.sub.x = 2000;
    sim.sub.y = 2000;
    sim.sub.depth = 80;
    sim.step();
    expect(destroyer.heading).toBeCloseTo(0.035, 6);
    expect(freighter.heading).toBeCloseTo(0.028, 6);
  });
});

describe("torpedoes", () => {
  it("refuses to fire with closed doors or a damaged torpedo room, then fires straight ahead at speed 17", () => {
    const sim = newSim();
    const torp = createTorpedoes();
    const events: SimEvent[] = [];
    expect(launchTorpedo(sim.sub, torp, events)).toBeNull();
    sim.sub.doorsOpen = true;
    sim.sub.damage[2] = 1;
    expect(launchTorpedo(sim.sub, torp, events)).toBeNull();
    sim.sub.damage[2] = 0;
    expect(launchTorpedo(sim.sub, torp, events)).toBe(1);
    expect(torp[1]).toMatchObject({ speed: 17, heading: sim.sub.heading, active: true });
    expect(sim.sub.torpedoes).toBe(23);
    expect(launchTorpedo(sim.sub, torp, events)).toBe(2);
  });

  it("uses an elongated hit ellipse (patrol boats are smaller)", () => {
    const ship = createVessels(scenario(1))[3];
    if (!ship) throw new Error("missing");
    ship.heading = 0;
    ship.x = 1000;
    ship.y = 1000;
    const t = createTorpedoes()[1];
    if (!t) throw new Error("missing");
    t.x = 1000 + 20; // 20 along the heading: inside 9.9 + 18
    t.y = 1000;
    expect(torpedoHits(t, ship)).toBe(true);
    t.x = 1000 + 30; // beyond
    expect(torpedoHits(t, ship)).toBe(false);
    ship.typeCode = TYPE.patrolBoat;
    t.x = 1000 + 20; // 9.24 + 14 = 23.24
    expect(torpedoHits(t, ship)).toBe(true);
    t.x = 1000 + 24;
    expect(torpedoHits(t, ship)).toBe(false);
  });

  it("sinks a hit ship out of sight, logs it and finishes the mission when the convoy is gone", () => {
    const sim = newSim(1, { inControlRoom: false });
    const log = new ShipLog(shipLog);
    const ship = sim.vessels[3];
    if (!ship) throw new Error("missing");
    ship.x = 5000;
    ship.y = 5000;
    ship.heading = 0;
    ship.distance = 400;
    const torp = createTorpedoes();
    const t = torp[1];
    if (!t) throw new Error("missing");
    Object.assign(t, { active: true, speed: 17, x: 5000 - 10, y: 5000, heading: 0, travelled: 0, spent: false });
    const events: SimEvent[] = [];
    advanceTorpedoes({ sub: sim.sub, difficulty: 0, rng: sequenceRng([0.5]), events, vessels: sim.vessels, torpedoes: torp, log, closeList: [3], inControlRoom: false, date: "01-02-1984" });
    expect(ship.sunk).toBe(true);
    expect(ship.y).toBeLessThan(-900);
    expect(events.find((e) => e.type === "shipSunk")).toMatchObject({ slot: 3 });
    expect(log.totals.shipsSunk).toBe(1);
    expect(log.totals.tonnage).toBeGreaterThan(0);
    // slots 4 and 5 still afloat: mission not complete; sink them too
    expect(convoySunk(sim.vessels, 5)).toBe(false);
    for (const slot of [4, 5]) {
      const v = sim.vessels[slot];
      if (v) v.y = -2000;
    }
    expect(convoySunk(sim.vessels, 5)).toBe(true); // 3, 4 and 5 are all gone
  });

  it("destroys the own boat when a visible hit is too close", () => {
    const sim = newSim(1);
    const ship = sim.vessels[3];
    if (!ship) throw new Error("missing");
    ship.x = sim.sub.x + 10;
    ship.y = sim.sub.y;
    ship.heading = 0;
    ship.typeCode = TYPE.freighter;
    ship.distance = 10;
    ship.apparentSize = 90;
    sim.sub.periscopeUp = true;
    sim.sub.depth = 10;
    sim.sub.heading = 0;
    const torp = createTorpedoes();
    const t = torp[1];
    if (!t) throw new Error("missing");
    Object.assign(t, { active: true, speed: 17, x: ship.x - 5, y: ship.y, heading: 0 });
    const result = advanceTorpedoes({ sub: sim.sub, difficulty: 0, rng: sequenceRng([0.9]), events: [], vessels: sim.vessels, torpedoes: torp, log: new ShipLog(shipLog), closeList: [3], inControlRoom: true, date: "x" });
    expect(result.ownBoatDestroyed).toBe(true);
  });
});

describe("mission rules", () => {
  it("completes the island objective only when stopped in the right quadrant at the right time of day", () => {
    const sim = newSim(7, { timeOfDay: 0 });
    const island = scenario(7).islands[14];
    if (!island) throw new Error("missing island");
    sim.teleport(island.x, island.y + island.innerRadius + 50);
    sim.sub.speed = 0;
    sim.sub.orderedSpeed = 0;
    sim.sub.depth = 0;
    const events = sim.step();
    expect(events.some((e) => e.type === "missionComplete" && e.reason === "island")).toBe(true);
    expect(sim.status).toBe("running"); // like the original, the mission goes on after the message
    expect(sim.missionComplete).toBe(true);
    const day = newSim(7, { timeOfDay: 1 });
    day.teleport(island.x, island.y + island.innerRadius + 50);
    day.step();
    expect(day.status).toBe("running");
  });

  it("destroys the boat with more than five damaged compartments and crushes it far below 350", () => {
    const sim = newSim();
    for (let k = 1; k <= 6; k += 1) sim.sub.damage[k] = 1;
    expect(sim.step().some((e) => e.type === "subDestroyed" && e.reason === "damage")).toBe(true);
    const deep = newSim();
    deep.sub.depth = 1500;
    const events: SimEvent[] = [];
    for (let i = 0; i < 200 && deep.status === "running"; i += 1) events.push(...deep.step());
    expect(events.some((e) => e.type === "subDestroyed" && e.reason === "crush")).toBe(true);
  });

  it("refuels, reloads and repairs next to the subtender", () => {
    const sim = newSim();
    sim.sub.fuel = 20000;
    sim.sub.torpedoes = 22;
    sim.sub.damage[4] = 1;
    const tender = sim.vessels[2];
    if (!tender) throw new Error("missing");
    tender.x = sim.sub.x + 50;
    tender.y = sim.sub.y;
    tender.speed = 0;
    tender.waypoints = [];
    tender.targetX = tender.x;
    tender.targetY = tender.y;
    tender.waypointIndex = 8;
    for (let i = 0; i < 400 && sim.sub.damage[4] !== 0; i += 1) {
      tender.x = sim.sub.x + 50;
      tender.y = sim.sub.y;
      tender.heading = sim.sub.heading; // resupply needs the tender on a parallel course
      sim.step();
    }
    expect(sim.sub.fuel).toBeGreaterThan(35000);
    expect(sim.sub.torpedoes).toBe(24);
    expect(sim.sub.damage[4]).toBe(0);
  });

  it("resupply takes the same real time at any step rate: fuel per step and torpedo reload steps scale with ticksPerSecond", () => {
    const refuel = (tps: number): { perStep: number; reloadSteps: number } => {
      const sim = new Simulation({ scenario: scenario(1), rng: createRng(7), options: options(), shipLog, ticksPerSecond: tps });
      const tender = sim.vessels[2];
      if (!tender) throw new Error("missing");
      const park = (): void => {
        tender.x = sim.sub.x + 50;
        tender.y = sim.sub.y;
        tender.heading = sim.sub.heading;
        tender.speed = 0;
        tender.waypointIndex = 8;
      };
      sim.sub.fuel = 20000;
      sim.sub.torpedoes = 23;
      park();
      sim.step(); // starts the resupply
      park();
      const before = sim.sub.fuel;
      sim.step();
      const perStep = sim.sub.fuel - before;
      sim.sub.fuel = 36000;
      let reloadSteps = 0;
      while (sim.sub.torpedoes < 24 && reloadSteps < 500) {
        park();
        sim.step();
        reloadSteps += 1;
      }
      return { perStep, reloadSteps };
    };
    expect(refuel(10)).toEqual({ perStep: 90, reloadSteps: 60 }); // the values of the 10 Hz port
    expect(refuel(2.5)).toEqual({ perStep: 360, reloadSteps: 15 }); // 900 fuel a second and 6 s a torpedo, as before
    expect(refuel(5)).toEqual({ perStep: 180, reloadSteps: 30 });
    const sim = newSim();
    sim.setTicksPerSecond(2.5);
    sim.setTicksPerSecond(0); // ignored
    expect(sim.tick).toBe(0);
  });

  it("resupply only starts when the tender's heading is within 0.393 rad of the boat's (also across the wrap): ds:0x23a6 is the pushed ABS", () => {
    expect(headingsAligned(1, 1.3)).toBe(true);
    expect(headingsAligned(1, 1.5)).toBe(false);
    expect(headingsAligned(0.1, 6.2)).toBe(true); // 6.1 apart = 0.18 rad across the wrap
    expect(headingsAligned(3, 0.2)).toBe(false);
    const sim = newSim();
    sim.sub.fuel = 20000;
    const tender = sim.vessels[2];
    if (!tender) throw new Error("missing");
    const events: SimEvent[] = [];
    for (const [offset, expected] of [[1.5, false], [0.2, true]] as const) {
      tender.x = sim.sub.x + 50;
      tender.y = sim.sub.y;
      tender.heading = sim.sub.heading + offset;
      tender.speed = 0;
      tender.waypointIndex = 8;
      events.length = 0;
      events.push(...sim.step());
      expect(events.some((e) => e.type === "resupplyStarted")).toBe(expected);
    }
  });

  it("ships turn the short way round: the first ABS(phi) of 0x0768f is the temporary at ds:0x23a6, not 0", () => {
    expect(turnsPositive(-1)).toBe(true);
    expect(turnsPositive(-4)).toBe(false); // phi < -pi: the long way would be +, so turn the other way
    expect(turnsPositive(1)).toBe(false);
    expect(turnsPositive(4)).toBe(true);
    expect(turnsPositive(0)).toBe(false);
  });

  it("compartments 7 and 8 have no direct effect, but count towards the damaged total and the alarm index sum like the others", () => {
    const ordered = (damaged: boolean): number => {
      const s = newSim();
      if (damaged) {
        s.sub.damage[7] = 1;
        s.sub.damage[8] = 1;
      }
      s.command({ type: "speed", level: "F3" });
      s.step();
      return s.sub.orderedSpeed;
    };
    expect(ordered(true)).toBe(ordered(false));
    const sim = newSim();
    sim.sub.damage[7] = 1;
    sim.sub.damage[8] = 1;
    expect(damageCount(sim.sub)).toBe(2);
    expect(damageIndexSum(sim.sub)).toBe(15); // 7 + 8 > 14: the boat sounds the alarm
    sim.sub.damage[6] = 1;
    sim.sub.damage[5] = 1;
    sim.sub.damage[4] = 1;
    expect(damageCount(sim.sub)).toBe(5);
    expect(damageIndexSum(sim.sub)).toBe(30);
  });

  it("runs deterministically under the fixed-step loop", () => {
    const a = newSim(1, {}, 3);
    const b = newSim(1, {}, 3);
    a.command({ type: "speed", level: "F3" });
    b.command({ type: "speed", level: "F3" });
    const loop = new FixedStepLoop(a, 10);
    loop.advance(1000);
    for (let i = 0; i < 10; i += 1) b.step();
    expect(a.sub.x).toBeCloseTo(b.sub.x, 10);
    expect(a.sub.speed).toBeCloseTo(b.sub.speed, 10);
    expect(a.tick).toBe(10);
  });
});

describe("launcher and demo", () => {
  it("chains like GATO.EXE: 2 demo, 3 history, 4 exit, anything else normal play", () => {
    const pick = (input: string) => {
      const l = new Launcher();
      l.pressAnyKey();
      return l.choose(input);
    };
    expect(pick("2")).toEqual({ screen: "done", target: "demo" });
    expect(pick("3")).toEqual({ screen: "done", target: "history" });
    expect(pick("4")).toEqual({ screen: "done", target: "exit" });
    expect(pick("1")).toEqual({ screen: "done", target: "simulation" });
    expect(pick("x")).toEqual({ screen: "done", target: "simulation" });
    const l = new Launcher();
    l.choose("2");
    expect(l.returnFrom("demo")).toEqual({ screen: "menu" });
  });

  it("clamps difficulty to 0..9 and toggles sound and time of day", () => {
    const gc = new GameControl();
    gc.apply(1, 14);
    expect(gc.settings.difficulty).toBe(9);
    gc.apply(1, -3);
    expect(gc.settings.difficulty).toBe(0);
    gc.apply(2);
    expect(gc.settings.sound).toBe(false);
    gc.apply(3);
    expect(gc.settings.timeOfDay).toBe(0);
    expect(gc.apply(9)).toBe(false);
    expect(gc.settings.mission).toBeNull(); // random, like the original, by default
    gc.apply(5, 7);
    expect(gc.settings.mission).toBe(7);
    gc.apply(5, 20);
    expect(gc.settings.mission).toBe(20);
    gc.apply(5, 21);
    expect(gc.settings.mission).toBeNull();
    gc.apply(5, 3);
    gc.apply(5, 0);
    expect(gc.settings.mission).toBeNull();
  });

  it("plays the demo in order: intro page, Morse example, then the narrated pages; F1 stops it", () => {
    const player = new DemoPlayer(demoScript);
    const first = player.start();
    expect(first).toEqual([{ type: "intro", screen: "intro" }]);
    expect(player.stage).toBe("intro");
    const seconds = demoScript.intro?.seconds_estimate ?? 0;
    expect(player.advance(seconds - 0.1)).toEqual([]);
    const morse = player.advance(0.2);
    expect(morse).toHaveLength(1);
    expect(morse[0]).toMatchObject({ type: "morse", screen: "morseExample" });
    expect(player.advance(100)).toEqual([]); // the example stays up until the UI says how long it takes
    player.setMorseSeconds(5);
    const pages = player.advance(5);
    expect(pages[0]).toMatchObject({ type: "page", index: 0, screen: "controlRoom" });
    expect(player.stage).toBe("pages");
    const later = [...pages, ...player.advance(1000)];
    expect(later.at(-1)).toMatchObject({ type: "finished", reason: "completed" });
    const again = new DemoPlayer(demoScript);
    again.start();
    expect(again.pressKey("F1")).toEqual([{ type: "finished", reason: "exit" }]);
    const radar = demoScript.pages.find((p) => p.lines.some((l) => l.includes("NOT MUCH IS HAPPENING")));
    expect(radar && screenForPage(radar)).toBe("radar");
  });

  it("each page is on the screen it is printed over: the chart and radar pages are still on the screen before theirs", () => {
    const screenOf = (text: string): string | undefined => {
      const page = demoScript.pages.find((p) => p.lines.some((l) => l.includes(text)));
      return page && screenForPage(page);
    };
    expect(screenOf("HERE IS THE MAIN CHART")).toBe("controlRoom");
    expect(screenOf("THIS IS THE CHART OF YOUR PATROL AREA")).toBe("chart");
    expect(screenOf("THE LOCAL QUADRANT MAP")).toBe("chart");
    expect(screenOf("THIS IS THE MAP FOR QUADRANT")).toBe("quadrantMap");
    expect(screenOf("LET'S TAKE A LOOK AT RADAR")).toBe("quadrantMap");
    expect(screenOf("LETS READ THE CAPTAIN'S LOG")).toBe("radar");
    for (const text of ["SHIPS SUNK", "THE FIRST GROUP OF SHIPS", "ALL OF THE NAMES", "ALSO ALL OF THE DESTROYERS"]) expect(screenOf(text)).toBe("captainsLog");
    const header = demoScript.pages.find((p) => p.lines.some((l) => l.trim() === "CAPTAIN'S LOG"));
    expect(header && screenForPage(header)).toBe("captainsLog");
    expect(screenOf("LET'S SEE WHAT THE ENEMY LOOKS LIKE")).toBe("controlRoom");
    const names = demoScript.pages.find((p) => p.lines.some((l) => l.trim() === "FREIGHTER"));
    expect(names && screenForPage(names)).toBe("shipGallery");
    expect(screenOf("TO SHOOT A SHIP")).toBe("controlRoom");
    expect(screenOf("REMEMBER PATROL CRAFT")).toBe("controlRoom");
    expect(screenOf("YOU HAVE TO PAY CLOSE ATTENTION")).toBe("controlRoom");
    expect(screenOf("CONTROL RM")).toBe("damageReport");
    expect(screenOf("THIS IS THE DAMAGE REPORT")).toBe("damageReport");
  });

  it("the ship gallery page names the five enemy ships in turn, one fifth of its time each, and no other page is a gallery", () => {
    const gallery = demoScript.pages.find((p) => p.lines.some((l) => l.trim() === "FREIGHTER"));
    if (!gallery) throw new Error("no gallery page");
    expect(screenForPage(gallery)).toBe("shipGallery");
    const at = (f: number): number | undefined => galleryShip(gallery, f)?.typeCode;
    expect([0, 0.25, 0.45, 0.65, 0.85, 0.999].map(at)).toEqual([TYPE.freighter, TYPE.tanker, TYPE.troopCarrier, TYPE.patrolBoat, TYPE.destroyer, TYPE.destroyer]);
    expect(galleryShip(gallery, 0.45)?.index).toBe(2);
    expect(galleryShip(gallery, -1)?.index).toBe(0);
    expect(galleryShip(gallery, 5)?.index).toBe(4);
    expect(demoScript.pages.filter((p) => galleryShip(p, 0) !== null)).toEqual([gallery]);
    // the player says how far through the page it is
    const player = new DemoPlayer(demoScript);
    player.start();
    player.pressKey("x");
    player.pressKey("x");
    for (let i = 0; i < demoScript.pages.indexOf(gallery); i += 1) player.advance(player.pageHoldSeconds(demoScript.pages[i] as typeof gallery) + 0.001);
    expect(player.currentPage).toBe(gallery);
    expect(player.pageFraction).toBeLessThan(0.01);
    player.advance(player.pageHoldSeconds(gallery) / 2);
    expect(player.pageFraction).toBeCloseTo(0.5, 1);
  });

  it("F2 only turns the sound off; any other key skips the intro, then ends the Morse example", () => {
    const player = new DemoPlayer(demoScript);
    player.start();
    expect(player.pressKey("F2")).toEqual([]);
    expect(player.soundOn).toBe(false);
    expect(player.stage).toBe("intro");
    const toMorse = player.pressKey("x");
    expect(toMorse[0]).toMatchObject({ type: "morse" });
    player.setMorseSeconds(60);
    expect(player.pressKey("F2")).toEqual([]);
    expect(player.stage).toBe("morse");
    const toPages = player.pressKey("Enter");
    expect(toPages[0]).toMatchObject({ type: "page", index: 0 });
    expect(player.pressKey("x")).toEqual([]); // narrated pages are not skipped by keys
    expect(player.currentPage).toBe(demoScript.pages[0]);
  });

  it("a script without the intro or the Morse example starts with the narration (older script files)", () => {
    const player = new DemoPlayer({ pages: demoScript.pages, nominal_iterations_per_second: 2500 });
    expect(player.start()[0]).toMatchObject({ type: "page", index: 0 });
  });

  it("the extracted demo script: intro cells, DEMORD, and boxes at the top of the screen", () => {
    expect(demoScript.intro?.text).toEqual([
      { row: 7, col: 12, text: "GATO DEMONSTRATION" },
      { row: 10, col: 5, text: "PRESS FUNCTION KEY 1 (F1) TO EXIT" },
      { row: 12, col: 2, text: " FUNCTION KEY 2 (F2) TO TURN OFF SOUND" },
    ]);
    expect(demoScript.morse?.file).toBe("DEMORD");
    expect(demoScript.morse?.lines).toEqual(["   THIS IS AN EXAMPLE OF HOW YOU", "", "   RECEIVE YOUR ORDERS."]);
    expect(demoScript.morse?.end_hold_seconds_estimate).toBe(2);
    expect(demoScript.pages.some((p) => p.lines.some((l) => l.includes("GATO DEMONSTRATION")))).toBe(false); // it is the intro, not narration
    expect(demoScript.pages.some((p) => p.lines.some((l) => l.includes("REPORTS HEAVY DAMAGE")))).toBe(false); // branch DEMO never takes
    const [main, chart] = demoScript.pages;
    expect(main?.box).toEqual({ x1: 5, y1: 5, x2: 314, y2: 50, color: 0 });
    expect(main?.text?.map((t) => [t.row, t.col, t.text])).toEqual([
      [2, 9, "THIS IS YOUR MAIN SCREEN"],
      [4, 3, "YOU ARE NOW IN THE THE CONTROL ROOM"],
      [5, 5, "YOU MAY CONTROL ALL OPERATIONS"],
      [6, 7, "OF THE SUBMARINE FROM HERE"],
    ]);
    expect(chart?.text?.map((t) => [t.row, t.col])).toEqual([[3, 5], [6, 5]]);
    for (const page of demoScript.pages) if (page.box) expect([page.box.x1, page.box.y1, page.box.color]).toEqual(page.page === 15 ? [0, 0, 0] : [5, 5, 0]); // the log's first note starts at the corner
  });

  it("the pages are in the order DEMO.EXE runs them (traced with analysis/trace_demo_flow.py), not in file order", () => {
    // stage 0: main screen, chart, quadrant map, radar, captain's log; stage 1: enemy ships, torpedoes, depth charges, damage report
    expect(demoScript.pages.map((p) => p.page)).toEqual([1, 2, 19, 20, 22, 23, 24, 8, 13, 14, 15, 16, 17, 3, 4, 5, 6, 7, 9, 10]);
    const starts = (text: string): number => demoScript.pages.findIndex((p) => p.lines.some((l) => l.includes(text)));
    expect(starts("THE LOCAL QUADRANT MAP")).toBeLessThan(starts("THIS IS THE MAP FOR QUADRANT"));
    expect(starts("LET'S TAKE A LOOK AT RADAR")).toBeLessThan(starts("LETS READ THE CAPTAIN'S LOG"));
    expect(starts("LETS READ THE CAPTAIN'S LOG")).toBeLessThan(starts("NOW WE ARE BACK IN THE CONTROL ROOM"));
    expect(starts("NOW WE ARE BACK IN THE CONTROL ROOM")).toBeLessThan(starts("TO SHOOT A SHIP"));
    expect(starts("THIS IS THE DAMAGE REPORT")).toBe(demoScript.pages.length - 1);
    // the log reset, GAME CONTROL and 'play again?' are game code DEMO.EXE carries but never reaches
    expect(demoScript.unreached_pages?.map((p) => p.page)).toEqual([11, 12, 18, 21]);
    expect(demoScript.pages.some((p) => p.lines.some((l) => /PLAY AGAIN|GAME CONTROL|LOG CLEARED/.test(l)))).toBe(false);
  });
});
