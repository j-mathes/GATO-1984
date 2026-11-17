import { drawPixels } from "./drawString.js";

/**
 * The lost-boat sequence of GATO1 (program 0x0b5cd-0x0b923, file offset + 0x3a00), as a pure timeline over a 320x200 overlay.
 *
 * The boat is lost (collision above depth 34, crush, more than 5 damaged compartments, an alarm index above 20, its own torpedo) and the
 * program floods the screen with colour 2 of the screen's palette (magenta in the control room), which rises from the bottom row to the top:
 *
 * - control room (ds:0x21ce = 0): for `y = 199 TO 0 STEP -1` one line `LINE (0,y)-(319,y),2`, and cracks drawn with `PSET` + `DRAW` in colour 3
 *   (white) at fixed values of `y`. Two cracks are on the screen before the loop starts. The order inside one pass is the order of the
 *   program: the cracks of y = 170 and 188 come before the water line of that pass, the others (190, 178, 155, 145, 140) after it, so a
 *   crack is covered by water that rises over it later and stays on top of water that was drawn before.
 * - any other screen (radar, chart, map, damage report, ds:0x21ce = 1): `FOR y = 199 TO 3 STEP -3`, a filled band `LINE (0,y)-(319,y-4),2,BF`.
 *
 * Both are followed by the log update and the play-again question (0x0b924). Running out of air jumps past all of it (0x07346 -> 0x0b923).
 * Each pass also sounds a rising SOUND sweep (0x0b656, 0x0b782); the sound stays with the effect "subDestroyed".
 *
 * What the file does not give is the time: the loops are paced by the CPU. The remake spreads the sequence over about 2.5 seconds.
 */
export const SINKING_WIDTH = 320;
export const SINKING_HEIGHT = 200;

/** Colour numbers of the original's palette, used by `LINE ...,2` and `DRAW "C3"`. */
export const WATER_COLOR = 2;
export const CRACK_COLOR = 3;

export type SinkingVariant = "cracks" | "bands";

/** Seconds per pass of the loop; an estimate (see above). */
export const SINKING_TIMING = { cracksPass: 0.0125, bandsPass: 0.0375 } as const;

export interface Crack {
  /** Value of the loop counter at which it is drawn; `null` before the loop starts. */
  frame: number | null;
  /** True when the program draws it after the water line of that pass. */
  afterWater: boolean;
  x: number;
  y: number;
  draw: string;
}

/** The `PSET (x,y),3 : DRAW` pairs of the program, in program order of the strings (0x0b6f0-0x0b8de). */
export const CRACKS: readonly Crack[] = [
  { frame: null, afterWater: false, x: 293, y: 0, draw: "S4C3G30D20L50G40D7BL13H7U20H20L32H40L20H32" },
  { frame: null, afterWater: false, x: 32, y: 140, draw: "S4C3NR7H12U10H5BR40G23D9G8ND8NG6R10F10U4E9NF5H10NL3E12R10BL25H12U8BD33NR3L3G8L7" },
  { frame: 170, afterWater: false, x: 107, y: 130, draw: "S4A2C3NR7H12U10H5BR40G23D9G8ND8NG6R10F10U4E9NF5H10NL3E12R10BL25H12U8BD33NR3L3G8L7" },
  { frame: 188, afterWater: false, x: 167, y: 139, draw: "S4A0C3NR7H12U10H5BR40G13D9G8D10NF11L10NG6BR10BF10BU4BE9NF5H10NL3E12R10BL24H13U7BD32NR3L13NG8NH11" },
  { frame: 190, afterWater: true, x: 140, y: 0, draw: "S4C3D5L30G23D32G34D3" },
  { frame: 178, afterWater: true, x: 319, y: 90, draw: "S4C3L20H23U23H34" },
  { frame: 145, afterWater: true, x: 87, y: 35, draw: "S4A0C3G12L33NG23H12" },
  { frame: 155, afterWater: true, x: 87, y: 35, draw: "S4A0C3R35NE8R4NF23R12" },
  { frame: 140, afterWater: true, x: 87, y: 35, draw: "S4A0C3G12D15NG9" },
];

type Op = { kind: "crack"; crack: Crack } | { kind: "rows"; from: number; to: number };

/** The operations of each pass of the loop, in program order. */
export function sinkingPasses(variant: SinkingVariant): Op[][] {
  const passes: Op[][] = [];
  if (variant === "bands") {
    for (let y = SINKING_HEIGHT - 1; y >= 3; y -= 3) passes.push([{ kind: "rows", from: y - 4, to: y }]);
    return passes;
  }
  for (let y = SINKING_HEIGHT - 1; y >= 0; y -= 1) {
    const before = CRACKS.filter((c) => c.frame === y && !c.afterWater).map((crack): Op => ({ kind: "crack", crack }));
    const after = CRACKS.filter((c) => c.frame === y && c.afterWater).map((crack): Op => ({ kind: "crack", crack }));
    passes.push([...before, { kind: "rows", from: y, to: y }, ...after]);
  }
  return passes;
}

export class SinkingAnimation {
  /** Colour number (0 = nothing drawn yet, {@link WATER_COLOR}, {@link CRACK_COLOR}) of each pixel, row by row. */
  readonly overlay = new Uint8Array(SINKING_WIDTH * SINKING_HEIGHT);
  readonly duration: number;
  private readonly passes: Op[][];
  private readonly passSeconds: number;
  private applied = 0;
  private elapsed = 0;

  constructor(readonly variant: SinkingVariant) {
    this.passes = sinkingPasses(variant);
    this.passSeconds = variant === "cracks" ? SINKING_TIMING.cracksPass : SINKING_TIMING.bandsPass;
    this.duration = this.passes.length * this.passSeconds;
    for (const c of CRACKS) if (variant === "cracks" && c.frame === null) this.crack(c);
  }

  get done(): boolean {
    return this.applied >= this.passes.length && this.elapsed >= this.duration;
  }

  /** Lets time pass: every pass of the loop that has come due is drawn. */
  advance(seconds: number): void {
    this.elapsed += seconds;
    while (this.applied < this.passes.length && this.applied * this.passSeconds <= this.elapsed) this.apply(this.passes[this.applied++] as Op[]);
  }

  /** Draws what is left at once. */
  finish(): void {
    this.elapsed = this.duration;
    this.advance(0);
  }

  colorAt(x: number, y: number): number {
    return this.overlay[y * SINKING_WIDTH + x] ?? 0;
  }

  private apply(ops: readonly Op[]): void {
    for (const op of ops) {
      if (op.kind === "crack") this.crack(op.crack);
      else {
        for (let y = Math.max(op.from, 0); y <= Math.min(op.to, SINKING_HEIGHT - 1); y += 1) this.overlay.fill(WATER_COLOR, y * SINKING_WIDTH, (y + 1) * SINKING_WIDTH);
      }
    }
  }

  private crack(c: Crack): void {
    for (const p of drawPixels(c.x, c.y, c.draw, CRACK_COLOR)) {
      if (p.x >= 0 && p.x < SINKING_WIDTH && p.y >= 0 && p.y < SINKING_HEIGHT) this.overlay[p.y * SINKING_WIDTH + p.x] = p.color;
    }
  }
}
