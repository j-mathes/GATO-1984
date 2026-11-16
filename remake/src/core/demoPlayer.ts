import type { DemoMorseExample, DemoPage, DemoScriptDocument } from "./types.js";

/**
 * Attract-mode controller for DEMO.EXE.
 *
 * DEMO.EXE does not run the simulation: it is a scripted slide show. It starts with the grey "GATO DEMONSTRATION" page (F1 exit,
 * F2 sound off) while it loads its sprite files, then shows an example of how orders are received (the file DEMORD, typed out as
 * it is sent in Morse), and then draws the real game screens with fixed data and prints narration boxes between them
 * (see analysis/export_demo_script.py and demo_statements.txt). This controller plays those steps in order and reports which
 * screen each one is about, so a UI can show the matching screen with canned or simulated data. The Morse step is timed by the UI
 * (it knows how long the characters take): it calls {@link DemoPlayer.setMorseSeconds}.
 *
 * Exact: page texts, cells and boxes and their order; F1 exits and F2 turns sound off (the first page says so; the demo polls INKEY$
 * against the F1 key string at ds:0x25e4); any key ends the Morse example. Not exact: durations (the original waits in compiled
 * BASIC delay loops whose speed depended on the CPU, and the intro is shown while files load), the screen tags, which are derived
 * from the narration text, and the extra rule that any other key also skips the intro (the original has no key wait there).
 */

export type DemoScreen =
  | "intro"
  | "morseExample"
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
  | { type: "intro"; screen: "intro" }
  | { type: "morse"; screen: "morseExample"; example: DemoMorseExample }
  | { type: "page"; index: number; page: DemoPage; screen: DemoScreen }
  | { type: "finished"; reason: "completed" | "exit" };

export interface DemoOptions {
  /** Seconds to hold a page whose delay loop was not recovered: base + perChar * characters. */
  fallbackBaseSeconds?: number;
  fallbackSecondsPerChar?: number;
  /** Multiplier applied to recovered delays (their real duration depended on the CPU). */
  speed?: number;
}

export type DemoStage = "idle" | "intro" | "morse" | "pages";

export class DemoPlayer {
  private index = -1;
  private elapsed = 0;
  private done = false;
  private step: DemoStage = "idle";
  private morseSeconds: number | null = null;
  soundOn = true;

  constructor(
    private readonly script: DemoScriptDocument,
    private readonly options: DemoOptions = {},
  ) {}

  get finished(): boolean {
    return this.done;
  }

  get currentPage(): DemoPage | undefined {
    return this.step === "pages" ? this.script.pages[this.index] : undefined;
  }

  get pageIndex(): number {
    return this.index;
  }

  /** Which part of the show is on: the intro page, the Morse example or the narrated pages. */
  get stage(): DemoStage {
    return this.step;
  }

  /** Start (or restart) the show: emits the intro (or, for a script without one, the Morse example or the first page). */
  start(): DemoEvent[] {
    this.done = false;
    this.index = -1;
    this.elapsed = 0;
    this.morseSeconds = null;
    this.step = "idle";
    return this.enter("intro");
  }

  /** How long the Morse example stays up (typing, sending and the closing hold); the UI computes it from the characters when it starts. */
  setMorseSeconds(seconds: number): void {
    this.morseSeconds = Math.max(seconds, 0);
  }

  /** F1 ends the demo at any time; F2 switches the sound off; any other key ends the intro or the Morse example early. */
  pressKey(key: "F1" | "F2" | string): DemoEvent[] {
    if (this.done) return [];
    if (key === "F1") {
      this.done = true;
      return [{ type: "finished", reason: "exit" }];
    }
    if (key === "F2") {
      this.soundOn = false;
      return [];
    }
    if (this.step === "intro") return this.enter("morse");
    if (this.step === "morse") return this.enter("pages");
    return [];
  }

  /** Advance by `seconds` of real time. */
  advance(seconds: number): DemoEvent[] {
    if (this.done || this.step === "idle") return [];
    this.elapsed += seconds;
    const events: DemoEvent[] = [];
    while (!this.done && this.elapsed >= this.holdSeconds()) {
      this.elapsed -= this.holdSeconds();
      if (this.step === "intro") events.push(...this.enter("morse", false));
      else if (this.step === "morse") events.push(...this.enter("pages", false));
      else events.push(...this.nextPage(false));
    }
    return events;
  }

  private holdSeconds(): number {
    if (this.step === "intro") return this.script.intro?.seconds_estimate ?? 4;
    if (this.step === "morse") return this.morseSeconds ?? Infinity; // the UI sets it as the example starts
    const page = this.currentPage;
    return page ? this.pageHoldSeconds(page) : Infinity;
  }

  pageHoldSeconds(page: DemoPage): number {
    const speed = this.options.speed ?? 1;
    if (page.seconds_estimate !== null) return page.seconds_estimate / speed;
    const chars = page.lines.reduce((n, l) => n + l.length, 0);
    return ((this.options.fallbackBaseSeconds ?? 2) + (this.options.fallbackSecondsPerChar ?? 0.05) * chars) / speed;
  }

  /** Enter a stage, skipping those the script does not have. */
  private enter(stage: "intro" | "morse" | "pages", resetElapsed = true): DemoEvent[] {
    if (resetElapsed) this.elapsed = 0;
    if (stage === "intro" && this.script.intro) {
      this.step = "intro";
      return [{ type: "intro", screen: "intro" }];
    }
    if ((stage === "intro" || stage === "morse") && this.script.morse) {
      this.step = "morse";
      this.morseSeconds = null;
      return [{ type: "morse", screen: "morseExample", example: this.script.morse }];
    }
    this.step = "pages";
    return this.nextPage(resetElapsed);
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
