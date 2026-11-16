import { buildMorseSchedule, type MorseChar, type MorseScheduleOptions, type MorseTables } from "./morse.js";
import { parsePlay, type ToneEvent } from "./play.js";

/** One BIOS timer tick, the unit of BASIC's SOUND duration (18.2065 Hz). */
export const BIOS_TICK_SECONDS = 1 / 18.2065;

/** The subset of the Web Audio API the engine uses, so it can be driven by a fake in tests. */
export interface AudioContextLike {
  readonly currentTime: number;
  readonly destination: unknown;
  readonly state?: string;
  resume?(): Promise<void>;
  createOscillator(): OscillatorLike;
  createGain(): GainLike;
}
export interface OscillatorLike {
  type: string;
  frequency: { setValueAtTime(v: number, t: number): unknown; linearRampToValueAtTime?(v: number, t: number): unknown };
  connect(node: unknown): unknown;
  start(t?: number): void;
  stop(t?: number): void;
  disconnect?(): void;
}
export interface GainLike {
  gain: { setValueAtTime(v: number, t: number): unknown; linearRampToValueAtTime(v: number, t: number): unknown; cancelScheduledValues?(t: number): unknown };
  connect(node: unknown): unknown;
  disconnect?(): void;
}

export interface SoundStep {
  /** Hz; null = silence. */
  frequency: number | null;
  /** BASIC SOUND ticks (1/18.2 s). */
  ticks: number;
}

export type EffectName =
  | "engineSwitch"
  | "periscope"
  | "scopeSwitch"
  | "doors"
  | "torpedoLaunch"
  | "torpedoSpent"
  | "depthCharge"
  | "lowFuel"
  | "lowBattery"
  | "engineCutOut"
  | "damageAlarm"
  | "resupply"
  | "resupplyDone"
  | "explosion"
  | "subDestroyed"
  | "missionComplete"
  | "radioAlert";

export interface EffectDef {
  steps: SoundStep[];
  /** "original" = frequency and duration read from the SOUND statement; "inferred" = frequency read, duration/shape chosen; "remake" = not in the original. */
  provenance: "original" | "inferred" | "remake";
  source: string;
}

const sweep = (from: number, to: number, count: number, ticks: number): SoundStep[] =>
  Array.from({ length: count }, (_, i) => ({ frequency: Math.round(from + ((to - from) * i) / Math.max(count - 1, 1)), ticks }));

/**
 * Effects as SOUND statements of Gato1.exe (audio_tables.json -> sound_statement). Durations written `3 * soundOn` etc. in the code
 * are multiples of one tick; when the sound setting is off they are 0, which the engine reproduces by not playing at all.
 */
export const EFFECTS: Record<EffectName, EffectDef> = {
  engineSwitch: { steps: [{ frequency: 900, ticks: 3 }], provenance: "original", source: "SOUND 900, 3*snd at 0x05864 / 0x058ea (keys D, E)" },
  periscope: { steps: [{ frequency: 2500, ticks: 3 }], provenance: "original", source: "SOUND 2500, 3*snd at 0x056a6 (F2/F4)" },
  scopeSwitch: { steps: [{ frequency: 2500, ticks: 1 }], provenance: "original", source: "SOUND 2500, snd at 0x0593c (keys F, P, A, S)" },
  doors: { steps: [{ frequency: 3000, ticks: 1 }], provenance: "original", source: "SOUND 3000, snd at 0x07efb (key T)" },
  torpedoLaunch: { steps: [{ frequency: 600, ticks: 1 }], provenance: "original", source: "SOUND 600, snd at 0x0807d (F8)" },
  torpedoSpent: { steps: [{ frequency: 600, ticks: 4 }], provenance: "original", source: "SOUND 600, 4*snd at 0x0832c (torpedo reaches maximum range)" },
  depthCharge: {
    steps: [
      { frequency: 80, ticks: 2 },
      { frequency: 100, ticks: 8 },
      { frequency: 80, ticks: 4 },
    ],
    provenance: "original",
    source: "SOUND 80, 2*snd / 100, 8*snd / 80, 4*snd at 0x0d25c-0x0d286 (a depth charge damages a compartment)",
  },
  lowFuel: { steps: [{ frequency: 3500, ticks: 3 }], provenance: "original", source: "SOUND 3500, 3*snd at 0x05dd3 (fuel <= 9022, blinks)" },
  lowBattery: { steps: [{ frequency: 3000, ticks: 3 }], provenance: "original", source: "SOUND 3000, 3*snd at 0x05e57 (battery <= 100, blinks)" },
  engineCutOut: { steps: [{ frequency: 900, ticks: 3 }], provenance: "original", source: "SOUND 900, 3*snd at 0x05cd3 / 0x05d36" },
  damageAlarm: {
    steps: sweep(300, 470, 86, 0.1),
    provenance: "inferred",
    source: "SOUND 300..470 step 2 at 0x0655c; the duration operand is a variable that is never assigned, so the 0.1-tick step is a remake choice",
  },
  resupply: { steps: [{ frequency: 1200, ticks: 9 }], provenance: "original", source: "SOUND 1200, 9*snd at 0x0cd8f (refuelling)" },
  resupplyDone: { steps: [{ frequency: 1500, ticks: 9 }], provenance: "original", source: "SOUND 1500, 9*snd at 0x0cda6 / 0x0ce0c" },
  explosion: {
    steps: sweep(900, 80, 14, 0.8),
    provenance: "remake",
    source: "the original's torpedo-hit animation (0x086dd-0x09c24) has no SOUND statement; this descending sweep is a remake addition",
  },
  radioAlert: {
    steps: [
      { frequency: 1500, ticks: 1 },
      { frequency: 1200, ticks: 1 },
    ],
    provenance: "remake",
    source: "optional alert for radio messages (core/radio.ts); the original prints them silently",
  },
  subDestroyed: {
    steps: sweep(1400, 100, 40, 0.6),
    provenance: "inferred",
    source: "0x0b656 sweeps SOUND from 1400 upward in steps of 300 with a 0.05-tick duration; the shape here is a remake approximation",
  },
  missionComplete: {
    steps: [
      { frequency: 1200, ticks: 2 },
      { frequency: 1500, ticks: 2 },
      { frequency: 1200, ticks: 2 },
      { frequency: 1500, ticks: 6 },
    ],
    provenance: "inferred",
    source: "log count-up tones 1200 / 1500 Hz (0x0cda0-0x0ce76); the jingle order is a remake choice",
  },
};

export interface PlayHandle {
  /** Stop everything this handle scheduled. */
  cancel(): void;
  /** Seconds until the last scheduled tone ends, measured from creation. */
  readonly duration: number;
}

export interface MorseHandle extends PlayHandle {
  readonly schedule: readonly MorseChar[];
}

interface Voice {
  osc: OscillatorLike;
  gain: GainLike;
}

const VOLUME = 0.06;
const ATTACK = 0.002;

/** PC speaker emulation: a single square-wave voice per scheduled tone, no external libraries. */
export class SoundEngine {
  /** ds:0x09e2: false = sound off, nothing is played. */
  enabled = true;
  private ctx: AudioContextLike | null = null;
  private voices = new Set<Voice>();

  constructor(private readonly factory: () => AudioContextLike = defaultFactory) {}

  /** Create/resume the audio context; must be called from a user gesture in browsers. */
  async unlock(): Promise<void> {
    const ctx = this.context();
    if (ctx?.state === "suspended") await ctx.resume?.();
  }

  private context(): AudioContextLike | null {
    if (!this.ctx) {
      try {
        this.ctx = this.factory();
      } catch {
        return null;
      }
    }
    return this.ctx;
  }

  /** One square-wave tone starting `delay` seconds from now. */
  private tone(frequency: number, seconds: number, delay: number, voices: Voice[]): void {
    const ctx = this.context();
    if (!ctx || seconds <= 0) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "square";
    const start = ctx.currentTime + delay;
    const end = start + seconds;
    osc.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(VOLUME, start + Math.min(ATTACK, seconds / 2));
    gain.gain.setValueAtTime(VOLUME, Math.max(start, end - ATTACK));
    gain.gain.linearRampToValueAtTime(0, end);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(start);
    osc.stop(end + 0.01);
    const voice = { osc, gain };
    voices.push(voice);
    this.voices.add(voice);
  }

  private handle(voices: Voice[], duration: number): PlayHandle {
    return {
      duration,
      cancel: () => {
        for (const v of voices) {
          try {
            v.osc.stop(0);
            v.osc.disconnect?.();
            v.gain.disconnect?.();
          } catch {
            /* already stopped */
          }
          this.voices.delete(v);
        }
      },
    };
  }

  /** Play a list of tone/rest events back to back (a decoded PLAY string). */
  playEvents(events: readonly ToneEvent[], delay = 0): PlayHandle {
    const voices: Voice[] = [];
    if (!this.enabled) return this.handle(voices, 0);
    let t = delay;
    for (const e of events) {
      if (e.frequency !== null) this.tone(e.frequency, e.seconds, t, voices);
      t += e.seconds;
    }
    return this.handle(voices, t - delay);
  }

  /** BASIC PLAY. */
  play(source: string): PlayHandle {
    return this.playEvents(parsePlay(source));
  }

  /** BASIC SOUND frequency, ticks (1 tick = 1/18.2 s). Frequencies below 37 Hz mean "stop" in the original. */
  sound(frequency: number, ticks: number): PlayHandle {
    if (frequency < 37 || ticks <= 0) return this.handle([], 0);
    return this.playEvents([{ frequency, seconds: ticks * BIOS_TICK_SECONDS }]);
  }

  effect(name: EffectName): PlayHandle {
    const def = EFFECTS[name];
    return this.playEvents(effectEvents(def.steps));
  }

  /**
   * The orders text in Morse. Returns the schedule so the screen can print each character at `printAt`; `cancel()` stops the
   * sound (any key press does that in the original, 0x0bcc4-0x0bd97: SOUND 37,0 and the rest of the orders is skipped).
   */
  playMorse(lines: readonly string[], tables: MorseTables, options: Partial<MorseScheduleOptions> = {}): MorseHandle {
    const opts: MorseScheduleOptions = { soundOn: this.enabled, ...options };
    const schedule: MorseChar[] = [];
    let t = 0;
    for (const line of lines) {
      const chars = buildMorseSchedule(line, tables, opts, t);
      schedule.push(...chars);
      const last = chars.at(-1);
      t = last ? last.printAt + last.duration + (opts.charDelaySeconds ?? 0.03) : t;
    }
    const voices: Voice[] = [];
    if (this.enabled) {
      for (const c of schedule) {
        let at = c.soundAt;
        for (const e of c.tones) {
          if (e.frequency !== null) this.tone(e.frequency, e.seconds, at, voices);
          at += e.seconds;
        }
      }
    }
    return { ...this.handle(voices, t), schedule };
  }

  stopAll(): void {
    this.handle([...this.voices], 0).cancel();
  }
}

export function effectEvents(steps: readonly SoundStep[]): ToneEvent[] {
  return steps.map((s) => ({ frequency: s.frequency, seconds: s.ticks * BIOS_TICK_SECONDS }));
}

function defaultFactory(): AudioContextLike {
  const Ctor = (globalThis as { AudioContext?: new () => AudioContextLike; webkitAudioContext?: new () => AudioContextLike }).AudioContext ??
    (globalThis as { webkitAudioContext?: new () => AudioContextLike }).webkitAudioContext;
  if (!Ctor) throw new Error("Web Audio is not available");
  return new Ctor();
}
