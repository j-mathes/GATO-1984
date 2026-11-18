import { SLOT, TYPE, compassDegrees, quadrantOf, worldDelta, type Simulation } from "../../core/index.js";
import type { Gfx } from "../gfx.js";
import type { PlayView } from "../playScreens.js";
import { rgba } from "./colors.js";
import { drawText } from "./typography.js";

/**
 * Ship symbols of the enhanced radar, chart and quadrant map, after the way marine navigation displays show vessels (analysis/remake_additions.md,
 * row 46): a triangle pointing along the heading while the ship is under way, a circle when it is stopped, a heading line with a turn flag,
 * a dashed velocity vector that grows with the speed, a dotted past track and a data tag.
 *
 * What the simulation has: a position, a heading, a speed in knots (the orders say "8 KNOTS" and a ship moves that many units a step), a type and a
 * damaged flag. It has no drift (a ship always moves along its heading, so the course over ground is the heading), no turn rate (it is worked out here
 * from the change of heading between steps), no names and no draught.
 */

/** A game minute is this many simulation steps (the time scale of the velocity vector and of the past track; the remake's own choice). */
export const STEPS_PER_MINUTE = 10;
/**
 * How many intervals the velocity vector spans; a key cycles them. An interval is the time between the dots of the past track behind the ship and
 * the unit the vector's length is counted in: one game minute on the radar and the quadrant map, three on the zoomed-out chart (see
 * {@link TRACK_EVERY_STEPS}, {@link CHART_TRACK_EVERY_STEPS}). So the same setting means the same number of dots' spacings on every screen, and the chart looks further ahead.
 */
export const VECTOR_INTERVALS = [3, 6, 12] as const;
export const DEFAULT_VECTOR_INTERVAL = 1;
/** The dots of the past track and the steps between them. */
export const TRACK_DOTS = 5;
export const TRACK_EVERY_STEPS = STEPS_PER_MINUTE;
/** The chart is zoomed out, so its dots are three times as far apart in time; the radar and the map use TRACK_EVERY_STEPS. The tracker keeps enough samples for it. */
export const CHART_TRACK_EVERY_STEPS = 3 * TRACK_EVERY_STEPS;
const MAX_TRACK_STRIDE = 3;
/** Below this speed (knots) a ship is stopped and drawn as a circle. */
export const STATIONARY_KNOTS = 0.5;
/** A change of heading per step above this (radians) is a turn; above SNAP it is the ship taking up a new leg, not turning. */
export const TURN_THRESHOLD = 0.004;
const HEADING_SNAP = 0.25;
/** Only at these difficulty levels, where the chart shows the ships, do the vectors, tracks and tags appear (the symbols follow today's visibility rules at every level). */
export const NAV_DETAIL_DIFFICULTY = 2;

export interface NavClass {
  label: string;
  color: string;
  warship: boolean;
}

const CLASSES: Record<number, NavClass> = {
  [TYPE.subtender]: { label: "SUB TENDER", color: "#5fe8ff", warship: false },
  [TYPE.freighter]: { label: "FREIGHTER", color: "#5fe08a", warship: false },
  [TYPE.tanker]: { label: "OIL TANKER", color: "#f0554a", warship: false },
  [TYPE.troopCarrier]: { label: "TRANSPORT", color: "#5aa9ff", warship: false },
  [TYPE.patrolBoat]: { label: "PATROL CRAFT", color: "#ffa53a", warship: true },
  [TYPE.destroyer]: { label: "DESTROYER", color: "#ffe14d", warship: true },
};

/** Colour and name of a vessel class (green cargo, red tanker, blue passenger/troop, orange patrol craft, yellow destroyer, cyan tender); null for anything else (the island). */
export function navClass(typeCode: number): NavClass | null {
  return CLASSES[typeCode] ?? null;
}

export const OWN_COLOR = "#ffffff";

// ------------------------------------------------------------------------------------------------------------------------------
// Geometry (no drawing)
// ------------------------------------------------------------------------------------------------------------------------------

export type NavPoint = readonly [number, number];

/** The triangle of a vessel under way: an isosceles triangle twice as long as it is wide, centred on its position, the apex along (dx, dy). */
export function navTriangle(x: number, y: number, dx: number, dy: number, length: number): { tip: NavPoint; left: NavPoint; right: NavPoint } {
  const half = length / 4;
  const tip: NavPoint = [x + dx * ((2 * length) / 3), y + dy * ((2 * length) / 3)];
  const bx = x - dx * (length / 3);
  const by = y - dy * (length / 3);
  return { tip, left: [bx + dy * half, by - dx * half], right: [bx - dy * half, by + dx * half] };
}

/** Whether a ship is shown as a stopped circle. */
export function isStationary(speed: number): boolean {
  return Math.abs(speed) < STATIONARY_KNOTS;
}

/** Length of the velocity vector in view units: the distance the ship covers in `steps` simulation steps at `speed` (units a step) times the scale of the screen. */
export function vectorLength(speed: number, steps: number, unitsPerWorldUnit: number): number {
  return Math.abs(speed) * steps * unitsPerWorldUnit;
}

/** Simulation steps in one interval (the spacing of the track dots and the unit of the vector's length) on a screen. */
export function intervalSteps(screen: string): number {
  return screen === "chart" ? CHART_TRACK_EVERY_STEPS : TRACK_EVERY_STEPS;
}

/** The legend of the vector on a screen, `VECTOR 18 MIN  DOTS 3 MIN`: the game minutes the vector reaches ahead and the minutes between the dots of the track behind. */
export function vectorLegend(screen: string, intervals: number): string {
  const minutes = intervalSteps(screen) / STEPS_PER_MINUTE;
  return `VECTOR ${intervals * minutes} MIN  DOTS ${minutes} MIN`;
}

/** Turn direction from the change of heading in one step: 1 = to port (left, counter-clockwise), -1 = to starboard, 0 = not turning (or a jump to a new leg). */
export function turnSign(delta: number): -1 | 0 | 1 {
  const a = Math.abs(delta);
  if (a < TURN_THRESHOLD || a > HEADING_SNAP) return 0;
  return delta > 0 ? 1 : -1;
}

/** Difference of two headings in (-PI, PI]. */
export function headingDelta(to: number, from: number): number {
  let d = to - from;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d <= -Math.PI) d += Math.PI * 2;
  return d;
}

// ------------------------------------------------------------------------------------------------------------------------------
// Which ships a screen shows, and the selection of the one with a tag
// ------------------------------------------------------------------------------------------------------------------------------

export type NavScreen = "radar" | "chart" | "quadrant";
export type NavView = Pick<PlayView, "sim" | "snap" | "settings"> & { gallery?: PlayView["gallery"] };

export interface NavShip {
  slot: number;
  typeCode: number;
  cls: NavClass;
  x: number;
  y: number;
  heading: number;
  speed: number;
  damaged: boolean;
  distance: number;
  /** Bearing from the bow of the own boat, counter-clockwise, 0..2pi (the radar's convention). */
  relative: number;
}

/**
 * A world position on the quadrant map, in the original's 320 x 200 pixels, measured from the corner of `quadrant` (1 to 20). A position past the edge
 * of the quadrant comes out past the edge of the picture, not wrapped round to the other side as `x % 5000` would put it: a velocity vector or a track
 * that crosses the edge then runs off the map and is clipped there.
 */
export function quadrantPixel(quadrant: number, x: number, y: number): NavPoint {
  const ox = ((quadrant - 1) % 5) * 5000;
  const oy = Math.floor((quadrant - 1) / 5) * 5000;
  return [(x - ox) * 0.0638, 199 - (y - oy) * 0.0398];
}

/** The radar shows contacts nearer than this (units) and only at periscope depth. */
export const RADAR_RANGE = 1350;
const PERISCOPE_DEPTH = 45;

/** Whether the vectors, tracks and tags are shown at this difficulty (the symbols themselves are shown wherever a ship is). */
export function navDetail(difficulty: number): boolean {
  return difficulty <= NAV_DETAIL_DIFFICULTY;
}

/** The ships a screen shows with the original's rules (the chart at difficulty 2 and below, the map at 5 and below and only its quadrant, the radar within range at periscope depth), nearest first. */
export function navShips(view: NavView, screen: NavScreen): NavShip[] {
  const { sim, snap, settings } = view;
  if (view.gallery) return [];
  if (screen === "chart" && settings.difficulty > 2) return [];
  if (screen === "quadrant" && settings.difficulty > 5) return [];
  if (screen === "radar" && sim.sub.depth > PERISCOPE_DEPTH) return [];
  const out: NavShip[] = [];
  for (const v of sim.vessels) {
    if (!v || v.slot < SLOT.tender || v.typeCode === 0 || v.sunk) continue;
    const cls = navClass(v.typeCode);
    if (!cls) continue;
    const p = snap.vessels.find((s) => s.slot === v.slot);
    const x = p?.x ?? v.x;
    const y = p?.y ?? v.y;
    const { dx, dy } = worldDelta(snap.sub.x, snap.sub.y, x, y, sim.options.wrapWorld);
    const distance = Math.hypot(dx, dy);
    if (screen === "radar" && distance >= RADAR_RANGE) continue;
    if (screen === "quadrant" && quadrantOf(x, y) !== quadrantOf(snap.sub.x, snap.sub.y)) continue; // the quadrant the picture shows: that of the boat as drawn
    let relative = Math.atan2(dy, dx) - snap.sub.heading;
    while (relative < 0) relative += Math.PI * 2;
    while (relative >= Math.PI * 2) relative -= Math.PI * 2;
    out.push({ slot: v.slot, typeCode: v.typeCode, cls, x, y, heading: p?.heading ?? v.heading, speed: v.speed, damaged: v.damaged, distance, relative });
  }
  return out.sort((a, b) => a.distance - b.distance);
}

/** The next ship to put a tag on, nearest first; after the farthest comes no tag, then the nearest again. `ships` is in the order of {@link navShips}. */
export function nextSelection(ships: readonly NavShip[], current: number | null): number | null {
  if (ships.length === 0) return null;
  if (current === null) return ships[0]?.slot ?? null;
  const at = ships.findIndex((s) => s.slot === current);
  if (at < 0) return ships[0]?.slot ?? null;
  return ships[at + 1]?.slot ?? null;
}

// ------------------------------------------------------------------------------------------------------------------------------
// The history of each ship: the past track and the rate of turn
// ------------------------------------------------------------------------------------------------------------------------------

/** The slot under which the own boat is kept. */
export const OWN_SLOT = 0;

interface Track {
  /** The samples, newest last; `n` counts the samples of the ship from 0, so a screen that shows every third one always picks the same ones. */
  points: { x: number; y: number; n: number }[];
  samples: number;
  heading: number;
  turn: -1 | 0 | 1;
  sampledAt: number;
}

export class ShipTracker {
  private tracks = new Map<number, Track>();
  private lastTick = -1;
  private owner: Simulation | null = null;

  /** Takes the state of every ship once per simulation step (call it every frame; it only acts when the step changed). */
  update(sim: Simulation): void {
    if (this.owner !== sim || sim.tick < this.lastTick) {
      this.tracks.clear();
      this.owner = sim;
    }
    if (sim.tick === this.lastTick) return;
    this.lastTick = sim.tick;
    const seen = new Set<number>();
    const note = (slot: number, x: number, y: number, heading: number): void => {
      seen.add(slot);
      const t = this.tracks.get(slot);
      if (!t) {
        this.tracks.set(slot, { points: [], samples: 0, heading, turn: 0, sampledAt: sim.tick });
        return;
      }
      t.turn = turnSign(headingDelta(heading, t.heading));
      t.heading = heading;
      if (sim.tick - t.sampledAt >= TRACK_EVERY_STEPS) {
        t.points.push({ x, y, n: t.samples });
        t.samples += 1;
        if (t.points.length > TRACK_DOTS * MAX_TRACK_STRIDE) t.points.shift();
        t.sampledAt = sim.tick;
      }
    };
    note(OWN_SLOT, sim.sub.x, sim.sub.y, sim.sub.heading);
    for (const v of sim.vessels) if (v && v.slot >= SLOT.tender && v.typeCode !== 0 && !v.sunk) note(v.slot, v.x, v.y, v.heading);
    for (const slot of [...this.tracks.keys()]) if (!seen.has(slot)) this.tracks.delete(slot);
  }

  /**
   * Where the ship was at the last few dots, oldest first. The ship is sampled every {@link TRACK_EVERY_STEPS} steps; a screen can ask for a dot every
   * `everySteps` steps, a multiple of that (up to {@link MAX_TRACK_STRIDE} times): it gets every second, third, ... sample, always the same ones.
   */
  trail(slot: number, everySteps: number = TRACK_EVERY_STEPS): readonly { x: number; y: number }[] {
    const stride = Math.min(Math.max(Math.round(everySteps / TRACK_EVERY_STEPS), 1), MAX_TRACK_STRIDE);
    const points = this.tracks.get(slot)?.points ?? [];
    return points.filter((p) => p.n % stride === 0).slice(-TRACK_DOTS);
  }

  /** 1 = turning to port, -1 = to starboard, 0 = on its course. */
  turn(slot: number): -1 | 0 | 1 {
    return this.tracks.get(slot)?.turn ?? 0;
  }

  clear(): void {
    this.tracks.clear();
    this.lastTick = -1;
  }
}

/** What the scenes need to know about the navigation symbols this frame. */
export interface NavState {
  on: boolean;
  tracker: ShipTracker;
  /** Slot of the ship with a tag, or null. */
  selected: number | null;
  /** Intervals the velocity vector spans (see {@link VECTOR_INTERVALS}). */
  intervals: number;
}

// ------------------------------------------------------------------------------------------------------------------------------
// Drawing
// ------------------------------------------------------------------------------------------------------------------------------

export interface NavDraw {
  /** Position and the unit vector of the heading, in view units (y down). */
  x: number;
  y: number;
  dx: number;
  dy: number;
  color: string;
  /** Length of the triangle. */
  size: number;
  speed: number;
  damaged?: boolean;
  /** 0..1, for the contacts that fade after the radar's sweep. */
  alpha?: number;
  /** The heading line, vector, turn flag and track: only where the difficulty allows. */
  detail: boolean;
  /** Length of the velocity vector in view units. */
  vector: number;
  turn: -1 | 0 | 1;
  /** Past positions in view units, oldest first. */
  trail: readonly NavPoint[];
  selected?: boolean;
}

/** One ship symbol: the track dots, the dashed velocity vector, the heading line with the turn flag, then the triangle or circle. */
export function drawNavSymbol(g: Gfx, s: NavDraw): void {
  const c = g.ctx;
  const moving = !isStationary(s.speed);
  c.save();
  c.globalAlpha = s.alpha ?? 1;
  c.lineCap = "round";
  c.lineJoin = "round";
  const X = (x: number): number => g.toX(x);
  const Y = (y: number): number => g.toY(y);
  if (s.detail) {
    s.trail.forEach(([tx, ty], i) => {
      const k = (i + 1) / s.trail.length;
      c.fillStyle = rgba(s.color, 0.2 + 0.5 * k);
      c.beginPath();
      c.arc(X(tx), Y(ty), g.toLength(2 + 1.4 * k), 0, Math.PI * 2);
      c.fill();
    });
  }
  const { tip, left, right } = navTriangle(s.x, s.y, s.dx, s.dy, s.size);
  if (s.detail && moving) {
    // the velocity vector: a wide dashed band along the course, from the centre, ending in a dot; the thin solid heading line lies over it
    const ex = s.x + s.dx * s.vector;
    const ey = s.y + s.dy * s.vector;
    c.strokeStyle = rgba(s.color, 0.55);
    c.lineWidth = g.toLength(3.4);
    c.setLineDash([g.toLength(9), g.toLength(7)]);
    c.beginPath();
    c.moveTo(X(s.x), Y(s.y));
    c.lineTo(X(ex), Y(ey));
    c.stroke();
    c.setLineDash([]);
    c.fillStyle = rgba(s.color, 0.9);
    c.beginPath();
    c.arc(X(ex), Y(ey), g.toLength(3.4), 0, Math.PI * 2);
    c.fill();
    const head = s.size * 1.5;
    const hx = tip[0] + s.dx * head;
    const hy = tip[1] + s.dy * head;
    c.strokeStyle = rgba("#ffffff", 0.85);
    c.lineWidth = g.toLength(1.3);
    c.beginPath();
    c.moveTo(X(tip[0]), Y(tip[1]));
    c.lineTo(X(hx), Y(hy));
    if (s.turn !== 0) {
      // the rate-of-turn flag: a short bar across the tip of the heading line, on the side the ship is turning to (port is the left of the heading)
      const side: NavPoint = [s.dy * s.turn, -s.dx * s.turn];
      c.moveTo(X(hx), Y(hy));
      c.lineTo(X(hx + side[0] * s.size * 0.55), Y(hy + side[1] * s.size * 0.55));
    }
    c.stroke();
  }
  c.lineWidth = g.toLength(2.2);
  c.strokeStyle = s.color;
  c.fillStyle = rgba(s.color, 0.4);
  if (s.damaged) c.setLineDash([g.toLength(4), g.toLength(3)]);
  c.beginPath();
  if (moving) {
    c.moveTo(X(tip[0]), Y(tip[1]));
    c.lineTo(X(left[0]), Y(left[1]));
    c.lineTo(X(right[0]), Y(right[1]));
    c.closePath();
  } else {
    c.arc(X(s.x), Y(s.y), g.toLength(s.size * 0.3), 0, Math.PI * 2);
  }
  if (!s.damaged) c.fill();
  c.stroke();
  c.setLineDash([]);
  if (s.selected) {
    c.strokeStyle = rgba("#ffffff", 0.9);
    c.lineWidth = g.toLength(1.6);
    c.beginPath();
    c.arc(X(s.x), Y(s.y), g.toLength(s.size * 0.95), 0, Math.PI * 2);
    c.stroke();
  }
  c.restore();
}

const TAG_SIZE = 21;
const TAG_LINE = 25;
const TAG_CHAR = TAG_SIZE * 0.6;

/**
 * The lines of a ship's data tag: its class and contact number (the game knows what kind of ship it is, from its type, but gives it no name until it is
 * sunk; the number is its slot, so two ships of one class can be told apart), its speed in knots and its true heading. The course over ground is the
 * heading here (nothing pushes a ship sideways), so it is not listed twice.
 */
export function navTagLines(ship: Pick<NavShip, "slot" | "cls" | "speed" | "heading" | "damaged">): string[] {
  const name = ship.slot === SLOT.tender ? ship.cls.label : `${ship.cls.label} #${ship.slot}`;
  const lines = [name, `SPD ${Math.abs(ship.speed).toFixed(1)} kn`, `HDG ${String(compassDegrees(ship.heading)).padStart(3, "0")}\u00b0`];
  if (ship.damaged) lines.push("DAMAGED");
  return lines;
}

/** What a tag should keep clear of: the other ships (circles) and the heading lines and velocity vectors (segments), in view units. */
export interface NavObstacles {
  circles: readonly { x: number; y: number; r: number }[];
  segments: readonly { x1: number; y1: number; x2: number; y2: number }[];
}

export interface NavBounds {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

/** Directions tried round the ship, best first: up and down on the right, then on the left, then level, then straight above and below, then in between. */
const TAG_ANGLES = [-40, 40, -140, 140, 0, 180, -90, 90, -20, 20, -160, 160, -65, 65, -115, 115];

function rectNearest(rx: number, ry: number, w: number, h: number, px: number, py: number): number {
  const dx = Math.max(rx - px, 0, px - (rx + w));
  const dy = Math.max(ry - py, 0, py - (ry + h));
  return Math.hypot(dx, dy);
}

/**
 * Where to put a tag of `w` by `h` for the ship at (ax, ay) so that it covers as little as possible: it tries the directions round the ship at three
 * distances, and counts what each place would hide (the ship itself and the other ships, then the lines and vectors by their length under the tag);
 * a place outside `bounds` is only used when none inside is left. The first of equal places wins, so the tag settles on the same side from frame to frame.
 */
export function placeTag(w: number, h: number, ax: number, ay: number, anchorRadius: number, obstacles: NavObstacles, bounds: NavBounds): { x: number; y: number; score: number } {
  let best = { x: ax + anchorRadius, y: ay - h - anchorRadius, score: Infinity };
  const gaps = [anchorRadius + 8, anchorRadius + 46, anchorRadius + 100];
  gaps.forEach((gap, gi) => {
    TAG_ANGLES.forEach((deg, ai) => {
      const a = (deg * Math.PI) / 180;
      const x = ax + Math.cos(a) * (w / 2 + gap) - w / 2;
      const y = ay + Math.sin(a) * (h / 2 + gap) - h / 2;
      let score = (gi * TAG_ANGLES.length + ai) * 0.5;
      if (x < bounds.x0 || y < bounds.y0 || x + w > bounds.x1 || y + h > bounds.y1) score += 100000;
      for (const c of obstacles.circles) if (rectNearest(x - 4, y - 4, w + 8, h + 8, c.x, c.y) < c.r) score += 2000;
      for (const s of obstacles.segments) {
        const len = Math.hypot(s.x2 - s.x1, s.y2 - s.y1);
        const steps = Math.max(Math.ceil(len / 5), 1);
        let inside = 0;
        for (let k = 0; k <= steps; k += 1) {
          const px = s.x1 + ((s.x2 - s.x1) * k) / steps;
          const py = s.y1 + ((s.y2 - s.y1) * k) / steps;
          if (px >= x - 3 && px <= x + w + 3 && py >= y - 3 && py <= y + h + 3) inside += 1;
        }
        score += inside * 5 * 4;
      }
      if (score < best.score) best = { x, y, score };
    });
  });
  return best;
}

const TAG_FILL = "rgba(7,13,11,0.86)";

/** The tag for the ship at (ax, ay), placed clear of the other ships and the vectors (see {@link placeTag}), joined to its ship by a thin line when it is not beside it. */
export function drawNavTag(
  g: Gfx,
  ship: Pick<NavShip, "slot" | "cls" | "speed" | "heading" | "damaged">,
  ax: number,
  ay: number,
  anchorRadius: number,
  obstacles: NavObstacles,
  bounds: NavBounds,
): void {
  const lines = navTagLines(ship);
  const w = Math.max(...lines.map((l) => l.length)) * TAG_CHAR + 22;
  const h = lines.length * TAG_LINE + 14;
  const { x: bx, y: by } = placeTag(w, h, ax, ay, anchorRadius, obstacles, bounds);
  const gap = rectNearest(bx, by, w, h, ax, ay);
  if (gap > anchorRadius + 24) {
    const tx = Math.min(Math.max(ax, bx), bx + w);
    const ty = Math.min(Math.max(ay, by), by + h);
    g.line(ax, ay, tx, ty, rgba(ship.cls.color, 0.7), 1.4);
  }
  g.rect(bx, by, w, h, TAG_FILL);
  g.rect(bx, by, w, h, ship.cls.color, false);
  lines.forEach((l, i) => drawText(g, bx + 11, by + 8 + TAG_SIZE + i * TAG_LINE - 4, l, i === 0 ? ship.cls.color : "#d7efe0", TAG_SIZE, { role: "body", bold: i === 0 }));
}
