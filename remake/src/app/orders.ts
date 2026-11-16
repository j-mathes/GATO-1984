import type { MorseChar, MorseTables } from "../audio/morse.js";
import { buildMorseSchedule } from "../audio/morse.js";

export interface OrdersOptions {
  /** GAME CONTROL [1] difficulty: at 8 and 9 the characters are not printed, the orders can only be copied from the Morse (0x0bce0). */
  difficulty: number;
  soundOn: boolean;
  charDelaySeconds?: number;
}

/** Orders as the original prints them: header lines, then the body one character at a time, each followed by its Morse. */
export interface OrdersTimeline {
  chars: (MorseChar & { line: number; column: number; visible: boolean })[];
  /** Total seconds until the last character. */
  duration: number;
}

export function buildOrdersTimeline(lines: readonly string[], tables: MorseTables, options: OrdersOptions): OrdersTimeline {
  const visible = options.difficulty < 8;
  const chars: OrdersTimeline["chars"] = [];
  let t = 0;
  lines.forEach((text, line) => {
    const built = buildMorseSchedule(text, tables, { soundOn: options.soundOn, charDelaySeconds: options.charDelaySeconds }, t);
    built.forEach((c, column) => chars.push({ ...c, line, column, visible }));
    const last = built.at(-1);
    if (last) t = last.printAt + last.duration + (options.charDelaySeconds ?? 0.03);
  });
  return { chars, duration: t };
}

/** Characters printed so far at `elapsed` seconds. */
export function printedCount(timeline: OrdersTimeline, elapsed: number): number {
  let n = 0;
  for (const c of timeline.chars) {
    if (c.printAt <= elapsed) n += 1;
    else break;
  }
  return n;
}

/** Text of the order lines revealed at `elapsed`, one string per line (hidden characters stay blank). */
export function revealedLines(lines: readonly string[], timeline: OrdersTimeline, elapsed: number): string[] {
  const out = lines.map(() => "");
  for (const c of timeline.chars) {
    if (c.printAt > elapsed) break;
    out[c.line] = (out[c.line] ?? "") + (c.visible ? c.char : " ");
  }
  return out;
}
