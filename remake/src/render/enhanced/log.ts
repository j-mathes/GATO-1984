import type { Gfx } from "../gfx.js";
import type { PlayView } from "../playScreens.js";
import { rgba } from "./colors.js";
import { drawGridText, drawText, type TextGrid } from "./typography.js";

/**
 * The Captain's Log in the enhanced graphics: a typed ledger page on a dark board, with the same lines the original prints (the last nine ships
 * sunk with their tonnage and date, then the totals), a ruled page, a red margin line and a small flag.
 */
const INK = "#2b2118";
const INK_FAINT = "#6b5a46";
const PAPER_TOP = "#efe4c6";
const PAPER_BOTTOM = "#d9c9a0";

/** The flag of the original's log page, as plain shapes: 13 stripes and a blue canton with rows of stars. */
function drawFlag(g: Gfx, x: number, y: number, w: number): void {
  const h = w * 0.6;
  const stripe = h / 13;
  for (let i = 0; i < 13; i += 1) g.rect(x, y + i * stripe, w, stripe + 0.4, i % 2 === 0 ? "#b8332b" : "#f6f0e0");
  const cw = w * 0.4;
  const ch = stripe * 7;
  g.rect(x, y, cw, ch, "#2a3f78");
  for (let r = 0; r < 4; r += 1) {
    for (let c = 0; c < 5; c += 1) g.circle(x + cw * (0.11 + c * 0.195 + (r % 2) * 0.0), y + ch * (0.16 + r * 0.22), w * 0.012, "#f6f0e0", true);
  }
  g.rect(x, y, w, h, "rgba(0,0,0,0.4)", false);
}

/** Lines of the page in the original's formats (see drawLogLayout): name, tonnage, date, with the same widths. */
export function ledgerLines(view: PlayView): { rows: string[]; totals: string[] } {
  const rows = view.log.entries().slice(-9).map((e) => e.name.slice(0, 15).padEnd(15) + String(e.tonnage).padStart(6) + "      " + e.dateSunk.slice(0, 6) + " 1943");
  const totals = [
    "SHIPS SUNK      " + String(view.log.shipsSunk).padStart(6),
    "TOTAL TONNAGE   " + String(view.log.totalTonnage).padStart(6),
    "MISSIONS COMPLETED" + String(view.log.missionsCompleted).padStart(4),
  ];
  return { rows, totals };
}

export function drawEnhancedLog(g: Gfx, view: PlayView, xo: number): void {
  const c = g.ctx;
  // the board
  const board = c.createLinearGradient(0, g.toY(0), 0, g.toY(800));
  board.addColorStop(0, "#343d44");
  board.addColorStop(1, "#171c20");
  c.fillStyle = board;
  c.fillRect(g.toX(xo), g.toY(0), g.toLength(1280), g.toLength(800));
  // the page, with a shadow
  const px = xo + 90;
  const py = 34;
  const pw = 1100;
  const ph = 732;
  c.save();
  c.shadowColor = "rgba(0,0,0,0.6)";
  c.shadowBlur = g.toLength(24);
  c.shadowOffsetY = g.toLength(8);
  const paper = c.createLinearGradient(0, g.toY(py), 0, g.toY(py + ph));
  paper.addColorStop(0, PAPER_TOP);
  paper.addColorStop(1, PAPER_BOTTOM);
  c.fillStyle = paper;
  c.fillRect(g.toX(px), g.toY(py), g.toLength(pw), g.toLength(ph));
  c.restore();
  // ruled lines and the margin
  for (let y = py + 202; y < py + ph - 20; y += 40) g.line(px + 20, y, px + pw - 20, y, rgba("#5d7ea3", 0.35), 1.2);
  g.line(px + 70, py + 12, px + 70, py + ph - 12, rgba("#b8332b", 0.55), 1.8);
  // the top: title, flag, rule
  drawFlag(g, px + 100, py + 50, 140);
  drawText(g, px + pw / 2 + 80, py + 82, "CAPTAIN'S LOG", INK, 62, { role: "title", align: "center" });
  drawText(g, px + pw / 2 + 80, py + 134, "SHIPS SUNK THIS PATROL", INK_FAINT, 26, { role: "body", align: "center" });
  g.line(px + 100, py + 170, px + pw - 40, py + 170, INK, 2.5);
  g.line(px + 100, py + 176, px + pw - 40, py + 176, INK, 1);
  // the entries: 37 characters on a grid of 24 x 40 units, which is also the spacing of the ruled lines (each line under a row of type)
  const grid: TextGrid = { x: px + 100, y: py + 190, cellWidth: 24, cellHeight: 40 };
  const { rows, totals } = ledgerLines(view);
  drawGridText(g, grid, 1, 0.5, "NAME", INK_FAINT, { size: 26 });
  drawGridText(g, grid, 16, 0.5, "TONNAGE", INK_FAINT, { size: 26 });
  drawGridText(g, grid, 28, 0.5, "DATE SUNK", INK_FAINT, { size: 26 });
  rows.forEach((line, i) => drawGridText(g, grid, 1, 1.5 + i, line, INK, { size: 38 }));
  if (rows.length === 0) drawGridText(g, grid, 1, 2, "NO SHIPS SUNK YET", INK_FAINT, { size: 38 });
  // the totals under a double rule
  const ty = py + 190 + 421;
  g.line(px + 100, ty - 10, px + pw - 40, ty - 10, INK, 2.5);
  totals.forEach((line, i) => drawGridText(g, { ...grid, y: ty }, 1, 1 + i * 1, line, INK, { size: 38, bold: true }));
}
