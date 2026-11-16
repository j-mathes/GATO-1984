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

export const LOGICAL_WIDTH = 320;
export const LOGICAL_HEIGHT = 200;
export const SCALE = 2;
export const COLUMNS = 40;
export const ROWS = 25;

/**
 * Thin wrapper around a 2D canvas context with the original's 320x200 coordinate space (scaled x2) and a 40x25 text grid.
 * All drawing goes through here so screens stay free of canvas details.
 */
export class Gfx {
  readonly ctx: CanvasRenderingContext2D;

  constructor(readonly canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D is not available");
    this.ctx = ctx;
    canvas.width = LOGICAL_WIDTH * SCALE;
    canvas.height = LOGICAL_HEIGHT * SCALE;
    ctx.imageSmoothingEnabled = false;
  }

  clear(color: string = COLORS.black): void {
    this.rect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT, color);
  }

  rect(x: number, y: number, w: number, h: number, color: string, fill = true): void {
    const c = this.ctx;
    if (fill) {
      c.fillStyle = color;
      c.fillRect(x * SCALE, y * SCALE, w * SCALE, h * SCALE);
    } else {
      c.strokeStyle = color;
      c.lineWidth = SCALE;
      c.strokeRect(x * SCALE + 1, y * SCALE + 1, w * SCALE - 2, h * SCALE - 2);
    }
  }

  line(x1: number, y1: number, x2: number, y2: number, color: string): void {
    const c = this.ctx;
    c.strokeStyle = color;
    c.lineWidth = SCALE;
    c.beginPath();
    c.moveTo(x1 * SCALE, y1 * SCALE);
    c.lineTo(x2 * SCALE, y2 * SCALE);
    c.stroke();
  }

  circle(cx: number, cy: number, r: number, color: string, fill = false): void {
    const c = this.ctx;
    c.beginPath();
    c.arc(cx * SCALE, cy * SCALE, Math.max(r * SCALE, 0.5), 0, Math.PI * 2);
    if (fill) {
      c.fillStyle = color;
      c.fill();
    } else {
      c.strokeStyle = color;
      c.lineWidth = SCALE;
      c.stroke();
    }
  }

  ellipse(cx: number, cy: number, rx: number, ry: number, color: string, dashed = false): void {
    const c = this.ctx;
    c.beginPath();
    c.ellipse(cx * SCALE, cy * SCALE, Math.max(rx * SCALE, 0.5), Math.max(ry * SCALE, 0.5), 0, 0, Math.PI * 2);
    c.strokeStyle = color;
    c.lineWidth = SCALE;
    c.setLineDash(dashed ? [3 * SCALE, 3 * SCALE] : []);
    c.stroke();
    c.setLineDash([]);
  }

  /** Text on the 40x25 grid (1-based column/row like BASIC LOCATE). One glyph per cell so columns stay aligned. */
  text(col: number, row: number, s: string, color: string = COLORS.grey): void {
    const c = this.ctx;
    c.fillStyle = color;
    c.font = `bold ${8 * SCALE + 2}px "Courier New", Courier, monospace`;
    c.textBaseline = "top";
    c.textAlign = "center";
    for (let i = 0; i < s.length; i += 1) {
      const ch = s.charAt(i);
      if (ch !== " ") c.fillText(ch, (col - 1 + i) * 8 * SCALE + 4 * SCALE, (row - 1) * 8 * SCALE);
    }
  }

  centered(row: number, s: string, color: string = COLORS.grey): void {
    this.text(Math.max(1, Math.floor((COLUMNS - s.length) / 2) + 1), row, s, color);
  }

  /** Text at pixel position (logical coordinates), left aligned, 8x8 glyphs. */
  textAt(x: number, y: number, s: string, color: string = COLORS.grey): void {
    this.text(Math.round(x / 8) + 1, Math.round(y / 8) + 1, s, color);
  }

  /** 80-column text (WIDTH 80, used by the history viewer): 8 canvas pixels per column, 16 per row. */
  text80(col: number, row: number, s: string, color: string = COLORS.grey): void {
    const c = this.ctx;
    c.fillStyle = color;
    c.font = `bold 13px "Courier New", Courier, monospace`;
    c.textBaseline = "top";
    c.textAlign = "center";
    for (let i = 0; i < s.length; i += 1) {
      const ch = s.charAt(i);
      if (ch !== " ") c.fillText(ch, (col - 1 + i) * 8 + 4, (row - 1) * 16 + 1);
    }
  }

  image(img: CanvasImageSource, sx: number, sy: number, sw: number, sh: number, dx: number, dy: number, dw: number, dh: number): void {
    this.ctx.drawImage(img, sx, sy, sw, sh, dx * SCALE, dy * SCALE, dw * SCALE, dh * SCALE);
  }

  clip(x: number, y: number, w: number, h: number): void {
    const c = this.ctx;
    c.save();
    c.beginPath();
    c.rect(x * SCALE, y * SCALE, w * SCALE, h * SCALE);
    c.clip();
  }

  unclip(): void {
    this.ctx.restore();
  }
}
