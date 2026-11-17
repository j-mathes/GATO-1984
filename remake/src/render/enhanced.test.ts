import { describe, expect, it } from "vitest";
import { MAX_BACKING_WIDTH, backingSize, computeDisplaySize, computeLayout, enhancedViewSize } from "./display.js";
import { Gfx } from "./gfx.js";
import { EnhancedRenderer } from "./enhanced/scene.js";
import { drawGridText, textGrid } from "./enhanced/typography.js";

function recordingGfx(): { g: Gfx; log: string[] } {
  const log: string[] = [];
  const ctx = new Proxy({}, {
    get: (_t, name: string) => (...args: unknown[]) => log.push(`${name}(${args.map(String).join(",")})`),
    set: (_t, name: string, value: unknown) => {
      log.push(`${name}=${String(value)}`);
      return true;
    },
  });
  const canvas = { width: 0, height: 0, getContext: () => ctx } as unknown as HTMLCanvasElement;
  return { g: new Gfx(canvas), log };
}

describe("enhanced display sizes", () => {
  it("the logical space is 800 units high and as wide as the window's shape allows between 8:5 and 16:9", () => {
    expect(enhancedViewSize(2560, 1440)).toEqual({ width: 1422, height: 800 });
    expect(enhancedViewSize(1280, 800)).toEqual({ width: 1280, height: 800 });
    expect(enhancedViewSize(3440, 1440)).toEqual({ width: 1422, height: 800 }); // ultra-wide: bars at the sides
    expect(enhancedViewSize(900, 900)).toEqual({ width: 1280, height: 800 }); // squarer than 8:5: bars above and below
  });

  it("fills the window without whole-number scaling in every mode", () => {
    for (const mode of ["authentic", "fit", "crt"] as const) expect(computeDisplaySize(mode, 2560, 1440, "enhanced")).toEqual({ width: 2560, height: 1440 });
    expect(computeDisplaySize("authentic", 1000, 700, "enhanced")).toEqual({ width: 1000, height: 625 });
  });

  it("the canvas follows the device pixel ratio and is never wider than 2560 pixels", () => {
    expect(backingSize(1280, 720, 1)).toEqual({ width: 1280, height: 720 });
    expect(backingSize(1280, 720, 1.5)).toEqual({ width: 1920, height: 1080 });
    expect(backingSize(2560, 1440, 2)).toEqual({ width: MAX_BACKING_WIDTH, height: 1440 });
    expect(backingSize(1700, 956, 1.5, 2560)).toEqual({ width: 2550, height: 1434 });
  });

  it("the original layout stays 320x200 on a 640x400 canvas whatever the screen", () => {
    expect(computeLayout("authentic", "original", 2560, 1440, 2)).toMatchObject({ backingWidth: 640, backingHeight: 400, viewWidth: 320, viewHeight: 200, cssWidth: 2240, cssHeight: 1400 });
    expect(computeLayout("fit", "enhanced", 2560, 1440, 1)).toMatchObject({ backingWidth: 2560, backingHeight: 1440, viewWidth: 1422, viewHeight: 800 });
  });
});

describe("enhanced text grid", () => {
  it("40 x 25 square cells, centred in the view; one glyph per cell", () => {
    expect(textGrid(1280)).toEqual({ x: 0, y: 0, cellWidth: 32, cellHeight: 32 });
    expect(textGrid(1422).x).toBe(71);
    const { g, log } = recordingGfx();
    g.resizeBacking(1422, 800);
    g.view(1422, 800);
    log.length = 0;
    drawGridText(g, textGrid(1422), 2, 3, "A B", "#fff");
    expect(log.filter((l) => l.startsWith("fillText"))).toEqual(["fillText(A,119,80)", "fillText(B,183,80)"]); // columns 2 and 4, row 3 centred
  });
});

describe("enhanced scenes", () => {
  it("a screen without a scene is not enhanced; a registered one is found by screen", () => {
    const r = new EnhancedRenderer();
    expect(r.scene("control")).toBeUndefined();
    const scene = (): void => undefined;
    r.register("control", scene);
    expect(r.scene("control")).toBe(scene);
    expect(r.scene("radar")).toBeUndefined();
    expect(r.screens).toEqual(["control"]);
  });
});
