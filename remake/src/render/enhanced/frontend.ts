import { LAUNCHER_PROMPT, type LauncherItem } from "../../core/index.js";
import type { Gfx } from "../gfx.js";
import { closeHull } from "../hull.js";
import { ENHANCEMENT_CREDIT, MENU_FRAME_ID, SPLASH_FRAME_ID, TITLE_HOLD_MS, TITLE_LETTERS_FRAME_ID, TITLE_WIPE_MS, type OrdersView } from "../textScreens.js";
import { TITLE_ART_HEIGHT, TITLE_ART_WIDTH, type TitleArt } from "../titleArt.js";
import { rgba } from "./colors.js";
import { coloured, frameLayer, frameMask, maskLayer, outlineOf } from "./layers.js";
import { skyAndSea } from "./scope.js";
import { drawGridText, drawText } from "./typography.js";

/**
 * The enhanced versions of the screens before the mission: the logo, the title page, the menu and the incoming orders (also the demo's Morse
 * example). They show what the original shows, in the same order and at the same moments, but redrawn at the display's resolution: the
 * artwork's own shapes (the logo, the lettering, the submarine) are enlarged and smoothed, then lit and coloured; the text is set in the
 * typewriter faces. Every function returns false when the artwork it needs is missing, so the original drawing can take over. The picture is
 * 4 times the original's 320 x 200, centred; the backgrounds run out to both edges of a wide view.
 */
const U = 4;
const PICTURE_WIDTH = TITLE_ART_WIDTH * U;
const PICTURE_HEIGHT = TITLE_ART_HEIGHT * U;

const CREAM = "#eadfbd";
const BRASS = "#c9a24d";

const margin = (width: number): number => (width - PICTURE_WIDTH) / 2;

// ------------------------------------------------------------------------------------------------------------------------------
// The logo
// ------------------------------------------------------------------------------------------------------------------------------

export const SPLASH_FADE_IN_MS = 500;
export const SPLASH_FADE_OUT_MS = 450;

/** How visible the logo is `sinceMs` into its `totalMs`: it fades in, holds, and fades out. */
export function splashAlpha(sinceMs: number, totalMs: number): number {
  return Math.min(Math.max(Math.min(sinceMs / SPLASH_FADE_IN_MS, (totalMs - sinceMs) / SPLASH_FADE_OUT_MS), 0), 1);
}

/** Points along the ribbon of the logo in a 320 x 252 picture, left to right: it rises, dips and rises again. */
const RIBBON: readonly (readonly [number, number])[] = [
  [77, 106], [90, 94], [106, 88], [120, 78], [130, 62], [142, 46], [154, 41], [164, 52], [172, 70], [181, 86], [190, 80], [196, 62], [204, 42], [218, 26], [236, 17],
];

/** A smooth curve through points (Catmull-Rom), as `steps` points per segment. */
export function smoothCurve(points: readonly (readonly [number, number])[], steps = 14): [number, number][] {
  const out: [number, number][] = [];
  const at = (i: number): readonly [number, number] => points[Math.min(Math.max(i, 0), points.length - 1)] as readonly [number, number];
  for (let i = 0; i < points.length - 1; i += 1) {
    const [p0, p1, p2, p3] = [at(i - 1), at(i), at(i + 1), at(i + 2)];
    for (let s = 0; s < steps; s += 1) {
      const t = s / steps;
      const f = (a: number, b: number, c: number, d: number): number => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t * t + (-a + 3 * b - 3 * c + d) * t * t * t);
      out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  out.push(at(points.length - 1) as [number, number]);
  return out;
}

/** The rainbow along the ribbon: magenta, then red, yellow, green, cyan and blue at the far end (`t` 0 to 1 along it). */
export function ribbonColor(t: number): string {
  return `hsl(${Math.round((300 + 285 * t) % 360)}, 92%, ${Math.round(50 + 6 * Math.sin(t * Math.PI))}%)`;
}

/**
 * The publisher's logo: a rainbow ribbon in a wave above "Spectrum HoloByte" in chrome italics, on black, fading in and out. This is drawn
 * from scratch in the manner of the company's logo (the original game's own CGA logo is the one on the original graphics).
 */
export function drawEnhancedSplash(g: Gfx, art: TitleArt | null, width: number, height: number, sinceMs: number, totalMs: number): boolean {
  void art;
  const c = g.ctx;
  g.view(width, height);
  c.fillStyle = "#000000";
  c.fillRect(g.toX(0), g.toY(0), g.toLength(width), g.toLength(height));
  const k = 3.3;
  const ox = width / 2 - 160 * k;
  const oy = (height - 252 * k) / 2 + 6;
  c.save();
  c.globalAlpha = splashAlpha(sinceMs, totalMs);
  // the ribbon: short pieces, each in its colour, thickest in the middle and tapering at both ends, with a lighter line along the top
  const curve = smoothCurve(RIBBON);
  c.lineCap = "round";
  for (let i = 1; i < curve.length; i += 1) {
    const t = i / (curve.length - 1);
    const thick = (3 + 6.5 * Math.sin(Math.PI * Math.pow(t, 0.8))) * k;
    const [x0, y0] = curve[i - 1] as [number, number];
    const [x1, y1] = curve[i] as [number, number];
    c.strokeStyle = ribbonColor(t);
    c.lineWidth = g.toLength(thick);
    c.beginPath();
    c.moveTo(g.toX(ox + x0 * k), g.toY(oy + y0 * k));
    c.lineTo(g.toX(ox + x1 * k), g.toY(oy + y1 * k));
    c.stroke();
    c.strokeStyle = "rgba(255,255,255,0.22)";
    c.lineWidth = g.toLength(thick * 0.28);
    c.beginPath();
    c.moveTo(g.toX(ox + x0 * k), g.toY(oy + y0 * k - thick * 0.22));
    c.lineTo(g.toX(ox + x1 * k), g.toY(oy + y1 * k - thick * 0.22));
    c.stroke();
  }
  // the name, in two lines of chrome italics
  const chrome = (y0: number, y1: number): CanvasGradient => {
    const gr = c.createLinearGradient(0, g.toY(y0), 0, g.toY(y1));
    gr.addColorStop(0, "#ffffff");
    gr.addColorStop(0.45, "#aebfe6");
    gr.addColorStop(0.55, "#5c74b8");
    gr.addColorStop(1, "#27357a");
    return gr;
  };
  const face = '"Segoe UI", "Helvetica Neue", Arial, sans-serif';
  c.textBaseline = "alphabetic";
  c.textAlign = "left";
  c.font = `italic 700 ${g.toLength(40 * k)}px ${face}`;
  const lines: [string, number, number][] = [["Spectrum", 72, 140], ["HoloByte", 72, 178]];
  for (const [text, x, base] of lines) {
    const y = oy + base * k;
    c.save();
    c.shadowColor = "rgba(120,150,255,0.5)";
    c.shadowBlur = g.toLength(10);
    c.fillStyle = chrome(y - 38 * k, y);
    c.fillText(text, g.toX(ox + x * k), g.toY(y));
    c.restore();
  }
  c.restore();
  return true;
}

// ------------------------------------------------------------------------------------------------------------------------------
// The title page
// ------------------------------------------------------------------------------------------------------------------------------

/** How far the blinds of the GATO lettering have opened, 0 (thin slats) to 1 (solid), `sinceMs` after the page appeared; 1 without a time. */
export function blindOpenness(sinceMs?: number): number {
  if (sinceMs === undefined) return 1;
  return Math.min(Math.max((sinceMs - TITLE_HOLD_MS) / TITLE_WIPE_MS, 0), 1);
}

const BLIND_PERIOD = 4 * U;
const TITLE_CREAM = "#f1e6c4";

/**
 * The title page, laid out like the box: a sunset band across the top with GATO in big outlined letters and a crosshair on the O (a ship in
 * its sights), and the tagline and publisher under it.
 * Everything is drawn from scratch; nothing of the original picture or its lettering is used. The letters open like blinds when the page appears
 * (the original wipes its solid letters into stripes).
 */
export function drawEnhancedTitle(g: Gfx, art: TitleArt | null, width: number, height: number, timeMs: number, sinceMs?: number): boolean {
  void art;
  const c = g.ctx;
  g.view(width, height);
  c.fillStyle = "#050403";
  c.fillRect(g.toX(0), g.toY(0), g.toLength(width), g.toLength(height));
  const sun = c.createLinearGradient(0, g.toY(0), 0, g.toY(600));
  sun.addColorStop(0, "#e07b1d");
  sun.addColorStop(0.3, "#f0a838");
  sun.addColorStop(0.55, "#8d3d14");
  sun.addColorStop(0.82, "#240d06");
  sun.addColorStop(1, "rgba(5,4,3,1)");
  c.fillStyle = sun;
  c.fillRect(g.toX(0), g.toY(0), g.toLength(width), g.toLength(600));

  const mid = width / 2;
  const open = blindOpenness(sinceMs);
  c.save();
  if (open < 1) {
    c.beginPath();
    const slat = BLIND_PERIOD * (0.2 + 0.8 * open);
    for (let y = 0; y < 600; y += BLIND_PERIOD) c.rect(g.toX(0), g.toY(y), g.toLength(width), g.toLength(slat));
    c.clip();
  }
  const o = drawGatoLetters(g, mid, 330);
  c.restore();
  drawCrosshair(g, o.x, o.y, o.r + 26, TITLE_CREAM);
  drawShip(g, o.x, o.y + 22, o.r * 0.95);

  // the tagline and the publisher, then the credits and the prompt
  const sans = '"Futura", "Century Gothic", "Trebuchet MS", "Segoe UI", sans-serif';
  const serif = 'Georgia, "Times New Roman", serif';
  c.textBaseline = "middle";
  c.textAlign = "center";
  c.fillStyle = TITLE_CREAM;
  c.font = `600 ${g.toLength(31)}px ${sans}`;
  c.fillText("WW II  GATO-Class Submarine Simulation", g.toX(mid), g.toY(650));
  c.font = `italic 700 ${g.toLength(29)}px ${serif}`;
  c.fillText("Spectrum HoloByte\u2122", g.toX(mid), g.toY(698));
  drawText(g, mid, 748, `by Paul Arlton and Ed Dawson  \u00b7  ${ENHANCEMENT_CREDIT}  \u00b7  \u00a9 1984 Spectrum HoloByte, Inc.`, "#9a9078", 16, { role: "body", align: "center" });
  const pulse = 0.5 + 0.5 * Math.sin(timeMs / 380);
  drawText(g, mid, 778, "PRESS ANY KEY", rgba("#e8a23a", 0.35 + 0.65 * pulse), 15, { role: "body", bold: true, align: "center" });
  return true;
}

/** GATO in wide, outlined letters centred on (`cx`, `cy`); returns the middle of the O and its outer radius. */
function drawGatoLetters(g: Gfx, cx: number, cy: number): { x: number; y: number; r: number } {
  const c = g.ctx;
  const size = 350;
  c.font = `600 ${g.toLength(size)}px "Futura", "Century Gothic", "Trebuchet MS", "Segoe UI", sans-serif`;
  c.textBaseline = "middle";
  c.textAlign = "left";
  const word = ["G", "A", "T", "O"];
  const gap = 30;
  const widths = word.map((ch) => ((c.measureText(ch) as TextMetrics | undefined)?.width ?? 0) / g.toLength(1) || size * 0.7);
  const total = widths.reduce((a, b) => a + b, 0) + gap * (word.length - 1);
  let x = cx - total / 2;
  let oX = cx;
  let oY = cy;
  let oR = 120;
  const fill = c.createLinearGradient(0, g.toY(cy - 160), 0, g.toY(cy + 200));
  fill.addColorStop(0, "#ffd36a");
  fill.addColorStop(0.5, "#c7691c");
  fill.addColorStop(1, "#3a1608");
  word.forEach((ch, i) => {
    const w = widths[i] as number;
    if (ch === "O") {
      // where the ink of the O really is: the middle of its bounding box, and half of the larger side
      const m = c.measureText(ch) as TextMetrics | undefined;
      const unit = g.toLength(1);
      if (m && Number.isFinite(m.actualBoundingBoxLeft)) {
        oX = x + (m.actualBoundingBoxRight - m.actualBoundingBoxLeft) / unit / 2; // the ink runs from x - left to x + right
        oY = cy - (m.actualBoundingBoxAscent - m.actualBoundingBoxDescent) / unit / 2;
        oR = Math.max(m.actualBoundingBoxLeft + m.actualBoundingBoxRight, m.actualBoundingBoxAscent + m.actualBoundingBoxDescent) / unit / 2;
      } else {
        oX = x + w / 2;
        oR = size * 0.36;
      }
    }
    c.lineJoin = "round";
    c.lineWidth = g.toLength(14);
    c.strokeStyle = "#0a0605";
    c.strokeText(ch, g.toX(x), g.toY(cy));
    c.fillStyle = fill;
    c.fillText(ch, g.toX(x), g.toY(cy));
    c.lineWidth = g.toLength(2.5);
    c.strokeStyle = TITLE_CREAM;
    c.strokeText(ch, g.toX(x), g.toY(cy));
    x += w + gap;
  });
  return { x: oX, y: oY, r: oR };
}
/** A sniper's reticle: a ring round the O with a cross through it (the arms gapped in the middle) and short tick marks. */
function drawCrosshair(g: Gfx, cx: number, cy: number, r: number, color: string): void {
  const c = g.ctx;
  c.save();
  c.shadowColor = "rgba(255,226,160,0.5)";
  c.shadowBlur = g.toLength(6);
  g.circle(cx, cy, r, color, false, 3);
  g.circle(cx, cy, r - 9, rgba(color, 0.45), false, 1.4);
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
    g.line(cx + dx * (r - 18), cy + dy * (r - 18), cx + dx * (r + 34), cy + dy * (r + 34), color, 3);
    g.line(cx + dx * 22, cy + dy * 22, cx + dx * (r - 28), cy + dy * (r - 28), rgba(color, 0.7), 1.4);
  }
  c.restore();
}

/**
 * A ship in profile, `w` wide, with its keel on `y` and centred on `x`: a hull with a raked bow and a flat stern, a bridge, a funnel with a
 * plume of smoke, two masts with derricks, a gun forward and a wake. A dark silhouette, for the middle of the O.
 */
function drawShip(g: Gfx, x: number, y: number, w: number): void {
  const c = g.ctx;
  const s = w / 120;
  const P = (px: number, py: number): [number, number] => [g.toX(x + px * s), g.toY(y + py * s)];
  const ink = "#0a0605";
  c.save();
  c.fillStyle = ink;
  c.strokeStyle = ink;
  c.lineCap = "round";
  c.lineJoin = "round";
  c.beginPath();
  c.moveTo(...P(-60, -10));
  c.lineTo(...P(-36, -10));
  c.lineTo(...P(-36, -13));
  c.lineTo(...P(34, -13));
  c.lineTo(...P(46, -13));
  c.lineTo(...P(64, -22));
  c.lineTo(...P(58, -6));
  c.quadraticCurveTo(...P(44, 4), ...P(24, 5));
  c.lineTo(...P(-48, 5));
  c.quadraticCurveTo(...P(-58, 4), ...P(-60, -10));
  c.closePath();
  c.fill();
  const box = (x0: number, y0: number, x1: number, y1: number): void => c.fillRect(...P(x0, y0), g.toLength((x1 - x0) * s), g.toLength((y1 - y0) * s));
  box(-30, -24, -4, -13);
  box(-24, -31, -10, -24);
  c.beginPath();
  c.moveTo(...P(0, -13));
  c.lineTo(...P(14, -13));
  c.lineTo(...P(11, -36));
  c.lineTo(...P(3, -36));
  c.closePath();
  c.fill();
  c.globalAlpha = 0.55;
  c.beginPath();
  c.ellipse(...P(-2, -44), g.toLength(11 * s), g.toLength(5 * s), -0.25, 0, Math.PI * 2);
  c.ellipse(...P(-18, -50), g.toLength(14 * s), g.toLength(5 * s), -0.2, 0, Math.PI * 2);
  c.fill();
  c.globalAlpha = 1;
  c.lineWidth = g.toLength(2 * s);
  c.beginPath();
  c.moveTo(...P(30, -13));
  c.lineTo(...P(30, -40));
  c.moveTo(...P(-44, -13));
  c.lineTo(...P(-44, -36));
  c.moveTo(...P(30, -34));
  c.lineTo(...P(52, -17));
  c.moveTo(...P(-44, -31));
  c.lineTo(...P(-62, -15));
  c.moveTo(...P(30, -40));
  c.lineTo(...P(-44, -36));
  c.stroke();
  box(46, -17, 54, -13);
  c.lineWidth = g.toLength(1.8 * s);
  for (const [a, b, dy] of [[-70, -40, 9], [-28, 4, 12], [18, 50, 9]] as const) {
    c.beginPath();
    c.moveTo(...P(a, dy));
    c.lineTo(...P(b, dy));
    c.stroke();
  }
  c.restore();
}
/** The original menu's submarine as a filled silhouette: its outline filled between the outermost pixels of each row, made once. */
function menuHull(art: TitleArt): HTMLCanvasElement | null {
  return maskLayer(art, "menu:hull", () => {
    const outline = frameMask(art, MENU_FRAME_ID, [3], 101);
    if (!outline) return null;
    let last = 0;
    outline.forEach((v, i) => {
      if (v) last = Math.max(last, Math.floor(i / TITLE_ART_WIDTH));
    });
    return closeHull(outline, TITLE_ART_WIDTH, TITLE_ART_HEIGHT, last);
  });
}

// --------------------------------------------------------------------------------------------------------------------------------
// The menu
// ------------------------------------------------------------------------------------------------------------------------------

const WATERLINE = 400;

/** The menu: the original's surfaced submarine, shaded and bobbing on a day sea, with the choices on a gunmetal board below it. */
export function drawEnhancedMenu(g: Gfx, art: TitleArt | null, width: number, height: number, entry: string, items: readonly LauncherItem[], timeMs: number): boolean {
  if (!art || !art.frame(MENU_FRAME_ID)) return false;
  const c = g.ctx;
  const xo = margin(width);
  g.view(width, height);
  skyAndSea(g, { x: 0, y: 0, w: width, h: 440 }, WATERLINE, true, timeMs);

  // the submarine: its outline filled between the outermost pixels of each row, and the outline itself over it
  const lines = frameLayer(art, MENU_FRAME_ID, [3]);
  const hull = menuHull(art);
  if (hull && lines) {
    const bob = Math.sin(timeMs / 1100) * 3;
    const body = coloured(hull, "steel", (cx, w, h) => {
      const gr = cx.createLinearGradient(0, h * 0.32, 0, h * 0.52);
      gr.addColorStop(0, "#9fadb7");
      gr.addColorStop(0.5, "#5e6c76");
      gr.addColorStop(1, "#2c363d");
      return gr;
    });
    const edge = coloured(lines, "edge", () => "#dfe8ee");
    c.save();
    c.beginPath();
    c.rect(g.toX(0), g.toY(0), g.toLength(width), g.toLength(WATERLINE + 2));
    c.clip();
    g.smooth(true);
    c.shadowColor = "rgba(0,0,0,0.45)";
    c.shadowBlur = g.toLength(8);
    c.shadowOffsetY = g.toLength(4);
    c.drawImage(body, g.toX(xo), g.toY(bob), g.toLength(PICTURE_WIDTH), g.toLength(PICTURE_HEIGHT));
    c.shadowBlur = 0;
    c.shadowOffsetY = 0;
    c.globalAlpha = 0.55;
    c.drawImage(edge, g.toX(xo), g.toY(bob), g.toLength(PICTURE_WIDTH), g.toLength(PICTURE_HEIGHT));
    g.smooth(false);
    c.restore();
  }
  // foam along the waterline
  for (let i = 0; i < 40; i += 1) {
    const x = ((i * 97 + timeMs / 40) % (width + 120)) - 60;
    g.line(x, WATERLINE + 2 + (i % 4) * 7, x + 40 + (i % 5) * 12, WATERLINE + 2 + (i % 4) * 7, "rgba(230,245,250,0.35)", 2);
  }

  // the board
  const board = c.createLinearGradient(0, g.toY(440), 0, g.toY(height));
  board.addColorStop(0, "#3a444b");
  board.addColorStop(1, "#171c20");
  c.fillStyle = board;
  c.fillRect(g.toX(0), g.toY(440), g.toLength(width), g.toLength(height - 440));
  g.line(0, 441, width, 441, BRASS, 4);
  g.line(0, 449, width, 449, rgba(BRASS, 0.4), 1.5);
  const left = xo + 90;
  items.forEach((item, i) => {
    const y = 492 + i * 44;
    drawText(g, left, y, `[${item.number}]`, BRASS, 34, { role: "body", bold: true });
    drawText(g, left + 120, y, item.label, CREAM, 34, { role: "body", bold: true });
  });
  drawText(g, left, 722, `${LAUNCHER_PROMPT[0]} ${LAUNCHER_PROMPT[1]}`, "#bdb79f", 26, { role: "body" });
  const cursor = Math.floor(timeMs / 266) % 2 === 0 ? "_" : " ";
  drawText(g, left, 764, `${entry}${cursor}`, BRASS, 34, { role: "body", bold: true });
  return true;
}

// ------------------------------------------------------------------------------------------------------------------------------
// The orders (and the demo's Morse example)
// ------------------------------------------------------------------------------------------------------------------------------

const PAGE = { x: 90, y: 44, w: 1100, h: 700 };

/**
 * The incoming message: the teletype of the original (24 lines of 40 characters, printed one by one as the Morse sounds and scrolling up) as
 * a typed page on a dark desk, with a lamp that glows while the message is still coming in. `note` is the line under the page that says how to
 * continue (the demo's Morse example has none).
 */
export function drawEnhancedOrders(g: Gfx, width: number, height: number, view: OrdersView, timeMs: number, note: string | null): void {
  const c = g.ctx;
  const xo = margin(width);
  g.view(width, height);
  const desk = c.createLinearGradient(0, g.toY(0), 0, g.toY(height));
  desk.addColorStop(0, "#343d44");
  desk.addColorStop(1, "#14181c");
  c.fillStyle = desk;
  c.fillRect(g.toX(0), g.toY(0), g.toLength(width), g.toLength(height));

  drawText(g, xo + PAGE.x, 22, "RADIO ROOM  -  INCOMING MESSAGE", BRASS, 28, { role: "title" });
  const coming = !view.finished;
  const pulse = coming ? 0.6 + 0.4 * Math.sin(timeMs / 160) : 1;
  const lamp = coming ? "#ffb347" : "#58d27a";
  const lx = xo + PAGE.x + PAGE.w - 190;
  c.save();
  c.shadowColor = lamp;
  c.shadowBlur = g.toLength(16 * pulse);
  g.circle(lx, 22, 9, rgba(lamp, 0.45 + 0.55 * pulse), true);
  c.restore();
  g.circle(lx, 22, 11, BRASS, false, 2);
  drawText(g, lx + 22, 22, coming ? "RECEIVING" : "COMPLETE", coming ? lamp : "#8fd9a4", 22, { role: "body", bold: true });

  c.save();
  c.shadowColor = "rgba(0,0,0,0.6)";
  c.shadowBlur = g.toLength(22);
  c.shadowOffsetY = g.toLength(8);
  const paper = c.createLinearGradient(0, g.toY(PAGE.y), 0, g.toY(PAGE.y + PAGE.h));
  paper.addColorStop(0, "#efe4c6");
  paper.addColorStop(1, "#d9c9a0");
  c.fillStyle = paper;
  c.fillRect(g.toX(xo + PAGE.x), g.toY(PAGE.y), g.toLength(PAGE.w), g.toLength(PAGE.h));
  c.restore();
  const grid = { x: xo + PAGE.x + 70, y: PAGE.y + 14, cellWidth: 25, cellHeight: 28 };
  for (let r = 1; r <= view.screen.cells.length; r += 1) g.line(xo + PAGE.x + 20, grid.y + r * grid.cellHeight, xo + PAGE.x + PAGE.w - 20, grid.y + r * grid.cellHeight, rgba("#5d7ea3", 0.3), 1.2);
  g.line(xo + PAGE.x + 56, PAGE.y + 10, xo + PAGE.x + 56, PAGE.y + PAGE.h - 10, rgba("#b8332b", 0.5), 1.6);
  view.screen.cells.forEach((cells, r) => {
    const line = cells.map((cell) => cell.ch).join("");
    if (line.trim() !== "") drawGridText(g, grid, 1, r + 1, line, "#2b2118", { size: 25 });
  });
  if (view.cursorOn) drawGridText(g, grid, view.screen.col + 1, view.screen.row + 1, "_", "#2b2118", { size: 25, bold: true });
  if (note) drawText(g, width / 2, 774, note, "#bdb79f", 26, { role: "body", align: "center" });
}
