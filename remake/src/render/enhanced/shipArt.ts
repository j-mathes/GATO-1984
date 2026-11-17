import { closeHull, maskOf, thinPixels } from "../hull.js";
import type { SpriteLibrary } from "../sprites.js";
import { ISLAND, SHIP_HULL, darken, lighten, mix, parseHex } from "./colors.js";

/** A shaded picture of a ship or island, with its anchor (the point that sits on the horizon) in the picture's own pixels. */
export interface ShadedImage {
  canvas: HTMLCanvasElement;
  /** Anchor in canvas pixels. */
  originX: number;
  originY: number;
  /** Canvas pixels per pixel of the original sprite. */
  density: number;
}

/** Each ship sprite is enlarged this many times, with its edges smoothed, before it is shaded. */
const UPSCALE = 4;

/** An enlarged copy of a sprite cell: smooth scaling, then every pixel is made solid or empty, which rounds the stair-steps off. */
function upscaleCrisp(src: CanvasImageSource, cell: { x: number; y: number; w: number; h: number }): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = cell.w * UPSCALE;
  canvas.height = cell.h * UPSCALE;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(src, cell.x, cell.y, cell.w, cell.h, 0, 0, canvas.width, canvas.height);
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
  for (let i = 3; i < data.data.length; i += 4) data.data[i] = (data.data[i] ?? 0) < 110 ? 0 : 255;
  ctx.putImageData(data, 0, 0);
  return canvas;
}

/** An enlarged copy of a 0/1 mask: smooth scaling, then every pixel is made solid or empty, which rounds the stair-steps off. */
export function upscaleMask(mask: Uint8Array, w: number, h: number, blur = 0): HTMLCanvasElement {
  const small = document.createElement("canvas");
  small.width = w;
  small.height = h;
  const sx = small.getContext("2d");
  const out = document.createElement("canvas");
  out.width = w * UPSCALE;
  out.height = h * UPSCALE;
  const ctx = out.getContext("2d");
  if (!sx || !ctx) return out;
  const img = sx.createImageData(w, h);
  for (let i = 0; i < mask.length; i += 1) {
    img.data[i * 4] = 255;
    img.data[i * 4 + 1] = 255;
    img.data[i * 4 + 2] = 255;
    img.data[i * 4 + 3] = mask[i] ? 255 : 0;
  }
  sx.putImageData(img, 0, 0);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  // a blur before the cut-off rounds the corners of the stair-steps (used for the coarse island bitmaps)
  if (blur > 0) ctx.filter = `blur(${blur}px)`;
  ctx.drawImage(small, 0, 0, out.width, out.height);
  ctx.filter = "none";
  const data = ctx.getImageData(0, 0, out.width, out.height);
  for (let i = 3; i < data.data.length; i += 4) data.data[i] = (data.data[i] ?? 0) < (blur > 0 ? 128 : 110) ? 0 : 255;
  ctx.putImageData(data, 0, 0);
  return out;
}

/**
 * Colours the original's line art: each ship's solid silhouette (its hull closed below the deck) is filled with a vertical shading (light
 * from above) in the hull colour of its role, its thin lines are drawn as fine dark strokes, and the line-art details go over it. Everything is made
 * once per picture and kept. The islands of the scope, which only exist as an outline, are filled by finding the area the outline
 * encloses. Needs a DOM (canvas); without one nothing is made.
 */
export class ShipArt {
  private readonly ships = new Map<string, ShadedImage | null>();
  private readonly islands = new Map<string, ShadedImage | null>();
  private readonly lands = new Map<string, ShadedImage | null>();

  constructor(private readonly sprites: SpriteLibrary | null) {}

  /** `night` darkens the colours; frame 0..15 is the view angle. */
  ship(typeCode: number, frame: number, night: boolean): ShadedImage | null {
    const key = `${typeCode}|${((frame % 16) + 16) % 16}|${night ? 1 : 0}`;
    if (this.ships.has(key)) return this.ships.get(key) ?? null;
    const made = this.makeShip(typeCode, frame, night);
    this.ships.set(key, made);
    return made;
  }

  island(shape: number, night: boolean): ShadedImage | null {
    const key = `${shape}|${night ? 1 : 0}`;
    if (this.islands.has(key)) return this.islands.get(key) ?? null;
    const made = this.makeIsland(shape, night);
    this.islands.set(key, made);
    return made;
  }

  private makeShip(typeCode: number, frame: number, night: boolean): ShadedImage | null {
    const sprites = this.sprites;
    const hull = SHIP_HULL[typeCode];
    if (!sprites || !hull || typeof document === "undefined") return null;
    const solid = sprites.ship(typeCode, frame, false);
    const lines = sprites.ship(typeCode, frame, true);
    if (!solid) return null;
    const { cell, origin } = solid.frame;
    const flat = document.createElement("canvas");
    flat.width = cell.w;
    flat.height = cell.h;
    const fx = flat.getContext("2d");
    if (!fx) return null;
    fx.drawImage(solid.img, cell.x, cell.y, cell.w, cell.h, 0, 0, cell.w, cell.h);
    const closed = closeHull(maskOf(fx.getImageData(0, 0, cell.w, cell.h).data, cell.w, cell.h), cell.w, cell.h, origin.y - cell.y);
    const thin = thinPixels(closed, cell.w, cell.h);
    const thick = closed.map((v, i) => (v && !thin[i] ? 1 : 0));

    const canvas = upscaleMask(thick, cell.w, cell.h);
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    const tone = (c: string): string => (night ? darken(mix(c, "#a9bcd8", 0.28), 0.1) : c);
    const mark = tone(darken(hull, 0.55));
    // the solid parts, shaded from light above to dark at the waterline
    ctx.globalCompositeOperation = "source-in";
    const shade = ctx.createLinearGradient(0, 0, 0, canvas.height);
    shade.addColorStop(0, tone(lighten(hull, 0.38)));
    shade.addColorStop(0.45, tone(hull));
    shade.addColorStop(0.85, tone(darken(hull, night ? 0.15 : 0.28)));
    shade.addColorStop(1, tone(darken(hull, night ? 0.3 : 0.5)));
    ctx.fillStyle = shade;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // the thin parts (rigging, stubs) as fine dark lines, joined to every solid neighbour
    ctx.globalCompositeOperation = "source-over";
    ctx.strokeStyle = mark;
    ctx.fillStyle = mark;
    ctx.lineWidth = UPSCALE * 0.55;
    ctx.lineCap = "round";
    const at = (x: number, y: number): number => (x >= 0 && y >= 0 && x < cell.w && y < cell.h ? (closed[y * cell.w + x] ?? 0) : 0);
    ctx.beginPath();
    for (let y = 0; y < cell.h; y += 1) {
      for (let x = 0; x < cell.w; x += 1) {
        if (!thin[y * cell.w + x]) continue;
        const cx = (x + 0.5) * UPSCALE;
        const cy = (y + 0.5) * UPSCALE;
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx, cy);
        for (const [dx, dy] of [[1, 0], [0, 1], [1, 1], [-1, 1]] as const) {
          if (at(x + dx, y + dy)) {
            ctx.moveTo(cx, cy);
            ctx.lineTo((x + dx + 0.5) * UPSCALE, (y + dy + 0.5) * UPSCALE);
          }
        }
      }
    }
    ctx.stroke();
    // the original line art (windows, hatches) over the hull, faintly
    if (lines) {
      ctx.globalCompositeOperation = "source-atop";
      ctx.globalAlpha = 0.5;
      ctx.drawImage(upscaleCrisp(sprites.tint(lines.img, tone(darken(hull, 0.55))), cell), 0, 0);
      ctx.globalAlpha = 1;
    }
    // a light edge along the tops: the picture minus itself moved down, tinted
    const rim = document.createElement("canvas");
    rim.width = canvas.width;
    rim.height = canvas.height;
    const rx = rim.getContext("2d");
    if (rx) {
      rx.drawImage(canvas, 0, 0);
      rx.globalCompositeOperation = "destination-out";
      rx.drawImage(canvas, 0, UPSCALE * 1.2);
      rx.globalCompositeOperation = "source-in";
      rx.fillStyle = night ? "#dbe7f8" : lighten(hull, 0.6);
      rx.fillRect(0, 0, rim.width, rim.height);
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = night ? 0.7 : 0.35;
      ctx.drawImage(rim, 0, 0);
      ctx.globalAlpha = 1;
    }
    return { canvas, originX: (origin.x - cell.x) * UPSCALE, originY: (origin.y - cell.y) * UPSCALE, density: UPSCALE };
  }

  /**
   * An island of the quadrant map from the bitmap the original draws there (rows of palette indices, 0 = nothing): its outline is the shape,
   * smoothed and filled green with a sand shore. `rows` and its key come from cockpit_layouts.json (quadrant_map dynamic.islands).
   */
  landFromRows(key: string, rows: readonly string[], night: boolean): ShadedImage | null {
    const cached = this.lands.get(`${key}|${night ? 1 : 0}`);
    if (cached !== undefined) return cached;
    const made = this.makeLand(rows, night);
    this.lands.set(`${key}|${night ? 1 : 0}`, made);
    return made;
  }

  private makeLand(rows: readonly string[], night: boolean): ShadedImage | null {
    if (typeof document === "undefined" || rows.length === 0) return null;
    const w = Math.max(...rows.map((r) => r.length));
    const h = rows.length;
    const mask = new Uint8Array(w * h);
    rows.forEach((row, y) => {
      for (let x = 0; x < row.length; x += 1) if (row.charAt(x) !== "0") mask[y * w + x] = 1;
    });
    const canvas = upscaleMask(mask, w, h, UPSCALE * 1.3);
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    const k = night ? 0.45 : 1;
    // the shore: the land minus itself shrunk
    const inner = document.createElement("canvas");
    inner.width = canvas.width;
    inner.height = canvas.height;
    const ix = inner.getContext("2d");
    if (ix) {
      ix.drawImage(canvas, 0, 0);
      ix.globalCompositeOperation = "destination-in";
      for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, 1], [-1, 1], [1, -1]] as const) ix.drawImage(canvas, dx * UPSCALE * 0.7, dy * UPSCALE * 0.7);
    }
    ctx.globalCompositeOperation = "source-in";
    const fill = ctx.createLinearGradient(0, 0, 0, canvas.height);
    fill.addColorStop(0, mix(ISLAND.top, "#000000", 1 - k));
    fill.addColorStop(1, mix(ISLAND.bottom, "#000000", 1 - k));
    ctx.fillStyle = fill;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (ix) {
      const shore = document.createElement("canvas");
      shore.width = canvas.width;
      shore.height = canvas.height;
      const sx = shore.getContext("2d");
      if (sx) {
        sx.drawImage(canvas, 0, 0);
        sx.globalCompositeOperation = "destination-out";
        sx.drawImage(inner, 0, 0);
        sx.globalCompositeOperation = "source-in";
        sx.fillStyle = mix(ISLAND.shore, "#000000", 1 - k);
        sx.fillRect(0, 0, shore.width, shore.height);
        ctx.globalCompositeOperation = "source-over";
        ctx.drawImage(shore, 0, 0);
      }
    }
    return { canvas, originX: 0, originY: 0, density: UPSCALE };
  }

  private makeIsland(shape: number, night: boolean): ShadedImage | null {
    const img = this.sprites?.islandPicture(shape);
    if (!img || typeof document === "undefined") return null;
    const w = img.width;
    const h = img.height;
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0);
    const data = ctx.getImageData(0, 0, w, h);
    const inside = enclosedPixels(data.data, w, h);
    const k = night ? 0.4 : 1;
    const shore = parseHex(mix(ISLAND.shore, "#000000", 1 - k));
    for (let y = 0; y < h; y += 1) {
      const [r, g, b] = parseHex(mix(ISLAND.top, ISLAND.bottom, y / Math.max(h - 1, 1)));
      for (let x = 0; x < w; x += 1) {
        const i = y * w + x;
        const o = i * 4;
        if (inside[i]) {
          data.data[o] = r * k;
          data.data[o + 1] = g * k;
          data.data[o + 2] = b * k;
          data.data[o + 3] = 255;
        } else if ((data.data[o + 3] ?? 0) > 0) {
          data.data[o] = shore[0];
          data.data[o + 1] = shore[1];
          data.data[o + 2] = shore[2];
          data.data[o + 3] = 255;
        }
      }
    }
    ctx.putImageData(data, 0, 0);
    return { canvas, originX: w / 2, originY: h, density: 1 };
  }
}

/**
 * Pixels that are empty (alpha 0) and cut off from the picture's border by the outline: the inside of a closed line drawing.
 * An outline with a gap lets the outside flow in, so nothing is marked and the picture stays an outline.
 */
export function enclosedPixels(rgba: ArrayLike<number>, width: number, height: number): Uint8Array {
  const outside = new Uint8Array(width * height);
  const stack: number[] = [];
  const empty = (i: number): boolean => (rgba[i * 4 + 3] ?? 0) === 0;
  const push = (x: number, y: number): void => {
    const i = y * width + x;
    if (!outside[i] && empty(i)) {
      outside[i] = 1;
      stack.push(i);
    }
  };
  for (let x = 0; x < width; x += 1) {
    push(x, 0);
    push(x, height - 1);
  }
  for (let y = 0; y < height; y += 1) {
    push(0, y);
    push(width - 1, y);
  }
  while (stack.length > 0) {
    const i = stack.pop() as number;
    const x = i % width;
    const y = (i - x) / width;
    if (x > 0) push(x - 1, y);
    if (x < width - 1) push(x + 1, y);
    if (y > 0) push(x, y - 1);
    if (y < height - 1) push(x, y + 1);
  }
  const inside = new Uint8Array(width * height);
  for (let i = 0; i < inside.length; i += 1) if (empty(i) && !outside[i]) inside[i] = 1;
  return inside;
}
