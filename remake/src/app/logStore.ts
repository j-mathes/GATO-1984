import type { ShipLogDocument, SimEvent } from "../core/index.js";

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

interface Persisted {
  sunk: Record<string, string>; // record number -> date sunk
  missions: number;
}

export interface LogEntry {
  record: number;
  name: string;
  tonnage: number;
  dateSunk: string;
}

const KEY = "gato.captains-log.v1";

/**
 * The captain's log (the original keeps it in the file LOG1, Gato1.exe 0x09983-0x09c24): which ship records have been sunk, when,
 * and how many missions were completed. Persisted in localStorage; "[4] RESET CAPTAIN'S LOG" clears it.
 */
export class LogStore {
  private data: Persisted = { sunk: {}, missions: 0 };

  constructor(
    private readonly base: ShipLogDocument,
    private readonly storage: StorageLike | null = null,
  ) {
    try {
      const raw = storage?.getItem(KEY);
      if (raw) this.data = JSON.parse(raw) as Persisted;
    } catch {
      this.data = { sunk: {}, missions: 0 };
    }
  }

  /** Document with the sunk flags and dates applied, for a new Simulation. */
  document(): ShipLogDocument {
    return {
      ...this.base,
      records: this.base.records.map((r) => {
        const date = this.data.sunk[String(r.record)];
        return date ? { ...r, sunk_flag: 1, date_sunk: date } : { ...r };
      }),
    };
  }

  entries(): LogEntry[] {
    return this.base.records
      .filter((r) => this.data.sunk[String(r.record)] !== undefined)
      .map((r) => ({ record: r.record, name: r.name, tonnage: r.tonnage, dateSunk: this.data.sunk[String(r.record)] ?? "" }));
  }

  get shipsSunk(): number {
    return this.entries().length;
  }

  get totalTonnage(): number {
    return this.entries().reduce((a, e) => a + e.tonnage, 0);
  }

  get missionsCompleted(): number {
    return this.data.missions;
  }

  /** Apply the log-relevant events of a simulation step. */
  apply(events: readonly SimEvent[], date: string): void {
    let changed = false;
    for (const e of events) {
      if (e.type === "shipSunk" && e.record) {
        this.data.sunk[String(e.record.record)] = date;
        changed = true;
      } else if (e.type === "missionComplete") {
        this.data.missions += 1;
        changed = true;
      }
    }
    if (changed) this.save();
  }

  reset(): void {
    this.data = { sunk: {}, missions: 0 };
    this.save();
  }

  private save(): void {
    try {
      this.storage?.setItem(KEY, JSON.stringify(this.data));
    } catch {
      /* storage full or blocked: the log just does not persist */
    }
  }
}
