/**
 * Switches for the remake-only features that can be turned back to the original's behaviour (see analysis/remake_additions.md, the
 * numbers are the rows of that table). Reached from the launcher's item 5, ADVANCED OPTIONS. `true` = the remake feature is active,
 * `false` = the 1984 behaviour. Everything else in remake_additions.md is always on.
 */
export type AdvancedKey =
  | "helmHud"
  | "timeToast"
  | "helpOverlay"
  | "splashSkip"
  | "gameControlExtras"
  | "displayModes"
  | "trailToggle"
  | "endBox"
  | "demoSkip"
  | "timeKeys"
  | "hotkeys"
  | "escQuit"
  | "radioReread"
  | "boomSound"
  | "radioAlert"
  | "pcPace"
  | "missionSelect"
  | "explosionsRun"
  | "customControls";

export interface AdvancedFeature {
  key: AdvancedKey;
  /** Row of analysis/remake_additions.md (documentation cross-reference only; not shown on the screen). */
  row: number;
  /** At most 30 characters (40-column screen). */
  label: string;
  /** Value of a fresh install: the behaviour of the remake before the switches existed. */
  default: boolean;
  /** What the switch gives when it is on (the remake feature); shown while it is off. */
  remake: string;
  /** What the switch gives when it is off (the 1984 behaviour); shown while it is on. */
  original: string;
}

/** In screen order: grouped by topic, with the HOTKEYS group switch right before the three switches it covers (HOTKEY_GROUP). */
export const ADVANCED_FEATURES: readonly AdvancedFeature[] = [
  { key: "helmHud", row: 1, label: "HELM STATUS LINE", default: false, remake: "a status line (order, rudder, planes) shows over the scope after each helm command", original: "no text over the scope; only the dashboard lights change" },
  { key: "hotkeys", row: 16, label: "HOTKEYS ? H W V", default: true, remake: "enable the help overlay, display mode and wake trail hotkeys", original: "disable the help overlay, display mode and wake trail hotkeys" },
  { key: "helpOverlay", row: 3, label: "CONTROLS HELP OVERLAY", default: true, remake: "? or H shows a list of the controls and pauses the world", original: "no help overlay" },
  { key: "displayModes", row: 9, label: "DISPLAY MODES (FIT, CRT)", default: true, remake: "V cycles Authentic, Fit to window and CRT scanlines", original: "fixed whole-number scaling, no scanlines" },
  { key: "trailToggle", row: 10, label: "WAKE TRAILS ON/OFF", default: true, remake: "W turns the track dots on the radar, chart and map on or off", original: "tracks always persist" },
  { key: "splashSkip", row: 6, label: "SKIP LOGO WITH KEY / CLICK", default: true, remake: "any key or click skips the Spectrum HoloByte logo", original: "the logo stays for its time and cannot be skipped" },
  { key: "gameControlExtras", row: 8, label: "GAME CONTROL ITEMS 5 AND 6", default: true, remake: "GAME CONTROL gets item 5 (next mission) and item 6 (time compression)", original: "GAME CONTROL has items 1 to 4 only" },
  { key: "missionSelect", row: 30, label: "CHOOSE THE NEXT MISSION", default: true, remake: "GAME CONTROL item 5 picks the next mission, 1 to 20", original: "always a random mission" },
  { key: "endBox", row: 11, label: "LOST-BOAT BOX AND TEXT", default: true, remake: "a lost boat shows a framed box saying YOUR SUBMARINE HAS BEEN LOST", original: "black screen with only the play-again prompt" },
  { key: "demoSkip", row: 12, label: "DEMO: ANY KEY SKIPS INTRO", default: true, remake: "any key skips the demo's opening page (F1 exits, F2 sound off)", original: "only F1 and F2 act in the demo" },
  { key: "timeKeys", row: 15, label: "TIME COMPRESSION KEYS [ AND ]", default: true, remake: "[ and ] change the speed of time: 1x, 2x, 4x", original: "the pace cannot be changed" },
  { key: "timeToast", row: 2, label: "TIME SPEED POP-UP", default: true, remake: "a short pop-up confirms the speed of time when it changes", original: "no pop-up when the speed of time changes" },
  { key: "escQuit", row: 17, label: "ESC RETURNS TO MENU", default: true, remake: "Esc leaves the mission and returns to the menu", original: "Esc does nothing (the original ended the program)" },
  { key: "radioReread", row: 20, label: "M REREADS THE ORDERS", default: true, remake: "M shows the current orders again", original: "M asks for a new random mission" },
  { key: "pcPace", row: 28, label: "SLOW 1984 PC PACE (2.5 HZ)", default: true, remake: "the world steps 2.5 times a second, like a 4.77 MHz PC", original: "10 steps a second (unpaced)" },
  { key: "explosionsRun", row: 32, label: "WORLD RUNS DURING BLASTS", default: true, remake: "the world keeps running while an explosion plays", original: "the world waits while an explosion plays" },
  { key: "boomSound", row: 24, label: "EXPLOSION BOOM SOUND", default: true, remake: "explosions make a descending boom", original: "silent explosions" },
  { key: "radioAlert", row: 25, label: "RADIO ALERT TONE", default: true, remake: "radio messages sound an alert tone", original: "silent messages" },
  { key: "customControls", row: 38, label: "CUSTOM CONTROLS", default: false, remake: "keys can be reassigned: press C on this screen to open the control assignments", original: "the original key assignments only" },
];

export type AdvancedValues = Record<AdvancedKey, boolean>;

export function defaultAdvanced(): AdvancedValues {
  return Object.fromEntries(ADVANCED_FEATURES.map((f) => [f.key, f.default])) as AdvancedValues;
}

/**
 * Row 16 (all hotkeys) is a group switch over these rows: switching it sets all three, and it follows them (on while any of them is on,
 * off once all three are off).
 */
export const HOTKEY_GROUP: readonly AdvancedKey[] = ["helpOverlay", "displayModes", "trailToggle"];

/**
 * Switches shown indented under the switch above them because they depend on it: the hotkey group's members, the next-mission pick
 * (GAME CONTROL item 5 only exists with the extra items) and the time pop-up (only shown by the time keys). Only the hotkeys switch
 * also sets its members; the others stay independent.
 */
export const ADVANCED_INDENTED: ReadonlySet<AdvancedKey> = new Set<AdvancedKey>([...HOTKEY_GROUP, "missionSelect", "timeToast"]);

/** The switches with their storage form (the whole object is kept as JSON). */
export class AdvancedOptions {
  private values: AdvancedValues = defaultAdvanced();

  constructor(
    private readonly onChange: () => void = () => undefined,
    saved: string | null = null,
  ) {
    if (saved) this.load(saved);
    this.syncGroup();
  }

  on(key: AdvancedKey): boolean {
    return this.values[key];
  }

  set(key: AdvancedKey, value: boolean): void {
    const before = this.serialize();
    if (key === "hotkeys") for (const k of HOTKEY_GROUP) this.values[k] = value;
    else this.values[key] = value;
    this.syncGroup();
    if (this.serialize() !== before) this.onChange();
  }

  toggle(key: AdvancedKey): boolean {
    this.set(key, !this.values[key]);
    return this.values[key];
  }

  /** Back to the defaults. */
  reset(): void {
    this.values = defaultAdvanced();
    this.onChange();
  }

  /** All switches in one object (a copy). */
  snapshot(): AdvancedValues {
    return { ...this.values };
  }

  serialize(): string {
    return JSON.stringify(this.values);
  }

  private syncGroup(): void {
    this.values.hotkeys = HOTKEY_GROUP.some((k) => this.values[k]);
  }

  /** Reads a stored object; unknown keys and non-booleans are ignored so an old or damaged value cannot break the game. */
  private load(text: string): void {
    try {
      const raw = JSON.parse(text) as Record<string, unknown>;
      for (const f of ADVANCED_FEATURES) if (typeof raw[f.key] === "boolean") this.values[f.key] = raw[f.key] as boolean;
    } catch {
      // keep the defaults
    }
  }
}
