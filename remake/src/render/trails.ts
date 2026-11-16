import { LOGICAL_HEIGHT, LOGICAL_WIDTH, Gfx } from "./gfx.js";

/**
 * Persistent track dots of the radar, chart and quadrant map. The original PSETs the positions of the boat and the ships and never erases
 * them while the screen is shown, so tracks build up (the screenshots show them); the remake can draw clean frames instead (key W).
 * Positions are recorded as palette indices of the screen and cleared whenever the screen is entered again.
 */
export class TrailBuffer {
  private readonly pixels = new Map<number, number>();
  /** Set by the app once per simulation step; dots are only remembered while it is true (the original plots once per pass of its loop). */
  recording = false;

  constructor(private readonly limit = 40000) {}

  get size(): number {
    return this.pixels.size;
  }

  clear(): void {
    this.pixels.clear();
  }

  /** Remember a w x h dot of palette index `index` with its top-left pixel at (x, y). */
  mark(x: number, y: number, w: number, h: number, index: number): void {
    if (!this.recording) return;
    for (let dy = 0; dy < h; dy += 1) {
      for (let dx = 0; dx < w; dx += 1) {
        const px = x + dx;
        const py = y + dy;
        if (px < 0 || py < 0 || px >= LOGICAL_WIDTH || py >= LOGICAL_HEIGHT) continue;
        if (this.pixels.size >= this.limit) return;
        this.pixels.set(py * LOGICAL_WIDTH + px, index);
      }
    }
  }

  draw(g: Gfx, palette: readonly string[]): void {
    for (const [key, index] of this.pixels) g.rect(key % LOGICAL_WIDTH, Math.floor(key / LOGICAL_WIDTH), 1, 1, palette[index] as string);
  }
}

export type TrailScreen = "radar" | "chart" | "quadrant";
export const TRAIL_SCREENS: readonly TrailScreen[] = ["radar", "chart", "quadrant"];

export function createTrails(): Record<TrailScreen, TrailBuffer> {
  return { radar: new TrailBuffer(), chart: new TrailBuffer(), quadrant: new TrailBuffer() };
}
