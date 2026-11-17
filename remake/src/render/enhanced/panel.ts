import { COMPARTMENT, ENGINE, START } from "../../core/index.js";
import type { Gfx } from "../gfx.js";
import type { PlayView } from "../playScreens.js";
import { PANEL, levelColor, mix, rgba, type PanelColors } from "./colors.js";
import { drawText } from "./typography.js";

/**
 * The control room instrument panel in the enhanced graphics. Every part is placed from the coordinates of the original screen (GATO1
 * 0x042a8-0x05077, see analysis/gato1_screens.md section 1), times 4: the three dials with their needles, the FUEL and BATT boxes, the lights,
 * the oxygen gauge, the torpedo tubes, the engine mode and the scope arrow. What is new is how they look: brushed gunmetal, brass bezels,
 * dial zones, level bars, lamps that glow, and a dim red light at night.
 */
const U = 4;

/** Depth, in dial units, from which the boat can be crushed (the crush chance starts above 350). */
const CRUSH_DEPTH = 350;
/** Periscope depth: the scope works at 45 or less. */
const SCOPE_DEPTH = 45;
/** Ordered speeds of the speed keys: slow 3, standard 6, full 8, flank 10. */
const FULL_SPEED = 8;
const FLANK_SPEED = 10;

interface Ctx {
  g: Gfx;
  xo: number;
  p: PanelColors;
  night: boolean;
}

const px = (c: Ctx, x: number): number => c.xo + x * U;
const py = (y: number): number => y * U;

/** A brass-framed dark window (the original's BOX), `(x0,y0)-(x1,y1)` in original pixels; `fill` null gives just the frame, around other parts. */
function bezelBox(c: Ctx, x0: number, y0: number, x1: number, y1: number, fill: string | null = c.p.glass): void {
  const { g, p } = c;
  const ctx = g.ctx;
  const x = px(c, x0);
  const y = py(y0);
  const w = (x1 - x0) * U;
  const h = (y1 - y0) * U;
  if (fill !== null) {
    g.rect(x, y, w, h, fill);
    const sh = ctx.createLinearGradient(0, g.toY(y), 0, g.toY(y + h));
    sh.addColorStop(0, "rgba(0,0,0,0.55)");
    sh.addColorStop(0.35, "rgba(0,0,0,0)");
    ctx.fillStyle = sh;
    ctx.fillRect(g.toX(x), g.toY(y), g.toLength(w), g.toLength(h));
  }
  g.rect(x - 2, y - 2, w + 4, h + 4, p.brass, false);
  g.rect(x - 5, y - 5, w + 10, h + 10, p.brassDark, false);
  g.line(x - 2, y - 2, x + w + 2, y - 2, p.brassLight, 1.2);
}

/** A glowing lamp: dark glass when off, a lit colour with a halo when on. */
function lamp(c: Ctx, cx: number, cy: number, r: number, color: string | null): void {
  const { g, p } = c;
  const ctx = g.ctx;
  const x = px(c, cx);
  const y = py(cy);
  g.circle(x, y, r * U + 6, p.brassDark, true);
  g.circle(x, y, r * U + 3, p.brass, false, 2.5);
  const lens = ctx.createRadialGradient(g.toX(x - 6), g.toY(y - 6), 0, g.toX(x), g.toY(y), g.toLength(r * U));
  if (color) {
    lens.addColorStop(0, mix(color, "#ffffff", 0.65));
    lens.addColorStop(0.5, color);
    lens.addColorStop(1, mix(color, "#000000", 0.45));
    const halo = ctx.createRadialGradient(g.toX(x), g.toY(y), g.toLength(r * U * 0.6), g.toX(x), g.toY(y), g.toLength(r * U * 2.1));
    halo.addColorStop(0, rgba(color, 0.5));
    halo.addColorStop(1, rgba(color, 0));
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(g.toX(x), g.toY(y), g.toLength(r * U * 2.1), 0, Math.PI * 2);
    ctx.fill();
  } else {
    lens.addColorStop(0, mix(p.lampOff, "#ffffff", 0.15));
    lens.addColorStop(1, p.lampOff);
  }
  ctx.fillStyle = lens;
  ctx.beginPath();
  ctx.arc(g.toX(x), g.toY(y), g.toLength(r * U), 0, Math.PI * 2);
  ctx.fill();
}

/** Angle, clockwise from the top, of `value` on a scale that has `perUnit` radians to the unit. */
const clockAngle = (value: number, perUnit: number): number => value * perUnit;

/** An arc band inside the ticks of a dial, between two clock angles. */
function zone(c: Ctx, cx: number, cy: number, from: number, to: number, color: string, inset: number): void {
  const { g } = c;
  const ctx = g.ctx;
  ctx.strokeStyle = color;
  ctx.lineWidth = g.toLength(6);
  ctx.lineCap = "butt";
  ctx.beginPath();
  ctx.ellipse(g.toX(cx), g.toY(cy), g.toLength(128 - inset), g.toLength(115.2 - inset * 0.9), 0, from - Math.PI / 2, to - Math.PI / 2);
  ctx.stroke();
}

interface DialSpec {
  cx: number;
  label: string;
  labelCol: number;
  /** Ticks all round the dial: 20 (every 18 degrees) or 16 (every 22.5). */
  ticks: number;
  /** The four numbers at top, right, bottom and left. */
  numbers: [string, string, string, string];
}

const DIALS: DialSpec[] = [
  { cx: 36, label: "DEPTH", labelCol: 3, ticks: 20, numbers: ["0", "100", "200", "300"] },
  { cx: 103, label: "SPEED", labelCol: 11, ticks: 20, numbers: ["0", "5", "10", "15"] },
  { cx: 170, label: "HEADING", labelCol: 19, ticks: 16, numbers: ["0", "90", "180", "270"] },
];

function drawNeedle(c: Ctx, cx: number, cy: number, tipX: number, tipY: number): void {
  const { g, p } = c;
  const ctx = g.ctx;
  const dx = tipX - cx;
  const dy = tipY - cy;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const poly = (ox: number, oy: number, fill: string): void => {
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.moveTo(g.toX(cx + nx * 7 + ox), g.toY(cy + ny * 7 + oy));
    ctx.lineTo(g.toX(tipX + ox), g.toY(tipY + oy));
    ctx.lineTo(g.toX(cx - nx * 7 + ox), g.toY(cy - ny * 7 + oy));
    ctx.lineTo(g.toX(cx - dx / len * 22 + ox), g.toY(cy - dy / len * 22 + oy)); // a short tail behind the hub
    ctx.closePath();
    ctx.fill();
  };
  poly(4, 5, p.needleShadow);
  poly(0, 0, p.needle);
  g.line(cx, cy, tipX, tipY, mix(p.needle, "#ffffff", 0.5), 1.2);
  g.circle(cx, cy, 15, p.brassDark, true);
  g.circle(cx, cy, 11, p.brass, true);
  g.circle(cx - 3, cy - 3, 4, p.brassLight, true);
}

function drawDial(c: Ctx, d: DialSpec, index: number, view: PlayView): void {
  const { g, p } = c;
  const ctx = g.ctx;
  const cx = px(c, d.cx);
  const cy = py(135);
  const rx = 128;
  const ry = 115.2;
  // bezel and face
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(g.toX(cx), g.toY(cy), g.toLength(rx + 8), g.toLength(ry + 7), 0, 0, Math.PI * 2);
  const bezel = ctx.createLinearGradient(g.toX(cx - rx), g.toY(cy - ry), g.toX(cx + rx), g.toY(cy + ry));
  bezel.addColorStop(0, p.brassLight);
  bezel.addColorStop(0.5, p.brass);
  bezel.addColorStop(1, p.brassDark);
  ctx.fillStyle = bezel;
  ctx.fill();
  ctx.restore();
  const face = ctx.createRadialGradient(g.toX(cx), g.toY(cy - 20), 0, g.toX(cx), g.toY(cy), g.toLength(rx));
  face.addColorStop(0, "#1b2226");
  face.addColorStop(1, p.glass);
  ctx.fillStyle = face;
  ctx.beginPath();
  ctx.ellipse(g.toX(cx), g.toY(cy), g.toLength(rx + 1), g.toLength(ry + 1), 0, 0, Math.PI * 2);
  ctx.fill();

  // zones (depth: scope depth green, crush red; speed: cruising green, flank amber)
  const tau = Math.PI * 2;
  if (index === 0) {
    zone(c, cx, cy, clockAngle(0, 0.0157), clockAngle(SCOPE_DEPTH, 0.0157), p.ok, 22);
    zone(c, cx, cy, clockAngle(CRUSH_DEPTH, 0.0157), tau, p.bad, 22);
  } else if (index === 1) {
    zone(c, cx, cy, clockAngle(3, 0.31), clockAngle(FULL_SPEED, 0.31), p.ok, 22);
    zone(c, cx, cy, clockAngle(FULL_SPEED, 0.31), clockAngle(FLANK_SPEED, 0.31), p.warn, 22);
  }

  // ticks: the original's, every 18 or 22.5 degrees from radius (27,26) to (30,29); the four at the numbers are longer
  for (let i = 0; i < d.ticks; i += 1) {
    const a = (i / d.ticks) * tau;
    const major = i % (d.ticks / 4) === 0;
    const r0 = major ? 98 : 108;
    const sx = Math.sin(a);
    const cs = -Math.cos(a);
    g.line(cx + sx * r0, cy + cs * r0 * 0.9, cx + sx * 120, cy + cs * 116, major ? p.mark : p.markDim, major ? 2.6 : 1.8);
  }
  d.numbers.forEach((t, k) => {
    const a = (k * Math.PI) / 2;
    drawText(g, cx + Math.sin(a) * 72, cy - Math.cos(a) * 64, t, p.mark, 30, { role: "body", bold: true, align: "center" });
  });
  drawText(g, cx, py(172) + 14, d.label, p.label, 30, { role: "title", align: "center" });

  // the needle
  const snap = view.snap.sub;
  if (index === 0) drawNeedle(c, cx, cy, cx + Math.sin(snap.depth * 0.0157) * 26 * U, cy - Math.cos(snap.depth * 0.0157) * 22 * U);
  else if (index === 1) drawNeedle(c, cx, cy, cx + Math.sin(snap.speed * 0.31) * 26 * U, cy - Math.cos(snap.speed * 0.31) * 22 * U);
  else drawNeedle(c, cx, cy, cx + Math.cos(snap.heading) * 26 * U, cy - Math.sin(snap.heading) * 22 * U);
}

/** Value box with a level bar along its bottom edge. */
function readout(c: Ctx, x0: number, y0: number, y1: number, text: string, fraction: number): void {
  const { g, p } = c;
  bezelBox(c, x0, y0, 280, y1);
  const x = px(c, x0);
  const y = py(y0);
  const w = (280 - x0) * U;
  const h = (y1 - y0) * U;
  const bar = Math.max(Math.min(fraction, 1), 0);
  g.rect(x + 6, y + h - 12, w - 12, 6, "#050809");
  g.rect(x + 6, y + h - 12, (w - 12) * bar, 6, levelColor(fraction, p));
  drawText(g, x + w - 12, y + h / 2 - 5, text, p.value, 34, { role: "body", bold: true, align: "right" });
}

function drawOxygen(c: Ctx, oxygen: number): void {
  const { g, p } = c;
  const ctx = g.ctx;
  bezelBox(c, 299, 112, 309, 178);
  const x = px(c, 299);
  const top = py(112);
  const h = (178 - 112) * U;
  const fraction = Math.max(Math.min(oxygen / START.oxygen, 1), 0);
  const fill = h * fraction;
  const grad = ctx.createLinearGradient(0, g.toY(top + h - fill), 0, g.toY(top + h));
  const color = levelColor(fraction, p);
  grad.addColorStop(0, mix(color, "#ffffff", 0.25));
  grad.addColorStop(1, mix(color, "#000000", 0.35));
  ctx.fillStyle = grad;
  ctx.fillRect(g.toX(x + 6), g.toY(top + h - fill - 4), g.toLength(10 * U - 12), g.toLength(fill));
  // scale marks 2 / 1 / 0 and the O2 label
  for (const [label, y] of [["2", 116], ["1", 146], ["0", 175]] as const) {
    g.line(px(c, 309) + 2, py(y), px(c, 309) + 12, py(y), p.mark, 1.6);
    drawText(g, px(c, 309) + 18, py(y), label, p.mark, 24, { role: "body", bold: true });
  }
  drawText(g, px(c, 304), py(106), "O2", p.label, 26, { role: "title", align: "center" });
}

function drawScopeArrow(c: Ctx, facing: string): void {
  const { g, p } = c;
  const cx = px(c, 283);
  const cy = py(187);
  g.circle(cx, cy, 8 * U + 6, p.brassDark, true);
  g.circle(cx, cy, 8 * U + 2, p.brass, false, 2.5);
  g.circle(cx, cy, 8 * U - 2, p.glass, true);
  const a = ({ F: 0, P: -Math.PI / 2, A: Math.PI, S: Math.PI / 2 } as Record<string, number>)[facing] ?? 0;
  const ctx = g.ctx;
  ctx.save();
  ctx.translate(g.toX(cx), g.toY(cy));
  ctx.rotate(a);
  const s = g.toLength(1);
  ctx.fillStyle = p.needle;
  ctx.beginPath();
  ctx.moveTo(0, -20 * s);
  ctx.lineTo(13 * s, -2 * s);
  ctx.lineTo(5 * s, -2 * s);
  ctx.lineTo(5 * s, 18 * s);
  ctx.lineTo(-5 * s, 18 * s);
  ctx.lineTo(-5 * s, -2 * s);
  ctx.lineTo(-13 * s, -2 * s);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/** Brushed gunmetal with a few rivets: the whole picture below the scope and a thin strip of it around. */
function drawMetal(c: Ctx): void {
  const { g, p } = c;
  const ctx = g.ctx;
  const x = px(c, 0);
  const y = py(98);
  const w = 320 * U;
  const h = 102 * U;
  const metal = ctx.createLinearGradient(0, g.toY(y), 0, g.toY(y + h));
  metal.addColorStop(0, p.metalTop);
  metal.addColorStop(1, p.metalBottom);
  ctx.fillStyle = metal;
  ctx.fillRect(g.toX(x), g.toY(y), g.toLength(w), g.toLength(h));
  // brushing: faint horizontal streaks
  ctx.strokeStyle = "rgba(255,255,255,0.025)";
  ctx.lineWidth = g.toLength(1);
  ctx.beginPath();
  for (let yy = y; yy < y + h; yy += 5) {
    const o = ((yy * 37) % 90) - 30;
    ctx.moveTo(g.toX(x + o), g.toY(yy));
    ctx.lineTo(g.toX(x + w), g.toY(yy));
  }
  ctx.stroke();
  for (const [rx, ry] of [[6, 106], [313, 106], [6, 192], [313, 192], [208, 190]] as const) {
    g.circle(px(c, rx), py(ry), 7, p.rivet, true);
    g.circle(px(c, rx) - 1.5, py(ry) - 1.5, 2.6, mix(p.rivet, "#ffffff", 0.45), true);
  }
}

/** Draws the panel (everything below the scope window) of the control room. `xo` is where the 1280 x 800 picture starts in the view. */
export function drawControlPanel(g: Gfx, view: PlayView, xo: number): void {
  const night = view.settings.timeOfDay === 0;
  const c: Ctx = { g, xo, p: night ? PANEL.night : PANEL.day, night };
  const { p } = c;
  const { sim } = view;
  const sub = sim.sub;
  drawMetal(c);

  // dials in their frame
  bezelBox(c, 2, 102, 205, 178, null);
  DIALS.forEach((d, i) => drawDial(c, d, i, view));

  // FUEL / BATT / CHARGING
  const damaged = sub.damage.some((d) => d > 0);
  const diesel = sub.engine === ENGINE.diesel;
  drawText(g, px(c, 208), py(108), "FUEL", p.label, 30, { role: "title" });
  readout(c, 246, 102, 112, String(Math.round(sub.fuel / 90)).padStart(4, " "), sub.fuel / START.fuel);
  lamp(c, 289, 107, 6, sub.fuelAlert ? p.bad : null);
  drawText(g, px(c, 208), py(124), "BATT", p.label, 30, { role: "title" });
  readout(c, 246, 118, 128, String(Math.round(sub.battery)).padStart(4, " "), sub.battery / START.battery);
  lamp(c, 289, 123, 6, sub.batteryAlert ? p.bad : null);
  drawText(g, px(c, 208), py(140), "CHARGING", p.label, 30, { role: "title" });
  lamp(c, 289, 139, 6, diesel && sub.battery < 1000 ? p.warn : null);

  drawOxygen(c, sub.oxygen);

  // torpedoes: count, doors lamp, four tubes
  bezelBox(c, 209, 150, 295, 178, null);
  drawText(g, px(c, 216), py(156), "TORPEDOES", p.label, 30, { role: "title" });
  lamp(c, 219, 171, 6, sub.doorsOpen ? p.ok : null);
  bezelBox(c, 229, 166, 249, 176);
  drawText(g, px(c, 241) + 14, py(171) - 4, String(sub.torpedoes), p.value, 34, { role: "body", bold: true, align: "right" });
  for (let i = 1; i <= 4; i += 1) {
    const t = sim.torpedoes[i];
    const ready = 4 - i < sub.torpedoes && !!t && t.speed === 0;
    const x0 = 252 + 10 * (i - 1);
    const cell = px(c, x0);
    g.rect(cell + 3, py(166) + 3, 10 * U - 6, 10 * U - 6, ready ? mix(p.ok, "#000000", 0.35) : p.glass);
    if (ready) {
      const ctx = g.ctx;
      const glow = ctx.createLinearGradient(0, g.toY(py(166)), 0, g.toY(py(176)));
      glow.addColorStop(0, rgba(p.ok, 0.9));
      glow.addColorStop(1, rgba(p.ok, 0.35));
      ctx.fillStyle = glow;
      ctx.fillRect(g.toX(cell + 3), g.toY(py(166) + 3), g.toLength(10 * U - 6), g.toLength(10 * U - 6));
    }
    drawText(g, cell + 5 * U, py(171) - 3, String(i), ready ? "#06210d" : p.markDim, 32, { role: "body", bold: true, align: "center" });
    g.rect(cell, py(166), 10 * U, 10 * U, p.brass, false);
  }

  // engine mode, damage lamp, scope arrow
  drawText(g, px(c, 16), py(188), "POWER", p.label, 30, { role: "title" });
  bezelBox(c, 61, 181, 113, 193);
  const [mode, color] = diesel ? ["DIESEL", p.warn] : sub.engine === ENGINE.electric ? ["ELECTRIC", p.ok] : ["OFF", mix(p.bad, "#000000", 0.25)];
  drawText(g, px(c, 87), py(187) - 3, mode, color, 34, { role: "body", bold: true, align: "center" });
  drawText(g, px(c, 144), py(188), "DAMAGE", p.label, 30, { role: "title" });
  const pulse = 0.65 + 0.35 * Math.sin(view.timeMs / 220);
  lamp(c, 200, 187, 6, damaged ? mix(p.bad, "#000000", 1 - pulse) : null);
  drawText(g, px(c, 232), py(188), "SCOPE", p.label, 30, { role: "title" });
  drawScopeArrow(c, sub.scopeFacing);
}

/** Whether the damage of the periscope shows (the scope window is dark and cracked then). */
export function scopeIsDamaged(view: PlayView): boolean {
  const sub = view.sim.sub;
  return sub.periscopeUp && sub.depth < 46 && (sub.damage[COMPARTMENT.periscopes] ?? 0) !== 0;
}
