import type { InputAction } from "./keyboard.js";

/**
 * Key assignments for the mission screens. There are two sets of defaults: the original's (GATO1.EXE's key dispatcher, see keyboard.ts, plus
 * the remake's own keys) and, with CUSTOM CONTROLS switched on (ADVANCED OPTIONS), a custom layout for a modern keyboard that the player can
 * then change key by key. One key per action: an action can also have no key at all. Typing in prompts, GAME CONTROL, the menus and the demo
 * keep their fixed keys.
 */
export type ControlId =
  | "speedUp"
  | "speedDown"
  | "speedFlank"
  | "speedFull"
  | "speedStandard"
  | "speedSlow"
  | "allStop"
  | "reverse"
  | "periscopeToggle"
  | "periscopeUp"
  | "periscopeDown"
  | "fire"
  | "radar"
  | "rudderLeft"
  | "rudderRight"
  | "planesUp"
  | "planesDown"
  | "neutral"
  | "diesel"
  | "electric"
  | "enginePower"
  | "scopeForward"
  | "scopePort"
  | "scopeAft"
  | "scopeStarboard"
  | "doors"
  | "chart"
  | "quadrant"
  | "log"
  | "damage"
  | "radioRoom"
  | "gameControl"
  | "debug"
  | "trails"
  | "help"
  | "helpAlt"
  | "timeDown"
  | "timeUp"
  | "quit"
  | "display";

export interface ControlDef {
  id: ControlId;
  /** At most 24 characters (shown on the assignment screen). */
  label: string;
  /** The key of the original (or, for the remake's own actions, of the remake). "" = none. */
  key: string;
  /** What the key does in a mission; null for the actions the page itself handles (display mode). */
  input: InputAction | null;
  /** Fixed: the key cannot be changed, cleared or taken over by another action. */
  locked?: true;
  /** The default key while SIMPLE SPEED KEYS is on, where it differs from `key` (original layout only). */
  simpleKey?: string;
  /** The default key of the custom layout (CUSTOM CONTROLS on), where it differs from `key`. "" = none. */
  customKey?: string;
  /** Which speed scheme the action belongs to: the four stage keys ("classic") or the step up/down keys ("simple"); the others serve both. */
  speed?: "classic" | "simple";
}

const RAW_DEFS: readonly ControlDef[] = [
  { id: "speedUp", label: "SPEED UP ONE STEP", key: "=", input: { type: "sim", command: { type: "speed", level: "up" } }, speed: "simple" },
  { id: "speedDown", label: "SPEED DOWN ONE STEP", key: "-", input: { type: "sim", command: { type: "speed", level: "down" } }, speed: "simple" },
  { id: "speedFlank", label: "AHEAD FLANK (10)", key: "F1", customKey: "4", input: { type: "sim", command: { type: "speed", level: "F1" } }, speed: "classic" },
  { id: "speedFull", label: "AHEAD FULL (8)", key: "F3", customKey: "3", input: { type: "sim", command: { type: "speed", level: "F3" } }, speed: "classic" },
  { id: "speedStandard", label: "AHEAD STANDARD (6)", key: "F5", customKey: "2", input: { type: "sim", command: { type: "speed", level: "F5" } }, speed: "classic" },
  { id: "speedSlow", label: "AHEAD SLOW (3)", key: "F7", customKey: "1", input: { type: "sim", command: { type: "speed", level: "F7" } }, speed: "classic" },
  { id: "allStop", label: "ALL STOP", key: "F9", simpleKey: "0", customKey: "0", input: { type: "sim", command: { type: "speed", level: "stop" } } },
  { id: "reverse", label: "REVERSE", key: "F10", simpleKey: "Backspace", customKey: "Backspace", input: { type: "sim", command: { type: "speed", level: "reverse" } } },
  { id: "periscopeToggle", label: "PERISCOPE UP / DOWN", key: "", customKey: "P", input: { type: "sim", command: { type: "periscope", direction: "toggle" } } },
  { id: "periscopeUp", label: "RAISE PERISCOPE", key: "F2", customKey: "", input: { type: "sim", command: { type: "periscope", direction: "raise" } } },
  { id: "periscopeDown", label: "LOWER PERISCOPE", key: "F4", customKey: "", input: { type: "sim", command: { type: "periscope", direction: "lower" } } },
  { id: "fire", label: "FIRE TORPEDO", key: "F8", customKey: " ", input: { type: "sim", command: { type: "fire" } } },
  { id: "radar", label: "RADAR", key: "F6", customKey: "G", input: { type: "screen", screen: "radar" } },
  { id: "rudderLeft", label: "RUDDER LEFT", key: "ArrowLeft", input: { type: "sim", command: { type: "rudder", direction: "left" } } },
  { id: "rudderRight", label: "RUDDER RIGHT", key: "ArrowRight", input: { type: "sim", command: { type: "rudder", direction: "right" } } },
  { id: "planesUp", label: "RISE (PLANES UP)", key: "ArrowUp", input: { type: "sim", command: { type: "planes", direction: "up" } } },
  { id: "planesDown", label: "DIVE (PLANES DOWN)", key: "ArrowDown", input: { type: "sim", command: { type: "planes", direction: "down" } } },
  { id: "neutral", label: "CENTRE RUDDER, PLANES", key: "5", customKey: "N", input: { type: "sim", command: { type: "neutral" } } },
  { id: "diesel", label: "DIESEL ENGINE", key: "D", input: { type: "sim", command: { type: "engine", mode: "diesel" } }, speed: "classic" },
  { id: "electric", label: "ELECTRIC MOTOR", key: "E", input: { type: "sim", command: { type: "engine", mode: "electric" } }, speed: "classic" },
  { id: "enginePower", label: "TOGGLE ENGINE POWER", key: "E", input: { type: "sim", command: { type: "engine", mode: "toggle" } }, speed: "simple" },
  { id: "scopeForward", label: "SCOPE FORWARD", key: "F", customKey: "I", input: { type: "sim", command: { type: "scope", facing: "F" } } },
  { id: "scopePort", label: "SCOPE PORT", key: "P", customKey: "J", input: { type: "sim", command: { type: "scope", facing: "P" } } },
  { id: "scopeAft", label: "SCOPE AFT", key: "A", customKey: "K", input: { type: "sim", command: { type: "scope", facing: "A" } } },
  { id: "scopeStarboard", label: "SCOPE STARBOARD", key: "S", customKey: "L", input: { type: "sim", command: { type: "scope", facing: "S" } } },
  { id: "doors", label: "TORPEDO DOORS", key: "T", input: { type: "sim", command: { type: "doors" } } },
  { id: "chart", label: "CHART", key: "C", input: { type: "screen", screen: "chart" } },
  { id: "quadrant", label: "QUADRANT MAP", key: "Q", input: { type: "screen", screen: "quadrant" } },
  { id: "log", label: "CAPTAIN'S LOG", key: "L", customKey: "B", input: { type: "screen", screen: "log" } },
  { id: "damage", label: "DAMAGE REPORT", key: "R", input: { type: "screen", screen: "damage" } },
  { id: "radioRoom", label: "RADIO ROOM", key: "M", input: { type: "radioRoom" } },
  { id: "gameControl", label: "GAME CONTROL", key: "Tab", input: { type: "screen", screen: "gameControl" }, locked: true },
  { id: "debug", label: "DEBUG PROMPT (CHART)", key: "Z", input: { type: "debugPrompt" } },
  { id: "trails", label: "WAKE TRAILS ON/OFF", key: "W", input: { type: "toggleTrails" } },
  { id: "help", label: "HELP", key: "?", input: { type: "help" } },
  { id: "helpAlt", label: "HELP (SECOND KEY)", key: "H", input: { type: "help" } },
  { id: "timeDown", label: "TIME SPEED DOWN", key: "[", input: { type: "timeScale", direction: "slower" } },
  { id: "timeUp", label: "TIME SPEED UP", key: "]", input: { type: "timeScale", direction: "faster" } },
  { id: "quit", label: "BACK TO THE MENU", key: "Escape", input: { type: "quit" }, locked: true },
  { id: "display", label: "DISPLAY MODE", key: "V", input: null },
];

/** The sections of the assignment screen, in the order (and with the titles) of the help pages; the list on screen follows this order. */
export const CONTROL_GROUPS: readonly { title: string; ids: readonly ControlId[] }[] = [
  { title: "SPEED AND ENGINES", ids: ["speedUp", "speedDown", "speedFlank", "speedFull", "speedStandard", "speedSlow", "allStop", "reverse", "diesel", "electric", "enginePower"] },
  { title: "STEERING", ids: ["rudderLeft", "rudderRight", "planesUp", "planesDown", "neutral"] },
  { title: "SCOPE AND WEAPONS", ids: ["periscopeToggle", "periscopeUp", "periscopeDown", "scopeForward", "scopePort", "scopeAft", "scopeStarboard", "doors", "fire"] },
  { title: "SCREENS", ids: ["chart", "quadrant", "radar", "log", "damage", "radioRoom", "gameControl", "debug"] },
  { title: "REMAKE EXTRAS", ids: ["trails", "timeDown", "timeUp", "display", "help", "helpAlt", "quit"] },
];

export const CONTROL_DEFS: readonly ControlDef[] = CONTROL_GROUPS.flatMap((g) => g.ids.map((id) => RAW_DEFS.find((d) => d.id === id) as ControlDef));

/** The group (section title) an action belongs to. */
export function controlGroup(id: ControlId): string {
  return CONTROL_GROUPS.find((g) => g.ids.includes(id))?.title ?? "";
}

/** Tab and Escape belong to their locked actions (GAME CONTROL, back to the menu) and to the screens' own use (leaving, cancelling). */
const LOCKED_KEYS: ReadonlySet<string> = new Set(CONTROL_DEFS.filter((d) => d.locked).map((d) => d.key));

/** Never assignable: Delete clears or cancels on the assignment screen. Modifier keys alone are not keys either. */
const UNASSIGNABLE = new Set(["Delete", "Shift", "Control", "Alt", "Meta", "AltGraph", "CapsLock", "NumLock", "ScrollLock", "Dead", "Unidentified", "Process"]);

/** The stored form of a key: letters in upper case, everything else as the browser names it. */
export function normalizeKey(key: string): string {
  return key.length === 1 ? key.toUpperCase() : key;
}

export function isAssignable(key: string): boolean {
  return key !== "" && !UNASSIGNABLE.has(key);
}

/** Short name of a key for the screens (at most 6 characters for the common ones). */
export function keyName(key: string): string {
  if (key === "") return "(NONE)";
  const names: Record<string, string> = {
    ArrowLeft: "LEFT",
    ArrowRight: "RIGHT",
    ArrowUp: "UP",
    ArrowDown: "DOWN",
    Escape: "ESC",
    " ": "SPACE",
    PageUp: "PGUP",
    PageDown: "PGDN",
    Backspace: "BKSP",
    Enter: "ENTER",
  };
  return names[key] ?? key.toUpperCase().slice(0, 8);
}

export function controlLabel(id: ControlId): string {
  return CONTROL_DEFS.find((d) => d.id === id)?.label ?? id;
}

export function isLocked(id: ControlId): boolean {
  return CONTROL_DEFS.find((d) => d.id === id)?.locked === true;
}

/** `locked`: the action, or the key asked for, is fixed (Tab, Escape). `conflict`: another action has the key. */
export type AssignResult = { ok: true } | { ok: false; conflict: ControlId } | { ok: false; locked: true };

export type KeyLayout = "original" | "custom";

/** Stored form: {@link STORAGE_VERSION} with the assignments under `keys` (the first release stored the assignments bare, without a version). */
const STORAGE_VERSION = 2;

/** The assignments (one key per action, possibly none); `onChange` is called after every change. */
export class Keymap {
  private keys = {} as Record<ControlId, string>;
  private simple: boolean;

  /**
   * `simple`: SIMPLE SPEED KEYS is in force, so the step up/down actions are used instead of the four stage keys. `layout` picks the
   * defaults: the original's keys (the default, also what the game uses with CUSTOM CONTROLS off) or the custom layout the player edits.
   */
  constructor(
    private readonly onChange: () => void = () => undefined,
    saved: string | null = null,
    simple = false,
    readonly layout: KeyLayout = "original",
  ) {
    this.simple = simple;
    this.resetKeys();
    if (saved) this.load(saved);
  }

  get simpleSpeed(): boolean {
    return this.simple;
  }

  /** The default key of an action under the given speed scheme and the layout of this keymap. */
  private defaultKey(d: ControlDef, simple = this.simple, layout: KeyLayout = this.layout): string {
    if (layout === "custom" && d.customKey !== undefined) return d.customKey;
    return simple && d.simpleKey !== undefined ? d.simpleKey : d.key;
  }

  /** Whether the action is in use: the speed actions of the other scheme are not (they are neither listed nor answer to their keys). */
  active(id: ControlId, simple = this.simple): boolean {
    const speed = CONTROL_DEFS.find((d) => d.id === id)?.speed;
    return speed === undefined || (speed === "simple") === simple;
  }

  /**
   * Switch between the stage keys and the step keys. ALL STOP and REVERSE move to their other default only while they still have the
   * old one (and the new key is free); an action that comes into use and finds its key taken by another is left without a key.
   */
  setSimpleSpeed(on: boolean): void {
    if (on === this.simple) return;
    const old = this.simple;
    for (const d of CONTROL_DEFS) {
      if (d.simpleKey === undefined || this.keys[d.id] !== this.defaultKey(d, old)) continue;
      const next = this.defaultKey(d, on);
      if (!CONTROL_DEFS.some((o) => o.id !== d.id && this.active(o.id, on) && this.keys[o.id] === next)) this.keys[d.id] = next;
    }
    this.simple = on;
    for (const d of CONTROL_DEFS) {
      if (this.active(d.id, old) || !this.active(d.id, on) || this.keys[d.id] === "") continue;
      if (CONTROL_DEFS.some((o) => o.id !== d.id && this.active(o.id, on) && this.active(o.id, old) && this.keys[o.id] === this.keys[d.id])) this.keys[d.id] = "";
    }
    this.onChange();
  }

  get(id: ControlId): string {
    return this.keys[id];
  }

  /** Which action in use has this key (the key is normalised first), if any. */
  idFor(key: string): ControlId | undefined {
    const k = normalizeKey(key);
    return CONTROL_DEFS.find((d) => this.active(d.id) && this.keys[d.id] === k)?.id;
  }

  /** The action other than `id` that already has `key`. */
  conflict(id: ControlId, key: string): ControlId | null {
    const other = this.idFor(key);
    return other && other !== id ? other : null;
  }

  /** Give `id` the key. With a conflict this changes nothing unless `override` is true, which blanks the other action's key. Locked actions and keys are refused. */
  assign(id: ControlId, key: string, override = false): AssignResult {
    const k = normalizeKey(key);
    if (isLocked(id) || LOCKED_KEYS.has(k)) return { ok: false, locked: true };
    if (!isAssignable(k)) return { ok: true };
    const other = this.conflict(id, k);
    if (other && !override) return { ok: false, conflict: other };
    if (other) this.keys[other] = "";
    this.keys[id] = k;
    this.onChange();
    return { ok: true };
  }

  clear(id: ControlId): void {
    if (isLocked(id) || this.keys[id] === "") return;
    this.keys[id] = "";
    this.onChange();
  }

  reset(): void {
    this.resetKeys();
    this.onChange();
  }

  /** The assignments as an object (a copy). */
  snapshot(): Record<ControlId, string> {
    return { ...this.keys };
  }

  serialize(): string {
    return JSON.stringify({ v: STORAGE_VERSION, keys: this.keys });
  }

  /** True while every assignment in use is the default. */
  get isDefault(): boolean {
    return CONTROL_DEFS.every((d) => !this.active(d.id) || this.keys[d.id] === this.defaultKey(d));
  }

  private resetKeys(): void {
    for (const d of CONTROL_DEFS) this.keys[d.id] = this.defaultKey(d);
  }

  /**
   * Reads stored assignments; unknown actions, non-strings and unusable keys are ignored, and a key given twice stays with the first action
   * in use. An unversioned value (first release, whose defaults were the original's keys) keeps only what differs from those defaults, so
   * the custom layout is not mistaken for the player's own choices.
   */
  private load(text: string): void {
    try {
      const parsed = JSON.parse(text) as Record<string, unknown>;
      const versioned = parsed.v === STORAGE_VERSION && typeof parsed.keys === "object" && parsed.keys !== null;
      const raw = (versioned ? parsed.keys : parsed) as Record<string, unknown>;
      const legacyDefault = (d: ControlDef): string[] => [d.key, d.simpleKey ?? d.key];
      const seen = new Set<string>();
      const loaded = {} as Record<ControlId, string>;
      for (const d of CONTROL_DEFS) {
        let v = raw[d.id];
        if (!versioned && this.layout === "custom" && typeof v === "string" && legacyDefault(d).includes(v)) v = undefined;
        let key = this.defaultKey(d);
        if (!d.locked && typeof v === "string" && (v === "" || (isAssignable(normalizeKey(v)) && !LOCKED_KEYS.has(normalizeKey(v))))) key = normalizeKey(v);
        if (this.active(d.id)) {
          if (key !== "" && seen.has(key)) key = "";
          if (key !== "") seen.add(key);
        }
        loaded[d.id] = key;
      }
      this.keys = loaded;
    } catch {
      // keep the defaults
    }
  }
}

/** The original's keys; what the game uses while CUSTOM CONTROLS is off. */
export const DEFAULT_KEYMAP = new Keymap();
