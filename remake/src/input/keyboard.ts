import type { SimCommand } from "../core/index.js";
import { CONTROL_DEFS, DEFAULT_KEYMAP, type Keymap } from "./controls.js";

/** Screens reachable while a mission runs (the keys of the dispatcher at Gato1.exe 0x0d0c0 plus F6). */
export type PlayScreen = "control" | "radar" | "chart" | "quadrant" | "log" | "damage" | "gameControl";

export type InputAction =
  | { type: "sim"; command: SimCommand }
  | { type: "screen"; screen: PlayScreen }
  /** M: radio room (0x0d13c -> 0x0ba3d): reports heavy damage, or (remake) re-reads the orders, then returns to the control room. */
  | { type: "radioRoom" }
  /** W: persistent track dots on the radar, chart and quadrant map (the original's behaviour) or clean redraws. */
  | { type: "toggleTrails" }
  /** U: puts the data tag on the next ship of the radar, chart or map, nearest first, then on none (enhanced graphics, SHIP NAV SYMBOLS; remake addition). */
  | { type: "navSelect" }
  /** O: how far ahead the ships' velocity vectors look, 3, 6 or 12 minutes (enhanced graphics, SHIP NAV SYMBOLS; remake addition). */
  | { type: "navVector" }
  /** [ and ]: slower / faster time compression (1x = 2.5 steps per second, 2x, 4x); remake addition. */
  | { type: "timeScale"; direction: "slower" | "faster" }
  /** ? or H: controls quick-reference overlay (remake addition). */
  | { type: "help" }
  /** Z on the chart: PASSWORD? prompt of the hidden coordinate command (0x0b4d4). */
  | { type: "debugPrompt" }
  /** ESC: the original ends the program (rt_1049 + rt_19da at 0x0d17e); the remake returns to the launcher. */
  | { type: "quit" };

export interface KeyLike {
  key: string;
  code?: string;
  ctrlKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
}

/**
 * Key bindings of GATO1. Function keys and cursor keys are BASIC ON KEY handlers (0x050b2-0x0514e, KEY(1..14));
 * letters are INKEY$ tests in the main loop (0x0581c-0x05b47) and in the screen dispatcher (0x0d0c1-0x0d19e).
 *
 *   F1/F3/F5/F7  ordered speed 10/8/6/3 (x engine factor)       F9 all stop      F10 reverse
 *   F2/F4        raise/lower periscope (depth <= 45)             F6 radar         F8 fire torpedo
 *   Left/Right   rudder +0.005 / -0.005                          Up/Down          rise / dive
 *   5 (keypad)   rudder and planes to neutral                    T                torpedo doors
 *   D / E        diesel / electric                               F P A S          scope facing
 *   C / Q / L / R / M   chart, quadrant map, captain's log, damage report, radio room (then the control room)
 *   Tab          GAME CONTROL                                    Z (on chart)     hidden coordinate command
 *   W            track dots on radar, chart and quadrant map on/off
 *   U / O        tag the next ship / how far ahead the ship vectors look (enhanced graphics with SHIP NAV SYMBOLS; remake addition)
 *   ? or H       controls quick-reference overlay (remake addition; pauses the world while shown)
 *   [ / ]        time compression 1x / 2x / 4x (2.5 / 5 / 10 simulation steps per second; remake addition)
 * The table lives in controls.ts (CONTROL_DEFS): these are the original's keys. With CUSTOM CONTROLS on, the player's own Keymap, which starts from
 * a separate custom layout for modern keyboards, replaces them.
 */
export function translatePlayKey(e: KeyLike, keymap: Keymap = DEFAULT_KEYMAP): InputAction | null {
  if (e.ctrlKey || e.altKey || e.metaKey) return null;
  const id = keymap.idFor(e.code === "Numpad5" ? "5" : e.key);
  return (id && CONTROL_DEFS.find((d) => d.id === id)?.input) || null;
}

/**
 * A key press that means something to the player (a letter, the space bar, Enter, an arrow...) as opposed to a modifier, a lock key, a
 * browser shortcut or a function key the page does not use; only these take the player back from another screen to the control room.
 */
export function isPlainKey(e: KeyLike): boolean {
  if (e.ctrlKey || e.altKey || e.metaKey) return false;
  if (/^(Shift|Control|Alt|Meta|AltGraph|CapsLock|NumLock|ScrollLock|ContextMenu|Dead|Unidentified|Process|Fn|FnLock|OS|Hyper|Super|Symbol|SymbolLock)$/.test(e.key)) return false;
  return !/^F([1-9]|1\d|2[0-4])$/.test(e.key);
}

/** Keys the page must not handle itself (scrolling, focus change, browser function keys). */
export function shouldPreventDefault(e: KeyLike): boolean {
  if (e.ctrlKey || e.altKey || e.metaKey) return false;
  return /^F([1-9]|10)$/.test(e.key) || e.key.startsWith("Arrow") || e.key === "PageUp" || e.key === "PageDown" || e.key === "Home" || e.key === "End" || e.key === "Tab" || e.key === " " || e.key === "Backspace";
}

/** GAME CONTROL screen (0x0aeea-0x0b165): item number typed at "NUMBER OF ITEM TO CHANGE", then an optional value. */
export type GameControlAction =
  | { type: "item"; item: 1 | 2 | 3 | 4 | 5 | 6 | 7 }
  | { type: "leave" };

export function translateGameControlKey(e: KeyLike): GameControlAction | null {
  if (/^[1-7]$/.test(e.key)) return { type: "item", item: Number(e.key) as 1 | 2 | 3 | 4 | 5 | 6 | 7 };
  if (e.key === "Enter" || e.key === "Escape" || e.key === "Tab") return { type: "leave" };
  return null;
}

/** A single line of typed input (the BASIC INPUT statement used by the prompts). */
export class LineEditor {
  value = "";

  constructor(readonly maxLength = 24) {}

  /** Returns "enter" / "escape" when the line is finished, otherwise null. */
  handle(e: KeyLike): "enter" | "escape" | null {
    if (e.key === "Enter") return "enter";
    if (e.key === "Escape") return "escape";
    if (e.key === "Backspace") this.value = this.value.slice(0, -1);
    else if (e.key.length === 1 && this.value.length < this.maxLength && !e.ctrlKey && !e.altKey && !e.metaKey) this.value += e.key;
    return null;
  }
}

/** Parse "x,y" (INPUT with two numeric items). Returns null for anything else. */
export function parseCoordinates(text: string): { x: number; y: number } | null {
  const parts = text.split(/[,\s]+/).filter((p) => p !== "");
  if (parts.length !== 2) return null;
  const x = Number(parts[0]);
  const y = Number(parts[1]);
  return Number.isFinite(x) && Number.isFinite(y) ? { x, y } : null;
}

/** The hidden command's password (Gato1.exe 0x0b51a compares the input with 'PAED'). */
export const DEBUG_PASSWORD = "PAED";

export interface KeyboardHandle {
  detach(): void;
}

/** Attach a keydown listener; `handler` receives every key, and default browser behaviour is suppressed for game keys. */
export function attachKeyboard(target: Pick<EventTarget, "addEventListener" | "removeEventListener">, handler: (e: KeyboardEvent) => void): KeyboardHandle {
  const listener = (ev: Event): void => {
    const e = ev as KeyboardEvent;
    if (e.repeat && !/^Arrow/.test(e.key)) return;
    if (shouldPreventDefault(e)) e.preventDefault();
    handler(e);
  };
  target.addEventListener("keydown", listener);
  return { detach: () => target.removeEventListener("keydown", listener) };
}
