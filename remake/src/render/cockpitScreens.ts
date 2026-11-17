import { COMPARTMENT, ENGINE, SLOT, compassDegrees, quadrantOf, scopeUsable } from "../core/index.js";
import type { CockpitLayouts, ScreenName } from "./cockpitLayouts.js";
import { LOGICAL_HEIGHT, LOGICAL_WIDTH, Gfx } from "./gfx.js";
import { drawScopeContacts, type PlayView } from "./playScreens.js";
import type { TrailBuffer } from "./trails.js";

/**
 * Screens drawn from the layouts extracted out of GATO1.EXE (analysis/export_cockpit_layouts.py): the static picture of each screen is
 * blitted as is, text goes on the original LOCATE cells and only what moves (needles, values, lights, tubes, blips) is drawn here, at the
 * coordinates and with the formulas read from the p-code.
 */

/** Draw the non-zero pixels of a bitmap of palette indices; `color` overrides the palette (used for XOR-coloured digits). */
export function drawBitmap(g: Gfx, x: number, y: number, rows: readonly string[], palette: readonly string[], color?: string): void {
  rows.forEach((row, dy) => {
    let dx = 0;
    while (dx < row.length) {
      const v = row.charAt(dx);
      if (v === "0") {
        dx += 1;
        continue;
      }
      let end = dx + 1;
      while (end < row.length && row.charAt(end) === v) end += 1;
      g.rect(x + dx, y + dy, end - dx, 1, color ?? (palette[Number(v)] as string));
      dx = end;
    }
  });
}

/** LINE as the runtime plots it (0x2c0e): major-axis DDA with the error seeded to major/2, one pixel per step, no anti-aliasing. */
export function drawLinePx(g: Gfx, x0: number, y0: number, x1: number, y1: number, color: string): void {
  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = x1 >= x0 ? 1 : -1;
  const sy = y1 >= y0 ? 1 : -1;
  const horizontal = dx >= dy;
  const major = horizontal ? dx : dy;
  const minor = horizontal ? dy : dx;
  let err = major >> 1;
  let x = x0;
  let y = y0;
  for (let i = 0; i <= major; i += 1) {
    g.rect(x, y, 1, 1, color);
    err += minor;
    if (err >= major) {
      err -= major;
      if (horizontal) y += sy;
      else x += sx;
    }
    if (horizontal) x += sx;
    else y += sy;
  }
}

function blit(g: Gfx, L: CockpitLayouts, name: ScreenName): string[] {
  const screen = L.screen(name);
  g.clear(screen.palette[0]);
  g.image(L.image(name), 0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT, 0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
  for (const t of screen.text) g.text(t.col, t.row, t.text, screen.palette[3]);
  return screen.palette;
}

/** Horizon row of the scope picture (ds:0x2152, 0x04aa3-0x04b11): 79 - 4 * depth, 79 with the periscope up above depth 46, -1 below the top. */
export function scopeHorizon(sub: { depth: number; periscopeUp: boolean }): number {
  let h = Math.round(79 - sub.depth * 4);
  if (sub.periscopeUp && sub.depth < 46) h = 79;
  return h < 0 ? -1 : h;
}

const pad = (n: number, width: number): string => String(Math.round(n)).padStart(width);

// --------------------------------------------------------------------------------------------------------------------
// Control room (0x042a8-0x05077)
// --------------------------------------------------------------------------------------------------------------------

/** `withScope` false leaves the scope window to the caller (the enhanced control room draws its own). */
export function drawControlRoomLayout(g: Gfx, v: PlayView, L: CockpitLayouts, withScope = true): void {
  const { sim, snap } = v;
  const sub = sim.sub;
  const pal = blit(g, L, "control_room");
  const day = v.settings.timeOfDay === 1;

  // scope picture: sky colour = time of day, sea colour 2, horizon from the depth; a damaged raised periscope shows a black frame (0x05187)
  const horizon = scopeHorizon(sub);
  const damagedScope = sub.periscopeUp && sub.depth < 46 && (sub.damage[COMPARTMENT.periscopes] ?? 0) !== 0;
  if (!withScope) {
    // drawn by the caller
  } else if (damagedScope) {
    g.rect(1, 1, 318, 96, pal[0] as string);
    g.rect(0, 0, LOGICAL_WIDTH, 98, pal[3] as string, false);
  } else {
    if (horizon >= 0) g.rect(0, 0, LOGICAL_WIDTH, horizon + 1, (day ? pal[1] : pal[0]) as string);
    g.rect(0, horizon + 1, LOGICAL_WIDTH, 98 - (horizon + 1), pal[2] as string);
    if (scopeUsable(sub)) {
      g.clip(0, 0, LOGICAL_WIDTH, 98);
      drawScopeContacts(g, v, day, horizon, horizon, pal);
      g.unclip();
    }
  }

  // needles (0x0441b-0x0458d) and their hubs (static)
  const needle = (cx: number, cy: number, x: number, y: number): void => drawLinePx(g, cx, cy, Math.round(x), Math.round(y), pal[3] as string);
  needle(36, 135, 36 + Math.sin(snap.sub.depth * 0.0157) * 26, 135 - Math.cos(snap.sub.depth * 0.0157) * 22);
  needle(103, 135, 103 + Math.sin(snap.sub.speed * 0.31) * 26, 135 - Math.cos(snap.sub.speed * 0.31) * 22);
  needle(170, 135, 170 + Math.cos(snap.sub.heading) * 26, 135 - Math.sin(snap.sub.heading) * 22);

  // values
  g.text(32, 14, pad(sub.fuel / 90, 4), pal[3] as string);
  g.text(32, 16, pad(sub.battery, 4), pal[3] as string);
  g.text(30, 22, pad(sub.torpedoes, 2), pal[3] as string);

  // lights: PUT lightOn over the empty ring
  const on = L.doc.sprites.lightOn;
  const diesel = sub.engine === ENGINE.diesel;
  const damaged = sub.damage.some((d) => d > 0);
  const lights: [number, number, boolean][] = [
    [283, 101, sub.fuelAlert],
    [283, 117, sub.batteryAlert],
    [283, 133, diesel && sub.battery < 1000],
    [213, 165, sub.doorsOpen],
    [194, 181, damaged],
  ];
  for (const [x, y, lit] of lights) if (lit) drawBitmap(g, x, y, on, pal);

  // oxygen marker
  const mark = L.doc.glyphs.marker;
  drawBitmap(g, 300 + mark.offset[0], 174 - Math.round(sub.oxygen * 0.043) + mark.offset[1], mark.rows, pal);

  // torpedo tubes: ready box (magenta) and the digit, XOR-coloured (white on magenta, cyan on black)
  for (let i = 1; i <= 4; i += 1) {
    const t = sim.torpedoes[i];
    const ready = 4 - i < sub.torpedoes && !!t && t.speed === 0;
    const x = 244 + 10 * i;
    if (ready) drawBitmap(g, x, 168, L.doc.sprites.tubeReady, pal);
    const dx = [256, 266, 275, 284][i - 1] as number;
    drawBitmap(g, dx, 169, L.doc.sprites.digits[i] as string[], pal, (ready ? pal[3] : pal[1]) as string);
  }

  // engine mode (PUT of the printed text: DIESEL normal, ELEC and OFF inverted)
  const mode = diesel ? "DIESEL" : sub.engine === ENGINE.electric ? " ELEC " : "  OFF ";
  if (diesel) g.text(9, 24, mode, pal[3] as string);
  else {
    g.rect(63, 183, 49, 9, pal[3] as string);
    g.text(9, 24, mode, pal[0] as string);
  }

  // scope facing arrow (CHR$(24..27) PUT at 0x04347-0x043e0)
  const arrow = L.doc.glyphs.scopeArrows[sub.scopeFacing];
  drawBitmap(g, arrow.put[0], arrow.put[1], arrow.rows, pal);
}

// --------------------------------------------------------------------------------------------------------------------
// Damage report (0x0a307-0x0a7b8)
// --------------------------------------------------------------------------------------------------------------------

export function drawDamageLayout(g: Gfx, v: PlayView, L: CockpitLayouts): void {
  const sub = v.sim.sub;
  const pal = blit(g, L, "damage_report");
  const overlays = L.screen("damage_report").dynamic.overlays as Record<string, { pixels: [number, number][]; light: [number, number] }>;
  for (const [k, o] of Object.entries(overlays)) {
    if ((sub.damage[Number(k)] ?? 0) <= 0) continue;
    for (const [x, y] of o.pixels) g.rect(x, y, 1, 1, pal[2] as string);
    drawBitmap(g, o.light[0], o.light[1], L.doc.sprites.lightOn, pal);
  }
}

// --------------------------------------------------------------------------------------------------------------------
// Radar (0x09ce2-0x0a2df)
// --------------------------------------------------------------------------------------------------------------------

/** A dot on a track screen: drawn now and, while the buffer is recording, remembered as a persistent track dot. */
function dot(g: Gfx, trail: TrailBuffer | undefined, pal: readonly string[], x: number, y: number, w: number, h: number, index: number): void {
  g.rect(x, y, w, h, pal[index] as string);
  trail?.mark(x, y, w, h, index);
}

export function drawRadarLayout(g: Gfx, v: PlayView, L: CockpitLayouts, contacts: { relative: number; distance: number; slot: number }[], trail?: TrailBuffer): void {
  const { sim, snap } = v;
  const pal = blit(g, L, "radar");
  g.text(32, 5, String(compassDegrees(snap.sub.heading)).padStart(3, "0"), pal[3] as string);
  g.text(32, 10, pad(sim.sub.speed, 3), pal[3] as string);
  g.text(32, 15, pad(Math.trunc(sim.sub.depth), 3), pal[3] as string);
  g.text(34, 21, ` ${sim.sub.torpedoes}`, pal[3] as string); // BASIC prints a positive number with a leading space: the digits start in column 35, inside the box
  if (sim.sub.depth > 45) return; // the sweep and the blips are only drawn at periscope depth
  trail?.draw(g, pal);
  const a = ((v.timeMs / 1000) * 1.2) % (Math.PI * 2);
  drawLinePx(g, 111, 100, Math.round(111 + Math.cos(a) * 99), Math.round(100 + Math.sin(a) * 89), pal[2] as string);
  for (const c of contacts) {
    if (c.distance >= 1350) continue;
    const x = Math.round(111 - Math.sin(c.relative) * c.distance * 0.065);
    const y = Math.round(100 - Math.cos(c.relative) * c.distance * 0.065);
    if (c.slot === SLOT.island) {
      const r = 3 + 1200 / Math.max(c.distance, 1);
      g.ellipse(x, y, r, r * 0.9, pal[2] as string);
    } else dot(g, trail, pal, x - 1, y - 1, 2, 2, 2);
  }
}

// --------------------------------------------------------------------------------------------------------------------
// Chart (0x0b169-0x0b4a3), quadrant map (0x0c7d8-0x0cd0c)
// --------------------------------------------------------------------------------------------------------------------

export function drawChartLayout(g: Gfx, v: PlayView, L: CockpitLayouts, trail?: TrailBuffer): void {
  const { sim, snap, settings } = v;
  const pal = blit(g, L, "chart");
  trail?.draw(g, pal);
  const px = (x: number): number => Math.round(x * 0.01252);
  const py = (y: number): number => Math.round(196 - y * 0.009650499);
  if (settings.difficulty <= 2) {
    for (const s of snap.vessels) {
      const vessel = sim.vessels[s.slot];
      if (!vessel || s.slot === SLOT.island || vessel.sunk) continue;
      dot(g, trail, pal, px(s.x) - 1, py(s.y) - 1, 2, 2, s.slot === SLOT.tender ? 0 : 2);
    }
  }
  dot(g, trail, pal, px(snap.sub.x) - 1, py(snap.sub.y) - 1, 2, 2, 0);
}

export function drawQuadrantLayout(g: Gfx, v: PlayView, L: CockpitLayouts, trail?: TrailBuffer): void {
  const { sim, snap, settings } = v;
  const pal = blit(g, L, "quadrant_map");
  trail?.draw(g, pal);
  const q = sim.currentQuadrant;
  const px = (x: number): number => (x % 5000) * 0.0638;
  const py = (y: number): number => 199 - (y % 5000) * 0.0398;
  const island = sim.scenario.islands[q];
  if (island?.present) {
    // island picture (DRAW at S=scale, PAINT colour 1 border 3) and the dotted ring of 40 points (0x0c9b2-0x0ca90)
    const ix = Math.round(px(island.x));
    const iy = Math.round(py(island.y));
    const pic = (L.screen("quadrant_map").dynamic.islands as Record<string, { offset: [number, number]; rows: string[] }>)[`${island.shape}_${island.drawScale}`];
    if (pic) drawBitmap(g, ix + pic.offset[0], iy + pic.offset[1], pic.rows, pal);
    for (let i = 1; i <= 40; i += 1) {
      const a = i * 0.1571;
      g.rect(Math.round(ix + Math.cos(a) * island.innerRadius * 0.064), Math.round(iy + Math.sin(a) * island.outerRadius * 0.04), 1, 1, pal[2] as string);
    }
  }
  if (settings.difficulty <= 5) {
    for (const s of snap.vessels) {
      const vessel = sim.vessels[s.slot];
      if (!vessel || s.slot === SLOT.island || vessel.sunk || quadrantOf(s.x, s.y) !== q) continue;
      dot(g, trail, pal, Math.round(px(s.x)) - 1, Math.round(py(s.y)) - 1, 2, 2, 2);
    }
  }
  dot(g, trail, pal, Math.round(px(snap.sub.x)) - 1, Math.round(py(snap.sub.y)) - 1, 2, 2, 1);
}

// --------------------------------------------------------------------------------------------------------------------
// Captain's log (0x0aa0f-0x0adf6)
// --------------------------------------------------------------------------------------------------------------------

export function drawLogLayout(g: Gfx, v: PlayView, L: CockpitLayouts): void {
  const pal = blit(g, L, "captains_log");
  const white = pal[3] as string;
  // lines are printed one after another from row 11 (the screen scrolls in the original; the last 9 ships fit)
  let row = 11;
  for (const e of v.log.entries().slice(-9)) {
    // name LEFT$(15), tonnage USING "######", six spaces, LEFT$(date, 6) and the literal "1943"
    g.text(1, row, e.name.slice(0, 15).padEnd(15) + String(e.tonnage).padStart(6) + "      " + e.dateSunk.slice(0, 6) + "1943", white);
    row += 1;
  }
  row += 1;
  g.text(1, row, "SHIPS SUNK      " + String(v.log.shipsSunk).padStart(6), white);
  g.text(1, row + 1, "TOTAL TONNAGE   " + String(v.log.totalTonnage).padStart(6), white);
  g.text(1, row + 3, "MISSIONS", white);
  g.text(1, row + 4, "COMPLETED       " + String(v.log.missionsCompleted).padStart(6), white);
}

/** GAME CONTROL (0x0aed9-0x0b0d4): COLOR 8,1, title at LOCATE 2,15, items from row 6 with the value at TAB(34), prompts at 13,6 / 16,6. */
export function drawGameControlLayout(g: Gfx, L: CockpitLayouts, settings: { difficulty: number; sound: boolean; timeOfDay: number; mission?: number | null; timeScale?: number }, prompt: string | null, entry: string, showMission = true, showTime = showMission, showAdvanced = showMission): void {
  const pal = L.palette("control_room");
  const white = pal[3] as string;
  g.clear(pal[0]);
  g.text(15, 2, "GAME CONTROL", white);
  g.text(6, 6, "[1] DIFFICULTY LEVEL", white);
  g.text(35, 6, String(settings.difficulty), white);
  g.text(6, 7, "[2] SOUND", white);
  g.text(35, 7, settings.sound ? "1" : "0", white);
  g.text(6, 8, "[3] TIME OF DAY", white);
  g.text(35, 8, String(settings.timeOfDay), white);
  g.text(6, 9, "[4] RESET CAPTAIN'S LOG", white);
  if (showMission) {
    g.text(6, 10, "[5] NEXT MISSION", white); // remake additions, not on the original screen
    g.text(35, 10, settings.mission ? String(settings.mission) : "RANDOM", white);
  }
  if (showTime) {
    g.text(6, 11, "[6] TIME COMPRESSION", white);
    g.text(35, 11, `${settings.timeScale ?? 1}X`, white);
  }
  if (showAdvanced) g.text(6, 12, "[7] ADVANCED OPTIONS", white);
  if (prompt) g.text(6, 16, `${prompt}? ${entry}_`, white);
  else {
    g.text(6, showAdvanced ? 14 : 13, "NUMBER OF ITEM TO CHANGE? _", white); // the original's row 13; one row lower when item 7 fills row 12, to leave a blank line
    g.text(8, 23, "(Press RETURN to continue)", white);
  }
}
