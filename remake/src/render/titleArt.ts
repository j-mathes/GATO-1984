/** Title artwork rebuilt from GATO.EXE by analysis/export_title_art.py (public/assets/title_screen.json). */

export const TITLE_ART_FORMAT = "gato-cga-title/1";
export const TITLE_ART_WIDTH = 320;
export const TITLE_ART_HEIGHT = 200;

export interface TitleText {
  /** 1-based LOCATE row/column on the 40x25 text grid. */
  row: number;
  col: number;
  text: string;
  /** Index into the frame palette (the BASIC foreground colour, 3). */
  colorIndex: number;
}

export interface TitleFrame {
  id: string;
  description: string;
  /** CSS colours for pixel values 0..3; value 0 is the screen background. */
  palette: string[];
  /** 200 rows of 320 digits, each 0..3. */
  rows: string[];
  text: TitleText[];
}

export interface TitleArtDocument {
  format: string;
  width: number;
  height: number;
  primary: string;
  frames: Record<string, TitleFrame>;
}

export type CanvasFactory = (width: number, height: number) => HTMLCanvasElement;

const HEX_COLOR = /^#[0-9a-f]{6}$/;
const ROW = /^[0-3]+$/;

/** Validates the exported JSON; throws a descriptive Error instead of letting a bad asset reach the renderer. */
export function parseTitleArt(raw: unknown): TitleArtDocument {
  const doc = raw as Partial<TitleArtDocument> | null;
  if (!doc || typeof doc !== "object") throw new Error("title art: not an object");
  if (doc.format !== TITLE_ART_FORMAT) throw new Error(`title art: unsupported format ${String(doc.format)}`);
  if (doc.width !== TITLE_ART_WIDTH || doc.height !== TITLE_ART_HEIGHT) throw new Error("title art: expected a 320x200 bitmap");
  if (!doc.frames || typeof doc.primary !== "string" || !(doc.primary in doc.frames)) throw new Error("title art: missing primary frame");
  for (const [id, frame] of Object.entries(doc.frames)) {
    if (frame.id !== id) throw new Error(`title art: frame ${id} has id ${frame.id}`);
    if (frame.palette.length !== 4 || !frame.palette.every((c) => HEX_COLOR.test(c))) throw new Error(`title art: bad palette in ${id}`);
    if (frame.rows.length !== TITLE_ART_HEIGHT) throw new Error(`title art: ${id} has ${frame.rows.length} rows`);
    frame.rows.forEach((row, y) => {
      if (row.length !== TITLE_ART_WIDTH || !ROW.test(row)) throw new Error(`title art: ${id} row ${y} is not 320 two-bit pixels`);
    });
    for (const t of frame.text) {
      if (t.row < 1 || t.row > 25 || t.col < 1 || t.col > 40 || t.colorIndex < 0 || t.colorIndex > 3) {
        throw new Error(`title art: text "${t.text}" in ${id} is off the 40x25 grid`);
      }
    }
  }
  return doc as TitleArtDocument;
}

/** RGBA pixels (320x200) of a frame, ready for ImageData. */
export function frameToRgba(frame: TitleFrame): Uint8ClampedArray {
  const rgb = frame.palette.map((c) => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)]);
  const out = new Uint8ClampedArray(TITLE_ART_WIDTH * TITLE_ART_HEIGHT * 4);
  frame.rows.forEach((row, y) => {
    for (let x = 0; x < TITLE_ART_WIDTH; x += 1) {
      const [r, g, b] = rgb[row.charCodeAt(x) - 48] as number[];
      const o = (y * TITLE_ART_WIDTH + x) * 4;
      out[o] = r as number;
      out[o + 1] = g as number;
      out[o + 2] = b as number;
      out[o + 3] = 255;
    }
  });
  return out;
}

function documentCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

export class TitleArt {
  private readonly canvases = new Map<string, HTMLCanvasElement>();

  constructor(
    readonly doc: TitleArtDocument,
    private readonly makeCanvas: CanvasFactory = documentCanvas,
  ) {}

  static async load(url = "assets/title_screen.json", makeCanvas?: CanvasFactory): Promise<TitleArt> {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`title art: ${res.status}`);
    return new TitleArt(parseTitleArt(await res.json()), makeCanvas);
  }

  get primary(): TitleFrame {
    return this.doc.frames[this.doc.primary] as TitleFrame;
  }

  frame(id: string): TitleFrame | undefined {
    return this.doc.frames[id];
  }

  /** The frame's pixels as an offscreen 320x200 canvas (built once), blitted by Gfx.image like any sprite. */
  image(id: string = this.doc.primary): HTMLCanvasElement {
    let canvas = this.canvases.get(id);
    if (!canvas) {
      const frame = this.frame(id);
      if (!frame) throw new Error(`title art: no frame ${id}`);
      canvas = this.makeCanvas(TITLE_ART_WIDTH, TITLE_ART_HEIGHT);
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas 2D is not available");
      const image = ctx.createImageData(TITLE_ART_WIDTH, TITLE_ART_HEIGHT);
      image.data.set(frameToRgba(frame));
      ctx.putImageData(image, 0, 0);
      this.canvases.set(id, canvas);
    }
    return canvas;
  }
}
