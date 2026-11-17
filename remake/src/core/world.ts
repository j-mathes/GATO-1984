import { WORLD } from "./constants.js";

/**
 * The size of the world in units: the original clamps the boat to 1..24999 by 1..19999 (0x067a1-0x067cf) and stops there. With the WRAP-AROUND WORLD
 * switch (remake only) the map instead joins its opposite edges: leave through the east edge and you come in at the west, and the same north and south.
 */
export const WORLD_WIDTH = WORLD.maxX + 1;
export const WORLD_HEIGHT = WORLD.maxY + 1;

/** A coordinate brought back into 1..size (the original's lowest position is 1). */
export function wrapInto(value: number, size: number): number {
  const r = value - Math.floor(value / size) * size;
  return r < 1 ? 1 : r;
}

/**
 * How far it is from `from` to `to` along one axis: the plain difference, or with `wrap` the shorter way round the world (never more than half of
 * `size`, so the sign says which way is shorter).
 */
export function shortestDelta(from: number, to: number, size: number, wrap: boolean | undefined): number {
  const d = to - from;
  if (!wrap) return d;
  const half = size / 2;
  if (d > half) return d - size;
  if (d < -half) return d + size;
  return d;
}

/** The (dx, dy) from one position to another, the shorter way round the world when it wraps. */
export function worldDelta(ax: number, ay: number, bx: number, by: number, wrap: boolean | undefined): { dx: number; dy: number } {
  return { dx: shortestDelta(ax, bx, WORLD_WIDTH, wrap), dy: shortestDelta(ay, by, WORLD_HEIGHT, wrap) };
}
