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
