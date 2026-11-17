import { drawSegments, type SinkingAnimation } from "../../core/index.js";
import type { Gfx } from "../gfx.js";
import { rgba } from "./colors.js";

/** The lost boat in the enhanced graphics: the original's cracks as glass lines and its rising water as a real sea. Times and geometry are the original's. */
const SCALE = 4;

/** Seconds the screen takes to go dark when the air runs out (the original has no animation there). */
export const OXYGEN_FADE_SECONDS = 3;

function crackLines(g: Gfx, sinking: SinkingAnimation, xo: number): void {
  const c = g.ctx;
  c.lineCap = "round";
  c.lineJoin = "round";
  for (const crack of sinking.drawnCracks) {
    const segments = drawSegments(crack.x, crack.y, crack.draw);
    // a dark edge under a bright line with a soft glow: cracked glass
    for (const [offset, color, width, glow] of [
      [1.6, "rgba(10,20,34,0.55)", 3.4, 0],
      [0, "rgba(235,246,255,0.96)", 2.2, 6],
    ] as const) {
      c.strokeStyle = color;
      c.lineWidth = g.toLength(width);
      c.shadowColor = glow ? "rgba(170,210,255,0.9)" : "rgba(0,0,0,0)";
      c.shadowBlur = g.toLength(glow);
      c.beginPath();
      for (const s of segments) {
        c.moveTo(g.toX(xo + s.x0 * SCALE + offset), g.toY(s.y0 * SCALE + offset));
        c.lineTo(g.toX(xo + s.x1 * SCALE + offset), g.toY(s.y1 * SCALE + offset));
      }
      c.stroke();
    }
    c.shadowBlur = 0;
    c.shadowColor = "rgba(0,0,0,0)";
  }
}

function water(g: Gfx, sinking: SinkingAnimation, width: number, height: number, timeMs: number): void {
  const c = g.ctx;
  const top = height * (1 - sinking.progress);
  if (top >= height) return;
  const surface = (x: number): number => top + Math.sin(x / 55 + timeMs / 380) * 4 + Math.sin(x / 23 - timeMs / 250) * 2;
  const path = (): void => {
    c.beginPath();
    c.moveTo(g.toX(0), g.toY(height));
    for (let x = 0; x <= width; x += 16) c.lineTo(g.toX(x), g.toY(Math.max(surface(x), 0)));
    c.lineTo(g.toX(width), g.toY(height));
    c.closePath();
  };
  const body = c.createLinearGradient(0, g.toY(top), 0, g.toY(height));
  body.addColorStop(0, rgba("#3fa7a8", 0.88));
  body.addColorStop(0.25, rgba("#1b6f86", 0.94));
  body.addColorStop(1, rgba("#041f2c", 0.98));
  path();
  c.fillStyle = body;
  c.fill();
  // foam along the surface and a few drifting bubbles
  c.save();
  path();
  c.clip();
  c.strokeStyle = "rgba(240,252,255,0.85)";
  c.lineWidth = g.toLength(7);
  c.beginPath();
  for (let x = 0; x <= width; x += 16) {
    const y = Math.max(surface(x), 0) + 3;
    if (x === 0) c.moveTo(g.toX(x), g.toY(y));
    else c.lineTo(g.toX(x), g.toY(y));
  }
  c.stroke();
  c.fillStyle = "rgba(220,245,250,0.35)";
  for (let i = 0; i < 40; i += 1) {
    const seed = Math.sin(i * 91.7) * 43758.5;
    const f = seed - Math.floor(seed);
    const bx = f * width;
    const rise = (i * 37 + timeMs / (10 + (i % 5) * 3)) % Math.max(height - top, 1);
    c.beginPath();
    c.arc(g.toX(bx), g.toY(height - rise), g.toLength(1.5 + (i % 3)), 0, Math.PI * 2);
    c.fill();
  }
  c.restore();
}

/** Cracks over the picture, then the water rising over everything; `xo` is where the 1280 x 800 picture starts in the view. */
export function drawEnhancedSinking(g: Gfx, sinking: SinkingAnimation, width: number, height: number, timeMs: number): void {
  g.view(width, height);
  const xo = (width - 320 * SCALE) / 2;
  if (sinking.variant === "cracks") crackLines(g, sinking, xo);
  water(g, sinking, width, height, timeMs);
}

/** The screen goes dark: `elapsed` seconds into the fade of {@link OXYGEN_FADE_SECONDS}. */
export function drawOxygenFade(g: Gfx, elapsed: number): void {
  const a = Math.min(Math.max(elapsed / OXYGEN_FADE_SECONDS, 0), 1);
  g.fillBacking(`rgba(0,0,0,${a.toFixed(3)})`);
}
