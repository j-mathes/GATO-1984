/**
 * The part of the BASIC `DRAW` macro language that GATO uses (runtime 0x1ee4): U D L R E F G H moves, B (move without drawing), N (draw
 * and come back), C colour, S scale (S4 = 1:1) and A angle (0-3, quarter turns counter-clockwise). Pure: it returns the pixels.
 */
export interface DrawnPixel {
  x: number;
  y: number;
  color: number;
}

const STEPS: Record<string, readonly [number, number]> = {
  U: [0, -1],
  D: [0, 1],
  L: [-1, 0],
  R: [1, 0],
  E: [1, -1],
  F: [1, 1],
  G: [-1, 1],
  H: [-1, -1],
};

/** A quarter turn counter-clockwise on a screen whose y axis points down: U becomes L, R becomes U. */
function rotate(dx: number, dy: number, quarterTurns: number): [number, number] {
  let x = dx;
  let y = dy;
  for (let i = 0; i < quarterTurns; i += 1) [x, y] = [y, -x];
  return [x, y];
}

function lineBetween(x0: number, y0: number, x1: number, y1: number, color: number, out: DrawnPixel[]): void {
  const dx = Math.abs(x1 - x0);
  const dy = -Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  let x = x0;
  let y = y0;
  for (;;) {
    out.push({ x, y, color });
    if (x === x1 && y === y1) return;
    const e2 = 2 * err;
    if (e2 >= dy) {
      err += dy;
      x += sx;
    }
    if (e2 <= dx) {
      err += dx;
      y += sy;
    }
  }
}

export interface DrawnSegment {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  color: number;
}

/** The moves of a DRAW string: every U/D/L/R/E/F/G/H step with its start, its end and colour; `blank` moves (B) draw nothing. */
function* walkDraw(startX: number, startY: number, text: string, startColor: number): Generator<{ x0: number; y0: number; x1: number; y1: number; color: number; blank: boolean }> {
  let x = startX;
  let y = startY;
  let color = startColor;
  let scale = 4;
  let angle = 0;
  let blank = false;
  let keep = false;
  const re = /([A-Z])(-?\d+)?|;|\s/gy;
  while (re.lastIndex < text.length) {
    const m = re.exec(text);
    if (m === null) throw new Error(`unsupported DRAW text at ${re.lastIndex}: ${text}`);
    const cmd = m[1];
    if (cmd === undefined) continue;
    const num = m[2] === undefined ? null : Number(m[2]);
    if (cmd === "B") blank = true;
    else if (cmd === "N") keep = true;
    else if (cmd === "C") color = num ?? color;
    else if (cmd === "S") scale = num ?? scale;
    else if (cmd === "A") angle = (num ?? 0) & 3;
    else if (STEPS[cmd]) {
      const [ux, uy] = STEPS[cmd] as readonly [number, number];
      const [rx, ry] = rotate(ux, uy, angle);
      const n = num ?? 1;
      const nx = x + Math.trunc((rx * n * scale) / 4);
      const ny = y + Math.trunc((ry * n * scale) / 4);
      yield { x0: x, y0: y, x1: nx, y1: ny, color, blank };
      if (!keep) {
        x = nx;
        y = ny;
      }
      blank = false;
      keep = false;
    } else throw new Error(`unsupported DRAW command ${cmd}`);
  }
}

/** The lines `PSET (x, y), colour : DRAW text` draws, in drawing order (blank moves leave no line). */
export function drawSegments(startX: number, startY: number, text: string, startColor = 3): DrawnSegment[] {
  const out: DrawnSegment[] = [];
  for (const m of walkDraw(startX, startY, text, startColor)) if (!m.blank) out.push({ x0: m.x0, y0: m.y0, x1: m.x1, y1: m.y1, color: m.color });
  return out;
}

/** The pixels `PSET (x, y), colour : DRAW text` would set, in drawing order; they are not clipped to the screen. */
export function drawPixels(startX: number, startY: number, text: string, startColor = 3): DrawnPixel[] {
  const out: DrawnPixel[] = [{ x: startX, y: startY, color: startColor }];
  for (const m of walkDraw(startX, startY, text, startColor)) if (!m.blank) lineBetween(m.x0, m.y0, m.x1, m.y1, m.color, out);
  return out;
}
