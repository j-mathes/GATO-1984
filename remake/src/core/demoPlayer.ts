import type { DemoPage, DemoScriptDocument } from "./types.js";

/**
 * Attract-mode controller for DEMO.EXE.
 *
 * DEMO.EXE does not run the simulation: it is a scripted slide show that draws game screens with fixed data and prints
 * narration between them (see analysis/export_demo_script.py and DEMO_statements). This controller plays the extracted
 * narration pages in program order and reports which screen the narration is about, so a UI can show the matching screen
 * with canned or simulated data. It needs no PLAY/Morse routine: the demo has none.
 *
 * Exact: page texts and their order; F1 exits and F2 turns sound off (the title page says so; the demo polls INKEY$
 * against the F1 key string at ds:0x25e4). Not exact: page durations (the original waits in compiled BASIC delay loops
 * whose speed depended on the CPU) and the screen tags, which are derived from the narration text.
 */

export type DemoScreen =
  | "title"
  | "controlRoom"
  | "chart"
  | "shipGallery"
  | "damageReport"
  | "captainsLog"
  | "radar"
  | "gameControl"
  | "quadrantMap"
  | "radioRoom"
  | "playAgain";

const SCREEN_RULES: [RegExp, DemoScreen][] = [
  [/GATO DEMONSTRATION/, "title"],
  [/DAMAGE REPORT|CONTROL RM|AREA IS DAMAGED/, "damageReport"],
  [/GAME CONTROL/, "gameControl"],
  [/PLAY AGAIN/, "playAgain"],
  [/RADIO ROOM/, "radioRoom"],
  [/MAP FOR QUADRANT|SHOALS|RED LINES/, "quadrantMap"],
  [/CHART/, "chart"],
  [/FREIGHTER|TANKER|TRANSPORT|PATROL CRAFT|DESTROYER|LOOKS LIKE/, "shipGallery"],
  [/CAPTAIN'S LOG|SHIP +TONNAGE|SHIPS SUNK|FIRST GROUP OF SHIPS|NAMES AND TONNAGES|DESTROYERS USED/, "captainsLog"],
  [/RADAR/, "radar"],
];

export function screenForPage(page: DemoPage): DemoScreen {
  const text = page.lines.join("\n");
  for (const [re, screen] of SCREEN_RULES) if (re.test(text)) return screen;
  return "controlRoom";
}

export type DemoEvent =
  | { type: "page"; index: number; page: DemoPage; screen: DemoScreen }
  | { type: "finished"; reason: "completed" | "exit" };

export interface DemoOptions {
  /** Seconds to hold a page whose delay loop was not recovered: base + perChar * characters. */
  fallbackBaseSeconds?: number;
  fallbackSecondsPerChar?: number;
  /** Multiplier applied to recovered delays (their real duration depended on the CPU). */
  speed?: number;
}

export class DemoPlayer {
  private index = -1;
  private elapsed = 0;
  private done = false;
  soundOn = true;

  constructor(
    private readonly script: DemoScriptDocument,
    private readonly options: DemoOptions = {},
  ) {}

  get finished(): boolean {
    return this.done;
  }

  get currentPage(): DemoPage | undefined {
    return this.script.pages[this.index];
  }

  get pageIndex(): number {
    return this.index;
  }

  /** Start (or restart) the show: emits the first page. */
  start(): DemoEvent[] {
    this.done = false;
    this.index = -1;
    return this.nextPage();
  }

  /** F1 ends the demo at any time; F2 switches the sound off. */
  pressKey(key: "F1" | "F2" | string): DemoEvent[] {
    if (this.done) return [];
    if (key === "F1") {
      this.done = true;
      return [{ type: "finished", reason: "exit" }];
    }
    if (key === "F2") this.soundOn = false;
    return [];
  }

  /** Advance by `seconds` of real time. */
  advance(seconds: number): DemoEvent[] {
    if (this.done || this.index < 0) return [];
    this.elapsed += seconds;
    const events: DemoEvent[] = [];
    while (!this.done && this.currentPage && this.elapsed >= this.holdSeconds(this.currentPage)) {
      this.elapsed -= this.holdSeconds(this.currentPage);
      events.push(...this.nextPage(false));
    }
    return events;
  }

  holdSeconds(page: DemoPage): number {
    const speed = this.options.speed ?? 1;
    if (page.seconds_estimate !== null) return page.seconds_estimate / speed;
    const chars = page.lines.reduce((n, l) => n + l.length, 0);
    return ((this.options.fallbackBaseSeconds ?? 2) + (this.options.fallbackSecondsPerChar ?? 0.05) * chars) / speed;
  }

  private nextPage(resetElapsed = true): DemoEvent[] {
    this.index += 1;
    if (resetElapsed) this.elapsed = 0;
    const page = this.script.pages[this.index];
    if (!page) {
      this.done = true;
      return [{ type: "finished", reason: "completed" }];
    }
    return [{ type: "page", index: this.index, page, screen: screenForPage(page) }];
  }
}
