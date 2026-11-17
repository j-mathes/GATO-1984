import { describe, expect, it } from "vitest";
import { Gfx } from "./gfx.js";

/** A canvas whose 2D context writes down every call and every property that is set. */
function recordingCanvas(): { canvas: HTMLCanvasElement; log: string[] } {
  const log: string[] = [];
  const ctx = new Proxy({}, {
    get: (_t, name: string) => (...args: unknown[]) => log.push(`${name}(${args.map((a) => (typeof a === "object" ? "[img]" : String(a))).join(",")})`),
    set: (_t, name: string, value: unknown) => {
      log.push(`${name}=${String(value)}`);
      return true;
    },
  });
  const canvas = { width: 0, height: 0, getContext: () => ctx } as unknown as HTMLCanvasElement;
  return { canvas, log };
}

/** Every drawing call of Gfx once, as the original screens use them. */
function drawOriginalSample(g: Gfx): void {
  g.clear("#000000");
  g.rect(10, 20, 30, 40, "#ff0000");
  g.rect(10, 20, 30, 40, "#00ff00", false);
  g.line(1, 2, 3, 4, "#ffffff");
  g.circle(50, 60, 7, "#55ffff", true);
  g.circle(50, 60, 7, "#55ffff");
  g.ellipse(70, 80, 9, 5, "#ff55ff", true);
  g.text(3, 4, "A B", "#aaaaaa");
  g.centered(5, "HELLO", "#ffffff");
  g.textAt(16, 24, "XY", "#ffff55");
  g.text80(2, 3, "WIDE", "#aaaaaa");
  g.image({} as CanvasImageSource, 0, 0, 16, 16, 100, 90, 32, 32);
  g.clip(5, 5, 100, 50);
  g.unclip();
}

describe("Gfx in the original 320x200 view", () => {
  it("sizes the canvas 640x400 and draws exactly as before the resolution work (golden transcript)", () => {
    const { canvas, log } = recordingCanvas();
    const g = new Gfx(canvas);
    expect([canvas.width, canvas.height]).toEqual([640, 400]);
    drawOriginalSample(g);
    expect(log).toMatchSnapshot();
  });
});

describe("Gfx views", () => {
  it("fits a logical space into the canvas and centres it, so the original view can sit inside a bigger canvas", () => {
    const { canvas, log } = recordingCanvas();
    const g = new Gfx(canvas);
    g.resizeBacking(2560, 1440);
    g.view(1422, 800); // 16:9 fills the canvas (to a fifth of a pixel)
    expect(g.scale).toBe(1.8);
    expect(g.toX(0)).toBeCloseTo(0.2, 3);
    expect(g.toY(0)).toBe(0);
    g.view(1280, 800); // 8:5 is centred with bars left and right
    expect(g.scale).toBe(1.8);
    expect(g.toX(0)).toBeCloseTo(128, 5);
    g.view(320, 200); // the original picture, letterboxed: 7.2 canvas pixels per unit
    expect(g.scale).toBeCloseTo(7.2, 5);
    log.length = 0;
    g.rect(10, 20, 30, 40, "#ff0000");
    expect(log).toEqual(["fillStyle=#ff0000", `fillRect(${10 * g.scale + g.toX(0)},${20 * g.scale},${30 * g.scale},${40 * g.scale})`]);
  });

  it("returns to exactly the original mapping when the canvas is 640x400 again", () => {
    const { canvas } = recordingCanvas();
    const g = new Gfx(canvas);
    g.resizeBacking(2560, 1440);
    g.view(1422, 800);
    g.resizeBacking(640, 400);
    g.view(320, 200);
    expect([g.scale, g.toX(0), g.toY(0)]).toEqual([2, 0, 0]);
  });
});

