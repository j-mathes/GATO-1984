/** CGA-style palette (palette 0, high intensity) plus the greys used for text. */
export const COLORS = {
  black: "#000000",
  green: "#55ff55",
  red: "#ff5555",
  yellow: "#ffff55",
  white: "#ffffff",
  grey: "#aaaaaa",
  cyan: "#55ffff",
  blue: "#0000aa",
  brown: "#aa5500",
} as const;

/** The original picture: 320 x 200, drawn at x2 on a 640 x 400 canvas. */
export const LOGICAL_WIDTH = 320;
export const LOGICAL_HEIGHT = 200;
export const ORIGINAL_SCALE = 2;
export const COLUMNS = 40;
export const ROWS = 25;

/**
 * A look for the text screens of the enhanced graphics: while a skin is set, `clear()` paints its backdrop, the CGA colours are mapped to its
 * own (cream, amber...) and `text()` is set in a typewriter face. The screens themselves are not touched; they draw as they always do.
 */
export interface TextSkin {
  backdrop(g: Gfx): void;
  colors: Readonly<Record<string, string>>;
  bodyFont: string;
  titleFont: string;
}


/**
 * Thin wrapper around a 2D canvas context. All drawing goes through here so screens stay free of canvas details.
 *
 * Screens draw in a *view*: a logical space (the original's 320 x 200 with its 40 x 25 text grid, or the enhanced renderer's larger space)
 * that is fitted into the canvas and centred. The canvas ("backing store") has its own size, so the same code can draw at the original's
 * 640 x 400 or sharply at the display's resolution. In the original view on a 640 x 400 canvas the factor is exactly 2 and the offset 0,
 * so every call produces what the fixed x2 version did.
 */
export class Gfx {
  readonly ctx: CanvasRenderingContext2D;
  private viewW = LOGICAL_WIDTH;
  private viewH = LOGICAL_HEIGHT;
  /** Canvas pixels per logical unit, and the canvas position of the logical origin. */
  private unit = ORIGINAL_SCALE;
  private ox = 0;
  private oy = 0;
  /** The look of the text screens (see {@link TextSkin}); null draws the original's. */
  skin: TextSkin | null = null;

  constructor(readonly canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D is not available");
    this.ctx = ctx;
    canvas.width = LOGICAL_WIDTH * ORIGINAL_SCALE;
    canvas.height = LOGICAL_HEIGHT * ORIGINAL_SCALE;
    ctx.imageSmoothingEnabled = false;
  }

  get backingWidth(): number {
    return this.canvas.width;
  }

  get backingHeight(): number {
    return this.canvas.height;
  }

  get viewWidth(): number {
    return this.viewW;
  }

  get viewHeight(): number {
    return this.viewH;
  }

  /** Canvas pixels per logical unit of the current view. */
  get scale(): number {
    return this.unit;
  }

  /** Sets the size of the canvas itself (this clears it, like any canvas resize) and refits the current view. */
  resizeBacking(width: number, height: number): void {
    if (this.canvas.width === width && this.canvas.height === height) return;
    this.canvas.width = width;
    this.canvas.height = height;
    this.ctx.imageSmoothingEnabled = false;
    this.view(this.viewW, this.viewH);
  }

  /** Draws in a logical space of `width` x `height` units from now on, fitted into the canvas and centred. */
  view(width: number, height: number): void {
    this.viewW = width;
    this.viewH = height;
    this.unit = Math.min(this.canvas.width / width, this.canvas.height / height);
    this.ox = (this.canvas.width - width * this.unit) / 2;
    this.oy = (this.canvas.height - height * this.unit) / 2;
  }

  /** Canvas position of a logical x, y and length (for drawing that needs the canvas directly: gradients, paths, fonts). */
  toX(x: number): number {
    return x * this.unit + this.ox;
  }

  toY(y: number): number {
    return y * this.unit + this.oy;
  }

  toLength(length: number): number {
    return length * this.unit;
  }

  /** Smooth scaling for images (the enhanced scenes); the original pictures are always drawn without it. */
  smooth(on: boolean): void {
    this.ctx.imageSmoothingEnabled = on;
    if (on) this.ctx.imageSmoothingQuality = "high";
  }

  /** The whole canvas, bars included, in one colour (a view that does not fill the canvas leaves them as they are otherwise). */
  fillBacking(color: string): void {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  /** A colour as the current skin shows it (the CGA colours the screens ask for become the skin's); unchanged without a skin. */
  private tone(color: string): string {
    return this.skin?.colors[color] ?? color;
  }

  clear(color: string = COLORS.black): void {
    if (this.skin) this.skin.backdrop(this);
    else this.rect(0, 0, this.viewW, this.viewH, color);
  }

  rect(x: number, y: number, w: number, h: number, color: string, fill = true): void {
    const c = this.ctx;
    const u = this.unit;
    if (fill) {
      c.fillStyle = this.tone(color);
      c.fillRect(x * u + this.ox, y * u + this.oy, w * u, h * u);
    } else {
      c.strokeStyle = this.tone(color);
      c.lineWidth = u;
      c.strokeRect(x * u + this.ox + 1, y * u + this.oy + 1, w * u - 2, h * u - 2);
    }
  }

  line(x1: number, y1: number, x2: number, y2: number, color: string, width = 1): void {
    const c = this.ctx;
    c.strokeStyle = this.tone(color);
    c.lineWidth = this.unit * width;
    c.beginPath();
    c.moveTo(this.toX(x1), this.toY(y1));
    c.lineTo(this.toX(x2), this.toY(y2));
    c.stroke();
  }

  circle(cx: number, cy: number, r: number, color: string, fill = false, width = 1): void {
    const c = this.ctx;
    c.beginPath();
    c.arc(this.toX(cx), this.toY(cy), Math.max(r * this.unit, 0.5), 0, Math.PI * 2);
    if (fill) {
      c.fillStyle = this.tone(color);
      c.fill();
    } else {
      c.strokeStyle = this.tone(color);
      c.lineWidth = this.unit * width;
      c.stroke();
    }
  }

  ellipse(cx: number, cy: number, rx: number, ry: number, color: string, dashed = false): void {
    const c = this.ctx;
    const u = this.unit;
    c.beginPath();
    c.ellipse(this.toX(cx), this.toY(cy), Math.max(rx * u, 0.5), Math.max(ry * u, 0.5), 0, 0, Math.PI * 2);
    c.strokeStyle = this.tone(color);
    c.lineWidth = u;
    c.setLineDash(dashed ? [3 * u, 3 * u] : []);
    c.stroke();
    c.setLineDash([]);
  }

  /** Text on the 40x25 grid (1-based column/row like BASIC LOCATE). One glyph per cell so columns stay aligned; `title` picks the skin's title face. */
  text(col: number, row: number, s: string, color: string = COLORS.grey, title = false): void {
    const c = this.ctx;
    const u = this.unit;
    c.fillStyle = this.tone(color);
    if (this.skin) {
      c.font = `${title ? "" : "bold "}${(title ? 9.5 : 9.6) * u}px ${title ? this.skin.titleFont : this.skin.bodyFont}`;
      c.textBaseline = "middle";
    } else {
      c.font = `bold ${8 * u + 2}px "Courier New", Courier, monospace`;
      c.textBaseline = "top";
    }
    c.textAlign = "center";
    const y = this.skin ? (row - 1) * 8 * u + (title ? 5.4 : 4.4) * u + this.oy : (row - 1) * 8 * u + this.oy;
    for (let i = 0; i < s.length; i += 1) {
      const ch = s.charAt(i);
      if (ch !== " ") c.fillText(ch, (col - 1 + i) * 8 * u + 4 * u + this.ox, y);
    }
  }

  centered(row: number, s: string, color: string = COLORS.grey, title = false): void {
    this.text(Math.max(1, Math.floor((COLUMNS - s.length) / 2) + 1), row, s, color, title);
  }

  /** Text at pixel position (logical coordinates), left aligned, 8x8 glyphs. */
  textAt(x: number, y: number, s: string, color: string = COLORS.grey): void {
    this.text(Math.round(x / 8) + 1, Math.round(y / 8) + 1, s, color);
  }

  /** 80-column text (WIDTH 80, used by the history viewer): 4 logical units per column, 8 per row. */
  text80(col: number, row: number, s: string, color: string = COLORS.grey): void {
    const c = this.ctx;
    const u = this.unit;
    c.fillStyle = this.tone(color);
    c.font = this.skin ? `bold ${6.8 * u}px ${this.skin.bodyFont}` : `bold ${6.5 * u}px "Courier New", Courier, monospace`;
    c.textBaseline = this.skin ? "middle" : "top";
    c.textAlign = "center";
    const y = ((row - 1) * 8 + (this.skin ? 4 : 0.5)) * u + this.oy;
    for (let i = 0; i < s.length; i += 1) {
      const ch = s.charAt(i);
      if (ch !== " ") c.fillText(ch, ((col - 1 + i) * 4 + 2) * u + this.ox, y);
    }
  }

  image(img: CanvasImageSource, sx: number, sy: number, sw: number, sh: number, dx: number, dy: number, dw: number, dh: number): void {
    this.ctx.drawImage(img, sx, sy, sw, sh, dx * this.unit + this.ox, dy * this.unit + this.oy, dw * this.unit, dh * this.unit);
  }

  clip(x: number, y: number, w: number, h: number): void {
    const c = this.ctx;
    c.save();
    c.beginPath();
    c.rect(x * this.unit + this.ox, y * this.unit + this.oy, w * this.unit, h * this.unit);
    c.clip();
  }

  unclip(): void {
    this.ctx.restore();
  }
}
