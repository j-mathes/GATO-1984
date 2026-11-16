import type { Explosion, ExplosionColor, ExplosionShape } from "../core/index.js";
import { explosionShapes } from "../core/index.js";
import { COLORS, Gfx } from "./gfx.js";

/** y of the waterline in the scope picture (the original's horizon moves with depth, ds:0x2152 = 79 - 4 * depth). */
export const SCOPE_HORIZON_Y = 64;

/**
 * Colour numbers of the original's DRAW/BOX calls: 2 = flame, 3 = white, 0 = background, sky = ds:0x21ca (0 night, 1 day).
 * With a screen palette (pixel values 0..3 of the extracted layouts) the colours are looked up in it, otherwise palette 0 constants are used.
 */
export function explosionColor(color: ExplosionColor, day: boolean, palette?: readonly string[]): string {
  if (palette) {
    switch (color) {
      case "flame":
      case "horizon":
        return palette[2] as string;
      case "white":
        return palette[3] as string;
      case "sky":
        return (day ? palette[1] : palette[0]) as string;
      default:
        return palette[0] as string;
    }
  }
  switch (color) {
    case "flame":
    case "horizon":
      return COLORS.red;
    case "white":
      return COLORS.white;
    case "sky":
      return day ? COLORS.cyan : COLORS.black;
    default:
      return COLORS.black;
  }
}

export function drawExplosionShapes(g: Gfx, shapes: readonly ExplosionShape[], day: boolean, palette?: readonly string[]): void {
  for (const s of shapes) {
    const color = explosionColor(s.color, day, palette);
    if (s.kind === "rect") {
      const x0 = Math.round(Math.min(s.x0, s.x1));
      const y0 = Math.round(Math.min(s.y0, s.y1));
      g.rect(x0, y0, Math.max(1, Math.round(Math.abs(s.x1 - s.x0))), Math.max(1, Math.round(Math.abs(s.y1 - s.y0))), color);
    } else if (s.kind === "line") g.line(Math.round(s.x0), Math.round(s.y0), Math.round(s.x1), Math.round(s.y1), color);
    else g.rect(Math.round(s.x), Math.round(s.y), 1, 1, color);
  }
}

export function drawExplosion(g: Gfx, ex: Explosion, day: boolean, horizon: number = SCOPE_HORIZON_Y, palette?: readonly string[]): void {
  drawExplosionShapes(g, explosionShapes(ex, horizon), day, palette);
}
