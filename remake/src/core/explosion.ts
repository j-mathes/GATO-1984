import type { ScopeFacing } from "./types.js";

/**
 * Torpedo-hit explosion of GATO1.EXE (subroutine at program offset 0x086dd-0x09c24, file offset + 0x3a00), as a pure timeline.
 *
 * Exact (read from the p-code, see analysis/radio_and_explosions.md):
 *  - peak = 4 + size^1.6 (size is the ship's apparent size, doubled for patrol boats); step = 1 + peak/15; unit = peak/44.
 *  - Stage 1 "grow": 11 filled columns above the horizon with heights 1, .8, .6, .3, .15, .05 of the current plume height d, d running
 *    0, step, 2*step ... <= peak, plus three splash boxes under the horizon. Stage 2 "shrink": d running peak, peak-step ... >= 0 (the
 *    columns are repainted in the sky colour). Each plume frame is a 300-pass empty FOR loop followed by the box draws.
 *  - A hit the ship survives (RND < difficulty/12, decided after stage 2) ends here.
 *  - Stage 3 "sparks": min(60, 20 + 2*size) debris spikes, one after another without delay: two white lines from the horizon to a random
 *    peak plus one black debris dot. Stage 4 "erase": the spikes are erased in reverse order (the ship vanishes). Stage 5 "fall": 14 steps in
 *    which every dot falls 6 px and drifts 2 px away from the centre until it reaches the horizon.
 *
 * Not recoverable: wall-clock durations. The original is CPU bound (no timer): each loop pass is a BASIC floating-point FOR step, estimated
 * here at {@link EXPLOSION_TIMING.loopPassSeconds}. Stage lengths in frames and the visual progression are exact; seconds are an estimate.
 */

export const EXPLOSION_TIMING = {
  /** One pass of `FOR v = 1 TO n : NEXT` in compiled single-precision BASIC on a 4.77 MHz 8088 (estimate). */
  loopPassSeconds: 0.00011,
  /** Delay loop before every plume frame (0x08d1d: FOR v224e = 1 TO 300). */
  plumeDelayPasses: 300,
  /** Drawing 14 filled boxes (estimate). */
  plumeDrawSeconds: 0.02,
  /** Five line/point draws per debris spike (estimate). */
  sparkSeconds: 0.012,
  /** Two line draws per erased spike (estimate). */
  eraseSeconds: 0.006,
  /** One pass over all debris dots (estimate). */
  fallStepSeconds: 0.03,
} as const;

export const PLUME_FRAME_SECONDS = EXPLOSION_TIMING.plumeDelayPasses * EXPLOSION_TIMING.loopPassSeconds + EXPLOSION_TIMING.plumeDrawSeconds;

export const EXPLOSION = {
  exponent: 1.6, // ds:0x2844
  base: 4, // v2568
  stepDivisor: 15, // ds:0x23fa
  unitDivisor: 44, // ds:0x2848
  baseDebris: 20, // ds:0x2652
  debrisPerSize: 2,
  maxDebris: 60, // ds:0x2870
  sparkSpreadFactor: 8, // v22aa = 1 + 8*unit (0x09286)
  sparkRiseFactor: 17, // ds:0x2824: v22a6 *= 17
  fallSteps: 14, // ds:0x2626
  fallDy: 6, // ds:0x25ee
  fallDx: 2, // ds:0x272e
} as const;

/** Columns of the plume as multiples of `unit` left/right of the centre and height fraction of the plume (0x08e3a-0x09088). */
export const PLUME_COLUMNS: readonly { l: number; r: number; f: number }[] = [
  { l: 0, r: 1, f: 1 },
  { l: -1, r: 0, f: 0.8 },
  { l: 1, r: 2, f: 0.8 },
  { l: -2, r: -1, f: 0.6 },
  { l: 2, r: 3, f: 0.6 },
  { l: -4, r: -2, f: 0.3 },
  { l: 3, r: 5, f: 0.3 },
  { l: -6, r: -4, f: 0.15 },
  { l: 5, r: 7, f: 0.15 },
  { l: -9, r: -6, f: 0.05 },
  { l: 7, r: 10, f: 0.05 },
];

/** Splash boxes under the horizon: x range in units and depth per unit of plume height (0x090c3-0x09139). */
export const SPLASH_BOXES: readonly { l: number; r: number; depth: number }[] = [
  { l: -9, r: 10, depth: 0 },
  { l: -4, r: 5, depth: 0.03 },
  { l: -1, r: 2, depth: 0.06 },
];

export const FACING_SIGN: Record<ScopeFacing, number> = { F: 1, P: -1, A: 1, S: -1 };

/** Scope screen x of a contact (0x06ccd): 160 - sin(a) * (227 + size * (0.5 + |sin(frame * 0.393)| * 1.5) * facing sign). */
export function scopeScreenX(relativeToFacing: number, size: number, frame: number, facing: ScopeFacing): number {
  return 160 - Math.sin(relativeToFacing) * (227 + size * (0.5 + Math.abs(Math.sin(frame * 0.393)) * 1.5) * FACING_SIGN[facing]);
}

export interface Debris {
  /** Spike tip, relative to the explosion centre x. */
  tipDx: number;
  /** Spike tip height above the horizon. */
  tipRise: number;
  /** Left/right foot of the spike, relative to x. */
  footLeftDx: number;
  footRightDx: number;
  /** Debris dot relative to the tip (x) and to the tip height (y, positive = down). */
  dotDx: number;
  dotDy: number;
}

export interface ExplosionPlan {
  /** Scope x of the ship at the moment of the hit. */
  x: number;
  size: number;
  /** Apparent size of the ship as drawn behind the explosion. */
  drawnSize: number;
  typeCode: number;
  frame: number;
  survived: boolean;
  peak: number;
  step: number;
  unit: number;
  /** Plume frames per pass (grow and shrink have the same count). */
  plumeFrames: number;
  /** Empty when the ship survived. */
  debris: Debris[];
}

export interface PlanInput {
  x: number;
  /** Apparent size as used for the plume (patrol boats already doubled). */
  size: number;
  /** Apparent size of the ship as drawn (not doubled); defaults to `size`. */
  drawnSize?: number;
  typeCode: number;
  frame: number;
  survived: boolean;
}

export function plumePeak(size: number): number {
  return EXPLOSION.base + size ** EXPLOSION.exponent;
}

export function debrisCount(size: number): number {
  return Math.min(EXPLOSION.maxDebris, EXPLOSION.baseDebris + EXPLOSION.debrisPerSize * size);
}

/** Cosmetic generator so animation never consumes the gameplay random stream. */
export function cosmeticRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function planExplosion(input: PlanInput, random: () => number): ExplosionPlan {
  const peak = plumePeak(input.size);
  const step = 1 + peak / EXPLOSION.stepDivisor;
  const unit = peak / EXPLOSION.unitDivisor;
  const debris: Debris[] = [];
  if (!input.survived) {
    const spread = 1 + EXPLOSION.sparkSpreadFactor * unit;
    const rise = step * EXPLOSION.sparkRiseFactor;
    const n = Math.floor(debrisCount(input.size));
    for (let i = 0; i < n; i += 1) {
      const tipDx = (-4 + random() * 8) * spread;
      const tipRise = random() * rise;
      const footLeftDx = -random() * spread;
      const footRightDx = random() * spread;
      const dotDx = -10 + random() * 20;
      const dotDy = -8 + random() * 10;
      debris.push({ tipDx, tipRise, footLeftDx, footRightDx, dotDx, dotDy });
    }
  }
  return { ...input, drawnSize: input.drawnSize ?? input.size, peak, step, unit, plumeFrames: Math.floor(peak / step) + 1, debris };
}

export type ExplosionStage = "grow" | "shrink" | "sparks" | "erase" | "fall" | "done";

/** Seconds per stage (grow, shrink, sparks, erase, fall). */
export function stageSeconds(plan: ExplosionPlan): Record<Exclude<ExplosionStage, "done">, number> {
  const n = plan.debris.length;
  return {
    grow: plan.plumeFrames * PLUME_FRAME_SECONDS,
    shrink: plan.plumeFrames * PLUME_FRAME_SECONDS,
    sparks: n * EXPLOSION_TIMING.sparkSeconds,
    erase: n * EXPLOSION_TIMING.eraseSeconds,
    fall: n === 0 ? 0 : EXPLOSION.fallSteps * EXPLOSION_TIMING.fallStepSeconds,
  };
}

export class Explosion {
  elapsed = 0;
  private readonly seconds: Record<Exclude<ExplosionStage, "done">, number>;

  constructor(readonly plan: ExplosionPlan) {
    this.seconds = stageSeconds(plan);
  }

  get totalSeconds(): number {
    return this.seconds.grow + this.seconds.shrink + this.seconds.sparks + this.seconds.erase + this.seconds.fall;
  }

  get finished(): boolean {
    return this.elapsed >= this.totalSeconds;
  }

  advance(seconds: number): void {
    if (seconds > 0) this.elapsed += seconds;
  }

  /** Stage and the time spent in it. */
  get position(): { stage: ExplosionStage; local: number } {
    let t = this.elapsed;
    for (const stage of ["grow", "shrink", "sparks", "erase", "fall"] as const) {
      if (t < this.seconds[stage]) return { stage, local: t };
      t -= this.seconds[stage];
    }
    return { stage: "done", local: t };
  }

  get stage(): ExplosionStage {
    return this.position.stage;
  }

  /** True until the spikes start to be erased: the sunk ship is still drawn behind the explosion. */
  get shipVisible(): boolean {
    const s = this.stage;
    return s === "grow" || s === "shrink" || s === "sparks";
  }
}

export type ExplosionColor = "flame" | "sky" | "dark" | "white" | "horizon";

export type ExplosionShape =
  | { kind: "rect"; x0: number; y0: number; x1: number; y1: number; color: ExplosionColor }
  | { kind: "line"; x0: number; y0: number; x1: number; y1: number; color: ExplosionColor }
  | { kind: "dot"; x: number; y: number; color: ExplosionColor };

/** Current plume height d for a grow/shrink frame (FOR v22da = 0 TO peak STEP step, then peak TO 0 STEP -step). */
export function plumeHeight(plan: ExplosionPlan, stage: "grow" | "shrink", frame: number): number {
  const k = Math.min(Math.max(frame, 0), plan.plumeFrames - 1);
  return stage === "grow" ? k * plan.step : plan.peak - k * plan.step;
}

/** Everything the explosion has on screen right now, in scope pixels. `horizon` is the y of the waterline. */
export function explosionShapes(ex: Explosion, horizon: number): ExplosionShape[] {
  const { plan } = ex;
  const { stage, local } = ex.position;
  const out: ExplosionShape[] = [];
  const x0 = plan.x;
  if (stage === "grow" || stage === "shrink") {
    const frame = Math.floor(local / PLUME_FRAME_SECONDS);
    const d = plumeHeight(plan, stage, frame);
    for (const c of PLUME_COLUMNS) {
      out.push({ kind: "rect", x0: x0 + c.l * plan.unit, x1: x0 + c.r * plan.unit, y0: horizon - c.f * d, y1: horizon, color: "flame" });
    }
    for (const b of SPLASH_BOXES) {
      const depth = b.depth * d;
      const full = b.depth * (stage === "grow" ? d : plan.peak);
      // grow paints the splash dark; shrink repaints the part that has gone in the flame colour
      out.push({ kind: "rect", x0: x0 + b.l * plan.unit, x1: x0 + b.r * plan.unit, y0: horizon + 1, y1: horizon + 1 + depth, color: "dark" });
      if (stage === "shrink") {
        out.push({ kind: "rect", x0: x0 + b.l * plan.unit, x1: x0 + b.r * plan.unit, y0: horizon + 1 + depth, y1: horizon + 1 + full, color: "flame" });
      }
    }
    return out;
  }
  const n = plan.debris.length;
  const spikeCount =
    stage === "sparks"
      ? Math.min(n, Math.floor(local / EXPLOSION_TIMING.sparkSeconds) + 1)
      : stage === "erase"
        ? Math.max(0, n - Math.floor(local / EXPLOSION_TIMING.eraseSeconds))
        : 0;
  for (let i = 0; i < spikeCount; i += 1) {
    const s = plan.debris[i] as Debris;
    const tipX = x0 + s.tipDx;
    const tipY = horizon - s.tipRise;
    out.push({ kind: "line", x0: x0 + s.footLeftDx, y0: horizon, x1: tipX, y1: tipY, color: "white" });
    out.push({ kind: "line", x0: x0 + s.footRightDx, y0: horizon, x1: tipX, y1: tipY, color: "white" });
  }
  if (stage === "sparks" || stage === "erase" || stage === "fall") {
    const dots = stage === "sparks" ? spikeCount : n;
    const fallStep = stage === "fall" ? Math.min(EXPLOSION.fallSteps, Math.floor(local / EXPLOSION_TIMING.fallStepSeconds) + 1) : 0;
    for (let i = 0; i < dots; i += 1) {
      const s = plan.debris[i] as Debris;
      const dotX = x0 + s.tipDx + s.dotDx;
      const dotY = horizon - s.tipRise + s.dotDy;
      const dir = dotX < x0 ? -EXPLOSION.fallDx : EXPLOSION.fallDx;
      const y = dotY + EXPLOSION.fallDy * fallStep;
      if (y < horizon) out.push({ kind: "dot", x: dotX + dir * fallStep, y, color: "dark" });
    }
  }
  return out;
}
