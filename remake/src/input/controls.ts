import type { InputAction } from "./keyboard.js";

/**
 * Key assignments for the mission screens. The default assignments are the original's (GATO1.EXE's key dispatcher, see keyboard.ts) plus the
 * remake's own keys; with CUSTOM CONTROLS switched on (ADVANCED OPTIONS) the player can give each action another key. One key per action:
 * an action can also have no key at all. Typing in prompts, GAME CONTROL, the menus and the demo keep their fixed keys.
 */
export type ControlId =
  | "speedFlank"
  | "speedFull"
  | "speedStandard"
  | "speedSlow"
  | "allStop"
  | "reverse"
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
  /** The key of the original (or, for the remake's own actions, of the remake). */
  key: string;
  /** What the key does in a mission; null for the actions the page itself handles (display mode). */
  input: InputAction | null;
  /** Fixed: the key cannot be changed, cleared or taken over by another action. */
  locked?: true;
}

const RAW_DEFS: readonly ControlDef[] = [
  { id: "speedFlank", label: "AHEAD FLANK (10)", key: "F1", input: { type: "sim", command: { type: "speed", level: "F1" } } },
  { id: "speedFull", label: "AHEAD FULL (8)", key: "F3", input: { type: "sim", command: { type: "speed", level: "F3" } } },
  { id: "speedStandard", label: "AHEAD STANDARD (6)", key: "F5", input: { type: "sim", command: { type: "speed", level: "F5" } } },
  { id: "speedSlow", label: "AHEAD SLOW (3)", key: "F7", input: { type: "sim", command: { type: "speed", level: "F7" } } },
  { id: "allStop", label: "ALL STOP", key: "F9", input: { type: "sim", command: { type: "speed", level: "stop" } } },
  { id: "reverse", label: "REVERSE", key: "F10", input: { type: "sim", command: { type: "speed", level: "reverse" } } },
  { id: "periscopeUp", label: "RAISE PERISCOPE", key: "F2", input: { type: "sim", command: { type: "periscope", direction: "raise" } } },
  { id: "periscopeDown", label: "LOWER PERISCOPE", key: "F4", input: { type: "sim", command: { type: "periscope", direction: "lower" } } },
  { id: "fire", label: "FIRE TORPEDO", key: "F8", input: { type: "sim", command: { type: "fire" } } },
  { id: "radar", label: "RADAR", key: "F6", input: { type: "screen", screen: "radar" } },
  { id: "rudderLeft", label: "RUDDER LEFT", key: "ArrowLeft", input: { type: "sim", command: { type: "rudder", direction: "left" } } },
  { id: "rudderRight", label: "RUDDER RIGHT", key: "ArrowRight", input: { type: "sim", command: { type: "rudder", direction: "right" } } },
  { id: "planesUp", label: "RISE (PLANES UP)", key: "ArrowUp", input: { type: "sim", command: { type: "planes", direction: "up" } } },
  { id: "planesDown", label: "DIVE (PLANES DOWN)", key: "ArrowDown", input: { type: "sim", command: { type: "planes", direction: "down" } } },
  { id: "neutral", label: "CENTRE RUDDER, PLANES", key: "5", input: { type: "sim", command: { type: "neutral" } } },
  { id: "diesel", label: "DIESEL ENGINE", key: "D", input: { type: "sim", command: { type: "engine", mode: "diesel" } } },
  { id: "electric", label: "ELECTRIC MOTOR", key: "E", input: { type: "sim", command: { type: "engine", mode: "electric" } } },
  { id: "scopeForward", label: "SCOPE FORWARD", key: "F", input: { type: "sim", command: { type: "scope", facing: "F" } } },
  { id: "scopePort", label: "SCOPE PORT", key: "P", input: { type: "sim", command: { type: "scope", facing: "P" } } },
  { id: "scopeAft", label: "SCOPE AFT", key: "A", input: { type: "sim", command: { type: "scope", facing: "A" } } },
  { id: "scopeStarboard", label: "SCOPE STARBOARD", key: "S", input: { type: "sim", command: { type: "scope", facing: "S" } } },
  { id: "doors", label: "TORPEDO DOORS", key: "T", input: { type: "sim", command: { type: "doors" } } },
  { id: "chart", label: "CHART", key: "C", input: { type: "screen", screen: "chart" } },
  { id: "quadrant", label: "QUADRANT MAP", key: "Q", input: { type: "screen", screen: "quadrant" } },
  { id: "log", label: "CAPTAIN'S LOG", key: "L", input: { type: "screen", screen: "log" } },
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
  { title: "SPEED AND ENGINES", ids: ["speedFlank", "speedFull", "speedStandard", "speedSlow", "allStop", "reverse", "diesel", "electric"] },
  { title: "STEERING", ids: ["rudderLeft", "rudderRight", "planesUp", "planesDown", "neutral"] },
  { title: "SCOPE AND WEAPONS", ids: ["periscopeUp", "periscopeDown", "scopeForward", "scopePort", "scopeAft", "scopeStarboard", "doors", "fire"] },
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

/** The assignments (one key per action, possibly none); `onChange` is called after every change. */
export class Keymap {
  private keys = {} as Record<ControlId, string>;

  constructor(
    private readonly onChange: () => void = () => undefined,
    saved: string | null = null,
  ) {
    this.resetKeys();
    if (saved) this.load(saved);
  }

  get(id: ControlId): string {
    return this.keys[id];
  }

  /** Which action has this key (the key is normalised first), if any. */
  idFor(key: string): ControlId | undefined {
    const k = normalizeKey(key);
    return CONTROL_DEFS.find((d) => this.keys[d.id] === k)?.id;
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
    return JSON.stringify(this.keys);
  }

  /** True while every assignment is the default. */
  get isDefault(): boolean {
    return CONTROL_DEFS.every((d) => this.keys[d.id] === d.key);
  }

  private resetKeys(): void {
    for (const d of CONTROL_DEFS) this.keys[d.id] = d.key;
  }

  /** Reads stored assignments; unknown actions, non-strings and unusable keys are ignored, and a key given twice stays with the first action. */
  private load(text: string): void {
    try {
      const raw = JSON.parse(text) as Record<string, unknown>;
      const seen = new Set<string>();
      const loaded = {} as Record<ControlId, string>;
      for (const d of CONTROL_DEFS) {
        const v = raw[d.id];
        let key = d.key;
        if (!d.locked && typeof v === "string" && (v === "" || (isAssignable(normalizeKey(v)) && !LOCKED_KEYS.has(normalizeKey(v))))) key = normalizeKey(v);
        if (key !== "" && seen.has(key)) key = "";
        if (key !== "") seen.add(key);
        loaded[d.id] = key;
      }
      this.keys = loaded;
    } catch {
      // keep the defaults
    }
  }
}

export const DEFAULT_KEYMAP = new Keymap();
