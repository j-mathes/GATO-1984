import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  ENGINE,
  Launcher,
  GameControl,
  DemoPlayer,
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
  torpedoHits,
  turnsPositive,
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
    const radar = demoScript.pages.find((p) => p.lines.some((l) => l.includes("RADAR")));
    expect(radar && screenForPage(radar)).toBe("radar");
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
    for (const page of demoScript.pages) if (page.box) expect([page.box.x1, page.box.y1, page.box.color]).toEqual([5, 5, 0]);
  });
});
