import type { TitleArt } from "../titleArt.js";
import { TITLE_ART_HEIGHT, TITLE_ART_WIDTH } from "../titleArt.js";
import { upscaleMask } from "./shipArt.js";

/**
 * Smooth, enlarged layers made from the one-bit shapes of the original's title artwork (the logo, the lettering, the submarine): a layer is
 * the 320 x 200 picture's pixels of some colours as a 1280 x 800 mask with the stair-steps rounded off, which is then filled with any colour
 * or gradient. Made once and kept. Needs a DOM (canvas); without one nothing is made.
 */
const cache = new WeakMap<TitleArt, Map<string, HTMLCanvasElement>>();

/** The pixels of `frameId` whose colour index is in `indices` (and, if given, above row `belowRow`), as a 320 x 200 mask of 0 and 1. */
export function frameMask(art: TitleArt, frameId: string, indices: readonly number[], belowRow = TITLE_ART_HEIGHT): Uint8Array | null {
  const frame = art.frame(frameId);
  if (!frame) return null;
  const mask = new Uint8Array(TITLE_ART_WIDTH * TITLE_ART_HEIGHT);
  for (let y = 0; y < Math.min(belowRow, TITLE_ART_HEIGHT); y += 1) {
    const row = frame.rows[y] as string;
    for (let x = 0; x < TITLE_ART_WIDTH; x += 1) if (indices.includes(row.charCodeAt(x) - 48)) mask[y * TITLE_ART_WIDTH + x] = 1;
  }
  return mask;
}

/** A smooth 4 times enlargement of a mask, kept under `key`. */
export function maskLayer(art: TitleArt, key: string, make: () => Uint8Array | null): HTMLCanvasElement | null {
  if (typeof document === "undefined") return null;
  let layers = cache.get(art);
  if (!layers) cache.set(art, (layers = new Map()));
  const known = layers.get(key);
  if (known) return known;
  const mask = make();
  if (!mask) return null;
  const layer = upscaleMask(mask, TITLE_ART_WIDTH, TITLE_ART_HEIGHT);
  layers.set(key, layer);
  return layer;
}

/** The layer of the pixels of `frameId` in the colours `indices`. */
export function frameLayer(art: TitleArt, frameId: string, indices: readonly number[]): HTMLCanvasElement | null {
  return maskLayer(art, `${frameId}:${indices.join(",")}`, () => frameMask(art, frameId, indices));
}

/** `src` filled with a colour or gradient, keeping its shape, as a new canvas. */
export function tinted(src: HTMLCanvasElement, fill: (c: CanvasRenderingContext2D, w: number, h: number) => CanvasGradient | string): HTMLCanvasElement {
  const out = document.createElement("canvas");
  out.width = src.width;
  out.height = src.height;
  const c = out.getContext("2d");
  if (!c) return out;
  c.drawImage(src, 0, 0);
  c.globalCompositeOperation = "source-in";
  c.fillStyle = fill(c, out.width, out.height);
  c.fillRect(0, 0, out.width, out.height);
  return out;
}

const tintCache = new WeakMap<HTMLCanvasElement, Map<string, HTMLCanvasElement>>();

/** A cached coloured version of a layer (`key` names the colour). */
export function coloured(src: HTMLCanvasElement, key: string, fill: (c: CanvasRenderingContext2D, w: number, h: number) => CanvasGradient | string): HTMLCanvasElement {
  let m = tintCache.get(src);
  if (!m) tintCache.set(src, (m = new Map()));
  let r = m.get(key);
  if (!r) m.set(key, (r = tinted(src, fill)));
  return r;
}

const outlineCache = new WeakMap<HTMLCanvasElement, Map<number, HTMLCanvasElement>>();

/** Just the edge of a layer: the shape minus itself pulled in by `width` pixels (a ring along its border), kept per width. */
export function outlineOf(src: HTMLCanvasElement, width: number): HTMLCanvasElement {
  let m = outlineCache.get(src);
  if (!m) outlineCache.set(src, (m = new Map()));
  const known = m.get(width);
  if (known) return known;
  const make = (): HTMLCanvasElement => {
    const k = document.createElement("canvas");
    k.width = src.width;
    k.height = src.height;
    return k;
  };
  // the shape pulled in by `width` is where every shifted copy of it is solid too; the ring is the shape without that
  const inner = make();
  const ic = inner.getContext("2d");
  const out = make();
  const oc = out.getContext("2d");
  if (ic && oc) {
    ic.drawImage(src, 0, 0);
    ic.globalCompositeOperation = "destination-in";
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]] as const) ic.drawImage(src, dx * width, dy * width);
    oc.drawImage(src, 0, 0);
    oc.globalCompositeOperation = "destination-out";
    oc.drawImage(inner, 0, 0);
  }
  m.set(width, out);
  return out;
}