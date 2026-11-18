import { describe, expect, it } from "vitest";
import { MAX_BACKING_WIDTH, backingSize, computeDisplaySize, computeLayout, enhancedViewSize } from "./display.js";
import { Gfx } from "./gfx.js";
import { EnhancedRenderer } from "./enhanced/scene.js";
import { darken, lighten, mix, rgba } from "./enhanced/colors.js";
import { starField } from "./enhanced/scope.js";
import { CHART_ISLANDS, RADAR_CX, RADAR_CY, RADAR_K, RADAR_R, SHOAL_DOTS_LARGEST, circleRadii, ellipseDotAngles, ellipsePerimeter, radarBlip, shoalDotCount } from "./enhanced/scenes.js";
import { enclosedPixels, interiorMarks } from "./enhanced/shipArt.js";
import { closeHull, filledSilhouette, overlayRegion, thinPixels } from "./hull.js";
import { crackSpread, glassCracks } from "./enhanced/cracks.js";
import { blindOpenness, ribbonColor, smoothCurve, splashAlpha } from "./enhanced/frontend.js";
import { instrumentPanes, scopePane } from "./enhanced/panel.js";
import { COMPARTMENT } from "../core/index.js";
import { centredColumn } from "./textScreens.js";
import { SinkingAnimation, drawSegments } from "../core/index.js";
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

describe("enhanced ship shapes", () => {
  const grid = (rows: string[]): Uint8Array => Uint8Array.from(rows.flatMap((r) => [...r].map((c) => (c === "#" ? 1 : 0))));
  const show = (m: Uint8Array, w: number): string[] => Array.from({ length: m.length / w }, (_, y) => [...m.slice(y * w, (y + 1) * w)].map((v) => (v ? "#" : ".")).join(""));

  it("closes the open hull below the deck, following the slope of its bow and stern edges, and leaves what is above the deck alone", () => {
    const open = grid([
      "...#......", // a mast
      "...#......",
      "..########", // deck
      ".#......#.", // the bow edge slopes out to the left, the stern edge in
      "#......#..",
      "..........",
    ]);
    expect(show(closeHull(open, 10, 6, 4), 10)).toEqual(["...#......", "...#......", "..########", ".########.", "########..", ".........."]);
  });

  it("does not fill a row that has no solid pixel, and never square off the ends", () => {
    const open = grid(["#######", "#.....#", ".......", "..#.#.."]);
    const closed = show(closeHull(open, 7, 4, 3), 7);
    expect(closed[1]).toBe("#######"); // between the two edge pixels
    expect(closed[2]).toBe("......."); // a row with nothing is left alone
    expect(closed[3]).toBe("..###.."); // only as wide as its own outermost pixels
  });

  it("finds thin lines (rigging, stubs) as the solid pixels outside any 2 x 2 block", () => {
    const m = grid(["###..", "###.#", "...#."]);
    expect(show(thinPixels(m, 5, 3), 5)).toEqual([".....", "....#", "...#."]);
  });

  it("fills what an outline encloses, closing a one-pixel break, and leaves the outside empty", () => {
    const ring = grid(["#######", "#.....#", "#.....#", "###.###", "......."]); // a gap at the bottom
    expect(show(filledSilhouette(ring, 7, 5, 1), 7)).toEqual(["#######", "#######", "#######", "#######", "#######"]); // grown by the gap it closed
    const open = grid(["#####", "#...#", "#...#", "#...#", "#...."]);
    expect(filledSilhouette(open, 5, 5, 0).reduce((a, b) => a + b, 0)).toBe(12); // an open outline lets the flood in: only the outline remains
  });

  it("marks a compartment as the area its lines enclose inside the hull, or else the box around them, cut to the hull", () => {
    const hull = Uint8Array.from({ length: 10 * 6 }, (_, i) => (i % 10 < 8 ? 1 : 0)); // x 0..7 is hull
    const box: [number, number][] = [[1, 1], [2, 1], [3, 1], [4, 1], [1, 2], [4, 2], [1, 3], [2, 3], [3, 3], [4, 3]];
    expect(show(overlayRegion(box, hull, 10, 6), 10)).toEqual(["..........", ".####.....", ".####.....", ".####.....", "..........", ".........."]);
    const stub: [number, number][] = [[6, 2], [9, 4]]; // two dots: the box around them, cut at the hull's edge
    expect(show(overlayRegion(stub, hull, 10, 6), 10)).toEqual(["..........", "..........", "......##..", "......##..", "......##..", ".........."]);
  });
});

describe("the enhanced front screens", () => {
  it("the logo fades in, holds and fades out within its time, and is invisible outside it", () => {
    expect(splashAlpha(0, 2500)).toBe(0);
    expect(splashAlpha(250, 2500)).toBeCloseTo(0.5, 9);
    expect(splashAlpha(1200, 2500)).toBe(1);
    expect(splashAlpha(2500, 2500)).toBe(0);
    expect(splashAlpha(2300, 2500)).toBeLessThan(0.5);
    expect(splashAlpha(-10, 2500)).toBe(0);
  });

  it("the title's blinds stay shut for the hold, open over the wipe, and are open without a time", () => {
    expect(blindOpenness(undefined)).toBe(1);
    expect(blindOpenness(0)).toBe(0);
    expect(blindOpenness(400)).toBe(0);
    expect(blindOpenness(850)).toBeCloseTo(0.5, 2);
    expect(blindOpenness(5000)).toBe(1);
  });

  it("the ribbon curve passes through its points, left to right, and the colours run from magenta through the spectrum", () => {
    const pts: [number, number][] = [[0, 0], [10, 5], [20, 0]];
    const curve = smoothCurve(pts, 8);
    expect(curve[0]).toEqual([0, 0]);
    expect(curve.at(-1)).toEqual([20, 0]);
    expect(curve.length).toBe(2 * 8 + 1);
    expect(curve.some(([x, y]) => Math.abs(x - 10) < 1e-9 && Math.abs(y - 5) < 1e-9)).toBe(true);
    expect(ribbonColor(0)).toMatch(/^hsl\(300,/);
    expect(ribbonColor(1)).toMatch(/^hsl\(225,/); // blue at the far end
    expect(ribbonColor(0.5)).not.toBe(ribbonColor(0));
  });
});
describe("cracks in the instruments", () => {
  it("a crack spreads quickly at first and settles: nothing before the impact, all of it once the time is up", () => {
    expect(crackSpread(-1)).toBe(0);
    expect(crackSpread(0)).toBe(0);
    expect(crackSpread(0.1)).toBeGreaterThan(0.4);
    expect(crackSpread(0.4)).toBe(1);
    expect(crackSpread(9)).toBe(1);
  });

  it("each instrument pane belongs to one compartment, lies inside the picture and has its own seed; the damage lamp has none", () => {
    const panes = instrumentPanes(71);
    expect(new Set(panes.map((p) => p.seed)).size).toBe(panes.length);
    const byRoom = (k: number): number => panes.filter((p) => p.compartment === k).length;
    expect(byRoom(COMPARTMENT.controlRoom)).toBe(4); // three dials and the oxygen gauge
    expect(byRoom(COMPARTMENT.fuelTanks)).toBe(2); // readout and lamp
    expect(byRoom(COMPARTMENT.batteryRoom)).toBe(3); // readout and two lamps
    expect(byRoom(COMPARTMENT.torpedoRoom)).toBe(1);
    expect(byRoom(COMPARTMENT.engineRoom)).toBe(1);
    expect(byRoom(COMPARTMENT.radioRoom) + byRoom(COMPARTMENT.conningTower)).toBe(0); // no instruments of theirs
    for (const p of panes) {
      expect(p.x).toBeGreaterThanOrEqual(71);
      expect(p.x + p.w).toBeLessThanOrEqual(71 + 1280);
      expect(p.y).toBeGreaterThanOrEqual(98 * 4); // all below the scope window
      expect(p.y + p.h).toBeLessThanOrEqual(800);
    }
    expect(scopePane(71)).toMatchObject({ x: 71, y: 0, w: 1280, h: 392, compartment: COMPARTMENT.periscopes });
  });

  it("a smaller reach keeps the cracks nearer their impact", () => {
    const far = (k: number): number => Math.max(...glassCracks(800, 400, 0.5, 0.5, 3, k).flatMap((c) => c.points.map(([x, y]) => Math.hypot(x - 400, y - 200))));
    expect(far(0.3)).toBeLessThan(far(1));
  });
});
describe("glass cracks", () => {
  it("are the same every time, start at the point of impact, and run out of it in many directions", () => {
    const a = glassCracks(800, 400, 0.5, 0.4);
    expect(glassCracks(800, 400, 0.5, 0.4)).toEqual(a);
    expect(glassCracks(800, 400, 0.5, 0.4, 8)).not.toEqual(a);
    const mains = a.filter((k) => k.weight === 1);
    expect(mains.length).toBeGreaterThanOrEqual(8);
    for (const k of mains) expect(k.points[0]).toEqual([400, 160]);
    const directions = new Set(mains.map((k) => Math.round(Math.atan2((k.points.at(-1) as number[])[1]! - 160, (k.points.at(-1) as number[])[0]! - 400) * 2)));
    expect(directions.size).toBeGreaterThan(5);
    expect(a.some((k) => k.weight < 1)).toBe(true); // branches and rings
  });
});

describe("DRAW segments", () => {
  it("gives the lines of the string: blank moves leave none, N comes back to its start", () => {
    expect(drawSegments(10, 10, "R5BD3NU2L1")).toEqual([
      { x0: 10, y0: 10, x1: 15, y1: 10, color: 3 },
      { x0: 15, y0: 13, x1: 15, y1: 11, color: 3 },
      { x0: 15, y0: 13, x1: 14, y1: 13, color: 3 },
    ]);
  });
});

describe("the sinking in the enhanced graphics", () => {
  it("keeps the cracks it has drawn, and says how far the water has risen", () => {
    const s = new SinkingAnimation("cracks");
    expect(s.drawnCracks).toHaveLength(2); // the two cracks before the loop
    expect(s.progress).toBe(0);
    s.advance(s.duration / 2);
    expect(s.progress).toBeGreaterThan(0.4);
    expect(s.progress).toBeLessThan(0.6);
    expect(s.drawnCracks.length).toBeGreaterThan(2);
    s.finish();
    expect(s.progress).toBe(1);
    expect(s.drawnCracks).toHaveLength(9);
  });
});

describe("title page text", () => {
  it("centres a line on the 40-column screen, on a half column for an odd length", () => {
    expect(centredColumn("by Paul Arlton and Ed Dawson")).toBe(7);
    expect(centredColumn("Enhancements by Jared Mathes")).toBe(7);
    expect(centredColumn("CLASS  SUBMARINE")).toBe(13);
    expect(centredColumn("Spectrum HoloByte, Inc.")).toBe(9.5);
  });
});

describe("enhanced colours and geometry", () => {
  it("mixes, lightens and darkens hex colours", () => {
    expect(mix("#000000", "#ffffff", 0.5)).toBe("#808080");
    expect(lighten("#000000", 1)).toBe("#ffffff");
    expect(darken("#ff8000", 0.5)).toBe("#804000");
    expect(rgba("#ff0000", 0.5)).toBe("rgba(255,0,0,0.5)");
  });

  it("finds the inside of a closed outline, and nothing when the outline has a gap", () => {
    const ring = ["#####", "#...#", "#...#", "#####"];
    const gap = ["#####", "#...#", "#....", "#####"];
    const alpha = (rows: string[]): number[] => rows.flatMap((row) => [...row].flatMap((ch) => [0, 0, 0, ch === "#" ? 255 : 0]));
    expect([...enclosedPixels(alpha(ring), 5, 4)].reduce((a, b) => a + b, 0)).toBe(6);
    expect([...enclosedPixels(alpha(gap), 5, 4)].reduce((a, b) => a + b, 0)).toBe(0);
  });

  it("finds the marks drawn on an island's land (an airstrip) but not its coast", () => {
    const island = [
      "0000000000",
      "0333333330",
      "0311111130",
      "0313333130",
      "0313111130",
      "0311111130",
      "0333333330",
      "0000000000",
    ];
    expect(interiorMarks(island)).toEqual([[3, 3], [4, 3], [5, 3], [6, 3], [3, 4]]);
    expect(interiorMarks(["000", "000", "000"])).toEqual([]);
  });

  it("every shoal ring on the chart has the dot spacing of the largest: smaller rings get fewer dots", () => {
    expect(ellipsePerimeter(10, 10)).toBeCloseTo(2 * Math.PI * 10, 6);
    const big = ellipsePerimeter(60, 75);
    expect(shoalDotCount(big, big)).toBe(SHOAL_DOTS_LARGEST);
    expect(shoalDotCount(big / 2, big)).toBe(SHOAL_DOTS_LARGEST / 2);
    expect(shoalDotCount(1, big)).toBe(8); // never fewer than 8
    // the dots of a ring are an equal distance apart along its edge, also on an elongated ring
    const angles = ellipseDotAngles(30, 60, 24);
    const gaps = angles.map((a, i) => {
      const b = angles[(i + 1) % angles.length] as number;
      const next = i + 1 === angles.length ? b + Math.PI * 2 : b;
      let length = 0;
      for (let k = 0; k < 200; k += 1) {
        const a0 = a + ((next - a) * k) / 200;
        const a1 = a + ((next - a) * (k + 1)) / 200;
        length += Math.hypot(30 * (Math.cos(a1) - Math.cos(a0)), 60 * (Math.sin(a1) - Math.sin(a0)));
      }
      return length;
    });
    expect(Math.max(...gaps) / Math.min(...gaps)).toBeLessThan(1.01);
  });
  it("the night sky has a fixed star field", () => {
    const stars = starField();
    expect(stars).toEqual(starField());
    expect(stars.every((s) => s.x >= 0 && s.x < 1 && s.y >= 0 && s.y < 1)).toBe(true);
  });

  it("the radar puts ahead at the top and port on the left, scaled to the ring (the original's 0.065 pixels per unit, enlarged)", () => {
    expect(radarBlip(0, 0)).toEqual({ x: RADAR_CX, y: RADAR_CY });
    const ahead = radarBlip(0, 1000);
    expect(ahead.x).toBeCloseTo(RADAR_CX, 6);
    expect(ahead.y).toBeCloseTo(RADAR_CY - 65 * RADAR_K, 6);
    expect(radarBlip(Math.PI / 2, 1000).x).toBeCloseTo(RADAR_CX - 65 * RADAR_K, 6); // relative bearings run counter-clockwise: 90 degrees is port
    expect(RADAR_R).toBeCloseTo(101 * RADAR_K, 6);
  });

  it("BASIC's CIRCLE aspect shrinks the vertical radius below 1 and the horizontal one above 1", () => {
    expect(circleRadii(10, 0.9)).toEqual({ rx: 10, ry: 9 });
    expect(circleRadii(13, 1.5)).toEqual({ rx: 13 / 1.5, ry: 13 });
    expect(CHART_ISLANDS).toHaveLength(12);
  });
});
