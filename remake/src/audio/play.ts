/**
 * PLAY string parser for the PC-speaker synthesiser.
 *
 * Timing follows the IBM BASIC rule recorded in audio_tables.json (`play_duration_rule`): a note of length L at tempo T lasts
 * 240/(T*L) seconds, a dot adds half again, defaults are T120, L4, O4. The runtime's staccato/legato handling (MN/ML/MS) was not
 * decoded, so the whole note length sounds and the articulation prefix is only recorded, not applied.
 */

export interface ToneEvent {
  /** Hz, or null for a rest. */
  frequency: number | null;
  seconds: number;
}

const SEMITONE: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

/** Equal temperament, A4 = 440 Hz; octave 4 starts at middle C (so B4 = 493.88 Hz). */
export function noteFrequency(note: string, octave: number): number {
  const letter = note.charAt(0).toUpperCase();
  let n = SEMITONE[letter];
  if (n === undefined) throw new Error(`bad note ${note}`);
  for (const c of note.slice(1)) {
    if (c === "#" || c === "+") n += 1;
    else if (c === "-") n -= 1;
  }
  return 440 * 2 ** ((n + 12 * octave - (9 + 12 * 4)) / 12);
}

export interface PlayState {
  tempo: number;
  length: number;
  octave: number;
}

export function defaultPlayState(): PlayState {
  return { tempo: 120, length: 4, octave: 4 };
}

const TOKEN = /\s*(?:M([BFLNS])|T(\d+)|O(\d+)|L(\d+)|([<>])|N(\d+)|P(\d+)(\.*)|([A-G])([#+-]?)(\d*)(\.*))/giy;

export function parsePlay(source: string, state: PlayState = defaultPlayState()): ToneEvent[] {
  const events: ToneEvent[] = [];
  TOKEN.lastIndex = 0;
  let pos = 0;
  const dotted = (seconds: number, dots: string): number => {
    let total = seconds;
    let add = seconds;
    for (let i = 0; i < dots.length; i += 1) {
      add /= 2;
      total += add;
    }
    return total;
  };
  const len = (n: number): number => 240 / (state.tempo * n);
  while (pos < source.length) {
    TOKEN.lastIndex = pos;
    const m = TOKEN.exec(source);
    if (!m || m.index !== pos) {
      if (source.slice(pos).trim() === "") break;
      throw new Error(`unsupported PLAY syntax at ${pos}: ${source.slice(pos)}`);
    }
    pos = TOKEN.lastIndex;
    if (m[2]) state.tempo = Math.min(Math.max(Number(m[2]), 32), 255);
    else if (m[3]) state.octave = Math.min(Number(m[3]), 6);
    else if (m[4]) state.length = Math.min(Math.max(Number(m[4]), 1), 64);
    else if (m[5]) state.octave = Math.min(Math.max(state.octave + (m[5] === ">" ? 1 : -1), 0), 6);
    else if (m[6]) {
      const n = Number(m[6]);
      if (n === 0) events.push({ frequency: null, seconds: len(state.length) });
      else events.push({ frequency: 440 * 2 ** ((n - 1 - 57) / 12), seconds: len(state.length) }); // N1 = C0
    } else if (m[7]) events.push({ frequency: null, seconds: dotted(len(Number(m[7])), m[8] ?? "") });
    else if (m[9]) {
      const l = m[11] ? Number(m[11]) : state.length;
      events.push({ frequency: noteFrequency(m[9] + (m[10] ?? ""), state.octave), seconds: dotted(len(l), m[12] ?? "") });
    }
  }
  return events;
}

export function totalSeconds(events: readonly ToneEvent[]): number {
  return events.reduce((a, e) => a + e.seconds, 0);
}
