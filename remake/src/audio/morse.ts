import type { ToneEvent } from "./play.js";
import { parsePlay } from "./play.js";

/** The part of audio_tables.json -> morse that playback needs. */
export interface MorseTables {
  letters: Record<string, { pattern: string; play_strings: string[] }>;
  tone_subroutines: Record<string, { play_string: string; morse: string }>;
}

export interface MorseChar {
  char: string;
  /** Seconds from the start of the orders at which the character is printed. */
  printAt: number;
  /** Tone events (relative to `soundAt`); empty for characters that are not sounded. */
  tones: ToneEvent[];
  soundAt: number;
  duration: number;
}

export interface MorseScheduleOptions {
  /** GAME CONTROL [2] SOUND (ds:0x09e2). With sound off nothing is sounded. */
  soundOn: boolean;
  /** Pause per character for the original's empty FOR 1 TO 340 delay loop (its real length depended on the CPU). */
  charDelaySeconds?: number;
  /** The last character of each line is printed but not sounded in the original (0x0bda7). Default true. */
  skipLastCharOfLine?: boolean;
}

/**
 * Timeline of one order line, exactly as Gato1.exe 0x0bc00-0x0c610 plays it: each character is printed, then (letters A-Z; digits
 * 0-9 only when the sound setting is exactly 1) its dit/dah PLAY strings run in the foreground one after the other.
 * Everything else, including spaces, is silent.
 */
export function buildMorseSchedule(line: string, tables: MorseTables, options: MorseScheduleOptions, startAt = 0): MorseChar[] {
  const delay = options.charDelaySeconds ?? 0.03;
  const skipLast = options.skipLastCharOfLine ?? true;
  const out: MorseChar[] = [];
  let t = startAt;
  for (let i = 0; i < line.length; i += 1) {
    const char = line.charAt(i);
    const upper = char.toUpperCase();
    const entry = tables.letters[upper];
    const last = i === line.length - 1;
    let tones: ToneEvent[] = [];
    if (entry && options.soundOn && !(skipLast && last)) {
      for (const s of entry.play_strings) tones = tones.concat(parsePlay(s));
    }
    const duration = tones.reduce((a, e) => a + e.seconds, 0);
    out.push({ char, printAt: t, tones, soundAt: t, duration });
    t += delay + duration;
  }
  return out;
}

export function scheduleSeconds(chars: readonly MorseChar[], delay = 0.03): number {
  const last = chars.at(-1);
  return last ? last.printAt + last.duration + delay : 0;
}
