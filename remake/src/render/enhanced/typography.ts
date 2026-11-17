import type { Gfx } from "../gfx.js";
import { ENHANCED_HEIGHT } from "../display.js";

/**
 * Fonts of the enhanced graphics: Courier Prime (body text, SIL Open Font License 1.1) and Special Elite (titles, Apache 2.0), both
 * monospace typewriter faces, so a column of text stays a column. The files and their licences are in public/assets/fonts/.
 */
export type FontRole = "body" | "title";

export const FONT_FAMILIES: Record<FontRole, string> = {
  body: '"Courier Prime", "Courier New", Courier, monospace',
  title: '"Special Elite", "Courier Prime", "Courier New", Courier, monospace',
};

export const FONT_FILES: readonly { family: string; file: string; weight: string }[] = [
  { family: "Courier Prime", file: "CourierPrime-Regular.ttf", weight: "400" },
  { family: "Courier Prime", file: "CourierPrime-Bold.ttf", weight: "700" },
  { family: "Special Elite", file: "SpecialElite-Regular.ttf", weight: "400" },
];

/** Loads the font files into the document. Resolves false (the fallback monospace fonts are used) when they cannot be loaded. */
export async function loadEnhancedFonts(base = "./assets/fonts/"): Promise<boolean> {
  if (typeof FontFace === "undefined" || typeof document === "undefined") return false;
  try {
    const faces = FONT_FILES.map((f) => new FontFace(f.family, `url(${base}${f.file})`, { weight: f.weight }));
    await Promise.all(faces.map((face) => face.load()));
    for (const face of faces) document.fonts.add(face);
    return true;
  } catch {
    return false;
  }
}

/** The 40 x 25 text grid of the original, laid over the enhanced space: square cells, centred in the view. */
export interface TextGrid {
  x: number;
  y: number;
  cellWidth: number;
  cellHeight: number;
}

export function textGrid(viewWidth: number, viewHeight: number = ENHANCED_HEIGHT): TextGrid {
  const cell = viewHeight / 25;
  return { x: (viewWidth - cell * 40) / 2, y: 0, cellWidth: cell, cellHeight: cell };
}

export interface TextStyle {
  role?: FontRole;
  bold?: boolean;
  /** Font size in logical units; the default fills the cell height. */
  size?: number;
}

function fontOf(g: Gfx, size: number, role: FontRole, bold: boolean): string {
  return `${bold ? "bold " : ""}${g.toLength(size)}px ${FONT_FAMILIES[role]}`;
}

/** Text on the grid (1-based column and row like LOCATE), one glyph per cell so columns stay aligned whatever the font's widths. */
export function drawGridText(g: Gfx, grid: TextGrid, col: number, row: number, s: string, color: string, style: TextStyle = {}): void {
  const c = g.ctx;
  c.fillStyle = color;
  c.font = fontOf(g, style.size ?? grid.cellHeight, style.role ?? "body", style.bold ?? false);
  c.textBaseline = "middle";
  c.textAlign = "center";
  for (let i = 0; i < s.length; i += 1) {
    const ch = s.charAt(i);
    if (ch !== " ") c.fillText(ch, g.toX(grid.x + (col - 1 + i + 0.5) * grid.cellWidth), g.toY(grid.y + (row - 0.5) * grid.cellHeight));
  }
}

/** A line of text at a logical position (for titles and labels that are not on the grid). */
export function drawText(g: Gfx, x: number, y: number, s: string, color: string, size: number, style: Omit<TextStyle, "size"> & { align?: CanvasTextAlign } = {}): void {
  const c = g.ctx;
  c.fillStyle = color;
  c.font = fontOf(g, size, style.role ?? "body", style.bold ?? false);
  c.textBaseline = "middle";
  c.textAlign = style.align ?? "left";
  c.fillText(s, g.toX(x), g.toY(y));
}
