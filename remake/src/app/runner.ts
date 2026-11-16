import type { SimEvent, Simulation } from "../core/index.js";

/** What the renderer needs from one simulation step; plain numbers so two of them can be interpolated. */
export interface Snapshot {
  tick: number;
  sub: { x: number; y: number; heading: number; depth: number; speed: number };
  vessels: { slot: number; x: number; y: number; heading: number }[];
  torpedoes: { tube: number; x: number; y: number; active: boolean }[];
}

export function takeSnapshot(sim: Simulation): Snapshot {
  return {
    tick: sim.tick,
    sub: { x: sim.sub.x, y: sim.sub.y, heading: sim.sub.heading, depth: sim.sub.depth, speed: sim.sub.speed },
    vessels: sim.vessels.slice(1).map((v) => ({ slot: v.slot, x: v.x, y: v.y, heading: v.heading })),
    torpedoes: sim.torpedoes.slice(1).map((t) => ({ tube: t.tube, x: t.x, y: t.y, active: t.speed > 0 })),
  };
}

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

/** Shortest-arc interpolation: the simulation wraps headings at 6.28, which must not spin the sprite the long way round. */
export function lerpAngle(a: number, b: number, t: number): number {
  let d = b - a;
  while (d > Math.PI) d -= 2 * Math.PI;
  while (d < -Math.PI) d += 2 * Math.PI;
  return a + d * t;
}

/** Positions that jump (a ship removed to y = -2000, a teleport, a freshly launched torpedo) are not blended. */
const JUMP = 500;

export function interpolate(a: Snapshot, b: Snapshot, t: number): Snapshot {
  const blend = (x0: number, y0: number, x1: number, y1: number): { x: number; y: number } =>
    Math.abs(x1 - x0) > JUMP || Math.abs(y1 - y0) > JUMP ? { x: x1, y: y1 } : { x: lerp(x0, x1, t), y: lerp(y0, y1, t) };
  const sub = blend(a.sub.x, a.sub.y, b.sub.x, b.sub.y);
  return {
    tick: b.tick,
    sub: {
      ...sub,
      heading: lerpAngle(a.sub.heading, b.sub.heading, t),
      depth: lerp(a.sub.depth, b.sub.depth, t),
      speed: lerp(a.sub.speed, b.sub.speed, t),
    },
    vessels: b.vessels.map((v, i) => {
      const p = a.vessels[i] ?? v;
      return { slot: v.slot, ...blend(p.x, p.y, v.x, v.y), heading: lerpAngle(p.heading, v.heading, t) };
    }),
    torpedoes: b.torpedoes.map((tp, i) => {
      const p = a.torpedoes[i] ?? tp;
      return { tube: tp.tube, active: tp.active, ...(p.active && tp.active ? blend(p.x, p.y, tp.x, tp.y) : { x: tp.x, y: tp.y }) };
    }),
  };
}

export interface FrameResult {
  /** Events of the simulation steps that ran during this frame. */
  events: SimEvent[];
  /** Number of steps run. */
  steps: number;
  /** 0..1 position between the previous and the current snapshot. */
  alpha: number;
  /** Render state: previous and current snapshots blended by alpha. */
  render: Snapshot;
}

/**
 * requestAnimationFrame accumulator: real elapsed time is turned into whole 10 Hz simulation steps; the remainder becomes the
 * interpolation factor so motion stays smooth at any display rate. Frames longer than `maxFrameMs` are clamped (tab switch).
 */
export class FixedTimestepRunner {
  readonly stepMs: number;
  paused = false;
  private accumulator = 0;
  private lastTime: number | null = null;
  private previous: Snapshot;
  private current: Snapshot;

  constructor(
    private sim: Simulation,
    readonly hz = 10,
    private readonly maxFrameMs = 250,
  ) {
    this.stepMs = 1000 / hz;
    this.current = takeSnapshot(sim);
    this.previous = this.current;
  }

  /** Switch to another simulation (new mission) without a visual jump. */
  setSimulation(sim: Simulation): void {
    this.sim = sim;
    this.current = takeSnapshot(sim);
    this.previous = this.current;
    this.accumulator = 0;
  }

  /** Drop the elapsed-time history (after a pause or a screen without simulation). */
  resetClock(): void {
    this.lastTime = null;
    this.accumulator = 0;
  }

  frame(nowMs: number): FrameResult {
    const events: SimEvent[] = [];
    let steps = 0;
    if (this.lastTime === null) this.lastTime = nowMs;
    const dt = Math.min(Math.max(nowMs - this.lastTime, 0), this.maxFrameMs);
    this.lastTime = nowMs;
    if (!this.paused && this.sim.status === "running") {
      this.accumulator += dt;
      while (this.accumulator >= this.stepMs && this.sim.status === "running") {
        events.push(...this.sim.step());
        this.previous = this.current;
        this.current = takeSnapshot(this.sim);
        this.accumulator -= this.stepMs;
        steps += 1;
      }
    }
    const alpha = this.paused || this.sim.status !== "running" ? 1 : this.accumulator / this.stepMs;
    return { events, steps, alpha, render: interpolate(this.previous, this.current, alpha) };
  }
}
