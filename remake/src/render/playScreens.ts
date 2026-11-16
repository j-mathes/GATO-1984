import {
  COMPARTMENT,
  DEPTH,
  ENGINE,
  SCOPE_OFFSET,
  SLOT,
  TYPE,
  WORLD,
  apparentSize,
  compassDegrees,
  inScopeWindow,
  quadrantOf,
  scopeScreenX,
  scopeUsable,
  RADIO_MESSAGES,
  type GameSettings,
  type RadioView,
  type Simulation,
} from "../core/index.js";
import type { LogStore } from "../app/logStore.js";
import type { Snapshot } from "../app/runner.js";
import { drawExplosion, SCOPE_HORIZON_Y } from "./explosions.js";
import { COLORS, Gfx, LOGICAL_WIDTH } from "./gfx.js";
import type { SpriteLibrary } from "./sprites.js";

export interface PlayView {
  sim: Simulation;
  /** Interpolated positions of the current frame. */
  snap: Snapshot;
  settings: GameSettings;
  sprites: SpriteLibrary | null;
  log: LogStore;
  /** performance.now() in milliseconds, for animation only. */
  timeMs: number;
}

const COMPARTMENT_BOXES: { id: number; name: string; col: number; row: number }[] = [
  { id: COMPARTMENT.controlRoom, name: "CONTROL RM", col: 7, row: 16 },
  { id: COMPARTMENT.conningTower, name: "CONNING TOWER", col: 25, row: 16 },
  { id: COMPARTMENT.engineRoom, name: "ENGINE RM", col: 7, row: 18 },
  { id: COMPARTMENT.periscopes, name: "PERISCOPES", col: 25, row: 18 },
  { id: COMPARTMENT.batteryRoom, name: "BATTERY RM", col: 7, row: 20 },
  { id: COMPARTMENT.fuelTanks, name: "FUEL TANKS", col: 25, row: 20 },
  { id: COMPARTMENT.torpedoRoom, name: "TORPEDO RM", col: 7, row: 22 },
  { id: COMPARTMENT.radioRoom, name: "RADIO RM", col: 25, row: 22 },
];

export const COMPARTMENT_NAMES: Record<number, string> = Object.fromEntries(COMPARTMENT_BOXES.map((b) => [b.id, b.name]));

// --------------------------------------------------------------------------------------------------------------------
// Live contact geometry from the interpolated snapshot (the simulation's own values are only updated at 10 Hz)
// --------------------------------------------------------------------------------------------------------------------

export interface LiveContact {
  slot: number;
  typeCode: number;
  distance: number;
  /** Bearing relative to the bow, 0..2pi, counter-clockwise (the original's convention). */
  relative: number;
  size: number;
  frame: number;
  x: number;
  y: number;
}

export function liveContacts(view: PlayView): LiveContact[] {
  const { sim, snap } = view;
  const out: LiveContact[] = [];
  for (const v of sim.vessels) {
    if (v.slot < SLOT.island || v.typeCode === 0) continue;
    const p = snap.vessels.find((s) => s.slot === v.slot);
    const x = v.slot === SLOT.island ? v.x : (p?.x ?? v.x);
    const y = v.slot === SLOT.island ? v.y : (p?.y ?? v.y);
    const dx = x - snap.sub.x;
    const dy = y - snap.sub.y;
    const distance = Math.hypot(dx, dy);
    let bearing = dx === 0 ? Math.sign(dy) * 1.5708 : Math.atan(dy / dx);
    if (dx < 0) bearing += 3.1416;
    while (bearing < 0) bearing += 6.2832;
    let relative = bearing - snap.sub.heading;
    while (relative < 0) relative += 6.2832;
    while (relative >= 6.2832) relative -= 6.2832;
    let frame = Math.round((bearing - (p?.heading ?? v.heading)) * 2.55);
    frame = ((frame % 16) + 16) % 16;
    const island = v.slot === SLOT.island;
    const size = island
      ? -1.5 + 3000 / (90 + (distance - (sim.scenario.islands[sim.currentQuadrant]?.innerRadius ?? 0)))
      : apparentSize(v.typeCode, distance);
    out.push({ slot: v.slot, typeCode: v.typeCode, distance, relative, size, frame, x, y });
  }
  return out;
}

// --------------------------------------------------------------------------------------------------------------------
// Control room
// --------------------------------------------------------------------------------------------------------------------

function dial(g: Gfx, cx: number, cy: number, angle: number, color: string, fromMath: boolean): void {
  g.ellipse(cx, cy, 26, 22, COLORS.grey);
  for (let i = 0; i < 12; i += 1) {
    const a = (i / 12) * Math.PI * 2;
    g.line(cx + Math.sin(a) * 23, cy - Math.cos(a) * 19.5, cx + Math.sin(a) * 26, cy - Math.cos(a) * 22, COLORS.grey);
  }
  const nx = fromMath ? cx + Math.cos(angle) * 26 : cx + Math.sin(angle) * 26;
  const ny = fromMath ? cy - Math.sin(angle) * 22 : cy - Math.cos(angle) * 22;
  g.line(cx, cy, nx, ny, color);
  g.circle(cx, cy, 1.5, color, true);
}

export function drawControlRoom(g: Gfx, v: PlayView): void {
  const { sim, snap } = v;
  const sub = sim.sub;
  g.clear();
  drawScope(g, v);
  // facing selector
  (["F", "P", "A", "S"] as const).forEach((f, i) => g.text(2 + i * 2, 13, f, sub.scopeFacing === f ? COLORS.yellow : COLORS.grey));
  g.text(11, 13, sub.periscopeUp ? "PERISCOPE UP" : "PERISCOPE DOWN", COLORS.grey);
  // dials: depth, speed, heading (needle formulas from Gato1.exe 0x0441b-0x044ec; centres moved up to fit the labels)
  dial(g, 36, 128, snap.sub.depth * 0.0157, COLORS.green, false);
  dial(g, 103, 128, snap.sub.speed * 0.31, COLORS.green, false);
  dial(g, 170, 128, snap.sub.heading, COLORS.green, true);
  g.text(3, 20, "DEPTH", COLORS.grey);
  g.text(11, 20, "SPEED", COLORS.grey);
  g.text(19, 20, "HEADING", COLORS.grey);
  g.text(3, 22, String(Math.round(snap.sub.depth)).padStart(4), COLORS.white);
  g.text(11, 22, snap.sub.speed.toFixed(1).padStart(5), COLORS.white);
  g.text(19, 22, String(compassDegrees(snap.sub.heading)).padStart(3, "0"), COLORS.white);
  // right panel
  const diesel = sub.engine === ENGINE.diesel;
  g.text(27, 14, "FUEL", COLORS.grey);
  g.text(32, 14, String(Math.round(sub.fuel / 90)).padStart(4), sub.fuelAlert ? COLORS.red : COLORS.white);
  g.text(27, 16, "BATT", COLORS.grey);
  g.text(32, 16, String(Math.round(sub.battery)).padStart(4), sub.batteryAlert ? COLORS.red : COLORS.white);
  g.text(27, 18, diesel && sub.battery < 1000 ? "CHARGING" : sub.engine === ENGINE.off ? "ENGINES OFF" : diesel ? "DIESEL" : "ELECTRIC", COLORS.yellow);
  g.text(27, 20, "O2", COLORS.grey);
  g.text(32, 20, String(Math.round(sub.oxygen)).padStart(4), sub.oxygen < 300 ? COLORS.red : COLORS.white);
  g.text(27, 22, "TORPEDOES", COLORS.grey);
  g.text(37, 22, String(sub.torpedoes).padStart(2), COLORS.white);
  for (let i = 1; i <= 4; i += 1) {
    const t = sim.torpedoes[i];
    g.rect(215 + i * 10, 176, 8, 4, t && t.speed > 0 ? COLORS.red : COLORS.green);
  }
  g.text(27, 24, sub.doorsOpen ? "DOORS OPEN" : "DOORS SHUT", sub.doorsOpen ? COLORS.red : COLORS.grey);
  const damaged = sub.damage.reduce((a, b) => a + b, 0);
  if (damaged > 0) g.text(3, 24, `DAMAGE ${damaged}`, COLORS.red);
  if (sim.status !== "running") return;
}

function drawScope(g: Gfx, v: PlayView): void {
  const { sim } = v;
  const sub = sim.sub;
  const day = v.settings.timeOfDay === 1;
  g.rect(0, 0, LOGICAL_WIDTH, 96, COLORS.black);
  g.rect(0, 0, LOGICAL_WIDTH, 96, COLORS.grey, false);
  if (!scopeUsable(sub)) {
    const damagedScope = sub.periscopeUp && (sub.damage[COMPARTMENT.periscopes] ?? 0) !== 0;
    g.centered(7, damagedScope ? "PERISCOPE DAMAGED" : "NO VIEW - PERISCOPE DOWN", COLORS.grey);
    return;
  }
  g.clip(1, 1, LOGICAL_WIDTH - 2, 94);
  if (day) {
    g.rect(1, 1, LOGICAL_WIDTH - 2, 63, COLORS.cyan);
    g.rect(1, 64, LOGICAL_WIDTH - 2, 31, COLORS.blue);
  } else g.line(1, 64, LOGICAL_WIDTH - 1, 64, COLORS.grey);
  drawScopeContacts(g, v, day, 68, SCOPE_HORIZON_Y);
  g.unclip();
}

/** Ships in the scope window, then the explosions of core/explosion.ts (the sunk ship stays drawn until its spikes are erased). */
export function drawScopeContacts(g: Gfx, v: PlayView, day: boolean, baseline: number, horizon: number, palette?: readonly string[]): void {
  const { sim } = v;
  const sub = sim.sub;
  const contacts = liveContacts(v)
    .filter((c) => c.size >= 0.5 && c.distance <= 4000 && inScopeWindow(c.relative, sub.scopeFacing))
    .sort((a, b) => b.distance - a.distance);
  const outline = palette ? ((day ? palette[0] : palette[3]) as string) : undefined;
  for (const c of contacts) {
    const vessel = sim.vessels[c.slot];
    if (!vessel || vessel.sunk) continue;
    let a = c.relative - SCOPE_OFFSET[sub.scopeFacing];
    while (a < 0) a += 6.2832;
    // screen x of the original (0x06ccd): 160 - SIN(a) * (227 + size * (0.5 + |SIN(frame*0.393)| * 1.5) * facingSign)
    const x = scopeScreenX(a, c.size, c.frame, sub.scopeFacing);
    drawContact(g, v, c, x, baseline, day, outline);
  }
  for (const ex of sim.explosions) {
    if (ex.shipVisible && !ex.plan.survived) {
      const ghost: LiveContact = { slot: 0, typeCode: ex.plan.typeCode, distance: 0, relative: 0, size: ex.plan.drawnSize, frame: ex.plan.frame, x: 0, y: 0 };
      drawContact(g, v, ghost, ex.plan.x, baseline, day, outline);
    }
    drawExplosion(g, ex, day, horizon, palette);
  }
}

export function drawContact(g: Gfx, v: PlayView, c: LiveContact, x: number, y: number, day: boolean, outline?: string): void {
  const scale = Math.max(c.size / 4, 0.1);
  if (c.slot === SLOT.island) {
    const shape = v.sim.scenario.islands[v.sim.currentQuadrant]?.shape ?? 1;
    const img = v.sprites?.islandPicture(shape);
    if (img) g.image(img, 0, 0, img.width, img.height, x - (img.width * scale) / 2, y - img.height * scale, img.width * scale, img.height * scale);
    return;
  }
  // with a screen palette the ships are line art in the DRAW colour (colour 0 by day, as in the original screenshots)
  const sprite = v.sprites?.ship(c.typeCode, c.frame, outline !== undefined || !day);
  if (sprite) {
    const f = sprite.frame;
    const src = outline !== undefined && v.sprites ? v.sprites.tint(sprite.img, outline) : sprite.img;
    g.image(src, f.cell.x, f.cell.y, f.cell.w, f.cell.h, x - (f.origin.x - f.cell.x) * scale, y - (f.origin.y - f.cell.y) * scale, f.cell.w * scale, f.cell.h * scale);
  } else g.rect(x - 4, y - 4, 8, 4, day ? COLORS.black : COLORS.white);
}

// --------------------------------------------------------------------------------------------------------------------
// Radar (F6), chart (C), quadrant map (Q)
// --------------------------------------------------------------------------------------------------------------------

const slotColor = (typeCode: number): string => (typeCode === TYPE.subtender ? COLORS.green : typeCode === TYPE.island ? COLORS.brown : COLORS.red);

export function drawRadar(g: Gfx, v: PlayView): void {
  const { sim, snap } = v;
  g.clear();
  g.circle(111, 100, 89, COLORS.green);
  g.circle(111, 100, 44, COLORS.green);
  g.line(22, 100, 200, 100, COLORS.green);
  g.line(111, 11, 111, 189, COLORS.green);
  const sweep = ((v.timeMs / 1000) * 1.2) % (Math.PI * 2);
  g.line(111, 100, 111 + Math.cos(sweep) * 89, 100 - Math.sin(sweep) * 89, COLORS.green);
  g.circle(111, 100, 2, COLORS.green, true);
  if (sim.sub.depth > DEPTH.periscopeMax) {
    g.text(8, 12, "RADAR UNUSABLE", COLORS.red);
    g.text(8, 14, "COME TO PERISCOPE DEPTH", COLORS.red);
  } else {
    // blips from the interpolated snapshot, same formula as core radarContacts
    for (const c of liveContacts(v)) {
      if (c.distance >= 1350) continue;
      const bx = 111 - Math.sin(c.relative) * c.distance * 0.065;
      const by = 100 - Math.cos(c.relative) * c.distance * 0.065;
      g.circle(bx, by, c.slot === SLOT.island ? 4 : 2.5, slotColor(c.typeCode), true);
    }
  }
  g.text(30, 7, "HEADING", COLORS.grey);
  g.text(30, 8, String(compassDegrees(snap.sub.heading)).padStart(3, "0"), COLORS.white);
  g.text(30, 12, "SPEED", COLORS.grey);
  g.text(30, 13, sim.sub.speed.toFixed(0).padStart(3), COLORS.white);
  g.text(30, 17, "DEPTH", COLORS.grey);
  g.text(30, 18, String(Math.round(sim.sub.depth)).padStart(3), COLORS.white);
}

export function drawChart(g: Gfx, v: PlayView): void {
  const { sim, snap, settings } = v;
  const sx = 0.0096;
  const ox = 40;
  const oy = 2;
  g.clear();
  const px = (x: number): number => ox + x * sx;
  const py = (y: number): number => oy + (WORLD.maxY + 1 - y) * sx;
  g.rect(ox, oy, 25000 * sx, 20000 * sx, COLORS.grey, false);
  for (let c = 1; c < WORLD.columns; c += 1) g.line(px(c * 5000), oy, px(c * 5000), oy + 20000 * sx, COLORS.grey);
  for (let r = 1; r < WORLD.rows; r += 1) g.line(ox, py(r * 5000), ox + 25000 * sx, py(r * 5000), COLORS.grey);
  for (let q = 1; q <= 20; q += 1) {
    const col = (q - 1) % 5;
    const row = Math.floor((q - 1) / 5);
    g.textAt(px(col * 5000) + 2, py(row * 5000 + 5000) + 2, String(q), COLORS.grey);
    const island = sim.scenario.islands[q];
    if (island?.present) g.circle(px(island.x), py(island.y), Math.max(island.innerRadius * sx, 1.5), COLORS.brown, true);
  }
  if (settings.difficulty <= 2) {
    for (const s of snap.vessels) {
      const vessel = sim.vessels[s.slot];
      if (!vessel || s.slot === SLOT.island || vessel.sunk) continue;
      g.circle(px(s.x), py(s.y), 1.5, slotColor(vessel.typeCode), true);
    }
  }
  g.circle(px(snap.sub.x), py(snap.sub.y), 2, COLORS.green, true);
  g.text(2, 25, `QUADRANT ${sim.currentQuadrant}`, COLORS.grey);
  g.text(21, 25, "RED ENEMY  GREEN YOU", COLORS.grey);
}

export function drawQuadrantMap(g: Gfx, v: PlayView): void {
  const { sim, snap, settings } = v;
  const q = sim.currentQuadrant;
  const qx = ((q - 1) % 5) * 5000;
  const qy = Math.floor((q - 1) / 5) * 5000;
  g.clear();
  const px = (x: number): number => (x - qx) * 0.0638;
  const py = (y: number): number => 199 - (y - qy) * 0.0398;
  g.rect(0, 0, 320, 200, COLORS.grey, false);
  const island = sim.scenario.islands[q];
  if (island?.present) {
    g.ellipse(px(island.x), py(island.y), island.innerRadius * 0.0638, island.innerRadius * 0.0398 * 1.0, COLORS.brown);
    g.ellipse(px(island.x), py(island.y), island.outerRadius * 0.0638, island.outerRadius * 0.0398, COLORS.red, true);
  }
  if (settings.difficulty <= 5) {
    for (const s of snap.vessels) {
      const vessel = sim.vessels[s.slot];
      if (!vessel || s.slot === SLOT.island || vessel.sunk) continue;
      if (quadrantOf(s.x, s.y) === q) g.circle(px(s.x), py(s.y), 2, slotColor(vessel.typeCode), true);
    }
  }
  g.circle(px(snap.sub.x), py(snap.sub.y), 2.5, COLORS.green, true);
  g.text(2, 2, `QUADRANT ${q}`, COLORS.grey);
}

// --------------------------------------------------------------------------------------------------------------------
// Damage report (R), captain's log (L)
// --------------------------------------------------------------------------------------------------------------------

export function drawDamageReport(g: Gfx, v: PlayView): void {
  g.clear();
  g.centered(2, "DAMAGE REPORT", COLORS.white);
  const sub = v.sim.sub;
  COMPARTMENT_BOXES.forEach((b, i) => {
    const row = 5 + Math.floor(i / 2) * 3;
    const col = i % 2 === 0 ? 4 : 22;
    const bad = (sub.damage[b.id] ?? 0) > 0;
    g.rect((col - 1) * 8, (row - 1) * 8 - 2, 16 * 8, 20, bad ? COLORS.red : COLORS.green, false);
    g.text(col + 1, row, b.name, bad ? COLORS.red : COLORS.green);
    if (bad) g.text(col + 1, row + 1, "DAMAGED", COLORS.red);
  });
  g.centered(21, "AN AREA THAT IS DAMAGED CANNOT BE USED", COLORS.grey);
  g.centered(22, "REPAIRS ARE MADE BY THE SUBTENDER", COLORS.grey);
  g.centered(24, "(M = CONTROL ROOM)", COLORS.grey);
}

export function drawCaptainsLog(g: Gfx, v: PlayView): void {
  g.clear();
  g.centered(1, "CAPTAIN'S LOG", COLORS.white);
  g.text(2, 3, "SHIP          TONNAGE       DATE SUNK", COLORS.grey);
  g.text(2, 4, "_".repeat(37), COLORS.grey);
  const entries = v.log.entries().slice(-15);
  entries.forEach((e, i) => {
    g.text(2, 5 + i, e.name.padEnd(14) + String(e.tonnage).padStart(6).padEnd(14) + e.dateSunk, COLORS.green);
  });
  g.text(2, 21, `SHIPS SUNK       ${String(v.log.shipsSunk).padStart(6)}`, COLORS.grey);
  g.text(2, 22, `TOTAL TONNAGE    ${String(v.log.totalTonnage).padStart(6)}`, COLORS.grey);
  g.text(2, 23, `MISSIONS COMPLETED ${String(v.log.missionsCompleted).padStart(4)}`, COLORS.grey);
  g.centered(25, "(M = CONTROL ROOM)", COLORS.grey);
}

// --------------------------------------------------------------------------------------------------------------------
// GAME CONTROL, prompts, end of mission
// --------------------------------------------------------------------------------------------------------------------

export function drawGameControl(g: Gfx, settings: GameSettings, prompt: string | null, entry: string, showMission = true): void {
  g.clear();
  g.centered(3, "GAME CONTROL", COLORS.white);
  g.text(6, 7, "[1] DIFFICULTY LEVEL", COLORS.grey);
  g.text(35, 7, String(settings.difficulty), COLORS.yellow);
  g.text(6, 9, "[2] SOUND", COLORS.grey);
  g.text(35, 9, settings.sound ? "1" : "0", COLORS.yellow);
  g.text(6, 11, "[3] TIME OF DAY", COLORS.grey);
  g.text(35, 11, settings.timeOfDay === 1 ? "1" : "0", COLORS.yellow);
  g.text(6, 13, "[4] RESET CAPTAIN'S LOG", COLORS.grey);
  if (showMission) {
    g.text(6, 15, "[5] NEXT MISSION", COLORS.grey);
    g.text(35, 15, settings.mission ? String(settings.mission) : "RANDOM", COLORS.yellow);
    g.text(6, 17, "[6] TIME COMPRESSION", COLORS.grey);
    g.text(35, 17, `${settings.timeScale ?? 1}X`, COLORS.yellow);
  }
  if (prompt) {
    g.text(7, 20, `${prompt} ${entry}_`, COLORS.white);
  } else {
    g.text(7, 20, "NUMBER OF ITEM TO CHANGE", COLORS.white);
    g.text(9, 24, "(Press RETURN to continue)", COLORS.grey);
  }
}

export function drawPrompt(g: Gfx, lines: string[], entry: string): void {
  g.rect(16, 70, 288, 24 + lines.length * 8, COLORS.black);
  g.rect(16, 70, 288, 24 + lines.length * 8, COLORS.white, false);
  lines.forEach((l, i) => g.text(4, 10 + i, l, COLORS.white));
  g.text(4, 10 + lines.length, `${entry}_`, COLORS.yellow);
}

export function drawEnd(g: Gfx, status: Simulation["status"], completedBy: Simulation["completedBy"] = null): void {
  g.rect(24, 70, 272, 56, COLORS.black);
  g.rect(24, 70, 272, 56, COLORS.white, false);
  const text =
    status === "missionComplete"
      ? (completedBy === "island" ? ["CONTACT MADE", "MISSION COMPLETED"] : RADIO_MESSAGES.convoyDestroyed.lines.map((l) => l.text.trim()))
      : status === "suffocated"
        ? RADIO_MESSAGES.oxygenExhausted.lines.map((l) => l.text)
        : ["YOUR SUBMARINE HAS BEEN LOST"];
  text.forEach((t, i) => g.centered(10 + i, t, status === "missionComplete" ? COLORS.green : COLORS.red));
  g.centered(13, "DO YOU WANT DO PLAY AGAIN? (Y/N)", COLORS.white);
}

/** A radio/status message over the control room: the original's black box (BF, colour 0) with the text on its LOCATE cells. */
export function drawRadioMessage(g: Gfx, view: RadioView): void {
  const b = view.box;
  if (b) g.rect(b.x0, b.y0, b.x1 - b.x0 + 1, b.y1 - b.y0 + 1, COLORS.black);
  for (const l of view.lines) g.text(l.col, l.row, l.text, COLORS.white);
}
