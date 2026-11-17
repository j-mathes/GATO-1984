import { DAMAGE, damageCount, damageIndexSum } from "../../core/index.js";
import { COCKPIT_WIDTH, decodePacked, type CockpitLayouts } from "../cockpitLayouts.js";
import type { Gfx } from "../gfx.js";
import { filledSilhouette, overlayRegion } from "../hull.js";
import type { PlayView } from "../playScreens.js";
import { mix, rgba } from "./colors.js";
import { bezelBox, drawMetal, lamp, panelContext } from "./panel.js";
import { upscaleMask } from "./shipArt.js";
import { drawText } from "./typography.js";

/**
 * The damage report in the enhanced graphics: the boat in side view, filled and shaded from the outline the original draws, sitting in the
 * water with each of the eight compartments marked at its original place: a green wash while sound, a red one pulsing with its lamp's beat
 * when damaged. Below it the original's eight lamps with the compartment names, and two gauges for how near the boat is to being lost.
 */
const U = 4;
const PICTURE_ROWS = 100;
const W = COCKPIT_WIDTH;

/** Each compartment's lamp (x, y in the 320 x 200 picture; the rows are the original's, the right column is moved out to use the wider panel) and its name. */
export const COMPARTMENT_LAMPS: readonly { id: number; x: number; y: number; name: string }[] = [
  { id: 7, x: 20, y: 122, name: "CONTROL ROOM" },
  { id: 5, x: 20, y: 138, name: "ENGINE ROOM" },
  { id: 3, x: 20, y: 154, name: "BATTERY ROOM" },
  { id: 2, x: 20, y: 170, name: "TORPEDO ROOM" },
  { id: 8, x: 168, y: 122, name: "CONNING TOWER" },
  { id: 6, x: 168, y: 138, name: "PERISCOPES" },
  { id: 4, x: 168, y: 154, name: "FUEL TANKS" },
  { id: 1, x: 168, y: 170, name: "RADIO ROOM" },
];

interface Art {
  hull: HTMLCanvasElement;
  /** The hull's drawn lines (deck, tower, hatches) as a light picture over it. */
  lines: HTMLCanvasElement;
  regions: Map<number, HTMLCanvasElement>;
}

/** The wire (antenna) the original draws from the bow mast up to the conning tower: a sloped line over the deck, x 31-120, y 31-39. */
const WIRE = { x0: 31, x1: 120, y0: 31, y1: 39 };

/** The original's outline of the boat (rows 0-99 of the picture) as a 0/1 mask. */
function outlineOf(L: CockpitLayouts): Uint8Array {
  const index = decodePacked(L.screen("damage_report").staticPacked);
  const outline = new Uint8Array(W * PICTURE_ROWS);
  for (let i = 0; i < outline.length; i += 1) outline[i] = index[i] !== 0 ? 1 : 0;
  return outline;
}

/** The solid hull: what the outline encloses, without the wire, which is a line in the air and not a wall (the space under it stays sky). */
export function damageHullMask(L: CockpitLayouts): Uint8Array {
  const outline = outlineOf(L);
  for (let y = WIRE.y0; y <= WIRE.y1; y += 1) for (let x = WIRE.x0; x <= WIRE.x1; x += 1) outline[y * W + x] = 0;
  return filledSilhouette(outline, W, PICTURE_ROWS, 1);
}

/** The pictures made from the original's layout, once: the hull, its lines and the eight compartment regions, each 4 times the original. */
function buildArt(L: CockpitLayouts): Art | null {
  if (typeof document === "undefined") return null;
  const screen = L.screen("damage_report");
  const outline = outlineOf(L);
  const hullMask = damageHullMask(L);
  const hull = upscaleMask(hullMask, W, PICTURE_ROWS, U * 0.9);
  const lines = upscaleMask(outline, W, PICTURE_ROWS);
  const overlays = screen.dynamic.overlays as Record<string, { pixels: [number, number][] }>;
  const regions = new Map<number, HTMLCanvasElement>();
  for (const [k, o] of Object.entries(overlays)) regions.set(Number(k), upscaleMask(overlayRegion(o.pixels, hullMask, W, PICTURE_ROWS), W, PICTURE_ROWS, U * 0.9));
  return { hull, lines, regions };
}

const cache = new WeakMap<CockpitLayouts, Art | null>();

function artFor(L: CockpitLayouts): Art | null {
  if (!cache.has(L)) cache.set(L, buildArt(L));
  return cache.get(L) ?? null;
}

/** `src` filled with a colour or gradient (keeping its shape), as a new canvas. */
function tinted(src: HTMLCanvasElement, fill: (c: CanvasRenderingContext2D, w: number, h: number) => CanvasGradient | string): HTMLCanvasElement {
  const out = document.createElement("canvas");
  out.width = src.width;
  out.height = src.height;
  const c = out.getContext("2d");
  if (!c) return out;
  c.drawImage(src, 0, 0);
  c.globalCompositeOperation = "source-in";
  c.fillStyle = fill(c, out.width, out.height);
  c.fillRect(0, 0, out.width, out.height);
  return out;
}

/** The edge of a shape: the shape minus itself pulled in by `width` pixels. */
function edgeOf(src: HTMLCanvasElement, width: number): HTMLCanvasElement {
  const out = document.createElement("canvas");
  out.width = src.width;
  out.height = src.height;
  const c = out.getContext("2d");
  if (!c) return out;
  c.drawImage(src, 0, 0);
  c.globalCompositeOperation = "destination-out";
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]] as const) c.drawImage(src, dx * width, dy * width);
  return out;
}

const tintCache = new WeakMap<HTMLCanvasElement, Map<string, HTMLCanvasElement>>();

/** A cached coloured version of one of the pictures (`key` names the colour). */
function colored(src: HTMLCanvasElement, key: string, make: () => HTMLCanvasElement): HTMLCanvasElement {
  let m = tintCache.get(src);
  if (!m) tintCache.set(src, (m = new Map()));
  let r = m.get(key);
  if (!r) m.set(key, (r = make()));
  return r;
}

function drawBoat(g: Gfx, xo: number, art: Art, damaged: ReadonlySet<number>, timeMs: number, night: boolean): void {
  const c = g.ctx;
  const x = g.toX(xo);
  const w = g.toLength(W * U);
  const h = g.toLength(PICTURE_ROWS * U);
  // sea, sky and veil run out to both edges of a wide view; the boat stays where the original's picture is
  const left = g.toX(0);
  const full = g.toLength(W * U + 2 * xo);
  const y0 = g.toY(0);
  const waterY = 62 * U;
  // the sea and the sky of the picture
  const sky = c.createLinearGradient(0, y0, 0, g.toY(waterY));
  sky.addColorStop(0, night ? "#060b14" : "#16324f");
  sky.addColorStop(1, night ? "#16233a" : "#3a6d93");
  c.fillStyle = sky;
  c.fillRect(left, y0, full, g.toLength(waterY));
  const sea = c.createLinearGradient(0, g.toY(waterY), 0, y0 + h);
  sea.addColorStop(0, night ? "#0d2234" : "#2a7893");
  sea.addColorStop(1, night ? "#040c14" : "#0a2f45");
  c.fillStyle = sea;
  c.fillRect(left, g.toY(waterY), full, y0 + h - g.toY(waterY));
  // a faint grid, like a drawing board
  c.strokeStyle = "rgba(180,220,235,0.07)";
  c.lineWidth = g.toLength(1);
  c.beginPath();
  for (let gx = -Math.ceil(xo / 80) * 80; gx <= W * U + xo; gx += 80) {
    c.moveTo(g.toX(xo + gx), y0);
    c.lineTo(g.toX(xo + gx), y0 + h);
  }
  c.stroke();

  g.smooth(true);
  const hullFill = colored(art.hull, night ? "n" : "d", () =>
    tinted(art.hull, (cx, cw, ch) => {
      const gr = cx.createLinearGradient(0, 0, 0, ch);
      gr.addColorStop(0, night ? "#6f7b86" : "#a9b4bc");
      gr.addColorStop(0.45, night ? "#46515a" : "#6f7c86");
      gr.addColorStop(1, night ? "#1f272d" : "#323c43");
      return gr;
    }),
  );
  // soft shadow under the boat on the water, then the hull
  c.save();
  c.shadowColor = "rgba(0,0,0,0.5)";
  c.shadowBlur = g.toLength(10);
  c.shadowOffsetY = g.toLength(5);
  c.drawImage(hullFill, x, y0, w, h);
  c.restore();
  // the part below the waterline, under a veil of water (drawn before the compartments, so their colours stay solid below it)
  c.save();
  c.beginPath();
  c.rect(left, g.toY(waterY), full, y0 + h - g.toY(waterY));
  c.clip();
  const veil = c.createLinearGradient(0, g.toY(waterY), 0, y0 + h);
  veil.addColorStop(0, rgba(night ? "#0d2234" : "#2a7893", 0.55));
  veil.addColorStop(1, rgba(night ? "#040c14" : "#0a2f45", 0.8));
  c.fillStyle = veil;
  c.fillRect(left, g.toY(waterY), full, y0 + h - g.toY(waterY));
  c.restore();
  // the compartments
  for (const [id, region] of art.regions) {
    const bad = damaged.has(id);
    const pulse = 0.5 + 0.5 * Math.sin(timeMs / 220 + id); // the same beat as the compartment's lamp
    const fill = colored(region, bad ? "bad" : "ok", () => tinted(region, () => (bad ? "#e5231b" : "#44d36c")));
    c.globalAlpha = bad ? 0.35 + 0.65 * pulse : 0.5;
    c.drawImage(fill, x, y0, w, h);
    c.globalAlpha = 1;
    const edge = colored(region, bad ? "badEdge" : "okEdge", () => tinted(edgeOf(region, 1.6), () => (bad ? "#ff9d94" : "#9fe8b4")));
    c.globalAlpha = bad ? 0.5 + 0.5 * pulse : 0.7;
    c.drawImage(edge, x, y0, w, h);
    c.globalAlpha = 1;
  }
  // the drawn lines of the original (deck, tower, hatches), lightly
  const lines = colored(art.lines, "l", () => tinted(art.lines, () => (night ? "#cfe0f0" : "#eef6fb")));
  c.globalAlpha = 0.5;
  c.drawImage(lines, x, y0, w, h);
  c.globalAlpha = 1;
  // light on the waterline
  g.line(0, waterY, W * U + 2 * xo, waterY, rgba("#dff4fa", night ? 0.3 : 0.6), 1.5);
  g.smooth(false);
}

/** The eight lamps with their names and state, in the original's places. */
function drawLamps(g: Gfx, xo: number, damaged: ReadonlySet<number>, night: boolean, timeMs: number): void {
  const c = panelContext(g, xo, night);
  const p = c.p;
  for (const l of COMPARTMENT_LAMPS) {
    const bad = damaged.has(l.id);
    const pulse = 0.7 + 0.3 * Math.sin(timeMs / 220 + l.id);
    lamp(c, l.x + 2, l.y, 6, bad ? mix(p.bad, "#000000", 1 - pulse) : mix(p.ok, "#000000", 0.35));
    drawText(g, xo + (l.x + 12) * U, l.y * U + 2, l.name, bad ? p.value : p.label, 27, { role: "title" });
    drawText(g, xo + (l.x + 128) * U, l.y * U + 2, bad ? "DAMAGED" : "OK", bad ? p.bad : p.ok, 25, { role: "body", bold: true, align: "right" });
  }
}

/** How near the boat is to being lost: the damaged compartments of the 5 it can lose, and the index sum against the alarm and the loss. */
function drawSeverity(g: Gfx, xo: number, view: PlayView, night: boolean): void {
  const c = panelContext(g, xo, night);
  const p = c.p;
  const sub = view.sim.sub;
  const count = damageCount(sub);
  const sum = damageIndexSum(sub);
  const y = 184 * U;
  drawText(g, xo + 16 * U, y - 4, "DAMAGED", p.label, 24, { role: "title" });
  for (let i = 0; i <= DAMAGE.maxCompartments; i += 1) {
    const x = xo + 46 * U + i * 13 * U;
    const lit = i < count;
    const last = i === DAMAGE.maxCompartments;
    g.rect(x, y - 22, 11 * U, 38, lit ? (last ? p.bad : count >= DAMAGE.maxCompartments ? p.warn : p.warn) : p.glass);
    g.rect(x, y - 22, 11 * U, 38, p.brass, false);
    drawText(g, x + 5.5 * U, y - 3, last ? "LOST" : String(i + 1), lit ? "#190b04" : p.markDim, last ? 16 : 22, { role: "body", bold: true, align: "center" });
  }
  // the index sum: a bar to 21 with the alarm (above 14) and the loss (above 20)
  const bx = xo + 172 * U;
  const bw = 110 * U;
  drawText(g, bx - 6 * U, y - 4, "INDEX", p.label, 24, { role: "title", align: "right" });
  g.rect(bx, y - 14, bw, 24, p.glass);
  const frac = Math.min(sum / 21, 1);
  const col = sum > DAMAGE.lostIndexSum ? p.bad : sum > DAMAGE.alarmIndexSum ? p.warn : p.ok;
  g.rect(bx + 2, y - 12, (bw - 4) * frac, 20, col);
  for (const [mark, name] of [[DAMAGE.alarmIndexSum, "ALARM"], [DAMAGE.lostIndexSum, "LOST"]] as const) {
    const mx = bx + (bw * (mark + 1)) / 21;
    g.line(mx, y - 20, mx, y + 14, p.mark, 1.6);
    drawText(g, mx, y + 28, name, p.markDim, 18, { role: "body", align: "center" });
  }
  g.rect(bx, y - 14, bw, 24, p.brass, false);
  drawText(g, bx + bw + 8 * U, y - 3, String(sum), p.value, 30, { role: "body", bold: true });
}

/** The damage report scene: `xo` is where the 1280 x 800 picture starts in the view; the original's static picture is never drawn. */
export function drawEnhancedDamage(g: Gfx, view: PlayView, L: CockpitLayouts, xo: number): void {
  const night = view.settings.timeOfDay === 0;
  const art = artFor(L);
  const damaged = new Set<number>();
  view.sim.sub.damage.forEach((d, i) => {
    if (i >= 1 && i <= 8 && d > 0) damaged.add(i);
  });
  const c = panelContext(g, xo, night);
  drawMetal(c, PICTURE_ROWS, 200 - PICTURE_ROWS);
  if (art) drawBoat(g, xo, art, damaged, view.timeMs, night);
  g.rect(0, 0, W * U + 2 * xo, PICTURE_ROWS * U, c.p.brass, false);
  bezelBox(c, 2, 102, 317, 197, null);
  drawText(g, xo + 160 * U, 109 * U, "DAMAGE REPORT", c.p.label, 36, { role: "title", align: "center" });
  drawLamps(g, xo, damaged, night, view.timeMs);
  drawSeverity(g, xo, view, night);
}
