/** Hull shapes from the original's ship sprites: pure functions over 0/1 masks, shared by the enhanced art and the solid ships of the original view. */

/** 1 where a picture has a pixel that is not transparent. */
export function maskOf(rgba: ArrayLike<number>, w: number, h: number): Uint8Array {
  const mask = new Uint8Array(w * h);
  for (let i = 0; i < mask.length; i += 1) mask[i] = (rgba[i * 4 + 3] ?? 0) > 0 ? 1 : 0;
  return mask;
}

/**
 * The original draws a ship's hull open: below the deck only its outline is solid (the sloped bow and stern edges, seen in perspective).
 * The deck is the widest row at or above the waterline row `baseY` (the lowest of equal rows); from there down every row is filled between its
 * outermost solid pixels, so the bow and stern keep the slope of the drawn edges instead of becoming square. Nothing is added above the
 * deck, so masts and rigging stay thin.
 */
export function closeHull(mask: Uint8Array, w: number, h: number, baseY: number): Uint8Array {
  const out = mask.slice();
  const base = Math.min(Math.max(baseY, 0), h - 1);
  let deck = -1;
  let best = 0;
  for (let y = 0; y <= base; y += 1) {
    let count = 0;
    for (let x = 0; x < w; x += 1) count += mask[y * w + x] ?? 0;
    if (count > 0 && count >= best) {
      best = count;
      deck = y;
    }
  }
  if (deck < 0) return out;
  for (let y = deck + 1; y <= base; y += 1) {
    let first = -1;
    let last = -1;
    for (let x = 0; x < w; x += 1) {
      if (mask[y * w + x]) {
        if (first < 0) first = x;
        last = x;
      }
    }
    for (let x = first; first >= 0 && x <= last; x += 1) out[y * w + x] = 1;
  }
  return out;
}

/** 1 for solid pixels that are not part of a 2 x 2 block of solid pixels: lines, such as rigging and stubs. */
export function thinPixels(mask: Uint8Array, w: number, h: number): Uint8Array {
  const thick = new Uint8Array(w * h);
  for (let y = 0; y + 1 < h; y += 1) {
    for (let x = 0; x + 1 < w; x += 1) {
      if (mask[y * w + x] && mask[y * w + x + 1] && mask[(y + 1) * w + x] && mask[(y + 1) * w + x + 1]) {
        thick[y * w + x] = thick[y * w + x + 1] = thick[(y + 1) * w + x] = thick[(y + 1) * w + x + 1] = 1;
      }
    }
  }
  const thin = new Uint8Array(w * h);
  for (let i = 0; i < thin.length; i += 1) thin[i] = mask[i] && !thick[i] ? 1 : 0;
  return thin;
}

/** The mask with every set pixel grown by `radius` pixels in all eight directions (closes small gaps in a drawn outline). */
export function dilate(mask: Uint8Array, w: number, h: number, radius = 1): Uint8Array {
  let src = mask;
  for (let r = 0; r < radius; r += 1) {
    const out = src.slice();
    for (let y = 0; y < h; y += 1) {
      for (let x = 0; x < w; x += 1) {
        if (!src[y * w + x]) continue;
        for (let dy = -1; dy <= 1; dy += 1) {
          for (let dx = -1; dx <= 1; dx += 1) {
            const nx = x + dx;
            const ny = y + dy;
            if (nx >= 0 && ny >= 0 && nx < w && ny < h) out[ny * w + nx] = 1;
          }
        }
      }
    }
    src = out;
  }
  return src;
}

/**
 * The shape a drawn outline encloses, as a filled mask: the outline is grown by `gap` pixels so small breaks in it are closed, the outside is
 * found by flooding in from the border, and everything the flood could not reach (the outline and its inside) is the shape. An outline with a
 * larger gap lets the flood in and the result is only the grown outline.
 */
export function filledSilhouette(outline: Uint8Array, w: number, h: number, gap = 1): Uint8Array {
  const grown = dilate(outline, w, h, gap);
  const outside = new Uint8Array(w * h);
  const stack: number[] = [];
  const push = (x: number, y: number): void => {
    const i = y * w + x;
    if (!outside[i] && !grown[i]) {
      outside[i] = 1;
      stack.push(i);
    }
  };
  for (let x = 0; x < w; x += 1) {
    push(x, 0);
    push(x, h - 1);
  }
  for (let y = 0; y < h; y += 1) {
    push(0, y);
    push(w - 1, y);
  }
  while (stack.length > 0) {
    const i = stack.pop() as number;
    const x = i % w;
    const y = (i - x) / w;
    if (x > 0) push(x - 1, y);
    if (x < w - 1) push(x + 1, y);
    if (y > 0) push(x, y - 1);
    if (y < h - 1) push(x, y + 1);
  }
  const out = new Uint8Array(w * h);
  for (let i = 0; i < out.length; i += 1) out[i] = outside[i] ? 0 : 1;
  return out;
}

/** The pixels of `a` that are also in `b`. */
export function intersect(a: Uint8Array, b: Uint8Array): Uint8Array {
  const out = new Uint8Array(a.length);
  for (let i = 0; i < out.length; i += 1) out[i] = a[i] && b[i] ? 1 : 0;
  return out;
}

/** Bounding box of the points `[x, y]`: `{ x0, y0, x1, y1 }` (inclusive). */
export function boundsOf(points: readonly (readonly [number, number])[]): { x0: number; y0: number; x1: number; y1: number } {
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (const [x, y] of points) {
    x0 = Math.min(x0, x);
    y0 = Math.min(y0, y);
    x1 = Math.max(x1, x);
    y1 = Math.max(y1, y);
  }
  return { x0, y0, x1, y1 };
}

/**
 * The region a damage overlay marks inside the hull. The overlays of the original are outlines (some are paint fills): when the drawn lines
 * enclose an area, that area is used; when they do not, the box around them. Either way it is cut to the hull.
 */
export function overlayRegion(points: readonly (readonly [number, number])[], hull: Uint8Array, w: number, h: number): Uint8Array {
  const mask = new Uint8Array(w * h);
  for (const [x, y] of points) if (x >= 0 && y >= 0 && x < w && y < h) mask[y * w + x] = 1;
  const enclosed = filledSilhouette(mask, w, h, 1);
  const grownCount = dilate(mask, w, h, 1).reduce((a, b) => a + b, 0);
  const enclosedCount = enclosed.reduce((a, b) => a + b, 0);
  if (enclosedCount > grownCount + 8) return intersect(enclosed, hull);
  const b = boundsOf(points);
  const box = new Uint8Array(w * h);
  for (let y = Math.max(b.y0, 0); y <= Math.min(b.y1, h - 1); y += 1) for (let x = Math.max(b.x0, 0); x <= Math.min(b.x1, w - 1); x += 1) box[y * w + x] = 1;
  return intersect(box, hull);
}