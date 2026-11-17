import { closeHull, maskOf } from "./hull.js";

export interface SheetFrame {
  cell: { x: number; y: number; w: number; h: number };
  origin: { x: number; y: number };
}

export interface ShipSheet {
  id: string;
  object_type: number;
  image_outline: string;
  image_silhouette: string;
  frames: SheetFrame[];
}

interface SheetFile {
  sheets: (Partial<ShipSheet> & { id: string; kind: string; image?: string })[];
}

export interface DrawnSprite {
  img: HTMLImageElement;
  frame: SheetFrame;
}

const ISLAND_PICTURES: Record<number, string> = { 1: "draw_gato1_13b84", 2: "draw_gato1_13bfa", 3: "draw_gato1_13c80" };

/**
 * Sprites exported by analysis/export_sprites.py: 16-frame atlases per ship type (OBX3..OBX8, outline and silhouette) and the three
 * island pictures (the DRAW strings the original keeps in its string pool, MXP column 5 selects one).
 */
export class SpriteLibrary {
  private sheets = new Map<number, ShipSheet>();
  private images = new Map<string, HTMLImageElement>();

  static async load(baseUrl = "assets/sprites/"): Promise<SpriteLibrary> {
    const lib = new SpriteLibrary();
    const res = await fetch(`${baseUrl}sprite_sheets.json`);
    if (!res.ok) throw new Error(`sprite sheets: ${res.status}`);
    const doc = (await res.json()) as SheetFile;
    const wanted = new Set<string>();
    for (const s of doc.sheets) {
      if (s.kind === "view_angle_frames" && s.object_type !== undefined && s.frames && s.image_outline && s.image_silhouette) {
        lib.sheets.set(s.object_type, s as ShipSheet);
        wanted.add(s.image_outline);
        wanted.add(s.image_silhouette);
      }
    }
    for (const id of Object.values(ISLAND_PICTURES)) wanted.add(`${id}.png`);
    await Promise.all([...wanted].map(async (name) => lib.images.set(name, await loadImage(`${baseUrl}${name}`))));
    return lib;
  }

  /** Ship (or island, type 1) view frame 0..15; `outline` selects the white outline atlas (night view). */
  ship(typeCode: number, frame: number, outline: boolean): DrawnSprite | null {
    const sheet = this.sheets.get(typeCode);
    if (!sheet) return null;
    const img = this.images.get(outline ? sheet.image_outline : sheet.image_silhouette);
    const f = sheet.frames[((frame % 16) + 16) % 16];
    return img && f ? { img, frame: f } : null;
  }

  /** Island picture 1..3 as a whole image (brown line art, as drawn by the original DRAW strings). */
  islandPicture(shape: number): HTMLImageElement | null {
    const id = ISLAND_PICTURES[shape];
    return id ? (this.images.get(`${id}.png`) ?? null) : null;
  }

  private readonly tinted = new Map<string, CanvasImageSource>();
  private readonly solids = new Map<string, CanvasImageSource | null>();

  /**
   * The ship as a solid silhouette of one colour: the original's silhouette atlas with the open hull closed (render/hull.ts), at the original's
   * own resolution and cell, so it replaces the line art in place. Needs a DOM; without one nothing is made.
   */
  solidShip(typeCode: number, frame: number, color: string): CanvasImageSource | null {
    const key = `${typeCode}|${((frame % 16) + 16) % 16}|${color}`;
    const cached = this.solids.get(key);
    if (cached !== undefined) return cached;
    let made: CanvasImageSource | null = null;
    const sprite = typeof document === "undefined" ? null : this.ship(typeCode, frame, false);
    if (sprite) {
      const { cell, origin } = sprite.frame;
      const canvas = document.createElement("canvas");
      canvas.width = cell.w;
      canvas.height = cell.h;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(sprite.img, cell.x, cell.y, cell.w, cell.h, 0, 0, cell.w, cell.h);
        const mask = closeHull(maskOf(ctx.getImageData(0, 0, cell.w, cell.h).data, cell.w, cell.h), cell.w, cell.h, origin.y - cell.y);
        const out = ctx.createImageData(cell.w, cell.h);
        const [r, g, b] = [parseInt(color.slice(1, 3), 16), parseInt(color.slice(3, 5), 16), parseInt(color.slice(5, 7), 16)];
        for (let i = 0; i < mask.length; i += 1) {
          if (!mask[i]) continue;
          out.data[i * 4] = r;
          out.data[i * 4 + 1] = g;
          out.data[i * 4 + 2] = b;
          out.data[i * 4 + 3] = 255;
        }
        ctx.putImageData(out, 0, 0);
        made = canvas;
      }
    }
    this.solids.set(key, made);
    return made;
  }

  /** The same line art in another colour (cached); without a DOM the original image is returned. */
  tint(img: HTMLImageElement, color: string): CanvasImageSource {
    if (typeof document === "undefined") return img;
    const key = `${img.src}|${color}`;
    let out = this.tinted.get(key);
    if (!out) {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return img;
      ctx.drawImage(img, 0, 0);
      ctx.globalCompositeOperation = "source-in";
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      out = canvas;
      this.tinted.set(key, out);
    }
    return out;
  }
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`cannot load ${url}`));
    img.src = url;
  });
}
