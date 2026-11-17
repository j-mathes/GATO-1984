import type { Gfx } from "../gfx.js";

/** A crack: a polyline of points, and how thick to draw it (1 = the main cracks, less for the branches). */
export interface Crack {
  points: [number, number][];
  weight: number;
}

/** A small deterministic random source, so the same break always looks the same. */
function seeded(seed: number): () => number {
  let s = seed >>> 0 || 1;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/**
 * Cracks in a pane of glass `width` x `height`, all running out from the point of impact (`cx`, `cy` as fractions of the pane): a star of
 * main cracks that wander a little, with side branches on them, and a few rings joining the main cracks near the middle, like a stone hit.
 * `reachScale` shortens the cracks for a small pane or a small impact (1 = they can run across the whole pane).
 */
export function glassCracks(width: number, height: number, cx: number, cy: number, seed = 7, reachScale = 1): Crack[] {
  const rnd = seeded(seed);
  const ox = width * cx;
  const oy = height * cy;
  const reach = Math.hypot(width, height) * reachScale;
  const rays = 9;
  const cracks: Crack[] = [];
  const mains: [number, number][][] = [];
  for (let i = 0; i < rays; i += 1) {
    const base = ((i + rnd() * 0.5) / rays) * Math.PI * 2;
    const length = reach * (0.35 + rnd() * 0.5);
    let angle = base;
    let x = ox;
    let y = oy;
    const points: [number, number][] = [[x, y]];
    const steps = 9;
    for (let s = 1; s <= steps; s += 1) {
      angle += (rnd() - 0.5) * 0.35;
      const step = (length / steps) * (0.7 + rnd() * 0.6);
      x += Math.cos(angle) * step;
      y += Math.sin(angle) * step;
      points.push([x, y]);
      if (s > 2 && s < steps - 1 && rnd() < 0.45) {
        const side = rnd() < 0.5 ? -1 : 1;
        const branchAngle = angle + side * (0.5 + rnd() * 0.6);
        const branch: [number, number][] = [[x, y]];
        let bx = x;
        let by = y;
        for (let b = 0; b < 3; b += 1) {
          bx += Math.cos(branchAngle + (rnd() - 0.5) * 0.3) * step * 0.7;
          by += Math.sin(branchAngle + (rnd() - 0.5) * 0.3) * step * 0.7;
          branch.push([bx, by]);
        }
        cracks.push({ points: branch, weight: 0.45 });
      }
    }
    mains.push(points);
    cracks.push({ points, weight: 1 });
  }
  // rings: join the same step of neighbouring main cracks, nearer the middle
  for (const step of [2, 4]) {
    const ring: [number, number][] = [];
    for (const m of mains) ring.push(m[Math.min(step, m.length - 1)] as [number, number]);
    for (let i = 0; i < ring.length; i += 1) {
      if (rnd() < 0.7) cracks.push({ points: [ring[i] as [number, number], ring[(i + 1) % ring.length] as [number, number]], weight: 0.55 });
    }
  }
  return cracks;
}

export interface CrackDrawing {
  /** Multiplies the line widths (less than 1 for small panes). */
  thickness?: number;
  /** A dark line under the bright one, so the cracks show over a bright picture too (the sky). */
  dark?: boolean;
  /** Only the part of the cracks within `radius` of (`x`, `y`) (relative to the offset) is drawn: the break spreading out from its impact. */
  reveal?: { x: number; y: number; radius: number };
}

/** The shape of the fraction of the break's reach shown `age` seconds after the impact: quick at first, slowing as it spreads. */
export function crackSpread(age: number, seconds = 0.4): number {
  const t = Math.min(Math.max(age / seconds, 0), 1);
  return 1 - Math.pow(1 - t, 2);
}

/** Draws cracks as thin bright lines with a soft halo (and, if asked, a dark edge), `ox`, `oy` being where the pane's top left is in the view. */
export function strokeCracks(g: Gfx, cracks: readonly Crack[], ox: number, oy: number, style: CrackDrawing = {}): void {
  if (cracks.length === 0) return;
  const c = g.ctx;
  const k = style.thickness ?? 1;
  c.save();
  if (style.reveal) {
    c.beginPath();
    c.arc(g.toX(ox + style.reveal.x), g.toY(oy + style.reveal.y), Math.max(g.toLength(style.reveal.radius), 0), 0, Math.PI * 2);
    c.clip();
  }
  c.lineCap = "round";
  c.lineJoin = "round";
  const passes = [
    ...(style.dark ? [{ w: 3.6, rgb: "10,20,34", a: 0.5 }] : []),
    { w: 5, rgb: "225,238,245", a: 0.12 },
    { w: 1.6, rgb: "225,238,245", a: 0.85 },
  ];
  for (const pass of passes) {
    for (const crack of cracks) {
      c.strokeStyle = `rgba(${pass.rgb},${(pass.a * Math.min(1, crack.weight + 0.2)).toFixed(3)})`;
      c.lineWidth = g.toLength(pass.w * crack.weight * k);
      c.beginPath();
      crack.points.forEach(([x, y], i) => (i === 0 ? c.moveTo(g.toX(ox + x), g.toY(oy + y)) : c.lineTo(g.toX(ox + x), g.toY(oy + y))));
      c.stroke();
    }
  }
  c.restore();
}