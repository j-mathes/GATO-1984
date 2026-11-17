import { GAME_CONTROL, TIME_COMPRESSION, type TimeScale } from "./constants.js";
import type { TimeOfDay } from "./types.js";

/**
 * Launcher (GATO.EXE) and the GAME CONTROL screen (inside GATO1.EXE).
 *
 * GATO.EXE shows a title and the four-item menu below, reads an item number, and CHAINs: DEMO (2), HISTORY (3), end
 * (4), otherwise GATO1 - "[1] NORMAL PLAY (DEFAULT)" is the default, so any other input starts the game
 * (exe_architecture.md section 4.3, compare constants 2.0/3.0/4.0). There is no COMMON block, temp file or command line:
 * nothing is handed over. GATO1 starts from its own defaults (sound on, time of day = day, difficulty 0) and exposes
 * difficulty, sound and time of day in its own GAME CONTROL screen, reproduced by {@link GameControl}.
 */

export type LauncherTarget = "simulation" | "demo" | "history" | "exit" | "advanced";

export interface LauncherItem {
  number: 1 | 2 | 3 | 4 | 5;
  label: string;
  target: LauncherTarget;
  /** Original executable chained to ("-" for the remake's own item 5). */
  program: "GATO1" | "DEMO" | "HISTORY" | "END" | "-";
}

/** Items 1-4 are GATO.EXE's; item 5 (ADVANCED OPTIONS) is a remake addition that opens the settings screen. */
export const LAUNCHER_MENU: readonly LauncherItem[] = [
  { number: 1, label: "NORMAL PLAY  (DEFAULT)", target: "simulation", program: "GATO1" },
  { number: 2, label: "DEMONSTRATION", target: "demo", program: "DEMO" },
  { number: 3, label: "HISTORY AND SPECIFICATIONS", target: "history", program: "HISTORY" },
  { number: 4, label: "EXIT", target: "exit", program: "END" },
  { number: 5, label: "ADVANCED OPTIONS", target: "advanced", program: "-" },
];

export const LAUNCHER_PROMPT = ["PLEASE ENTER AN ITEM NUMBER", "FROM THE MENU ABOVE:"] as const;
export const TITLE_LINES = ["CLASS  SUBMARINE", "by Paul Arlton and Ed Dawson", " C Copyright 1984 by", "Spectrum HoloByte, Inc."] as const;

export type LauncherState = { screen: "title" } | { screen: "menu" } | { screen: "done"; target: LauncherTarget };

/** What GATO1 starts with (Gato1.exe 0x03ae1, 0x0429d and the unset difficulty variable): nothing is passed from the launcher. */
export interface GameSettings {
  difficulty: number;
  sound: boolean;
  timeOfDay: TimeOfDay;
  /** Remake addition: scenario 1..20 to play next, or null/absent for the original's random pick (1 + FIX(RND*20)). */
  mission?: number | null;
  /** Remake addition: time compression, absent = 1x (the 1984 pace of 2.5 steps per second). */
  timeScale?: TimeScale;
}

export const DEFAULT_SETTINGS: Readonly<GameSettings> = { difficulty: 0, sound: true, timeOfDay: 1, mission: null, timeScale: 1 };

export class Launcher {
  private state: LauncherState = { screen: "title" };

  get current(): LauncherState {
    return this.state;
  }

  /** Any key leaves the title (the exact trigger of the original was not decoded). */
  pressAnyKey(): LauncherState {
    if (this.state.screen === "title") this.state = { screen: "menu" };
    return this.state;
  }

  /** Item number typed at the prompt. Anything that is not 2, 3 or 4 selects normal play. */
  choose(input: string): LauncherState {
    if (this.state.screen === "title") this.pressAnyKey();
    if (this.state.screen !== "menu") return this.state;
    const n = Number.parseFloat(input.trim());
    const item = LAUNCHER_MENU.find((m) => m.number === n);
    const target: LauncherTarget = item && item.number !== 1 ? item.target : "simulation";
    this.state = { screen: "done", target };
    return this.state;
  }

  /** DEMO and HISTORY chain back to GATO, which shows the menu again; GATO1 and EXIT end the session. */
  returnFrom(target: LauncherTarget): LauncherState {
    this.state = target === "demo" || target === "history" || target === "advanced" ? { screen: "menu" } : { screen: "done", target };
    return this.state;
  }
}

export type GameControlItem = 1 | 2 | 3 | 4 | 5 | 6;

/**
 * GAME CONTROL screen of GATO1 (0x0aeea-0x0b165):
 * [1] DIFFICULTY LEVEL, typed value clamped to 0..9; [2] SOUND toggles 1/0; [3] TIME OF DAY toggles 1/0;
 * [4] RESET CAPTAIN'S LOG. Any other input (or RETURN) leaves the screen.
 * [5] MISSION SELECT is a remake addition: 1..20 picks the next scenario, 0 (or anything else) goes back to the original's random pick.
 * [6] TIME COMPRESSION is a remake addition: cycles 1x, 2x, 4x (2.5, 5, 10 steps per second).
 */
export class GameControl {
  constructor(
    public settings: GameSettings = { ...DEFAULT_SETTINGS },
    private readonly resetLog: () => void = () => undefined,
  ) {}

  /** Apply the item the player typed; `value` is only used for items 1 and 5. Returns false when the input closes the screen. */
  apply(item: number, value = 0): boolean {
    switch (item) {
      case 1:
        this.settings.difficulty = Math.min(Math.max(value, GAME_CONTROL.minDifficulty), GAME_CONTROL.maxDifficulty);
        return true;
      case 2:
        this.settings.sound = !this.settings.sound;
        return true;
      case 3:
        this.settings.timeOfDay = this.settings.timeOfDay === 1 ? 0 : 1;
        return true;
      case 4:
        this.resetLog();
        return true;
      case 5: {
        const n = Math.round(value);
        this.settings.mission = n >= GAME_CONTROL.minMission && n <= GAME_CONTROL.maxMission ? n : null;
        return true;
      }
      case 6: {
        const scales: readonly TimeScale[] = TIME_COMPRESSION.scales;
        const at = scales.indexOf(this.settings.timeScale ?? 1);
        this.settings.timeScale = scales[(at + 1) % scales.length] as TimeScale;
        return true;
      }
      default:
        return false;
    }
  }
}
