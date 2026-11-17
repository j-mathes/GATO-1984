import { COMPARTMENT, SCOPE_OFFSET, SLOT, scopeScreenX, scopeUsable, inScopeWindow } from "../../core/index.js";
import { scopeHorizon } from "../cockpitScreens.js";
import { drawExplosion } from "../explosions.js";
import type { Gfx } from "../gfx.js";
import { liveContacts, type LiveContact, type PlayView } from "../playScreens.js";
import { SCOPE, darken, mix, rgba } from "./colors.js";
import type { ShipArt, ShadedImage } from "./shipArt.js";
import { drawText } from "./typography.js";

/** The scope window of the control room in the enhanced space: 1280 x 392 (the original's 320 x 98, times 4), at x = `x`. */
export interface ScopeArea {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Units of the enhanced space per pixel of the original picture. */
export const ENHANCED_FACTOR = 4;

const STAR_COUNT = 110;

/** Fixed star positions (fractions of the sky) and brightness, from a small deterministic generator, so the sky does not shuffle. */
export function starField(count = STAR_COUNT): { x: number; y: number; size: number; phase: number }[] {
  let s = 20250117;
  const next = (): number => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
  return Array.from({ length: count }, () => ({ x: next(), y: Math.pow(next(), 1.4), size: 0.6 + next() * 1.4, phase: next() * 6.28 }));
}

const STARS = starField();

function skyAndSea(g: Gfx, a: ScopeArea, hy: number, day: boolean, timeMs: number): void {
  const c = g.ctx;
  const pal = day ? SCOPE.day : SCOPE.night;
  const x = g.toX(a.x);
  const w = g.toLength(a.w);
  if (hy > a.y) {
    const sky = c.createLinearGradient(0, g.toY(a.y), 0, g.toY(hy));
    sky.addColorStop(0, pal.skyTop);
    sky.addColorStop(0.55, pal.skyMid);
    sky.addColorStop(1, pal.skyHorizon);
    c.fillStyle = sky;
    c.fillRect(x, g.toY(a.y), w, g.toLength(hy - a.y));
    if (!day) {
      for (const s of STARS) {
        const sy = a.y + s.y * (hy - a.y) * 0.9;
        const twinkle = 0.55 + 0.45 * Math.sin(timeMs / 900 + s.phase);
        c.fillStyle = rgba("#ffffff", 0.25 + 0.65 * twinkle * (1 - s.y * 0.6));
        c.beginPath();
        c.arc(g.toX(a.x + s.x * a.w), g.toY(sy), g.toLength(s.size), 0, Math.PI * 2);
        c.fill();
      }
    }
  }
  const sea = c.createLinearGradient(0, g.toY(hy), 0, g.toY(a.y + a.h));
  sea.addColorStop(0, pal.seaHorizon);
  sea.addColorStop(0.35, pal.seaNear);
  sea.addColorStop(1, pal.seaDeep);
  c.fillStyle = sea;
  c.fillRect(x, g.toY(hy), w, g.toLength(a.y + a.h - hy));
  // swell: short light strokes, spaced further apart and longer towards the viewer, drifting slowly
  const rows = 14;
  const depth = a.y + a.h - hy;
  for (let i = 1; i <= rows; i += 1) {
    const t = Math.pow(i / rows, 1.7);
    const y = hy + depth * t;
    const len = 18 + 90 * t;
    const count = 5 + Math.round(10 * t);
    for (let j = 0; j < count; j += 1) {
      const seed = Math.sin(i * 12.9898 + j * 78.233) * 43758.5453;
      const frac = seed - Math.floor(seed);
      const drift = ((timeMs / (1800 + i * 90)) % 1) * len;
      const px = a.x + ((frac * a.w + drift * (i % 2 === 0 ? 1 : -1)) % a.w + a.w) % a.w;
      c.strokeStyle = rgba(pal.wave, (day ? 0.1 : 0.07) + 0.12 * t);
      c.lineWidth = g.toLength(0.8 + 1.6 * t);
      c.beginPath();
      c.moveTo(g.toX(px), g.toY(y));
      c.lineTo(g.toX(Math.min(px + len, a.x + a.w)), g.toY(y));
      c.stroke();
    }
  }
  // haze over the horizon
  const haze = c.createLinearGradient(0, g.toY(hy - 26), 0, g.toY(hy + 20));
  haze.addColorStop(0, rgba(pal.haze, 0));
  haze.addColorStop(0.55, rgba(pal.haze, day ? 0.5 : 0.35));
  haze.addColorStop(1, rgba(pal.haze, 0));
  c.fillStyle = haze;
  c.fillRect(x, g.toY(hy - 26), w, g.toLength(46));
}

function drawShaded(g: Gfx, img: ShadedImage, x: number, baseY: number, scale: number, alpha: number, a: ScopeArea, day: boolean, small: number): void {
  const c = g.ctx;
  const s = scale / img.density;
  const w = img.canvas.width * s;
  const h = img.canvas.height * s;
  const left = x - img.originX * s;
  const top = baseY - img.originY * s;
  g.smooth(true);
  // reflection in the water: the picture flipped about the horizon, half as tall, faint
  c.save();
  c.beginPath();
  c.rect(g.toX(a.x), g.toY(baseY), g.toLength(a.w), g.toLength(a.y + a.h - baseY));
  c.clip();
  c.globalAlpha = 0.22 * alpha;
  c.translate(g.toX(left), g.toY(baseY));
  c.scale(1, -0.5);
  c.drawImage(img.canvas, 0, -g.toLength(img.originY * s), g.toLength(w), g.toLength(h));
  c.restore();
  c.globalAlpha = alpha;
  // an edge that sets the ship off from the sky: dark by day, pale by night; stronger the smaller (further) the ship is
  c.shadowColor = day ? `rgba(2,10,20,${0.7 + 0.25 * small})` : `rgba(200,220,250,${0.45 + 0.3 * small})`;
  c.shadowBlur = g.toLength(2.5 + 3 * small);
  c.drawImage(img.canvas, g.toX(left), g.toY(top), g.toLength(w), g.toLength(h));
  c.shadowColor = "rgba(0,0,0,0)";
  c.shadowBlur = 0;
  c.globalAlpha = 1;
  g.smooth(false);
}

/** Enhanced units per pixel of the original sprite, from the original's apparent size; ships never get smaller than `minimum` so far ones stay visible. */
function contactScale(size: number, minimum = 0.4): number {
  return Math.max(size, minimum);
}

/** 0 for a ship at its natural size or bigger, up to 1 for one drawn at the minimum size. */
function smallness(size: number): number {
  return Math.min(Math.max(1 - (size - 1.1) / 2.4, 0), 1);
}

function drawContactEnhanced(g: Gfx, v: PlayView, art: ShipArt | null, c: LiveContact, x: number, baseY: number, day: boolean, a: ScopeArea): void {
  const alpha = 1 - 0.2 * Math.min(c.distance / 4000, 1); // distant ships fade a little into the haze
  const scale = contactScale(c.size, SHIP_MINIMUM);
  const img = art?.ship(c.typeCode, c.frame, !day);
  if (img) drawShaded(g, img, x, baseY, scale, alpha, a, day, smallness(c.size));
  else {
    g.rect(x - 16, baseY - 16, 32, 16, day ? "#222a30" : "#9fb2c6");
  }
}

const SHIP_MINIMUM = 1.1;

/**
 * The scope picture of the control room at full resolution: a graded sky (stars at night), a swell, ships coloured by role with shading
 * and a reflection, the island, and the original's torpedo explosions drawn over them. `area` is the window in the enhanced space.
 */
export function drawEnhancedScope(g: Gfx, v: PlayView, art: ShipArt | null, area: ScopeArea, explosionPalette: readonly string[]): void {
  const sub = v.sim.sub;
  const day = v.settings.timeOfDay === 1;
  const c = g.ctx;
  if (!scopeUsable(sub)) {
    g.rect(area.x, area.y, area.w, area.h, "#05090c");
    g.rect(area.x + 3, area.y + 3, area.w - 6, area.h - 6, "#3a4650", false);
    const damaged = sub.periscopeUp && (sub.damage[COMPARTMENT.periscopes] ?? 0) !== 0;
    drawText(g, area.x + area.w / 2, area.y + area.h / 2, damaged ? "PERISCOPE DAMAGED" : "NO VIEW - PERISCOPE DOWN", "#8a97a2", 40, { role: "title", align: "center" });
    return;
  }
  const horizon = scopeHorizon(sub);
  const hy = horizon >= 0 ? area.y + (horizon + 1) * ENHANCED_FACTOR : area.y;
  g.clip(area.x, area.y, area.w, area.h);
  skyAndSea(g, area, hy, day, v.timeMs);
  const sim = v.sim;
  const contacts = liveContacts(v)
    .filter((k) => k.size >= 0.5 && k.distance <= 4000 && inScopeWindow(k.relative, sub.scopeFacing))
    .sort((p, q) => q.distance - p.distance);
  for (const k of contacts) {
    const vessel = sim.vessels[k.slot];
    if (!vessel || vessel.sunk) continue;
    let angle = k.relative - SCOPE_OFFSET[sub.scopeFacing];
    while (angle < 0) angle += 6.2832;
    const x = area.x + scopeScreenX(angle, k.size, k.frame, sub.scopeFacing) * ENHANCED_FACTOR;
    if (k.slot === SLOT.island) {
      const shape = sim.scenario.islands[sim.currentQuadrant]?.shape ?? 1;
      const pic = art?.island(shape, !day);
      if (pic) drawShaded(g, pic, x, hy, contactScale(k.size), 1 - 0.3 * Math.min(k.distance / 4000, 1), area, day, 0);
    } else drawContactEnhanced(g, v, art, k, x, hy, day, area);
  }
  // the sunk ship stays drawn until its spikes are erased, then the original's explosion drawing, in its own 320 x 200 view (it lines up
  // with the window: both are centred in the canvas)
  if (sim.explosions.length > 0) {
    for (const ex of sim.explosions) {
      if (ex.shipVisible && !ex.plan.survived) {
        const ghost: LiveContact = { slot: 0, typeCode: ex.plan.typeCode, distance: 0, relative: 0, size: ex.plan.drawnSize, frame: ex.plan.frame, x: 0, y: 0 };
        drawContactEnhanced(g, v, art, ghost, area.x + ex.plan.x * ENHANCED_FACTOR, hy, day, area);
      }
    }
    const [vw, vh] = [g.viewWidth, g.viewHeight];
    g.view(320, 200);
    g.clip(0, 0, 320, 98);
    for (const ex of sim.explosions) drawExplosion(g, ex, day, horizon, explosionPalette);
    g.unclip();
    g.view(vw, vh);
  }
  g.unclip();
  // seen through water: the picture turns green-blue with depth (the scope works down to depth 45)
  if (sub.depth > 0) {
    c.fillStyle = `rgba(10,72,84,${(Math.min(sub.depth / 45, 1) * 0.2).toFixed(3)})`;
    c.fillRect(g.toX(area.x), g.toY(area.y), g.toLength(area.w), g.toLength(area.h));
  }
  drawLens(g, area);
  // a little glass: a dark rim and a thin bright edge, so the window reads as a lens
  const rim = c.createLinearGradient(0, g.toY(area.y), 0, g.toY(area.y + area.h));
  rim.addColorStop(0, "rgba(0,0,0,0.35)");
  rim.addColorStop(0.08, "rgba(0,0,0,0)");
  rim.addColorStop(0.92, "rgba(0,0,0,0)");
  rim.addColorStop(1, "rgba(0,0,0,0.45)");
  c.fillStyle = rim;
  c.fillRect(g.toX(area.x), g.toY(area.y), g.toLength(area.w), g.toLength(area.h));
  g.rect(area.x, area.y, area.w, area.h, darken(mix(SCOPE.day.seaNear, "#888888", 0.5), 0.2), false);
}

/** The periscope's lens: the corners fall off into shadow, with a fine crosshair and range ticks in the middle. */
function drawLens(g: Gfx, area: ScopeArea): void {
  const c = g.ctx;
  const cx = area.x + area.w / 2;
  const cy = area.y + area.h / 2;
  c.save();
  c.beginPath();
  c.rect(g.toX(area.x), g.toY(area.y), g.toLength(area.w), g.toLength(area.h));
  c.clip();
  // an elliptical vignette: a circular gradient squeezed to the shape of the window
  c.translate(g.toX(cx), g.toY(cy));
  c.scale(area.w / area.h, 1);
  const r = g.toLength(area.h) * 0.78;
  const vignette = c.createRadialGradient(0, 0, r * 0.55, 0, 0, r);
  vignette.addColorStop(0, "rgba(0,0,0,0)");
  vignette.addColorStop(1, "rgba(0,0,0,0.55)");
  c.fillStyle = vignette;
  c.fillRect(-g.toLength(area.w), -g.toLength(area.h), g.toLength(area.w) * 2, g.toLength(area.h) * 2);
  c.restore();
  // crosshair with a gap at the centre, and ticks every 40 units along it
  const gap = 10;
  const arm = 70;
  const color = "rgba(255,255,255,0.4)";
  g.line(cx - arm, cy, cx - gap, cy, color, 1);
  g.line(cx + gap, cy, cx + arm, cy, color, 1);
  g.line(cx, cy - arm * 0.6, cx, cy - gap, color, 1);
  g.line(cx, cy + gap, cx, cy + arm * 0.6, color, 1);
  for (let i = 1; i <= 3; i += 1) {
    g.line(cx - gap - i * 14, cy - 4, cx - gap - i * 14, cy + 4, color, 1);
    g.line(cx + gap + i * 14, cy - 4, cx + gap + i * 14, cy + 4, color, 1);
  }
}
