import { SLOT, compassDegrees, quadrantOf, worldDelta, type IslandRecord } from "../../core/index.js";
import type { CockpitLayouts } from "../cockpitLayouts.js";
import type { Gfx } from "../gfx.js";
import { liveContacts, type PlayView } from "../playScreens.js";
import type { TrailBuffer } from "../trails.js";
import { INSTRUMENT, ISLAND, rgba } from "./colors.js";
import { drawControlPanel } from "./panel.js";
import { drawEnhancedDamage } from "./damage.js";
import { drawEnhancedLog } from "./log.js";
import { drawEnhancedScope, ENHANCED_FACTOR } from "./scope.js";
import type { EnhancedFrame, EnhancedRenderer } from "./scene.js";
import type { ShipArt } from "./shipArt.js";
import { drawText } from "./typography.js";
import { CHART_TRACK_EVERY_STEPS, OWN_COLOR, OWN_SLOT, TRACK_EVERY_STEPS, drawNavSymbol, drawNavTag, isStationary, navDetail, navShips, quadrantPixel, vectorLegend, vectorLength, type NavBounds, type NavObstacles, type NavPoint, type NavScreen, type NavShip, type NavState } from "./nav.js";

/** What the scenes need besides the frame: the ship pictures, the extracted layouts, and the wake dots of the track screens. */
export interface SceneDeps {
  art: ShipArt | null;
  cockpit: CockpitLayouts;
  trails: { radar: TrailBuffer; chart: TrailBuffer; quadrant: TrailBuffer };
  /** True while the wake dots are shown (key W). */
  trailsOn: () => boolean;
  /** The navigation symbols (switch SHIP NAV SYMBOLS): whether they replace the glowing dots, the ship history and the ship with a tag. */
  nav: () => NavState;
}

/** The 4 x the original's 320 x 200 picture, centred in the view (the view is wider than 1280 on a wide window). */
export const PICTURE_WIDTH = 320 * ENHANCED_FACTOR;
export const PICTURE_HEIGHT = 200 * ENHANCED_FACTOR;

const centreX = (width: number): number => (width - PICTURE_WIDTH) / 2;

/** Radar: the ring is a circle of radius RADAR_R around (RADAR_CX, RADAR_CY) in picture units; the original's pixel offsets scale by RADAR_K. */
export const RADAR_CX = 111 * ENHANCED_FACTOR;
export const RADAR_CY = 100 * ENHANCED_FACTOR;
export const RADAR_R = 372;
export const RADAR_K = RADAR_R / 101;

/** Position of a contact on the enhanced radar, relative to the picture's origin; `relative` is the bearing from the bow, counter-clockwise. */
export function radarBlip(relative: number, distance: number): { x: number; y: number } {
  return { x: RADAR_CX - Math.sin(relative) * distance * 0.065 * RADAR_K, y: RADAR_CY - Math.cos(relative) * distance * 0.065 * RADAR_K };
}

/** The picture's background, out to both edges of a wide view; the wings (outside the picture) are shaded darker so the picture still reads as the area of the map or instrument. */
function backdrop(g: Gfx, xo: number, top: string, bottom: string): void {
  const c = g.ctx;
  const grad = c.createLinearGradient(0, g.toY(0), 0, g.toY(PICTURE_HEIGHT));
  grad.addColorStop(0, top);
  grad.addColorStop(1, bottom);
  c.fillStyle = grad;
  c.fillRect(g.toX(0), g.toY(0), g.toLength(PICTURE_WIDTH + 2 * xo), g.toLength(PICTURE_HEIGHT));
  if (xo > 0) {
    c.fillStyle = "rgba(0,0,0,0.4)";
    c.fillRect(g.toX(0), g.toY(0), g.toLength(xo), g.toLength(PICTURE_HEIGHT));
    c.fillRect(g.toX(xo + PICTURE_WIDTH), g.toY(0), g.toLength(xo), g.toLength(PICTURE_HEIGHT));
  }
}

function brassFrame(g: Gfx, xo: number): void {
  g.rect(xo + 3, 3, PICTURE_WIDTH - 6, PICTURE_HEIGHT - 6, INSTRUMENT.frame, false);
  g.rect(xo + 12, 12, PICTURE_WIDTH - 24, PICTURE_HEIGHT - 24, INSTRUMENT.frameDark, false);
}

/** A blob of land: green shading from top to bottom with a sand shore. */
function drawLand(g: Gfx, cx: number, cy: number, rx: number, ry: number): void {
  const c = g.ctx;
  const grad = c.createLinearGradient(0, g.toY(cy - ry), 0, g.toY(cy + ry));
  grad.addColorStop(0, ISLAND.top);
  grad.addColorStop(1, ISLAND.bottom);
  c.beginPath();
  c.ellipse(g.toX(cx), g.toY(cy), Math.max(g.toLength(rx), 0.5), Math.max(g.toLength(ry), 0.5), 0, 0, Math.PI * 2);
  c.fillStyle = grad;
  c.fill();
  c.strokeStyle = ISLAND.shore;
  c.lineWidth = g.toLength(2.4);
  c.stroke();
}

/** How a screen puts the world on the view, for the ship symbols. */
interface NavProjection {
  /** World position to view units (the picture's margin included). */
  toView: (x: number, y: number) => NavPoint;
  /** Length of the triangle. */
  size: number;
  /** Opacity of a contact (the radar fades them after the sweep). */
  alphaOf?: (x: number, y: number) => number;
  /** Steps between the dots of the past track (the tracker's own interval when not given). */
  trackEvery?: number;
}

/** Where a vessel is on the view, the unit vector of its heading there and the length of its velocity vector, all through the screen's own projection (the chart's two axes have different scales). */
function aim(proj: NavProjection, x: number, y: number, heading: number, speed: number, intervals: number): { at: NavPoint; dx: number; dy: number; vector: number } {
  const at = proj.toView(x, y);
  const probe = proj.toView(x + Math.cos(heading) * 100, y + Math.sin(heading) * 100);
  const n = Math.hypot(probe[0] - at[0], probe[1] - at[1]) || 1;
  const d = vectorLength(speed, intervals * (proj.trackEvery ?? TRACK_EVERY_STEPS), 1); // the vector spans `intervals` of the screen's own interval
  const end = proj.toView(x + Math.cos(heading) * d, y + Math.sin(heading) * d);
  return { at, dx: (probe[0] - at[0]) / n, dy: (probe[1] - at[1]) / n, vector: Math.hypot(end[0] - at[0], end[1] - at[1]) };
}

/** A symbol that was drawn: its ship (null for the own boat), where, which way it points and how long its vector is; what a tag must keep clear of. */
interface NavPlaced {
  ship: NavShip | null;
  at: NavPoint;
  dx: number;
  dy: number;
  vector: number;
  size: number;
  /** Whether its heading line and vector were drawn. */
  lines: boolean;
}

/** The ship symbols of a screen: every ship it shows, and (on the chart and the map) the own boat; the caller sets the clip. Returns what was drawn. */
function drawNavShips(g: Gfx, deps: SceneDeps, view: PlayView, screen: NavScreen, proj: NavProjection, withOwn: boolean): NavPlaced[] {
  const nav = deps.nav();
  const { sim, snap, settings } = view;
  const detail = navDetail(settings.difficulty);
  const drawn: NavPlaced[] = [];
  for (const ship of navShips(view, screen).reverse()) {
    const a = aim(proj, ship.x, ship.y, ship.heading, ship.speed, nav.intervals);
    drawNavSymbol(g, {
      x: a.at[0], y: a.at[1], dx: a.dx, dy: a.dy, color: ship.cls.color, size: proj.size, speed: ship.speed, damaged: ship.damaged, alpha: proj.alphaOf?.(a.at[0], a.at[1]),
      detail, vector: a.vector, turn: nav.tracker.turn(ship.slot),
      trail: nav.tracker.trail(ship.slot, proj.trackEvery).map((p) => proj.toView(p.x, p.y)), selected: nav.selected === ship.slot,
    });
    drawn.push({ ship, at: a.at, dx: a.dx, dy: a.dy, vector: a.vector, size: proj.size, lines: detail && !isStationary(ship.speed) });
  }
  if (withOwn) {
    const a = aim(proj, snap.sub.x, snap.sub.y, snap.sub.heading, sim.sub.speed, nav.intervals);
    drawNavSymbol(g, {
      x: a.at[0], y: a.at[1], dx: a.dx, dy: a.dy, color: OWN_COLOR, size: proj.size * 1.1, speed: sim.sub.speed, detail: true, vector: a.vector,
      turn: nav.tracker.turn(OWN_SLOT), trail: nav.tracker.trail(OWN_SLOT, proj.trackEvery).map((p) => proj.toView(p.x, p.y)),
    });
    drawn.push({ ship: null, at: a.at, dx: a.dx, dy: a.dy, vector: a.vector, size: proj.size * 1.1, lines: !isStationary(sim.sub.speed) });
  }
  return drawn;
}

/** The legend of the velocity vectors X, where the symbols have vectors to explain. */
function drawVectorLegend(g: Gfx, deps: SceneDeps, view: PlayView, screen: NavScreen, x: number, y: number, align: CanvasTextAlign): void {
  const nav = deps.nav();
  if (!nav.on || (screen === "radar" && !navDetail(view.settings.difficulty))) return;
  drawText(g, x, y, vectorLegend(screen, nav.intervals), rgba(INSTRUMENT.label, 0.85), 22, { role: "body", align });
}

/**
 * The data tag of the selected ship (at the difficulties that show the details), drawn after the clip of the symbols is lifted and placed where it hides
 * the least: it keeps clear of the other symbols, of every heading line and vector (the ship's own included) and of `extra` circles (the radar's own boat).
 */
function drawNavTagOf(g: Gfx, deps: SceneDeps, view: PlayView, drawn: NavPlaced[], bounds: NavBounds, extra: NavObstacles["circles"] = []): void {
  const selected = deps.nav().selected;
  if (selected === null || !navDetail(view.settings.difficulty)) return;
  const hit = drawn.find((d) => d.ship?.slot === selected);
  if (!hit?.ship) return;
  const obstacles: NavObstacles = {
    circles: [...drawn.filter((d) => d !== hit).map((d) => ({ x: d.at[0], y: d.at[1], r: d.size * 0.8 })), ...extra],
    segments: drawn
      .filter((d) => d.lines)
      .map((d) => {
        const reach = Math.max(d.vector, d.size * 2.2);
        return { x1: d.at[0], y1: d.at[1], x2: d.at[0] + d.dx * reach, y2: d.at[1] + d.dy * reach };
      }),
  };
  drawNavTag(g, hit.ship, hit.at[0], hit.at[1], hit.size * 0.8, obstacles, bounds);
}

function glowDot(g: Gfx, x: number, y: number, radius: number, color: string, alpha = 1): void {
  const c = g.ctx;
  const glow = c.createRadialGradient(g.toX(x), g.toY(y), 0, g.toX(x), g.toY(y), g.toLength(radius * 3));
  glow.addColorStop(0, rgba(color, 0.55 * alpha));
  glow.addColorStop(1, rgba(color, 0));
  c.fillStyle = glow;
  c.beginPath();
  c.arc(g.toX(x), g.toY(y), g.toLength(radius * 3), 0, Math.PI * 2);
  c.fill();
  c.fillStyle = rgba(color, alpha);
  c.beginPath();
  c.arc(g.toX(x), g.toY(y), g.toLength(radius), 0, Math.PI * 2);
  c.fill();
}

/** Remembered track dots as small squares of one colour per palette index (one path, one fill). */
function drawTrail(g: Gfx, trail: TrailBuffer, xo: number, colors: Record<number, string>, place: (px: number, py: number) => [number, number], size: number): void {
  const c = g.ctx;
  const byColor = new Map<string, [number, number][]>();
  trail.forEach((px, py, index) => {
    const color = colors[index];
    if (!color) return;
    const list = byColor.get(color) ?? [];
    list.push(place(px, py));
    byColor.set(color, list);
  });
  for (const [color, points] of byColor) {
    c.fillStyle = color;
    c.beginPath();
    for (const [x, y] of points) {
      c.moveTo(g.toX(xo + x) + g.toLength(size / 2), g.toY(y));
      c.arc(g.toX(xo + x), g.toY(y), g.toLength(size / 2), 0, Math.PI * 2);
    }
    c.fill();
  }
}

// ------------------------------------------------------------------------------------------------------------------------------
// Control room: the enhanced scope above the enhanced instrument panel (panel.ts)
// ------------------------------------------------------------------------------------------------------------------------------

function controlScene(deps: SceneDeps): (f: EnhancedFrame) => void {
  return ({ g, view, width }) => {
    const xo = centreX(width);
    drawControlPanel(g, view, xo);
    drawEnhancedScope(g, view, deps.art, { x: xo, y: 0, w: PICTURE_WIDTH, h: 98 * ENHANCED_FACTOR, wing: xo }, deps.cockpit.palette("control_room"));
  };
}

// ------------------------------------------------------------------------------------------------------------------------------
// Radar
// ------------------------------------------------------------------------------------------------------------------------------

function readout(g: Gfx, xo: number, boxTop: number, label: string, labelY: number, value: string): void {
  const x = xo + 948;
  g.rect(x, boxTop, 172, 44, "#07100a");
  g.rect(x, boxTop, 172, 44, INSTRUMENT.frame, false);
  drawText(g, x + 160, boxTop + 23, value, INSTRUMENT.panelText, 38, { role: "body", bold: true, align: "right" });
  drawText(g, xo + 1034, labelY, label, INSTRUMENT.label, 30, { role: "title", align: "center" });
}

function radarScene(deps: SceneDeps): (f: EnhancedFrame) => void {
  return ({ g, view, width }) => {
    const { sim, snap } = view;
    const navOn = deps.nav().on;
    let radarShips: NavPlaced[] = [];
    const xo = centreX(width);
    const c = g.ctx;
    backdrop(g, xo, "#0a100c", "#050806");
    brassFrame(g, xo);
    const cx = xo + RADAR_CX;
    const cy = RADAR_CY;
    // bezel and glass
    g.circle(cx, cy, RADAR_R + 14, INSTRUMENT.frameDark, false, 12);
    g.circle(cx, cy, RADAR_R + 6, INSTRUMENT.frame, false, 4);
    c.save();
    c.beginPath();
    c.arc(g.toX(cx), g.toY(cy), g.toLength(RADAR_R), 0, Math.PI * 2);
    c.clip();
    const glass = c.createRadialGradient(g.toX(cx), g.toY(cy), 0, g.toX(cx), g.toY(cy), g.toLength(RADAR_R));
    glass.addColorStop(0, INSTRUMENT.radarBg);
    glass.addColorStop(1, INSTRUMENT.radarBgEdge);
    c.fillStyle = glass;
    c.fillRect(g.toX(cx - RADAR_R), g.toY(cy - RADAR_R), g.toLength(RADAR_R * 2), g.toLength(RADAR_R * 2));
    for (const f of [1 / 3, 2 / 3]) g.circle(cx, cy, RADAR_R * f, rgba(INSTRUMENT.radarLine, 0.55), false, 1.6);
    g.line(cx - RADAR_R, cy, cx + RADAR_R, cy, rgba(INSTRUMENT.radarLine, 0.45), 1.4);
    g.line(cx, cy - RADAR_R, cx, cy + RADAR_R, rgba(INSTRUMENT.radarLine, 0.45), 1.4);
    for (let i = 0; i < 36; i += 1) {
      const a = (i * Math.PI) / 18;
      const len = i % 3 === 0 ? 18 : 9;
      g.line(cx + Math.cos(a) * (RADAR_R - len), cy + Math.sin(a) * (RADAR_R - len), cx + Math.cos(a) * RADAR_R, cy + Math.sin(a) * RADAR_R, rgba(INSTRUMENT.radarLine, 0.7), 1.4);
    }
    if (sim.sub.depth <= 45) {
      // wake dots (key W), then the sweep with its fading trail, then the contacts; only at periscope depth, as in the original
      if (deps.trailsOn()) drawTrail(g, deps.trails.radar, xo, { 2: rgba(INSTRUMENT.blip, 0.4) }, (px, py) => [(px + 0.5 - 111) * RADAR_K + RADAR_CX, (py + 0.5 - 100) * RADAR_K + RADAR_CY], 3.4);
      const sweep = ((view.timeMs / 1000) * 1.2) % (Math.PI * 2);
      const cone = c.createConicGradient(sweep - 1.1, g.toX(cx), g.toY(cy));
      cone.addColorStop(0, rgba(INSTRUMENT.radarSweep, 0));
      cone.addColorStop(1.1 / (Math.PI * 2), rgba(INSTRUMENT.radarSweep, 0.5));
      cone.addColorStop(1.1 / (Math.PI * 2) + 0.002, rgba(INSTRUMENT.radarSweep, 0));
      cone.addColorStop(1, rgba(INSTRUMENT.radarSweep, 0));
      c.fillStyle = cone;
      c.fillRect(g.toX(cx - RADAR_R), g.toY(cy - RADAR_R), g.toLength(RADAR_R * 2), g.toLength(RADAR_R * 2));
      g.line(cx, cy, cx + Math.cos(sweep) * RADAR_R, cy + Math.sin(sweep) * RADAR_R, rgba(INSTRUMENT.radarSweep, 0.95), 2);
      for (const k of liveContacts(view)) {
        if (k.distance >= 1350) continue;
        const p = radarBlip(k.relative, k.distance);
        const bx = xo + p.x;
        if (k.slot === SLOT.island) {
          const r = (3 + 1200 / Math.max(k.distance, 1)) * RADAR_K;
          c.strokeStyle = rgba(ISLAND.shore, 0.85);
          c.lineWidth = g.toLength(2.4);
          c.beginPath();
          c.ellipse(g.toX(bx), g.toY(p.y), g.toLength(r), g.toLength(r * 0.9), 0, 0, Math.PI * 2);
          c.stroke();
          continue;
        }
        const seen = Math.atan2(p.y - RADAR_CY, p.x - RADAR_CX);
        const age = (((sweep - seen) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
        if (!navOn) glowDot(g, bx, p.y, 6, INSTRUMENT.blip, Math.max(0.3, 1 - (age / (Math.PI * 2)) * 0.8));
      }
      if (navOn) {
        // ship symbols on the blips: the picture is heading-up, so a ship's own heading is shown relative to the bow of the boat
        const toView = (wx: number, wy: number): NavPoint => {
          const { dx, dy } = worldDelta(snap.sub.x, snap.sub.y, wx, wy, sim.options.wrapWorld);
          const p = radarBlip(Math.atan2(dy, dx) - snap.sub.heading, Math.hypot(dx, dy));
          return [xo + p.x, p.y];
        };
        radarShips = drawNavShips(g, deps, view, "radar", {
          toView,
          size: 32,
          alphaOf: (x, y) => {
            const seenAt = Math.atan2(y - RADAR_CY, x - xo - RADAR_CX);
            const age = (((sweep - seenAt) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
            return Math.max(0.6, 1 - (age / (Math.PI * 2)) * 0.5);
          },
        }, false);
      }
    }
    g.line(cx, cy - 2, cx, cy - 18, "#ffffff", 2); // the boat's own mark
    c.restore();
    // corner rivets
    for (const [rx, ry] of [[60, 60], [1220, 60], [60, 740], [1220, 740]] as const) g.circle(xo + rx, ry, 14, INSTRUMENT.frame, false, 3);
    // readout panel
    g.rect(xo + 896, 92, 284, 468, INSTRUMENT.panel);
    g.rect(xo + 896, 92, 284, 468, INSTRUMENT.frame, false);
    readout(g, xo, 120, "HEADING", 208, String(compassDegrees(snap.sub.heading)).padStart(3, "0"));
    readout(g, xo, 280, "SPEED", 368, String(Math.round(sim.sub.speed)));
    readout(g, xo, 440, "DEPTH", 528, String(Math.trunc(sim.sub.depth)));
    drawText(g, xo + 1010, 652, "TORP", INSTRUMENT.label, 30, { role: "title", align: "right" });
    g.rect(xo + 1068, 624, 96, 56, "#07100a");
    g.rect(xo + 1068, 624, 96, 56, INSTRUMENT.frame, false);
    drawText(g, xo + 1116, 653, String(sim.sub.torpedoes), INSTRUMENT.panelText, 40, { role: "body", bold: true, align: "center" });
    drawVectorLegend(g, deps, view, "radar", xo + 1038, 732, "center");
    drawNavTagOf(g, deps, view, radarShips, { x0: xo + 20, y0: 20, x1: xo + RADAR_CX + RADAR_R + 40, y1: PICTURE_HEIGHT - 20 }, [{ x: cx, y: cy, r: 26 }]);
  };
}

// ------------------------------------------------------------------------------------------------------------------------------
// Chart (C): the 12 islands, drawn from the quadrant map's bitmaps, with the shoal ellipse the simulation uses round each
// ------------------------------------------------------------------------------------------------------------------------------

export const CHART_ISLANDS: readonly (readonly [number, number, number, number])[] = [
  [19, 35, 5, 0.9], [170, 37, 5, 0.9], [208, 22, 6, 1.5], [38, 80, 10, 0.9], [162, 75, 13, 1.5], [208, 85, 5, 0.9],
  [48, 134, 5, 0.9], [209, 113, 5, 0.9], [269, 128, 6, 1.5], [95, 174, 13, 1.5], [214, 168, 9, 0.9], [287, 174, 15, 0.9],
];

/** Dots on the shoal ring of the largest island of the chart; the others get as many as keep the same spacing. */
export const SHOAL_DOTS_LARGEST = 40;

/** The length of the edge of an ellipse (Ramanujan's approximation, good to a few parts in a million for these shapes). */
export function ellipsePerimeter(rx: number, ry: number): number {
  const h = ((rx - ry) / (rx + ry)) ** 2;
  return Math.PI * (rx + ry) * (1 + (3 * h) / (10 + Math.sqrt(4 - 3 * h)));
}

/** How many dots a ring of this length gets so that its spacing is that of the largest ring (which has {@link SHOAL_DOTS_LARGEST}); at least 8. */
export function shoalDotCount(perimeter: number, largestPerimeter: number): number {
  if (largestPerimeter <= 0) return SHOAL_DOTS_LARGEST;
  return Math.max(8, Math.round((SHOAL_DOTS_LARGEST * perimeter) / largestPerimeter));
}

/** `count` angles round an ellipse (x = rx cos a, y = ry sin a) that put the dots an equal distance apart along its edge, not an equal angle. */
export function ellipseDotAngles(rx: number, ry: number, count: number): number[] {
  const steps = 720;
  const lengths = [0];
  let px0 = rx;
  let py0 = 0;
  for (let k = 1; k <= steps; k += 1) {
    const a = (k / steps) * Math.PI * 2;
    const x = rx * Math.cos(a);
    const y = ry * Math.sin(a);
    lengths.push((lengths[k - 1] as number) + Math.hypot(x - px0, y - py0));
    px0 = x;
    py0 = y;
  }
  const total = lengths[steps] as number;
  const angles: number[] = [];
  let k = 0;
  for (let i = 0; i < count; i += 1) {
    const target = (i / count) * total;
    while (k < steps && (lengths[k + 1] as number) < target) k += 1;
    const l0 = lengths[k] as number;
    const l1 = lengths[k + 1] as number;
    angles.push(((k + (l1 > l0 ? (target - l0) / (l1 - l0) : 0)) / steps) * Math.PI * 2);
  }
  return angles;
}

/** BASIC's CIRCLE with an aspect: below 1 the vertical radius shrinks, above 1 the horizontal one does. */
export function circleRadii(radius: number, aspect: number): { rx: number; ry: number } {
  return aspect < 1 ? { rx: radius, ry: radius * aspect } : { rx: radius / aspect, ry: radius };
}

function chartScene(deps: SceneDeps): (f: EnhancedFrame) => void {
  return ({ g, view, width }) => {
    const { sim, snap, settings } = view;
    const xo = centreX(width);
    backdrop(g, xo, INSTRUMENT.chartSeaTop, INSTRUMENT.chartSeaBottom);
    for (let i = 1; i < 5; i += 1) g.line(xo + i * 64 * ENHANCED_FACTOR, 0, xo + i * 64 * ENHANCED_FACTOR, PICTURE_HEIGHT, rgba(INSTRUMENT.grid, 0.3), 1.4);
    for (let j = 1; j < 4; j += 1) g.line(xo, j * 50 * ENHANCED_FACTOR, xo + PICTURE_WIDTH, j * 50 * ENHANCED_FACTOR, rgba(INSTRUMENT.grid, 0.3), 1.4);
    const px = (x: number): number => x * 0.01252 * ENHANCED_FACTOR;
    const py = (y: number): number => (196 - y * 0.009650499) * ENHANCED_FACTOR;
    const islands = sim.scenario.islands.filter((i) => i.present);
    // every shoal ring has the dot spacing of the largest one: a smaller ring gets fewer dots, not the same number packed closer
    const ringRadii = (i: IslandRecord): [number, number] => [px(i.innerRadius), i.outerRadius * 0.0096505 * ENHANCED_FACTOR];
    const largestRing = Math.max(0, ...islands.map((i) => ellipsePerimeter(...ringRadii(i))));
    if (islands.length === 0) {
      for (const [x, y, r, a] of CHART_ISLANDS) {
        const { rx, ry } = circleRadii(r, a);
        drawLand(g, xo + x * ENHANCED_FACTOR, y * ENHANCED_FACTOR, rx * ENHANCED_FACTOR, ry * ENHANCED_FACTOR);
      }
    }
    // the islands as the quadrant map draws them (the same bitmaps, scaled to the chart's units) with the shoal the simulation uses round each
    const pics = deps.cockpit.screen("quadrant_map").dynamic.islands as Record<string, { offset: [number, number]; rows: string[] }> | undefined;
    const night = settings.timeOfDay === 0;
    for (const island of islands) {
      const cx = xo + px(island.x);
      const cy = py(island.y);
      const key = `${island.shape}_${island.drawScale}`;
      const pic = pics?.[key];
      const land = pic ? deps.art?.landFromRows(key, pic.rows, night) : null;
      if (pic && land) {
        // one bitmap pixel is 1/0.0638 by 1/0.0398 world units on the map
        const sx = (0.01252 / 0.0638) * ENHANCED_FACTOR;
        const sy = (0.0096505 / 0.0398) * ENHANCED_FACTOR;
        const w = (land.canvas.width / land.density) * sx;
        const h = (land.canvas.height / land.density) * sy;
        g.smooth(true);
        g.ctx.drawImage(land.canvas, g.toX(cx + pic.offset[0] * sx), g.toY(cy + pic.offset[1] * sy), g.toLength(w), g.toLength(h));
        g.smooth(false);
      } else drawLand(g, cx, cy, island.innerRadius * 0.01252 * ENHANCED_FACTOR * 0.8, island.innerRadius * 0.0096505 * ENHANCED_FACTOR * 0.8);
      const c = g.ctx;
      c.fillStyle = rgba(INSTRUMENT.tick, 0.8);
      c.beginPath();
      const [rx, ry] = ringRadii(island);
      for (const a of ellipseDotAngles(rx, ry, shoalDotCount(ellipsePerimeter(rx, ry), largestRing))) {
        const dx = cx + Math.cos(a) * rx;
        const dy = cy + Math.sin(a) * ry;
        c.moveTo(g.toX(dx) + g.toLength(1.8), g.toY(dy));
        c.arc(g.toX(dx), g.toY(dy), g.toLength(1.8), 0, Math.PI * 2);
      }
      c.fill();
    }
    if (deps.trailsOn()) {
      drawTrail(g, deps.trails.chart, xo, { 0: rgba("#ffffff", 0.45), 2: rgba(INSTRUMENT.enemy, 0.45) }, (x, y) => [(x + 0.5) * ENHANCED_FACTOR, (y + 0.5) * ENHANCED_FACTOR], 3.2);
    }
    let drawn: NavPlaced[] = [];
    if (deps.nav().on) {
      // ship symbols, kept inside the picture
      const c = g.ctx;
      c.save();
      c.beginPath();
      c.rect(g.toX(xo), g.toY(0), g.toLength(PICTURE_WIDTH), g.toLength(PICTURE_HEIGHT)); // up to the edge: a boat stopped at the edge of the world stays visible
      c.clip();
      drawn = drawNavShips(g, deps, view, "chart", { toView: (x, y) => [xo + px(x), py(y)], size: 34, trackEvery: CHART_TRACK_EVERY_STEPS }, true);
      c.restore();
    } else {
      if (settings.difficulty <= 2) {
        for (const s of snap.vessels) {
          const vessel = sim.vessels[s.slot];
          if (!vessel || s.slot === SLOT.island || vessel.sunk) continue;
          glowDot(g, xo + px(s.x), py(s.y), 5, s.slot === SLOT.tender ? INSTRUMENT.tender : INSTRUMENT.enemy);
        }
      }
      glowDot(g, xo + px(snap.sub.x), py(snap.sub.y), 6, INSTRUMENT.boat);
    }
    brassFrame(g, xo);
    drawVectorLegend(g, deps, view, "chart", xo + 34, PICTURE_HEIGHT - 30, "left");
    drawNavTagOf(g, deps, view, drawn, { x0: xo + 14, y0: 14, x1: xo + PICTURE_WIDTH - 14, y1: PICTURE_HEIGHT - 14 });
  };
}

// ------------------------------------------------------------------------------------------------------------------------------
// Quadrant map (Q)
// ------------------------------------------------------------------------------------------------------------------------------

function quadrantScene(deps: SceneDeps): (f: EnhancedFrame) => void {
  return ({ g, view, width }) => {
    const { sim, snap, settings } = view;
    const xo = centreX(width);
    backdrop(g, xo, INSTRUMENT.mapSeaTop, INSTRUMENT.mapSeaBottom);
    for (let i = 1; i < 5; i += 1) {
      const x = xo + i * 64 * ENHANCED_FACTOR;
      g.line(x, 0, x, PICTURE_HEIGHT, rgba(INSTRUMENT.grid, 0.14), 1.2);
      g.line(x, 0, x, 28, INSTRUMENT.tick, 2.4);
      g.line(x, PICTURE_HEIGHT - 28, x, PICTURE_HEIGHT, INSTRUMENT.tick, 2.4);
    }
    for (let j = 1; j < 5; j += 1) {
      const y = j * 40 * ENHANCED_FACTOR;
      g.line(xo, y, xo + PICTURE_WIDTH, y, rgba(INSTRUMENT.grid, 0.14), 1.2);
      g.line(xo, y, xo + 28, y, INSTRUMENT.tick, 2.4);
      g.line(xo + PICTURE_WIDTH - 28, y, xo + PICTURE_WIDTH, y, INSTRUMENT.tick, 2.4);
    }
    const q = quadrantOf(snap.sub.x, snap.sub.y); // from where the boat is drawn (the simulation is up to a step ahead of the interpolated picture)
    const px = (x: number): number => (x % 5000) * 0.0638 * ENHANCED_FACTOR;
    const py = (y: number): number => (199 - (y % 5000) * 0.0398) * ENHANCED_FACTOR;
    const island = sim.scenario.islands[q];
    if (island?.present) {
      const ix = xo + px(island.x);
      const iy = py(island.y);
      // the island's own outline from the original's bitmap (its pixels are 4 units here), else an ellipse
      const pics = deps.cockpit.screen("quadrant_map").dynamic.islands as Record<string, { offset: [number, number]; rows: string[] }> | undefined;
      const key = `${island.shape}_${island.drawScale}`;
      const pic = pics?.[key];
      const land = pic ? deps.art?.landFromRows(key, pic.rows, view.settings.timeOfDay === 0) : null;
      if (pic && land) {
        g.smooth(true);
        g.ctx.drawImage(land.canvas, g.toX(xo + (Math.round(px(island.x) / ENHANCED_FACTOR) + pic.offset[0]) * ENHANCED_FACTOR), g.toY((Math.round(py(island.y) / ENHANCED_FACTOR) + pic.offset[1]) * ENHANCED_FACTOR), g.toLength(land.canvas.width), g.toLength(land.canvas.height));
        g.smooth(false);
      } else drawLand(g, ix, iy, island.innerRadius * 0.0638 * ENHANCED_FACTOR, island.innerRadius * 0.0398 * ENHANCED_FACTOR);
      const c = g.ctx;
      c.fillStyle = rgba(INSTRUMENT.tick, 0.8);
      c.beginPath();
      for (let i = 1; i <= 40; i += 1) {
        const a = i * 0.1571;
        const dx = ix + Math.cos(a) * island.innerRadius * 0.064 * ENHANCED_FACTOR;
        const dy = iy + Math.sin(a) * island.outerRadius * 0.04 * ENHANCED_FACTOR;
        c.moveTo(g.toX(dx) + g.toLength(2.4), g.toY(dy));
        c.arc(g.toX(dx), g.toY(dy), g.toLength(2.4), 0, Math.PI * 2);
      }
      c.fill();
    }
    if (deps.trailsOn()) {
      drawTrail(g, deps.trails.quadrant, xo, { 1: rgba("#ffffff", 0.45), 2: rgba(INSTRUMENT.enemy, 0.45) }, (x, y) => [(x + 0.5) * ENHANCED_FACTOR, (y + 0.5) * ENHANCED_FACTOR], 3.2);
    }
    let drawn: NavPlaced[] = [];
    if (deps.nav().on) {
      const c = g.ctx;
      c.save();
      c.beginPath();
      c.rect(g.toX(xo), g.toY(0), g.toLength(PICTURE_WIDTH), g.toLength(PICTURE_HEIGHT)); // up to the edge: a boat stopped at the edge of the world stays visible
      c.clip();
      drawn = drawNavShips(g, deps, view, "quadrant", { toView: (x, y) => { const [a, b] = quadrantPixel(q, x, y); return [xo + a * ENHANCED_FACTOR, b * ENHANCED_FACTOR]; }, size: 30 }, true);
      c.restore();
    } else {
      if (settings.difficulty <= 5) {
        for (const s of snap.vessels) {
          const vessel = sim.vessels[s.slot];
          if (!vessel || s.slot === SLOT.island || vessel.sunk || quadrantOf(s.x, s.y) !== q) continue;
          glowDot(g, xo + px(s.x), py(s.y), 5, INSTRUMENT.enemy);
        }
      }
      glowDot(g, xo + px(snap.sub.x), py(snap.sub.y), 6, INSTRUMENT.boat);
    }
    brassFrame(g, xo);
    drawVectorLegend(g, deps, view, "quadrant", xo + 34, PICTURE_HEIGHT - 30, "left");
    drawNavTagOf(g, deps, view, drawn, { x0: xo + 14, y0: 14, x1: xo + PICTURE_WIDTH - 14, y1: PICTURE_HEIGHT - 14 });
  };
}

/** Registers the enhanced scenes: the control room, the radar, the chart, the quadrant map, the damage report and the captain's log. */
export function registerEnhancedScenes(renderer: EnhancedRenderer, deps: SceneDeps): void {
  renderer.register("control", controlScene(deps));
  renderer.register("radar", radarScene(deps));
  renderer.register("chart", chartScene(deps));
  renderer.register("quadrant", quadrantScene(deps));
  renderer.register("damage", ({ g, view, width }) => drawEnhancedDamage(g, view, deps.cockpit, centreX(width)));
  renderer.register("log", ({ g, view, width }) => drawEnhancedLog(g, view, centreX(width)));
}
