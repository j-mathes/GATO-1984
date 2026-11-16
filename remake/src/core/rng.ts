import type { Rng } from "./types.js";

/** Deterministic generator (mulberry32) so simulations and tests are reproducible. */
export function createRng(seed: number): Rng {
  let a = seed >>> 0;
  return {
    next(): number {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    },
  };
}

/** Rng driven by a fixed list of values (tests); repeats the last one when exhausted. */
export function sequenceRng(values: number[]): Rng {
  let i = 0;
  return {
    next(): number {
      const v = values[Math.min(i, values.length - 1)] ?? 0;
      i += 1;
      return v;
    },
  };
}

/** BASIC CINT: round to nearest, ties to even (the IBM runtime uses banker's rounding). */
export function cint(v: number): number {
  const f = Math.floor(v);
  const d = v - f;
  if (d < 0.5) return f;
  if (d > 0.5) return f + 1;
  return f % 2 === 0 ? f : f + 1;
}

/** BASIC FIX: truncate toward zero. */
export function fix(v: number): number {
  return v < 0 ? Math.ceil(v) : Math.floor(v);
}
