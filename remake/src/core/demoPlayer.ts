import { TYPE } from "./constants.js";
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

/**
 * The screen each narration page is printed over, found from its text and from where the program prints it (analysis/demo_flow.md):
 * the page about the main chart is still on the control room (the chart is drawn after it), the page about the radar is on the quadrant
 * map (the radar is drawn after it), "NOT MUCH IS HAPPENING HERE" is on the radar, and the page about the damage report is on the control
 * room (its lamp flashes) before the report itself comes up.
 */
const SCREEN_RULES: [RegExp, DemoScreen][] = [
  [/THIS IS THE DAMAGE REPORT|CONTROL RM/, "damageReport"],
  [/GAME CONTROL/, "gameControl"],
  [/PLAY AGAIN/, "playAgain"],
  [/RADIO ROOM/, "radioRoom"],
  [/MAP FOR QUADRANT|SHOALS|RED LINES|LOOK AT RADAR/, "quadrantMap"],
  [/THIS IS THE CHART|CLOSER LOOK/, "chart"],
  [/^ *(FREIGHTER|OIL TANKER|TRANSPORT|PATROL CRAFT|DESTROYER) *$/m, "shipGallery"],
  [/NOT MUCH IS HAPPENING/, "radar"],
  [/^ *CAPTAIN'S LOG *$|SHIP +TONNAGE|SHIPS SUNK|FIRST GROUP OF SHIPS|NAMES AND TONNAGES|DESTROYERS USED/m, "captainsLog"],
  [/RADAR/, "radar"],
];

/** The ships the demo names, by the word in their line, as the type codes of the scenario files. */
const GALLERY_SHIPS: [RegExp, number][] = [
  [/FREIGHTER/, TYPE.freighter],
  [/TANKER/, TYPE.tanker],
  [/TRANSPORT/, TYPE.troopCarrier],
  [/PATROL/, TYPE.patrolBoat],
  [/DESTROYER/, TYPE.destroyer],
];

/**
 * The page that goes through the enemy ships one by one (FREIGHTER, OIL TANKER, ...): which line, and so which ship, is on `fraction` (0 to
 * 1) of the way through the page's time, the lines sharing it equally. null for any other page.
 */
export function galleryShip(page: DemoPage, fraction: number): { index: number; typeCode: number } | null {
  const types = page.lines.map((l) => GALLERY_SHIPS.find(([re]) => re.test(l))?.[1]);
  if (types.length === 0 || types.some((t) => t === undefined)) return null;
  const index = Math.min(Math.max(Math.floor(fraction * types.length), 0), types.length - 1);
  return { index, typeCode: types[index] as number };
}

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
  /** Whether any key ends the intro early (a remake addition: the original shows the intro while it loads and reacts to F1 and F2 only; any key ends the Morse example in both). Default true. */
  anyKeySkips?: boolean;
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

  /** How far through the current page's time the show is, 0 to just under 1 (0 when the page is held without a limit). */
  get pageFraction(): number {
    const hold = this.holdSeconds();
    return Number.isFinite(hold) && hold > 0 ? Math.min(this.elapsed / hold, 0.999) : 0;
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

  /** F1 ends the demo at any time; F2 switches the sound off; any other key ends the Morse example (and, unless `anyKeySkips` is off, the intro) early. */
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
    if (this.step === "intro") return this.options.anyKeySkips === false ? [] : this.enter("morse");
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
