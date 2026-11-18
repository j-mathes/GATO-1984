import { describe, expect, it } from "vitest";
import type { Simulation } from "../core/index.js";
import { TYPE } from "../core/index.js";
import { Gfx } from "./gfx.js";
import {
  DEFAULT_VECTOR_INTERVAL,
  ShipTracker,
  STATIONARY_KNOTS,
  CHART_TRACK_EVERY_STEPS,
  TRACK_DOTS,
  TRACK_EVERY_STEPS,
  VECTOR_INTERVALS,
  drawNavSymbol,
  headingDelta,
  intervalSteps,
  isStationary,
  navClass,
  navDetail,
  navShips,
  navTagLines,
  navTriangle,
  nextSelection,
  placeTag,
  quadrantPixel,
  turnSign,
  vectorLegend,
  vectorLength,
  type NavView,
} from "./enhanced/nav.js";

interface FakeVessel {
  slot: number;
  typeCode: number;
  x: number;
  y: number;
  heading: number;
  speed: number;
  sunk: boolean;
  damaged: boolean;
}

const ship = (slot: number, typeCode: number, x: number, y: number, extra: Partial<FakeVessel> = {}): FakeVessel => ({ slot, typeCode, x, y, heading: 0, speed: 8, sunk: false, damaged: false, ...extra });

function fakeSim(vessels: FakeVessel[], tick = 0, depth = 0, wrapWorld = false): Simulation {
  const list: (FakeVessel | undefined)[] = [undefined, undefined];
  for (const v of vessels) list[v.slot] = v;
  return { tick, currentQuadrant: 5, options: { wrapWorld }, sub: { x: 22500, y: 2500, heading: Math.PI / 2, speed: 6, depth }, vessels: list } as unknown as Simulation;
}

function viewOf(sim: Simulation, difficulty = 1): NavView {
  const snap = { tick: sim.tick, sub: { x: sim.sub.x, y: sim.sub.y, heading: sim.sub.heading, depth: sim.sub.depth, speed: sim.sub.speed }, vessels: [], torpedoes: [] };
  return { sim, snap, settings: { difficulty } as NavView["settings"] };
}

describe("navigation symbols: classes and geometry", () => {
  it("each vessel class has its own name and colour; the island is not a vessel", () => {
    const colours = [TYPE.freighter, TYPE.tanker, TYPE.troopCarrier, TYPE.patrolBoat, TYPE.destroyer, TYPE.subtender].map((t) => navClass(t)?.color);
    expect(new Set(colours).size).toBe(6);
    expect(navClass(TYPE.freighter)?.label).toBe("FREIGHTER");
    expect(navClass(TYPE.destroyer)?.warship).toBe(true);
    expect(navClass(TYPE.island)).toBeNull();
  });

  it("the triangle is twice as long as it is wide, centred on the position, with its apex along the heading", () => {
    const { tip, left, right } = navTriangle(100, 50, 1, 0, 30);
    expect(tip[0]).toBeGreaterThan(100);
    expect(tip[1]).toBeCloseTo(50);
    expect(left[0]).toBeCloseTo(right[0]); // the base is square to the heading
    expect(Math.abs(left[1] - right[1])).toBeCloseTo(15); // half as wide as it is long
    expect(tip[0] - left[0]).toBeCloseTo(30);
    expect((tip[0] + left[0] + right[0]) / 3).toBeCloseTo(100); // the centre of the triangle is the position
    expect(navTriangle(0, 0, 0, -1, 30).tip[1]).toBeLessThan(0); // pointing up the screen
  });

  it("a ship below 0.5 knots is stopped (a circle), a damaged ship crawling at 1.75 is not", () => {
    expect(STATIONARY_KNOTS).toBe(0.5);
    expect(isStationary(0)).toBe(true);
    expect(isStationary(0.49)).toBe(true);
    expect(isStationary(1.75)).toBe(false);
  });

  it("a point past the edge of a quadrant is past the edge of the map, not wrapped to the other side", () => {
    const [left, top] = quadrantPixel(5, 20000, 4999); // the west edge, near the top of quadrant 5 (x 20000-25000, y 0-5000)
    expect(left).toBeCloseTo(0);
    expect(top).toBeLessThan(2);
    const [inside] = quadrantPixel(5, 24900, 2500);
    const [beyond] = quadrantPixel(5, 25300, 2500); // 400 units east of the edge, in quadrant 6
    expect(inside).toBeGreaterThan(300);
    expect(beyond).toBeGreaterThan(320); // off the picture, not back at its left side
    expect(quadrantPixel(5, 19900, 2500)[0]).toBeLessThan(0);
    expect(quadrantPixel(1, 0, 0)).toEqual([0, 199]);
  });

  it("the velocity vector grows linearly with the speed and the time", () => {
    expect(vectorLength(8, 60, 1)).toBe(2 * vectorLength(4, 60, 1));
    expect(vectorLength(8, 120, 0.05)).toBeCloseTo(2 * vectorLength(8, 60, 0.05));
    expect(vectorLength(0, 300, 1)).toBe(0);
  });

  it("a turn is a steady change of heading; a jump to a new leg and standing still are not", () => {
    expect(turnSign(0.028)).toBe(1); // counter-clockwise: to port
    expect(turnSign(-0.035)).toBe(-1); // to starboard
    expect(turnSign(0.001)).toBe(0);
    expect(turnSign(1.2)).toBe(0); // the ship took up its next leg
    expect(headingDelta(0.1, Math.PI * 2 - 0.1)).toBeCloseTo(0.2); // across north
    expect(headingDelta(Math.PI * 2 - 0.1, 0.1)).toBeCloseTo(-0.2);
  });

  it("the data tag lists the class and contact number, speed and true heading (the course over ground would be the same, so it is not listed)", () => {
    const cls = navClass(TYPE.freighter);
    if (!cls) throw new Error("no class");
    const lines = navTagLines({ slot: 4, cls, speed: 7, heading: Math.PI / 2, damaged: false });
    expect(lines).toEqual(["FREIGHTER #4", "SPD 7.0 kn", "HDG 000\u00b0"]);
    expect(navTagLines({ slot: 5, cls, speed: 1.75, heading: 0, damaged: true }).at(-1)).toBe("DAMAGED");
    const tender = navClass(TYPE.subtender);
    if (!tender) throw new Error("no class");
    expect(navTagLines({ slot: 2, cls: tender, speed: 0, heading: 0, damaged: false })[0]).toBe("SUB TENDER");
  });

  it("the vector spans 3, 6 or 12 intervals, 6 to begin with; an interval is a game minute, on the chart three", () => {
    expect(VECTOR_INTERVALS).toEqual([3, 6, 12]);
    expect(VECTOR_INTERVALS[DEFAULT_VECTOR_INTERVAL]).toBe(6);
    expect(intervalSteps("radar")).toBe(TRACK_EVERY_STEPS);
    expect(intervalSteps("quadrant")).toBe(TRACK_EVERY_STEPS);
    expect(intervalSteps("chart")).toBe(CHART_TRACK_EVERY_STEPS);
    expect(CHART_TRACK_EVERY_STEPS).toBe(3 * TRACK_EVERY_STEPS); // the unit of the vector is as long in time as the spacing of the dots behind
    expect(vectorLegend("radar", 6)).toBe("VECTOR 6 MIN  DOTS 1 MIN");
    expect(vectorLegend("quadrant", 12)).toBe("VECTOR 12 MIN  DOTS 1 MIN");
    expect(vectorLegend("chart", 6)).toBe("VECTOR 18 MIN  DOTS 3 MIN");
    // the same setting is the same count of intervals on every screen, so the chart reaches three times as far in time
    expect(vectorLength(8, 6 * intervalSteps("chart"), 1)).toBe(3 * vectorLength(8, 6 * intervalSteps("radar"), 1));
  });
});

describe("navigation symbols: where the tag goes", () => {
  const bounds = { x0: 0, y0: 0, x1: 1000, y1: 600 };
  const none = { circles: [], segments: [] };
  const overlaps = (p: { x: number; y: number }, w: number, h: number, x: number, y: number): boolean => x >= p.x && x <= p.x + w && y >= p.y && y <= p.y + h;

  it("goes up and to the right of a ship with nothing round it, and keeps its place from frame to frame", () => {
    const p = placeTag(190, 90, 500, 300, 20, none, bounds);
    expect(p.x + 95).toBeGreaterThan(500); // its middle is to the right of the ship
    expect(p.y + 90).toBeLessThan(300);
    expect(placeTag(190, 90, 500, 300, 20, none, bounds)).toEqual(p);
  });

  it("moves to the other side of a ship near the edge, and stays inside the picture", () => {
    const p = placeTag(190, 90, 960, 40, 20, none, bounds);
    expect(p.x + 190).toBeLessThanOrEqual(1000);
    expect(p.y).toBeGreaterThanOrEqual(0);
    expect(p.score).toBeLessThan(1000);
  });

  it("keeps off another ship and off a vector that runs through the usual place", () => {
    const other = { x: 560, y: 240, r: 30 };
    const vector = { x1: 500, y1: 300, x2: 800, y2: 120 }; // up and to the right: the first choice
    const p = placeTag(190, 90, 500, 300, 20, { circles: [other], segments: [vector] }, bounds);
    expect(overlaps(p, 190, 90, other.x, other.y)).toBe(false);
    for (let k = 0; k <= 30; k += 1) expect(overlaps(p, 190, 90, vector.x1 + ((vector.x2 - vector.x1) * k) / 30, vector.y1 + ((vector.y2 - vector.y1) * k) / 30), `point ${k}`).toBe(false);
  });

  it("never covers its own ship", () => {
    const ring = [-90, 0, 90, 180].map((deg) => ({ x: 500 + Math.cos((deg * Math.PI) / 180) * 120, y: 300 + Math.sin((deg * Math.PI) / 180) * 120, r: 60 }));
    const p = placeTag(190, 90, 500, 300, 20, { circles: ring, segments: [] }, bounds);
    expect(overlaps(p, 190, 90, 500, 300)).toBe(false);
  });
});

describe("navigation symbols: which ships a screen shows", () => {
  const near = ship(3, TYPE.freighter, 22600, 2600);
  const far = ship(4, TYPE.tanker, 22900, 3300);
  const outside = ship(5, TYPE.destroyer, 12000, 2600); // another quadrant, far away
  const sunk = ship(6, TYPE.patrolBoat, 22550, 2550, { sunk: true });
  const sim = fakeSim([near, far, outside, sunk]);

  it("the chart shows the ships at difficulty 2 and below, nearest first; the sunk are gone", () => {
    expect(navShips(viewOf(sim, 1), "chart").map((s) => s.slot)).toEqual([3, 4, 5]);
    expect(navShips(viewOf(sim, 3), "chart")).toEqual([]);
  });

  it("the quadrant map shows only the ships of its quadrant, up to difficulty 5", () => {
    expect(navShips(viewOf(sim, 5), "quadrant").map((s) => s.slot)).toEqual([3, 4]);
    expect(navShips(viewOf(sim, 6), "quadrant")).toEqual([]);
  });

  it("the radar shows the ships within range, and only at periscope depth", () => {
    expect(navShips(viewOf(sim, 9), "radar").map((s) => s.slot)).toEqual([3, 4]);
    expect(navShips(viewOf(fakeSim([near], 0, 80), 9), "radar")).toEqual([]);
  });

  it("with the world wrapping, a ship across the seam is near and ahead; without it, far away", () => {
    const across = ship(3, TYPE.freighter, 100, 2500);
    const eastBoat = (wrap: boolean): ReturnType<typeof fakeSim> => {
      const s = fakeSim([across], 0, 0, wrap);
      s.sub.x = 24900;
      s.sub.heading = 0;
      return s;
    };
    const wrapped = navShips(viewOf(eastBoat(true), 9), "radar");
    expect(wrapped.map((s) => s.slot)).toEqual([3]);
    expect(wrapped[0]?.distance).toBeCloseTo(200);
    expect(wrapped[0]?.relative).toBeCloseTo(0);
    expect(navShips(viewOf(eastBoat(false), 9), "radar")).toEqual([]);
  });

  it("only the ships of the first difficulty levels get vectors, tracks and tags", () => {
    expect(navDetail(2)).toBe(true);
    expect(navDetail(3)).toBe(false);
  });

  it("the tag moves to the next ship, nearest first, then to none, then starts again", () => {
    const ships = navShips(viewOf(sim, 1), "chart");
    expect(nextSelection(ships, null)).toBe(3);
    expect(nextSelection(ships, 3)).toBe(4);
    expect(nextSelection(ships, 5)).toBeNull();
    expect(nextSelection(ships, 99)).toBe(3); // the old selection is gone
    expect(nextSelection([], null)).toBeNull();
  });
});

describe("navigation symbols: the history of the ships", () => {
  it("keeps a dot every 10 steps (a game minute), five at most, oldest first", () => {
    const v = ship(3, TYPE.freighter, 0, 0);
    const sim = fakeSim([v]);
    const tracker = new ShipTracker();
    const sampled: number[] = [];
    for (let tick = 0; tick <= TRACK_EVERY_STEPS * 8; tick += 1) {
      (sim as unknown as { tick: number }).tick = tick;
      v.x = tick;
      tracker.update(sim);
      if (tick > 0 && tick % TRACK_EVERY_STEPS === 0) sampled.push(tick);
    }
    const trail = tracker.trail(3).map((p) => p.x);
    expect(trail).toHaveLength(TRACK_DOTS);
    expect(trail).toEqual(sampled.slice(-TRACK_DOTS));
  });

  it("a screen can ask for every third dot (the chart): always the same ones, five at most, so they do not slide", () => {
    const v = ship(3, TYPE.freighter, 0, 0);
    const sim = fakeSim([v]);
    const tracker = new ShipTracker();
    let previous: number[] = [];
    for (let tick = 0; tick <= TRACK_EVERY_STEPS * 20; tick += 1) {
      (sim as unknown as { tick: number }).tick = tick;
      v.x = tick;
      tracker.update(sim);
      const wide = tracker.trail(3, CHART_TRACK_EVERY_STEPS).map((p) => p.x);
      expect(wide.length).toBeLessThanOrEqual(TRACK_DOTS);
      for (const x of previous) if (wide.length === TRACK_DOTS && x >= (wide[0] as number)) expect(wide).toContain(x); // a dot stays until it is pushed out
      previous = wide;
    }
    expect(tracker.trail(3, CHART_TRACK_EVERY_STEPS).map((p) => p.x)).toEqual([70, 100, 130, 160, 190]); // every 30 steps
    expect(tracker.trail(3).map((p) => p.x)).toEqual([160, 170, 180, 190, 200]); // the radar and the map: every 10
  });

  it("notes the direction of a turn from the change of heading, and forgets it when the ship goes straight", () => {
    const v = ship(3, TYPE.freighter, 0, 0, { heading: 1 });
    const sim = fakeSim([v]);
    const tracker = new ShipTracker();
    tracker.update(sim);
    (sim as unknown as { tick: number }).tick = 1;
    v.heading = 1.028;
    tracker.update(sim);
    expect(tracker.turn(3)).toBe(1);
    (sim as unknown as { tick: number }).tick = 2;
    v.heading = 1.0;
    tracker.update(sim);
    expect(tracker.turn(3)).toBe(-1);
    (sim as unknown as { tick: number }).tick = 3;
    tracker.update(sim);
    expect(tracker.turn(3)).toBe(0);
  });

  it("starts over for a new mission and drops a ship that was sunk", () => {
    const v = ship(3, TYPE.freighter, 0, 0);
    const tracker = new ShipTracker();
    const sim = fakeSim([v]);
    for (let tick = 0; tick <= TRACK_EVERY_STEPS * 2; tick += 1) {
      (sim as unknown as { tick: number }).tick = tick;
      tracker.update(sim);
    }
    expect(tracker.trail(3).length).toBeGreaterThan(0);
    v.sunk = true;
    (sim as unknown as { tick: number }).tick += 1;
    tracker.update(sim);
    expect(tracker.trail(3)).toEqual([]);
    tracker.update(fakeSim([ship(3, TYPE.freighter, 0, 0)], 0)); // another simulation
    expect(tracker.trail(3)).toEqual([]);
  });
});

describe("navigation symbols: drawing", () => {
  function recording(): { g: Gfx; log: string[] } {
    const log: string[] = [];
    const ctx = new Proxy({}, {
      get: (_t, name: string) => (...args: unknown[]) => log.push(`${name}(${args.map(String).join(",")})`),
      set: (_t, name: string, value: unknown) => {
        log.push(`${name}=${String(value)}`);
        return true;
      },
    });
    return { g: new Gfx({ width: 0, height: 0, getContext: () => ctx } as unknown as HTMLCanvasElement), log };
  }
  const base = { x: 100, y: 100, dx: 1, dy: 0, color: "#5fe08a", size: 30, speed: 8, detail: true, vector: 80, turn: 0 as const, trail: [] as [number, number][] };

  it("a ship under way is a triangle with a dashed vector; a stopped one is a circle without lines", () => {
    const moving = recording();
    drawNavSymbol(moving.g, base);
    expect(moving.log.some((l) => l.startsWith("closePath"))).toBe(true);
    expect(moving.log.some((l) => l.startsWith("setLineDash(") && l !== "setLineDash()")).toBe(true);
    const stopped = recording();
    drawNavSymbol(stopped.g, { ...base, speed: 0 });
    expect(stopped.log.some((l) => l.startsWith("closePath"))).toBe(false);
    expect(stopped.log.some((l) => l.startsWith("arc("))).toBe(true);
    expect(stopped.log.some((l) => l.startsWith("setLineDash(") && l !== "setLineDash()")).toBe(false);
  });

  it("without the details only the symbol is drawn, and the turn flag adds a stroke", () => {
    const plain = recording();
    drawNavSymbol(plain.g, { ...base, detail: false });
    expect(plain.log.some((l) => l.startsWith("setLineDash(") && l !== "setLineDash()")).toBe(false);
    const straight = recording();
    drawNavSymbol(straight.g, base);
    const turning = recording();
    drawNavSymbol(turning.g, { ...base, turn: 1 });
    const lines = (log: string[]): number => log.filter((l) => l.startsWith("lineTo")).length;
    expect(lines(turning.log)).toBe(lines(straight.log) + 1);
  });
});
