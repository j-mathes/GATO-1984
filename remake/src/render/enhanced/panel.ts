import { COMPARTMENT, ENGINE, START } from "../../core/index.js";
import type { Gfx } from "../gfx.js";
import type { PlayView } from "../playScreens.js";
import { PANEL, levelColor, mix, rgba, type PanelColors } from "./colors.js";
import { glassCracks, strokeCracks, type Crack } from "./cracks.js";
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

export interface Ctx {
  g: Gfx;
  xo: number;
  p: PanelColors;
  night: boolean;
}

/** A drawing context for the panel components: `xo` is where the 1280 x 800 picture starts in the view. */
export function panelContext(g: Gfx, xo: number, night: boolean): Ctx {
  return { g, xo, p: night ? PANEL.night : PANEL.day, night };
}

const px = (c: Ctx, x: number): number => c.xo + x * U;
const py = (y: number): number => y * U;

/** A brass-framed dark window (the original's BOX), `(x0,y0)-(x1,y1)` in original pixels; `fill` null gives just the frame, around other parts. */
export function bezelBox(c: Ctx, x0: number, y0: number, x1: number, y1: number, fill: string | null = c.p.glass): void {
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
export function lamp(c: Ctx, cx: number, cy: number, r: number, color: string | null): void {
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
  // the level lives inside the bezel: a full tank reaches 6 units below its top edge and no further
  const inner = h - 12;
  const fill = inner * fraction;
  const grad = ctx.createLinearGradient(0, g.toY(top + h - 6 - fill), 0, g.toY(top + h - 6));
  const color = levelColor(fraction, p);
  grad.addColorStop(0, mix(color, "#ffffff", 0.25));
  grad.addColorStop(1, mix(color, "#000000", 0.35));
  ctx.fillStyle = grad;
  ctx.fillRect(g.toX(x + 6), g.toY(top + h - 6 - fill), g.toLength(10 * U - 12), g.toLength(fill));
  // scale marks 2 / 1 / 0 and the O2 label
  for (const [label, y] of [["2", 116], ["1", 146], ["0", 175]] as const) {
    g.line(px(c, 309) + 2, py(y), px(c, 309) + 12, py(y), p.mark, 1.6);
    drawText(g, px(c, 309) + 18, py(y), label, p.mark, 24, { role: "body", bold: true });
  }
  drawText(g, px(c, 304), py(106), "O2", p.label, 26, { role: "title", align: "center" });
}

/**
 * The scope's direction as a small compass card: F (forward), S (starboard), A (aft) and P (port) round the ring, the one the scope looks
 * at lit and the others dim, and a short needle pointing at it. It sits low enough to clear the torpedo box above it.
 */
function drawScopeArrow(c: Ctx, facing: string, centreX: number): void {
  const { g, p } = c;
  const cx = px(c, centreX);
  const cy = py(189);
  g.circle(cx, cy, 35, p.brassDark, true);
  g.circle(cx, cy, 31, p.brass, false, 2.5);
  g.circle(cx, cy, 27, p.glass, true);
  const marks: [string, number, number][] = [["F", 0, -1], ["S", 1, 0], ["A", 0, 1], ["P", -1, 0]];
  for (const [letter, dx, dy] of marks) {
    const lit = letter === facing;
    drawText(g, cx + dx * 20, cy + dy * 20, letter, lit ? p.needle : p.markDim, 15, { role: "body", bold: true, align: "center", optical: true });
  }
  const a = ({ F: 0, P: -Math.PI / 2, A: Math.PI, S: Math.PI / 2 } as Record<string, number>)[facing] ?? 0;
  const ctx = g.ctx;
  ctx.save();
  ctx.translate(g.toX(cx), g.toY(cy));
  ctx.rotate(a);
  const s = g.toLength(0.55);
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
export function drawMetal(c: Ctx, top = 98, height = 102): void {
  const { g, p } = c;
  const ctx = g.ctx;
  const x = 0; // the metal runs out to both edges of a wide view (`xo` is the margin on each side)
  const y = py(top);
  const w = 320 * U + 2 * c.xo;
  const h = height * U;
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
  for (const [rx, ry] of [[6, 106], [313, 106], [6, 192], [313, 192]] as const) {
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
  lamp(c, 219, 170, 4.5, sub.doorsOpen ? p.ok : null);
  bezelBox(c, 229, 166, 249, 176);
  drawText(g, px(c, 241) + 14, py(171), String(sub.torpedoes), p.value, 34, { role: "body", bold: true, align: "right", optical: true });
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
    drawText(g, cell + 5 * U, py(171), String(i), ready ? "#06210d" : p.markDim, 32, { role: "body", bold: true, align: "center", optical: true });
    g.rect(cell, py(166), 10 * U, 10 * U, p.brass, false);
  }

  // the bottom row: four groups (power, damage, periscope, scope direction) with the same gap between each, from x = 12 to x = 308
  const { textPx, powerX, boxX, damageX, periscopeX, compassX, compassW } = bottomRow();

  drawText(g, px(c, powerX), py(188), "POWER", p.label, 30, { role: "title" });
  bezelBox(c, boxX, 181, boxX + 52, 193);
  const [mode, color] = diesel ? ["DIESEL", p.warn] : sub.engine === ENGINE.electric ? ["ELECTRIC", p.ok] : ["OFF", mix(p.bad, "#000000", 0.25)];
  drawText(g, px(c, boxX + 26), py(187), mode, color, 34, { role: "body", bold: true, align: "center", optical: true });

  drawText(g, px(c, damageX), py(188), "DAMAGE", p.label, 30, { role: "title" });
  const pulse = 0.65 + 0.35 * Math.sin(view.timeMs / 220);
  lamp(c, damageX + textPx("DAMAGE", 30) + 4 + 6, 188, 4.5, damaged ? mix(p.bad, "#000000", 1 - pulse) : null);

  // the periscope: the word SCOPE with a pair of lit chevrons like elevator buttons; the upper one glows green while it is raised
  // (red if it is broken), the lower one amber while it is lowered
  const raised = sub.periscopeUp;
  const broken = raised && (sub.damage[COMPARTMENT.periscopes] ?? 0) !== 0;
  drawText(g, px(c, periscopeX), py(188), "SCOPE", p.label, 30, { role: "title" });
  const chevronX = periscopeX + textPx("SCOPE", 30) + 4 + 4.5;
  chevron(c, chevronX, 185, true, raised ? (broken ? p.bad : p.ok) : null);
  chevron(c, chevronX, 192, false, raised ? null : p.warn);

  drawScopeArrow(c, sub.scopeFacing, compassX + compassW / 2);
  for (const pane of instrumentPanes(c.xo)) if (pane.compartment !== null && (sub.damage[pane.compartment] ?? 0) !== 0) drawPane(g, pane);
}

/** Where the bottom row's four groups go, in original pixels: the same gap between each, from x = 12 to x = 308. */
function bottomRow(): { textPx: (s: string, size: number) => number; powerX: number; boxX: number; damageX: number; periscopeX: number; compassX: number; compassW: number } {
  const textPx = (s: string, size: number): number => (s.length * size * 0.6) / U; // typewriter text is about 0.6 em wide
  const powerW = textPx("POWER", 30) + 4 + 52;
  const damageW = textPx("DAMAGE", 30) + 4 + 12;
  const periscopeW = textPx("SCOPE", 30) + 4 + 9;
  const compassW = 17.5;
  const gap = (296 - (powerW + damageW + periscopeW + compassW)) / 3;
  const powerX = 12;
  const damageX = powerX + powerW + gap;
  const periscopeX = damageX + damageW + gap;
  return { textPx, powerX, boxX: powerX + textPx("POWER", 30) + 4, damageX, periscopeX, compassX: periscopeX + periscopeW + gap, compassW };
}

/** The glass of one instrument (a rectangle or an oval, in view units) and the compartment whose damage cracks it. */
export interface Pane {
  shape: "rect" | "oval";
  /** Fixes where its cracks are, so they never change. */
  seed: number;
  x: number;
  y: number;
  w: number;
  h: number;
  compartment: number | null;
}

/**
 * The panes of the panel's instruments, `xo` being where the 1280 x 800 picture starts. The dials and the oxygen gauge follow the control
 * room, the fuel and battery readouts and lamps their tanks and battery, the whole torpedo box the torpedo room and the power window the
 * engine room. The damage lamp has none, since it is what says something is damaged.
 */
export function instrumentPanes(xo: number): Pane[] {
  const X = (x: number): number => xo + x * U;
  const Y = (y: number): number => y * U;
  const rect = (seed: number, x0: number, y0: number, x1: number, y1: number, compartment: number): Pane => ({ shape: "rect", seed, x: X(x0), y: Y(y0), w: (x1 - x0) * U, h: (y1 - y0) * U, compartment });
  const round = (seed: number, cx: number, cy: number, r: number, compartment: number): Pane => ({ shape: "oval", seed, x: X(cx) - (r * U + 3), y: Y(cy) - (r * U + 3), w: 2 * (r * U + 3), h: 2 * (r * U + 3), compartment });
  const dials: Pane[] = DIALS.map((d, i) => ({ shape: "oval", seed: 101 + i, x: X(d.cx) - 128, y: Y(135) - 115, w: 256, h: 230, compartment: COMPARTMENT.controlRoom }));
  const { boxX } = bottomRow();
  return [
    ...dials,
    rect(104, 299, 112, 309, 178, COMPARTMENT.controlRoom),
    rect(105, 246, 102, 280, 112, COMPARTMENT.fuelTanks),
    round(106, 289, 107, 6, COMPARTMENT.fuelTanks),
    rect(107, 246, 118, 280, 128, COMPARTMENT.batteryRoom),
    round(108, 289, 123, 6, COMPARTMENT.batteryRoom),
    round(109, 289, 139, 6, COMPARTMENT.batteryRoom),
    rect(110, 209, 150, 295, 178, COMPARTMENT.torpedoRoom),
    rect(111, boxX, 181, boxX + 52, 193, COMPARTMENT.engineRoom),
  ];
}

/** The periscope's viewport, the window above the panel. */
export function scopePane(xo: number): Pane {
  return { shape: "rect", seed: 100, x: xo, y: 0, w: 320 * U, h: 98 * U, compartment: COMPARTMENT.periscopes };
}

const paneCracks = new Map<string, { cracks: Crack[]; x: number; y: number }>();

/**
 * Cracks in one pane, clipped to its glass: they are fixed by its seed and size, so they never change. With `spread` (0 to 1) only the
 * part within that share of their reach from the impact is drawn: the break spreading. The instruments keep working under the cracks.
 */
export function drawPane(g: Gfx, pane: Pane, spread = 1): void {
  const { x, y, w, h } = pane;
  const key = `${pane.seed}:${Math.round(w)}x${Math.round(h)}`;
  let made = paneCracks.get(key);
  if (!made) {
    const where = (n: number): number => 0.3 + 0.4 * (((Math.sin(pane.seed * n) * 43758.5453) % 1 + 1) % 1);
    const cx = where(12.9898);
    const cy = where(78.233);
    made = { cracks: glassCracks(w, h, cx, cy, pane.seed, 0.8), x: cx * w, y: cy * h };
    paneCracks.set(key, made);
  }
  if (spread <= 0) return;
  const ctx = g.ctx;
  ctx.save();
  ctx.beginPath();
  if (pane.shape === "oval") ctx.ellipse(g.toX(x + w / 2), g.toY(y + h / 2), g.toLength(w / 2), g.toLength(h / 2), 0, 0, Math.PI * 2);
  else ctx.rect(g.toX(x), g.toY(y), g.toLength(w), g.toLength(h));
  ctx.clip();
  const reach = Math.hypot(w, h) * 0.8 * 1.1;
  strokeCracks(g, made.cracks, x, y, { thickness: Math.min(1, Math.max(0.55, Math.min(w, h) / 160)), reveal: spread < 1 ? { x: made.x, y: made.y, radius: reach * spread } : undefined });
  ctx.restore();
}
/** A small triangle button centred at (`x`, `y`) in original pixels, pointing up or down; lit with `color` (with a glow) or dark when null. */
function chevron(c: Ctx, x: number, y: number, up: boolean, color: string | null): void {
  const { g, p } = c;
  const ctx = g.ctx;
  const cx = px(c, x);
  const cy = py(y);
  const w = 18;
  const h = 13;
  const tip = up ? -h : h;
  const base = up ? h : -h;
  ctx.save();
  if (color) {
    ctx.shadowColor = color;
    ctx.shadowBlur = g.toLength(14);
  }
  ctx.beginPath();
  ctx.moveTo(g.toX(cx), g.toY(cy + tip * 0.5));
  ctx.lineTo(g.toX(cx + w), g.toY(cy + base * 0.5));
  ctx.lineTo(g.toX(cx - w), g.toY(cy + base * 0.5));
  ctx.closePath();
  ctx.fillStyle = color ?? p.glass;
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.lineWidth = g.toLength(2);
  ctx.strokeStyle = color ? mix(color, "#ffffff", 0.45) : p.brassDark;
  ctx.stroke();
  ctx.restore();
}
/** Whether the damage of the periscope shows (the scope window is dark and cracked then). */
export function scopeIsDamaged(view: PlayView): boolean {
  const sub = view.sim.sub;
  return sub.periscopeUp && sub.depth < 46 && (sub.damage[COMPARTMENT.periscopes] ?? 0) !== 0;
}
