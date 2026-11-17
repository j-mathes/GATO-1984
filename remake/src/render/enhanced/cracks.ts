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
 */
export function glassCracks(width: number, height: number, cx: number, cy: number, seed = 7): Crack[] {
  const rnd = seeded(seed);
  const ox = width * cx;
  const oy = height * cy;
  const reach = Math.hypot(width, height);
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
