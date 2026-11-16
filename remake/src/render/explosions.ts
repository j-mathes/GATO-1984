import type { Explosion, ExplosionColor, ExplosionShape } from "../core/index.js";
import { explosionShapes } from "../core/index.js";
import { COLORS, Gfx } from "./gfx.js";

/** y of the waterline in the scope picture (the original's horizon moves with depth, ds:0x2152 = 79 - 4 * depth). */
export const SCOPE_HORIZON_Y = 64;

/** Colour numbers of the original's DRAW/BOX calls: 2 = flame (red in palette 0), 3 = white, 0 = black, sky = ds:0x21ca (0 night, 1 day). */
export function explosionColor(color: ExplosionColor, day: boolean): string {
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

export function drawExplosionShapes(g: Gfx, shapes: readonly ExplosionShape[], day: boolean): void {
  for (const s of shapes) {
    const color = explosionColor(s.color, day);
    if (s.kind === "rect") {
      const x0 = Math.round(Math.min(s.x0, s.x1));
      const y0 = Math.round(Math.min(s.y0, s.y1));
      g.rect(x0, y0, Math.max(1, Math.round(Math.abs(s.x1 - s.x0))), Math.max(1, Math.round(Math.abs(s.y1 - s.y0))), color);
    } else if (s.kind === "line") g.line(Math.round(s.x0), Math.round(s.y0), Math.round(s.x1), Math.round(s.y1), color);
    else g.rect(Math.round(s.x), Math.round(s.y), 1, 1, color);
  }
}

export function drawExplosion(g: Gfx, ex: Explosion, day: boolean): void {
  drawExplosionShapes(g, explosionShapes(ex, SCOPE_HORIZON_Y), day);
}
