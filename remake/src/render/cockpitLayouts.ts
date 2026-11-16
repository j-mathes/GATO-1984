import { documentCanvas, type CanvasFactory } from "./titleArt.js";

/** Screen layouts of GATO1.EXE rebuilt by analysis/export_cockpit_layouts.py (public/assets/cockpit_layouts.json). */

export const COCKPIT_FORMAT = "gato-cockpit-layouts/1";
export const COCKPIT_WIDTH = 320;
export const COCKPIT_HEIGHT = 200;

export type ScreenName = "control_room" | "damage_report" | "radar" | "chart" | "quadrant_map" | "captains_log";
export const SCREEN_NAMES: readonly ScreenName[] = ["control_room", "damage_report", "radar", "chart", "quadrant_map", "captains_log"];

export interface LayoutText {
  /** 1-based LOCATE row/column on the 40x25 grid. */
  row: number;
  col: number;
  text: string;
}

export interface LayoutScreen {
  /** CSS colours of pixel values 0..3 (0 = background). */
  palette: string[];
  /** 2-bit packed 320x200 bitmap, base64. */
  staticPacked: string;
  text: LayoutText[];
  /** Coordinates and formulas of everything that moves (documented in analysis/gato1_screens.md). */
  dynamic: Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
}

export interface GlyphDoc {
  marker: { offset: [number, number]; rows: string[] };
  scopeArrows: Record<"F" | "P" | "A" | "S", { put: [number, number]; rows: string[] }>;
}

export interface CockpitDocument {
  format: string;
  width: number;
  height: number;
  sprites: { digits: string[][]; lightOn: string[]; lightOff: string[]; tubeReady: string[] };
  glyphs: GlyphDoc;
  screens: Record<ScreenName, LayoutScreen>;
}

const HEX_COLOR = /^#[0-9a-f]{6}$/;
const BITMAP_ROW = /^[0-3]+$/;

/** 64000 pixel values (0..3), row-major, from the packed form (first pixel in the high bits of each byte). */
export function decodePacked(b64: string): Uint8Array {
  const bin = atob(b64);
  if (bin.length !== (COCKPIT_WIDTH * COCKPIT_HEIGHT) / 4) throw new Error(`cockpit layouts: packed bitmap has ${bin.length} bytes`);
  const out = new Uint8Array(COCKPIT_WIDTH * COCKPIT_HEIGHT);
  for (let i = 0; i < bin.length; i += 1) {
    const b = bin.charCodeAt(i);
    out[i * 4] = (b >> 6) & 3;
    out[i * 4 + 1] = (b >> 4) & 3;
    out[i * 4 + 2] = (b >> 2) & 3;
    out[i * 4 + 3] = b & 3;
  }
  return out;
}

function checkBitmap(rows: string[], what: string): void {
  if (rows.length === 0 || !rows.every((r) => BITMAP_ROW.test(r) && r.length === rows[0]?.length)) throw new Error(`cockpit layouts: bad bitmap ${what}`);
}

/** Validates the exported JSON; throws instead of letting a damaged asset reach the renderer. */
export function parseCockpitLayouts(raw: unknown): CockpitDocument {
  const doc = raw as Partial<CockpitDocument> | null;
  if (!doc || typeof doc !== "object") throw new Error("cockpit layouts: not an object");
  if (doc.format !== COCKPIT_FORMAT) throw new Error(`cockpit layouts: unsupported format ${String(doc.format)}`);
  if (doc.width !== COCKPIT_WIDTH || doc.height !== COCKPIT_HEIGHT) throw new Error("cockpit layouts: expected a 320x200 bitmap");
  const { sprites, glyphs, screens } = doc;
  if (!sprites || !glyphs || !screens) throw new Error("cockpit layouts: missing sprites, glyphs or screens");
  if (sprites.digits.length !== 10) throw new Error("cockpit layouts: need ten digit sprites");
  sprites.digits.forEach((d, i) => checkBitmap(d, `digit ${i}`));
  checkBitmap(sprites.lightOn, "lightOn");
  checkBitmap(sprites.lightOff, "lightOff");
  checkBitmap(sprites.tubeReady, "tubeReady");
  checkBitmap(glyphs.marker.rows, "marker");
  for (const f of ["F", "P", "A", "S"] as const) checkBitmap(glyphs.scopeArrows[f].rows, `arrow ${f}`);
  for (const name of SCREEN_NAMES) {
    const s = screens[name];
    if (!s) throw new Error(`cockpit layouts: missing screen ${name}`);
    if (s.palette.length !== 4 || !s.palette.every((c) => HEX_COLOR.test(c))) throw new Error(`cockpit layouts: bad palette in ${name}`);
    decodePacked(s.staticPacked);
    for (const t of s.text) {
      if (t.row < 1 || t.row > 25 || t.col < 1 || t.col + t.text.length - 1 > 40) throw new Error(`cockpit layouts: text "${t.text}" in ${name} is off the 40x25 grid`);
    }
  }
  return doc as CockpitDocument;
}

export class CockpitLayouts {
  private readonly canvases = new Map<ScreenName, HTMLCanvasElement>();

  constructor(
    readonly doc: CockpitDocument,
    private readonly makeCanvas: CanvasFactory = documentCanvas,
  ) {}

  static async load(url = "assets/cockpit_layouts.json", makeCanvas?: CanvasFactory): Promise<CockpitLayouts> {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`cockpit layouts: ${res.status}`);
    return new CockpitLayouts(parseCockpitLayouts(await res.json()), makeCanvas);
  }

  screen(name: ScreenName): LayoutScreen {
    return this.doc.screens[name];
  }

  palette(name: ScreenName): string[] {
    return this.doc.screens[name].palette;
  }

  /** The static layer of a screen as an offscreen 320x200 canvas (built once). */
  image(name: ScreenName): HTMLCanvasElement {
    let canvas = this.canvases.get(name);
    if (!canvas) {
      const screen = this.screen(name);
      const rgb = screen.palette.map((c) => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)]);
      const pixels = decodePacked(screen.staticPacked);
      canvas = this.makeCanvas(COCKPIT_WIDTH, COCKPIT_HEIGHT);
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas 2D is not available");
      const image = ctx.createImageData(COCKPIT_WIDTH, COCKPIT_HEIGHT);
      pixels.forEach((v, i) => {
        const c = rgb[v] as number[];
        image.data[i * 4] = c[0] as number;
        image.data[i * 4 + 1] = c[1] as number;
        image.data[i * 4 + 2] = c[2] as number;
        image.data[i * 4 + 3] = 255;
      });
      ctx.putImageData(image, 0, 0);
      this.canvases.set(name, canvas);
    }
    return canvas;
  }
}
