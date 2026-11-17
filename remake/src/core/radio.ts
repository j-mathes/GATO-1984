import { COMPARTMENT } from "./constants.js";
import { EXPLOSION_TIMING } from "./explosion.js";
import type { SubmarineState } from "./types.js";

/**
 * Messages GATO1.EXE shows while a mission runs. This is the complete set: the program contains no table of mid-mission radio
 * traffic (no sighting reports, convoy updates, fuel/battery warnings or periodic transmissions). Fuel, battery and engine
 * warnings are SOUND tones only (see EFFECTS in audio/soundEngine.ts). The orders themselves come from the ORDXX files.
 *
 * Every message is a PRINT at a LOCATE cell, optionally over a filled black box, held by an empty FOR loop of a fixed number of passes
 * (`holdPasses`, exact). The seconds are an estimate (see EXPLOSION_TIMING.loopPassSeconds).
 */
export type RadioMessageId = "contactMade" | "missionCompleted" | "convoyDestroyed" | "oxygenExhausted" | "radioDamaged";

export interface RadioLine {
  /** 1-based LOCATE row/column on the 40x25 grid. */
  row: number;
  col: number;
  text: string;
}

export interface RadioBox {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

export interface RadioMessage {
  id: RadioMessageId;
  lines: readonly RadioLine[];
  /** Black BF box drawn first (colour 0); a message with `continues` is printed into the box of the previous one. */
  box?: RadioBox;
  continues?: RadioMessageId;
  /** Passes of the empty hold loop after printing. */
  holdPasses: number;
  trigger: string;
  source: string;
}

export const RADIO_MESSAGES: Readonly<Record<RadioMessageId, RadioMessage>> = {
  contactMade: {
    id: "contactMade",
    box: { x0: 10, y0: 10, x1: 309, y1: 60 },
    lines: [{ row: 3, col: 14, text: "CONTACT MADE" }],
    holdPasses: 25000,
    trigger: "boat stopped (ds:0x2196 = 0) in the objective quadrant (ds:0x2246) at the required time of day (ds:0x2242), within 200 of the island's inner radius",
    source: "Gato1.exe program 0x07046-0x07094",
  },
  missionCompleted: {
    id: "missionCompleted",
    continues: "contactMade",
    lines: [{ row: 4, col: 12, text: "MISSION COMPLETED" }],
    holdPasses: 10000,
    trigger: "follows CONTACT MADE; the original then sets ds:0x2246 = 1, writes the LOG1 record and keeps playing",
    source: "Gato1.exe program 0x070a9-0x070f4",
  },
  convoyDestroyed: {
    id: "convoyDestroyed",
    box: { x0: 10, y0: 10, x1: 309, y1: 60 },
    lines: [
      { row: 4, col: 10, text: "YOU HAVE SUCCESSFULLY" },
      { row: 6, col: 9, text: "COMPLETED YOUR MISSION" },
    ],
    holdPasses: 19000,
    trigger: "every convoy slot 3..ds:0x226a is sunk (ds:0x2252 < 0), once (ds:0x226e)",
    source: "Gato1.exe program 0x07dc5-0x07e47",
  },
  oxygenExhausted: {
    id: "oxygenExhausted",
    lines: [{ row: 4, col: 13, text: " No more oxygen " }],
    holdPasses: 19000,
    trigger: "oxygen (ds:0x21a2) below 110; the boat is then lost",
    source: "Gato1.exe program 0x072fb-0x07346",
  },
  radioDamaged: {
    id: "radioDamaged",
    box: { x0: 0, y0: 0, x1: 319, y1: 65 },
    lines: [
      { row: 4, col: 14, text: "RADIO ROOM" },
      { row: 5, col: 9, text: "REPORTS HEAVY DAMAGE" },
      { row: 6, col: 6, text: "NO MESSAGES MAY BE RECEIVED" },
    ],
    holdPasses: 10000,
    trigger: "key M (radio room request) while the radio room (compartment 1, A177a[1] = ds:0x177e) is damaged",
    source: "Gato1.exe program 0x0ba3d-0x0badf",
  },
};

export function holdSeconds(message: RadioMessage): number {
  return message.holdPasses * EXPLOSION_TIMING.loopPassSeconds;
}

/** ds:0x177e > 0: the radio room cannot send or receive. */
export function radioRoomDamaged(sub: Pick<SubmarineState, "damage">): boolean {
  return (sub.damage[COMPARTMENT.radioRoom] ?? 0) > 0;
}

/** Message produced by the radio-room key (M): the damage report, or null when the radio works. */
export function radioRoomReport(sub: Pick<SubmarineState, "damage">): RadioMessage | null {
  return radioRoomDamaged(sub) ? RADIO_MESSAGES.radioDamaged : null;
}

export interface RadioView {
  message: RadioMessage;
  box: RadioBox | undefined;
  /** Lines on screen: those of earlier messages of the same box plus the current one. */
  lines: readonly RadioLine[];
  /** Seconds since the message appeared. */
  elapsed: number;
  /** The message stays until the player presses a key (the last one of its box); an earlier one is followed by its continuation after its hold time. */
  waitingForKey: boolean;
}

/**
 * Queue of radio messages shown one after another. A message that another one continues in the same box (CONTACT MADE, then MISSION COMPLETED)
 * is replaced by it after its hold time, like the original's delay loop; the last message of a box stays until {@link RadioInbox.dismiss}
 * (a key press). The original holds every message with an empty FOR loop and blocks the game meanwhile; waiting for a key is a remake choice.
 */
export class RadioInbox {
  private queue: RadioMessage[] = [];
  private shown: RadioMessage | null = null;
  private previous: RadioMessage | null = null;
  private elapsed = 0;
  /** Every message ever pushed, oldest first. */
  readonly history: RadioMessageId[] = [];

  push(id: RadioMessageId): void {
    this.history.push(id);
    this.queue.push(RADIO_MESSAGES[id]);
    if (!this.shown) this.next();
  }

  get pending(): number {
    return this.queue.length + (this.shown ? 1 : 0);
  }

  /** True while a message is on screen that only a key press removes. */
  get waitingForKey(): boolean {
    const m = this.shown;
    return !!m && this.queue[0]?.continues !== m.id;
  }

  get current(): RadioView | null {
    const m = this.shown;
    if (!m) return null;
    const earlier = m.continues && this.previous?.id === m.continues ? this.previous.lines : [];
    const box = m.box ?? (m.continues && this.previous?.id === m.continues ? this.previous.box : undefined);
    return { message: m, box, lines: [...earlier, ...m.lines], elapsed: this.elapsed, waitingForKey: this.waitingForKey };
  }

  /** Time passes: a message that is continued in its box gives way after its hold time; the others wait for a key. */
  advance(seconds: number): void {
    if (!this.shown || seconds <= 0) return;
    this.elapsed += seconds;
    while (this.shown && !this.waitingForKey && this.elapsed >= holdSeconds(this.shown)) {
      this.elapsed -= holdSeconds(this.shown);
      this.previous = this.shown;
      this.next();
    }
  }

  /** A key press: removes the message on screen if it waits for one (the next queued message, if any, appears). Returns whether it did. */
  dismiss(): boolean {
    if (!this.shown || !this.waitingForKey) return false;
    this.previous = this.shown;
    this.next();
    return true;
  }

  clear(): void {
    this.queue = [];
    this.shown = null;
    this.previous = null;
    this.elapsed = 0;
  }

  private next(): void {
    const m = this.queue.shift();
    if (m) {
      this.shown = m;
      this.elapsed = 0;
    } else {
      this.shown = null;
    }
  }
}
